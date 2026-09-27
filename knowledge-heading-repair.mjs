// Correct only the extra headings injected by the two public guided hubs.
// Preserve the underlying document H1 and all interaction/copy.
export function repairKnowledgeAsset(source, path) {
  if (path === '/assets/knowledge-guided-v1.js') {
    return source.replace('<h1 id="kg-title">What do you need help with today?</h1>', '<h2 id="kg-title">What do you need help with today?</h2>');
  }
  if (path === '/assets/knowledge-guided-v1.css') {
    return source.replaceAll('.knowledge-guided h1', '.knowledge-guided #kg-title');
  }
  if (path === '/assets/shift-guided-hubs-v1.js') {
    // This asset also serves mental health; preserve that route exactly.
    return source.replace("<h1>'+config.title+'</h1>", "'+(type==='mental'?'<h1>':'<h2 class=\"shift-guided-title\">')+config.title+(type==='mental'?'</h1>':'</h2>')+'");
  }
  if (path === '/assets/shift-guided-hubs-v1.css') {
    return source.replaceAll('.shift-guided-front h1', '.shift-guided-front :is(h1,.shift-guided-title)');
  }
  return source;
}

const assets = new Set(['/assets/knowledge-guided-v1.js','/assets/knowledge-guided-v1.css','/assets/shift-guided-hubs-v1.js','/assets/shift-guided-hubs-v1.css']);
export async function withKnowledgeAssetRepair(response, request) {
  const path = new URL(request.url).pathname;
  if (!assets.has(path) || !response.ok || !['GET','HEAD'].includes(request.method)) return response;
  const source = await response.text();
  const repaired = repairKnowledgeAsset(source, path);
  const headers = new Headers(response.headers);
  for (const key of ['content-length','etag','last-modified','content-encoding']) headers.delete(key);
  headers.set('Cache-Control','no-store');
  headers.set('X-Shift-Knowledge-Heading','20260927');
  return new Response(request.method === 'HEAD' ? null : repaired, {status:response.status,headers});
}
