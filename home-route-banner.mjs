import {banner,css} from './preview/home-banner/four-step.mjs';
import {removeHomeBanner as removeLegacy,addHomeBanner as addLegacy} from './home-route-banner-legacy.mjs';
export {banner,css};
export {previousCss} from './home-route-banner-legacy.mjs';
const anchor='<section aria-labelledby="struggle-artwork-title" class="struggle-artwork-section">';
export function addHomeBanner(html){
 if(html.includes(banner)&&html.includes(css))return html;
 if(html.includes('id="sst-home-route"'))html=removeLegacy(html);
 if(html.split(anchor).length!==2||html.split('</head>').length!==2)return html;
 return html.replace('</head>',css+'</head>').replace(anchor,banner+anchor);
}
export function removeHomeBanner(html,{required=false}={}){
 if(!html.includes('sst-home-route')){if(required)throw Error('Approved homepage banner is missing');return html;}
 if(!html.includes(banner)||!html.includes(css)){if(required)throw Error('Homepage banner differs from approved preview');return removeLegacy(html);}
 if(html.split(banner+anchor).length!==2||html.split(css+'</head>').length!==2)throw Error('Homepage banner differs from approved preview');
 const before=html.replace(banner,'').replace(css,'');
 if(before.includes('sst-home-route'))throw Error('Unexpected duplicate homepage banner');return before;
}
