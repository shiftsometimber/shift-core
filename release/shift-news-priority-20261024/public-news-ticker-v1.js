(function bootTicker() {
  const origin = 'https://shiftsometimber.co.uk';
  function publishedItems(rows, newsroom, now) {
    const selected = [], seen = new Set();
    for (const row of Array.isArray(rows) ? rows : []) {
      if (newsroom && (!Array.isArray(row.destinations) || !row.destinations.includes('medicine_news'))) continue;
      const meta = row.metadata || {};
      const first = Date.parse(meta.datePublished || row.published_at);
      const revised = Date.parse(meta.dateModified || '');
      const at = Number.isFinite(revised) && revised > first ? revised : first;
      if (!Number.isFinite(first) || !Number.isFinite(at) || first > now || at > now) continue;
      const slug = typeof meta.slug === 'string' ? '/' + meta.slug.replace(/^\/+/, '') : '';
      let url;
      try { url = new URL(newsroom ? meta.canonical || slug : row.url, origin); } catch { continue; }
      if (url.origin !== origin || url.username || url.password || !url.pathname.startsWith('/') || url.pathname === '/' || url.search || url.hash) continue;
      const headline = String(row.story_headline || row.headline || '').trim();
      if (!headline || headline.length > 500) continue;
      selected.push({id:row.id, headline, url:url.pathname, published_at:new Date(first).toISOString(), display_at:new Date(at).toISOString(), revised:at > first, at});
    }
    // Owner-selected lead expires after seven days, without changing source dates.
    const lead = '/medicine-news/mps-obesity-treatment-access-support-october-2026';
    const priority = item => item.url === lead && now < Date.parse('2026-10-31T20:00:00Z') ? 1 : 0;
    selected.sort((a,b) => priority(b) - priority(a) || b.at - a.at || Number(b.id) - Number(a.id));
    return selected.filter(item => {
      const key = item.url.replace(/\/+$/, '');
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).slice(0, 8);
  }
  const start = async () => {
    const strip = document.getElementById('shift-public-news');
    if (!strip || strip.dataset.started) return;
    strip.dataset.started = 'true';
    const track = strip.querySelector('.shift-news-track');
    strip.querySelector('.shift-news-label').textContent = 'SHIFT News:';
    strip.setAttribute('aria-label', 'SHIFT News');
    try {
      const get = async path => {
        const response = await fetch(origin + path, {credentials:'omit', cache:'no-store', signal:AbortSignal.timeout(8000)});
        if (!response.ok) throw new Error('Published news unavailable');
        const body = await response.json();
        if (body.ok !== true || !Array.isArray(body.items)) throw new Error('Invalid published news');
        return body;
      };
      // The Newsroom response contains published stories only. Never fetch review
      // queues or infer publication from a draft, source event or scan heartbeat.
      const [news, wire] = await Promise.allSettled([get('/v1/radar/news'), get('/v1/radar/ticker')]);
      const now = Date.now();
      let items = news.status === 'fulfilled' ? publishedItems(news.value.items, true, now) : [];
      if (!items.length && wire.status === 'fulfilled') items = publishedItems(wire.value.items, false, now);
      if (!items.length) return; // Keep the existing neutral Newsroom links.
      const copy = document.createElement('span'); copy.className = 'shift-news-copy';
      for (const item of items) {
        const link = document.createElement('a'); link.href = item.url;
        link.textContent = item.headline + ' · ' + (item.revised ? 'Updated ' : 'Published ') + new Date(item.display_at).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
        copy.append(link);
      }
      strip.querySelector('.shift-news-label').textContent = 'SHIFT News:';
      strip.dataset.edition = 'shift-news-shared-v3';
      // Feed/scan freshness is deliberately not promoted to current=true.
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
})();
