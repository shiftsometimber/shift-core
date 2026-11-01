// Only guarded member utility documents receive the same app-first presentation.
// All APIs, writes, public pages, cron methods and named exports stay with the
// current serving owner. No authentication, account or commerce data is changed.
import {withShopNavigation} from './shop-navigation.mjs';
const utility=/^\/member\/(?:settings|orders|saved|plans|my-shift|my-target|my-why|achievements|check-in|treatment|timber-circle)\/?$/;
async function guardedDocument(response){
 const reader=response.clone().body?.getReader();if(!reader)return false;let size=0;const parts=[];
 try{for(;;){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1048576){void reader.cancel().catch(()=>{});return false;}parts.push(value);}const bytes=new Uint8Array(size);let at=0;for(const part of parts){bytes.set(part,at);at+=part.length;}const html=new TextDecoder().decode(bytes),body=html.match(/<body\b[^>]*>/i)?.[0]||'';return /\bdata-member-session\s*=/.test(body);}
 finally{reader.releaseLock();}
}
export function wrapMemberFirstPaintUtilities(original){return{
 ...original,
 async fetch(request,env,ctx){
  const response=await original.fetch(request,env,ctx);
  if(request.method!=='GET'||env.MEMBER_EXPERIENCE_V1_ENABLED!=='true'||!utility.test(new URL(request.url).pathname)||!response.ok||!response.headers.get('Content-Type')?.includes('text/html'))return response;
  if(!await guardedDocument(response))return response;
  return withShopNavigation(request,response,env);
 }
};}
