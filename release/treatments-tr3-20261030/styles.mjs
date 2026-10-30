const p='html body main#main-content.tv[data-treatments-tr3]';
export default `
${p}{background:#050505!important;color:#E7E3DA!important;font-family:Arial,Helvetica,sans-serif!important;overflow-x:clip!important}
${p} *{box-sizing:border-box}
${p} .tv-wrap{width:min(1160px,calc(100% - 64px))!important;max-width:1160px!important;margin-inline:auto!important;padding-inline:0!important}
${p} .tv-hero{position:relative!important;display:block!important;min-height:0!important;height:auto!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:#050505!important;isolation:isolate!important;overflow:hidden!important}
${p} .tv-hero>img{position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;min-height:0!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:80% 10%!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;z-index:0!important}
${p} .tv-hero:before{content:''!important;display:block!important;position:absolute!important;inset:0!important;background:linear-gradient(90deg,rgba(5,5,5,.72),rgba(5,5,5,.78) 48%,rgba(5,5,5,.62) 59%,rgba(5,5,5,.08) 74%,transparent 87%)!important;z-index:1!important;pointer-events:none!important}
${p} .tv-hero:after{content:none!important;display:none!important}
${p} .tv-hero .tv-wrap{position:relative!important;z-index:2!important;display:flex!important;align-items:center!important;min-height:360px!important;height:auto!important;padding-block:28px!important;background:none!important;border:0!important}
${p} .tv-hero-copy{position:relative!important;width:64%!important;max-width:744px!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;background:none!important;isolation:auto!important}
${p} .tv-hero h1{font-family:Arial,Helvetica,sans-serif!important;font-size:clamp(40px,4.1vw,56px)!important;line-height:1.04!important;letter-spacing:-.035em!important;font-weight:800!important;margin:9px 0 17px!important;color:#E7E3DA!important;text-wrap:balance}
${p} .tv-hero-copy>p:not(.tv-kicker){font:400 17px/1.5 Arial,Helvetica,sans-serif!important;max-width:570px!important;margin:0 0 22px!important;color:#E7E3DA!important}
${p} .tv-kicker{font:700 11px/1.4 Arial,Helvetica,sans-serif!important;letter-spacing:.14em!important;margin:0!important;text-transform:uppercase!important;color:#E7E3DA!important}
${p} .tv-actions{display:flex!important;flex-wrap:wrap!important;gap:12px!important;margin:0!important;padding:0!important}
${p} .tv-button{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:0!important;min-height:44px!important;max-width:100%!important;padding:12px 20px!important;border:1px solid #E7E3DA!important;border-radius:5px!important;background:#E7E3DA!important;color:#050505!important;-webkit-text-fill-color:#050505!important;font:700 14px/1.25 Arial,Helvetica,sans-serif!important;letter-spacing:0!important;text-decoration:none!important;text-align:center!important;box-shadow:none!important;white-space:normal!important}
${p} .tv-button svg{display:none!important}
${p} .tv-hero .tv-button:not(.tv-alt){background:linear-gradient(rgba(5,5,5,.18),rgba(5,5,5,.18)),#707762!important;border-color:#707762!important;color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}
${p} .tv-hero .tv-alt{background:transparent!important;color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}
${p} .tv-button:focus-visible{outline:3px solid #9fa68c!important;outline-offset:4px!important}
${p} .tv-cream{background:#050505!important;color:#E7E3DA!important;margin:0!important;padding:0!important}
${p} .tv-cards{display:block!important;gap:0!important;padding:0!important;margin:0!important;scroll-margin-top:110px}
${p} .tv-card,${p} .tv-support{display:grid!important;grid-template-columns:29% minmax(0,1fr) 220px!important;grid-template-rows:auto auto auto!important;column-gap:22px!important;row-gap:6px!important;align-items:center!important;min-height:0!important;width:100%!important;margin:0!important;padding:16px 0!important;border:0!important;border-bottom:1px solid #707762!important;border-radius:0!important;background:#050505!important;color:#E7E3DA!important;overflow:visible!important;box-shadow:none!important}
${p} .tv-card:before,${p} .tv-card:after,${p} .tv-support:before,${p} .tv-support:after{content:none!important;display:none!important}
${p} .tv-card>div,${p} .tv-support>div{display:contents!important;background:none!important;padding:0!important;margin:0!important;border:0!important}
${p} .tv-card>img,${p} .tv-support>img{display:block!important;position:relative!important;inset:auto!important;grid-column:1!important;grid-row:1/4!important;width:100%!important;height:122px!important;min-height:0!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:50% 10%!important;margin:0!important;padding:0!important;border:0!important;border-radius:3px!important;transform:none!important;filter:none!important}
${p} .tv-guide>img{object-position:50% 10%!important}
${p} .tv-card .tv-kicker,${p} .tv-support .tv-kicker{grid-column:2!important;grid-row:1!important;align-self:end!important}
${p} .tv-card h2,${p} .tv-support h2{grid-column:2!important;grid-row:2!important;font:700 24px/1.14 Arial,Helvetica,sans-serif!important;letter-spacing:-.025em!important;color:#E7E3DA!important;margin:0!important;padding:0!important}
${p} .tv-card p:not(.tv-kicker),${p} .tv-support p:not(.tv-kicker){grid-column:2!important;grid-row:3!important;align-self:start!important;font:400 15px/1.5 Arial,Helvetica,sans-serif!important;color:#E7E3DA!important;margin:0!important;padding:0!important}
${p} .tv-card .tv-button,${p} .tv-support .tv-button{grid-column:3!important;grid-row:1/4!important;justify-self:stretch!important;align-self:center!important}
${p} .tv-support{background:linear-gradient(rgba(5,5,5,.18),rgba(5,5,5,.18)),#707762!important;padding:16px!important;border:0!important;grid-template-columns:calc(29% - 11px) minmax(0,1fr) 220px!important}
${p} .tv-useful{display:flex!important;justify-content:center!important;align-items:center!important;flex-wrap:wrap!important;gap:0!important;margin:0!important;padding:18px 0!important;border:0!important;border-bottom:1px solid #707762!important;background:#050505!important}
${p} .tv-useful .tv-button{background:transparent!important;color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important;border:0!important;border-radius:0!important;min-height:36px!important;padding:8px 22px!important;font-weight:400!important;text-decoration:underline!important;text-underline-offset:4px!important}
${p} .tv-useful .tv-button+.tv-button{border-left:1px solid #707762!important}
${p} .tv-watch{display:grid!important;grid-template-columns:170px minmax(0,1fr)!important;align-items:center!important;gap:28px!important;width:min(1160px,calc(100% - 64px))!important;min-height:0!important;max-width:1160px!important;margin:0 auto!important;padding:28px 0 36px!important;background:#050505!important;color:#E7E3DA!important;border:0!important;overflow:visible!important}
${p} .tv-watch:before,${p} .tv-watch:after{display:none!important;content:none!important}
${p} .tv-watch>img{display:block!important;position:relative!important;inset:auto!important;width:170px!important;height:120px!important;max-height:none!important;max-width:none!important;object-fit:cover!important;margin:0!important;padding:0!important;border:0!important;border-radius:4px!important}
${p} .tv-watch .tv-wrap{width:100%!important;margin:0!important;padding:0!important;min-height:0!important;max-width:none!important}
${p} .tv-watch h2{font:700 26px/1.15 Arial,Helvetica,sans-serif!important;letter-spacing:-.02em!important;margin:7px 0 10px!important;color:#E7E3DA!important}
${p} .tv-watch p:not(.tv-kicker){font:400 15px/1.5 Arial,Helvetica,sans-serif!important;color:#E7E3DA!important;margin:0 0 15px!important;max-width:740px!important}
${p} .tv-watch .tv-alt{background:transparent!important;color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}
@media(min-width:761px) and (max-width:1000px){${p} .tv-hero-copy{width:68%!important}${p} .tv-hero h1{font-size:43px!important}${p} .tv-card,${p} .tv-support{grid-template-columns:34% minmax(0,1fr)!important;grid-template-rows:auto auto auto auto!important}${p} .tv-card>img,${p} .tv-support>img{grid-row:1/5!important;height:145px!important}${p} .tv-card .tv-button,${p} .tv-support .tv-button{grid-column:2!important;grid-row:4!important;justify-self:start!important;margin-top:5px!important}}
@media(max-width:760px){
 ${p} .tv-wrap{width:calc(100% - 36px)!important}
 ${p} .tv-hero{display:flex!important;flex-direction:column!important}
 ${p} .tv-hero>img{position:relative!important;inset:auto!important;width:100%!important;height:220px!important;object-position:88% 10%!important;order:0!important}
 ${p} .tv-hero:before{display:none!important;content:none!important}
 ${p} .tv-hero .tv-wrap{order:1!important;min-height:0!important;padding-block:22px 28px!important}
 ${p} .tv-hero-copy{width:100%!important;max-width:none!important}
 ${p} .tv-hero h1{font-size:clamp(32px,8.5vw,44px)!important;line-height:1.06!important;margin:9px 0 16px!important;text-wrap:initial}
 ${p} .tv-hero-copy>p:not(.tv-kicker){font-size:16px!important;margin-bottom:19px!important}
 ${p} .tv-actions{display:grid!important;grid-template-columns:1fr!important;gap:10px!important}
 ${p} .tv-button{min-height:46px!important}
 ${p} .tv-card,${p} .tv-support{display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto auto auto auto auto!important;gap:10px!important;padding:20px 0!important;margin:0!important}
 ${p} .tv-support{padding:18px!important;margin-top:8px!important}
 ${p} .tv-card>img,${p} .tv-support>img{grid-column:1!important;grid-row:1!important;width:100%!important;height:auto!important;aspect-ratio:1.85!important;max-height:260px!important;object-position:50% 10%!important;border-radius:5px!important;margin:0 0 7px!important}
 ${p} .tv-card .tv-kicker,${p} .tv-support .tv-kicker{grid-column:1!important;grid-row:2!important}
 ${p} .tv-card h2,${p} .tv-support h2{grid-column:1!important;grid-row:3!important;font-size:25px!important}
 ${p} .tv-card p:not(.tv-kicker),${p} .tv-support p:not(.tv-kicker){grid-column:1!important;grid-row:4!important;font-size:16px!important}
 ${p} .tv-card .tv-button,${p} .tv-support .tv-button{grid-column:1!important;grid-row:5!important;justify-self:start!important;margin-top:5px!important}
 ${p} .tv-useful{display:grid!important;grid-template-columns:1fr!important;padding:12px 0!important}
 ${p} .tv-useful .tv-button{justify-content:flex-start!important;padding:12px 0!important;min-height:46px!important}
 ${p} .tv-useful .tv-button+.tv-button{border-left:0!important;border-top:1px solid #44493d!important}
 ${p} .tv-watch{width:calc(100% - 36px)!important;grid-template-columns:1fr!important;gap:17px!important;padding-block:24px 32px!important}
 ${p} .tv-watch>img{width:100%!important;height:140px!important}
}
`;
