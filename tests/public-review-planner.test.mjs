import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 REVIEW_PATH,REVIEW_ASSET,REVIEW_CLIENT,REVIEW_GROUPS,REVIEW_CONTEXT,
 reviewPlannerHTML,reviewPlannerRoute,addReviewContext,addReviewDiscovery,withReviewPlannerDiscovery
} from '../public-review-planner.mjs';
const origin='https://shiftsometimber.co.uk';
test('read-only tool and client routes have proper types, canonical and HEAD handling',async()=>{
 for(const path of [REVIEW_PATH,REVIEW_ASSET]){
  const get=reviewPlannerRoute(new Request(origin+path));
  assert.equal(get.status,200);assert.match(get.headers.get('Content-Type'),path===REVIEW_PATH?/text\/html/:/text\/javascript/);
  const head=reviewPlannerRoute(new Request(origin+path,{method:'HEAD'}));assert.equal(head.status,200);assert.equal(await head.text(),'');
 }
 const html=reviewPlannerHTML();
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert(html.includes('href="'+origin+REVIEW_PATH+'"'));
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(schema['@graph'][0]['@type'],'WebPage');assert.equal(schema['@graph'][0].isAccessibleForFree,true);
 assert(!JSON.stringify(schema).includes('MedicalReview'));assert(!JSON.stringify(schema).includes('aggregateRating'));
 assert(REVIEW_GROUPS.length===4);for(const g of REVIEW_GROUPS)for(const q of g.questions)assert(html.includes(q.replaceAll('&','&amp;')));
});
test('foreign hosts, private paths and mutations are untouched',()=>{
 for(const method of ['POST','PUT','DELETE'])assert.equal(reviewPlannerRoute(new Request(origin+REVIEW_PATH,{method})),null);
 for(const url of ['https://example.com'+REVIEW_PATH,origin+'/',origin+'/start-here',origin+'/member/dashboard',origin+REVIEW_PATH+'/unknown'])assert.equal(reviewPlannerRoute(new Request(url)),null);
 for(const url of ['https://www.shiftsometimber.co.uk'+REVIEW_PATH,origin+REVIEW_PATH+'/',origin+REVIEW_PATH+'.html']){
  const response=reviewPlannerRoute(new Request(url));assert.equal(response.status,301);assert.equal(response.headers.get('Location'),origin+REVIEW_PATH);
 }
});
test('tool asks for no personal details and client sends or stores no selections',()=>{
 const html=reviewPlannerHTML();
 assert(!/<(?:input|textarea|form)\b/i.test(html));
 for(const banned of [/\bfetch\s*\(/,/\bXMLHttpRequest\b/,/\bsendBeacon\b/,/\blocalStorage\b/,/\bsessionStorage\b/,/document\.cookie/,/\bURLSearchParams\b/])assert(!banned.test(REVIEW_CLIENT));
 assert.equal((html.match(/data-review-group=/g)||[]).length,4);
 assert(!/data-review-group="[^"]+"[^>]*hidden/.test(html));
 const executable=[...html.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*src="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(executable,[REVIEW_ASSET]);
});
test('context additions are bounded, repeat-safe and preserve all original bytes',()=>{
 for(const path of Object.keys(REVIEW_CONTEXT)){
  const before='<html><head><title>Original</title></head><body><main><h1>Original</h1><p>Existing safety and service information</p></main></body></html>';
  const after=addReviewContext(before,path);assert.notEqual(after,before);assert.equal(addReviewContext(after,path),after);
  const block=after.match(/<section class="shift-review-link"[\s\S]*?<\/section>/)[0];
  assert.equal(after.replace(block,''),before);assert(block.includes(REVIEW_PATH));
 }
 for(const path of ['/','/start-here','/member/dashboard','/mounjaro'])assert.equal(addReviewContext('<main>Protected</main>',path),'<main>Protected</main>');
 assert.equal(addReviewContext('No main',Object.keys(REVIEW_CONTEXT)[0]),'No main');
});
test('both existing search formats retain their entries and add one public tool',()=>{
 for(const path of ['/assets/knowledge-index.json','/search-index-v3a.json']){
  const original=[{url:'/existing',title:'Existing',extra:{retained:true}}];
  const after=addReviewDiscovery(JSON.stringify(original),path),data=JSON.parse(after);
  assert.deepEqual(data[0],original[0]);assert.equal(data.length,2);assert.equal(data[1].url,REVIEW_PATH);
  assert.equal(addReviewDiscovery(after,path),after);
 }
 assert.equal(addReviewDiscovery('not-json','/search-index-v3a.json'),'not-json');
 assert.equal(addReviewDiscovery('{"items":[]}','/assets/knowledge-index.json'),'{"items":[]}');
});
test('sitemap adds only canonical tool once and claims no invented publication date',()=>{
 const before='<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+origin+'/existing</loc></url></urlset>';
 const after=addReviewDiscovery(before,'/sitemap.xml');
 assert(after.includes('<loc>'+origin+REVIEW_PATH+'</loc>'));assert.equal(addReviewDiscovery(after,'/sitemap.xml'),after);
 assert.equal(after.replace('<url><loc>'+origin+REVIEW_PATH+'</loc></url>',''),before);
 assert(!after.includes('lastmod'));
});
test('response wrapper preserves errors, methods, hosts and protected pages',async()=>{
 for(const [url,method,status,type] of [[origin+'/', 'GET',200,'text/html'],[origin+'/member/dashboard','GET',200,'text/html'],[origin+'/sitemap.xml','POST',200,'application/xml'],[origin+'/sitemap.xml','GET',503,'application/xml'],['https://example.com/sitemap.xml','GET',200,'application/xml']]){
  const response=new Response('unchanged',{status,headers:{'Content-Type':type}});
  assert.equal(await withReviewPlannerDiscovery(response,new Request(url,{method})),response);
 }
 const r=await withReviewPlannerDiscovery(new Response('[]',{headers:{'Content-Type':'application/json','ETag':'old','Content-Length':'2','Content-Encoding':'gzip'}}),new Request(origin+'/search-index-v3a.json'));
 assert.equal(r.headers.get('ETag'),null);assert.equal(r.headers.get('Content-Length'),null);assert.equal(r.headers.get('Content-Encoding'),null);assert(JSON.parse(await r.text()).some(x=>x.url===REVIEW_PATH));
});
test('static release uses exact approved generated assets without a Core runtime or configuration edit',()=>{
 const root=new URL('../release/customer-review-20261020/',import.meta.url);
 assert.equal(fs.readFileSync(new URL('after/tools/weight-management-review.html',root),'utf8'),reviewPlannerHTML());
 assert.equal(fs.readFileSync(new URL('after/assets/weight-management-review-v1.js',root),'utf8'),REVIEW_CLIENT);
 const approved=JSON.parse(fs.readFileSync(new URL('approved-public-copy.json',root),'utf8'));assert.equal(approved.sha256,'736e3275504b8b6b45e0cfd3c7bbd4f40664835c9ab6696d7d3b3e2f15df5f29');
 const entry=fs.readFileSync(new URL('../worker-entry-v6.js',import.meta.url),'utf8');assert(entry.includes('act2bPagesContent(request)'));
});
