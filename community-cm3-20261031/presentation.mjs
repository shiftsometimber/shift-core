import {assets} from './config.mjs';
export const hero=intro=>`<section class="cm-hero"><div class="cm-copy"><p class="cm-eyebrow">COMMUNITY</p><h1>Join the Shift Some Timber conversation.</h1><div class="cm-introduction">${intro}</div></div><figure class="cm-photo"><img src="${assets[0]}" alt="A man using an iPad beside a wooden planter in his home workshop. Illustrative image." width="1536" height="1024" fetchpriority="high" decoding="async"></figure></section>`;
const paths={Facebook:'<path d="M19 31V19h4l1-6h-5v-3c0-2 1-3 3-3h3V2h-4c-5 0-8 3-8 8v3H9v6h4v12h6Z" fill="currentColor" stroke="none"/>',Instagram:'<rect x="3" y="3" width="28" height="28" rx="7"/><circle cx="17" cy="17" r="7"/><circle cx="25" cy="9" r="1" fill="currentColor"/>',X:'<path d="M4 3h7l19 28h-7L4 3ZM29 3 5 31"/>'};
export const icon=name=>'<svg class="cm-icon" viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[name]+'</svg>';
export const css=String.raw`
MAIN{background:#050505!important;color:#E7E3DA!important;margin:0!important;padding:0 0 28px!important;width:100%!important;max-width:none!important;overflow:clip;font-family:Arial,Helvetica,sans-serif!important}
MAIN *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif!important;-webkit-text-fill-color:currentColor!important}
MAIN :is(section,aside,div){height:auto!important;min-height:0!important;min-width:0;box-shadow:none!important}
MAIN :is(section,aside,div):before,MAIN :is(section,aside,div):after{content:none!important;display:none!important}
MAIN :is(h1,h2,h3,p,figure,ul){margin:0!important;padding:0!important;text-transform:none!important;letter-spacing:normal!important}
MAIN :is(a,button):focus-visible{outline:3px solid #b4bd9c!important;outline-offset:4px!important}
MAIN .cm-hero{position:relative;max-width:1240px!important;margin:0 auto!important;padding:38px 32px!important;display:grid!important;grid-template-columns:1.1fr 1fr;align-items:center;isolation:isolate;background:#050505!important;border:0!important;min-height:370px!important}
MAIN .cm-copy{position:relative;z-index:2;grid-column:1;min-width:0}
MAIN .cm-eyebrow{font-size:12px!important;font-weight:800!important;letter-spacing:.12em!important;line-height:1.4!important;color:#c3c9b8!important;margin:0 0 17px!important}
MAIN h1{font-size:clamp(35px,3.7vw,53px)!important;font-weight:800!important;line-height:1.04!important;letter-spacing:-.035em!important;color:#E7E3DA!important;margin:0 0 19px!important;opacity:1!important;visibility:visible!important;transform:none!important;max-width:640px!important}
MAIN .cm-introduction{padding:0!important;margin:0!important;border:0!important;background:transparent!important;position:static!important;max-width:540px!important}
MAIN .cm-introduction :is(p,strong){font-size:16px!important;line-height:1.55!important;color:#E7E3DA!important;margin:0!important}
MAIN .cm-photo{position:absolute;inset:0 0 0 37%;margin:0!important;overflow:hidden}
MAIN .cm-photo img{width:100%!important;height:100%!important;object-fit:contain!important;object-position:100% 50%!important;display:block!important;border:0!important}
MAIN .cm-photo:after{content:''!important;display:block!important;position:absolute;inset:0;background:linear-gradient(90deg,#050505 0%,rgba(5,5,5,.55) 24%,transparent 60%),linear-gradient(0deg,#050505 0%,transparent 23%)}
MAIN .cm-reading{max-width:1240px!important;padding:0 32px!important;margin:0 auto!important;display:grid!important;gap:16px}
MAIN .cm-channels{display:grid!important;gap:12px;padding:0!important;margin:0!important;border:0!important;background:transparent!important;overflow:visible!important}
MAIN .cm-sr{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
MAIN .cm-channel{display:grid!important;grid-template-columns:40px minmax(0,1fr) auto!important;grid-template-rows:auto auto!important;gap:7px 20px!important;align-items:start!important;align-content:start!important;height:auto!important;min-height:0!important;padding:20px 24px!important;margin:0!important;background:#E7E3DA!important;color:#050505!important;border:0!important;border-radius:6px!important;overflow:visible!important;position:static!important;text-align:left!important;max-width:none!important}
MAIN .cm-icon{width:33px;height:33px;color:#343c2c!important;display:block;grid-column:1;grid-row:1/3;align-self:center}
MAIN .cm-channel h3{grid-column:2;grid-row:1;font-size:21px!important;line-height:1.2!important;font-weight:800!important;color:#050505!important;margin:0!important;padding:0!important}
MAIN .cm-channel p{grid-column:2;grid-row:2;font-size:15px!important;line-height:1.5!important;color:#252920!important;margin:0!important;padding:0!important}
MAIN .cm-channel a{grid-column:3;grid-row:1/3;align-self:center;display:inline-flex!important;align-items:center;justify-content:center;min-height:44px!important;padding:10px 0 10px 12px!important;margin:0!important;width:auto!important;max-width:100%;background:transparent!important;color:#050505!important;border:0!important;box-shadow:none!important;border-radius:0!important;font-size:15px!important;font-weight:800!important;line-height:1.4!important;text-decoration:underline!important;text-underline-offset:4px;white-space:normal!important}
MAIN .cm-channel a:after{content:'→';margin-left:18px}
MAIN .cm-channel a:hover{color:#414a34!important}
MAIN .cm-panels{display:grid!important;grid-template-columns:1fr 1fr;gap:16px;background:transparent!important;border:0!important;padding:0!important;margin:0!important}
MAIN :is(.cm-principles,.newsletter-v2223){padding:24px!important;margin:0!important;border:1px solid #707762!important;border-radius:6px!important;max-width:none!important;overflow:visible!important;position:relative!important}
MAIN .cm-principles{background:#050505!important;color:#E7E3DA!important}
MAIN .cm-principles h2{font-size:24px!important;line-height:1.2!important;font-weight:800!important;color:#E7E3DA!important;margin:0 0 14px!important}
MAIN .cm-principles ul{display:grid;gap:8px;padding-left:20px!important;list-style:disc!important}
MAIN .cm-principles li{font-size:15px!important;line-height:1.5!important;color:#E7E3DA!important}
MAIN .newsletter-v2223{background:#E7E3DA!important;color:#050505!important}
MAIN .newsletter-v2223 h2{font-size:24px!important;line-height:1.2!important;font-weight:800!important;color:#050505!important;margin:0 0 12px!important}
MAIN .newsletter-v2223 :is(p,small){font-size:15px!important;line-height:1.5!important;color:#252920!important;margin:0!important}
MAIN .newsletter-v2223 a{display:inline-flex!important;align-items:center;justify-content:center;min-height:48px!important;padding:12px 20px!important;margin:16px 0!important;max-width:100%;width:auto!important;background:#050505!important;color:#E7E3DA!important;border:1px solid #050505!important;border-radius:4px!important;font-size:17px!important;font-weight:800!important;line-height:1.4!important;text-decoration:none!important;white-space:normal!important;box-shadow:none!important}
MAIN .newsletter-v2223 a:after{content:'→';margin-left:16px}
MAIN .newsletter-v2223 small{font-size:13px!important;line-height:1.5!important}
MAIN .join-conversation-v2223{padding:20px 0 0!important;border:0!important;border-top:1px solid #707762!important;background:transparent!important;color:#E7E3DA!important;margin:0!important;text-align:left!important;max-width:none!important}
MAIN .join-conversation-v2223 .wrap{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important}
MAIN .join-conversation-v2223 .eyebrow{font-size:12px!important;line-height:1.4!important;letter-spacing:.08em!important;color:#c3c9b8!important;margin:0 0 8px!important}
MAIN .join-conversation-v2223 h2{font-size:23px!important;line-height:1.2!important;color:#E7E3DA!important;margin:0 0 9px!important}
MAIN .join-conversation-v2223 p{font-size:15px!important;line-height:1.5!important;color:#E7E3DA!important}
@media(max-width:850px){MAIN .cm-hero{padding:28px 24px!important;min-height:350px!important}MAIN .cm-reading{padding:0 24px!important}MAIN h1{font-size:39px!important}MAIN .cm-channel{grid-template-columns:36px minmax(0,1fr)!important;gap:6px 16px!important}MAIN .cm-channel a{grid-column:2;grid-row:3;justify-self:start;padding:8px 0!important}MAIN .cm-icon{grid-row:1/4;align-self:start}MAIN .cm-panels{grid-template-columns:1fr}}
@media(max-width:600px){MAIN{padding-bottom:24px!important}MAIN .cm-hero{display:flex!important;flex-direction:column;align-items:stretch;gap:18px;min-height:0!important;padding:26px 18px 0!important}MAIN h1{font-size:36px!important;line-height:1.06!important}MAIN .cm-copy{width:100%}MAIN .cm-photo{position:relative;inset:auto;height:195px;width:100%;flex:none;border-radius:5px 5px 0 0}MAIN .cm-photo img{object-position:100% 50%!important}MAIN .cm-photo:after{background:linear-gradient(0deg,#050505,transparent 25%)}MAIN .cm-reading{padding:0 18px!important;gap:13px}MAIN .cm-channel{grid-template-columns:29px minmax(0,1fr)!important;gap:6px 14px!important;padding:19px 18px!important}MAIN .cm-icon{width:28px;height:28px}MAIN .cm-channel h3{font-size:20px!important}MAIN .cm-channel p{font-size:14px!important}MAIN .cm-introduction :is(p,strong){font-size:15px!important;line-height:1.5!important}MAIN .cm-panels{gap:13px}MAIN :is(.cm-principles,.newsletter-v2223){padding:22px 20px!important}MAIN :is(.cm-principles,.newsletter-v2223) h2{font-size:23px!important}MAIN .newsletter-v2223 a{width:100%!important}}
`;
