import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {assertQuestionnaireRecord,PATHS,MAINTENANCE,PREPARED_BASE,PREPARED_FIX,PAYLOAD,PAYLOAD_TREE} from '../release/questionnaire-handover-source-20261016.mjs';
import {assertProvider,assertPrepared,assertOwned,assertStock,assertLane,latestDeployment,settleOwnedCleanup,LANE} from '../release/questionnaire-handover-owned-release-20261016.mjs';
const policy=JSON.parse(readFileSync(new URL('../release/questionnaire-handover-policy-20261016.json',import.meta.url)));
const id='11111111-1111-4111-8111-111111111111',next='22222222-2222-4222-8222-222222222222';
function record(){return {proof:'EXACT_NONCLINICAL_QUESTIONNAIRE_HANDOVER_20261016',preparedBase:PREPARED_BASE,preparedFix:PREPARED_FIX,payloadSource:PAYLOAD,payloadTree:PAYLOAD_TREE,base:policy.acceptedBase.source,baseTree:policy.acceptedBase.tree,maintenanceSource:'1'.repeat(40),paths:[...PATHS],maintenancePaths:[...MAINTENANCE],partnerApprovedQuestionnaire:false,partnerTestPassed:false,...Object.fromEntries(['homepageChanged','treatmentSalesActivated','clinicalRulesAdded','predictiveModelsActivated','r4Activated','stockChanged','configurationChanged','communicationsSent','sourceGuardsRelaxed'].map(x=>[x,false]))};}
function snapshot(){return {deployment:{id,versions:[{version_id:id,percentage:100}]},version:{id,resources:{bindings:[{name:'DB',type:'d1',id:'synthetic'},{name:'MEMBER_GP_DIRECTORY_V2_ENABLED',type:'plain_text',text:'false'}],script_runtime:{compatibility_date:'2026-10-01'}}}};}
const expected={deployment:id,version:id,gpEnabled:false};
test('native Git visibility, environment, history and real working-byte guards are adopted whole from the accepted GP source',()=>{
 const original=execFileSync('/usr/bin/git',['--no-replace-objects','show','d0e07e06dd7db344de86a03f2bf22986efeb04ff:release/gp-member-code-direct-scope-20261016.mjs'],{encoding:'utf8',maxBuffer:1e6}),current=readFileSync(new URL('../release/questionnaire-handover-source-20261016.mjs',import.meta.url),'utf8');
 const start='const selectorVariables=';
 assert.equal(current.slice(current.indexOf(start),current.indexOf('export function verifyQuestionnaireSource()')).trimEnd(),original.slice(original.indexOf(start),original.indexOf('function inverse(')).trimEnd());
});
test('finite source registration preserves original approval and rejects broadened clinical or source claims',()=>{
 assertQuestionnaireRecord(record(),policy);
 for(const change of [{partnerApprovedQuestionnaire:true},{partnerTestPassed:true},{sourceGuardsRelaxed:true},{r4Activated:true},{unreviewedApproval:true},{base:'a'.repeat(40)},{payloadSource:'b'.repeat(40)},{paths:[...PATHS,'worker-entry-v6.js']}])assert.throws(()=>assertQuestionnaireRecord({...record(),...change},policy));
 for(const change of [{script:'foreign-worker'},{config:'wrangler.coaching.jsonc'},{source:'b'.repeat(40)},{run:1}]){const p=structuredClone(policy);Object.assign(p.predecessors.core,change);assert.throws(()=>assertQuestionnaireRecord(record(),p));}
});
test('provider traffic must be whole, exact, inactive for the provisional contract and preserve the current GP state',()=>{
 assertProvider(snapshot(),expected);
 for(const mutate of [s=>s.deployment.versions.push({version_id:next,percentage:0}),s=>s.deployment.versions[0].percentage=99,s=>s.version.resources.bindings.push({name:'PHARMACY_CLINICAL_INTAKE_URL',type:'plain_text',text:'https://unapproved.example.test'}),s=>s.version.resources.bindings.push({name:'PHARMACY_CLINICAL_INTAKE_URL',type:'secret_text'}),s=>s.version.resources.bindings[1].text='true',s=>s.version.resources.bindings.push({name:'R4_ENABLED',type:'plain_text',text:'true'})]){const s=snapshot();mutate(s);assert.throws(()=>assertProvider(s,expected));}
 const enabled=snapshot();enabled.version.resources.bindings[1].text='true';assertProvider(enabled,{...expected,gpEnabled:true});
});
test('upload validation rejects changed bindings, runtime settings, bundle bytes or bundle hash',()=>{
 const before=snapshot();const prepared={version:structuredClone(before.version),bundle:{sha256:'same',bytes:100},local:{sha256:'same',bytes:100}};prepared.version.id=next;assertPrepared(prepared,before);
 for(const mutate of [s=>s.version.resources.bindings[0].id='foreign',s=>s.version.resources.script_runtime.compatibility_date='2026-10-02',s=>s.bundle.bytes++,s=>s.bundle.sha256='different']){const p=structuredClone(prepared);mutate(p);assert.throws(()=>assertPrepared(p,before));}
});
test('foreign deployment or attempt cannot be attributed to this transaction or rolled back',()=>{
 const active=snapshot().deployment,receipt={source:'a'.repeat(40),run:20,attempt:1,deploymentId:id,versionId:id};assertOwned(active,receipt,receipt.source,20,1);
 assert.throws(()=>assertOwned({...active,id:next},receipt,receipt.source,20,1));assert.throws(()=>assertOwned(active,receipt,receipt.source,20,2));
});
test('stock window compares complete rows and configuration without restoration or invented historical provenance',()=>{
 const before={rows:[{id:1,stock:2,reserved:0,updated_at:'original'}],config:'exact'};assertStock(before,structuredClone(before));
 for(const after of [{...before,config:'changed'},{...before,rows:[{...before.rows[0],updated_at:'different'}]},{...before,rows:[]}])assert.throws(()=>assertStock(before,after));
});
test('only the exact existing questionnaire branch, workflow, source and run can deploy',()=>{
 const run={id:20,run_attempt:1,head_sha:'a'.repeat(40),head_branch:LANE.branch,event:'push',path:LANE.workflow,repository:{full_name:LANE.repository}};
 assertLane(run,{sha:run.head_sha,runId:20,attempt:1});
 for(const change of [{head_branch:'main'},{path:'.github/workflows/cloudflare-production-promote.yml'},{head_sha:'b'.repeat(40)},{run_attempt:2},{event:'workflow_dispatch'}])assert.throws(()=>assertLane({...run,...change},{sha:run.head_sha,runId:20,attempt:1}));
});
test('cleanup records every failed owned restoration and continues across independent owners',async()=>{
 const seen=[];const out=await settleOwnedCleanup(['a','b'],async key=>{seen.push(key);if(key==='a')throw Error('synthetic refusal');return {key,action:'restore'}});assert.deepEqual(seen,['a','b']);assert.equal(out[0].action,'refused_or_failed');assert.equal(out[1].action,'restore');
});
test('split or absent deployment inventories fail closed',()=>{assert.throws(()=>latestDeployment([]));assert.throws(()=>latestDeployment([{...snapshot().deployment,created_on:new Date().toISOString(),versions:[{version_id:id,percentage:50},{version_id:next,percentage:50}]}]));});
