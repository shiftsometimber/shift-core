// Owner-approved homepage insertion; the rest of the response is preserved byte for byte.
import {banner,css as previewCss} from './preview/home-banner/banner.mjs';
import {fontData} from './home-route-font.mjs';
export {banner};
export const previousCss=previewCss.replace('/__banner/barlow-condensed-700.ttf',fontData);
// Desktop follow-up: fit the unchanged artwork rather than reserving a taller black frame.
export const desktopSpacing='@media(min-width:1001px){html body main#main-content>.home-hero figure{height:auto!important;min-height:0!important;padding-bottom:0!important}html body main#main-content>.home-hero figure img{display:block!important;height:auto!important;min-height:0!important}}';
export const flushSpacing='html body main#main-content #sst-home-route .sst-route-inner{padding-top:0!important}html body main#main-content #sst-home-route .sst-route-free{padding-top:0!important;padding-bottom:0!important}html body main#main-content #sst-home-route .sst-route-free p:nth-child(2){font-weight:700!important;font-style:italic!important}';
export const css=previousCss.replace('</style>',desktopSpacing+flushSpacing+'</style>');
const anchor='<section aria-labelledby="struggle-artwork-title" class="struggle-artwork-section">';
export function addHomeBanner(html){
 if(html.includes('id="sst-home-route"'))return html.replace(previousCss+'</head>',css+'</head>');
 if(html.split(anchor).length!==2||html.split('</head>').length!==2)return html;
 return html.replace('</head>',css+'</head>').replace(anchor,banner+anchor);
}
export function removeHomeBanner(html,{required=false}={}){
 if(!html.includes('sst-home-route')){if(required)throw Error('Approved homepage banner is missing');return html;}
 const matchedCss=html.includes(css+'</head>')?css:!required&&html.includes(previousCss+'</head>')?previousCss:null;
 if(!matchedCss||html.split(banner+anchor).length!==2||html.split(matchedCss+'</head>').length!==2)throw Error('Homepage banner differs from approved preview');
 const before=html.replace(banner,'').replace(matchedCss,'');
 if(before.includes('sst-home-route'))throw Error('Unexpected duplicate homepage banner');
 return before;
}
