import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyFoodDiaryLondonDateRepair,foodDiaryLondonDateHistoricalView,foodDiaryLondonDateAuthenticatedRead,foodDiaryLondonDateAuthenticatedContent,foodDiaryLondonDateAuthenticatedDiff,foodDiaryLondonDateAuthenticatedAncestor,foodDiaryLondonDateReaderProvenance} from '../release/food-diary-london-date-scope-20261015.mjs';
import {verifyCiExecutionAllowance,ciExecutionHistoricalView} from '../release/ci-execution-scope-20261014.mjs';
import {verifyReleaseMachineryRepair,releaseMachineryRepairHistoricalView} from '../release/release-machinery-repair-scope-20261014.mjs';
import {verifyCombinedFinite} from '../release/combined-finite-scope-20261014.mjs';

const g=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6});
const head=g('rev-parse','HEAD').trim(),ledger='release/approved-runtime-composition.json',key='foodDiaryLondonDateRepair20261015';
const foodAssertions=foodDiaryLondonDateHistoricalView(),foodHead=foodAssertions.foodAssertionsHead;assert.match(foodHead,/^[a-f0-9]{40}$/);
const record=JSON.parse(g('show',foodHead+':'+ledger)),c=record[key],allowance=record.ciExecutionAllowance20261014,repair=record.releaseMachineryRepair20261014;
const ciBase='761f0c79b97075313b59effe71db418111fed983',repairBase='685ede249cd20c4801d0a25227fed16d46860618';
const runtime='member-experience/journey-portability.mjs',runtimeTest='member-experience/tests/food-diary-london-date-20261015.test.mjs',ciWitness='release/ci-execution-stack-original-20261015.mjs';
const blob=(ref,path)=>g('rev-parse',ref+':'+path).trim(),content=(ref,path)=>g('show',ref+':'+path);
const nativeDiff=(a,b)=>g('diff','--no-renames','--name-only',a,b).trim().split('\n').filter(Boolean),nativeAncestor=(a,b)=>g('merge-base','--is-ancestor',a,b);
const combinedOptions={head,read:blob,blob,content,diff:nativeDiff,ancestor:nativeAncestor};
const sourceFailure=/source drift|Unauthentic|Supplied|ledger drift|content drift|boundary|Unreviewed|independently admitted/i;

test('actual Food to CI-assertions to761 to685 stack preserves every original receipt',()=>{
 assert(c,'The separately registered food-calendar repair is required');assert.match(c.base,/^[a-f0-9]{40}$/);assert.equal(allowance.base,ciBase);assert.equal(repair.base,repairBase);
 const prior=JSON.parse(content(c.base,ledger)),remaining=structuredClone(record);delete remaining[key];
 assert(!prior[key]);assert.deepEqual(remaining,prior,'Only the separate food-calendar registration may be added');
 assert.deepEqual(allowance,prior.ciExecutionAllowance20261014);assert.deepEqual(repair,prior.releaseMachineryRepair20261014);
 const food=foodDiaryLondonDateHistoricalView(),ci=ciExecutionHistoricalView(),r=releaseMachineryRepairHistoricalView();
 assert.equal(food.rawHead,head);assert.equal(food.foodAssertionsHead,foodHead);assert.equal(food.foodAssertionsTree,g('rev-parse',foodHead+'^{tree}').trim());assert.equal(food.head,c.base);assert.deepEqual(food.record,prior);
 assert.equal(ci.rawHead,head);assert.equal(ci.ciAssertionsHead,c.base);assert.equal(ci.ciAssertionsTree,g('rev-parse',c.base+'^{tree}').trim());assert.equal(ci.head,ciBase);
 assert.equal(r.rawHead,head);assert.equal(r.head,repairBase);assert(!r.record[key]);assert(!r.record.ciExecutionAllowance20261014);assert(!r.record.releaseMachineryRepair20261014);
 assert.deepEqual(r.record,JSON.parse(content(repairBase,ledger)));
 verifyFoodDiaryLondonDateRepair(c,{head});verifyCiExecutionAllowance(allowance,{head});verifyReleaseMachineryRepair(repair,{head});verifyCombinedFinite(record.combinedFinite20261014,combinedOptions);
});
test('the food receipt owns the exact two-file runtime payload while original machinery authority stays unchanged',()=>{
 assert.equal(c.runtimeChanged,true);assert.equal(repair.runtimeChanged,false);assert.equal(repair.timeAllowancesIncreased,false);
 assert.deepEqual([...c.paths].sort(),[runtime,runtimeTest].sort());assert.deepEqual(nativeDiff(c.base,c.source).sort(),[runtime,runtimeTest].sort());
 for(const path of c.paths)assert.equal(blob(foodHead,path),blob(c.source,path),'Exact frozen food payload required: '+path);
 const before=content(c.base,runtime),after=content(foodHead,runtime);
 assert.equal(after.slice(after.indexOf('export async function journeyPortabilityRoutes')),before.slice(before.indexOf('export async function journeyPortabilityRoutes')),'Route, session, consent and storage body remains byte-identical');
 assert.equal(after.slice(after.indexOf('const date='),after.indexOf('// Food entry dates')),before.slice(before.indexOf('const date='),before.indexOf('export function validateFoodEntry')),'Shared date and weight import remain byte-identical');
});
test('the exact original21 CI witness production60 and configurations survive the runtime repair',()=>{
 assert.equal(blob(foodHead,ciWitness),'b5aee29bfa2e7e4fa01de2585df074eb3ee40907');assert.equal(content(foodHead,ciWitness),content(c.base,'tests/ci-execution-stack-20261014.test.mjs'));assert.equal(blob(foodHead,'tests/ci-execution-stack-20261014.test.mjs'),'cec36f99782ed977a23827bfa67d400876948d25');
 const production='.github/workflows/cloudflare-production-promote.yml';assert.match(content(foodHead,production),/^    timeout-minutes: 60$/m);
 for(const path of[production,'.github/workflows/production-completion-proof.yml','.github/workflows/approved-ranking-proof.yml','.github/workflows/programme-day-preview.yml','wrangler.jsonc','wrangler.coaching.jsonc','package.json','package-lock.json','worker-entry-v6.js','worker.js','frontend','public','my-timber-app','shift-coach/worker.mjs','member-state-fast-v1.js','member-experience/health-routes.mjs'])assert.equal(blob(foodHead,path),blob(c.base,path),'Protected source changed: '+path);
});
test('paired forged current food source and directories reach Food admission before projection in every direct gate',()=>{
 for(const path of[runtime,'member-experience','release'])for(const [name,verify]of[
  ['food',read=>verifyFoodDiaryLondonDateRepair(c,{head,read})],
  ['CI',read=>verifyCiExecutionAllowance(allowance,{head,read})],
  ['machinery',read=>verifyReleaseMachineryRepair(repair,{head,read})],
  ['combined',read=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,read})],
 ]){
  let visits=0;const read=(ref,p)=>{if(p===path&&(ref==='HEAD'||ref===head)){visits++;return'identical forged current food source';}return blob(ref,p);};
  assert.throws(()=>verify(read),sourceFailure,name+': '+path);assert(visits>0,'The outer food callback must actually execute: '+name+': '+path);
 }
});
test('direct combined admission authenticates its independent blob callback at the current food boundary',()=>{
 for(const path of[runtime,'member-experience','release']){
  let visits=0;const forged=(ref,p)=>{if(p===path&&(ref==='HEAD'||ref===head)){visits++;return'identical forged current food blob';}return blob(ref,p);};
  assert.throws(()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,blob:forged}),sourceFailure,path);assert(visits>0,'Food must authenticate blob even when read is genuine: '+path);
 }
});
test('current and Food-base ledger overrides cannot disappear through any older projection',()=>{
 for(const alias of['HEAD',head,c.base]){
  let visits=0;const readContent=(ref,path)=>{const actual=content(ref,path);if(ref!==alias||path!==ledger)return actual;visits++;const changed=JSON.parse(actual);changed.releaseMachineryRepair20261014.emailAuthority=true;return JSON.stringify(changed);};
  for(const verify of[
   ()=>verifyFoodDiaryLondonDateRepair(c,{head,readContent}),()=>verifyCiExecutionAllowance(allowance,{head,readContent}),()=>verifyReleaseMachineryRepair(repair,{head,readContent}),()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,content:readContent}),
  ])assert.throws(verify,sourceFailure,alias);
  assert(visits>0,'The supplied ledger is observed at its exact ref: '+alias);
 }
});
test('projected or unrelated source heads cannot replace the actual raw Food head',()=>{
 for(const wrong of[c.base,ciBase,repairBase,'f'.repeat(40)])for(const verify of[
  ()=>verifyFoodDiaryLondonDateRepair(c,{head:wrong}),()=>verifyCiExecutionAllowance(allowance,{head:wrong}),()=>verifyReleaseMachineryRepair(repair,{head:wrong}),()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,head:wrong}),
 ])assert.throws(verify,/HEAD|head|source drift/i,wrong);
});
test('omitted raw Food changes stay visible to supplied diff callbacks in every gate',()=>{
 const readDiff=(a,b)=>b==='HEAD'||b===head?[]:nativeDiff(a,b);
 for(const verify of[
  ()=>verifyFoodDiaryLondonDateRepair(c,{head,readDiff}),()=>verifyCiExecutionAllowance(allowance,{head,readDiff}),()=>verifyReleaseMachineryRepair(repair,{head,readDiff}),()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,diff:readDiff}),
 ])assert.throws(verify,sourceFailure);
});
test('direct combined diffs authenticate the actual CI-assertions head and both older projected heads',()=>{
 for(const projected of[c.base,ciBase,repairBase]){
  let visits=0;const diff=(a,b)=>{if(b===projected){visits++;return['unreviewed-food-projected-path.mjs'];}return nativeDiff(a,b);};
  assert.throws(()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,diff}),sourceFailure,projected);assert(visits>0,'Supplied projected diff must execute: '+projected);
 }
});
test('direct combined historical diffs are checked against their literal native arguments',()=>{
 const historical=record.combinedFinite20261014.source;let visits=0;
 const diff=(a,b)=>{if(b===historical){visits++;return['unreviewed-food-historical-path.mjs'];}return nativeDiff(a,b);};
 assert.throws(()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,diff}),sourceFailure);assert(visits>0);
});
test('false raw Food ancestry stays visible to supplied callbacks in every gate',()=>{
 const isAncestor=(a,b)=>b==='HEAD'||b===head?false:nativeAncestor(a,b);
 for(const verify of[
  ()=>verifyFoodDiaryLondonDateRepair(c,{head,isAncestor}),()=>verifyCiExecutionAllowance(allowance,{head,isAncestor}),()=>verifyReleaseMachineryRepair(repair,{head,isAncestor}),()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,ancestor:isAncestor}),
 ])assert.throws(verify,sourceFailure);
});
test('direct combined ancestry authenticates the actual CI-assertions head and both older projected heads',()=>{
 for(const projected of[c.base,ciBase,repairBase]){
  let visits=0;const ancestor=(a,b)=>{if(b===projected){visits++;return false;}return nativeAncestor(a,b);};
  assert.throws(()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,ancestor}),sourceFailure,projected);assert(visits>0,'Supplied projected ancestry must execute: '+projected);
 }
});
test('direct combined historical ancestry cannot be replaced by a projected proof',()=>{
 const historical=record.combinedFinite20261014.source;let visits=0;
 const ancestor=(a,b)=>{if(b===historical){visits++;return false;}return nativeAncestor(a,b);};
 assert.throws(()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,ancestor}),sourceFailure);assert(visits>0);
});
test('defaultReader true executes genuine and forged non-null Food callbacks',()=>{
 let genuineVisits=0;const genuine=(ref,path)=>{genuineVisits++;return blob(ref,path);};
 foodDiaryLondonDateHistoricalView(genuine,{defaultReader:true}).read('HEAD',runtime);assert(genuineVisits>0);
 let contentVisits=0;const genuineContent=(ref,path)=>{contentVisits++;return content(ref,path);};foodDiaryLondonDateHistoricalView(genuineContent,{defaultReader:true}).read('HEAD',runtime);assert(contentVisits>0,'A genuine native content reader remains supported and executed');
 for(const path of[runtime,'member-experience','release']){
  let visits=0;const read=(ref,p)=>{if(p===path&&(ref==='HEAD'||ref===head)){visits++;return'equal forged food aliases with defaultReader true';}return blob(ref,p);};
  assert.throws(()=>foodDiaryLondonDateHistoricalView(read,{defaultReader:true}).read('HEAD',path),sourceFailure,path);assert(visits>0);
 }
});
test('strict Food content rejects genuine blob IDs substituted for bytes at current projected and historical refs',()=>{
 const view=foodDiaryLondonDateHistoricalView();
 for(const alias of['HEAD',head,c.base,repair.source]){
  let visits=0;const supplied=(ref,path)=>{if(ref===alias&&path===ledger){visits++;return blob(ref,path);}return content(ref,path);};
  const read=foodDiaryLondonDateAuthenticatedContent(supplied,view),requested=alias==='HEAD'||alias===head||alias===c.base?'HEAD':alias;
  assert.throws(()=>read(requested,ledger),sourceFailure,alias);assert(visits>0,'Content authentication must observe the exact supplied ref: '+alias);
 }
});
test('strict Food source readers authenticate projected and historical source and directory callbacks',()=>{
 for(const ref of[c.base,repair.source])for(const path of[runtime,'release']){
  let visits=0;const supplied=(r,p)=>{if(r===ref&&p===path){visits++;return'forged exact-ref food fallback';}return blob(r,p);};
  const view=foodDiaryLondonDateHistoricalView(),read=foodDiaryLondonDateAuthenticatedRead(supplied,view);
  assert.throws(()=>read(ref===c.base?'HEAD':ref,path),sourceFailure,ref+':'+path);assert(visits>0);
 }
});
test('Food reader provenance is private and successful reads cannot cache away later callback poisoning',()=>{
 let poisoned=false,visits=0;const supplied=(ref,path)=>{if(ref===c.base&&path===runtime){visits++;if(poisoned)return'later forged food predecessor';}return blob(ref,path);};
 const view=foodDiaryLondonDateHistoricalView(supplied,{defaultReader:true});view.read('HEAD',runtime);const before=visits;assert(before>0);poisoned=true;
 assert.throws(()=>view.read('HEAD',runtime),sourceFailure);assert(visits>before);
 assert.equal(foodDiaryLondonDateReaderProvenance(view.read).view,view);assert.equal(foodDiaryLondonDateReaderProvenance(()=>{}),null);
 assert.throws(()=>foodDiaryLondonDateAuthenticatedContent(content,{...view})('HEAD',runtime),/independently admitted private view/i);
});
test('strict Food content diff and ancestry fallback authenticate exact historical arguments',()=>{
 const view=foodDiaryLondonDateHistoricalView(),historical=repairBase,base=record.combinedFinite20261014.base;
 assert.throws(()=>foodDiaryLondonDateAuthenticatedContent((r,p)=>r===historical&&p===ledger?'forged historical food content':content(r,p),view)(historical,ledger),sourceFailure);
 assert.throws(()=>foodDiaryLondonDateAuthenticatedDiff((a,b)=>b===historical?[]:nativeDiff(a,b),view)(base,historical),sourceFailure);
 assert.throws(()=>foodDiaryLondonDateAuthenticatedAncestor((a,b)=>b===historical?false:nativeAncestor(a,b),view)(base,historical),sourceFailure);
});
