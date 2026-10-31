export const css=String.raw`
MAIN{background:#050505!important;color:#E7E3DA!important;width:100%!important;max-width:none!important;margin:0!important;padding:0 0 48px!important;font-family:Arial,Helvetica,sans-serif!important;overflow:clip}
MAIN *{box-sizing:border-box!important;font-family:Arial,Helvetica,sans-serif!important;-webkit-text-fill-color:currentColor!important;min-width:0!important;letter-spacing:normal!important;text-transform:none!important}
MAIN :is(section,article,div,aside,figure){min-height:0!important;height:auto!important;box-shadow:none!important;border-radius:0!important;position:static!important}
MAIN :is(section,article,div,aside):before,MAIN :is(section,article,div,aside):after{content:none!important;display:none!important}
MAIN :is(h1,h2,h3,p,ul,ol,figure){margin:0!important;padding:0!important;max-width:none!important;transform:none!important;opacity:1!important;visibility:visible!important}
MAIN :is(h1,h2,h3,p,li,a,span,strong,small,code){color:inherit!important}
MAIN a{overflow-wrap:anywhere;text-underline-offset:4px!important}
MAIN :is(a,summary,button):focus-visible{outline:3px solid #9cac86!important;outline-offset:5px!important}
MAIN :is(.wrap,.mass-inner){width:100%!important;max-width:none!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important}
MAIN .qr-breadcrumbs{max-width:1280px!important;margin:0 auto!important;padding:18px 32px 0!important;font-size:13px!important;color:#c0c3b8!important;background:transparent!important}
MAIN .qr-breadcrumbs nav{display:block!important;margin:0!important;padding:0!important;background:transparent!important}
MAIN .qr-hero{max-width:1280px!important;margin:0 auto!important;padding:34px 32px 30px!important;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:38px!important;align-items:center!important;background:transparent!important;border:0!important}
MAIN .qr-hero-copy{display:block!important;padding:0!important;background:transparent!important;border:0!important}
MAIN .qr-hero h1{font-weight:800!important;font-size:clamp(39px,4.3vw,62px)!important;line-height:1.02!important;letter-spacing:-.045em!important;max-width:690px!important;color:#E7E3DA!important;margin:0 0 20px!important;overflow-wrap:normal!important;word-break:normal!important;hyphens:none!important}
MAIN .qr-hero h1 :is(span,em){background:none!important;color:inherit!important}
MAIN .qr-hero p{font-size:18px!important;line-height:1.5!important;color:#d7d7ce!important;margin:0 0 14px!important;max-width:610px!important}
MAIN .qr-hero p:last-child{margin-bottom:0!important}
MAIN .qr-hero :is(.eyebrow,.ct-eyebrow){font-size:11px!important;line-height:1.4!important;font-weight:800!important;letter-spacing:.14em!important;color:#c2cbb3!important;margin:0 0 18px!important}
MAIN .qr-hero .byline-v12{font-size:12px!important;line-height:1.6!important;color:#b9beb2!important;margin:0 0 15px!important;max-width:480px!important}
MAIN .qr-photo{display:block!important;width:100%!important;aspect-ratio:3/2!important;overflow:hidden!important;background:#23251f!important;border:0!important;margin:0!important}
MAIN .qr-photo img{display:block!important;width:100%!important;height:100%!important;aspect-ratio:3/2!important;object-fit:cover!important;object-position:center!important;margin:0!important;max-width:none!important;border:0!important;border-radius:0!important}
MAIN .qr-body{max-width:1280px!important;margin:0 auto!important;padding:0 32px!important;background:transparent!important;border:0!important}
MAIN .qr-sections{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:0 34px!important;background:transparent!important;padding:0!important;margin:0!important;border:0!important}
MAIN .qr-block{grid-column:1/-1!important;background:transparent!important;border:0!important;padding:0!important;margin:0!important}
MAIN .qr-section{display:block!important;background:transparent!important;border:0!important;border-top:1px solid #3f4338!important;padding:27px 0 29px!important;margin:0!important;align-self:stretch!important}
MAIN .qr-wide{grid-column:1/-1!important}
MAIN .qr-section-title{display:flex!important;gap:18px!important;align-items:flex-start!important;background:transparent!important;border:0!important;padding:0!important;margin:0 0 15px!important}
MAIN .qr-section-no{display:inline-block!important;flex:0 0 30px!important;font-size:13px!important;line-height:1.5!important;font-weight:700!important;color:#aeb99d!important;margin-top:4px!important}
MAIN h2{font-size:25px!important;line-height:1.17!important;letter-spacing:-.025em!important;font-weight:800!important;color:#E7E3DA!important;margin:0!important}
MAIN h3{font-size:21px!important;line-height:1.2!important;letter-spacing:-.02em!important;font-weight:800!important;margin:0 0 12px!important}
MAIN .qr-section-detail{padding:0 0 0 48px!important;background:transparent!important;border:0!important;margin:0!important}
MAIN .qr-body :is(p,li){font-size:16px!important;line-height:1.65!important;color:inherit!important}
MAIN .qr-body p{margin:0 0 15px!important}
MAIN .qr-body p:last-child{margin-bottom:0!important}
MAIN .qr-body ul{padding-left:20px!important;margin:8px 0 16px!important;list-style:disc!important}
MAIN .qr-body li{margin-bottom:9px!important}
MAIN .qr-body code{overflow-wrap:anywhere!important;font-size:14px!important;background:#25291f!important;padding:2px 5px!important;border:0!important;color:#E7E3DA!important}
MAIN .qr-feature{grid-column:1/-1!important;padding:32px!important;background:#E7E3DA!important;color:#050505!important;margin:2px 0 28px!important;border:0!important;display:grid!important;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)!important;gap:32px!important}
MAIN .qr-feature :is(h2,h3,p,a,strong,li){color:#050505!important}
MAIN .qr-feature .qr-section-title{margin:0!important}
MAIN .qr-feature .qr-section-no{color:#626c51!important}
MAIN .qr-feature h2{font-size:30px!important;line-height:1.13!important}
MAIN .qr-feature .qr-section-detail{padding:0!important}
MAIN .qr-feature p{font-size:18px!important;line-height:1.6!important}
MAIN .qr-sources{padding:26px 0!important}
MAIN .qr-sources ul{columns:2;column-gap:32px}
MAIN .qr-sources li{break-inside:avoid;font-size:14px!important;line-height:1.6!important;margin-bottom:13px!important}
MAIN .qr-index{border:1px solid #4a5140!important;background:#11140e!important;color:#E7E3DA!important;margin:0 0 28px!important;padding:0 22px!important}
MAIN .qr-index summary{display:flex!important;justify-content:space-between;align-items:center;cursor:pointer;list-style:none;font-size:14px!important;font-weight:700!important;min-height:54px!important;padding:10px 0!important}
MAIN .qr-index summary::-webkit-details-marker{display:none}
MAIN .qr-index summary span{font-size:24px!important;font-weight:400!important}
MAIN .qr-index nav{display:grid!important;grid-template-columns:1fr 1fr!important;gap:0 25px!important;border-top:1px solid #3e4536!important;padding:12px 0 17px!important;background:transparent!important}
MAIN .qr-index a{display:flex!important;align-items:center!important;min-height:44px!important;font-size:14px!important;line-height:1.4!important;padding:8px 0!important}
MAIN :is(h2,h3)[id]{scroll-margin-top:110px!important}
MAIN :is(.principle-grid-v65,.authority-grid-v65,.press-grid-v3b2,.promise-grid-v3b1,.find-tree,.grid2){display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:16px!important;background:transparent!important;margin:0 0 28px!important;padding:0!important;border:0!important;counter-reset:qr-card}
MAIN :is(.promise-grid-v3b1,.find-tree,.grid2){grid-template-columns:repeat(2,minmax(0,1fr))!important}
MAIN :is(.principle-grid-v65>article,.authority-grid-v65>article,.press-card-v3b2,.promise-card-v3b1,.find-tree>.node,.grid2>div){display:block!important;counter-increment:qr-card;background:#E7E3DA!important;color:#050505!important;padding:28px!important;margin:0!important;border:0!important;border-radius:0!important;min-height:0!important;height:auto!important}
MAIN :is(.principle-grid-v65>article,.authority-grid-v65>article,.press-card-v3b2,.promise-card-v3b1,.find-tree>.node,.grid2>div):before{content:counter(qr-card,decimal-leading-zero)!important;display:block!important;color:#626c51!important;font-size:13px!important;line-height:1.4!important;font-weight:700!important;margin:0 0 28px!important;position:static!important;transform:none!important;inset:auto!important;width:auto!important;height:auto!important;background:none!important;border:0!important}
MAIN :is(.principle-grid-v65>article,.authority-grid-v65>article,.press-card-v3b2,.promise-card-v3b1,.find-tree>.node,.grid2>div) :is(h2,h3,p,strong,li,a,.eyebrow){color:#050505!important}
MAIN :is(.principle-grid-v65>article,.authority-grid-v65>article,.press-card-v3b2,.promise-card-v3b1,.find-tree>.node,.grid2>div) :is(h2,h3,strong){font-size:23px!important;line-height:1.15!important;font-weight:800!important;display:block!important;margin:0 0 15px!important}
MAIN :is(.principle-grid-v65>article,.authority-grid-v65>article,.press-card-v3b2,.promise-card-v3b1,.find-tree>.node,.grid2>div) p{font-size:15px!important;line-height:1.65!important}
MAIN .promise-card-v3b1:last-child{grid-column:1/-1!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:0 32px!important}
MAIN .promise-card-v3b1:last-child:before{grid-column:1/-1!important}
MAIN .promise-card-v3b1:last-child p{margin:0!important}
MAIN :is(.mot-method,.press-fact-v3b2){background:transparent!important;border:0!important;padding:0!important;margin:0!important;color:inherit!important}
MAIN :is(.find-banner,.road-banner,.mot-banner,.med2-banner,.trust-statement,.commercial-cta-v3b1,.join-conversation-v2223){padding:29px 32px!important;margin:24px 0!important;background:#242a1d!important;color:#E7E3DA!important;border:0!important;border-left:4px solid #a9b795!important;border-radius:0!important;display:block!important}
MAIN :is(.find-banner,.road-banner,.mot-banner,.med2-banner,.trust-statement,.commercial-cta-v3b1,.join-conversation-v2223) :is(h2,h3){color:#E7E3DA!important;font-size:28px!important;margin:0 0 13px!important}
MAIN :is(.find-banner,.road-banner,.mot-banner,.med2-banner,.trust-statement,.commercial-cta-v3b1,.join-conversation-v2223) p{color:#E7E3DA!important}
MAIN .editorial-note-v2222{padding:24px 0!important;margin:22px 0 0!important;border:0!important;border-top:1px solid #414739!important;background:transparent!important;color:#c6cabc!important}
MAIN .editorial-note-v2222 h3{font-size:14px!important;letter-spacing:.02em!important;margin-bottom:9px!important}
MAIN .editorial-note-v2222 p{font-size:14px!important;line-height:1.6!important}
MAIN :is(.sourcebox,.source-box){background:transparent!important;color:#c6cabc!important;border:0!important;border-top:1px solid #414739!important;margin:22px 0 0!important;padding:22px 0!important;font-size:14px!important;line-height:1.6!important}
MAIN :is(.sourcebox,.source-box) :is(h2,h3){font-size:16px!important;margin:0 0 12px!important}
MAIN #partner-boundary-v42l{background:#E7E3DA!important;color:#050505!important;padding:32px!important;margin:0 0 24px!important;border:0!important}
MAIN #partner-boundary-v42l h2{color:#050505!important;font-size:30px!important;max-width:680px!important;margin:9px 0 18px!important}
MAIN #partner-boundary-v42l p{color:#050505!important;max-width:900px!important}
MAIN .partner-placeholder{background:transparent!important;border:1px solid #515846!important;color:#E7E3DA!important;padding:32px!important;margin:0 0 24px!important}
MAIN .partner-placeholder h3{font-size:36px!important;letter-spacing:-.035em!important;margin-bottom:16px!important}
MAIN .trust-actions-v42l{display:flex!important;gap:10px!important;flex-wrap:wrap!important;margin:22px 0 0!important;padding:0!important;background:transparent!important}
MAIN .qr-body :is(a.btn,a.btn-primary){display:inline-flex!important;align-items:center!important;justify-content:center!important;width:auto!important;min-height:48px!important;padding:12px 19px!important;margin:6px 8px 6px 0!important;background:#E7E3DA!important;color:#050505!important;border:1px solid #E7E3DA!important;border-radius:2px!important;text-decoration:none!important;font-size:15px!important;line-height:1.4!important;font-weight:700!important;white-space:normal!important;max-width:100%!important;box-shadow:none!important}
MAIN :is(#partner-boundary-v42l,.grid2>div,.principle-grid-v65>article,.authority-grid-v65>article,.press-card-v3b2) a.btn{background:#050505!important;border-color:#050505!important;color:#E7E3DA!important}
MAIN .eyebrow{font-size:11px!important;font-weight:800!important;line-height:1.5!important;letter-spacing:.12em!important;margin:0 0 12px!important}
MAIN[data-approved-pages="advertising"] .qr-block:first-child>p:first-child{background:#E7E3DA!important;color:#050505!important;padding:34px!important;font-size:25px!important;line-height:1.5!important;margin:0 0 20px!important;letter-spacing:-.02em!important}
MAIN[data-approved-pages="reviews"] .qr-section:nth-child(2) ul{list-style:none!important;padding:0!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:14px!important;counter-reset:review}
MAIN[data-approved-pages="reviews"] .qr-section:nth-child(2) li{background:#E7E3DA!important;color:#050505!important;padding:23px!important;margin:0!important;font-size:17px!important;line-height:1.45!important;counter-increment:review}
MAIN[data-approved-pages="reviews"] .qr-section:nth-child(2) li:before{content:counter(review,decimal-leading-zero);display:block;color:#626c51;font-size:12px;font-weight:700;margin-bottom:26px}
MAIN[data-approved-pages="media"] .qr-block:first-child>p{font-size:22px!important;line-height:1.5!important;max-width:840px!important;margin:0 0 20px!important}
MAIN .qr-graphic{width:100%!important;min-height:360px!important;display:flex!important;flex-direction:column!important;justify-content:space-between!important;padding:30px!important;background:#E7E3DA!important;color:#050505!important;position:relative!important;overflow:hidden!important;border:0!important}
MAIN .qr-graphic p{color:#050505!important;font-size:14px!important;line-height:1.5!important;margin:0!important}
MAIN .qr-micro{font-size:10px!important;font-weight:800!important;letter-spacing:.13em!important;line-height:1.5!important;margin:0 0 16px!important}
MAIN .qr-graphic .qr-micro{font-size:10px!important}
MAIN .qr-statement-type{font-size:clamp(50px,5.2vw,76px)!important;line-height:.98!important;letter-spacing:-.06em!important;font-weight:800!important;margin:16px 0 22px!important}
MAIN .qr-statement-type em,MAIN .qr-press-word em{font-style:normal!important;color:#626c51!important;letter-spacing:inherit!important}
MAIN .qr-statement-rule{height:3px!important;width:72px!important;background:#626c51!important;margin:0 0 18px!important}
MAIN .qr-graphic .qr-graphic-foot{font-size:13px!important;line-height:1.5!important}
MAIN .qr-route-origin{display:block!important;background:#050505!important;color:#E7E3DA!important;padding:13px!important;text-align:center;font-size:16px!important;font-weight:700!important;margin:12px 0 0!important}
MAIN .qr-route-lines{height:22px!important;width:1px!important;background:#626c51!important;align-self:center!important}
MAIN .qr-route-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin:0 0 19px!important}
MAIN .qr-route-grid>div{padding:14px!important;border:1px solid #9a9d90!important;background:transparent!important}
MAIN .qr-route-no{display:block!important;font-size:10px!important;color:#626c51!important;margin-bottom:10px!important;font-weight:700!important}
MAIN .qr-route-grid strong{display:block!important;font-size:19px!important;line-height:1.2!important;letter-spacing:-.02em!important}
MAIN .qr-evidence-stack{display:grid!important;gap:12px!important;margin:20px 0!important}
MAIN .qr-evidence-stack>div{display:flex!important;align-items:center!important;gap:18px!important;border-bottom:1px solid #999e8e!important;padding:14px 0!important}
MAIN .qr-evidence-stack span{font-size:11px!important;font-weight:700!important;color:#626c51!important}
MAIN .qr-evidence-stack strong{font-size:24px!important;line-height:1.15!important;letter-spacing:-.025em!important}
MAIN .qr-press-word{font-size:clamp(55px,5.4vw,80px)!important;line-height:.98!important;letter-spacing:-.055em!important;font-weight:800!important;margin:20px 0 25px!important}
MAIN .qr-press-tags{display:flex!important;gap:8px!important;flex-wrap:wrap!important;margin:0 0 25px!important}
MAIN .qr-press-tags span{border:1px solid #929988!important;font-size:11px!important;padding:6px 9px!important}
MAIN .qr-timeline{background:#E7E3DA!important;color:#050505!important;padding:26px 32px!important;margin:0 0 26px!important}
MAIN .qr-timeline>div{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:26px!important;border-top:1px solid #838b78!important;margin:20px 0!important;padding:20px 0 0!important}
MAIN .qr-timeline span{display:flex!important;align-items:baseline!important;gap:10px!important}
MAIN .qr-timeline strong{font-size:52px!important;font-weight:800!important;letter-spacing:-.06em!important;line-height:1!important}
MAIN .qr-timeline small{font-size:14px!important}
MAIN .qr-timeline p{color:#050505!important;font-size:14px!important;line-height:1.5!important}
MAIN .qr-timeline .qr-micro{font-size:11px!important}
MAIN .sst-service-bridge{display:grid!important;grid-template-columns:minmax(0,1.8fr) minmax(0,1fr)!important;gap:28px!important;max-width:none!important;width:100%!important;padding:30px!important;margin:30px 0 0!important;background:#171c12!important;color:#E7E3DA!important;border:1px solid #48503d!important}
MAIN .sst-service-bridge :is(div,p,h2,strong,span){background:transparent!important;border:0!important;margin:0!important;padding:0!important;white-space:normal!important;overflow-wrap:anywhere!important;color:#E7E3DA!important}
MAIN .sst-service-bridge__main{display:block!important}
MAIN .sst-service-bridge .sst-service-bridge__kicker{font-size:10px!important;font-weight:800!important;letter-spacing:.13em!important;margin:0 0 12px!important}
MAIN .sst-service-bridge h2{font-size:27px!important;line-height:1.18!important;margin:0 0 16px!important}
MAIN .sst-service-bridge p{font-size:15px!important;line-height:1.65!important}
MAIN .sst-service-bridge .sst-service-bridge__limits{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:20px!important;margin:22px 0 0!important;padding:19px 0 0!important;border-top:1px solid #48503d!important}
MAIN .sst-service-bridge .sst-service-bridge__limit{display:block!important}
MAIN .sst-service-bridge__limit strong{display:block!important;font-size:11px!important;font-weight:700!important;line-height:1.45!important;letter-spacing:.04em!important;margin:0 0 8px!important}
MAIN .sst-service-bridge__limit span{display:block!important;font-size:14px!important;line-height:1.6!important}
MAIN .sst-service-bridge .sst-service-bridge__action{display:flex!important;flex-direction:column!important;justify-content:center!important;gap:18px!important;align-items:flex-start!important;padding:0 0 0 28px!important;border-left:1px solid #48503d!important}
MAIN .sst-service-bridge__action p{font-weight:700!important}
MAIN .sst-service-bridge .sst-service-bridge__cta{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:48px!important;padding:12px 17px!important;background:#E7E3DA!important;color:#050505!important;border:1px solid #E7E3DA!important;border-radius:2px!important;text-decoration:none!important;font-size:14px!important;font-weight:700!important;line-height:1.4!important;white-space:normal!important}
@media(max-width:700px){MAIN .sst-service-bridge{grid-template-columns:1fr!important;padding:24px!important;gap:23px!important;margin-top:25px!important}MAIN .sst-service-bridge h2{font-size:25px!important}MAIN .sst-service-bridge .sst-service-bridge__action{padding:21px 0 0!important;border-left:0!important;border-top:1px solid #48503d!important}MAIN .sst-service-bridge .sst-service-bridge__limits{grid-template-columns:1fr!important;gap:18px!important}}
@media(max-width:1000px){MAIN .qr-hero{gap:25px!important}MAIN .qr-hero h1{font-size:43px!important}MAIN .qr-graphic{padding:24px!important;min-height:330px!important}MAIN :is(.principle-grid-v65,.authority-grid-v65,.press-grid-v3b2){grid-template-columns:repeat(2,minmax(0,1fr))!important}MAIN .authority-grid-v65>article:last-child,MAIN .press-card-v3b2:last-child{grid-column:1/-1!important}MAIN .qr-feature{grid-template-columns:1fr 1.2fr!important;gap:23px!important;padding:26px!important}MAIN .qr-feature h2{font-size:27px!important}}
@media(max-width:700px){MAIN{padding-bottom:30px!important}MAIN .qr-breadcrumbs{padding:16px 18px 0!important;font-size:12px!important}MAIN .qr-hero{grid-template-columns:1fr!important;gap:24px!important;padding:26px 18px 26px!important}MAIN .qr-hero h1{font-size:39px!important;line-height:1.04!important;letter-spacing:-.04em!important;margin:0 0 16px!important}MAIN .qr-hero p{font-size:16px!important;line-height:1.55!important}MAIN .qr-hero .eyebrow{font-size:10px!important;margin-bottom:16px!important}MAIN .qr-hero .byline-v12{font-size:11px!important;line-height:1.6!important;margin-bottom:12px!important}MAIN .qr-photo{aspect-ratio:3/2!important}MAIN .qr-graphic{min-height:0!important;padding:25px!important;max-width:none!important}MAIN .qr-statement-type{font-size:58px!important;line-height:.98!important;margin:17px 0 24px!important}MAIN .qr-graphic .qr-micro{font-size:10px!important}MAIN .qr-route-grid{gap:10px!important}MAIN .qr-route-grid>div{padding:14px!important}MAIN .qr-route-grid strong{font-size:18px!important}MAIN .qr-press-word{font-size:64px!important}MAIN .qr-evidence-stack strong{font-size:22px!important}MAIN .qr-body{padding:0 18px!important}MAIN .qr-sections{grid-template-columns:1fr!important;gap:0!important}MAIN .qr-section{padding:24px 0!important}MAIN .qr-section-title{gap:12px!important;margin-bottom:13px!important}MAIN .qr-section-no{flex-basis:23px!important;font-size:11px!important;margin-top:5px!important}MAIN h2{font-size:24px!important;line-height:1.19!important}MAIN h3{font-size:21px!important}MAIN .qr-section-detail{padding-left:35px!important}MAIN .qr-body :is(p,li){font-size:15px!important;line-height:1.65!important}MAIN .qr-feature{display:block!important;padding:25px!important;margin:0 0 20px!important}MAIN .qr-feature .qr-section-title{margin-bottom:17px!important}MAIN .qr-feature h2{font-size:28px!important;line-height:1.14!important}MAIN .qr-feature .qr-section-detail{padding:0!important}MAIN .qr-feature p{font-size:16px!important;line-height:1.6!important}MAIN .qr-index{padding:0 17px!important;margin-bottom:20px!important}MAIN .qr-index nav{grid-template-columns:1fr!important}MAIN .qr-sources ul{columns:1}MAIN :is(.principle-grid-v65,.authority-grid-v65,.press-grid-v3b2,.promise-grid-v3b1,.find-tree,.grid2){grid-template-columns:1fr!important;gap:14px!important;margin-bottom:21px!important}MAIN :is(.principle-grid-v65>article,.authority-grid-v65>article,.press-card-v3b2,.promise-card-v3b1,.find-tree>.node,.grid2>div){padding:25px!important}MAIN :is(.principle-grid-v65>article,.authority-grid-v65>article,.press-card-v3b2,.promise-card-v3b1,.find-tree>.node,.grid2>div):before{margin-bottom:21px!important}MAIN .promise-card-v3b1:last-child{display:block!important}MAIN :is(.find-banner,.road-banner,.mot-banner,.med2-banner,.trust-statement,.commercial-cta-v3b1,.join-conversation-v2223){padding:25px!important;margin:23px 0!important}MAIN :is(.find-banner,.road-banner,.mot-banner,.med2-banner,.trust-statement,.commercial-cta-v3b1,.join-conversation-v2223) :is(h2,h3){font-size:25px!important}MAIN #partner-boundary-v42l{padding:25px!important}MAIN #partner-boundary-v42l h2{font-size:27px!important}MAIN .partner-placeholder{padding:25px!important}MAIN .partner-placeholder h3{font-size:31px!important}MAIN .trust-actions-v42l{display:grid!important;grid-template-columns:1fr!important;gap:8px!important}MAIN .trust-actions-v42l a.btn{width:100%!important;margin:0!important}MAIN[data-approved-pages="reviews"] .qr-section:nth-child(2) ul{grid-template-columns:1fr!important}MAIN[data-approved-pages="advertising"] .qr-block:first-child>p:first-child{padding:26px!important;font-size:22px!important;line-height:1.5!important}MAIN[data-approved-pages="media"] .qr-block:first-child>p{font-size:20px!important}MAIN .qr-timeline{padding:25px!important}MAIN .qr-timeline>div{gap:14px!important;margin:18px 0!important}MAIN .qr-timeline span{display:block!important}MAIN .qr-timeline strong{display:block!important;font-size:43px!important;margin-bottom:7px!important}MAIN .qr-timeline small{font-size:12px!important}}
`;
