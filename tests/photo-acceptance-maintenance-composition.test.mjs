import {myTimberWeekHistoricalView} from '../release/my-timber-week-scope.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import * as c from '../release/photo-acceptance-maintenance-scope.mjs';
const manifest='release/approved-runtime-composition.json',base=c.PHOTO_ACCEPTANCE_BASE,source=c.PHOTO_ACCEPTANCE_SOURCE,paths=c.PHOTO_ACCEPTANCE_PATHS,maintenance=c.PHOTO_ACCEPTANCE_MAINTENANCE,head='b'.repeat(40),maint='a'.repeat(40);
const fixture=()=>({proof:'EXACT_RETAINED_PHOTO_ACCEPTANCE_MAINTENANCE_20261014',base,source,paths,maintenancePaths:maintenance,maintenanceSource:maint,integrationIssue:1065,existingApprovalReference:c.PHOTO_ACCEPTANCE_APPROVAL,releaseApproval:c.PHOTO_ACCEPTANCE_RELEASE_APPROVAL,verificationEvidence:c.PHOTO_ACCEPTANCE_EVIDENCE,...Object.fromEntries(c.PHOTO_ACCEPTANCE_FLAGS.map(f=>[f,false]))});
const before={
 'release/root-share-completion-scope.mjs':c.ROOT_HEAD_OLD+'\n'+c.ROOT_READ_OLD+'\n'+c.ROOT_FILE_OLD+'\n'+c.ROOT_RAW_OLD+'\n'+c.ROOT_RAW_OLD,
 'tests/root-share-completion-composition.test.mjs':c.TEST_OLD,
 'release/approved-runtime-composition.mjs':'every original status, source and destructive-change assertion',
 '.github/workflows/shift-coach-integration.yml':'every original workflow step, trigger, permission and timeout'
};
const after={
 'release/root-share-completion-scope.mjs':c.ROOT_IMPORT+c.ROOT_HEAD_NEW+'\n'+c.ROOT_READ_NEW+'\n'+c.ROOT_FILE_NEW+'\n'+c.ROOT_RAW_NEW+'\n'+c.ROOT_RAW_NEW,
 'tests/root-share-completion-composition.test.mjs':c.TEST_IMPORT+c.TEST_NEW,
 'release/approved-runtime-composition.mjs':c.RUNTIME_IMPORT+before['release/approved-runtime-composition.mjs']+c.RUNTIME_BRANCH+c.RUNTIME_FOOTER,
 '.github/workflows/shift-coach-integration.yml':c.WORKFLOW_HOOK+before['.github/workflows/shift-coach-integration.yml']
};
const prior={memberConsentRepair:{releaseApproval:c.PHOTO_ACCEPTANCE_APPROVAL},rootShareCompletionRepair:{prior:true},notificationHistory:['retained']};
const options=()=>({head,read:(r,p)=>c.PHOTO_ACCEPTANCE_BLOBS[p]||'same',blob:(r,p)=>c.PHOTO_ACCEPTANCE_BLOBS[p]||'same',ancestor:()=>{},diff:(a,b)=>a===base?(b===source?paths:[...paths,...maintenance,manifest]):a===source?maintenance:[manifest],content:(r,p)=>p===manifest?JSON.stringify(r===base?prior:{...prior,photoAcceptanceMaintenance:fixture()}):(r===base?before:after)[p]});
test('only retained three-file correction with exact Deploy approval and original receipts is admitted',()=>{c.verifyPhotoAcceptanceMaintenance(fixture(),options());assert.equal(paths.length,3);assert.equal(maintenance.length,7);assert.equal(c.PHOTO_ACCEPTANCE_EVIDENCE.singleVisibilityDeadlineMs,15000);});
test('unknown source, scope, approval, evidence or broader authority fails closed',()=>{
 for(const patch of [{proof:'other'},{base:'f'.repeat(40)},{source:'f'.repeat(40)},{integrationIssue:1},{paths:paths.slice(1)},{maintenancePaths:maintenance.slice(1)},{maintenanceSource:'bad'},{existingApprovalReference:{...c.PHOTO_ACCEPTANCE_APPROVAL,instruction:'anything'}},{releaseApproval:{...c.PHOTO_ACCEPTANCE_RELEASE_APPROVAL,scope:'all releases'}},{verificationEvidence:{...c.PHOTO_ACCEPTANCE_EVIDENCE,singleVisibilityDeadlineMs:30000}},...c.PHOTO_ACCEPTANCE_FLAGS.map(f=>({[f]:true}))])assert.throws(()=>c.verifyPhotoAcceptanceMaintenance({...fixture(),...patch},options()));
});
test('unrelated payload, maintenance, tail or ancestry is rejected',()=>{
 for(const ref of [base,source,maint]){const o=options(),f=o.diff;o.diff=(a,b)=>a===ref?[...f(a,b),'unapproved.mjs']:f(a,b);assert.throws(()=>c.verifyPhotoAcceptanceMaintenance(fixture(),o));}
 const o=options();o.ancestor=()=>{throw Error('not ancestor')};assert.throws(()=>c.verifyPhotoAcceptanceMaintenance(fixture(),o));
});
test('frozen evidence, source, maintenance and fresh caller reads cannot drift',()=>{
 for(const p of paths)for(const ref of [source,c.PHOTO_ACCEPTANCE_EVIDENCE.source,'HEAD']){const o=options(),f=o.blob;o.blob=(r,q)=>r===ref&&q===p?'tampered':f(r,q);assert.throws(()=>c.verifyPhotoAcceptanceMaintenance(fixture(),o),/drift/);}
 for(const p of [...paths,...maintenance])for(const key of ['read','blob']){const o=options(),f=o[key];o[key]=(r,q)=>r==='HEAD'&&q===p?'tampered':f(r,q);assert.throws(()=>c.verifyPhotoAcceptanceMaintenance(fixture(),o),/drift/);}
});
test('every original gate byte and all previous approvals and evidence remain required',()=>{
 for(const p of Object.keys(before)){const o=options(),f=o.content;o.content=(r,q)=>r===head&&q===p?f(r,q)+'unapproved':f(r,q);assert.throws(()=>c.verifyPhotoAcceptanceMaintenance(fixture(),o));}
 const o=options(),f=o.content;o.content=(r,p)=>p===manifest&&r===head?JSON.stringify({...prior,notificationHistory:[],photoAcceptanceMaintenance:fixture()}):f(r,p);assert.throws(()=>c.verifyPhotoAcceptanceMaintenance(fixture(),o),/prior identities/);
 for(const [inverse,p] of [[c.originalPhotoAcceptanceRoot,'release/root-share-completion-scope.mjs'],[c.originalPhotoAcceptanceTest,'tests/root-share-completion-composition.test.mjs'],[c.originalPhotoAcceptanceRuntime,'release/approved-runtime-composition.mjs'],[c.originalPhotoAcceptanceWorkflow,'.github/workflows/shift-coach-integration.yml']]){assert.equal(inverse(after[p]),before[p]);assert.throws(()=>inverse(before[p]));assert.throws(()=>inverse(after[p]+after[p]));}
});
test('actual registered source verifies first and original protected runtime remains byte-identical',()=>{
 const v=c.photoAcceptanceHistoricalView();assert.equal(v.head,base);assert.deepEqual(v.record,JSON.parse(execFileSync('git',['show',base+':'+manifest],{encoding:'utf8'})));
 for(const p of ['frontend','public','shift-coach/worker.mjs','.github/workflows/cloudflare-production-promote.yml'])assert.equal(execFileSync('git',['rev-parse',myTimberWeekHistoricalView().head+':'+p],{encoding:'utf8'}),execFileSync('git',['rev-parse',base+':'+p],{encoding:'utf8'}));
 for(const p of [...paths,...maintenance])assert.throws(()=>c.photoAcceptanceHistoricalView((r,q)=>r==='HEAD'&&q===p?'tampered':execFileSync('git',['rev-parse',r+':'+q],{encoding:'utf8'}).trim()),/drift/);
 const raw=readFileSync('release/approved-runtime-composition.mjs','utf8');assert(raw.includes('if(!reconciliationPath(path))return false;'));assert(raw.includes("Unexpected approved sharing completion file status: "));assert(raw.includes("Unexpected photo acceptance maintenance status: "));
});
