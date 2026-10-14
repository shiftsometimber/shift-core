import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import * as c from '../release/root-share-completion-scope.mjs';
const manifest='release/approved-runtime-composition.json',base=c.ROOT_SHARE_COMPLETION_BASE,source=c.ROOT_SHARE_COMPLETION_SOURCE,paths=c.ROOT_SHARE_COMPLETION_PATHS,maintenance=c.ROOT_SHARE_COMPLETION_MAINTENANCE;
const fixture=()=>({proof:'EXACT_ROOT_SHARE_PUBLIC_PRESERVATION_COMPLETION_20261014',base,source,paths,maintenancePaths:maintenance,maintenanceSource:'a'.repeat(40),integrationIssue:1065,releaseApproval:c.ROOT_SHARE_COMPLETION_APPROVAL,approvedRootImageURLsNormalised:2,fullOriginalPageComparisonRetained:true,failedRun:38490570380,restorationDeployment:'43c2cc4f-40da-413a-97bc-f93cce3f8cf6',...Object.fromEntries(c.ROOT_SHARE_COMPLETION_FLAGS.map(f=>[f,false]))});
const before={
 'tests/root-share-preview-rollback.test.mjs':c.COMPLETION_LEGACY_TEST_OLD,
 'member-experience/public-preservation.mjs':c.COMPLETION_PUBLIC_OLD,
 'shift-coach/recover-cancelled-release.mjs':'all prior recovery '+ 'if(before.id===ROOT_SHARE_SPEED_ROLLBACK.deployment){',
 'release/photo-calendar-scope.mjs':c.COMPLETION_CALENDAR_OLD1+'\n'+c.COMPLETION_CALENDAR_OLD2+'\nrecord:current,rawHead,head:rawHead\nreturn{record,rawHead,head:c.base',
 'tests/photo-calendar-composition.test.mjs':c.COMPLETION_TEST_OLD,
 'release/approved-runtime-composition.mjs':'all original source/status/deletion rules',
 '.github/workflows/shift-coach-integration.yml':'all original tests/assertions/timeouts/permissions'
};
const after={
 'tests/root-share-preview-rollback.test.mjs':c.COMPLETION_LEGACY_TEST_IMPORT+c.COMPLETION_LEGACY_TEST_NEW,
 'member-experience/public-preservation.mjs':c.COMPLETION_PUBLIC_IMPORT+c.COMPLETION_PUBLIC_NEW,
 'shift-coach/recover-cancelled-release.mjs':c.COMPLETION_RECOVERY_IMPORT+before['shift-coach/recover-cancelled-release.mjs'].replace('if(before.id===ROOT_SHARE_SPEED_ROLLBACK.deployment){',c.COMPLETION_RECOVERY_BRANCH+'if(before.id===ROOT_SHARE_SPEED_ROLLBACK.deployment){'),
 'release/photo-calendar-scope.mjs':c.COMPLETION_CALENDAR_IMPORT+before['release/photo-calendar-scope.mjs'].replace(c.COMPLETION_CALENDAR_OLD1,c.COMPLETION_CALENDAR_NEW1).replace(c.COMPLETION_CALENDAR_OLD2,c.COMPLETION_CALENDAR_NEW2).replaceAll('rawHead,head','rawHead:completion.rawHead,head'),
 'tests/photo-calendar-composition.test.mjs':c.COMPLETION_TEST_IMPORT+c.COMPLETION_TEST_NEW,
 'release/approved-runtime-composition.mjs':c.COMPLETION_RUNTIME_IMPORT+before['release/approved-runtime-composition.mjs']+c.COMPLETION_RUNTIME_BRANCH+c.COMPLETION_RUNTIME_FOOTER,
 '.github/workflows/shift-coach-integration.yml':c.COMPLETION_WORKFLOW_HOOK+c.COMPLETION_WORKFLOW_PATH_HOOK+before['.github/workflows/shift-coach-integration.yml']
};
const prior={rootSharePreview:{releaseApproval:c.ROOT_SHARE_COMPLETION_APPROVAL},photoCalendarRepair:{originalAuthority:true}};
const options=()=>({head:'b'.repeat(40),read:(r,p)=>c.ROOT_SHARE_COMPLETION_BLOBS[p]||'same',blob:(r,p)=>c.ROOT_SHARE_COMPLETION_BLOBS[p]||'same',ancestor:()=>{},diff:a=>a===base?paths:a===source?maintenance:[manifest],content:(r,p)=>p===manifest?JSON.stringify(r===base?prior:{...prior,rootShareCompletionRepair:{}}):(r===base?before:after)[p]});
test('exact approved two-URL diagnostic, original recovery/body/assertion bytes and prior receipts are required',()=>{c.verifyRootShareCompletionSource(fixture(),options());assert.equal(paths.length,7);assert.equal(maintenance.length,7);assert.equal(c.ROOT_SHARE_COMPLETION_APPROVAL.recordedAt,'2026-10-13T17:17:57Z');});
test('unknown source/paths, altered approval, extra URLs, weakened comparisons and broader controls fail closed',()=>{
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{paths:paths.slice(1)},{maintenancePaths:maintenance.slice(1)},{releaseApproval:{...c.ROOT_SHARE_COMPLETION_APPROVAL,scope:'all changes'}},{approvedRootImageURLsNormalised:3},{fullOriginalPageComparisonRetained:false},{failedRun:1},...c.ROOT_SHARE_COMPLETION_FLAGS.map(f=>({[f]:true}))])assert.throws(()=>c.verifyRootShareCompletionSource({...fixture(),...patch},options()));
 const oldMetric=options(),metricRead=oldMetric.read;oldMetric.read=(r,p)=>r==='HEAD'&&p==='member-experience/public-preservation.mjs'?'tampered':metricRead(r,p);assert.throws(()=>c.verifyRootShareCompletionSource(fixture(),oldMetric),/(?:Metrics maintenance source drift|Tablet wording source drift|Male-obesity source drift|Continuity-content source drift)/);
 for(const p of [...paths,...maintenance])for(const key of ['read','blob']){const o=options(),f=o[key];o[key]=(r,q)=>r==='HEAD'&&q===p?'tampered':f(r,q);assert.throws(()=>c.verifyRootShareCompletionSource(fixture(),o),/drift/);}
});
test('unlisted changes, missing ancestry, edited prior approvals, original comparators or bytes outside inverse hooks are rejected',()=>{
 for(const ref of [base,source,'a'.repeat(40)]){const o=options(),f=o.diff;o.diff=a=>a===ref?[...f(a),'unapproved']:f(a);assert.throws(()=>c.verifyRootShareCompletionSource(fixture(),o));}
 for(const key of ['read','blob']){const o=options(),f=o[key];o[key]=(r,p)=>r==='HEAD'&&p==='.github/workflows/cloudflare-production-promote.yml'?'drift':f(r,p);assert.throws(()=>c.verifyRootShareCompletionSource(fixture(),o),/source drift/);}
 for(const key of ['read','blob']){const o=options(),f=o[key];o[key]=(r,p)=>r==='HEAD'&&p==='shift-coach/worker.mjs'?'drift':f(r,p);assert.throws(()=>c.verifyRootShareCompletionSource(fixture(),o),/Male-obesity source drift: shift-coach\/worker.mjs/);}
 const a=options();a.ancestor=()=>{throw Error('no ancestry')};assert.throws(()=>c.verifyRootShareCompletionSource(fixture(),a));
 for(const p of Object.keys(before)){const o=options(),f=o.content;o.content=(r,q)=>r===o.head&&q===p?f(r,q)+'unapproved':f(r,q);assert.throws(()=>c.verifyRootShareCompletionSource(fixture(),o));}
 const o=options(),f=o.content;o.content=(r,p)=>p===manifest&&r!==base?JSON.stringify({...prior,photoCalendarRepair:{changed:true},rootShareCompletionRepair:{}}):f(r,p);assert.throws(()=>c.verifyRootShareCompletionSource(fixture(),o),/prior identities/);
});
test('actual exact source is checked before any historical view or A/M path admission',()=>{
 const v=c.rootShareCompletionHistoricalView();assert.equal(v.head,base);assert.deepEqual(v.record,JSON.parse(execFileSync('git',['show',base+':'+manifest],{encoding:'utf8'})));
 for(const[p,inverse]of [['member-experience/public-preservation.mjs',c.originalCompletionPublic],['shift-coach/recover-cancelled-release.mjs',c.originalCompletionRecovery],['release/photo-calendar-scope.mjs',c.originalCompletionCalendar],['tests/photo-calendar-composition.test.mjs',c.originalCompletionCalendarTest],['release/approved-runtime-composition.mjs',c.originalCompletionRuntime],['.github/workflows/shift-coach-integration.yml',c.originalCompletionWorkflow],['tests/root-share-preview-rollback.test.mjs',c.originalCompletionLegacyTest]])assert.equal(inverse(readFileSync(p,'utf8')),execFileSync('git',['show',base+':'+p],{encoding:'utf8'}));
 for(const p of [...paths,...maintenance])assert.throws(()=>c.rootShareCompletionHistoricalView((r,q)=>r==='HEAD'&&q===p?'tampered':execFileSync('git',['rev-parse',r+':'+q],{encoding:'utf8'}).trim()),/drift/);
 const raw=readFileSync('release/approved-runtime-composition.mjs','utf8');assert(raw.includes('if(!reconciliationPath(path))return false;'));assert(raw.includes("Unexpected approved sharing completion file status: "));assert(raw.includes("(existed?['A','M']:['A']).includes(status)"));
});
