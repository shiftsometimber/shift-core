export const photoPath='/tools/assets/ct3-couple-20261031.webp';
const svg=body=>'<svg aria-hidden="true" viewBox="0 0 48 48">'+body+'</svg>';
const arrow=svg('<path d="M8 24h32m-11-11 11 11-11 11"/>');
export const tools=[
 {title:'BMI Calculator',copy:'Height, weight and context.',href:'/tools/bmi',icon:'<rect x="9" y="4" width="30" height="40" rx="4"/><path d="M16 12h16M16 22h1m7 0h1m7 0h1M16 30h1m7 0h1m7 0h1M16 38h1m7 0h1m7 0h1"/>'},
 {title:'Calorie Calculator',copy:'An estimate, explained.',href:'/tools/calories',icon:'<path d="M8 5v14c0 6 12 6 12 0V5M14 5v38M36 5c-8 8-10 15-10 23h10M36 5v38"/>'},
 {title:'Healthy Weight Range',copy:'A range, with context.',href:'/tools/healthy-weight',icon:'<rect x="6" y="10" width="36" height="34" rx="5"/><path d="M16 18a9 9 0 0 1 16 0M24 19l4-5"/>'},
 {title:'Protein Calculator',copy:'A practical daily estimate.',href:'/tools/protein',icon:'<path d="M7 15h7v18H7zm27 0h7v18h-7zM3 20v8m42-8v8M14 24h20M14 10v28m20-28v28"/>'},
 {title:'Waist-to-Height',copy:'One useful measure.',href:'/tools/waist-height',icon:'<ellipse cx="20" cy="14" rx="15" ry="8"/><ellipse cx="20" cy="14" rx="7" ry="3"/><path d="M5 14v14c0 10 30 10 30 0V14M5 28h37v14H20M16 28v6m8-6v6m8-6v6m8-6v6"/>'},
 {title:'Walking Calculator',copy:'Movement, at your pace.',href:'/tools/walking',icon:'<path d="m8 7 12 11 10 5 12 3v12H6c-4-6-3-10 0-15L8 7Z"/><path d="M6 32h36M19 18l-4 4m11 0-4 4"/>'},
 {title:'Water Calculator',copy:'Litres and UK pints.',href:'/tools/water',icon:'<path d="M24 3C18 13 9 22 9 30a15 15 0 0 0 30 0C39 22 30 13 24 3Z"/>'},
 {title:'More Tool Guides',copy:'Steps, sleep and alcohol units.',href:'#ct3-more-guides',icon:'<path d="M9 4h25l6 6v34H9ZM33 4v9h7M16 21h17M16 29h17M16 37h13"/>'}
];
export const hero='<section class="ct3-hero" aria-labelledby="ct3-title"><figure class="ct3-photo"><img src="'+photoPath+'" width="1903" height="826" alt="A couple enjoying a relaxed moment together in their garden, looking at a phone" fetchpriority="high" decoding="async"></figure><div class="ct3-shade"></div><div class="ct3-copy"><p class="ct3-eyebrow">CALCULATORS &amp; TOOLS</p><h1 id="ct3-title">Useful numbers.<br>Never the whole story.</h1><p class="ct3-lead">Practical measures, clear explanations and useful next steps.</p><a class="ct3-button" data-tools-jump href="#calculators">Choose a calculator '+arrow+'</a></div></section>';
export const checkin='<section class="ct3-checkin" id="feel-featured-tool" aria-labelledby="ct3-checkin-title"><span class="ct3-checkin-icon">'+svg('<path d="M24 41 7 25C-5 13 14-2 24 13 34-2 53 13 41 25Z"/>')+'</span><div class="ct3-checkin-copy"><h2 id="ct3-checkin-title">How are you feeling?</h2><p>Start with you, then the numbers.</p></div><a class="ct3-button" href="/how-are-you-feeling">Start the check-in '+arrow+'</a></section>';
export const grid='<section class="ct3-tools" id="calculators" aria-labelledby="ct3-tools-title"><h2 id="ct3-tools-title">Choose your tool</h2><div class="ct3-grid">'+tools.map(t=>'<a class="ct3-tile tile" href="'+t.href+'"><span class="ct3-tool-icon">'+svg(t.icon)+'</span><span class="ct3-tool-copy"><strong>'+t.title+'</strong><span>'+t.copy+'</span></span><span class="ct3-tile-arrow">'+arrow+'</span></a>').join('')+'</div><p class="ct3-note">A number should inform you, not define you.</p></section>';
export const moreLinks='<nav class="ct3-more-links" aria-label="More calculator guides"><a href="/tools/steps">Steps guide '+arrow+'</a><a href="/tools/sleep">Sleep guide '+arrow+'</a><a href="/tools/alcohol">Alcohol units guide '+arrow+'</a></nav>';
const r='html body main#main-content.tpp.page-template.template-calculator-tool-result[data-tools-ct3]';
export const style=`
${r}{display:block!important;width:100%!important;max-width:none!important;margin:0!important;padding:0 0 32px!important;background:#050505!important;color:#e7e3da!important;font:16px/1.5 Arial,Helvetica,sans-serif!important;overflow:clip!important}
${r} *{box-sizing:border-box!important}
${r} .tool-layout,${r} .tool-content{display:block!important;max-width:none!important;width:100%!important;margin:0!important;padding:0!important;min-width:0!important;min-height:0!important;grid-auto-rows:auto!important}
${r} :is(h1,h2,h3,p,figure){margin:0!important}
${r} :is(h1,h2,h3,strong,p,a,span){-webkit-text-fill-color:currentColor!important}
${r} :is(#feel-featured-tool,#calculators,#mot-2202a,#progress-2202b,#decision-tools-2202c) *{-webkit-text-fill-color:currentColor!important}
${r} .ct3-hero{position:relative!important;isolation:isolate!important;min-height:440px!important;padding:0!important;margin:0!important;overflow:hidden!important;background:#050505!important;border:0!important;border-radius:0!important}
${r} .ct3-photo{position:absolute!important;inset:0!important;margin:0!important;width:100%!important;height:100%!important;z-index:-2!important}
${r} .ct3-photo img{display:block!important;width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important;object-position:center 38%!important;border-radius:0!important;opacity:1!important;filter:none!important}
${r} .ct3-shade{position:absolute!important;inset:0!important;z-index:-1!important;background:linear-gradient(90deg,#050505 0%,#050505 31%,rgba(5,5,5,.96) 40%,rgba(5,5,5,.7) 49%,rgba(5,5,5,.08) 65%,transparent 75%)!important}
${r} .ct3-copy{position:relative!important;max-width:1600px!important;width:100%!important;margin:auto!important;padding:36px clamp(24px,3.5vw,56px) 32px!important;background:transparent!important}
${r} .ct3-eyebrow{font-size:15px!important;letter-spacing:.21em!important;line-height:1.4!important;font-weight:700!important;color:#a2aa91!important;margin:0 0 20px!important}
${r} h1{font-family:Arial,Helvetica,sans-serif!important;font-size:clamp(40px,3.7vw,60px)!important;line-height:1.06!important;letter-spacing:-.04em!important;font-weight:800!important;max-width:760px!important;text-wrap:initial!important;color:#e7e3da!important;margin:0!important}
${r} .ct3-lead{font-size:clamp(18px,1.6vw,23px)!important;line-height:1.5!important;max-width:660px!important;color:#e7e3da!important;margin:22px 0 0!important}
${r} .ct3-button{display:inline-flex!important;align-items:center!important;justify-content:space-between!important;gap:24px!important;padding:16px 26px!important;min-height:58px!important;max-width:100%!important;border:1px solid #707762!important;border-radius:999px!important;background:#707762!important;color:#fffdf7!important;font:700 18px/1.3 Arial,Helvetica,sans-serif!important;text-decoration:none!important;box-shadow:none!important;cursor:pointer!important}
${r} .ct3-copy .ct3-button{margin-top:28px!important}
${r} .ct3-button:hover{background:#59614e!important;border-color:#9da58d!important;text-decoration:none!important}
${r} svg{display:block!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}
${r} .ct3-button svg{width:25px!important;height:25px!important;flex:0 0 25px!important}
${r} :is(a,button,input,select,summary):focus-visible{outline:3px solid #d9dfc6!important;outline-offset:4px!important}
${r} #feel-featured-tool.ct3-checkin{display:flex!important;align-items:center!important;gap:26px!important;max-width:1488px!important;width:calc(100% - 80px)!important;margin:0 auto 30px!important;padding:24px 30px!important;border:1px solid #707762!important;border-radius:10px!important;background:#10130d!important;color:#e7e3da!important;min-height:0!important}
${r} #feel-featured-tool .ct3-checkin-icon{display:grid!important;place-items:center!important;flex:0 0 76px!important;width:76px!important;height:76px!important;border-radius:50%!important;background:#20251b!important;color:#e7e3da!important}
${r} #feel-featured-tool .ct3-checkin-icon svg{width:38px!important;height:38px!important}
${r} #feel-featured-tool .ct3-checkin-copy{flex:1 1 auto!important;min-width:0!important}
${r} #feel-featured-tool h2{font:800 30px/1.15 Arial,Helvetica,sans-serif!important;letter-spacing:-.025em!important;color:#e7e3da!important;margin:0 0 8px!important}
${r} #feel-featured-tool p{font-size:20px!important;line-height:1.4!important;color:#e7e3da!important;margin:0!important}
${r} #feel-featured-tool .ct3-button{flex:0 0 auto!important;color:#fffdf7!important}
${r} #calculators.ct3-tools{display:block!important;max-width:1488px!important;width:calc(100% - 80px)!important;margin:0 auto 32px!important;padding:0!important;background:#050505!important;border:0!important;scroll-margin-top:108px!important}
${r} #calculators h2{font:800 32px/1.2 Arial,Helvetica,sans-serif!important;color:#e7e3da!important;margin:0 0 18px!important;letter-spacing:-.025em!important}
${r} #calculators .ct3-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-auto-rows:auto!important;gap:16px!important;margin:0!important;padding:0!important}
${r} #calculators .ct3-tile{display:flex!important;align-items:center!important;gap:16px!important;min-width:0!important;min-height:124px!important;width:100%!important;padding:20px 18px!important;border:1px solid #555e48!important;border-radius:9px!important;background:#10130d!important;color:#e7e3da!important;text-decoration:none!important;box-shadow:none!important;position:relative!important;overflow:visible!important}
${r} #calculators .ct3-tile:hover{border-color:#a2aa91!important;background:#1a1f14!important;transform:none!important}
${r} #calculators .ct3-tile::before,${r} #calculators .ct3-tile::after{display:none!important;content:none!important}
${r} #calculators .ct3-tool-icon{display:block!important;flex:0 0 36px!important;width:36px!important;color:#d9dfca!important}
${r} #calculators .ct3-tool-icon svg{width:36px!important;height:40px!important}
${r} #calculators .ct3-tool-copy{display:block!important;min-width:0!important;flex:1 1 auto!important}
${r} #calculators .ct3-tool-copy strong{display:block!important;font:700 16px/1.3 Arial,Helvetica,sans-serif!important;color:#e7e3da!important;margin:0 0 8px!important}
${r} #calculators .ct3-tool-copy>span{display:block!important;font-size:14px!important;line-height:1.4!important;color:#d3d6cb!important}
${r} #calculators .ct3-tile-arrow{display:block!important;flex:0 0 20px!important;color:#d3d6cb!important}
${r} #calculators .ct3-tile-arrow svg{width:20px!important;height:20px!important}
${r} #calculators .ct3-note{font-size:15px!important;line-height:1.5!important;color:#c6cabd!important;border-top:1px solid #555e48!important;padding-top:20px!important;margin:28px 0 0!important}
${r} .tool-content>section:not(.ct3-hero):not(.ct3-checkin):not(.ct3-tools),${r}>.shift-review-link{max-width:1488px!important;width:calc(100% - 80px)!important;margin:0 auto 22px!important;padding:24px!important;border:1px solid #353d2c!important;border-radius:10px!important;background:#10130d!important;color:#e7e3da!important;min-height:0!important}
${r} :is(#mot-2202a,#progress-2202b,#decision-tools-2202c){background:#10130d!important;color:#e7e3da!important}
${r} :is(#mot-2202a,#progress-2202b,#decision-tools-2202c) :is(h2,p,.eyebrow,a){color:#e7e3da!important}
${r} .tool-content>section:not(.ct3-hero):not(.ct3-checkin):not(.ct3-tools) :is(h2,h3){font-size:24px!important;line-height:1.25!important;color:#e7e3da!important;margin:0 0 12px!important}
${r} .tool-content>section:not(.ct3-hero):not(.ct3-checkin):not(.ct3-tools) p{font-size:16px!important;line-height:1.55!important;margin:0 0 14px!important;color:#d3d6cb!important}
${r} .sst-reading-grid-v31{display:block!important;max-width:none!important;width:100%!important;margin:0!important;padding:0!important}
${r} .sst-reading-article-v31{max-width:none!important;margin:0!important;padding:0!important}
${r} .tools-authority-strip{border:0!important;border-top:1px solid #353d2c!important;padding:20px 0 0!important;margin-top:18px!important;background:transparent!important;color:#e7e3da!important}
${r} .ct3-anchor{display:block!important;scroll-margin-top:110px!important}
${r} .ct3-more-links{display:flex!important;gap:12px!important;flex-wrap:wrap!important;margin:20px 0 0!important}
${r} .ct3-more-links a{display:inline-flex!important;align-items:center!important;gap:12px!important;padding:12px 16px!important;border:1px solid #707762!important;border-radius:8px!important;background:#1a1f14!important;color:#e7e3da!important;text-decoration:none!important;min-height:46px!important}
${r} .ct3-more-links svg{width:20px!important;height:20px!important}
${r} .shift-review-link h2{font-size:24px!important;line-height:1.25!important;color:#e7e3da!important;margin:0 0 12px!important}
${r} .shift-review-link p{color:#d3d6cb!important;margin:0 0 12px!important}
@media(max-width:1200px){
 ${r} h1{max-width:630px!important;font-size:46px!important}
 ${r} .ct3-lead{max-width:550px!important}
 ${r} #calculators .ct3-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
}
@media(max-width:800px){
 ${r} .ct3-hero{display:flex!important;flex-direction:column!important;min-height:0!important}
 ${r} .ct3-photo{position:relative!important;inset:auto!important;order:2!important;aspect-ratio:1.8!important;height:auto!important;z-index:0!important}
 ${r} .ct3-photo img{object-position:76% 38%!important}
 ${r} .ct3-shade{display:none!important}
 ${r} .ct3-copy{order:1!important;padding:30px 24px 28px!important}
 ${r} .ct3-eyebrow{font-size:13px!important;margin-bottom:15px!important}
 ${r} h1{font-size:clamp(34px,5.3vw,46px)!important;max-width:700px!important}
 ${r} .ct3-lead{font-size:18px!important;max-width:600px!important;margin-top:18px!important}
 ${r} .ct3-copy .ct3-button{margin-top:23px!important}
 ${r} .ct3-button{font-size:16px!important;min-height:54px!important;padding:14px 21px!important;gap:18px!important}
 ${r} #feel-featured-tool.ct3-checkin{width:calc(100% - 40px)!important;padding:20px!important;margin:20px auto 26px!important;gap:18px!important;flex-wrap:wrap!important}
 ${r} #feel-featured-tool .ct3-checkin-icon{width:54px!important;height:54px!important;flex-basis:54px!important}
 ${r} #feel-featured-tool .ct3-checkin-icon svg{width:29px!important;height:29px!important}
 ${r} #feel-featured-tool h2{font-size:25px!important}
 ${r} #feel-featured-tool p{font-size:17px!important}
 ${r} #feel-featured-tool .ct3-button{margin-left:72px!important}
 ${r} #calculators.ct3-tools{width:calc(100% - 40px)!important}
 ${r} #calculators h2{font-size:29px!important}
 ${r} .tool-content>section:not(.ct3-hero):not(.ct3-checkin):not(.ct3-tools),${r}>.shift-review-link{width:calc(100% - 40px)!important;padding:20px!important}
}
@media(max-width:560px){
 ${r} .ct3-copy{padding-inline:20px!important}
 ${r} h1{font-size:clamp(33px,8.8vw,42px)!important}
 ${r} .ct3-photo{aspect-ratio:1.55!important}
 ${r} #feel-featured-tool.ct3-checkin{gap:14px!important}
 ${r} #feel-featured-tool .ct3-checkin-copy{flex-basis:calc(100% - 68px)!important}
 ${r} #feel-featured-tool h2{font-size:24px!important}
 ${r} #feel-featured-tool .ct3-button{margin-left:0!important;width:100%!important}
 ${r} #calculators .ct3-grid{grid-template-columns:1fr!important;gap:12px!important}
 ${r} #calculators .ct3-tile{min-height:94px!important;padding:18px!important;gap:18px!important}
 ${r} #calculators .ct3-tool-copy strong{font-size:17px!important;margin-bottom:5px!important}
 ${r} #calculators .ct3-tool-copy>span{font-size:14px!important}
 ${r} .ct3-more-links{display:grid!important;grid-template-columns:1fr!important}
}
`;
