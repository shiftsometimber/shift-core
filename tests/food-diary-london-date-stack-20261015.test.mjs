import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {FOOD_DIARY_LONDON_DATE_POLICY,verifyFoodDiaryLondonDateRepair,foodDiaryLondonDateHistoricalView,foodDiaryLondonDateAuthenticatedRead,foodDiaryLondonDateAuthenticatedContent,foodDiaryLondonDateAuthenticatedDiff,foodDiaryLondonDateAuthenticatedAncestor,foodDiaryLondonDateReaderProvenance} from '../release/food-diary-london-date-scope-20261015.mjs';
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
 for(const ref of['HEAD',head]){assert.deepEqual(food.diff(allowance.base,ref),nativeDiff(allowance.base,c.base),'The admitted native Food diff must use its exact projected CI source for both current aliases');assert.throws(()=>food.ancestor(c.maintenanceSource,ref),error=>error.status===1,'Food maintenance cannot become an ancestor of the earlier projected CI source');}
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
 assert.equal(c.compositionSynchronousHistoryScope,true,'The finite Food receipt must explicitly own only the existing synchronous history scope around the public verifier');
 const composition='release/approved-runtime-composition.mjs',originalSignature='export function verifyReconciledRelease(read=defaultReconciliationRead){\n',privateSignature='function verifyReconciledReleaseOriginal(read){\n',bodyEnd='\n}\nconst mappedCompositionReaders=new WeakSet();',originalBody=content(c.base,composition).split(originalSignature)[1].split(bodyEnd)[0],currentBody=content(foodHead,composition).split(privateSignature)[1].split(bodyEnd)[0];assert.equal(currentBody,originalBody,'Every original verifier body byte and callback assertion remains exact');assert(content(foodHead,composition).includes(originalSignature+' return withImmutableHistoryVerification(()=>verifyReconciledReleaseOriginal(read));\n}\n'+privateSignature),'Only the exact synchronous wrapper is allowed');
});
test('the exact original21 CI witness production60 and configurations survive the runtime repair',()=>{
 assert.equal(blob(foodHead,ciWitness),'b5aee29bfa2e7e4fa01de2585df074eb3ee40907');assert.equal(content(foodHead,ciWitness),content(c.base,'tests/ci-execution-stack-20261014.test.mjs'));assert.equal(blob(foodHead,'tests/ci-execution-stack-20261014.test.mjs'),'cec36f99782ed977a23827bfa67d400876948d25');
 const production='.github/workflows/cloudflare-production-promote.yml';assert.match(content(foodHead,production),/^    timeout-minutes: 60$/m);
 for(const path of[production,'.github/workflows/production-completion-proof.yml','.github/workflows/approved-ranking-proof.yml','wrangler.jsonc','wrangler.coaching.jsonc','package.json','package-lock.json','worker-entry-v6.js','worker.js','frontend','public','my-timber-app','shift-coach/worker.mjs','member-state-fast-v1.js','member-experience/health-routes.mjs'])assert.equal(blob(foodHead,path),blob(c.base,path),'Protected source changed: '+path);
 assert.equal(c.ciProgrammeConcurrency,true,'The finite Food receipt must explicitly own Programme source-gate concurrency');
 const programme='.github/workflows/programme-day-preview.yml',pairs=FOOD_DIARY_LONDON_DATE_POLICY.inverses[programme];assert.equal(pairs.length,1,'One exact Programme block replacement is authorised');
 const [[before,after]]=pairs,original=content(c.base,programme),current=content(foodHead,programme);assert.equal(original.split(before).length,2);assert.equal(current.split(after).length,2);assert.equal(current,original.replace(before,after),'Programme timeout30, read-only permission, install, browser and every byte outside the single source-gate block remain exact');
 assert.match(current,/^    timeout-minutes: 30$/m);assert.match(current,/^permissions:\n  contents: read$/m);
});
test('the exact Programme aggregate starts every original gate and waits for all failures with isolated token scope and complete logs',()=>{
 const workflow='.github/workflows/programme-day-preview.yml',[[before,after]]=FOOD_DIARY_LONDON_DATE_POLICY.inverses[workflow];
 const original=content(c.base,workflow),current=content(foodHead,workflow),marker='        run: |\n';
 assert.equal(after.split(marker).length,2,'One literal aggregate shell block is required');
 const embedded=after.slice(after.indexOf(marker)+marker.length).split('\n').map(line=>{if(!line)return'';assert(line.startsWith('          '),'Exact workflow shell indentation required');return line.slice(10);}).join('\n');
 const commands=[...before.matchAll(/^      - run: (node [^\n]+)$/gm)].map(match=>match[1]);assert.equal(commands.length,3,'All three original command bodies must remain');
 const roles=['source-tests','b1-scope','growth-preflight'];for(const command of commands)assert.equal(embedded.split(command).length,2,'One exact original command remains in the aggregate: '+command);
 const browser='      - run: node scripts/verify-programme-day.cjs\n',suffix=original.slice(original.indexOf(before)+before.length);
 assert(original.includes(browser));assert(current.endsWith(suffix),'Install, browser and artifact steps remain byte exact after the aggregate');assert(current.indexOf(browser)>current.indexOf(after)+after.length-1,'The original browser proof follows successful completion of the aggregate');
 const temporary=mkdtempSync(join(tmpdir(),'shift-programme-aggregate-')),quote=value=>"'"+value.replaceAll("'","'\"'\"'")+"'";
 try{
  const fake=join(temporary,'fake-original-gate.mjs');
  writeFileSync(fake,`import {appendFileSync,existsSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const role=process.argv[2],root=process.env.SHIFT_GATE_FIXTURE,roles=['source-tests','b1-scope','growth-preflight'];
const token=Object.hasOwn(process.env,'GITHUB_TOKEN')?'present':'absent';
appendFileSync(join(root,'events.txt'),'start:'+role+'\\n');writeFileSync(join(root,role+'.started'),token);
console.log(role+':start token='+token);console.error(role+':stderr');
const deadline=Date.now()+3000;while(!roles.every(r=>existsSync(join(root,r+'.started')))){if(Date.now()>deadline){console.error('All three gates were not started concurrently');process.exit(91);}await new Promise(resolve=>setTimeout(resolve,5));}
await new Promise(resolve=>setTimeout(resolve,process.env.SHIFT_GATE_FAIL===role?0:80+roles.indexOf(role)*30));
console.log(role+':complete');appendFileSync(join(root,'events.txt'),'finish:'+role+'\\n');writeFileSync(join(root,role+'.finished'),'complete');
process.exit(process.env.SHIFT_GATE_FAIL===role?7:0);
`);
  for(const failure of['',...roles]){
   const fixture=join(temporary,failure||'all-success');mkdirSync(fixture);
   execFileSync('git',['init','--quiet',fixture]);execFileSync('git',['-C',fixture,'-c','core.hooksPath=/dev/null','-c','commit.gpgsign=false','-c','user.name=Programme fixture','-c','user.email=fixture@example.invalid','commit','--quiet','--allow-empty','-m','Controlled shell gate fixture']);
   let script=embedded;commands.forEach((command,index)=>{script=script.replace(command,quote(process.execPath)+' '+quote(fake)+' '+roles[index]);});
   const result=spawnSync('bash',['--noprofile','--norc','-e','-o','pipefail','-c',script],{cwd:fixture,encoding:'utf8',timeout:8000,maxBuffer:1e6,env:{...process.env,GITHUB_TOKEN:'controlled-programme-token',SHIFT_GATE_FIXTURE:fixture,SHIFT_GATE_FAIL:failure}});
   assert.equal(result.error,undefined,'Every controlled aggregate must reach terminal output');assert.equal(result.signal,null);assert.equal(result.status,failure?1:0,'Aggregate status must reflect '+(failure||'all-success'));
   const events=readFileSync(join(fixture,'events.txt'),'utf8').trim().split('\n');assert.deepEqual(events.slice(0,3).sort(),roles.map(role=>'start:'+role).sort(),'All three gates start before any finishes');assert.equal(events.length,6);assert.deepEqual(events.slice(3).sort(),roles.map(role=>'finish:'+role).sort());
   const proof=join(fixture,'programme-day-proof','source-gates');assert.deepEqual(readdirSync(proof).filter(name=>name.endsWith('.log')).sort(),roles.map(role=>role+'.log').sort(),'Three separate complete logs are retained');
   for(const role of roles){
    assert.equal(readFileSync(join(fixture,role+'.finished'),'utf8'),'complete','The aggregate must wait for every child even after '+(failure||'success'));
    const log=readFileSync(join(proof,role+'.log'),'utf8'),expectedToken=role==='growth-preflight'?'present':'absent';assert.match(log,new RegExp('^'+role+':start token='+expectedToken+'$','m'));assert.match(log,new RegExp('^'+role+':stderr$','m'));assert.match(log,new RegExp('^'+role+':complete$','m'));for(const other of roles.filter(other=>other!==role))assert(!log.includes(other+':'),'Child logs stay separate');
    assert.equal(readFileSync(join(fixture,role+'.started'),'utf8'),expectedToken,'Only growth inherits GITHUB_TOKEN');
   }
   const statuses=Object.fromEntries(readFileSync(join(proof,'status.tsv'),'utf8').trim().split('\n').map(line=>line.split('\t')));assert.deepEqual(statuses,Object.fromEntries(roles.map(role=>[role,failure===role?'7':'0'])),'All three terminal statuses are captured without masking an early failure');
  }
 }finally{rmSync(temporary,{recursive:true,force:true});}
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

import {ciExecutionAuthenticatedRead as nativeOriginCiAuthenticatedRead} from '../release/ci-execution-scope-20261014.mjs';

test('native Food origin belongs only to the exact admitted private reader while foreign callbacks remain fresh',()=>{
 assert.equal(c.nativeProvenance,true,'The finite Food record must explicitly own the native-origin routing');
 const view=foodAssertions,proof=foodDiaryLondonDateReaderProvenance(view.read);
 assert.equal(proof.kind,'read');assert.equal(proof.view,view);assert.equal(proof.nativeSource,true);assert(Object.isFrozen(proof));
 assert.notEqual(foodDiaryLondonDateReaderProvenance(view.blob)?.nativeSource,true,'An unguarded blob accessor cannot acquire native reader origin');
 for(const path of[runtime,'release'])for(const ref of['HEAD',head,c.base,ciBase])assert.equal(view.read(ref,path),blob(ref==='HEAD'||ref===head?c.base:ref,path),'Native file and directory values retain exact reference semantics');
 const calls=[];let poisoned=false;
 const supplied=(ref,path)=>{calls.push([ref,path]);return poisoned&&ref===head?'later forged native-looking callback':blob(ref,path);};
 Object.assign(supplied,{nativeSource:true,defaultReader:true,view,proof,provenance:{...proof}});
 assert.equal(foodDiaryLondonDateReaderProvenance(supplied),null);
 const read=foodDiaryLondonDateAuthenticatedRead(supplied,view);assert.equal(read('HEAD',runtime),blob(c.base,runtime));
 assert.deepEqual(calls,[['HEAD',runtime],[head,runtime],[c.base,runtime]],'Properties copied from a native proof cannot skip any actual callback');
 poisoned=true;assert.throws(()=>read('HEAD',runtime),sourceFailure,'A previous custom result cannot hide later source changes');
 const genuineContent=foodDiaryLondonDateAuthenticatedRead(content,view);assert.equal(genuineContent('HEAD',runtime),content(c.base,runtime),'A genuine custom content reader must retain its original bytes result');
 assert.throws(()=>foodDiaryLondonDateAuthenticatedRead(blob,{...view,nativeSource:true})('HEAD',runtime),/independently admitted private view/i);
});

test('the native CI shortcut is current-only and cannot be borrowed by wrappers copies or forged source functions',()=>{
 const ci=ciExecutionHistoricalView(),food=ci.foodDiaryLondonDateContext,native=food.read,proof=foodDiaryLondonDateReaderProvenance(native);
 assert.equal(proof.view,food);assert.equal(proof.nativeSource,true);
 for(const path of[runtime,'release'])for(const ref of['HEAD',head,ciBase])assert.equal(ci.read(ref,path),blob(ciBase,path),'Canonical current CI aliases still select only the original CI baseline');
 const stage={rawHead:c.base,head:ciBase,authentic:(value,ref,path,actual=c.base)=>value===blob(actual,path)||value===content(actual,path)};
 for(const kind of['wrapped','bound']){
  const calls=[],reader=kind==='wrapped'?(ref,path)=>{calls.push([ref,path]);return native(ref,path);}:native.bind(null);
  assert.equal(foodDiaryLondonDateReaderProvenance(reader),null);
  let checks=0;const copy={...stage,authentic:(...args)=>{checks++;return stage.authentic(...args);},foodDiaryLondonDateContext:food,nativeSource:true,provenance:proof};
  assert.equal(nativeOriginCiAuthenticatedRead(reader,copy)('HEAD',runtime),blob(ciBase,runtime));assert.equal(checks,3,'A wrapped or bound reader with a copied view must retain all original CI authentication checks');
  if(kind==='wrapped')assert.deepEqual(calls,[['HEAD',runtime],[c.base,runtime],[ciBase,runtime]]);
 }
 const historical=nativeOriginCiAuthenticatedRead(native,stage);
 assert.throws(()=>historical(head,runtime),sourceFailure,'Food raw HEAD is historical to the inner CI stage and must retain the original same-ref fourth-head rejection');
 assert.equal(historical(c.source,runtime),blob(c.source,runtime),'A genuinely literal historical source remains literal');
 let visits=0;const forged=(ref,path)=>{visits++;return ref==='HEAD'||ref===c.base?'equal forged source aliases':native(ref,path);};Object.assign(forged,{nativeSource:true,defaultReader:true,proof,view:food});
 assert.throws(()=>nativeOriginCiAuthenticatedRead(forged,{...stage,foodDiaryLondonDateContext:food,proof,nativeSource:true})('HEAD',runtime),sourceFailure);assert(visits>0,'Forged provenance must execute the actual callback and fail its native source authentication');
});

import {ciExecutionNativeReaderProvenance as nativeCiRepairProvenance} from '../release/ci-execution-scope-20261014.mjs';
import {releaseMachineryRepairAuthenticatedRead as nativeCiRepairRead} from '../release/release-machinery-repair-scope-20261014.mjs';
import nativeCiRepairChildProcess from 'node:child_process';
import {syncBuiltinESMExports as nativeCiRepairSyncBuiltins} from 'node:module';

test('canonical native CI repair origin preserves paired current guards and exact historical references',()=>{
 assert.equal(c.nativeCiRepairProvenance,true,'The finite Food record must explicitly own native CI to repair identity routing');
 const ci=ciExecutionHistoricalView(),proof=nativeCiRepairProvenance(ci.read);
 assert.equal(proof.kind,'read');assert.equal(proof.view,ci);assert(Object.isFrozen(proof));
 assert.equal(nativeCiRepairProvenance(ci.blob),null,'Unguarded CI blob functions cannot acquire paired-reader origin');
 assert.equal(nativeCiRepairProvenance(ci.foodDiaryLondonDateContext.read),null,'The separate Food capability cannot impersonate the exact public CI reader');
 const repairView=releaseMachineryRepairHistoricalView();
 for(const path of[runtime,'release']){
  for(const ref of['HEAD',head,ciBase])assert.equal(repairView.read(ref,path),blob(repairBase,path),'Canonical current repair aliases select only their exact original repair baseline');
  assert.equal(repairView.read(c.base,path),blob(ciBase,path),'A historical Food base retains its existing CI projection rather than becoming a repair-current alias');
  for(const ref of[repairBase,c.source])assert.equal(repairView.read(ref,path),blob(ref,path),'Other literal historical refs retain exact native values');
 }
 const guardedPath='release',expected=blob(repairBase,guardedPath),calls=[],nativeExec=nativeCiRepairChildProcess.execFileSync;
 try{
  nativeCiRepairChildProcess.execFileSync=function(bin,args,...rest){if(bin==='git')calls.push([...args]);return nativeExec.call(this,bin,args,...rest);};nativeCiRepairSyncBuiltins();
  assert.equal(repairView.read('HEAD',guardedPath),expected);assert.equal(repairView.read('HEAD',guardedPath),expected);
 }finally{nativeCiRepairChildProcess.execFileSync=nativeExec;nativeCiRepairSyncBuiltins();}
 const count=expectedArgs=>calls.filter(args=>JSON.stringify(args)===JSON.stringify(expectedArgs)).length;
 assert(count(['ls-files','-v','-z'])>=4,'Each of two warmed canonical reads must retain native tracked-source visibility at entry and exit');
 assert(count(['diff','--no-renames','--name-only','HEAD','--'])>=4,'Each warmed canonical read must retain working-source entry and exit checks');
 assert(count(['diff','--no-renames','--cached','--name-only','--'])>=4,'Each warmed canonical read must retain staged-source entry and exit checks');
 assert(count(['rev-parse','HEAD'])>=4,'Each warmed canonical read must recheck actual raw HEAD at entry and exit');
});

test('foreign CI readers flags wrappers copied views and later poisoning cannot borrow native repair origin',()=>{
 const ci=ciExecutionHistoricalView(),proof=nativeCiRepairProvenance(ci.read);assert.equal(proof.view,ci);
 assert.throws(()=>releaseMachineryRepairHistoricalView(ci.read,{defaultReader:true}),sourceFailure,'A genuine canonical reader from a different source stage cannot become the raw Food source through defaultReader flags');
 const stage={rawHead:ciBase,head:repairBase,affected:()=>true,authentic:(value,ref,path)=>value===blob(ciBase,path)||value===content(ciBase,path)};
 for(const kind of['wrapped','bound']){
  const calls=[],reader=kind==='wrapped'?(ref,path)=>{calls.push([ref,path]);return ci.read(ref,path);}:ci.read.bind(null);
  Object.assign(reader,{nativeSource:true,defaultReader:true,proof,view:ci});assert.equal(nativeCiRepairProvenance(reader),null);
  let checks=0;const copy={...stage,ciExecutionContext:ci,proof,nativeSource:true,authentic:(...args)=>{checks++;return stage.authentic(...args);}};
  assert.equal(nativeCiRepairRead(reader,copy,{defaultReader:false})('HEAD',runtime),blob(repairBase,runtime));assert.equal(checks,2,'A foreign wrapper with a copied view must retain both original repair-current authentication checks');
  if(kind==='wrapped')assert.deepEqual(calls,[['HEAD',runtime],[ciBase,runtime],[repairBase,runtime]]);
 }
 let poisoned=false,visits=0;const supplied=(ref,path)=>{visits++;return poisoned&&(ref==='HEAD'||ref===ciBase)?'later forged native CI aliases':ci.read(ref,path);};
 Object.assign(supplied,{nativeSource:true,defaultReader:true,proof,view:ci,provenance:{...proof}});assert.equal(nativeCiRepairProvenance(supplied),null);
 const custom=nativeCiRepairRead(supplied,{...stage,proof,nativeSource:true},{defaultReader:false});assert.equal(custom('HEAD',runtime),blob(repairBase,runtime));const before=visits;poisoned=true;assert.throws(()=>custom('HEAD',runtime),sourceFailure);assert(visits>before,'No previous foreign callback result may be reused');
 const suppliedContent=(ref,path)=>content(ref==='HEAD'?ciBase:ref,path);assert.equal(nativeCiRepairRead(suppliedContent,stage,{defaultReader:false})('HEAD',runtime),content(repairBase,runtime),'A valid foreign content callback keeps its original bytes result');
 const historicalBody="  }return reader(defaultReader&&r==='HEAD'?view.rawHead:r,p);";
 assert(content(foodHead,'release/release-machinery-repair-scope-20261014.mjs').includes(historicalBody),'Existing historical repair routing remains exact');
 assert(content(foodHead,'release/ci-execution-scope-20261014.mjs').includes('if(view.head!==view.rawHead&&!nativeDefault)assert(view.authentic(value,r,p,r)'),'The explicit historical same-ref fourth-head authentication remains exact');
});
