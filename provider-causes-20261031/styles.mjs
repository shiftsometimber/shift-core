export const providerCSS=String.raw`
MAIN .sp-ps2{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px;align-items:stretch}
MAIN .sp-ps2 .sp-actions{flex-direction:column;align-items:flex-start;gap:6px}
MAIN .sp-ps2 .sp-photo{position:relative;min-height:380px;margin:0!important;overflow:hidden;border-radius:4px}
MAIN .sp-ps2 .sp-photo img{position:absolute;inset:0;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important}
MAIN .sp-prescription-note{max-width:1216px;margin:0 auto 20px!important;padding:17px 24px!important;background:#E7E3DA!important;color:#050505!important;font-size:16px!important;line-height:1.5!important;border-radius:3px}
MAIN .psp-needs{max-width:1280px;margin:0 auto!important;padding:0 32px 22px!important;background:#050505!important;color:#E7E3DA!important}
MAIN .psp-wrap{max-width:none!important;margin:0!important;padding:0!important}
MAIN .psp-needs section{margin:0!important;padding:0!important;background:transparent!important;border:0!important}
MAIN .psp-needs h2{font-size:29px!important;margin:0 0 17px!important;color:#E7E3DA!important}
MAIN .psp-needs .continuity-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:15px!important}
MAIN .psp-needs .continuity-grid>div{background:#E7E3DA!important;color:#050505!important;padding:22px!important;border:1px solid #707762!important;border-radius:4px!important;min-height:0!important;height:auto!important}
MAIN .psp-needs .continuity-grid :is(h3,p,a){color:#050505!important}
MAIN .psp-needs h3{font-size:20px!important;margin:0 0 11px!important}
MAIN .psp-needs p{font-size:15px!important;line-height:1.6!important;margin:0!important}
MAIN .nhh-context{max-width:1216px!important;padding:18px 0!important;margin:auto!important;background:#050505!important;color:#E7E3DA!important}
MAIN .nhh-context :is(p,a){color:#E7E3DA!important;font-size:16px!important;line-height:1.65!important}
MAIN .psp-reading{max-width:1000px!important;margin:0 auto!important;padding:24px 32px 44px!important;background:#050505!important;color:#E7E3DA!important}
MAIN .psp-reading section{margin:0 0 28px!important;padding:0!important;background:transparent!important;border:0!important}
MAIN .psp-reading :is(h2,h3,p,li,strong,a){color:#E7E3DA!important}
MAIN .psp-reading h2{font-size:28px!important;line-height:1.2!important;margin:0 0 17px!important}
MAIN .psp-reading :is(p,li){font-size:16px!important;line-height:1.7!important}
MAIN .psp-reading :is(.continuity-grid>div,details,aside){background:#10130d!important;color:#E7E3DA!important;border:1px solid #707762!important;border-radius:4px!important;padding:20px!important}
@media(max-width:850px){MAIN .sp-ps2{grid-template-columns:1fr!important;padding:28px 24px!important;gap:22px}MAIN .sp-ps2 .sp-photo{height:340px;min-height:0}MAIN .sp-prescription-note{margin-inline:24px!important}MAIN .psp-needs{padding:0 24px 22px!important}MAIN .nhh-context{margin-inline:24px!important}}
@media(max-width:600px){MAIN .sp-ps2{padding:26px 20px!important}MAIN .sp-hero h1{font-size:38px!important}MAIN .sp-lede{font-size:17px!important}MAIN .sp-ps2 .sp-photo{height:280px}MAIN .sp-prescription-note{margin-inline:20px!important;padding:17px!important;font-size:15px!important}MAIN .psp-needs{padding:0 20px 22px!important}MAIN .psp-needs .continuity-grid{grid-template-columns:1fr!important;gap:12px!important}MAIN .psp-reading{padding:22px 20px!important}MAIN .nhh-context{margin-inline:20px!important}}
`;
export const causesCSS=String.raw`
MAIN[data-approved-pages="causes"]{--black:#050505;--cream:#E7E3DA;--green:#707762;--line:#707762;--muted:#c1c6b5;font:16px/1.6 Arial,Helvetica,sans-serif!important}
MAIN[data-approved-pages="causes"] :is(section,article,div,nav,aside){box-sizing:border-box;min-width:0}
MAIN[data-approved-pages="causes"]>section{padding:0!important;margin:0!important;background:#050505!important;max-width:none!important;width:100%!important}
MAIN[data-approved-pages="causes"] :is(h1,h2,h3,h4,p,li,strong,small,span,a,blockquote,button){color:#E7E3DA!important;opacity:1!important;visibility:visible!important;-webkit-text-fill-color:currentColor!important}
MAIN[data-approved-pages="causes"] :is(h1,h2,h3,h4){font-weight:800!important;line-height:1.15!important;letter-spacing:-.025em!important;text-transform:none!important}
MAIN[data-approved-pages="causes"] .wrap{display:block;width:calc(100% - 64px)!important;max-width:1180px!important;margin:0 auto!important;padding-inline:0!important}
MAIN[data-approved-pages="causes"] .opening{padding:34px 0!important;background:#050505!important;margin:0!important}
MAIN[data-approved-pages="causes"] .opening .wrap{display:grid!important;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)!important;gap:36px!important;align-items:center}
MAIN[data-approved-pages="causes"] h1{font-size:clamp(36px,4vw,58px)!important;margin:12px 0 0!important}
MAIN[data-approved-pages="causes"] .opening-note{border-left:2px solid #707762;padding-left:23px}
MAIN[data-approved-pages="causes"] .opening-note p{font-size:18px!important;line-height:1.55!important;margin:0!important;max-width:none!important}
MAIN[data-approved-pages="causes"] .opening-note small{display:block;font-size:14px!important;line-height:1.6!important;color:#c1c6b5!important;margin-top:13px!important}
MAIN[data-approved-pages="causes"] .eyebrow{font-size:12px!important;letter-spacing:.12em!important;font-weight:800!important;color:#b8c49c!important;line-height:1.5!important}
MAIN[data-approved-pages="causes"] .eyebrow::before{display:none!important}
MAIN[data-approved-pages="causes"] .support-section{padding-block:24px 32px!important}
MAIN[data-approved-pages="causes"] .section-top{display:grid!important;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:28px!important;align-items:end;margin-bottom:24px!important}
MAIN[data-approved-pages="causes"] h2{font-size:32px!important;margin:9px 0 0!important}
MAIN[data-approved-pages="causes"] .section-top p{font-size:16px!important;line-height:1.6!important;margin:0!important;max-width:none!important;color:#c1c6b5!important}
MAIN[data-approved-pages="causes"] .support-layout{display:grid!important;grid-template-columns:minmax(0,.9fr) minmax(0,1.3fr);gap:30px!important;align-items:start}
MAIN[data-approved-pages="causes"] .area-list{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;border:0!important;overflow:visible!important;padding:0!important}
MAIN[data-approved-pages="causes"] .area-list button{display:grid!important;grid-template-columns:25px minmax(0,1fr) 20px!important;align-items:center;gap:12px!important;width:100%!important;min-width:0!important;min-height:80px!important;height:auto!important;margin:0!important;padding:15px!important;background:#10130d!important;color:#E7E3DA!important;border:1px solid #707762!important;border-radius:4px!important;text-align:left;white-space:normal!important}
MAIN[data-approved-pages="causes"] .area-list button strong{display:block;font-size:17px!important;line-height:1.3!important;margin:0!important}
MAIN[data-approved-pages="causes"] .area-list button small{display:block;font-size:13px!important;line-height:1.4!important;margin-top:5px!important;color:#c1c6b5!important}
MAIN[data-approved-pages="causes"] .area-list button .num{font-size:12px!important;color:#b8c49c!important;margin:0!important}
MAIN[data-approved-pages="causes"] .area-list button[aria-pressed="true"]{background:#E7E3DA!important;color:#050505!important;border-color:#E7E3DA!important}
MAIN[data-approved-pages="causes"] .area-list button[aria-pressed="true"] *{color:#050505!important}
MAIN[data-approved-pages="causes"] .support-display{background:#10130d!important;color:#E7E3DA!important;border:1px solid #707762!important;border-top:3px solid #707762!important;border-radius:5px!important;padding:24px!important;min-height:0!important}
MAIN[data-approved-pages="causes"] .support-display h3{font-size:29px!important;line-height:1.2!important;margin:12px 0 16px!important;max-width:none!important}
MAIN[data-approved-pages="causes"] .support-display>p{font-size:16px!important;line-height:1.65!important;margin:0 0 20px!important;max-width:none!important}
MAIN[data-approved-pages="causes"] .org-row{background:transparent!important;border:0!important;border-top:1px solid #707762!important;border-radius:0!important;padding:19px 0 0!important;margin:20px 0 0!important}
MAIN[data-approved-pages="causes"] .org-row h4{font-size:23px!important;margin:0 0 12px!important}
MAIN[data-approved-pages="causes"] .org-row p{font-size:15px!important;line-height:1.6!important;margin:0 0 12px!important}
MAIN[data-approved-pages="causes"] .org-row .links{display:flex!important;gap:10px 22px!important;align-items:center;flex-wrap:wrap}
MAIN[data-approved-pages="causes"] .org-row :is(a,button),MAIN[data-approved-pages="causes"] .commercial button{font-size:16px!important;line-height:1.4!important;min-height:44px!important;background:transparent!important;border:0!important;text-decoration:underline!important;padding:9px 0!important;text-underline-offset:4px}
MAIN[data-approved-pages="causes"] :is(.support-meta,.support-disclaimer){font-size:14px!important;line-height:1.65!important;color:#c1c6b5!important;max-width:none!important;margin:18px 0 0!important}
MAIN[data-approved-pages="causes"] .purpose{padding:28px 0!important;background:#10130d!important;border-block:1px solid #707762!important}
MAIN[data-approved-pages="causes"] .purpose-grid{display:grid!important;grid-template-columns:1.1fr 1fr 1fr!important;gap:28px!important}
MAIN[data-approved-pages="causes"] .purpose-grid h2{font-size:30px!important;margin-bottom:18px!important}
MAIN[data-approved-pages="causes"] .purpose-grid h3{font-size:23px!important;margin:12px 0!important}
MAIN[data-approved-pages="causes"] .purpose-grid p{font-size:16px!important;line-height:1.65!important;max-width:none!important;margin:0!important}
MAIN[data-approved-pages="causes"] .step{font-size:12px!important;font-weight:800!important;letter-spacing:.08em!important;color:#b8c49c!important}
MAIN[data-approved-pages="causes"] .founder-strip{background:#050505!important;padding:28px 0!important}
MAIN[data-approved-pages="causes"] .founder-strip .wrap{display:grid!important;grid-template-columns:215px minmax(0,1fr)!important;gap:28px!important;align-items:center}
MAIN[data-approved-pages="causes"] .founder-strip img{display:block!important;width:100%!important;height:155px!important;object-fit:cover!important;border-radius:4px}
MAIN[data-approved-pages="causes"] blockquote{font-size:22px!important;line-height:1.5!important;margin:0!important;letter-spacing:normal!important;max-width:none!important}
MAIN[data-approved-pages="causes"] .signature{font-size:14px!important;margin:12px 0 0!important}
MAIN[data-approved-pages="causes"] .commercial{padding:26px 0!important;background:#10130d!important;border-top:1px solid #707762!important}
MAIN[data-approved-pages="causes"] .commercial .wrap{display:grid!important;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)!important;gap:28px!important}
MAIN[data-approved-pages="causes"] .commercial h3{font-size:25px!important;margin:10px 0!important}
MAIN[data-approved-pages="causes"] .commercial :is(p,small){font-size:15px!important;line-height:1.65!important;max-width:none!important}
MAIN[data-approved-pages="causes"] dialog{width:min(620px,calc(100% - 32px))!important;max-height:calc(100dvh - 32px)!important;overflow:auto!important;background:#E7E3DA!important;color:#050505!important;border:1px solid #707762!important;border-radius:6px!important;padding:24px!important}
MAIN[data-approved-pages="causes"] dialog *{color:#050505!important}
MAIN[data-approved-pages="causes"] dialog :is(h2,p){line-height:1.5!important}
MAIN[data-approved-pages="causes"] dialog h2{font-size:28px!important;margin:16px 0!important}
MAIN[data-approved-pages="causes"] dialog p{font-size:16px!important}
MAIN[data-approved-pages="causes"] dialog .close{min-height:44px!important;padding:10px 14px!important;background:transparent!important;border:1px solid #707762!important;font-size:16px!important}
MAIN[data-approved-pages="causes"] dialog .btn{background:#050505!important;color:#E7E3DA!important;padding:12px 18px!important;display:inline-block!important;font-size:16px!important;min-height:44px!important}
@media(max-width:850px){MAIN[data-approved-pages="causes"] .wrap{width:calc(100% - 48px)!important}MAIN[data-approved-pages="causes"] .opening .wrap,MAIN[data-approved-pages="causes"] .section-top{grid-template-columns:1fr!important;gap:20px!important}MAIN[data-approved-pages="causes"] .support-layout{grid-template-columns:1fr!important;gap:20px!important}MAIN[data-approved-pages="causes"] .area-list{grid-template-columns:repeat(2,minmax(0,1fr))!important}MAIN[data-approved-pages="causes"] .area-list button:last-child{grid-column:1/-1}MAIN[data-approved-pages="causes"] .purpose-grid{grid-template-columns:1fr 1fr!important}MAIN[data-approved-pages="causes"] .purpose-grid>div{grid-column:1/-1}}
@media(max-width:600px){MAIN[data-approved-pages="causes"] .wrap{width:calc(100% - 40px)!important}MAIN[data-approved-pages="causes"] .opening{padding:26px 0!important}MAIN[data-approved-pages="causes"] h1{font-size:39px!important;line-height:1.08!important}MAIN[data-approved-pages="causes"] h2{font-size:29px!important}MAIN[data-approved-pages="causes"] .opening-note{padding-left:16px!important}MAIN[data-approved-pages="causes"] .opening-note p{font-size:17px!important}MAIN[data-approved-pages="causes"] .support-section{padding-block:20px 26px!important}MAIN[data-approved-pages="causes"] .area-list{grid-template-columns:1fr!important;gap:8px!important}MAIN[data-approved-pages="causes"] .area-list button{min-height:76px!important;padding:13px!important}MAIN[data-approved-pages="causes"] .area-list button:last-child{grid-column:auto}MAIN[data-approved-pages="causes"] .support-display{padding:20px!important}MAIN[data-approved-pages="causes"] .support-display h3{font-size:27px!important}MAIN[data-approved-pages="causes"] .purpose-grid,MAIN[data-approved-pages="causes"] .founder-strip .wrap,MAIN[data-approved-pages="causes"] .commercial .wrap{grid-template-columns:1fr!important;gap:22px!important}MAIN[data-approved-pages="causes"] .founder-strip img{height:160px!important;object-position:center 45%!important}MAIN[data-approved-pages="causes"] blockquote{font-size:20px!important}MAIN[data-approved-pages="causes"] .purpose-grid h2 br{display:none!important}}
`;
