import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,mkdtempSync,readFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {ciExecutionHistoricalView} from './ci-execution-scope-20261014.mjs';

const originalPath='tests/ci-execution-stack-20261014.test.mjs';
const witnessPath='release/ci-execution-stack-original-20261015.mjs';
const originalBlob='b5aee29bfa2e7e4fa01de2585df074eb3ee40907';
const ledger='release/approved-runtime-composition.json';
const sha=value=>createHash('sha256').update(value).digest('hex');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6});
function snapshot(){const status=git('status','--porcelain','--untracked-files=no');return{head:git('rev-parse','HEAD').trim(),refs:git('for-each-ref','--format=%(refname) %(objectname)'),index:sha(readFileSync(resolve(git('rev-parse','--git-path','index').trim()))),status};}

export function assertOriginalCiTerminalReport(result){
 assert.equal(result.error,undefined,'The unchanged original CI test process must start and finish');
 assert.equal(result.signal,null,'The unchanged original CI test process must not be cancelled');
 assert.equal(result.status,0,'Every unchanged original CI assertion must pass');
 for(const [label,count]of[['tests',21],['pass',21],['fail',0],['cancelled',0],['skipped',0],['todo',0]]){
  const matches=[...result.stdout.matchAll(new RegExp('^# '+label+' (\\d+)\\s*$','gm'))];
  assert.equal(matches.length,1,'One actual original CI terminal count is required: '+label);
  assert.equal(Number(matches[0][1]),count,'Original CI assertion count changed: '+label);
 }
}

export function runOriginalCiAssertionsOnAdmittedContext(testContext){
 const before=snapshot();assert.equal(before.status,'','Original CI test context requires clean tracked source');
 // This public call freshly proves every known upper source layer before the
 // private original CI verifier supplies its own actual pre-projection head.
 const view=ciExecutionHistoricalView();assert.equal(view.rawHead,before.head);
 const subject=view.ciAssertionsHead;assert.match(subject||'',/^[a-f0-9]{40}$/,'An admitted private original CI assertion head is required');
 const subjectTree=view.ciAssertionsTree;assert.match(subjectTree||'',/^[a-f0-9]{40}$/,'An admitted private original CI assertion tree is required');
 assert.equal(git('rev-parse',subject+'^{tree}').trim(),subjectTree,'The literal original CI source tree must match its independently admitted context');
 const record=JSON.parse(git('show',before.head+':'+ledger)),prior=JSON.parse(git('show',subject+':'+ledger));
 assert(prior.ciExecutionAllowance20261014,'The literal original CI registration is required');
 assert.deepEqual(prior.ciExecutionAllowance20261014,record.ciExecutionAllowance20261014,'The complete actual current CI authority must remain exact');
 for(const key of['foodDiaryLondonDateRepair20261015','myTimberRecordedWeekActivation20261014','gpMemberCode20261014'])assert(!Object.hasOwn(prior,key),'Original CI assertions require their own actual historical stage: '+key);
 git('merge-base','--is-ancestor',subject,before.head);
 assert.equal(git('rev-parse',subject+':'+originalPath).trim(),originalBlob,'The original21 assertions must remain byte exact on their actual Git head');
 assert.equal(git('rev-parse',before.head+':'+witnessPath).trim(),originalBlob,'The current source must retain the original21 witness byte exact');
 assert.equal(readFileSync(new URL('./ci-execution-stack-original-20261015.mjs',import.meta.url),'utf8'),git('show',subject+':'+originalPath),'No original CI assertion may be rewritten');
 view.assertCurrent();
 const temporary=mkdtempSync(join(tmpdir(),'shift-original-ci-assertions-')),checkout=join(temporary,'ci');let added=false;
 try{
  git('worktree','add','--quiet','--detach',checkout,subject);added=true;
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:checkout,encoding:'utf8'}).trim(),subject,'The original assertions must run on the actual admitted CI Git checkout');
  const modules=resolve('node_modules');if(existsSync(modules))symlinkSync(modules,join(checkout,'node_modules'),'dir');
  // Node marks each test-file child with NODE_TEST_CONTEXT. This separate
  // actual Git worktree needs a fresh runner, rather than its parent's marker.
  // Preserve every other environment entry and all accepted source identity.
  const childEnv={...process.env};delete childEnv.NODE_TEST_CONTEXT;
  const result=spawnSync(process.execPath,['--test','--test-reporter=tap',originalPath],{cwd:checkout,env:childEnv,encoding:'utf8',maxBuffer:64e6});
  testContext.diagnostic('Actual original CI head '+subject+'; original test blob '+originalBlob+'; current raw head '+before.head);
  testContext.diagnostic(result.stdout||'');if(result.stderr)testContext.diagnostic(result.stderr);
  assertOriginalCiTerminalReport(result);
  return Object.freeze({rawHead:before.head,ciHead:subject,ciTree:subjectTree,originalTestBlob:originalBlob,originalTests:21,pass:21,fail:0,skip:0,cancelled:0,syntheticGitProjection:false});
 }finally{
  try{if(added)git('worktree','remove','--force',checkout);}
  finally{
   // Keep a still-registered owned checkout if removal fails, so it can be
   // recovered; never delete another checkout or prune unrelated worktrees.
   if(!existsSync(checkout))rmSync(temporary,{recursive:true,force:true});
   view.assertCurrent();assert.deepEqual(snapshot(),before,'Current raw source HEAD, refs, index and tracked state must remain exact around original CI assertions');
  }
 }
}
