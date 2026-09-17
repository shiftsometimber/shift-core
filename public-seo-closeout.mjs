const DESCRIPTIONS = new Map([
  ['/mental-health/medication-and-weight', 'Plain-English guidance on how mental-health medication can affect weight, practical next steps, and when to seek professional help.'],
  ['/mental-health/when-someone-refuses-help', 'Plain-English guidance for when someone refuses mental-health help, including safety concerns, practical boundaries and when to seek professional support.'],
]);

const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export const mentalHealthDescription = path => DESCRIPTIONS.get(path) || null;

export async function withPublicSeoCloseout(response, request) {
  const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
  const description = DESCRIPTIONS.get(path);
  const type = String(response?.headers?.get('content-type') || '').toLowerCase();
  if (!description || !response.ok || !type.includes('text/html')) return response;
  let html = await response.text();
  html = html
    .replace(/<meta\b(?=[^>]*\bname\s*=\s*["'](?:description|twitter:description)["'])[^>]*>/gi, '')
    .replace(/<meta\b(?=[^>]*\bproperty\s*=\s*["']og:description["'])[^>]*>/gi, '')
    .replace('</head>', `<meta name="description" content="${esc(description)}"><meta property="og:description" content="${esc(description)}"><meta name="twitter:description" content="${esc(description)}"></head>`);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('etag');
  headers.delete('last-modified');
  headers.set('cache-control', 'public, max-age=300, must-revalidate');
  headers.set('x-shift-seo-closeout', '2026-09-17');
  return new Response(request.method === 'HEAD' ? null : html, {status:response.status,statusText:response.statusText,headers});
}
