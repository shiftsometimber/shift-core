import {CSV,CHART} from './editorial/statistics/assets.js';
import {STATS,isArticle,articleMain,rewriteArticle,normalPath,VERSION} from './editorial/five-articles/render.mjs';
export const STATS_PATH=STATS;
// Keep the existing standards/download publication date. The five article
// revisions carry their own accurate date in visible copy, schema and sitemap.
export const RESOURCE_UPDATED='2026-09-13';
export function statisticsMain(){return articleMain(STATS_PATH)}
export function reviseStandards(html){
 html=html.replace('<h2>Named responsibility</h2><p>Substantive guides identify Matt O’Brien as the writer and researcher. Material health claims link to the authoritative sources supporting them, and regulated diagnosis or prescribing remains the responsibility of the relevant healthcare provider.</p>','<h2>Named responsibility</h2><p>Bylines identify the person or organisation responsible for each article. SHIFT Newsroom is an organisational byline. Material health claims link to their supporting evidence; diagnosis and prescribing remain the responsibility of the relevant healthcare provider.</p>');
 const section='<section id="newsroom" data-newsroom-standards><h2>How the SHIFT Newsroom works</h2><p>Our newsroom uses AI-assisted research and drafting. Articles are checked against their cited sources and require editorial approval before publication. SHIFT is responsible for the material it publishes.</p><p>Editorial approval is not independent clinical review. We do not present a generic editorial reviewer label as a named clinician’s assessment. Articles provide general information, not individual medical advice.</p><p>UK context and geographic scope should be explicit. An NHS access announcement, a regulator decision and a research finding are different kinds of evidence; we explain what each can and cannot establish.</p><p>Archive stories keep their original source dates separate from the date SHIFT publishes them. Article updates are labelled when recorded; a source without a recorded date is labelled accordingly. Sources should support the specific claims beside them.</p></section>';
 html=html.replace('<h2>Sources</h2>',section+'<h2>Sources</h2>');
 html=html.replace('<h2>Corrections</h2><p>Material factual or safety errors are corrected promptly and the affected content is rechecked rather than left stale.</p>','<h2 id="corrections">Corrections</h2><p>Found a factual error or a broken source? Email <a href="mailto:hello@shiftsometimber.co.uk?subject=Editorial%20correction">hello@shiftsometimber.co.uk</a> with the article URL, the disputed claim and a supporting source if available. Please do not include personal medical information.</p><p>Material factual or safety corrections should explain what changed on the affected article and show its updated date. Formatting changes are not a new publication. An older announcement should never be presented as today’s news merely because it has joined the archive.</p>');
 return html;
}
export async function withEditorialResources(response,request){
 const url=new URL(request.url),path=normalPath(url.pathname);
 if(!['GET','HEAD'].includes(request.method)||!['shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(url.hostname))return response;
 if(path===STATS_PATH+'/data.csv'||path===STATS_PATH+'/chart.svg'){
  const csv=path.endsWith('.csv');return new Response(request.method==='HEAD'?null:csv?CSV:CHART,{headers:{'Content-Type':csv?'text/csv; charset=utf-8':'image/svg+xml; charset=utf-8','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff',...(csv?{'Content-Disposition':'attachment; filename="shift-england-weight-waist-2024.csv"'}:{})}});
 }
 if((!isArticle(path)&&path!=='/editorial-standards')||!response.ok||!/text\/html/i.test(response.headers.get('Content-Type')||''))return response;
 // A genuine HEAD response can have no body. Do not attempt to transform it.
 if(request.method==='HEAD')return response;
 const original=await response.text(),html=isArticle(path)?rewriteArticle(original,path):reviseStandards(original);
 const headers=new Headers(response.headers);for(const key of ['ETag','Last-Modified','Content-Length','Content-Encoding'])headers.delete(key);headers.set('Cache-Control','no-store, must-revalidate');headers.set('X-Shift-Editorial-Resources','v1');if(isArticle(path))headers.set('X-Shift-Article-Revision',VERSION);
 return new Response(html,{status:response.status,statusText:response.statusText,headers});
}
