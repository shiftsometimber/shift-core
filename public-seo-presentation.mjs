import {SEO_IMAGES, SEO_ASSETS} from './public-seo-assets-data.mjs';

// Same artwork and palette; no analytics, consent or clinical copy changes.
const menuContrast = "html body header.site-header[data-header-v2] .menu-trigger{transition:none!important;color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}html body header.site-header[data-header-v2] .menu-trigger:is(:hover,:focus-visible,[aria-expanded=\"true\"]){background:#E7E3DA!important;color:#050505!important;-webkit-text-fill-color:#050505!important}";
const css = Object.freeze({
 '/': 'html body .home-hero-copy .actions a.button:not(.primary),html body .home-platform .action-grid a,html body .home-platform .feature-grid a :is(strong,span),html body .matters .eyebrow{color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}',
 '/guides/retatrutide-uk-guide': 'html body .reta-hero .eyebrow,html body .reta-hero .byline-v12 a,html body .reta-status a,html body .reta-body a,html body .reta-body th{color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}',
 '/shift-health': 'html body main[data-shift-health]>.wrap>.eyebrow,html body main[data-shift-health] .continuity-links a{color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}',
 '/articles/mounjaro-cost-uk': 'html body main#main-content>p.sst-article-meta{color:#050505!important;-webkit-text-fill-color:#050505!important}html body main#main-content>p>img[fetchpriority="high"][src^="/articles/mounjaro-cost-uk/image"]{width:100%;height:auto;aspect-ratio:auto 3 / 2}'
});
const clean = path => path.replace(/\/+$/, '') || '/';
const excluded = path => /^\/(?:member(?:[/-]|$)|v1(?:\/|$)|hq(?:\/|$)|api(?:\/|$)|auth(?:\/|$)|treatment-order(?:[/.]|$)|checkout(?:\/|$)|payment(?:\/|$))/.test(path);
const sourceLogo = /(<img\b[^>]*\bsrc=["'])\/assets\/7B503EDB-D4E0-4F92-B45D-1D5A50AE2597\.png(?:\?[^"']*)?(["'][^>]*>)/gi;

export function repairSeoPresentation(html, rawPath) {
 const path=clean(rawPath);
 if(excluded(path)||!/<html\b/i.test(html)||!/<main\b/i.test(html))return html;
 // Header/drawer/footer use one immutable resource instead of duplicate query versions.
 html=html.replace(sourceLogo,(_,before,after)=>before+SEO_IMAGES.logo.path+after);
 // Attribute dimensions preserve the original 2157:729 aspect ratio. CSS continues
 // to control the agreed display size; no header or footer resizing is introduced.
 html=html.replace(/<img\b[^>]*>/gi,tag=>{
  if(!tag.includes(SEO_IMAGES.logo.path))return tag;
  let out=tag.replace(/\s(?:width|height|decoding)=["'][^"']*["']/gi,'');
  return out.replace(/\/?\s*>$/, ' width="719" height="243" decoding="async">');
 });
 html=html.replace(/(<section\b[^>]*class=["'][^"']*\bfooter-brand\b[^"']*["'][^>]*>)([\s\S]*?)(<\/section>)/i,(_,start,body,end)=>start+body.replace(/<img\b[^>]*>/i,tag=>tag.includes(SEO_IMAGES.logo.path)?tag.replace(/\sloading=["'][^"']*["']/gi,'').replace(/>$/,' loading="lazy">'):tag)+end);
 if(path==='/')html=html.replace(/<img\b[^>]*\bsrc=["']\/assets\/home-hero-men-v32o\.jpg(?:\?[^"']*)?["'][^>]*>/i,tag=>{
  const keep=tag.replace(/\s(?:src|srcset|sizes|width|height|loading|decoding|fetchpriority)=["'][^"']*["']/gi,'').replace(/\/?\s*>$/,'');
  return keep+' src="'+SEO_IMAGES.heroLarge.path+'" srcset="'+SEO_IMAGES.heroSmall.path+' 768w, '+SEO_IMAGES.heroLarge.path+' 1536w" sizes="(max-width:760px) 100vw, 50vw" width="1536" height="1024" loading="eager" decoding="async" fetchpriority="high">';
 });
 if(!html.includes('data-seo-contrast-20260923'))html=html.replace(/<\/head>/i,'<style data-seo-contrast-20260923>'+menuContrast+(css[path]||'')+'</style></head>');
 return html;
}

export function seoAssetResponse(request) {
 const url=new URL(request.url),asset=SEO_ASSETS[url.pathname];
 if(!asset)return null;
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
 const headers={'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable','ETag':'"'+asset.sha256+'"','X-Content-Type-Options':'nosniff'};
 if(request.headers.get('If-None-Match')===headers.ETag)return new Response(null,{status:304,headers});
 const body=request.method==='HEAD'?null:Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0));
 return new Response(body,{status:200,headers});
}
