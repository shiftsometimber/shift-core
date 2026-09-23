// Explicit opt-in only. A stale secret never activates a licensed provider.
export const idealEnabled=env=>env?.MEMBER_ADDRESS_PROVIDER==='ideal-postcodes'&&typeof env.MEMBER_ADDRESS_API_KEY==='string'&&/^[A-Za-z0-9_-]{1,160}$/.test(env.MEMBER_ADDRESS_API_KEY);
const error=(code,status=503)=>Object.assign(Error(code),{code,status});
const pc=v=>typeof v==='string'?v.replace(/\s/g,'').toUpperCase():'';
const clean=(v,max)=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u001f\u007f<>]/.test(v)?v.trim():null;
export function mapIdealAddresses(body,postcode){
 if(body?.code===4040)return {ok:true,addresses:[],source:'Ideal Postcodes',needsReview:true,mayHaveMore:false};
 if(body?.code!==2000||!Array.isArray(body.result)||body.result.length>100)throw error('invalid_provider_response');
 const addresses=[];
 for(const a of body.result){
  if(!a||pc(a.postcode)!==pc(postcode))throw error('invalid_provider_response');
  const address1=clean(a.line_1,120),line2=clean(a.line_2??'',120),line3=clean(a.line_3??'',120),town=clean(a.post_town,100),county=clean(a.county??'',100);
  if(!address1||!town||line2===null||line3===null||county===null)throw error('invalid_provider_response');
  const address2=[line2,line3].filter(Boolean).join(', ');if(address2.length>120)throw error('invalid_provider_response');
  const p=pc(postcode),formatted=p.slice(0,-3)+' '+p.slice(-3);
  addresses.push({address1,address2,town,county,postcode:formatted,label:[address1,address2,town,formatted].filter(Boolean).join(', ')});
 }
 return {ok:true,addresses,source:'Ideal Postcodes',needsReview:true,mayHaveMore:body.result.length===100};
}
async function readResponse(r){
 if(!r.ok&&r.status!==404){await r.body?.cancel();throw error(r.status===429?'provider_throttled':'provider_unavailable');}
 if(Number(r.headers.get('Content-Length')||0)>200000){await r.body?.cancel();throw error('provider_too_large');}
 const reader=r.body?.getReader();if(!reader)throw error('invalid_provider_response');
 let size=0;const chunks=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>200000)throw error('provider_too_large');chunks.push(value);}}
 catch(e){await reader.cancel().catch(()=>{});throw e;}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 let body;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw error('invalid_provider_response');}
 if(r.status===404&&body?.code!==4040)throw error('provider_unavailable');
 return body;
}
// Conservative per-isolate pilot limits; set the provider's own daily quota too.
// No query persistence, cached addresses, retries, or automatic provider fallback.
export function createIdealSearch({transport=fetch,now=Date.now}={}){
 const members=new Map();let pending=false,nextAt=0,blockedUntil=0,windowAt=0,requests=0;
 return async(input,userId,env)=>{
  if(!idealEnabled(env))throw error('address_lookup_unavailable');
  const postcode=pc(input.postcode);if(!/^(?:GIR0AA|[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2})$/.test(postcode))throw error('invalid_postcode',400);
  const time=now();let member=members.get(userId);if(!member||time-member.start>=60000)member={start:time,n:0};
  if(++member.n>8)throw error('slow_down',429);members.set(userId,member);if(members.size>256)members.delete(members.keys().next().value);
  if(time-windowAt>=3600000){windowAt=time;requests=0;}
  if(pending||time<nextAt||time<blockedUntil||requests>=60)throw error('lookup_busy',429);
  pending=true;nextAt=time+1800;requests++;
  try{
   const url=new URL('https://api.ideal-postcodes.co.uk/v1/postcodes/'+postcode);
   url.searchParams.set('filter','line_1,line_2,line_3,post_town,county,postcode');
   const r=await transport(url.href,{method:'GET',headers:{Accept:'application/json',Authorization:'api_key="'+env.MEMBER_ADDRESS_API_KEY+'"'},credentials:'omit',redirect:'manual',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(6000)});
   return mapIdealAddresses(await readResponse(r),postcode);
  }catch(e){blockedUntil=now()+60000;throw e;}finally{pending=false;}
 };
}
