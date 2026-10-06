// Public ownership token for IndexNow's root text-file verification.
export const INDEXNOW_KEY='sst-20261006-8b91dc65ee8f490dafce058913ceb62f';
export const INDEXNOW_PATH='/'+INDEXNOW_KEY+'.txt';
const ORIGIN='https://shiftsometimber.co.uk';
export function discoveryRoute(request){
 const u=new URL(request.url);if(u.origin!==ORIGIN||u.pathname!==INDEXNOW_PATH||!['GET','HEAD'].includes(request.method))return null;
 return new Response(request.method==='HEAD'?null:INDEXNOW_KEY,{headers:{'Content-Type':'text/plain; charset=utf-8','Content-Length':String(INDEXNOW_KEY.length),'Cache-Control':'public, max-age=3600','X-Robots-Tag':'noindex','X-Shift-Discovery-SEO':'2026-10-06'}});
}
export function repairDiscoveryTxt(text){
 return text.replace(/^- https:\/\/shiftsometimber\.co\.uk\/treatment-order\r?\n/gm,'');
}
export async function withDiscoverySeo(response,request){
 const u=new URL(request.url);
 if(u.origin!==ORIGIN||u.pathname!=='/llms.txt'||request.method!=='GET'||response.status!==200||!response.headers.get('Content-Type')?.includes('text/plain'))return response;
 const before=await response.text(),after=repairDiscoveryTxt(before),headers=new Headers(response.headers);
 if(after!==before){for(const name of ['Content-Length','ETag','Content-MD5','Digest'])headers.delete(name);headers.set('X-Shift-Discovery-SEO','2026-10-06');}
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}
