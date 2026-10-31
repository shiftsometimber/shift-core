import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {officialEditorialEvidence,isEditorialIntakeRelevant} from '../radar-editorial-intake-v1.mjs';
const mhra='https://www.gov.uk/drug-safety-update/medsafetyweek-yellow-card';
const hansard='https://hansard.parliament.uk/Commons/2026-10-26/debates/81DF3600-3821-4968-B891-0ECC8F28791F/ProstateCancerScreening';
const fixture=url=>({inputUrl:url,finalUrl:url,title:'Original UK authority announcement',body:'Readable original source findings. '.repeat(20),sourceDate:'2026-10-26',retrievedAt:'2026-10-31T16:00:00Z'});
test('original MHRA and parliamentary non-DOI documents retain source and retrieval dates separately',()=>{for(const u of [mhra,hansard,'https://commonslibrary.parliament.uk/research-briefings/cbp-12230/']){const e=officialEditorialEvidence(fixture(u));assert.equal(e.source_tier,1);assert.equal(e.url,u);assert.equal(e.source_date,'2026-10-26');assert.equal(e.retrieved_at,'2026-10-31T16:00:00Z');assert.equal(e.manual_editorial_intake,true);}});
test('lookalike hosts, credentials, unrelated gov pages and cross-authority redirects cannot confer authority',()=>{for(const u of ['http://www.gov.uk/drug-safety-update/test','https://www.gov.uk.evil.test/drug-safety-update/test','https://www.gov.uk@evil.test/drug-safety-update/test','https://www.gov.uk/not-mhra/test','https://hansard.parliament.uk/other','https://www.gov.uk/drug-safety-update/test?redirect=evil'])assert.equal(officialEditorialEvidence(fixture(u)),null);assert.equal(officialEditorialEvidence({...fixture(mhra),finalUrl:hansard}),null);assert.equal(officialEditorialEvidence({...fixture(mhra),finalUrl:'https://evil.test/article'}),null);});
test('unreadable bodies, interstitials and missing/future dates stay unqualified',()=>{for(const delta of [{body:'short'},{title:'Access denied'},{sourceDate:null},{sourceDate:'2099-01-01'},{retrievedAt:'invalid'}])assert.equal(officialEditorialEvidence({...fixture(mhra),...delta}),null);});
test('men’s health and reporting-service scope is recognised without accepting unrelated generic news',()=>{for(const text of ['Prostate cancer screening','PSA testing','Testosterone assessment','Cholesterol blood tests','Yellow Card reporting changes','MedSafetyWeek'])assert.equal(isEditorialIntakeRelevant(text),true);assert.equal(isEditorialIntakeRelevant('Football scores announced'),false);});
test('integration retains authenticated intake, existing owner approval and source-change gates; official intake neither generates copy nor sends notifications',()=>{const s=fs.readFileSync(new URL('../radar-integration-v1.js',import.meta.url),'utf8');assert(s.indexOf('const a=await hqUser')<s.indexOf("return intakeUrl(request,env,a.user)"));assert.match(s,/if\(v.verified&&!official\)prepared=await preparePackages/);assert.match(s,/if\(existing\)return j\(\{ok:true,event:decodeEvent\(existing\),existing:true/);assert.match(s,/if\(!verification.verified\)return j\(\{ok:false,error:'evidence_not_verified'/);assert.match(s,/if\(sourceChange&&\['process','approve','publish'\].includes\(action\)\)return sourceChangeRequired/);});

test('actual authenticated intake deduplicates a readable official document and leaves publication/copy untouched',async()=>{
 const {memoryDB}=await import('../preview/newsroom-discovery/memory-db.mjs');
 const {default:hq}=await import('../hq-ai.js');const {radarRoutes}=await import('../radar-integration-v1.js');
 const originalFetch=globalThis.fetch,originalAuth=hq.fetch;const DB=memoryDB();let requests=0;
 hq.fetch=async()=>Response.json({user:{role:'owner',email:'owner@example.test'}});
 const html='<title>MedSafetyWeek: Yellow Card reporting</title><main>'+('MHRA describes Yellow Card reporting-service improvements. '.repeat(20))+'</main>';
 globalThis.fetch=async()=>{requests++;return Object.defineProperty(new Response(html), 'url',{value:mhra})};
 const request=()=>new Request('https://api.example.test/v1/hq/radar/intake',{method:'POST',body:JSON.stringify({url:mhra,source_date:'2026-10-26',region:'UK'})});
 try{
  const response=await radarRoutes(request(),{DB},{}),first=await response.json();assert.equal(response.status,201);assert.equal(first.manualReviewRequired,true);assert.equal(first.event.status,'verified');assert.equal(first.prepared,null);assert.equal(first.event.source_evidence[0].source_tier,1);assert.equal(first.event.content_package.article_markdown,undefined);
  const again=await (await radarRoutes(request(),{DB},{})).json();assert.equal(again.existing,true);assert.equal(again.event.id,first.event.id);assert.equal((await DB.prepare('SELECT COUNT(*) n FROM radar_events').first()).n,1);assert.equal((await DB.prepare('SELECT COUNT(*) n FROM radar_publication_jobs').first()).n,0);assert.equal(requests,2);
  globalThis.fetch=async()=>new Response('Unavailable',{status:403});const failed=await radarRoutes(request(),{DB},{});assert.equal(failed.status,422);assert.equal((await DB.prepare('SELECT COUNT(*) n FROM radar_events').first()).n,1);
 }finally{globalThis.fetch=originalFetch;hq.fetch=originalAuth}
});
