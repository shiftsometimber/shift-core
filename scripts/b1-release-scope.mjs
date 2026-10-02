import {validateTreatmentGuidance} from '../release/treatment-guidance-scope.mjs';
import {PUBLIC_WORDING_PREVIEW,PUBLIC_WORDING_PATHS,validatePublicWording} from '../release/public-wording-scope.mjs';
import {GROWTH_PATHS,validateGrowthSource,validateGrowthEntry} from '../release/growth-scope.mjs';
import {FOUNDATION_CANDIDATE,FOUNDATION_PATHS,validateFoundation} from '../release/shift-ai-scope.mjs';
import {AI_CANDIDATE,AI_BASE,validateAiRelease} from '../release/shift-ai-scope.mjs';
import {originalHomeSpeedSource} from '../release/home-banner-scope.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,appendFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export const RELEASE_PATHS=new Set(['editorial/five-articles/proof.mjs','.github/workflows/seo-repair-final-preview.yml','release/seo794-preservation.mjs','tests/seo794-preservation.test.mjs','scripts/verify-public-continuity-live.mjs','release/b1-runtime-only.json','scripts/b1-release-scope.mjs','tests/b1-release-scope.test.mjs','.github/workflows/cloudflare-production-promote.yml','.github/workflows/audit-repair-preview.yml','health-passport/production-release.mjs','.github/workflows/babylove-mounjaro-876303-live.yml','.github/workflows/babylove-repair.yml','public-promise-preservation.mjs','member-experience/public-preservation.mjs','member-experience/verify-production-member.mjs','tests/promise-accuracy.test.mjs','gate1-auth-security-source-gate.mjs','gate1-release-security-privacy-gate.mjs','scripts/verify-watch-access-closeout.mjs']);
export const APPROVED_ORDER_FILES=[".github/workflows/my-timber-orders-preview.yml","member-experience/chrome.mjs","member-experience/entry.mjs","member-experience/orders.mjs","member-experience/tests/orders.test.mjs","my-timber-final-source-gate.mjs","preview/stabilisation/orders-proof.mjs","preview/stabilisation/orders-provision.mjs","preview/stabilisation/orders-schema.sql","work/staging/worker.mjs"];
export const NICE_TIMEOUT_COMMIT='68616d2730e27b03fb54e232eb06961169cdc615';
export const NICE_TIMEOUT_PATHS=['medicines-watch/README.md','medicines-watch/monitor.mjs','medicines-watch/monitor.test.mjs'];
// Owner requested merge and deploy. Bind the exact CI-verified Watch update in PR #882; no clinical approval inferred.
export const WATCH_EXPANSION_COMMIT='d1634452499a0c480190bbed7947368260a6acb6';
export const WATCH_EXPANSION_PATHS=["medicines-watch/reviews/2026-09-30-berobenatide-vesper6.json", "medicines-watch/reviews/2026-10-01-eloratzp-phase2b.json", "medicines-watch/reviews/2026-10-01-kainetic-enrolment.json", "medicines-watch/reviews/2026-10-01-macupatide-discovery.json", "medicines-watch/reviews/2026-10-01-mounjaro-nhs-renewal.json", "medicines-watch/reviews/2026-09-30-bi3034701-discovery.json", "medicines-watch/reviews/2026-09-30-authorised-bi3034701.json", "medicines-watch/source-review.test.mjs", "medicines-watch/reviews/2026-09-30-globenewswire-access-repair.json", "medicines-watch/reviews/2026-09-30-overdue-source-renewal.json", "medicines-watch/reviews/2026-09-30-source-warning-repairs.json", "medicines-watch/reviews/2026-09-30-authorised-continuing-discovery.json", "medicines-watch/reviews/2026-09-30-hrs1596-discovery.json", "medicines-watch/reviews/2026-09-30-emugrobart-petrelintide-discovery.json", "medicines-watch/reviews/2026-09-30-env308-discovery.json", "medicines-watch/README.md", "medicines-watch/data.mjs", "medicines-watch/discovery.mjs", "medicines-watch/industry-page.mjs", "medicines-watch/industry.mjs", "medicines-watch/industry.test.mjs", "medicines-watch/knowledge.mjs", "medicines-watch/knowledge.test.mjs", "medicines-watch/page.mjs", "medicines-watch/product-renewal.test.mjs", "medicines-watch/reviews/2026-09-29-industry-expansion.json", "medicines-watch/reviews/2026-09-30-discovery-proposals.json", "medicines-watch/reviews/2026-09-30-discovery-review.md", "medicines-watch/reviews/2026-09-30-reviewed-expansion.json", "medicines-watch/verify-live-sources.test.mjs", "medicines-watch/verify-live.mjs", "medicines-watch/reviews/2026-09-30-abbv295-discovery.json", "medicines-watch/reviews/2026-09-30-asc36-discovery.json", "medicines-watch/reviews/2026-09-30-eloratzp-na931-discovery.json", "medicines-watch/reviews/2026-10-01-ascletis-injectable-discovery.json", "medicines-watch/reviews/2026-10-01-authorised-evening-updates.json", "medicines-watch/reviews/2026-10-01-cagrisema-easd.json", "medicines-watch/reviews/2026-10-01-embraze-fetch-observation.json", "medicines-watch/reviews/2026-10-01-evening-easd-discovery.json", "medicines-watch/reviews/2026-10-01-monitor-discovery-pass.json", "medicines-watch/reviews/2026-10-01-non-incretin-discovery.json", "medicines-watch/reviews/2026-10-01-publication-verification.json"];
export function validateWatchExpansion(read){
 for(const path of WATCH_EXPANSION_PATHS)assert.equal(read('HEAD',path),read(currentWatchRef(path,WATCH_EXPANSION_COMMIT),path),'Watch expansion source drift: '+path);
}
// Standing owner authorisation published the exact broader-discovery batch in PR #898.
// Bind the evidence and wording to that merged commit without treating it as clinical approval.
export const WATCH_BROADER_COMMIT='24f869d714702a0dc4f75849f22700eb6fbc078e';
export const WATCH_BROADER_PATHS=['medicines-watch/README.md','medicines-watch/discovery.mjs','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-01-authorised-broader-discovery.json'];
export function validateWatchBroader(read){
 for(const path of WATCH_BROADER_PATHS)assert.equal(read('HEAD',path),read(currentWatchRef(path,WATCH_BROADER_COMMIT),path),'Watch broader-discovery source drift: '+path);
}
// Standing owner authorisation permits this exact evidence-backed factual correction.
// Bind the later SYNT-101 source review without treating sponsor reporting as clinical approval.
export const WATCH_SYNT101_COMMIT='e8cbe2238687bd9b9da8a5d694b5b7a73976c1d7';
export const WATCH_SYNT101_PATHS=['medicines-watch/README.md','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-01-synt101-mad-correction.json'];
export function validateWatchSynt101(read){
 for(const path of WATCH_SYNT101_PATHS)assert.equal(read('HEAD',path),read(currentWatchRef(path,WATCH_SYNT101_COMMIT),path),'Watch SYNT-101 source drift: '+path);
}
// Standing owner authorisation permits the exact evidence-backed factual additions merged in PR #907.
// Bind the international authorisation and early-stage wording without inferring UK approval or clinical approval.
export const WATCH_INTERNATIONAL_COMMIT='874a3b1bc3013de9442dbedbf1398c275fc13f6c';
export const WATCH_INTERNATIONAL_PATHS=['medicines-watch/README.md','medicines-watch/industry-page.mjs','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-international-omissions.json'];
export function validateWatchInternational(read){
 for(const path of WATCH_INTERNATIONAL_PATHS)assert.equal(read('HEAD',path),read(currentWatchRef(path,WATCH_INTERNATIONAL_COMMIT),path),'Watch international-omissions source drift: '+path);
}
// Standing owner authorisation permits the exact evidence-backed factual additions merged in PR #912.
// Bind the latest reviewed research-stage wording without inferring UK authorisation, NHS access, supply or clinical approval.
export const WATCH_EXPANDED_COMMIT='cd65000cd120d6de8496b7edbea27e333d5042a3';
export const WATCH_EXPANDED_PATHS=['medicines-watch/README.md','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-expanded-discovery.json'];
export function validateWatchExpanded(read){
 for(const path of WATCH_EXPANDED_PATHS)assert.equal(read('HEAD',path),read(currentWatchRef(path,WATCH_EXPANDED_COMMIT),path),'Watch expanded-discovery source drift: '+path);
}
// Standing owner editorial authorisation permits the exact evidence-backed UBT251 addition merged in PR #920.
// Bind its research-stage wording without inferring UK authorisation, NHS access, supply, sale or clinical approval.
export const WATCH_UBT251_COMMIT='3414d2340f92275daa46948fb9f73d7fad26e36a';
export const WATCH_UBT251_PATHS=['medicines-watch/README.md','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-ubt251.json'];
export function validateWatchUbt251(read){
 for(const path of WATCH_UBT251_PATHS)assert.equal(read('HEAD',path),read(currentWatchRef(path,WATCH_UBT251_COMMIT),path),'Watch UBT251 source drift: '+path);
}
// Standing owner editorial authorisation permits the exact evidence-backed SGB-7342 addition merged in PR #926.
// Bind the dated Phase 1 wording and preclinical limits without inferring UK authorisation, access, supply or clinical approval.
export const WATCH_SGB7342_COMMIT='b46a594bb884105a51797f66adbb7653c7979e3f';
export const WATCH_SGB7342_PATHS=['medicines-watch/README.md','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-sgb7342.json'];
export function validateWatchSgb7342(read){
 for(const path of WATCH_SGB7342_PATHS)assert.equal(read('HEAD',path),read(currentWatchRef(path,WATCH_SGB7342_COMMIT),path),'Watch SGB-7342 source drift: '+path);
}
// Standing owner editorial authorisation permits the exact evidence-backed additions merged in PR #929.
// Bind the reviewed research-stage wording without inferring UK authorisation, NHS access, supply, sale or clinical approval.
export const WATCH_ABBV_ASC30_COMMIT='2e7d9aecaf30ee266311102c87273cb1d9f19d82';
export const WATCH_ABBV_ASC30_PATHS=['medicines-watch/README.md','medicines-watch/discovery.mjs','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-abbv-asc30-tern-bimagrumab.json'];
export function validateWatchAbbVAsc30(read){
 for(const path of WATCH_ABBV_ASC30_PATHS)assert.equal(read('HEAD',path),read(currentWatchRef(path,WATCH_ABBV_ASC30_COMMIT),path),'Watch ABBV/ASC30/TERN/bimagrumab source drift: '+path);
}
// Owner requested the four source warnings be fixed. Bind PR #933 exactly; no clinical approval inferred.
export const WATCH_SOURCE_REPAIR_COMMIT='f27a1c8b574b30c435a0eae6c367d0b32aa39fb4';
export const WATCH_SOURCE_REPAIR_PATHS=["medicines-watch/README.md","medicines-watch/industry.mjs","medicines-watch/monitor.mjs","medicines-watch/monitor.test.mjs","medicines-watch/reviews/2026-10-02-source-monitor-repairs.json"];
export function validateWatchSourceRepair(read){
 for(const path of WATCH_SOURCE_REPAIR_PATHS)assert.equal(read('HEAD',path),read(currentWatchRef(path,WATCH_SOURCE_REPAIR_COMMIT),path),'Watch source-repair drift: '+path);
}
// Standing editorial authorisation permits the exact evidence-backed registry additions merged in PR #936.
// Bind registry facts and explicit limitations without inferring UK authorisation, NHS access, supply, sale or clinical approval.
export const WATCH_REGISTRY_COMMIT='42525e4c5e93076b1cfc57ce415b248eac82ee63';
export const WATCH_REGISTRY_PATHS=['medicines-watch/README.md','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-registry-omissions.json'];
export function validateWatchRegistry(read){
 for(const path of WATCH_REGISTRY_PATHS)assert.equal(read('HEAD',path),read(currentWatchRef(path,WATCH_REGISTRY_COMMIT),path),'Watch registry-omissions drift: '+path);
}
// Standing editorial authorisation permits the exact official-Pfizer PDF monitor repair merged in PR #939.
// Bind monitoring bytes and review evidence without inferring clinical approval, UK access or supply.
export const WATCH_PFIZER_PDF_REPAIR_COMMIT='5f1c8e6d9b4c7a8656854e4807a4aebd97b39e50';
export const WATCH_PFIZER_PDF_REPAIR_PATHS=['medicines-watch/README.md','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/monitor.mjs','medicines-watch/monitor.test.mjs','medicines-watch/reviews/2026-10-02-pfizer-pdf-monitor-repair.json'];
export function validateWatchPfizerPdfRepair(read){
 for(const path of WATCH_PFIZER_PDF_REPAIR_PATHS)assert.equal(read('HEAD',path),read(currentWatchRef(path,WATCH_PFIZER_PDF_REPAIR_COMMIT),path),'Watch Pfizer PDF monitor repair drift: '+path);
}
// Standing editorial authorisation permits the exact evidence-bounded addition merged in PR #942.
// Bind research-stage wording without inferring results, UK authorisation, NHS access, supply or clinical approval.
export const WATCH_ENOBOSARM_COMMIT='3c1704b23955fb4abf57e1b05bc56464d10ed08c';
export const WATCH_ENOBOSARM_PATHS=['medicines-watch/README.md','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-enobosarm-semaglutide.json'];
export function validateWatchEnobosarm(read){
 for(const path of WATCH_ENOBOSARM_PATHS)assert.equal(read('HEAD',path),read(currentWatchRef(path,WATCH_ENOBOSARM_COMMIT),path),'Watch enobosarm/semaglutide source drift: '+path);
}
// Standing editorial authorisation permits this exact evidence-backed registry expansion from PR #950.
// Bind research-stage wording without inferring UK authorisation, NHS access, supply or clinical approval.
export const WATCH_EXPANDED_REGISTRY_WAVE_COMMIT='3ed5618351186beba095b88bc076ae737ec09ecc';
export const WATCH_EXPANDED_REGISTRY_WAVE_PATHS=['medicines-watch/README.md','medicines-watch/discovery.mjs','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-expanded-registry-wave.json'];
export function validateWatchExpandedRegistryWave(read){
 for(const path of WATCH_EXPANDED_REGISTRY_WAVE_PATHS)assert.equal(read('HEAD',path),read(WATCH_EXPANDED_REGISTRY_WAVE_COMMIT,path),'Watch expanded-registry-wave source drift: '+path);
}
function currentWatchRef(path,fallback){
 return PUBLIC_WORDING_PATHS.includes(path)?PUBLIC_WORDING_PREVIEW:WATCH_EXPANDED_REGISTRY_WAVE_PATHS.includes(path)?WATCH_EXPANDED_REGISTRY_WAVE_COMMIT:WATCH_ENOBOSARM_PATHS.includes(path)?WATCH_ENOBOSARM_COMMIT:WATCH_PFIZER_PDF_REPAIR_PATHS.includes(path)?WATCH_PFIZER_PDF_REPAIR_COMMIT:WATCH_REGISTRY_PATHS.includes(path)?WATCH_REGISTRY_COMMIT:WATCH_SOURCE_REPAIR_PATHS.includes(path)?WATCH_SOURCE_REPAIR_COMMIT:WATCH_ABBV_ASC30_PATHS.includes(path)?WATCH_ABBV_ASC30_COMMIT:WATCH_SGB7342_PATHS.includes(path)?WATCH_SGB7342_COMMIT:WATCH_UBT251_PATHS.includes(path)?WATCH_UBT251_COMMIT:WATCH_EXPANDED_PATHS.includes(path)?WATCH_EXPANDED_COMMIT:WATCH_INTERNATIONAL_PATHS.includes(path)?WATCH_INTERNATIONAL_COMMIT:WATCH_SYNT101_PATHS.includes(path)?WATCH_SYNT101_COMMIT:WATCH_BROADER_PATHS.includes(path)?WATCH_BROADER_COMMIT:fallback;
}
export function validateNiceTimeout(read){
 for(const path of NICE_TIMEOUT_PATHS)assert.equal(read('HEAD',path),read(currentWatchRef(path,NICE_TIMEOUT_COMMIT),path),'NICE timeout source drift: '+path);
}
// Owner authorised the exact NICE timetable review in PR #850 for release on 29 September 2026.
export const MEDICINES_REVIEW_COMMIT='6e62b63b17c16a416e73e1e8589f0366437a5c11';
export const MEDICINES_REVIEW_PATHS=["medicines-watch/data.mjs", "medicines-watch/provider-review.test.mjs", "medicines-watch/source-review.test.mjs", "medicines-watch/product-renewal.test.mjs", "medicines-watch/reviews/2026-09-23-product-information-renewal.json", "medicines-watch/reviews/2026-09-24-mounjaro-nhs-renewal.json", "medicines-watch/reviews/2026-09-25-wegovy-tablet-provider-pending.json", "medicines-watch/reviews/2026-09-27-wegovy-tablet-provider.json", "medicines-watch/reviews/2026-09-29-foundayo-nice-schedule.json"];
export function validateMedicinesReview(read){
 for(const path of MEDICINES_REVIEW_PATHS)assert.equal(read('HEAD',path),read(WATCH_EXPANSION_PATHS.includes(path)?WATCH_EXPANSION_COMMIT:MEDICINES_REVIEW_COMMIT,path),'Medicines evidence source drift: '+path);
}
export function validateScope(manifest,changed){
 assert.equal(manifest.mode,'runtime-only');
 assert.equal(manifest.grubPublication,undefined);
 assert.equal(manifest.applicationCommit,'6053dac56653303ee1617d181b3005da577a1cae');
 assert.equal(manifest.approvedScope,'my-timber-orders-display');
 assert.equal(manifest.previewEvidence.workflowRun,36133785763);
 assert.equal(manifest.previewEvidence.sha256,'04873025b6b3ec99553d570135a5d06a375120148317c8d8b27e6d5e10e60073');
 assert.equal(manifest.baseCommit,'d5f650740bef17246b180b79617e3e94e43c02c1');
 assert.deepEqual(manifest.approvedApplicationPaths,APPROVED_ORDER_FILES);
 assert.deepEqual(manifest.runtimeSchemaAdditions,['member_account_details','member_account_details_preserve_delivery','member_signup_alerts']);
 const runtimeOnly=changed.every(p=>RELEASE_PATHS.has(p)||NICE_TIMEOUT_PATHS.includes(p));
 if(manifest.enforceApplicationPin===true)assert.ok(runtimeOnly,'Application/source drift: review a new candidate and scope before release');
 return {runtimeOnly,applicationCommit:manifest.applicationCommit,baseCommit:manifest.baseCommit,releaseOnlyChanges:runtimeOnly?changed:[],applicationChanges:runtimeOnly?[]:changed};
}
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const dir='b1-runtime-release';
const SPEED_CANDIDATE='bcad2b051e932577a0b897f728610bdeb37282da';
const SPEED_PATHS=["tests/seo794-preservation.test.mjs","home-v42-critical.mjs","home-blocking-styles.mjs","release/member-details-preservation.mjs","tests/home-speed-green.test.mjs","public-startup-stability.mjs","home-critical-styles.mjs","home-speed-repair.mjs", ".github/workflows/home-speed-preview.yml", "preview/home-speed/wrangler.jsonc", "preview/home-speed/worker.mjs", "preview/home-speed/build.mjs", "preview/home-speed/verify.cjs", "public-seo-presentation.mjs"];
function verifyHomeSpeed(){git('merge-base','--is-ancestor',SPEED_CANDIDATE,'HEAD');for(const path of SPEED_PATHS)assert.equal(originalHomeSpeedSource(path,execFileSync('git',['show','HEAD:'+path],{encoding:'utf8'})),execFileSync('git',['show',SPEED_CANDIDATE+':'+path],{encoding:'utf8'}),'Home speed source drift: '+path);}

// Owner authorised this exact preview-tested repair on 27 September.
const HEADING_CANDIDATE='90b1e29db85591b84dec642c3304641bc9545529';
const HEADING_PATHS=['knowledge-heading-repair.mjs','public-seo-closeout.mjs','worker-entry-v6.js','preview/knowledge-heading/worker.mjs','preview/knowledge-heading/wrangler.jsonc','scripts/verify-knowledge-headings.cjs','.github/workflows/knowledge-heading-preview.yml'];
function verifyHeadingRepair(){
 git('merge-base','--is-ancestor',HEADING_CANDIDATE,'HEAD');
 for(const path of HEADING_PATHS){if(path==='worker-entry-v6.js')validateGrowthEntry(execFileSync('git',['show',HEADING_CANDIDATE+':'+path],{encoding:'utf8'}),execFileSync('git',['show','HEAD:'+path],{encoding:'utf8'}));else assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',HEADING_CANDIDATE+':'+path),'Heading preview source drift: '+path);}
}
export function verifyScope(){
 if(existsSync('release/shift-ai-live.json')){
  git('merge-base','--is-ancestor',AI_BASE,AI_CANDIDATE);
  git('merge-base','--is-ancestor',AI_CANDIDATE,'HEAD');
  assert.equal(git('diff','--name-only',AI_BASE,AI_CANDIDATE,'--','frontend','public','assets','wrangler.jsonc','package.json','package-lock.json'),'','AI candidate changed protected presentation/configuration');
  const manifest=JSON.parse(readFileSync('release/shift-ai-live.json'));
  const changed=git('diff','--name-only',AI_CANDIDATE,'HEAD').split('\n').filter(Boolean);
  git('merge-base','--is-ancestor',NICE_TIMEOUT_COMMIT,'HEAD');
  validateNiceTimeout((ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',FOUNDATION_CANDIDATE,'HEAD');
  validateFoundation((ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',MEDICINES_REVIEW_COMMIT,'HEAD');
  validateMedicinesReview((ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',WATCH_EXPANSION_COMMIT,'HEAD');
  validateWatchExpansion((ref,path)=>git('rev-parse',ref+':'+path));
  validatePublicWording((ref,path)=>git('rev-parse',ref+':'+path));
  validateTreatmentGuidance((ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',WATCH_BROADER_COMMIT,'HEAD');
  validateWatchBroader((ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',WATCH_SYNT101_COMMIT,'HEAD');
  validateWatchSynt101((ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',WATCH_INTERNATIONAL_COMMIT,'HEAD');
  validateWatchInternational((ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',WATCH_EXPANDED_COMMIT,'HEAD');
  validateWatchExpanded((ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',WATCH_UBT251_COMMIT,'HEAD');
  validateWatchUbt251((ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',WATCH_SGB7342_COMMIT,'HEAD');
  validateWatchSgb7342((ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',WATCH_ABBV_ASC30_COMMIT,'HEAD');
  validateWatchAbbVAsc30((ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',WATCH_SOURCE_REPAIR_COMMIT,'HEAD');
  validateWatchSourceRepair((ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',WATCH_REGISTRY_COMMIT,'HEAD');
  validateWatchRegistry((ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',WATCH_PFIZER_PDF_REPAIR_COMMIT,'HEAD');
  validateWatchPfizerPdfRepair((ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',WATCH_ENOBOSARM_COMMIT,'HEAD');
  validateWatchEnobosarm((ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',WATCH_EXPANDED_REGISTRY_WAVE_COMMIT,'HEAD');
  validateWatchExpandedRegistryWave((ref,path)=>git('rev-parse',ref+':'+path));
  validateGrowthSource();
  verifyHeadingRepair();
  verifyHomeSpeed();
  assert.equal(git('rev-parse','HEAD:release/seo794-preservation.mjs'),git('rev-parse','bcad2b051e932577a0b897f728610bdeb37282da:release/seo794-preservation.mjs'),'Exact homepage preservation correction drift');
  const approved=validateAiRelease(manifest,changed.filter(path=>!GROWTH_PATHS.has(path)&&path!=='release/seo794-preservation.mjs'&&!SPEED_PATHS.includes(path)&&!HEADING_PATHS.includes(path)&&!NICE_TIMEOUT_PATHS.includes(path)&&!FOUNDATION_PATHS.includes(path)&&!MEDICINES_REVIEW_PATHS.includes(path)&&!WATCH_EXPANSION_PATHS.includes(path)&&!WATCH_BROADER_PATHS.includes(path)&&!WATCH_SYNT101_PATHS.includes(path)&&!WATCH_INTERNATIONAL_PATHS.includes(path)&&!WATCH_EXPANDED_PATHS.includes(path)&&!WATCH_UBT251_PATHS.includes(path)&&!WATCH_SGB7342_PATHS.includes(path)&&!WATCH_ABBV_ASC30_PATHS.includes(path)&&!WATCH_SOURCE_REPAIR_PATHS.includes(path)&&!WATCH_REGISTRY_PATHS.includes(path)&&!WATCH_PFIZER_PDF_REPAIR_PATHS.includes(path)&&!WATCH_ENOBOSARM_PATHS.includes(path)&&!WATCH_EXPANDED_REGISTRY_WAVE_PATHS.includes(path)),readFileSync('wrangler.jsonc','utf8'),execFileSync('git',['show',AI_CANDIDATE+':wrangler.jsonc'],{encoding:'utf8'}));
  assert.equal(git('diff','--name-only'),'','Working source changed during release gates');
  const report={...approved,releaseCommit:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),checkedAt:new Date().toISOString(),databaseMigrations:false,contentPublication:false};
  mkdirSync(dir,{recursive:true});writeFileSync(dir+'/scope.json',JSON.stringify(report,null,2));
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,'runtime_only=true\ngrub_publication=false\n');
  return report;
 }
 assert.ok(existsSync('release/b1-runtime-only.json'),'Explicit release scope is required');
 const manifest=JSON.parse(readFileSync('release/b1-runtime-only.json'));
 // Verify ancestry as well as file equality: no alternate historic source.
 git('merge-base','--is-ancestor',manifest.baseCommit,manifest.applicationCommit);
 git('merge-base','--is-ancestor',manifest.applicationCommit,'HEAD');
 assert.deepEqual(git('diff','--name-only',manifest.baseCommit,manifest.applicationCommit).split('\n').filter(Boolean),APPROVED_ORDER_FILES,'Pinned Orders application delta changed');
 git('merge-base','--is-ancestor',NICE_TIMEOUT_COMMIT,'HEAD');
 validateNiceTimeout((ref,path)=>git('rev-parse',ref+':'+path));
 const changed=git('diff','--name-only',manifest.applicationCommit,'HEAD').split('\n').filter(Boolean);
 const report={...validateScope(manifest,changed),releaseCommit:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),checkedAt:new Date().toISOString(),databaseMigrations:false,runtimeSchemaAdditions:manifest.runtimeSchemaAdditions||[],contentPublication:false};
 assert.equal(git('diff','--name-only'),'','Working source changed during release gates');
 mkdirSync(dir,{recursive:true});writeFileSync(dir+'/scope.json',JSON.stringify(report,null,2));
 if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,'runtime_only=true\ngrub_publication=false\n');
 return report;
}
const sha=value=>createHash('sha256').update(value).digest('hex');
export function assertPreserved(before,after){
 assert.deepEqual(after.tables,before.tables,'Protected medicine prices, stock or service records changed during release');
 assert.equal(after.configurationSha256,before.configurationSha256,'Production configuration changed');
}
async function snapshot(phase){
 assert.ok(['before','after'].includes(phase));verifyScope();
 assert.equal(process.env.GITHUB_REF,'refs/heads/main');
 const tables={};
 // Public catalogue/inventory only. No member, order, clinical or payment rows.
 for(const table of ['medicine_products','medicine_variants','medicine_inventory']){
  const sql=`SELECT * FROM ${table} ORDER BY ${table==='medicine_inventory'?'variant_id':'id'}`;
  const raw=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',sql],{encoding:'utf8',maxBuffer:8*1024*1024}));
  assert.ok(raw.length&&raw.every(r=>r.success),'Protected snapshot query failed');
  const rows=raw.flatMap(r=>r.results||[]);tables[table]={rows:rows.length,sha256:sha(JSON.stringify(rows))};
 }
 const report={phase,checkedAt:new Date().toISOString(),release:process.env.GITHUB_SHA,tables,configurationSha256:sha(readFileSync('wrangler.jsonc')),customerRecordsRead:false,productionWrites:0};
 writeFileSync(dir+'/'+phase+'.json',JSON.stringify(report,null,2));
 if(phase==='after')assertPreserved(JSON.parse(readFileSync(dir+'/before.json')),report);
 console.log(JSON.stringify(report));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{if(process.argv[2]==='--snapshot')await snapshot(process.argv[3]);else console.log(JSON.stringify(verifyScope()));}catch(error){console.error(error.message);process.exitCode=1;}
}
