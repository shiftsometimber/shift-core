const symbols={envelope:'<rect x="6" y="12" width="52" height="38" rx="3"/><path d="m7 14 25 20 25-20M7 49l18-17M57 49 39 32"/>',people:'<circle cx="23" cy="20" r="10"/><circle cx="48" cy="23" r="8"/><path d="M5 58v-7a18 18 0 0 1 36 0v7M45 40a14 14 0 0 1 14 14v4"/>',news:'<rect x="6" y="8" width="46" height="48" rx="2"/><path d="M52 18h8v32a6 6 0 0 1-6 6M14 17h29M14 24h29M14 33h12v14H14zM33 33h10M33 40h10M33 47h10"/>',pen:'<path d="m9 55 5-18L44 7l12 12-30 30-17 6ZM14 37l12 12M39 12l12 12M8 59h48"/>',link:'<path d="m27 41-8 8a11 11 0 0 1-16-16l14-14a11 11 0 0 1 16 0M37 23l8-8a11 11 0 0 1 16 16L47 45a11 11 0 0 1-16 0M21 43l22-22"/>',shield:'<path d="M32 5 55 14v17c0 14-23 29-23 29S9 45 9 31V14L32 5Z"/><path d="m21 32 8 8 16-18"/>',info:'<circle cx="32" cy="32" r="25"/><path d="M32 29v18M32 17v3"/>'};
export const symbol=name=>'<svg viewBox="0 0 66 66" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+symbols[name]+'</svg>';
export const css=String.raw`
MAIN{background:#050505!important;color:#E7E3DA!important;margin:0!important;padding:0 0 34px!important;max-width:none!important;width:100%!important;font-family:Arial,Helvetica,sans-serif!important;overflow:clip}
MAIN *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif!important;-webkit-text-fill-color:currentColor!important;min-width:0}
MAIN :is(section,aside,div,article){height:auto!important;min-height:0!important;box-shadow:none!important}
MAIN :is(section,aside,div,article):before,MAIN :is(section,aside,div,article):after{content:none!important;display:none!important}
MAIN :is(h1,h2,h3,p,figure,ul){text-transform:none!important;letter-spacing:normal!important}
MAIN :is(a,button,input):focus-visible{outline:3px solid #aeba96!important;outline-offset:4px!important}
MAIN h1{font-size:clamp(35px,3.9vw,54px)!important;line-height:1.06!important;letter-spacing:-.035em!important;color:#E7E3DA!important;font-weight:800!important;margin:0 0 19px!important;padding:0!important;visibility:visible!important;opacity:1!important;transform:none!important}
MAIN h1 :is(span,.accent){color:#E7E3DA!important;background:transparent!important}
MAIN :is(.sp-support-hero,.su-introduction) :is(.eyebrow,.ct-eyebrow){font-size:12px!important;line-height:1.4!important;font-weight:800!important;letter-spacing:.12em!important;color:#c3c9b8!important;margin:0 0 17px!important;padding:0!important}
MAIN .sp-support-hero{display:grid!important;grid-template-columns:minmax(0,1fr) 125px;gap:30px;align-items:center;max-width:1240px!important;margin:0 auto!important;padding:36px 32px 28px!important;background:#050505!important;color:#E7E3DA!important;border:0!important;border-radius:0!important;position:relative!important}
MAIN .sp-support-hero :is(.wrap,.mass-inner){max-width:none!important;width:100%!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important}
MAIN .sp-support-hero p{font-size:18px!important;line-height:1.5!important;color:#E7E3DA!important;margin:0!important;padding:0!important;max-width:820px!important}
MAIN .sp-support-hero a{color:#E7E3DA!important;text-decoration:underline!important;text-underline-offset:3px}
MAIN .sp-support-symbol{width:112px!important;padding:0!important;margin:0!important;color:#a9b49a!important;background:transparent!important;border:0!important;justify-self:end}
MAIN .sp-support-symbol svg{display:block;width:100%;height:auto}
MAIN .sp-support-body{max-width:1240px!important;margin:0 auto!important;padding:0 32px!important;display:grid!important;gap:14px;background:transparent!important;border:0!important}
MAIN .sp-support-body :is(.standard-layout,section,.content,.wrap,.prose,.sst-reading-grid-v31,.sst-reading-article-v31,.mass-reading){width:100%!important;max-width:none!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important;display:block!important;position:static!important}
MAIN .sp-support-body .sst-reading-lead-v31:empty{display:none!important}
MAIN .sp-support-body :is(h2,h3){color:#E7E3DA!important;padding:0!important;font-weight:800!important}
MAIN .sp-support-body h2{font-size:27px!important;line-height:1.2!important;margin:24px 0 13px!important}
MAIN .sp-support-body h3{font-size:20px!important;line-height:1.25!important;margin:0 0 10px!important}
MAIN .sp-support-body :is(p,li){font-size:16px!important;line-height:1.6!important;color:#E7E3DA!important;margin:0 0 13px!important}
MAIN .sp-support-body ul{padding-left:22px!important;margin:0 0 16px!important;list-style:disc!important}
MAIN .sp-support-body li{margin:0 0 6px!important}
MAIN .sp-support-body a{color:#E7E3DA!important;text-decoration:underline!important;text-underline-offset:4px;overflow-wrap:anywhere}
MAIN .sp-support-body .eyebrow{font-size:12px!important;line-height:1.4!important;font-weight:800!important;letter-spacing:.1em!important;color:#c3c9b8!important;margin:0 0 10px!important}
MAIN .sp-support-body :is(.authority-grid-v65,.press-grid-v3b2){display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:14px!important;margin:16px 0 23px!important;padding:0!important;border:0!important;background:transparent!important}
MAIN .sp-support-body :is(.promise-grid-v3b1,.grid2){display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important;padding:0!important;margin:16px 0!important;border:0!important;background:transparent!important}
MAIN .sp-support-body :is(.authority-grid-v65>article,.press-card-v3b2,.promise-card-v3b1,.grid2>div,.partner-placeholder,.mass-reading){display:block!important;height:auto!important;min-height:0!important;padding:24px!important;margin:0!important;background:#E7E3DA!important;color:#050505!important;border:0!important;border-radius:6px!important;overflow:visible!important;position:static!important}
MAIN .sp-support-body :is(.authority-grid-v65>article,.press-card-v3b2,.promise-card-v3b1,.grid2>div,.partner-placeholder,.mass-reading) :is(h2,h3,p,li,a,.eyebrow){color:#050505!important}
MAIN .sp-support-body :is(.authority-grid-v65>article,.press-card-v3b2,.promise-card-v3b1,.grid2>div,.partner-placeholder,.mass-reading) :is(h2,h3){margin:0 0 12px!important;font-size:21px!important;line-height:1.25!important}
MAIN .sp-support-body :is(.authority-grid-v65>article,.press-card-v3b2,.promise-card-v3b1,.grid2>div,.partner-placeholder,.mass-reading) p{font-size:15px!important;line-height:1.55!important;margin:0 0 12px!important}
MAIN .sp-support-body :is(.authority-grid-v65>article,.press-card-v3b2,.promise-card-v3b1,.grid2>div,.partner-placeholder,.mass-reading) p:last-child{margin-bottom:0!important}
MAIN .sp-support-body a.btn{display:inline-flex!important;align-items:center;justify-content:center;min-height:46px!important;padding:12px 18px!important;margin:5px 8px 5px 0!important;width:auto!important;max-width:100%;background:#E7E3DA!important;color:#050505!important;border:1px solid #707762!important;border-radius:4px!important;font-size:16px!important;font-weight:800!important;line-height:1.4!important;text-decoration:none!important;white-space:normal!important;box-shadow:none!important}
MAIN .sp-support-body :is(.authority-grid-v65>article,.press-card-v3b2,.grid2>div,.partner-placeholder) a.btn{background:#050505!important;color:#E7E3DA!important;border-color:#050505!important}
MAIN .sp-support-body .mass-reading a,MAIN .sp-support-body .press-card-v3b2 a{display:inline-flex;align-items:center;min-height:44px}
MAIN .sp-support-body .mass-reading p:last-child{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px}
MAIN .sp-support-body #partner-boundary-v42l{padding:24px!important;background:#E7E3DA!important;color:#050505!important;border:0!important;border-radius:6px!important;margin:0 0 18px!important}
MAIN .sp-support-body #partner-boundary-v42l :is(h2,p,a,.eyebrow){color:#050505!important}
MAIN .sp-support-body #partner-boundary-v42l h2{margin-top:0!important}
MAIN .sp-support-body .trust-actions-v42l{display:flex!important;flex-wrap:wrap;gap:8px}
MAIN .sp-support-body :is(.trust-statement,.commercial-cta-v3b1,.press-fact-v3b2){padding:24px!important;border:1px solid #707762!important;border-radius:6px!important;margin:18px 0!important;background:#050505!important;color:#E7E3DA!important}
MAIN .sp-support-body :is(.trust-statement,.commercial-cta-v3b1) h2{margin-top:0!important}
MAIN .sp-support-body .join-conversation-v2223{padding:20px 0!important;border-bottom:1px solid #707762!important}
MAIN .sp-support-body [data-shift-link-repair]{padding-top:20px!important;border-top:1px solid #707762!important}
MAIN .su-layout{display:grid!important;grid-template-columns:1fr 1fr;gap:52px;align-items:center;max-width:1240px!important;margin:0 auto!important;padding:38px 32px 25px!important;background:transparent!important;border:0!important}
MAIN .su-introduction{padding:0!important;margin:0!important;background:transparent!important;border:0!important}
MAIN .su-introduction .ct-wrap{width:100%!important;max-width:none!important;padding:0!important;margin:0!important;background:transparent!important;border:0!important}
MAIN .su-introduction h1{font-size:clamp(36px,4vw,54px)!important}
MAIN .su-introduction p{font-size:18px!important;line-height:1.5!important;color:#E7E3DA!important;margin:0!important;padding:0!important}
MAIN .su-envelope{width:170px!important;margin:28px 0 0!important;padding:0!important;color:#E7E3DA!important;background:transparent!important;border:0!important;transform:rotate(-7deg)}
MAIN .su-envelope svg{display:block;width:100%;height:auto}
MAIN .ct-form-card{display:block!important;background:#E7E3DA!important;color:#050505!important;border:0!important;border-radius:6px!important;padding:28px!important;margin:0!important;position:static!important;overflow:visible!important}
MAIN .ct-form-card :is(h2,p,label,span,a){color:#050505!important;background-color:transparent!important}
MAIN .ct-form-card h2{font-size:27px!important;font-weight:800!important;line-height:1.2!important;margin:0 0 10px!important;padding:0!important}
MAIN .ct-form-card p{font-size:15px!important;line-height:1.5!important;margin:0 0 18px!important;padding:0!important}
MAIN .ct-form{display:grid!important;gap:17px;margin:0!important;padding:0!important;background:transparent!important;border:0!important}
MAIN .ct-field{display:grid!important;gap:8px;padding:0!important;margin:0!important;background:transparent!important;border:0!important}
MAIN .ct-field label{font-size:16px!important;font-weight:800!important;line-height:1.4!important;padding:0!important;margin:0!important}
MAIN .ct-field input{display:block!important;width:100%!important;max-width:100%!important;min-height:50px!important;font-size:17px!important;line-height:1.4!important;padding:12px 14px!important;margin:0!important;color:#050505!important;background:#E7E3DA!important;border:1px solid #707762!important;border-radius:4px!important}
MAIN .ct-check{display:flex!important;gap:12px!important;align-items:flex-start!important;min-height:44px!important;padding:6px 0!important;margin:0!important;background:transparent!important;border:0!important;font-size:15px!important;line-height:1.5!important;cursor:pointer}
MAIN .ct-check input{width:22px!important;height:22px!important;min-height:22px!important;flex:0 0 22px;margin:2px 0 0!important;accent-color:#707762}
MAIN .ct-check span{font-size:15px!important;line-height:1.5!important;color:#050505!important}
MAIN .ct-check a{color:#050505!important;text-decoration:underline!important;text-underline-offset:3px}
MAIN .ct-submit{display:flex!important;align-items:center;justify-content:center;min-height:50px!important;width:100%!important;max-width:100%;padding:13px 20px!important;margin:0!important;background:#707762!important;color:#E7E3DA!important;border:1px solid #707762!important;border-radius:4px!important;font-size:19px!important;font-weight:800!important;line-height:1.4!important;cursor:pointer;box-shadow:none!important;white-space:normal!important}
MAIN .ct-form .ct-note{font-size:13px!important;line-height:1.5!important;color:#34382f!important;margin:0!important}
MAIN .su-boundary{display:flex!important;align-items:center;gap:15px;max-width:1176px!important;margin:0 auto 22px!important;padding:17px 23px!important;background:#707762!important;color:#E7E3DA!important;border:0!important;border-radius:5px!important}
MAIN .su-boundary svg{width:30px;height:30px;flex:0 0 30px}
MAIN .su-boundary p{font-size:19px!important;font-weight:800!important;line-height:1.4!important;color:#E7E3DA!important;margin:0!important;padding:0!important}
MAIN .su-details{max-width:1240px!important;margin:0 auto!important;padding:0 32px!important;background:transparent!important;border:0!important}
MAIN .ct-details{padding:22px 24px!important;margin:0!important;background:#050505!important;color:#E7E3DA!important;border:1px solid #707762!important;border-radius:6px!important}
MAIN .ct-details-head :is(.ct-eyebrow,h2){color:#E7E3DA!important;padding:0!important;margin:0 0 10px!important}
MAIN .ct-details-head .ct-eyebrow{font-size:12px!important;font-weight:800!important;letter-spacing:.1em!important;line-height:1.4!important}
MAIN .ct-details h2{font-size:26px!important;line-height:1.2!important;font-weight:800!important}
MAIN .ct-contact-list{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:22px;padding:0!important;margin:20px 0 0!important;border:0!important;background:transparent!important}
MAIN .ct-contact{display:block!important;padding:0!important;margin:0!important;border:0!important;background:transparent!important;color:#E7E3DA!important}
MAIN .ct-contact :is(span,strong,p,a){display:block;color:#E7E3DA!important;background:transparent!important;margin:0 0 7px!important;padding:0!important;font-size:15px!important;line-height:1.5!important}
MAIN .ct-contact span{font-size:12px!important;font-weight:800!important;color:#c3c9b8!important}
MAIN .ct-contact a{display:inline-flex!important;align-items:center;min-height:44px;font-weight:800;text-decoration:underline!important;text-underline-offset:3px}
@media(max-width:850px){MAIN .sp-support-hero{padding:28px 24px 23px!important;grid-template-columns:minmax(0,1fr) 80px;gap:20px}MAIN .sp-support-symbol{width:76px!important}MAIN .sp-support-body{padding:0 24px!important}MAIN .sp-support-body :is(.authority-grid-v65,.press-grid-v3b2){grid-template-columns:1fr!important}MAIN .su-layout{padding:28px 24px 22px!important;gap:26px;grid-template-columns:.9fr 1.1fr}MAIN .ct-form-card{padding:23px!important}MAIN .su-envelope{width:130px!important}MAIN .su-boundary{margin-left:24px!important;margin-right:24px!important}MAIN .su-details{padding:0 24px!important}}
@media(max-width:600px){MAIN{padding-bottom:25px!important}MAIN .sp-support-hero{grid-template-columns:minmax(0,1fr) 48px;padding:26px 18px 22px!important;gap:14px;align-items:start}MAIN .sp-support-symbol{width:46px!important;margin-top:5px!important}MAIN h1{font-size:35px!important;line-height:1.07!important;margin-bottom:16px!important}MAIN .sp-support-hero p{font-size:16px!important;line-height:1.5!important}MAIN .sp-support-body{padding:0 18px!important;gap:13px}MAIN .sp-support-body :is(.promise-grid-v3b1,.grid2){grid-template-columns:1fr!important}MAIN .sp-support-body h2{font-size:24px!important}MAIN .sp-support-body :is(.authority-grid-v65>article,.press-card-v3b2,.promise-card-v3b1,.grid2>div,.partner-placeholder,.mass-reading){padding:21px 19px!important}MAIN .sp-support-body :is(p,li){font-size:15px!important}MAIN .su-layout{display:flex!important;flex-direction:column;align-items:stretch;gap:23px;padding:26px 18px 20px!important}MAIN .su-introduction h1{font-size:36px!important}MAIN .su-introduction p{font-size:16px!important}MAIN .su-envelope{width:105px!important;margin:19px 0 0!important}MAIN .ct-form-card{padding:23px 20px!important}MAIN .su-boundary{margin:0 18px 19px!important;padding:17px 18px!important;align-items:flex-start}MAIN .su-boundary p{font-size:19px!important}MAIN .su-details{padding:0 18px!important}MAIN .ct-contact-list{grid-template-columns:1fr!important;gap:18px}MAIN .ct-details{padding:22px 20px!important}MAIN .ct-contact{border-top:1px solid #414735!important;padding-top:15px!important}}
`;
