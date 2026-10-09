import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PATH,applyPillarMetadata,supportingMetadata,amendPillarChrome,renderCandidate,amendSupportingDocument,withWeightUnderstandingReview} from './candidate.mjs';
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
 assert.match(main,/Tomorrow I’ll have/);assert.match(main,/my fallback/);assert.match(main,/I would like help with my weight and health/);assert.doesNotMatch(main,/Lilly/);
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
 for(const p of ['/articles/weight-loss-plateau-men','/mens-weight-management','/articles/evidence-based-weight-loss'])assert.match(amendSupportingDocument(p,input),/male-obesity/);
});
test('homepage and member routes pass through verbatim',async()=>{
 const seen=[];const worker={fetch:async req=>{seen.push([new URL(req.url).pathname,req.method]);return new Response(req.method==='HEAD'?null:'untouched',{headers:{'X-Original':'kept'}})}};
 const w=withWeightUnderstandingReview(worker);
 for(const p of ['/','/member/dashboard'])for(const method of ['GET','HEAD']){const r=await w.fetch(new Request('https://shiftsometimber.co.uk'+p,{method}),{SHIFT_WEIGHT_UNDERSTANDING_REVIEW:'1'});assert.equal(r.headers.get('X-Original'),'kept');assert.equal(await r.text(),method==='HEAD'?'':'untouched');assert.deepEqual(seen.at(-1),[p,method])}
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

import {publicHeader,publicDrawer} from '../public-shell-contract.mjs';
import {approvedFooter} from '../shared-footer.mjs';
test('pillar is a footer heading and drawer entry, with primary nav and Start Here main preserved',()=>{
 const real=shell.replace(/<header>[\s\S]*?<\/header>/,publicHeader+publicDrawer).replace('<footer>Existing footer</footer>',approvedFooter);
 const changed=amendPillarChrome(real,'/start-here');
 assert.ok(changed.includes(publicHeader));assert.equal(changed.match(/data-male-obesity-footer/g).length,2);
 assert.match(changed,/<h2>Male obesity<\/h2>/);assert.match(changed,/My Timber<\/a><a href="\/male-obesity">Male obesity/);
 assert.equal(changed.match(/<main[\s\S]*?<\/main>/)[0],real.match(/<main[\s\S]*?<\/main>/)[0]);
 assert.equal(amendPillarChrome(real,'/'),real);assert.equal(amendPillarChrome(real,'/member/dashboard'),real);assert.equal(amendPillarChrome(changed,'/start-here'),changed);
});

test('support visible copy and FAQ stop promising unchecked Fit and twelve-week delivery',()=>{
 const h=amendSupportingDocument('/weight-loss-support-for-men',support);
 assert.doesNotMatch(h,/12-week|12 weeks|Grub \+ Fit|Today, Grub, Fit|guidance available in Fit|thousands of recipe|let My Timber adapt/);
 assert.match(h,/meal is suitable/);assert.match(h,/Can I keep using the free support/);
});
test('supporting metadata and sharing tags agree; article evidence and dates remain truthful',()=>{
 for(const [path,meta]of Object.entries(supportingMetadata)){
  const source=shell.replace('</head>',`<meta property="og:title" content="Stale"><script type="application/ld+json">${JSON.stringify({'@graph':[{'@type':'Article',url:'https://shiftsometimber.co.uk'+path,description:'Old',dateModified:'old',citation:['https://www.nhs.uk/']},{'@type':'Article',url:'https://example.org/unrelated',description:'Leave me'}]})}</script></head>`);
  const h=applyPillarMetadata(source,path);assert.equal((h.match(/<title>/g)||[]).length,1);assert.equal((h.match(/rel="canonical"/g)||[]).length,1);assert.match(h,/noindex,nofollow/);assert.ok(!h.includes('content="Stale"'));assert.ok(h.includes(meta.description));
  const graph=JSON.parse(h.match(/application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];assert.equal(graph[0].description,meta.description);assert.equal(graph[0].dateModified,undefined);assert.deepEqual(graph[0].citation,['https://www.nhs.uk/']);assert.equal(graph[1].description,'Leave me');
 }
 assert.throws(()=>applyPillarMetadata(shell.replace('</head>',''),'\/weight-loss-support-for-men'),/invalid_shell/);
 assert.throws(()=>applyPillarMetadata(shell.replace('</head>','<script type="application/ld+json">broken</script></head>'),'/weight-loss-support-for-men'),/invalid_schema/);
});

test('hub explains Start Here, SHIFT Health and practical support as distinct optional routes',()=>{
 const h=renderCandidate(shell),main=h.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];assert.match(main,/id="where-shift-fits"/);assert.match(main,/href="\/start-here">Start Here/);assert.match(main,/href="\/shift-health">SHIFT Health/);assert.match(main,/Reading a page does not book a test/);assert.match(main,/does not diagnose you or decide/);assert.match(main,/without an account or purchase/);
});
