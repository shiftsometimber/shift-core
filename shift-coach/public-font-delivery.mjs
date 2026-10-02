import {fontData} from '../home-route-font.mjs';
import {css} from '../home-route-banner.mjs';
import {subsetFontData} from './home-font-subset.mjs';
const deliveredCss=css.replace(fontData+"') format('truetype')",subsetFontData+"') format('woff2')");
export function optimiseHomeFont(path,html){
 if(path!=='/'||!html.includes(css)||html.split(fontData).length!==2)return html;
 return html.replace(css,deliveredCss);
}
export function restoreHomeFont(path,html){
 if(path!=='/'||!html.includes(subsetFontData))return html;
 if(!html.includes(deliveredCss)||html.split(subsetFontData).length!==2||html.includes(fontData))throw Error('Unknown homepage font delivery');
 return html.replace(deliveredCss,css);
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
