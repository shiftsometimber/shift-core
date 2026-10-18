import '../daily-content/engine.test.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {verifyWebsiteEditorialCompletion,websiteEditorialCompletionHistoricalView,websiteEditorialCompletionOriginalSource,assertWebsiteEditorialCompletionView,WEBSITE_EDITORIAL_COMPLETION_PATHS,WEBSITE_EDITORIAL_COMPLETION_MAINTENANCE} from '../release/website-editorial-scope-20261018.mjs';
const g=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:64e6}),head=g('rev-parse','HEAD').trim(),manifest='release/approved-runtime-composition.json';
const blob=(r,p)=>g('rev-parse',r+':'+p).trim(),content=(r,p)=>g('show',r+':'+p),record=JSON.parse(content(head,manifest)),c=record.websiteEditorialCompletion20261018;

test('website editorial native admission binds the exact twelve-path implementation and standing routine scope',()=>{
 assert(c);assert.equal(verifyWebsiteEditorialCompletion(c),c);assert.equal(c.paths.length,12);
 assert.equal(c.authority.publicationApproved,true);assert.equal(c.authority.individualPrescribingApproved,false);assert.equal(c.authority.homepageApproved,false);assert.equal(c.authority.newSpendApproved,false);
 assert.equal(c.controls.modelCallsPerAttempt,3);assert.equal(c.controls.gatewayRetryCalls,0);assert.equal(c.controls.memberDataReads,false);assert.equal(c.controls.newCron,false);assert.equal(c.controls.originalSourceLimitsRaised,false);
 assert.equal(c.features.editorial.originalPrivateTestsPreserved,true);assert.equal(c.features.editorial.initialSeedBriefs,30);assert.equal(c.features.editorial.requiredReadyBuffer,7);assert.equal(c.twoUnattendedScheduledCyclesVerified,false);
});
test('website editorial completion registration preserves every whole prior ledger record',()=>{
 const prior=JSON.parse(content(c.base,manifest)),current=structuredClone(record);delete current.websiteEditorialCompletion20261018;
 assert.deepEqual(current,prior);assert.deepEqual(current.seoAuditRepair20261016,prior.seoAuditRepair20261016);
 assert.deepEqual(current.foodDiaryLondonDateRepair20261015,prior.foodDiaryLondonDateRepair20261015);
});
test('website editorial completion reader cannot forge any current payload, maintenance or ledger blob at either current alias',()=>{
 for(const p of [...new Set([...WEBSITE_EDITORIAL_COMPLETION_PATHS,...WEBSITE_EDITORIAL_COMPLETION_MAINTENANCE,manifest])])assert.throws(()=>verifyWebsiteEditorialCompletion(c,{read:(r,path)=>path===p&&(r==='HEAD'||r===head)?'forged':blob(r,path)}));
});
test('website editorial completion reader cannot forge current source or ledger bytes at both aliases',()=>{
 for(const p of ['daily-content/engine.mjs','release/current-runtime-preservation-20261016.mjs',manifest])assert.throws(()=>verifyWebsiteEditorialCompletion(c,{readContent:(r,path)=>path===p&&(r==='HEAD'||r===head)?'forged':content(r,path)}));
});
test('website editorial completion native source cannot be waived by a fake diff callback',()=>assert.throws(()=>verifyWebsiteEditorialCompletion(c,{readDiff:()=>[]})));
test('website editorial completion native ancestry cannot be waived by supplied false ancestry',()=>assert.throws(()=>verifyWebsiteEditorialCompletion(c,{isAncestor:()=>false})));
test('website editorial completion admission requires the actual raw current native HEAD',()=>assert.throws(()=>verifyWebsiteEditorialCompletion(c,{rawHead:c.base})));
test('website editorial authority, exact payload and existing cost limits cannot be broadened by a supplied record',()=>{
 for(const changed of [{...c,payload:'f'.repeat(40)},{...c,sourceBaseProductionAccepted:true},{...c,authority:{...c.authority,homepageApproved:true}},{...c,controls:{...c.controls,modelCallsPerAttempt:4}},{...c,controls:{...c.controls,sharedRollingDayDollars:3}}])assert.throws(()=>verifyWebsiteEditorialCompletion(changed));
});
test('website editorial completion maintenance cannot use the ledger head as its source proof',()=>assert.throws(()=>verifyWebsiteEditorialCompletion({...c,maintenanceSource:head})));
test('website editorial completion historical view is independently admitted and retains native current identity',()=>{
 const v=websiteEditorialCompletionHistoricalView();assert.equal(v.rawHead,head);assert.equal(v.head,c.base);assert.equal(assertWebsiteEditorialCompletionView(v),v);
 assert.deepEqual(v.record,JSON.parse(content(c.base,manifest)));assert.equal(v.read('HEAD','wrangler.jsonc'),blob(c.base,'wrangler.jsonc'));
 assert.throws(()=>assertWebsiteEditorialCompletionView({...v}));
});
test('website editorial completion projection rejects paired current file and directory forgeries',()=>{
 for(const p of ['scheduled-knowledge-v1.js',manifest,'release']){
  const v=websiteEditorialCompletionHistoricalView((r,path)=>path===p&&(r==='HEAD'||r===head)?'forged':blob(r,path));
  assert.throws(()=>v.read('HEAD',p));
 }
});
test('website editorial completion projection rejects forged diff and ancestry before supplying historical facts',()=>{
 const v=websiteEditorialCompletionHistoricalView();
 assert.throws(()=>v.projectDiff(()=>[])(c.base,'HEAD'));
 assert.throws(()=>v.projectAncestor(()=>false)(c.base,'HEAD'));
});
test('website editorial completion inverse restores every changed old source byte, including EOF maintenance',()=>{
 const v=websiteEditorialCompletionHistoricalView();
 for(const p of ['scheduled-knowledge-v1.js','wrangler.jsonc','release/accepted-uk-grub-preservation-20261017.mjs','release/current-runtime-preservation-20261016.mjs','worker-entry-v6.js','fit-expansion-authority-v1.mjs','g2-011-progress-story-production.mjs','member-experience/tests/weight-import-mapping-ui.test.mjs','release/approved-runtime-composition.mjs','release/seo-audit-scope-20261016.mjs','tests/seo-audit-scope-20261016.test.mjs']){
  const bytes=content(head,p);assert.equal(websiteEditorialCompletionOriginalSource(p,bytes,v),content(c.base,p));
  assert.throws(()=>websiteEditorialCompletionOriginalSource(p,bytes+'\nforged',v));
 }
});
test('website editorial completion ledger fixture restoration preserves original approval and refuses source forgery',()=>{
 const bytes=content(head,manifest),v=websiteEditorialCompletionHistoricalView();
 assert.deepEqual(JSON.parse(websiteEditorialCompletionOriginalSource(manifest,bytes,v)),JSON.parse(content(c.base,manifest)));
 assert.throws(()=>websiteEditorialCompletionOriginalSource(manifest,bytes.replace('SEO-FIX-20261016-v2','forged'),v));
 assert.throws(()=>websiteEditorialCompletionOriginalSource('daily-content/engine.mjs',content(head,'daily-content/engine.mjs'),v));
});
test('website editorial completion runtime still has only existing cron, exact gateway interlocks and no unrelated config changes',()=>{
 const before=content(c.base,'wrangler.jsonc'),after=content(head,'wrangler.jsonc');
 const additions="    \"DAILY_WEBSITE_CONTENT_ENABLED\": \"true\",\n    \"DAILY_WEBSITE_EDITORIAL_AUTOPUBLISH\": \"true\",\n    \"DAILY_EDITORIAL_MODEL\": \"@cf/openai/gpt-oss-120b\",\n    \"DAILY_EDITORIAL_SUPPORT_MODEL\": \"@cf/zai-org/glm-5.3\",\n    \"DAILY_CONTENT_GATEWAY\": \"shift-ai\",\n    \"DAILY_CONTENT_BUDGET_VERIFIED\": \"true\",\n    \"DAILY_EDITORIAL_NOTIFY_ENABLED\": \"true\",\n    \"DAILY_EDITORIAL_NOTIFY_TEMPLATE\": \"verified-link-v1\",\n\n";
 assert.equal(after.replace(additions,'').replace("\"compatibility_flags\": [\"nodejs_compat\", \"global_fetch_strictly_public\"]","\"compatibility_flags\": [\"nodejs_compat\"]"),before);assert.equal(after.split('global_fetch_strictly_public').length,2);assert.equal(after.split(additions).length,2);
 assert.match(after,/"triggers": \{ "crons": \["\*\/15 \* \* \* \*"\] \}/);
});

test('website editorial completion retains actual supplied-reader calls through the inner native batching predicates',async()=>{
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

test('website editorial completion admitted view rejects a real HEAD move in an isolated native clone',()=>{
 const directory=mkdtempSync(path.join(os.tmpdir(),'coding-completion-head-move-'));
 try{
  g('clone','--shared','--no-checkout',process.cwd(),directory);
  execFileSync('git',['checkout','--detach',head],{cwd:directory,stdio:'pipe'});
  const script=`import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {websiteEditorialCompletionHistoricalView} from './release/website-editorial-scope-20261018.mjs';const v=websiteEditorialCompletionHistoricalView();execFileSync('git',['update-ref','HEAD',${JSON.stringify(c.payload)}]);assert.throws(()=>v.assertCurrent(),/HEAD moved|source drift/);console.log('fresh-head-rejection-pass');`;
  const result=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:directory,encoding:'utf8',timeout:45000});
  assert.equal(result.status,0,result.stderr||String(result.error));assert.match(result.stdout,/fresh-head-rejection-pass/);
 }finally{rmSync(directory,{recursive:true,force:true});}
});

test('website editorial completion private expected facts never replace actual warm supplied callbacks',()=>{
 let forged=false,calls=0;
 const v=websiteEditorialCompletionHistoricalView((r,p)=>{calls++;return forged&&p==='wrangler.jsonc'&&(r==='HEAD'||r===head)?'forged':blob(r,p)});
 assert.equal(v.read('HEAD','wrangler.jsonc'),blob(c.base,'wrangler.jsonc'));const first=calls;
 assert.equal(v.read('HEAD','wrangler.jsonc'),blob(c.base,'wrangler.jsonc'));assert(calls>first);
 forged=true;assert.throws(()=>v.read('HEAD','wrangler.jsonc'),/unauthentic supplied/);
});
test('website editorial completion keeps native arbitrary-reference and directory fallback after warming',()=>{
 let forged=false;
 const v=websiteEditorialCompletionHistoricalView((r,p)=>forged&&r===c.payload&&p==='release'?'forged':blob(r,p));
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

test('native editorial and navigation frames retain actual-source authentication together',async()=>{
 const {actualNavigationOuterFrame}=await import('../release/recorded-week-navigation-outer-frame-20261018.mjs');
 const frame=actualNavigationOuterFrame();assert(frame);assert.equal(frame.rawHead,head);assert.equal(frame.head,record.recordedWeekNavigation20261018.base);
 assert.throws(()=>frame.projectRead((r,p)=>r==='HEAD'||r===head?'f'.repeat(40):blob(r,p))('HEAD','wrangler.jsonc'));
 assert.throws(()=>frame.projectDiff(()=>[])(c.base,'HEAD'));
 assert.throws(()=>frame.projectAncestor(()=>false)(c.base,'HEAD'));
 frame.finish();
});
