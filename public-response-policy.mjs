import {publicHttpsRedirect} from './public-https-redirect.mjs';
import {PUBLIC_HEADERS} from './babylove/response-policy.mjs';

const ORIGIN='https://shiftsometimber.co.uk';
const protectedPath=/^\/(?:member|v1|api|hq|admin|work|auth|checkout|treatment-order|my-timber|my-treatment|my-journey|account)(?:\/|$|-|\.)/;
const sensitiveVary=/(?:^|,)\s*(?:cookie|authorization|\*)\s*(?:,|$)/i;

// Restore the existing public policy after every content adapter.
// Keep stronger/already explicit headers and all private response boundaries.
export function withPublicResponsePolicy(response,request){
 const url=new URL(request.url);
 if(url.origin!==ORIGIN || !['GET','HEAD'].includes(request.method) || response.status!==200 ||
    response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase()!=='text/html' ||
    protectedPath.test(url.pathname) || request.headers.has('Authorization') ||
    response.headers.has('Set-Cookie') || /\bprivate\b/i.test(response.headers.get('Cache-Control')||'') ||
    sensitiveVary.test(response.headers.get('Vary')||''))return response;
 const headers=new Headers(response.headers);let changed=false;
 for(const [name,value] of Object.entries(PUBLIC_HEADERS)){
  if(!headers.has(name)){headers.set(name,value);changed=true;}
 }
 return changed?new Response(response.body,{status:response.status,statusText:response.statusText,headers}):response;
}

export function withPublicResponsePolicyWorker(worker){
 return {...worker,async fetch(request,env,ctx){
  const redirect=publicHttpsRedirect(request);if(redirect)return redirect;
  return withPublicResponsePolicy(await worker.fetch(request,env,ctx),request);
 }};
}
