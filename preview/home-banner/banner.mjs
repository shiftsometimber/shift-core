export const banner = `<section id="sst-home-route" aria-labelledby="sst-home-route-title">
<div class="sst-route-inner"><h2 id="sst-home-route-title">HERE’S HOW IT FITS TOGETHER.</h2>
<ol class="sst-route-steps">
<li><span class="sst-route-number" aria-hidden="true">01</span><div><h3><a href="/start-here">START HERE</a></h3><p class="sst-route-lead">Find your starting point.</p><p>Understand your weight-loss options and where to begin.</p></div></li>
<li><span class="sst-route-number" aria-hidden="true">02</span><div><h3><a href="/programme">THE PROGRAMME</a></h3><p class="sst-route-lead">Build around real life.</p><p>Food, movement and support you can keep coming back to.</p></div></li>
<li><span class="sst-route-number" aria-hidden="true">03</span><div><h3><a href="/member/dashboard">MY TIMBER</a></h3><p class="sst-route-lead">Keep it going.</p><p>Your free home for meals, movement, check-ins and progress.</p></div></li>
</ol></div>
<div class="sst-route-free"><p class="sst-route-free-title">My Timber is free for everyone.</p><p>Food, movement, check-ins and progress—all in one place.</p><p class="sst-route-free-end">No purchase needed. We’re happy to help.</p></div>
</section>`;
export const css = `<style id="sst-home-route-css">
@font-face{font-family:ShiftRouteCondensed;src:url('/__banner/barlow-condensed-700.ttf') format('truetype');font-weight:700;font-style:normal;font-display:swap}
html body main#main-content #sst-home-route{display:block!important;background:#E7E3DA!important;color:#050505!important;margin:0!important;padding:0!important;width:100%!important;max-width:none!important;border:0!important}
html body main#main-content #sst-home-route *{box-sizing:border-box;color:inherit;-webkit-text-fill-color:currentColor}
html body main#main-content #sst-home-route .sst-route-inner{max-width:1320px;margin:0 auto;padding:20px 32px 18px;background:transparent}
html body main#main-content #sst-home-route h2{font:700 clamp(25px,2.6vw,36px)/1.1 ShiftRouteCondensed,'Arial Narrow',sans-serif!important;letter-spacing:0!important;margin:0 0 22px!important;color:#050505!important;text-align:left!important}
html body main#main-content #sst-home-route .sst-route-steps{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));list-style:none!important;margin:0!important;padding:0!important;gap:0}
html body main#main-content #sst-home-route li{display:grid!important;grid-template-columns:48px minmax(0,1fr);gap:16px;margin:0!important;padding:0 28px!important;border:0;background:transparent}
html body main#main-content #sst-home-route li:first-child{padding-left:0!important}
html body main#main-content #sst-home-route li+li{border-left:1px solid #aaa79f}
html body main#main-content #sst-home-route .sst-route-number{font:700 40px/1 ShiftRouteCondensed,sans-serif;color:#707762!important}
html body main#main-content #sst-home-route h3{font:700 25px/1.1 ShiftRouteCondensed,sans-serif!important;margin:0 0 8px!important;letter-spacing:0!important;color:#050505!important}
html body main#main-content #sst-home-route a{color:#050505!important;text-decoration:none;display:inline-block}
html body main#main-content #sst-home-route h3 a,html body main#main-content #sst-home-route .sst-route-number{font-family:ShiftRouteCondensed,'Arial Narrow',sans-serif!important}
html body main#main-content #sst-home-route a:hover{text-decoration:underline}
html body main#main-content #sst-home-route a:focus-visible{outline:2px solid #050505;outline-offset:4px}
html body main#main-content #sst-home-route p{font:400 15px/1.4 Arial,Helvetica,sans-serif!important;margin:0!important;max-width:none!important;color:inherit!important}
html body main#main-content #sst-home-route p.sst-route-lead{font-weight:700!important;font-size:17px!important;margin-bottom:7px!important}
html body main#main-content #sst-home-route .sst-route-free{background:#707762!important;color:#E7E3DA!important;text-align:center!important;margin:0!important;padding:3px 16px!important}
html body main#main-content #sst-home-route .sst-route-free p{font-size:14px!important;line-height:1.3!important;margin:0!important}
html body main#main-content #sst-home-route .sst-route-free .sst-route-free-title{font:700 23px/1.15 ShiftRouteCondensed,sans-serif!important}
html body main#main-content #sst-home-route .sst-route-free .sst-route-free-end{font:700 20px/1.15 ShiftRouteCondensed,sans-serif!important}
@media(max-width:700px){html body main#main-content #sst-home-route .sst-route-inner{padding:18px 20px 16px}html body main#main-content #sst-home-route h2{font-size:27px!important;margin-bottom:16px!important}html body main#main-content #sst-home-route .sst-route-steps{grid-template-columns:1fr}html body main#main-content #sst-home-route li{padding:12px 0!important;grid-template-columns:38px minmax(0,1fr);gap:12px}html body main#main-content #sst-home-route li:first-child{padding-top:0!important}html body main#main-content #sst-home-route li:last-child{padding-bottom:0!important}html body main#main-content #sst-home-route li+li{border-left:0;border-top:1px solid #aaa79f}html body main#main-content #sst-home-route .sst-route-number{font-size:34px}html body main#main-content #sst-home-route h3{font-size:23px!important;margin-bottom:4px!important}html body main#main-content #sst-home-route p.sst-route-lead{font-size:16px!important;margin-bottom:3px!important}html body main#main-content #sst-home-route .sst-route-free p{font-size:13px!important}html body main#main-content #sst-home-route .sst-route-free .sst-route-free-title{font-size:21px!important}html body main#main-content #sst-home-route .sst-route-free .sst-route-free-end{font-size:18px!important}}
</style>`;
export function insertBanner(html){
 const anchor='<section aria-labelledby="struggle-artwork-title" class="struggle-artwork-section">';
 if(html.includes('id="sst-home-route"'))throw new Error('Banner already present');
 if(html.split(anchor).length!==2)throw new Error('Homepage insertion point changed');
 return html.replace('</head>',css+'</head>').replace(anchor,banner+anchor);
}
