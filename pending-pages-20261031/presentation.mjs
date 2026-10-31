import {assets} from './config.mjs';
const arrow='<span aria-hidden="true">→</span>';
const button=(href,text)=>`<a class="sp-button" href="${href}">${text}${arrow}</a>`;
const link=(href,text)=>`<a class="sp-link" href="${href}">${text}${arrow}</a>`;
const head=(eyebrow,title,lede,id)=>`<p class="sp-eyebrow">${eyebrow}</p><h1 id="${id}">${title}</h1><p class="sp-lede">${lede}</p>`;
const step=(href,title,text)=>`<a class="sp-step" href="${href}"><span><strong>${title}</strong><span>${text}</span></span>${arrow}</a>`;
export function hero(key){
 if(key==='support')return `<section class="sp-hero sp-fs1" aria-labelledby="nhh-title-free-support"><div class="sp-copy">${head('FREE MY TIMBER SUPPORT','Weight-loss support.<br>For the week you have.','Food, movement and useful small steps, with free My Timber support before, during and after treatment.','nhh-title-free-support')}<div class="sp-actions">${button('https://shiftsometimber.co.uk/member/dashboard','Explore free My Timber')}${link('#awareness-first-step','Find one useful step')}</div></div><aside class="sp-panel"><h2>Free support.<br>No medicine purchase.</h2><ul class="sp-ticks"><li>Taking treatment elsewhere</li><li>Between providers or after treatment</li><li>Not taking medication</li></ul><div class="sp-panel-note"><p>No purchase needed.<br>Your treatment can be elsewhere.<br>Your support can be here.</p><p>Practical support. Medicine decisions stay with your prescriber.</p></div></aside></section>`;
 if(key==='partner')return `<section class="sp-hero sp-pw2" aria-labelledby="nhh-title-partner-with-us"><div class="sp-copy">${head('PARTNER WITH SHIFT','Partnerships with<br>a useful purpose.','Understand the fit, the responsibilities and how a product or service could make the platform better for the men using it.','nhh-title-partner-with-us')}<div class="sp-actions">${button('https://shiftsometimber.co.uk/contact?type=Partnership#contact-form','Explore a partnership')}${link('/commercial-principles','Read our Commercial Principles')}</div><p class="sp-note">Partnership information and enquiries.</p></div><figure class="sp-photo"><img src="${assets[0]}" alt="Three adults talking over tea in a community clubhouse. Illustrative image." width="1536" height="1024" fetchpriority="high" decoding="async"></figure></section><section class="sp-benefits" aria-label="A useful partnership"><div><strong>A clear fit</strong><p>Partnerships that align with our purpose and are relevant to the men using the platform.</p></div><div><strong>Useful products</strong><p>Practical, credible products and services that make the platform better.</p></div><div><strong>Responsible delivery</strong><p>Clear roles, honest communication and a focus on long-term value.</p></div></section><nav class="sp-category-links" aria-label="Explore partnership opportunities"><h2>Where could you fit?</h2><p>Select a category to read about the opportunity.</p>${['Charities &amp; community','Clinicians','Employers','Pharmacy / prescribing','Referral partners','Research','Sport','Technology'].map((x,i)=>link('#sp-partner-'+i,x)).join('')}</nav>`;
 if(key==='obesity')return `<section class="sp-hero sp-mo3" aria-labelledby="nhh-title-male-obesity"><div class="sp-copy">${head('WEIGHT AND HEALTH','Male obesity. A useful next step.','Weight is part of the picture. Understand the health context, explore the options and choose a practical place to start.','nhh-title-male-obesity')}<p class="sp-emphasis">You do not need another lecture.</p><div class="sp-actions">${button('#first-step','Find one useful step')}${link('#healthcare','Prepare a healthcare conversation')}</div><p class="sp-note">For adults. General information, not a diagnosis or personal treatment plan.</p></div><section class="sp-start-panel" aria-labelledby="sp-start-title"><div class="sp-start-copy"><h2 id="sp-start-title">Start with the part that matters to you.</h2>${step('#measurements','Understand your measurements','Look at what your measurements can tell you and how they fit into the bigger picture.')}${step('#healthcare','Prepare a healthcare question','Get clear on what you want to ask and how to have a useful conversation.')}${step('#choose-next','Choose one practical step','Explore sensible options and find a next step that fits your situation.')}</div><figure class="sp-photo"><img src="${assets[1]}" alt="A man making a cup of tea at home. Illustrative image." width="1024" height="1536" fetchpriority="high" decoding="async"></figure></section><a class="sp-link sp-extra" href="#choose-next">Explore your next step ${arrow}</a></section>`;
 if(key==='comparison')return `<section class="sp-hero sp-tc2" aria-labelledby="nhh-title-treatment-comparison"><div class="sp-copy">${head('COMPARE WEIGHT-LOSS TREATMENTS','Weight-loss treatment.<br>Compare the options.','Understand the different routes and their trade-offs without pretending one answer fits every man.','nhh-title-treatment-comparison')}<div class="sp-actions">${button('#mounjaro-vs-wegovy','Compare treatment options')}${link('#sp-questions','Prepare your questions')}</div><p class="sp-note">General information. A qualified prescriber decides individual suitability.</p></div><div class="sp-comparison-grid"><aside class="sp-panel" id="sp-questions"><h2>A better-informed conversation</h2><p>These prompts can help you get clear on what matters to you before comparing options.</p><dl><dt>What fits my routine?</dt><dd>Think about how each option might fit with your day-to-day life.</dd><dt>What are the trade-offs?</dt><dd>Consider the potential benefits and downsides for you.</dd><dt>What should I ask?</dt><dd>Use these comparisons to help shape your questions with a prescriber.</dd></dl></aside><nav class="sp-comparison-topics" aria-label="Choose a comparison"><h2>Choose a comparison</h2><p>Explore our guides to understand the key differences and what to think about.</p>${step('#mounjaro-vs-wegovy','Mounjaro versus Wegovy','Compare the key differences to consider.')}${step('#wegovy-pill-vs-foundayo','Wegovy pill versus Foundayo','Look at how these options differ in practice.')}${step('#tablets-vs-injections','Tablets versus injections','Explore the pros and cons of each approach.')}${step('#medication-versus-surgery','Medication versus surgery','Understand the main differences and trade-offs.')}${link('#how-this-comparison-is-governed','How this comparison is governed')}</nav></div></section>`;
 throw Error('Unsupported approved design '+key);
}
const baseCSS=String.raw`
MAIN{--sp-black:#050505;--sp-cream:#E7E3DA;--sp-ash:#707762;background:#050505!important;color:#E7E3DA!important;padding:0!important;margin:0!important;width:100%!important;max-width:none!important;font-family:Arial,Helvetica,sans-serif!important;overflow:clip}
MAIN *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif!important;-webkit-text-fill-color:currentColor!important}
MAIN :is(h1,h2,h3,p,figure,blockquote){text-transform:none;letter-spacing:normal}
MAIN :is(a,button,input,select,textarea):focus-visible{outline:3px solid #b9c59b!important;outline-offset:4px}
MAIN :is([id],a,button){scroll-margin-top:110px!important}
MAIN .sp-hero{position:relative;display:block;max-width:1280px!important;margin:0 auto!important;padding:38px 32px 28px!important;background:#050505!important;color:#E7E3DA!important;min-height:0!important;border:0!important;box-shadow:none!important;border-radius:0!important}
MAIN .sp-copy{min-width:0;align-self:center}
MAIN .sp-eyebrow{font-size:12px!important;font-weight:800!important;letter-spacing:.12em!important;color:#b4bd9c!important;line-height:1.4!important;margin:0 0 17px!important}
MAIN .sp-hero h1{display:block!important;font-size:clamp(36px,4vw,57px)!important;line-height:1.05!important;letter-spacing:-.04em!important;color:#E7E3DA!important;font-weight:800!important;margin:0 0 20px!important;padding:0!important;max-width:none!important;opacity:1!important;visibility:visible!important;transform:none!important;clip-path:none!important}
MAIN .sp-lede{font-size:19px!important;line-height:1.5!important;max-width:820px!important;color:#E7E3DA!important;margin:0 0 23px!important}
MAIN .sp-actions{display:flex;align-items:center;flex-wrap:wrap;gap:14px 24px}
MAIN .sp-button{display:inline-flex!important;gap:22px;align-items:center;justify-content:center;min-height:48px!important;padding:13px 22px!important;border-radius:4px!important;background:#707762!important;color:#E7E3DA!important;border:1px solid #707762!important;font-size:19px!important;font-weight:700!important;line-height:1.3!important;text-decoration:none!important;box-shadow:none!important;max-width:100%;width:auto!important}
MAIN .sp-button:hover{background:#858d73!important}
MAIN .sp-link{display:inline-flex;gap:10px;align-items:center;min-height:44px;color:#E7E3DA!important;font-size:15px!important;font-weight:700;text-decoration:underline!important;text-underline-offset:4px}
MAIN .sp-note{font-size:12px!important;line-height:1.5!important;color:#c3c6ba!important;margin:17px 0 0!important}
MAIN .sp-panel{background:#E7E3DA!important;color:#050505!important;border-radius:6px;padding:28px!important;min-width:0;border:1px solid #707762!important}
MAIN .sp-panel :is(h2,h3,p,li,dt,dd){color:#050505!important}
MAIN .sp-panel h2{font-size:29px!important;font-weight:800!important;line-height:1.13!important;letter-spacing:-.03em!important;margin:0 0 18px!important}
MAIN .sp-panel p{font-size:15px!important;line-height:1.55!important;margin:0 0 16px!important}
MAIN .sp-fs1{display:grid!important;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:55px;align-items:center}
MAIN .sp-fs1 .sp-actions{align-items:flex-start;flex-direction:column;gap:6px}
MAIN .sp-ticks{list-style:none!important;padding:0!important;margin:26px 0!important}
MAIN .sp-ticks li{position:relative;padding-left:43px!important;margin:0 0 20px!important;font-size:19px!important;line-height:1.35!important}
MAIN .sp-ticks li::before{content:'✓';position:absolute;left:0;top:0;width:29px;height:29px;border-radius:50%;background:#59624b;color:#E7E3DA;text-align:center;font-size:22px;line-height:29px;font-weight:bold}
MAIN .sp-panel-note{padding-top:18px;border-top:1px solid #a6a998}
MAIN .sp-panel-note p:last-child{font-size:12px!important;margin-bottom:0!important}
MAIN :is(.nhh-context,.spp-features,.spp-reading,.mop-contents,.mop-reading,.authority-wrap,.authority-next,.continuity-links,.reading-layout){background:#050505!important;color:#E7E3DA!important;border:0!important;box-shadow:none!important}
MAIN .nhh-context{max-width:1280px!important;padding:18px 32px!important;margin:0 auto!important;min-height:0!important}
MAIN .nhh-context p{font-size:15px!important;line-height:1.6!important;margin:0 0 10px!important;color:#E7E3DA!important}
MAIN .nhh-context a{color:#c1cca6!important}
MAIN .spp-features{max-width:1280px!important;padding:10px 32px 26px!important;margin:auto!important}
MAIN .spp-wrap{max-width:none!important;padding:0!important;margin:auto!important}
MAIN .spp-features section{background:transparent!important;border:0!important;padding:0!important;margin:0!important}
MAIN .spp-features h2{font-size:28px!important;margin:0 0 18px!important;color:#E7E3DA!important}
MAIN .spp-features .continuity-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:15px!important}
MAIN .spp-features .continuity-grid>div{border:1px solid #707762!important;background:#050505!important;color:#E7E3DA!important;padding:20px!important;border-radius:5px!important;box-shadow:none!important}
MAIN .spp-features h3{font-size:20px!important;margin:0 0 10px!important;color:#E7E3DA!important}
MAIN .spp-features p{font-size:14px!important;line-height:1.6!important;color:#E7E3DA!important}
MAIN .spp-features section>p{margin:18px 0 0!important}
MAIN .sp-pw2{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px;align-items:stretch}
MAIN .sp-pw2 .sp-actions{display:flex;align-items:flex-start;flex-direction:column;gap:5px}
MAIN .sp-photo{margin:0!important;min-width:0;overflow:hidden}
MAIN .sp-photo img{display:block;width:100%;height:100%;object-fit:cover}
MAIN .sp-pw2 .sp-photo{min-height:370px;border-radius:4px}
MAIN .sp-pw2 .sp-photo img{object-position:52% center}
MAIN .sp-benefits{max-width:1216px!important;margin:0 auto 24px!important;padding:22px!important;background:#E7E3DA!important;color:#050505!important;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;border-radius:3px}
MAIN .sp-benefits>div{border-right:1px solid #a4a795;padding-right:22px}
MAIN .sp-benefits>div:last-child{border:0}
MAIN .sp-benefits strong{display:block;color:#050505!important;font-size:19px;font-weight:800}
MAIN .sp-benefits p{color:#050505!important;font-size:14px!important;line-height:1.5!important;margin:8px 0 0!important}
MAIN .sp-category-links{max-width:1280px;margin:auto;padding:0 32px 28px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
MAIN .sp-category-links h2{grid-column:1/-1;font-size:29px!important;margin:0!important;color:#E7E3DA!important}
MAIN .sp-category-links p{grid-column:1/-1;margin:0 0 8px!important;font-size:15px!important}
MAIN .sp-category-links a{border:1px solid #707762;border-radius:4px;padding:12px 16px;justify-content:space-between;text-decoration:none!important;font-size:16px!important}
MAIN .reading-layout{padding:0!important;max-width:none!important;margin:0!important;display:block!important}
MAIN .reading-layout>section:not(.sp-hero):not(.sp-benefits){max-width:1216px;margin:0 auto;padding:20px 0;background:#050505!important;color:#E7E3DA!important}
MAIN :is(.sst-reading-grid-v31,.wrap.longread){max-width:100%!important;padding:0!important;margin:0!important;background:#050505!important;color:#E7E3DA!important}
MAIN .partner-grid-v3b2{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:14px!important}
MAIN .partner-card-v3b2{background:#10130d!important;border:1px solid #707762!important;color:#E7E3DA!important;padding:20px!important;border-radius:4px!important}
MAIN .partner-card-v3b2 h3{color:#E7E3DA!important;font-size:20px!important;margin:0 0 10px!important}
MAIN .partner-card-v3b2 p{color:#E7E3DA!important;font-size:15px!important;line-height:1.65!important;margin:0!important}
MAIN .reading-layout>section:not(.sp-hero):not(.sp-benefits) :is(h2,h3,p,li,strong){color:#E7E3DA!important}
MAIN .reading-layout>section:not(.sp-hero):not(.sp-benefits) p{font-size:16px!important;line-height:1.7!important}
MAIN .reading-layout>section:not(.sp-hero):not(.sp-benefits) h2{font-size:29px!important;line-height:1.2!important;margin:0 0 18px!important}
MAIN .download-note-v3b2{background:#15180f!important;color:#E7E3DA!important;border:1px solid #707762!important;padding:20px!important}
MAIN .sp-emphasis{font-size:19px!important;font-weight:700!important;line-height:1.5!important;color:#b6c197!important;margin:-8px 0 20px!important}
MAIN .sp-mo3 .sp-start-panel{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);background:#E7E3DA!important;color:#050505!important;border-radius:6px;overflow:hidden;margin-top:26px!important;padding:0!important;border:0!important}
MAIN .sp-start-copy{padding:27px}
MAIN .sp-start-copy h2{font-size:30px!important;line-height:1.15!important;letter-spacing:-.03em!important;margin:0 0 15px!important;color:#050505!important}
MAIN .sp-step{display:flex;gap:20px;align-items:center;justify-content:space-between;padding:20px 0;color:inherit!important;text-decoration:none!important;border-top:1px solid #a9ab9b;min-width:0}
MAIN .sp-step>span:first-child{min-width:0}
MAIN .sp-step strong{display:block;font-size:19px!important;font-weight:800!important;line-height:1.3!important;color:inherit!important}
MAIN .sp-step span span{display:block;font-size:15px!important;line-height:1.5!important;margin-top:5px;color:inherit!important}
MAIN .sp-step>span:last-child{font-size:24px;flex-shrink:0}
MAIN .sp-mo3 .sp-photo img{object-position:center}
MAIN .sp-mo3 .sp-photo{position:relative;min-height:360px}
MAIN .sp-mo3 .sp-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
MAIN .sp-extra{margin-top:10px}
MAIN .mop-contents{max-width:1280px!important;margin:auto!important;padding:5px 32px 22px!important}
MAIN .mop-wrap{max-width:none!important;margin:0!important;padding:0!important}
MAIN .mop-contents nav{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:0!important}
MAIN .mop-contents a{color:#E7E3DA!important;font-size:15px!important;font-weight:700!important;line-height:1.5!important;border-right:1px solid #707762!important;border-radius:0!important;background:transparent!important;padding:12px!important;text-decoration:none!important;min-height:66px}
MAIN .mop-contents a:last-child{border:0!important}
MAIN .mop-nav-separator{display:none!important}
MAIN .sp-tc2 .sp-lede{max-width:880px!important}
MAIN .sp-comparison-grid{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:18px;margin-top:24px}
MAIN .sp-comparison-grid .sp-panel{padding:27px!important}
MAIN .sp-panel dl{margin:26px 0 0!important}
MAIN .sp-panel dt{font-size:19px!important;line-height:1.3!important;font-weight:800!important;margin:22px 0 7px!important}
MAIN .sp-panel dd{font-size:15px!important;line-height:1.55!important;margin:0!important}
MAIN .sp-comparison-topics{border:1px solid #707762;border-radius:5px;padding:24px}
MAIN .sp-comparison-topics h2{font-size:28px!important;line-height:1.2!important;margin:0 0 12px!important;color:#E7E3DA!important}
MAIN .sp-comparison-topics p{font-size:15px!important;line-height:1.5!important;margin:0 0 17px!important;color:#E7E3DA!important}
MAIN .sp-comparison-topics .sp-step{border:1px solid #707762;border-radius:4px;padding:17px;margin-bottom:11px;min-height:88px}
MAIN .sp-comparison-topics .sp-step span span{font-size:14px!important;color:#c3c6ba!important}
MAIN .sp-comparison-topics>.sp-link{font-size:13px!important}
MAIN .authority-jumps{display:none!important}
MAIN :is(.spp-reading,.mop-reading,.authority-body){max-width:1000px!important;padding:25px 32px 45px!important;margin:auto!important}
MAIN :is(.spp-reading,.mop-reading,.authority-body) section{background:transparent!important;color:#E7E3DA!important;border:0!important;margin:0 0 28px!important;padding:0!important}
MAIN :is(.spp-reading,.mop-reading,.authority-body) :is(p,li){color:#E7E3DA!important;font-size:16px!important;line-height:1.7!important}
MAIN :is(.spp-reading,.mop-reading,.authority-body) :is(h2,h3){color:#E7E3DA!important;line-height:1.2!important}
MAIN :is(.spp-reading,.mop-reading,.authority-body) h2{font-size:29px!important;margin:0 0 18px!important}
MAIN :is(.spp-reading,.mop-reading,.authority-body) :is(.continuity-grid>div,aside,details){background:#10130d!important;color:#E7E3DA!important;border:1px solid #707762!important;border-radius:5px!important;padding:18px!important}
MAIN :is(.spp-reading,.mop-reading,.authority-body,.reading-layout) a{color:#c1cca6}
MAIN>.authority-next{max-width:1216px!important;padding:18px 0!important;margin:0 auto!important}
MAIN .continuity-links{max-width:1000px!important;margin:auto!important;padding:24px 32px!important}
@media(max-width:850px){
 MAIN .sp-hero{padding:28px 24px!important}
 MAIN .sp-fs1{gap:24px!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
 MAIN .sp-pw2{grid-template-columns:1fr!important;gap:24px!important}
 MAIN .sp-pw2 .sp-photo{height:350px;min-height:0}
 MAIN .sp-pw2 .sp-photo img{object-position:center 42%}
 MAIN .sp-benefits{margin-inline:24px!important;gap:16px!important}
 MAIN .sp-benefits>div{padding-right:16px}
 MAIN .sp-category-links{padding:0 24px 24px}
 MAIN .reading-layout>section:not(.sp-hero):not(.sp-benefits){margin:0 24px!important}
 MAIN .mop-contents{padding:0 24px 24px!important}
 MAIN .mop-contents nav{grid-template-columns:repeat(3,minmax(0,1fr))!important;row-gap:10px!important}
 MAIN .sp-comparison-grid{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)}
 MAIN .sp-comparison-topics{padding:18px}
 MAIN>.authority-next{margin-inline:24px!important}
}
@media(max-width:600px){
 MAIN .sp-hero{padding:26px 20px!important}
 MAIN .sp-hero h1{font-size:37px!important}
 MAIN .sp-lede{font-size:17px!important}
 MAIN .sp-fs1{grid-template-columns:1fr!important;gap:23px!important}
 MAIN .sp-panel{padding:23px!important}
 MAIN .sp-panel h2{font-size:27px!important}
 MAIN .sp-ticks{margin:22px 0!important}
 MAIN .sp-actions{gap:8px 16px}
 MAIN .sp-button{padding:13px 17px!important;gap:14px;font-size:19px!important}
 MAIN .sp-note{margin-top:14px!important}
 MAIN :is(.nhh-context,.spp-features,.spp-reading,.mop-reading,.authority-body,.continuity-links){padding:20px!important}
 MAIN .spp-features .continuity-grid{grid-template-columns:1fr!important;gap:12px!important}
 MAIN .spp-features .continuity-grid>div{padding:18px!important}
 MAIN .sp-pw2 .sp-photo{height:280px}
 MAIN .sp-benefits{margin:0 20px 22px!important;padding:20px!important;grid-template-columns:1fr;gap:16px!important}
 MAIN .sp-benefits>div{border:0;border-bottom:1px solid #a4a795;padding:0 0 16px}
 MAIN .sp-benefits>div:last-child{padding-bottom:0}
 MAIN .sp-category-links{padding:0 20px 24px;grid-template-columns:1fr 1fr;gap:10px}
 MAIN .sp-category-links a{font-size:14px!important;padding:12px;min-height:58px}
 MAIN .reading-layout>section:not(.sp-hero):not(.sp-benefits){margin:0 20px!important}
 MAIN .partner-grid-v3b2{grid-template-columns:1fr!important}
 MAIN .sp-mo3 .sp-start-panel{grid-template-columns:1fr!important;margin-top:23px!important}
 MAIN .sp-start-copy{padding:22px}
 MAIN .sp-start-copy h2{font-size:27px!important}
 MAIN .sp-mo3 .sp-photo{height:280px;min-height:0}
 MAIN .sp-mo3 .sp-photo img{object-position:center 42%}
 MAIN .sp-step{padding:17px 0}
 MAIN .sp-step strong{font-size:18px!important}
 MAIN .sp-step span span{font-size:14px!important}
 MAIN .mop-contents{padding:0 20px 22px!important}
 MAIN .mop-contents a{font-size:13px!important;padding:10px!important}
 MAIN .sp-comparison-grid{grid-template-columns:1fr!important;gap:17px}
 MAIN .sp-comparison-grid .sp-panel{padding:23px!important}
 MAIN .sp-comparison-topics{padding:22px}
 MAIN .sp-comparison-topics h2{font-size:26px!important}
 MAIN>.authority-next{margin-inline:20px!important}
}
`;
const icons={walk:'<circle cx="14" cy="4" r="2"/><path d="m10 9 3-2 4 4 3 1M13 7l-2 7-5 7m5-7 5 2 1 5M10 9l-4 3H3"/>',food:'<path d="M5 2v7m3-7v7M2 2v7q3 4 6 0M5 12v10M16 2v20m0-20q-6 8 0 10"/>',list:'<circle cx="4" cy="5" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="19" r="1"/><path d="M9 5h12M9 12h12M9 19h12"/>',scales:'<path d="M12 2v19M7 21h10M3 6h18M6 6l-4 9h8zm12 0-4 9h8z"/>',pill:'<path d="M5 19a5 5 0 0 1 0-7l7-7a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7 0ZM8 9l7 7"/>',syringe:'<path d="m16 2 6 6m-3-3-3 3M4 17 15 6l5 5L9 22l-5-5Zm-2 5 4-4M9 12l3 3m1-7 3 3"/>',person:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',measure:'<ellipse cx="12" cy="7" rx="9" ry="4"/><path d="M3 7v9c0 5 18 5 18 0V7M7 11v4m5-3v4m5-5v4"/>',chat:'<path d="M3 3h18v13H10l-5 5v-5H3zM7 7h10M7 11h7"/>',calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M7 2v5m10-5v5M3 10h18m-14 4h3m4 0h3m-10 4h3"/>',question:'<circle cx="12" cy="12" r="10"/><path d="M9 8a3 3 0 1 1 5 3c-2 1-2 2-2 3m0 3v1"/>'};
const mask=name=>`url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+icons[name]+'</svg>')}")`;
const rule=(selector,name)=>`MAIN ${selector}{--sp-icon:${mask(name)}}`;
export const css=baseCSS+`
MAIN .spp-features .continuity-grid>div::before{content:'';display:block;width:35px;height:35px;margin-bottom:13px;background:#a8b68d;mask:var(--sp-icon) center/contain no-repeat}
MAIN :is(.sp-start-copy,.sp-comparison-topics) .sp-step::before{content:'';display:block;width:35px;height:35px;flex:0 0 35px;background:#a8b68d;mask:var(--sp-icon) center/contain no-repeat}
MAIN .sp-start-copy .sp-step::before{background:#59624b}
MAIN :is(.sp-start-copy,.sp-comparison-topics) .sp-step>span:first-of-type{flex:1}
`+['walk','food','list'].map((name,i)=>rule('.spp-features .continuity-grid>div:nth-child('+(i+1)+')',name)).join('')+['scales','pill','syringe','person'].map((name,i)=>rule('.sp-comparison-topics .sp-step:nth-of-type('+(i+1)+')',name)).join('')+['measure','chat','walk'].map((name,i)=>rule('.sp-start-copy .sp-step:nth-of-type('+(i+1)+')',name)).join('');
