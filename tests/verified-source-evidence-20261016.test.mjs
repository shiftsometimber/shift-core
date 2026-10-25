import {approvedSourceComparison} from '../release/approved-source-comparison-20261024.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync,chmodSync,realpathSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {digest,makeScopeEvidence,validateScopeEvidence,decodeEvidenceArchive,productionContext,sourceAuthority,verifiedSourceScopeAtPointUseSync,preserveOriginalScopeReceipt} from '../release/verified-source-evidence-20261016.mjs';

const manifestBytes=readFileSync(new URL('../release/production-source-schedule-20261016.json',import.meta.url),'utf8'),manifest=JSON.parse(manifestBytes);
function fixture(){
 const context={repository:'shiftsometimber/shift-core',workflow:'.github/workflows/cloudflare-production-promote.yml',runId:123,attempt:1,head:'a'.repeat(40),job:'promote',actorId:315011648};
 const authority={head:context.head,tree:'b'.repeat(40),cwd:'/runner/source',gitDirectory:'/runner/source/.git',uid:1001,node:'v24.21.0',gitVersion:'git version 2.55.0',configurationSha256:'c'.repeat(64),files:[]};
 const report={runtimeOnly:true,reconciliation:{proof:'original assertions passed'},metricsConnection:{proof:'original metrics passed'},releaseCommit:context.head,tree:authority.tree,checkedAt:'2026-10-16T00:00:00Z',databaseMigrations:false,contentPublication:false};
 const status={poolId:'production-bounded',maxConcurrent:2,active:0,cancelled:null,evidenceFailed:false,errors:[],sourceUnchanged:true,sourceBefore:{head:context.head,tree:authority.tree},sourceAfter:{head:context.head,tree:authority.tree},finishedAt:'2026-10-16T00:01:00Z',results:manifest.tasks.map((t,i)=>({id:t.id,bodySha256:digest(t.body),status:'passed',exitCode:0,signal:null,pid:i+100,startedAt:new Date(Date.parse('2026-10-16T00:00:00Z')+(t.id==='production-step-004'?0:1+Math.floor((i-(i>manifest.tasks.findIndex(task=>task.id==='production-step-004')?1:0))/2))*1000).toISOString(),finishedAt:new Date(Date.parse('2026-10-16T00:00:00Z')+(t.id==='production-step-004'?1:2+Math.floor((i-(i>manifest.tasks.findIndex(task=>task.id==='production-step-004')?1:0))/2))*1000).toISOString()}))};
 const statusBytes=JSON.stringify(status,null,2)+'\n',commandsBytes=JSON.stringify({poolId:'production-bounded',maxConcurrent:2,tasks:manifest.tasks},null,2)+'\n',scopeBytes=JSON.stringify(report,null,2),stdoutBytes='original test output\n'+JSON.stringify(report)+'\n';
 const evidence=makeScopeEvidence({context,authority,manifestBytes,statusBytes,commandsBytes,scopeBytes,stdoutBytes});
 const provider={run:{id:123,run_attempt:1,head_sha:context.head,repository:{full_name:context.repository},actor:{id:315011648},path:context.workflow,event:'push',head_branch:'main'},jobs:[{name:'promote',run_id:123,run_attempt:1,head_sha:context.head,status:'in_progress',steps:[{name:'Verify every original production source command with two execution slots',conclusion:'success'},{name:'Retain completed source proofs before runtime operations',conclusion:'success'}]}],artifact:{id:456,name:'production-bounded-source-'+context.head,expired:false,workflow_run:{id:123,head_sha:context.head},digest:'sha256:'+'d'.repeat(64),size_in_bytes:100}};
 return {context,authority,provider,evidence,status,report,manifestBytes,statusBytes,commandsBytes,evidenceBytes:JSON.stringify(evidence,null,2)+'\n'};
}
const validate=f=>validateScopeEvidence(f);
function zip(files){
 const script=String.raw`import sys,json,zipfile,io
d=json.load(sys.stdin);b=io.BytesIO()
with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED)as z:
 for k,v in d.items():z.writestr(k,v)
sys.stdout.buffer.write(b.getvalue())`;
 return execFileSync('python3',['-c',script],{input:JSON.stringify(files),maxBuffer:4*1024*1024});
}
function archive(f){return zip({'scope-evidence.json':f.evidenceBytes,'status.json':f.statusBytes,'commands.json':f.commandsBytes});}
test('recomputed receipt checksums cannot hide an early dependent start overlapping source commands or invalid execution times',()=>{
 const mutations=[
  status=>{const launch=status.results.find(result=>result.id==='production-step-004'),growth=status.results.find(result=>result.id==='production-step-005');growth.startedAt=launch.startedAt;},
  status=>{for(const result of status.results.filter(result=>result.id!=='production-step-004').slice(0,3)){result.startedAt='2026-10-16T00:00:01Z';result.finishedAt='2026-10-16T00:00:02Z';}},
  status=>{status.results[0].startedAt='invalid';},
  status=>{status.results[0].finishedAt='2025-10-16T00:00:00Z';},
  status=>{status.finishedAt='2026-10-16T00:00:00Z';}
 ];
 for(const mutate of mutations){const f=fixture();mutate(f.status);f.statusBytes=JSON.stringify(f.status);f.evidence.statusSha256=digest(f.statusBytes);f.evidenceBytes=JSON.stringify(f.evidence);assert.throws(()=>validate(f));}
});
test('the original complete scope result is accepted only with all33 original actual zero exits and its current provider-sealed job',()=>{const f=fixture();assert.deepEqual(validate(f),f.report);});
test('every changed run attempt source actor workflow job or uploaded-artifact identity rejects',()=>{
 const mutations=[f=>f.provider.run.id++,f=>f.provider.run.run_attempt++,f=>f.provider.run.head_sha='f'.repeat(40),f=>f.provider.run.actor.id++,f=>f.provider.run.path='.github/workflows/unapproved.yml',f=>f.provider.run.event='pull_request',f=>f.provider.run.head_branch='other',f=>f.provider.run.repository.full_name='other/repository',f=>f.provider.jobs[0].run_id++,f=>f.provider.jobs[0].run_attempt++,f=>f.provider.jobs[0].head_sha='f'.repeat(40),f=>f.provider.jobs[0].status='completed',f=>f.provider.jobs.push(structuredClone(f.provider.jobs[0])),f=>f.provider.artifact.name+='-other',f=>f.provider.artifact.expired=true,f=>f.provider.artifact.workflow_run.id++,f=>f.provider.artifact.workflow_run.head_sha='f'.repeat(40),f=>delete f.provider.artifact.digest];
 for(const mutate of mutations){const f=fixture();mutate(f);assert.throws(()=>validate(f));}
});
test('a saved instruction or passing summaries cannot replace actual completed source and artifact steps',()=>{
 for(const step of [0,1])for(const state of ['failure','cancelled','skipped',null]){const f=fixture();f.provider.jobs[0].steps[step].conclusion=state;assert.throws(()=>validate(f));}
 const f=fixture();f.provider.jobs[0].steps[1].name='Unrelated artifact';assert.throws(()=>validate(f));
});
test('omitted duplicated failed signalled queued or nonzero original commands cannot be accepted',()=>{
 const changes=[s=>s.results.pop(),s=>s.results.push(s.results[0]),s=>s.results[0].bodySha256='e'.repeat(64),s=>s.results[0].exitCode=7,s=>s.results[0].signal='SIGTERM',s=>s.results[0].status='queued',s=>s.results[0].pid=null,s=>s.active=1,s=>s.maxConcurrent=3,s=>s.cancelled='SIGTERM',s=>s.evidenceFailed=true,s=>s.errors.push({code:'EPIPE'}),s=>s.sourceUnchanged=false];
 for(const mutate of changes){const f=fixture();mutate(f.status);f.statusBytes=JSON.stringify(f.status);f.evidence.statusSha256=digest(f.statusBytes);f.evidenceBytes=JSON.stringify(f.evidence);assert.throws(()=>validate(f));}
});
test('fresh mutable HEAD tree configuration directory and execution identities are independently bound',()=>{
 for(const key of ['head','tree','cwd','gitDirectory','uid','node','gitVersion','configurationSha256','files','execution']){const f=fixture();f.authority[key]=key==='files'?['changed']:String(f.authority[key])+'changed';assert.throws(()=>validate(f));}
});
test('an altered original report command manifest or authority receipt rejects',()=>{
 for(const change of [f=>f.evidence.scopeReport.runtimeOnly=false,f=>f.evidence.scopeReport.contentPublication=true,f=>f.evidence.scopeReport.databaseMigrations=true,f=>f.evidence.scopeReport.releaseCommit='f'.repeat(40),f=>f.evidence.context.attempt++,f=>f.evidence.authority.head='f'.repeat(40),f=>f.evidence.kind='unapproved-version']){const f=fixture();change(f);f.evidenceBytes=JSON.stringify(f.evidence);assert.throws(()=>validate(f));}
 const f=fixture();f.manifestBytes=manifestBytes+'\n';assert.throws(()=>validate(f));
});
test('sealed ZIP verifies exact provider bytes and stdlib CRCs without extracting files',()=>{
 const f=fixture(),bytes=archive(f),files=decodeEvidenceArchive(bytes,'sha256:'+digest(bytes));assert.equal(files['scope-evidence.json'],f.evidenceBytes);assert.equal(files['status.json'],f.statusBytes);assert.deepEqual(validate({...f,evidenceBytes:files['scope-evidence.json'],statusBytes:files['status.json'],commandsBytes:files['commands.json']}),f.report);
 const changed=Buffer.from(bytes);changed[20]^=1;assert.throws(()=>decodeEvidenceArchive(changed,'sha256:'+digest(bytes)),/artifact bytes changed/);
});
test('paired receipt and checksum forgery still rejects against the independent provider archive digest',()=>{
 const f=fixture(),before=archive(f),trusted='sha256:'+digest(before);f.evidence.scopeReport.contentPublication=true;f.evidence.reportSha256=digest(JSON.stringify(f.evidence.scopeReport));f.evidence.scopeFileSha256=digest(JSON.stringify(f.evidence.scopeReport,null,2));f.evidenceBytes=JSON.stringify(f.evidence);const forged=archive(f);assert.throws(()=>decodeEvidenceArchive(forged,trusted),/artifact bytes changed/);
});
test('unknown zip paths versions duplicate names and missing evidence are rejected',()=>{
 const f=fixture(),files={'scope-evidence.json':f.evidenceBytes,'status.json':f.statusBytes,'commands.json':f.commandsBytes};
 for(const name of ['../outside','/absolute','windows\\outside']){const bytes=zip({...files,[name]:'bad'});assert.throws(()=>decodeEvidenceArchive(bytes,'sha256:'+digest(bytes)));}
 const bytes=zip({'status.json':f.statusBytes});assert.throws(()=>decodeEvidenceArchive(bytes,'sha256:'+digest(bytes)));assert.throws(()=>decodeEvidenceArchive(bytes,'unknown'));
});
test('source proof production eligibility preserves the existing actor and original execution path',()=>{
 assert.equal(productionContext({}),null);assert.equal(productionContext({GITHUB_ACTIONS:'true',GITHUB_WORKFLOW:'Other',GITHUB_JOB:'promote'}),null);
 const env={GITHUB_ACTIONS:'true',GITHUB_WORKFLOW:'Cloudflare Production Promote',GITHUB_JOB:'promote',GITHUB_REPOSITORY:'shiftsometimber/shift-core',GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'push',GITHUB_ACTOR_ID:'315011648',GITHUB_RUN_ID:'123',GITHUB_RUN_ATTEMPT:'1',GITHUB_SHA:'a'.repeat(40)};assert.equal(productionContext(env).runId,123);
 for(const [key,value]of [['GITHUB_ACTOR_ID','other'],['GITHUB_REPOSITORY','other/repo'],['GITHUB_REF','refs/pull/1/merge'],['GITHUB_RUN_ATTEMPT','0'],['GITHUB_SHA','unknown'],['GITHUB_EVENT_NAME','pull_request']])assert.throws(()=>productionContext({...env,[key]:value}));assert.equal(verifiedSourceScopeAtPointUseSync(),null);
});
test('original CLI stdout and exact original scope-file bytes are required before sealing',()=>{
 const f=fixture(),base={context:f.context,authority:f.authority,manifestBytes,statusBytes:f.statusBytes,commandsBytes:f.commandsBytes,scopeBytes:JSON.stringify(f.report,null,2),stdoutBytes:JSON.stringify(f.report)+'\n'};assert.throws(()=>makeScopeEvidence({...base,stdoutBytes:'passed 1908\n'}));assert.throws(()=>makeScopeEvidence({...base,scopeBytes:base.scopeBytes+'\n'}),/Exact original scope file bytes/);
});
test('native source authority rejects changed tracked source hidden flags and changed configuration',()=>{
 const root=mkdtempSync(join(tmpdir(),'shift-source-authority-')),repo=join(root,'repo');mkdirSync(repo);const cwd=process.cwd(),selectors=Object.fromEntries(Object.entries(process.env).filter(([k])=>k.startsWith('GIT_')||['NODE_OPTIONS','NODE_PATH','NODE_EXTRA_CA_CERTS','NODE_TLS_REJECT_UNAUTHORIZED'].includes(k)));for(const k of Object.keys(selectors))delete process.env[k];
 const g=(...args)=>execFileSync('git',args,{cwd:repo,stdio:'pipe'});
 try{g('init','--quiet');writeFileSync(join(repo,'source.txt'),'approved\n');g('add','source.txt');g('-c','user.name=Source fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','source');process.chdir(repo);const a=sourceAuthority();assert.equal(a.head.length,40);assert.deepEqual(sourceAuthority(),a);writeFileSync(join(repo,'source.txt'),'changed\n');assert.throws(sourceAuthority,/Tracked source/);g('checkout','--','source.txt');g('update-index','--assume-unchanged','source.txt');assert.throws(sourceAuthority,/Hidden source/);g('update-index','--no-assume-unchanged','source.txt');g('config','source.fixture','changed');assert.notDeepEqual(sourceAuthority(),a);}finally{process.chdir(cwd);Object.assign(process.env,selectors);rmSync(root,{recursive:true,force:true});}
});

test('original local scope bytes and checkedAt are preserved and altered or linked receipts reject',()=>{
 const root=mkdtempSync(join(tmpdir(),'shift-scope-receipt-')),cwd=process.cwd(),output=process.env.GITHUB_OUTPUT;try{
  process.chdir(root);process.env.GITHUB_OUTPUT=join(root,'outputs');const report=fixture().report;assert.equal(preserveOriginalScopeReceipt(report),report);const original=readFileSync('b1-runtime-release/scope.json','utf8');assert.equal(original,JSON.stringify(report,null,2));preserveOriginalScopeReceipt(report);assert.equal(readFileSync('b1-runtime-release/scope.json','utf8'),original);assert.equal(readFileSync(process.env.GITHUB_OUTPUT,'utf8'),'runtime_only=true\ngrub_publication=false\nruntime_only=true\ngrub_publication=false\n');
  writeFileSync('b1-runtime-release/scope.json',JSON.stringify({...report,checkedAt:'forged'}));assert.throws(()=>preserveOriginalScopeReceipt(report),/receipt changed/);rmSync('b1-runtime-release/scope.json');writeFileSync('other.json',original);symlinkSync(join(root,'other.json'),'b1-runtime-release/scope.json');assert.throws(()=>preserveOriginalScopeReceipt(report),/Ordinary original scope receipt/);
 }finally{process.chdir(cwd);if(output===undefined)delete process.env.GITHUB_OUTPUT;else process.env.GITHUB_OUTPUT=output;rmSync(root,{recursive:true,force:true});}
});
test('duplicate ZIP entries reject even with a valid independent digest',()=>{
 const f=fixture(),bytes=execFileSync('python3',['-c',"import sys,io,zipfile; b=io.BytesIO(); z=zipfile.ZipFile(b,'w'); z.writestr('scope-evidence.json','{}'); z.writestr('scope-evidence.json','{}'); z.writestr('status.json','{}'); z.writestr('commands.json','{}'); z.close(); sys.stdout.buffer.write(b.getvalue())"],{stdio:['ignore','pipe','pipe']});assert.throws(()=>decodeEvidenceArchive(bytes,'sha256:'+digest(bytes)));
});
test('strict original-source mode forces full assertions and cannot grant evidence reuse',()=>{
 const previous=process.env.SHIFT_ORIGINAL_SOURCE_SCOPE;try{process.env.SHIFT_ORIGINAL_SOURCE_SCOPE='1';assert.equal(verifiedSourceScopeAtPointUseSync(),null);}finally{if(previous===undefined)delete process.env.SHIFT_ORIGINAL_SOURCE_SCOPE;else process.env.SHIFT_ORIGINAL_SOURCE_SCOPE=previous;}
});

test('source reuse restores every original B1 assertion and leaves the entire fresh stock snapshot body literal',()=>{
 const current=p=>{const bytes=readFileSync(new URL('../'+p,import.meta.url),'utf8');return p==='scripts/b1-release-scope.mjs'?approvedSourceComparison(p,bytes):bytes;};const policy=JSON.parse(current('release/food-diary-london-date-scope-20261015.mjs').match(/^const policy=(\{[^\n]+\});\nconst manifest=/m)[1]),path='scripts/b1-release-scope.mjs',[[before,after]]=policy.inverses[path];assert.equal(current(path),after);
 let restored=after;for(const[a,b]of[...policy.sourceProofOriginalB1Inverse].reverse()){assert(b&&restored.split(b).length===2);restored=restored.replace(b,()=>a);}assert.equal(restored,before);assert.equal(before.slice(before.indexOf('async function snapshot(phase)')),after.slice(after.indexOf('async function snapshot(phase)')));
 const runner=current('release/bounded-source-checks-20261016.mjs');assert(runner.includes("env:{...process.env,SHIFT_ORIGINAL_SOURCE_SCOPE:'1'}"));assert(runner.includes('assert.deepEqual(sourceAuthority(),authorityBefore'));assert(runner.indexOf('if(!result.passed)throw Error')<runner.indexOf('const evidence=makeScopeEvidence'));assert(current('.github/workflows/cloudflare-production-promote.yml').includes('      - name: Retain completed source proofs before runtime operations\n        uses: actions/upload-artifact@v4'));
});

function executableFixture(run){
 const root=mkdtempSync(join(tmpdir(),'shift-executable-authority-')),repo=join(root,'repo'),bin=join(root,'bin'),cwd=process.cwd(),path=process.env.PATH,selectors=Object.fromEntries(Object.entries(process.env).filter(([k])=>k.startsWith('GIT_')||['NODE_OPTIONS','NODE_PATH','NODE_EXTRA_CA_CERTS','NODE_TLS_REJECT_UNAUTHORIZED'].includes(k)));
 try{for(const k of Object.keys(selectors))delete process.env[k];mkdirSync(repo);mkdirSync(bin);const real=execFileSync('which',['git'],{encoding:'utf8'}).trim(),g=(...args)=>execFileSync(real,args,{cwd:repo,stdio:'pipe'});g('init','--quiet');writeFileSync(join(repo,'source.txt'),'approved\n');g('add','source.txt');g('-c','user.name=Executable fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','Approved fixture');process.chdir(repo);const wrapper=join(bin,'git'),benign='#!/bin/sh\nexec '+JSON.stringify(real)+' "$@"\n',conceal='#!/bin/sh\nif [ "$1" = "--no-optional-locks" ]; then shift; fi\nif [ "$1" = "diff" ]; then exit 0; fi\nexec '+JSON.stringify(real)+' "$@"\n';run({root,repo,bin,real,g,wrapper,benign,conceal,path});
 }finally{process.chdir(cwd);process.env.PATH=path;Object.assign(process.env,selectors);rmSync(root,{recursive:true,force:true});}
}
function executionMismatchRejects(before,after){
 const f=fixture();f.evidence.authority={...f.authority,execution:before.execution};f.evidenceBytes=JSON.stringify(f.evidence);assert.throws(()=>validate({...f,authority:{...f.authority,execution:after.execution}}),/Fresh source authority differs/);
}
test('changed executable search path cannot conceal a tracked edit behind a Git wrapper',()=>executableFixture(f=>{
 const before=sourceAuthority();writeFileSync(f.wrapper,f.conceal);chmodSync(f.wrapper,0o755);writeFileSync(join(f.repo,'source.txt'),'unapproved edit\n');assert.notEqual(f.g('diff','--name-only','HEAD','--').toString().trim(),'');process.env.PATH=f.bin+':'+f.path;assert.equal(execFileSync(f.wrapper,['--version'],{encoding:'utf8'}).trim(),before.gitVersion);assert.throws(sourceAuthority,/Native executable required/);
}));
test('replacing executable bytes at the same path with the same reported version cannot reuse original proof',()=>executableFixture(f=>{
 const compile=hide=>{const file=join(f.root,'git-forwarder.c');writeFileSync(file,'#include <unistd.h>\n#include <string.h>\nint main(int argc,char **argv){ int first=1; if(argc>1 && strcmp(argv[1],\"--no-optional-locks\")==0) first=2; if('+hide+' && argc>first && strcmp(argv[first],\"diff\")==0) return 0; argv[0]='+JSON.stringify(f.real)+'; execv(argv[0],argv); return 127;}\n');execFileSync('cc',['-x','c',file,'-o',f.wrapper],{stdio:'pipe'});execFileSync(f.wrapper,['--version'],{stdio:'pipe'});};
 compile(0);process.env.PATH=f.bin+':'+f.path;const before=sourceAuthority();assert.equal(before.execution.git.path,realpathSync(f.wrapper));compile(1);writeFileSync(join(f.repo,'source.txt'),'unapproved edit\n');assert.notEqual(f.g('diff','--name-only','HEAD','--').toString().trim(),'');assert.equal(execFileSync(f.wrapper,['--version'],{encoding:'utf8'}).trim(),before.gitVersion);const after=sourceAuthority();assert.equal(after.execution.git.path,before.execution.git.path);assert.equal(after.execution.selectors.PATH,before.execution.selectors.PATH);assert.equal(after.gitVersion,before.gitVersion);assert.notEqual(after.execution.git.sha256,before.execution.git.sha256);executionMismatchRejects(before,after);assert.match(before.execution.node.sha256,/^[a-f0-9]{64}$/);
}));
