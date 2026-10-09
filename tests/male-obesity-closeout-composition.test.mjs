import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyMaleObesityCloseout,verifyReconciledRelease,MALE_OBESITY_CLOSEOUT_BASE as base,MALE_OBESITY_CLOSEOUT_SOURCE as source,MALE_OBESITY_CLOSEOUT_PATHS as paths,MALE_OBESITY_CLOSEOUT_MAINTENANCE as maintenancePaths,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';
const flags=['homepageChanged','startHereFlowChanged','primaryNavigationChanged','memberDataChanged','checkoutChanged','externalCommunicationsSent','costsCommitted','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_MALE_OBESITY_CLOSEOUT_V1',base,source,paths:[...paths],maintenancePaths:[...maintenancePaths],maintenanceSource:'a'.repeat(40),ownerApproval:'Complete authorised release and prove the live male-obesity journey',failedRun:37997975670,failedGate:89,externalReviewerRequired:false,publicationStatus:'approved_for_guarded_release',...Object.fromEntries(flags.map(k=>[k,false]))});
const opts=()=>({head:'b'.repeat(40),read:()=> 'same',content:()=> '{}',ancestor:()=>{},diff:(a)=>a===base?[...paths]:a===source?[...maintenancePaths]:[RECONCILIATION_MANIFEST]});
test('closeout accepts only the exact failed-release repair and finite registration',()=>verifyMaleObesityCloseout(receipt(),opts()));
test('unknown source, missing receipt, broader authority and unrelated files fail closed',()=>{
 for(const patch of [{source:'f'.repeat(40)},{base:'f'.repeat(40)},{paths:[...paths,'unapproved.js']},{ownerApproval:'pending'},{failedRun:1},{failedGate:88},{externalReviewerRequired:true},{publicationStatus:'draft'},...flags.map(k=>({[k]:true}))])assert.throws(()=>verifyMaleObesityCloseout({...receipt(),...patch},opts()));
 assert.throws(()=>verifyMaleObesityCloseout(null,opts()));
 for(const ref of [base,source,'a'.repeat(40)]){const o=opts(),diff=o.diff;o.diff=a=>a===ref?[...diff(a),'unapproved.js']:diff(a);assert.throws(()=>verifyMaleObesityCloseout(receipt(),o));}
 const o=opts();o.ancestor=()=>{throw Error('wrong ancestry')};assert.throws(()=>verifyMaleObesityCloseout(receipt(),o));
});
test('every current payload and maintenance blob is immutable',()=>{for(const path of [...paths,...maintenancePaths]){const o=opts();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyMaleObesityCloseout(receipt(),o),/source drift/);}});
test('closeout cannot change, remove or replace any earlier ownership receipt',()=>{for(const previous of [{maleObesityPillar:{source:'original'}},{watchBacklogUpdate:{source:'original'}},{prior:'approved'}]){const o=opts();o.content=ref=>JSON.stringify(ref===base?previous:{});assert.throws(()=>verifyMaleObesityCloseout(receipt(),o),/Prior release receipts/);}});
test('registered real composition retains both historical male and Watch layers and rejects fresh reader drift',()=>{
 const c=verifyReconciledRelease();assert.equal(c.maleObesityReleaseCloseout.source,source);assert.equal(c.maleObesityPillar.source,'c2c295782697c98d149d3ac7f335d8028f413b4e');assert.equal(c.watchBacklogUpdate.source,'48020574fdda274d04901052942aacbe1502fb31');
 const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
 for(const path of ['obesity-awareness/production.mjs','shift-coach/cancelled-release-recovery.mjs','release/approved-runtime-composition.mjs'])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/source drift/);
});
