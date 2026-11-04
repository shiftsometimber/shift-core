// Matt's 4 November 2026 site-wide wording: weight-loss entry CTAs use
// "Explore Weight Loss". Only label text changes; destinations remain literal.
export const WEIGHT_LOSS_CTA = 'Explore Weight Loss';
export const WEIGHT_LOSS_CTA_RELEASE = 'explore-weight-loss-20261104';
const hosts = new Set(['shiftsometimber.co.uk', 'www.shiftsometimber.co.uk']);
const generic = /^(\s*)(?:start\s+(?:your\s+)?(?:here|shift)|explore\s+weight[\s-]+loss(?:\s+options)?)(\s*(?:[→›»]\s*)?)$/i;
export function weightLossLabel(text) {
  return text.replace(generic, (_, before, after) => before + WEIGHT_LOSS_CTA + after);
}
export function isWeightLossEntry(href) {
  try {
    const url = new URL(href, 'https://shiftsometimber.co.uk/');
    return ['http:', 'https:'].includes(url.protocol) && hosts.has(url.hostname)
      && url.pathname.replace(/\/+$/, '').replace(/\.html$/, '') === '/start-here';
  } catch { return false; }
}
export function relabelWeightLossCtas(html) {
  // Raw-text elements and comments are matched first so embedded code/templates
  // are never treated as links. Keep every non-label byte and nested card intact.
  return html.replace(/<(script|style|textarea|title|xmp|iframe|noembed|noframes)\b[^>]*>[\s\S]*?<\/\1\s*>|<!--[\s\S]*?-->|<a\b[^>]*>[\s\S]*?<\/a\s*>/gi, (block, raw) => {
    if (raw || block.startsWith('<!--')) return block;
    const start = block.match(/^<a\b[^>]*>/i)[0];
    const href = start.match(/\s+href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!href || !isWeightLossEntry(href[1] ?? href[2] ?? href[3])) return block;
    const opening = start.replace(/\b(aria-label|title)\s*=\s*(["'])(.*?)\2/gi,
      (attribute, name, quote, value) => name + '=' + quote + weightLossLabel(value) + quote);
    const rest = block.slice(start.length).replace(
      /<(script|style|textarea|title|xmp)\b[^>]*>[\s\S]*?<\/\1\s*>|<!--[\s\S]*?-->|<[^>]*>|[^<]+/gi,
      (part, rawPart) => rawPart || part.startsWith('<') ? part : weightLossLabel(part));
    return opening + rest;
  });
}
export function withWeightLossCta(request, response) {
  const path = new URL(request.url).pathname;
  if (request.method !== 'GET' || !response.ok
      || !/text\/html/i.test(response.headers.get('Content-Type') || '')
      || /^\/(?:member(?:\/|$)|v1(?:\/|$)|hq(?:\/|$)|admin(?:\/|$)|api(?:\/|$)|clinical-review(?:\/|$))/.test(path)) return response;
  return response.text().then(before => {
    const after = relabelWeightLossCtas(before);
    const headers = new Headers(response.headers);
    for (const name of ['Content-Length', 'Content-Encoding', 'ETag', 'Last-Modified']) headers.delete(name);
    headers.set('X-Shift-Weight-Loss-CTA', WEIGHT_LOSS_CTA_RELEASE);
    return new Response(after, {status:response.status, statusText:response.statusText, headers});
  });
}
export function wrapWeightLossCta(original) {
  return {...original, async fetch(request, env, ctx) {
    return withWeightLossCta(request, await original.fetch(request, env, ctx));
  }};
}
