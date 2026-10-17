import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {lstatSync,readFileSync,writeFileSync} from 'node:fs';
import {assertOwned,assertProvider} from './questionnaire-handover-owned-release-20261016.mjs';
import {currentReleaseContext} from './owned-rollback-release-window-20261016.mjs';

export const ACCEPTED_CURRENT_RUNTIME_KIND='exact_accepted_current_questionnaire_gp_runtime';
export const ACCEPTED_CURRENT_RUNTIME=Object.freeze({
 source:'e9491c2686105afc465d1c94e37e5cef63240e11',tree:'c3db6341f2b6c20dcda0eede3eb5fa3dc91a8611',
 run:38980756381,attempt:1,job:117240817743,branch:'fix/questionnaire-handover-20261016',workflow:'.github/workflows/questionnaire-handover-release-20261016.yml',
 deployment:'9eaeeda9-59c1-419c-b58d-2aea1493e95f',version:'0b9a4674-de58-49db-aefa-57ede95178a4',
 receiptSHA256:'1d6709af36c73abe86d800cd392c5ae38538a533d9a54256027a0ffb7303744e',
 artifact:Object.freeze({id:12080573216,run:38980756381,source:'e9491c2686105afc465d1c94e37e5cef63240e11',bytes:9770924,sha256:'55d230a531bb7b73d0b1f46957ddfe3a31ee828249123fe35cbec798d606062e'})
});
const pin=ACCEPTED_CURRENT_RUNTIME,sha=v=>createHash('sha256').update(v).digest('hex');
const tables=['medicine_products','medicine_variants','medicine_inventory'];
const time=value=>{assert.equal(typeof value,'string');const n=Date.parse(value);assert(Number.isFinite(n),'Valid original time required');return n;};
const latest=values=>{assert(Array.isArray(values)&&values.length);const sorted=[...values].sort((a,b)=>time(b.created_on)-time(a.created_on));assert(sorted[0]);return sorted[0];};
const identity=value=>({id:value.id,versions:value.versions,created_on:value.created_on,annotations:value.annotations});
const bindingsHash=value=>sha(JSON.stringify(value.resources.bindings.slice().sort((a,b)=>a.name.localeCompare(b.name))));
const regular=(path,max)=>{const s=lstatSync(path);assert(s.isFile()&&!s.isSymbolicLink()&&s.size>0&&s.size<=max);return readFileSync(path);};

export function assertAcceptedCurrentReceipt(bytes){
 assert(Buffer.isBuffer(bytes));assert.equal(sha(bytes),pin.receiptSHA256,'Original accepted receipt bytes changed');const value=JSON.parse(bytes);
 assert.equal(value.schema,'shift-questionnaire-runtime-receipt/v1');assert.equal(value.source,pin.source);assert.equal(value.tree,pin.tree);assert.equal(value.run,String(pin.run));assert.equal(value.attempt,String(pin.attempt));assert.equal(value.status,'code_only_verified');assert.equal(value.gpEnabled,true);assert.equal(value.partnerContractActivated,false);assert.equal(value.partnerTestPassed,false);assert.equal(value.featureAcceptance,false);assert.equal(value.dataWrites,0);assert.equal(value.externalMessages,0);
 assert.deepEqual(Object.keys(value.workers),['core']);assert.equal(value.workers.core.deploymentId,pin.deployment);assert.equal(value.workers.core.versionId,pin.version);assert.equal(value.workers.core.percentage,100);assert.equal(value.workers.core.gpEnabled,true);return value;
}
export function assertAcceptedCurrentRun(run,job){
 assert.equal(run.id,pin.run);assert.equal(run.run_attempt,pin.attempt);assert.equal(run.head_sha,pin.source);assert.equal(run.head_branch,pin.branch);assert.equal(run.path,pin.workflow);assert.equal(run.event,'push');assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');assert.equal(run.repository.id,1328867509);assert.equal(run.repository.full_name,'shiftsometimber/shift-core');assert.equal(run.head_repository.id,1328867509);assert.equal(run.head_repository.full_name,'shiftsometimber/shift-core');
 assert.equal(job.id,pin.job);assert.equal(job.run_id,pin.run);assert.equal(job.run_attempt,pin.attempt);assert.equal(job.head_sha,pin.source);assert.equal(job.head_branch,pin.branch);assert.equal(job.name,'release');assert.equal(job.status,'completed');assert.equal(job.conclusion,'success');assert(time(job.started_at)>=time(run.run_started_at));assert(time(job.completed_at)>=time(job.started_at));
 for(const name of ['Verify exact accepted baseline, preserved questionnaire and bounded source','Preserve GP, account isolation and original anonymous denial assertions','Deploy only the verified exact source and unchanged provider configuration','Verify actual serving bundle, public assessment assets, authentication, stock and bindings']){const matches=job.steps.filter(s=>s.name===name);assert.equal(matches.length,1);assert.equal(matches[0].status,'completed');assert.equal(matches[0].conclusion,'success');}
 return {run:pin.run,attempt:pin.attempt,job:pin.job,source:pin.source};
}
export function assertAcceptedCurrentProvider({deployment,version},receipt){
 assertAcceptedCurrentReceipt(Buffer.from(JSON.stringify(receipt,null,2)+'\n'));
 assertProvider({deployment,version},{deployment:pin.deployment,version:pin.version,gpEnabled:true});assertOwned(deployment,receipt.workers.core,pin.source,pin.run,pin.attempt);
 assert.equal(version.id,pin.version);assert.equal(bindingsHash(version),receipt.workers.core.allBindingsSha256,'Actual accepted binding metadata changed');return {deploymentId:pin.deployment,versionId:pin.version,source:pin.source,run:pin.run,attempt:pin.attempt,percentage:100,allBindingsSha256:bindingsHash(version)};
}
export function captureAcceptedCurrentStock(wrangler,before,configuration,receipt,now=Date.now){
 const first=latest(JSON.parse(wrangler('deployments','list','--json')));assert.equal(first.id,pin.deployment,'Unknown current deployment must reject before stock reads');
 const version=JSON.parse(wrangler('versions','view',pin.version,'--json'));assertAcceptedCurrentProvider({deployment:first,version},receipt);
 const captured={};for(const table of tables){
  const sql='SELECT * FROM '+table+' ORDER BY '+(table==='medicine_inventory'?'variant_id':'id');const raw=JSON.parse(wrangler('d1','execute','DB','--remote','--json','--command',sql));assert(raw.length&&raw.every(row=>row.success),'Original protected public stock SELECT required');const rows=raw.flatMap(row=>row.results||[]);captured[table]={rows:rows.length,sha256:sha(JSON.stringify(rows))};
 }
 assert.deepEqual(captured,before.tables,'Protected stock changed during this release');assert.equal(sha(configuration),before.configurationSha256,'Actual source configuration changed');
 const after=latest(JSON.parse(wrangler('deployments','list','--json')));assert.deepEqual(identity(after),identity(first),'Actual serving runtime moved during stock comparison');const at=new Date(typeof now==='function'?now():now).toISOString();
 return {observedAt:at,deployment:first,version,stock:{checkedAt:at,beforeAt:before.checkedAt,tables:captured,configurationSha256:sha(configuration),customerRecordsRead:false,productionWrites:0}};
}
export function verifyAcceptedCurrentReleaseWindow({receiptBytes,run,job,beforeBytes,context,current,now}){
 const receipt=assertAcceptedCurrentReceipt(receiptBytes);assertAcceptedCurrentRun(run,job);assert(Buffer.isBuffer(beforeBytes)&&beforeBytes.length>0&&beforeBytes.length<=16384);const before=JSON.parse(beforeBytes);
 currentReleaseContext(context,before,now);assert(time(job.completed_at)<=time(before.checkedAt),'Original accepted release must precede the current stock window');const provider=assertAcceptedCurrentProvider(current,receipt);for(const at of [current.observedAt,current.stock.checkedAt]){const age=time(now)-time(at);assert(age>=0&&age<=300000,'Fresh current provider and stock evidence required');}
 assert(time(current.stock.checkedAt)>=time(before.checkedAt));assert(time(receipt.at)<=time(before.checkedAt),'Original receipt remains historical; never rewrite its timestamp');assert.deepEqual(current.stock.tables,before.tables);assert.equal(current.stock.configurationSha256,before.configurationSha256);assert.equal(current.stock.beforeAt,before.checkedAt);assert.equal(current.stock.customerRecordsRead,false);assert.equal(current.stock.productionWrites,0);
 return {kind:ACCEPTED_CURRENT_RUNTIME_KIND,checkedAt:now,provider,source:pin.source,version:pin.version,run:pin.run,originalRuntimeReceiptSHA256:pin.receiptSHA256,originalArtifact:pin.artifact.id,originalArtifactSHA256:pin.artifact.sha256,originalReceiptAt:receipt.at,originalReleaseStatus:'code_only_verified',memberDirectoryAcceptanceRun:38983155486,genuineHqHolderAcceptance:false,clinicalContractActivated:false,featureAcceptance:false,dataRestored:false,productionWrites:0,releaseStockWindow:{source:context.head,run:context.runId,attempt:context.attempt,job:context.job.id,beforeAt:before.checkedAt,beforeSHA256:sha(beforeBytes),tables:before.tables,configurationSha256:before.configurationSha256,originalFinalAfterComparisonRequired:true}};
}
export function assertSameAcceptedCurrentWindow(previous,current){
 assert(time(previous.checkedAt)<=time(current.checkedAt));const {checkedAt:a,...old}=previous,{checkedAt:b,...next}=current;assert.deepEqual(old,next,'Actual accepted baseline or release stock window changed');
}
export function acceptedCurrentStartingPoint(receipt,current){
 assert.equal(receipt.kind,ACCEPTED_CURRENT_RUNTIME_KIND);assert.equal(receipt.provider.deploymentId,current.id);assert.equal(receipt.provider.versionId,pin.version);assert.equal(receipt.provider.source,pin.source);assert.equal(receipt.provider.run,pin.run);assert.equal(receipt.provider.attempt,pin.attempt);assert.equal(receipt.provider.percentage,100);assert.equal(receipt.originalRuntimeReceiptSHA256,pin.receiptSHA256);assert.equal(receipt.originalArtifact,pin.artifact.id);assert.equal(receipt.originalArtifactSHA256,pin.artifact.sha256);assert.equal(receipt.clinicalContractActivated,false);assert.equal(receipt.dataRestored,false);assert.equal(receipt.productionWrites,0);assert.deepEqual(current.versions,[{version_id:pin.version,percentage:100}]);assert.equal(receipt.source,pin.source);assert.equal(receipt.version,pin.version);assert.equal(receipt.run,pin.run);return {kind:ACCEPTED_CURRENT_RUNTIME_KIND,source:pin.source,version:pin.version,run:pin.run,deploymentId:pin.deployment};
}
// Apply only after the original owned-main promotion proof has succeeded.
export function assertPreservedRuntimeLineage(point){
 assert.match(point?.source||'',/^[a-f0-9]{40}$/);execFileSync('/usr/bin/git',['--no-replace-objects','merge-base','--is-ancestor',pin.source,point.source],{stdio:'pipe'});return point;
}
export function readAcceptedCurrentWitness(bytes=regular(new URL('./receipts/accepted-questionnaire-38980756381.json',import.meta.url),16384)){
 // Captured from original artifact12080573216 after its complete ZIP SHA/CRC
 // verification. Its original bytes and timestamp remain unchanged in Git.
 assertAcceptedCurrentReceipt(bytes);return bytes;
}
export async function verifyCurrentAcceptedRuntimeWindow({proof,wrangler,stage}){
 assert(['recovery','adoption'].includes(stage));const env=process.env;assert.equal(env.GITHUB_ACTIONS,'true');assert.equal(env.GITHUB_REF,'refs/heads/main');assert.equal(env.GITHUB_JOB,'promote');assert.equal(env.GITHUB_REPOSITORY,'shiftsometimber/shift-core');
 const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:4194304});const head=git('rev-parse','HEAD').trim();assert.equal(head,env.GITHUB_SHA);assert.equal(git('status','--porcelain=v1','--untracked-files=no').trim(),'');const configuration=regular('wrangler.jsonc',1048576);assert(configuration.equals(Buffer.from(git('show','HEAD:wrangler.jsonc'))));const beforeBytes=regular('b1-runtime-release/before.json',16384),before=JSON.parse(beforeBytes),runId=Number(env.GITHUB_RUN_ID),attempt=Number(env.GITHUB_RUN_ATTEMPT);
 const receiptBytes=readAcceptedCurrentWitness();const [run,job,currentRun,jobs,main]=await Promise.all([proof.get('/actions/runs/'+pin.run+'/attempts/'+pin.attempt),proof.get('/actions/jobs/'+pin.job),proof.get('/actions/runs/'+runId+'/attempts/'+attempt),proof.get('/actions/runs/'+runId+'/attempts/'+attempt+'/jobs?per_page=100'),proof.get('/git/refs/heads/main')]);
 const receipt=assertAcceptedCurrentReceipt(receiptBytes);assertAcceptedCurrentRun(run,job);assert.equal(jobs.total_count,jobs.jobs.length);const found=jobs.jobs.filter(j=>j.name==='promote');assert.equal(found.length,1);const currentJob=await proof.get('/actions/jobs/'+found[0].id),event=env.GITHUB_EVENT_NAME,manualConfirm=event==='workflow_dispatch'?JSON.parse(regular(env.GITHUB_EVENT_PATH,4194304)).inputs?.confirm:undefined;
 const context={head,main:main.object?.sha,run:currentRun,job:currentJob,runId,attempt,event,manualConfirm,repositoryId:1328867509,configurationSha256:sha(configuration)};currentReleaseContext(context,before,new Date().toISOString());
 const current=captureAcceptedCurrentStock(wrangler,before,configuration,receipt),now=new Date().toISOString(),accepted=verifyAcceptedCurrentReleaseWindow({receiptBytes,run,job,beforeBytes,context,current,now});
 assert.equal((await proof.get('/git/refs/heads/main')).object?.sha,head);assert.equal(git('rev-parse','HEAD').trim(),head);assert.equal(git('status','--porcelain=v1','--untracked-files=no').trim(),'');assert(regular('wrangler.jsonc',1048576).equals(configuration));assert(regular('b1-runtime-release/before.json',16384).equals(beforeBytes));assert.deepEqual(identity(latest(JSON.parse(wrangler('deployments','list','--json')))),identity(current.deployment));writeFileSync('b1-runtime-release/accepted-current-window-'+stage+'.json',JSON.stringify(accepted,null,2)+'\n',{mode:0o600,flag:'wx'});return accepted;
}

