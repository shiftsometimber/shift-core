import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PATH,renderCandidate,amendSupportingDocument,withWeightUnderstandingReview} from './candidate.mjs';
import {renderContinuityDocument} from '../public-continuity.mjs';
const shell='<!doctype html><html lang="en-GB"><head><title>Programme</title><meta name="description" content="Old"><link rel="canonical" href="https://shiftsometimber.co.uk/programme"><script src="/consent-v4a.js" defer></script><script src="/programme.js" defer></script></head><body><header>START HERE · THE PROGRAMME · SHIFT HEALTH · TREATMENTS · MY TIMBER</header><main id="main-content"><h1>Programme</h1></main><footer>Existing footer</footer></body></html>';
const support=renderContinuityDocument(shell,'/weight-loss-support-for-men');
test('central retains locked chrome/consent and replaces stale programme metadata/runtime',()=>{
 const h=renderCandidate(shell);for(const s of ['<header>START HERE · THE PROGRAMME · SHIFT HEALTH · TREATMENTS · MY TIMBER</header>','<footer>Existing footer</footer>','/consent-v4a.js'])assert.ok(h.includes(s));
 assert.doesNotMatch(h,/src="\/programme.js"/);assert.equal((h.match(/<h1\b/g)||[]).length,1);assert.equal((h.match(/rel="canonical"/g)||[]).length,1);assert.match(h,/noindex,nofollow/);
 const graph=JSON.parse(h.match(/application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];assert.equal(graph[0]['@type'],'Article');assert.equal(graph[1]['@type'],'BreadcrumbList');assert.ok(!graph[0].reviewedBy);assert.ok(!graph[0].datePublished);
});
test('public actions need no form, JS, data save or prescription route',()=>{
 const main=renderCandidate(shell).match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];assert.equal((main.match(/<details>/g)||[]).length,3);
 assert.doesNotMatch(main,/<form|<input|<script|Mounjaro|Wegovy|Ozempic|GLP.?1|injection pen|saved successfully/i);
 assert.match(main,/Tomorrow I’ll have/);assert.match(main,/my fallback/);assert.match(main,/I would like help with my weight and health/);assert.match(main,/SHIFT is not affiliated with or endorsed by Lilly/);
 const ids=new Set([...main.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));for(const m of main.matchAll(/href="#([^"]+)"/g))assert.ok(ids.has(m[1]),m[1]);
});
test('support amendments neutralise both visible and schema FAQ, qualify claims and precede account help',()=>{
 const h=amendSupportingDocument('/weight-loss-support-for-men',support),main=h.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];assert.doesNotMatch(main,/Mounjaro|Wegovy|GLP.?1|thousands of recipe|let My Timber adapt/);
 assert.match(main,/keeping-progress/);assert.match(main,/My meal is/);assert.ok(main.indexOf('data-weight-understanding-addition')<main.indexOf('What you actually get'));
 assert.match(main,/href="#awareness-first-step">Find one useful step/);
 const faq=JSON.parse(h.match(/application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'].find(n=>n['@type']==='FAQPage');assert.equal(faq.mainEntity.find(q=>q.name.includes('treatment has ended')).name,'Can I use My Timber after treatment has ended?');
 assert.equal(amendSupportingDocument('/weight-loss-support-for-men',h),h);
});
test('malformed shell, bad content type and network failure give honest useful 503 fallback',async()=>{
 for(const fetch of [async()=>new Response('broken',{headers:{'Content-Type':'text/html'}}),async()=>new Response('{}',{headers:{'Content-Type':'application/json'}}),async()=>{throw Error('network')}]){
  const r=await withWeightUnderstandingReview({fetch}).fetch(new Request('https://shiftsometimber.co.uk'+PATH),{SHIFT_WEIGHT_UNDERSTANDING_REVIEW:'1'});assert.equal(r.status,503);assert.match(await r.text(),/No account is needed/);
 }
});
test('drift fails atomically; missing or multiple mains do not become valid pages',()=>{
 assert.throws(()=>amendSupportingDocument('/weight-loss-support-for-men',support.replace('Can I use My Timber after stopping Mounjaro or Wegovy?','Changed question')),/source_drift/);
 assert.throws(()=>renderCandidate('<html><head></head><body>broken</body></html>'),/invalid_shell/);
 assert.throws(()=>renderCandidate(shell.replace('</main>','</main><main>second</main>')),/invalid_shell/);
});
test('mood preserves urgent care and all existing content; only distinct modules/links are added',()=>{
 const input=shell.replace('<h1>Programme</h1>','<h1>Mood</h1><section id="urgent">Call emergency services if immediate danger</section>');
 const h=amendSupportingDocument('/mental-health/mental-health-and-weight',input);assert.match(h,/id="urgent">Call emergency/);assert.match(h,/You do not need to wait until you reach a particular weight/);
 for(const p of ['/articles/weight-loss-plateau-men','/mens-weight-management','/articles/evidence-based-weight-loss'])assert.match(amendSupportingDocument(p,input),/why-is-weight-loss-so-hard/);
});
test('homepage, Start Here, member routes and unrelated HEAD requests pass through verbatim',async()=>{
 const seen=[];const worker={fetch:async req=>{seen.push([new URL(req.url).pathname,req.method]);return new Response(req.method==='HEAD'?null:'untouched',{headers:{'X-Original':'kept'}})}};
 const w=withWeightUnderstandingReview(worker);
 for(const p of ['/','/start-here','/member/dashboard','/anything'])for(const method of ['GET','HEAD']){const r=await w.fetch(new Request('https://shiftsometimber.co.uk'+p,{method}),{SHIFT_WEIGHT_UNDERSTANDING_REVIEW:'1'});assert.equal(r.headers.get('X-Original'),'kept');assert.equal(await r.text(),method==='HEAD'?'':'untouched');assert.deepEqual(seen.at(-1),[p,method])}
});
test('disabled adapter never changes production requests and POST never performs review transforms',async()=>{
 let count=0;const worker={fetch:async()=>{count++;return new Response('original',{status:404})}},w=withWeightUnderstandingReview(worker);
 for(const env of [{},{SHIFT_WEIGHT_UNDERSTANDING_REVIEW:'0'}])assert.equal((await w.fetch(new Request('https://shiftsometimber.co.uk'+PATH),env)).status,404);
 assert.equal((await w.fetch(new Request('https://shiftsometimber.co.uk'+PATH,{method:'POST'}),{SHIFT_WEIGHT_UNDERSTANDING_REVIEW:'1'})).status,404);assert.equal(count,3);
});
test('GET and HEAD work in review; upstream outages remain failures and no stale cache validators survive',async()=>{
 const w=withWeightUnderstandingReview({fetch:async()=>new Response(shell,{headers:{'Content-Type':'text/html','ETag':'old','Content-Length':'10','Content-Encoding':'gzip'}})});
 for(const method of ['GET','HEAD']){const r=await w.fetch(new Request('https://shiftsometimber.co.uk'+PATH+'?from=test',{method}),{SHIFT_WEIGHT_UNDERSTANDING_REVIEW:'1'});assert.equal(r.status,200);assert.equal(r.headers.get('ETag'),null);assert.equal(r.headers.get('Content-Encoding'),null);assert.equal(r.headers.get('X-Robots-Tag'),'noindex, nofollow');assert.equal((await r.text()).length===0,method==='HEAD')}
 const failed=withWeightUnderstandingReview({fetch:async()=>new Response('unavailable',{status:503})});assert.equal((await failed.fetch(new Request('https://shiftsometimber.co.uk'+PATH),{SHIFT_WEIGHT_UNDERSTANDING_REVIEW:'1'})).status,503);
});
test('production entry, approval composition and deployment workflows do not import or enable this candidate',()=>{
 for(const p of ['worker-entry-v6.js','release/approved-runtime-composition.mjs','.github/workflows/cloudflare-production-promote.yml'])assert.doesNotMatch(readFileSync(new URL('../'+p,import.meta.url),'utf8'),/obesity-awareness\/candidate|SHIFT_WEIGHT_UNDERSTANDING_REVIEW/);
});
