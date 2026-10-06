import test from 'node:test';
import assert from 'node:assert/strict';
import {repairTechnicalHtml,repairTechnicalSitemap,withTechnicalSeo} from '../public-seo-technical.mjs';
import {ARTICLE_IDENTITY_REPAIRS,NOINDEX_SITEMAP_PATHS,LOGO_ARTICLE_PATHS} from '../public-seo-technical-data.mjs';
const origin='https://shiftsometimber.co.uk';
test('all 102 article identities use existing unique canonical pages',()=>{
 assert.equal(Object.keys(ARTICLE_IDENTITY_REPAIRS).length,102);
 for(const [path,expected] of Object.entries(ARTICLE_IDENTITY_REPAIRS)){
  assert.equal(expected.canonical,origin+path);assert(expected.headline);assert(expected.description);
  const original={'@context':'https://schema.org','@type':'Article',headline:'Old headline',description:'Old description',mainEntityOfPage:origin+'/knowledge',author:{name:'Original author'},datePublished:'2026-08-26',image:origin+'/assets/shift-wordmark.png'};
  const before='<main>Visible original</main><script type="application/ld+json">'+JSON.stringify(original)+'</script>';
  const after=repairTechnicalHtml(before,path),node=JSON.parse(after.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]);
  assert.equal(node.headline,expected.headline);assert.equal(node.description,expected.description);assert.equal(node.mainEntityOfPage,expected.canonical);
  assert.deepEqual(node.author,original.author);assert.equal(node.datePublished,original.datePublished);assert.equal(node.image,undefined);assert(after.startsWith('<main>Visible original</main>'));assert.equal(repairTechnicalHtml(after,path),after);
 }
});
test('publisher logos, real article images, FAQs and malformed JSON remain untouched',()=>{
 for(const node of [{'@type':'Article',image:origin+'/articles/photo.jpg',publisher:{'@type':'Organization',logo:{url:origin+'/assets/shift-wordmark.png'}}},{'@type':'FAQPage',mainEntity:[]},{'@type':'Organization',image:origin+'/assets/shift-wordmark.png'}]){
  const html='<script type="application/ld+json">'+JSON.stringify(node)+'</script>';assert.equal(repairTechnicalHtml(html,'/mental-health/feeling-low'),html);
 }
 assert.equal(repairTechnicalHtml('<script type="application/ld+json">{broken}</script>','/mental-health/feeling-low'),'<script type="application/ld+json">{broken}</script>');
});
test('sitemap removes only the 163 proven noindex URLs and retains unknown future publications',()=>{
 assert.equal(NOINDEX_SITEMAP_PATHS.length,163);assert.equal(new Set(NOINDEX_SITEMAP_PATHS).size,163);
 const keep=['/','/start-here','/new-future-article'];
 const entries=path=>'<url><loc>'+origin+path+'</loc><lastmod>2026-10-06</lastmod></url>';
 const xml='<urlset>'+[...NOINDEX_SITEMAP_PATHS,...keep].map(entries).join('')+'</urlset>';
 const expected='<urlset>'+keep.map(entries).join('')+'</urlset>';
 assert.equal(repairTechnicalSitemap(xml),expected);assert.equal(repairTechnicalSitemap(expected),expected);
});
test('protected pages, HEAD, POST, failures and other origins pass through',async()=>{
 for(const [path,method,status,host] of [['/','GET',200,origin],['/start-here','GET',200,origin],['/member/dashboard','GET',200,origin],['/mental-health/feeling-low','HEAD',200,origin],['/mental-health/feeling-low','POST',200,origin],['/mental-health/feeling-low','GET',404,origin],['/mental-health/feeling-low','GET',200,'https://example.com']]){
  const r=new Response('preserved',{status,headers:{'Content-Type':'text/html'}});assert.equal(await withTechnicalSeo(r,new Request(host+path,{method})),r);
 }
});
test('changed responses clear obsolete validators while preserving security and indexing headers',async()=>{
 const path=LOGO_ARTICLE_PATHS[0],html='<script type="application/ld+json">{"@type":"Article","image":"'+origin+'/assets/shift-wordmark.png"}</script>';
 const r=await withTechnicalSeo(new Response(html,{headers:{'Content-Type':'text/html',ETag:'old','Content-Length':String(html.length),'X-Robots-Tag':'noindex','Content-Security-Policy':"default-src 'self'"}}),new Request(origin+path));
 assert.equal(r.headers.get('etag'),null);assert.equal(r.headers.get('content-length'),null);assert.equal(r.headers.get('x-robots-tag'),'noindex');assert.equal(r.headers.get('content-security-policy'),"default-src 'self'");assert.equal(r.headers.get('x-shift-technical-seo'),'2026-10-06');
});
