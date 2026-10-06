import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {APPROVED_PAGES} from '../public-seo-approved-data.mjs';
import {approvedHtml,preserveApprovedSeo,withApprovedSeo} from '../public-seo-approved.mjs';
import {worksheetRoute,WORKSHEET_PATH} from '../prescriber-questions.mjs';
const origin='https://shiftsometimber.co.uk';
const fixture=(path)=>{const p=APPROVED_PAGES[path];return '<html><head>'+p.replacements.filter(x=>!x.before.startsWith('<h1')&&!x.before.startsWith('As of')).map(x=>x.before).join('')+'</head><body><main>'+(p.replacements.find(x=>x.before.startsWith('<h1'))?.before||'<h1>Original page</h1>')+'<p>Original advice and author; 8 August 2026.</p>'+(p.replacements.find(x=>x.before.startsWith('As of'))?.before||'')+'</main></body></html>';};
test('exactly five approved public pages; reversible, idempotent changes retain surrounding content',()=>{
 assert.deepEqual(Object.keys(APPROVED_PAGES),['/comparisons/medications/wegovy-vs-orlistat','/guides/cagrisema-uk-guide','/refunds','/accessibility','/terms-of-sale']);
 for(const path of Object.keys(APPROVED_PAGES)){
  const before=fixture(path),after=approvedHtml(before,path);
  assert.equal(approvedHtml(after,path),after);
  assert.equal(preserveApprovedSeo(path,Buffer.from(after)).toString(),before);
  assert.equal(preserveApprovedSeo(path,Buffer.from(before)).toString(),before);
  assert(after.includes('Original advice and author; 8 August 2026.'));
  if(!APPROVED_PAGES[path].panel)assert.equal(before.slice(before.indexOf('<body>')),after.slice(after.indexOf('<body>')));
  const unknown=after.replace('Original advice','Unapproved advice');
  assert.notEqual(preserveApprovedSeo(path,Buffer.from(unknown)).toString(),before);
  if(APPROVED_PAGES[path].panel)assert.throws(()=>approvedHtml(after+APPROVED_PAGES[path].panel,path));
 }
});
test('actual schema dates, author and canonical remain unchanged in approved schema replacements',()=>{
 for(const p of Object.values(APPROVED_PAGES))for(const pair of p.replacements.filter(x=>x.before.startsWith('<script'))){
  const parse=s=>JSON.parse(s.replace(/^<script[^>]*>/,'').replace(/<\/script>$/,''));
  const a=parse(pair.before),b=parse(pair.after);
  const scrub=x=>{if(Array.isArray(x))return x.map(scrub);if(x&&typeof x==='object'){const y={...x};if(y['@type']==='Article'){delete y.description;delete y.headline;}for(const k of Object.keys(y))if(y[k]&&typeof y[k]==='object')y[k]=scrub(y[k]);return y;}return x;};
  assert.deepEqual(scrub(a),scrub(b));
 }
});
test('nonapproved responses, private routes and homepage keep their original response object',async()=>{
 for(const [path,method,status,type,host] of [['/','GET',200,'text/html',origin],['/start-here','GET',200,'text/html',origin],['/member/dashboard','GET',200,'text/html',origin],['/refunds','POST',200,'text/html',origin],['/refunds','GET',403,'text/html',origin],['/refunds','GET',200,'application/json',origin],['/refunds','GET',200,'text/html','https://other.example']]){
  const response=new Response('unchanged',{status,headers:{'Content-Type':type}});
  assert.equal(await withApprovedSeo(response,new Request(host+path,{method})),response);
 }
 const path='/refunds',r=await withApprovedSeo(new Response(fixture(path),{headers:{'Content-Type':'text/html','ETag':'old','Content-Length':'1'}}),new Request(origin+path));
 assert.equal(r.headers.get('ETag'),null);assert.equal(r.headers.get('Content-Length'),null);assert.equal(r.headers.get('X-Shift-Approved-SEO'),'2026-10-06');
 assert((await r.text()).includes(APPROVED_PAGES[path].description));
});
test('public worksheet is an actual PDF with GET/HEAD parity and no private or POST route',async()=>{
 const get=worksheetRoute(new Request(origin+WORKSHEET_PATH)),head=worksheetRoute(new Request(origin+WORKSHEET_PATH,{method:'HEAD'}));
 const bytes=new Uint8Array(await get.arrayBuffer());assert.equal(new TextDecoder().decode(bytes.slice(0,5)),'%PDF-');assert.equal(String(bytes.length),head.headers.get('Content-Length'));assert.equal(await head.text(),'');
 assert.equal(get.headers.get('Content-Type'),'application/pdf');assert.equal(get.headers.get('X-Robots-Tag'),'noindex');
 assert.equal(worksheetRoute(new Request(origin+WORKSHEET_PATH,{method:'POST'})),null);
 assert.equal(worksheetRoute(new Request('https://other.example'+WORKSHEET_PATH)),null);
 const worker=readFileSync('shift-coach/worker.mjs','utf8');assert.equal((worker.match(/withApprovedSeo\(/g)||[]).length,2);assert(worker.indexOf('worksheetRoute(request)')<worker.indexOf('coachingAsset(request)'));
});
