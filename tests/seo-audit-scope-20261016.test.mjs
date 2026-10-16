import test from 'node:test';
import {withImmutableHistoryVerification} from '../release/immutable-git-facts.mjs';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {foodDiaryLondonDateOriginalCiWorkflow,foodDiaryLondonDateOriginalProductionWorkflow} from '../release/food-diary-london-date-scope-20261015.mjs';
import {execFileSync} from 'node:child_process';
import {verifySeoAuditRepair,seoAuditHistoricalView,seoAuditOriginalSource,SEO_AUDIT_PATHS} from '../release/seo-audit-scope-20261016.mjs';
const g=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:64e6}),head=g('rev-parse','HEAD').trim(),manifest='release/approved-runtime-composition.json',record=JSON.parse(g('show',head+':'+manifest)),c=record.seoAuditRepair20261016;
const blob=(r,p)=>g('rev-parse',r+':'+p).trim(),content=(r,p)=>g('show',r+':'+p);
test('exact approved six-file payload and all prior authority survive native SEO admission',()=>{assert(c);assert.equal(verifySeoAuditRepair(c).payload,'69ce6f22a6d543832b6f538d330a732143ff5844');const v=seoAuditHistoricalView();assert.equal(v.rawHead,head);assert.equal(v.head,'fe726ac1fc5465dbe5f1e1e59346a3f6120094ae');assert.deepEqual(v.record,JSON.parse(content(v.head,manifest)));assert.equal(v.read('HEAD','worker-entry-v6.js'),blob(v.head,'worker-entry-v6.js'));});
test('every supplied payload or ledger override rejects, including paired current aliases',()=>{for(const path of [...SEO_AUDIT_PATHS,manifest]){assert.throws(()=>verifySeoAuditRepair(c,{read:(r,p)=>p===path&&(r==='HEAD'||r===head)?'forged':blob(r,p)}));assert.throws(()=>verifySeoAuditRepair(c,{readContent:(r,p)=>p===path&&(r==='HEAD'||r===head)?'forged':content(r,p)}));}});
test('projection cannot conceal a fresh supplied source or current ledger forgery',()=>{for(const p of ['worker-entry-v6.js',manifest,'release']){const v=seoAuditHistoricalView((r,path)=>path===p&&(r==='HEAD'||r===head)?'forged':blob(r,path));assert.throws(()=>v.read('HEAD',p));}});
test('wrong approved version, payload source, maintenance source or raw head rejects',()=>{for(const changed of [{...c,payload:'f'.repeat(40)},{...c,maintenanceSource:head},{...c,approval:{...c.approval,version:'other'}}])assert.throws(()=>verifySeoAuditRepair(changed));assert.throws(()=>verifySeoAuditRepair(c,{rawHead:c.base}));});

test('native admission rechecks index visibility inside a warmed immutable scope',()=>{
 const directory=mkdtempSync(join(tmpdir(),'seo-index-visibility-'));
 try{
  g('clone','--no-hardlinks','--quiet','--no-checkout',process.cwd(),directory);
  execFileSync('git',['checkout','--detach','--quiet',head],{cwd:directory});
  execFileSync(process.execPath,['--input-type=module','-e',"import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';const {withImmutableHistoryVerification}=await import(pathToFileURL(process.cwd()+'/release/immutable-git-facts.mjs'));const {verifySeoAuditRepair,SEO_AUDIT_PATHS}=await import(pathToFileURL(process.cwd()+'/release/seo-audit-scope-20261016.mjs'));const g=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:64e6}),head=g('rev-parse','HEAD').trim(),c=JSON.parse(g('show',head+':release/approved-runtime-composition.json')).seoAuditRepair20261016;withImmutableHistoryVerification(()=>{verifySeoAuditRepair(c);const path=SEO_AUDIT_PATHS[0];try{g('update-index','--skip-worktree','--',path);assert.throws(()=>verifySeoAuditRepair(c),/hidden assume-unchanged\\/skip-worktree index flags/);}finally{g('update-index','--no-skip-worktree','--',path);}assert.equal(verifySeoAuditRepair(c).payload,c.payload);});"],{cwd:directory,maxBuffer:64e6,stdio:'pipe'});
 }finally{rmSync(directory,{recursive:true,force:true});}
});

test('production fixture adapter preserves original assertions and rejects changed deployment, budget or permissions',()=>{
 const path='.github/workflows/cloudflare-production-promote.yml',source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const baseRecord=JSON.parse(content(c.base,manifest));
 const original=content(baseRecord.foodDiaryLondonDateRepair20261015.base,path);
 assert.equal(foodDiaryLondonDateOriginalProductionWorkflow(source),original);
 for(const [from,to] of [['node release/member-runtime-deploy.mjs','node release/unreviewed-deploy.mjs'],['timeout-minutes: 60','timeout-minutes: 120'],['contents: read','contents: write']]){assert(source.includes(from));assert.throws(()=>foodDiaryLondonDateOriginalProductionWorkflow(source.replace(from,to)));}
 assert.throws(()=>foodDiaryLondonDateOriginalCiWorkflow('.github/workflows/unreviewed.yml',source));
});

test('historical assertion adapter restores exact prior bytes and rejects forged source or ledger input',()=>{
 for(const path of ['release/approved-runtime-composition.mjs','release/food-diary-london-date-scope-20261015.mjs','tests/food-diary-london-date-stack-20261015.test.mjs','tests/bounded-source-scheduling-20261016.test.mjs']){const bytes=content(head,path);assert.equal(seoAuditOriginalSource(path,bytes),content(c.base,path));assert.throws(()=>seoAuditOriginalSource(path,bytes+'\nforged'));}
 const bytes=content(head,manifest);assert.deepEqual(JSON.parse(seoAuditOriginalSource(manifest,bytes)),JSON.parse(content(c.base,manifest)));assert.throws(()=>seoAuditOriginalSource(manifest,bytes.replace('SEO-FIX-20261016-v2','forged')));assert.throws(()=>seoAuditOriginalSource('unreviewed.mjs','forged'));
});

// Exercise exact native object bytes and all malformed batch rejection cases.
import './seo-native-immutable-facts-20261016.test.mjs';

// Cancellation eligibility retains the exact provider/source/run ownership guard.
import './runtime-cancel-rollback-20261016.test.mjs';
