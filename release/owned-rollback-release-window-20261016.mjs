import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstatSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {verifyOwnedTimeoutRecovery,assertOwnedRollbackStartingPoint} from './verified-owned-rollback.mjs';
import {OWNED_ROLLBACK_POLICY,OWNED_TIMEOUT_POLICY,captureOwnedRollbackCurrent} from './verified-owned-rollback-current.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const workflow='.github/workflows/cloudflare-production-promote.yml';
const sourceStep='Verify every original production source command with two execution slots';
const stockStep='Capture protected catalogue and stock without customer records';
const tables=['medicine_products','medicine_variants','medicine_inventory'];
const closurePin=Object.freeze({bytes:920,sha256:'06c66303e28f4f215db502e61a82578be37fd195d7a5d2e29d6d8c3ab6afdd4a'});
const time=value=>{assert.equal(typeof value,'string');const n=Date.parse(value);assert(Number.isFinite(n),'Valid evidence time required');return n;};
const identity=d=>({id:d?.id,versions:d?.versions});
const fresh=(at,now)=>{const age=time(now)-time(at);assert(age>=0&&age<=300000,'Fresh current provider evidence required');};
function protectedTables(value){
 assert.deepEqual(Object.keys(value??{}).sort(),[...tables].sort(),'Exactly the three protected public tables required');
 for(const table of tables){const row=value[table];assert.deepEqual(Object.keys(row??{}).sort(),['rows','sha256']);assert(Number.isSafeInteger(row.rows)&&row.rows>=0);assert.match(row.sha256,/^[a-f0-9]{64}$/);}
}
function pinnedJson(bytes,pin){assert(Buffer.isBuffer(bytes));assert.equal(bytes.length,pin?.bytes,'Original historical closure byte length changed');assert.equal(sha(bytes),pin.sha256,'Original historical closure bytes changed');return JSON.parse(bytes);}

// This adapter describes the observations at their original times. It does not
// rewrite, refresh or reclassify any original receipt, workflow or timestamp.
export function verifyOwnedTimeoutHistoricalClosure({policy,timeoutPolicy,previousFailed,prior,failed,cancelled,historicalStockBytes,historicalStockPin}){
 const stock=pinnedJson(historicalStockBytes,historicalStockPin),checks=JSON.parse(cancelled.manualChecks),recovery=JSON.parse(cancelled.manualRecovery);
 assert.deepEqual(Object.keys(stock).sort(),['at','kind','run','source','beforeAt','tables','configurationSha256','identical','customerRecordsRead','productionWrites','originalWorkflowStockStep90','notFullRuntimeAcceptance'].sort());
 assert.equal(stock.kind,'INDEPENDENT_PUBLIC_STOCK_AND_CONFIG_AFTER_CANCELLED_CORE_READ_ONLY');
 assert.equal(stock.run,timeoutPolicy.cancelled.run);assert.equal(stock.source,timeoutPolicy.cancelled.source);
 assert.equal(stock.originalWorkflowStockStep90,'skipped');assert.equal(stock.notFullRuntimeAcceptance,true);
 assert.equal(stock.identical,true);assert.equal(stock.customerRecordsRead,false);assert.equal(stock.productionWrites,0);protectedTables(stock.tables);
 assert(time(stock.at)>=time(checks.finishedAt),'Historical stock closure must follow the actual public rollback checks');
 const observed=checks.afterChecks;
 assert.equal(observed?.deploymentId,recovery.after?.id);assert.deepEqual(recovery.after.versions,[{version_id:observed.versionId,percentage:observed.percentage}]);
 const historicalView={observedAt:checks.finishedAt,deployment:recovery.after,stock:{
  checkedAt:stock.at,kind:'independent-original-protected-stock-comparison-after-owned-rollback',beforeAt:stock.beforeAt,
  run:stock.run,attempt:timeoutPolicy.cancelled.attempt,failedCandidate:stock.source,servingSource:policy.prior.source,
  servingDeployment:observed.deploymentId,servingVersions:recovery.after.versions,tables:stock.tables,configurationSha256:stock.configurationSha256,
  identical:stock.identical,customerRecordsRead:stock.customerRecordsRead,productionWrites:stock.productionWrites,originalFailedReleaseRemainsFailed:stock.notFullRuntimeAcceptance
 }};
 // Every original history, source, archive, log, public-check, stock/config,
 // no-restore and freshness assertion is executed at that historical window.
 const receipt=verifyOwnedTimeoutRecovery({policy,timeoutPolicy,previousFailed,prior,failed,cancelled,current:historicalView,now:stock.at});
 return{receipt,historicalStock:stock,provider:recovery.after,stockBytesSha256:sha(historicalStockBytes)};
}

export function currentReleaseContext(context,before,now){
 const {head,main,run,job,runId,attempt,event,manualConfirm,configurationSha256}=context;
 assert(Number.isSafeInteger(context.repositoryId)&&context.repositoryId>0);
 assert.match(head,/^[a-f0-9]{40}$/);assert.equal(main,head,'Current main must own the release window');
 assert(Number.isSafeInteger(runId)&&runId>0&&Number.isSafeInteger(attempt)&&attempt>0);
 assert.equal(run.id,runId);assert.equal(run.run_attempt,attempt);assert.equal(run.head_sha,head);assert.equal(run.head_branch,'main');assert.equal(run.path,workflow);
 assert.equal(run.event,event);assert(['push','workflow_dispatch'].includes(event));if(event==='workflow_dispatch')assert.equal(manualConfirm,'PROMOTE_CURRENT_MAIN');
 assert.equal(run.status,'in_progress');assert.equal(run.conclusion,null);
 assert.equal(run.repository?.id,context.repositoryId);assert.equal(run.head_repository?.id,context.repositoryId);
 assert.equal(job.run_id,runId);assert.equal(job.run_attempt,attempt);assert.equal(job.head_sha,head);assert.equal(job.head_branch,'main');assert.equal(job.name,'promote');assert(Number.isSafeInteger(job.id)&&job.id>0);
 assert.equal(job.status,'in_progress');assert.equal(job.conclusion,null);assert.equal(job.completed_at,null);
 for(const name of [sourceStep,stockStep]){const found=job.steps?.filter(s=>s.name===name);assert.equal(found?.length,1,'Unique original source/stock barrier required');assert.equal(found[0].status,'completed');assert.equal(found[0].conclusion,'success');assert(time(found[0].completed_at)<=time(now));}
 assert(time(job.steps.find(s=>s.name===sourceStep).completed_at)<=time(job.steps.find(s=>s.name===stockStep).started_at),'Stock capture must follow the complete original source barrier');
 assert.deepEqual(Object.keys(before).sort(),['phase','checkedAt','release','tables','configurationSha256','customerRecordsRead','productionWrites'].sort());
 assert.equal(before.phase,'before');assert.equal(before.release,head);assert.equal(before.customerRecordsRead,false);assert.equal(before.productionWrites,0);protectedTables(before.tables);
 assert.match(configurationSha256,/^[a-f0-9]{64}$/);assert.equal(before.configurationSha256,configurationSha256,'Protected configuration must match the exact current source');
 // GitHub's step timestamps have whole-second precision; the snapshot retains
 // milliseconds. Use the end of that reported second, never a later second.
 const stockCompleted=job.steps.find(s=>s.name===stockStep).completed_at;
 const completedSecondEnd=time(stockCompleted)+(/:\d{2}Z$/.test(stockCompleted)?999:0);
 assert(time(job.started_at)>=time(run.run_started_at));assert(time(before.checkedAt)>=time(job.started_at));assert(time(before.checkedAt)>=time(job.steps.find(s=>s.name===stockStep).started_at));assert(time(before.checkedAt)<=completedSecondEnd);
 assert(time(before.checkedAt)<=time(now));const approved=approvedCurrentProductionWindows.get(context);if(approved)assert.deepEqual(currentProductionWindowIdentity(context),approved,'The native approved current release identity changed');const minutes=approved?90:60;assert(time(now)-time(job.started_at)<=minutes*60000,approved?'Approved 90 minute production window exceeded':'Original 60 minute production window exceeded');
}
function freeze(value){if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;}

// Separate immutable proof of the completed rollback from the new run's
// mutable protected data. Changes inside either controlled window still reject.
export function verifyOwnedTimeoutReleaseWindow(args){
 const {beforeBytes,context,current,now}=args;assert(Buffer.isBuffer(beforeBytes));assert(beforeBytes.length>0&&beforeBytes.length<=16384);
 const before=JSON.parse(beforeBytes);currentReleaseContext(context,before,now);
 const historic=verifyOwnedTimeoutHistoricalClosure(args);assert(time(historic.historicalStock.at)<=time(before.checkedAt));
 fresh(current?.observedAt,now);fresh(current?.stock?.checkedAt,now);
 assert.deepEqual(identity(current.deployment),identity(historic.provider),'Unknown current deployment/version/traffic');
 assert.equal(current.deployment.created_on,historic.provider.created_on);assert.deepEqual(current.deployment.annotations,historic.provider.annotations,'Current owned deployment annotations changed');
 assertOwnedRollbackStartingPoint(historic.receipt,current.deployment);
 const stock=current.stock,pin=args.timeoutPolicy.cancelled;
 assert.equal(stock.kind,'independent-original-protected-stock-comparison-after-owned-rollback');assert.equal(stock.beforeAt,before.checkedAt);
 assert.equal(stock.run,pin.run);assert.equal(stock.attempt,pin.attempt);assert.equal(stock.failedCandidate,pin.source);assert.equal(stock.servingSource,args.policy.prior.source);
 assert.equal(stock.servingDeployment,historic.provider.id);assert.deepEqual(stock.servingVersions,historic.provider.versions);
 protectedTables(stock.tables);assert.deepEqual(stock.tables,before.tables,'Protected stock changed during this release');assert.equal(stock.configurationSha256,before.configurationSha256,'Protected configuration changed during this release');
 assert.equal(stock.identical,true);assert.equal(stock.customerRecordsRead,false);assert.equal(stock.productionWrites,0);assert.equal(stock.originalFailedReleaseRemainsFailed,true);assert(time(stock.checkedAt)>=time(before.checkedAt));
 const result={...historic.receipt,checkedAt:now,evidence:{...historic.receipt.evidence,
  historicalStockClosure:{checkedAt:historic.historicalStock.at,sha256:historic.stockBytesSha256,originalWorkflowAccepted:false,derivedViewUsesOriginalTimes:true},
  releaseStockWindow:{source:context.head,run:context.runId,attempt:context.attempt,job:context.job.id,beforeAt:before.checkedAt,beforeSha256:sha(beforeBytes),tables:before.tables,configurationSha256:before.configurationSha256,originalFinalAfterComparisonRequired:true}
 }};
 return freeze(structuredClone(result));
}

function regularBytes(path,max){const stat=lstatSync(path);assert(stat.isFile()&&!stat.isSymbolicLink(),'Regular source/evidence file required');assert(stat.size>0&&stat.size<=max);return readFileSync(path);}
function extracted(archive,names){const dir=mkdtempSync(join(tmpdir(),'shift-owned-window-'));try{const file=join(dir,'original.zip');writeFileSync(file,archive,{mode:0o600,flag:'wx'});return Object.fromEntries(names.map(name=>[name,execFileSync('unzip',['-p',file,name],{maxBuffer:8*1024*1024})]));}finally{rmSync(dir,{recursive:true,force:true});}}
export async function loadOwnedTimeoutWindowHistory(proof){
 const load=async pin=>{const[run,job,artifact,archive,logs]=await Promise.all([proof.get('/actions/runs/'+pin.run+'/attempts/'+pin.attempt),proof.get('/actions/jobs/'+pin.job),proof.get('/actions/artifacts/'+pin.artifact.id),proof.artifact(pin.artifact),proof.logBytes(pin.job)]);return{run,job,artifact,archive,logs:Buffer.from(logs)};};
 const[previousFailed,prior,failed,cancelled]=await Promise.all([load(OWNED_ROLLBACK_POLICY.failed),load(OWNED_ROLLBACK_POLICY.prior),load(OWNED_ROLLBACK_POLICY.followingFailed),load(OWNED_TIMEOUT_POLICY.cancelled)]);
 for(const evidence of [previousFailed,failed]){const entries=extracted(evidence.archive,['rollback.json','before.json']);Object.assign(evidence,{rollback:entries['rollback.json'],stockBefore:entries['before.json']});}
 const pin=OWNED_TIMEOUT_POLICY.cancelled,[captureArtifact,captureArchive]=await Promise.all([proof.get('/actions/artifacts/'+pin.captureArtifact.id),proof.artifact(pin.captureArtifact)]),entries=extracted(cancelled.archive,['before.json','owned-runtime-deployment.json']);
 Object.assign(cancelled,{stockBefore:entries['before.json'],ownedReceipt:entries['owned-runtime-deployment.json'],captureArtifact,captureArchive,captureBefore:extracted(captureArchive,['deployment-before.json'])['deployment-before.json'],manualRecovery:Buffer.from(OWNED_TIMEOUT_POLICY.manual.recoveryBytes,'base64'),manualChecks:Buffer.from(OWNED_TIMEOUT_POLICY.manual.checksBytes,'base64')});
 return{policy:OWNED_ROLLBACK_POLICY,timeoutPolicy:OWNED_TIMEOUT_POLICY,previousFailed,prior,failed,cancelled,historicalStockBytes:regularBytes(new URL('./owned-timeout-stock-closure-20261016.json',import.meta.url),16384),historicalStockPin:closurePin};
}
export async function verifyCurrentOwnedRollbackReleaseWindow({proof,wrangler,stage}){
 assert(['recovery','adoption'].includes(stage));const env=process.env;assert.equal(env.GITHUB_REF,'refs/heads/main');assert.equal(env.GITHUB_JOB,'promote');assert.equal(env.GITHUB_ACTIONS,'true');
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:4*1024*1024});
 const head=git('rev-parse','HEAD').trim();assert.equal(head,env.GITHUB_SHA);assert.equal(git('status','--porcelain=v1','--untracked-files=no').trim(),'');
 const configuration=regularBytes('wrangler.jsonc',1024*1024);assert(configuration.equals(Buffer.from(git('show','HEAD:wrangler.jsonc'))),'Exact current configuration bytes required');
 const beforeBytes=regularBytes('b1-runtime-release/before.json',16384),before=JSON.parse(beforeBytes),runId=Number(env.GITHUB_RUN_ID),attempt=Number(env.GITHUB_RUN_ATTEMPT);
 assert(Number.isSafeInteger(runId)&&runId>0&&Number.isSafeInteger(attempt)&&attempt>0);
 const[history,run,jobs,main]=await Promise.all([loadOwnedTimeoutWindowHistory(proof),proof.get('/actions/runs/'+runId+'/attempts/'+attempt),proof.get('/actions/runs/'+runId+'/attempts/'+attempt+'/jobs?per_page=100'),proof.get('/git/refs/heads/main')]);
 assert.equal(jobs.total_count,jobs.jobs?.length,'Complete current job inventory required');const matching=jobs.jobs.filter(job=>job.name==='promote');assert.equal(matching.length,1);const job=await proof.get('/actions/jobs/'+matching[0].id);
 const event=env.GITHUB_EVENT_NAME,manualConfirm=event==='workflow_dispatch'?JSON.parse(regularBytes(env.GITHUB_EVENT_PATH,4*1024*1024)).inputs?.confirm:undefined;
 const context={head,main:main.object?.sha,run,job,runId,attempt,event,manualConfirm,repositoryId:OWNED_ROLLBACK_POLICY.repositoryId,configurationSha256:sha(configuration)};
 // Reuse the unchanged literal three-SELECT comparator with this run's before
 // snapshot. Its old API and all historical/adversarial tests remain intact.
 const current=captureOwnedRollbackCurrent(wrangler,before,{configuration,pin:OWNED_TIMEOUT_POLICY.cancelled}),now=new Date().toISOString();
 const receipt=verifyOwnedTimeoutReleaseWindow({...history,beforeBytes,context,current,now});
 assert.equal((await proof.get('/git/refs/heads/main')).object?.sha,head);assert.equal(git('rev-parse','HEAD').trim(),head);assert.equal(git('status','--porcelain=v1','--untracked-files=no').trim(),'');assert(regularBytes('b1-runtime-release/before.json',16384).equals(beforeBytes));assert(regularBytes('wrangler.jsonc',1024*1024).equals(configuration));
 const active=JSON.parse(wrangler('deployments','list','--json')).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];assert.deepEqual(active,current.deployment,'Runtime moved during release-window admission');
 writeFileSync('b1-runtime-release/owned-stock-window-'+stage+'.json',JSON.stringify({kind:'EXACT_HISTORICAL_ROLLBACK_AND_CURRENT_RELEASE_STOCK_WINDOW',historicalCheckedAt:history.historicalStockBytes&&JSON.parse(history.historicalStockBytes).at,current,receipt,customerRecordsRead:false,productionWrites:0},null,2),{flag:'wx',mode:0o600});
 return receipt;
}

// Matt's exact outer90 approval applies to this native workflow only. A caller
// field or a historical fixture cannot acquire this binding.
const approvedCurrentProductionWindows=new WeakMap();
const currentProductionWindowIdentity=c=>({head:c.head,main:c.main,run:c.runId,attempt:c.attempt,job:c.job.id,startedAt:c.job.started_at});
export function bindApprovedCurrentProductionWindow(context){
 const git=(...args)=>execFileSync('git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:4194304});
 const head=git('rev-parse','HEAD').trim();assert.equal(context.head,head);assert.equal(context.main,head);
 assert.equal(git('status','--porcelain=v1','--untracked-files=no').trim(),'','A clean exact native release source is required');
 const workflowBytes=git('show',head+':'+workflow);
 assert.equal(sha(workflowBytes),'27295c3a6f40e2cc83692f3d968108315eeb34422b8e8dc78b905691e245a48e','Only the exact approved outer90 workflow may bind this window');
 const approval=JSON.parse(git('show',head+':release/approved-runtime-composition.json')).currentRuntimePreservation20261016.acceptedUkGrubPreservation20261017.approvedCurrentHomeAndOuterWindow20261018;
 assert.equal(sha(JSON.stringify(approval)),'6fb15051be8446af564998ce8f1fe50530dcf7e7aac65ab9d6ce87e47de314ce','The exact original Matt approval must remain unchanged');
 approvedCurrentProductionWindows.set(context,Object.freeze(currentProductionWindowIdentity(context)));return context;
}
