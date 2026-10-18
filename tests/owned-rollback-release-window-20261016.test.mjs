import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {timeoutFixture} from './fixtures/owned-timeout-original-20261016.mjs';
import {verifyOwnedTimeoutRecovery} from '../release/verified-owned-rollback.mjs';
import {captureOwnedRollbackCurrent,assertSameOwnedRollbackReceipt} from '../release/verified-owned-rollback-current.mjs';
import {verifyOwnedTimeoutHistoricalClosure,verifyOwnedTimeoutReleaseWindow} from '../release/owned-rollback-release-window-20261016.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),bytes=v=>Buffer.from(JSON.stringify(v)),pin=b=>({bytes:b.length,sha256:sha(b)});
const sourceStep='Verify every original production source command with two execution slots',stockStep='Capture protected catalogue and stock without customer records';
function fixture(){
 const f=timeoutFixture(),h=f.current.stock;
 f.historicalStockBytes=bytes({at:h.checkedAt,kind:'INDEPENDENT_PUBLIC_STOCK_AND_CONFIG_AFTER_CANCELLED_CORE_READ_ONLY',run:h.run,source:h.failedCandidate,beforeAt:h.beforeAt,tables:h.tables,configurationSha256:h.configurationSha256,identical:true,customerRecordsRead:false,productionWrites:0,originalWorkflowStockStep90:'skipped',notFullRuntimeAcceptance:true});
 f.historicalStockPin=pin(f.historicalStockBytes);
 const head='9'.repeat(40),before={phase:'before',checkedAt:'2026-10-15T09:01:00Z',release:head,customerRecordsRead:false,productionWrites:0,configurationSha256:'8'.repeat(64),tables:structuredClone(h.tables)};
 before.tables.medicine_variants={rows:39,sha256:'7'.repeat(64)};f.beforeBytes=bytes(before);
 f.context={head,main:head,runId:50,attempt:1,event:'push',repositoryId:99,configurationSha256:before.configurationSha256,
  run:{id:50,run_attempt:1,head_sha:head,head_branch:'main',path:'.github/workflows/cloudflare-production-promote.yml',event:'push',status:'in_progress',conclusion:null,run_started_at:'2026-10-15T09:00:00Z',repository:{id:99},head_repository:{id:99}},
  job:{id:51,run_id:50,run_attempt:1,head_sha:head,head_branch:'main',name:'promote',status:'in_progress',conclusion:null,started_at:'2026-10-15T09:00:01Z',completed_at:null,steps:[
   {name:sourceStep,status:'completed',conclusion:'success',started_at:'2026-10-15T09:00:02Z',completed_at:'2026-10-15T09:00:50Z'},
   {name:stockStep,status:'completed',conclusion:'success',started_at:'2026-10-15T09:00:51Z',completed_at:'2026-10-15T09:01:01Z'}]}};
 f.current={observedAt:'2026-10-15T09:02:00Z',deployment:structuredClone(f.current.deployment),stock:{...structuredClone(h),checkedAt:'2026-10-15T09:02:00Z',beforeAt:before.checkedAt,tables:structuredClone(before.tables),configurationSha256:before.configurationSha256}};
 f.now='2026-10-15T09:02:00Z';return f;
}
function beforeEdit(f,change){const b=JSON.parse(f.beforeBytes);change(b);f.beforeBytes=bytes(b);}
function historyEdit(f,change,repin=false){const b=JSON.parse(f.historicalStockBytes);change(b);f.historicalStockBytes=bytes(b);if(repin)f.historicalStockPin=pin(f.historicalStockBytes);}

test('reuses the original timeout fixture bodies byte for byte',()=>{
 const source=readFileSync(new URL('./verified-owned-rollback-chain.test.mjs',import.meta.url),'utf8');
 const prefix=source.slice(0,source.indexOf("\ntest('recognises only")).replace("import test from 'node:test';\n",'').replace("import {verifyOwnedRollbackChain,verifyOwnedTimeoutRecovery,assertOwnedRollbackStartingPoint} from '../release/verified-owned-rollback.mjs';\n",'');
 const body=source.slice(source.indexOf('function timeoutFixture(){'),source.indexOf('\nfunction changeJson('));
 assert.equal(readFileSync(new URL('./fixtures/owned-timeout-original-20261016.mjs',import.meta.url),'utf8'),prefix+'\n'+body+'\nexport {timeoutFixture};\n');
});
test('valid historical closure stays historical; new catalogue/configuration is protected within its own run',()=>{
 const f=fixture(),old=verifyOwnedTimeoutHistoricalClosure(f),r=verifyOwnedTimeoutReleaseWindow(f);
 assert.equal(old.receipt.checkedAt,'2026-10-14T21:06:00Z');assert.equal(r.checkedAt,f.now);assert.equal(r.failedReleaseVerified,false);assert.equal(r.dataRestored,false);
 assert.equal(r.evidence.historicalStockClosure.originalWorkflowAccepted,false);assert.equal(r.evidence.releaseStockWindow.originalFinalAfterComparisonRequired,true);
 assert.equal(r.evidence.releaseStockWindow.tables.medicine_variants.rows,39);assert.notDeepEqual(r.evidence.releaseStockWindow.tables,old.historicalStock.tables);
 assert.throws(()=>verifyOwnedTimeoutRecovery(f));assert(Object.isFrozen(r.evidence.releaseStockWindow.tables));
});
test('fresh recovery and adoption keep every fact except the actual top-level observation time identical',()=>{
 const f=fixture(),a=verifyOwnedTimeoutReleaseWindow(f);f.now='2026-10-15T09:02:30Z';f.current.observedAt=f.now;f.current.stock.checkedAt=f.now;
 const b=verifyOwnedTimeoutReleaseWindow(f);assertSameOwnedRollbackReceipt(a,b);
 f.beforeBytes=Buffer.concat([f.beforeBytes,Buffer.from('\n')]);const c=verifyOwnedTimeoutReleaseWindow(f);assert.throws(()=>assertSameOwnedRollbackReceipt(a,c));
});
test('the existing exact manual confirmation remains necessary for dispatch',()=>{
 const f=fixture();f.context.event=f.context.run.event='workflow_dispatch';assert.throws(()=>verifyOwnedTimeoutReleaseWindow(f));f.context.manualConfirm='PROMOTE_CURRENT_MAIN';assert(verifyOwnedTimeoutReleaseWindow(f));
});
test('millisecond stock capture stays inside the actual whole-second GitHub step boundary',()=>{
 const f=fixture();beforeEdit(f,b=>b.checkedAt='2026-10-15T09:01:01.999Z');f.current.stock.beforeAt='2026-10-15T09:01:01.999Z';assert(verifyOwnedTimeoutReleaseWindow(f));
 beforeEdit(f,b=>b.checkedAt='2026-10-15T09:01:02.000Z');f.current.stock.beforeAt='2026-10-15T09:01:02.000Z';assert.throws(()=>verifyOwnedTimeoutReleaseWindow(f));
});
const bad=[
 ['historical bytes altered',f=>historyEdit(f,h=>h.tables.medicine_variants.rows++)],
 ['historical time refreshed even with a new caller pin',f=>historyEdit(f,h=>h.at=f.now,true)],
 ['historical table changed even with a new caller pin',f=>historyEdit(f,h=>h.tables.medicine_variants.rows++,true)],
 ['historical original run marked accepted',f=>historyEdit(f,h=>h.notFullRuntimeAcceptance=false,true)],
 ['historical workflow skipped step relabelled',f=>historyEdit(f,h=>h.originalWorkflowStockStep90='success',true)],
 ['historical unknown evidence added',f=>historyEdit(f,h=>h.approvedByMatt=true,true)],
 ['historical stock predates public checks',f=>historyEdit(f,h=>h.at='2026-10-14T21:05:29Z',true)],
 ['original successful predecessor changed',f=>f.prior.run.conclusion='failure'],
 ['original failed archive changed',f=>f.failed.archive=Buffer.from('altered')],
 ['original failed logs changed',f=>f.failed.logs=Buffer.from('altered')],
 ['cancelled source changed',f=>f.cancelled.run.head_sha='0'.repeat(40)],
 ['cancelled capture archive changed',f=>f.cancelled.captureArchive=Buffer.from('altered')],
 ['manual recovery receipt changed',f=>f.cancelled.manualRecovery=bytes({})],
 ['manual public checks changed',f=>f.cancelled.manualChecks=bytes({})],
 ['unknown current deployment even at the known version',f=>f.current.deployment.id='00000000-0000-0000-0000-000000000000'],
 ['current version changed',f=>f.current.deployment.versions[0].version_id='00000000-0000-0000-0000-000000000000'],
 ['partial current traffic',f=>f.current.deployment.versions[0].percentage=99],
 ['mixed current traffic',f=>f.current.deployment.versions.push({version_id:'00000000-0000-0000-0000-000000000000',percentage:1})],
 ['current annotation altered',f=>f.current.deployment.annotations['workers/message']='changed'],
 ['current deployment time altered',f=>f.current.deployment.created_on=f.now],
 ['current provider stale',f=>f.current.observedAt='2026-10-15T08:56:59Z'],
 ['current stock future',f=>f.current.stock.checkedAt='2026-10-15T09:02:01Z'],
 ['new release stock changed',f=>f.current.stock.tables.medicine_variants.sha256='6'.repeat(64)],
 ['new release configuration changed',f=>f.current.stock.configurationSha256='6'.repeat(64)],
 ['extra protected table',f=>f.current.stock.tables.customer_records={rows:0,sha256:'6'.repeat(64)}],
 ['stock falsely identifies another failed run',f=>f.current.stock.run=999],
 ['stock falsely identifies another attempt',f=>f.current.stock.attempt=2],
 ['stock falsely accepts failed release',f=>f.current.stock.originalFailedReleaseRemainsFailed=false],
 ['customer records read',f=>f.current.stock.customerRecordsRead=true],
 ['production write claimed',f=>f.current.stock.productionWrites=1],
 ['current main moved',f=>f.context.main='6'.repeat(40)],
 ['current run changed',f=>f.context.run.id=999],
 ['current attempt changed',f=>f.context.run.run_attempt=2],
 ['current source changed',f=>f.context.run.head_sha='6'.repeat(40)],
 ['current workflow changed',f=>f.context.run.path='.github/workflows/other.yml'],
 ['current branch changed',f=>f.context.run.head_branch='preview'],
 ['foreign repository',f=>f.context.run.head_repository.id=999],
 ['unapproved event',f=>f.context.event=f.context.run.event='schedule'],
 ['current run already terminal',f=>f.context.run.status='completed'],
 ['current job source changed',f=>f.context.job.head_sha='6'.repeat(40)],
 ['current job attempt changed',f=>f.context.job.run_attempt=2],
 ['current job not promote',f=>f.context.job.name='other'],
 ['current job already completed',f=>f.context.job.completed_at=f.now],
 ['original source barrier failed',f=>f.context.job.steps[0].conclusion='failure'],
 ['original source barrier duplicated',f=>f.context.job.steps.push({...f.context.job.steps[0]})],
 ['original stock barrier incomplete',f=>f.context.job.steps[1].status='in_progress'],
 ['stock capture preceded source barrier',f=>f.context.job.steps[1].started_at='2026-10-15T09:00:49Z'],
 ['before from another source',f=>beforeEdit(f,b=>b.release='6'.repeat(40))],
 ['before was after snapshot',f=>beforeEdit(f,b=>b.phase='after')],
 ['before configuration not exact current source',f=>beforeEdit(f,b=>b.configurationSha256='6'.repeat(64))],
 ['before outside actual stock step',f=>beforeEdit(f,b=>b.checkedAt='2026-10-15T09:01:02Z')],
 ['before included customer reads',f=>beforeEdit(f,b=>b.customerRecordsRead=true)],
 ['before included production writes',f=>beforeEdit(f,b=>b.productionWrites=1)],
 ['before includes invented approval',f=>beforeEdit(f,b=>b.approvedByMatt=true)],
 ['unchanged 60 minute cap exceeded',f=>{f.now=f.current.observedAt=f.current.stock.checkedAt='2026-10-15T10:00:02Z';}],
];
for(const[name,edit]of bad)test('separate-window admission rejects '+name,()=>{const f=fixture();edit(f);assert.throws(()=>verifyOwnedTimeoutReleaseWindow(f));});
test('unchanged actual three-SELECT comparator rejects stock drift and a moving provider',()=>{
 const rows={medicine_products:[{id:1}],medicine_variants:[{id:2,status:'unavailable'}],medicine_inventory:[{variant_id:2,stock:0}]},configuration=Buffer.from('accepted source config'),seen=[];
 const before={checkedAt:'2026-10-15T09:01:00Z',configurationSha256:sha(configuration),tables:Object.fromEntries(Object.entries(rows).map(([k,v])=>[k,{rows:v.length,sha256:sha(JSON.stringify(v))}]))};
 let providerCalls=0,move=false,alter=false;
 const wrangler=(...args)=>{seen.push(args);if(args[0]==='deployments'){providerCalls++;return JSON.stringify([{id:move&&providerCalls%2===0?'moved':'owned',versions:[{version_id:'known',percentage:100}],created_on:'2026-10-14T21:05:10Z'}]);}assert.deepEqual(args.slice(0,6),['d1','execute','DB','--remote','--json','--command']);const table=Object.keys(rows).find(t=>args[6]==='SELECT * FROM '+t+' ORDER BY '+(t==='medicine_inventory'?'variant_id':'id'));assert(table);return JSON.stringify([{success:true,results:alter&&table==='medicine_variants'?[{id:2,status:'available'}]:rows[table]}]);};
 const options={configuration,now:()=>Date.parse('2026-10-15T09:02:00Z')};assert(captureOwnedRollbackCurrent(wrangler,before,options));assert.equal(seen.filter(a=>a[0]==='d1').length,3);
 alter=true;assert.throws(()=>captureOwnedRollbackCurrent(wrangler,before,options));alter=false;move=true;providerCalls=0;assert.throws(()=>captureOwnedRollbackCurrent(wrangler,before,options));
});


test('exact native approved workflow binds only the current ninety-minute production window',async()=>{
 const {execFileSync}=await import('node:child_process');
 const {currentReleaseContext,bindApprovedCurrentProductionWindow}=await import('../release/owned-rollback-release-window-20261016.mjs');
 const f=fixture(),head=execFileSync('git',['--no-replace-objects','rev-parse','HEAD'],{encoding:'utf8'}).trim();
 f.context.head=f.context.main=f.context.run.head_sha=f.context.job.head_sha=head;
 const before=JSON.parse(f.beforeBytes);before.release=head;
 assert.throws(()=>currentReleaseContext(f.context,before,'2026-10-15T10:00:02Z'),/Original 60 minute/);
 bindApprovedCurrentProductionWindow(f.context);
 assert.doesNotThrow(()=>currentReleaseContext(f.context,before,'2026-10-15T10:30:01.000Z'));
 assert.throws(()=>currentReleaseContext(f.context,before,'2026-10-15T10:30:01.001Z'),/Approved 90 minute/);
 f.context.job.id++;assert.throws(()=>currentReleaseContext(f.context,before,'2026-10-15T10:00:02Z'),/identity changed/);
});
test('caller-supplied ninety-minute fields cannot widen the historical window',async()=>{
 const {currentReleaseContext,bindApprovedCurrentProductionWindow}=await import('../release/owned-rollback-release-window-20261016.mjs');
 const f=fixture(),before=JSON.parse(f.beforeBytes);f.context.approvedProductionWindowMinutes=90;f.context.outerProductionWindowMinutes=90;
 assert.throws(()=>currentReleaseContext(f.context,before,'2026-10-15T10:00:02Z'),/Original 60 minute/);
 assert.throws(()=>bindApprovedCurrentProductionWindow(f.context));
});
