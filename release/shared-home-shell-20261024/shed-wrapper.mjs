import original from "./shed-original/timber-shed-member-test-entry.js";
import {applyHomeShell} from "./server-component.mjs";
export function wrap(worker){return {...worker,async fetch(request,env,ctx){
 const response=await worker.fetch(request,env,ctx);
 const path=new URL(request.url).pathname;
 if(request.method!=='GET'||!/^\/(?:member\/)?timber-shed(?:\/|\.html)?$/.test(path)||!response.ok||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
 const html=applyHomeShell(await response.text()),headers=new Headers(response.headers);
 for(const name of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(name);
 headers.set('X-Shift-Home-Shell','homepage-master-20261024');
 return new Response(html,{status:response.status,statusText:response.statusText,headers});
}}}
export default wrap(original);
