import {fontData} from '../home-route-font.mjs';
import {css} from '../home-route-banner.mjs';
import {subsetFontData} from './home-font-subset.mjs';
import {previousSubsetFontData} from './home-font-prior-subset.mjs';
const deliveredCss=css.replace(fontData+"') format('truetype')",subsetFontData+"') format('woff2')");
export function optimiseHomeFont(path,html){
 if(path!=='/'||!html.includes(css)||html.split(fontData).length!==2)return html;
 return html.replace(css,deliveredCss);
}
export function restoreHomeFont(path,html){
 if(path!=='/')return html;
 const previousCss=css.replace(fontData,previousSubsetFontData);
 for(const [font,knownCss,other] of [[subsetFontData,deliveredCss,previousSubsetFontData],[previousSubsetFontData,previousCss,subsetFontData]]){
  if(!html.includes(font))continue;
  if(!html.includes(knownCss)||html.split(font).length!==2||html.includes(fontData)||html.includes(other))throw Error('Unknown homepage font delivery');
  return html.replace(knownCss,css);
 }
 return html;
}
export async function withPublicFontDelivery(request,response){
 if(request.method!=='GET'||new URL(request.url).pathname!=='/'||response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const before=await response.clone().text(),after=optimiseHomeFont('/',before);
 if(after===before)return response;
 const headers=new Headers(response.headers);
 for(const name of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(name);
 headers.set('X-Shift-Font-Delivery','approved-glyph-subset-v1');
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}
