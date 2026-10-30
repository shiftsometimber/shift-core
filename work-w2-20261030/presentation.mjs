const arrow='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h16m-7-7 7 7-7 7"/></svg>';
const icon=body=>'<svg aria-hidden="true" viewBox="0 0 48 48">'+body+'</svg>';
export const hero='<section class="ww2-hero" aria-labelledby="fw-title"><div class="ww2-copy"><p class="ww2-eyebrow">SHIFT FOR WORK</p><h1 id="fw-title">Men’s health support your workforce might actually use.</h1><p class="ww2-lead">Practical support for weight, food, movement and wellbeing. Built around real working lives.</p><a class="ww2-button" href="#work-enquiry">Talk to us about SHIFT for Work '+arrow+'</a></div><figure class="ww2-photo"><img src="/shift-for-work/assets/workplace-w2-20261030.webp" width="1448" height="1086" alt="Two colleagues sharing a laugh over a cuppa in a workplace breakroom" fetchpriority="high" decoding="async"></figure></section>';
const items=[['For your people','Food, movement and wellbeing for real working lives.',icon('<circle cx="24" cy="12" r="6"/><path d="M14 41V30c0-10 20-10 20 0v11M6 38v-8c0-6 3-9 8-10m28 18v-8c0-6-3-9-8-10"/><path d="M10 10a5 5 0 1 1 0 10m28-10a5 5 0 1 0 0 10"/>')],['For your organisation','A useful place to start a wellbeing conversation.',icon('<rect x="13" y="4" width="25" height="40" rx="2"/><path d="M7 44V17h6M21 11v3m9-3v3m-9 6v3m9-3v3m-9 6v3m9-3v3m-9 6v6"/>')],['Privacy comes first','Personal accounts stay personal.',icon('<path d="m24 4 16 7v12c0 9-7 17-16 21C15 40 8 32 8 23V11Z"/>')]];
export const benefits='<section class="ww2-benefits" aria-label="Support for your workforce">'+items.map(([title,copy,svg])=>'<article><span class="ww2-round">'+svg+'</span><div><h2>'+title+'</h2><p>'+copy+'</p></div></article>').join('')+'</section>';
const root='html body main#main-content.fn[data-work-w2]';
export const style=`
${root}{background:#050505!important;color:#e7e3da!important;padding:0 clamp(20px,3.6vw,56px) 30px!important;overflow:clip!important}
${root} :is(.ww2-hero,.ww2-benefits,.fw-steps,.fw-enquiry-wrap){width:100%!important;max-width:1440px!important;margin-inline:auto!important}
${root} .ww2-hero{display:grid!important;grid-template-columns:minmax(0,.84fr) minmax(0,1.16fr)!important;gap:32px!important;align-items:center!important;padding:26px 0 28px!important;min-height:0!important}
${root} .ww2-copy{min-width:0!important;padding:12px 0!important}
${root} .ww2-eyebrow{color:#9da58d!important;font-size:17px!important;font-weight:700!important;letter-spacing:.22em!important;line-height:1.4!important;margin:0 0 20px!important}
${root} h1{color:#e7e3da!important;font-size:clamp(36px,3.8vw,60px)!important;line-height:1.06!important;font-weight:800!important;letter-spacing:-.045em!important;max-width:650px!important;margin:0!important}
${root} .ww2-lead{font-size:clamp(18px,1.7vw,25px)!important;line-height:1.45!important;color:#e7e3da!important;max-width:590px!important;margin:26px 0 0!important}
${root} .ww2-button{display:inline-flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;margin-top:30px!important;padding:18px 28px!important;min-height:60px!important;border:1px solid #707762!important;border-radius:999px!important;background:#707762!important;color:#fffdf7!important;text-decoration:none!important;font-size:clamp(16px,1.5vw,22px)!important;font-weight:700!important;line-height:1.25!important;box-shadow:none!important}
${root} .ww2-button svg{width:26px!important;height:26px!important;flex:0 0 26px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.7!important}
${root} .ww2-button:hover{background:#59614e!important;border-color:#9da58d!important}
${root} :is(a,button,input,select,summary):focus-visible{outline:3px solid #d9dfc6!important;outline-offset:4px!important}
${root} .ww2-photo{display:block!important;margin:0!important;aspect-ratio:4/3!important;min-width:0!important;overflow:hidden!important;border-radius:24px!important;background:#1b1d18!important}
${root} .ww2-photo img{display:block!important;position:static!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;border-radius:inherit!important;opacity:1!important;filter:none!important}
${root} .ww2-benefits{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;padding:30px 0!important;border-top:1px solid #707762!important;border-bottom:1px solid #393f32!important;gap:28px!important}
${root} .ww2-benefits article{display:flex!important;align-items:center!important;gap:22px!important;min-width:0!important;padding:0!important}
${root} .ww2-benefits article+article{padding-left:28px!important;border-left:1px solid #555d49!important}
${root} .ww2-round{display:grid!important;place-items:center!important;flex:0 0 88px!important;width:88px!important;height:88px!important;border-radius:50%!important;background:#1a1e16!important;color:#e7e3da!important}
${root} .ww2-round svg{width:44px!important;height:44px!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important;stroke-linecap:round!important;stroke-linejoin:round!important}
${root} .ww2-benefits h2{color:#e7e3da!important;font-size:clamp(19px,1.7vw,25px)!important;line-height:1.2!important;letter-spacing:-.025em!important;font-weight:700!important;margin:0 0 10px!important}
${root} .ww2-benefits p{color:#e7e3da!important;font-size:17px!important;line-height:1.4!important;margin:0!important}
${root} .fw-steps{background:#050505!important;color:#e7e3da!important;padding:32px 0 26px!important}
${root} :is(.fw-steps,.fw-enquiry-wrap) .fp-wrap{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}
${root} .fp-section-head{margin-bottom:22px!important;gap:22px!important}
${root} .fp-section-head h2{font-size:32px!important;color:#e7e3da!important}
${root} .fp-section-head p{color:#c4c8bc!important}
${root} .fw-steps li{background:#11130f!important;color:#e7e3da!important;border:1px solid #3d4434!important;border-radius:12px!important;padding:22px!important}
${root} .fw-steps :is(h3,p){color:#e7e3da!important}
${root} .fw-step-title>span{background:#707762!important;color:#fffdf7!important}
${root} .fw-steps li>svg{color:#9da58d!important}
${root} .fw-enquiry-wrap{padding:0!important}
${root} .fw-enquiry{border:1px solid #707762!important;border-radius:12px!important;color:#e7e3da!important;background:#050505!important;overflow:hidden!important;scroll-margin-top:96px!important}
${root} .fw-enquiry>summary{padding:20px 24px!important;color:#e7e3da!important;background:#11130f!important}
${root} .sw-enquiry{padding:24px!important;color:#e7e3da!important}
${root} .sw-enquiry-grid{width:100%!important;max-width:none!important;margin:0!important;grid-auto-rows:auto!important;align-items:start!important}
${root} .sw-enquiry-copy :is(h2,p,a){color:#e7e3da!important}
${root} form[data-work-enquiry]{background:#11130f!important;color:#e7e3da!important;border:1px solid #3d4434!important;border-radius:12px!important;padding:24px!important}
${root} .sw-fields :is(label,label span){color:#e7e3da!important}
${root} .sw-fields :is(input,select){background:#050505!important;color:#e7e3da!important;border:1px solid #707762!important;border-radius:6px!important;min-height:46px!important}
${root} .sw-fields input::placeholder{color:#b7bbae!important;opacity:1!important}
${root} :is(.sw-small,.sw-consent,.sw-small a){color:#d0d3c7!important}
${root} .sw-button{background:#707762!important;color:#fffdf7!important}
${root} .sw-button:disabled{background:#454b3b!important;color:#e7e3da!important;opacity:1!important}
${root} .sw-status{color:#e7e3da!important}
@media(max-width:1100px){
 ${root} .ww2-hero{gap:24px!important;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)!important}
 ${root} .ww2-button{padding:16px 20px!important;gap:12px!important}
 ${root} .ww2-benefits{gap:20px!important}
 ${root} .ww2-benefits article{align-items:flex-start!important;gap:14px!important}
 ${root} .ww2-benefits article+article{padding-left:20px!important}
 ${root} .ww2-round{width:58px!important;height:58px!important;flex-basis:58px!important}
 ${root} .ww2-round svg{width:32px!important;height:32px!important}
 ${root} .ww2-benefits p{font-size:15px!important}
}
@media(max-width:960px){
 ${root} .sw-enquiry-grid{grid-template-columns:1fr!important;gap:24px!important}
}
@media(max-width:760px){
 ${root}{padding-inline:20px!important;padding-bottom:24px!important}
 ${root} .ww2-hero{grid-template-columns:1fr!important;gap:24px!important;padding:28px 0 26px!important}
 ${root} .ww2-copy{padding:0!important}
 ${root} .ww2-eyebrow{font-size:14px!important;margin-bottom:14px!important}
 ${root} h1{font-size:clamp(35px,7.8vw,52px)!important;max-width:620px!important}
 ${root} .ww2-lead{font-size:18px!important;margin-top:20px!important}
 ${root} .ww2-button{margin-top:24px!important;min-height:56px!important;padding:16px 20px!important;font-size:16px!important;max-width:100%!important}
 ${root} .ww2-photo{border-radius:18px!important}
 ${root} .ww2-benefits{grid-template-columns:1fr!important;gap:0!important;padding:4px 0!important}
 ${root} .ww2-benefits article{align-items:center!important;gap:18px!important;padding:20px 0!important}
 ${root} .ww2-benefits article+article{border-left:0!important;border-top:1px solid #393f32!important;padding:20px 0!important}
 ${root} .ww2-round{width:64px!important;height:64px!important;flex-basis:64px!important}
 ${root} .ww2-benefits h2{font-size:21px!important;margin-bottom:7px!important}
 ${root} .ww2-benefits p{font-size:16px!important}
 ${root} .fw-steps{padding:28px 0 22px!important}
 ${root} .fw-steps .fp-three{grid-template-columns:1fr!important}
 ${root} .fw-enquiry>summary{padding:18px!important;font-size:18px!important}
 ${root} .sw-enquiry{padding:20px 16px!important}
 ${root} .sw-enquiry-grid,${root} .sw-fields{grid-template-columns:1fr!important;gap:20px!important}
 ${root} form[data-work-enquiry]{padding:18px!important}
}
`;
