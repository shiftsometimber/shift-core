import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,appendFileSync,renameSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64*1024*1024});
const gitBlob=bytes=>createHash('sha1').update('blob '+Buffer.byteLength(bytes)+'\0').update(bytes).digest('hex');
export function sourceSnapshot(){
 const head=git('rev-parse','HEAD').trim(),tree=git('rev-parse','HEAD^{tree}').trim();
 assert.match(head,/^[a-f0-9]{40}$/);assert.match(tree,/^[a-f0-9]{40}$/);
 assert.equal(git('diff','--name-only','HEAD','--').trim(),'','Tracked source changed during bounded checks');
 assert.equal(git('diff','--cached','--name-only','--').trim(),'','Staged source changed during bounded checks');
 const flags=execFileSync('git',['ls-files','-v','-z'],{maxBuffer:32*1024*1024});
 let start=0;while(start<flags.length){const end=flags.indexOf(0,start);assert(end>start,'Invalid source index');const flag=flags[start];assert(!(flag===83||flag>=97&&flag<=122),'Hidden source index flag');start=end+1;}
 return {head,tree};
}

// The only shared work is immutable history hydration. No source assertion,
// callback result, command exit, launch decision or deployment proof is cached.
export async function hydrateOriginalHistory(){
 const {ensureReviewedHistory}=await import('../shift-coach/release-contract.mjs');ensureReviewedHistory();
 const {ensureCombinedOriginalGpSource}=await import('./combined-original-gp-object-20261014.mjs');ensureCombinedOriginalGpSource();
}

export async function runBoundedChecks(tasks,{proofDir,poolId,snapshot=sourceSnapshot,env=process.env,scopeTask=null}={}){
 assert(Array.isArray(tasks)&&tasks.length>0&&tasks.length<=100,'Finite source command manifest required');
 assert.equal(new Set(tasks.map(t=>t.id)).size,tasks.length,'Duplicate source command');
 assert(tasks.every(t=>/^[-a-z0-9]+$/.test(t.id)&&typeof t.body==='string'&&t.body.length>0),'Invalid source command');
 assert(typeof proofDir==='string'&&proofDir&&/^[-a-z0-9]+$/.test(poolId),'Owned proof directory and pool required');
 assert(scopeTask===null||tasks.some(t=>t.id===scopeTask),'Unknown scope output owner');
 mkdirSync(proofDir,{recursive:true});
 const sourceBefore=snapshot(),now=()=>new Date().toISOString();
 const results=tasks.map(t=>({id:t.id,bodySha256:sha(t.body),status:'queued',pid:null,startedAt:null,finishedAt:null,exitCode:null,signal:null}));
 const children=new Map(),events=[],errors=[];let active=0,next=0,cancelled=null,finishedAt=null,sourceAfter=null,sourceUnchanged=false;
 const state=()=>({poolId,maxConcurrent:2,active,cancelled,finishedAt,sourceBefore,sourceAfter,sourceUnchanged,evidenceFailed:errors.length>0,errors,results,events});
 const evidence=(operation,fn)=>{try{return fn();}catch(error){errors.push({operation,code:typeof error.code==='string'?error.code:'EVIDENCE_ERROR'});return undefined;}};
 const save=()=>evidence('status',()=>{writeFileSync(join(proofDir,'status.json.tmp'),JSON.stringify(state(),null,2)+'\n');renameSync(join(proofDir,'status.json.tmp'),join(proofDir,'status.json'));});
 const record=(event,details={})=>{events.push({at:now(),event,active,...details});save();evidence('progress',()=>process.stdout.write('['+poolId+'] '+event+(details.id?' '+details.id:'')+' active='+active+'\n'));};
 writeFileSync(join(proofDir,'commands.json'),JSON.stringify({poolId,maxConcurrent:2,tasks},null,2)+'\n');
 for(const task of tasks)for(const suffix of ['.stdout.log','.stderr.log','.log','.outputs'])writeFileSync(join(proofDir,task.id+suffix),'');
 save();
 function stop(signal){
  if(cancelled)return;cancelled=signal;record('cancelled',{signal});
  for(const [id,owned]of children){
   try{process.kill(-owned.child.pid,'SIGTERM');}catch(error){if(error.code!=='ESRCH')errors.push({operation:'signal-'+id,code:error.code??'SIGNAL_ERROR'});}
   owned.escalation=setTimeout(()=>{if(children.get(id)!==owned)return;try{process.kill(-owned.child.pid,'SIGKILL');}catch(error){if(error.code!=='ESRCH')errors.push({operation:'kill-'+id,code:error.code??'SIGNAL_ERROR'});}},5000);
   owned.escalation.unref();
  }
 }
 const onTerm=()=>stop('SIGTERM'),onInt=()=>stop('SIGINT');process.on('SIGTERM',onTerm);process.on('SIGINT',onInt);
 const heartbeat=setInterval(()=>record('heartbeat',{running:[...children.keys()]}),30000);heartbeat.unref();
 try{
  record('started');
  await new Promise(resolveDone=>{
   function pump(){
    if(cancelled)for(;next<tasks.length;next++){results[next].status='cancelled-before-start';results[next].finishedAt=now();}
    while(!cancelled&&active<2&&next<tasks.length)start(next++);
    if(active===0&&next===tasks.length)resolveDone();
   }
   function start(index){
    const task=tasks[index],result=results[index];active++;result.status='running';result.startedAt=now();
    let settled=false,owned;
    const finish=(code,signal,errorCode=null)=>{
     if(settled)return;settled=true;if(owned?.escalation)clearTimeout(owned.escalation);children.delete(task.id);active--;
     result.exitCode=code;result.signal=signal;result.finishedAt=now();result.status=errorCode?'spawn-failed':signal?'signalled':code===0?'passed':'failed';if(errorCode)result.errorCode=errorCode;
     record('command-finished',{id:task.id,status:result.status,exitCode:code,signal});pump();
    };
    try{
     const child=spawn('bash',['--noprofile','--norc','-e','-o','pipefail','-c',task.body],{env:{...env,GITHUB_OUTPUT:join(proofDir,task.id+'.outputs')},stdio:['ignore','pipe','pipe'],detached:true});
     owned={child,escalation:null};children.set(task.id,owned);result.pid=child.pid??null;record('command-started',{id:task.id,pid:result.pid});
     child.once('error',error=>finish(null,null,typeof error.code==='string'?error.code:'SPAWN_ERROR'));
     child.once('close',(code,signal)=>finish(code,signal));
     for(const name of ['stdout','stderr']){
      child[name].on('data',chunk=>{evidence(task.id+'-'+name,()=>appendFileSync(join(proofDir,task.id+'.'+name+'.log'),chunk));evidence(task.id+'-combined',()=>appendFileSync(join(proofDir,task.id+'.log'),chunk));});
      child[name].on('error',error=>errors.push({operation:task.id+'-'+name,code:typeof error.code==='string'?error.code:'STREAM_ERROR'}));
     }
    }catch(error){finish(null,null,typeof error.code==='string'?error.code:'SPAWN_ERROR');}
   }
   pump();
  });
  try{sourceAfter=snapshot();sourceUnchanged=JSON.stringify(sourceAfter)===JSON.stringify(sourceBefore);}catch(error){errors.push({operation:'final-source',code:typeof error.code==='string'?error.code:'SOURCE_DRIFT'});}
  for(const result of results){
   const value=evidence(result.id+'-output-read',()=>readFileSync(join(proofDir,result.id+'.outputs'),'utf8'));
   if(result.id!==scopeTask&&value)errors.push({operation:result.id+'-unexpected-output',code:'UNEXPECTED_OUTPUT'});
   for(const suffix of ['.stdout.log','.stderr.log','.log','.outputs'])result[suffix.slice(1)+'Sha256']=evidence(result.id+'-digest',()=>sha(readFileSync(join(proofDir,result.id+suffix))));
  }
  finishedAt=now();record('finished');
  return {...state(),passed:!cancelled&&sourceUnchanged&&errors.length===0&&results.every(r=>r.status==='passed')};
 }finally{clearInterval(heartbeat);process.removeListener('SIGTERM',onTerm);process.removeListener('SIGINT',onInt);}
}

export function productionUnitCommands(original){
 const commands=[...original.matchAll(/^\s*(?:run:\s*)?node --test (.+)$/gm)].map(m=>'node --test '+m[1]);
 assert.equal(commands.length,31,'All31 original production test commands required');
 for(const command of commands)assert(/^node --test [-a-zA-Z0-9_/*?. ]+$/.test(command),'Unexpected original test command');
 return commands;
}

export function validateScheduleDocument(bytes,original){
 assert.equal(gitBlob(original),'cd8c81a8d8c29def3c25b93112a4c56456b5cbfc','Original production workflow proof changed');
 assert.equal(gitBlob(bytes),'323a87b561a9b03d4cd4ce55ac5664983b36203f','Exact original source scheduling manifest required');
 const schedule=JSON.parse(bytes);
 assert.equal(schedule.kind,'ORIGINAL_PRODUCTION_SOURCE_COMMANDS_TWO_SLOTS_20261016');assert.equal(schedule.originalHead,'ce456749488bafcbc2a8e7e6a4eb726cb12f0fd8');
 assert.equal(schedule.originalWorkflowBlob,'cd8c81a8d8c29def3c25b93112a4c56456b5cbfc');
 assert.deepEqual(productionUnitCommands(original),schedule.originalProductionUnitCommands);
 return schedule;
}

async function main(mode){
 assert(['production','privacy'].includes(mode),'Only the two approved source proof modes exist');
 const original=git('show','ce456749488bafcbc2a8e7e6a4eb726cb12f0fd8:.github/workflows/cloudflare-production-promote.yml');
 const schedule=validateScheduleDocument(readFileSync(new URL('./production-source-schedule-20261016.json',import.meta.url),'utf8'),original),commands=productionUnitCommands(original);
 const initial=sourceSnapshot();await hydrateOriginalHistory();assert.deepEqual(sourceSnapshot(),initial,'Source changed during serial history hydration');
 const proofDir=mode==='production'?join(process.env.RUNNER_TEMP||process.cwd(),'ci-source-proof','production-bounded'):resolve('online-privacy-recovery-proof','bounded');
 const tasks=mode==='production'?schedule.tasks:[{id:'privacy-original',body:schedule.originalPrivacyCommand},...commands.map((body,i)=>({id:'production-unit-'+String(i+1).padStart(2,'0'),body}))];
 const result=await runBoundedChecks(tasks,{proofDir,poolId:mode+'-bounded',scopeTask:mode==='production'?'production-step-012':null});
 if(mode==='privacy'){
  const parent=resolve('online-privacy-recovery-proof');writeFileSync(join(parent,'tests.txt'),readFileSync(join(proofDir,'privacy-original.stdout.log')));
  writeFileSync(join(parent,'production-tests.txt'),tasks.slice(1).map(task=>'COMMAND: '+task.body+'\n'+readFileSync(join(proofDir,task.id+'.log'),'utf8')).join('\n'));
 }
 if(!result.passed)throw Error('An original source command, actual exit, evidence write or fresh source check failed');
 if(mode==='production'){
  const output=readFileSync(join(proofDir,'production-step-012.outputs'),'utf8');
  assert(/^(?:runtime_only=(?:true|false)\n|grub_publication=(?:true|false)\n)+$/.test(output),'Original B1 scope outputs required');
  const entries=output.trimEnd().split('\n');assert.equal(entries.length,2);assert.equal(new Set(entries.map(line=>line.split('=')[0])).size,2);
  assert(process.env.GITHUB_OUTPUT,'Existing workflow scope output destination required');appendFileSync(process.env.GITHUB_OUTPUT,output);
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main(process.argv[2]).catch(error=>{console.error(error);process.exitCode=1;});
