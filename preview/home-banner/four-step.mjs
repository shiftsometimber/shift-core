import {banner as previousBanner,css as previousCss} from '../../home-route-banner.mjs';
export {previousBanner,previousCss};
const myTimber='<li><span class="sst-route-number" aria-hidden="true">03</span><div><h3><a href="/member/dashboard">MY TIMBER</a></h3>';
const health='<li><span class="sst-route-number" aria-hidden="true">03</span><div><h3><a href="/shift-health">SHIFT HEALTH</a></h3><p class="sst-route-lead">Understand your options.</p><p>Clear information on men’s health, home tests and treatment routes.</p></div></li>\n';
export const banner=previousBanner.replace(myTimber,health+myTimber.replace('>03</span>','>04</span>'));
export const css=previousCss.replace('</style>',`html body main#main-content #sst-home-route .sst-route-free{padding-bottom:3px!important}
@media(min-width:1001px){html body main#main-content #sst-home-route .sst-route-steps{grid-template-columns:repeat(4,minmax(0,1fr))}html body main#main-content #sst-home-route li{grid-template-columns:40px minmax(0,1fr);gap:12px;padding:0 20px!important}html body main#main-content #sst-home-route li:first-child{padding-left:0!important}html body main#main-content #sst-home-route li:last-child{padding-right:0!important}}
@media(min-width:701px) and (max-width:1000px){html body main#main-content #sst-home-route .sst-route-steps{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:18px}html body main#main-content #sst-home-route li:nth-child(3){border-left:0;padding-left:0!important}}
</style>`);
export function insertFourStep(html){
 if(html.split(previousBanner).length!==2||html.split(previousCss).length!==2)throw Error('Current live homepage no longer matches the reviewed banner');
 return html.replace(previousBanner,banner).replace(previousCss,css);
}
