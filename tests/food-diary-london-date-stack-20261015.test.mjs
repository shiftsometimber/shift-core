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
 for(const path of[production,'.github/workflows/production-completion-proof.yml','.github/workflows/approved-ranking-proof.yml','wrangler.jsonc','wrangler.coaching.jsonc','package.json','package-lock.json','worker-entry-v6.js','worker.js','frontend','public','my-timber-app','shift-coach/worker.mjs','member-state-fast-v1.js','member-experience/health-routes.mjs']){if(FOOD_DIARY_LONDON_DATE_POLICY.ciExecutionWorkflowPaths.includes(path)){const restored=executionOriginalCiWorkflow(path,content(foodHead,path));assert.equal(restored,content(c.base,path),'Only the exact authorised CI orchestration may change protected workflow bytes: '+path);assert.equal(execFileSync('git',['hash-object','--stdin'],{input:restored,encoding:'utf8'}).trim(),blob(c.base,path),'The exact inverse must restore the original protected workflow Git blob: '+path);}else assert.equal(blob(foodHead,path),blob(c.base,path),'Protected source changed: '+path);}
 assert.equal(c.ciProgrammeConcurrency,true,'The finite Food receipt must explicitly own Programme source-gate concurrency');
 const programme='.github/workflows/programme-day-preview.yml',pairs=FOOD_DIARY_LONDON_DATE_POLICY.inverses[programme];assert.equal(pairs.length,2,'Only the original Programme aggregate and its exact bounded two-slot successor are authorised');
 const original=content(c.base,programme),current=content(foodHead,programme);assert.equal(executionOriginalCiWorkflow(programme,current),original,'Programme timeout30, read-only permission, install, browser and every byte outside the exact source-gate replacements remain exact');assert.equal(execFileSync('git',['hash-object','--stdin'],{input:executionOriginalCiWorkflow(programme,current),encoding:'utf8'}).trim(),blob(c.base,programme),'The exact Programme inverse restores its original Git blob');
 assert.match(current,/^    timeout-minutes: 30$/m);assert.match(current,/^permissions:\n  contents: read$/m);
});
test('the exact Programme aggregate starts every original gate and waits for all failures with isolated token scope and complete logs',()=>{
 const workflow='.github/workflows/programme-day-preview.yml',pairs=FOOD_DIARY_LONDON_DATE_POLICY.inverses[workflow],before=pairs[0][0],after=pairs.at(-1)[1];
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
const deadline=Date.now()+3000;while(!roles.slice(0,2).every(r=>existsSync(join(root,r+'.started')))||(role==='source-tests'&&!existsSync(join(root,'growth-preflight.started')))){if(Date.now()>deadline){console.error('Two-slot gate start or queued third gate did not complete');process.exit(91);}await new Promise(resolve=>setTimeout(resolve,5));}
if(role==='growth-preflight'&&!existsSync(join(root,'b1-scope.finished'))){console.error('The third gate started before an execution slot was released');process.exit(92);}
await new Promise(resolve=>setTimeout(resolve,role==='b1-scope'?30:80+roles.indexOf(role)*30));
console.log(role+':complete');appendFileSync(join(root,'events.txt'),'finish:'+role+'\\n');writeFileSync(join(root,role+'.finished'),'complete');
process.exit(process.env.SHIFT_GATE_FAIL===role?7:0);
`);
  for(const failure of['',...roles]){
   const fixture=join(temporary,failure||'all-success');mkdirSync(fixture);
   execFileSync('git',['init','--quiet',fixture]);execFileSync('git',['-C',fixture,'-c','core.hooksPath=/dev/null','-c','commit.gpgsign=false','-c','user.name=Programme fixture','-c','user.email=fixture@example.invalid','commit','--quiet','--allow-empty','-m','Controlled shell gate fixture']);
   let script=embedded;for(const [snippet,replacement]of[["const {ensureReviewedHistory}=await import('./shift-coach/release-contract.mjs');","const {ensureReviewedHistory}=await (async()=>{if(Object.hasOwn(process.env,'GITHUB_TOKEN'))throw Error('Hydrator initialisation token grant forbidden');return {ensureReviewedHistory:()=>{if(Object.hasOwn(process.env,'GITHUB_TOKEN'))throw Error('Hydrator token grant forbidden');}};})();"],["const {ensureCombinedOriginalGpSource}=await import('./release/combined-original-gp-object-20261014.mjs');","const {ensureCombinedOriginalGpSource}=await (async()=>{if(Object.hasOwn(process.env,'GITHUB_TOKEN'))throw Error('Hydrator initialisation token grant forbidden');return {ensureCombinedOriginalGpSource:()=>{if(Object.hasOwn(process.env,'GITHUB_TOKEN'))throw Error('Hydrator token grant forbidden');}};})();"]]){assert.equal(script.split(snippet).length,2,'Exactly one known history hydration import is substituted in this empty controlled Git fixture');script=script.replace(snippet,replacement);}commands.forEach((command,index)=>{assert.equal(script.split(command).length,2,'Exactly one original command fixture replacement is required');script=script.replace(command,quote(process.execPath)+' '+quote(fake)+' '+roles[index]);});
   const result=spawnSync('bash',['--noprofile','--norc','-e','-o','pipefail','-c',script],{cwd:fixture,encoding:'utf8',timeout:8000,maxBuffer:1e6,env:{...process.env,GITHUB_TOKEN:'controlled-programme-token',SHIFT_GATE_FIXTURE:fixture,SHIFT_GATE_FAIL:failure}});
   assert.equal(result.error,undefined,'Every controlled aggregate must reach terminal output');assert.equal(result.signal,null);assert.equal(result.status,failure?1:0,'Aggregate status must reflect '+(failure||'all-success'));
   const events=readFileSync(join(fixture,'events.txt'),'utf8').trim().split('\n');assert.deepEqual(events.slice(0,2).sort(),roles.slice(0,2).map(role=>'start:'+role).sort(),'Exactly the first two original gates occupy the initial slots');assert.equal(events.length,6);assert(events.indexOf('start:growth-preflight')>events.indexOf('finish:b1-scope'),'The queued third gate starts after a slot is released');let active=0,maximum=0;for(const event of events){active+=event.startsWith('start:')?1:-1;maximum=Math.max(maximum,active);assert(active>=0&&active<=2,'Every original gate obeys the two-slot bound');}assert.equal(maximum,2);assert.equal(active,0);assert.deepEqual(events.filter(event=>event.startsWith('finish:')).sort(),roles.map(role=>'finish:'+role).sort(),'All three gates still finish even after a failure');
   const proof=join(fixture,'programme-day-proof','source-gates');assert.deepEqual(readdirSync(proof).filter(name=>name.endsWith('.log')).sort(),roles.flatMap(role=>[role+'.log',role+'.stdout.log',role+'.stderr.log']).sort(),'All three separate complete logs and both stream logs are retained');
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
// Orchestration witnesses only. No original application command runs here.
import {spawn as ciPoolSpawn,execFileSync as ciPoolExec} from 'node:child_process';
import {appendFileSync as ciPoolAppend,existsSync as ciPoolExists,mkdirSync as ciPoolMkdir,mkdtempSync as ciPoolTemp,readFileSync as ciPoolRead,rmSync as ciPoolRemove,writeFileSync as ciPoolWrite} from 'node:fs';
import {tmpdir as ciPoolTmpdir} from 'node:os';
import {join as ciPoolJoin} from 'node:path';
import {createHash as ciPoolHash} from 'node:crypto';
import {foodDiaryLondonDateOriginalCiWorkflow as executionOriginalCiWorkflow} from '../release/food-diary-london-date-scope-20261015.mjs';

const ciPoolQuote=s=>"'"+s.replaceAll("'","'\"'\"'")+"'",ciPoolRoles=['release-contract','source-tests','b1-source'];
const ciPoolDelay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function ciPoolUntil(check,label,timeout=6000){const deadline=Date.now()+timeout;while(!check()){assert(Date.now()<deadline,'Timed out waiting for '+label);await ciPoolDelay(5);}}
function ciPoolJson(path){return JSON.parse(ciPoolRead(path,'utf8'));}

function ciPoolFixture(pool,{scenario='normal',failRole='',tokenTuple='original'}={}){
 const root=ciPoolTemp(ciPoolJoin(ciPoolTmpdir(),'shift-ci-pool-witness-')),poolId=JSON.parse(pool.script.match(/^const poolId=(.+);$/m)[1]),roles=pool.tasks.map(task=>task.id),trace=ciPoolJoin(root,'fixture-events.jsonl');assert.equal(roles.length,3);
 assert(['join(process.env.RUNNER_TEMP||tmpdir(),\'ci-source-proof\',poolId)',"join('programme-day-proof','source-gates')"].includes(pool.proofDirExpression),'Only the actual admitted proof-directory expressions are supported');
 const proof=poolId==='programme'?ciPoolJoin(root,'programme-day-proof','source-gates'):ciPoolJoin(root,'ci-source-proof',poolId);
 const git=(...args)=>ciPoolExec('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
 git('init','-q');git('config','user.name','Private CI pool fixture');git('config','user.email','fixture@example.invalid');git('config','core.hooksPath','/dev/null');git('config','commit.gpgsign','false');git('commit','--quiet','--allow-empty','-m','Private source binding');
 const initial={head:git('rev-parse','HEAD').trim(),tree:git('rev-parse','HEAD^{tree}').trim()};ciPoolWrite(trace,'');
 const childPath=ciPoolJoin(root,'controlled-child.mjs');
 ciPoolWrite(childPath,`import {appendFileSync,existsSync,mkdirSync,readFileSync,unlinkSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
const id=process.argv[2],root=process.env.SHIFT_POOL_FIXTURE,proof=process.env.SHIFT_POOL_PROOF_DIR,trace=join(root,'fixture-events.jsonl');
const event=type=>appendFileSync(trace,JSON.stringify({type,id,pid:process.pid})+'\\n');
const output=phase=>{process.stdout.write(id+':stdout:'+phase+'\\n');process.stderr.write(id+':stderr:'+phase+'\\n');};
process.on('SIGTERM',()=>{event('terminated');writeFileSync(join(root,id+'.terminated'),'SIGTERM');process.exit(143);});
event('started');writeFileSync(join(root,id+'.started'),JSON.stringify({pid:process.pid,token:Object.hasOwn(process.env,'GITHUB_TOKEN'),tokenMatchesFixture:process.env.GITHUB_TOKEN==='controlled-fixture-token',testContext:Object.hasOwn(process.env,'NODE_TEST_CONTEXT'),preserved:process.env.SHIFT_POOL_PRESERVE==='controlled-original-environment'}));output('start');
const deadline=Date.now()+7000;while(!existsSync(join(root,id+'.release'))){if(Date.now()>deadline){output('fixture-timeout');process.exit(91);}await new Promise(resolve=>setTimeout(resolve,5));}
if(id===process.env.SHIFT_POOL_FIRST){
 if(process.env.SHIFT_POOL_SCENARIO==='log-io'){const path=join(proof,id+'.stdout.log');unlinkSync(path);mkdirSync(path);}
 if(process.env.SHIFT_POOL_SCENARIO==='status-io'){const path=join(proof,'status.tsv');unlinkSync(path);mkdirSync(path);}
 if(process.env.SHIFT_POOL_SCENARIO==='changed-head')execFileSync('git',['commit','--quiet','--allow-empty','-m','Changed only the owned fixture HEAD'],{cwd:root,stdio:'pipe'});
}
output('complete');event('finished');writeFileSync(join(root,id+'.finished'),'complete');process.exit(process.env.SHIFT_POOL_FAIL===id?7:0);
`);
 const tasks=pool.tasks.map(task=>({...task,body:'exec '+ciPoolQuote(process.execPath)+' '+ciPoolQuote(childPath)+' '+task.id}));
 if(tokenTuple!=='original'){assert.equal(poolId,'programme');assert(['missing-growth-role','forged-source-role'].includes(tokenTuple));delete tasks.find(task=>task.id==='growth-preflight').tokenRole;if(tokenTuple==='forged-source-role')tasks.find(task=>task.id==='source-tests').tokenRole='programme-growth';}
 const reviewed="const {ensureReviewedHistory}=await import('./shift-coach/release-contract.mjs');",gp="const {ensureCombinedOriginalGpSource}=await import('./release/combined-original-gp-object-20261014.mjs');";
 const hydrate=id=>`const ${id==='reviewed'?'ensureReviewedHistory':'ensureCombinedOriginalGpSource'}=(()=>{appendFileSync(process.env.SHIFT_POOL_TRACE,JSON.stringify({type:'hydrate-module',id:${JSON.stringify(id)},token:Object.hasOwn(process.env,'GITHUB_TOKEN')})+'\\n');return()=>{appendFileSync(process.env.SHIFT_POOL_TRACE,JSON.stringify({type:'hydrate-start',id:${JSON.stringify(id)},token:Object.hasOwn(process.env,'GITHUB_TOKEN')})+'\\n');if(process.env.SHIFT_POOL_SCENARIO===${JSON.stringify('hydration-'+id)})throw Object.assign(new Error('Controlled hydration failure'),{code:'FIXTURE_HYDRATION'});appendFileSync(process.env.SHIFT_POOL_TRACE,JSON.stringify({type:'hydrate-done',id:${JSON.stringify(id)},token:Object.hasOwn(process.env,'GITHUB_TOKEN')})+'\\n');};})();`;
 for(const literal of[reviewed,gp,pool.taskDeclaration])assert.equal(pool.script.split(literal).length,2,'One exact fixture substitution required');
 const script=pool.script.replace(reviewed,hydrate('reviewed')).replace(gp,hydrate('gp')).replace(pool.taskDeclaration,'const tasks=Object.freeze('+JSON.stringify(tasks)+');');
 const scriptPath=ciPoolJoin(root,'actual-pool-with-owned-fixtures.mjs');ciPoolWrite(scriptPath,script);
 const launchEnv={...process.env,RUNNER_TEMP:root,SHIFT_POOL_FIXTURE:root,SHIFT_POOL_PROOF_DIR:proof,SHIFT_POOL_FIRST:roles[0],SHIFT_POOL_TRACE:trace,SHIFT_POOL_SCENARIO:scenario,SHIFT_POOL_FAIL:failRole,SHIFT_POOL_PRESERVE:'controlled-original-environment',GITHUB_TOKEN:'controlled-fixture-token'};delete launchEnv.NODE_TEST_CONTEXT; // Fixture launch models the original top-level GitHub Actions shell.
 let stdout='',stderr='',closed=false;const child=ciPoolSpawn(process.execPath,[scriptPath],{cwd:root,env:launchEnv,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',chunk=>{stdout+=chunk;});child.stderr.on('data',chunk=>{stderr+=chunk;});
 const terminal=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>{closed=true;resolve({code,signal,stdout,stderr});});});
 return{root,proof,poolId,roles,trace,child,tasks,initial,terminal,git,get stdout(){return stdout;},get stderr(){return stderr;},
  started:id=>ciPoolExists(ciPoolJoin(root,id+'.started')),finished:id=>ciPoolExists(ciPoolJoin(root,id+'.finished')),release:id=>ciPoolWrite(ciPoolJoin(root,id+'.release'),'release'),
  state:()=>ciPoolJson(ciPoolJoin(proof,'status.json')),events:()=>ciPoolRead(trace,'utf8').trim().split('\n').filter(Boolean).map(line=>JSON.parse(line)),
  async close(){if(!closed){child.kill('SIGTERM');await Promise.race([terminal,ciPoolDelay(2500)]);if(!closed){child.kill('SIGKILL');await terminal;}}ciPoolRemove(root,{recursive:true,force:true});}};
}
async function ciPoolReleaseSchedule(f){
 const[first,second,third]=f.roles;await ciPoolUntil(()=>f.started(first)&&f.started(second),'the first two controlled slots');
 assert(!f.started(third),'The third original command must wait for an execution slot');assert(!f.finished(first));assert(!f.finished(second));
 await ciPoolUntil(()=>f.stdout.includes(first+':stdout:start')&&f.stdout.includes(second+':stderr:start'),'live progress while both children are blocked');
 assert(!f.finished(first)&&!f.finished(second),'Progress must be observable before releasing either child');
 f.release(first);await ciPoolUntil(()=>f.started(third),'The third original command taking the first completed slot');assert(f.finished(first));assert(!f.finished(second),'The next original command starts while the other source slot remains active');f.release(second);f.release(third);
}
function ciPoolAssertAllFinished(f,result,{failure='',evidenceFailure=false,sourceChanged=false}={}){
 assert.equal(result.signal,null);assert.equal(result.code,failure||evidenceFailure||sourceChanged?1:0);const state=f.state();assert.equal(state.phase,'finished');assert.equal(state.active,0);assert.equal(state.maxConcurrent,2);assert.equal(state.cancelled,null);assert.equal(state.sourceUnchanged,!sourceChanged);assert.deepEqual(state.sourceBefore,f.initial);
 assert.equal(state.results.length,3);for(const row of state.results){assert(f.finished(row.id),'Every original command must complete before aggregate terminal status');assert.equal(row.status,row.id===failure?'failed':'passed');assert.equal(row.exitCode,row.id===failure?7:0);assert.equal(row.signal,null);assert(row.startedAt&&row.finishedAt);assert.equal(row.bodySha256,ciPoolHash('sha256').update(f.tasks.find(t=>t.id===row.id).body).digest('hex'));}
 assert.equal(Math.max(...state.events.map(event=>event.active)),2,'Two real execution slots are used');assert(state.events.every(event=>event.active>=0&&event.active<=2),'The pool must never exceed its configured bound');assert.deepEqual(state.events.filter(event=>event.event==='command-started').map(event=>event.id),f.roles,'Every original command takes its declared slot in order');
 const trace=f.events(),firstChild=trace.findIndex(event=>event.type==='started');assert.deepEqual(trace.slice(0,firstChild).map(event=>[event.type,event.id]),[['hydrate-module','reviewed'],['hydrate-start','reviewed'],['hydrate-done','reviewed'],['hydrate-module','gp'],['hydrate-start','gp'],['hydrate-done','gp']],'Both hydration module initialisations and invocations finish serially before any child');assert(trace.slice(0,firstChild).every(event=>event.token===(f.poolId!=='programme')),'Programme hydration has no token; other pools preserve their original environment');
 assert.equal(state.events.at(-1).event,'pool-finished');assert.equal(state.events.at(-1).failed,Boolean(failure||evidenceFailure||sourceChanged));return state;
}
async function ciPoolTokenTupleWitness(tokenTuple){
 const f=ciPoolFixture(FOOD_DIARY_LONDON_DATE_POLICY.ciExecutionPools.programme,{tokenTuple});try{
  await ciPoolReleaseSchedule(f);const result=await f.terminal,state=ciPoolAssertAllFinished(f,result);assert.equal(state.evidenceFailed,false);assert.deepEqual(state.evidenceErrors,[]);
  const commands=ciPoolJson(ciPoolJoin(f.proof,'commands.json'));assert.deepEqual(commands.tasks,f.tasks);assert(!Object.hasOwn(commands.tasks.find(task=>task.id==='growth-preflight'),'tokenRole'));assert.equal(commands.tasks.find(task=>task.id==='source-tests').tokenRole,tokenTuple==='forged-source-role'?'programme-growth':undefined);
  const environments={};for(const id of f.roles){const env=ciPoolJson(ciPoolJoin(f.root,id+'.started'));environments[id]={token:env.token,testContext:env.testContext,preserved:env.preserved};assert.equal(env.token,false,'A missing or wrong token-role tuple cannot restore the Programme token: '+id);assert.equal(env.tokenMatchesFixture,false);assert.equal(env.testContext,false);assert.equal(env.preserved,true);
   const out=id+':stdout:start\n'+id+':stdout:complete\n',err=id+':stderr:start\n'+id+':stderr:complete\n';assert.equal(ciPoolRead(ciPoolJoin(f.proof,id+'.stdout.log'),'utf8'),out);assert.equal(ciPoolRead(ciPoolJoin(f.proof,id+'.stderr.log'),'utf8'),err);const combined=ciPoolRead(ciPoolJoin(f.proof,id+'.log'),'utf8');for(const line of(out+err).trim().split('\n'))assert(combined.includes(line+'\n'));for(const other of f.roles.filter(role=>role!==id))assert(!combined.includes(other+':'));
  }
  assert.deepEqual(ciPoolRead(ciPoolJoin(f.proof,'status.tsv'),'utf8').trim().split('\n'),f.roles.map(id=>id+'\t0'));assert.equal(ciPoolRead(ciPoolJoin(f.proof,'head.txt'),'utf8'),f.initial.head+'\n');assert.deepEqual(ciPoolJson(ciPoolJoin(f.proof,'source-final.json')),{before:f.initial,after:f.initial,unchanged:true});
  return{tokenTuple,exitCode:result.code,children:3,passed:3,maxActive:Math.max(...state.events.map(event=>event.active)),hydrationTokenAbsent:f.events().filter(event=>event.type.startsWith('hydrate-')).every(event=>event.token===false),environments,completeSeparateLogs:true,liveProgressBeforeRelease:true,sourceUnchanged:state.sourceUnchanged};
 }finally{await f.close();}
}

test('actual CI pool workflow inverses reject command cap permission environment slot omission and false-pass mutations',()=>{
 assert.deepEqual([...FOOD_DIARY_LONDON_DATE_POLICY.ciExecutionWorkflowPaths].sort(),['.github/workflows/production-completion-proof.yml','.github/workflows/approved-ranking-proof.yml','.github/workflows/shift-coach-integration.yml'].sort());
 const all=FOOD_DIARY_LONDON_DATE_POLICY.ciExecutionPools;assert.deepEqual(Object.keys(all).sort(),['completion','ranking','integration-source','integration-unit','programme'].sort());
 for(const pool of Object.values(all)){assert.equal(pool.maxConcurrent,2);assert.deepEqual(pool.hydrationOrder,['ensureReviewedHistory','ensureCombinedOriginalGpSource']);assert.equal(pool.script.split(pool.taskDeclaration).length,2);assert(pool.tasks.length>0);}
 assert.deepEqual([...FOOD_DIARY_LONDON_DATE_POLICY.ciExecutionPoolWorkflowPaths].sort(),[...FOOD_DIARY_LONDON_DATE_POLICY.ciExecutionWorkflowPaths,'.github/workflows/programme-day-preview.yml'].sort());
 for(const path of FOOD_DIARY_LONDON_DATE_POLICY.ciExecutionPoolWorkflowPaths){
  const current=content(foodHead,path),original=content(c.base,path),check=value=>assert.equal(executionOriginalCiWorkflow(path,value),original,'Every original workflow byte outside exact pool hooks must remain');check(current);
  const pool=path.includes('production-completion')?all.completion:path.includes('approved-ranking')?all.ranking:path.includes('programme-day')?all.programme:all['integration-source'];
  const embedded=path.includes('shift-coach-integration')?[all['integration-source'],all['integration-unit']]:[pool];for(const candidate of embedded){const literal=candidate.script.trimEnd().split('\n').map(line=>'          '+line+'\n').join('');assert.equal(current.split(literal).length,2,'Each controlled fixture must execute the exact actual workflow script bytes: '+path);}
  const mutations=[
   ['original command body',value=>value.replace(pool.tasks[0].body,pool.tasks[0].body+' # unauthorised body')],
   ['job cap',value=>value.replace(/timeout-minutes: (\d+)/,(_,n)=>'timeout-minutes: '+(Number(n)+1))],
   ['read-only permission',value=>value.replace('contents: read','contents: write')],
   ['original environment preservation',value=>value.replace('result.status=\'running\';result.startedAt=now();active++;',"delete env.NODE_TEST_CONTEXT;result.status='running';result.startedAt=now();active++;")],
   ['Programme token exception',value=>value.replace("task.tokenRole==='programme-growth'",'true')],
   ['maximum execution slots',value=>value.replace('const maxConcurrent=2;','const maxConcurrent=3;')],
   ['missing original child',value=>value.replace(pool.taskDeclaration,'const tasks=Object.freeze('+JSON.stringify(pool.tasks.slice(1))+');')],
   ['false aggregate pass',value=>value.replace('process.exitCode=failed?1:0;','process.exitCode=0;')],
  ];
  for(const[label,mutate]of mutations){const changed=mutate(current);assert.notEqual(changed,current,'The actual '+label+' mutation must be exercised: '+path);assert.throws(()=>check(changed),undefined,'Reject '+label+': '+path);}
 }
});

test('the actual inline pool hydrates first uses two bounded slots waits every failure and emits live complete isolated evidence',async()=>{
 for(const poolName of['completion','programme']){const pool=FOOD_DIARY_LONDON_DATE_POLICY.ciExecutionPools[poolName];for(const failure of['',...pool.tasks.map(task=>task.id)]){const f=ciPoolFixture(pool,{failRole:failure});try{
  await ciPoolReleaseSchedule(f);const result=await f.terminal,state=ciPoolAssertAllFinished(f,result,{failure});assert.equal(state.evidenceFailed,false);assert.deepEqual(state.evidenceErrors,[]);
  const commands=ciPoolJson(ciPoolJoin(f.proof,'commands.json'));assert.deepEqual(commands.tasks,f.tasks);assert.equal(commands.maxConcurrent,2);assert.deepEqual(ciPoolJson(ciPoolJoin(f.proof,'source-final.json')),{before:f.initial,after:f.initial,unchanged:true});
  for(const id of f.roles){const env=ciPoolJson(ciPoolJoin(f.root,id+'.started')),grant=poolName!=='programme'||id==='growth-preflight';assert.equal(env.token,grant);assert.equal(env.tokenMatchesFixture,grant);assert.equal(env.testContext,false);assert.equal(env.preserved,true,'Other original environment values remain unchanged');const out=id+':stdout:start\n'+id+':stdout:complete\n',err=id+':stderr:start\n'+id+':stderr:complete\n';assert.equal(ciPoolRead(ciPoolJoin(f.proof,id+'.stdout.log'),'utf8'),out);assert.equal(ciPoolRead(ciPoolJoin(f.proof,id+'.stderr.log'),'utf8'),err);const combined=ciPoolRead(ciPoolJoin(f.proof,id+'.log'),'utf8');for(const line of(out+err).trim().split('\n'))assert(combined.includes(line+'\n'),'Complete combined stdout/stderr retained: '+id);for(const other of f.roles.filter(role=>role!==id))assert(!combined.includes(other+':'),'Child evidence remains separate');}
  const tsv=ciPoolRead(ciPoolJoin(f.proof,'status.tsv'),'utf8').trim().split('\n');if(poolName==='programme'){assert.deepEqual(tsv,f.roles.map(id=>id+'\t'+(failure===id?7:0)));assert.equal(ciPoolRead(ciPoolJoin(f.proof,'head.txt'),'utf8'),f.initial.head+'\n');}else{assert.equal(tsv.length,4);assert.equal(tsv[0],'id\tstatus\texitCode\tsignal\tstartedAt\tfinishedAt');}
 }finally{await f.close();}}}
 for(const tuple of['missing-growth-role','forged-source-role'])await ciPoolTokenTupleWitness(tuple);
});

test('the actual inline pool fails closed on hydration cancellation evidence I/O and changed HEAD without abandoning owned work',async()=>{
 const pool=FOOD_DIARY_LONDON_DATE_POLICY.ciExecutionPools.completion;
 for(const scenario of['hydration-reviewed','hydration-gp','cancel','log-io','status-io','changed-head']){const f=ciPoolFixture(pool,{scenario});try{
  if(scenario.startsWith('hydration-')){const result=await f.terminal,state=f.state();assert.equal(result.code,1);assert.equal(result.signal,null);assert.equal(state.phase,'hydration-failed');assert(state.results.every(row=>row.status==='not-started'&&row.pid===null));assert(!f.events().some(event=>event.type==='started'),'Failed serial hydration starts no original command');assert.equal(state.sourceUnchanged,true);assert.equal(state.events.at(-1).failed,true);}
  else if(scenario==='cancel'){
   await ciPoolUntil(()=>f.started('release-contract')&&f.started('source-tests'),'two owned active children before cancellation');assert(!f.started('b1-source'));f.child.kill('SIGTERM');const result=await f.terminal,state=f.state();assert.equal(result.code,1);assert.equal(result.signal,null);assert.equal(state.cancelled,'SIGTERM');assert.equal(state.active,0);assert.equal(state.results[2].status,'cancelled-before-start');assert(!f.started('b1-source'),'Cancellation stops the queued original command');
   for(const id of ciPoolRoles.slice(0,2)){assert(ciPoolExists(ciPoolJoin(f.root,id+'.terminated')),'The owned child receives cancellation: '+id);const row=state.results.find(row=>row.id===id);assert(['failed','signalled'].includes(row.status));assert(row.finishedAt);const pid=ciPoolJson(ciPoolJoin(f.root,id+'.started')).pid;assert.throws(()=>process.kill(pid,0),error=>error.code==='ESRCH','The pool reaps each owned child before terminal completion');}assert.equal(state.events.at(-1).failed,true);
  }else{
   await ciPoolReleaseSchedule(f);const result=await f.terminal,state=ciPoolAssertAllFinished(f,result,{evidenceFailure:scenario.endsWith('-io'),sourceChanged:scenario==='changed-head'});
   if(scenario.endsWith('-io')){assert.equal(state.evidenceFailed,true);assert(state.evidenceErrors.some(error=>error.operation===(scenario==='log-io'?'release-contract-stdout-log':'status-tsv')),'The actual failing evidence sink is recorded');assert(state.results.every(row=>row.status==='passed'),'Evidence failure cannot mask, cancel or skip remaining original commands');}
   else{assert.equal(state.evidenceFailed,false);assert.notEqual(state.sourceAfter.head,state.sourceBefore.head);assert.equal(state.sourceAfter.tree,state.sourceBefore.tree,'Even an empty source commit must fail exact HEAD identity');}
  }
 }finally{await f.close();}}
});
