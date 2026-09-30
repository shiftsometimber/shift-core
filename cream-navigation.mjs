import {headerPreview} from './preview/home-banner/cream-header.mjs';
import {footerPreview} from './preview/home-banner/cream-footer.mjs';
export {headerPreview};
// Start the existing responsive hero request in the head; preserve the image and layout.
const heroSource='/assets/seo-20260923/heroLarge-22b76937213e5741.webp';
const heroSources='/assets/seo-20260923/heroSmall-54d52bf31ac3389a.webp 768w, '+heroSource+' 1536w';
const heroSizes='(max-width:760px) 100vw, 50vw';
export const heroPreload='<link data-shift-hero-preload rel="preload" as="image" href="'+heroSource+'" imagesrcset="'+heroSources+'" imagesizes="'+heroSizes+'" fetchpriority="high">';
function preloadExistingHero(html){
 if(html.includes('data-shift-hero-preload')||!html.includes('class="home-hero"'))return html;
 const images=html.match(/<img\b[^>]*>/g)||[];
 if(!images.some(t=>t.includes('src="'+heroSource+'"')&&t.includes('srcset="'+heroSources+'"')&&t.includes('sizes="'+heroSizes+'"')))return html;
 return html.replace(/<head\b[^>]*>/,tag=>tag+heroPreload);
}
export function addCreamNavigation(html){
 if(!/<header\b[^>]*data-header-v2/.test(html)||!html.includes('</body>'))return html;
 html=preloadExistingHero(html);
 if(!html.includes('id="sst-cream-header-preview"'))html=html.replace('</body>',headerPreview+'</body>');
 if(/<footer\b[^>]*class="site-footer"/.test(html)&&!html.includes('id="sst-cream-footer-preview"'))html=html.replace('</body>',footerPreview+'</body>');
 return html;
}
export function removeCreamNavigation(html){
 if(html.includes('data-shift-hero-preload')){if(html.split(heroPreload).length!==2)throw Error('Hero preload differs from verified responsive image');html=html.replace(heroPreload,'');}
 if(html.includes('sst-cream-footer-preview')){if(html.split(footerPreview).length!==2)throw Error('Footer differs from the owner-approved cream preview');html=html.replace(footerPreview,'');}
 if(!html.includes('sst-cream-header-preview'))return html;
 if(html.split(headerPreview).length!==2)throw Error('Navigation differs from the owner-approved cream preview');
 return html.replace(headerPreview,'');
}
