import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {news,articles} from './generated/fixtures.mjs';
import {radarNewsPageRoutes} from '../../radar-news-pages-v1.js';
import {renderShiftHealthDocument} from '../../shift-health-public.mjs';
import {withPublicShellContract} from '../../public-shell-contract.mjs';
import {withPublicTicker} from '../../public-navigation-policy.mjs';
import {withPwa} from '../../my-timber-pwa/presentation.mjs';

const origin='https://shiftsometimber.co.uk',realFetch=globalThis.fetch;
const sha=s=>createHash('sha256').update(s).digest('hex');
const changed=JSON.parse(readFileSync('preview/seo-repairs/generated/changes.json','utf8'));
const paths=[...new Set(['/', '/guides/retatrutide-uk-guide','/shift-health','/articles/mounjaro-cost-uk','/mens-mental-health','/programme','/about','/start-here','/treatment-centre','/mounjaro','/wegovy','/foundayo','/shop','/explore-knowledge','/glp1-knowledge-centre','/articles/stopping-glp1','/shift-health/testosterone-energy','/clinic-gone-quiet','/provider-switch','/shift-newsroom',...changed.map(x=>'/'+x.slug)])];
const fingerprint=await(await realFetch(origin+'/DEPLOYMENT-FINGERPRINT.json')).json();
assert.equal(fingerprint.aggregate_sha256,'e8e9697b90eb1d91cbe10897a6858a672a26d3e219308f97c8d508dc6f9f9496');
const pages={},records=[];
const DB={prepare(sql){assert(sql.includes("e.status='published'"));return{async all(){return {results:news}}}}};
function main(html){const found=html.match(/<main\b[\s\S]*?<\/main>/i);assert(found,'Missing main');return found[0];}
function headFields(html){return [...html.matchAll(/<title>[\s\S]*?<\/title>|<meta\b[^>]*(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+)["'][^>]*>|<link\b[^>]*rel=["']canonical["'][^>]*>|<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi)].map(x=>x[0]).join('');}
for(const path of paths){
 const r=await realFetch(origin+path,{headers:{'User-Agent':'SHIFT-scoped-preview-capture/1'}});assert.equal(r.status,200,path);const baseline=await r.text();let candidate=baseline;
 const request=new Request(origin+path);
 if(path.startsWith('/medicine-news/')||path==='/shift-newsroom'){
  // The renderer receives the existing live page as a shell, but only its actual
  // new main and metadata are transplanted. Existing outer scripts/styles remain.
  globalThis.fetch=async()=>new Response(baseline,{headers:{'Content-Type':'text/html'}});
  try{
   const rendered=await(await radarNewsPageRoutes(request,{DB})).text();
   candidate=candidate.replace(/<main\b[\s\S]*?<\/main>/i,()=>main(rendered));
   const fields=headFields(candidate); // remove exact old SEO elements individually
   for(const item of fields.matchAll(/<title>[\s\S]*?<\/title>|<meta\b[^>]*>|<link\b[^>]*>|<script\b[^>]*>[\s\S]*?<\/script>/gi))candidate=candidate.replace(item[0],'');
   candidate=candidate.replace('</head>',headFields(rendered)+'</head>');
   assert.equal(main(candidate),main(rendered));
  } finally {globalThis.fetch=realFetch;}
 }else if(path==='/shift-health'){
  // Confirm this delta comes from the actual public health renderer, without
  // discarding the existing outer reading/discovery/continuity sections.
  const rendered=renderShiftHealthDocument('<html><head></head><body><main></main></body></html>');
  const h1=main(rendered).match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i)[0];
  candidate=candidate.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i,h1);
  const title=rendered.match(/<title>([\s\S]*?)<\/title>/i)[1];
  candidate=candidate.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+title+'</title>')
   .replace(/(<meta\b[^>]*(?:name|property)=["'](?:og:title|twitter:title)["'][^>]*content=["'])[^"']*(["'])/gi,'$1'+title+'$2')
   .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,tag=>tag.replaceAll('SHIFT Health | Wider Men’s Health',title));
 }
 let response=await withPublicTicker(request,new Response(candidate,{headers:{'Content-Type':'text/html; charset=utf-8'}}));
 response=await withPublicShellContract(request,response);response=await withPwa(request,response);candidate=await response.text();
 pages[path]={baseline,candidate};
 records.push({path,baselineSha256:sha(baseline),candidateSha256:sha(candidate),baselineBytes:Buffer.byteLength(baseline),candidateBytes:Buffer.byteLength(candidate)});
}
const ticker=await(await realFetch(origin+'/v1/radar/ticker')).text();
const after=await(await realFetch(origin+'/DEPLOYMENT-FINGERPRINT.json')).json();assert.equal(after.aggregate_sha256,fingerprint.aggregate_sha256,'Production moved during capture');
mkdirSync('preview/seo-repairs/generated',{recursive:true});
writeFileSync('preview/seo-repairs/generated/pages.mjs','export const pages='+JSON.stringify(pages)+';\nexport const ticker='+JSON.stringify(ticker)+';\n');
writeFileSync('preview/seo-repairs/generated/render-manifest.json',JSON.stringify({capturedAt:new Date().toISOString(),baselineFingerprint:fingerprint.aggregate_sha256,sourceCommit:process.env.CANDIDATE_SHA||process.env.GITHUB_SHA,scope:'One read-only render preview. Actual candidate main/metadata and public-shell/ticker/image repair functions, pinned public outer HTML. Not authenticated end-to-end or production proof.',records},null,2));
console.log('Prepared',records.length,'baseline/candidate public page pairs; production untouched.');
