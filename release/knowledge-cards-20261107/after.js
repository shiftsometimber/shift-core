async function withDynamicBabyLoveDiscovery(response, request, env) {
  const u = new URL(request.url), path = u.pathname.replace(/\.html$/, "").replace(/\/$/, "");
  if (!HOSTS.has(u.hostname) || request.method !== "GET" || !response.ok || !["/knowledge", "/explore-knowledge", "/sitemap.xml"].includes(path) || !env.DB) return response;
  let rows4 = [];
  try {
    ({ results: rows4 = [] } = await env.DB.prepare(`SELECT a.title,a.slug,a.summary,a.publish_at,a.updated_at FROM knowledge_articles a WHERE a.status='published' AND a.publish_at IS NOT NULL AND julianday(a.publish_at)<=julianday('now') AND a.slug NOT IN ('wegovy-cost-uk','oral-semaglutide-for-weight-loss') ORDER BY a.publish_at DESC LIMIT 100`).all());
  } catch {
    rows4 = [];
  }
  const own3 = await editorialDiscovery(env);
  const map2 = new Map(rows4.map((r) => [r.slug, r]));
  for (const row of own3) map2.set(row.slug, row);
  const bespokeGuides = [];
  if (path !== "/sitemap.xml") {
    for (const row of [
      { slug: "wegovy-cost-uk", title: "Wegovy costs in the UK", summary: "What to check when comparing quotes and ongoing costs." },
      { slug: "oral-semaglutide-for-weight-loss", title: "Oral semaglutide for weight loss in the UK", summary: "A guide to what the published research can tell you." }
    ]) {
      map2.delete(row.slug);
      bespokeGuides.push({ ...row, bespokeKnowledgeGuide: true });
    }
  }
  rows4 = [...bespokeGuides, ...map2.values()];
  if (!rows4.length) return response;
  let text11 = await response.text();
  if (path === "/sitemap.xml") {
    for (const row of rows4) {
      const loc = "https://shiftsometimber.co.uk/articles/" + row.slug;
      if (row.editorial && text11.includes("<loc>" + loc + "</loc>")) {
        const escaped = loc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        text11 = text11.replace(new RegExp("<url>\\s*<loc>" + escaped + "<\\/loc>[\\s\\S]*?<\\/url>"), "<url><loc>" + loc + "</loc><lastmod>" + String(articleModifiedDate(row)).slice(0, 10) + "</lastmod></url>");
      } else if (!text11.includes("<loc>" + loc + "</loc>")) text11 = text11.replace("</urlset>", "<url><loc>" + loc + "</loc><lastmod>" + String(articleModifiedDate(row)).slice(0, 10) + "</lastmod></url></urlset>");
    }
  } else {
    const legacyMarker = /<div\b(?=[^>]*\bid=["']knowledgeResults["'])[^>]*>/, healthMarker = /<div\b(?=[^>]*\bclass=["'][^"']*(?:\bkh-grid\b[^"']*\bkh-legacy\b|\bkh-legacy\b[^"']*\bkh-grid\b)[^"']*["'])[^>]*>/;
    const marker2 = healthMarker.test(text11) ? healthMarker : legacyMarker;
    if (marker2.test(text11)) {
      const health2 = marker2 === healthMarker;
      const cards = rows4.filter((r) => !text11.includes('data-babylove-dynamic="' + r.slug + '"') && !text11.includes('href="/articles/' + r.slug + '"') && (!r.bespokeKnowledgeGuide || !new RegExp(`\\bhref\\s*=\\s*(["'])(?:https://(?:www\\.)?shiftsometimber\\.co\\.uk)?/articles/${r.slug}/?\\1`, "i").test(text11))).map((r) => health2 ? '<article class="kh-card" data-kh-card data-kh-topic="existing" data-babylove-dynamic="' + esc6(r.slug) + '"><h3>' + esc6(r.title) + "</h3><p>" + esc6(r.summary || "SHIFT knowledge article.") + '</p><a href="/articles/' + esc6(r.slug) + '">Read the guide \u2192</a></article>' : '<article class="knowledge-card" data-babylove-dynamic="' + esc6(r.slug) + '"><h3><a href="/articles/' + esc6(r.slug) + '">' + esc6(r.title) + "</a></h3><p>" + esc6(r.summary || "SHIFT knowledge article.") + "</p></article>").join("");
      text11 = text11.replace(marker2, (m) => m + cards);
    }
  }
  const headers11 = new Headers(response.headers);
  for (const k of ["Content-Length", "Content-Encoding", "ETag", "Last-Modified"]) headers11.delete(k);
  headers11.set("Cache-Control", "no-store, must-revalidate");
  return new Response(text11, { status: response.status, headers: headers11 });
}
