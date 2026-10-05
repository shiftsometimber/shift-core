import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {articleHTML,articleModifiedDate} from '../../babylove/dynamic-public.mjs';
import {readCurrentMain} from '../../scripts/current-main-guard.mjs';

export const SLUGS=Object.freeze(['wegovy-side-effects-timeline','nhs-weight-loss-drugs']);
const root=fileURLToPath(new URL('./',import.meta.url));
const proof='organic-growth-proof';
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const sha=value=>createHash('sha256').update(String(value)).digest('hex');
const save=(name,value)=>{mkdirSync(proof,{recursive:true});writeFileSync(proof+'/'+name,JSON.stringify(value,null,2)+'\n')};
export const literal=value=>value===null?'NULL':typeof value==='number'?String(value):"'"+String(value).replaceAll("'","''")+"'";
const ident=value=>{assert(/^[a-z_][a-z0-9_]*$/i.test(value),'Unexpected database column');return '"'+value+'"'};
const recordHash=row=>sha(JSON.stringify(Object.fromEntries(Object.entries(row).sort(([a],[b])=>a.localeCompare(b)))));
const editFields=['title','seo_title','summary','body','updated_at'];

function query(sql){
 const stdout=execFileSync('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',sql],{encoding:'utf8',maxBuffer:12*1024*1024,timeout:60000});
 const result=JSON.parse(stdout);assert(Array.isArray(result)&&result.length&&result.every(x=>x.success!==false),'D1 query failed');return result.flatMap(x=>x.results||[]);
}
function rows(){
 const list=SLUGS.map(literal).join(',');
 const articles=query('SELECT * FROM knowledge_articles WHERE slug IN ('+list+') ORDER BY slug');
 const receipts=query('SELECT * FROM babylove_receipts WHERE slug IN ('+list+') ORDER BY slug');
 assert.equal(articles.length,SLUGS.length,'Expected existing article rows missing');assert.equal(receipts.length,SLUGS.length,'Expected original publication receipts missing');
 return {articles,receipts};
}
export function validateBaseline(current,baseline){
 assert.equal(current.articles.length,2);assert.equal(current.receipts.length,2);
 for(const expected of baseline.articles){
  const row=current.articles.find(x=>x.slug===expected.slug);assert(row,'Article missing');
  assert.equal(row.status,'published');assert.equal(row.title,expected.expected_title,'Live title changed since review');
  assert.equal(row.seo_title||row.title,expected.expected_seo_title,'Live search title changed since review');
  assert.equal(row.summary,expected.expected_summary,'Live summary changed since review');
  assert.equal(row.publish_at,expected.expected_publish_at,'Publication identity changed');
  assert.equal(articleModifiedDate(row),expected.expected_modified_at,'Article changed since inspected baseline');
  if(expected.expected_main_sha256)assert.equal(sha(htmlPart(articleHTML(row),'main')),expected.expected_main_sha256,'Full article body changed since inspected baseline');
  assert(current.receipts.some(r=>r.slug===row.slug),'Original receipt absent');
 }
}
export function validateDraft(draft){
 assert(SLUGS.includes(draft.slug));
 for(const key of ['title','seo_title','summary','body'])assert(typeof draft[key]==='string'&&draft[key].trim(),'Missing '+key);
 assert(draft.summary.length<=180,'Search description too long');
 assert(draft.body.split(/\s+/).length>=600,'Substantial answer required');
 assert(draft.body.includes('5 October 2026'),'Source-check date absent');
 assert(draft.body.includes('not')&&draft.body.includes('prescrib'),'Service and clinical boundaries absent');
 assert(!/buy now|discount code|book a SHIFT prescribing|guaranteed weight loss|clinically reviewed by/i.test(draft.body),'Promotional or unsupported claim');
 assert(Array.isArray(draft.sources)&&draft.sources.length>=3);
 for(const source of draft.sources){const u=new URL(source.url);assert.equal(u.protocol,'https:');assert(['nhs.uk','nice.org.uk','gov.uk','medicines.org.uk','nhsinform.scot','nhs24.scot','111.wales.nhs.uk','nhs.wales','hscni.net','nidirect.gov.uk'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h)),'Non-primary evidence source');}
 const html=articleHTML({...draft,author:'SHIFT Team',publish_at:'2026-09-23T05:31:02.403Z',updated_at:'2026-10-05T20:00:00.000Z'});
 assert.equal((html.match(/<h1\b/g)||[]).length,1,'Multiple H1 headings');
 assert(!/<script[^>]*>.*undefined/.test(html));return html;
}
function drafts(){return SLUGS.map(slug=>{const draft=json(root+slug+'.json');validateDraft(draft);return draft})}
function predicate(row,alias='a'){
 return Object.entries(row).map(([key,value])=>alias+'.'+ident(key)+' IS '+literal(value)).join(' AND ');
}
// A single SQLite statement changes both rows or neither. MATERIALIZED freezes
// the full before-state comparison before any row changes; receipts are immutable.
export function buildApplySql(before,after){
 assert.equal(before.articles.length,after.length);
 const checks=before.articles.map(row=>{const receipt=before.receipts.find(r=>r.slug===row.slug);return '('+predicate(row)+' AND EXISTS (SELECT 1 FROM babylove_receipts r WHERE r.slug=a.slug AND '+['source_id','slug','payload_hash'].map(key=>'r.'+ident(key)+' IS '+literal(receipt[key])).join(' AND ')+'))'}).join(' OR ');
 const cases=editFields.map(field=>ident(field)+'=CASE slug '+after.map(row=>'WHEN '+literal(row.slug)+' THEN '+literal(row[field])).join(' ')+' ELSE '+ident(field)+' END').join(',');
 return 'WITH eligible AS MATERIALIZED (SELECT COUNT(*) n FROM knowledge_articles a WHERE '+checks+') UPDATE knowledge_articles SET '+cases+' WHERE slug IN ('+SLUGS.map(literal).join(',')+') AND (SELECT n FROM eligible)='+before.articles.length+';';
}
export function buildRollbackSql(before,after){
 const cases=editFields.map(field=>ident(field)+'=CASE slug '+before.articles.map(row=>'WHEN '+literal(row.slug)+' THEN '+literal(row[field])).join(' ')+' ELSE '+ident(field)+' END').join(',');
 const owned=after.map(row=>'('+predicate(row,'knowledge_articles')+')').join(' OR ');
 return 'UPDATE knowledge_articles SET '+cases+' WHERE '+owned+';';
}
const htmlPart=(html,tag)=>html.match(new RegExp('<'+tag+'\\b[^>]*>[\\s\\S]*?</'+tag+'>','i'))?.[0]||'';
async function publicRead(path){
 const response=await fetch('https://shiftsometimber.co.uk'+path,{redirect:'manual',signal:AbortSignal.timeout(25000),headers:{'Cache-Control':'no-cache'}});
 assert.equal(response.status,200,'Public HTTP status '+path);const html=await response.text();assert(html.includes('<main'),'Public main missing '+path);return html;
}
export function checkPublicArticle(html,row){
 const canonical='https://shiftsometimber.co.uk/articles/'+row.slug;
 assert(html.includes('<title>'+row.seo_title.replaceAll('&','&amp;')+'</title>'),'Search title not live');
 assert(html.includes('<link rel="canonical" href="'+canonical+'">'),'Canonical drift');
 assert(html.includes('name="robots" content="index,follow'),'Indexability missing');
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]||'null');
 assert(schema);assert.equal(schema.headline,row.title);assert.equal(schema.description,row.summary);assert.equal(schema.datePublished,row.publish_at);assert.equal(schema.dateModified,articleModifiedDate(row));
 const expected=htmlPart(articleHTML(row),'main');assert.equal(htmlPart(html,'main'),expected,'Rendered article content differs from checked draft');
 const main=htmlPart(html,'main');assert(main.includes('5 October 2026'));
 for(const href of main.matchAll(/href="#([a-z0-9_-]+)"/gi))assert(main.includes('id="'+href[1]+'"'),'Broken contents anchor');
 return {url:canonical,status:200,canonical,headline:schema.headline,datePublished:schema.datePublished,dateModified:schema.dateModified,mainSha256:sha(main)};
}

async function run(){
 const mode=process.argv[2];assert(['--snapshot','--check','--apply','--verify','--rollback'].includes(mode),'Unknown mode');
 if(mode==='--snapshot'){
  const before=rows();validateBaseline(before,json(root+'baseline.json'));const home=await publicRead('/');
  const backup={workflowSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,readAt:new Date().toISOString(),before,homepage:{mainSha256:sha(htmlPart(home,'main')),headSha256:sha(htmlPart(home,'head'))}};
  save('backup.json',backup);writeFileSync(proof+'/homepage-before.html',home);
  for(const row of before.articles)writeFileSync(proof+'/'+row.slug+'-before.html',await publicRead('/articles/'+row.slug));
  console.log(JSON.stringify({ok:true,mode,articles:before.articles.map(x=>({slug:x.slug,id:x.id,bodySha256:sha(x.body),updatedAt:x.updated_at})),backup:'uploaded separately before apply'}));return;
 }
 if(mode==='--check'){
  const before=rows();validateBaseline(before,json(root+'baseline.json'));
  if(existsSync(proof+'/backup.json'))assert.equal(recordHash(before),recordHash(json(proof+'/backup.json').before),'D1 changed after snapshot');
  const modified=new Date().toISOString(),after=drafts().map(d=>({...before.articles.find(r=>r.slug===d.slug),...Object.fromEntries(editFields.filter(k=>k!=='updated_at').map(k=>[k,d[k]])),updated_at:modified}));
  save('prepared.json',{workflowSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,before,after});
  for(const row of after)writeFileSync(proof+'/'+row.slug+'-candidate.html',articleHTML(row));
  console.log(JSON.stringify({ok:true,mode,articles:after.map(x=>({slug:x.slug,title:x.title,bodySha256:sha(x.body)}))}));return;
 }
 if(mode==='--verify'&&!existsSync(proof+'/prepared.json')){
  const current=rows(),checks=[];for(const draft of drafts()){
   const row=current.articles.find(r=>r.slug===draft.slug),base=json(root+'baseline.json').articles.find(r=>r.slug===draft.slug);
   for(const key of editFields.filter(k=>k!=='updated_at'))assert.equal(row[key],draft[key],'Current live draft mismatch: '+key);
   assert.equal(row.status,'published');assert.equal(row.publish_at,base.expected_publish_at);
   const html=await publicRead('/articles/'+row.slug);checks.push(checkPublicArticle(html,row));writeFileSync(proof+'/'+row.slug+'-live.html',html);
  }
  save('live-verification.json',{ok:true,verifiedAt:new Date().toISOString(),workflowSha:process.env.GITHUB_SHA,checks,homepagePreservationChecked:false,workerDeploymentPerformed:false});console.log(JSON.stringify({ok:true,mode,checks}));return;
 }
 const prepared=json(proof+'/prepared.json'),backup=json(proof+'/backup.json');
 assert.equal(prepared.workflowSha,process.env.GITHUB_SHA);assert.equal(prepared.runId,process.env.GITHUB_RUN_ID);assert.equal(backup.workflowSha,prepared.workflowSha);assert.equal(recordHash(backup.before),recordHash(prepared.before));
 if(mode==='--apply'){
  await readCurrentMain();assert.equal(recordHash(rows()),recordHash(prepared.before),'Concurrent article change before publication');
  await readCurrentMain();query(buildApplySql(prepared.before,prepared.after));
  const after=rows();assert.equal(recordHash(after.articles),recordHash([...prepared.after].sort((a,b)=>a.slug.localeCompare(b.slug))),'Exact article publication failed');assert.equal(recordHash(after.receipts),recordHash(prepared.before.receipts),'Receipts changed');
  save('applied.json',{ok:true,workflowSha:prepared.workflowSha,runId:prepared.runId,appliedAt:new Date().toISOString(),articles:after.articles.map(r=>({slug:r.slug,id:r.id,bodySha256:sha(r.body),publishAt:r.publish_at}))});
  console.log(JSON.stringify({ok:true,mode,slugs:SLUGS}));return;
 }
 if(mode==='--verify'){
  const current=rows();assert.equal(recordHash(current.articles),recordHash([...prepared.after].sort((a,b)=>a.slug.localeCompare(b.slug))));assert.equal(recordHash(current.receipts),recordHash(prepared.before.receipts));
  const checks=[];
  for(const row of prepared.after){const html=await publicRead('/articles/'+row.slug);checks.push(checkPublicArticle(html,row));writeFileSync(proof+'/'+row.slug+'-live.html',html);}
  const home=await publicRead('/');assert.equal(sha(htmlPart(home,'main')),backup.homepage.mainSha256,'Homepage main changed during publication');assert.equal(sha(htmlPart(home,'head')),backup.homepage.headSha256,'Homepage metadata changed during publication');
  writeFileSync(proof+'/homepage-after.html',home);save('live-verification.json',{ok:true,verifiedAt:new Date().toISOString(),workflowSha:prepared.workflowSha,runId:prepared.runId,checks,homepageUnchanged:true,originalPublicationDatesRetained:true,originalReceiptsRetained:true,workerDeploymentPerformed:false});
  console.log(JSON.stringify({ok:true,mode,homepageUnchanged:true,checks}));return;
 }
 if(mode==='--rollback'){
  // Roll back only this run's exact after-state. A later editor's row is excluded.
  // Current-main need not match after an unrelated release; ownership comparison
  // is the narrower guard that prevents overwriting any later content change.
  query(buildRollbackSql(prepared.before,prepared.after));const current=rows();
  const report={ok:true,rolledBackAt:new Date().toISOString(),articles:current.articles.map(row=>({slug:row.slug,restored:recordHash(row)===recordHash(prepared.before.articles.find(r=>r.slug===row.slug)),laterChangePreserved:recordHash(row)!==recordHash(prepared.before.articles.find(r=>r.slug===row.slug))}))};
  save('rollback.json',report);console.log(JSON.stringify(report));
 }
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])await run();
