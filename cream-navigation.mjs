import {headerPreview} from './preview/home-banner/cream-header.mjs';
export {headerPreview};
export function addCreamNavigation(html){
 if(!/<header\b[^>]*data-header-v2/.test(html)||!html.includes('</body>'))return html;
 if(html.includes('id="sst-cream-header-preview"'))return html;
 return html.replace('</body>',headerPreview+'</body>');
}
export function removeCreamNavigation(html){
 if(!html.includes('sst-cream-header-preview'))return html;
 if(html.split(headerPreview).length!==2)throw Error('Navigation differs from the owner-approved cream preview');
 return html.replace(headerPreview,'');
}
