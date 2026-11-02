import test from 'node:test';
import assert from 'node:assert/strict';
import { radarNewsPageRoutes } from '../radar-news-pages-v1.js';
import { addNewsroomMenu } from '../radar-newsroom-menu-v1.js';
const shell = '<html><head><title>Old</title><meta name="description" content="Old"><link rel="canonical" href="https://shiftsometimber.co.uk/medicine-news"></head><body><header>Approved header</header><main>Old body</main></body></html>';
const row = (id, region, title) => ({ id, region, headline: title, regulator: 'Test source', reviewed_at: '2026-09-13', content_package_json: JSON.stringify({ headline: title, article_markdown: 'A complete evidence-led article.', seo: { slug: `medicine-news/article-${id}` }, destinations: ['medicine_news'] }) });
test('dedicated newsroom is canonical, globally ordered, and preserves article URLs', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(shell);
  try {
    const env = { DB: { prepare: () => ({ all: async () => ({ results: [row(1,'GLOBAL','International trial'),row(2,'England','NHS access')] }) }) } };
    const response = await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk/shift-newsroom'), env);
    const html = await response.text();
    assert.equal(response.status,200);
    assert.match(html,/data-newsroom-layout/);
    assert.ok(!html.match(/<form[^>]*data-news-filters[^>]*>/)[0].includes(' hidden'));
    assert.match(html, /<h1>SHIFT <span class="accent">Newsroom/);
    assert.match(html, /rel="canonical" href="https:\/\/shiftsometimber.co.uk\/shift-newsroom"/);
    assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
    assert.ok(html.indexOf('href="/medicine-news/article-1"') < html.indexOf('href="/medicine-news/article-2"'));
    assert.match(html,/name="sort"/);
    assert.equal((html.match(/data-news-list/g)||[]).length,2);
    assert.match(html,/href="\/medicine-news\/article-2"/);
    assert.match(html,/<header>Approved header<\/header>/);
    for(const key of ['twitter:card','twitter:title','twitter:description','twitter:image'])assert.equal((html.match(new RegExp('name="'+key+'"','g'))||[]).length,1);
    const collection=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(collection.publisher.logo.url,'https://shiftsometimber.co.uk/assets/shift-wordmark.png');
    const redirect = await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk/medicine-news'),env);
    assert.equal(redirect.status,301);
    assert.equal(redirect.headers.get('location'),'https://shiftsometimber.co.uk/shift-newsroom');
    assert.equal((await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk/medicine-news/article-2'),env)).status,200);
    assert.equal((await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk/medicine-news/missing'),env)).status,404);
  } finally { globalThis.fetch = original; }
});
test('newsroom menu insertion is alphabetical and idempotent; page body stays intact', () => {
  const before='<header>Five approved links</header><aside class="site-drawer" data-header-v2><nav><a href="/shift-for-work">SHIFT for Work</a><a href="/shop">Timber Mill</a></nav></aside><main>Locked Start Here content</main>';
  const after=addNewsroomMenu(before);
  assert.equal(after.replace('<a href="/shift-newsroom">SHIFT Newsroom</a>',''),before);
  assert.equal(addNewsroomMenu(after),after);
  assert.ok(after.indexOf('SHIFT for Work') < after.indexOf('SHIFT Newsroom'));
  assert.ok(after.indexOf('SHIFT Newsroom') < after.indexOf('Timber Mill'));
});


test('article meaning is shown once when the reviewed body already contains it',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response(shell);
 try{
  for(const alreadyIncluded of [true,false]){
   const article=row(3,'England','A distinct UK report');const content=JSON.parse(article.content_package_json);
   content.why_it_matters_to_uk='Ask the local service how to access support.';
   content.article_markdown='Original reporting.'+(alreadyIncluded?'\n\n'+content.why_it_matters_to_uk:'');
   article.content_package_json=JSON.stringify(content);
   const env={DB:{prepare:()=>({all:async()=>({results:[article]})})}};
   const html=await (await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk/medicine-news/article-3'),env)).text();
   assert.equal(html.split(content.why_it_matters_to_uk).length-1,1);
   assert.equal((html.match(/data-shift-take/g)||[]).length,1);
   assert.ok(html.includes('<h2>SHIFT’s take</h2>'));
   assert.ok(html.includes('Original reporting.'));
  }
 }finally{globalThis.fetch=original}
});
test('every newsroom Organization record carries the shared logo',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response(shell);
 try{
  const article=row(4,'England','A schema test');const env={DB:{prepare:()=>({all:async()=>({results:[article]})})}};
  const html=await (await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk/medicine-news/article-4'),env)).text();
  const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match=>JSON.parse(match[1]));
  const articleSchema=schemas.find(schema=>schema['@type']==='Article');assert.ok(articleSchema);
  for(const organization of [articleSchema.author,articleSchema.publisher]){
   assert.equal(organization['@type'],'Organization');
   assert.equal(organization.logo?.url,'https://shiftsometimber.co.uk/assets/shift-wordmark.png');
  }
 }finally{globalThis.fetch=original}
});

test('public newsroom and published articles replace the retired shell noindex for GET and HEAD; missing articles retain it',async()=>{
 const original=globalThis.fetch;
 const noindexShell=shell.replace('<head>','<head><meta name="robots" content="noindex,follow"><meta content="noindex" name="googlebot">');
 globalThis.fetch=async()=>new Response(noindexShell,{headers:{'X-Robots-Tag':'noindex'}});
 try{
  const env={DB:{prepare:()=>({all:async()=>({results:[row(7,'UK','Reviewed public safety story')]})})}};
  for(const path of ['/shift-newsroom','/medicine-news/article-7']){
   const response=await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk'+path),env);
   const html=await response.text();assert.equal(response.status,200);
   assert.equal(response.headers.get('X-Robots-Tag'),'index, follow');
   assert.match(html,/<meta name="robots" content="index,follow">/);
   assert.doesNotMatch(html,/<meta[^>]+noindex/i);
   assert.equal((html.match(/<meta name="robots"/g)||[]).length,1);
   const head=await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk'+path,{method:'HEAD'}),env);
   assert.equal(head.headers.get('X-Robots-Tag'),'index, follow');assert.equal(await head.text(),'');
  }
  const missing=await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk/medicine-news/missing'),env);
  assert.equal(missing.status,404);assert.equal(missing.headers.get('X-Robots-Tag'),'noindex');
  assert.match(await missing.text(),/<meta name="robots" content="noindex,follow">/);
 }finally{globalThis.fetch=original}
});

test('public news feed uses the same original publication date as its article', async () => {
 const {radarPublicRoutes}=await import('../radar-public-v1.js');
 const changed={...row(1263,'UK','Revised article'),first_published_at:'2026-10-19 19:55:33',reviewed_at:'2026-10-20T07:09:44.184Z',updated_at:'2026-10-20T07:09:41.617Z'};
 const pkg=JSON.parse(changed.content_package_json);
 pkg.seo.datePublished='2026-10-20T07:09:41.617Z';pkg.seo.dateModified=pkg.seo.datePublished;
 changed.content_package_json=JSON.stringify(pkg);
 let query='';
 const DB={prepare(sql){return {bind(){return this},async first(){return {id:1,status:'published'}},async all(){query=sql;return {results:[changed]}}}}};
 const result=await (await radarPublicRoutes(new Request('https://shiftsometimber.co.uk/v1/radar/news'),{DB})).json();
 assert.match(query,/MIN\(created_at\) first_published_at/);
 assert.equal(result.items[0].published_at,'2026-10-19T19:55:33.000Z');
 assert.equal(result.items[0].metadata.datePublished,'2026-10-19T19:55:33.000Z');
 assert.equal(result.items[0].metadata.dateModified,'2026-10-20T07:09:41.617Z');
 assert.equal(pkg.seo.datePublished,'2026-10-20T07:09:41.617Z','input package is unchanged');
});
