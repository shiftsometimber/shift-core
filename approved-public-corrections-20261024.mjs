import {approved} from './approved-public-corrections-data-20261024.mjs';
const digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
const hosts=new Set(['shiftsometimber.co.uk','www.shiftsometimber.co.uk']);
export async function approvedMedicalArticle(row){
 if(!row||row.slug!=='weight-loss-medication-eligibility-uk'||Number(row.id)!==32||row.status!=='published'||row.publish_at!=='2026-10-19T05:01:01.790Z'||row.editorial)return row;
 // A later CMS revision wins. Only the exact reviewed original may be corrected.
 if(await digest(row.body)!==approved.beforeHash)return row;
 return {...row,body:approved.body,approvedBodyHeading:approved.bodyHeading,updated_at:'2026-10-24T07:45:00.000Z'};
}
export function approvedTelemetryAsset(request){
 const u=new URL(request.url);if(!hosts.has(u.hostname)||u.pathname!=='/assets/shift-product-events-v42m.js')return null;
 if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
 return new Response(request.method==='HEAD'?null:approved.asset,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Shift-Approved-Correction':approved.version}});
}
export async function approvedComparisonAnswer(request,response){
 const u=new URL(request.url);if(!hosts.has(u.hostname)||request.method!=='GET'||response.status!==200||!String(response.headers.get('Content-Type')).includes('text/html'))return response;
 if(u.pathname==='/shift-health/blood-tests'){
  const encoded='Explore Baseline, Advanced &amp;amp; Complete | SHIFT Bloods';
  const htmlTitle='Explore Baseline, Advanced &amp; Complete | SHIFT Bloods';
  const plainTitle='Explore Baseline, Advanced & Complete | SHIFT Bloods';
  const before=await response.text();let after=before.split(encoded).join(htmlTitle);
  after=after.replace(/(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,(_,open,json,close)=>open+json.split(htmlTitle).join(plainTitle)+close);
  if(after===before)return new Response(before,response);
  const headers=new Headers(response.headers);for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(k);
  headers.set('Cache-Control','no-store');headers.set('X-Shift-Approved-Correction','bloods-title-20261029');
  return new Response(after,{status:response.status,statusText:response.statusText,headers});
 }
 if(u.pathname!=='/comparisons/medications/saxenda-vs-orlistat')return response;
 const before=await response.text(),anchor='<h2 data-section="04">NHS vs private reality</h2>';
 // Preserve every existing byte. Never duplicate an answer or patch a changed template.
 if(before.includes('id="can-you-take-saxenda-and-orlistat-together"'))return new Response(before,response);
 if(before.split(anchor).length!==2)throw Error('Approved comparison insertion anchor changed');
 const headers=new Headers(response.headers);for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(k);
 headers.set('Cache-Control','no-store');headers.set('X-Shift-Approved-Correction',approved.version);
 return new Response(before.replace(anchor,approved.comparisonHTML+anchor),{status:response.status,statusText:response.statusText,headers});
}
