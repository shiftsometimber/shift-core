import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ACCEPTED_GRUB_RUNTIME,ACCEPTED_GRUB_UK_RUNTIME,ACCEPTED_GRUB_UK_RUNTIME_KIND,readAcceptedGrubUkCurrentWitness,assertAcceptedGrubUkCurrentReceipt,assertAcceptedGrubUkCurrentRun,assertAcceptedGrubUkCurrentProvider,verifyAcceptedGrubUkCurrentReleaseWindow,acceptedGrubUkCurrentStartingPoint,readAcceptedGrubCurrentWitness,assertAcceptedGrubCurrentReceipt,assertAcceptedGrubRetainedHq} from '../release/accepted-current-runtime-starting-point-20261017.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/accepted-grub-uk-runtime-20261017.json',import.meta.url)));
const sha=v=>createHash('sha256').update(v).digest('hex'),configuration=Buffer.from('Explicit synthetic unit configuration; no provider or member request');
// Only this current-release context is a controlled component model. The UK
// terminal producer, original receipt and complete Core/HQ snapshots stay genuine.
function input(hour='23:00'){
 const source='1'.repeat(40),at='2026-10-17T'+hour+':01.100Z',now='2026-10-17T'+hour+':10.000Z',tables=Object.fromEntries(['medicine_products','medicine_variants','medicine_inventory'].map(name=>[name,{rows:0,sha256:sha('[]')}]));
 const before={phase:'before',checkedAt:at,release:source,tables,configurationSha256:sha(configuration),customerRecordsRead:false,productionWrites:0};
 const started='2026-10-17T'+hour+':00Z';
 const run={id:9001,run_attempt:1,head_sha:source,head_branch:'main',path:'.github/workflows/cloudflare-production-promote.yml',event:'push',status:'in_progress',conclusion:null,repository:{id:1328867509},head_repository:{id:1328867509},run_started_at:started};
 const job={id:9002,run_id:9001,run_attempt:1,head_sha:source,head_branch:'main',name:'promote',status:'in_progress',conclusion:null,completed_at:null,started_at:started,steps:[{name:'Verify every original production source command with two execution slots',status:'completed',conclusion:'success',started_at:started,completed_at:started},{name:'Capture protected catalogue and stock without customer records',status:'completed',conclusion:'success',started_at:'2026-10-17T'+hour+':01Z',completed_at:'2026-10-17T'+hour+':01Z'}]};
 return {receiptBytes:Buffer.from(fixture.receiptBase64,'base64'),run:structuredClone(fixture.run),job:structuredClone(fixture.job),beforeBytes:Buffer.from(JSON.stringify(before)),context:{head:source,main:source,run,job,runId:9001,attempt:1,event:'push',repositoryId:1328867509,configurationSha256:sha(configuration)},current:{...structuredClone(fixture.provider),observedAt:now,stock:{checkedAt:now,beforeAt:at,tables:structuredClone(tables),configurationSha256:sha(configuration),customerRecordsRead:false,productionWrites:0}},now};
}
test('genuine UK producer, witness, complete provider and pure window retain the distinct c058 identity',()=>{
 const s=input(),bytes=readAcceptedGrubUkCurrentWitness(),receipt=assertAcceptedGrubUkCurrentReceipt(bytes);
 assert.deepEqual(bytes,s.receiptBytes);assert.equal(sha(bytes),'0bfcc2293dd400f5655d759bd9651d38073650762192024b6021a742f86e195f');
 const producer=assertAcceptedGrubUkCurrentRun(s.run,s.job);assert.equal(producer.completedAt,'2026-10-17T22:43:32Z');assertAcceptedGrubUkCurrentProvider(s.current,receipt);
 const proof=verifyAcceptedGrubUkCurrentReleaseWindow(s);assert.equal(proof.kind,ACCEPTED_GRUB_UK_RUNTIME_KIND);assert.equal(proof.source,'c058780e1df1ac59968e08ac1959877ab80fd034');assert.equal(proof.version,'e308b779-9b21-4702-b5c7-230623404f00');assert.notEqual(proof.source,ACCEPTED_GRUB_RUNTIME.source);assert.equal(proof.originalReceiptAt,null);assert.equal(proof.originalReceiptTimestampPresent,false);assert.equal(proof.originalProducerCompletedAt,s.job.completed_at);assert.equal(proof.featureAcceptance,false);assert.equal(proof.clinicalContractActivated,false);
 assert.equal(acceptedGrubUkCurrentStartingPoint(proof,s.current.deployment).run,39075907078);assert.equal(receipt.live.checks[0].bytes,31955);assert.equal(receipt.live.checks[0].sha256,'869023ec9ec996732c28adc6e33f6e2564bf557457352e1de00ccb701f984b75');
});
test('UK admission rejects predecessor producer substitution and altered UK-specific stage outcomes',()=>{
 const older=JSON.parse(readFileSync(new URL('./fixtures/accepted-grub-runtime-20261017.json',import.meta.url)));assert.throws(()=>assertAcceptedGrubUkCurrentRun(older.run,older.job));
 const otherJob=structuredClone(fixture.job);otherJob.id++;assert.throws(()=>assertAcceptedGrubUkCurrentRun(fixture.run,otherJob));
 const skipped=structuredClone(fixture.job);skipped.steps.find(v=>v.name==='Verify actual UK discovery and recipe detail browser').conclusion='skipped';assert.throws(()=>assertAcceptedGrubUkCurrentRun(fixture.run,skipped));
 const inventedRollback=structuredClone(fixture.job);inventedRollback.steps.find(v=>v.number===14).conclusion='success';assert.throws(()=>assertAcceptedGrubUkCurrentRun(fixture.run,inventedRollback));
});
test('new complete UK provider pins reject binding, annotation and metadata drift',()=>{
 const receipt=assertAcceptedGrubUkCurrentReceipt(Buffer.from(fixture.receiptBase64,'base64'));
 for(const change of[
  v=>v.version.resources.bindings.push({name:'UNAPPROVED_UK_BINDING',type:'plain_text',text:'true'}),
  v=>v.version.annotations['workers/tag']='grub-39067612602-1',
  v=>v.version.metadata.created_on='2026-10-17T22:42:35Z',
  v=>v.deployment.annotations['workers/message']='Everyday Grub predecessor'
 ]){const provider=structuredClone(fixture.provider);change(provider);assert.throws(()=>assertAcceptedGrubUkCurrentProvider(provider,receipt));}
});
test('immutable UK receipt rejects changed served bytes and invented member, physical or waiver claims',()=>{
 // Rejection is deliberately at the immutable original-byte boundary. These
 // cases do not pretend to bypass the digest and exercise private spec code.
 for(const change of[
  r=>r.live.checks[0].sha256='23e7ac48af815c3b77d9ba19752992b68648511c7a647fd3b077cc2b8dc250e4',
  r=>r.live.authenticatedMemberAcceptance=true,
  r=>r.physicalDeviceAcceptance=true,
  r=>r.waiver={requiredUkBrowser:'waived'}
 ]){const receipt=JSON.parse(Buffer.from(fixture.receiptBase64,'base64'));change(receipt);assert.throws(()=>assertAcceptedGrubUkCurrentReceipt(Buffer.from(JSON.stringify(receipt,null,2)+'\n')),/Original accepted receipt bytes changed/);}
});
test('a fresh-looking controlled stock window cannot predate the genuine UK producer completion',()=>{
 const s=input('22:40');assert.equal(s.job.completed_at,fixture.job.completed_at);assert.throws(()=>verifyAcceptedGrubUkCurrentReleaseWindow(s),/Original accepted release must precede the current stock window/);
});
test('the UK witness retains the independently authenticated original HQ correspondence',()=>{
 const uk=assertAcceptedGrubUkCurrentReceipt(Buffer.from(fixture.receiptBase64,'base64')),prior=assertAcceptedGrubCurrentReceipt(readAcceptedGrubCurrentWitness());assert.deepEqual(uk.retainedHq,prior.retainedHq);
 const proof=assertAcceptedGrubRetainedHq(fixture.retainedHqProvider,prior,Buffer.from(fixture.retainedHqConfigurationBase64,'base64'),fixture.retainedHqConfigurationSHA256);assert.equal(proof.deploymentId,uk.retainedHq.deploymentId);assert.equal(proof.versionId,uk.retainedHq.versionId);assert.equal(proof.allBindingsSha256,uk.retainedHq.allBindingsSha256);assert.equal(proof.clinicalContractActivated,false);
});
