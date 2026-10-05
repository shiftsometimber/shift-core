import {WATCH_REGISTRY_WAVE_COMMIT,WATCH_REGISTRY_WAVE_PATHS,WATCH_SOURCE_LINK_SOURCE,watchWaveRef} from '../release/watch-registry-wave-scope.mjs';
import {PUBLIC_WORDING_PREVIEW,PUBLIC_WORDING_PATHS,validatePublicWording} from '../release/public-wording-scope.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {TREATMENT_GUIDANCE_PREVIEW,TREATMENT_GUIDANCE_PATHS,ADULT_INTAKE_SOURCE,ADULT_INTAKE_PATHS,validateTreatmentGuidance} from '../release/treatment-guidance-scope.mjs';
import {readFileSync} from 'node:fs';
import {validateScope,assertPreserved,RELEASE_PATHS,APPROVED_ORDER_FILES,validateNiceTimeout,NICE_TIMEOUT_PATHS} from '../scripts/b1-release-scope.mjs';
const manifest=JSON.parse(readFileSync(new URL('../release/b1-runtime-only.json',import.meta.url)));
const workflow=readFileSync(new URL('../.github/workflows/cloudflare-production-promote.yml',import.meta.url),'utf8');
const steps=workflow.split(/\n      - /);
test('exact preview application plus only reviewed release plumbing is accepted',()=>{assert.deepEqual(manifest.approvedApplicationPaths,APPROVED_ORDER_FILES);assert.equal(validateScope(manifest,[...RELEASE_PATHS]).runtimeOnly,true)});
test('explicitly pinned launch application, stock, workflow and configuration drift fails closed',()=>{
 assert.equal(manifest.enforceApplicationPin,true);
 for(const path of ['worker-entry-v6.js','wrangler.jsonc','migrations/019_foundayo_option_stock_lock.sql','.github/workflows/unknown.yml','auth-recovery-v1.js'])assert.throws(()=>validateScope(manifest,[path]),/drift/);
 for(const patch of [{mode:'full'},{applicationCommit:'f'.repeat(40)},{baseCommit:'f'.repeat(40)},{approvedApplicationPaths:[]}])assert.throws(()=>validateScope({...manifest,...patch},[]));
});
test('every legacy publication, seed and migration step is unreachable for runtime-only release',()=>{
 const mutations=['Apply pharmacy-readiness database additions','Initialise Medicines Watch source observations','Seed recent discovery snapshots without publishing or sending notifications','Prepare additive daily check-in feedback store','Publish the exact owner-approved illustrated Wegovy guide','Publish the reconciled oral semaglutide guide','Publish only the fixed owner-authorised catalogue when approved','Publish the exact owner-authorised newsroom batch when approved'];
 for(const name of mutations){const step=steps.find(s=>s.startsWith('name: '+name+'\n'));assert.ok(step,name);assert.match(step,/if: steps\.scope\.outputs\.runtime_only != 'true'/,name)}
 const passport=steps.find(s=>s.startsWith('name: Prepare exact additive Passport schema and rollback'));
 assert.match(passport,/PASSPORT_SCHEMA_READ_ONLY: \$\{\{ steps.scope.outputs.runtime_only \}\}/);
 const source=readFileSync(new URL('../health-passport/production-release.mjs',import.meta.url),'utf8');
 assert.ok(source.indexOf("if(process.env.PASSPORT_SCHEMA_READ_ONLY==='true')assertSchema(existing,source)")<source.indexOf("if(!existing.length)cli("));
});
test('gates, fresh source check, rollback capture and exactly one deploy remain ordered',()=>{
 const scope=workflow.indexOf('id: scope'),deploy=workflow.indexOf('node release/member-runtime-deploy.mjs');
 assert.equal(workflow.match(/node release\/member-runtime-deploy.mjs/g)?.length,1);
 const deployWrapper=readFileSync(new URL('../release/member-runtime-deploy.mjs',import.meta.url),'utf8');
 assert.equal(deployWrapper.match(/cli\('deploy'\)/g)?.length,1);
 assert.ok(deployWrapper.indexOf("assert.equal(active.id,before.id")<deployWrapper.indexOf("cli('deploy')"));
 assert.ok(deployWrapper.indexOf("cli('deploy')")<deployWrapper.indexOf("owned-runtime-deployment.json"));
 for(const gate of ['Verify exact current main before production mutations','Verify security-check timeouts and retry before promotion','Capture current Worker deployment for rollback','Capture protected catalogue and stock without customer records']){const index=workflow.indexOf('name: '+gate);assert.ok(index>scope&&index<deploy,gate)}
 assert.match(workflow,/node scripts\/b1-release-scope.mjs\n          node scripts\/catalogue-publication-client.mjs --verify-main\n          node release\/member-runtime-deploy.mjs/);
 assert.ok(workflow.indexOf('Verify B1 protected catalogue and stock remain identical')>deploy);
 for(const step of steps.filter(s=>/name: (Verify|Prove|Block) /.test(s)))assert.ok(!step.includes("runtime_only != 'true'"),'Verification must not be skipped: '+step.split('\n')[0]);
});
test('Orders display proof preserves pending clinical review',()=>{
 const step=steps.find(s=>s.startsWith('name: Verify live access sources without granting clinical review for Orders display'));
 assert.match(step,/WATCH_ACCESS_ORDERS_DISPLAY_ONLY: \$\{\{ steps.scope.outputs.runtime_only \}\}/);
 const proof=readFileSync(new URL('../scripts/verify-watch-access-closeout.mjs',import.meta.url),'utf8');
 for(const marker of ['pendingClinicalReview','source_changed','review_due','my-timber-orders-display'])assert.ok(proof.includes(marker));
});
test('protected price/stock/config mismatch fails rather than reporting success',()=>{
 const before={tables:{medicine_products:{rows:1,sha256:'a'},medicine_variants:{rows:2,sha256:'b'},medicine_inventory:{rows:2,sha256:'c'}},configurationSha256:'d'};
 assert.doesNotThrow(()=>assertPreserved(before,structuredClone(before)));
 for(const table of Object.keys(before.tables)){const changed=structuredClone(before);changed.tables[table].sha256='changed';assert.throws(()=>assertPreserved(before,changed),/changed/)}
 assert.throws(()=>assertPreserved(before,{...before,configurationSha256:'changed'}),/configuration/);
});

test('unpinned normal release classification from concurrent main remains available',()=>{for(const path of ['worker-entry-v6.js','wrangler.jsonc','migrations/019_foundayo_option_stock_lock.sql','.github/workflows/unknown.yml','auth-recovery-v1.js']){const result=validateScope({...manifest,enforceApplicationPin:false},[path]);assert.equal(result.runtimeOnly,false);assert.deepEqual(result.applicationChanges,[path])}});

test('Grub publication is disabled after the authorised expansion; only runtime changes can ship',()=>{
 assert.equal(manifest.mode,'runtime-only');assert.equal(manifest.grubPublication,undefined);
 assert.throws(()=>validateScope({...manifest,grubPublication:{additions:1}},[]));
 const source=readFileSync(new URL('../scripts/b1-release-scope.mjs',import.meta.url),'utf8');assert.match(source,/grub_publication=false/);
 const step=steps.find(s=>s.startsWith('name: Publish only the exact previously authorised Grub recipe expansion'));
 assert.match(step,/if: steps\.scope\.outputs\.grub_publication == 'true'/);assert.match(step,/--grub-sql/);assert.match(step,/--grub-verify/);
});

 test('NICE timeout release accepts only byte-identical reviewed files',()=>{
 assert.equal(validateScope(manifest,NICE_TIMEOUT_PATHS).runtimeOnly,true);
 assert.doesNotThrow(()=>validateNiceTimeout((ref,path)=>path));
 for(const changed of NICE_TIMEOUT_PATHS)assert.throws(()=>validateNiceTimeout((ref,path)=>ref==='HEAD'&&path===changed?'drift':path),/source drift/);
 assert.throws(()=>validateScope(manifest,['medicines-watch/data.mjs']),/drift/);
 });

 test('medicines evidence release is pinned to every reviewed blob',async()=>{
  const {validateMedicinesReview,MEDICINES_REVIEW_PATHS}=await import('../scripts/b1-release-scope.mjs');
  assert.equal(MEDICINES_REVIEW_PATHS.length,9);
  assert.ok(MEDICINES_REVIEW_PATHS.includes('medicines-watch/reviews/2026-09-29-foundayo-nice-schedule.json'));
  validateMedicinesReview((ref,path)=>path);
  for(const changed of MEDICINES_REVIEW_PATHS)assert.throws(()=>validateMedicinesReview((ref,path)=>ref==='HEAD'&&path===changed?'drift':path),/Medicines evidence source drift/);
 });

 test('industry release binds every reviewed file and preserves the observation-only boundary',async()=>{
  const {validateWatchExpansion,WATCH_EXPANSION_COMMIT,WATCH_EXPANSION_PATHS,WATCH_BROADER_COMMIT,WATCH_BROADER_PATHS,WATCH_SYNT101_COMMIT,WATCH_SYNT101_PATHS,WATCH_INTERNATIONAL_COMMIT,WATCH_INTERNATIONAL_PATHS,WATCH_EXPANDED_COMMIT,WATCH_EXPANDED_PATHS,WATCH_UBT251_COMMIT,WATCH_UBT251_PATHS,WATCH_SGB7342_COMMIT,WATCH_SGB7342_PATHS,WATCH_ABBV_ASC30_COMMIT,WATCH_ABBV_ASC30_PATHS,WATCH_SOURCE_REPAIR_COMMIT,WATCH_SOURCE_REPAIR_PATHS,WATCH_REGISTRY_COMMIT,WATCH_REGISTRY_PATHS,WATCH_PFIZER_PDF_REPAIR_COMMIT,WATCH_PFIZER_PDF_REPAIR_PATHS,WATCH_ENOBOSARM_COMMIT,WATCH_ENOBOSARM_PATHS}=await import('../scripts/b1-release-scope.mjs');
  assert.equal(WATCH_EXPANSION_PATHS.length,42);
  const expectedRef=path=>path==='medicines-watch/industry.mjs'?WATCH_SOURCE_LINK_SOURCE:WATCH_REGISTRY_WAVE_PATHS.includes(path)?watchWaveRef(path):PUBLIC_WORDING_PATHS.includes(path)?PUBLIC_WORDING_PREVIEW:WATCH_ENOBOSARM_PATHS.includes(path)?WATCH_ENOBOSARM_COMMIT:WATCH_PFIZER_PDF_REPAIR_PATHS.includes(path)?WATCH_PFIZER_PDF_REPAIR_COMMIT:WATCH_REGISTRY_PATHS.includes(path)?WATCH_REGISTRY_COMMIT:WATCH_SOURCE_REPAIR_PATHS.includes(path)?WATCH_SOURCE_REPAIR_COMMIT:WATCH_ABBV_ASC30_PATHS.includes(path)?WATCH_ABBV_ASC30_COMMIT:WATCH_SGB7342_PATHS.includes(path)?WATCH_SGB7342_COMMIT:WATCH_UBT251_PATHS.includes(path)?WATCH_UBT251_COMMIT:WATCH_EXPANDED_PATHS.includes(path)?WATCH_EXPANDED_COMMIT:WATCH_INTERNATIONAL_PATHS.includes(path)?WATCH_INTERNATIONAL_COMMIT:WATCH_SYNT101_PATHS.includes(path)?WATCH_SYNT101_COMMIT:WATCH_BROADER_PATHS.includes(path)?WATCH_BROADER_COMMIT:WATCH_EXPANSION_COMMIT;
  const reviewed=(ref,path)=>(ref==='HEAD'?expectedRef(path):ref)+':'+path;
  validateWatchExpansion(reviewed);
  for(const changed of WATCH_EXPANSION_PATHS)assert.throws(()=>validateWatchExpansion((ref,path)=>ref==='HEAD'&&path===changed?'drift':reviewed(ref,path)),/source drift/);
  const step=steps.find(s=>s.startsWith('name: Initialise reviewed Medicines Watch expansion observations'));
  assert.match(step,/node scripts\/b1-release-scope.mjs/);assert.match(step,/node medicines-watch\/bootstrap.mjs/);
 assert.doesNotMatch(step,/migration|seed-recent|medicine_inventory|structured_content/);
 });

 test('broader discovery release binds its exact reviewed commit',async()=>{
  const {validateWatchBroader,WATCH_BROADER_COMMIT,WATCH_BROADER_PATHS}=await import('../scripts/b1-release-scope.mjs');
  assert.equal(WATCH_BROADER_COMMIT,'24f869d714702a0dc4f75849f22700eb6fbc078e');
  assert.equal(WATCH_BROADER_PATHS.length,5);
  assert.ok(WATCH_BROADER_PATHS.includes('medicines-watch/reviews/2026-10-01-authorised-broader-discovery.json'));
  validateWatchBroader((ref,path)=>path);
 for(const changed of WATCH_BROADER_PATHS)assert.throws(()=>validateWatchBroader((ref,path)=>ref==='HEAD'&&path===changed?'drift':path),/source drift/);
 });

test('SYNT-101 correction release binds its exact reviewed commit',async()=>{
  const {validateWatchSynt101,WATCH_SYNT101_COMMIT,WATCH_SYNT101_PATHS}=await import('../scripts/b1-release-scope.mjs');
  assert.equal(WATCH_SYNT101_COMMIT,'e8cbe2238687bd9b9da8a5d694b5b7a73976c1d7');
  assert.equal(WATCH_SYNT101_PATHS.length,4);
  assert.ok(WATCH_SYNT101_PATHS.includes('medicines-watch/reviews/2026-10-01-synt101-mad-correction.json'));
  validateWatchSynt101((ref,path)=>path);
 for(const changed of WATCH_SYNT101_PATHS)assert.throws(()=>validateWatchSynt101((ref,path)=>ref==='HEAD'&&path===changed?'drift':path),/source drift/);
});

test('international omissions release binds its exact reviewed commit',async()=>{
 const {validateWatchInternational,WATCH_INTERNATIONAL_COMMIT,WATCH_INTERNATIONAL_PATHS}=await import('../scripts/b1-release-scope.mjs');
 assert.equal(WATCH_INTERNATIONAL_COMMIT,'874a3b1bc3013de9442dbedbf1398c275fc13f6c');
 assert.equal(WATCH_INTERNATIONAL_PATHS.length,5);
 assert.ok(WATCH_INTERNATIONAL_PATHS.includes('medicines-watch/reviews/2026-10-02-authorised-international-omissions.json'));
 validateWatchInternational((ref,path)=>path);
 for(const changed of WATCH_INTERNATIONAL_PATHS)assert.throws(()=>validateWatchInternational((ref,path)=>ref==='HEAD'&&path===changed?'drift':path),/source drift/);
});

test('expanded discovery release binds its exact reviewed commit',async()=>{
 const {validateWatchExpanded,WATCH_EXPANDED_COMMIT,WATCH_EXPANDED_PATHS}=await import('../scripts/b1-release-scope.mjs');
 assert.equal(WATCH_EXPANDED_COMMIT,'cd65000cd120d6de8496b7edbea27e333d5042a3');
 assert.equal(WATCH_EXPANDED_PATHS.length,4);
 assert.ok(WATCH_EXPANDED_PATHS.includes('medicines-watch/reviews/2026-10-02-authorised-expanded-discovery.json'));
 validateWatchExpanded((ref,path)=>path);
 for(const changed of WATCH_EXPANDED_PATHS)assert.throws(()=>validateWatchExpanded((ref,path)=>ref==='HEAD'&&path===changed?'drift':path),/source drift/);
});

test('UBT251 release binds its exact reviewed commit',async()=>{
 const {validateWatchUbt251,WATCH_UBT251_COMMIT,WATCH_UBT251_PATHS}=await import('../scripts/b1-release-scope.mjs');
 assert.equal(WATCH_UBT251_COMMIT,'3414d2340f92275daa46948fb9f73d7fad26e36a');
 assert.equal(WATCH_UBT251_PATHS.length,4);
 assert.ok(WATCH_UBT251_PATHS.includes('medicines-watch/reviews/2026-10-02-authorised-ubt251.json'));
 validateWatchUbt251((ref,path)=>path);
 for(const changed of WATCH_UBT251_PATHS)assert.throws(()=>validateWatchUbt251((ref,path)=>ref==='HEAD'&&path===changed?'drift':path),/source drift/);
});

test('SGB-7342 release binds its exact reviewed commit',async()=>{
 const {validateWatchSgb7342,WATCH_SGB7342_COMMIT,WATCH_SGB7342_PATHS}=await import('../scripts/b1-release-scope.mjs');
 assert.equal(WATCH_SGB7342_COMMIT,'b46a594bb884105a51797f66adbb7653c7979e3f');
 assert.equal(WATCH_SGB7342_PATHS.length,4);
 assert.ok(WATCH_SGB7342_PATHS.includes('medicines-watch/reviews/2026-10-02-authorised-sgb7342.json'));
 validateWatchSgb7342((ref,path)=>path);
 for(const changed of WATCH_SGB7342_PATHS)assert.throws(()=>validateWatchSgb7342((ref,path)=>ref==='HEAD'&&path===changed?'drift':path),/source drift/);
});

test('ABBV-295, ASC30, TERN-601 and bimagrumab release binds its exact reviewed commit',async()=>{
 const {validateWatchAbbVAsc30,WATCH_ABBV_ASC30_COMMIT,WATCH_ABBV_ASC30_PATHS}=await import('../scripts/b1-release-scope.mjs');
 assert.equal(WATCH_ABBV_ASC30_COMMIT,'2e7d9aecaf30ee266311102c87273cb1d9f19d82');
 assert.equal(WATCH_ABBV_ASC30_PATHS.length,5);
 assert.ok(WATCH_ABBV_ASC30_PATHS.includes('medicines-watch/reviews/2026-10-02-authorised-abbv-asc30-tern-bimagrumab.json'));
 validateWatchAbbVAsc30((ref,path)=>path);
 for(const changed of WATCH_ABBV_ASC30_PATHS)assert.throws(()=>validateWatchAbbVAsc30((ref,path)=>ref==='HEAD'&&path===changed?'drift':path),/source drift/);
});

test('source repair binds all five exact reviewed files and rejects drift',async()=>{
 const {validateWatchSourceRepair,WATCH_SOURCE_REPAIR_COMMIT,WATCH_SOURCE_REPAIR_PATHS}=await import('../scripts/b1-release-scope.mjs');
 assert.equal(WATCH_SOURCE_REPAIR_COMMIT,'f27a1c8b574b30c435a0eae6c367d0b32aa39fb4');
 assert.equal(WATCH_SOURCE_REPAIR_PATHS.length,5);
 validateWatchSourceRepair((ref,path)=>path);
 for(const changed of WATCH_SOURCE_REPAIR_PATHS)assert.throws(()=>validateWatchSourceRepair((ref,path)=>ref==='HEAD'&&path===changed?'drift':path),/source-repair drift/);
});

test('registry omissions release binds its exact reviewed commit',async()=>{
 const {validateWatchRegistry,WATCH_REGISTRY_COMMIT,WATCH_REGISTRY_PATHS}=await import('../scripts/b1-release-scope.mjs');
 assert.equal(WATCH_REGISTRY_COMMIT,'42525e4c5e93076b1cfc57ce415b248eac82ee63');
 assert.equal(WATCH_REGISTRY_PATHS.length,4);
 assert.ok(WATCH_REGISTRY_PATHS.includes('medicines-watch/reviews/2026-10-02-authorised-registry-omissions.json'));
 validateWatchRegistry((ref,path)=>path);
 for(const changed of WATCH_REGISTRY_PATHS)assert.throws(()=>validateWatchRegistry((ref,path)=>ref==='HEAD'&&path===changed?'drift':path),/registry-omissions drift/);
});

test('Pfizer PDF monitor repair binds its exact reviewed commit',async()=>{
 const {validateWatchPfizerPdfRepair,WATCH_PFIZER_PDF_REPAIR_COMMIT,WATCH_PFIZER_PDF_REPAIR_PATHS}=await import('../scripts/b1-release-scope.mjs');
 assert.equal(WATCH_PFIZER_PDF_REPAIR_COMMIT,'5f1c8e6d9b4c7a8656854e4807a4aebd97b39e50');
 assert.equal(WATCH_PFIZER_PDF_REPAIR_PATHS.length,6);
 assert.ok(WATCH_PFIZER_PDF_REPAIR_PATHS.includes('medicines-watch/reviews/2026-10-02-pfizer-pdf-monitor-repair.json'));
 const reads=[];
 validateWatchPfizerPdfRepair((ref,path)=>{reads.push([ref,path]);return path});
 assert.ok(reads.some(([ref,path])=>ref===WATCH_REGISTRY_WAVE_COMMIT&&path==='medicines-watch/README.md'));
 assert.ok(reads.some(([ref,path])=>ref===watchWaveRef(path)&&path==='medicines-watch/monitor.mjs'));
 for(const changed of WATCH_PFIZER_PDF_REPAIR_PATHS)assert.throws(()=>validateWatchPfizerPdfRepair((ref,path)=>ref==='HEAD'&&path===changed?'drift':path),/Pfizer PDF monitor repair drift/);
});

test('enobosarm and semaglutide release binds its exact reviewed commit',async()=>{
 const {validateWatchEnobosarm,WATCH_ENOBOSARM_COMMIT,WATCH_ENOBOSARM_PATHS}=await import('../scripts/b1-release-scope.mjs');
 assert.equal(WATCH_ENOBOSARM_COMMIT,'3c1704b23955fb4abf57e1b05bc56464d10ed08c');
 assert.equal(WATCH_ENOBOSARM_PATHS.length,4);
 assert.ok(WATCH_ENOBOSARM_PATHS.includes('medicines-watch/reviews/2026-10-02-authorised-enobosarm-semaglutide.json'));
 validateWatchEnobosarm((ref,path)=>path);
 for(const changed of WATCH_ENOBOSARM_PATHS)assert.throws(()=>validateWatchEnobosarm((ref,path)=>ref==='HEAD'&&path===changed?'drift':path),/enobosarm\/semaglutide source drift/);
});

test('public wording/menu release accepts only the exact browser-tested source',()=>{
 const reviewed=(ref,path)=>ref==='HEAD'?(['medicines-watch/preservation.mjs','medicines-watch/preservation.test.mjs'].includes(path)?'0d084f00cf6c4593dd0c11dfd047daf4e5103295':path==='medicines-watch/page.mjs'?WATCH_REGISTRY_WAVE_COMMIT:PUBLIC_WORDING_PREVIEW)+':'+path:ref+':'+path;
 validatePublicWording(reviewed);
 for(const changed of PUBLIC_WORDING_PATHS)assert.throws(()=>validatePublicWording((ref,path)=>ref==='HEAD'&&path===changed?'drift':reviewed(ref,path)),/source drift/);
});

test('treatment release binds every browser-tested eligibility and information file',()=>{
 const repaired=['medicine-commerce-v1.js','tests/medicine-purchase-e2e.test.mjs'];
 assert.deepEqual([...ADULT_INTAKE_PATHS],repaired);
 const read=(ref,path)=>ref==='HEAD'||ref===(repaired.includes(path)?ADULT_INTAKE_SOURCE:TREATMENT_GUIDANCE_PREVIEW)?'exact:'+path:'other';
 validateTreatmentGuidance(read);
 for(const drift of TREATMENT_GUIDANCE_PATHS)assert.throws(()=>validateTreatmentGuidance((ref,path)=>ref==='HEAD'&&path===drift?'changed':read(ref,path)),/Treatment service criteria\/source drift/);
});

test('registry wave retains exact reviewed Watch credibility files',async()=>{
 const {WATCH_REGISTRY_WAVE_COMMIT,WATCH_REGISTRY_WAVE_PATHS,WATCH_SOURCE_LINK_SOURCE,validateWatchRegistryWave}=await import('../release/watch-registry-wave-scope.mjs');
 assert.equal(WATCH_REGISTRY_WAVE_COMMIT,'9149e4af5708fa4fcd45ea3c6cf014863f812820');assert.equal(WATCH_REGISTRY_WAVE_PATHS.length,53);
 validateWatchRegistryWave((ref,path)=>path);
 for(const drift of WATCH_REGISTRY_WAVE_PATHS)assert.throws(()=>validateWatchRegistryWave((ref,path)=>ref==='HEAD'&&path===drift?'changed':path),/registry-wave source drift/);
});
