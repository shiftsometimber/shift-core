// Owner-approved homepage insertion; the rest of the response is preserved byte for byte.
import {banner,css as previewCss} from './preview/home-banner/banner.mjs';
import {fontData} from './home-route-font.mjs';
export {banner};
export const css=previewCss.replace('/__banner/barlow-condensed-700.ttf',fontData);
const anchor='<section aria-labelledby="struggle-artwork-title" class="struggle-artwork-section">';
export function addHomeBanner(html){
 if(html.includes('id="sst-home-route"')||html.split(anchor).length!==2||html.split('</head>').length!==2)return html;
 return html.replace('</head>',css+'</head>').replace(anchor,banner+anchor);
}
export function removeHomeBanner(html,{required=false}={}){
 if(!html.includes('sst-home-route')){if(required)throw Error('Approved homepage banner is missing');return html;}
 if(html.split(banner+anchor).length!==2||html.split(css+'</head>').length!==2)throw Error('Homepage banner differs from approved preview');
 const before=html.replace(banner,'').replace(css,'');
 if(before.includes('sst-home-route'))throw Error('Unexpected duplicate homepage banner');
 return before;
}
