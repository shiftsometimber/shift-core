import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {ACCEPTED_CURRENT_RUNTIME,ACCEPTED_CURRENT_RUNTIME_KIND,assertAcceptedCurrentReceipt,readAcceptedCurrentWitness,assertAcceptedCurrentRun,assertAcceptedCurrentProvider,captureAcceptedCurrentStock,verifyAcceptedCurrentReleaseWindow,assertSameAcceptedCurrentWindow,acceptedCurrentStartingPoint,assertPreservedRuntimeLineage,verifyCurrentAcceptedRuntimeWindow} from '../release/accepted-current-runtime-starting-point-20261017.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/accepted-current-runtime-20261017.json',import.meta.url)));
const sha=v=>createHash('sha256').update(v).digest('hex'),configuration=Buffer.from('Fictional unit configuration; no provider or member requests');
const tableNames=['medicine_products','medicine_variants','medicine_inventory'];
function input(){
 const source='1'.repeat(40),before={phase:'before',checkedAt:'2026-10-17T00:20:01.100Z',release:source,tables:Object.fromEntries(tableNames.map(name=>[name,{rows:0,sha256:sha('[]')}])),configurationSha256:sha(configuration),customerRecordsRead:false,productionWrites:0};
 const currentRun={id:9001,run_attempt:1,head_sha:source,head_branch:'main',path:'.github/workflows/cloudflare-production-promote.yml',event:'push',status:'in_progress',conclusion:null,repository:{id:1328867509},head_repository:{id:1328867509},run_started_at:'2026-10-17T00:19:50Z'};
 const currentJob={id:9002,run_id:9001,run_attempt:1,head_sha:source,head_branch:'main',name:'promote',status:'in_progress',conclusion:null,completed_at:null,started_at:'2026-10-17T00:20:00Z',steps:[{name:'Verify every original production source command with two execution slots',status:'completed',conclusion:'success',started_at:'2026-10-17T00:20:00Z',completed_at:'2026-10-17T00:20:00Z'},{name:'Capture protected catalogue and stock without customer records',status:'completed',conclusion:'success',started_at:'2026-10-17T00:20:01Z',completed_at:'2026-10-17T00:20:01Z'}]};
 return {receiptBytes:Buffer.from(fixture.receiptBase64,'base64'),run:structuredClone(fixture.run),job:structuredClone(fixture.job),beforeBytes:Buffer.from(JSON.stringify(before)),context:{head:source,main:source,run:currentRun,job:currentJob,runId:9001,attempt:1,event:'push',repositoryId:1328867509,configurationSha256:sha(configuration)},current:{...structuredClone(fixture.provider),observedAt:'2026-10-17T00:20:09.900Z',stock:{checkedAt:'2026-10-17T00:20:09.900Z',beforeAt:before.checkedAt,tables:structuredClone(before.tables),configurationSha256:before.configurationSha256,customerRecordsRead:false,productionWrites:0}},now:'2026-10-17T00:20:10.000Z'};
}
const changeBefore=(s,fn)=>{const value=JSON.parse(s.beforeBytes);fn(value);s.beforeBytes=Buffer.from(JSON.stringify(value));};
test('exact original receipt and real metadata admit only the accepted current version with clinical service still closed',()=>{
 const s=input();assertAcceptedCurrentReceipt(s.receiptBytes);assertAcceptedCurrentRun(s.run,s.job);assertAcceptedCurrentProvider(s.current,JSON.parse(s.receiptBytes));const result=verifyAcceptedCurrentReleaseWindow(s);assert.equal(result.kind,ACCEPTED_CURRENT_RUNTIME_KIND);assert.equal(result.source,ACCEPTED_CURRENT_RUNTIME.source);assert.equal(result.featureAcceptance,false);assert.equal(result.clinicalContractActivated,false);assert.equal(result.dataRestored,false);assert.equal(result.originalReceiptAt,JSON.parse(s.receiptBytes).at);assert.equal(result.releaseStockWindow.originalFinalAfterComparisonRequired,true);
});
test('durable witness is byte identical to the actual original artifact receipt, with an immutable pin',()=>{
 const bytes=Buffer.from(fixture.receiptBase64,'base64');assert.equal(sha(bytes),ACCEPTED_CURRENT_RUNTIME.receiptSHA256);assert.deepEqual(readAcceptedCurrentWitness(bytes),bytes);assert.deepEqual(readAcceptedCurrentWitness(),bytes);assert(Object.isFrozen(ACCEPTED_CURRENT_RUNTIME));assert(Object.isFrozen(ACCEPTED_CURRENT_RUNTIME.artifact));
 for(const changed of [Buffer.concat([bytes,Buffer.from('\n')]),Buffer.from(bytes.toString().replace('code_only_verified','feature_verified')),Buffer.from(JSON.stringify(JSON.parse(bytes)))])assert.throws(()=>readAcceptedCurrentWitness(changed));
});
for(const[label,mutate]of[
 ['unknown deployment',s=>s.current.deployment.id='11111111-1111-4111-8111-111111111111'],
 ['unknown provider version',s=>s.current.version.id='11111111-1111-4111-8111-111111111111'],
 ['wrong active version',s=>s.current.deployment.versions[0].version_id='11111111-1111-4111-8111-111111111111'],
 ['split traffic',s=>s.current.deployment.versions[0].percentage=99],
 ['extra traffic version',s=>s.current.deployment.versions.push({version_id:s.current.version.id,percentage:0})],
 ['GP flag changed',s=>s.current.version.resources.bindings.find(b=>b.name==='MEMBER_GP_DIRECTORY_V2_ENABLED').text='false'],
 ['email security changed',s=>s.current.version.resources.bindings.find(b=>b.name==='AUTO_VERIFY_EMAIL').text='true'],
 ['foreign binding',s=>s.current.version.resources.bindings.push({name:'UNAUTHORISED_BINDING',type:'plain_text',text:'true'})],
 ['wrong original run attempt',s=>s.run.run_attempt=2],
 ['wrong original workflow',s=>s.run.path='.github/workflows/unapproved.yml'],
 ['foreign repository',s=>s.run.repository.id=1],
 ['failed original job',s=>s.job.conclusion='failure'],
 ['skipped original safety check',s=>s.job.steps.find(x=>x.name==='Preserve GP, account isolation and original anonymous denial assertions').conclusion='skipped'],
 ['changed original job source',s=>s.job.head_sha='a'.repeat(40)],
 ['original release newer than the stock window',s=>s.job.completed_at='2026-10-17T00:21:00Z'],
 ['changed original receipt',s=>s.receiptBytes=Buffer.concat([s.receiptBytes,Buffer.from(' ')])],
 ['stale provider observation',s=>s.current.observedAt='2026-10-17T00:10:00Z'],
 ['stale stock observation',s=>s.current.stock.checkedAt='2026-10-17T00:10:00Z'],
 ['future observation',s=>s.current.observedAt='2026-10-17T00:21:00Z'],
 ['protected stock changed',s=>s.current.stock.tables.medicine_variants.sha256='a'.repeat(64)],
 ['source configuration changed',s=>s.current.stock.configurationSha256='a'.repeat(64)],
 ['wrong stock capture identity',s=>s.current.stock.beforeAt='2026-10-17T00:20:00Z'],
 ['customer records queried',s=>s.current.stock.customerRecordsRead=true],
 ['data writes',s=>s.current.stock.productionWrites=1],
 ['source barrier skipped',s=>s.context.job.steps[0].conclusion='skipped'],
 ['stock barrier skipped',s=>s.context.job.steps[1].conclusion='skipped'],
 ['stale main',s=>s.context.main='a'.repeat(40)],
 ['foreign current job',s=>s.context.job.run_id=1],
 ['wrong current release attempt',s=>s.context.attempt=2],
 ['unapproved manual promotion',s=>{s.context.event='workflow_dispatch';s.context.run.event='workflow_dispatch';s.context.manualConfirm='go'}],
 ['original 60-minute cap exceeded',s=>s.now='2026-10-17T01:20:01Z'],
 ['invented stock table',s=>changeBefore(s,b=>b.tables.customer_health={rows:0,sha256:sha('[]')})],
 ['wrong before-snapshot source',s=>changeBefore(s,b=>b.release='a'.repeat(40))]
])test('accepted-current window rejects '+label,()=>{const s=input();mutate(s);assert.throws(()=>verifyAcceptedCurrentReleaseWindow(s));});
test('the unmodified source and stock timestamp assertions retain millisecond boundaries',()=>{
 const s=input();changeBefore(s,b=>b.checkedAt='2026-10-17T00:20:01.999Z');s.current.stock.beforeAt='2026-10-17T00:20:01.999Z';assert(verifyAcceptedCurrentReleaseWindow(s));changeBefore(s,b=>b.checkedAt='2026-10-17T00:20:02.000Z');s.current.stock.beforeAt='2026-10-17T00:20:02.000Z';assert.throws(()=>verifyAcceptedCurrentReleaseWindow(s));
});
function fakeWrangler(s,{drift=false}={}){
 const calls=[];let lists=0;const call=(...args)=>{calls.push(args);if(args[0]==='deployments'){const value=structuredClone(s.current.deployment);if(++lists===2&&drift)value.id='11111111-1111-4111-8111-111111111111';return JSON.stringify([value]);}if(args[0]==='versions')return JSON.stringify(s.current.version);if(args[0]==='d1'){assert.equal(args[1],'execute');assert.equal(args[2],'DB');assert.equal(args[3],'--remote');assert.equal(args[4],'--json');assert.equal(args[5],'--command');assert(/^SELECT \* FROM medicine_(products|variants|inventory) ORDER BY (id|variant_id)$/.test(args[6]));return JSON.stringify([{success:true,results:[]}]);}throw Error('Unapproved operation');};return {call,calls};
}
test('the collector performs only the three original ordered public stock SELECTs and actual provider reads',()=>{
 const s=input(),w=fakeWrangler(s),before=JSON.parse(s.beforeBytes);const current=captureAcceptedCurrentStock(w.call,before,configuration,JSON.parse(s.receiptBytes),()=>Date.parse(s.current.observedAt));assert.deepEqual(current.stock.tables,before.tables);assert.deepEqual(w.calls.filter(c=>c[0]==='d1').map(c=>c[6]),['SELECT * FROM medicine_products ORDER BY id','SELECT * FROM medicine_variants ORDER BY id','SELECT * FROM medicine_inventory ORDER BY variant_id']);assert.deepEqual(w.calls.map(c=>c[0]),['deployments','versions','d1','d1','d1','deployments']);
});
test('unknown runtime rejects before any stock query, and provider drift during the read rejects',()=>{
 const s=input();s.current.deployment.id='11111111-1111-4111-8111-111111111111';const first=fakeWrangler(s);assert.throws(()=>captureAcceptedCurrentStock(first.call,JSON.parse(s.beforeBytes),configuration,JSON.parse(s.receiptBytes)));assert.equal(first.calls.length,1);const valid=input(),moving=fakeWrangler(valid,{drift:true});assert.throws(()=>captureAcceptedCurrentStock(moving.call,JSON.parse(valid.beforeBytes),configuration,JSON.parse(valid.receiptBytes)));
});
test('recovery/adoption compares every baseline fact and only permits a later current capture time',()=>{
 const s=input(),first=verifyAcceptedCurrentReleaseWindow(s);s.now='2026-10-17T00:20:11.000Z';const second=verifyAcceptedCurrentReleaseWindow(s);assertSameAcceptedCurrentWindow(first,second);const changed=structuredClone(second);changed.originalArtifactSHA256='a'.repeat(64);assert.throws(()=>assertSameAcceptedCurrentWindow(first,changed));assert.throws(()=>assertSameAcceptedCurrentWindow(second,first));assert.equal(acceptedCurrentStartingPoint(second,s.current.deployment).source,ACCEPTED_CURRENT_RUNTIME.source);const altered={...second,source:'a'.repeat(40)};assert.throws(()=>acceptedCurrentStartingPoint(altered,s.current.deployment));
});
test('an unapproved stage never starts provider or evidence reads',async()=>{
 let calls=0;await assert.rejects(()=>verifyCurrentAcceptedRuntimeWindow({proof:{get(){calls++}},wrangler(){calls++},stage:'unapproved'}));assert.equal(calls,0);
});
test('a later owned-main starting source must retain actual GP/questionnaire ancestry',()=>{
 const source=execFileSync('/usr/bin/git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),point={source};assert.equal(assertPreservedRuntimeLineage(point),point);assert.throws(()=>assertPreservedRuntimeLineage({source:'878d120c491acc650c1cf3c4df9b351a80c6306b'}));assert.throws(()=>assertPreservedRuntimeLineage({source:'a'.repeat(40)}));assert.throws(()=>assertPreservedRuntimeLineage({source:'unapproved'}));
});

