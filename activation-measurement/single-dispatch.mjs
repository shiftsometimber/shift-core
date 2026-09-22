// NEXT-AN-01: the captured, unmodified Pages helper sends every custom event
// through dataLayer AND gtag. The existing GTM event tag already owns dispatch.
// Recognise only that exact source revision; preserve every other byte and hook.
export const legacyHelperSha256='29fb3e821ab51a508775d539207aeff4f1100272cdff3fbd33eda3fa229b2c4a';
const duplicate=`    if(typeof window.gtag==='function'){
      window.gtag('event',name,{...sanitized,page_path:safePath(pagePath())});
    }
`;
export async function singleDispatchHtmlAsset(request,response){
 const path=new URL(request.url).pathname;
 if(path!=='/analytics-events-v31b.js'||!['GET','HEAD'].includes(request.method)||response.status!==200)return response;
 const headers=new Headers(response.headers);
 if(request.method==='HEAD'){headers.delete('Content-Length');headers.delete('ETag');headers.set('Cache-Control','no-store');return new Response(null,{status:response.status,headers});}
 const source=await response.text();
 const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(source)))].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(digest!==legacyHelperSha256||source.split(duplicate).length!==2){headers.set('X-Shift-Analytics-Dispatch','unrecognised-source');return new Response(source,{status:response.status,headers});}
 headers.delete('Content-Length');headers.delete('ETag');headers.delete('Content-Encoding');headers.set('Cache-Control','no-store');headers.set('X-Shift-Analytics-Dispatch','data-layer-only-v1');
 return new Response(source.replace(duplicate,''),{status:response.status,headers});
}
