// Contextual reading links only: these are published editorial pages, not service offers.
const archive = '/medicine-news/uk-archive-';
export const NEWSROOM_READING = {
  '/explore-knowledge': [
    ['Weight & habits', 'What happened after a men’s weight-loss trial?', 'game-of-stones-men-weight-loss-followup', 'weight'],
    ['Mental health', 'Anxiety and NHS talking therapies', 'anxiety-talking-therapies-self-referral', 'mental-health'],
    ['NHS access', 'England’s pharmacy cholesterol pilot explained', 'pharmacy-cholesterol-pilot-england', 'access'],
  ],
  '/shift-health': [
    ['Heart health', 'Blood-pressure checks: understanding access in England', 'blood-pressure-checks-england-access', 'heart-metabolic'],
    ['Mental health', 'Anxiety and NHS talking therapies', 'anxiety-talking-therapies-self-referral', 'mental-health'],
    ['Research', 'Prostate screening research and Black men', 'transform-prostate-screening-black-men', 'research'],
  ],
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const style = `<style data-newsroom-reading-style>
.sst-news-reading{box-sizing:border-box;width:min(1200px,calc(100% - 40px));margin:48px auto;color:#e7e3da;font:16px/1.55 Arial,Helvetica,sans-serif}
.sst-news-reading h2{font:700 clamp(26px,3vw,36px)/1.15 Arial,Helvetica,sans-serif!important;letter-spacing:-.025em;margin:0 0 12px!important;color:#e7e3da!important}
.sst-news-reading>p{font:16px/1.55 Arial,Helvetica,sans-serif!important;margin:0 0 22px!important;color:#adb09f!important;max-width:720px}
.sst-news-reading ul{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;list-style:none;margin:0 0 20px;padding:0}
.sst-news-reading li{box-sizing:border-box;min-width:0;display:flex;flex-direction:column;gap:12px;padding:22px;border:1px solid #707762;border-radius:14px;background:#10110f}
.sst-news-reading small{font:700 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#adb09f}
.sst-news-reading a{color:#e7e3da!important;text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1px;overflow-wrap:anywhere}
.sst-news-reading a:hover{text-decoration-thickness:2px}
.sst-news-reading a:focus-visible{outline:2px solid #e7e3da;outline-offset:5px;border-radius:2px}
.sst-news-reading .sst-news-story{font:700 20px/1.35 Arial,Helvetica,sans-serif;flex:1}
.sst-news-reading .sst-news-topic{font:14px/1.5 Arial,Helvetica,sans-serif;padding-top:8px}
.sst-news-reading .sst-news-all{display:inline-block;min-height:44px;padding:8px 0;box-sizing:border-box;font-weight:700}
@media(max-width:700px){.sst-news-reading{margin:36px auto}.sst-news-reading ul{grid-template-columns:1fr}.sst-news-reading li{padding:20px}}
</style>`;
export function addNewsroomReading(html, path) {
  const rows = NEWSROOM_READING[path.replace(/\/$/, '').replace(/\.html$/, '')];
  if (!rows || html.includes('data-newsroom-reading') || !/<\/main>/i.test(html)) return html;
  const cards = rows.map(([topic,title,slug,filter]) => `<li><small>${escape(topic)}</small><a class="sst-news-story" href="${archive}${escape(slug)}">${escape(title)}</a><a class="sst-news-topic" href="/shift-newsroom#region=uk&amp;topic=${filter}">More UK ${topic.toLowerCase()} stories →</a></li>`).join('');
  const section = `<section class="sst-news-reading" data-newsroom-reading aria-labelledby="sst-news-reading-title"><h2 id="sst-news-reading-title">From the UK newsroom</h2><p>Explore the evidence behind UK health stories, with clear sources, dates and practical context. Each article explains where its findings apply.</p><ul>${cards}</ul><a class="sst-news-all" href="/shift-newsroom#region=uk">Browse all UK news →</a></section>`;
  return html.replace(/<\/head>/i, style + '</head>').replace(/<\/main>/i, section + '</main>');
}
export async function withNewsroomReading(response, request) {
  const url = new URL(request.url);
  if (request.method !== 'GET' || !['shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(url.hostname) || !NEWSROOM_READING[url.pathname.replace(/\/$/, '').replace(/\.html$/, '')] || !response.ok || !/text\/html/i.test(response.headers.get('content-type') || '')) return response;
  const original = await response.text(), html = addNewsroomReading(original, url.pathname);
  const headers = new Headers(response.headers);
  if (html !== original) {
    for (const name of ['Content-Length','ETag','Last-Modified']) headers.delete(name);
    headers.set('Cache-Control','no-store, must-revalidate');
    headers.set('X-Shift-Newsroom-Reading','v1');
  }
  return new Response(html, {status:response.status,statusText:response.statusText,headers});
}
