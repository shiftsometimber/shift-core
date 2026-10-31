import {assets} from './config.mjs';
export const hero=`<section class="dr-hero"><div class="dr-copy"><p class="dr-eyebrow">DOWNLOADS &amp; RESOURCES</p><h1>Take better questions into the real conversation.</h1><p class="dr-lede">Simple printable preparation sheets for appointments, treatment choices and long-term maintenance.</p></div><figure class="dr-photo"><img src="${assets[0]}" alt="A man preparing appointment notes beside an iPad at his kitchen table. Illustrative image." width="1536" height="1024" fetchpriority="high" decoding="async"></figure></section>`;
export const groupHeader=(g,i)=>`<div class="dr-group-heading"><h2 id="dr-group-${i}">${g.title}</h2><p>${g.copy}</p></div>`;
const paths=['<rect x="4" y="5" width="24" height="23" rx="2"/><path d="M10 2v7M22 2v7M4 13h24M10 18h2M18 18h2M10 23h2M18 23h2"/>','<path d="m10 24 14-14a6 6 0 0 0-8-8L2 16a6 6 0 0 0 8 8ZM9 9l8 8"/>','<path d="m5 27 5-11L24 2l6 6-14 14-11 5ZM10 16l6 6"/>','<path d="M16 2 28 7v9c0 7-12 14-12 14S4 23 4 16V7l12-5Z"/>','<path d="m3 12 10 4 9-12 5 1-6 13 8 6-1 3-11-4-6 6-3-1 3-9-9-4 1-3Z"/>','<path d="M5 29V18h5v11M14 29V10h5v19M23 29V2h5v27"/>'];
export const icon=j=>'<svg class="dr-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[j]+'</svg>';
export const css=String.raw`
MAIN{background:#050505!important;color:#E7E3DA!important;font-family:Arial,Helvetica,sans-serif!important;margin:0!important;padding:0 0 36px!important;width:100%!important;max-width:none!important;overflow:clip}
MAIN *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif!important;-webkit-text-fill-color:currentColor!important}
MAIN :is(h1,h2,h3,p,figure){text-transform:none!important;letter-spacing:normal!important;margin:0}
MAIN :is(a,button):focus-visible{outline:3px solid #707762!important;outline-offset:4px!important}
MAIN .dr-hero{position:relative;max-width:1240px!important;margin:0 auto!important;min-height:350px;padding:40px 32px!important;display:grid!important;grid-template-columns:1fr 1fr;align-items:center;isolation:isolate;background:#050505!important}
MAIN .dr-copy{position:relative;z-index:2;grid-area:1/1;max-width:610px}
MAIN .dr-eyebrow{font-size:12px!important;font-weight:800!important;letter-spacing:.12em!important;line-height:1.4!important;color:#c3c9b8!important;margin:0 0 15px!important}
MAIN h1{font-size:clamp(35px,3.8vw,54px)!important;font-weight:800!important;line-height:1.05!important;letter-spacing:-.035em!important;color:#E7E3DA!important;margin:0 0 20px!important;max-width:610px!important;opacity:1!important;visibility:visible!important;transform:none!important}
MAIN .dr-lede{font-size:17px!important;line-height:1.5!important;color:#E7E3DA!important;max-width:510px!important;margin:0!important}
MAIN .dr-photo{position:absolute;inset:0 0 0 40%;margin:0!important;overflow:hidden}
MAIN .dr-photo:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#050505 0%,rgba(5,5,5,.2) 38%,transparent 65%),linear-gradient(0deg,#050505 0%,transparent 25%)}
MAIN .dr-photo img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:63% 58%!important;display:block!important;border:0!important}
MAIN .dr-resources{max-width:1240px!important;padding:0 32px!important;margin:0 auto!important;display:grid;gap:14px}
MAIN .dr-group{background:#E7E3DA!important;color:#050505!important;border:0!important;border-radius:6px!important;padding:22px 24px!important;margin:0!important;min-width:0}
MAIN .dr-group-heading{display:flex;align-items:baseline;justify-content:space-between;gap:12px 28px;border-bottom:1px solid #b8b9ac;padding-bottom:15px;margin-bottom:4px}
MAIN .dr-group-heading h2{font-size:28px!important;font-weight:800!important;line-height:1.1!important;color:#050505!important}
MAIN .dr-group-heading p{font-size:14px!important;line-height:1.45!important;color:#34382f!important}
MAIN .dr-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 28px}
MAIN .resource-card-v3b2{display:grid!important;grid-template-columns:42px minmax(0,1fr);gap:8px 16px;padding:20px 0!important;margin:0!important;border:0!important;border-bottom:1px solid #b8b9ac!important;box-shadow:none!important;background:transparent!important;color:#050505!important;border-radius:0!important;min-width:0;align-content:start}
MAIN .resource-card-v3b2:last-child,MAIN .resource-card-v3b2:nth-last-child(2):nth-child(odd){border-bottom:0!important}
MAIN .dr-icon{width:36px;height:36px;grid-row:1/4;grid-column:1;margin-top:2px;color:#050505}
MAIN .resource-card-v3b2 h3{grid-column:2;font-size:18px!important;font-weight:800!important;line-height:1.25!important;color:#050505!important;overflow-wrap:anywhere}
MAIN .resource-card-v3b2 p{grid-column:2;font-size:14px!important;line-height:1.5!important;color:#34382f!important;margin:0!important}
MAIN .resource-card-v3b2 a{grid-column:2;display:inline-flex!important;align-items:center;min-height:44px!important;width:fit-content!important;max-width:100%;padding:8px 0!important;background:transparent!important;color:#050505!important;border:0!important;font-size:15px!important;font-weight:700!important;line-height:1.4!important;text-decoration:underline!important;text-underline-offset:4px;box-shadow:none!important;border-radius:0!important;white-space:normal!important}
MAIN .resource-card-v3b2 a:after{content:'→';margin-left:12px}
MAIN .resource-card-v3b2 a:hover{color:#414a34!important}
MAIN .download-note-v3b2{background:#707762!important;color:#E7E3DA!important;border:0!important;border-radius:6px!important;padding:18px 24px!important;margin:0!important;max-width:none!important}
MAIN .download-note-v3b2 strong{color:#E7E3DA!important;font-size:15px!important;line-height:1.5!important}
MAIN .download-note-v3b2 p{color:#E7E3DA!important;font-size:14px!important;line-height:1.5!important;margin:4px 0 0!important}
@media(max-width:850px){MAIN .dr-hero{min-height:320px;padding:28px 24px!important;grid-template-columns:1.2fr 1fr}MAIN .dr-photo{left:38%}MAIN .dr-resources{padding:0 24px!important}MAIN .dr-group-heading{display:block}MAIN .dr-group-heading p{margin-top:8px!important}}
@media(max-width:600px){MAIN{padding-bottom:24px!important}MAIN .dr-hero{display:flex!important;flex-direction:column;align-items:stretch;min-height:0;padding:26px 18px 0!important;gap:18px}MAIN .dr-copy{max-width:none}MAIN h1{font-size:36px!important;line-height:1.06!important;margin-bottom:15px!important}MAIN .dr-lede{font-size:16px!important;line-height:1.5!important}MAIN .dr-photo{position:relative;inset:auto;height:180px;flex:none;width:100%;border-radius:5px 5px 0 0}MAIN .dr-photo:after{background:linear-gradient(0deg,#050505,transparent 28%)}MAIN .dr-photo img{object-position:65% 60%!important}MAIN .dr-resources{padding:0 18px!important;gap:12px}MAIN .dr-group{padding:20px 18px 4px!important}MAIN .dr-group-heading h2{font-size:25px!important}MAIN .dr-cards{grid-template-columns:1fr}MAIN .resource-card-v3b2{grid-template-columns:32px minmax(0,1fr);column-gap:13px;padding:18px 0!important}MAIN .resource-card-v3b2:nth-last-child(2):nth-child(odd){border-bottom:1px solid #b8b9ac!important}MAIN .resource-card-v3b2:last-child{border-bottom:0!important}MAIN .dr-icon{width:29px;height:29px}MAIN .resource-card-v3b2 h3{font-size:17px!important}MAIN .download-note-v3b2{padding:17px 18px!important}}
`;
