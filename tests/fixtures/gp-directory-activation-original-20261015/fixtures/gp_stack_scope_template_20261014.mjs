import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {execFileSync as isolatedExecFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {immutableHistoryExecFileSync as execFileSync,withImmutableHistoryVerification,assertGitTrackedSourceVisible} from './immutable-git-facts.mjs';
import {verifyGpMemberCodeFacts as verifyOriginalGpFacts,gpMemberCodeCleanSource,verifyGpMemberFrontendAdmission as originalFrontendAdmission} from './gp-member-code-admission-original-20261014.mjs';
import {originalGpHqSuccessorSource,originalGpHqCallerSource} from './gp-hq-preservation-source-20261015.mjs';
export * from './gp-member-code-admission-original-20261014.mjs';
const policy=__POLICY__;
const manifest='release/approved-runtime-composition.json',sidecar='release/gp-member-code-admission-20261014.json',key='gpMemberCode20261014',sorted=a=>[...a].sort();
export const GP_CODE_STACK_BASE=policy.record.base;
export const GP_CODE_STACK_PATHS=Object.freeze(policy.record.paths);
export const GP_CODE_STACK_MAINTENANCE=Object.freeze(policy.record.maintenancePaths);
export const GP_CODE_STACK_RECORD_PATHS=Object.freeze([manifest,sidecar]);
export const GP_CODE_STACK_EXPECTED_STATUSES=Object.freeze(policy.expectedStatuses);
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:64e6});
const currentHead=()=>git('rev-parse','HEAD').trim(),blob=(r,p)=>git('rev-parse',(r==='HEAD'?currentHead():r)+':'+p).trim(),content=(r,p)=>git('show',(r==='HEAD'?currentHead():r)+':'+p),diff=(a,b)=>git('diff','--no-renames','--name-only',a,b).trim().split('\n').filter(Boolean),ancestor=(a,b)=>git('merge-base','--is-ancestor',a,b),mode=(r,p)=>git('ls-tree',r,'--',p).trim().split(/\s+/)[0];
function clean(){try{assertGitTrackedSourceVisible('GP source');gpMemberCodeCleanSource(process.cwd());assert.equal(git('for-each-ref','--format=%(refname)',process.env.GIT_REPLACE_REF_BASE??'refs/replace').trim(),'','GP source drift: Replacement history forbidden');assert.equal(existsSync(resolve(git('rev-parse','--git-path','info/grafts').trim())),false,'GP source drift: Grafted history forbidden');assert(!process.env.GIT_GRAFT_FILE,'GP source drift: Graft override forbidden');}catch(error){if(!error.message.includes('source drift'))error.message='GP source drift: '+error.message;throw error;}}
function inverse(p,text,pairs){for(const[before,after,kind]of[...pairs].reverse()){assert(after&&text.split(after).length===2,'One exact GP maintenance inverse required: '+p);if(kind==='prefix')assert(text.startsWith(after),'Exact GP prefix required: '+p);if(kind==='suffix')assert(text.endsWith(after),'Exact GP suffix required: '+p);text=text.replace(after,before);}return text;}
function authenticContent(value,ref,p,head){const actual=content(head,p),prefix='tree '+head+':'+p+'\n';return value===actual||actual.startsWith(prefix)&&value===actual.replace(prefix,'tree '+ref+':'+p+'\n');}
function authentic(value,ref,p,head){return value===blob(head,p)||authenticContent(value,ref,p,head);}
function assertUnchangedRaw(head){clean();assert.equal(currentHead(),head,'GP source drift: Raw HEAD changed during proof');}
export function verifyGpCodeStack(c,{head=currentHead(),read=blob,readContent=content,readDiff=diff,isAncestor=ancestor}={}){
 clean();return withImmutableHistoryVerification(()=>{const actual=currentHead();try{
  clean();assert.equal(head,actual,'GP source drift: Actual raw GP HEAD required');
  const{maintenanceSource,...record}=c;assert.deepEqual(record,policy.record,'Only the literal bounded GP stack is authorised');assert.match(maintenanceSource,/^[a-f0-9]{40}$/);
  assert.equal(git('rev-parse',c.base+'^{tree}').trim(),c.baseTree,'Literal next week/CI source tree required');assert.equal(git('rev-parse',c.source+'^{tree}').trim(),c.sourceTree,'Literal GP payload tree required');
  assert.equal(git('rev-parse',policy.originalHead+'^{tree}').trim(),policy.originalTree,'Original prepared GP Git graph required');
  assert.equal(blob(head,policy.originalWitness),blob(policy.originalHead,'release/gp-member-code-admission-20261014.mjs'),'Every original GP source assertion must remain byte exact');
  const originalRecord=JSON.parse(content(policy.originalHead,sidecar));assert.deepEqual(originalRecord,policy.originalRecord,'Original GP registration changed');
  // The original assertions execute on their actual immutable original graph.
  // The current graph and every required hook are independently checked below.
  verifyOriginalGpFacts(originalRecord,{head:policy.originalHead,headNow:()=>{assertUnchangedRaw(actual);return policy.originalHead;},clean:()=>assertUnchangedRaw(actual),blob,mode,tree:r=>git('rev-parse',r+'^{tree}').trim(),content,diff,ancestor});
  for(const[a,b,paths]of[[c.base,c.source,c.paths],[c.source,c.maintenanceSource,c.maintenancePaths],[c.maintenanceSource,head,[manifest,sidecar]]]){
   ancestor(a,b);assert.notEqual(isAncestor(a,b),false,'GP source drift: Supplied ancestry changed');assert.deepEqual(sorted(diff(a,b)),sorted(paths),'GP source drift: Unapproved actual source boundary');assert.deepEqual(sorted(readDiff(a,b)),sorted(diff(a,b)),'GP source drift: Supplied diff changed');
  }
  const affected=[...new Set([...c.paths,...c.maintenancePaths,manifest,sidecar])];assert.deepEqual(sorted(diff(c.base,head)),sorted(affected),'GP source drift: Every unrelated source path must remain exact');
  for(const r of['HEAD',head]){assert.deepEqual(sorted(readDiff(c.base,r)),sorted(diff(c.base,head)),'GP source drift: Supplied current diff changed');ancestor(c.base,head);assert.notEqual(isAncestor(c.base,r),false,'GP source drift: Supplied current ancestry changed');}
  for(const p of[...c.paths,...c.maintenancePaths]){const ref=c.paths.includes(p)?c.source:c.maintenanceSource;assert.equal(blob(head,p),blob(ref,p),'GP source drift: Current frozen source changed: '+p);assert.equal(mode(head,p),'100644','GP source drift: File mode changed: '+p);for(const r of['HEAD',head]){assert.equal(read(r,p),blob(head,p),'GP source drift: Supplied current source changed: '+p);assert.equal(readContent(r,p),content(head,p),'GP source drift: Supplied current content changed: '+p);}}
  for(const[p,expected]of Object.entries(policy.payloadBlobs)){assert.equal(blob(c.source,p),expected,'Exact original GP payload required: '+p);assert.equal(blob(head,p),expected,'Current original GP payload changed: '+p);}
  for(const[p,expected]of Object.entries(policy.retainedMaintenanceBlobs))assert.equal(blob(head,p),expected,'Retained original GP maintenance changed: '+p);
  for(const[p,pairs]of Object.entries(policy.originalMaintenanceInverses))assert.equal(inverse(p,content(head,p),pairs),content(policy.originalHead,p),'Every original GP bootstrap assertion must remain: '+p);
  for(const[p,pairs]of Object.entries(policy.inverses))assert.equal(inverse(p,content(head,p),pairs),content(c.base,p),'Every original assertion/control byte outside exact GP hooks must remain: '+p);
  assert.equal(originalGpHqSuccessorSource(content(head,'release/gp-hq-preservation-successor-20261015.mjs')),content(c.base,'release/combined-hq-preservation-20261014.mjs'),'Every original HQ source assertion must remain');
  for(const p of ['hq-management-release-gate.mjs','hq-management-deploy.mjs','hq-management-public-preservation.mjs'])assert.equal(originalGpHqCallerSource(p,content(head,p)),content(c.base,p),'Every original HQ caller byte must remain: '+p);
  for(const[p,expected]of Object.entries(policy.workflowBaselineBlobs))assert.equal(blob(c.base,p),expected,'Exact actual next week/CI workflow baseline required: '+p);
  for(const p of['gp-directory','member-experience','release','tests','.github/workflows'])for(const r of['HEAD',head])assert.equal(read(r,p),blob(head,p),'GP source drift: Supplied directory changed: '+p);
  const before=JSON.parse(content(c.base,manifest)),after=JSON.parse(content(head,manifest));assert.deepEqual(after[key],c);delete after[key];assert.deepEqual(after,before,'GP source drift: Every prior ledger key, authority and receipt must remain');assert.deepEqual(JSON.parse(content(head,sidecar)),c,'Exact current GP sidecar required');
  for(const r of['HEAD',head])for(const p of[manifest,sidecar])assert.equal(readContent(r,p),content(head,p),'GP source drift: Supplied current ledger changed');assert.equal(readContent(c.base,manifest),content(c.base,manifest),'GP source drift: Supplied prior ledger changed');
  for(const p of policy.protectedPaths){assert.equal(blob(head,p),blob(c.base,p),'GP source drift: Protected source changed: '+p);for(const r of['HEAD',head])assert.equal(read(r,p),blob(head,p),'GP source drift: Supplied protected source changed: '+p);}
  for(const p of['wrangler.jsonc','wrangler.hq-management.jsonc'])assert(!/"MEMBER_GP_DIRECTORY_V2_ENABLED"\s*:\s*"true"/.test(content(head,p)),'GP lookup flags must remain OFF');
  return c;
 }finally{assertUnchangedRaw(actual);}});
}
const admittedViews=new WeakSet(),admittedReaders=new WeakMap();
export function gpMemberCodeHistoricalView(reader=null,{defaultReader=reader===null}={}){
 const rawHead=currentHead(),record=JSON.parse(content(rawHead,manifest)),c=record[key],sourceReader=reader===null?blob:reader;assert.equal(typeof sourceReader,'function');const assertCurrent=()=>assertUnchangedRaw(rawHead);
 if(c)verifyGpCodeStack(c,{head:rawHead});const paths=new Set(c?[...c.paths,...c.maintenancePaths,manifest,sidecar]:[]),affected=p=>paths.has(p)||[...paths].some(q=>q.startsWith(p+'/'));const prior=structuredClone(record);if(c)delete prior[key];const projected=c?c.base:rawHead;
 const view={rawHead,head:projected,record:prior,affected,assertCurrent,authentic:(v,r,p)=>authentic(v,r,p,rawHead),nativeAuthentic:(v,r,p)=>authentic(v,r,p,r==='HEAD'?rawHead:r),nativeContentAuthentic:(v,r,p)=>authenticContent(v,r,p,r==='HEAD'?rawHead:r),currentContent:content,
  blob:(r,p)=>{assertCurrent();return blob(r==='HEAD'||r===rawHead?projected:r,p);},content:(r,p)=>{assertCurrent();return content(r==='HEAD'||r===rawHead?projected:r,p);},diff:(a,b)=>{assertCurrent();return diff(a==='HEAD'||a===rawHead?projected:a,b==='HEAD'||b===rawHead?projected:b);},ancestor:(a,b)=>{assertCurrent();return ancestor(a==='HEAD'||a===rawHead?projected:a,b==='HEAD'||b===rawHead?projected:b);}};
 admittedViews.add(view);view.read=gpCodeAuthenticatedRead(sourceReader,view);Object.freeze(view);for(const kind of['read','blob','content','diff','ancestor'])admittedReaders.set(view[kind],Object.freeze({kind,view}));assertCurrent();return view;
}
export const gpCodeHistoricalView=gpMemberCodeHistoricalView;
export function gpCodeReaderProvenance(reader){const proof=admittedReaders.get(reader);if(!proof)return null;proof.view.assertCurrent();return proof;}
function use(view,fn){assert(admittedViews.has(view),'GP source drift: Independently admitted private view required');view.assertCurrent();try{return fn();}finally{view.assertCurrent();}}
const current=(r,v)=>r==='HEAD'||r===v.rawHead||r===v.head;
function suppliedSource(reader,r,p,v){const value=reader(r,p);assert(v.nativeAuthentic(value,r,p),'GP source drift: Unauthentic supplied source at '+r+':'+p);return value;}
function suppliedContent(reader,r,p,v){const value=reader(r,p);assert(v.nativeContentAuthentic(value,r,p),'GP source drift: Unauthentic supplied content at '+r+':'+p);return value;}
function suppliedDiff(reader,a,b,v){const value=reader(a,b);assert.deepEqual(sorted(value),sorted(diff(a==='HEAD'?v.rawHead:a,b==='HEAD'?v.rawHead:b)),'GP source drift: Supplied diff changed');return value;}
function suppliedAncestor(reader,a,b,v){const value=reader(a,b);ancestor(a==='HEAD'?v.rawHead:a,b==='HEAD'?v.rawHead:b);assert.notEqual(value,false,'GP source drift: Supplied ancestry changed');return value;}
export function gpCodeAuthenticatedRead(reader,view){return(r,p)=>use(view,()=>{if(current(r,view)&&view.head!==view.rawHead){suppliedSource(reader,'HEAD',p,view);suppliedSource(reader,view.rawHead,p,view);return suppliedSource(reader,view.head,p,view);}return suppliedSource(reader,r,p,view);});}
export function gpCodeAuthenticatedContent(reader,view){return(r,p)=>use(view,()=>{if(current(r,view)&&view.head!==view.rawHead){suppliedContent(reader,'HEAD',p,view);suppliedContent(reader,view.rawHead,p,view);return suppliedContent(reader,view.head,p,view);}return suppliedContent(reader,r,p,view);});}
export function gpCodeAuthenticatedDiff(reader,view){return(a,b)=>use(view,()=>{if(current(b,view)&&view.head!==view.rawHead){for(const r of['HEAD',view.rawHead])suppliedDiff(reader,a,r,view);return suppliedDiff(reader,a,view.head,view);}return suppliedDiff(reader,a,b,view);});}
export function gpCodeAuthenticatedAncestor(reader,view){return(a,b)=>use(view,()=>{if(current(b,view)&&view.head!==view.rawHead){for(const r of['HEAD',view.rawHead])suppliedAncestor(reader,a,r,view);return suppliedAncestor(reader,a,view.head,view);}return suppliedAncestor(reader,a,b,view);});}
export function verifyGpMemberCodeAdmission(repositoryPath=process.cwd()){
 // Preserve the original standalone API's independent repository and poisoned
 // Git-environment handling without changing the caller's cwd or environment.
 const env={...process.env};for(const k of Object.keys(env))if(k.startsWith('GIT_'))delete env[k];env.PATH='/usr/bin:/bin:/usr/local/bin';
 assert(!process.env.GIT_GRAFT_FILE,'GP source drift: Graft override forbidden');
 const namespace=process.env.GIT_REPLACE_REF_BASE??'refs/replace';
 const source=pathToFileURL(resolve(repositoryPath,'release/gp-member-code-admission-20261014.mjs')).href;
 const script="import assert from 'node:assert/strict';import{execFileSync}from'node:child_process';import{verifyGpCodeStack}from "+JSON.stringify(source)+";const g=(...a)=>execFileSync('/usr/bin/git',['--no-replace-objects',...a],{encoding:'utf8',maxBuffer:64e6});assert.equal(g('for-each-ref','--format=%(refname)',"+JSON.stringify(namespace)+").trim(),'','GP source drift: Replacement history forbidden');const h=g('rev-parse','HEAD').trim(),c=JSON.parse(g('show',h+':release/approved-runtime-composition.json')).gpMemberCode20261014;assert(c,'Literal GP stack registration required');process.stdout.write(JSON.stringify(verifyGpCodeStack(c)));";
 return JSON.parse(isolatedExecFileSync(process.execPath,['--input-type=module','-e',script],{cwd:repositoryPath,env,encoding:'utf8',maxBuffer:64e6}));
}
export const verifyGpMemberFrontendAdmission=originalFrontendAdmission;
