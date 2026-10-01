import {addApprovedHome,removeApprovedHome} from './home-compact-footer.mjs';
// Approved homepage release; identical banner glyphs subset for mobile loading budget.
import {banner as priorBanner,css as priorCss} from './preview/home-banner/four-step.mjs';
import {removeHomeBanner as removeLegacy,addHomeBanner as addLegacy} from './home-route-banner-legacy.mjs';
import {replaceFreeStrip,restoreFreeStrip,designCss} from './preview/home-banner/free-design.mjs';
export const banner=replaceFreeStrip('<head></head>'+priorBanner).replace('<head>'+designCss+'</head>','');
export const css=priorCss+designCss;
export {previousCss} from './home-route-banner-legacy.mjs';
const anchor='<section aria-labelledby="struggle-artwork-title" class="struggle-artwork-section">';
function addOriginalHomeBanner(html){
 if(html.includes(banner)&&html.includes(css))return html;
 if(html.includes(priorBanner)&&html.includes(priorCss))html=html.replace(priorBanner,'').replace(priorCss,'');
 else if(html.includes('id="sst-home-route"'))html=removeLegacy(html);
 if(html.split(anchor).length!==2||html.split('</head>').length!==2)return html;
 return html.replace('</head>',css+'</head>').replace(anchor,banner+anchor);
}
function removeOriginalHomeBanner(html,{required=false}={}){
 if(!html.includes('sst-home-route')){if(required)throw Error('Approved homepage banner is missing');return html;}
 if(!html.includes(banner)||!html.includes(css)){if(required)throw Error('Homepage banner differs from approved preview');if(html.includes(priorBanner)&&html.includes(priorCss))return html.replace(priorBanner,'').replace(priorCss,'');return removeLegacy(html);}
 if(html.split(banner+anchor).length!==2||html.split(css+'</head>').length!==2)throw Error('Homepage banner differs from approved preview');
 const before=html.replace(banner,'').replace(css,'');
 if(before.includes('sst-home-route'))throw Error('Unexpected duplicate homepage banner');return before;
}

export function addHomeBanner(html){return addApprovedHome(addOriginalHomeBanner(removeApprovedHome(html)));}
export function removeHomeBanner(html,options){return removeOriginalHomeBanner(removeApprovedHome(html),options);}
