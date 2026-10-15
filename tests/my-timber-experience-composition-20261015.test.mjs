import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {
 EXPERIENCE_BASE,EXPERIENCE_SOURCE,EXPERIENCE_KEY,EXPERIENCE_MANIFEST,
 EXPERIENCE_PATHS,EXPERIENCE_RECORD,EXPERIENCE_PINS,
 myTimberExperienceHistoricalView,verifyMyTimberExperience,
 originalExperienceCombined,originalExperienceRuntime,originalExperienceLiveHarness,EXPERIENCE_LIVE_HARNESS_EDITS
} from '../release/my-timber-experience-scope-20261015.mjs';
const git=(...args)=>execFileSync('git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6}).trimEnd();
const head=git('rev-parse','HEAD'),content=(r,p)=>execFileSync('git',['--no-replace-objects','show',(r==='HEAD'?head:r)+':'+p],{encoding:'utf8',maxBuffer:64e6});
const blob=(r,p)=>git('rev-parse',(r==='HEAD'?head:r)+':'+p);
const record=JSON.parse(content(head,EXPERIENCE_MANIFEST))[EXPERIENCE_KEY];
const context={head,read:blob,blob,content,diff:(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>git('merge-base','--is-ancestor',a,b)};
test('exact source is registered before any historical projection',()=>{
 const view=myTimberExperienceHistoricalView();
 assert.equal(view.rawHead,head);assert.equal(view.head,EXPERIENCE_BASE);
 assert.equal(view.record[EXPERIENCE_KEY],undefined);
 assert.equal(verifyMyTimberExperience(record,context),record);
 assert.equal(blob(EXPERIENCE_SOURCE,'member-experience/app-experience.mjs'),EXPERIENCE_PINS['member-experience/app-experience.mjs']);
});
for(const key of ['publicHomepageChanged','clinicalChanged','memberRecordsChanged','consentControlsRemoved','commercialSettingsChanged','nativeBinaryChanged','externalCommunicationsSent','newSpendingAuthorised','existingGatesWeakened','rollbackAuthorityBroadened','physicalHealthAcceptanceClaimed']){
 test('reject changed boundary '+key,()=>assert.throws(()=>verifyMyTimberExperience({...record,[key]:true},context),/Exact approved/));
}
test('reject additional source or declaration',()=>{
 assert.throws(()=>verifyMyTimberExperience({...record,paths:[...EXPERIENCE_PATHS,'unapproved.mjs']},context),/Exact approved/);
 assert.throws(()=>verifyMyTimberExperience({...record,approval:{...EXPERIENCE_RECORD.approval,scope:'anything'}},context),/Exact approved/);
});
test('reject changed payload, maintenance, tail and prior ledger',()=>{
 const path=EXPERIENCE_PATHS.find(p=>p.endsWith('app-experience.mjs'));
 assert.throws(()=>verifyMyTimberExperience(record,{...context,blob:(r,p)=>r==='HEAD'&&p===path?'0'.repeat(40):blob(r,p)}),/Current member-experience source drift/);
 assert.throws(()=>verifyMyTimberExperience(record,{...context,diff:(a,b)=>a===record.maintenanceSource&&b===head?[EXPERIENCE_MANIFEST,'unapproved.mjs']:context.diff(a,b)}),/registration tail/);
 assert.throws(()=>verifyMyTimberExperience(record,{...context,content:(r,p)=>r===head&&p===EXPERIENCE_MANIFEST?JSON.stringify({...JSON.parse(content(r,p)),unapproved:true}):content(r,p)}),/Every previous/);
});
test('reject a fresh reader that lies only about current source',()=>{
 const path='member-experience/app-experience.mjs';
 assert.throws(()=>myTimberExperienceHistoricalView((r,p)=>r==='HEAD'&&p===path?'forged':blob(r,p),{defaultReader:false}),/Fresh member-experience source drift/);
});
test('returned source reader also authenticates each current read',()=>{
 let corrupt=false;
 const view=myTimberExperienceHistoricalView((r,p)=>corrupt&&r==='HEAD'&&p==='member-experience/app-experience.mjs'?'forged':blob(r,p),{defaultReader:false});
 corrupt=true;
 assert.throws(()=>view.read('HEAD','member-experience/app-experience.mjs'),/Authentic current/);
});
test('every previous combined/runtime assertion byte is retained',()=>{
 for(const [p,restore]of [['release/combined-finite-scope-20261014.mjs',originalExperienceCombined],['release/approved-runtime-composition.mjs',originalExperienceRuntime]]){
  const bytes=content(head,p);assert.equal(restore(bytes),content(EXPERIENCE_BASE,p));
  assert.throws(()=>verifyMyTimberExperience(record,{...context,content:(r,path)=>r===head&&path===p?content(r,path)+'\n// an unrelated edit\n':content(r,path)}),/All original/);
 }
});
test('the actual source is read again after a protected current-reader change',()=>{
 let corrupt=false;
 const view=myTimberExperienceHistoricalView((r,p)=>corrupt&&r==='HEAD'&&p==='member-experience'?'forged':blob(r,p),{defaultReader:false});
 corrupt=true;assert.throws(()=>view.read('HEAD','member-experience'),/Authentic current/);
});

test('authenticate literal HEAD and immutable Git directory displays exactly',()=>{
 const source=(r,p)=>execFileSync('git',['--no-replace-objects','show',r+':'+p],{encoding:'utf8',maxBuffer:64e6});
 const view=myTimberExperienceHistoricalView(source,{defaultReader:false});
 const actual=view.read('HEAD','member-experience');
 assert.equal(actual,source(EXPERIENCE_BASE,'member-experience').split('\n').slice(1).join('\n'));
 assert.equal(view.read('HEAD','member-experience/grub-runtime.mjs'),source(EXPERIENCE_BASE,'member-experience/grub-runtime.mjs'));
});

test('legacy comparison projects authentic aliases and retains every forged HEAD value',async()=>{
 const {experienceLegacyComparisonRead}=await import('../release/my-timber-experience-scope-20261015.mjs');
 const path='member-experience/grub-runtime.mjs';
 const real=experienceLegacyComparisonRead(blob,head);
 assert.equal(real('HEAD',path),blob(EXPERIENCE_BASE,path));
 assert.equal(real(head,path),real('HEAD',path),'The authenticated immutable HEAD alias has the same comparison projection');
 const abstract=experienceLegacyComparisonRead((r,p)=>p,head);
 assert.equal(abstract('HEAD',path),path);
 const forged=experienceLegacyComparisonRead((r,p)=>r==='HEAD'&&p===path?'forged':blob(r,p),head);
 assert.equal(forged('HEAD',path),'forged');
 let changed=false;
 const fresh=experienceLegacyComparisonRead((r,p)=>changed&&r==='HEAD'&&p===path?'later-forged':blob(r,p),head);
 changed=true;assert.equal(fresh('HEAD',path),'later-forged');
});

test('all original member-tool tasks and acceptance assertions are retained exactly',()=>{
 for(const path of Object.keys(EXPERIENCE_LIVE_HARNESS_EDITS)){
  const bytes=content(head,path);assert.equal(originalExperienceLiveHarness(path,bytes),content(EXPERIENCE_BASE,path));
  assert.throws(()=>verifyMyTimberExperience(record,{...context,content:(r,p)=>r===head&&p===path?content(r,p)+'\n// unrelated acceptance change\n':content(r,p)}),/All original member-tool live acceptance/);
  const after=EXPERIENCE_LIVE_HARNESS_EDITS[path][0][1];
  assert.throws(()=>originalExperienceLiveHarness(path,bytes.replace(after,'')),/Exact counted member-tool/);
 }
});
