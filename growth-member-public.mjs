// Release adapter for the exact copy reviewed on 27 September. The shared
// transformer remains byte-identical to the preview; no Pages source is replaced.
import {improvePublicCopy} from './preview/growth-member/public-copy.mjs';
export async function withGrowthPublicCopy(request,response){
 const url=new URL(request.url);
 if(request.method!=='GET'||response.status!==200||!['/programme','/help'].includes(url.pathname)||!(response.headers.get('content-type')||'').includes('text/html'))return response;
 const before=await response.text();let after;
 try{after=improvePublicCopy(before,url.pathname)}catch{after=before}
 const headers=new Headers(response.headers);
 if(after!==before){for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(key);headers.set('X-Shift-Growth-Copy','20260927');}
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}
