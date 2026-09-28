import {withAppLayout} from './app-layout-live.mjs';
// Release adapter for the exact copy reviewed on 27 September. The shared
// transformer remains byte-identical to the preview; no Pages source is replaced.
import {improveContinuityArrival} from './preview/growth-member/continuity-journey.mjs';
import {improvePublicCopy} from './preview/growth-member/public-copy.mjs';
async function originalGrowthPublicCopy(request,response){
 const url=new URL(request.url);
 if(request.method!=='GET'||response.status!==200||!['/programme','/help','/mens-mental-health','/clinic-gone-quiet','/provider-switch','/member/dashboard'].includes(url.pathname)||!(response.headers.get('content-type')||'').includes('text/html'))return response;
 const before=await response.text();let after;
 try{after=improveContinuityArrival(improvePublicCopy(before,url.pathname),request.url)}catch{after=before}
 const headers=new Headers(response.headers);
 if(after!==before){for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(key);headers.set('X-Shift-Growth-Copy','20260928');}
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}

export async function withGrowthPublicCopy(request,response){return withAppLayout(request,await originalGrowthPublicCopy(request,response));}
