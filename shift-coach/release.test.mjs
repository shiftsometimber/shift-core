import {ensureReviewedHistory,REVIEWED_HISTORY_REFS,COACH_ARTICLE_BASE,COACH_ARTICLE_ADDITIONS,COACH_ARTICLE_CHANGES} from './release-contract.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {COACH_BASE,COACH_PATHS,COACH_COMPOSED_BOOK_ADDITIONS,COACH_COMPOSED_BOOK_CHANGES,assertCoachingChangedPath,WATCH_CURRENT_PATHS,assertCoachingConfiguration,withoutCoachEntrypoint,coachingHistoricalRef,validateCoachingSource,assertLaunchDecisions} from './release-contract.mjs';
const config=readFileSync('wrangler.jsonc','utf8'),before=execFileSync('git',['show',COACH_BASE+':wrangler.jsonc'],{encoding:'utf8'});
const manifest=JSON.parse(readFileSync('shift-coach/release-manifest.json','utf8'));
test('merged article composition preserves exact baseline bytes and rejects unexpected statuses',()=>{
 for(const p of [...COACH_ARTICLE_ADDITIONS,...COACH_ARTICLE_CHANGES]){
  const status=COACH_ARTICLE_ADDITIONS.has(p)?'A':'M';
  assert.doesNotThrow(()=>assertCoachingChangedPath(status,p));
  for(const bad of ['D','R',status==='A'?'M':'A'])assert.throws(()=>assertCoachingChangedPath(bad,p));
  const m={...manifest,applicationCommit:'a'.repeat(40)};
  // Even a matching application pin cannot silently re-authorise changed article bytes.
  assert.throws(()=>validateCoachingSource((ref,path)=>ref===(COACH_ARTICLE_CHANGES.has(p)?'0d084f00cf6c4593dd0c11dfd047daf4e5103295':COACH_ARTICLE_BASE)&&path===p?'prior-article':path,m),/Merged article repair source drift/);
 }
});
test('merged My Health Plan member asset is retained exactly and cannot be widened by repinning',()=>{
 const p='frontend/member/whole-man-intent-os-v1.js',m={...manifest,applicationCommit:'a'.repeat(40)};
 assert.doesNotThrow(()=>assertCoachingChangedPath('M',p));
 for(const status of ['A','D','R'])assert.throws(()=>assertCoachingChangedPath(status,p));
 assert.throws(()=>validateCoachingSource((ref,path)=>ref==='5bf5a7febae1a6bab3a549507306669456a8aaa6'&&path===p?'prior-asset':path,m),/Merged My Health Plan v2 asset source drift/);
});
test('normal production configuration includes the coach with exactly one entrypoint-only change',()=>{assertCoachingConfiguration(config,before);assert.equal(config,readFileSync('wrangler.coaching.jsonc','utf8'));assert.equal(withoutCoachEntrypoint(config),before);});
test('configuration drift, a lost wrapper, extra bindings and duplicate entrypoints fail closed',()=>{for(const bad of [before,config+'\n',config.replace('"STRIPE_MODE": "test"','"STRIPE_MODE": "live"'),config.replace('"DB"','"OTHER_DB"'),config.replace('"main":','"main": "shift-coach/worker.mjs", "main":')])assert.throws(()=>assertCoachingConfiguration(bad,before));});
test('every coaching and release integration source has an exact pin; any drift fails',()=>{const m={...manifest,applicationCommit:'a'.repeat(40)},read=(ref,p)=>p;assert.doesNotThrow(()=>validateCoachingSource(read,m));for(const p of m.pinnedPaths)assert.throws(()=>validateCoachingSource((ref,path)=>ref==='HEAD'&&path===p?'drift':path,m),/Coaching release source drift/);assert.throws(()=>validateCoachingSource(read,{...m,pinnedPaths:m.pinnedPaths.slice(1)}));});
test('the exact current Watch files remain pinned and historical review bytes are only used for named integrations',()=>{const m={...manifest,applicationCommit:'a'.repeat(40)};for(const p of WATCH_CURRENT_PATHS)assert.throws(()=>validateCoachingSource((ref,path)=>ref==='HEAD'&&path===p?'drift':path,m),/Current Watch source drift/);assert.equal(coachingHistoricalRef('HEAD','wrangler.jsonc'),COACH_BASE);for(const p of ['worker-entry-v6.js','frontend/member/my-timber-preview.html','member-design.mjs','unknown.mjs'])assert.equal(coachingHistoricalRef('HEAD',p),'HEAD');});
test('launch preserves privacy and purpose gates; exact owner acceptance never claims independent review',()=>{
 assert.equal(assertLaunchDecisions(manifest),true);
 assert.equal(typeof manifest.decisions.independentAcceptance.approved,'boolean');
 const ownerOnly=structuredClone(manifest);ownerOnly.decisions.independentAcceptance.approved=false;
 const noOwner=structuredClone(ownerOnly);delete noOwner.decisions.ownerAcceptance;assert.throws(()=>assertLaunchDecisions(noOwner),/ownerAcceptance/);
 for(const key of ['boundedScope','privacyAssessment','intendedPurpose','productionLaunch','ownerAcceptance']){const m=structuredClone(ownerOnly);m.decisions[key].approved=false;assert.throws(()=>assertLaunchDecisions(m));m.decisions[key]={approved:true};assert.throws(()=>assertLaunchDecisions(m));}
 for(const changes of [{engineeringVerified:false},{independentReviewCompleted:true},{applicationCommit:'a'.repeat(40)},{verificationEvidence:''}]){const m=structuredClone(ownerOnly);Object.assign(m.decisions.ownerAcceptance,changes);assert.throws(()=>assertLaunchDecisions(m));}
 const independent=structuredClone(noOwner);independent.decisions.independentAcceptance={approved:true,decidedBy:'Synthetic independent fixture',decidedAt:'Synthetic fixture only',evidence:'Synthetic fixture only'};assert.equal(assertLaunchDecisions(independent),true);
 assert.throws(()=>assertLaunchDecisions({...manifest,completeV2:true}));
});
test('production path keeps the existing rollback/deploy checks and checks launch before any production work',()=>{const wf=readFileSync('.github/workflows/cloudflare-production-promote.yml','utf8');assert(wf.includes('"shift-coach/**"'));assert(wf.indexOf('node shift-coach/release-contract.mjs --require-launch')<wf.indexOf('node release/growth-preflight.mjs'));assert(wf.includes('node --test shift-coach/integration.test.mjs shift-coach/release.test.mjs'));assert.equal((wf.match(/node release\/member-runtime-deploy\.mjs/g)||[]).length,1);for(const s of ['Capture current Worker deployment for rollback','Verify exact current main before production mutations','Restore the captured runtime if a post-deployment gate failed'])assert(wf.includes(s));});

test('composed book release accepts only exact named additions and modifications; unrelated paths and deletion fail',()=>{
 for(const path of COACH_COMPOSED_BOOK_ADDITIONS){assert.doesNotThrow(()=>assertCoachingChangedPath('A',path));assert.throws(()=>assertCoachingChangedPath('M',path));assert.equal(coachingHistoricalRef('HEAD',path),'HEAD');}
 for(const path of COACH_COMPOSED_BOOK_CHANGES){assert.doesNotThrow(()=>assertCoachingChangedPath('M',path));assert.throws(()=>assertCoachingChangedPath('D',path));assert.equal(coachingHistoricalRef('HEAD',path),'HEAD');}
 for(const path of ['editorial/book-voice/unreviewed.mjs','worker-entry-v6.js','frontend/member/my-timber-preview.html','unknown.mjs'])assert.throws(()=>assertCoachingChangedPath('M',path),/Unlisted/);
});

test('latest registry-wave proof and exact composed Watch bytes remain mandatory',async()=>{
 const {WATCH_CURRENT_BASE,WATCH_COMPOSED_CHANGES,WATCH_COMPOSED_ADDITIONS}=await import('./release-contract.mjs');
 const {validateWatchRegistryWave,WATCH_REGISTRY_WAVE_COMMIT}=await import('../release/watch-registry-wave-scope.mjs');
 const calls=[];validateWatchRegistryWave((ref,path)=>{calls.push({ref,path});return path;});
 for(const path of WATCH_COMPOSED_CHANGES)assert(calls.some(c=>c.path===path&&c.ref===WATCH_REGISTRY_WAVE_COMMIT));
 assert(calls.some(c=>c.path==='medicines-watch/discovery.mjs'&&c.ref===WATCH_REGISTRY_WAVE_COMMIT));
 for(const path of WATCH_COMPOSED_CHANGES){assert.doesNotThrow(()=>assertCoachingChangedPath('M',path));assert.throws(()=>assertCoachingChangedPath('D',path));}
 for(const path of WATCH_COMPOSED_ADDITIONS){assert.doesNotThrow(()=>assertCoachingChangedPath('A',path));assert.throws(()=>assertCoachingChangedPath('M',path));}
});

test('missing reviewed preview history is fetched by its exact immutable identity and still fails if unavailable',()=>{
 const calls=[],present=new Set([REVIEWED_HISTORY_REFS[0]]);
 ensureReviewedHistory((bin,args)=>{calls.push(args);if(args[0]==='cat-file'&&!present.has(args[2].replace('^{commit}','')))throw Error('missing');if(args[0]==='fetch')present.add(args[3]);});
 assert.deepEqual(calls.filter(a=>a[0]==='fetch'),[['fetch','--no-tags','origin',REVIEWED_HISTORY_REFS[1]]]);
 assert.throws(()=>ensureReviewedHistory((bin,args)=>{throw Error(args[0]==='fetch'?'fetch unavailable':'missing')}),/fetch unavailable/);
});
test('retained current-main continuity alias cannot be silently widened by repinning',()=>{
 const p='public-continuity.mjs',m={...manifest,applicationCommit:'a'.repeat(40)};
 assert.doesNotThrow(()=>assertCoachingChangedPath('M',p));
 for(const status of ['A','D','R'])assert.throws(()=>assertCoachingChangedPath(status,p));
 assert.throws(()=>validateCoachingSource((ref,path)=>ref==='71383ce716abc9c8c937e48c87f59a2e9fe2d618'&&path===p?'prior-alias':path,m),/Merged continuity alias source drift/);
});

test('merged health safety corrections and their evidence remain independently pinned',()=>{
 const m={...manifest,applicationCommit:'a'.repeat(40)};
 for(const p of ['docs/content-review/2026-10-03-health-safety.json','frontend/member/shift-health-catalogue-v1.js','shift-health-public-content.mjs','tests/testosterone-public.test.mjs'])assert.throws(()=>validateCoachingSource((ref,path)=>ref==='7bd5fb37d7bbce66fa5e728f59304843817128bf'&&path===p?'prior-safety':path,m),/Merged health-safety source drift/);
});
test('merged living Health Plan test is an exact addition and cannot be silently changed by repinning',()=>{
 const p='tests/my-health-plan-v2.test.mjs',m={...manifest,applicationCommit:'a'.repeat(40)};
 assert.doesNotThrow(()=>assertCoachingChangedPath('A',p));
 for(const status of ['M','D','R'])assert.throws(()=>assertCoachingChangedPath(status,p));
 assert.throws(()=>validateCoachingSource((ref,path)=>ref==='5bf5a7febae1a6bab3a549507306669456a8aaa6'&&path===p?'changed-test':path,m),/Merged My Health Plan v2 test source drift/);
});

test('merged public-copy receipts are exact additions with independently immutable bytes',()=>{
 const m={...manifest,applicationCommit:'a'.repeat(40)};
 for(const p of ['docs/content-review/2026-10-03-public-copy-preview.json','docs/content-review/2026-10-03-public-copy-residual.json']){
  assert.doesNotThrow(()=>assertCoachingChangedPath('A',p));
  for(const status of ['M','D','R'])assert.throws(()=>assertCoachingChangedPath(status,p));
  assert.throws(()=>validateCoachingSource((ref,path)=>ref==='6578113c754a60e75d0cd9b3cd94f2d546444409'&&path===p?'changed-receipt':path,m),/Merged public-copy receipt source drift/);
 }
});

test('current-shell Health Plan mount preserves only the exact named dashboard changes',()=>{
 const m={...manifest,applicationCommit:'a'.repeat(40)};
 for(const p of ['member-experience/dashboard-tools.mjs','member-experience/tests/dashboard-tools.test.mjs']){
  assert.doesNotThrow(()=>assertCoachingChangedPath('M',p));
  for(const status of ['A','D','R'])assert.throws(()=>assertCoachingChangedPath(status,p));
  assert.throws(()=>validateCoachingSource((ref,path)=>ref==='5bf5a7febae1a6bab3a549507306669456a8aaa6'&&path===p?'changed-mount':path,m),/Merged Health Plan dashboard mount source drift/);
 }
});
