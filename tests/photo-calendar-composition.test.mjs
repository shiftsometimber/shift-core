import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {PHOTO_CALENDAR_BASE as base,PHOTO_CALENDAR_SOURCE as source,PHOTO_CALENDAR_BLOBS as blobs,PHOTO_CALENDAR_PATHS as paths,PHOTO_CALENDAR_MAINTENANCE as maintenance,PHOTO_CALENDAR_FLAGS as flags,PHOTO_CALENDAR_APPROVAL as approval,PHOTO_CALENDAR_HELPER as helper,PHOTO_CALENDAR_WORKFLOW_HOOK as hook,PHOTO_CALENDAR_RUNTIME_IMPORT as runtimeImport,PHOTO_CALENDAR_RUNTIME_BRANCH as runtimeBranch,PHOTO_CALENDAR_RUNTIME_FOOTER as runtimeFooter,originalPhotoCalendarRuntime,verifyPhotoCalendarSource as verify,originalPhotoCalendarFrontend as inverse,originalPhotoCalendarRootScope,originalPhotoCalendarRootTest,photoCalendarHistoricalView} from '../release/photo-calendar-scope.mjs';
const manifest='release/approved-runtime-composition.json';
const fixture=()=>({proof:'EXACT_EXISTING_PRIVATE_PHOTO_CALENDAR_REPAIR_20261014',base,source,paths,maintenancePaths:maintenance,maintenanceSource:'a'.repeat(40),integrationIssue:1065,releaseApproval:approval,selectedLondonDateRestored:true,futureInstantCutoffChanged:false,...Object.fromEntries(flags.map(f=>[f,false]))});
const before={
 'frontend/member/member-progress-v1.js':"prefix capturedAt:form.elements.on.value+'T00:00:00Z' suffix",
 'release/root-share-preview-scope.mjs':" const rawHead=git('rev-parse','HEAD'),current=JSON.parse(contents(rawHead,manifest)),repair=current.rootSharePreview;\n const rawBlob=(ref,p)=>git('rev-parse',(ref==='HEAD'?rawHead:ref)+':'+p),rawRead=defaultReader?rawBlob:reader;\n{record:current,rawHead,head:rawHead}\n{record,rawHead,head:repair.base}",
 'tests/root-share-preview-composition.test.mjs':"let current=readFileSync(p,'utf8');",
 '.github/workflows/shift-coach-integration.yml':'all original workflow permissions/gates/actions/timeouts',
 'release/approved-runtime-composition.mjs':'all original shared release source/status/deletion rules'
};
const current={
 'frontend/member/member-progress-v1.js':helper+before['frontend/member/member-progress-v1.js'].replace("capturedAt:form.elements.on.value+'T00:00:00Z'",'capturedAt:photoCalendarTimestamp(form.elements.on.value)'),
 'release/root-share-preview-scope.mjs':"import {photoCalendarHistoricalView} from './photo-calendar-scope.mjs';\n"+before['release/root-share-preview-scope.mjs'].replace(" const rawHead=git('rev-parse','HEAD'),current=JSON.parse(contents(rawHead,manifest)),repair=current.rootSharePreview;"," const calendar=photoCalendarHistoricalView(reader,{defaultReader}),rawHead=calendar.head,current=calendar.record,repair=current.rootSharePreview;").replace(" const rawBlob=(ref,p)=>git('rev-parse',(ref==='HEAD'?rawHead:ref)+':'+p),rawRead=defaultReader?rawBlob:reader;"," const rawBlob=calendar.blob,rawRead=calendar.read;").replaceAll('rawHead,head:','rawHead:calendar.rawHead,head:'),
 'tests/root-share-preview-composition.test.mjs':"import {photoCalendarHistoricalFile} from '../release/photo-calendar-scope.mjs';\nlet current=photoCalendarHistoricalFile(p,readFileSync(p,'utf8'));",
 '.github/workflows/shift-coach-integration.yml':hook+before['.github/workflows/shift-coach-integration.yml'],
 'release/approved-runtime-composition.mjs':runtimeImport+before['release/approved-runtime-composition.mjs']+runtimeBranch+runtimeFooter
};
const prior={memberConsentRepair:{releaseApproval:approval},rootSharePreview:{originalSourcePreserved:true}};
const options=()=>({head:'b'.repeat(40),read:(r,p)=>blobs[p]||'maintenance',blob:(r,p)=>blobs[p]||'maintenance',ancestor:()=>{},diff:a=>a===base?paths:a===source?maintenance:[manifest],content:(r,p)=>p===manifest?JSON.stringify(r===base?prior:{...prior,photoCalendarRepair:{}}):(r===base?before:current)[p]});
test('retained bounded photo authority, exact source/payload/maintenance and all prior approvals are required',()=>{verify(fixture(),options());assert.equal(paths.length,2);assert.equal(maintenance.length,7);assert.equal(approval.recordedAt,'2026-10-12T18:46:03Z');});
test('altered authority, unknown heads/scope/paths, expanded date cutoff or any broader control changes fail closed',()=>{
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{paths:paths.slice(1)},{maintenancePaths:maintenance.slice(1)},{releaseApproval:{...approval,scope:'all changes'}},{integrationIssue:1},{futureInstantCutoffChanged:true},{selectedLondonDateRestored:false},...flags.map(f=>({[f]:true}))])assert.throws(()=>verify({...fixture(),...patch},options()));
 for(const p of [...paths,...maintenance])for(const field of ['read','blob']){const o=options(),original=o[field];o[field]=(r,q)=>r==='HEAD'&&p===q?'tampered':original(r,q);assert.throws(()=>verify(fixture(),o),/drift/);}
});
test('unrelated source paths, missing ancestry, changed original approvals or bytes outside the correction are refused',()=>{
 for(const ref of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=a=>a===ref?[...diff(a),'unapproved']:diff(a);assert.throws(()=>verify(fixture(),o));}
 const a=options();a.ancestor=()=>{throw Error('missing ancestry')};assert.throws(()=>verify(fixture(),a));
 for(const p of Object.keys(before)){const o=options(),content=o.content;o.content=(r,q)=>r===o.head&&q===p?content(r,q)+'unapproved':content(r,q);assert.throws(()=>verify(fixture(),o));}
 const c=options(),content=c.content;c.content=(r,p)=>p===manifest&&r!==base?JSON.stringify({...prior,rootSharePreview:{changed:true},photoCalendarRepair:{}}):content(r,p);assert.throws(()=>verify(fixture(),c),/prior approvals/);
});
test('actual final source is verified before unchanged original member and sharing views are exposed',()=>{
 const view=photoCalendarHistoricalView();assert.equal(view.head,base);assert.deepEqual(view.record,JSON.parse(execFileSync('git',['show',base+':'+manifest],{encoding:'utf8'})));
 assert.equal(inverse(readFileSync('frontend/member/member-progress-v1.js','utf8')),execFileSync('git',['show',base+':frontend/member/member-progress-v1.js'],{encoding:'utf8'}));
 assert.equal(originalPhotoCalendarRootScope(readFileSync('release/root-share-preview-scope.mjs','utf8')),execFileSync('git',['show',base+':release/root-share-preview-scope.mjs'],{encoding:'utf8'}));
 assert.equal(originalPhotoCalendarRootTest(readFileSync('tests/root-share-preview-composition.test.mjs','utf8')),execFileSync('git',['show',base+':tests/root-share-preview-composition.test.mjs'],{encoding:'utf8'}));
 assert.equal(originalPhotoCalendarRuntime(readFileSync('release/approved-runtime-composition.mjs','utf8')),execFileSync('git',['show',base+':release/approved-runtime-composition.mjs'],{encoding:'utf8'}));
 for(const p of [...paths,...maintenance])assert.throws(()=>photoCalendarHistoricalView((r,q)=>r==='HEAD'&&q===p?'tampered':execFileSync('git',['rev-parse',r+':'+q],{encoding:'utf8'}).trim()),/drift/);
});
