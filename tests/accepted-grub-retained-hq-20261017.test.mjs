import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertAcceptedGrubRetainedHq,assertSameAcceptedGrubRetainedHq,readAcceptedGrubCurrentWitness} from '../release/accepted-current-runtime-starting-point-20261017.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/accepted-grub-retained-hq-20261017.json',import.meta.url)));
const receipt=JSON.parse(readAcceptedGrubCurrentWitness());
const input=()=>({snapshot:structuredClone(fixture.provider),configuration:Buffer.from(fixture.configurationBase64,'base64'),configurationSHA256:fixture.configurationSHA256});
test('actual original retained HQ metadata, every binding and original configuration are required',()=>{
 const s=input(),proof=assertAcceptedGrubRetainedHq(s.snapshot,receipt,s.configuration,s.configurationSHA256);
 assert.equal(proof.source,receipt.retainedHq.source);assert.equal(proof.versionId,receipt.retainedHq.versionId);assert.equal(proof.deploymentId,receipt.retainedHq.deploymentId);assert.equal(proof.percentage,100);assert.equal(proof.gpEnabled,true);assert.equal(proof.partnersEnabled,true);assert.equal(proof.genuineHqHolderAcceptance,false);assert.equal(proof.featureAcceptance,false);assert.equal(proof.clinicalContractActivated,false);assert.equal(proof.providerWrites,0);
 assert.deepEqual(assertSameAcceptedGrubRetainedHq(s.snapshot,structuredClone(s.snapshot),receipt,s.configuration,s.configurationSHA256),proof);
});
for(const [name,change] of [
 ['unknown HQ deployment',s=>s.snapshot.deployment.id='11111111-1111-4111-8111-111111111111'],
 ['unknown HQ version',s=>s.snapshot.version.id='11111111-1111-4111-8111-111111111111'],
 ['mixed traffic',s=>s.snapshot.deployment.versions.push({version_id:s.snapshot.version.id,percentage:0})],
 ['reduced traffic',s=>s.snapshot.deployment.versions[0].percentage=99],
 ['changed deployment annotation',s=>s.snapshot.deployment.annotations['workers/message']='Unrelated release'],
 ['changed immutable version metadata',s=>s.snapshot.version.metadata.created_on='2026-10-17T21:00:00Z'],
 ['GP disabled',s=>s.snapshot.version.resources.bindings.find(v=>v.name==='MEMBER_GP_DIRECTORY_V2_ENABLED').text='false'],
 ['partners disabled',s=>s.snapshot.version.resources.bindings.find(v=>v.name==='HQ_PARTNERS_ENABLED').text='false'],
 ['unknown additional binding',s=>s.snapshot.version.resources.bindings.push({name:'UNAPPROVED_MODEL',type:'plain_text',text:'true'})],
 ['changed existing binding',s=>{const v=s.snapshot.version.resources.bindings.find(v=>v.type==='plain_text');v.text+=' changed';}],
 ['changed HQ configuration',s=>s.configuration=Buffer.concat([s.configuration,Buffer.from('\n')])],
 ['invented original configuration digest',s=>s.configurationSHA256='a'.repeat(64)],
 ['missing original configuration digest',s=>s.configurationSHA256=undefined]
])test('retained HQ proof rejects '+name,()=>{const s=input();change(s);assert.throws(()=>assertAcceptedGrubRetainedHq(s.snapshot,receipt,s.configuration,s.configurationSHA256));});
test('HQ must stay exact across the complete current Core proof window',()=>{
 const s=input(),after=structuredClone(s.snapshot);after.version.annotations['workers/message']='Changed during window';assert.throws(()=>assertSameAcceptedGrubRetainedHq(s.snapshot,after,receipt,s.configuration,s.configurationSHA256));
});
