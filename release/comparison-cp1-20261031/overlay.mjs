import original from './original.mjs';
export * from './original.mjs';
import {release,transformHTML} from './layout.mjs';
import css from './styles.mjs';
export default {...original,async fetch(request,env,ctx){
 const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'')||'/';
 const response=await original.fetch(request,env,ctx);
 if(!['GET','HEAD'].includes(request.method)||path!=='/compare-weight-loss-treatments'||response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const headers=new Headers(response.headers);headers.set('X-Shift-Comparison-Design',release);
 if(request.method==='HEAD')return new Response(null,{status:response.status,headers});
 const html=transformHTML(await response.text(),css);
 for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified','Content-MD5','Digest'])headers.delete(key);
 headers.set('Cache-Control','no-store');
 return new Response(html,{status:response.status,statusText:response.statusText,headers});
}};
