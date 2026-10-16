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
function productionBeforeSourceSchedule(bytes){
 const [[before,after]]=FOOD_DIARY_LONDON_DATE_POLICY.inverses['.github/workflows/cloudflare-production-promote.yml'];
 assert.equal(bytes,after,'Exact current bounded production workflow required');return before;
}
function foodBeforeSourceSchedule(bytes){
 for(const [before,after]of[...FOOD_DIARY_LONDON_DATE_POLICY.sourceScheduleFood176Inverse].reverse()){assert(after&&bytes.split(after).length===2,'One exact current Food inverse required');bytes=bytes.replace(after,()=>before);}
 assert.equal(execFileSync('git',['hash-object','--stdin'],{input:bytes,encoding:'utf8'}).trim(),'132dfdd45019f7d7d8bc373bfdfe8d88e71db993','All original176 test bytes required');return bytes;
}
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
function programmeBeforeToolchainOverlap(path,bytes){
 if(path!=='.github/workflows/programme-day-preview.yml')return bytes;
 const prior=FOOD_DIARY_LONDON_DATE_POLICY.ciProgrammeToolchainOverlap20261015Prior,pool=FOOD_DIARY_LONDON_DATE_POLICY.ciProgrammeToolchainPool20261015,[before,after]=pool.workflowPair;
 assert(after&&bytes.split(after).length===2,'One exact admitted Programme setup scheduling fragment is required');const restored=bytes.replace(after,before);
 assert.equal(restored,content(prior.head,path),'Every raw Programme byte outside the exact setup scheduling pair remains unchanged');assert.equal(execFileSync('git',['hash-object','--stdin'],{input:restored,encoding:'utf8'}).trim(),prior.workflowBlob,'Exact prior Programme workflow blob required');return restored;
}
test('the exact original21 CI witness production60 and configurations survive the runtime repair',()=>{
 assert.equal(blob(foodHead,ciWitness),'b5aee29bfa2e7e4fa01de2585df074eb3ee40907');assert.equal(content(foodHead,ciWitness),content(c.base,'tests/ci-execution-stack-20261014.test.mjs'));assert.equal(blob(foodHead,'tests/ci-execution-stack-20261014.test.mjs'),'cec36f99782ed977a23827bfa67d400876948d25');
 const production='.github/workflows/cloudflare-production-promote.yml';assert.match(content(foodHead,production),/^    timeout-minutes: 60$/m);
 for(const path of[production,'.github/workflows/production-completion-proof.yml','.github/workflows/approved-ranking-proof.yml','wrangler.jsonc','wrangler.coaching.jsonc','package.json','package-lock.json','worker-entry-v6.js','worker.js','frontend','public','my-timber-app','shift-coach/worker.mjs','member-state-fast-v1.js','member-experience/health-routes.mjs']){if(path===production){const restored=productionBeforeSourceSchedule(content(foodHead,path));assert.equal(restored,content(c.base,path),'Every original production workflow byte remains required');assert.equal(execFileSync('git',['hash-object','--stdin'],{input:restored,encoding:'utf8'}).trim(),blob(c.base,path));}else if(FOOD_DIARY_LONDON_DATE_POLICY.ciExecutionWorkflowPaths.includes(path)){const restored=executionOriginalCiWorkflow(path,content(foodHead,path));assert.equal(restored,content(c.base,path),'Only the exact authorised CI orchestration may change protected workflow bytes: '+path);assert.equal(execFileSync('git',['hash-object','--stdin'],{input:restored,encoding:'utf8'}).trim(),blob(c.base,path),'The exact inverse must restore the original protected workflow Git blob: '+path);}else assert.equal(blob(foodHead,path),blob(c.base,path),'Protected source changed: '+path);}
 assert.equal(c.ciProgrammeConcurrency,true,'The finite Food receipt must explicitly own Programme source-gate concurrency');
 const programme='.github/workflows/programme-day-preview.yml',pairs=FOOD_DIARY_LONDON_DATE_POLICY.inverses[programme];assert.equal(pairs.length,4,'Only the original Programme aggregate, exact bounded two-slot successor, named wall-clock allowance and one exact setup scheduling inverse are authorised');assert.deepEqual(pairs.at(-1),FOOD_DIARY_LONDON_DATE_POLICY.ciProgrammeToolchainPool20261015.workflowPair);
 const original=content(c.base,programme),current=content(foodHead,programme);assert.equal(executionOriginalCiWorkflow(programme,current),original,'Programme named timeout120 allowance, read-only permission, install, browser and every byte outside the exact source-gate and cap replacements remain exact');assert.equal(execFileSync('git',['hash-object','--stdin'],{input:executionOriginalCiWorkflow(programme,current),encoding:'utf8'}).trim(),blob(c.base,programme),'The exact Programme inverse restores its original Git blob');
 assert.match(current,/^    timeout-minutes: 120$/m);assert.match(current,/^permissions:\n  contents: read$/m);
});
test('the exact Programme aggregate starts every original gate and waits for all failures with isolated token scope and complete logs',()=>{
 const workflow='.github/workflows/programme-day-preview.yml',pairs=FOOD_DIARY_LONDON_DATE_POLICY.inverses[workflow],before=pairs[0][0],after=pairs[1][1];
 const original=content(c.base,workflow),current=programmeBeforeToolchainOverlap(workflow,content(foodHead,workflow)),marker='        run: |\n';
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
 const root=ciPoolTemp(ciPoolJoin(ciPoolTmpdir(),'shift-ci-pool-witness-')),poolId=JSON.parse(pool.script.match(/^const poolId=(.+);$/m)[1]),roles=pool.tasks.map(task=>task.id),trace=ciPoolJoin(root,'fixture-events.jsonl');assert(['completion','programme'].includes(poolId));assert.equal(roles.length,poolId==='programme'?4:3);if(poolId==='programme')assert.deepEqual(roles,['source-tests','b1-scope','growth-preflight','browser-toolchain']);
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
 if(f.poolId==='programme'){
  assert.deepEqual(f.roles,['source-tests','b1-scope','growth-preflight','browser-toolchain']);const[first,second,third,fourth]=f.roles;
  await ciPoolUntil(()=>f.started(first)&&f.started(second),'the two original Programme slots');assert(!f.started(third)&&!f.started(fourth));
  await ciPoolUntil(()=>f.stdout.includes(first+':stdout:start')&&f.stdout.includes(second+':stderr:start'),'live Programme progress before release');assert(!f.finished(first)&&!f.finished(second));
  f.release(second);await ciPoolUntil(()=>f.started(third),'queued original growth after B1');assert(f.finished(second)&&!f.finished(first)&&!f.started(fourth));
  f.release(third);await ciPoolUntil(()=>f.started(fourth),'mandatory queued setup after growth');assert(f.finished(third)&&!f.finished(first),'The actual fourth setup role overlaps the still-running original source');
  f.release(fourth);await ciPoolUntil(()=>f.finished(fourth),'mandatory setup completion');assert(!f.finished(first),'Setup completion alone cannot finish the source gate');f.release(first);return;
 }
 assert.equal(f.poolId,'completion');assert.equal(f.roles.length,3);
 const[first,second,third]=f.roles;await ciPoolUntil(()=>f.started(first)&&f.started(second),'the first two controlled slots');
 assert(!f.started(third),'The third original command must wait for an execution slot');assert(!f.finished(first));assert(!f.finished(second));
 await ciPoolUntil(()=>f.stdout.includes(first+':stdout:start')&&f.stdout.includes(second+':stderr:start'),'live progress while both children are blocked');
 assert(!f.finished(first)&&!f.finished(second),'Progress must be observable before releasing either child');
 f.release(first);await ciPoolUntil(()=>f.started(third),'The third original command taking the first completed slot');assert(f.finished(first));assert(!f.finished(second),'The next original command starts while the other source slot remains active');f.release(second);f.release(third);
}
function ciPoolAssertAllFinished(f,result,{failure='',evidenceFailure=false,sourceChanged=false}={}){
 assert.equal(result.signal,null);assert.equal(result.code,failure||evidenceFailure||sourceChanged?1:0);const state=f.state();assert.equal(state.phase,'finished');assert.equal(state.active,0);assert.equal(state.maxConcurrent,2);assert.equal(state.cancelled,null);assert.equal(state.sourceUnchanged,!sourceChanged);assert.deepEqual(state.sourceBefore,f.initial);
 assert.equal(state.results.length,f.roles.length);for(const row of state.results){assert(f.finished(row.id),'Every original command must complete before aggregate terminal status');assert.equal(row.status,row.id===failure?'failed':'passed');assert.equal(row.exitCode,row.id===failure?7:0);assert.equal(row.signal,null);assert(row.startedAt&&row.finishedAt);assert.equal(row.bodySha256,ciPoolHash('sha256').update(f.tasks.find(t=>t.id===row.id).body).digest('hex'));}
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
  return{tokenTuple,exitCode:result.code,children:f.roles.length,passed:f.roles.length,maxActive:Math.max(...state.events.map(event=>event.active)),hydrationTokenAbsent:f.events().filter(event=>event.type.startsWith('hydrate-')).every(event=>event.token===false),environments,completeSeparateLogs:true,liveProgressBeforeRelease:true,sourceUnchanged:state.sourceUnchanged};
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
 const restoreIntegrationSchedulingOnly=(path,bytes)=>{
  if(path!=='.github/workflows/shift-coach-integration.yml')return bytes;
  const[before,after]=FOOD_DIARY_LONDON_DATE_POLICY.ciIntegrationGlobalPool20261015.workflowPair;
  assert(after&&bytes.split(after).length===2,'One exact admitted Integration scheduling fragment is required');return bytes.replace(after,before);
 };
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
   const current=content(foodHead,path),previous=content(prior.head,path),restored=restoreWallClockOnly(path,restoreIntegrationSchedulingOnly(path,programmeBeforeToolchainOverlap(path,current)),previous);assert.equal(restored,previous);assert.deepEqual(policy.ciWallClockAllowance20261015InversePairs[path],['    timeout-minutes: '+before+'\n','    timeout-minutes: '+after+'\n']);
   assert.equal(executionOriginalCiWorkflow(path,current),content(c.base,path),'Complete strict inverses still restore the exact original CI workflow');
   for(const changed of[current.replace('    timeout-minutes: '+after+'\n','    timeout-minutes: '+(after+1)+'\n'),current+'\n# unapproved workflow change\n',current.replace('node ','node --trace-warnings '),current.replace('runs-on:','runs-on-unapproved:')])assert.throws(()=>restoreWallClockOnly(path,restoreIntegrationSchedulingOnly(path,programmeBeforeToolchainOverlap(path,changed)),previous),/exact|unchanged/,'Cap admission must reject any additional byte change');
  }
  const production='.github/workflows/cloudflare-production-promote.yml';assert.equal(productionBeforeSourceSchedule(content(foodHead,production)),content(prior.head,production));assert.match(content(foodHead,production),/^    timeout-minutes: 60$/m);
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

// Synthetic scheduler fixture only. No real child, Git command, hydrator,
// repository mutation, credential or production request is executed.
// Draft must be read by root/guard before anyone executes this file.
import ciGlobalFixtureTest from 'node:test';
import ciGlobalFixtureAssert from 'node:assert/strict';
import {EventEmitter as CiGlobalFixtureEventEmitter} from 'node:events';
import {createHash as ciGlobalFixtureCreateHash} from 'node:crypto';
import {mkdtempSync as ciGlobalFixtureMkdtemp,readFileSync as ciGlobalFixtureRead,mkdirSync as ciGlobalFixtureMkdir,writeFileSync as ciGlobalFixtureWrite,appendFileSync as ciGlobalFixtureAppend,renameSync as ciGlobalFixtureRename,rmSync as ciGlobalFixtureRemove} from 'node:fs';
import {join as ciGlobalFixtureJoin,resolve as ciGlobalFixtureResolve,sep as ciGlobalFixtureSep} from 'node:path';
import {tmpdir as ciGlobalFixtureTmpdir} from 'node:os';

// This block is appended to the retained Food test module, whose original
// policy import supplies the actual admitted scheduler source and role bodies.
{
const test=ciGlobalFixtureTest,assert=ciGlobalFixtureAssert,EventEmitter=CiGlobalFixtureEventEmitter,createHash=ciGlobalFixtureCreateHash;
const mkdtempSync=ciGlobalFixtureMkdtemp,readFileSync=ciGlobalFixtureRead,mkdirSync=ciGlobalFixtureMkdir,writeFileSync=ciGlobalFixtureWrite,appendFileSync=ciGlobalFixtureAppend,renameSync=ciGlobalFixtureRename,rmSync=ciGlobalFixtureRemove;
const join=ciGlobalFixtureJoin,resolve=ciGlobalFixtureResolve,sep=ciGlobalFixtureSep,tmpdir=ciGlobalFixtureTmpdir;
const policy=FOOD_DIARY_LONDON_DATE_POLICY,globalPolicy=policy.ciIntegrationGlobalPool20261015;
assert(globalPolicy&&typeof globalPolicy.script==='string','The actual admitted global scheduler policy is required');
const runner=globalPolicy.script;
const sha=text=>createHash('sha256').update(text).digest('hex');
const ROLES=['integration-source','integration-unit'].map(poolId=>({poolId,tasks:policy.ciExecutionPools[poolId].tasks}));
assert.deepEqual(globalPolicy.roles,ROLES,'All twelve retained original role bodies must remain exact');
assert.equal(globalPolicy.maxConcurrent,2);
assert.equal(globalPolicy.taskDeclaration,'const roleSpecs=Object.freeze('+JSON.stringify(ROLES)+');');
assert(runner.includes(globalPolicy.taskDeclaration));
for(const role of ROLES)assert.equal(policy.ciExecutionPools[role.poolId].script,runner,'Both retained role aliases must select the exact same global scheduler');
const SCHEDULE=['integration-tests','release-sources','finite-source','root-sharing','root-preservation','member-consent','finite-growth','photo-calendar','week-source','photo-maintenance','baseline-handoff','member-tests'];
assert.deepEqual(globalPolicy.schedule,SCHEDULE);
assert(runner.includes('const schedule=Object.freeze('+JSON.stringify(SCHEDULE)+');'));
const ALL=ROLES.flatMap(role=>role.tasks.map(task=>({...task,poolId:role.poolId})));
assert.equal(ALL.length,12);assert.equal(new Set(ALL.map(task=>task.body)).size,12);
const TASK_BY_BODY=new Map(ALL.map(task=>[task.body,task]));
const HEAD='a'.repeat(40),TREE='b'.repeat(40),CHANGED_HEAD='c'.repeat(40);
const HYDRATIONS=['reviewed','original-gp','reviewed','original-gp'];
const STATIC_IMPORTS=[
 "import {spawn,execFileSync} from 'node:child_process';\n",
 "import {mkdirSync,writeFileSync,appendFileSync,renameSync} from 'node:fs';\n",
 "import {join} from 'node:path';\n",
 "import {tmpdir} from 'node:os';\n",
 "import {createHash} from 'node:crypto';\n"
];

function instrumentedBody(){
 let source=runner;
 for(const statement of STATIC_IMPORTS){assert.equal(source.split(statement).length,2);source=source.replace(statement,'');}
 const hydrationImports=[
  ["await import('./shift-coach/release-contract.mjs')","await __fixture.importHydrator('reviewed')"],
  ["await import('./release/combined-original-gp-object-20261014.mjs')","await __fixture.importHydrator('original-gp')"]
 ];
 for(const[before,after]of hydrationImports){assert.equal(source.split(before).length,2);source=source.replace(before,after);}
 assert(!/^\s*import\s/m.test(source),'Every static scheduler import must be injected');
 assert(!/\bimport\s*\(/.test(source),'Every scheduler dynamic import must be injected');
 // This return exposes the scheduler's own terminal state; it changes no
 // original branch, assertion, task body, result or evidence operation.
 return source+'\nreturn state();\n';
}
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;

function fixture({failHydrationAt=0,failEvidence=null,initialSourceFailure=false,changeHeadAfterFirstClose=false,spawnFailure=null,spawnFailureMode='sync'}={}){
 const root=mkdtempSync(join(tmpdir(),'shift-integration-global-fixture-'));
 const events=[],hydrations=[],imports=[],spawned=[],children=new Map(),alive=new Set(),kills=[],gitCalls=[];
 let nextPid=710000,maxActive=0,evidenceInjected=false,head=HEAD,initialGitFailed=false,headChanged=false,settled=false,terminalState=null,terminalError=null;
 const env={RUNNER_TEMP:root,PATH:'/fixture-only/bin',GITHUB_SHA:HEAD,GITHUB_TOKEN:'synthetic-fixture-token-not-a-secret',NODE_TEST_CONTEXT:'synthetic-existing-test-context',FIXTURE_PRESERVED:'original-value'};
 const originalEnv=Object.freeze({...env});
 const processFake=new EventEmitter();processFake.env=env;processFake.pid=700000;processFake.exitCode=undefined;
 for(const name of['stdout','stderr']){const stream=new EventEmitter();stream.chunks=[];stream.write=chunk=>{stream.chunks.push(String(chunk));return true;};processFake[name]=stream;}
 const confined=path=>{const absolute=resolve(String(path));assert(absolute===root||absolute.startsWith(root+sep),'The fixture may write only inside its own temporary directory');return absolute;};
 function injectedFailure(operation,path){
  if(evidenceInjected||!failEvidence)return;
  const target=String(path);
  const hit=failEvidence==='initial-io'&&operation==='write'&&target.endsWith('/integration-global/commands.json')
   ||failEvidence==='log-io'&&operation==='append'&&spawned.length>0&&target.endsWith('/integration-tests.stdout.log')
   ||failEvidence==='status-io'&&operation==='rename'&&spawned.length>0&&target.endsWith('/integration-global/status.json');
  if(hit){evidenceInjected=true;throw Object.assign(Error('Declared local evidence-sink failure'),{code:'E_FIXTURE_IO'});}
 }
 const fsFake={
  mkdirSync:(path,options)=>mkdirSync(confined(path),options),
  writeFileSync:(path,...args)=>{injectedFailure('write',path);if(String(path).endsWith('/source.json')){assert.deepEqual(hydrations,HYDRATIONS,'Initial source snapshots follow all four successful hydrations');assert.equal(spawned.length,0);events.push({event:'source-snapshot',hydrations:[...hydrations],spawned:spawned.length});}return writeFileSync(confined(path),...args);},
  appendFileSync:(path,...args)=>{injectedFailure('append',path);return appendFileSync(confined(path),...args);},
  renameSync:(from,to)=>{injectedFailure('rename',to);return renameSync(confined(from),confined(to));}
 };
 const execFake=(file,args,options)=>{
  assert.equal(file,'git','No native command is allowed in the synthetic scheduler fixture');
  assert.deepEqual(args.slice(0,1),['rev-parse']);assert(args.length===2&&['HEAD','HEAD^{tree}'].includes(args[1]),'Only the scheduler source-identity reads may be faked');
  gitCalls.push([...args]);events.push({event:'source-read',args:[...args],hydrations:[...hydrations],spawned:spawned.length});
  if(initialSourceFailure&&!initialGitFailed){initialGitFailed=true;throw Object.assign(Error('Declared initial source-binding failure'),{code:'E_FIXTURE_SOURCE'});}
  const output=(args[1]==='HEAD'?head:TREE)+'\n';return options?.encoding?output:Buffer.from(output);
 };
 function finish(id,{code=0,signal=null,emitLogs=true,streamError=false}={}){
  const child=children.get(id);assert(child&&alive.has(child.pid),'Only an active synthetic child may finish: '+id);
  if(emitLogs){child.stdout.emit('data',Buffer.from(id+':stdout:start\n'));child.stderr.emit('data',Buffer.from(id+':stderr:start\n'));child.stdout.emit('data',Buffer.from(id+':stdout:complete\n'));child.stderr.emit('data',Buffer.from(id+':stderr:complete\n'));}
  if(streamError)child.stdout.emit('error',Object.assign(Error('Declared fixture stream failure'),{code:'E_FIXTURE_STREAM'}));
  alive.delete(child.pid);events.push({event:'close',id,pid:child.pid,active:alive.size,code,signal});
  if(changeHeadAfterFirstClose&&!headChanged){head=CHANGED_HEAD;headChanged=true;}
  child.emit('close',code,signal);
 }
 const spawnFake=(file,args,options)=>{
  assert.equal(file,'bash');assert.deepEqual(args.slice(0,-1),['--noprofile','--norc','-e','-o','pipefail','-c']);
  const task=TASK_BY_BODY.get(args.at(-1));assert(task,'An altered or extra original command must never be executed');
  assert.deepEqual(options.env,originalEnv,'Each original child environment, token and NODE_TEST_CONTEXT must remain unchanged');
  assert.deepEqual(options.stdio,['ignore','pipe','pipe']);assert.equal(options.detached,true);
  assert.deepEqual(hydrations,HYDRATIONS,'All four serial original-role hydrations must finish before any task');
  assert.equal(events.filter(event=>event.event==='source-snapshot').length,2,'Both original source snapshots must precede any child');
  assert(events.filter(event=>event.event==='source-read').slice(0,4).every(event=>event.spawned===0&&JSON.stringify(event.hydrations)===JSON.stringify(HYDRATIONS)),'Initial native source reads must follow all four hydrations');
  assert(!spawned.some(row=>row.id===task.id),'An original command must start only once');
  assert(alive.size<2,'One global two-slot limit must cover both original roles');
  const child=new EventEmitter();child.pid=nextPid++;child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.id=task.id;
  spawned.push({id:task.id,poolId:task.poolId,body:args.at(-1),env:{...options.env},pid:child.pid});
  if(task.id===spawnFailure&&spawnFailureMode==='sync'){events.push({event:'spawn-failed',id:task.id,active:alive.size});throw Object.assign(Error('Declared fake spawn failure'),{code:'E_FIXTURE_SPAWN'});}
  children.set(task.id,child);alive.add(child.pid);maxActive=Math.max(maxActive,alive.size);events.push({event:'spawn',id:task.id,pid:child.pid,active:alive.size});
  if(task.id===spawnFailure&&spawnFailureMode==='async')queueMicrotask(()=>{
   alive.delete(child.pid);events.push({event:'spawn-error',id:task.id,pid:child.pid,active:alive.size});
   child.emit('error',Object.assign(Error('Declared asynchronous fake spawn failure'),{code:'E_FIXTURE_SPAWN'}));
   events.push({event:'close',id:task.id,pid:child.pid,active:alive.size,code:null,signal:null});child.emit('close',null,null);
  });
  return child;
 };
 processFake.kill=(pid,signal)=>{
  assert(Number.isInteger(pid)&&pid<0,'Cancellation may target only an owned synthetic group');assert.equal(signal,'SIGTERM');
  const child=[...children.values()].find(value=>value.pid===-pid&&alive.has(value.pid));if(!child)throw Object.assign(Error('No such synthetic child'),{code:'ESRCH'});
  kills.push({pid,signal,id:child.id});queueMicrotask(()=>{if(alive.has(child.pid))finish(child.id,{code:null,signal:'SIGTERM',emitLogs:false});});return true;
 };
 const importHydrator=async kind=>{
  assert(['reviewed','original-gp'].includes(kind));imports.push(kind);
  const hydrate=()=>{hydrations.push(kind);events.push({event:'hydrate',kind,ordinal:hydrations.length,active:alive.size});assert.equal(alive.size,0);if(hydrations.length===failHydrationAt)throw Object.assign(Error('Declared fake hydration failure'),{code:'E_FIXTURE_HYDRATION'});};
  return kind==='reviewed'?{ensureReviewedHistory:hydrate}:{ensureCombinedOriginalGpSource:hydrate};
 };
 const forbidden=()=>{throw Error('No real network, module, timer or external operation is allowed in this fixture');};
 const execute=new AsyncFunction('spawn','execFileSync','mkdirSync','writeFileSync','appendFileSync','renameSync','join','tmpdir','createHash','process','__fixture','fetch','require','globalThis','setTimeout','setInterval',instrumentedBody());
 const terminal=execute(spawnFake,execFake,fsFake.mkdirSync,fsFake.writeFileSync,fsFake.appendFileSync,fsFake.renameSync,join,()=>root,createHash,processFake,{importHydrator},forbidden,forbidden,Object.freeze({}),forbidden,forbidden);
 terminal.then(value=>{settled=true;terminalState=value;},error=>{settled=true;terminalError=error;});
 return{root,events,hydrations,imports,spawned,children,alive,kills,gitCalls,env:originalEnv,process:processFake,terminal,finish,
  get maxActive(){return maxActive;},get settled(){return settled;},get terminalState(){return terminalState;},get terminalError(){return terminalError;},get evidenceInjected(){return evidenceInjected;},
  read:(role,file)=>readFileSync(join(root,'ci-source-proof',role,file),'utf8'),json:(role,file='status.json')=>JSON.parse(readFileSync(join(root,'ci-source-proof',role,file),'utf8')),
  async until(predicate,label){for(let tries=0;tries<1000;tries++){if(predicate())return;if(settled){if(terminalError)throw terminalError;throw Error('Scheduler ended before '+label);}await new Promise(setImmediate);}throw Error('Synthetic scheduler did not reach '+label);},
  async close(){if(!settled){processFake.emit('SIGTERM');for(const child of children.values())if(alive.has(child.pid))finish(child.id,{code:null,signal:'SIGTERM',emitLogs:false});await terminal.catch(()=>{});}rmSync(root,{recursive:true,force:true});}
 };
}

async function drain(f,{failId=null,streamErrorId=null}={}){
 for(const id of SCHEDULE){await f.until(()=>f.spawned.some(task=>task.id===id),'start '+id);const child=f.children.get(id);if(child&&f.alive.has(child.pid))f.finish(id,{code:id===failId?7:0,streamError:id===streamErrorId});}
 return f.terminal;
}
function assertAllOriginalsOnce(f){
 assert.deepEqual(f.spawned.map(task=>task.id),SCHEDULE);assert.equal(f.spawned.length,12);assert.equal(f.maxActive,2);assert.equal(f.alive.size,0);
 assert.deepEqual(f.process.env,f.env,'The scheduler parent environment, token and NODE_TEST_CONTEXT must remain unchanged');
 for(const actual of f.spawned){assert.equal(actual.body,ALL.find(task=>task.id===actual.id).body);assert.deepEqual(actual.env,f.env);}
 assert.deepEqual(f.hydrations,HYDRATIONS);assert.deepEqual(f.imports,HYDRATIONS);assert(f.events.filter(event=>event.event==='hydrate').every(event=>event.active===0));
}
function assertRoleEvidence(f,{failedId=null}={}){
 for(const role of ROLES){
  const commands=f.json(role.poolId,'commands.json'),state=f.json(role.poolId);
  assert.deepEqual(commands,{poolId:role.poolId,maxConcurrent:2,tasks:role.tasks});assert.deepEqual(state.results.map(result=>result.id),role.tasks.map(task=>task.id));
  assert.equal(state.globalPoolId,'integration-global');assert.equal(state.globalMaxConcurrent,2);assert.equal(state.active,0);assert.equal(state.hydrationPassed,true);assert.equal(state.sourceUnchanged,true);
  assert.deepEqual(f.json(role.poolId,'source-final.json'),{before:{head:HEAD,tree:TREE},after:{head:HEAD,tree:TREE},unchanged:true});
  const tsv=f.read(role.poolId,'status.tsv').trimEnd().split('\n');assert.equal(tsv[0],'id\tstatus\texitCode\tsignal\tstartedAt\tfinishedAt');assert.deepEqual(tsv.slice(1).map(line=>line.split('\t')[0]),role.tasks.map(task=>task.id));
  assert.deepEqual(tsv.slice(1),state.results.map(result=>[result.id,result.status,result.exitCode??'',result.signal??'',result.startedAt??'',result.finishedAt??''].join('\t')),'Every TSV result field must match its original-role JSON result');
  for(const task of role.tasks){
   const result=state.results.find(result=>result.id===task.id);assert.equal(result.bodySha256,sha(task.body));assert.equal(result.status,task.id===failedId?'failed':'passed');assert.equal(result.exitCode,task.id===failedId?7:0);assert(result.startedAt&&result.finishedAt);
   assert.equal(f.read(role.poolId,task.id+'.stdout.log'),task.id+':stdout:start\n'+task.id+':stdout:complete\n');
   assert.equal(f.read(role.poolId,task.id+'.stderr.log'),task.id+':stderr:start\n'+task.id+':stderr:complete\n');
   assert.equal(f.read(role.poolId,task.id+'.log'),task.id+':stdout:start\n'+task.id+':stderr:start\n'+task.id+':stdout:complete\n'+task.id+':stderr:complete\n');
  }
 }
}

test('exact global runner starts the two long unit commands first, overlaps source work, and preserves all role evidence',async()=>{
 const f=fixture();try{
  await f.until(()=>f.spawned.length===2,'first two original unit commands');assert.deepEqual(f.spawned.map(task=>task.id),SCHEDULE.slice(0,2));
  const long=f.children.get('integration-tests');assert(f.alive.has(long.pid));
  for(const id of SCHEDULE.slice(1)){await f.until(()=>f.spawned.some(task=>task.id===id),'overlapped '+id);assert(f.alive.has(long.pid),'The long original unit command remains active while source tasks progress');f.finish(id);}
  assert(f.json('integration-source').results.every(result=>result.status==='passed'));assert.equal(f.settled,false,'The global pool must wait for the long original unit child');
  f.finish('integration-tests');const state=await f.terminal;assert.equal(f.process.exitCode,0);assertAllOriginalsOnce(f);assertRoleEvidence(f);assert.equal(state.events.at(-1).failed,false);
  assert(f.events.some(event=>event.event==='spawn'&&event.id==='finite-source'&&event.active===2));
 }finally{await f.close();}
});

test('failure of any one of the twelve exact originals waits for every other original and retains complete role logs',async()=>{
 for(const failedId of SCHEDULE){const f=fixture();try{const state=await drain(f,{failId:failedId});assert.equal(f.process.exitCode,1,failedId);assertAllOriginalsOnce(f);assertRoleEvidence(f,{failedId});assert.equal(state.events.at(-1).failed,true);assert.equal(state.results.filter(result=>result.status==='failed').length,1);}finally{await f.close();}}
});

test('cancellation targets only both owned synthetic groups, starts no queued command and waits for their close events',async()=>{
 const f=fixture();try{await f.until(()=>f.spawned.length===2,'two active owned fixture groups');f.process.emit('SIGTERM');const state=await f.terminal;
  assert.equal(f.process.exitCode,1);assert.equal(f.alive.size,0);assert.deepEqual(f.spawned.map(task=>task.id),SCHEDULE.slice(0,2));assert.deepEqual(f.kills.map(row=>row.id),SCHEDULE.slice(0,2));assert(f.kills.every(row=>row.pid<0&&row.signal==='SIGTERM'));
  assert.equal(state.cancelled,'SIGTERM');assert.equal(state.active,0);assert.equal(state.results.filter(result=>result.status==='signalled').length,2);assert.equal(state.results.filter(result=>result.status==='cancelled-before-start').length,10);assert(state.results.every(result=>result.finishedAt));assert.equal(state.events.at(-1).failed,true);
 }finally{await f.close();}
});

test('failure at any of the four serial fake hydrations starts no original command',async()=>{
 for(const ordinal of[1,2,3,4]){const f=fixture({failHydrationAt:ordinal});try{const state=await f.terminal;assert.equal(f.process.exitCode,1);assert.equal(f.spawned.length,0);assert.deepEqual(f.hydrations,HYDRATIONS.slice(0,ordinal));assert.equal(f.alive.size,0);assert.equal(state.hydrationFailure.code,'E_FIXTURE_HYDRATION');assert(state.results.every(result=>result.status==='not-started'&&result.pid===null));assert.equal(state.events.at(-1).failed,true);}finally{await f.close();}}
});

test('initial source/evidence failures start no child, and a changed HEAD with the same tree cannot pass',async()=>{
 for(const options of[{initialSourceFailure:true},{failEvidence:'initial-io'}]){const f=fixture(options);try{const state=await f.terminal;assert.equal(f.process.exitCode,1);assert.equal(f.spawned.length,0);assert.deepEqual(f.hydrations,options.initialSourceFailure?HYDRATIONS:[]);assert(state.results.every(result=>result.status==='not-started'));assert.equal(state.evidenceFailed,true);}finally{await f.close();}}
 const f=fixture({changeHeadAfterFirstClose:true});try{const state=await drain(f);assertAllOriginalsOnce(f);assert.equal(f.process.exitCode,1);assert(state.roles.every(role=>role.sourceUnchanged===false));for(const role of state.roles){assert.deepEqual(role.sourceBefore,{head:HEAD,tree:TREE});assert.deepEqual(role.sourceAfter,{head:CHANGED_HEAD,tree:TREE});}assert.equal(state.events.at(-1).failed,true);}finally{await f.close();}
});

test('mid-run log/status or child-stream evidence failures cannot become success or abandon remaining originals',async()=>{
 for(const kind of['log-io','status-io','stream-error']){const f=fixture({failEvidence:kind==='stream-error'?null:kind});try{const state=await drain(f,{streamErrorId:kind==='stream-error'?'integration-tests':null});assertAllOriginalsOnce(f);assert.equal(f.process.exitCode,1);assert.equal(state.evidenceFailed,true);assert(state.results.every(result=>result.status==='passed'),'Evidence failure is separate from original child exit status');assert.equal(state.events.at(-1).failed,true);assert(state.evidenceErrors.some(error=>error.code===(kind==='stream-error'?'E_FIXTURE_STREAM':'E_FIXTURE_IO')));if(kind!=='stream-error')assert.equal(f.evidenceInjected,true);}finally{await f.close();}}
});

test('a fake spawn failure is recorded once while every remaining original still runs',async()=>{
 for(const spawnFailureMode of['sync','async']){
  const f=fixture({spawnFailure:'finite-source',spawnFailureMode});try{const state=await drain(f);assertAllOriginalsOnce(f);assert.equal(f.process.exitCode,1);const failed=state.results.find(result=>result.id==='finite-source');assert.equal(failed.status,'spawn-failed');assert.equal(failed.errorCode,'E_FIXTURE_SPAWN');assert.equal(state.results.filter(result=>result.status==='passed').length,11);assert.equal(state.events.filter(event=>event.event==='command-finished'&&event.id==='finite-source').length,1,'An error followed by close must settle the failed child exactly once');assert.equal(state.events.filter(event=>event.event==='command-finished').length,12);assert.equal(state.events.at(-1).failed,true);if(spawnFailureMode==='async')assert.equal(f.events.filter(event=>event.event==='spawn-error'&&event.id==='finite-source').length,1);}finally{await f.close();}
 }
});
}

/* Pure mechanics appended to the actual Food policy. No real children,
   hydrators, browser, network or installation command executes in this fixture. */
import programmeToolchainFixtureTest from 'node:test';
import programmeToolchainFixtureAssert from 'node:assert/strict';
import * as programmeToolchainFixtureFs from 'node:fs';
import * as programmeToolchainFixturePath from 'node:path';
import * as programmeToolchainFixtureOs from 'node:os';
import * as programmeToolchainFixtureEvents from 'node:events';
import * as programmeToolchainFixtureCrypto from 'node:crypto';
{
const test=programmeToolchainFixtureTest,assert=programmeToolchainFixtureAssert;
const {readFileSync,mkdtempSync,mkdirSync,writeFileSync,appendFileSync,renameSync,rmSync}=programmeToolchainFixtureFs;
const {join,resolve,sep}=programmeToolchainFixturePath;
const {tmpdir}=programmeToolchainFixtureOs;
const {EventEmitter}=programmeToolchainFixtureEvents;
const {createHash}=programmeToolchainFixtureCrypto;
const setupPolicy=FOOD_DIARY_LONDON_DATE_POLICY,packet=setupPolicy.ciProgrammeToolchainPool20261015,setupPrior=setupPolicy.ciProgrammeToolchainOverlap20261015Prior;
const runner=setupPolicy.ciExecutionPools.programme.script;
const current=content(foodHead,packet.workflowPath),original=content(setupPrior.head,packet.workflowPath);
const inverse={before:packet.workflowPair[0],after:packet.workflowPair[1]};
const tasks=[...packet.originalTasks,packet.setupTask],ids=tasks.map(task=>task.id);
const expectedBodies=new Map(tasks.map(task=>[task.body,task]));
const HEAD='a'.repeat(40),TREE='b'.repeat(40),CHANGED='c'.repeat(40);
const hash=value=>createHash('sha256').update(value).digest('hex');
const blob=value=>createHash('sha1').update('blob '+Buffer.byteLength(value)+'\0').update(value).digest('hex');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;

function injectedBody(){
 let value=runner;
 for(const literal of[
  "import {spawn,execFileSync} from 'node:child_process';\n",
  "import {mkdirSync,writeFileSync,appendFileSync,renameSync} from 'node:fs';\n",
  "import {join} from 'node:path';\n",
  "import {tmpdir} from 'node:os';\n",
  "import {createHash} from 'node:crypto';\n",
 ]){assert.equal(value.split(literal).length,2);value=value.replace(literal,'');}
 for(const[before,after]of[
  ["await import('./shift-coach/release-contract.mjs')","await __fixture.hydrator('reviewed')"],
  ["await import('./release/combined-original-gp-object-20261014.mjs')","await __fixture.hydrator('original-gp')"],
 ]){assert.equal(value.split(before).length,2);value=value.replace(before,after);}
 assert(!/^\s*import\s/m.test(value));assert(!/\bimport\s*\(/.test(value));
 return value+'\nreturn state();\n';
}

function fixture({changeHead=false,evidenceFailure=null,spawnFailure=null,hydrationFailure=null}={}){
 const dir=mkdtempSync(join(tmpdir(),'shift-programme-toolchain-fixture-'));
 const events=[],spawns=[],children=new Map(),alive=new Set(),kills=[],hydrations=[],gitCalls=[];
 const originalEnv={RUNNER_TEMP:join(dir,'runner-temp'),PATH:'/fixture-only/bin',GITHUB_TOKEN:'synthetic-programme-token',NODE_TEST_CONTEXT:'existing-synthetic-context',PRESERVED:'unchanged'};
 const processFake=new EventEmitter();processFake.env={...originalEnv};processFake.pid=810000;processFake.exitCode=undefined;
 for(const key of['stdout','stderr']){processFake[key]=new EventEmitter();processFake[key].chunks=[];processFake[key].write=value=>{processFake[key].chunks.push(String(value));return true;};}
 let nextPid=820000,peak=0,head=HEAD,changed=false,injected=false,settled=false,terminalState=null,terminalError=null,browserInvocations=0;
 const confined=path=>{const absolute=resolve(dir,String(path));assert(absolute===dir||absolute.startsWith(dir+sep));return absolute;};
 function failEvidence(operation,path){
  const hit=!injected&&(evidenceFailure==='log'&&operation==='append'&&String(path).endsWith('/browser-toolchain.stdout.log')
   ||evidenceFailure==='status'&&operation==='rename'&&spawns.length>0&&String(path).endsWith('/status.json'));
  if(hit){injected=true;throw Object.assign(Error('Declared fake evidence failure'),{code:'E_FIXTURE_IO'});}
 }
 const fsFake={
  mkdirSync:(path,...args)=>mkdirSync(confined(path),...args),
  writeFileSync:(path,...args)=>writeFileSync(confined(path),...args),
  appendFileSync:(path,...args)=>{failEvidence('append',path);return appendFileSync(confined(path),...args);},
  renameSync:(before,after)=>{failEvidence('rename',after);return renameSync(confined(before),confined(after));},
 };
 const execFake=(file,args,options)=>{
  assert.equal(file,'git');assert.deepEqual(args.slice(0,1),['rev-parse']);assert.equal(args.length,2);assert(['HEAD','HEAD^{tree}'].includes(args[1]));
  gitCalls.push([...args]);events.push({kind:'source-read',args:[...args],spawned:spawns.length});const value=(args[1]==='HEAD'?head:TREE)+'\n';return options?.encoding?value:Buffer.from(value);
 };
 function finish(id,{code=0,signal=null,logs=true,streamError=false}={}){
  const child=children.get(id);assert(child&&alive.has(child.pid),'Only an owned active fake child may finish');
  if(logs){child.stdout.emit('data',Buffer.from(id+':stdout:start\n'));child.stderr.emit('data',Buffer.from(id+':stderr:start\n'));child.stdout.emit('data',Buffer.from(id+':stdout:complete\n'));child.stderr.emit('data',Buffer.from(id+':stderr:complete\n'));}
  if(streamError)child.stdout.emit('error',Object.assign(Error('Declared fake stream failure'),{code:'E_FIXTURE_STREAM'}));
  alive.delete(child.pid);events.push({kind:'close',id,code,signal,active:alive.size});
  if(changeHead&&!changed){changed=true;head=CHANGED;}
  child.emit('close',code,signal);
 }
 const spawnFake=(file,args,options)=>{
  assert.equal(file,'bash');assert.deepEqual(args.slice(0,-1),['--noprofile','--norc','-e','-o','pipefail','-c']);assert.equal(args.length,7);
  const task=expectedBodies.get(args.at(-1));assert(task,'Only an exact original source or exact serial setup body may run');
  assert.deepEqual(options.stdio,['ignore','pipe','pipe']);assert.equal(options.detached,true);
  assert.deepEqual(hydrations,['reviewed','original-gp']);assert(alive.size<2);assert(!spawns.some(row=>row.id===task.id));
  const expected={...originalEnv};if(task.id!=='growth-preflight')delete expected.GITHUB_TOKEN;
  assert.deepEqual(options.env,expected,'Original environment and exact growth-only token tuple remain unchanged');
  assert.equal(gitCalls.length,2,'Initial native source identity is captured exactly once before commands');
  const child=new EventEmitter();child.pid=nextPid++;child.id=task.id;child.stdout=new EventEmitter();child.stderr=new EventEmitter();
  spawns.push({id:task.id,body:args.at(-1),env:{...options.env},pid:child.pid});
  if(task.id===spawnFailure)throw Object.assign(Error('Declared fake spawn failure'),{code:'E_FIXTURE_SPAWN'});
  children.set(task.id,child);alive.add(child.pid);peak=Math.max(peak,alive.size);events.push({kind:'spawn',id:task.id,active:alive.size});return child;
 };
 processFake.kill=(pid,signal)=>{
  assert(pid<0&&Number.isInteger(pid));assert.equal(signal,'SIGTERM');const child=[...children.values()].find(value=>value.pid===-pid&&alive.has(value.pid));
  if(!child)throw Object.assign(Error('No owned fake group'),{code:'ESRCH'});
  kills.push({pid,signal,id:child.id});queueMicrotask(()=>{if(alive.has(child.pid))finish(child.id,{code:null,signal:'SIGTERM',logs:false});});return true;
 };
 const hydrator=async kind=>{
  assert(!Object.hasOwn(processFake.env,'GITHUB_TOKEN'),'Hydrator import must not inherit the Programme token');
  const hydrate=()=>{assert(!Object.hasOwn(processFake.env,'GITHUB_TOKEN'));assert.equal(spawns.length,0);hydrations.push(kind);if(kind===hydrationFailure)throw Object.assign(Error('Declared fake hydration failure'),{code:'E_FIXTURE_HYDRATION'});};
  return kind==='reviewed'?{ensureReviewedHistory:hydrate}:{ensureCombinedOriginalGpSource:hydrate};
 };
 const forbidden=()=>{throw Error('No real network, process, import or external operation is permitted');};
 const execute=new AsyncFunction('spawn','execFileSync','mkdirSync','writeFileSync','appendFileSync','renameSync','join','tmpdir','createHash','process','__fixture','fetch','require','globalThis','setTimeout','setInterval',injectedBody());
 const terminal=execute(spawnFake,execFake,fsFake.mkdirSync,fsFake.writeFileSync,fsFake.appendFileSync,fsFake.renameSync,join,()=>dir,createHash,processFake,{hydrator},forbidden,forbidden,Object.freeze({}),forbidden,forbidden);
 terminal.then(value=>{terminalState=value;settled=true;},error=>{terminalError=error;settled=true;});
 return {dir,events,spawns,alive,kills,hydrations,gitCalls,process:processFake,terminal,finish,
  get peak(){return peak;},get settled(){return settled;},get terminalState(){return terminalState;},get terminalError(){return terminalError;},get injected(){return injected;},
  get browserInvocations(){return browserInvocations;},
  read:name=>readFileSync(join(dir,'programme-day-proof/source-gates',name),'utf8'),
  async until(predicate,label){for(let tries=0;tries<1000;tries++){if(predicate())return;if(settled){if(terminalError)throw terminalError;throw Error('Runner ended before '+label);}await new Promise(setImmediate);}throw Error('Fake runner did not reach '+label);},
  async workflowBarrier(){const value=await terminal;if(processFake.exitCode===0){assert.equal(value.phase,'finished');assert.equal(value.cancelled,null);assert.equal(value.active,0);assert.equal(value.evidenceFailed,false);assert.equal(value.sourceUnchanged,true);assert.equal(value.results.length,4);assert(value.results.every(row=>row.status==='passed'&&row.exitCode===0));browserInvocations++;}return value;},
  async close(){if(!settled){processFake.emit('SIGTERM');await terminal.catch(()=>{});}assert.equal(alive.size,0);rmSync(dir,{recursive:true,force:true});}
 };
}

async function drain(f,{failedId=null,streamErrorId=null}={}){
 for(const id of ids){await f.until(()=>f.spawns.some(row=>row.id===id),'start '+id);const row=f.spawns.find(row=>row.id===id);if(f.alive.has(row.pid))f.finish(id,{code:id===failedId?7:0,streamError:id===streamErrorId});}
 return f.workflowBarrier();
}

function allOnce(f,state,{failedId=null,completeLogs=true}={}){
 assert.deepEqual(f.spawns.map(row=>row.id),ids);assert.equal(f.peak,2);assert.equal(f.alive.size,0);
 assert.deepEqual(state.results.map(row=>row.id),ids);assert.equal(state.maxConcurrent,2);assert.equal(state.active,0);assert.equal(state.phase,'finished');
 assert.deepEqual(f.hydrations,['reviewed','original-gp']);assert.deepEqual(f.gitCalls,[['rev-parse','HEAD'],['rev-parse','HEAD^{tree}'],['rev-parse','HEAD'],['rev-parse','HEAD^{tree}']]);
 for(const task of tasks){const result=state.results.find(row=>row.id===task.id);assert.equal(result.bodySha256,hash(task.body));assert.equal(result.status,task.id===failedId?'failed':'passed');assert.equal(result.exitCode,task.id===failedId?7:0);if(completeLogs){assert.equal(f.read(task.id+'.stdout.log'),task.id+':stdout:start\n'+task.id+':stdout:complete\n');assert.equal(f.read(task.id+'.stderr.log'),task.id+':stderr:start\n'+task.id+':stderr:complete\n');}}
 assert.deepEqual(JSON.parse(f.read('commands.json')).tasks,tasks);
 assert.deepEqual(f.read('status.tsv').trim().split('\n'),ids.map(id=>id+'\t'+(id===failedId?7:0)));
}

test('Programme toolchain: private full inverse retains exact source tuples scheduler cap and actual browser suffix',()=>{
 assert.equal(blob(original),'e5687f8cade5478a8b8abbf3463ec47746dabb48');assert.equal(blob(current),packet.newBlob);assert.equal(hash(current),packet.newSha256);assert.equal(hash(runner),packet.runnerSha256);
 assert.equal(current.split(inverse.after).length,2);assert.equal(current.replace(inverse.after,inverse.before),original);
 assert.equal(packet.maxConcurrent,2);assert.equal(packet.timeoutMinutes,120);assert.match(current,/^    timeout-minutes: 120$/m);
 const declaration=runner.match(/^const tasks=Object\.freeze\((.*)\);$/m)[1];assert.deepEqual(JSON.parse(declaration),tasks);assert.deepEqual(ids,['source-tests','b1-scope','growth-preflight','browser-toolchain']);assert.equal(Object.hasOwn(tasks[3],'tokenRole'),false);
 const setup='npm install --prefix "$RUNNER_TEMP/programme-tools" --no-audit --no-fund playwright@1.63.0\n"$RUNNER_TEMP/programme-tools/node_modules/.bin/playwright" install --with-deps chromium';assert.equal(tasks[3].body,setup);
 const marker='      - run: node scripts/verify-programme-day.cjs\n';assert.equal(current.slice(current.indexOf(marker)),original.slice(original.indexOf(marker)),'Browser/env/upload suffix remains actual byte-identical');
 assert(!current.slice(current.indexOf('          SHIFT_CI_POOL\n')).includes('npm install'));
});

test('Programme toolchain: one fourth setup slot overlaps the long source only after its queued turn and all four run once',async()=>{
 const f=fixture();try{
  await f.until(()=>f.spawns.length===2,'first two source commands');assert.deepEqual(f.spawns.map(row=>row.id),ids.slice(0,2));f.finish('b1-scope');await f.until(()=>f.spawns.length===3,'queued original growth');
  assert.equal(f.spawns.some(row=>row.id==='browser-toolchain'),false);f.finish('growth-preflight');await f.until(()=>f.spawns.length===4,'queued setup');
  assert(f.alive.has(f.spawns.find(row=>row.id==='source-tests').pid));f.finish('browser-toolchain');assert.equal(f.settled,false);assert.equal(f.browserInvocations,0,'Setup success alone cannot open the browser barrier');
  f.finish('source-tests');const state=await f.workflowBarrier();allOnce(f,state);assert.equal(f.process.exitCode,0);assert.equal(f.browserInvocations,1);assert.equal(state.events.at(-1).failed,false);
 }finally{await f.close();}
});

test('Programme toolchain: failure of any original source or mandatory serial setup waits all four and blocks browser acceptance',async()=>{
 for(const failedId of ids){const f=fixture();try{const state=await drain(f,{failedId});allOnce(f,state,{failedId});assert.equal(f.process.exitCode,1);assert.equal(f.browserInvocations,0);assert.equal(state.events.at(-1).failed,true);}finally{await f.close();}}
});

test('Programme toolchain: cancellation stops only owned active groups waits their close and starts neither queued growth nor setup',async()=>{
 const f=fixture();try{await f.until(()=>f.spawns.length===2,'two owned groups');f.process.emit('SIGTERM');const state=await f.workflowBarrier();assert.equal(f.process.exitCode,1);assert.equal(f.browserInvocations,0);assert.equal(f.alive.size,0);assert.deepEqual(f.spawns.map(row=>row.id),ids.slice(0,2));assert.deepEqual(f.kills.map(row=>row.id),ids.slice(0,2));assert(state.results.slice(0,2).every(row=>row.status==='signalled'));assert(state.results.slice(2).every(row=>row.status==='cancelled-before-start'));assert.equal(state.cancelled,'SIGTERM');}finally{await f.close();}
});

test('Programme toolchain: fresh source drift with the same tree and evidence sink or stream failures cannot produce browser success',async()=>{
 for(const options of[{changeHead:true},{evidenceFailure:'log'},{evidenceFailure:'status'},{streamErrorId:'browser-toolchain'}]){
  const f=fixture(options);try{const state=await drain(f,{streamErrorId:options.streamErrorId});assert.equal(f.process.exitCode,1);assert.equal(f.browserInvocations,0);assert.equal(f.alive.size,0);assert.equal(f.spawns.length,4);assert(state.results.every(row=>row.status==='passed'));
   if(options.changeHead){assert.equal(state.sourceUnchanged,false);assert.deepEqual(state.sourceBefore,{head:HEAD,tree:TREE});assert.deepEqual(state.sourceAfter,{head:CHANGED,tree:TREE});}else{assert.equal(state.evidenceFailed,true);assert(state.evidenceErrors.length>0);if(options.evidenceFailure)assert.equal(f.injected,true);}
  }finally{await f.close();}
 }
});

test('Programme toolchain: failed setup spawn is mandatory and failed hydration starts no source or install process',async()=>{
 const f=fixture({spawnFailure:'browser-toolchain'});try{const state=await drain(f);assert.equal(f.spawns.length,4);assert.equal(f.alive.size,0);assert.equal(f.process.exitCode,1);assert.equal(f.browserInvocations,0);assert.equal(state.results[3].status,'spawn-failed');assert.equal(state.results[3].errorCode,'E_FIXTURE_SPAWN');assert(state.results.slice(0,3).every(row=>row.status==='passed'));}finally{await f.close();}
 for(const kind of['reviewed','original-gp']){const f=fixture({hydrationFailure:kind});try{const state=await f.workflowBarrier();assert.equal(f.spawns.length,0);assert.equal(f.process.exitCode,1);assert.equal(f.browserInvocations,0);assert(state.results.every(row=>row.status==='not-started'));}finally{await f.close();}}
});

test('Programme toolchain: raw fourth-role admission rejects omission body token barrier cap and slot drift',()=>{
 assert.deepEqual(setupPolicy.ciExecutionPools.programme.tasks,tasks);
 assert.deepEqual(tasks.slice(0,3),packet.originalTasks);
 assert.deepEqual(c.ciProgrammeToolchainOverlap20261015,setupPolicy.ciProgrammeToolchainOverlap20261015);
 assert.equal(c.originalFood48ByteExactInverse,true);
 const path=packet.workflowPath,check=bytes=>assert.equal(executionOriginalCiWorkflow(path,bytes),content(c.base,path));
 check(current);
 const declared=setupPolicy.ciExecutionPools.programme.taskDeclaration;
 assert.equal(current.split(declared).length,2);
 const mutations=[
  value=>value.replace(declared,'const tasks=Object.freeze('+JSON.stringify(tasks.slice(0,3))+');'),
  value=>value.replace(declared,'const tasks=Object.freeze('+JSON.stringify(tasks.map(t=>t.id==='browser-toolchain'?{...t,body:t.body.split('\n').reverse().join('\n')}:t))+');'),
  value=>value.replace(declared,'const tasks=Object.freeze('+JSON.stringify(tasks.map(t=>t.id==='browser-toolchain'?{...t,tokenRole:'programme-growth'}:t))+');'),
  value=>value.replace('process.exitCode=failed?1:0;','process.exitCode=0;'),
  value=>value.replace('const maxConcurrent=2;','const maxConcurrent=3;'),
  value=>value.replace('    timeout-minutes: 120\n','    timeout-minutes: 121\n'),
  value=>value.replace('      - run: node scripts/verify-programme-day.cjs\n','      - run: node scripts/verify-programme-day.cjs # unapproved\n'),
 ];
 for(const mutate of mutations){const changed=mutate(current);assert.notEqual(changed,current);assert.throws(()=>check(changed));}
});
}


import './fresh-food-source-clean-20261015.test.mjs';

// Pure source/binding witnesses only. The unchanged frozen39 native helper
// cases remain required; these three cases are not real-module acceptance.
{
 const directScopePath='release/food-diary-london-date-scope-20261015.mjs';
 const directTestPath='tests/food-diary-london-date-stack-20261015.test.mjs';
 const directPolicy=FOOD_DIARY_LONDON_DATE_POLICY;
 const directPrior=directPolicy.directFoodNativeCleanExtension20261015Prior;
 const directCurrentSource=content(foodHead,directScopePath);
 const directPriorSource=content(directPrior.head,directScopePath);
 const directPolicyLine=/^const policy=(\{[^\n]+\});\nconst manifest=/m;
 const directLine=(bytes,prefix)=>{const matches=bytes.split('\n').filter(line=>line.startsWith(prefix));assert.equal(matches.length,1);return matches[0];};
 const directInverse=(bytes,pairs)=>{for(const[before,after,kind]of[...pairs].reverse()){assert(after&&bytes.split(after).length===2);if(kind==='suffix')assert(bytes.endsWith(after));bytes=bytes.replace(after,before);}return bytes;};
 function directBinding(facts,readFacts,privateW=null){
  const declaration=directLine(directCurrentSource,' const {blob,content,diff,ancestor}=privateW??foodNativeFacts,');
  return new Function('privateW','foodNativeFacts','foodNativeReadFacts',declaration+'\nreturn {blob,content,diff,ancestor,currentHead,clean};')(privateW,facts,readFacts);
 }
 function directReadFacts(facts,hint){
  const declaration=directLine(directCurrentSource,'const foodNativeReadFacts=Object.freeze(');
  return new Function('foodNativeFacts','freshFoodSourceClean',declaration+'\nreturn foodNativeReadFacts;')(facts,hint);
 }
 test('Food direct clean extension: complete prior94 scope and all earlier witnesses restore exactly',()=>{
  assert.equal(blob(directPrior.head,ledger),directPrior.ledgerBlob);assert.equal(blob(directPrior.head,directScopePath),directPrior.scopeBlob);assert.equal(blob(directPrior.head,directTestPath),directPrior.foodTestBlob);
  assert.deepEqual(JSON.parse(content(directPrior.head,ledger))[key],directPrior.record);
  const restored=directInverse(directCurrentSource,directPolicy.directFoodNativeCleanExtensionScopeInverse);
  const before=directPriorSource.match(directPolicyLine),after=restored.match(directPolicyLine);assert(before&&after);
  assert.equal(restored.replace(after[0],before[0]),directPriorSource,'The complete original scope restores byte for byte');
  const currentTests=content(foodHead,directTestPath),priorTests=content(directPrior.head,directTestPath);
  assert(foodBeforeSourceSchedule(currentTests).startsWith(priorTests),'Every original94 byte remains an exact prefix');
  assert.equal(directInverse(currentTests,directPolicy.directFoodNativeCleanExtensionFood94Inverse),priorTests);
  for(const[name,expected]of Object.entries(directPolicy.directFoodNativeCleanExtensionOriginalTestBlobs))assert.equal(execFileSync('git',['hash-object','--stdin'],{input:directInverse(currentTests,directPolicy[name]),encoding:'utf8'}).trim(),expected,name+' remains an exact complete inverse');
  assert.deepEqual(c.nativeFreshFoodSourceGuard20261015,directPrior.record.nativeFreshFoodSourceGuard20261015,'The earlier historical-only revision remains an exact historical witness');
  assert.equal(c.directFoodNativeCleanExtension20261015.directNativeCleanBindingChanged,true);
  assert.equal(c.directFoodNativeCleanExtension20261015.fullGateOrPerformanceBudgetPassClaimed,false);
  for(const path of['release/fresh-food-source-clean-20261015.mjs','tests/fresh-food-source-clean-20261015.test.mjs','release/immutable-git-facts.mjs'])assert.equal(blob(foodHead,path),blob(directPrior.head,path),'No helper, original39 assertion or kernel change: '+path);
  const originalStart=directCurrentSource.match(/^function verifyFoodDiaryLondonDateRepairOriginal\(/m);assert(originalStart);
  const originalEnd=directCurrentSource.indexOf('\nexport function verifyFoodDiaryLondonDateRepair(',originalStart.index);assert(originalEnd>originalStart.index);
  const originalBody=directCurrentSource.slice(originalStart.index,originalEnd);
  assert.equal((originalBody.match(/\bclean\(\);/g)||[]).length,3,'Entry, in-scope and finally clean calls remain');
  assert.equal(directLine(directCurrentSource,'function clean(){'),directLine(directPriorSource,'function clean(){'),'The complete original native clean body remains exact');
  assert.equal(directLine(directCurrentSource,' }finally{clean();assert.equal(currentHead(),actual,'),directLine(directPriorSource,' }finally{clean();assert.equal(currentHead(),actual,'),'The post-clean raw HEAD assertion remains exact');
 });
 test('Food direct clean extension: exact native binding invokes a fresh hint for every clean call',()=>{
  let hints=0,legacy=0;const identity=()=>head;
  const facts=Object.freeze({blob:identity,content:identity,diff:identity,ancestor:identity,currentHead:identity,clean(){legacy++;}});
  const reads=directReadFacts(facts,()=>{hints++;return true;}),bound=directBinding(facts,reads);
  assert.equal(bound.blob,facts.blob);assert.equal(bound.content,facts.content);assert.equal(bound.diff,facts.diff);assert.equal(bound.ancestor,facts.ancestor);assert.equal(bound.currentHead,facts.currentHead);
  bound.clean();bound.clean();bound.clean();assert.equal(hints,3,'A positive result is never reused as a guard outcome');assert.equal(legacy,0);
 });
 test('Food direct clean extension: negative hints retain exact original errors and privateW retains its own guards',()=>{
  const originalError=Object.assign(Error('Exact owned original clean failure'),{code:'E_DIRECT_CLEAN_FIXTURE'});let hints=0,legacy=0;
  const identity=()=>head,facts=Object.freeze({blob:identity,content:identity,diff:identity,ancestor:identity,currentHead:identity,clean(){legacy++;throw originalError;}});
  const reads=directReadFacts(facts,()=>{hints++;return false;}),bound=directBinding(facts,reads);
  assert.throws(()=>bound.clean(),error=>error===originalError);assert.equal(hints,1);assert.equal(legacy,1,'A negative or unsupported certificate enters the unchanged native fallback');
  let privateCalls=0;const privateW=Object.freeze({...facts,head,assertCurrent(){privateCalls++;}}),privateBound=directBinding(facts,reads,privateW);
  privateBound.clean();privateBound.clean();privateBound.clean();assert.equal(privateBound.currentHead(),head);assert.equal(privateCalls,4);
  assert.equal(hints,1,'The native hint cannot replace a privateW guard');assert.equal(legacy,1);
 });
}

// Three pure intake witnesses; retain the separate actual owner28 Mac receipt.
{
 const policy=FOOD_DIARY_LONDON_DATE_POLICY,prior=policy.repairCleanStatusEquivalence20261015Prior;
 const repairPath='release/release-machinery-repair-scope-20261014.mjs',scopePath='release/food-diary-london-date-scope-20261015.mjs',testsPath='tests/food-diary-london-date-stack-20261015.test.mjs';
 const source=content(foodHead,repairPath),oldSource=content(prior.head,repairPath);
 const undo=(value,pairs)=>{for(const[before,after,kind]of[...pairs].reverse()){assert(after&&value.split(after).length===2);if(kind==='suffix')assert(value.endsWith(after));value=value.replace(after,before);}return value;};
 const lineAnchor=(text,needle)=>{const positions=[];for(let at=text.indexOf(needle);at>=0;at=text.indexOf(needle,at+needle.length))positions.push(at);assert.equal(positions.length,1,'Unique physical source anchor required');return positions[0];};
 const a=lineAnchor(source,'\n// A hint may replace only two clean-success diff probes. Visibility and the\n');
 const b=lineAnchor(source,'\nfunction assertCleanSource(stage){');
 const e=lineAnchor(source,'\nfunction inverseMaintenance(');assert(a<b&&b<e);
 const helper=source.slice(a+1,b),guard=source.slice(b+1,e);
 function fixture({value=Buffer.from('# branch.oid '+'1'.repeat(40)+'\0# branch.head (detached)\0'),working='',staged='',workingError=null,stagedError=null,visibilityError=null}={}){
  const events=[];
  const native=(command,args,options)=>{events.push(['status',command,[...args],{...options}]);return value;};
  const git=(...args)=>{events.push(['diff',[...args]]);if(args.includes('--cached')){if(stagedError)throw stagedError;return staged;}if(workingError)throw workingError;return working;};
  const visible=stage=>{events.push(['visibility',stage]);if(visibilityError)throw visibilityError;};
  const make=new Function('assert','git','assertGitTrackedSourceVisible','initial','let repairNativeExecFileSync=initial;\n'+helper+'\n'+guard+'\nreturn {guard:assertCleanSource,replaceNative(fn){repairNativeExecFileSync=fn;}};');
  return {...make(assert,git,visible,native),events};
 }
 test('Repair literal owner intake: exact798 component and complete prior97 source tests and records restore',()=>{
  assert.equal(blob(foodHead,repairPath),'798957c4015038aafb9f79bd19d32ed01492e5ac');assert.equal(blob(prior.head,repairPath),prior.repairBlob);
  assert.equal(undo(source,policy.repairCleanStatusEquivalenceSourceInverse),oldSource);
  assert.equal(undo(source,policy.inverses[repairPath]),content(c.base,repairPath),'All historical Repair assertions restore to the exact original source');
  const currentScope=content(foodHead,scopePath),oldScope=content(prior.head,scopePath),restored=undo(currentScope,policy.repairCleanStatusEquivalenceScopeInverse),pattern=/^const policy=(\{[^\n]+\});\nconst manifest=/m,oldPolicy=oldScope.match(pattern),newPolicy=restored.match(pattern);assert(oldPolicy&&newPolicy);assert.equal(restored.replace(newPolicy[0],oldPolicy[0]),oldScope);
  const currentTests=content(foodHead,testsPath),oldTests=content(prior.head,testsPath);assert(foodBeforeSourceSchedule(currentTests).startsWith(oldTests));assert.equal(undo(currentTests,policy.repairCleanStatusEquivalenceFood97Inverse),oldTests);
  for(const[name,expected]of Object.entries(policy.repairCleanStatusEquivalenceOriginalTestBlobs))assert.equal(execFileSync('git',['hash-object','--stdin'],{input:undo(currentTests,policy[name]),encoding:'utf8'}).trim(),expected);
  assert.equal(c.repairCleanStatusEquivalence20261015.selectedOwnerComponentBlob,'798957c4015038aafb9f79bd19d32ed01492e5ac');assert.equal(c.repairCleanStatusEquivalence20261015.nativeAcceptanceOrTimingFitClaimed,false);
 });
 test('Repair literal owner intake: exact source-extracted guard keeps fresh visibility and fresh strict probe',()=>{
  const f=fixture();f.guard('entry');f.guard('exit');assert.deepEqual(f.events.map(x=>x[0]),['visibility','status','visibility','status']);
  for(const x of f.events.filter(x=>x[0]==='status')){assert.equal(x[1],'git');assert.deepEqual(x[2],['--no-optional-locks','status','--porcelain=v2','-z','--branch','--untracked-files=no','--ignore-submodules=none']);assert.deepEqual(x[3],{maxBuffer:32*1024*1024,stdio:'pipe'});}
 });
 test('Repair literal owner intake: exact old lazy errors visibility and private executor boundary survive',()=>{
  const fallback=[['diff','--name-only','HEAD','--'],['diff','--cached','--name-only','--']];
  const f=fixture({value:Buffer.alloc(0)});f.guard('empty');assert.deepEqual(f.events.filter(x=>x[0]==='diff').map(x=>x[1]),fallback);
  const native=fixture();native.replaceNative(()=>Buffer.from('# branch.oid '+'1'.repeat(40)+'\0# branch.head (detached)\0'));native.guard('foreign');assert.deepEqual(native.events.map(x=>x[0]),['visibility','diff','diff']);
  const visibilityError=Error('same original visibility'),v=fixture({visibilityError});assert.throws(()=>v.guard('entry'),x=>x===visibilityError);assert.deepEqual(v.events,[['visibility','entry']]);
  for(const slot of['workingError','stagedError']){const error=Error('same original '+slot),x=fixture({value:Buffer.alloc(0),[slot]:error});assert.throws(()=>x.guard('failure'),e=>e===error);assert.deepEqual(x.events.filter(x=>x[0]==='diff').map(x=>x[1]),slot==='workingError'?[fallback[0]]:fallback);}
  const w=fixture({value:Buffer.alloc(0),working:'changed\n'});assert.throws(()=>w.guard('stage'),/Tracked repair source changed at stage/);assert.equal(w.events.filter(x=>x[0]==='diff').length,1);
 });
}

{
 test('Repair literal owner intake: cumulative scope inverse authenticates newest before retained direct-clean inverse',()=>{
  const scopePath='release/food-diary-london-date-scope-20261015.mjs',policy=FOOD_DIARY_LONDON_DATE_POLICY;
  const current=content(foodHead,scopePath),prior=policy.repairCleanStatusEquivalence20261015Prior,old=content(prior.head,scopePath);
  const undo=(value,pairs)=>{for(const[a,b]of[...pairs].reverse()){assert(b&&value.split(b).length===2,'Every actual cumulative inverse fragment must remain unique');value=value.replace(b,a);}return value;};
  const pattern=/^const policy=(\{[^\n]+\});\nconst manifest=/m;
  const restored=undo(current,policy.repairCleanStatusEquivalenceScopeInverse),newPolicy=restored.match(pattern),oldPolicy=old.match(pattern);
  assert(newPolicy&&oldPolicy);const authenticatedPrior=restored.replace(newPolicy[0],oldPolicy[0]);assert.equal(authenticatedPrior,old);
  assert.equal(execFileSync('git',['hash-object','--stdin'],{input:authenticatedPrior,encoding:'utf8'}).trim(),prior.scopeBlob);
  const physical=current.split('\n').filter(line=>line.startsWith(' const repairStatusPrior=')||line.startsWith(' const directCleanPrior='));
  assert.equal(physical.length,2);assert(physical[0].startsWith(' const repairStatusPrior='));
  assert(physical[0].includes("assert.equal(repairStatusRestoredScope.replace(repairStatusNewPolicy[0],repairStatusOldPolicy[0]),repairStatusPriorScope,"));
  assert(physical[1].includes("directRestoredScope=inverse('Food direct-clean scope',content(head,'release/food-diary-london-date-scope-20261015.mjs'),policy.directFoodNativeCleanExtensionScopeInverse)"));
  assert.deepEqual(policy.directFoodNativeCleanExtensionScopeInverse.slice(-policy.repairCleanStatusEquivalenceScopeInverse.length),policy.repairCleanStatusEquivalenceScopeInverse);
  const earlier=undo(current,policy.directFoodNativeCleanExtensionScopeInverse);
  assert.notEqual(earlier,authenticatedPrior);assert(!earlier.includes('\n const directCleanPrior='));
 });
}

{
 test('Repair literal owner intake: exact original adapter baseline survives the registered guard-only exception',()=>{
  const p=FOOD_DIARY_LONDON_DATE_POLICY,original=p.combinedFactoryOriginalPrior,selected=p.combinedFactoryPrior,repair='release/release-machinery-repair-scope-20261014.mjs',ci='release/ci-execution-scope-20261014.mjs';
  assert.equal(original.head,'8ede36cdf092a4a49064fdb71cb87dc8255e0728');assert.equal(original.blob,'87fc3bfa54ad25ac8d9428d078f3861ff8230553');
  assert.equal(selected.head,'93c4badbc7d7c8d52ffc3402cf9a375db17d2a7a');assert.equal(selected.blob,'6c38486beb296382f16c5694193b67ea5f9341ca');
  assert.equal(blob(original.head,repair),'985612b7b6ec6b335e821587e0df6cfb5fd7a46d');assert.equal(blob(selected.head,repair),'798957c4015038aafb9f79bd19d32ed01492e5ac');
  assert.equal(content(foodHead,repair),content(selected.head,repair));assert.equal(content(foodHead,ci),content(original.head,ci));assert.equal(content(selected.head,ci),content(original.head,ci));
  const undo=value=>{for(const[a,b]of[...p.repairCleanStatusEquivalenceSourceInverse].reverse()){assert(b&&value.split(b).length===2);value=value.replace(b,a);}return value;};
  assert.equal(undo(content(foodHead,repair)),content(original.head,repair),'Every native/foreign adapter byte outside the exact guard-only inverse remains original');
  assert.throws(()=>undo(content(foodHead,repair).replace('const repairStatusExec=repairNativeExecFileSync;','const repairStatusExec=()=>true;')));
  const scope=content(foodHead,'release/food-diary-london-date-scope-20261015.mjs').split('\n').find(line=>line.startsWith(' const repairStatusPrior='));
  assert(scope.includes('Original Combined adapter baseline must remain exact'));assert(scope.includes('Only the exact literal owner component comparison is admitted'));
 });
}

import {runInNewContext as combinedCanonicalRunInNewContext} from 'node:vm';
{
 const runInNewContext=combinedCanonicalRunInNewContext;
 const nativeBindingPrior=FOOD_DIARY_LONDON_DATE_POLICY.combinedCanonicalNativeOriginalPrior;
 const nativeBindingPath='release/combined-finite-scope-20261014.mjs';
 const extract=value=>{const start=value.indexOf('\nexport function combinedFiniteHistoricalView('),end=value.indexOf('\n// Pure compatibility projection',start);assert(start>=0&&end>start);return value.slice(start+1,end).replace('export function','function');};
 const factories={old:extract(content(nativeBindingPrior.head,nativeBindingPath)),new:extract(content(head,nativeBindingPath))};
 const ciText=content(head,'release/ci-execution-scope-20261014.mjs');
 const provenance=ciText.split('\n').find(line=>line.startsWith('export function ciExecutionNativeReaderProvenance')).replace('export function','function');
const metrics=[];
function make(kind,{reader=null,proof='canonical',defaultReader=reader===null,ciPresent=true,entryDirty=false,exitDirty=false,pins=64}={}){
 const stats={guardedReads:0,guardEntries:0,originalCalls:0,publicVerifierCalls:0,callbackCalls:0};
 const state={dirty:entryDirty,poison:false};
 const head='CURRENT',projected='REPAIR',base='COMBINED_BASE',manifest='release/approved-runtime-composition.json';
 const oid=(ref,path)=>`OID:${ref==='HEAD'?projected:ref}:${path}`;
 const ci={head:'CI_BASE',rawHead:head,assertCurrent(){stats.guardEntries++;assert.equal(state.dirty,false,'fresh source rejected');},read:()=>{}};
 Object.freeze(ci);
 const sourceRead=(ref,path)=>{
  stats.guardedReads++;ci.assertCurrent();
  if(reader!==null){stats.callbackCalls++;const v=reader(ref,path,state);assert.equal(v,oid(ref,path),'foreign source rejected');}
  if(state.poison)throw new Error('later native source poison');
  ci.assertCurrent();return oid(ref,path);
 };
 const repair={head:projected,rawHead:head,record:{combinedFinite20261014:{base,paths:['one'],maintenancePaths:['two']}},affected:p=>['one','two',manifest].includes(p),read:sourceRead,blob:oid,content:(ref,path)=>`BYTES:${ref}:${path}`,...(ciPresent?{ciExecutionContext:ci}:{})};
 const brands=new WeakMap();
 if(proof==='canonical')brands.set(ci.read,Object.freeze({kind:'read',view:ci}));
 if(proof==='wrong-view')brands.set(ci.read,Object.freeze({kind:'read',view:{assertCurrent:ci.assertCurrent}}));
 if(proof==='wrong-kind')brands.set(ci.read,Object.freeze({kind:'copied',view:ci}));
 const verify=(_c,options)=>{
  stats.originalCalls++;
  for(let n=0;n<pins;n++)assert.equal(options.read('HEAD','one'),oid('HEAD','one'));
  if(exitDirty)state.dirty=true;
 };
 const context={assert,structuredClone,Set,WeakMap,nativeCiReaders:brands,releaseMachineryRepairHistoricalView:()=>repair,exactCombinedDirectoryDisplay:v=>v,manifest,verifyCombinedFiniteOriginal:verify,verifyCombinedFinite:(c,o)=>{stats.publicVerifierCalls++;verify(c,o);},git:(...args)=>args[0]==='rev-parse'?head:args[0]==='diff'?'':''};
 const factory=runInNewContext(provenance+'\n'+factories[kind]+'\ncombinedFiniteHistoricalView',context);
 const start=()=>factory(reader,{defaultReader});
 return{start,state,stats,oid};
}
test('canonical private native Original reuses immutable facts; returned public read remains guarded',()=>{
 const rows={};
 for(const kind of ['old','new']){
  const h=make(kind);const view=h.start();const originalReads=h.stats.guardedReads;
  assert.equal(view.read('HEAD','one'),h.oid('COMBINED_BASE','one'));
  assert.equal(view.read('HEAD','two'),h.oid('COMBINED_BASE','two'));
  const publicReads=h.stats.guardedReads-originalReads;
  h.state.dirty=true;assert.throws(()=>view.read('HEAD','one'),/fresh source rejected/);
  assert.equal(h.stats.originalCalls,1);rows[kind]={originalGuardedReads:originalReads,publicGuardedReads:publicReads};
 }
 assert.equal(rows.old.originalGuardedReads,64);assert.equal(rows.new.originalGuardedReads,0);
 assert.equal(rows.old.publicGuardedReads,rows.new.publicGuardedReads);assert.equal(rows.new.publicGuardedReads,4);
 metrics.push({kind:'SYNTHETIC_CONTROLLED_FACTORY_COUNTS_NOT_NATIVE_TIMING',...rows,originalVerifierStubbed:true});
});
for(const proof of ['absent','wrong-view','wrong-kind'])test('unproven native context remains fully guarded: '+proof,()=>{
 for(const kind of ['old','new']){const h=make(kind,{proof});h.start();assert.equal(h.stats.guardedReads,64);}
});
for(const label of ['plain','default-reader-true','wrapped','bound','copied-properties'])test('non-null callback cannot take native Original shortcut: '+label,()=>{
 const plain=(r,p,state)=>state.poison?'forged':`OID:${r==='HEAD'?'REPAIR':r}:${p}`;
 let reader=label==='wrapped'?(...a)=>plain(...a):label==='bound'?plain.bind(null):plain;
 if(label==='copied-properties')Object.assign(reader,{nativeSource:true,kind:'read'});
 for(const kind of ['old','new']){
  const h=make(kind,{reader,defaultReader:true});const view=h.start();assert.equal(h.stats.callbackCalls,64);
  h.state.poison=true;assert.throws(()=>view.read('HEAD','one'),/foreign source rejected/);
 }
});
test('forged non-null callback rejects during full Original admission even with defaultReader true',()=>{
 for(const kind of ['old','new']){const h=make(kind,{reader:()=> 'forged',defaultReader:true});assert.throws(h.start,/foreign source rejected/);assert.equal(h.stats.callbackCalls,1);}
});
test('fresh dirty entry rejects before Original and exit source drift still rejects',()=>{
 for(const kind of ['old','new']){
  const early=make(kind,{entryDirty:true});assert.throws(early.start,/fresh source rejected/);assert.equal(early.stats.originalCalls,0);
  const late=make(kind,{exitDirty:true});assert.throws(late.start,/fresh source rejected/);assert.equal(late.stats.originalCalls,1);
 }
});
test('fresh subsequent construction cannot reuse prior clean outcome',()=>{
 for(const kind of ['old','new']){const h=make(kind);h.start();h.state.dirty=true;assert.throws(h.start,/fresh source rejected/);assert.equal(h.stats.originalCalls,1);}
});
test('legacy non-CI factory still invokes the unchanged public verifier',()=>{
 for(const kind of ['old','new']){const h=make(kind,{ciPresent:false});h.start();assert.equal(h.stats.publicVerifierCalls,1);assert.equal(h.stats.guardedReads,64);}
});

 test('Combined native Original binding: exact prior102 whole-source restoration and all earlier records remain required',()=>{
  const p=FOOD_DIARY_LONDON_DATE_POLICY,prior=p.combinedCanonicalNativeOriginalPrior,actual=JSON.parse(content(head,ledger));
  assert.equal(prior.head,'2c7480821fa949dc32c74f6b18bb0d782d594d88');assert.equal(prior.combinedBlob,'6c38486beb296382f16c5694193b67ea5f9341ca');
  assert.equal(blob(prior.head,ledger),prior.ledgerBlob);assert.deepEqual(JSON.parse(content(prior.head,ledger))[key],prior.record);
  const restored=structuredClone(actual);restored[key]=prior.record;assert.deepEqual(restored,JSON.parse(content(prior.head,ledger)),'All114 previous ledger rows and approvals remain exact');
  const restore=(value,inverses)=>{for(const[a,b]of[...inverses].reverse()){assert(b&&value.split(b).length===2);value=value.replace(b,a);}return value;};
  const current=content(head,nativeBindingPath);assert.equal(execFileSync('git',['hash-object','--stdin'],{input:current,encoding:'utf8'}).trim(),'419fb813270a7137371761c6891f82f989859f6d');assert.equal(restore(current,p.combinedCanonicalNativeOriginalSourceInverse),content(prior.head,nativeBindingPath));
  const tests='tests/food-diary-london-date-stack-20261015.test.mjs',currentTests=content(head,tests),priorTests=content(prior.head,tests);assert(foodBeforeSourceSchedule(currentTests).startsWith(priorTests));assert.equal(restore(currentTests,p.combinedCanonicalNativeOriginalFood102Inverse),priorTests);
  const scope='release/food-diary-london-date-scope-20261015.mjs',scopePrior=content(prior.head,scope),scopeRestored=restore(content(head,scope),p.combinedCanonicalNativeOriginalScopeInverse),pattern=/^const policy=(\{[^\n]+\});\nconst manifest=/m,from=scopeRestored.match(pattern),to=scopePrior.match(pattern);assert(from&&to);assert.equal(scopeRestored.replace(from[0],to[0]),scopePrior);
  assert.equal(p.record.combinedCanonicalNativeOriginal20261015.wholeNewHeadNativeOrHostedOrProductionAccepted,false);

 });
 test('Combined native Original binding: actual admitted native factory retains public and literal historical reads',async()=>{
  const {combinedFiniteHistoricalView}=await import('../release/combined-finite-scope-20261014.mjs');
  const {withImmutableHistoryVerification}=await import('../release/immutable-git-facts.mjs');
  const view=withImmutableHistoryVerification(()=>combinedFiniteHistoricalView());assert.equal(view.rawHead,head);
  for(const path of ['release','member-experience','shift-coach'])assert.equal(view.read('HEAD',path),blob(view.head,path));
  for(const[ref,path]of[['685ede249cd20c4801d0a25227fed16d46860618','release'],['761f0c79b97075313b59effe71db418111fed983','member-experience']])assert.equal(view.read(ref,path),blob(ref,path));
  assert.equal(g('rev-parse','HEAD').trim(),head);assert.equal(g('diff','--name-only','HEAD','--').trim(),'');assert.equal(g('diff','--cached','--name-only','--').trim(),'');
 });
}

// Additive current-HEAD reader coherence; every preceding117 test byte remains.
{
 const aliasP=FOOD_DIARY_LONDON_DATE_POLICY,aliasPrior=aliasP.currentWatchReadHeadAliasesPrior,aliasPath='shift-coach/release-contract.mjs';
 const aliasCurrent=content(head,aliasPath),aliasBefore=content(aliasPrior.head,aliasPath);
 const aliasRestore=(value,pairs)=>{for(const[a,b]of[...pairs].reverse()){assert(b&&value.split(b).length===2);value=value.replace(b,a);}return value;};
 const aliasStart=aliasCurrent.indexOf('function assertCoachingCurrentWatchReadAliases(read){'),aliasEnd=aliasCurrent.indexOf('\n}\n',aliasStart);assert(aliasStart>=0&&aliasEnd>aliasStart);
 const aliasHelper=aliasCurrent.slice(aliasStart,aliasEnd+3),aliasModelHead='a'.repeat(40),aliasPaths=new Set(['medicines-watch/data.mjs','medicines-watch/monitor.mjs']);
 const aliasMake=(getHead=()=>aliasModelHead,paths=aliasPaths)=>new Function('assert','immutableHistorySourceHead','WATCH_CURRENT_PATHS',aliasHelper+'\nreturn assertCoachingCurrentWatchReadAliases;')(assert,getHead,paths);
 test('Watch reader coherence: every prior117 byte and all115 prior ledger records restore exactly',()=>{
  const actual=JSON.parse(content(head,ledger)),restored=structuredClone(actual);restored[key]=aliasPrior.record;
  assert.deepEqual(restored,JSON.parse(content(aliasPrior.head,ledger)),'All114 other rows and the complete prior Food receipt are exact');
  assert.equal(blob(aliasPrior.head,ledger),aliasPrior.ledgerBlob);assert.equal(blob(aliasPrior.head,'release/food-diary-london-date-scope-20261015.mjs'),aliasPrior.scopeBlob);
  const path='tests/food-diary-london-date-stack-20261015.test.mjs',before=content(aliasPrior.head,path),after=content(head,path);
  assert.equal(blob(aliasPrior.head,path),aliasPrior.foodTestsBlob);assert(foodBeforeSourceSchedule(after).startsWith(before));assert.equal(aliasRestore(after,aliasP.currentWatchReadHeadAliasesFood117Inverse),before);
 });
 test('Watch reader coherence: all original contract body bytes restore after the five literal changes',()=>{
  assert.equal(blob(aliasPrior.head,aliasPath),'d6e24cab7c07725274fdf1f2a53dd34328bd866a');assert.equal(blob(head,aliasPath),'f7e8178f164b601796dd0242d5ff8aa274b65dcb');
  assert.equal(aliasRestore(aliasCurrent,aliasP.currentWatchReadHeadAliasesSourceInverse),aliasBefore);
  assert.equal(literalOriginalWatchTestBlob(head,'shift-coach/release.test.mjs'),aliasPrior.watchTestsBlob);
  assert.equal(aliasP.record.currentWatchReadHeadAliases20261016.gateReplacedOrRemoved,false);
 });
 test('Watch reader coherence: model rejects every inconsistent current path without a history verdict',()=>{
  for(const path of aliasPaths){let calls=0;const read=(ref,p)=>{calls++;return ref==='HEAD'&&p===path?'changed':p;};assert.throws(()=>aliasMake()(read),/Current Watch source drift/);assert(calls>0);}
 });
 test('Watch reader coherence: the same callback is always invoked again after a prior coherent result',()=>{
  let changed=false,calls=0;const read=(ref,p)=>{calls++;return changed&&ref==='HEAD'?'changed':p;},run=aliasMake();
  run(read);const before=calls;changed=true;assert.throws(()=>run(read),/Current Watch source drift/);assert(calls>before);
 });
 test('Watch reader coherence: invalid or absent captured heads cannot query a reader',()=>{
  for(const value of [null,'HEAD','x'.repeat(40),'a'.repeat(39)]){let calls=0;assert.throws(()=>aliasMake(()=>value)(()=>{calls++;return '';}),/fresh actual source scope/);assert.equal(calls,0);}
 });
 test('Watch reader coherence: a foreign callback retains the identical thrown error',()=>{
  const expected=Error('Synthetic unchanged callback exception');assert.throws(()=>aliasMake()(()=>{throw expected;}),error=>error===expected);
 });
 test('Watch reader coherence: both current aliases are independently requested for each existing path',()=>{
  const calls=[];aliasMake()((ref,path)=>{calls.push([ref,path]);return path;});assert.equal(calls.length,aliasPaths.size*2);
  for(let i=0;i<calls.length;i+=2){assert.equal(calls[i][0],'HEAD');assert.equal(calls[i+1][0],aliasModelHead);assert.equal(calls[i][1],calls[i+1][1]);}
 });
 test('Watch reader coherence: coherent opaque callbacks receive no source or approval verdict',()=>{
  const values=new Map();let called=0;const run=aliasMake();run((ref,path)=>{called++;return values.get(path)||'same opaque fixture';});assert.equal(called,aliasPaths.size*2);
  const invocation=' assertCoachingCurrentWatchReadAliases(read);\n';assert.equal(aliasCurrent.split(invocation).length,2);
  assert(aliasCurrent.includes(invocation+" const growth=manifest.rankingGrowthComposition;verifyRankingGrowth(growth,read);read=rankingGrowthHistoricalRead(read,growth);"),'Every successful early check continues into the exact original verifier');
 });
 test('Watch reader coherence: real native current aliases use the actual untouched Git source',async()=>{
  const {WATCH_CURRENT_PATHS}=await import('../shift-coach/release-contract.mjs');
  const {withImmutableHistoryVerification,immutableHistorySourceHead,immutableHistoryExecFileSync}=await import('../release/immutable-git-facts.mjs');
  let count=0;withImmutableHistoryVerification(()=>{assert.equal(immutableHistorySourceHead(),head);aliasMake(immutableHistorySourceHead,WATCH_CURRENT_PATHS)((ref,path)=>{count++;return immutableHistoryExecFileSync('git',['rev-parse',ref+':'+path],{encoding:'utf8',maxBuffer:64e6}).trim();});});
  assert.equal(count,WATCH_CURRENT_PATHS.size*2);assert.equal(g('rev-parse','HEAD').trim(),head);
 });
 test('Watch reader coherence: every workflow, original kernel and current source receipt stays pinned',()=>{
  for(const[path,expected]of[
   ['.github/workflows/cloudflare-production-promote.yml','cd8c81a8d8c29def3c25b93112a4c56456b5cbfc'],
   ['.github/workflows/programme-day-preview.yml','54827864ebfed96670c67809030e6ad772731b73'],
   ['.github/workflows/production-completion-proof.yml','5ba96a875e92d33a0e54f8bc3284332c12817916'],
   ['.github/workflows/approved-ranking-proof.yml','065a46fe92aac5cd1f6cfb8d51aa5f5f97a5f9ad'],
   ['.github/workflows/shift-coach-integration.yml','331ea3150aa623bbbd3c704c07fd17952008d0d8'],
   ['release/immutable-git-facts.mjs','b1ec660c2fb899be3c4c31370598e9d5751551a3'],
   ['shift-coach/release.test.mjs','cfbcd2cbf80d1f500a4dce89e2f43f9d309c9f88']
  ])assert.equal(path==='.github/workflows/cloudflare-production-promote.yml'?execFileSync('git',['hash-object','--stdin'],{input:productionBeforeSourceSchedule(content(head,path)),encoding:'utf8'}).trim():path==='shift-coach/release.test.mjs'?literalOriginalWatchTestBlob(head,path):blob(head,path),expected,path);
  assert.equal(aliasP.record.authority,FOOD_DIARY_LONDON_DATE_POLICY.record.authority);
  const restored=aliasRestore(content(head,'release/food-diary-london-date-scope-20261015.mjs'),aliasP.currentWatchReadHeadAliasesScopeInverse),prior=content(aliasPrior.head,'release/food-diary-london-date-scope-20261015.mjs'),pattern=/^const policy=(\{[^\n]+\});\nconst manifest=/m,a=restored.match(pattern),b=prior.match(pattern);assert(a&&b);assert.equal(restored.replace(a[0],b[0]),prior);
 });
 test('Watch reader coherence: native factory preserves only the exact existing private reader identity',async()=>{
  const {nativeReconciliationSourceRead}=await import('../release/approved-runtime-composition.mjs');
  const first=nativeReconciliationSourceRead();assert.equal(typeof first,'function');assert.equal(first,nativeReconciliationSourceRead());assert.notEqual(first.bind(null),first);assert.notEqual((...args)=>first(...args),first);
  const p='release/approved-runtime-composition.mjs';assert.equal(aliasRestore(content(head,p),aliasP.currentWatchReadHeadAliasesCompositionInverse),content(aliasPrior.head,p));
 });
 test('Watch reader coherence: exact native factory values match the original internal Git reader',async()=>{
  const {nativeReconciliationSourceRead}=await import('../release/approved-runtime-composition.mjs');const read=nativeReconciliationSourceRead();
  for(const path of ['medicines-watch/data.mjs','medicines-watch/monitor.mjs','shift-coach/release-contract.mjs',ledger])for(const ref of ['HEAD',head,aliasPrior.head])assert.equal(read(ref,path),g('rev-parse',ref+':'+path).trim());
  assert(aliasCurrent.includes(' const proof=validateCoachingSource(nativeReconciliationSourceRead(),manifest);'));
 });
 test('Watch reader coherence: exact native factory retains unknown-reference and missing-path rejection',async()=>{
  const {nativeReconciliationSourceRead}=await import('../release/approved-runtime-composition.mjs');const read=nativeReconciliationSourceRead();
  for(const[ref,path]of[['0'.repeat(40),'medicines-watch/data.mjs'],[head,'missing-unknown-source.mjs']]){let before,after;try{g('rev-parse',ref+':'+path);}catch(error){before=error.status;}try{read(ref,path);}catch(error){after=error.status;}assert.equal(typeof before,'number');assert.equal(after,before);}
 });

}

// Fresh native head observations preserve the original guard on every fallback.
import './fresh-food-source-head-20261016.test.mjs';
{
 const freshP=FOOD_DIARY_LONDON_DATE_POLICY,freshSource=content(head,'release/food-diary-london-date-scope-20261015.mjs');
 const start=freshSource.indexOf('\nfunction assertFreshFoodNativeHead(rawHead,original){')+1,end=freshSource.indexOf('\n}\n',start);assert(start>0&&end>start);
 const literal=freshSource.slice(start,end+3),model=(hint)=>new Function('assert','freshFoodSourceHead',literal+'\nreturn assertFreshFoodNativeHead;')(assert,hint),raw='a'.repeat(40);
 const restore=(s,pairs)=>{for(const[a,b]of[...pairs].reverse()){assert(b&&s.split(b).length===2);s=s.replace(b,a);}return s;};
 test('fresh source head: each positive observation is fresh and a changed current head rejects',()=>{
  let calls=0,changed=false,fallbacks=0;const run=model(()=>{calls++;return changed?'b'.repeat(40):raw;}),fallback=()=>{fallbacks++;};
  run(raw,fallback);run(raw,fallback);assert.equal(calls,2);assert.equal(fallbacks,0);changed=true;assert.throws(()=>run(raw,fallback),/Raw HEAD changed during projection/);assert.equal(calls,3);assert.equal(fallbacks,0);
 });
 test('fresh source head: null retains the original guard result and identical thrown error',()=>{
  const run=model(()=>null),sentinel=Error('Same original guard exception');let calls=0;
  assert.equal(run(raw,()=>{calls++;return'original result';}),'original result');assert.throws(()=>run(raw,()=>{calls++;throw sentinel;}),error=>error===sentinel);assert.equal(calls,2);
 });
 test('fresh source head: every callback exit receives another actual observation',()=>{
  let value=raw,observations=0,callbacks=0;const run=model(()=>{observations++;return value;}),fallback=()=>{throw Error('No fallback expected');};
  run(raw,fallback);try{callbacks++;value='b'.repeat(40);}finally{assert.throws(()=>run(raw,fallback),/Raw HEAD changed during projection/);}assert.equal(callbacks,1);assert.equal(observations,2);
 });
 test('fresh source head: the complete older clean helper and kernel remain literal',()=>{
  const path='release/fresh-food-source-clean-20261015.mjs',newPath='release/fresh-food-source-head-20261016.mjs';
  assert.equal(blob(head,path),'0d744888e51457ba28755ea3bdfa356a595249f4');assert.equal(blob(head,'release/immutable-git-facts.mjs'),'b1ec660c2fb899be3c4c31370598e9d5751551a3');
  assert.equal(restore(content(head,newPath),freshP.freshFoodNativeHeadGuardHelperInverse),content(head,path));
  assert(freshSource.includes('assertCurrent:privateW?assertCurrent:()=>assertFreshFoodNativeHead(rawHead,assertCurrent),authentic:'));
  assert(freshSource.includes('if(head===null)return original();'));
 });
 test('shared source triggers: every original workflow byte restores except its one dependency line',()=>{
  for(const path of freshP.sharedSourceTriggerDependencyPaths){
   const now=content(head,path),pairs=freshP.sharedSourceTriggerDependencyInverses[path],before=content(freshP.record.freshFoodNativeHeadGuard20261016.sourceBase,path);
   assert.equal(pairs.length,1);assert.equal(restore(now,pairs),before);assert.equal(blob(freshP.record.freshFoodNativeHeadGuard20261016.sourceBase,path),freshP.sharedSourceTriggerDependencyPreviousBlobs[path]);
   assert(now.includes("  pull_request:\n    paths:\n      - 'release/approved-runtime-composition*'\n"));assert.equal(now.split('\n').length,before.split('\n').length+1);
  }
  assert.equal(execFileSync('git',['hash-object','--stdin'],{input:productionBeforeSourceSchedule(content(head,'.github/workflows/cloudflare-production-promote.yml')),encoding:'utf8'}).trim(),'cd8c81a8d8c29def3c25b93112a4c56456b5cbfc');
 });
 test('fresh source head: every original130 assertion and earlier source inverse remains complete',()=>{
  const path='tests/food-diary-london-date-stack-20261015.test.mjs',restored=restore(content(head,path),freshP.freshFoodNativeHeadGuardFood130Inverse);
  assert.equal(execFileSync('git',['hash-object','--stdin'],{input:restored,encoding:'utf8'}).trim(),'f9e34701815039a8fc8fd0538ca264b4d3841cbb');
  const prior=content(freshP.currentWatchReadHeadAliasesPrior.head,path);assert(restored.startsWith(prior));assert.equal(freshP.record.freshFoodNativeHeadGuard20261016.callbackOrVerdictCache,false);
 });
}

// Remove only the later, exact shared-source trigger before the older cap-only witness.
{
 const originalProgrammeToolchainWitness=programmeBeforeToolchainOverlap;
 programmeBeforeToolchainOverlap=(path,bytes)=>{
  const pairs=FOOD_DIARY_LONDON_DATE_POLICY.sharedSourceTriggerDependencyInverses[path];
  if(pairs)for(const[before,after]of[...pairs].reverse()){
   assert(after&&bytes.split(after).length===2,'One exact approved shared-source trigger required');bytes=bytes.replace(after,before);
  }
  return originalProgrammeToolchainWitness(path,bytes);
 };
 test('historical cap witness retains every original assertion after only the exact later trigger inverse',()=>{
  const p=FOOD_DIARY_LONDON_DATE_POLICY;
  for(const path of p.sharedSourceTriggerDependencyPaths){
   const current=content(foodHead,path),previous=content(p.record.freshFoodNativeHeadGuard20261016.sourceBase,path),[[before,after]]=p.sharedSourceTriggerDependencyInverses[path];
   assert.equal(programmeBeforeToolchainOverlap(path,current),previous);
   for(const changed of[current.replace(after,before),current.replace(after,after+after),current.replace('release/approved-runtime-composition*','release/unapproved*')])assert.throws(()=>programmeBeforeToolchainOverlap(path,changed),/exact approved/);
   for(const changed of[current+'\n# unapproved\n',current.replace('contents: read','contents: write')])assert.notEqual(programmeBeforeToolchainOverlap(path,changed),previous,'Every other byte survives for the original strict comparison');
  }
  const restored=p.historicalSharedTriggerCapFull175Inverse.reduceRight((s,[a,b])=>{assert(b&&s.split(b).length===2);return s.replace(b,a);},content(foodHead,'tests/food-diary-london-date-stack-20261015.test.mjs'));
  assert.equal(execFileSync('git',['hash-object','--stdin'],{input:restored,encoding:'utf8'}).trim(),'00b457daca140c49a139d6f72c38912aaa5d0021');
 });
}

// Run current scheduling controls alongside all original Food source assertions.
import './bounded-source-scheduling-20261016.test.mjs';
import './verified-source-evidence-20261016.test.mjs';

// The earlier Watch predicate still receives the complete byte-exact original test.
function literalOriginalWatchTestBlob(ref,path){
 assert.equal(path,'shift-coach/release.test.mjs');
 let bytes=content(ref,path);
 for(const [before,after,kind]of [...FOOD_DIARY_LONDON_DATE_POLICY.inverses[path]].reverse()){assert(after&&bytes.split(after).length===2);if(kind==='prefix')assert(bytes.startsWith(after));bytes=bytes.replace(after,()=>before);}
 assert.equal(bytes,content(FOOD_DIARY_LONDON_DATE_POLICY.record.base,path),'Every original Watch test assertion byte required');
 return execFileSync('git',['hash-object','--stdin'],{input:bytes,encoding:'utf8'}).trim();
}
