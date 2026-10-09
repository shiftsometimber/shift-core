import {improveToolGuidance} from './public-tool-guidance.mjs';
// Bounded repair for the nine free public tools observed in the Semrush audit.
export const TOOL_PATHS = new Set(['/tools/waist-height','/tools/walking','/tools/water','/tools/healthy-weight','/tools/bmi','/tools/calories','/decision-centre','/tools/alcohol','/tools/protein']);
export const PUBLIC_STYLES = new Set(['/assets/shift-recovery-v6.css','/assets/shift-calculator-flow-v1.css','/assets/ask-timber-drawer-v2.css','/seo-wave2-v15.css','/assets/v136-desolation-recovery.css','/assets/v137-estate-closeout.css','/assets/header-navigation-v2.css','/assets/my-timber-pwa.css','/assets/shift-service-bridge-v1.css']);
const ORIGIN = 'https://shiftsometimber.co.uk';
function repairNode(node) {
 if (Array.isArray(node)) return node.map(repairNode);
 if (!node || typeof node !== 'object') return node;
 const copy = Object.fromEntries(Object.entries(node).map(([k,v]) => [k,repairNode(v)]));
 const types = Array.isArray(copy['@type']) ? copy['@type'] : [copy['@type']];
 if(types.some(t=>['WebApplication','SoftwareApplication'].includes(t)) && copy.isAccessibleForFree === true && copy.offers === undefined) {
  copy.offers = {'@type':'Offer',price:0,priceCurrency:'GBP'};
 }
 return copy;
}
export function repairFreeToolSchema(html) {
 return html.replace(/(<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script\s*>)/gi,(whole,open,json,close)=>{
  try { const before=JSON.parse(json),after=repairNode(before);return JSON.stringify(before)===JSON.stringify(after)?whole:open+JSON.stringify(after).replace(/</g,'\\u003c')+close; } catch { return whole; }
 });
}
export async function withPublicToolDelivery(response,request) {
 const url=new URL(request.url);
 if(url.origin!==ORIGIN || !['GET','HEAD'].includes(request.method) || response.status!==200) return response;
 const type=response.headers.get('Content-Type')||'';
 if(PUBLIC_STYLES.has(url.pathname) && type.split(';')[0].trim().toLowerCase()==='text/css' && !request.headers.has('Authorization') && !response.headers.has('Set-Cookie') && !/\bprivate\b/i.test(response.headers.get('Cache-Control')||'') && !/(?:^|,)\s*(?:cookie|authorization|\*)\s*(?:,|$)/i.test(response.headers.get('Vary')||'')) {
  const headers=new Headers(response.headers);
  headers.set('Cache-Control','public, max-age=300, must-revalidate');
  headers.delete('Pragma');headers.delete('Expires');
  headers.set('X-Shift-Public-Tool-Delivery','2026-10-08');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
 }
 if(request.method!=='GET' || !TOOL_PATHS.has(url.pathname) || !type.includes('text/html')) return response;
 const original=await response.clone().text(),updated=improveToolGuidance(repairFreeToolSchema(original),url.pathname);
 if(updated===original)return response;
 const headers=new Headers(response.headers);
 for(const name of ['Content-Length','Content-Encoding','ETag','Content-MD5','Digest','Last-Modified'])headers.delete(name);
 headers.set('X-Shift-Public-Tool-Delivery','2026-10-08');
 return new Response(updated,{status:response.status,statusText:response.statusText,headers});
}

