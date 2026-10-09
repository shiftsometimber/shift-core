import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyComposedRuntime,COMPOSITION_BASE,COMPOSITION_SOURCE,COMPOSITION_PATHS} from '../release/approved-runtime-composition.mjs';
const fixture=()=>({head:COMPOSITION_SOURCE,ancestor:()=>{},diff:(a,b)=>a===COMPOSITION_BASE&&b===COMPOSITION_SOURCE?[...COMPOSITION_PATHS]:[],read:()=> 'same'});
test('exact independently approved source composition passes',()=>assert.equal(verifyComposedRuntime(fixture()).paths,36));
test('every approved path remains byte-pinned',()=>{
 for(const path of COMPOSITION_PATHS){const f=fixture();f.head='a'.repeat(40);f.read=(ref,p)=>ref===f.head&&p===path?'drift':'same';assert.throws(()=>verifyComposedRuntime(f),/source drift/);}
});
test('privacy, runtime binding, SEO payload and deploy workflow remain protected',()=>{
 for(const path of ['wrangler.jsonc','package.json','package-lock.json','.github/workflows/cloudflare-production-promote.yml','acquisition-activation/consent.mjs','activation-measurement/assets.mjs','shift-coach/worker.mjs','shift-coach/release-manifest.json','public-seo-context.mjs','public-seo-organic-links.mjs','public-seo-organic-link-data.mjs']){
 const f=fixture();f.head='a'.repeat(40);f.read=(ref,p)=>ref===f.head&&p===path?'drift':'same';assert.throws(()=>verifyComposedRuntime(f),/boundary drift/);}
});
test('an unknown later file is rejected rather than silently whitelisted',()=>{
 const f=fixture();f.diff=(a,b)=>a===COMPOSITION_BASE?[...COMPOSITION_PATHS]:['checkout.mjs'];assert.throws(()=>verifyComposedRuntime(f),/Unreviewed changes/);
});
test('missing or extra composition files are rejected',()=>{
 for(const paths of [COMPOSITION_PATHS.slice(1),[...COMPOSITION_PATHS,'checkout.mjs']]){const f=fixture();f.diff=(a,b)=>a===COMPOSITION_BASE?paths:[];assert.throws(()=>verifyComposedRuntime(f),/Unreviewed composition path/);}
});
test('all source commits must be ancestors of the actual head',()=>{
 const f=fixture();f.ancestor=()=>{throw Error('Not an ancestor');};assert.throws(()=>verifyComposedRuntime(f),/Not an ancestor/);
});
test('invalid head identifiers are rejected',()=>assert.throws(()=>verifyComposedRuntime({...fixture(),head:'HEAD'})));
test('captured repository source passes a real independent Git check',()=>assert.equal(verifyComposedRuntime({head:COMPOSITION_SOURCE}).source,COMPOSITION_SOURCE));

import {verifyReconciledRelease,reconciliationHistoricalRead,reconciliationRecord,RECONCILIATION_MAINTENANCE} from '../release/approved-runtime-composition.mjs';
test('actual composed release and its finite maintenance receipt pass',()=>assert(verifyReconciledRelease()));
test('fresh supplied readers cannot conceal payload or maintenance drift',()=>{for(const path of [...COMPOSITION_PATHS,...RECONCILIATION_MAINTENANCE])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':'same'),/source.*drift/);});
test('historical reader maps only checked existing composition paths',()=>{const read=reconciliationHistoricalRead((ref,p)=>ref);assert.equal(read('HEAD','worker-entry-v6.js'),COMPOSITION_BASE);assert.equal(read('HEAD','acquisition-activation/consent.mjs'),'HEAD');assert.equal(read('HEAD','public-seo-organic-links.mjs'),'HEAD');});
test('a fresh malicious reader is rechecked after a successful reader',()=>{reconciliationHistoricalRead((ref,p)=>'same',true);assert.throws(()=>reconciliationHistoricalRead((ref,p)=>ref==='HEAD'&&p==='worker-entry-v6.js'?'drift':'same',true),/drift/);});

import {reconciliationChangedPath,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';
test('approved composition rejects deletion, rename and type changes for every path',()=>{
 for(const path of [...COMPOSITION_PATHS,...RECONCILIATION_MAINTENANCE,RECONCILIATION_MANIFEST])for(const status of ['D','R','R100','T','C'])assert.throws(()=>reconciliationChangedPath(status,path),/Unexpected approved composition file status/);
 assert.equal(reconciliationChangedPath('M','unreviewed.mjs'),false);
 for(const status of ['A','M'])assert.equal(reconciliationChangedPath(status,'release/seo-growth-scope.mjs'),true);
 assert.equal(reconciliationChangedPath('M','worker-entry-v6.js'),true);
 assert.throws(()=>reconciliationChangedPath('A','worker-entry-v6.js'),/Unexpected/);
 assert.equal(reconciliationChangedPath('A',RECONCILIATION_MANIFEST),true);
 assert.throws(()=>reconciliationChangedPath('M',RECONCILIATION_MANIFEST),/Unexpected/);
});

import {assertProductionProofBudget} from '../release/approved-runtime-composition.mjs';
test('production time budget cannot change commands, permissions, gates or rollback',()=>{
 const before='jobs:\n  promote:\n    timeout-minutes: 25\n    env:\n      CLOUDFLARE_ACCOUNT_ID: same\n    steps:\n      - run: original-guard\n      - run: original-rollback\n';
 const current=before.replace('timeout-minutes: 25','timeout-minutes: 60');
 assert.doesNotThrow(()=>assertProductionProofBudget(before,current));
 for(const bad of [current.replace('original-guard','skip-guard'),current.replace('original-rollback',''),current+'permissions: write-all\n',current.replace('timeout-minutes: 60','timeout-minutes: 120')])assert.throws(()=>assertProductionProofBudget(before,bad));
 assert.throws(()=>assertProductionProofBudget(before.replace('timeout-minutes: 25','timeout-minutes: 30'),current));
});

test('warmed default immutable blob proof never caches a supplied reader',()=>{
 verifyReconciledRelease();verifyReconciledRelease();
 const visited=[];
 assert.throws(()=>verifyReconciledRelease((ref,path)=>{visited.push([ref,path]);return ref==='HEAD'&&path==='worker-entry-v6.js'?'changed':'same';}),/Approved composition source \/ boundary drift/);
 assert(visited.some(([ref,path])=>ref==='HEAD'&&path==='worker-entry-v6.js'));
});


import {withImmutableHistoryVerification,immutableHistoryExecFileSync} from '../release/approved-runtime-composition.mjs';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync as directGit} from 'node:child_process';
test('immutable history reuse still invokes a fresh supplied source reader',()=>{
 withImmutableHistoryVerification(()=>{
  verifyReconciledRelease();verifyReconciledRelease();
  assert.throws(()=>verifyReconciledRelease((ref,path)=>ref==='HEAD'&&path==='worker-entry-v6.js'?'changed':'same'),/source \/ boundary drift/);
 });
});
test('scoped immutable history rejects real working-source and HEAD changes',()=>{
 const previous=process.cwd(),dir=mkdtempSync(join(tmpdir(),'shift-history-proof-'));
 try{
  process.chdir(dir);directGit('git',['init','-q']);directGit('git',['config','user.name','Synthetic verifier']);directGit('git',['config','user.email','verifier@example.invalid']);writeFileSync('tracked.txt','original\n');directGit('git',['add','tracked.txt']);directGit('git',['commit','-qm','Synthetic fixture']);
  assert.throws(()=>withImmutableHistoryVerification(()=>{
   const initial=immutableHistoryExecFileSync('git',['diff','--name-only'],{encoding:'utf8'});writeFileSync('tracked.txt','changed\n');assert.notEqual(immutableHistoryExecFileSync('git',['diff','--name-only'],{encoding:'utf8'}),initial);
  }),/Working source changed/);
  writeFileSync('tracked.txt','original\n');
  assert.throws(()=>withImmutableHistoryVerification(()=>{
   immutableHistoryExecFileSync('git',['show','HEAD:tracked.txt'],{encoding:'utf8'});
   directGit('git',['commit','--allow-empty','-qm','Synthetic changed HEAD']);
  }),/Source HEAD changed/);
 }finally{process.chdir(previous);rmSync(dir,{recursive:true,force:true});}
});

import {verifyWatchRegistryWaveProof,WATCH_REGISTRY_WAVE_PROOF_SOURCE} from '../release/watch-registry-wave-scope.mjs';
test('standalone Watch preflight validates raw current composition before its exact historical entry comparison',async()=>{
 const proof={head_sha:WATCH_REGISTRY_WAVE_PROOF_SOURCE,path:'.github/workflows/medicines-watch-check.yml',conclusion:'success'};
 assert.equal(await verifyWatchRegistryWaveProof(async path=>path.endsWith('/'+WATCH_FACTUAL_UPDATE_RUN)?factualProof():proof),proof);
 for(const patch of [{head_sha:'a'.repeat(40)},{path:'.github/workflows/unreviewed.yml'},{conclusion:'failure'}])await assert.rejects(()=>verifyWatchRegistryWaveProof(async path=>path.endsWith('/'+WATCH_FACTUAL_UPDATE_RUN)?factualProof():({...proof,...patch})));
});

import {verifyTreatmentGuidanceProof,TREATMENT_GUIDANCE_PREVIEW} from '../release/treatment-guidance-scope.mjs';
test('standalone treatment-guidance preflight preserves exact reviewed source after raw current composition verification',async()=>{
 const proof={head_sha:TREATMENT_GUIDANCE_PREVIEW,path:'.github/workflows/treatment-guidance-preview.yml',conclusion:'success'};
 assert.equal(await verifyTreatmentGuidanceProof(async()=>proof),proof);
 for(const patch of [{head_sha:'a'.repeat(40)},{path:'.github/workflows/unreviewed.yml'},{conclusion:'failure'}])await assert.rejects(()=>verifyTreatmentGuidanceProof(async()=>({...proof,...patch})));
});

import {WATCH_FACTUAL_UPDATE_SOURCE,WATCH_FACTUAL_UPDATE_RUN,WATCH_FACTUAL_UPDATE_PATHS,assertWatchFactualUpdateProof} from '../release/approved-runtime-composition.mjs';
const factualProof=()=>({id:WATCH_FACTUAL_UPDATE_RUN,head_sha:WATCH_FACTUAL_UPDATE_SOURCE,path:'.github/workflows/medicines-watch-check.yml',event:'pull_request',head_branch:'review/watch-zupreme-lifecycle-20261008',status:'completed',conclusion:'success'});
test('factual Watch amendment requires the exact passed hosted source rather than a later run or editorial authorisation',()=>{
 assert.doesNotThrow(()=>assertWatchFactualUpdateProof(factualProof()));
 for(const patch of [{id:WATCH_FACTUAL_UPDATE_RUN+1},{head_sha:'a'.repeat(40)},{path:'.github/workflows/other.yml'},{event:'push'},{head_branch:'main'},{status:'in_progress'},{conclusion:'failure'}])assert.throws(()=>assertWatchFactualUpdateProof({...factualProof(),...patch}));
});
test('new factual sources remain byte-pinned after successful historical lookups',()=>{
 verifyReconciledRelease();
 for(const path of WATCH_FACTUAL_UPDATE_PATHS)assert.throws(()=>verifyReconciledRelease(rawDriftReader(path)),/factual Watch source drift/);
 const read=reconciliationHistoricalRead((ref,p)=>ref);
 assert.equal(read('HEAD','medicines-watch/industry.mjs'),COMPOSITION_BASE);
 assert.equal(read('HEAD','checkout.mjs'),'HEAD');
 assert.equal(reconciliationChangedPath('A','medicines-watch/reviews/2026-10-08-authorised-zupreme-lifecycle-update.json'),true);
 for(const status of ['D','R','T'])assert.throws(()=>reconciliationChangedPath(status,WATCH_FACTUAL_UPDATE_PATHS[0]),/Unexpected/);
});

import {PROOF_TRANSPORT_PATHS,PROOF_TRANSPORT_SOURCE,PROOF_TRANSPORT_MAINTENANCE} from '../release/approved-runtime-composition.mjs';
test('finite GitHub transport amendment stays byte-pinned with fresh readers and rejects destructive changes',()=>{
 const receipt=verifyReconciledRelease();assert.equal(receipt.proofTransportUpdate.source,PROOF_TRANSPORT_SOURCE);
 for(const path of [...PROOF_TRANSPORT_PATHS,...PROOF_TRANSPORT_MAINTENANCE]){
  assert.throws(()=>verifyReconciledRelease(rawDriftReader(path)),/source.*drift/);
  for(const status of ['D','R','T','C'])assert.throws(()=>reconciliationChangedPath(status,path),/Unexpected/);
 }
 assert.equal(reconciliationChangedPath('M','release/growth-preflight.mjs'),true);
 assert.equal(reconciliationChangedPath('A','release/github-proof-get.mjs'),true);
 assert.throws(()=>reconciliationChangedPath('M','release/github-proof-get.mjs'),/Unexpected/);
 assert.equal(reconciliationChangedPath('M','release/unknown-proof-get.mjs'),false);
});


import {SUPPORT_ROLLBACK_SOURCE,SUPPORT_ROLLBACK_PATHS,SUPPORT_ROLLBACK_MAINTENANCE} from '../release/approved-runtime-composition.mjs';
test('serving rollback receipt refresh is finite and changes no public or medical content',()=>{
 const receipt=verifyReconciledRelease();assert.equal(receipt.supportRollbackRefresh.source,SUPPORT_ROLLBACK_SOURCE);
 for(const path of [...SUPPORT_ROLLBACK_PATHS,...SUPPORT_ROLLBACK_MAINTENANCE]){
  assert.throws(()=>verifyReconciledRelease(rawDriftReader(path)),/(?:Serving rollback .*source drift|Serving SEO (?:source|verifier) drift|Tablet wording verifier source drift)/);
  for(const status of ['D','R','T','C'])assert.throws(()=>reconciliationChangedPath(status,path),/Unexpected/);
  let existedAtBase=true;
  try{directGit('git',['cat-file','-e',COMPOSITION_BASE+':'+path],{stdio:'ignore'});}catch{existedAtBase=false;}
  assert.equal(reconciliationChangedPath(existedAtBase?'M':'A',path),true);
  if(!existedAtBase)assert.throws(()=>reconciliationChangedPath('M',path),/Unexpected/);
 }
 assert.equal(receipt.supportRollbackRefresh.publicCopyChanged,false);
 assert.equal(receipt.supportRollbackRefresh.runtimeChanged,false);
 assert.equal(receipt.supportRollbackRefresh.medicalContentChanged,false);
 assert.equal(receipt.supportRollbackRefresh.customerDataChanged,false);
});

import {ORAL_LIVE_DISPATCH_SOURCE,ORAL_LIVE_DISPATCH_PATHS,ORAL_LIVE_DISPATCH_MAINTENANCE} from '../release/approved-runtime-composition.mjs';
test('oral live dispatch verifier repair is a finite immutable engineering receipt',()=>{
 const receipt=verifyReconciledRelease();assert.equal(receipt.oralLiveDispatchGuard.source,ORAL_LIVE_DISPATCH_SOURCE);
 for(const path of [...ORAL_LIVE_DISPATCH_PATHS,...ORAL_LIVE_DISPATCH_MAINTENANCE]){
  assert.throws(()=>verifyReconciledRelease(rawDriftReader(path)),/(?:(?:Oral dispatch|Serving rollback) .*source drift|Serving SEO (?:source|verifier) drift|Tablet wording verifier source drift)/);
  for(const status of ['D','R','T','C'])assert.throws(()=>reconciliationChangedPath(status,path),/Unexpected/);
  let existedAtBase=true;
  try{directGit('git',['cat-file','-e',COMPOSITION_BASE+':'+path],{stdio:'ignore'});}catch{existedAtBase=false;}
  assert.equal(reconciliationChangedPath(existedAtBase?'M':'A',path),true);
  if(!existedAtBase)assert.throws(()=>reconciliationChangedPath('M',path),/Unexpected/);
 }
 assert.equal(receipt.oralLiveDispatchGuard.publicCopyChanged,false);
 assert.equal(receipt.oralLiveDispatchGuard.runtimeChanged,false);
 assert.equal(receipt.oralLiveDispatchGuard.medicalContentChanged,false);
 assert.equal(receipt.oralLiveDispatchGuard.customerDataChanged,false);
});

import {NHS_ARTICLE_PROOF_SOURCE,NHS_ARTICLE_PROOF_PATHS,NHS_ARTICLE_PROOF_MAINTENANCE} from '../release/approved-runtime-composition.mjs';
test('NHS live verifier refresh pins five exact source files and rejects content or scope drift',()=>{
 const receipt=verifyReconciledRelease();assert.equal(receipt.nhsArticleProofRefresh.source,NHS_ARTICLE_PROOF_SOURCE);
 for(const path of [...NHS_ARTICLE_PROOF_PATHS,...NHS_ARTICLE_PROOF_MAINTENANCE]){
  assert.throws(()=>verifyReconciledRelease(rawDriftReader(path)),/(?:NHS article .*source drift|Serving SEO (?:source|verifier) drift|Tablet wording verifier source drift)/);
  for(const status of ['D','R','T','C'])assert.throws(()=>reconciliationChangedPath(status,path),/Unexpected/);
 }
 for(const flag of ['publicCopyChanged','runtimeChanged','medicalContentChanged','customerDataChanged'])assert.equal(receipt.nhsArticleProofRefresh[flag],false);
 assert.equal(reconciliationChangedPath('M','editorial/five-articles/proof.mjs'),true);
 assert.equal(reconciliationChangedPath('M','checkout.mjs'),false);
});

import {ORAL_CANONICAL_SOURCE,ORAL_CANONICAL_PATHS,ORAL_CANONICAL_MAINTENANCE} from '../release/approved-runtime-composition.mjs';
test('late-inserted oral canonical repair is finite and preserves medical and customer boundaries',()=>{
 const c=verifyReconciledRelease().oralCanonicalRepair;assert.equal(c.source,ORAL_CANONICAL_SOURCE);
 assert.equal(c.runtimeChanged,true);assert.equal(c.approvedAnchorChanged,true);
 for(const flag of ['publicCopyChanged','medicalContentChanged','customerDataChanged'])assert.equal(c[flag],false);
 for(const path of [...ORAL_CANONICAL_PATHS,...ORAL_CANONICAL_MAINTENANCE]){
  assert.throws(()=>verifyReconciledRelease(rawDriftReader(path)),/(?:oral canonical .*source drift|Serving SEO (?:source|verifier) drift|Tablet wording verifier source drift)/);
  for(const status of ['D','R','T','C'])assert.throws(()=>reconciliationChangedPath(status,path),/Unexpected/);
 }
 assert.equal(reconciliationChangedPath('M','public-practical-guides.mjs'),true);
 assert.equal(reconciliationChangedPath('M','checkout.mjs'),false);
});


const logoutRawCache=new Map();
function rawDriftReader(path){return(ref,p)=>{
 if(ref==='HEAD'&&p===path)return 'changed';
 const key=ref+':'+p;if(!logoutRawCache.has(key))logoutRawCache.set(key,directGit('git',['show',key],{encoding:'utf8'}));return logoutRawCache.get(key);
};}

import {verifyReloadAttemptExtension,RELOAD_ATTEMPT_BASE,RELOAD_ATTEMPT_PATHS} from '../release/approved-runtime-composition.mjs';
const attemptFixture=()=>{
 const source='b'.repeat(40),head='c'.repeat(40),c={proof:'EXACT_RELOAD_ATTEMPT_RECEIPT_V1',base:RELOAD_ATTEMPT_BASE,source,paths:RELOAD_ATTEMPT_PATHS,runtimeChanged:false,customerDataChanged:false,acceptanceAssertionsWeakened:false};
 return {c,options:{head,read:()=> 'same',ancestor:()=>{},diff:(a,b)=>a===c.base?[...c.paths]:[RECONCILIATION_MANIFEST]}};
};
test('exact attempt retrieval amendment passes without changing runtime or acceptance',()=>{const {c,options}=attemptFixture();assert.equal(verifyReloadAttemptExtension(c,options),c);});
test('attempt amendment rejects raw source drift, unrelated files, weakened checks and broken ancestry',()=>{
 for(const path of RELOAD_ATTEMPT_PATHS){const {c,options}=attemptFixture();options.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyReloadAttemptExtension(c,options),/source drift/);}
 for(const key of ['runtimeChanged','customerDataChanged','acceptanceAssertionsWeakened']){const {c,options}=attemptFixture();c[key]=true;assert.throws(()=>verifyReloadAttemptExtension(c,options));}
 {const {c,options}=attemptFixture();options.diff=()=>['unreviewed.mjs'];assert.throws(()=>verifyReloadAttemptExtension(c,options),/Unrelated/);}
 {const {c,options}=attemptFixture();options.ancestor=()=>{throw Error('Missing ancestor')};assert.throws(()=>verifyReloadAttemptExtension(c,options),/Missing ancestor/);}
});

test('only the exact two recurring observation imports may change transport',()=>{
 const marker='    timeout-minutes: 25\n    env:\n      CLOUDFLARE_ACCOUNT_ID';
 const imports=['medicines-watch-observations.sql','medicines-watch-expansion-observations.sql'].map(file=>'npx wrangler d1 execute DB --remote --config wrangler.jsonc --file "$RUNNER_TEMP/'+file+'"').join('\n');
 const before=marker+'\noriginal-guard\n'+imports+'\noriginal-rollback';
 const current=before.replace('timeout-minutes: 25','timeout-minutes: 60').replaceAll('npx wrangler d1 execute DB --remote --config wrangler.jsonc --file','node release/watch-observation-seed.mjs');
 assert.doesNotThrow(()=>assertProductionProofBudget(before,current));
 for(const bad of [current.replace('original-guard','skip-guard'),current.replace('watch-observation-seed.mjs','unknown.mjs'),current.replace('original-rollback','')])assert.throws(()=>assertProductionProofBudget(before,bad));
});

import {verifyUnattributedWatchRecovery,UNATTRIBUTED_WATCH_RECOVERY_BASE,UNATTRIBUTED_WATCH_RECOVERY_SOURCE,UNATTRIBUTED_WATCH_RECOVERY_PATHS,UNATTRIBUTED_WATCH_RECOVERY_MAINTENANCE} from '../release/approved-runtime-composition.mjs';
const unattributedRecoveryFixture=()=>{
 const maintenanceSource='c'.repeat(40),head='d'.repeat(40),c={proof:'EXACT_UNATTRIBUTED_WATCH_RUNTIME_RECOVERY_V1',base:UNATTRIBUTED_WATCH_RECOVERY_BASE,source:UNATTRIBUTED_WATCH_RECOVERY_SOURCE,paths:UNATTRIBUTED_WATCH_RECOVERY_PATHS,maintenancePaths:UNATTRIBUTED_WATCH_RECOVERY_MAINTENANCE,maintenanceSource,observationRun:37902092425,successfulPredecessorRun:37895305149,restoredVersion:'fd7939d8-6387-48fa-adc8-714e6f8bea8d',medicalClaimsChanged:false,publicCopyChanged:false,customerDataChanged:false,genericAdoptionAllowed:false,rollbackAuthorityBroadened:false,existingGatesWeakened:false};
 const options={head,read:()=> 'same',ancestor:()=>{},diff:(a,b)=>a===c.base&&b===c.source?[...c.paths]:a===c.source&&b===c.maintenanceSource?[...c.maintenancePaths]:[RECONCILIATION_MANIFEST]};
 return{c,options};
};
test('unattributed Watch runtime recovery is finite, byte-pinned and never generic authority',()=>{
 const {c,options}=unattributedRecoveryFixture();assert.doesNotThrow(()=>verifyUnattributedWatchRecovery(c,options));
 for(const path of [...c.paths,...c.maintenancePaths]){const f=unattributedRecoveryFixture();f.options.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyUnattributedWatchRecovery(f.c,f.options),/drift/);}
 for(const flag of ['medicalClaimsChanged','publicCopyChanged','customerDataChanged','genericAdoptionAllowed','rollbackAuthorityBroadened','existingGatesWeakened']){const f=unattributedRecoveryFixture();f.c[flag]=true;assert.throws(()=>verifyUnattributedWatchRecovery(f.c,f.options));}
 {const f=unattributedRecoveryFixture();f.options.diff=()=>['checkout.mjs'];assert.throws(()=>verifyUnattributedWatchRecovery(f.c,f.options),/Unrelated|Unreviewed/);}
 {const f=unattributedRecoveryFixture();f.c.restoredVersion='unknown';assert.throws(()=>verifyUnattributedWatchRecovery(f.c,f.options));}
});

import {verifyLaterUnattributedWatchRecovery,LATER_UNATTRIBUTED_WATCH_RECOVERY_BASE,LATER_UNATTRIBUTED_WATCH_RECOVERY_PRIOR,LATER_UNATTRIBUTED_WATCH_RECOVERY_SOURCE,LATER_UNATTRIBUTED_WATCH_RECOVERY_PATHS,LATER_UNATTRIBUTED_WATCH_RECOVERY_MAINTENANCE,LATER_UNATTRIBUTED_WATCH_RECOVERY_PRESERVED} from '../release/approved-runtime-composition.mjs';
const laterUnattributedRecoveryFixture=()=>{
 const maintenanceSource='e'.repeat(40),head='f'.repeat(40),c={proof:'EXACT_LATER_UNATTRIBUTED_WATCH_RUNTIME_RECOVERY_V1',base:LATER_UNATTRIBUTED_WATCH_RECOVERY_BASE,priorComposition:LATER_UNATTRIBUTED_WATCH_RECOVERY_PRIOR,source:LATER_UNATTRIBUTED_WATCH_RECOVERY_SOURCE,preservedPaths:LATER_UNATTRIBUTED_WATCH_RECOVERY_PRESERVED,paths:LATER_UNATTRIBUTED_WATCH_RECOVERY_PATHS,maintenancePaths:LATER_UNATTRIBUTED_WATCH_RECOVERY_MAINTENANCE,maintenanceSource,observationRun:37908130882,successfulPredecessorRun:37895305149,restoredVersion:'fd7939d8-6387-48fa-adc8-714e6f8bea8d',medicalClaimsChanged:false,publicCopyChanged:false,customerDataChanged:false,genericAdoptionAllowed:false,rollbackAuthorityBroadened:false,existingGatesWeakened:false};
 const options={head,read:()=> 'same',ancestor:()=>{},diff:(a,b)=>a===c.priorComposition&&b===c.base?[...c.preservedPaths]:a===c.base&&b===c.source?[...c.paths]:a===c.source&&b===c.maintenanceSource?[...c.maintenancePaths]:[RECONCILIATION_MANIFEST]};
 return{c,options};
};
test('later unattributed Watch recovery preserves newer main and remains finite',()=>{
 const {c,options}=laterUnattributedRecoveryFixture();assert.doesNotThrow(()=>verifyLaterUnattributedWatchRecovery(c,options));
 for(const path of [...c.preservedPaths,...c.paths,...c.maintenancePaths]){const f=laterUnattributedRecoveryFixture();f.options.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyLaterUnattributedWatchRecovery(f.c,f.options),/drift/);}
 for(const flag of ['medicalClaimsChanged','publicCopyChanged','customerDataChanged','genericAdoptionAllowed','rollbackAuthorityBroadened','existingGatesWeakened']){const f=laterUnattributedRecoveryFixture();f.c[flag]=true;assert.throws(()=>verifyLaterUnattributedWatchRecovery(f.c,f.options));}
 {const f=laterUnattributedRecoveryFixture();f.options.diff=()=>['checkout.mjs'];assert.throws(()=>verifyLaterUnattributedWatchRecovery(f.c,f.options),/Unexpected|Unrelated|Unreviewed/);}
 {const f=laterUnattributedRecoveryFixture();f.c.observationRun=1;assert.throws(()=>verifyLaterUnattributedWatchRecovery(f.c,f.options));}
});

import {verifyLogoutAdoption,LOGOUT_ADOPTION_BASE,LOGOUT_ADOPTION_PATHS,assertLogoutBoundary,RELOAD_VERIFIER} from '../release/approved-runtime-composition.mjs';
const logoutBefore="await page.locator('[data-member-logout]').click();await page.waitForFunction(async()=>401);assert.deepEqual(records,[]);";
const logoutAfter=logoutBefore.replace("await page.waitForFunction","await page.waitForURL(url=>url.origin===site&&url.pathname==='/member-login',{waitUntil:'domcontentloaded',timeout:30000});await page.waitForFunction");
function logoutFixture(){
 const source='b'.repeat(40),head='c'.repeat(40),c={proof:'EXACT_LOGOUT_NAVIGATION_V1',base:LOGOUT_ADOPTION_BASE,source,paths:LOGOUT_ADOPTION_PATHS,runtimeChanged:false,customerDataChanged:false,acceptanceAssertionsWeakened:false};
 return {c,options:{head,ancestor:()=>{},diff:(a,b)=>a===c.base?[...c.paths]:[RECONCILIATION_MANIFEST],read:(ref,path)=>path==='health-passport/production-browser.mjs'?[c.base,RELOAD_VERIFIER].includes(ref)?logoutBefore:logoutAfter:'same',content:(ref,path)=>path==='health-passport/production-browser.mjs'?[c.base,RELOAD_VERIFIER].includes(ref)?logoutBefore:logoutAfter:'same'}};
}
test('logout adoption binds an exact six-file source and only the real-document wait',()=>{
 const {c,options}=logoutFixture();assert.equal(verifyLogoutAdoption(c,options),c);
 assert.doesNotThrow(()=>assertLogoutBoundary(logoutBefore,logoutAfter));
 for(const after of [logoutAfter.replace('assert.deepEqual(records,[])',''),logoutAfter.replace('/member-login','/member/dashboard'),logoutAfter+'skip privacy checks'])assert.throws(()=>assertLogoutBoundary(logoutBefore,after));
});
test('logout adoption rejects every changed payload, extra file, weakened boundary and missing ancestry',()=>{
 for(const path of LOGOUT_ADOPTION_PATHS){const {c,options}=logoutFixture(),read=options.read;options.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p);assert.throws(()=>verifyLogoutAdoption(c,options),/source drift/);}
 for(const flag of ['runtimeChanged','customerDataChanged','acceptanceAssertionsWeakened']){const {c,options}=logoutFixture();c[flag]=true;assert.throws(()=>verifyLogoutAdoption(c,options));}
 {const {c,options}=logoutFixture();options.diff=()=>['worker.js'];assert.throws(()=>verifyLogoutAdoption(c,options),/Unrelated/);}
 {const {c,options}=logoutFixture();options.ancestor=()=>{throw Error('missing ancestor')};assert.throws(()=>verifyLogoutAdoption(c,options),/missing ancestor/);}
});
