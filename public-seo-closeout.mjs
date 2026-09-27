const DESCRIPTIONS = new Map([
  ['/mental-health/medication-and-weight', 'Plain-English guidance on how mental-health medication can affect weight, practical next steps, and when to seek professional help.'],
  ['/mental-health/when-someone-refuses-help', 'Plain-English guidance for when someone refuses mental-health help, including safety concerns, practical boundaries and when to seek professional support.'],
]);

const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export const PUBLIC_TWITTER_IMAGE='<meta name="twitter:image" content="https://shiftsometimber.co.uk/assets/og-default.jpg">';
export const SHARING_IMAGE_PATHS=Object.freeze(['/commercial-principles','/contact','/downloads-resources','/partner-with-us','/press-centre','/shift-promise','/waiting-list-journey','/programme']);
export const PUBLIC_LINK_TARGETS=Object.freeze({
  '/articles/mounjaro-vs-wegovy':'/compare-weight-loss-treatments',
  '/member/journey':'/member/dashboard#journey',
  '/member/progress':'/member/dashboard#journey',
});

// These eight public documents already use this exact Open Graph image.
// Preserve a page-specific Twitter image if a later editorial change provides one.
export function completePublicSharingImage(html,path){
  if(!SHARING_IMAGE_PATHS.includes(path)||/<meta\b[^>]*\bname\s*=\s*["']twitter:image["']/i.test(html))return html;
  return html.replace(/<\/head\s*>/i,PUBLIC_TWITTER_IMAGE+'</head>');
}

export function repairPublicSeoLinks(html){
  // Anchors only: never rewrite scripts, forms, API requests or external hosts.
  return html.replace(/<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>|<!--[\s\S]*?-->|<a\b[^>]*>/gi,tag=>!/^<a\b/i.test(tag)?tag:tag.replace(/(\s)href\s*=\s*(["'])(.*?)\2/i,(attr,space,quote,href)=>{
    if(!href.includes('/member/')&&!href.includes('/articles/mounjaro-vs-wegovy'))return attr;
    let url;try{url=new URL(href,'https://shiftsometimber.co.uk')}catch{return attr}
    if(!['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk'].includes(url.origin))return attr;
    const target=PUBLIC_LINK_TARGETS[url.pathname];if(!target)return attr;
    const next=new URL(target,'https://shiftsometimber.co.uk');
    return space+'href='+quote+next.pathname+url.search+(next.hash||url.hash)+quote;
  }));
}

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
