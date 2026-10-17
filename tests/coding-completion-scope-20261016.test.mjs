import '../daily-content/engine.test.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {verifyCodingCompletion,codingCompletionHistoricalView,codingCompletionOriginalSource,assertCodingCompletionView,CODING_COMPLETION_PATHS,CODING_COMPLETION_MAINTENANCE} from '../release/coding-completion-scope-20261016.mjs';
const g=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:64e6}),head=g('rev-parse','HEAD').trim(),manifest='release/approved-runtime-composition.json';
const blob=(r,p)=>g('rev-parse',r+':'+p).trim(),content=(r,p)=>g('show',r+':'+p),record=JSON.parse(content(head,manifest)),c=record.codingCompletion20261016;

test('coding completion native admission binds exact six-path daily-only payload and scoped private daily authority',()=>{
 assert(c);assert.equal(verifyCodingCompletion(c),c);assert.equal(c.paths.length,6);assert.equal(c.features.daily.paths.length,6);
 assert.equal(c.features.daily.donor,'35dab989f0a6a6cb76ce4e1eabe4567c02de6ace');
 for(const p of c.features.daily.exactCurrentDonorPaths)assert.equal(blob(c.payload,p),blob(c.features.daily.donor,p));
 for(const p of c.features.daily.paths)assert.equal(c.features.daily.exactDonorBlobs[p],blob(c.features.daily.donor,p));
 assert.equal(c.features.daily.exactCurrentDonorPaths.length,5);assert.equal(c.features.daily.currentConfigurationRetarget.allOtherCurrentConfigurationBytesUnchanged,true);assert.equal(c.features.daily.currentConfigurationRetarget.wOrGpFlagStateChosenOrChanged,false);
 assert.equal(c.sourceBaseProductionAccepted,false);assert.equal(c.authority.publicationApproved,false);
 assert.equal(c.controls.modelCallsPerAttempt,2);assert.equal(c.controls.creationAttemptsPerLondonDay,1);
 assert.equal(c.controls.publicWrites,false);assert.equal(c.controls.memberDataReads,false);
});
test('coding completion registration preserves every whole prior ledger record',()=>{
 const prior=JSON.parse(content(c.base,manifest)),current=structuredClone(record);delete current.codingCompletion20261016;
 assert.deepEqual(current,prior);assert.deepEqual(current.seoAuditRepair20261016,prior.seoAuditRepair20261016);
 assert.deepEqual(current.foodDiaryLondonDateRepair20261015,prior.foodDiaryLondonDateRepair20261015);
});
test('coding completion reader cannot forge any current payload, maintenance or ledger blob at either current alias',()=>{
 for(const p of [...new Set([...CODING_COMPLETION_PATHS,...CODING_COMPLETION_MAINTENANCE,manifest])])assert.throws(()=>verifyCodingCompletion(c,{read:(r,path)=>path===p&&(r==='HEAD'||r===head)?'forged':blob(r,path)}));
});
test('coding completion reader cannot forge current source or ledger bytes at both aliases',()=>{
 for(const p of ['daily-content/engine.mjs','release/current-runtime-preservation-20261016.mjs',manifest])assert.throws(()=>verifyCodingCompletion(c,{readContent:(r,path)=>path===p&&(r==='HEAD'||r===head)?'forged':content(r,path)}));
});
test('coding completion native source cannot be waived by a fake diff callback',()=>assert.throws(()=>verifyCodingCompletion(c,{readDiff:()=>[]})));
test('coding completion native ancestry cannot be waived by supplied false ancestry',()=>assert.throws(()=>verifyCodingCompletion(c,{isAncestor:()=>false})));
test('coding completion admission requires the actual raw current native HEAD',()=>assert.throws(()=>verifyCodingCompletion(c,{rawHead:c.base})));
test('coding completion payload, donor, source-base status and private-only authority are exact',()=>{
 for(const changed of [{...c,payload:'f'.repeat(40)},{...c,features:{...c.features,daily:{...c.features.daily,donor:'e'.repeat(40)}}},{...c,sourceBaseProductionAccepted:true},{...c,authority:{...c.authority,publicationApproved:true}},{...c,controls:{...c.controls,modelCallsPerAttempt:3}},{...c,controls:{...c.controls,publicWrites:true}}])assert.throws(()=>verifyCodingCompletion(changed));
});
test('coding completion maintenance cannot use the ledger head as its source proof',()=>assert.throws(()=>verifyCodingCompletion({...c,maintenanceSource:head})));
test('coding completion historical view is independently admitted and retains native current identity',()=>{
 const v=codingCompletionHistoricalView();assert.equal(v.rawHead,head);assert.equal(v.head,c.base);assert.equal(assertCodingCompletionView(v),v);
 assert.deepEqual(v.record,JSON.parse(content(c.base,manifest)));assert.equal(v.read('HEAD','wrangler.jsonc'),blob(c.base,'wrangler.jsonc'));
 assert.throws(()=>assertCodingCompletionView({...v}));
});
test('coding completion projection rejects paired current file and directory forgeries',()=>{
 for(const p of ['scheduled-knowledge-v1.js',manifest,'release']){
  const v=codingCompletionHistoricalView((r,path)=>path===p&&(r==='HEAD'||r===head)?'forged':blob(r,path));
  assert.throws(()=>v.read('HEAD',p));
 }
});
test('coding completion projection rejects forged diff and ancestry before supplying historical facts',()=>{
 const v=codingCompletionHistoricalView();
 assert.throws(()=>v.projectDiff(()=>[])(c.base,'HEAD'));
 assert.throws(()=>v.projectAncestor(()=>false)(c.base,'HEAD'));
});
test('coding completion inverse restores every changed old source byte, including EOF maintenance',()=>{
 const v=codingCompletionHistoricalView();
 for(const p of ['scheduled-knowledge-v1.js','wrangler.jsonc','release/current-runtime-preservation-20261016.mjs','worker-entry-v6.js','fit-expansion-authority-v1.mjs','g2-011-progress-story-production.mjs','member-experience/tests/weight-import-mapping-ui.test.mjs','release/approved-runtime-composition.mjs','release/seo-audit-scope-20261016.mjs','tests/seo-audit-scope-20261016.test.mjs']){
  const bytes=content(head,p);assert.equal(codingCompletionOriginalSource(p,bytes,v),content(c.base,p));
  assert.throws(()=>codingCompletionOriginalSource(p,bytes+'\nforged',v));
 }
});
test('coding completion ledger fixture restoration preserves original approval and refuses source forgery',()=>{
 const bytes=content(head,manifest),v=codingCompletionHistoricalView();
 assert.deepEqual(JSON.parse(codingCompletionOriginalSource(manifest,bytes,v)),JSON.parse(content(c.base,manifest)));
 assert.throws(()=>codingCompletionOriginalSource(manifest,bytes.replace('SEO-FIX-20261016-v2','forged'),v));
 assert.throws(()=>codingCompletionOriginalSource('daily-content/engine.mjs',content(head,'daily-content/engine.mjs'),v));
});
test('coding completion runtime still has only existing cron, exact gateway interlocks and no unrelated config changes',()=>{
 const before=content(c.base,'wrangler.jsonc'),after=content(head,'wrangler.jsonc');
 const additions='    "DAILY_WEBSITE_CONTENT_ENABLED": "true",\n    "DAILY_CONTENT_GATEWAY": "shift-ai",\n    "DAILY_CONTENT_BUDGET_VERIFIED": "true",\n';
 assert.equal(after.replace(additions,''),before);assert.equal(after.split(additions).length,2);
 assert.match(after,/"triggers": \{ "crons": \["\*\/15 \* \* \* \*"\] \}/);
});

test('coding completion retains actual supplied-reader calls through the inner native batching predicates',async()=>{
 const {verifyCurrentRuntimePreservation}=await import('../release/current-runtime-preservation-20261016.mjs');
 const seen=new Set(),seenContent=new Set();
 verifyCurrentRuntimePreservation(record.currentRuntimePreservation20261016,{
  read:(r,p)=>{seen.add(r+':'+p);return blob(r,p)},
  readContent:(r,p)=>{seenContent.add(r+':'+p);return content(r,p)}
 });
 for(const p of [...record.currentRuntimePreservation20261016.paths,manifest])for(const r of ['HEAD',head]){
  assert(seen.has(r+':'+p),'Supplied native blob callback must run '+r+':'+p);
  assert(seenContent.has(r+':'+p),'Supplied native content callback must run '+r+':'+p);
 }
});

test('coding completion admitted view rejects a real HEAD move in an isolated native clone',()=>{
 const directory=mkdtempSync(path.join(os.tmpdir(),'coding-completion-head-move-'));
 try{
  g('clone','--shared','--no-checkout',process.cwd(),directory);
  execFileSync('git',['checkout','--detach',head],{cwd:directory,stdio:'pipe'});
  const script=`import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {codingCompletionHistoricalView} from './release/coding-completion-scope-20261016.mjs';const v=codingCompletionHistoricalView();execFileSync('git',['update-ref','HEAD',${JSON.stringify(c.payload)}]);assert.throws(()=>v.assertCurrent(),/HEAD moved|source drift/);console.log('fresh-head-rejection-pass');`;
  const result=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:directory,encoding:'utf8',timeout:45000});
  assert.equal(result.status,0,result.stderr||String(result.error));assert.match(result.stdout,/fresh-head-rejection-pass/);
 }finally{rmSync(directory,{recursive:true,force:true});}
});

test('coding completion private expected facts never replace actual warm supplied callbacks',()=>{
 let forged=false,calls=0;
 const v=codingCompletionHistoricalView((r,p)=>{calls++;return forged&&p==='wrangler.jsonc'&&(r==='HEAD'||r===head)?'forged':blob(r,p)});
 assert.equal(v.read('HEAD','wrangler.jsonc'),blob(c.base,'wrangler.jsonc'));const first=calls;
 assert.equal(v.read('HEAD','wrangler.jsonc'),blob(c.base,'wrangler.jsonc'));assert(calls>first);
 forged=true;assert.throws(()=>v.read('HEAD','wrangler.jsonc'),/unauthentic supplied/);
});
test('coding completion keeps native arbitrary-reference and directory fallback after warming',()=>{
 let forged=false;
 const v=codingCompletionHistoricalView((r,p)=>forged&&r===c.payload&&p==='release'?'forged':blob(r,p));
 assert.equal(v.read(c.payload,'release'),blob(c.payload,'release'));
 forged=true;assert.throws(()=>v.read(c.payload,'release'),/unauthentic supplied/);
});

test('coding construction proof expires before a returned current-runtime reader is used',()=>{
 const directory=mkdtempSync(path.join(os.tmpdir(),'coding-construction-expiry-'));
 try{
  g('clone','--no-hardlinks','--no-checkout',process.cwd(),directory);
  execFileSync('git',['checkout','--detach',head],{cwd:directory,stdio:'pipe'});
  const script=`import assert from 'node:assert/strict';import {appendFileSync} from 'node:fs';import {currentRuntimePreservationHistoricalView} from './release/current-runtime-preservation-20261016.mjs';const v=currentRuntimePreservationHistoricalView();appendFileSync('scheduled-knowledge-v1.js','\\n// real tracked change after construction proof\\n');assert.throws(()=>v.read('HEAD','wrangler.jsonc'),/source drift|working|tracked|clean/i);console.log('expired-construction-guard-pass');`;
  const result=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:directory,encoding:'utf8',timeout:45000});
  assert.equal(result.status,0,result.stderr||String(result.error));assert.match(result.stdout,/expired-construction-guard-pass/);
 }finally{rmSync(directory,{recursive:true,force:true});}
});

test('current-runtime binding authenticates each real current alias and preserves invalid callback representation',async()=>{
 const {verifyCurrentRuntimePreservation}=await import('../release/current-runtime-preservation-20261016.mjs');
 const current=record.currentRuntimePreservation20261016,p='wrangler.jsonc';
 for(const alias of ['HEAD',head]){
  assert.throws(()=>verifyCurrentRuntimePreservation(current,{read:(r,path)=>r===alias&&path===p?'forged':blob(r,path)}));
  assert.throws(()=>verifyCurrentRuntimePreservation(current,{readContent:(r,path)=>r===alias&&path===p?'forged':content(r,path)}));
 }
 assert.throws(()=>verifyCurrentRuntimePreservation(current,{read:(r,path)=>content(r,path)}),'Native content must not be repaired into a valid blob callback');
});
