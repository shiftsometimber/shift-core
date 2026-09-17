// Owner's 17 September 2026 instruction supersedes earlier ticker allowlists.
export const tickerVersion = 'public-news-20260917-r4';
export const tickerAsset = '/assets/public-news-ticker-v1.js';
export const normalizePublicPath = path => {
  const normalized = path.replace(/\/+$/, '').replace(/\.html$/, '') || '/';
  return normalized === '/index' ? '/' : normalized;
};
const excludedRoots = [
  '/about', '/mens-mental-health', '/mental-health', '/good-to-talk',
  '/lounge', '/tap-room', '/my-timber', '/member', '/member-login', '/member-register',
  '/start-here', '/treatment-order', '/treatment-assessment', '/checkout', '/payment', '/verification',
  '/order-confirmation', '/order-success', '/treatment-confirmation', '/purchase',
  '/login', '/sign-in', '/register', '/forgot-password', '/reset-password',
  '/auth', '/hq', '/admin', '/v1', '/api'
];
export function tickerAllowed(pathname) {
  const path = normalizePublicPath(pathname);
  return path !== '/' && !excludedRoots.some(root => path === root || path.startsWith(root + '/'));
}
export function myTimberRedirect(request) {
  const url = new URL(request.url);
  if (!['GET', 'HEAD'].includes(request.method) || !['/my-timber', '/my-timber.html'].includes(url.pathname.replace(/\/+$/, ''))) return null;
  url.pathname = '/member/dashboard';
  if (url.hostname === 'shiftsometimber.co.uk' || url.hostname === 'www.shiftsometimber.co.uk') url.protocol = 'https:';
  return new Response(null, {status: 301, headers: {Location: url.href, 'Cache-Control': 'public, max-age=300'}});
}
const tickerMarkup = `<section id="shift-public-news" data-shift-news-ticker="${tickerVersion}" data-shift-ai-full-wire="${tickerVersion}" class="medicine-ticker-v138" aria-label="SHIFT Newsroom"><a class="shift-news-label" href="/shift-newsroom">SHIFT Newsroom</a><div class="shift-news-window"><div class="shift-news-track"><span class="shift-news-copy"><a href="/shift-newsroom">Read the latest published stories →</a><span aria-hidden="true"> · </span><a href="/shift-newsroom">Medicine news and evidence →</a></span></div></div></section>`;
export const tickerStyles = `.medicine-ticker-v138:not([data-shift-news-ticker]){display:none!important}
#shift-public-news{box-sizing:border-box;display:grid!important;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:16px;width:100%;max-width:100%;overflow:hidden;background:#707762;color:#050505;border-block:1px solid #050505;padding:10px max(18px,4vw);font:700 14px/1.45 Arial,sans-serif}
#shift-public-news a{color:#050505;text-decoration:none}#shift-public-news a:hover,#shift-public-news a:focus-visible{text-decoration:underline}#shift-public-news a:focus-visible{outline:2px solid #050505;outline-offset:3px}
#shift-public-news .shift-news-label{font-weight:900;white-space:nowrap}#shift-public-news .shift-news-window{min-width:0;overflow:hidden}#shift-public-news .shift-news-track{display:flex;width:max-content;max-width:none}#shift-public-news .shift-news-copy{display:flex;align-items:center;gap:24px;white-space:nowrap;padding-right:24px;flex-shrink:0}
#shift-public-news:not([data-ready]) .shift-news-track{width:auto}#shift-public-news:not([data-ready]) .shift-news-copy{flex:1;min-width:0;max-width:100%;padding:0;white-space:normal;flex-wrap:wrap;gap:8px 18px}
#shift-public-news[data-ready] .shift-news-track{animation:shiftPublicNews 90s linear infinite}#shift-public-news .shift-news-track:has(a:focus-visible){animation-play-state:paused}
@media(hover:hover) and (pointer:fine){#shift-public-news .shift-news-window:hover .shift-news-track{animation-play-state:paused}}
#shift-public-news [hidden]{display:none!important}
@keyframes shiftPublicNews{to{transform:translateX(-50%)}}
@media(max-width:560px){#shift-public-news{grid-template-columns:minmax(0,1fr);gap:6px 12px}#shift-public-news .shift-news-label{grid-column:1}#shift-public-news .shift-news-window{grid-column:1/-1}}
@media(prefers-reduced-motion:reduce){#shift-public-news .shift-news-track{animation:none!important;width:auto}#shift-public-news .shift-news-copy{white-space:normal;flex-wrap:wrap}#shift-public-news .shift-news-copy[aria-hidden]{display:none}}`;
export const contrastSafetyVersion='public-contrast-20260917-r2';
export const contrastSafetyStyles=String.raw`
/* Brand-only repair for computed-colour collisions found by the 532-URL live audit. */
.sst-reading-article-v31 :is(.road-card,.uni-panel,.uni-fighter,.uni-card,.social-community-card-v2223,.eu-card,.dec-panel,.ready-panel,.ready-card,.resource-card-v3b2,.faqcard,.founding-panel-v3b1,.fifa-card,.future-card,.compare-panel),
.ct-form-card,.kg-path-main,.shift-guided-card,.editorial-note-v2222,
.standard-layout :is(.section.white,.section.stone),.reading-layout :is(.section.white,.section.stone){background:#E7E3DA!important;color:#050505!important;border-color:#707762!important}
.sst-reading-article-v31 :is(.road-card,.uni-panel,.uni-fighter,.uni-card,.social-community-card-v2223,.eu-card,.dec-panel,.ready-panel,.ready-card,.resource-card-v3b2,.faqcard,.founding-panel-v3b1,.fifa-card,.future-card,.compare-panel) :is(h1,h2,h3,h4,p,span,strong,small,li,label),
.ct-form-card :is(h1,h2,h3,h4,p,span,strong,small,li,label),.kg-path-main :is(h1,h2,h3,h4,p,span,strong,small,li,label),
.shift-guided-card :is(h1,h2,h3,h4,p,span,strong,small,li,label),.editorial-note-v2222 :is(h1,h2,h3,h4,p,span,strong,small,li,label),
.standard-layout :is(.section.white,.section.stone) :is(h1,h2,h3,h4,p,span,strong,small,li,label),.reading-layout :is(.section.white,.section.stone) :is(h1,h2,h3,h4,p,span,strong,small,li,label){color:#050505!important;-webkit-text-fill-color:#050505!important}
.sst-reading-article-v31 :is(.fifa-card,.future-card) :is(.fifa-stat,.attribute-row,.procon-box,.future-badge){background:#E7E3DA!important;color:#050505!important;border-color:#707762!important}
.sst-reading-article-v31 :is(.fifa-card,.future-card) :is(.fifa-stat,.attribute-row,.procon-box,.future-badge) :is(h1,h2,h3,h4,p,span,strong,small,li){color:#050505!important;-webkit-text-fill-color:#050505!important}
.sst-service-bridge__limit{background:#050505!important;color:#E7E3DA!important;border:1px solid #707762!important}
.sst-service-bridge__limit :is(h1,h2,h3,h4,p,span,strong,small,li){color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}
a.sst-service-bridge__cta,.authority-next a,.shift-guided-actions__primary,.shift-guided-library__body button{background:#050505!important;color:#E7E3DA!important;border-color:#707762!important}
a.sst-service-bridge__cta :is(span,strong,small),.authority-next a :is(span,strong,small),.shift-guided-actions__primary :is(span,strong,small),.shift-guided-library__body button :is(span,strong,small){color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}
.at-composer,.at-dock{background:#E7E3DA!important;color:#050505!important}
.at-composer :is(label,label span,.at-composer-label),.at-dock :is(label,label span){color:#050505!important;-webkit-text-fill-color:#050505!important}
.sh-card__alt{background:#050505!important;color:#E7E3DA!important;border-color:#707762!important}.sh-card__alt :is(span,strong,small){color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}
.tool-intro{background:#050505!important;color:#E7E3DA!important}.tool-intro :is(h1,h2,h3,h4,p,span,strong,small,li){color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}
.featured-links__eyebrow{color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}
/* r2: exact shared roots identified by the complete 532-page ancestor map. */
html body main#main-content :is(aside.editorial-note-v2222,.ct-form-card,.kg-path-main,article.faqcard,article.article,.eu-card,.dec-panel,.ready-panel,.ready-card,.resource-card-v3b2,.social-community-card-v2223,.founding-panel-v3b1,.fifa-card,.future-card,.promise-card-v3b1,.cagri-card,.nhsm-card,.calc-explain-card,.life2-panel,.np-panel,.surg2-panel,.eu-panel,.proc-toc){background:#E7E3DA!important;color:#050505!important;border-color:#707762!important}
html body main#main-content :is(aside.editorial-note-v2222,.ct-form-card,.kg-path-main,article.faqcard,article.article,.eu-card,.dec-panel,.ready-panel,.ready-card,.resource-card-v3b2,.social-community-card-v2223,.founding-panel-v3b1,.fifa-card,.future-card,.promise-card-v3b1,.cagri-card,.nhsm-card,.calc-explain-card,.life2-panel,.np-panel,.surg2-panel,.eu-panel,.proc-toc) :is(h1,h2,h3,h4,h5,h6,p,span,strong,small,li,label,a,td,th,div){color:#050505!important;-webkit-text-fill-color:#050505!important}
html body main#main-content div.standard-layout section.section.white,
html body main#main-content div.standard-layout section.section.stone,
html body main#main-content div.reading-layout section.section.white,
html body main#main-content div.reading-layout section.section.stone{background:#E7E3DA!important;color:#050505!important}
html body main#main-content div.standard-layout section.section.white > .wrap > :is(h1,h2,h3,h4,p,.eyebrow),
html body main#main-content div.standard-layout section.section.stone > .wrap > :is(h1,h2,h3,h4,p,.eyebrow),
html body main#main-content div.reading-layout section.section.white > .wrap > :is(h1,h2,h3,h4,p,.eyebrow),
html body main#main-content div.reading-layout section.section.stone > .wrap > :is(h1,h2,h3,h4,p,.eyebrow){color:#050505!important;-webkit-text-fill-color:#050505!important}
html body main#main-content .sst-service-bridge .sst-service-bridge__limit{background:#050505!important;color:#E7E3DA!important}
html body main#main-content .sst-service-bridge .sst-service-bridge__limit *{color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}
html body main#main-content.authority-hub section.authority-next a{background:#050505!important;color:#E7E3DA!important;border-color:#707762!important}
html body main#main-content.authority-hub section.authority-next a *{color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}
html body main#main-content .shift-guided-card{background:#E7E3DA!important;color:#050505!important;border-color:#707762!important}
html body main#main-content .shift-guided-card *{color:#050505!important;-webkit-text-fill-color:#050505!important}
html body main#main-content :is(.shift-guided-actions__primary,.shift-guided-library__body button){background:#050505!important;color:#E7E3DA!important;border-color:#707762!important}
html body main#main-content :is(.shift-guided-actions__primary,.shift-guided-library__body button) *{color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}
html body main#main-content .review-status-v2222{color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}
html body main#main-content :is(table.reta-table,table.nhsm-table){background:#E7E3DA!important;color:#050505!important}
html body main#main-content :is(table.reta-table,table.nhsm-table) :is(td,th,span,strong,small,a){color:#050505!important;-webkit-text-fill-color:#050505!important}
html body main#main-content .calc-explain-card :is(h1,h2,h3,h4,p,span,strong,small,li){color:#050505!important;-webkit-text-fill-color:#050505!important}
html body main#main-content .sh-choice-grid-v72 button{background:#E7E3DA!important;color:#050505!important;border-color:#707762!important}
html body main#main-content .sh-choice-grid-v72 button *{color:#050505!important;-webkit-text-fill-color:#050505!important}
html body main#main-content .mmh-start-grid a{background:#E7E3DA!important;color:#050505!important;border-color:#707762!important}
html body main#main-content .mmh-start-grid a *{color:#050505!important;-webkit-text-fill-color:#050505!important}
html body main#main-content details.mw-evidence{background:#E7E3DA!important;color:#050505!important}
html body main#main-content details.mw-evidence :is(a,p,span,strong,small,li){color:#050505!important;-webkit-text-fill-color:#050505!important}
`;
export const contrastSafetyClient = String.raw`(function shiftContrastGuard(){
  const BLACK={r:5,g:5,b:5,hex:'#050505'},CREAM={r:231,g:227,b:218,hex:'#E7E3DA'};
  function rgb(v){const m=String(v).match(/rgba?\((\d+(?:\.\d+)?)[ ,]+(\d+(?:\.\d+)?)[ ,]+(\d+(?:\.\d+)?)(?:[ ,\/]+(\d+(?:\.\d+)?))?\)/i);return m?{r:+m[1],g:+m[2],b:+m[3],a:m[4]==null?1:+m[4]}:null}
  function lum(c){const f=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b)}
  function ratio(a,b){const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
  function blend(f,b){const a=f.a??1;return{r:f.r*a+b.r*(1-a),g:f.g*a+b.g*(1-a),b:f.b*a+b.b*(1-a),a:1}}
  function background(el){let n=el;while(n){const s=getComputedStyle(n);if(s.backgroundImage&&s.backgroundImage!=='none')return null;const c=rgb(s.backgroundColor);if(c&&c.a>.01)return c.a<1?blend(c,{r:255,g:255,b:255,a:1}):c;n=n.parentElement}return{r:255,g:255,b:255,a:1}}
  function hasOwnText(el){for(const n of el.childNodes)if(n.nodeType===3&&n.textContent.trim())return true;return el.matches('input,textarea,select,button')}
  function fix(el){if(!(el instanceof Element)||el.matches('script,style,svg,svg *'))return;const s=getComputedStyle(el),r=el.getBoundingClientRect();if(s.display==='none'||s.visibility==='hidden'||+s.opacity<=.02||r.width<=1||r.height<=1||!hasOwnText(el))return;const fg=rgb(s.color),bg=background(el);if(!fg||!bg)return;const effective=fg.a<1?blend(fg,bg):fg;if(ratio(effective,bg)>=2)return;const pick=ratio(BLACK,bg)>=ratio(CREAM,bg)?BLACK:CREAM;el.style.setProperty('color',pick.hex,'important');el.style.setProperty('-webkit-text-fill-color',pick.hex,'important');el.dataset.shiftContrastGuard='1'}
  function scan(){for(const el of document.querySelectorAll('body *'))fix(el)}
  let queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{scan();setTimeout(scan,120);setTimeout(scan,400)},{once:true});else{scan();setTimeout(scan,120)}
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
})();`;
// Keep browser code literal: Worker bundlers add private helpers to function.toString().
export const tickerClient = String.raw`(function bootTicker() {
  const start = async () => {
    const strip = document.getElementById('shift-public-news');
    if (!strip || strip.dataset.started) return;
    strip.dataset.started = 'true';
    const track = strip.querySelector('.shift-news-track');
    try {
      const response = await fetch('/v1/radar/ticker', {credentials:'omit', cache:'no-store', signal:AbortSignal.timeout(8000)});
      const body = await response.json();
      if (!response.ok) return;
      const edition = !body.current && body.published_edition?.current_wire === false ? body.published_edition : null;
      const items = body.current ? body.items : edition?.items;
      if (!Array.isArray(items)) return;
      const copy = document.createElement('span'); copy.className = 'shift-news-copy';
      const seen = new Set();
      for (const item of items) {
        let label = String(item.ticker_line || item.headline || '').trim();
        if (edition) {
          const at = Date.parse(item.published_at); if (!Number.isFinite(at)) continue;
          label = label + ' · Published ' + new Date(at).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'});
        }
        let url; try {url = new URL(item.url || '/shift-newsroom', location.origin);} catch {continue;}
        if (!label || url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol) || seen.has(label)) continue;
        seen.add(label);
        const link = document.createElement('a'); link.href = url.pathname + url.search + url.hash; link.textContent = label; copy.append(link);
      }
      if (!copy.childElementCount) return;
      if (edition) {strip.querySelector('.shift-news-label').textContent = 'Published in SHIFT'; strip.dataset.edition = edition.edition_id;}
      const duplicate = copy.cloneNode(true); duplicate.setAttribute('aria-hidden','true');
      duplicate.querySelectorAll('a').forEach(link => link.tabIndex = -1);
      track.replaceChildren(copy, duplicate); strip.setAttribute('data-ready', '');
      const fit = () => {
        const width = strip.querySelector('.shift-news-window').clientWidth;
        copy.style.minWidth = duplicate.style.minWidth = width + 'px';
      };
      fit(); new ResizeObserver(fit).observe(strip);
    } catch { }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();`;
export function publicTickerAsset(request) {
  if (new URL(request.url).pathname !== tickerAsset || !['GET','HEAD'].includes(request.method)) return null;
  return new Response(request.method === 'HEAD' ? null : tickerClient, {headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'}});
}
export async function withPublicTicker(request, response) {
  if (!response.ok || !['GET','HEAD'].includes(request.method) || !/text\/html/i.test(response.headers.get('Content-Type') || '')) return response;
  const source = await response.text();
  if (!/<\/head>/i.test(source) || !/<\/body>/i.test(source)) return new Response(request.method === 'HEAD' ? null : source, response);
  const contrastSource=source.includes('data-shift-public-contrast')?source:source.replace(/<\/head>/i,`<style data-shift-public-contrast="${contrastSafetyVersion}">${contrastSafetyStyles}</style></head>`);
  const guardedSource=contrastSource.includes('data-shift-contrast-guard')?contrastSource:contrastSource.replace(/<\/body>/i,`<script data-shift-contrast-guard="${contrastSafetyVersion}">${contrastSafetyClient}</script></body>`);
  const enabled = tickerAllowed(new URL(request.url).pathname);
  let html = guardedSource
    .replace(/<section\b(?=[^>]*(?:\bmedicine-ticker-v138\b|\bdata-shift-ai-full-wire\b|\bid=["']shift-public-news["']))[^>]*>[\s\S]*?<\/section>/gi, '')
    .replace(/<script\b[^>]*\bsrc=["'][^"']*\/(?:newsroom-ticker-v2|public-news-ticker-v1)\.js(?:\?[^"']*)?["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*data-shift-public-news[^>]*>[\s\S]*?<\/style>/gi, '');
  const legacyPresent = html !== guardedSource;
  if (enabled && /<\/header>/i.test(html)) {
    html = html.replace(/<\/header>/i, '$&' + tickerMarkup)
      .replace(/<\/head>/i, `<style data-shift-public-news>${tickerStyles}</style></head>`)
      .replace(/<\/body>/i, `<script defer src="${tickerAsset}?v=${tickerVersion}"></script></body>`);
  } else if (legacyPresent) {
    html = html.replace(/<\/head>/i, '<style data-shift-public-news>.medicine-ticker-v138{display:none!important}</style></head>');
  }
  if (html === source) return new Response(request.method === 'HEAD' ? null : source, response);
  const headers = new Headers(response.headers);
  for (const h of ['Content-Length','ETag','Last-Modified']) headers.delete(h);
  headers.set('X-Shift-Ticker-Policy', tickerVersion);
  headers.set('X-Shift-Contrast-Safety', contrastSafetyVersion);
  return new Response(request.method === 'HEAD' ? null : html, {status:response.status,statusText:response.statusText,headers});
}
