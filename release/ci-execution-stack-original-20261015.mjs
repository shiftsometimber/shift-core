import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyCiExecutionAllowance,ciExecutionHistoricalView} from '../release/ci-execution-scope-20261014.mjs';
import {verifyReleaseMachineryRepair,releaseMachineryRepairHistoricalView} from '../release/release-machinery-repair-scope-20261014.mjs';
import {verifyCombinedFinite} from '../release/combined-finite-scope-20261014.mjs';

const g=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6});
const head=g('rev-parse','HEAD').trim(),ledger='release/approved-runtime-composition.json',key='ciExecutionAllowance20261014';
const record=JSON.parse(g('show',head+':'+ledger)),c=record[key],repair=record.releaseMachineryRepair20261014;
const expectedBase='761f0c79b97075313b59effe71db418111fed983',originalRepairBase='685ede249cd20c4801d0a25227fed16d46860618';
const blob=(ref,path)=>g('rev-parse',ref+':'+path).trim(),content=(ref,path)=>g('show',ref+':'+path);
const nativeDiff=(a,b)=>g('diff','--no-renames','--name-only',a,b).trim().split('\n').filter(Boolean);
const nativeAncestor=(a,b)=>g('merge-base','--is-ancestor',a,b);
const combinedOptions={head,read:blob,blob,content,diff:nativeDiff,ancestor:nativeAncestor};
const workflows=[
 ['.github/workflows/production-completion-proof.yml',8,20],
 ['.github/workflows/approved-ranking-proof.yml',8,20],
 ['.github/workflows/programme-day-preview.yml',12,30],
];
const sourceFailure=/source drift|Unauthentic|Supplied|ledger drift|content drift|boundary|Unreviewed/i;

test('actual raw CI to761 to685 stack preserves every original repair record and its unchanged time allowance',()=>{
 assert(c,'Actual CI execution allowance registration is required');assert.equal(c.base,expectedBase);assert.equal(repair.base,originalRepairBase);
 const prior=JSON.parse(content(c.base,ledger)),remaining=structuredClone(record);delete remaining[key];
 assert(!prior[key]);assert.deepEqual(remaining,prior,'Only the separate CI registration may be added');
 assert.deepEqual(repair,prior.releaseMachineryRepair20261014);assert.equal(repair.timeAllowancesIncreased,false,'Original machinery authority must not be rewritten as a time-allowance grant');
 const ci=ciExecutionHistoricalView(),r=releaseMachineryRepairHistoricalView();
 assert.equal(ci.rawHead,head);assert.equal(ci.head,c.base);assert.deepEqual(ci.record,prior);
 assert.equal(r.rawHead,head);assert.equal(r.head,repair.base);assert(!r.record[key]);assert(!r.record.releaseMachineryRepair20261014);
 assert.deepEqual(r.record,JSON.parse(content(repair.base,ledger)),'Both exact projections must restore the original685 ledger');
 verifyCiExecutionAllowance(c,{head});verifyReleaseMachineryRepair(repair,{head});verifyCombinedFinite(record.combinedFinite20261014,combinedOptions);
});
test('all three CI workflow payloads invert to their exact original bytes by changing only their one authorised timeout',()=>{
 assert.deepEqual([...c.paths].sort(),workflows.map(([path])=>path).sort());
 assert.deepEqual(nativeDiff(c.base,c.source).sort(),workflows.map(([path])=>path).sort());
 for(const [path,before,after]of workflows){
  const original=content(c.base,path),current=content(head,path),oldLine='    timeout-minutes: '+before,newLine='    timeout-minutes: '+after;
  assert.equal(original.split(oldLine).length,2,'Exactly one original CI timeout required: '+path);
  assert.equal(current.split(newLine).length,2,'Exactly one authorised replacement timeout required: '+path);
  assert.equal(current,original.replace(oldLine,newLine),'Commands, permissions, gates and every other workflow byte must remain exact: '+path);
  assert.equal(blob(head,path),blob(c.source,path),'The final head must retain the exact frozen CI payload: '+path);
 }
});
test('production keeps its original60 minute workflow and site app and deployment configurations remain unchanged',()=>{
 const production='.github/workflows/cloudflare-production-promote.yml';
 assert.match(content(head,production),/^    timeout-minutes: 60$/m);
 for(const path of[production,'wrangler.jsonc','wrangler.coaching.jsonc','package.json','package-lock.json','worker-entry-v6.js','worker.js','frontend','public','my-timber-app','member-experience','shift-coach/worker.mjs'])assert.equal(blob(head,path),blob(c.base,path),'CI-only protected source changed: '+path);
});
test('CI admission rejects identical fabricated HEAD and raw-head workflow reader values',()=>{
 for(const [path]of workflows){
  const read=(ref,p)=>p===path&&(ref==='HEAD'||ref===head)?'identical forged CI workflow':blob(ref,p);
  assert.throws(()=>verifyCiExecutionAllowance(c,{head,read}),sourceFailure,path);
 }
});
test('CI and older machinery views authenticate both current directory spellings before projection',()=>{
 for(const path of['.github/workflows','release']){
  const read=(ref,p)=>p===path&&(ref==='HEAD'||ref===head)?'tree forged\nidentical fabricated current directory':blob(ref,p);
  assert.throws(()=>ciExecutionHistoricalView(read,{defaultReader:false}).read('HEAD',path),sourceFailure,path);
  assert.throws(()=>releaseMachineryRepairHistoricalView(read,{defaultReader:false}).read('HEAD',path),sourceFailure,path);
 }
});
test('direct combined admission rejects paired current workflow and directory read forgeries',()=>{
 for(const path of[workflows[0][0],'release']){
  const read=(ref,p)=>p===path&&(ref==='HEAD'||ref===head)?'identical forged combined current reader':blob(ref,p);
  assert.throws(()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,read}),sourceFailure,path);
 }
});
test('direct combined admission rejects paired current workflow and directory blob forgeries independently of read',()=>{
 for(const path of[workflows[0][0],'release']){
  const forged=(ref,p)=>p===path&&(ref==='HEAD'||ref===head)?'identical forged combined current blob':blob(ref,p);
  assert.throws(()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,blob:forged}),sourceFailure,path);
 }
});
for(const ref of['HEAD',head,expectedBase])test('current or base ledger overrides cannot disappear through the CI stack: '+ref,()=>{
 const readContent=(r,p)=>{
  if(r!==ref||p!==ledger)return content(r,p);
  const changed=JSON.parse(content(r,p));changed.releaseMachineryRepair20261014.emailAuthority=true;return JSON.stringify(changed);
 };
 assert.throws(()=>verifyCiExecutionAllowance(c,{head,readContent}),sourceFailure);
 assert.throws(()=>verifyReleaseMachineryRepair(repair,{head,readContent}),sourceFailure);
 assert.throws(()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,content:readContent}),sourceFailure);
});
test('projected or unrelated source heads cannot substitute for the actual raw CI head',()=>{
 for(const wrong of[c.base,repair.base,'f'.repeat(40)]){
  assert.throws(()=>verifyCiExecutionAllowance(c,{head:wrong}),/HEAD|head|source drift/i);
  assert.throws(()=>verifyReleaseMachineryRepair(repair,{head:wrong}),/HEAD|head|source drift/i);
 }
});
test('omitted raw CI paths remain visible to CI machinery and direct combined supplied diff checks',()=>{
 const readDiff=(a,b)=>b==='HEAD'||b===head?[]:nativeDiff(a,b);
 assert.throws(()=>verifyCiExecutionAllowance(c,{head,readDiff}),sourceFailure);
 assert.throws(()=>verifyReleaseMachineryRepair(repair,{head,readDiff}),sourceFailure);
 assert.throws(()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,diff:readDiff}),sourceFailure);
});
test('direct combined admission rechecks supplied diffs at both projected761 and projected685',()=>{
 for(const projected of[c.base,repair.base]){
  let visits=0;const diff=(a,b)=>{if(b===projected){visits++;return['unreviewed-ci-projected-path.mjs'];}return nativeDiff(a,b);};
  assert.throws(()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,diff}),sourceFailure);assert(visits>0,'Supplied projected diff must actually be observed: '+projected);
 }
});
test('direct combined admission rechecks supplied historical source diffs after the CI projections',()=>{
 let visits=0;const source=record.combinedFinite20261014.source,diff=(a,b)=>{if(b===source){visits++;return['unreviewed-ci-historical-path.mjs'];}return nativeDiff(a,b);};
 assert.throws(()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,diff}),sourceFailure);assert(visits>0);
});
test('false raw CI ancestry remains visible to CI machinery and direct combined checks',()=>{
 const isAncestor=(a,b)=>b==='HEAD'||b===head?false:nativeAncestor(a,b);
 assert.throws(()=>verifyCiExecutionAllowance(c,{head,isAncestor}),sourceFailure);
 assert.throws(()=>verifyReleaseMachineryRepair(repair,{head,isAncestor}),sourceFailure);
 assert.throws(()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,ancestor:isAncestor}),sourceFailure);
});
test('direct combined admission rechecks false ancestry at projected761 and projected685',()=>{
 for(const projected of[c.base,repair.base]){
  let visits=0;const ancestor=(a,b)=>{if(b===projected){visits++;return false;}return nativeAncestor(a,b);};
  assert.throws(()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,ancestor}),sourceFailure);assert(visits>0,'Supplied projected ancestry must actually be observed: '+projected);
 }
});
test('direct combined admission rechecks false historical source ancestry after the CI projections',()=>{
 let visits=0;const source=record.combinedFinite20261014.source,ancestor=(a,b)=>{if(b===source){visits++;return false;}return nativeAncestor(a,b);};
 assert.throws(()=>verifyCombinedFinite(record.combinedFinite20261014,{...combinedOptions,ancestor}),sourceFailure);assert(visits>0);
});
test('a successful CI admission cannot cache away a later paired current-reader mutation',()=>{
 let poisoned=false,visits=0;const path=workflows[0][0],read=(ref,p)=>{if(p===path&&(ref==='HEAD'||ref===head)){visits++;if(poisoned)return'identical newly forged CI workflow';}return blob(ref,p);};
 verifyCiExecutionAllowance(c,{head,read});const before=visits;assert(before>0);poisoned=true;
 assert.throws(()=>verifyCiExecutionAllowance(c,{head,read}),sourceFailure);assert(visits>before,'Both current callback spellings must stay fresh after a successful admission');
});

import {ciExecutionAuthenticatedContent} from '../release/ci-execution-scope-20261014.mjs';
test('the active CI bridge preserves native authentication of a supplied historical non-base repair source',()=>{
 const source=repair.source,path='release/immutable-git-facts.mjs';assert.notEqual(source,c.base);assert(repair.paths.includes(path));
 let visits=0;const read=(ref,p)=>{if(ref===source&&p===path){visits++;return'fabricated historical repair source';}return blob(ref,p);};
 assert.throws(()=>verifyReleaseMachineryRepair(repair,{head,read}),sourceFailure);
 assert(visits>0,'The supplied historical source must be read and authenticated against native Git at that same ref and path');
});
test('CI authenticated content rejects historical non-base SHA overrides against their exact native ref and path',()=>{
 const view=ciExecutionHistoricalView();
 for(const alias of['HEAD',head]){
  const substituted=(ref,path)=>ref===alias&&path===ledger?blob(ref,path):content(ref,path);
  assert.throws(()=>ciExecutionAuthenticatedContent(substituted,view)('HEAD',ledger),sourceFailure,'A current content callback must not substitute a genuine blob ID: '+alias);
  assert.throws(()=>verifyReleaseMachineryRepair(repair,{head,readContent:substituted}),sourceFailure,'Direct repair content must reject blob ID substitution: '+alias);
 }
 for(const historical of[c.source,repair.source]){
  assert.notEqual(historical,c.base);assert.notEqual(historical,head);let visits=0;
  const readContent=(ref,path)=>{const actual=content(ref,path);if(ref===historical&&path===ledger){visits++;return actual+'\nforeign historical content override\n';}return actual;};
  const authenticated=ciExecutionAuthenticatedContent(readContent,view);
  assert.throws(()=>authenticated(historical,ledger),sourceFailure,historical);
  assert(visits>0,'The historical callback cannot be replaced by an unchecked projected base read');
 }
});
test('defaultReader true cannot suppress a non-null caller callback or admit equal forged current aliases',()=>{
 let genuineVisits=0;const genuine=(ref,path)=>{genuineVisits++;return blob(ref,path);};
 const genuineView=ciExecutionHistoricalView(genuine,{defaultReader:true});genuineView.read('HEAD',workflows[0][0]);
 assert(genuineVisits>0,'A non-null genuine caller still executes when defaultReader true is supplied');
 for(const path of[workflows[0][0],'release']){
  let forgedVisits=0;const forged=(ref,p)=>{if(p===path&&(ref==='HEAD'||ref===head)){forgedVisits++;return'identical forged callback aliases despite defaultReader true';}return blob(ref,p);};
  assert.throws(()=>ciExecutionHistoricalView(forged,{defaultReader:true}).read('HEAD',path),sourceFailure,path);
  assert(forgedVisits>0,'The non-null forged callback must execute and be rejected: '+path);
 }
});
