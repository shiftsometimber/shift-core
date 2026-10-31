import {withCausesTeaser} from './causes-partners-teaser.mjs';
import {withSharedFooter as withCanonicalSharedFooter} from './shared-footer.mjs';

// Retain the historical export name for existing call sites while retiring the
// unlinked “Timber Shed — SOON” navigation teaser from public responses.
const retiredStyle=/<style\b[^>]*\bid=["']sst-timber-shed-teaser-css["'][^>]*>[\s\S]*?<\/style>/gi;
const retiredTag=/<span\b(?=[^>]*\bclass=["'][^"']*\bsst-shed-teaser\b[^"']*["'])[^>]*>[\s\S]*?<\/span>/gi;
export function addTimberShedTeaser(html,path='/'){
 if(typeof html!=='string')return html;
 return html.replace(retiredStyle,'').replace(retiredTag,'');
}
export async function withTimberShedTeaser(request,response){
 if(request.method!=='GET'||!response?.ok||!response.headers.get('content-type')?.includes('text/html'))return response;
 const path=new URL(request.url).pathname;
 if(/^\/(?:member(?:\/|$)|v1(?:\/|$)|hq(?:\/|$)|api(?:\/|$)|staging(?:\/|$))/.test(path))return response;
 const original=await response.text(),next=addTimberShedTeaser(original,path);
 if(next===original)return new Response(original,{status:response.status,statusText:response.statusText,headers:response.headers});
 const headers=new Headers(response.headers);for(const name of ['content-length','etag','last-modified','content-encoding'])headers.delete(name);
 headers.set('X-Shift-Timber-Shed-Policy','retired-20261031');
 return new Response(next,{status:response.status,statusText:response.statusText,headers});
}

// Compose only after the canonical footer has been installed. Preserve the
// original Worker call sites, canonical footer and causes wrapper.
export async function withSharedFooter(request,response){
 const canonical=await withCanonicalSharedFooter(request,response);
 if(new URL(request.url).pathname==='/')return canonical;
 return withCausesTeaser(request,await withTimberShedTeaser(request,canonical));
}
