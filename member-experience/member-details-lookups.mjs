import {gpFormRuntime} from './gp-form.mjs';
import {authenticateMember} from '../member-state-fast-v1.js';
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
export async function memberDetailsLookupRoute(request,env){
 const u=new URL(request.url),path=u.pathname.replace(/\/+$/,'');
 if(path==='/assets/member-experience/gp-form.mjs'&&['GET','HEAD'].includes(request.method))return new Response(request.method==='HEAD'?null:gpFormRuntime,{headers:{...headers,'Content-Type':'text/javascript; charset=utf-8'}});
 // Retired endpoint: old tabs cannot call a provider, even with stale flags/keys.
 if(path==='/v1/member/details/address-search'){
  if(request.method!=='POST')return json({error:'method_not_allowed'},405);
  if(request.headers.get('Origin')!==u.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'origin_not_allowed'},403);
  let auth;try{auth=await authenticateMember(request,env);}catch{return json({error:'account_unavailable'},503);}if(auth.response)return auth.response;
  return json({error:'address_lookup_removed',message:'Enter your address manually and save your details.'},410);
 }
 if(path!=='/v1/member/details/gp-search')return null;
 if(request.method!=='GET')return json({error:'method_not_allowed'},405);
 if(request.headers.get('Sec-Fetch-Site')==='cross-site'||(request.headers.get('Origin')&&request.headers.get('Origin')!==u.origin))return json({error:'origin_not_allowed'},403);
 let auth;try{auth=await authenticateMember(request,env);}catch{return json({error:'account_unavailable'},503);}if(auth.response)return auth.response;
 if(rateLimited(auth.userId))return json({error:'slow_down',message:'Please wait a moment before searching again. Manual entry is always available.'},429);
 const query=String(u.searchParams.get('q')||'').trim();if(query.length<3||query.length>80||/[\u0000-\u001f]/.test(query))return json({error:'invalid_search',message:'Enter at least three characters of your GP practice name.'},400);
 if(env.MEMBER_GP_LOOKUP_ENABLED!=='true')return json({error:'gp_lookup_unavailable',message:'GP suggestions are unavailable here. Enter your practice manually.'},503);
 const key=query.toLowerCase(),cached=gpCache.get(key);if(cached&&cached.until>Date.now())return json(cached.value);
 if(busy>=2)return json({error:'gp_lookup_busy',message:'The practice search is busy. Try again or enter your GP manually.'},503);
 busy++;
 try{const value=await searchGpPractices(query);gpCache.set(key,{until:Date.now()+300000,value});if(gpCache.size>200)gpCache.delete(gpCache.keys().next().value);return json(value);}catch{return json({error:'gp_lookup_unavailable',message:'The NHS practice directory could not be reached. Your details are still editable; enter your GP manually.'},503);}finally{busy--;}
}
