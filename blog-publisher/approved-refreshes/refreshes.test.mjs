import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {REFRESHES,applyRefreshHTML,refreshSitemap,refreshCatalogue,approvedRefreshRoute} from './refreshes.mjs';
import {approvedImage} from './assets.mjs';
const schemas=html=>[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{const x=JSON.parse(m[1]);return x['@graph']||[x]});
const fixture=p=>fs.readFileSync(new URL('./fixtures/'+p.day+'.html',import.meta.url),'utf8');
const hrefs=html=>new Set([...html.matchAll(/\bhref=["']([^"']+)["']/g)].map(m=>m[1]));
for(const p of REFRESHES)test(p.path+': approved copy, dates, schema, original links and layout are preserved',()=>{
 const before=fixture(p),after=applyRefreshHTML(before,p.path);
 const article=schemas(after).find(x=>[x['@type']].flat().some(t=>['Article','MedicalWebPage'].includes(t)));
 assert.equal(article.datePublished,p.published);assert.equal(article.dateModified,'2026-10-22');
 assert.equal(article.author.name,"Matt O'Brien");assert.equal(article.mainEntityOfPage,'https://shiftsometimber.co.uk'+p.path);
 const faq=schemas(after).find(x=>x['@type']==='FAQPage');assert.equal(faq.mainEntity.length,p.faq.length);
 for(const item of p.faq){assert.ok(after.replaceAll('&#x27;','&#39;').includes(item.q.replaceAll("'",'&#39;')));assert.ok(faq.mainEntity.some(x=>x.name===item.q&&x.acceptedAnswer.text===item.a))}
 for(const href of hrefs(before))assert.ok(hrefs(after).has(href),'lost original URL: '+href);
 assert.ok(after.includes('<header>Preserved header</header>'));assert.ok(after.includes('<footer>Preserved footer</footer>'));
 assert.equal((after.match(/<h1\b/g)||[]).length,1);
 assert.equal(applyRefreshHTML(after,p.path),after,'safe to retry without duplicate content');
 assert.ok(!after.includes('KEEP EXISTING ORIGINAL DATE'));assert.ok(!after.includes('[link:'));
 if(p.hero){assert.ok(after.includes(p.hero.url));assert.ok(after.includes('width="1200" height="675"'))}
 if(p.day==='day1'){
  assert.equal((after.match(/<table\b/g)||[]).length,(before.match(/<table\b/g)||[]).length);
  assert.ok(after.indexOf('first-health-check')<after.indexOf('<h2 id="getting-help">'));
  assert.ok(after.includes('Male obesity: what it means for your health. What to do next.'));
 }
 if(p.day==='day2')assert.ok(after.includes('What the legacy questionnaire can tell you'));
 if(p.day==='day3'){assert.ok(after.includes('immediate danger of serious self-harm'));assert.ok(after.includes('/shift-health/testosterone-energy'))}
});
test('publication-date drift fails closed; unrelated pages are byte-identical',()=>{
 const p=REFRESHES[0];assert.throws(()=>applyRefreshHTML(fixture(p).replaceAll(p.published,'2026-10-11'),p.path),/original_publication_date_changed/);
 assert.equal(applyRefreshHTML('<main>Untouched</main>','/'),'<main>Untouched</main>');
});
test('backlinks add only relevant links, keep all existing copy, and are idempotent',()=>{
 const before='<html><body><main><h1>Existing page</h1><p>All original wording.</p></main></body></html>';
 const after=applyRefreshHTML(before,'/articles/men-belly-fat');
 assert.ok(after.includes('<h1>Existing page</h1><p>All original wording.</p>'));assert.ok(after.includes('/male-obesity#first-health-check'));assert.ok(after.includes('/articles/testosterone-weight-men'));
 assert.equal(applyRefreshHTML(after,'/articles/men-belly-fat'),after);
});
test('discovery changes preserve dates and never duplicate refreshed URLs',()=>{
 const rows=REFRESHES.map(p=>({href:p.path,title:'Old title',type:'Article',date:'old'}));
 const list=refreshCatalogue([...rows,{href:'/unrelated',title:'Keep this',date:'2020'}]);assert.equal(list.length,4);assert.equal(list.find(x=>x.href==='/unrelated').title,'Keep this');
 for(const p of REFRESHES){assert.equal(list.filter(x=>x.href===p.path).length,1);assert.ok(list.find(x=>x.href===p.path).date.includes('2026'))}
 const before='<urlset><url><loc>https://shiftsometimber.co.uk/male-obesity</loc><lastmod>2020-01-01</lastmod></url><url><loc>https://shiftsometimber.co.uk/untouched</loc></url></urlset>';
 const after=refreshSitemap(before);assert.equal(refreshSitemap(after),after);assert.ok(after.includes('/untouched</loc>'));assert.equal((after.match(/male-obesity<\/loc>/g)||[]).length,1);
});
test('upstream layout changes preserve the current page and expose a hold instead of stale content',async()=>{
 const env={OBESITY:{fetch:async()=>new Response('<main>New upstream</main>',{headers:{'Content-Type':'text/html','ETag':'old'}})}};
 const response=await approvedRefreshRoute(new Request('https://shiftsometimber.co.uk/male-obesity'),env);
 assert.equal(response.status,200);assert.equal(await response.text(),'<main>New upstream</main>');assert.equal(response.headers.get('X-Shift-Refresh-Hold'),'upstream-content-changed');
});
test('packaged approved images serve genuine JPEG bytes and support HEAD',async()=>{
 const p=REFRESHES.find(x=>x.day==='day2'),path=new URL(p.hero.url).pathname;
 const r=approvedImage(path,'GET');assert.equal(r.headers.get('Content-Type'),'image/jpeg');
 const bytes=new Uint8Array(await r.arrayBuffer());assert.equal(bytes[0],255);assert.equal(bytes[1],216);
 assert.equal(approvedImage(path,'HEAD').body,null);assert.equal(approvedImage(path,'POST').status,405);assert.equal(approvedImage('/not-public/'+path.split('/').at(-1),'GET'),null);
});

test('wildcard routes preserve every unmodified sibling page and original request method',async()=>{
 for(const path of ['/shift-health/blood-tests?source=mail','/shift-health/unrelated','/male-obesity-other','/guides/mens-health-mot-guide-extra']){
  let received;const original=new Response('unchanged sibling',{headers:{'X-Original':'preserved'}});
  const upstream={async fetch(r){received=r;return original}},env={CORE:upstream,OBESITY:upstream,HEALTH:upstream};
  const request=new Request('https://shiftsometimber.co.uk'+path,{method:'POST',body:'original body'});
  assert.equal(await approvedRefreshRoute(request,env),original);assert.equal(received,request);assert.equal(received.method,'POST');
 }
});
