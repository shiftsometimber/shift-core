import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WEGOVY_META as c,MARKER,repairWegovyMeta,withWegovyMeta} from './wegovy-meta.mjs';
const origin='https://shiftsometimber.co.uk';
const before='<html><head><title>'+c.oldTitle+'</title><meta name="description" content="'+c.oldDescription+'"><meta property="og:title" content="'+c.oldTitle+'"><meta property="og:description" content="'+c.oldDescription+'"><meta name="twitter:title" content="'+c.oldTitle+'"><meta name="twitter:description" content="'+c.oldDescription+'"><link rel="canonical" href="'+origin+c.path+'"></head><body><main><h1>'+c.oldTitle+'</h1><script type="application/ld+json">{"@type":"Article","headline":"'+c.oldTitle+'"}</script><a href="/start-here">Explore Weight Loss</a></main></body></html>';
test('only six exact existing metadata tags change; medical text, canonical and links remain',()=>{
 const after=repairWegovyMeta(before,c.path);
 assert.notEqual(after,before);
 assert(after.includes('<title>'+c.title+'</title>'));
 for(const attr of ['name="description"','property="og:description"','name="twitter:description"'])assert(after.includes('<meta '+attr+' content="'+c.description+'">'));
 for(const attr of ['property="og:title"','name="twitter:title"'])assert(after.includes('<meta '+attr+' content="'+c.title+'">'));
 assert(after.includes('<h1>'+c.oldTitle+'</h1>'));
 assert(after.includes('"headline":"'+c.oldTitle+'"'));
 assert(after.includes('href="/start-here"'));
 assert(after.includes('rel="canonical" href="'+origin+c.path+'"'));
 assert.equal(repairWegovyMeta(after,c.path),after);
});
test('pre-existing drift and duplicate source tags refuse mutation',()=>{
 assert.equal(repairWegovyMeta(before,'/articles/another'),before);
 assert.equal(repairWegovyMeta(before.replace('NHS BMI','different medical wording'),c.path),before.replace('NHS BMI','different medical wording'));
 assert.equal(repairWegovyMeta(before.replace('</title>','</title><title>'+c.oldTitle+'</title>'),c.path),before.replace('</title>','</title><title>'+c.oldTitle+'</title>'));
});
test('response wrapper retains source while changing one public GET only',async()=>{
 const response=async()=>new Response(before,{headers:{'Content-Type':'text/html','Cache-Control':'private, no-store','ETag':'old','Content-Length':String(before.length)}});
 const original={fetch:response,marker:123};
 const worker=withWegovyMeta(original);
 assert.equal(worker.marker,123);
 const r=await worker.fetch(new Request(origin+c.path));
 const html=await r.text();
 assert.equal(r.headers.get('X-Shift-Wegovy-Metadata'),MARKER);
 assert.equal(r.headers.get('ETag'),null);
 assert.equal(r.headers.get('Content-Length'),null);
 assert.equal(r.headers.get('Cache-Control'),'private, no-store');
 assert.equal(html,repairWegovyMeta(before,c.path));
});
test('unrelated paths, private endpoints and non-GET methods bypass without reading response',async()=>{
 const originalResponse=new Response('original',{headers:{'Cache-Control':'private, no-store','Set-Cookie':'session=kept'}});
 let calls=0;const worker=withWegovyMeta({fetch:()=>{calls++;return originalResponse}});
 for(const [path,method] of [['/member/dashboard','GET'],['/checkout','GET'],['/','GET'],[c.path,'POST'],[c.path,'HEAD']]){
  const r=await worker.fetch(new Request(origin+path,{method}));
  assert.equal(r,originalResponse);
 }
 assert.equal(calls,5);
});
test('non-HTML and source-drift documents preserve the original response',async()=>{
 for(const value of [before.replace(c.oldDescription,'updated'),'<script>not HTML</script>']){
  const originalResponse=new Response(value,{headers:{'Content-Type':'text/html'}});
  const worker=withWegovyMeta({fetch:()=>originalResponse});
  assert.equal(await worker.fetch(new Request(origin+c.path)),originalResponse);
 }
});
