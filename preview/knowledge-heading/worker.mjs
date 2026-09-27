import {repairPublicSeoLinks} from '../../public-seo-closeout.mjs';
import {withKnowledgeAssetRepair} from '../../knowledge-heading-repair.mjs';
export default {async fetch(request) {
  const url = new URL(request.url);
  if (!['GET','HEAD'].includes(request.method) || !(['/explore-knowledge','/glp1-knowledge-centre','/about'].includes(url.pathname) || /\.(css|js|png|jpg|webp|svg|woff2?|ico)$/.test(url.pathname))) return new Response('Read-only scoped preview',{status:404});
  const upstream = await fetch('https://shiftsometimber.co.uk'+url.pathname+url.search);
  let response = await withKnowledgeAssetRepair(upstream,request);
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag','noindex, nofollow');
  headers.set('Cache-Control','no-store');
  headers.delete('content-length');headers.delete('content-encoding');
  const type=headers.get('content-type')||'';
  if(type.includes('text/html')) return new Response(repairPublicSeoLinks(await response.text()),{status:response.status,headers});
  return new Response(response.body,{status:response.status,headers});
}};
