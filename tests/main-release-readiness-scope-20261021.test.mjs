import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {appendFileSync,mkdtempSync,rmSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {MAIN_RELEASE_BASE,MAIN_RELEASE_PAYLOAD,MAIN_RELEASE_ORIGINAL_RECEIPT,MAIN_RELEASE_FOLLOWUP_PAYLOAD,MAIN_LIVE_HEADER_CSS_SHA256,verifyMainReleaseReadinessExtension} from '../release/main-release-readiness-scope-20261021.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6}).trimEnd();
test('current-main readiness repair is exact, independently pinned and not credited as production',()=>{
 const result=verifyMainReleaseReadinessExtension();
 assert.equal(result.actual,git('rev-parse','HEAD'));assert.equal(result.predecessor,MAIN_RELEASE_BASE);assert.equal(result.payload,MAIN_RELEASE_PAYLOAD);assert.equal(result.followupPayload,MAIN_RELEASE_FOLLOWUP_PAYLOAD);assert.equal(result.productionVerified,false);
 assert.equal(git('show','HEAD:release/approved-runtime-composition.json'),git('show',MAIN_RELEASE_BASE+':release/approved-runtime-composition.json'));
});
test('repair retains active public CSS, unchanged production config and bounded workflow scheduling',()=>{
 const css=JSON.parse(git('show','HEAD:reta-styles-data.mjs').slice('export const RETA_STYLES='.length,-1))['/assets/header-navigation-v2.css'];
 assert.equal(createHash('sha256').update(css).digest('hex'),MAIN_LIVE_HEADER_CSS_SHA256);
 assert.equal(git('show','HEAD:wrangler.coaching.jsonc'),git('show','HEAD:wrangler.jsonc'));
 const workflow=git('show','HEAD:.github/workflows/programme-day-preview.yml');assert.equal((workflow.match(/--test-concurrency=1/g)||[]).length,1);assert.equal((workflow.match(/--test-concurrency=2/g)||[]).length,0);assert.equal((workflow.match(/const maxConcurrent=2;/g)||[]).length,1);for(const path of ['release/app-preflight.mjs','release/root-share-preview-scope.mjs','tests/food-diary-london-date-stack-20261015.test.mjs','tests/website-editorial-scope-20261018.test.mjs'])assert(workflow.includes(JSON.stringify(path)),'Programme gate trigger missing: '+path);
 const integration=git('show','HEAD:.github/workflows/shift-coach-integration.yml');assert.equal((integration.match(/timeout-minutes: 360/g)||[]).length,1);assert.equal((integration.match(/timeout-minutes: 240/g)||[]).length,0);assert.equal((integration.match(/const maxConcurrent=2;/g)||[]).length,1);
 assert.equal(git('diff','--name-only',MAIN_RELEASE_ORIGINAL_RECEIPT,MAIN_RELEASE_FOLLOWUP_PAYLOAD).split('\n').filter(Boolean).sort().join('\n'),['.github/workflows/programme-day-preview.yml','.github/workflows/shift-coach-integration.yml','release/app-preflight.mjs','release/root-share-preview-scope.mjs','tests/bounded-source-scheduling-20261016.test.mjs','tests/combined-legacy-projection-20261014.test.mjs','tests/combined-organic-admission-negative-20261014.test.mjs','tests/food-diary-london-date-stack-20261015.test.mjs','tests/recorded-week-browser-repair-20261017.test.mjs','tests/root-share-preview.test.mjs','tests/website-editorial-scope-20261018.test.mjs'].sort().join('\n'));
});
test('source tampering and unrelated committed changes remain rejected',()=>{
 const root=mkdtempSync(join(tmpdir(),'main-readiness-')),dir=join(root,'repo');
 try{
  execFileSync('git',['clone','--no-hardlinks','--quiet',process.cwd(),dir],{stdio:'pipe'});
  const run=()=>spawnSync(process.execPath,['--input-type=module','-e',"import {verifyMainReleaseReadinessExtension} from './release/main-release-readiness-scope-20261021.mjs';verifyMainReleaseReadinessExtension();"],{cwd:dir,encoding:'utf8'});
  assert.equal(run().status,0,run().stderr);
  appendFileSync(join(dir,'reta-styles-data.mjs'),'\n// tamper\n');assert.notEqual(run().status,0);
  execFileSync('git',['restore','reta-styles-data.mjs'],{cwd:dir,stdio:'pipe'});
  appendFileSync(join(dir,'worker-entry-v6.js'),'\n// unrelated\n');execFileSync('git',['add','worker-entry-v6.js'],{cwd:dir});execFileSync('git',['-c','user.name=Scope Test','-c','user.email=scope@example.invalid','commit','-m','Unrelated fixture'],{cwd:dir,stdio:'pipe'});
  assert.notEqual(run().status,0);
 }finally{rmSync(root,{recursive:true,force:true});}
});
