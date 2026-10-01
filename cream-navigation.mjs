import {bootstrap} from './activation-measurement/assets.mjs';
import {headerPreview} from './preview/home-banner/cream-header.mjs';
import {footerPreview} from './preview/home-banner/cream-footer.mjs';
export {headerPreview};
// Exact owner-uploaded PNG; preserve all pixels and clip only the black canvas outside the ring.
// Retain the exact previous live style for before/after content-preservation verification.
const earlierHeaderMarkCss="<style id=\"sst-header-mark-20261001\">html body header.site-header[data-header-v2][data-header-style] .site-logo{position:relative}html body header.site-header[data-header-v2][data-header-style] .site-logo::after{content:\"\";position:absolute;pointer-events:none;left:8.15%;top:50%;width:13%;aspect-ratio:1;transform:translateY(-50%);border-radius:50%;background:#050505 url(\"/assets/apple-touch-icon.png\") center/114.5% 114.5% no-repeat;filter:none}</style>";
export const headerMarkCss="<style id=\"sst-header-mark-20261001\">html body header.site-header[data-header-v2][data-header-style] .site-logo{position:relative}html body header.site-header[data-header-v2][data-header-style] .site-logo img{clip-path:inset(0 0 0 23%)}html body header.site-header[data-header-v2][data-header-style] .site-logo::after{content:\"\";position:absolute;pointer-events:none;left:5.7%;top:50%;width:17.95%;aspect-ratio:1;transform:translateY(-50%);clip-path:ellipse(44% 45% at 50% 50%);background:#050505 url(\"/fit-v3-images/sst-header-brand-mark-20261001.png\") center/100% 100% no-repeat;filter:none}</style>";
// Start the existing responsive hero request in the head; preserve the image and layout.
const bootstrapTag='<script src="/analytics-bootstrap-v1.js"></script>';
export const inlineBootstrap='<script data-shift-inline-bootstrap>'+bootstrap+'</script>';
const heroSource='/assets/seo-20260923/heroLarge-22b76937213e5741.webp';
const heroSources='/assets/seo-20260923/heroSmall-54d52bf31ac3389a.webp 768w, '+heroSource+' 1536w';
const heroSizes='(max-width:760px) 100vw, 50vw';
export const heroPreload='<link data-shift-hero-preload rel="preload" as="image" href="'+heroSource+'" imagesrcset="'+heroSources+'" imagesizes="'+heroSizes+'" fetchpriority="high">';
function preloadExistingHero(html){
 if(html.includes('data-shift-hero-preload')||!html.includes('class="home-hero"'))return html;
 const images=html.match(/<img\b[^>]*>/g)||[];
 if(!images.some(t=>t.includes('src="'+heroSource+'"')&&t.includes('srcset="'+heroSources+'"')&&t.includes('sizes="'+heroSizes+'"')))return html;
 return html.replace(/<meta\b(?=[^>]*name="viewport")[^>]*>/,tag=>tag+heroPreload).replace(bootstrapTag,inlineBootstrap);
}
export function addCreamNavigation(html){
 if(!/<header\b[^>]*data-header-v2/.test(html)||!html.includes('</body>'))return html;
 html=preloadExistingHero(html);
 if(!html.includes('id="sst-header-mark-20261001"'))html=html.replace('</body>',headerMarkCss+'</body>');
 if(!html.includes('id="sst-cream-header-preview"'))html=html.replace('</body>',headerPreview+'</body>');
 if(/<footer\b[^>]*class="site-footer"/.test(html)&&!html.includes('id="sst-cream-footer-preview"'))html=html.replace('</body>',footerPreview+'</body>');
 return html;
}
export function removeCreamNavigation(html){
 if(html.includes('sst-header-mark-20261001')){const matches=[headerMarkCss,earlierHeaderMarkCss].filter(css=>html.includes(css));if(matches.length!==1||html.split(matches[0]).length!==2)throw Error('Header mark differs from approved brand correction');html=html.replace(matches[0],'');}
 if(html.includes('data-shift-inline-bootstrap')){if(html.split(inlineBootstrap).length!==2)throw Error('Inline bootstrap differs from authoritative privacy source');html=html.replace(inlineBootstrap,bootstrapTag);}
 if(html.includes('data-shift-hero-preload')){if(html.split(heroPreload).length!==2)throw Error('Hero preload differs from verified responsive image');html=html.replace(heroPreload,'');}
 if(html.includes('sst-cream-footer-preview')){if(html.split(footerPreview).length!==2)throw Error('Footer differs from the owner-approved cream preview');html=html.replace(footerPreview,'');}
 if(!html.includes('sst-cream-header-preview'))return html;
 if(html.split(headerPreview).length!==2)throw Error('Navigation differs from the owner-approved cream preview');
 return html.replace(headerPreview,'');
}
