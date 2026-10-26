// Keep the deployed app/chrome prefix intact. Only replace our owned recovery
// suffix, so independent presentation repairs are retained by this release.
import {sixPageRecoveryRuntime} from './six-page-recovery.mjs';
const marker='/* My Timber six-page presentation recovery. No fabricated member data. */';
export async function withSupportLayout(request,response){
 if(request.method!=='GET'||new URL(request.url).pathname!=='/assets/my-timber-layout.mjs'||!response.ok)return response;
 const contentType=response.headers.get('Content-Type')||'';
 if(!/(?:javascript|ecmascript)/i.test(contentType))return response;
 const text=await response.clone().text(),index=text.indexOf(marker);
 if(index<0||text.indexOf(marker,index+marker.length)!==-1)return response;
 const suffix=sixPageRecoveryRuntime,start=suffix.indexOf(marker);
 if(start<0)throw new Error('Support layout recovery marker is missing');
 const next=text.slice(0,index)+suffix.slice(start);
 if(next===text)return response;
 const headers=new Headers(response.headers);
 for(const name of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(name);
 headers.set('Cache-Control','no-store');headers.set('X-My-Timber-Support','v6');
 return new Response(next,{status:response.status,statusText:response.statusText,headers});
}
