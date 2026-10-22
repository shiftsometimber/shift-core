// Visible but deliberately non-interactive Timber Shed teaser.
// No route, link, signup, member data, publication or community activation.
const tag='<span class="sst-shed-teaser" aria-label="The Timber Shed — coming soon">The Timber Shed <small>SOON</small></span>';
const drawerTag='<span class="sst-shed-teaser sst-shed-drawer" aria-label="The Timber Shed — coming soon">The Timber Shed <small>SOON</small></span>';
const footerTag='<span class="sst-shed-teaser sst-shed-footer" aria-label="The Timber Shed — coming soon">The Timber Shed <small>Coming soon</small></span>';
const css='<style id="sst-timber-shed-teaser-css">'+
'.desktop-nav .sst-shed-teaser{display:inline-flex;align-items:center;gap:5px;color:#707762;font-weight:800;white-space:nowrap;cursor:default;font-size:.88em}'+
'.sst-shed-teaser small{font-size:9px;font-weight:800;letter-spacing:.04em;line-height:1;border:1px solid currentColor;border-radius:3px;padding:3px 4px;vertical-align:middle}'+
'.site-drawer .sst-shed-teaser{display:flex;align-items:center;gap:9px;padding:12px 0;color:#707762;font-weight:800;cursor:default}'+
'footer.site-footer .sst-shed-teaser{display:flex;align-items:center;gap:8px;margin:6px 0;color:#707762;font-weight:700;cursor:default}'+
'footer.site-footer .sst-shed-teaser small{text-transform:uppercase;font-size:9px}'+
'@media(max-width:1150px){.desktop-nav .sst-shed-teaser{font-size:.76em;gap:3px}.desktop-nav .sst-shed-teaser small{font-size:8px;padding:2px 3px}}'+
'</style>';
const primary=/<nav\b[^>]*class=["'][^"']*\bdesktop-nav\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/i;
const drawer=/<aside\b[^>]*id=["']site-drawer["'][^>]*>[\s\S]*?<\/aside>/i;
const footer=/<footer\b[^>]*(?:class=["'][^"']*\bsite-footer\b[^"']*["']|id=["']sst-footer-c["'])[^>]*>[\s\S]*?<\/footer>/i;
export function addTimberShedTeaser(html,path='/'){
 if(typeof html!=='string'||!/\<html\b/i.test(html)||!/<\/head>/i.test(html)||!/<\/body>/i.test(html))return html;
 if(/^\/(?:member(?:\/|$)|v1(?:\/|$)|hq(?:\/|$)|api(?:\/|$)|staging(?:\/|$))/.test(path))return html;
 if(html.includes('id="sst-timber-shed-teaser-css"'))return html;
 const nav=html.match(primary)?.[0],side=html.match(drawer)?.[0],foot=html.match(footer)?.[0];
 if(!nav||!side||!foot||!/<h2>Support<\/h2>/.test(foot))return html;
 if(nav.includes('sst-shed-teaser')||side.includes('sst-shed-teaser')||foot.includes('sst-shed-teaser'))return html;
 const navNext=nav.replace(/<\/nav>$/i,tag+'</nav>');
 const sideNext=side.replace(/<\/nav>/i,drawerTag+'</nav>');
 const footNext=foot.replace(/(<h2>Support<\/h2>)/, '$1'+footerTag);
 return html.replace(nav,navNext).replace(side,sideNext).replace(foot,footNext).replace('</head>',css+'</head>');
}
export async function withTimberShedTeaser(request,response){
 if(request.method!=='GET'||!response?.ok||!response.headers.get('content-type')?.includes('text/html'))return response;
 const path=new URL(request.url).pathname;
 if(/^\/(?:member(?:\/|$)|v1(?:\/|$)|hq(?:\/|$)|api(?:\/|$)|staging(?:\/|$))/.test(path))return response;
 const original=await response.text(),next=addTimberShedTeaser(original,path);
 if(next===original)return new Response(original,{status:response.status,statusText:response.statusText,headers:response.headers});
 const headers=new Headers(response.headers);for(const name of ['content-length','etag','last-modified','content-encoding'])headers.delete(name);
 return new Response(next,{status:response.status,statusText:response.statusText,headers});
}
