import {gpFormRuntime} from './gp-form.mjs';
import {authenticateMember} from '../member-state-fast-v1.js';
import {normalisePostcode} from './member-details-routes.mjs';
const headers={'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow'};
const json=(body,status=200)=>Response.json(body,{status,headers});
const GP_BASE='https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations';
// Per-isolate backpressure, a bounded in-memory public-directory cache, and UI
// debounce keep this small lookup from becoming a public unbounded proxy.
const recent=new Map(),gpCache=new Map();let busy=0;
function rateLimited(userId){const now=Date.now(),last=recent.get(userId)||0;recent.set(userId,now);if(recent.size>1000)recent.delete(recent.keys().next().value);return now-last<600;}
async function boundedJSON(url,init={},transport=fetch,allowNotFound=false){
 const r=await transport(url,{...init,redirect:'manual',signal:AbortSignal.timeout(6000)});
 if(!r.ok&&!(allowNotFound&&r.status===404))throw Error('provider_unavailable');
 const max=200000,length=Number(r.headers.get('Content-Length')||0);
 if(length>max){await r.body?.cancel();throw Error('provider_too_large');}
 if(!r.body)throw Error('provider_empty');
 const reader=r.body.getReader();let size=0;const chunks=[];
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>max)throw Error('provider_too_large');chunks.push(value);}}
 catch(e){await reader.cancel().catch(()=>{});throw e;}finally{reader.releaseLock();}
 const joined=new Uint8Array(size);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.byteLength;}
 const body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(joined));
 if(r.status===404&&body.code!==4040)throw Error('provider_unavailable');
 return body;
}
export async function searchGpPractices(query,transport=fetch){
 const url=new URL(GP_BASE);url.searchParams.set('Name',query);url.searchParams.set('Status','Active');url.searchParams.set('PrimaryRoleId','RO177');url.searchParams.set('NonPrimaryRoleId','RO76');url.searchParams.set('Limit','12');url.searchParams.set('_format','json');
 const body=await boundedJSON(url.href,{headers:{Accept:'application/json'}},transport);
 if(!Array.isArray(body.Organisations))throw Error('invalid_gp_directory');
 const practices=body.Organisations.filter(x=>x.Status==='Active'&&x.PrimaryRoleId==='RO177'&&/^[A-Z0-9]{3,12}$/.test(x.OrgId||'')&&typeof x.Name==='string'&&typeof x.PostCode==='string').slice(0,12).map(x=>({name:x.Name.slice(0,160),code:x.OrgId,postcode:x.PostCode.slice(0,12)}));
 return {practices,source:'NHS Organisation Data Service',coverage:'England and Wales',checkedAt:new Date().toISOString()};
}
export async function searchPostcode(postcode,key,transport=fetch){
 if(!key)return null;
 // Full licensed address results only. A postcode centroid is not a street address.
 const url='https://api.ideal-postcodes.co.uk/v1/postcodes/'+encodeURIComponent(postcode);
 const body=await boundedJSON(url,{headers:{Accept:'application/json',Authorization:'api_key="'+key+'"'}},transport,true);
 if(body.code===4040)return {addresses:[]};
 if(body.code!==2000||!Array.isArray(body.result))throw Error('address_unavailable');
 return {addresses:body.result.slice(0,100).filter(a=>typeof a.line_1==='string'&&typeof a.post_town==='string'&&typeof a.postcode==='string').map(a=>({address1:a.line_1.slice(0,120),address2:[a.line_2,a.line_3].filter(Boolean).join(', ').slice(0,120),town:a.post_town.slice(0,100),county:String(a.county||'').slice(0,100),postcode:a.postcode.slice(0,12),label:[a.line_1,a.line_2,a.line_3,a.post_town,a.postcode].filter(Boolean).join(', ')})),source:'Ideal Postcodes',limitedToFirst100:true,mayHaveMore:body.result.length>=100};
}
export async function memberDetailsLookupRoute(request,env){
 const u=new URL(request.url),path=u.pathname.replace(/\/+$/,'');
 if(path==='/assets/member-experience/gp-form.mjs'&&['GET','HEAD'].includes(request.method))return new Response(request.method==='HEAD'?null:gpFormRuntime,{headers:{...headers,'Content-Type':'text/javascript; charset=utf-8'}});
 if(!['/v1/member/details/gp-search','/v1/member/details/address-search'].includes(path))return null;
 if(request.method!=='GET')return json({error:'method_not_allowed'},405);
 if(request.headers.get('Sec-Fetch-Site')==='cross-site'||(request.headers.get('Origin')&&request.headers.get('Origin')!==u.origin))return json({error:'origin_not_allowed'},403);
 let auth;try{auth=await authenticateMember(request,env);}catch{return json({error:'account_unavailable'},503);}if(auth.response)return auth.response;
 if(rateLimited(auth.userId))return json({error:'slow_down',message:'Please wait a moment before searching again. Manual entry is always available.'},429);
 if(path.endsWith('address-search')){
  const postcode=normalisePostcode(String(u.searchParams.get('postcode')||'').trim());if(!/^(?:GIR 0AA|[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2})$/.test(postcode))return json({error:'invalid_postcode',message:'Enter a valid UK postcode.'},400);
  if(!env.MEMBER_ADDRESS_API_KEY)return json({error:'address_lookup_not_configured',message:'Address lookup is not connected yet. Enter your full address below; you can still save it.'},503);
  try{return json(await searchPostcode(postcode,env.MEMBER_ADDRESS_API_KEY));}catch{return json({error:'lookup_unavailable',message:'Address lookup is unavailable. You can enter and save your address manually.'},503);}
 }
 const query=String(u.searchParams.get('q')||'').trim();if(query.length<3||query.length>80||/[\u0000-\u001f]/.test(query))return json({error:'invalid_search',message:'Enter at least three characters of your GP practice name.'},400);
 if(env.MEMBER_GP_LOOKUP_ENABLED!=='true')return json({error:'gp_lookup_unavailable',message:'GP suggestions are unavailable here. Enter your practice manually.'},503);
 const key=query.toLowerCase(),cached=gpCache.get(key);if(cached&&cached.until>Date.now())return json(cached.value);
 if(busy>=2)return json({error:'gp_lookup_busy',message:'The practice search is busy. Try again or enter your GP manually.'},503);
 busy++;
 try{const value=await searchGpPractices(query);gpCache.set(key,{until:Date.now()+300000,value});if(gpCache.size>200)gpCache.delete(gpCache.keys().next().value);return json(value);}catch{return json({error:'gp_lookup_unavailable',message:'The NHS practice directory could not be reached. Your details are still editable; enter your GP manually.'},503);}finally{busy--;}
}
