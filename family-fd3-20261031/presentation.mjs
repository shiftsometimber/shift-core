import {assets} from './config.mjs';
export const hero=(byline,planner)=>`<section class="fd-hero"><div class="fd-copy"><p class="fd-eyebrow">FAMILY DISCUSSION GUIDE</p><h1>Support helps.<br>Food policing usually does not.</h1>${byline}<div class="fd-hero-action">${planner}</div></div><figure class="fd-photo"><img src="${assets[0]}" alt="A dad and his daughter getting their walking shoes on at the front door. Illustrative image." width="1536" height="1024" fetchpriority="high" decoding="async"></figure></section>`;
const paths=['<path d="M4 5h24v17H15l-8 7v-7H4V5Z"/>','<circle cx="11" cy="8" r="5"/><circle cx="25" cy="10" r="4"/><path d="M2 29v-5a9 9 0 0 1 18 0v5M23 19a7 7 0 0 1 8 7v3"/>','<path d="M16 2 28 7v9c0 7-12 14-12 14S4 23 4 16V7l12-5Z"/>','<path d="M7 2h12l7 7v21H7V2ZM18 2v8h8M12 16h9M12 21h9M12 26h5"/>'];
export const icon=i=>'<svg viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[i]+'</svg>';
export const css=String.raw`
MAIN{background:#050505!important;color:#E7E3DA!important;margin:0!important;padding:0 0 30px!important;width:100%!important;max-width:none!important;overflow:clip;font-family:Arial,Helvetica,sans-serif!important}
MAIN *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif!important;-webkit-text-fill-color:currentColor!important}
MAIN :is(section,aside,div){height:auto!important;min-height:0!important;min-width:0;box-shadow:none!important}
MAIN :is(section,aside,div):before,MAIN :is(section,aside,div):after{content:none!important;display:none!important}
MAIN :is(h1,h2,h3,p,figure,ul){margin:0!important;padding:0!important;text-transform:none!important;letter-spacing:normal!important}
MAIN :is(a,button):focus-visible{outline:3px solid #b4bd9c!important;outline-offset:4px!important}
MAIN .fd-hero{position:relative;max-width:1240px!important;margin:0 auto!important;padding:40px 32px!important;display:grid!important;grid-template-columns:1.05fr 1fr;align-items:center;isolation:isolate;background:#050505!important;border:0!important;min-height:390px!important}
MAIN .fd-copy{position:relative;z-index:2;grid-column:1;min-width:0}
MAIN .fd-eyebrow{font-size:12px!important;font-weight:800!important;letter-spacing:.12em!important;line-height:1.4!important;color:#c3c9b8!important;margin:0 0 18px!important}
MAIN h1{font-size:clamp(35px,3.7vw,53px)!important;font-weight:800!important;line-height:1.04!important;letter-spacing:-.035em!important;color:#E7E3DA!important;margin:0 0 18px!important;opacity:1!important;visibility:visible!important;transform:none!important}
MAIN .byline-v12{font-size:14px!important;line-height:1.6!important;color:#E7E3DA!important;margin:0 0 22px!important}
MAIN .byline-v12 a{color:#E7E3DA!important;text-decoration:underline!important;text-underline-offset:3px}
MAIN .fd-photo{position:absolute;inset:0 0 0 37%;margin:0!important;overflow:hidden}
MAIN .fd-photo img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:68% 55%!important;display:block!important;border:0!important}
MAIN .fd-photo:after{content:''!important;display:block!important;position:absolute;inset:0;background:linear-gradient(90deg,#050505 0%,rgba(5,5,5,.48) 25%,transparent 60%),linear-gradient(0deg,#050505 0%,transparent 22%)}
MAIN .fd-reading{max-width:1240px!important;padding:0 32px!important;margin:0 auto!important;display:grid!important;gap:14px}
MAIN .fd-row{display:grid!important;grid-template-columns:40px minmax(0,1fr);gap:20px;background:#E7E3DA!important;color:#050505!important;border:0!important;border-radius:6px!important;padding:25px 28px!important;margin:0!important;overflow:visible!important}
MAIN .fd-symbol svg{width:35px;height:35px;color:#050505!important;display:block}
MAIN .fd-content h2{font-size:25px!important;line-height:1.18!important;font-weight:800!important;color:#050505!important;margin:0 0 10px!important}
MAIN .fd-content p,MAIN .fd-content li{font-size:16px!important;line-height:1.55!important;color:#252920!important;margin:0!important}
MAIN .fd-content ul{padding:0 0 0 21px!important;display:grid;gap:5px;list-style:disc!important}
MAIN .fd-surgery{background:#252920!important;color:#E7E3DA!important;border:1px solid #707762!important}
MAIN .fd-surgery :is(h2,p,svg){color:#E7E3DA!important}
MAIN :is(.fd-hero-action,.fd-planner) a{display:inline-flex!important;align-items:center;justify-content:center;gap:16px;padding:14px 20px!important;min-height:48px!important;max-width:100%;width:auto!important;background:#E7E3DA!important;color:#050505!important;border:1px solid #E7E3DA!important;border-radius:4px!important;font-size:16px!important;font-weight:800!important;line-height:1.4!important;text-decoration:none!important;white-space:normal!important;box-shadow:none!important}
MAIN :is(.fd-hero-action,.fd-planner) a:after{content:'→';margin-left:14px}
MAIN :is(.fd-hero-action,.fd-planner) a:hover{background:#d4d7c9!important}
MAIN .fd-planner{padding:0!important;background:transparent!important;border:0!important;margin:2px 0!important}
MAIN .fd-planner a{width:100%!important;background:#707762!important;color:#E7E3DA!important;border-color:#707762!important}
MAIN .editorial-note-v2222{padding:18px 22px!important;background:transparent!important;color:#E7E3DA!important;border:1px solid #707762!important;border-radius:5px!important;margin:0!important;max-width:none!important}
MAIN .editorial-note-v2222 h3{font-size:16px!important;line-height:1.4!important;font-weight:800!important;color:#E7E3DA!important;margin:0 0 5px!important}
MAIN .editorial-note-v2222 p{font-size:14px!important;line-height:1.5!important;color:#E7E3DA!important}
MAIN .sourcebox{background:transparent!important;color:#E7E3DA!important;border:0!important;border-top:1px solid #707762!important;padding:20px 0 0!important;margin:4px 0 0!important;max-width:none!important}
MAIN .sourcebox h2{font-size:20px!important;line-height:1.3!important;color:#E7E3DA!important;margin:0 0 9px!important}
MAIN .sourcebox :is(p,li,a){font-size:14px!important;line-height:1.6!important;color:#E7E3DA!important}
MAIN .sourcebox ul{padding:0 0 0 20px!important;margin:8px 0 0!important;list-style:disc!important}
MAIN .sourcebox a{text-decoration:underline!important;text-underline-offset:3px}
@media(max-width:850px){MAIN .fd-hero{padding:28px 24px!important;min-height:370px!important}MAIN .fd-reading{padding:0 24px!important}MAIN h1{font-size:39px!important}}
@media(max-width:600px){MAIN{padding-bottom:24px!important}MAIN .fd-hero{display:flex!important;flex-direction:column;align-items:stretch;gap:20px;min-height:0!important;padding:26px 18px 0!important}MAIN h1{font-size:36px!important;line-height:1.06!important}MAIN .fd-copy{width:100%}MAIN .fd-photo{position:relative;inset:auto;height:215px;width:100%;flex:none;border-radius:5px 5px 0 0}MAIN .fd-photo img{object-position:66% 58%!important}MAIN .fd-photo:after{background:linear-gradient(0deg,#050505,transparent 25%)}MAIN .fd-reading{padding:0 18px!important;gap:12px}MAIN .fd-row{grid-template-columns:28px minmax(0,1fr);gap:13px;padding:22px 18px!important}MAIN .fd-symbol svg{width:28px;height:28px}MAIN .fd-content h2{font-size:21px!important}MAIN .fd-content p,MAIN .fd-content li{font-size:15px!important;line-height:1.55!important}MAIN .byline-v12{font-size:13px!important;margin-bottom:18px!important}MAIN .fd-hero-action a{width:100%!important}MAIN .sourcebox li{overflow-wrap:anywhere}}
`;
