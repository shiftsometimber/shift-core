import {FOUNDATION_CANDIDATE,FOUNDATION_PATHS,validateFoundation} from '../release/shift-ai-scope.mjs';
import {AI_CANDIDATE,AI_BASE,validateAiRelease} from '../release/shift-ai-scope.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,appendFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export const RELEASE_PATHS=new Set(['editorial/five-articles/proof.mjs','.github/workflows/seo-repair-final-preview.yml','release/seo794-preservation.mjs','tests/seo794-preservation.test.mjs','scripts/verify-public-continuity-live.mjs','release/b1-runtime-only.json','scripts/b1-release-scope.mjs','tests/b1-release-scope.test.mjs','.github/workflows/cloudflare-production-promote.yml','.github/workflows/audit-repair-preview.yml','health-passport/production-release.mjs','.github/workflows/babylove-mounjaro-876303-live.yml','.github/workflows/babylove-repair.yml','public-promise-preservation.mjs','member-experience/public-preservation.mjs','member-experience/verify-production-member.mjs','tests/promise-accuracy.test.mjs','gate1-auth-security-source-gate.mjs','gate1-release-security-privacy-gate.mjs','scripts/verify-watch-access-closeout.mjs']);
export const APPROVED_ORDER_FILES=[".github/workflows/my-timber-orders-preview.yml","member-experience/chrome.mjs","member-experience/entry.mjs","member-experience/orders.mjs","member-experience/tests/orders.test.mjs","my-timber-final-source-gate.mjs","preview/stabilisation/orders-proof.mjs","preview/stabilisation/orders-provision.mjs","preview/stabilisation/orders-schema.sql","work/staging/worker.mjs"];
export const NICE_TIMEOUT_COMMIT='68616d2730e27b03fb54e232eb06961169cdc615';
export const NICE_TIMEOUT_PATHS=['medicines-watch/README.md','medicines-watch/monitor.mjs','medicines-watch/monitor.test.mjs'];
export function validateNiceTimeout(read){
 for(const path of NICE_TIMEOUT_PATHS)assert.equal(read('HEAD',path),read(NICE_TIMEOUT_COMMIT,path),'NICE timeout source drift: '+path);
}
// Owner requested the verified evidence renewals live on 27 September 2026.
export const MEDICINES_REVIEW_COMMIT='74de0d5ab88d2c2afcc84962b8f2aa9c9553ad49';
export const MEDICINES_REVIEW_PATHS=["medicines-watch/data.mjs", "medicines-watch/provider-review.test.mjs", "medicines-watch/source-review.test.mjs", "medicines-watch/product-renewal.test.mjs", "medicines-watch/reviews/2026-09-23-product-information-renewal.json", "medicines-watch/reviews/2026-09-24-mounjaro-nhs-renewal.json", "medicines-watch/reviews/2026-09-25-wegovy-tablet-provider-pending.json", "medicines-watch/reviews/2026-09-27-wegovy-tablet-provider.json"];
export function validateMedicinesReview(read){
 for(const path of MEDICINES_REVIEW_PATHS)assert.equal(read('HEAD',path),read(MEDICINES_REVIEW_COMMIT,path),'Medicines evidence source drift: '+path);
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
const SPEED_CANDIDATE='21722bb3d6a69c855d37d9c6a388cec4a159513d';
const SPEED_PATHS=["public-startup-stability.mjs","home-critical-styles.mjs","home-speed-repair.mjs", ".github/workflows/home-speed-preview.yml", "preview/home-speed/wrangler.jsonc", "preview/home-speed/worker.mjs", "preview/home-speed/build.mjs", "preview/home-speed/verify.cjs", "public-seo-presentation.mjs"];
function verifyHomeSpeed(){git('merge-base','--is-ancestor',SPEED_CANDIDATE,'HEAD');for(const path of SPEED_PATHS)assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',SPEED_CANDIDATE+':'+path),'Home speed source drift: '+path);}

// Owner authorised this exact preview-tested repair on 27 September.
const HEADING_CANDIDATE='90b1e29db85591b84dec642c3304641bc9545529';
const HEADING_PATHS=['knowledge-heading-repair.mjs','public-seo-closeout.mjs','worker-entry-v6.js','preview/knowledge-heading/worker.mjs','preview/knowledge-heading/wrangler.jsonc','scripts/verify-knowledge-headings.cjs','.github/workflows/knowledge-heading-preview.yml'];
function verifyHeadingRepair(){
 git('merge-base','--is-ancestor',HEADING_CANDIDATE,'HEAD');
 for(const path of HEADING_PATHS)assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',HEADING_CANDIDATE+':'+path),'Heading preview source drift: '+path);
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
  verifyHeadingRepair();
  verifyHomeSpeed();
  const approved=validateAiRelease(manifest,changed.filter(path=>!SPEED_PATHS.includes(path)&&!HEADING_PATHS.includes(path)&&!NICE_TIMEOUT_PATHS.includes(path)&&!FOUNDATION_PATHS.includes(path)&&!MEDICINES_REVIEW_PATHS.includes(path)),readFileSync('wrangler.jsonc','utf8'),execFileSync('git',['show',AI_CANDIDATE+':wrangler.jsonc'],{encoding:'utf8'}));
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
