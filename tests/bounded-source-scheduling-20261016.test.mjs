import {seoAuditOriginalSource} from '../release/seo-audit-scope-20261016.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync,spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {runBoundedChecks,sourceSnapshot,productionUnitCommands,validateScheduleDocument,validateExecutableScheduleInput} from '../release/bounded-source-checks-20261016.mjs';

const runner=fileURLToPath(new URL('../release/bounded-source-checks-20261016.mjs',import.meta.url));
const quoted=value=>"'"+value.replaceAll("'","'\"'\"'")+"'";
const nodeCommand=code=>quoted(process.execPath)+' -e '+quoted(code);
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'shift-bounded-source-')),repo=join(root,'repo');mkdirSync(repo);
 const g=(...a)=>execFileSync('git',a,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']});
 g('init','--quiet');writeFileSync(join(repo,'source.txt'),'approved source\n');g('add','source.txt');g('-c','user.name=Source fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','Approved source fixture');
 const snapshot=()=>{const cwd=process.cwd();try{process.chdir(repo);return sourceSnapshot();}finally{process.chdir(cwd);}};
 return{root,repo,g,snapshot,proofDir:join(root,'proof'),clean(){rmSync(root,{recursive:true,force:true});}};
}
function delayedTask(f,id,code=0,delay=40){
 const events=join(f.root,'events.ndjson');
 return{id,body:nodeCommand(String.raw`const fs=require('node:fs');const file=${JSON.stringify(events)};fs.appendFileSync(file,JSON.stringify({id:${JSON.stringify(id)},event:'start',pid:process.pid})+'\n');setTimeout(()=>{fs.appendFileSync(file,JSON.stringify({id:${JSON.stringify(id)},event:'finish',pid:process.pid})+'\n');console.log('original stdout '+${JSON.stringify(id)});console.error('original stderr '+${JSON.stringify(id)});process.exit(${code});},${delay});`)};
}
test('bounded source pool runs every original command once, never exceeds two groups and waits for all actual zero exits',async()=>{
 const f=fixture();try{
  const tasks=['one','two','three','four'].map(id=>delayedTask(f,id));const result=await runBoundedChecks(tasks,{proofDir:f.proofDir,poolId:'fixture-success',snapshot:f.snapshot});
  assert.equal(result.passed,true);assert.equal(result.sourceUnchanged,true);assert.equal(result.active,0);assert.equal(result.results.length,4);assert(result.results.every(x=>x.status==='passed'&&x.exitCode===0&&x.signal===null));
  const rows=readFileSync(join(f.root,'events.ndjson'),'utf8').trim().split('\n').map(JSON.parse);let active=0,max=0;for(const row of rows){active+=row.event==='start'?1:-1;max=Math.max(max,active);assert(active>=0&&active<=2);}assert.equal(active,0);assert.equal(max,2);
  for(const task of tasks){assert.equal(rows.filter(x=>x.id===task.id&&x.event==='start').length,1);assert.match(readFileSync(join(f.proofDir,task.id+'.stdout.log'),'utf8'),/original stdout/);assert.match(readFileSync(join(f.proofDir,task.id+'.stderr.log'),'utf8'),/original stderr/);}
 }finally{f.clean();}
});
test('early or queued command failures remain failures and all independent commands still execute',async()=>{
 for(const failed of ['one','three']){const f=fixture();try{
  const tasks=['one','two','three','four'].map(id=>delayedTask(f,id,id===failed?7:0));const r=await runBoundedChecks(tasks,{proofDir:f.proofDir,poolId:'fixture-failure',snapshot:f.snapshot});
  assert.equal(r.passed,false);assert.equal(r.results.find(x=>x.id===failed).exitCode,7);assert.equal(r.results.filter(x=>x.status==='passed').length,3);assert(r.results.every(x=>x.finishedAt&&x.pid));
 }finally{f.clean();}}
});
test('printed passing test summaries cannot substitute for an actual successful child exit',async()=>{
 const f=fixture();try{const r=await runBoundedChecks([{id:'false-summary',body:nodeCommand(String.raw`console.log('ℹ tests 1908\nℹ pass 1908\nℹ fail 0');process.exit(9);`)}],{proofDir:f.proofDir,poolId:'fixture-summary',snapshot:f.snapshot});assert.equal(r.passed,false);assert.equal(r.results[0].exitCode,9);}finally{f.clean();}
});
test('fresh tracked-source drift or a changed HEAD rejects after otherwise successful commands',async()=>{
 for(const moveHead of [false,true]){const f=fixture();try{
  const mutation=moveHead?`require('node:child_process').execFileSync('git',['-C',${JSON.stringify(f.repo)},'add','source.txt']);require('node:child_process').execFileSync('git',['-C',${JSON.stringify(f.repo)},'-c','user.name=Changed fixture','-c','user.email=changed@example.invalid','commit','--quiet','-m','Changed source']);`:'';
  const body=nodeCommand(String.raw`require('node:fs').writeFileSync(${JSON.stringify(join(f.repo,'source.txt'))},'changed source\n');${mutation}`);
  const r=await runBoundedChecks([{id:'changed-source',body}],{proofDir:f.proofDir,poolId:'fixture-source',snapshot:f.snapshot});assert.equal(r.results[0].exitCode,0);assert.equal(r.passed,false);assert.equal(r.sourceUnchanged,false);
 }finally{f.clean();}}
});
test('assume-unchanged and skip-worktree cannot conceal source before a command starts',async()=>{
 for(const flag of ['--assume-unchanged','--skip-worktree']){const f=fixture();try{
  f.g('update-index',flag,'source.txt');await assert.rejects(runBoundedChecks([delayedTask(f,'must-not-start')],{proofDir:f.proofDir,poolId:'fixture-hidden',snapshot:f.snapshot}),/Hidden source index flag/);assert.equal(existsSync(join(f.root,'events.ndjson')),false);
 }finally{f.clean();}}
});
test('unexpected workflow outputs fail closed and cannot become B1 scope outputs',async()=>{
 const f=fixture();try{const body=nodeCommand("require('node:fs').appendFileSync(process.env.GITHUB_OUTPUT,'runtime_only=false\\n');");const r=await runBoundedChecks([{id:'foreign-output',body}],{proofDir:f.proofDir,poolId:'fixture-output',snapshot:f.snapshot});assert.equal(r.passed,false);assert(r.errors.some(x=>x.code==='UNEXPECTED_OUTPUT'));}finally{f.clean();}
});
test('cancellation stops only the two owned groups, waits for them and leaves queued commands unstarted',async()=>{
 const f=fixture();try{
  const tasks=['one','two','three'].map(id=>delayedTask(f,id,0,30000));
  const harness=join(f.root,'controller.mjs');writeFileSync(harness,`import {runBoundedChecks} from ${JSON.stringify('file://'+runner)};const result=await runBoundedChecks(${JSON.stringify(tasks)},{proofDir:${JSON.stringify(f.proofDir)},poolId:'fixture-cancel'});process.exitCode=result.passed?0:1;`);
  const p=spawn(process.execPath,[harness],{cwd:f.repo,stdio:['ignore','pipe','pipe']});let output='';p.stdout.on('data',x=>output+=x);p.stderr.on('data',x=>output+=x);const terminal=new Promise(resolve=>p.on('close',(code,signal)=>resolve({code,signal})));
  const deadline=Date.now()+5000;while(!existsSync(join(f.root,'events.ndjson'))||readFileSync(join(f.root,'events.ndjson'),'utf8').trim().split('\n').length<2){assert(Date.now()<deadline,'Two owned child groups did not start');await new Promise(r=>setTimeout(r,10));}
  p.kill('SIGTERM');const ended=await terminal;assert.equal(ended.code,1,output);assert.equal(ended.signal,null);
  const status=JSON.parse(readFileSync(join(f.proofDir,'status.json'),'utf8'));assert.equal(status.cancelled,'SIGTERM');assert.equal(status.active,0);assert.equal(status.results[2].status,'cancelled-before-start');assert.equal(status.results[2].pid,null);
  for(const row of status.results.slice(0,2)){assert.equal(row.status,'signalled');assert.throws(()=>process.kill(-row.pid,0),e=>e.code==='ESRCH');}
 }finally{f.clean();}
});
test('the privacy command extractor preserves all31 literal original commands and rejects omissions or widening',()=>{
 const s=JSON.parse(readFileSync(new URL('../release/production-source-schedule-20261016.json',import.meta.url),'utf8'));
 const synthetic=s.originalProductionUnitCommands.join('\n')+'\n';assert.deepEqual(productionUnitCommands(synthetic),s.originalProductionUnitCommands);
 assert.throws(()=>productionUnitCommands(s.originalProductionUnitCommands.slice(1).join('\n')),/All31/);
 assert.throws(()=>productionUnitCommands(synthetic.replace('node --test ','node --test /tmp/test; touch unauthorised ')),/Unexpected/);
 assert.equal(s.maximumConcurrent,2);assert.equal(s.productionTimeoutMinutes,60);assert.equal(s.privacyTimeoutMinutes,60);
});

function programmeBeforeRetainedImageEvidence(source){const block="Retain original Programme day browser evidence\n        if: always()\n        uses: actions/upload-artifact@v4\n        with:\n          name: programme-day-live-${{ github.sha }}\n          path: programme-day-proof/\n          if-no-files-found: warn\n          retention-days: 30\n      - name: ",anchor="      - name: Verify approved Programme day and catalogue artwork live\n        run: PROGRAMME_DAY_LIVE=true PLAYWRIGHT_MODULE=\"$RUNNER_TEMP/heading-tools/node_modules/playwright\" node scripts/verify-programme-day.cjs\n      - name: ";if(!source.includes(block))return source;assert.equal(source.split(block).length,2,'Only one exact original Programme evidence artifact is admitted');const index=source.indexOf(block);assert(source.slice(0,index).endsWith(anchor),'Programme evidence must follow the exact unchanged original live image command');return source.replace(block,'');}
const currentSource=path=>{const bytes=readFileSync(new URL('../'+path,import.meta.url),'utf8');return path==='.github/workflows/cloudflare-production-promote.yml'?seoAuditOriginalSource(path,bytes):bytes;};
const policy=()=>JSON.parse(currentSource('release/food-diary-london-date-scope-20261015.mjs').match(/^const policy=(\{[^\n]+\});\nconst manifest=/m)[1]);
const blobHash=s=>createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
test('exact original source manifest rejects altered commands, source receipts, caps, permissions and unknown versions',()=>{
 const p=policy(),original=p.inverses['.github/workflows/cloudflare-production-promote.yml'][0][0],bytes=currentSource('release/production-source-schedule-20261016.json');
 const s=validateScheduleDocument(bytes,original);assert.equal(s.tasks.length,33);assert.equal(s.originalProductionUnitCommands.length,31);
 for(const mutate of [x=>x.tasks.pop(),x=>x.tasks[0].body+='\necho skipped',x=>x.maximumConcurrent=3,x=>x.productionTimeoutMinutes=61,x=>x.privacyTimeoutMinutes=61,x=>x.originalHead='f'.repeat(40),x=>x.permissions='write',x=>x.originalPrivacyCommand='node --test tests/omitted.test.mjs']){
  const changed=structuredClone(s);mutate(changed);assert.throws(()=>validateScheduleDocument(JSON.stringify(changed),original),/Exact original source scheduling manifest/);
 }
 assert.throws(()=>validateScheduleDocument(bytes,original+'\n'),/Original production workflow proof changed/);
});
test('all33 production source blocks and required local preparations preserve their original command bytes',()=>{
 const p=policy(),production='.github/workflows/cloudflare-production-promote.yml',[[original,current]]=p.inverses[production],s=JSON.parse(currentSource('release/production-source-schedule-20261016.json'));
 assert.equal(currentSource(production),current);assert.equal(blobHash(original),'cd8c81a8d8c29def3c25b93112a4c56456b5cbfc');
 const start=original.indexOf('    steps:\n',original.indexOf('  promote:'))+'    steps:\n'.length,body=original.slice(start),positions=[...body.matchAll(/^      - /gm)].map(m=>m.index),blocks=positions.map((a,i)=>body.slice(a,positions[i+1]??body.length));assert.equal(blocks.length,125);
 const run=block=>{const m=/^        run: (.*)\n/m.exec(block);assert(m);return m[1]==='|'?block.slice(m.index+m[0].length).split(/(?<=\n)/).map(line=>line.startsWith('          ')?line.slice(10):line).join(''):m[1]+'\n';};
 const expected=[4,5,6,7,...Array.from({length:29},(_,i)=>i+12)];assert.deepEqual(s.tasks.map(t=>t.originalStep).sort((a,b)=>a-b),expected);
 for(const task of s.tasks){const prepared=s.preparations.find(x=>x.originalStep===task.originalStep)?.body??'',old=run(blocks[task.originalStep-1]);if(prepared)assert.equal(old.split(prepared).length,2);assert.equal(task.body,prepared?old.replace(prepared,''):old);}
 assert(programmeBeforeRetainedImageEvidence(current).endsWith(blocks.slice(40).join('')),'Every original provider, source-boundary, compiled, deployment, stock, live and rollback byte remains');assert(current.startsWith(original.slice(0,start)),'Triggers, frozen checkout ownership, permissions, environment and60min cap remain');
 const setup=current.indexOf('Prepare original local source fixtures'),barrier=current.indexOf('node release/bounded-source-checks-20261016.mjs production'),recovery=current.indexOf('Recover only the evidenced cancelled runtime');assert(setup<barrier&&barrier<recovery);
 assert.equal(current.split('        id: scope\n').length,2);assert(current.includes('RUN_TREATMENT_COMPILED_PROOF:'));assert(current.includes('TREATMENT_MINIFLARE:'));assert(!s.tasks.some(t=>t.body.includes('tests/my-treatment-compiled-control.test.mjs')),'Compiled proof retains its required later toolchain and environment');
});
test('privacy security and compile barriers and every original176 Food test byte remain independently pinned',()=>{
 const p=policy(),path='.github/workflows/online-privacy-recovery-proof.yml',[[before,after]]=p.inverses[path];assert.equal(currentSource(path),after);assert.equal(blobHash(before),'5fbbcd992c09d262109fe2c14d8f9bad2f9e727f');
 const end=before.indexOf('      - run: node gate1-release-security-privacy-gate.mjs\n');assert(end>0&&after.endsWith(before.slice(end)));assert.match(after,/^    timeout-minutes: 60$/m);assert(after.indexOf('node release/bounded-source-checks-20261016.mjs privacy')<after.indexOf('node gate1-release-security-privacy-gate.mjs'));
 let original=seoAuditOriginalSource('tests/food-diary-london-date-stack-20261015.test.mjs',currentSource('tests/food-diary-london-date-stack-20261015.test.mjs'));for(const[a,b]of[...p.sourceScheduleFood176Inverse].reverse()){assert(b&&original.split(b).length===2);original=original.replace(b,a);}assert.equal(blobHash(original),'132dfdd45019f7d7d8bc373bfdfe8d88e71db993');
 for(const protectedPath of ['release/immutable-git-facts.mjs','wrangler.jsonc','wrangler.coaching.jsonc','worker-entry-v6.js','shift-coach/worker.mjs'])assert(p.protectedPaths.includes(protectedPath));
 assert.deepEqual(p.boundedSourceScheduleWorkflowPaths,['.github/workflows/cloudflare-production-promote.yml',path]);assert.equal(p.record.boundedSourceScheduling20261016.suppliedReaderOrVerdictCache,false);
});
test('the actual literal inverse restores every original workflow dollar byte and preserves unknown suffixes for rejection',()=>{
 const p=policy(),definition=currentSource('release/food-diary-london-date-scope-20261015.mjs').match(/^function inverse\(p,s,pairs\)\{.*\}$/m)[0];
 const undo=new Function('assert',definition+'\nreturn inverse;')(assert);
 for(const path of p.boundedSourceScheduleWorkflowPaths){const pairs=p.inverses[path],[[before,after]]=pairs;assert.equal(undo(path,after,pairs),before);assert.notEqual(undo(path,after+'\n# unapproved\n',pairs),before);assert.throws(()=>undo(path,after+after,pairs),/One exact Food maintenance inverse/);}
 const literal="a $$ b $& c $` d $' end";assert.equal(undo('literal','replacement',[[literal,'replacement']]),literal);assert.throws(()=>undo('literal','replacement',[[literal,'']]),/One exact/);
});
test('original workflow coordination reads the actual executable stdin manifest, never an inert marker or substituted pair',()=>{
 const p=policy(),production='.github/workflows/cloudflare-production-promote.yml',[[original]]=p.inverses[production],current=currentSource(production),reference=currentSource('release/production-source-schedule-20261016.json');
 const begin="node release/bounded-source-checks-20261016.mjs production <<'SHIFT_PRODUCTION_SOURCE_COMMANDS'\n",end='          SHIFT_PRODUCTION_SOURCE_COMMANDS\n';assert.equal(current.split(begin).length,2);assert.equal(current.split(end).length,2);
 const literal=current.slice(current.indexOf(begin)+begin.length,current.indexOf(end));assert(literal.endsWith('\n'));const input=literal.slice(0,-1).split('\n').map(line=>{assert(line.startsWith('          '));return line.slice(10);}).join('\n')+'\n';
 const s=validateExecutableScheduleInput(input,reference,original);assert.equal(s.tasks.length,33);assert(current.includes('node my-journey-integration-gate.mjs'));assert.equal(s.tasks.filter(t=>t.body.includes('node my-journey-integration-gate.mjs')).length,1);
 for(const changed of [input.slice(0,-1),input.replace('node my-journey-integration-gate.mjs','node unapproved-gate.mjs'),input+'\n# unexecuted\n'])assert.throws(()=>validateExecutableScheduleInput(changed,reference,original),/Executable workflow input/);
 const paired=input.replace('node my-journey-integration-gate.mjs','node unapproved-gate.mjs');assert.throws(()=>validateExecutableScheduleInput(paired,paired,original),/Exact original source scheduling manifest/);
});

import {foodDiaryLondonDateOriginalProductionWorkflow} from '../release/food-diary-london-date-scope-20261015.mjs';

test('literal production layout view requires the exact complete admitted raw workflow and rejects extra or altered source',()=>{
 const current=readFileSync(new URL('../.github/workflows/cloudflare-production-promote.yml',import.meta.url),'utf8');
 const original=execFileSync('git',['show','ce456749488bafcbc2a8e7e6a4eb726cb12f0fd8:.github/workflows/cloudflare-production-promote.yml'],{encoding:'utf8'});
 assert.equal(foodDiaryLondonDateOriginalProductionWorkflow(current),original);
 for(const changed of [current+'\n# unapproved source\n',current.replace('maximumConcurrent\": 2','maximumConcurrent\": 3'),current.replace('timeout-minutes: 60','timeout-minutes: 61'),current.replace('actions: read','actions: write')]){assert.notEqual(changed,current);assert.throws(()=>foodDiaryLondonDateOriginalProductionWorkflow(changed));}
 assert.throws(()=>foodDiaryLondonDateOriginalProductionWorkflow(Buffer.from(current)));
});

test('all three original literal-test assertion bodies restore exactly after only strict production-read adapters',()=>{
 const scope=readFileSync(new URL('../release/food-diary-london-date-scope-20261015.mjs',import.meta.url),'utf8');
 const policy=JSON.parse(scope.match(/^const policy=(\{[^\n]+\});\nconst manifest=/m)[1]);
 let main=seoAuditOriginalSource('tests/food-diary-london-date-stack-20261015.test.mjs',readFileSync(new URL('../tests/food-diary-london-date-stack-20261015.test.mjs',import.meta.url),'utf8'));for(const [before,after,kind]of [...policy.literalWatchTestWitnessInverse].reverse()){assert(after&&main.split(after).length===2);if(kind==='suffix')assert(main.endsWith(after));main=main.replace(after,()=>before);}assert.equal(main,execFileSync('git',['show','6fe03c05bdcaad7b83d20fc5bd17e60f341db8e0:tests/food-diary-london-date-stack-20261015.test.mjs'],{encoding:'utf8'}));
 for(const path of ['shift-coach/release.test.mjs','tests/b1-release-scope.test.mjs','tests/home-route-banner.test.mjs']){let current=readFileSync(new URL('../'+path,import.meta.url),'utf8');for(const [before,after,kind]of [...policy.inverses[path]].reverse()){assert(after&&current.split(after).length===2);if(kind==='prefix')assert(current.startsWith(after));current=current.replace(after,()=>before);}assert.equal(current,execFileSync('git',['show','6fe03c05bdcaad7b83d20fc5bd17e60f341db8e0:'+path],{encoding:'utf8'}));}
});

// Keep original source assertions and exercise the actual launch prerequisite.
import './bounded-source-admission-dependencies-20261016.test.mjs';

// The exact one-step evidence addition never permits another workflow change.
test('Programme evidence reader restores the entire original current workflow and every dollar byte',()=>{
 const current=policy().inverses['.github/workflows/cloudflare-production-promote.yml'][0][1],restored=programmeBeforeRetainedImageEvidence(current);
 assert.equal(blobHash(restored),'d446aefeb1a19279903456dfbbbaca7fd79de9d0');assert.equal(programmeBeforeRetainedImageEvidence(restored),restored);
});
test('Programme evidence reader retains unknown bytes for original rejection and rejects duplicates or relocation',()=>{
 const current=policy().inverses['.github/workflows/cloudflare-production-promote.yml'][0][1],restored=programmeBeforeRetainedImageEvidence(current);
 const block=current.slice(restored.indexOf('      - name: Prove newsroom publication order on live traffic'),current.indexOf('      - name: Prove newsroom publication order on live traffic'));
 for(const changed of [current+'\n# unapproved\n',current.replace('contents: read','contents: write')])assert.notEqual(programmeBeforeRetainedImageEvidence(changed),restored);
 const exactBlock="Retain original Programme day browser evidence\n        if: always()\n        uses: actions/upload-artifact@v4\n        with:\n          name: programme-day-live-${{ github.sha }}\n          path: programme-day-proof/\n          if-no-files-found: warn\n          retention-days: 30\n      - name: ";
 assert.throws(()=>programmeBeforeRetainedImageEvidence(current+exactBlock),/one exact/);
 assert.throws(()=>programmeBeforeRetainedImageEvidence(exactBlock+current.replace(exactBlock,'')),/follow the exact/);
 const changedBlock=current.replace('programme-day-proof/','programme-day-proof-altered/');assert.equal(programmeBeforeRetainedImageEvidence(changedBlock),changedBlock);assert.notEqual(changedBlock,restored);
});
