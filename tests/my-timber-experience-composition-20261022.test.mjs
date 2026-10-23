import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {
 EXPERIENCE_BASE,EXPERIENCE_SOURCE,EXPERIENCE_KEY,EXPERIENCE_MANIFEST,
 EXPERIENCE_PATHS,EXPERIENCE_MAINTENANCE,EXPERIENCE_RECORD,EXPERIENCE_PINS,
 EXPERIENCE_CURRENT_MAIN_BASE,EXPERIENCE_CURRENT_MAIN_SOURCE,EXPERIENCE_CURRENT_MAIN_PATHS,EXPERIENCE_CURRENT_MAIN_PINS,EXPERIENCE_CURRENT_MAIN_COMPOSED_PINS,EXPERIENCE_CURRENT_MAIN_TEST_BEFORE,EXPERIENCE_CURRENT_MAIN_TEST_AFTER,
 myTimberExperienceHistoricalView,verifyMyTimberExperience,
 originalExperienceCurrentMainSharedFooterTest,originalExperienceMainRelease,originalExperienceRuntime,originalExperienceNavigation,originalExperienceMainTest,originalExperienceHealthTest,originalExperienceFiniteGrowth,originalExperienceRootShare,originalExperienceMemberDesignScope,originalExperienceAppScope,originalExperiencePwaServiceWorker,originalExperienceTabs,
 EXPERIENCE_MAIN_AFTER,EXPERIENCE_RUNTIME_BRANCH,EXPERIENCE_RUNTIME_VERIFY_AFTER,EXPERIENCE_RUNTIME_MEMBER_AFTER,EXPERIENCE_HEALTH_TEST_AFTER,EXPERIENCE_FINITE_GROWTH_AFTER
} from '../release/my-timber-experience-scope-20261022.mjs';

const native=(...args)=>execFileSync('git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6});
const git=(...args)=>native(...args).trimEnd();
const head=git('rev-parse','HEAD');
const content=(r,p)=>native('show',(r==='HEAD'?head:r)+':'+p);
const blob=(r,p)=>git('rev-parse',(r==='HEAD'?head:r)+':'+p);
const diff=(a,b)=>git('diff','--no-renames','--name-only',a,b).split('\n').filter(Boolean);
const ancestor=(a,b)=>{native('merge-base','--is-ancestor',a,b);return true;};
const object=text=>execFileSync('git',['--no-replace-objects','hash-object','--stdin'],{encoding:'utf8',input:text}).trimEnd();
const currentMainApplied=(()=>{try{return ancestor(EXPERIENCE_CURRENT_MAIN_SOURCE,head);}catch{return false;}})();
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

test('exact current-main footer refactor composes without changing either approved source',()=>{
 assert.deepEqual(diff(EXPERIENCE_CURRENT_MAIN_BASE,EXPERIENCE_CURRENT_MAIN_SOURCE),EXPERIENCE_CURRENT_MAIN_PATHS);
 for(const [path,pin] of Object.entries(EXPERIENCE_CURRENT_MAIN_PINS))assert.equal(blob(EXPERIENCE_CURRENT_MAIN_SOURCE,path),pin);
 const path='tests/shared-footer.test.mjs';
 const product=content(EXPERIENCE_SOURCE,path);
 const composed=product.replace(EXPERIENCE_CURRENT_MAIN_TEST_BEFORE,EXPERIENCE_CURRENT_MAIN_TEST_AFTER);
 assert.equal(product.split(EXPERIENCE_CURRENT_MAIN_TEST_BEFORE).length,2);
 assert.equal(object(composed),EXPERIENCE_CURRENT_MAIN_COMPOSED_PINS[path]);
 assert.equal(originalExperienceCurrentMainSharedFooterTest(composed),product);
 assert.throws(()=>originalExperienceCurrentMainSharedFooterTest(composed.replace(EXPERIENCE_CURRENT_MAIN_TEST_AFTER,EXPERIENCE_CURRENT_MAIN_TEST_AFTER+EXPERIENCE_CURRENT_MAIN_TEST_AFTER)),/One exact|hook required/);
});

test('actual pull-request merge projects the exact current-main tail for historical guards',{skip:!currentMainApplied},()=>{
 assert.equal(verifyMyTimberExperience(record,context),record);
 const view=myTimberExperienceHistoricalView();
 assert.equal(view.blob('HEAD','worker-entry-v6.js'),blob(EXPERIENCE_CURRENT_MAIN_BASE,'worker-entry-v6.js'));
 assert.equal(view.blob('HEAD','tests/shared-footer.test.mjs'),blob(EXPERIENCE_BASE,'tests/shared-footer.test.mjs'));
 assert.equal(view.affected('worker-entry-v6.js'),true);
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
 const mainPath='release/main-release-readiness-scope-20261021.mjs',runtimePath='release/approved-runtime-composition.mjs',navigationPath='release/recorded-week-navigation-outer-frame-20261018.mjs',mainTestPath='tests/main-release-readiness-scope-20261021.test.mjs',healthTestPath='tests/health-vision-scope-20261021.test.mjs',finiteGrowthPath='release/finite-growth-scope.mjs',rootSharePath='release/root-share-preview-scope.mjs',memberDesignPath='release/member-design-scope.mjs',appScopePath='release/app-scope.mjs';
 assert.equal(originalExperienceMainRelease(content(head,mainPath)),content(EXPERIENCE_BASE,mainPath));
 assert.equal(originalExperienceRuntime(content(head,runtimePath)),content(EXPERIENCE_BASE,runtimePath));
 assert.equal(originalExperienceNavigation(content(head,navigationPath)),content(EXPERIENCE_BASE,navigationPath));
 assert.equal(originalExperienceMainTest(content(head,mainTestPath)),content(EXPERIENCE_BASE,mainTestPath));
 assert.equal(originalExperienceHealthTest(content(head,healthTestPath)),content(EXPERIENCE_BASE,healthTestPath));
 assert.equal(originalExperienceFiniteGrowth(content(head,finiteGrowthPath)),content(EXPERIENCE_BASE,finiteGrowthPath));
 assert.equal(originalExperienceRootShare(content(head,rootSharePath)),content(EXPERIENCE_BASE,rootSharePath));
 assert.equal(originalExperienceMemberDesignScope(content(head,memberDesignPath)),content(EXPERIENCE_BASE,memberDesignPath));
 assert.equal(originalExperienceAppScope(content(head,appScopePath)),content(EXPERIENCE_BASE,appScopePath));
 assert.throws(()=>originalExperienceMemberDesignScope(content(head,memberDesignPath).replace(" validateMemberLayoutPayload(read,"," validateMemberLayoutPayload(read, validateMemberLayoutPayload(read,")),/One exact/);
 assert.throws(()=>originalExperienceAppScope(content(head,appScopePath).replace(" validateMemberDesignSource(myTimber.read);"," validateMemberDesignSource(myTimber.read); validateMemberDesignSource(myTimber.read);")),/One exact/);
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

test('supplied readers retain the HEAD alias outside the My Timber overlay',()=>{
 const path='scripts/reconcile-organic-measurement.mjs';
 const view=myTimberExperienceHistoricalView((r,p)=>r==='HEAD'&&p===path?'caller HEAD sentinel':blob(r,p),{defaultReader:false});
 assert.equal(view.read('HEAD',path),'caller HEAD sentinel');
});

test('footer guard receives only the exact pre-experience PWA bytes',()=>{
 const path='my-timber-pwa/service-worker.mjs',prior=content(EXPERIENCE_BASE,path),current=content(EXPERIENCE_SOURCE,path);
 assert.equal(originalExperiencePwaServiceWorker(current),prior);
 assert.equal(originalExperiencePwaServiceWorker(prior),prior);
 assert.match(content(head,'release/footer-scope.mjs'),/originalFooterPwaServiceWorker\(execFileSync/);
 const projected=originalExperiencePwaServiceWorker(current).replace(" const panel=['/member/fit','/member/grub','/member/life-back'].includes(u.pathname)&&u.searchParams.get('app_panel')==='1'&&['app','web'].includes(u.searchParams.get('view'))&&u.searchParams.size===2;\n if(event.request.method!=='GET'||event.request.mode!=='navigate'||u.origin!==self.location.origin||!/^\\/member\\//.test(u.pathname)||(u.search&&!panel))return;"," if(event.request.method!=='GET'||event.request.mode!=='navigate'||u.origin!==self.location.origin||!/^\\/member\\//.test(u.pathname)||u.search)return;");
 assert.equal(projected,content('59b7d1da00fe4ada0e66d64954d99fee6ae35916',path));
 assert.throws(()=>originalExperiencePwaServiceWorker(current+'drift'),/Exact current My Timber service-worker source/);
});

test('footer guard receives only the exact pre-experience app-tab bytes',()=>{
 const path='preview/app-layout/tabs.mjs',prior=content(EXPERIENCE_BASE,path),current=content(EXPERIENCE_SOURCE,path);
 assert.equal(originalExperienceTabs(current),prior);
 assert.equal(originalExperienceTabs(prior),prior);
 assert.match(content(head,'release/footer-scope.mjs'),/originalFooterTabs\(execFileSync/);
 const after=" function select(key,push=false,hash=''){if(!toolKeys.includes(key))key='today';chosen=key;syncTabs();if(!host)return;if(push){const u=new URL(location.href);if(key==='today')u.searchParams.delete('tool');else u.searchParams.set('tool',key);u.hash='today';history.pushState(null,'',u)}host.hidden=key==='today';if(key!=='today'&&!panels.has(key))createPanel(key,hash);else if(key!=='today'&&hash){const frame=panels.get(key).frame;try{frame.contentWindow.location.hash=hash;frame.contentWindow.dispatchEvent(new Event('hashchange'))}catch{}}panels.forEach((v,k)=>{v.panel.hidden=k!==key;if(k===key)requestAnimationFrame(()=>measure(v.frame))}); }";
 const before=" function select(key,push=false,hash=''){if(!toolKeys.includes(key))key='today';chosen=key;syncTabs();if(!host)return;host.hidden=key==='today';if(key!=='today'&&!panels.has(key))createPanel(key,hash);else if(key!=='today'&&hash){const frame=panels.get(key).frame;try{frame.contentWindow.location.hash=hash;frame.contentWindow.dispatchEvent(new Event('hashchange'))}catch{}}panels.forEach((v,k)=>{v.panel.hidden=k!==key;if(k===key)requestAnimationFrame(()=>measure(v.frame))});if(push){const u=new URL(location.href);if(key==='today')u.searchParams.delete('tool');else u.searchParams.set('tool',key);u.hash='today';history.pushState(null,'',u)} }";
 assert.equal(prior.split(after).length,2);
 assert.equal(originalExperienceTabs(current).replace(after,before),content('59b7d1da00fe4ada0e66d64954d99fee6ae35916',path));
 assert.throws(()=>originalExperienceTabs(current+'drift'),/Exact current My Timber app-tabs source/);
});
