import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ACCEPTED_GRUB_RUNTIME,ACCEPTED_GRUB_RUNTIME_KIND,readAcceptedGrubCurrentWitness,assertAcceptedGrubCurrentReceipt,assertAcceptedGrubCurrentRun,assertAcceptedGrubCurrentProvider,captureAcceptedGrubCurrentStock,verifyAcceptedGrubCurrentReleaseWindow,assertSameAcceptedGrubCurrentWindow,acceptedGrubCurrentStartingPoint,verifyCurrentAcceptedGrubRuntimeWindow} from '../release/accepted-current-runtime-starting-point-20261017.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/accepted-grub-runtime-20261017.json',import.meta.url)));
const sha=v=>createHash('sha256').update(v).digest('hex'),configuration=Buffer.from('Explicit synthetic unit configuration; no provider or member request');
function input(){
 const source='1'.repeat(40),at='2026-10-17T21:30:01.100Z',now='2026-10-17T21:30:10.000Z',tables=Object.fromEntries(['medicine_products','medicine_variants','medicine_inventory'].map(name=>[name,{rows:0,sha256:sha('[]')}]));
 const before={phase:'before',checkedAt:at,release:source,tables,configurationSha256:sha(configuration),customerRecordsRead:false,productionWrites:0};
 const run={id:9001,run_attempt:1,head_sha:source,head_branch:'main',path:'.github/workflows/cloudflare-production-promote.yml',event:'push',status:'in_progress',conclusion:null,repository:{id:1328867509},head_repository:{id:1328867509},run_started_at:'2026-10-17T21:29:50Z'};
 const job={id:9002,run_id:9001,run_attempt:1,head_sha:source,head_branch:'main',name:'promote',status:'in_progress',conclusion:null,completed_at:null,started_at:'2026-10-17T21:30:00Z',steps:[{name:'Verify every original production source command with two execution slots',status:'completed',conclusion:'success',started_at:'2026-10-17T21:30:00Z',completed_at:'2026-10-17T21:30:00Z'},{name:'Capture protected catalogue and stock without customer records',status:'completed',conclusion:'success',started_at:'2026-10-17T21:30:01Z',completed_at:'2026-10-17T21:30:01Z'}]};
 return {receiptBytes:Buffer.from(fixture.receiptBase64,'base64'),run:structuredClone(fixture.run),job:structuredClone(fixture.job),beforeBytes:Buffer.from(JSON.stringify(before)),context:{head:source,main:source,run,job,runId:9001,attempt:1,event:'push',repositoryId:1328867509,configurationSha256:sha(configuration)},current:{...structuredClone(fixture.provider),observedAt:now,stock:{checkedAt:now,beforeAt:at,tables:structuredClone(tables),configurationSha256:sha(configuration),customerRecordsRead:false,productionWrites:0}},now};
}
test('genuine original accepted Grub receipt and metadata retain actual source, no invented receipt time and no member/clinical acceptance',()=>{
 const s=input(),bytes=readAcceptedGrubCurrentWitness();assert.equal(sha(bytes),ACCEPTED_GRUB_RUNTIME.receiptSHA256);assert.deepEqual(bytes,s.receiptBytes);assertAcceptedGrubCurrentReceipt(bytes);assertAcceptedGrubCurrentRun(s.run,s.job);assertAcceptedGrubCurrentProvider(s.current,JSON.parse(bytes));
 const result=verifyAcceptedGrubCurrentReleaseWindow(s);assert.equal(result.kind,ACCEPTED_GRUB_RUNTIME_KIND);assert.equal(result.source,ACCEPTED_GRUB_RUNTIME.source);assert.equal(result.version,ACCEPTED_GRUB_RUNTIME.version);assert.equal(result.featureAcceptance,false);assert.equal(result.clinicalContractActivated,false);assert.equal(result.dataRestored,false);assert.equal(result.originalReceiptAt,null);assert.equal(result.originalReceiptTimestampPresent,false);assert.equal(result.originalProducerCompletedAt,s.job.completed_at);assert.equal(result.releaseStockWindow.originalFinalAfterComparisonRequired,true);
});
for(const [name,change] of [
 ['unknown deployment',s=>s.current.deployment.id='11111111-1111-4111-8111-111111111111'],
 ['wrong version',s=>s.current.version.id='11111111-1111-4111-8111-111111111111'],
 ['mixed traffic',s=>s.current.deployment.versions.push({version_id:s.current.version.id,percentage:0})],
 ['reduced traffic',s=>s.current.deployment.versions[0].percentage=99],
 ['different owner message',s=>s.current.deployment.annotations['workers/message']='Different owner'],
 ['different upload source tag',s=>s.current.version.annotations['workers/tag']='different-source'],
 ['changed immutable version metadata',s=>s.current.version.metadata.created_on='2026-10-17T20:43:06Z'],
 ['GP flag disabled',s=>s.current.version.resources.bindings.find(b=>b.name==='MEMBER_GP_DIRECTORY_V2_ENABLED').text='false'],
 ['week flag disabled',s=>s.current.version.resources.bindings.find(b=>b.name==='MY_TIMBER_WEEK_VIEW_ENABLED').text='false'],
 ['extra model or other binding',s=>s.current.version.resources.bindings.push({name:'UNAPPROVED_MODEL',type:'plain_text',text:'true'})],
 ['wrong original source',s=>s.run.head_sha='a'.repeat(40)],
 ['wrong original branch',s=>s.run.head_branch='main'],
 ['wrong original workflow',s=>s.run.path='.github/workflows/other.yml'],
 ['failed original producer',s=>s.job.conclusion='failure'],
 ['original stock/live gate skipped',s=>s.job.steps.find(x=>x.name==='Verify actual serving Grub script, privacy, owned Core, retained HQ and protected stock').conclusion='skipped'],
 ['original producer newer than current stock window',s=>s.job.completed_at='2026-10-17T21:31:00Z'],
 ['invented original receipt timestamp',s=>{const r=JSON.parse(s.receiptBytes);r.at='2026-10-17T20:43:56Z';s.receiptBytes=Buffer.from(JSON.stringify(r,null,2)+'\n');}],
 ['stale current provider',s=>s.current.observedAt='2026-10-17T21:20:00Z'],
 ['future current stock',s=>s.current.stock.checkedAt='2026-10-17T21:31:00Z'],
 ['stock changed inside current release',s=>s.current.stock.tables.medicine_inventory.sha256='a'.repeat(64)],
 ['current configuration changed',s=>s.current.stock.configurationSha256='a'.repeat(64)],
 ['customer records read',s=>s.current.stock.customerRecordsRead=true],
 ['data written or restored',s=>s.current.stock.productionWrites=1],
 ['source barrier skipped',s=>s.context.job.steps[0].conclusion='skipped'],
 ['stale main',s=>s.context.main='a'.repeat(40)],
 ['different current run attempt',s=>s.context.attempt=2],
 ['unapproved manual confirmation',s=>{s.context.event='workflow_dispatch';s.context.run.event='workflow_dispatch';s.context.manualConfirm='go';}],
 ['original 60-minute limit exceeded',s=>s.now='2026-10-17T22:30:01Z']
])test('accepted Grub window rejects '+name,()=>{const s=input();change(s);assert.throws(()=>verifyAcceptedGrubCurrentReleaseWindow(s));});
test('recovery and adoption retain every original fact and compare only the later capture time',()=>{
 const s=input(),first=verifyAcceptedGrubCurrentReleaseWindow(s);s.now='2026-10-17T21:30:11.000Z';const next=verifyAcceptedGrubCurrentReleaseWindow(s);assertSameAcceptedGrubCurrentWindow(first,next);assert.equal(acceptedGrubCurrentStartingPoint(next,s.current.deployment).source,ACCEPTED_GRUB_RUNTIME.source);const changed=structuredClone(next);changed.originalArtifactSHA256='a'.repeat(64);assert.throws(()=>assertSameAcceptedGrubCurrentWindow(first,changed));assert.throws(()=>assertSameAcceptedGrubCurrentWindow(next,first));
});
test('collector retains the three original ordered stock SELECTs and rejects moved ownership',()=>{
 const s=input(),calls=[];let lists=0;const w=(...args)=>{calls.push(args);if(args[0]==='deployments')return JSON.stringify([s.current.deployment]);if(args[0]==='versions')return JSON.stringify(s.current.version);if(args[0]==='d1'){assert.deepEqual(args.slice(0,6),['d1','execute','DB','--remote','--json','--command']);return JSON.stringify([{success:true,results:[]}]);}throw Error('Unapproved operation');};
 const value=captureAcceptedGrubCurrentStock(w,JSON.parse(s.beforeBytes),configuration,JSON.parse(s.receiptBytes),()=>Date.parse(s.now));assert.deepEqual(value.stock.tables,s.current.stock.tables);assert.deepEqual(calls.filter(c=>c[0]==='d1').map(c=>c[6]),['SELECT * FROM medicine_products ORDER BY id','SELECT * FROM medicine_variants ORDER BY id','SELECT * FROM medicine_inventory ORDER BY variant_id']);assert.deepEqual(calls.map(c=>c[0]),['deployments','versions','d1','d1','d1','deployments']);
 s.current.deployment.id='11111111-1111-4111-8111-111111111111';calls.length=0;assert.throws(()=>captureAcceptedGrubCurrentStock(w,JSON.parse(s.beforeBytes),configuration,JSON.parse(s.receiptBytes)));assert.equal(calls.length,1);
});
test('an unapproved stage rejects before original archive, API or provider reads',async()=>{
 let calls=0;await assert.rejects(()=>verifyCurrentAcceptedGrubRuntimeWindow({stage:'unapproved',proof:{get(){calls++;},artifact(){calls++;}},wrangler(){calls++;}}));assert.equal(calls,0);
});
