import test from 'node:test';
import assert from 'node:assert/strict';
import {articleSitemapResponse} from './article-sitemap.mjs';
const req = method=>new Request('https://shiftsometimber.co.uk/sitemap-articles.xml',{method});
const entry=(path,date='')=>'<url><loc>https://shiftsometimber.co.uk'+path+'</loc>'+(date?'<lastmod>'+date+'</lastmod>':'')+'</url>';
const xml=items=>'<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+items.join('')+'</urlset>';
test('only canonical article pages; dates preserved and duplicates/assets/nonblog excluded',async()=>{
 const s=xml([entry('/'),entry('/articles/one','2026-09-24'),entry('/articles/one'),entry('/articles/two'),entry('/articles/two/image'),entry('/articles/two?x=1'),entry('/medicine-news/test')]);
 const r=await articleSitemapResponse(req('GET'),async()=>new Response(s));
 assert.equal(r.status,200);assert.equal(r.headers.get('X-Shift-Article-Count'),'2');
 const body=await r.text();assert.equal(body.match(/<url>/g).length,2);assert.ok(body.includes('<lastmod>2026-09-24</lastmod>'));assert.ok(!body.includes('medicine-news'));
});
test('new publications appear on the next source read',async()=>{
 let list=[entry('/articles/first')];const load=async()=>new Response(xml(list));
 assert.equal((await articleSitemapResponse(req('GET'),load)).headers.get('X-Shift-Article-Count'),'1');
 list.push(entry('/articles/newly-published'));assert.equal((await articleSitemapResponse(req('GET'),load)).headers.get('X-Shift-Article-Count'),'2');
});
test('HEAD has GET metadata without body; writes do not load source',async()=>{
 const r=await articleSitemapResponse(req('HEAD'),async()=>new Response(xml([entry('/articles/first')])));assert.equal(r.status,200);assert.equal(await r.text(),'');assert.equal(r.headers.get('X-Shift-Article-Count'),'1');
 assert.equal((await articleSitemapResponse(req('POST'),()=>{throw Error('must not load')})).status,405);
});
test('unavailable, invalid and empty source fail closed, never cache empty maps',async()=>{
 for(const load of [async()=>new Response('bad',{status:503}),async()=>new Response('<html>oops</html>'),async()=>new Response(xml([])),async()=>{throw Error('offline')}]){
 const r=await articleSitemapResponse(req('GET'),load);assert.equal(r.status,503);assert.equal(r.headers.get('Cache-Control'),'no-store');
 }
});

test('production entry routes the new endpoint through the existing final sitemap pipeline',async()=>{
 const {default:worker}=await import('../worker-entry-v6.js');
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async()=>new Response(xml([entry('/articles/integration-seed','2026-09-24'),entry('/programme')]),{headers:{'Content-Type':'application/xml'}});
 const statement={bind(){return this},async all(){return {results:[]}},async first(){return null}};
 const env={DB:{prepare(){return statement}}};
 try{
  const r=await worker.fetch(req('GET'),env,{waitUntil(){}});
  assert.equal(r.status,200);const body=await r.text();assert.ok(body.includes('/articles/integration-seed'));assert.ok(!body.includes('<loc>https://shiftsometimber.co.uk/programme</loc>'));
  const h=await worker.fetch(req('HEAD'),env,{waitUntil(){}});assert.equal(h.status,200);assert.equal(await h.text(),'');
 }finally{globalThis.fetch=originalFetch}
});
