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
