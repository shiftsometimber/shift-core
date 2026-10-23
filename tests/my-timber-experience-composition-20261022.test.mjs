import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {
 EXPERIENCE_BASE,EXPERIENCE_SOURCE,EXPERIENCE_KEY,EXPERIENCE_MANIFEST,
 EXPERIENCE_PATHS,EXPERIENCE_MAINTENANCE,EXPERIENCE_RECORD,EXPERIENCE_PINS,
 myTimberExperienceHistoricalView,verifyMyTimberExperience,
 originalExperienceMainRelease,originalExperienceRuntime,originalExperienceNavigation,originalExperienceMainTest,originalExperienceHealthTest,originalExperienceFiniteGrowth,originalExperienceRootShare,
 EXPERIENCE_MAIN_AFTER,EXPERIENCE_RUNTIME_BRANCH,EXPERIENCE_RUNTIME_VERIFY_AFTER,EXPERIENCE_RUNTIME_MEMBER_AFTER,EXPERIENCE_HEALTH_TEST_AFTER,EXPERIENCE_FINITE_GROWTH_AFTER
} from '../release/my-timber-experience-scope-20261022.mjs';

const native=(...args)=>execFileSync('git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6});
const git=(...args)=>native(...args).trimEnd();
const head=git('rev-parse','HEAD');
const content=(r,p)=>native('show',(r==='HEAD'?head:r)+':'+p);
const blob=(r,p)=>git('rev-parse',(r==='HEAD'?head:r)+':'+p);
const diff=(a,b)=>git('diff','--no-renames','--name-only',a,b).split('\n').filter(Boolean);
const ancestor=(a,b)=>{native('merge-base','--is-ancestor',a,b);return true;};
const record=JSON.parse(content(head,EXPERIENCE_MANIFEST))[EXPERIENCE_KEY];
const context={head,read:blob,blob,content,diff,ancestor};

test('exact approved My Timber source is registered before prior release scopes',()=>{
 assert.equal(EXPERIENCE_PATHS.length,40);
 assert.deepEqual(EXPERIENCE_PATHS,Object.keys(EXPERIENCE_PINS).sort());
 assert.equal(verifyMyTimberExperience(record,context),record);
 const view=myTimberExperienceHistoricalView();
 assert.equal(view.rawHead,head);assert.equal(view.head,EXPERIENCE_BASE);
 assert.equal(view.record[EXPERIENCE_KEY],undefined);
 assert.equal(view.blob('HEAD','member-experience/entry.mjs'),blob(EXPERIENCE_BASE,'member-experience/entry.mjs'));
 assert.equal(blob(EXPERIENCE_SOURCE,'member-experience/app-experience.mjs'),EXPERIENCE_PINS['member-experience/app-experience.mjs']);
});

for(const key of ['publicHomepageChanged','clinicalChanged','memberRecordsChanged','consentControlsRemoved','commercialSettingsChanged','nativeBinaryChanged','externalCommunicationsSent','newSpendingAuthorised','existingGatesWeakened','rollbackAuthorityBroadened','physicalHealthAcceptanceClaimed']){
 test('reject changed protected boundary '+key,()=>assert.throws(()=>verifyMyTimberExperience({...record,[key]:true},context),/Exact approved/));
}

test('reject expanded payload, maintenance or authority',()=>{
 assert.throws(()=>verifyMyTimberExperience({...record,paths:[...EXPERIENCE_PATHS,'unapproved.mjs']},context),/Exact approved/);
 assert.throws(()=>verifyMyTimberExperience({...record,maintenancePaths:[...EXPERIENCE_MAINTENANCE,'unapproved.mjs']},context),/Exact approved/);
 assert.throws(()=>verifyMyTimberExperience({...record,approval:{...EXPERIENCE_RECORD.approval,scope:'anything'}},context),/Exact approved/);
});

test('reject changed payload, registration tail and prior ledger',()=>{
 const path='member-experience/app-experience.mjs';
 assert.throws(()=>verifyMyTimberExperience(record,{...context,blob:(r,p)=>r===head&&p===path?'0'.repeat(40):blob(r,p)}),/Current member-experience source drift/);
 assert.throws(()=>verifyMyTimberExperience(record,{...context,diff:(a,b)=>a===record.maintenanceSource&&b===head?[EXPERIENCE_MANIFEST,'unapproved.mjs']:diff(a,b)}),/registration tail/);
 assert.throws(()=>verifyMyTimberExperience(record,{...context,content:(r,p)=>r===head&&p===EXPERIENCE_MANIFEST?JSON.stringify({...JSON.parse(content(r,p)),unapproved:true}):content(r,p)}),/Every previous/);
});

test('every prior release/runtime/navigation byte restores and altered hooks reject',()=>{
 const mainPath='release/main-release-readiness-scope-20261021.mjs',runtimePath='release/approved-runtime-composition.mjs',navigationPath='release/recorded-week-navigation-outer-frame-20261018.mjs',mainTestPath='tests/main-release-readiness-scope-20261021.test.mjs',healthTestPath='tests/health-vision-scope-20261021.test.mjs',finiteGrowthPath='release/finite-growth-scope.mjs',rootSharePath='release/root-share-preview-scope.mjs';
 assert.equal(originalExperienceMainRelease(content(head,mainPath)),content(EXPERIENCE_BASE,mainPath));
 assert.equal(originalExperienceRuntime(content(head,runtimePath)),content(EXPERIENCE_BASE,runtimePath));
 assert.equal(originalExperienceNavigation(content(head,navigationPath)),content(EXPERIENCE_BASE,navigationPath));
 assert.equal(originalExperienceMainTest(content(head,mainTestPath)),content(EXPERIENCE_BASE,mainTestPath));
 assert.equal(originalExperienceHealthTest(content(head,healthTestPath)),content(EXPERIENCE_BASE,healthTestPath));
 assert.equal(originalExperienceFiniteGrowth(content(head,finiteGrowthPath)),content(EXPERIENCE_BASE,finiteGrowthPath));
 assert.equal(originalExperienceRootShare(content(head,rootSharePath)),content(EXPERIENCE_BASE,rootSharePath));
 assert.throws(()=>originalExperienceMainRelease(content(head,mainPath).replace(EXPERIENCE_MAIN_AFTER,EXPERIENCE_MAIN_AFTER+EXPERIENCE_MAIN_AFTER)),/One exact/);
 assert.throws(()=>originalExperienceRuntime(content(head,runtimePath).replace(EXPERIENCE_RUNTIME_BRANCH,'')),/One exact/);
 assert.throws(()=>originalExperienceRuntime(content(head,runtimePath).replace(EXPERIENCE_RUNTIME_VERIFY_AFTER,EXPERIENCE_RUNTIME_VERIFY_AFTER+EXPERIENCE_RUNTIME_VERIFY_AFTER)),/One exact/);
 assert.throws(()=>originalExperienceRuntime(content(head,runtimePath).replace(EXPERIENCE_RUNTIME_MEMBER_AFTER,'')),/One exact/);
 assert.throws(()=>originalExperienceHealthTest(content(head,healthTestPath).replace(EXPERIENCE_HEALTH_TEST_AFTER,'')),/One exact/);
 assert.throws(()=>originalExperienceFiniteGrowth(content(head,finiteGrowthPath).replace(EXPERIENCE_FINITE_GROWTH_AFTER,EXPERIENCE_FINITE_GROWTH_AFTER+EXPERIENCE_FINITE_GROWTH_AFTER)),/One exact/);
});

test('fresh supplied readers cannot conceal a current source change',()=>{
 const path='member-experience/app-experience.mjs';
 assert.throws(()=>myTimberExperienceHistoricalView((r,p)=>(r==='HEAD'||r===head)&&p===path?'forged':blob(r,p),{defaultReader:false}),/Fresh member-experience source drift|Authentic current/);
});

test('coherent opaque readers retain their original contract through the historical projection',()=>{
 const view=myTimberExperienceHistoricalView(()=>'same opaque fixture',{defaultReader:false});
 assert.equal(view.read('HEAD','member-experience/entry.mjs'),'same opaque fixture');
});
