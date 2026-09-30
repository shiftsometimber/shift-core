export const oldFree='<div class="sst-route-free"><p class="sst-route-free-title">My Timber is free for everyone.</p><p>Food, movement, check-ins and progress—all in one place.</p><p class="sst-route-free-end">No purchase needed. We’re happy to help.</p></div>';

const icon=(body)=>'<svg viewBox="0 0 48 48" aria-hidden="true">'+body+'</svg>';
const food=icon('<path d="M12 7v12m6-12v12m-6-5h6m-3 5v22M33 7c-4 4-6 9-6 15 0 4 2 7 5 7h2v12m-1-34v22"/>');
const move=icon('<circle cx="29" cy="9" r="4"/><path d="M20 18l8-4 7 7 6-2M28 16l-5 10-8 3m8-3 8 5-5 10M18 18l-5 7"/>');
const check=icon('<path d="M17 10h14m-11-4h8v8h-8zM12 10h24v31H12zM17 22l3 3 6-7M17 32l3 3 6-7"/>');
const progress=icon('<path d="M10 39h28M14 35V24h6v11M24 35V17h6v18M34 35V9h6v26"/>');

export const newFree='<div class="sst-route-free sst-route-free-v2" aria-label="My Timber is free for everyone"><div class="sst-free-copy"><p class="sst-route-free-title">MY TIMBER IS <span>FREE</span> FOR EVERYONE.</p><p class="sst-route-free-sub">Food, movement, check-ins and progress — all in one place.</p></div><div class="sst-free-features"><div class="sst-free-feature"><span class="sst-free-icon">'+food+'</span><div><strong>FOOD</strong><small>Simple, proper meals for real life.</small></div></div><div class="sst-free-feature"><span class="sst-free-icon">'+move+'</span><div><strong>MOVEMENT</strong><small>Doable workouts to feel better.</small></div></div><div class="sst-free-feature"><span class="sst-free-icon">'+check+'</span><div><strong>CHECK-INS</strong><small>Stay on track without the faff.</small></div></div><div class="sst-free-feature"><span class="sst-free-icon">'+progress+'</span><div><strong>PROGRESS</strong><small>See the difference week by week.</small></div></div></div><p class="sst-free-callout">NO PURCHASE NEEDED. WE’RE HAPPY TO HELP.</p></div>';

export const freeCss=`<style id="sst-free-refresh-css">
html body main#main-content #sst-home-route .sst-route-free-v2{position:relative!important;overflow:hidden!important;background:#707762!important;color:#E7E3DA!important;padding:12px 22px 10px!important;border-top:3px solid #050505!important;border-bottom:3px solid #050505!important;text-align:center!important}
html body main#main-content #sst-home-route .sst-route-free-v2:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.3;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='520' height='150' viewBox='0 0 520 150'%3E%3Cg fill='none' stroke='%23050505' stroke-width='1'%3E%3Cpath d='M-20 18C70-18 110 62 195 30s150-34 205 9 95 40 145 11'/%3E%3Cpath d='M-30 38C65 5 112 83 202 50s146-34 202 8 99 36 150 7'/%3E%3Cpath d='M-25 132C55 92 118 160 210 125s142-29 205 8 100 23 145-7'/%3E%3C/g%3E%3C/svg%3E");background-position:left top,right bottom;background-repeat:no-repeat;background-size:520px 150px}
html body main#main-content #sst-home-route .sst-route-free-v2>*{position:relative;z-index:1}
html body main#main-content #sst-home-route .sst-route-free-v2 .sst-route-free-title{font:700 clamp(26px,2.5vw,38px)/1 ShiftRouteCondensed,'Arial Narrow',sans-serif!important;letter-spacing:.01em!important;color:#E7E3DA!important;margin:0!important}
html body main#main-content #sst-home-route .sst-route-free-v2 .sst-route-free-title span{color:#050505!important;-webkit-text-fill-color:#050505!important}
html body main#main-content #sst-home-route .sst-route-free-v2 .sst-route-free-sub{font:700 14px/1.25 Arial,Helvetica,sans-serif!important;color:#E7E3DA!important;margin:3px 0 0!important}
html body main#main-content #sst-home-route .sst-free-features{max-width:1160px;margin:11px auto 9px;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:0!important}
html body main#main-content #sst-home-route .sst-free-feature{display:grid!important;grid-template-columns:48px minmax(0,1fr);align-items:center;gap:9px;padding:0 16px;border-left:1px solid #050505!important;text-align:left!important}
html body main#main-content #sst-home-route .sst-free-feature:first-child{border-left:0!important}
html body main#main-content #sst-home-route .sst-free-icon{width:48px;height:48px;border-radius:50%;background:#E7E3DA!important;color:#050505!important;display:grid!important;place-items:center}
html body main#main-content #sst-home-route .sst-free-icon svg{width:30px;height:30px;display:block;fill:none;stroke:#050505;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
html body main#main-content #sst-home-route .sst-free-feature strong{display:block;font:700 19px/1 ShiftRouteCondensed,'Arial Narrow',sans-serif!important;color:#E7E3DA!important}
html body main#main-content #sst-home-route .sst-free-feature small{display:block;font:400 11.5px/1.2 Arial,Helvetica,sans-serif!important;color:#E7E3DA!important;margin-top:3px}
html body main#main-content #sst-home-route .sst-free-callout{width:max-content;max-width:92%;margin:0 auto!important;padding:6px 26px 5px!important;background:#E7E3DA!important;color:#050505!important;font:700 17px/1 ShiftRouteCondensed,'Arial Narrow',sans-serif!important;letter-spacing:.02em!important;clip-path:polygon(2% 8%,98% 0,100% 78%,97% 95%,3% 100%,0 80%)}
@media(max-width:900px){html body main#main-content #sst-home-route .sst-free-features{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:10px}html body main#main-content #sst-home-route .sst-free-feature:nth-child(3){border-left:0!important}}
@media(max-width:520px){html body main#main-content #sst-home-route .sst-route-free-v2{padding:12px 10px 11px!important}html body main#main-content #sst-home-route .sst-route-free-v2 .sst-route-free-title{font-size:27px!important}html body main#main-content #sst-home-route .sst-route-free-v2 .sst-route-free-sub{font-size:12px!important}html body main#main-content #sst-home-route .sst-free-feature{grid-template-columns:38px minmax(0,1fr);gap:7px;padding:0 7px!important}html body main#main-content #sst-home-route .sst-free-icon{width:38px;height:38px}html body main#main-content #sst-home-route .sst-free-icon svg{width:24px;height:24px}html body main#main-content #sst-home-route .sst-free-feature strong{font-size:16px!important}html body main#main-content #sst-home-route .sst-free-feature small{font-size:10px!important}html body main#main-content #sst-home-route .sst-free-callout{font-size:14px!important;padding:5px 13px!important}}
</style>`;

export function replaceFreeStrip(html){
 if(html.includes('sst-route-free-v2'))return html;
 if(html.split(oldFree).length!==2||html.split('</head>').length!==2)throw Error('Current homepage free strip changed');
 return html.replace('</head>',freeCss+'</head>').replace(oldFree,newFree);
}
export function restoreFreeStrip(html){
 if(html.split(newFree).length!==2||html.split(freeCss).length!==2)throw Error('Preview free strip drifted');
 return html.replace(newFree,oldFree).replace(freeCss,'');
}
