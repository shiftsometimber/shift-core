// Optional, no-key Photon/OpenStreetMap address suggestions. Never postal validation.
import {authenticateMember} from '../member-state-fast-v1.js';
export const photonEnabled=env=>env?.MEMBER_ADDRESS_PROVIDER==='photon';
const H={'Cache-Control':'no-store, private','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','Vary':'Cookie'};
const json=(b,status=200)=>new Response(JSON.stringify(b),{status,headers:H});
const fail=(code,message,status=400)=>json({ok:false,error:code,message},status);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const pc=v=>String(v||'').replace(/\s/g,'').toUpperCase();
const postcodeOK=v=>/^(?:GIR0AA|[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2})$/.test(v);
const error=(code,status=503)=>Object.assign(Error(code),{code,status});
function text(value,max){if(typeof value!=='string'||value.length>max||/[\u0000-\u001f\u007f<>]/.test(value))return '';return value.trim();}
export function validatePhotonInput(body){
 if(!object(body)||Object.keys(body).some(k=>!['postcode','query'].includes(k))||typeof body.postcode!=='string'||body.postcode.length>12||typeof body.query!=='string'||body.query.length>100||/[\u0000-\u001f\u007f<>@]/.test(body.postcode+body.query)||/:\/\//.test(body.query))throw error('invalid_search',400);
 const postcode=pc(body.postcode);if(!postcodeOK(postcode))throw error('invalid_postcode',400);
 return {postcode:postcode.slice(0,-3)+' '+postcode.slice(-3),query:body.query.trim().replace(/\s+/g,' ')};
}
export function mapPhotonAddresses(body,postcode){
 if(!object(body)||!Array.isArray(body.features)||body.features.length>100)throw error('invalid_provider_response');
 const seen=new Set(),addresses=[];
 for(const feature of body.features.slice(0,24)){
  const p=feature?.properties;if(!object(p)||String(p.countrycode).toUpperCase()!=='GB'||pc(p.postcode)!==pc(postcode)||typeof p.postcode!=='string')continue;
  const street=text(p.street,120),house=text(p.housenumber,30),name=text(p.name,100),town=text(p.city,100)||text(p.town,100)||text(p.village,100);
  // A postcode centroid/street/place is NOT an address. Never invent a missing house.
  if(!street||!town||!(house||(p.type==='house'&&name&&name!==street)))continue;
  const address1=house?house+' '+street:name+', '+street;if(address1.length>120)continue;
  const normalized=pc(p.postcode),a={address1,address2:'',town,county:text(p.county,100),postcode:normalized.slice(0,-3)+' '+normalized.slice(-3)};
  const key=(a.address1+'|'+a.town+'|'+a.postcode).toLowerCase();if(seen.has(key))continue;seen.add(key);
  addresses.push({...a,label:[a.address1,a.town,a.postcode].join(', ')});
 }
 return {ok:true,addresses:addresses.slice(0,12),source:'Photon / OpenStreetMap',attribution:'© OpenStreetMap contributors',licence:'ODbL',attributionUrl:'https://www.openstreetmap.org/copyright',complete:false,postalValidation:false,needsReview:true};
}
export async function boundedPhotonJSON(response){
 if(!response.ok){await response.body?.cancel();throw error(response.status===429?'provider_throttled':'provider_unavailable');}
 if(Number(response.headers.get('Content-Length')||0)>80000){await response.body?.cancel();throw error('provider_too_large');}
 if(!response.body)throw error('provider_empty');const reader=response.body.getReader(),chunks=[];let size=0;
 try{for(;;){const r=await reader.read();if(r.done)break;size+=r.value.byteLength;if(size>80000)throw error('provider_too_large');chunks.push(r.value);}}
 catch(e){await reader.cancel().catch(()=>{});throw e;}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw error('invalid_provider_response');}
}
// Conservative PILOT guard: per-isolate (not a claimed fleet-wide quota), bounded
// caches, no polling/retry, and an outage circuit-breaker. No persistent query log.
export function createPhotonSearch({transport=fetch,now=Date.now}={}){
 const cache=new Map(),members=new Map();let pending=false,nextAt=0,blockedUntil=0,windowAt=0,requests=0;
 return async (input,userId)=>{
  const {postcode,query}=validatePhotonInput(input),time=now();
  let member=members.get(userId);if(!member||time-member.start>=60000)member={start:time,n:0};
  if(++member.n>8)throw error('slow_down',429);members.set(userId,member);if(members.size>256)members.delete(members.keys().next().value);
  const key=(postcode+'|'+query).toLowerCase(),cached=cache.get(key);
  if(cached&&cached.until>time)return structuredClone(cached.value);
  if(time-windowAt>=3600000){windowAt=time;requests=0;}
  if(pending||time<nextAt||time<blockedUntil||requests>=60)throw error('lookup_busy',429);
  pending=true;nextAt=time+1800;requests++;
  try{
   const url=new URL('https://photon.komoot.io/api/');url.search=new URLSearchParams({q:[query,postcode].filter(Boolean).join(' '),countrycode:'GB',lang:'en',limit:'12'});
   const r=await transport(url.href,{method:'GET',headers:{Accept:'application/json','User-Agent':'ShiftSomeTimber-address-preview/1.0 (https://shiftsometimber.co.uk)'},redirect:'manual',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(6000)});
   const value=mapPhotonAddresses(await boundedPhotonJSON(r),postcode);cache.set(key,{until:time+300000,value});if(cache.size>128)cache.delete(cache.keys().next().value);return structuredClone(value);
  }catch(e){blockedUntil=now()+(e.code==='provider_throttled'?60000:30000);throw e;}finally{pending=false;}
 };
}
const search=createPhotonSearch();
async function readBody(request){
 const reader=request.body?.getReader();if(!reader)throw error('invalid_search',400);let size=0;const chunks=[];
 try{for(;;){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>1024)throw error('too_large',413);chunks.push(r.value);}}
 catch(e){await reader.cancel().catch(()=>{});throw e;}finally{reader.releaseLock();}
 const b=new Uint8Array(size);let offset=0;for(const c of chunks){b.set(c,offset);offset+=c.length;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));}catch{throw error('invalid_search',400);}
}
export async function photonAddressRoute(request,env){
 const url=new URL(request.url);if(url.pathname.replace(/\/+$/,'')!=='/v1/member/details/address-search')return null;
 if(request.method!=='POST')return fail('method_not_allowed','Reload Member Details to use address suggestions. Manual entry still works.',405);
 if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return fail('origin_not_allowed','Use the address search on this website.',403);
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return fail('json_required','Send JSON address-search fields.',415);
 try{
  const auth=await authenticateMember(request,env);if(auth.response)return new Response(auth.response.body,{status:auth.response.status,headers:H});
  if(!photonEnabled(env))return fail('address_lookup_unavailable','Address suggestions are unavailable. Enter and save your address manually.',503);
  const input=validatePhotonInput(await readBody(request));return json(await search(input,auth.userId));
 }catch(e){
  if(e.code==='invalid_postcode')return fail(e.code,'Enter a complete UK postcode, or use manual address entry.');
  if(e.code==='invalid_search')return fail(e.code,'Use only a postcode and optional building or street search. Do not enter email or personal notes.');
  if(e.status===413)return fail('too_large','The search is too long. Enter the address manually.',413);
  if(e.status===429)return fail(e.code,'Address search is busy. Wait a moment or enter your address manually.',429);
  return fail('lookup_unavailable','Address suggestions are temporarily unavailable. You can still enter and save the address manually.',503);
 }
}
