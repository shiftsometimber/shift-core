import {assets} from './config.mjs';
const arrow='<span aria-hidden="true">→</span>';
const button=(href,text)=>'<a class="sp-button" href="'+href+'">'+text+arrow+'</a>';
const photo=(src,alt)=>'<figure class="sp-photo"><img src="'+src+'" alt="'+alt+'" width="1200" height="1200" fetchpriority="high" decoding="async"></figure>';
export function hero(key){
 if(key==='about')return `<section class="sp-hero sp-ms1" aria-labelledby="nhh-title-about"><div class="sp-copy"><p class="sp-eyebrow">MATT’S STORY · WHY SHIFT EXISTS</p><h1 id="nhh-title-about">My story.<br>Why I built SHIFT.</h1><p class="sp-lede">The health worries, everyday changes and unanswered questions behind Shift Some Timber. In Matt’s own words.</p>${button('#story','Read my story')}</div><aside class="sp-letter"><blockquote>“I wish I’d found somewhere like this.”</blockquote><span class="sp-rule"></span><p>Matt O’Brien · Founder</p></aside></section><div class="sp-principles"><span>Lived experience</span><span>Plain explanations</span><span>Practical support</span></div>`;
 if(key==='newsroom')return `<section class="sp-hero sp-nr3" aria-labelledby="nhh-title-newsroom"><div class="sp-copy"><p class="sp-eyebrow">SHIFT NEWSROOM</p><h1 id="nhh-title-newsroom">Health news. Made clearer.</h1><p class="sp-lede">Find the story, understand its context and follow the sources behind the headline.</p><a class="sp-link" href="#nr-feed">Read the latest stories ${arrow}</a></div><div class="sp-news-principles"><div><span aria-hidden="true">01</span><p><strong>Evidence led</strong>Real sources, not speculation.</p></div><div><span aria-hidden="true">02</span><p><strong>Context first</strong>Plain English. No hype.</p></div><div><span aria-hidden="true">03</span><p><strong>Built for men</strong>Health news that matters to you.</p></div></div></section>`;
 if(key==='continuity')return `<section class="sp-hero sp-cy3" aria-labelledby="nhh-title-continuity"><img class="sp-still" src="${assets[1]}" alt="A mug and closed notebook on a kitchen table in warm afternoon light." width="1774" height="887" fetchpriority="high" decoding="async"><div class="sp-copy"><p class="sp-eyebrow">WHEN THE CLINIC GOES QUIET</p><h1 id="nhh-title-continuity">Clinic gone quiet?<br>Keep your story together.</h1><p class="sp-lede">Keep practical support in My Timber, organise the questions you need to ask and find a useful next step.</p><div class="sp-actions">${button('#sp-help-routes','Find your next step')}<a class="sp-link" href="/member/dashboard?entry=continuity#today">Open free My Timber ${arrow}</a></div><p class="sp-note">Practical support. Treatment questions go to your own prescriber.</p></div></section>`;
 if(key==='life-back')return `<section class="sp-hero sp-lb2" aria-labelledby="nhh-title-life-back"><div class="sp-copy"><p class="sp-eyebrow">LIFE BACK</p><h1 id="nhh-title-life-back">What do you want<br>your life back for?</h1><p class="sp-lede">Family, hobbies or feeling more like yourself. Give your reasons a place alongside the numbers.</p>${button('/member/life-back','Open Life Back')}<p class="sp-note">Your saved goals and check-ins are in your member account.</p><a class="sp-link" href="/programme">See the whole Programme ${arrow}</a></div>${photo(assets[0],'Everyday reasons for Life Back: a family sharing dinner, a man playing guitar and a couple walking a cavapoo. Illustrative image.')}</section>`;
 throw Error('Unsupported selected hero '+key);
}
export const continuityStrip=`<section class="sp-continuity-strip" aria-label="What stays with you"><div><strong>Your reason.</strong><span>Keep your starting point.</span></div><div><strong>Your progress.</strong><span>Keep your own useful record.</span></div><div><strong>Your practical support.</strong><span>Use alongside your current provider.</span></div><a class="sp-button" href="/member/dashboard?entry=continuity#today">Open free My Timber ${arrow}</a></section>`;
export const css=String.raw`
html body main#main-content[data-approved-pages]{--sp-black:#050505;--sp-cream:#E7E3DA;--sp-ash:#707762;--sp-muted:#b4b99f;background:var(--sp-black)!important;color:var(--sp-cream)!important;padding:0!important;margin:0!important;width:100%!important;max-width:none!important;font-family:Arial,Helvetica,sans-serif!important;overflow:clip}
html body main#main-content[data-approved-pages] *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif!important;-webkit-text-fill-color:currentColor!important}
html body main#main-content[data-approved-pages] :is(a,button,input,select,textarea){scroll-margin-top:110px}
html body main#main-content[data-approved-pages] :is(a,button,input,select,textarea):focus-visible{outline:3px solid #adb593!important;outline-offset:4px}
html body main#main-content[data-approved-pages] :is(h1,h2,h3,p,figure,blockquote){text-transform:none;letter-spacing:normal}
html body main#main-content[data-approved-pages] .sp-hero{display:block;position:relative;isolation:isolate;z-index:0;background:#050505!important;color:#E7E3DA!important;max-width:1280px!important;margin:0 auto!important;padding:42px 32px 36px!important;border:0!important;border-radius:0!important;box-shadow:none!important;min-height:0!important;overflow:hidden}
html body main#main-content[data-approved-pages] .sp-hero::before,html body main#main-content[data-approved-pages] .sp-hero::after{display:none!important}
html body main#main-content[data-approved-pages] .sp-copy{position:relative;z-index:1;min-width:0;align-self:center}
html body main#main-content[data-approved-pages] .sp-eyebrow{font-size:12px!important;font-weight:800!important;letter-spacing:.13em!important;color:#a8b08f!important;line-height:1.4!important;margin:0 0 18px!important}
html body main#main-content[data-approved-pages] .sp-hero h1{display:block!important;font-size:clamp(36px,4.15vw,60px)!important;font-weight:800!important;line-height:1.04!important;letter-spacing:-.045em!important;color:#E7E3DA!important;margin:0 0 22px!important;padding:0!important;max-width:none!important;visibility:visible!important;opacity:1!important;transform:none!important;clip-path:none!important}
html body main#main-content[data-approved-pages] .sp-lede{font-size:clamp(17px,1.5vw,21px)!important;line-height:1.52!important;color:#E7E3DA!important;max-width:650px;margin:0 0 24px!important}
html body main#main-content[data-approved-pages] .sp-button{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:22px!important;min-height:48px!important;padding:13px 22px!important;border-radius:5px!important;background:#707762!important;color:#E7E3DA!important;border:1px solid #707762!important;font-size:19px!important;font-weight:700!important;line-height:1.3!important;text-decoration:none!important;box-shadow:none!important;width:auto!important;max-width:100%}
html body main#main-content[data-approved-pages] .sp-button:hover{background:#858d73!important}
html body main#main-content[data-approved-pages] .sp-link{display:inline-flex;align-items:center;gap:9px;color:#E7E3DA!important;text-decoration:underline;text-underline-offset:4px;min-height:44px;font-size:15px;font-weight:700}
html body main#main-content[data-approved-pages] .sp-note{font-size:12px!important;line-height:1.6!important;color:#c2c5b7!important;margin:16px 0 12px!important;max-width:570px}
html body main#main-content[data-approved-pages] .sp-actions{display:flex;gap:20px;align-items:center;flex-wrap:wrap}
html body main#main-content[data-approved-pages] .sp-ms1{display:grid!important;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:50px;align-items:stretch;padding-top:46px!important;padding-bottom:36px!important}
html body main#main-content[data-approved-pages] .sp-letter{align-self:center;background:#E7E3DA;color:#050505;padding:48px 34px;clip-path:polygon(1% 1%,15% 0,31% 1%,48% 0,66% 1%,83% 0,99% 1%,100% 27%,99% 54%,100% 78%,99% 99%,82% 100%,63% 99%,44% 100%,24% 99%,1% 100%,0 71%,1% 46%,0 20%)}
html body main#main-content[data-approved-pages] .sp-letter blockquote{font-size:clamp(27px,3.3vw,47px)!important;font-weight:800!important;line-height:1.08!important;letter-spacing:-.035em!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;color:#050505!important}
html body main#main-content[data-approved-pages] .sp-letter p{font-size:15px!important;font-weight:700!important;margin:0!important;color:#050505!important}
html body main#main-content[data-approved-pages] .sp-rule{display:block;width:64px;height:3px;background:#707762;margin:28px 0}
html body main#main-content[data-approved-pages] .sp-principles{max-width:1216px;margin:0 auto;padding:16px 18px;border-block:1px solid #707762;display:flex;justify-content:space-around;gap:16px;color:#a8b08f;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
html body main#main-content[data-approved-pages="about"] :is(.ab-wrap,.ab-letter,.ab-story){background:#050505!important;color:#E7E3DA!important;box-shadow:none!important;border:0!important}
html body main#main-content[data-approved-pages="about"] .ab-wrap{padding:34px 28px 50px!important;max-width:1040px!important;margin:0 auto!important}
html body main#main-content[data-approved-pages="about"] .ab-letter{padding:0!important;max-width:none!important}
html body main#main-content[data-approved-pages="about"] .ab-story{max-width:780px!important;margin:auto!important}
html body main#main-content[data-approved-pages="about"] .ab-story :is(p,h2){color:#E7E3DA!important}
html body main#main-content[data-approved-pages="about"] .ab-story p{line-height:1.75!important;font-size:17px!important;margin:0 0 20px!important}
html body main#main-content[data-approved-pages="about"] .ab-story h2{font-size:27px!important;line-height:1.18!important;margin:32px 0 17px!important;scroll-margin-top:110px!important}
html body main#main-content[data-approved-pages="about"] .ab-story .note{background:#15180f!important;border:1px solid #707762!important;color:#E7E3DA!important}
html body main#main-content[data-approved-pages="about"] .ab-story a{color:#b9c39d!important}
html body main#main-content[data-approved-pages] .sp-contact-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:56px;max-width:1200px;margin:0 auto;padding:44px 32px 36px;align-items:start}
html body main#main-content[data-approved-pages="contact"] .ct-hero{margin:0!important;padding:0!important;min-height:0!important;background:#050505!important;border:0!important}
html body main#main-content[data-approved-pages="contact"] .ct-hero .ct-wrap{padding:0!important;max-width:none!important;margin:0!important}
html body main#main-content[data-approved-pages="contact"] .ct-hero h1{font-size:clamp(36px,4.4vw,60px)!important;line-height:1.05!important;letter-spacing:-.04em!important;color:#E7E3DA!important;margin:12px 0 20px!important}
html body main#main-content[data-approved-pages="contact"] .ct-hero p{font-size:16px!important;line-height:1.65!important;color:#E7E3DA!important;max-width:520px!important;margin:0 0 20px!important}
html body main#main-content[data-approved-pages="contact"] .ct-hero .ct-eyebrow{font-size:12px!important;letter-spacing:.12em!important;color:#a8b08f!important}
html body main#main-content[data-approved-pages="contact"] .ct-details{padding:14px 0 0!important;background:transparent!important;border:0!important}
html body main#main-content[data-approved-pages="contact"] .ct-details-head{display:none!important}
html body main#main-content[data-approved-pages="contact"] .ct-contact-list{display:grid!important;gap:0!important;border:0!important}
html body main#main-content[data-approved-pages="contact"] .ct-contact{padding:14px 0!important;border:0!important;border-top:1px solid #555d48!important;background:transparent!important;min-height:0!important}
html body main#main-content[data-approved-pages="contact"] .ct-contact span{font-size:11px!important;letter-spacing:.09em!important;color:#a8b08f!important;margin-bottom:5px!important}
html body main#main-content[data-approved-pages="contact"] .ct-contact a{font-size:19px!important;font-weight:700!important;background:transparent!important;padding:0!important;justify-content:flex-start!important;color:#E7E3DA!important;border-radius:0!important;min-height:32px!important}
html body main#main-content[data-approved-pages="contact"] .ct-contact p{font-size:12px!important;line-height:1.5!important;color:#c2c5b7!important;margin:3px 0 0!important}
html body main#main-content[data-approved-pages="contact"] .ct-contact:has(strong){order:4;padding-bottom:0!important}
html body main#main-content[data-approved-pages="contact"] .ct-contact strong{font-size:15px!important;color:#E7E3DA!important}
html body main#main-content[data-approved-pages="contact"] .ct-form-card{background:#E7E3DA!important;color:#050505!important;border-radius:7px!important;padding:25px!important;border:0!important;box-shadow:none!important}
html body main#main-content[data-approved-pages="contact"] .ct-form-card :is(h2,p,label,span,a){color:#050505!important}
html body main#main-content[data-approved-pages="contact"] .ct-form-card h2{font-size:23px!important;margin:0 0 10px!important}
html body main#main-content[data-approved-pages="contact"] .ct-form-card>p{font-size:12px!important;line-height:1.5!important;margin:0 0 20px!important}
html body main#main-content[data-approved-pages="contact"] .ct-form{display:grid!important;grid-template-columns:1fr!important;gap:14px!important}
html body main#main-content[data-approved-pages="contact"] .ct-field{grid-column:1!important}
html body main#main-content[data-approved-pages="contact"] .ct-form :is(input:not([type=checkbox]),select,textarea){background:#f0ece4!important;color:#050505!important;border:1px solid #888c7d!important;min-height:44px!important;font-size:16px!important;max-width:100%!important;width:100%!important;border-radius:4px!important;box-shadow:none!important;padding:10px 12px!important}
html body main#main-content[data-approved-pages="contact"] .ct-form textarea{min-height:115px!important;resize:vertical}
html body main#main-content[data-approved-pages="contact"] .ct-form :is(label,.ct-note){font-size:12px!important;line-height:1.5!important}
html body main#main-content[data-approved-pages="contact"] .ct-check{display:flex!important;align-items:start!important;gap:10px!important}
html body main#main-content[data-approved-pages="contact"] .ct-check input{width:18px!important;height:18px!important;min-height:18px!important;margin:0!important;flex-shrink:0;accent-color:#707762}
html body main#main-content[data-approved-pages="contact"] .ct-submit{background:#707762!important;color:#E7E3DA!important;min-height:48px!important;border:0!important;border-radius:4px!important;font-size:19px!important;font-weight:700!important}
html body main#main-content[data-approved-pages="contact"] .ct-safety{background:#050505!important;margin:0 auto 32px!important;padding:0 32px!important;max-width:1200px!important}
html body main#main-content[data-approved-pages="contact"] .ct-safety-row{padding:18px!important;border:1px solid #707762!important;border-radius:5px!important;gap:22px!important}
html body main#main-content[data-approved-pages="contact"] .ct-safety p{font-size:13px!important;line-height:1.6!important;color:#E7E3DA!important}
html body main#main-content[data-approved-pages="contact"] .ct-safety a{color:#E7E3DA!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-wrap{max-width:1280px!important;padding:0 32px 40px!important;margin:auto!important}
html body main#main-content[data-approved-pages="newsroom"] .sp-nr3{padding:34px 0 20px!important}
html body main#main-content[data-approved-pages="newsroom"] .sp-nr3 h1{font-size:clamp(34px,3.6vw,52px)!important;margin-bottom:17px!important}
html body main#main-content[data-approved-pages="newsroom"] .sp-nr3 .sp-lede{max-width:850px!important;margin-bottom:10px!important;font-size:18px!important}
html body main#main-content[data-approved-pages="newsroom"] .sp-nr3 .sp-link{min-height:32px!important}
html body main#main-content[data-approved-pages="newsroom"] .sp-news-principles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin:22px 0 0}
html body main#main-content[data-approved-pages="newsroom"] .sp-news-principles>div{display:flex;gap:12px;align-items:center;border-right:1px solid #555d48;padding-right:15px}
html body main#main-content[data-approved-pages="newsroom"] .sp-news-principles>div:last-child{border:0}
html body main#main-content[data-approved-pages="newsroom"] .sp-news-principles>div>span{display:flex;align-items:center;justify-content:center;border:1px solid #707762;border-radius:50%;width:40px;height:40px;flex-shrink:0;color:#adb593;font-size:12px}
html body main#main-content[data-approved-pages="newsroom"] .sp-news-principles p{font-size:12px!important;line-height:1.5!important;margin:0!important;color:#c2c5b7!important}
html body main#main-content[data-approved-pages="newsroom"] .sp-news-principles strong{display:block;font-size:15px;color:#E7E3DA}
html body main#main-content[data-approved-pages="newsroom"] .nhh-context{padding:0 0 10px!important;max-width:none!important;background:transparent!important;border:0!important;min-height:0!important;margin:0!important}
html body main#main-content[data-approved-pages="newsroom"] .nhh-context a{min-height:32px!important;display:inline-flex!important;align-items:center!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-browse{padding:12px 0!important;border:0!important;background:transparent!important;box-shadow:none!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-browse-head{margin-bottom:10px!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-browse-head p{margin:0!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-browse-head h2{font-size:22px!important;line-height:1.2!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-topics{gap:8px!important;flex-wrap:wrap!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-topics a{font-size:13px!important;min-height:36px!important;padding:7px 13px!important;border-radius:24px!important;color:#E7E3DA!important;border:1px solid #707762!important;background:transparent!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-topics a[aria-current]{background:#707762!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-search-row{display:grid!important;grid-template-columns:minmax(0,1fr) 180px auto!important;gap:12px!important;align-items:end!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-form{background:transparent!important;color:#E7E3DA!important;padding:0!important;border:0!important;box-shadow:none!important;margin:16px 0 8px!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-form :is(label,label span,summary){color:#E7E3DA!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-refine{background:transparent!important;color:#E7E3DA!important;border:1px solid #707762!important;padding:0!important;margin:12px 0 0!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-refine summary{padding:12px 14px!important;min-height:44px!important;font-size:13px!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-form :is(input,select){background:#0c0e0a!important;color:#E7E3DA!important;border:1px solid #707762!important;min-height:44px!important;max-width:100%!important;font-size:16px!important;box-shadow:none!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-button{background:#707762!important;color:#E7E3DA!important;border:1px solid #707762!important;min-height:44px!important;font-size:19px!important;font-weight:700!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-fields{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:16px!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-feed{padding:0!important;margin:0!important;border:0!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-feed-head{padding:12px 0!important;margin:0!important;border:0!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-feed-head p{margin:0!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-date-note{font-size:12px!important;margin:8px 0 18px!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-list{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:16px!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-story{grid-column:auto!important;padding:23px!important;border:1px solid #707762!important;background:#050505!important;color:#E7E3DA!important;border-radius:4px!important;box-shadow:none!important;min-width:0!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-story h2{font-size:clamp(21px,2vw,27px)!important;line-height:1.15!important;letter-spacing:-.02em!important;margin:12px 0 14px!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-story :is(h2,a,p,time){color:inherit!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-story p{font-size:15px!important;line-height:1.6!important;margin:0 0 12px!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-story .nr-source{color:#b4bd9c!important;font-size:12px!important;font-weight:700!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-story .nr-meta{font-size:12px!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-story:nth-child(3n+1){background:#E7E3DA!important;color:#050505!important;border-color:#E7E3DA!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-story:nth-child(3n+1) .nr-source{color:#50593f!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-story:nth-child(3n){grid-column:1/-1!important}
html body main#main-content[data-approved-pages="newsroom"] .nr-story[hidden]{display:none!important}
html body main#main-content[data-approved-pages="continuity"] .sp-cy3{max-width:none!important;padding:32px max(32px,calc((100% - 1216px)/2))!important;min-height:330px!important}
html body main#main-content[data-approved-pages="continuity"] .sp-cy3 h1{font-size:clamp(34px,3.9vw,53px)!important;max-width:780px!important}
html body main#main-content[data-approved-pages="continuity"] .sp-cy3 .sp-lede{max-width:660px!important;font-size:17px!important}
html body main#main-content[data-approved-pages="continuity"] .sp-still{position:absolute;right:0;top:0;height:100%;width:57%;object-fit:cover;object-position:100% center;z-index:-2}
html body main#main-content[data-approved-pages="continuity"] .sp-cy3 .sp-copy{max-width:850px!important}
html body main#main-content[data-approved-pages="continuity"] .sp-cy3 .sp-copy::before{content:'';position:absolute;inset:-60px -80px -60px -60px;background:linear-gradient(90deg,#050505 45%,rgba(5,5,5,.9) 70%,transparent);z-index:-1;pointer-events:none}
html body main#main-content[data-approved-pages="continuity"] .sp-cy3 .sp-note{font-size:12px!important;margin-bottom:0!important}
html body main#main-content[data-approved-pages="continuity"] .cr-body{padding-top:22px!important}
html body main#main-content[data-approved-pages="continuity"] #sp-help-routes:has(.cr-choices){background:#E7E3DA!important;color:#050505!important;padding:24px!important;margin-top:20px!important;border:0!important;scroll-margin-top:100px!important}
html body main#main-content[data-approved-pages="continuity"] #sp-help-routes:has(.cr-choices) *{color:#050505!important}
html body main#main-content[data-approved-pages="continuity"] #sp-help-routes .cr-choices{display:grid!important;grid-template-columns:1fr!important;gap:0!important}
html body main#main-content[data-approved-pages="continuity"] #sp-help-routes details{background:transparent!important;border:0!important;border-top:1px solid #aaa995!important;border-radius:0!important}
html body main#main-content[data-approved-pages="continuity"] #sp-help-routes summary{padding:18px 0!important;font-size:20px!important;line-height:1.3!important;min-height:60px!important}
html body main#main-content[data-approved-pages="continuity"] #sp-help-routes .cr-answer{padding:0 0 20px!important}
html body main#main-content[data-approved-pages="continuity"] .qpp-needs{background:#E7E3DA!important;color:#050505!important;padding:28px 32px!important;scroll-margin-top:95px}
html body main#main-content[data-approved-pages="continuity"] .qpp-needs .qpp-wrap{max-width:1216px!important;margin:auto!important;padding:0!important}
html body main#main-content[data-approved-pages="continuity"] .qpp-needs section{display:block!important;max-width:none!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important}
html body main#main-content[data-approved-pages="continuity"] .qpp-needs :is(p,strong,h2,a){color:#050505!important}
html body main#main-content[data-approved-pages="continuity"] .qpp-needs h2{font-size:clamp(25px,2.6vw,34px)!important;line-height:1.15!important;margin:0 0 10px!important}
html body main#main-content[data-approved-pages="continuity"] .qpp-needs p{display:grid!important;grid-template-columns:minmax(170px,.75fr) minmax(0,2fr);gap:18px!important;font-size:15px!important;line-height:1.65!important;border-top:1px solid #aaa995!important;padding:17px 0!important;margin:0!important}
html body main#main-content[data-approved-pages="continuity"] .qpp-needs p strong{font-size:19px!important;line-height:1.2!important}
html body main#main-content[data-approved-pages="continuity"] .sp-route-detail a{text-decoration:underline!important;text-underline-offset:3px}
html body main#main-content[data-approved-pages] .sp-continuity-strip{max-width:1280px;margin:auto!important;padding:24px 32px!important;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;border:0!important;background:#050505!important;color:#E7E3DA!important}
html body main#main-content[data-approved-pages] .sp-continuity-strip strong{display:block;font-size:18px;margin-bottom:8px;color:#E7E3DA!important}
html body main#main-content[data-approved-pages] .sp-continuity-strip span{display:block;font-size:13px;color:#c2c5b7!important}
html body main#main-content[data-approved-pages] .sp-continuity-strip a{justify-self:start;grid-column:1/-1}
html body main#main-content[data-approved-pages="continuity"] .nhh-context,html body main#main-content[data-approved-pages="life-back"] .nhh-context{background:#050505!important;color:#E7E3DA!important;max-width:960px!important;padding:26px 32px!important;margin:0 auto!important}
html body main#main-content[data-approved-pages="life-back"] .sp-lb2{display:grid!important;grid-template-columns:1fr 1fr;gap:30px;padding-top:32px!important;padding-bottom:24px!important}
html body main#main-content[data-approved-pages="life-back"] .sp-photo{position:relative;margin:0!important;width:100%;align-self:center}
html body main#main-content[data-approved-pages="life-back"] .sp-photo img{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover}
html body main#main-content[data-approved-pages="life-back"] .sp-lb2 h1{font-size:clamp(36px,3.8vw,54px)!important}
html body main#main-content[data-approved-pages="life-back"] .lbp-needs{background:#E7E3DA!important;color:#050505!important;padding:25px 32px!important}
html body main#main-content[data-approved-pages="life-back"] .lbp-wrap{max-width:1216px!important;margin:0 auto!important;padding:0!important}
html body main#main-content[data-approved-pages="life-back"] .lbp-needs section{background:transparent!important;border:0!important;padding:0!important;margin:0!important;max-width:none!important}
html body main#main-content[data-approved-pages="life-back"] .lbp-needs :is(h2,h3,p){color:#050505!important}
html body main#main-content[data-approved-pages="life-back"] .lbp-needs h2{font-size:28px!important;margin:0 0 20px!important}
html body main#main-content[data-approved-pages="life-back"] .lbp-needs .continuity-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:22px!important}
html body main#main-content[data-approved-pages="life-back"] .lbp-needs .continuity-grid>div{border:0!important;border-right:1px solid #aaa995!important;padding:0 20px 0 0!important;background:transparent!important;border-radius:0!important;box-shadow:none!important}
html body main#main-content[data-approved-pages="life-back"] .lbp-needs .continuity-grid>div:last-child{border:0!important}
html body main#main-content[data-approved-pages="life-back"] .lbp-needs h3{font-size:18px!important;margin:0 0 10px!important}
html body main#main-content[data-approved-pages="life-back"] .lbp-needs p{font-size:14px!important;line-height:1.65!important;margin:0!important}
html body main#main-content[data-approved-pages] :is(.qpp-reading,.lbp-reading){display:block!important;width:100%!important;max-width:960px!important;padding:25px 32px 50px!important;margin:0 auto!important;background:#050505!important;color:#E7E3DA!important}
html body main#main-content[data-approved-pages] :is(.qpp-reading,.lbp-reading) :is(section,p,h2,h3){color:#E7E3DA!important}
html body main#main-content[data-approved-pages] :is(.qpp-reading,.lbp-reading) section{margin:0 0 28px!important;padding:0!important;background:transparent!important;border:0!important}
html body main#main-content[data-approved-pages] :is(.qpp-reading,.lbp-reading) h2{font-size:27px!important;line-height:1.2!important;margin:0 0 18px!important}
html body main#main-content[data-approved-pages] :is(.qpp-reading,.lbp-reading) p{font-size:16px!important;line-height:1.75!important}
html body main#main-content[data-approved-pages] :is(.qpp-reading,.lbp-reading,.nhh-context) a{color:#bdc7a4!important}
html body main#main-content[data-approved-pages] :is(.qpp-reading,.lbp-reading) .continuity-grid>div{background:#12150e!important;color:#E7E3DA!important;border:1px solid #707762!important;border-radius:5px!important}
@media(max-width:850px){
 html body main#main-content[data-approved-pages] .sp-hero{padding:28px 24px!important}
 html body main#main-content[data-approved-pages] .sp-ms1{gap:24px!important;grid-template-columns:1fr 1fr!important}
 html body main#main-content[data-approved-pages] .sp-letter{padding:32px 24px}
 html body main#main-content[data-approved-pages] .sp-contact-grid{gap:28px;padding:28px 24px}
 html body main#main-content[data-approved-pages="newsroom"] .nr-search-row{grid-template-columns:minmax(0,1fr) 160px!important}
 html body main#main-content[data-approved-pages="newsroom"] .nr-search-row button{grid-column:1/-1}
 html body main#main-content[data-approved-pages="newsroom"] .nr-wrap{padding:0 24px 30px!important}
 html body main#main-content[data-approved-pages="life-back"] .sp-lb2{gap:24px!important;grid-template-columns:1fr!important}
 html body main#main-content[data-approved-pages="life-back"] .sp-photo{max-width:600px!important;justify-self:center}
 html body main#main-content[data-approved-pages="life-back"] .sp-lb2 h1 br{display:none}
}
@media(max-width:600px){
 html body main#main-content[data-approved-pages] .sp-hero{padding:26px 20px!important}
 html body main#main-content[data-approved-pages] .sp-hero h1{font-size:38px!important;margin-bottom:18px!important}
 html body main#main-content[data-approved-pages] .sp-lede{font-size:17px!important;line-height:1.5!important}
 html body main#main-content[data-approved-pages] .sp-ms1{grid-template-columns:1fr!important;gap:26px!important}
 html body main#main-content[data-approved-pages] .sp-letter{padding:30px 26px}
 html body main#main-content[data-approved-pages] .sp-letter blockquote{font-size:34px!important}
 html body main#main-content[data-approved-pages] .sp-principles{margin:0 20px;gap:10px;flex-wrap:wrap;justify-content:flex-start;font-size:10px;padding:14px 0}
 html body main#main-content[data-approved-pages] .sp-contact-grid{grid-template-columns:1fr;gap:25px;padding:26px 20px}
 html body main#main-content[data-approved-pages="contact"] .ct-details{padding-top:0!important}
 html body main#main-content[data-approved-pages="contact"] .ct-form-card{padding:22px!important}
 html body main#main-content[data-approved-pages="contact"] .ct-safety{padding:0 20px!important}
 html body main#main-content[data-approved-pages="contact"] .ct-safety-row{display:block!important}
 html body main#main-content[data-approved-pages="newsroom"] .sp-nr3 h1{font-size:35px!important}
 html body main#main-content[data-approved-pages="newsroom"] .nr-wrap{padding:0 20px 30px!important}
 html body main#main-content[data-approved-pages="newsroom"] .sp-nr3{padding:26px 0 20px!important}
 html body main#main-content[data-approved-pages="newsroom"] .sp-news-principles{gap:10px;grid-template-columns:1fr}
 html body main#main-content[data-approved-pages="newsroom"] .sp-news-principles>div{border:0;padding:0}
 html body main#main-content[data-approved-pages="newsroom"] .nr-search-row{grid-template-columns:1fr!important}
 html body main#main-content[data-approved-pages="newsroom"] .nr-fields{grid-template-columns:1fr!important}
 html body main#main-content[data-approved-pages="newsroom"] .nr-list{grid-template-columns:1fr!important}
 html body main#main-content[data-approved-pages="newsroom"] .nr-story{grid-column:1!important;padding:20px!important}
 html body main#main-content[data-approved-pages="continuity"] .sp-cy3{padding:26px 20px!important;min-height:0!important}
 html body main#main-content[data-approved-pages="continuity"] .sp-cy3 h1{font-size:34px!important}
 html body main#main-content[data-approved-pages="continuity"] .sp-still{width:100%;opacity:.25}
 html body main#main-content[data-approved-pages="continuity"] .sp-cy3 .sp-copy::before{background:linear-gradient(90deg,rgba(5,5,5,.97),rgba(5,5,5,.72));inset:-35px}
 html body main#main-content[data-approved-pages="continuity"] .qpp-needs{padding:24px 20px!important}
 html body main#main-content[data-approved-pages="continuity"] .qpp-needs p{grid-template-columns:1fr!important;gap:8px!important}
 html body main#main-content[data-approved-pages] .sp-continuity-strip{grid-template-columns:1fr!important;padding:24px 20px!important;gap:20px}
 html body main#main-content[data-approved-pages="life-back"] .sp-lb2{padding:26px 20px!important}
 html body main#main-content[data-approved-pages="life-back"] .sp-photo{margin:0 -20px!important;width:calc(100% + 40px)!important;max-width:none!important}
 html body main#main-content[data-approved-pages="life-back"] .lbp-needs{padding:24px 20px!important}
 html body main#main-content[data-approved-pages="life-back"] .lbp-needs .continuity-grid{grid-template-columns:1fr!important;gap:18px!important}
 html body main#main-content[data-approved-pages="life-back"] .lbp-needs .continuity-grid>div{padding:0 0 18px!important;border-right:0!important;border-bottom:1px solid #aaa995!important}
 html body main#main-content[data-approved-pages] :is(.qpp-reading,.lbp-reading,.nhh-context){padding-inline:20px!important}
}
`;
