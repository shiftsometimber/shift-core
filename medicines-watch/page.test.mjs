import test from 'node:test';
import assert from 'node:assert/strict';
import {medicines,sources,REVIEWED_AT} from './data.mjs';
import {watchMain,renderWatchDocument,medicinesWatchRoutes,withMedicinesWatchEntry,WATCH_PATH,HEALTH_PATH} from './page.mjs';
import {TREATMENTS_ENTRY} from './preservation.mjs';

const shell='<!doctype html><html><head><title>Treatments</title><link rel="canonical" href="https://shiftsometimber.co.uk/treatment-centre"><meta name="description" content="old"><script type="application/ld+json">{}</script></head><body class="one-shift treatment-centre-v42h"><header>Original menu</header><main id="main-content"><h1>Existing treatments</h1></main><footer>Original footer</footer></body></html>';
const health={available:true,medicines:medicines.map(m=>({id:m.id,status:'current'})),sources:sources.map(s=>({id:s.id,status:'current',lastSuccessAt:REVIEWED_AT})),lastAttemptAt:REVIEWED_AT};
test('all six references have balanced claims and exact evidence URLs',()=>{
 assert.equal(medicines.length,6);assert.equal(medicines.filter(m=>m.status==='authorised').length,5);
 assert.equal(new Set(sources.map(s=>s.id)).size,sources.length);
 for(const m of medicines){for(const key of ['name','ingredient','route','authorisation','mechanism','benefit'])assert.ok(m[key],m.id+': '+key);assert.ok(m.tradeoffs.length);assert.ok(m.access.nhsEngland);assert.ok(m.access.private);assert.ok(m.sourceIds.length);for(const id of m.sourceIds)assert.ok(sources.some(s=>s.id===id),id);}
 for(const s of sources){assert.equal(new URL(s.url).protocol,'https:');assert.ok(s.requiredTerms.length);assert.ok(Date.parse(s.reviewedAt));}
});
test('renders all medicine cards and evidence without client fetch or member integration',()=>{
 const html=watchMain(health);
 assert.equal((html.match(/data-watch-card /g)||[]).length,6);
 for(const m of medicines)assert.ok(html.includes('id="'+m.id+'"'));
 for(const source of sources)assert.ok(html.includes(source.url.replaceAll('&','&amp;')));
 assert.doesNotMatch(html,/\/member\/|\/v1\/radar\/|clinically reviewed|buy now|fetch\(/i);
 assert.match(html,/Reference review/);assert.match(html,/Latest check attempt/);assert.match(html,/Sources unchanged/);
});
test('filters work server-side and never turn an unapproved medicine into a treatment',()=>{
 const result=watchMain(health,new URLSearchParams({q:'retatrutide',status:'investigational',route:'injection'}));
 assert.equal((result.match(/data-watch-card /g)||[]).length,1);assert.match(result,/Investigational · not UK authorised/);assert.doesNotMatch(result,/id="mounjaro"/);
 assert.match(watchMain(health,new URLSearchParams({q:'<script>alert(1)</script>'})),/&lt;script&gt;/);
 assert.doesNotMatch(watchMain(health,new URLSearchParams({q:'<script>alert(1)</script>'})),/<script>alert/);
});
test('source failure is visible and is never presented as a renewed review',()=>{
 const html=watchMain({available:false,medicines:[{id:'mounjaro',status:'check_delayed'}]});
 assert.match(html,/Source check delayed/);assert.match(html,/Some source checks are pending or delayed/);assert.match(html,/monitor is temporarily unavailable/);
 assert.ok(html.includes('0 of '+sources.length+' monitored sources'));
});
test('child retains shell but replaces main and metadata exactly once',()=>{
 const awkwardShell=shell.replace('<meta name="description" content="old">','<meta content="old" name="description"><meta content="old social" property="og:description"><meta content="old tweet" name="twitter:description">');
 const html=renderWatchDocument(awkwardShell.replace('</head>','<script src="/assets/treatment-guided-v1.js?v=1"></script><script src="/assets/shift-service-bridge-v1.js?v=2"></script><script src="/assets/v42.js"></script></head>'),health);
 assert.doesNotMatch(html,/(?:treatment-guided-v1|shift-service-bridge-v1)\.js/);assert.match(html,/src="\/assets\/v42.js"/);
 assert.match(html,/<header>Original menu<\/header>/);assert.match(html,/<footer>Original footer<\/footer>/);
 assert.equal((html.match(/<main\b/g)||[]).length,1);assert.equal((html.match(/<h1>/g)||[]).length,1);
 assert.doesNotMatch(html,/Existing treatments|class="one-shift treatment-centre/);
 assert.equal((html.match(/rel="canonical"/g)||[]).length,1);assert.match(html,/https:\/\/shiftsometimber.co.uk\/treatment-centre\/medicines-watch/);
 assert.equal((html.match(/name="description"/g)||[]).length,1);assert.equal((html.match(/property="og:description"/g)||[]).length,1);assert.equal((html.match(/name="twitter:description"/g)||[]).length,1);
 assert.doesNotMatch(html,/old social|old tweet/);
});
test('parent only gains the exact marked entry; all original bytes survive',async()=>{
 const r=await withMedicinesWatchEntry(new Response(shell,{headers:{'content-type':'text/html'}}),new Request('https://shiftsometimber.co.uk/treatment-centre'));
 const body=await r.text();assert.equal(body.replace(TREATMENTS_ENTRY,''),shell);
 assert.equal(body.indexOf(TREATMENTS_ENTRY),body.indexOf('<main id="main-content">')+'<main id="main-content">'.length);
});
test('public status and document paths are SELECT-only; POST cannot initiate a scan',async()=>{
 const statements=[];const DB={prepare(sql){statements.push(sql);assert.match(sql,/^SELECT /);return {all:async()=>({results:[]})}},exec(){throw Error('unexpected write')}};
 const request=path=>new Request('https://shiftsometimber.co.uk'+path);
 const api=await medicinesWatchRoutes(request(HEALTH_PATH),{DB});assert.equal(api.status,200);assert.equal((await api.json()).sources.length,sources.length);
 let fetched;
 const page=await medicinesWatchRoutes(request(WATCH_PATH),{DB},{fetchImpl:async(url,options)=>{fetched={url:String(url),options};return new Response(shell,{headers:{'content-type':'text/html'}})}});
 assert.equal(page.status,200);assert.equal(fetched.url,'https://projectshift.pages.dev/treatment-centre');assert.deepEqual(fetched.options.headers,{Accept:'text/html'});
 const post=await medicinesWatchRoutes(new Request('https://shiftsometimber.co.uk'+HEALTH_PATH,{method:'POST'}),{DB});assert.equal(post.status,405);assert.equal(statements.length,2);
 assert.equal(await medicinesWatchRoutes(request('/member/dashboard'),{DB}),null);
});
