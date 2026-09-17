// Owner's 17 September 2026 instruction supersedes earlier ticker allowlists.
export const tickerVersion = 'public-news-20260917';
export const tickerAsset = '/assets/public-news-ticker-v1.js';
export const normalizePublicPath = path => {
  const normalized = path.replace(/\/+$/, '').replace(/\.html$/, '') || '/';
  return normalized === '/index' ? '/' : normalized;
};
const excludedRoots = [
  '/about', '/mens-mental-health', '/mental-health', '/good-to-talk',
  '/lounge', '/tap-room', '/my-timber', '/member', '/member-login', '/member-register',
  '/start-here', '/treatment-order', '/treatment-assessment', '/checkout', '/payment', '/verification',
  '/order-confirmation', '/treatment-confirmation', '/purchase',
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
  // Fixed same-origin destination; retain the query and browser fragment semantics.
  url.pathname = '/member/dashboard';
  if (url.hostname === 'shiftsometimber.co.uk' || url.hostname === 'www.shiftsometimber.co.uk') url.protocol = 'https:';
  return new Response(null, {status: 301, headers: {Location: url.href, 'Cache-Control': 'public, max-age=300'}});
}
const tickerMarkup = `<section id="shift-public-news" data-shift-news-ticker="${tickerVersion}" data-shift-ai-full-wire="${tickerVersion}" class="medicine-ticker-v138" aria-label="SHIFT Newsroom"><a class="shift-news-label" href="/shift-newsroom">SHIFT Newsroom</a><div class="shift-news-window"><div class="shift-news-track"><span class="shift-news-copy"><a href="/shift-newsroom">Read the latest published stories →</a><span aria-hidden="true"> · </span><a href="/medicine-news">Medicine news and evidence →</a></span></div></div><button type="button" class="shift-news-pause" aria-label="Pause news ticker" aria-pressed="false" hidden>Pause</button></section>`;
export const tickerStyles = `.medicine-ticker-v138:not([data-shift-news-ticker]){display:none!important}
#shift-public-news{box-sizing:border-box;display:grid!important;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:16px;width:100%;max-width:100%;overflow:hidden;background:#707762;color:#050505;border-block:1px solid #050505;padding:10px max(18px,4vw);font:700 14px/1.45 Arial,sans-serif}
#shift-public-news a{color:#050505;text-decoration:none}#shift-public-news a:hover,#shift-public-news a:focus-visible{text-decoration:underline}#shift-public-news a:focus-visible,#shift-public-news button:focus-visible{outline:2px solid #050505;outline-offset:3px}
#shift-public-news .shift-news-label{font-weight:900;white-space:nowrap}#shift-public-news .shift-news-window{min-width:0;overflow:hidden}#shift-public-news .shift-news-track{display:flex;width:max-content;max-width:none}#shift-public-news .shift-news-copy{display:flex;align-items:center;gap:24px;white-space:nowrap;padding-right:24px;flex-shrink:0}
#shift-public-news:not([data-ready]) .shift-news-track{width:auto}#shift-public-news:not([data-ready]) .shift-news-copy{white-space:normal;flex-wrap:wrap;gap:8px 18px}
#shift-public-news[data-ready] .shift-news-track{animation:shiftPublicNews 90s linear infinite}#shift-public-news:hover .shift-news-track,#shift-public-news:focus-within .shift-news-track,#shift-public-news[data-paused] .shift-news-track{animation-play-state:paused}
#shift-public-news .shift-news-pause{font:inherit;cursor:pointer;border:1px solid #050505;border-radius:4px;padding:4px 8px;background:#e7e3da;color:#050505}#shift-public-news [hidden]{display:none!important}
@keyframes shiftPublicNews{to{transform:translateX(-50%)}}
@media(max-width:560px){#shift-public-news{grid-template-columns:minmax(0,1fr) auto;gap:6px 12px}#shift-public-news .shift-news-label{grid-column:1}#shift-public-news .shift-news-pause{grid-column:2;grid-row:1}#shift-public-news .shift-news-window{grid-column:1/-1}}
@media(prefers-reduced-motion:reduce){#shift-public-news .shift-news-track{animation:none!important;width:auto}#shift-public-news .shift-news-copy{white-space:normal;flex-wrap:wrap}#shift-public-news .shift-news-copy[aria-hidden]{display:none}#shift-public-news .shift-news-pause{display:none}}`;
function bootTicker() {
  const start = async () => {
    const strip = document.getElementById('shift-public-news');
    if (!strip || strip.dataset.started) return;
    strip.dataset.started = 'true';
    const track = strip.querySelector('.shift-news-track'), button = strip.querySelector('button');
    button.addEventListener('click', () => {
      const paused = !strip.hasAttribute('data-paused');
      strip.toggleAttribute('data-paused', paused);
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', paused ? 'Resume news ticker' : 'Pause news ticker');
      button.textContent = paused ? 'Resume' : 'Pause';
    });
    try {
      const response = await fetch('/v1/radar/ticker', {credentials:'omit', cache:'no-store', signal:AbortSignal.timeout(8000)});
      const body = await response.json();
      // Never present a failed/stale scan as a current wire. The permanent newsroom links remain usable.
      if (!response.ok || !body.current || !Array.isArray(body.items)) return;
      const copy = document.createElement('span'); copy.className = 'shift-news-copy';
      const seen = new Set();
      for (const item of body.items) {
        const label = String(item.ticker_line || item.headline || '').trim();
        let url; try {url = new URL(item.url || '/medicine-news', location.origin);} catch {continue;}
        if (!label || url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol) || seen.has(label)) continue;
        seen.add(label);
        const link = document.createElement('a'); link.href = url.pathname + url.search + url.hash; link.textContent = label; copy.append(link);
      }
      if (!copy.childElementCount) return;
      const duplicate = copy.cloneNode(true); duplicate.setAttribute('aria-hidden','true');
      duplicate.querySelectorAll('a').forEach(link => link.tabIndex = -1);
      track.replaceChildren(copy, duplicate); strip.setAttribute('data-ready', ''); button.hidden = false;
      const fit = () => {
        const width = strip.querySelector('.shift-news-window').clientWidth;
        copy.style.minWidth = duplicate.style.minWidth = width + 'px';
      };
      fit(); new ResizeObserver(fit).observe(strip);
    } catch { /* Keep the honest, working newsroom fallback. */ }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
}
export const tickerClient = `(${bootTicker.toString()})();`;
export function publicTickerAsset(request) {
  if (new URL(request.url).pathname !== tickerAsset || !['GET','HEAD'].includes(request.method)) return null;
  return new Response(request.method === 'HEAD' ? null : tickerClient, {headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'}});
}
export async function withPublicTicker(request, response) {
  if (!response.ok || !['GET','HEAD'].includes(request.method) || !/text\/html/i.test(response.headers.get('Content-Type') || '')) return response;
  const source = await response.text();
  // Do not alter non-document fragments or error responses.
  if (!/<\/head>/i.test(source) || !/<\/body>/i.test(source)) return new Response(request.method === 'HEAD' ? null : source, response);
  const enabled = tickerAllowed(new URL(request.url).pathname);
  let html = source
    .replace(/<section\b(?=[^>]*(?:\bmedicine-ticker-v138\b|\bdata-shift-ai-full-wire\b|\bid=["']shift-public-news["']))[^>]*>[\s\S]*?<\/section>/gi, '')
    .replace(/<script\b[^>]*\bsrc=["'][^"']*\/(?:newsroom-ticker-v2|public-news-ticker-v1)\.js(?:\?[^"']*)?["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*data-shift-public-news[^>]*>[\s\S]*?<\/style>/gi, '');
  const legacyPresent = html !== source;
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
  return new Response(request.method === 'HEAD' ? null : html, {status:response.status,statusText:response.statusText,headers});
}
