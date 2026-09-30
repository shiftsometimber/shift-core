import {headerPreview} from './preview/home-banner/cream-header.mjs';
import {footerPreview} from './preview/home-banner/cream-footer.mjs';
export {headerPreview};
export function addCreamNavigation(html){
 if(!/<header\b[^>]*data-header-v2/.test(html)||!html.includes('</body>'))return html;
 if(!html.includes('id="sst-cream-header-preview"'))html=html.replace('</body>',headerPreview+'</body>');
 if(/<footer\b[^>]*class="site-footer"/.test(html)&&!html.includes('id="sst-cream-footer-preview"'))html=html.replace('</body>',footerPreview+'</body>');
 return html;
}
export function removeCreamNavigation(html){
 if(html.includes('sst-cream-footer-preview')){if(html.split(footerPreview).length!==2)throw Error('Footer differs from the owner-approved cream preview');html=html.replace(footerPreview,'');}
 if(!html.includes('sst-cream-header-preview'))return html;
 if(html.split(headerPreview).length!==2)throw Error('Navigation differs from the owner-approved cream preview');
 return html.replace(headerPreview,'');
}
