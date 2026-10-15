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
 const programme='.github/workflows/programme-day-preview.yml',pairs=FOOD_DIARY_LONDON_DATE_POLICY.inverses[programme];assert.equal(pairs.length,3,'Only the original Programme aggregate, exact bounded two-slot successor and named wall-clock allowance are authorised');
 const original=content(c.base,programme),current=content(foodHead,programme);assert.equal(executionOriginalCiWorkflow(programme,current),original,'Programme named timeout120 allowance, read-only permission, install, browser and every byte outside the exact source-gate and cap replacements remain exact');assert.equal(execFileSync('git',['hash-object','--stdin'],{input:executionOriginalCiWorkflow(programme,current),encoding:'utf8'}).trim(),blob(c.base,programme),'The exact Programme inverse restores its original Git blob');
 assert.match(current,/^    timeout-minutes: 120$/m);assert.match(current,/^permissions:\n  contents: read$/m);
});
test('the exact Programme aggregate starts every original gate and waits for all failures with isolated token scope and complete logs',()=>{
 const workflow='.github/workflows/programme-day-preview.yml',pairs=FOOD_DIARY_LONDON_DATE_POLICY.inverses[workflow],before=pairs[0][0],after=pairs[1][1];
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

function nativeCiRepairCleanStatusResult(args,value){
 const expected=['--no-optional-locks','status','--porcelain=v2','-z','--branch','--untracked-files=no','--ignore-submodules=none'];
 if(JSON.stringify(args)!==JSON.stringify(expected)||!Buffer.isBuffer(value))return false;
 const match=/^# branch\.oid ([a-f0-9]{40})\0# branch\.head \(detached\)\0$/.exec(value.toString('utf8'));
 return match!==null&&!/^0+$/.test(match[1])&&value.equals(Buffer.from(match[0]));
}
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
 const guardedPath='release',expected=blob(repairBase,guardedPath),calls=[],cleanStatuses=[],nativeExec=nativeCiRepairChildProcess.execFileSync;
 try{
  nativeCiRepairChildProcess.execFileSync=function(bin,args,...rest){if(bin==='git')calls.push([...args]);const result=nativeExec.call(this,bin,args,...rest);if(bin==='git'&&nativeCiRepairCleanStatusResult(args,result))cleanStatuses.push([...args]);return result;};nativeCiRepairSyncBuiltins();
  assert.equal(repairView.read('HEAD',guardedPath),expected);assert.equal(repairView.read('HEAD',guardedPath),expected);
 }finally{nativeCiRepairChildProcess.execFileSync=nativeExec;nativeCiRepairSyncBuiltins();}
 const count=expectedArgs=>calls.filter(args=>JSON.stringify(args)===JSON.stringify(expectedArgs)).length;
 assert(count(['ls-files','-v','-z'])>=4,'Each of two warmed canonical reads must retain native tracked-source visibility at entry and exit');
 assert(count(['diff','--no-renames','--name-only','HEAD','--'])+cleanStatuses.length>=4,'Each warmed canonical read must retain working-source entry and exit checks through exact legacy diffs or actual strict native clean-status results');
 assert(count(['diff','--no-renames','--cached','--name-only','--'])+cleanStatuses.length>=4,'Each warmed canonical read must retain staged-source entry and exit checks through exact legacy diffs or actual strict native clean-status results');
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

// Execute the literal current factory/public bodies against owned Git and explicit
// admission dependencies; this fixture does not manufacture a policy approval.
import {execFileSync as combinedFactoryExec} from 'node:child_process';
import {mkdtempSync as combinedFactoryTemp,writeFileSync as combinedFactoryWrite,rmSync as combinedFactoryRemove} from 'node:fs';
import {tmpdir as combinedFactoryTmp} from 'node:os';
import {join as combinedFactoryJoin} from 'node:path';

const combinedFactoryPath='release/combined-finite-scope-20261014.mjs';
function combinedFactoryFunctions(source){
 const original='export function verifyCombinedFiniteOriginal(',publicStart=source.indexOf('export function verifyCombinedFinite(c,options){'),factoryStart=source.indexOf('export function combinedFiniteHistoricalView('),legacyStart=source.indexOf('export function combinedFiniteLegacyHistoricalView(');
 assert(source.indexOf(original)>=0&&publicStart>source.indexOf(original)&&factoryStart>publicStart&&legacyStart>factoryStart,'Exact original/public/factory function boundaries required');
 return{original:source.slice(source.indexOf(original),publicStart),public:source.slice(publicStart,factoryStart),factory:source.slice(factoryStart,legacyStart)};
}
function combinedFactoryFixture(source,{hasCi=true,scenario='normal'}={}){
 const root=combinedFactoryTemp(combinedFactoryJoin(combinedFactoryTmp(),'shift-combined-factory-')),path='proof.txt',trace=[],counts={admissions:0,original:0,ciGuards:0},optionsSeen=[];
 const git=(...args)=>combinedFactoryExec('git',args,{cwd:root,encoding:'utf8',maxBuffer:1e6});
 git('init','-q');git('config','user.name','Combined factory fixture');git('config','user.email','fixture@example.invalid');git('config','core.hooksPath','/dev/null');git('config','commit.gpgsign','false');combinedFactoryWrite(combinedFactoryJoin(root,path),'first\n');git('add',path);git('commit','-qm','First owned immutable source');const base=git('rev-parse','HEAD').trim();
 combinedFactoryWrite(combinedFactoryJoin(root,path),'second\n');git('add',path);git('commit','-qm','Second owned immutable source');const projected=git('rev-parse','HEAD').trim();git('commit','--allow-empty','-qm','Owned current source');const raw=git('rev-parse','HEAD').trim();
 const literalBlob=(ref,p)=>git('rev-parse',ref+':'+p).trim(),literalContent=(ref,p)=>git('show',ref+':'+p),record={combinedFinite20261014:{base,paths:[path],maintenancePaths:[]}},foreignError=new Error('Controlled foreign callback failure'),exitError=new Error('Controlled current-source exit guard failure');
 function guard(){counts.ciGuards++;trace.push(['guard',counts.ciGuards]);if(scenario==='entry-error'&&counts.ciGuards===1)throw exitError;if(scenario==='exit-error'&&counts.ciGuards===2)throw exitError;if(scenario==='end-head')return;
  assert.equal(git('rev-parse','HEAD').trim(),raw,'Controlled actual raw HEAD changed');assert.equal(git('diff','--name-only','HEAD','--').trim(),'','Controlled tracked source changed');assert.equal(git('diff','--cached','--name-only','--').trim(),'','Controlled staged source changed');assert.equal(git('for-each-ref','--format=%(refname)','refs/replace').trim(),'','Controlled replacement source changed');assert(git('ls-files','-v').split('\n').filter(Boolean).every(line=>line.startsWith('H ')),'Controlled hidden index source changed');
 }
 const read=(ref,p)=>{trace.push(['read',ref,p]);if(scenario==='callback-error')throw foreignError;if(scenario==='historical-forgery'&&ref===base)return'forged literal historical source';return literalBlob(ref==='HEAD'?projected:ref,p);};
 const rawBlob=(ref,p)=>{trace.push(['blob',ref,p]);return literalBlob(ref==='HEAD'?projected:ref,p);},rawContent=(ref,p)=>{trace.push(['content',ref,p]);return literalContent(ref==='HEAD'?projected:ref,p);};
 const repairFactory=(reader,{defaultReader}={})=>{counts.admissions++;trace.push(['admission',reader,defaultReader]);assert.equal(git('rev-parse','HEAD').trim(),raw,'Controlled factory must admit the actual current source');return{rawHead:raw,head:projected,read,blob:rawBlob,content:rawContent,record,affected:p=>p===path,...(hasCi?{ciExecutionContext:{assertCurrent:guard}}:{})};};
 const originalVerifier=(c,options)=>{counts.original++;optionsSeen.push(options);assert.equal(c,record.combinedFinite20261014);assert.equal(options.head,projected);assert.equal(options.read,read);assert.equal(typeof options.blob,'function');assert.equal(typeof options.content,'function');
  for(const ref of['HEAD',projected,base,raw]){assert.equal(options.read(ref,path),literalBlob(ref==='HEAD'?projected:ref,path),'Every supplied current and literal historical callback remains authenticated by the original verifier dependency');assert.equal(options.blob(ref,path),literalBlob(ref==='HEAD'?projected:ref,path));assert.equal(options.content(ref,path),literalContent(ref==='HEAD'?projected:ref,path));}
  assert.deepEqual(options.diff(base,projected),['proof.txt']);options.ancestor(base,projected);
  if(scenario==='working')combinedFactoryWrite(combinedFactoryJoin(root,path),'changed working source\n');
  if(scenario==='staged'){combinedFactoryWrite(combinedFactoryJoin(root,path),'changed staged source\n');git('add',path);}
  if(scenario==='hidden')git('update-index','--assume-unchanged',path);
  if(scenario==='replacement')git('replace',base,projected);
  if(scenario==='head'||scenario==='end-head')git('commit','--allow-empty','-qm','Move only the owned fixture current source');
  return c;
 };
 const functions=combinedFactoryFunctions(source),factory=Function('assert','releaseMachineryRepairHistoricalView','verifyCombinedFiniteOriginal','exactCombinedDirectoryDisplay','manifest','git','\"use strict\";\n'+functions.public.replace(/^export /,'')+'\n'+functions.factory.replace(/^export /,'')+'\nreturn combinedFiniteHistoricalView;')(assert,repairFactory,originalVerifier,value=>value,'release/approved-runtime-composition.json',git);
 return{root,path,base,projected,raw,counts,trace,optionsSeen,read,foreignError,exitError,run:()=>factory(read,{defaultReader:false}),close:()=>combinedFactoryRemove(root,{recursive:true,force:true})};
}

test('Combined factory reuses only its admitted CI context while preserving exact original and public verification',()=>{
 assert.equal(c.combinedFactoryLocalOriginal,true,'The finite Food receipt explicitly owns only factory-local original dispatch');
 const current=content(foodHead,combinedFactoryPath),before=content(c.base,combinedFactoryPath),pairs=FOOD_DIARY_LONDON_DATE_POLICY.inverses[combinedFactoryPath];assert(c.maintenancePaths.includes(combinedFactoryPath));
 let restored=current;for(const [old,after]of[...pairs].reverse()){assert.equal(restored.split(after).length,2,'One exact Combined source inverse is required');restored=restored.replace(after,old);}assert.equal(restored,before,'Only the literal authorised Combined source correction may change');
 const actualFunctions=combinedFactoryFunctions(current),beforeFunctions=combinedFactoryFunctions(before);let restoredPublic=actualFunctions.public;for(const [old,after]of[...pairs].reverse())if(restoredPublic.includes(after)){assert.equal(restoredPublic.split(after).length,2);restoredPublic=restoredPublic.replace(after,old);}assert.equal(restoredPublic,beforeFunctions.public,'Every direct public verifier byte outside the authorised same-error diagnostic classification remains exact');
 assert.equal(actualFunctions.original,beforeFunctions.original,'Every original combined verifier body byte assertion and callback remains exact');
 for(const unchanged of['release/ci-execution-scope-20261014.mjs','release/release-machinery-repair-scope-20261014.mjs'])assert.equal(content(foodHead,unchanged),content(FOOD_DIARY_LONDON_DATE_POLICY.combinedFactoryPrior.head,unchanged),'Native/foreign current and historical fourth-reference adapters remain byte-exact: '+unchanged);
 for(const hasCi of[true,false]){
  const old=combinedFactoryFixture(before,{hasCi}),fresh=combinedFactoryFixture(current,{hasCi});try{
   old.run();fresh.run();assert.equal(old.counts.admissions,2,'The retained original factory demonstrates both native admission dispatches');assert.equal(fresh.counts.admissions,hasCi?1:2,'Only the existing local CI-context branch avoids the second full admission');assert.equal(old.counts.original,1);assert.equal(fresh.counts.original,1);assert.equal(fresh.counts.ciGuards,hasCi?2:0,'Factory-local CI entry and exit remain fresh');
   const normalise=(fixture,events)=>events.filter(row=>!['admission','guard'].includes(row[0])).map(row=>row.map(value=>value===fixture.base?'base':value===fixture.projected?'projected':value===fixture.raw?'raw':value));assert.deepEqual(normalise(fresh,fresh.trace),normalise(old,old.trace),'Every actual original callback runs in the same order with the same literal reference');
   assert.equal(fresh.optionsSeen[0].read,fresh.read,'The original receives the actual supplied reader identity');
  }finally{old.close();fresh.close();}
 }
});

test('Combined factory retains fresh entry exit foreign callback and actual source drift failures',()=>{
 const current=content(foodHead,combinedFactoryPath);
 for(const scenario of['entry-error','exit-error','callback-error','historical-forgery','working','staged','hidden','replacement','head','end-head']){const f=combinedFactoryFixture(current,{scenario});try{
  assert.throws(()=>f.run(),error=>scenario==='callback-error'?error===f.foreignError:scenario==='entry-error'||scenario==='exit-error'?error===f.exitError:/source changed|HEAD changed|authenticated|hidden index/.test(error.message),'No actual source or foreign callback failure may disappear: '+scenario);
  assert.equal(f.counts.admissions,1,'The bounded branch still owns one actual factory context: '+scenario);assert.equal(f.counts.original,scenario==='entry-error'?0:1);assert.equal(f.counts.ciGuards,scenario==='entry-error'?1:2,'Exit checks still execute when an original callback throws: '+scenario);
 }finally{f.close();}}
});

test('Combined wrong-head diagnostics classify rejection while preserving every result error object and callback',()=>{
 assert.equal(c.combinedWrongHeadDiagnostic,true,'Only the existing wrong-head fallback error classification is separately authorised');
 const functions=combinedFactoryFunctions(content(foodHead,combinedFactoryPath)),raw='a'.repeat(40),projected='b'.repeat(40),prefix='Combined source drift for supplied head: ';
 function run({head=projected,repairHead=projected,failure=null,shouldThrow=false,result={}}={}){let admissions=0,originalCalls=0,callbackCalls=0;const reader=(...args)=>{callbackCalls++;assert.deepEqual(args,['literal-ref','literal-path']);return'literal-value';},options={head,read:reader},registration={};
  const verify=Function('assert','releaseMachineryRepairHistoricalView','verifyCombinedFiniteOriginal','\"use strict\";\n'+functions.public.replace(/^export /,'')+'\nreturn verifyCombinedFinite;')(assert,()=>{admissions++;return{rawHead:raw,head:repairHead};},(record,actual)=>{originalCalls++;assert.equal(record,registration);assert.equal(actual,options);assert.equal(actual.read,reader);assert.equal(actual.read('literal-ref','literal-path'),'literal-value');if(shouldThrow)throw failure;return result;});
  let actual,thrown=false;try{actual=verify(registration,options);}catch(error){thrown=true;actual=error;}assert.equal(admissions,1);assert.equal(originalCalls,1);assert.equal(callbackCalls,1,'Classification cannot invoke or cache a supplied reader');return{actual,thrown};
 }
 for(const wrong of[projected,'c'.repeat(40),'f'.repeat(40)]){
  for(const message of['Unreviewed combined registration tail','Command failed: git merge-base --is-ancestor unknown HEAD']){const error=new Error(message),r=run({head:wrong,failure:error,shouldThrow:true});assert.equal(r.thrown,true);assert.equal(r.actual,error,'The actual original Error identity must be rethrown');assert.equal(error.message,prefix+message,'Only rejected nonraw-head failures acquire the diagnostic prefix');}
  const result={unchanged:true},success=run({head:wrong,result});assert.equal(success.thrown,false);assert.equal(success.actual,result,'The diagnostic branch cannot alter an original successful result');
 }
 for(const failure of[Object.freeze(new Error('frozen original error')),{message:'opaque original object'},'opaque original value',null]){const before=failure?.message,r=run({failure,shouldThrow:true});assert.equal(r.thrown,true);assert.equal(r.actual,failure,'Opaque and frozen throws remain exactly the original value');if(failure&&typeof failure==='object')assert.equal(failure.message,before);}
 const rawError=new Error('original raw-head failure'),rawResult=run({head:raw,repairHead:raw,failure:rawError,shouldThrow:true});assert.equal(rawResult.actual,rawError);assert.equal(rawError.message,'original raw-head failure','A genuine raw-head fallback error is never reclassified');
});

// These two bounded witnesses execute literal current private guard bodies. They
// prove source-check behaviour, not full policy admission or a release outcome.
import {existsSync as foodCleanExists,lstatSync as foodCleanStat} from 'node:fs';
import {resolve as foodCleanResolve} from 'node:path';
import {createHash as foodCleanHash} from 'node:crypto';

const foodCleanWorkingArgs=['diff','--no-renames','--name-only','HEAD','--'];
const foodCleanStagedArgs=['diff','--no-renames','--cached','--name-only','--'];
const foodCleanStatusArgs=['--no-optional-locks','status','--porcelain=v2','-z','--branch','--untracked-files=no','--ignore-submodules=none'];
const foodCleanOriginalDiffs="assert.equal(git('diff','--no-renames','--name-only','HEAD','--').trim(),'','Food-calendar source drift: Tracked source changed');assert.equal(git('diff','--no-renames','--cached','--name-only','--').trim(),'','Food-calendar source drift: Staged source changed');";
function foodCleanLiteralBodies(){
 const source=content(foodHead,'release/food-diary-london-date-scope-20261015.mjs'),immutable=content(foodHead,'release/immutable-git-facts.mjs');
 const line=prefix=>{const matches=source.split('\n').filter(row=>row.startsWith(prefix));assert.equal(matches.length,1,'One actual current source anchor: '+prefix);return matches[0];};
 const helperMarker='\nfunction freshDetachedFoodTrackedSourceClean(){';assert.equal(source.split(helperMarker).length,2,'One actual current helper LF-line anchor required');
 const start=source.indexOf(helperMarker)+1,end=source.indexOf('\nfunction clean(){',start);assert(start>0&&end>start);
 const helper=source.slice(start,end),clean=line('function clean(){'),wrapped='if(!freshDetachedFoodTrackedSourceClean()){'+foodCleanOriginalDiffs+'}';assert.equal(clean.split(wrapped).length,2,'Only the exact original two diffs may be wrapped');
 const visibilityStart=immutable.indexOf('export function assertGitTrackedSourceVisible('),visibilityEnd=immutable.indexOf('\n}',visibilityStart);assert(visibilityStart>=0&&visibilityEnd>visibilityStart);
 return{helper,clean,originalClean:clean.replace(wrapped,foodCleanOriginalDiffs),git:line('const git='),head:line('const currentHead='),assertCurrent:line(' const assertCurrent=()=>{if(privateW)privateW.assertCurrent();else{facts.clean();'),useView:line('function useView(view,run){'),visible:immutable.slice(visibilityStart,visibilityEnd+2).replace(/^export /,'')};
}
function foodCleanLiteralGuard(bodies,{exec,exists=()=>false,resolvePath=value=>value,env={}},original=false){
 const body=bodies.git+'\n'+bodies.head+'\n'+bodies.visible+'\n'+(original?'':bodies.helper+'\n')+(original?bodies.originalClean:bodies.clean)+'\nconst admittedViews=new WeakSet();\n'+bodies.useView+'\nreturn(rawHead,run)=>{const privateW=null,facts={clean,currentHead};\n'+bodies.assertCurrent+'\nconst view={assertCurrent};admittedViews.add(view);return useView(view,run);};';
 return Function('assert','execFileSync','existsSync','resolve','process','Buffer','"use strict";\n'+body)(assert,exec,exists,resolvePath,{env},Buffer);
}
function foodCleanCapture(run){try{return{ok:true,value:run()};}catch(error){return{ok:false,error};}}
function foodCleanErrorShape(result){return result.ok?{ok:true,value:result.value}:{ok:false,name:result.error.name,message:result.error.message,status:result.error.status??null};}
test('Food clean-only hint executes actual current source and preserves strict fallback error and callback order',()=>{
 const bodies=foodCleanLiteralBodies(),raw='1'.repeat(40),header='# branch.oid '+raw+'\0# branch.head (detached)\0';
 const scenarios=['clean','attached','zero','malformed','nonzero','dirty-working','MM-restored','working-error','staged-error','hidden','replacement','graft','graft-env','post-head','callback-error','callback-drift'];
 for(const scenario of scenarios){
  function fixture(original){const calls=[],sentinel=new Error('Owned callback sentinel'),nativeError=new Error('Owned diff failure');let changed=false,callbacks=0;
   const exec=(bin,args)=>{assert.equal(bin,'git');calls.push([...args]);
    if(args[0]==='ls-files')return Buffer.from((scenario==='hidden'?'S ':'H ')+'tracked.txt\0');
    if(args[0]==='for-each-ref')return scenario==='replacement'?'refs/replace/owned\n':'';
    if(args[0]==='rev-parse')return args[1]==='--git-path'?'/owned/info/grafts':scenario==='post-head'?'2'.repeat(40)+'\n':raw+'\n';
    if(args[0]==='--no-optional-locks'){assert.deepEqual(args,foodCleanStatusArgs);if(scenario==='nonzero'||scenario.endsWith('-error')&&scenario!=='callback-error'){const error=new Error('Unsupported status');error.status=129;throw error;}if(scenario==='attached')return Buffer.from(header.replace('(detached)','main'));if(scenario==='zero')return Buffer.from(header.replace(raw,'0'.repeat(40)));if(scenario==='malformed')return Buffer.from(header+'\n');if(scenario==='dirty-working'||scenario==='MM-restored'||changed)return Buffer.from(header+'1 MM N... 100644 100644 100644 '+raw+' '+raw+' tracked.txt\0');return Buffer.from(header);}
    if(args[0]==='diff'){if(args.join('\0')===foodCleanWorkingArgs.join('\0')){if(scenario==='working-error')throw nativeError;return scenario==='dirty-working'||changed?'tracked.txt\n':'';}assert.deepEqual(args,foodCleanStagedArgs);if(scenario==='staged-error')throw nativeError;return scenario==='MM-restored'?'tracked.txt\n':'';}
    throw new Error('Unexpected actual guard command: '+args.join(' '));
   };
   const guard=foodCleanLiteralGuard(bodies,{exec,exists:()=>scenario==='graft',env:scenario==='graft-env'?{GIT_GRAFT_FILE:'/owned/override'}:{}},original);
   const result=foodCleanCapture(()=>guard(raw,()=>{callbacks++;if(scenario==='callback-error')throw sentinel;if(scenario==='callback-drift')changed=true;return'owned';}));
   if(scenario==='callback-error')assert.equal(result.error,sentinel,'The same callback Error is retained');
   if(scenario==='working-error'||scenario==='staged-error')assert.equal(result.error,nativeError,'The same original native diff Error is retained');
   return{result,calls,callbacks};
  }
  const old=fixture(true),fresh=fixture(false);assert.deepEqual(foodCleanErrorShape(fresh.result),foodCleanErrorShape(old.result),scenario+' actual old/new outcome');assert.equal(fresh.callbacks,old.callbacks,scenario+' callback count');
  const freshLegacy=fresh.calls.filter(args=>args[0]!=='--no-optional-locks');
  if(scenario!=='clean'&&scenario!=='callback-error'&&scenario!=='post-head'&&scenario!=='callback-drift')assert.deepEqual(freshLegacy,old.calls,scenario+' exact lazy native command/error order');
  if(scenario==='clean'){assert.equal(fresh.calls.filter(args=>args[0]==='--no-optional-locks').length,2,'One fresh status per entry/exit');assert(!fresh.calls.some(args=>args[0]==='diff'),'Clean hint avoids only the two original diffs');assert.deepEqual(freshLegacy,old.calls.filter(args=>args[0]!=='diff'),'Every original precheck and post-clean HEAD remains in place');}
  if(['hidden','replacement','graft','graft-env'].includes(scenario))assert(!fresh.calls.some(args=>args[0]==='--no-optional-locks'),'Earlier source errors must precede the hint');
  if(scenario==='post-head')assert.equal(fresh.calls.at(-1)[0],'rev-parse','Actual fresh HEAD remains after the hint');
 }
});

test('Food clean-only actual native Git preserves detached dirty staged hidden and fresh source boundaries',()=>{
 const bodies=foodCleanLiteralBodies(),root=mkdtempSync(join(tmpdir(),'shift-food-clean-native-')),repo=join(root,'repo'),home=join(root,'home');mkdirSync(repo);mkdirSync(home);
 const env={...process.env,HOME:home,XDG_CONFIG_HOME:join(home,'config'),GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:join(home,'global'),GIT_CONFIG_SYSTEM:join(home,'system'),GIT_AUTHOR_NAME:'Food guard fixture',GIT_AUTHOR_EMAIL:'fixture@example.invalid',GIT_COMMITTER_NAME:'Food guard fixture',GIT_COMMITTER_EMAIL:'fixture@example.invalid',GIT_TERMINAL_PROMPT:'0'};
 for(const name of Object.keys(env))if(/^GIT_CONFIG_(?:COUNT|KEY_|VALUE_)/.test(name)||['GIT_DIR','GIT_WORK_TREE','GIT_INDEX_FILE','GIT_COMMON_DIR','GIT_OBJECT_DIRECTORY','GIT_ALTERNATE_OBJECT_DIRECTORIES','GIT_NAMESPACE','GIT_REPLACE_REF_BASE','GIT_GRAFT_FILE','GIT_SHALLOW_FILE'].includes(name))delete env[name];
 const native=(...args)=>execFileSync('git',args,{cwd:repo,env,encoding:'utf8',stdio:'pipe'}),file=join(repo,'tracked.txt');
 function snapshot(){const rows=[];function visit(path){if(!foodCleanExists(path))return;const stat=foodCleanStat(path);if(stat.isDirectory())for(const name of readdirSync(path).sort())visit(join(path,name));else rows.push([path.slice(repo.length+1),foodCleanHash('sha256').update(readFileSync(path)).digest('hex')]);}for(const path of['.git/index','.git/HEAD','.git/packed-refs','.git/refs','tracked.txt'])visit(join(repo,path));return rows;}
 try{
  assert.match(native('--version'),/^git version /);native('init','--initial-branch=main');native('config','core.hooksPath',join(root,'no-hooks'));native('config','commit.gpgsign','false');writeFileSync(file,'prior\n');native('add','tracked.txt');native('commit','-qm','prior');writeFileSync(file,'base\n');native('commit','-qam','base');const raw=native('rev-parse','HEAD').trim();native('checkout','--detach',raw);
  for(const scenario of['clean','dirty','staged-MM','hidden','post-head','callback-drift']){
   const results=[];
   for(const original of[true,false]){
    native('update-index','--no-skip-worktree','tracked.txt');native('checkout','--detach',raw);native('reset','--hard',raw);
    if(scenario==='dirty')writeFileSync(file,'dirty\n');if(scenario==='staged-MM'){writeFileSync(file,'staged\n');native('add','tracked.txt');writeFileSync(file,'base\n');}if(scenario==='hidden')native('update-index','--skip-worktree','tracked.txt');
    let headMoved=false;const calls=[],before=snapshot(),exec=(bin,args,options)=>{assert.equal(bin,'git');calls.push([...args]);if(scenario==='post-head'&&!headMoved&&args.join('\0')==='rev-parse\0HEAD'){headMoved=true;native('checkout','--detach',raw+'^');}return execFileSync(bin,args,{...options,cwd:repo,env,stdio:'pipe'});};
    const guard=foodCleanLiteralGuard(bodies,{exec,exists:foodCleanExists,resolvePath:(...parts)=>foodCleanResolve(repo,...parts),env},original);let callbacks=0;
    const result=foodCleanCapture(()=>guard(raw,()=>{callbacks++;if(scenario==='callback-drift')writeFileSync(file,'callback drift\n');return'owned';}));
    if(!['post-head','callback-drift'].includes(scenario))assert.deepEqual(snapshot(),before,scenario+' leaves actual index refs HEAD and source bytes unchanged');
    results.push({shape:foodCleanErrorShape(result),callbacks,calls});
   }
   const[old,fresh]=results;assert.deepEqual(fresh.shape,old.shape,scenario+' native old/new outcome');assert.equal(fresh.callbacks,old.callbacks,scenario+' native callback count');
   if(scenario==='clean'){assert.equal(fresh.shape.ok,true);assert.equal(fresh.calls.filter(args=>args[0]==='--no-optional-locks').length,2);assert(!fresh.calls.some(args=>args[0]==='diff'));}
   if(scenario==='staged-MM')assert.match(fresh.shape.message,/Staged source changed/);
   if(scenario==='hidden')assert(!fresh.calls.some(args=>args[0]==='--no-optional-locks'));
   if(scenario==='post-head')assert.match(fresh.shape.message,/Raw HEAD changed/);
   if(scenario==='callback-drift')assert.match(fresh.shape.message,/Tracked source changed/);
  }
 }finally{rmSync(root,{recursive:true,force:true});}
});

// Exact prepared Food live contracts, kept separate from genuine live acceptance.
{
const {createHash}=await import('node:crypto');
const {mkdtempSync,readFileSync,writeFileSync,existsSync,rmSync}=await import('node:fs');
const {tmpdir}=await import('node:os');
const {join}=await import('node:path');
const {pathToFileURL,fileURLToPath}=await import('node:url');
const {DatabaseSync}=await import('node:sqlite');
const {SITE,API,FOOD_LIVE_ASSET_PATH,FOOD_LIVE_MEANING,londonFoodDay,nextLondonFoodDay,assertFoodLiveHolder,assertFoodLiveRequest,assertFoodLiveIdentity,assertFoodLiveResponse,assertFoodLiveSnapshot}=await import('../release/food-diary-live-20261015.mjs');
const id='d1c3fd71-f698-49d0-a609-17dca7db5d2a',other='7dbb4476-4139-4b38-9f43-1d954b2aa3ef',email='shiftsometimber+structured-growth-'+id+'@gmail.com',source='a'.repeat(40),marker='Synthetic food acceptance '+other,day='2026-10-15';
const holder=()=>({site:SITE,api:API,email,source,report:{commit:source,synthetic:true,realCustomerRecordsRead:false,status:'running',checks:[]}});
const entry=()=>({operationId:id,on:day,food:marker});
const request=()=>({url:SITE+'/v1/grub/eaten',method:'POST',body:entry(),day,marker});
const headers={'cache-control':'no-store'};
const snapshot=entries=>({status:200,headers,body:{entries,historyMayBeLimited:false,meaning:FOOD_LIVE_MEANING},expectedEntries:structuredClone(entries)});

test('London day and its next calendar day follow BST midnight, DST transitions and leap days',()=>{
 for(const[now,today,tomorrow]of[
  ['2026-10-14T23:46:00Z','2026-10-15','2026-10-16'],['2026-03-29T23:30:00Z','2026-03-30','2026-03-31'],
  ['2026-10-25T00:30:00Z','2026-10-25','2026-10-26'],['2026-10-25T23:30:00Z','2026-10-25','2026-10-26'],
  ['2028-02-28T12:00:00Z','2028-02-28','2028-02-29'],['2028-02-29T12:00:00Z','2028-02-29','2028-03-01']]){
  assert.equal(londonFoodDay(Date.parse(now)),today);assert.equal(nextLondonFoodDay(Date.parse(now)),tomorrow);
 }
 assert.throws(()=>londonFoodDay(NaN));
});
test('only the original Growth UUID holder and exact running source-bound synthetic report are admitted',()=>{
 assert.equal(assertFoodLiveHolder(holder()).email,email);
 for(const change of[{site:API},{api:SITE},{site:SITE+'/'},{email:'matt@example.com'},{email:email.replace('structured-growth','structured-progressstory')},{source:'prepared-main'},
  {report:{...holder().report,synthetic:false}},{report:{...holder().report,realCustomerRecordsRead:undefined}},{report:{...holder().report,commit:'b'.repeat(40)}},{report:{...holder().report,status:'pass'}}])assert.throws(()=>assertFoodLiveHolder({...holder(),...change}));
});
test('request allowlist defaults closed for held routes, origins, methods and extra fields',()=>{
 assert.equal(assertFoodLiveRequest(request()).operationId,id);
 for(const origin of[SITE,API])for(const path of['/v1/me','/v1/consents','/v1/grub/eaten',FOOD_LIVE_ASSET_PATH])assertFoodLiveRequest({url:origin+path,method:'GET'});
 for(const path of['/v1/auth/register','/v1/auth/login','/v1/auth/verify-email','/v1/auth/resend-verification','/v1/auth/recover','/v1/contact','/v1/support','/v1/payments','/v1/ai/chat','/v1/shift-ai/chat','/member/grub','/assets/member-experience/food-diary-client.mjs']){
  assert.throws(()=>assertFoodLiveRequest({...request(),url:SITE+path}));assert.throws(()=>assertFoodLiveRequest({url:SITE+path,method:'GET'}));
 }
 for(const url of['https://evil.example/v1/grub/eaten','https://shiftsometimber.co.uk.evil.example/v1/grub/eaten','http://shiftsometimber.co.uk/v1/grub/eaten',SITE+'/v1/grub/eaten?email=someone',SITE+'/v1/grub/eaten#x','https://user:pass@shiftsometimber.co.uk/v1/grub/eaten'])assert.throws(()=>assertFoodLiveRequest({...request(),url}));
 for(const method of['DELETE','PUT','PATCH','post'])assert.throws(()=>assertFoodLiveRequest({...request(),method}));
 for(const body of[{...entry(),proteinG:0},{...entry(),waterMl:0},{...entry(),userId:1},{...entry(),email},{...entry(),operationId:'unowned'},{...entry(),food:'Real meal'},null,[]])assert.throws(()=>assertFoodLiveRequest({...request(),body}));
 assert.throws(()=>assertFoodLiveRequest({url:SITE+'/v1/me',method:'GET',body:{}}));
});
test('UI operation is observed once, only that operation replays, and future denial is explicit and exact',()=>{
 assertFoodLiveRequest({...request(),ownedOperationId:id});assert.throws(()=>assertFoodLiveRequest({...request(),ownedOperationId:other}));
 const future={...request(),body:{...entry(),operationId:other,on:'2026-10-16'}};
 assert.throws(()=>assertFoodLiveRequest(future));assert.equal(assertFoodLiveRequest({...future,allowFutureDenial:true}).kind,'future-denial');
 for(const change of[{allowFutureDenial:'true'},{body:{...future.body,on:day}},{body:{...future.body,on:'2026-10-17'}},{day:'2026-02-30'}])assert.throws(()=>assertFoodLiveRequest({...future,allowFutureDenial:true,...change}));
});
test('both-origin identity checks bind exact original email and the same actual positive ID',()=>{
 const good={status:200,body:{user:{id:17,email}},email};assert.equal(assertFoodLiveIdentity(good),17);assert.equal(assertFoodLiveIdentity({...good,holderId:17}),17);
 for(const change of[{status:401},{body:{user:{id:18,email}},holderId:17},{body:{user:{id:17,email:'matt@example.com'}}},{body:{user:{id:'17',email}}},{body:{user:{id:0,email}}}])assert.throws(()=>assertFoodLiveIdentity({...good,...change}));
});
test('response and snapshot contracts reject false success, cacheable results, duplicate or changed saved state',()=>{
 const created={kind:'created',status:201,headers,body:{ok:true,id},operationId:id};assertFoodLiveResponse(created);assertFoodLiveResponse({...created,kind:'retry',status:200});
 const denied={kind:'future-denial',status:400,headers:new Headers(headers),body:{error:'invalid_entry',message:'Add what you ate and a valid date.'},operationId:other};assertFoodLiveResponse(denied);
 for(const change of[{status:200},{headers:{'cache-control':'private'}},{headers:{'cache-control':'x-no-store'}},{body:{ok:true,id:other}},{body:{ok:true,id,extra:true}}])assert.throws(()=>assertFoodLiveResponse({...created,...change}));
 assert.throws(()=>assertFoodLiveResponse({...denied,status:201}));assert.throws(()=>assertFoodLiveResponse({...denied,body:{error:'operation_conflict',message:denied.body.message}}));
 const saved={id,...entry()},good=snapshot([saved]);assertFoodLiveSnapshot(good);assertFoodLiveSnapshot(snapshot([]));
 for(const entries of[[saved,saved],[{...saved,on:'2026-10-16'}],[{...saved,proteinG:0}],[{...saved,food:'Foreign record'}]])assert.throws(()=>assertFoodLiveSnapshot({...good,body:{...good.body,entries}}));
 assert.throws(()=>assertFoodLiveSnapshot({...good,body:{...good.body,historyMayBeLimited:true}}));
});

test('actual byte-pinned Food route with explicit local auth stubs and real SQLite retains one save across retry and future denial',async()=>{
 const installed=fileURLToPath(new URL('../member-experience/journey-portability.mjs',import.meta.url)),sourcePath=process.env.FOOD_LIVE_ROUTE_SOURCE||installed;
 assert(existsSync(sourcePath),'Provide the actual route source through FOOD_LIVE_ROUTE_SOURCE for the isolated private packet');
 const raw=readFileSync(sourcePath),blob=createHash('sha1').update('blob '+raw.length+'\0').update(raw).digest('hex');assert.equal(blob,'5e43ea020c62c62e848165722830df7682d8e908','The actual unchanged Food route must be tested');
 const originalImport="import{authenticateMember}from'../member-state-fast-v1.js';import{trackingConsent}from'./health-routes.mjs';";
 const text=raw.toString();assert.equal(text.split(originalImport).length,2);const dir=mkdtempSync(join(tmpdir(),'shift-food-contract-local-')),sql=new DatabaseSync(':memory:');
 const oldNow=Date.now;
 try{
  writeFileSync(join(dir,'local-auth-stubs.mjs'),"// Explicit local-only stubs: no real session or production identity is authenticated.\nexport async function authenticateMember(request,env){return env.__localHolderId?{userId:env.__localHolderId}:{response:Response.json({error:'authentication_required'},{status:401})};}\nexport async function trackingConsent(DB,id){return Number((await DB.prepare('SELECT granted FROM consents WHERE user_id=? ORDER BY id DESC LIMIT 1').bind(id).first())?.granted)===1;}\n");
  writeFileSync(join(dir,'actual-route.mjs'),text.replace(originalImport,"import{authenticateMember,trackingConsent}from'./local-auth-stubs.mjs';"));
  const {journeyPortabilityRoutes}=await import(pathToFileURL(join(dir,'actual-route.mjs')).href);
  sql.exec("CREATE TABLE consents(id INTEGER PRIMARY KEY,user_id INTEGER,consent_type TEXT,granted INTEGER);CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,preferences TEXT);INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1);INSERT INTO member_state VALUES(1,'{}');");
  const DB={exec:async q=>sql.exec(q),prepare(q){let values=[];return{bind(...args){values=args;return this;},first:async()=>sql.prepare(q).get(...values)||null,all:async()=>({results:sql.prepare(q).all(...values)}),run:async()=>({meta:{changes:Number(sql.prepare(q).run(...values).changes)}})};}};
  const env={DB,__localHolderId:1,MEMBER_EXPERIENCE_V1_ENABLED:'true'},invoke=async(method,body)=>{assertFoodLiveRequest({url:SITE+'/v1/grub/eaten',method,body,day,marker,...(body?.on==='2026-10-16'?{allowFutureDenial:true}:{})});const response=await journeyPortabilityRoutes(new Request(SITE+'/v1/grub/eaten',{method,headers:{Origin:SITE,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env);return{status:response.status,headers:response.headers,body:await response.json()};};
  Date.now=()=>Date.parse('2026-10-14T23:46:00.000Z');
  assertFoodLiveSnapshot({...await invoke('GET'),expectedEntries:[]});
  assertFoodLiveResponse({kind:'created',...await invoke('POST',entry()),operationId:id});
  assertFoodLiveResponse({kind:'retry',...await invoke('POST',entry()),operationId:id});
  const expectedEntries=[{id,...entry()}];assertFoodLiveSnapshot({...await invoke('GET'),expectedEntries});assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM member_food_entries').get().n,1);
  assertFoodLiveResponse({kind:'future-denial',...await invoke('POST',{...entry(),operationId:other,on:'2026-10-16'}),operationId:other});
  assertFoodLiveSnapshot({...await invoke('GET'),expectedEntries});assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM member_food_entries').get().n,1);
 }finally{Date.now=oldNow;sql.close();rmSync(dir,{recursive:true,force:true});}
});

}

// Finite wall-clock allowance contract; historical CI21 and all product limits remain separate.
{
 const wallClockCaps=[['.github/workflows/production-completion-proof.yml',20,90],['.github/workflows/approved-ranking-proof.yml',20,90],['.github/workflows/programme-day-preview.yml',30,120],['.github/workflows/shift-coach-integration.yml',60,240]];
 const restoreWallClockOnly=(path,bytes,previous)=>{
  const specification=wallClockCaps.find(([p])=>p===path);assert(specification,'Only the four named existing CI workflows have a wall-clock allowance');
  const[,before,after]=specification,oldLine='    timeout-minutes: '+before+'\n',newLine='    timeout-minutes: '+after+'\n';
  assert.equal(bytes.split(newLine).length,2,'One exact admitted new job cap is required');assert.equal(previous.split(oldLine).length,2,'One exact prior job cap is required');
  const restored=bytes.replace(newLine,oldLine);assert.equal(restored,previous,'Every command, pool, token grant, permission, runner, artifact and byte outside the exact cap must remain unchanged');return restored;
 };
 test('the named CI wall-clock allowance changes only four admitted caps and restores every prior Food38 byte',()=>{
  const policy=FOOD_DIARY_LONDON_DATE_POLICY,allowance=c.ciWallClockAllowance20261015,prior=policy.ciWallClockAllowance20261015Prior;
  assert.deepEqual(allowance,policy.ciWallClockAllowance20261015);assert.equal(allowance.kind,'FINITE_CI_WALL_CLOCK_ALLOWANCE_20261015');assert.equal(c.timeAllowancesIncreased,true);assert.equal(c.foodOriginal29ByteExactPrefix,false);assert.equal(c.originalFood38ByteExactInverse,true);
  assert.deepEqual(allowance.prior,{head:prior.head,tree:prior.tree,ledgerPath:prior.ledgerPath,ledgerBlob:prior.ledgerBlob,scopePath:prior.scopePath,scopeBlob:prior.scopeBlob,foodTestPath:prior.foodTestPath,foodTestBlob:prior.foodTestBlob,maintenanceSource:prior.maintenanceSource});
  assert.equal(prior.head,'6f6f9ba15dec7832bc1d6df0f9e3e71225daa123');assert.equal(blob(prior.head,prior.ledgerPath),prior.ledgerBlob);assert.equal(blob(prior.head,prior.scopePath),prior.scopeBlob);assert.deepEqual(JSON.parse(content(prior.head,prior.ledgerPath))[key],prior.record,'The full final prior Food record must be authenticated to its immutable actual ledger');
  assert.equal(prior.record.timeAllowancesIncreased,false);assert.deepEqual(c.authority,prior.record.authority,'Historical Matt authority and engineering text stay exact');assert.deepEqual(policy.originalCiRecord,prior.originalCiRecord);assert.deepEqual(policy.originalRepairRecord,prior.originalRepairRecord);assert.equal(policy.originalRepairRecord.timeAllowancesIncreased,false);
  assert.equal(allowance.productionTimeoutMinutes,60);assert.equal(allowance.githubHostedMaximumMinutes,360);assert.equal(allowance.preserved.maxConcurrent,2);assert.equal(allowance.costBasis.repositoryVisibility,'public');assert.equal(allowance.costBasis.largerOrPaidRunnerEnabled,false);assert.equal(allowance.costBasis.storageAndRetentionSettingsChanged,false);assert.equal(allowance.costBasis.newSpendingAuthority,false);assert.equal(allowance.costBasis.storageUsageAndQuotaVerified,false);
  assert.deepEqual(Object.keys(allowance.workflowTimeoutMinutes).sort(),wallClockCaps.map(([p])=>p).sort());
  for(const[path,before,after]of wallClockCaps){
   assert(after<=360);assert.deepEqual(allowance.workflowTimeoutMinutes[path],{before,after});
   const current=content(foodHead,path),previous=content(prior.head,path),restored=restoreWallClockOnly(path,current,previous);assert.equal(restored,previous);assert.deepEqual(policy.ciWallClockAllowance20261015InversePairs[path],['    timeout-minutes: '+before+'\n','    timeout-minutes: '+after+'\n']);
   assert.equal(executionOriginalCiWorkflow(path,current),content(c.base,path),'Complete strict inverses still restore the exact original CI workflow');
   for(const changed of[current.replace('    timeout-minutes: '+after+'\n','    timeout-minutes: '+(after+1)+'\n'),current+'\n# unapproved workflow change\n',current.replace('node ','node --trace-warnings '),current.replace('runs-on:','runs-on-unapproved:')])assert.throws(()=>restoreWallClockOnly(path,changed,previous),/exact|unchanged/,'Cap admission must reject any additional byte change');
  }
  const production='.github/workflows/cloudflare-production-promote.yml';assert.equal(content(foodHead,production),content(prior.head,production));assert.match(content(foodHead,production),/^    timeout-minutes: 60$/m);
  const restored38=policy.ciWallClockFood38SourceInverse.reduceRight((bytes,[before,after,kind])=>{assert(after&&bytes.split(after).length===2,'One exact Food38 restoration fragment is required');if(kind==='suffix')assert(bytes.endsWith(after));return bytes.replace(after,before);},content(foodHead,prior.foodTestPath));
  assert.equal(restored38,content(prior.head,prior.foodTestPath),'Every prior Food38 test byte is restored');assert.equal(execFileSync('git',['hash-object','--stdin'],{input:restored38,encoding:'utf8'}).trim(),prior.foodTestBlob);
 });
}

// Bounded compatibility requirements; the complete prior Food39 file is retained by strict inverse.
test('native warm guard status credit accepts only actual strict clean Buffer results',()=>{
 const args=['--no-optional-locks','status','--porcelain=v2','-z','--branch','--untracked-files=no','--ignore-submodules=none'],oid='1'.repeat(40),header='# branch.oid '+oid+'\0# branch.head (detached)\0';
 assert.equal(nativeCiRepairCleanStatusResult(args,Buffer.from(header)),true);
 for(const value of[header,Buffer.from(header+'\n'),Buffer.from(header+'1 .M N... tracked\0'),Buffer.from(header.replace('(detached)','main')),Buffer.from(header.replace(oid,'0'.repeat(40))),Buffer.from(header.replace(oid,'f'.repeat(39))),Buffer.from(header.replace('branch.head','branch.upstream')),Buffer.from([255,...Buffer.from(header)])])assert.equal(nativeCiRepairCleanStatusResult(args,value),false,'An ambiguous or dirty result cannot replace either original diff requirement');
 for(const changed of[args.slice(1),[...args,'--ignored'],args.map(x=>x==='--ignore-submodules=none'?'--ignore-submodules=all':x)])assert.equal(nativeCiRepairCleanStatusResult(changed,Buffer.from(header)),false,'Only exact native conservative status argv can receive credit');
});

test('Food constructor defers only current directory callbacks while returned foreign reads remain strict',()=>{
 const directories=['member-experience','member-experience/tests','release','tests','.github/workflows'],visits=[];let forgedAlias=null,forgedPath=null;
 const supplied=(ref,path)=>{visits.push([ref,path]);if((ref==='HEAD'||ref===head)&&directories.includes(path)&&(forgedAlias===null||ref===forgedAlias&&path===forgedPath))return'forged supplied current directory';return blob(ref,path);};
 const view=foodDiaryLondonDateHistoricalView(supplied,{defaultReader:true});
 assert(visits.some(([,path])=>path===runtime),'Every actual supplied file admission still executes');
 assert(!visits.some(([ref,path])=>(ref==='HEAD'||ref===head)&&directories.includes(path)),'Only the exact five current directories are deferred during factory construction');
 assert.equal(foodDiaryLondonDateReaderProvenance(view.read).nativeSource,false,'A foreign callback cannot borrow native source provenance');
 for(const alias of['HEAD',head])for(const path of directories){forgedAlias=alias;forgedPath=path;const before=visits.length;assert.throws(()=>view.read('HEAD',path),sourceFailure,alias+':'+path);assert(visits.slice(before).some(([r,p])=>r===alias&&p===path),'The returned reader must invoke and reject the exact supplied directory alias');}
});
