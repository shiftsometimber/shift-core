import {assets} from './config.mjs';
export const commonCSS=String.raw`
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
`;
import {providerCSS,causesCSS} from './styles.mjs';
export const css=commonCSS+providerCSS+causesCSS;
export const providerHero=`<section class="sp-hero sp-ps2" aria-labelledby="nhh-title-switching"><div class="sp-copy"><p class="sp-eyebrow">CHANGING PROVIDER</p><h1 id="nhh-title-switching">Changing provider?<br>Keep your story together.</h1><p class="sp-lede">Bring your useful records and questions together, then keep your everyday support running through My Timber.</p><div class="sp-actions"><a class="sp-button" href="#continuity-now-title">Prepare for a provider change <span aria-hidden="true">→</span></a><a class="sp-link" href="/member/dashboard?entry=continuity#today">Open free My Timber <span aria-hidden="true">→</span></a></div><p class="sp-note">A new clinician assesses your treatment. An existing dose is not a guarantee of continuation.</p></div><figure class="sp-photo"><img src="${assets[0]}" alt="A man reviewing papers and a notebook in a library. Illustrative image." width="1536" height="1024" fetchpriority="high" decoding="async"></figure></section>`;
export const providerStrip='<aside class="sp-prescription-note">Your prescription does not have to move to use My Timber.</aside>';
