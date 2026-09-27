export async function articleSitemapResponse(request, loadSource) {
  if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
  try {
    const source = await loadSource();
    if (!source.ok) throw new Error('Sitemap source unavailable');
    const xml = await source.text(), root = xml.match(/<urlset\b[^>]*>/);
    if (!root || !xml.includes('</urlset>')) throw new Error('Invalid sitemap source');
    const seen = new Set(), entries = [];
    for (const match of xml.matchAll(/<url\b[^>]*>[\s\S]*?<\/url>/g)) {
      const loc = match[0].match(/<loc>\s*([^<]+)\s*<\/loc>/)?.[1]?.trim();
      if (!loc || !/^https:\/\/shiftsometimber\.co\.uk\/articles\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(loc) || seen.has(loc)) continue;
      seen.add(loc); entries.push(match[0]);
    }
    if (!entries.length) throw new Error('No article URLs in source');
    const body = '<?xml version="1.0" encoding="UTF-8"?>\n'+root[0]+'\n'+entries.join('\n')+'\n</urlset>\n';
    return new Response(request.method==='HEAD'?null:body,{headers:{
      'Content-Type':'application/xml; charset=utf-8',
      'Cache-Control':'public, max-age=300, must-revalidate',
      'X-Shift-Sitemap-Authority':'articles-from-unified-sitemap-v1',
      'X-Shift-Article-Count':String(entries.length)
    }});
  } catch {
    return new Response(request.method==='HEAD'?null:'Article sitemap temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'300','Content-Type':'text/plain; charset=utf-8'}});
  }
}
