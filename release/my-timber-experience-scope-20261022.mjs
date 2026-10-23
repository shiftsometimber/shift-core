import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {realpathSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

// Admit only the owner-approved member/PWA payload.  The current source is
// proved first; existing release scopes then receive its exact predecessor.
export const EXPERIENCE_BASE='b6270ef6e45698cf9ef500326a5c7e47c45f2e49';
export const EXPERIENCE_SOURCE='4945fef66201f1281f37eb6d3377dff31ce31eac';
export const EXPERIENCE_MANIFEST='release/approved-runtime-composition.json';
export const EXPERIENCE_KEY='myTimberExperience20261022';
// Main advanced while this approved release was gated. Admit only the exact
// already-merged footer/teaser composition, then project it away for the older
// release guards. This is not My Timber product or deployment authority.
export const EXPERIENCE_CURRENT_MAIN_BASE='ed65a6d09df7b157f05f9654e8f584b32b6c4337';
export const EXPERIENCE_CURRENT_MAIN_SOURCE='4e3fcf85c9396260981b495cb2cc5861a76b2734';
export const EXPERIENCE_CURRENT_MAIN_PINS=Object.freeze({
 'tests/shared-footer.test.mjs':'add6f9d692d796eae58580611207ea6d42fbc7a6',
 'timber-shed-public-teaser.mjs':'f4355f0fb74351c0678895b3c636f296634ef6ae',
 'worker-entry-v6.js':'d4ac95922c8655acb8a44f1b56ca14950d29617e'
});
export const EXPERIENCE_CURRENT_MAIN_COMPOSED_PINS=Object.freeze({
 'tests/shared-footer.test.mjs':'2ca761ba40d194d21b22abd94172548714d44a27',
 'timber-shed-public-teaser.mjs':'f4355f0fb74351c0678895b3c636f296634ef6ae',
 'worker-entry-v6.js':'d4ac95922c8655acb8a44f1b56ca14950d29617e'
});
export const EXPERIENCE_CURRENT_MAIN_PATHS=Object.freeze(Object.keys(EXPERIENCE_CURRENT_MAIN_PINS).sort());
export const EXPERIENCE_CURRENT_MAIN_TEST_BEFORE=" const source=readFileSync(new URL('../worker-entry-v6.js',import.meta.url),'utf8');assert(source.includes('if(appStorePublic)return withTimberShedTeaser(request,await withSharedFooter(request,appStorePublic));'));assert(source.includes('return withTimberShedTeaser(request,await withPublicSeoCloseout(await withSharedFooter(request,await withGrowthPublicCopy('));";
export const EXPERIENCE_CURRENT_MAIN_TEST_AFTER=" const source=readFileSync(new URL('../worker-entry-v6.js',import.meta.url),'utf8');assert(source.includes('if(appStorePublic)return withSharedFooter(request,appStorePublic);'));assert(source.includes('return withPublicSeoCloseout(await withSharedFooter(request,await withGrowthPublicCopy('));";
export const EXPERIENCE_PINS=Object.freeze({
 'evidence/my-timber-experience-20261015/approved-design-20261019.json':'3f8bbca8e7877c89449ca0cc032481c0c45a06e0',
 'evidence/my-timber-experience-20261015/browser-receipt.json':'3bf698d4b5c6a798ec8cfb6684a1b4f35d01459e',
 'evidence/my-timber-experience-20261015/chromium-360-large-text.png':'161aa426894f77043b555161ece69deb8710d503',
 'evidence/my-timber-experience-20261015/chromium-390-fit.png':'2443b45e2b9f025f458f24f503ffbf8f112e6d3a',
 'evidence/my-timber-experience-20261015/chromium-390-grub.png':'f5b28bcdd31974bfeaad66f1da73cace06c74b3b',
 'evidence/my-timber-experience-20261015/chromium-390-today.png':'2082f3f23d2b175e0ef31e8682c7df9ddb4b40c5',
 'evidence/my-timber-experience-20261015/fit-disclosure-correction-20261017.json':'b2e93a84f542b98903d8431d41b89b6aed9fe1ac',
 'evidence/my-timber-experience-20261015/fit-disclosure-original-failure-20261017.json':'df046189f3721dd24bfa824cf9c6a161fe25d7a9',
 'evidence/my-timber-experience-20261015/fit-startup-correction-20261017.json':'321582e2a55cf359144f010a78b850dfa2608a2f',
 'evidence/my-timber-experience-20261015/fit-startup-original-failure-20261017.json':'a2dc3607f55a3f0ae8990523fd4a96c7a4ad6dc7',
 'evidence/my-timber-experience-20261015/health-browser-receipt.json':'daff72e7f7c1a947888b636ab46b14822f5738c6',
 'evidence/my-timber-experience-20261015/public-preservation.json':'3fd211a146bc75dd944301fdf1a7137038cfbe6b',
 'evidence/my-timber-experience-20261015/returning-fit-settings-first-failure.json':'ec25abc388c5dd08e774e8ffe92a46b814baf4b7',
 'evidence/my-timber-experience-20261015/verification.json':'5ed489f15e1e97e54b3d2fc96355de6f0b5e4f25',
 'evidence/my-timber-experience-20261015/webkit-390-today.png':'c954dd441eb46dac769fea42c9417428c246183a',
 'frontend/member/member-progress-v1.js':'40d4f91a3d176e6f0d3821e34e305d8a6da67567',
 'member-design.mjs':'9dd1b834ce5622cb1d51e64bad45597fdd194b59',
 'member-experience/app-experience.mjs':'0570989068bd1d88a92cc01d225702cfa07545b7',
 'member-experience/chrome.mjs':'c34c7bc4ce288372f09e34227ecf06e4df63016e',
 'member-experience/device-health-client.mjs':'8a0ba9327709061db702f03d9a304b79c6f22f55',
 'member-experience/device-health-sync-client.mjs':'1542796258f193342d2c77522302c46049a0a58e',
 'member-experience/device-health.mjs':'1e86317eaa9f4b0b60581bdb42f53a14b6d49905',
 'member-experience/entry.mjs':'3be8a5aee8cd5dad40bb838e5bf2343cc1b171b1',
 'member-experience/fit-runtime.mjs':'621a6070586e9d8d55a6fbab244c862322f4046b',
 'member-experience/grub-runtime.mjs':'d8b2c9113ad1d03857df10b5f7a4c505cbe716e2',
 'member-experience/grub-search.mjs':'5db3161b927309ce92564ab7cb83e509e6700649',
 'member-experience/tests/device-health-autosync.test.mjs':'fee8294a7fcb02e4b490a0763084a67ad1c383b1',
 'member-experience/tests/discovery-options.test.mjs':'239d36989159f1e779b630087091e91b85fb0a97',
 'member-experience/tests/fit-startup-state.test.mjs':'3df024ad051cf462be75e1665ef5a251d49b3361',
 'member-experience/treatment-page.mjs':'9a15484d97fbf5f05a4fb3e4a79fbd0f41fb6d02',
 'my-timber-pwa/service-worker.mjs':'f7751abbe23a9956a06d9ed835d3bcf47794b532',
 'preview/app-layout/presentation.mjs':'afcde7d546805247da70c6e52e9f53a188bb35a0',
 'preview/app-layout/tabs.mjs':'f51a16efec17bae3de69381e8efc7f798ad93292',
 'preview/app-layout/today.mjs':'f82388cbe816ca75a92d394ee608dcdf0758551b',
 'shift-coach/fit-disclosure-proof.mjs':'31c96b7296c8d157082339ed01760bb4c02b220b',
 'shift-coach/member-approved-design-proof.cjs':'9653f8b593e0a2819b7ee4e86e8e3315e5d6303f',
 'shift-coach/member-experience-proof.mjs':'cb45a728453162c8e7c87fd67ce4bae40bae7944',
 'shift-coach/ui.mjs':'527e504f963fa2099ef59a754dbb9482b33228d6',
 'tests/progress-charts.test.mjs':'8ff69f99e52e79eaf5b224bca8c5ae52d65f7eb2',
 'tests/shared-footer.test.mjs':'e18156d5fac0c05e6ec940a1e8183d93b0f54a82'
});
export const EXPERIENCE_PATHS=Object.freeze(Object.keys(EXPERIENCE_PINS).sort());
export const EXPERIENCE_MAINTENANCE=Object.freeze([
 'release/my-timber-experience-scope-20261022.mjs',
 'release/finite-growth-scope.mjs',
 'release/main-release-readiness-scope-20261021.mjs',
 'release/approved-runtime-composition.mjs',
 'release/footer-scope.mjs',
 'release/root-share-preview-scope.mjs',
 'release/recorded-week-navigation-outer-frame-20261018.mjs',
 'tests/health-vision-scope-20261021.test.mjs',
 'tests/main-release-readiness-scope-20261021.test.mjs',
 'tests/my-timber-experience-composition-20261022.test.mjs'
].sort());
export const EXPERIENCE_RECORD=Object.freeze({
 proof:'EXACT_AUTHORISED_MY_TIMBER_EXPERIENCE_20261022',
 base:EXPERIENCE_BASE,source:EXPERIENCE_SOURCE,paths:EXPERIENCE_PATHS,
 maintenancePaths:EXPERIENCE_MAINTENANCE,integrationIssue:1065,
 approval:{owner:'Matt',scope:'My Timber interface and usability, including corresponding PWA changes',visualDirection:'Love this all',deploymentInstruction:'Deploy My Timber',resumedAt:'2026-10-22'},
 foregroundHealthScope:['weight','heartRate','bloodPressure'],backgroundHealthSyncImplemented:false,
 publicHomepageChanged:false,clinicalChanged:false,memberRecordsChanged:false,
 consentControlsRemoved:false,commercialSettingsChanged:false,nativeBinaryChanged:false,
 externalCommunicationsSent:false,newSpendingAuthorised:false,
 existingGatesWeakened:false,rollbackAuthorityBroadened:false,
 productionDeployed:false,physicalHealthAcceptanceClaimed:false
});

export const EXPERIENCE_MAIN_IMPORT="import {myTimberExperienceHistoricalView} from './my-timber-experience-scope-20261022.mjs';\n";
export const EXPERIENCE_MAIN_BEFORE=" const actual=git('rev-parse','HEAD');\n";
export const EXPERIENCE_MAIN_AFTER=" const myTimber=myTimberExperienceHistoricalView(),rawActual=git('rev-parse','HEAD'),actual=myTimber.head;\n assert.equal(myTimber.rawHead,rawActual,'My Timber actual HEAD required before release-readiness projection');\n";
export const EXPERIENCE_MAIN_END_BEFORE=" assert.equal(git('rev-parse','HEAD'),actual,'Release-readiness HEAD moved');\n return Object.freeze({actual,predecessor:MAIN_RELEASE_BASE,payload:MAIN_RELEASE_PAYLOAD,followupPayload:MAIN_RELEASE_FOLLOWUP_PAYLOAD,timeoutPayload:MAIN_RELEASE_TIMEOUT_PAYLOAD,routePayload:MAIN_RELEASE_ROUTE_PAYLOAD,routeExpansionPayload:MAIN_RELEASE_ROUTE_EXPANSION_PAYLOAD,aliasWindowPayload:MAIN_RELEASE_ALIAS_WINDOW_PAYLOAD,completionPayload:MAIN_RELEASE_COMPLETION_PAYLOAD,compositionPayload:MAIN_RELEASE_COMPOSITION_PAYLOAD,projectionCachePayload:MAIN_RELEASE_PROJECTION_CACHE_PAYLOAD,targetCachePayload:MAIN_RELEASE_TARGET_CACHE_PAYLOAD,rootProjectionPayload:MAIN_RELEASE_ROOT_PROJECTION_PAYLOAD,rootInversePayload:MAIN_RELEASE_ROOT_INVERSE_PAYLOAD,reconciliationPayload:MAIN_RELEASE_RECONCILIATION_PAYLOAD,reconciliationComposition:MAIN_RELEASE_RECONCILIATION_COMPOSITION,upstreamMain:MAIN_RELEASE_UPSTREAM_MAIN,guardCompositionPayload:MAIN_RELEASE_GUARD_COMPOSITION_PAYLOAD,netProjectionPayload:MAIN_RELEASE_NET_PROJECTION_PAYLOAD,entityPayload:MAIN_RELEASE_ENTITY_PAYLOAD,entityCompositionPayload:MAIN_RELEASE_ENTITY_COMPOSITION_PAYLOAD,retryPayload:MAIN_RELEASE_RETRY_PAYLOAD,transportPayload:MAIN_RELEASE_TRANSPORT_PAYLOAD,productionVerified:false});";
export const EXPERIENCE_MAIN_END_AFTER=" assert.equal(git('rev-parse','HEAD'),rawActual,'Release-readiness HEAD moved');\n return Object.freeze({actual:rawActual,predecessor:MAIN_RELEASE_BASE,payload:MAIN_RELEASE_PAYLOAD,followupPayload:MAIN_RELEASE_FOLLOWUP_PAYLOAD,timeoutPayload:MAIN_RELEASE_TIMEOUT_PAYLOAD,routePayload:MAIN_RELEASE_ROUTE_PAYLOAD,routeExpansionPayload:MAIN_RELEASE_ROUTE_EXPANSION_PAYLOAD,aliasWindowPayload:MAIN_RELEASE_ALIAS_WINDOW_PAYLOAD,completionPayload:MAIN_RELEASE_COMPLETION_PAYLOAD,compositionPayload:MAIN_RELEASE_COMPOSITION_PAYLOAD,projectionCachePayload:MAIN_RELEASE_PROJECTION_CACHE_PAYLOAD,targetCachePayload:MAIN_RELEASE_TARGET_CACHE_PAYLOAD,rootProjectionPayload:MAIN_RELEASE_ROOT_PROJECTION_PAYLOAD,rootInversePayload:MAIN_RELEASE_ROOT_INVERSE_PAYLOAD,reconciliationPayload:MAIN_RELEASE_RECONCILIATION_PAYLOAD,reconciliationComposition:MAIN_RELEASE_RECONCILIATION_COMPOSITION,upstreamMain:MAIN_RELEASE_UPSTREAM_MAIN,guardCompositionPayload:MAIN_RELEASE_GUARD_COMPOSITION_PAYLOAD,netProjectionPayload:MAIN_RELEASE_NET_PROJECTION_PAYLOAD,entityPayload:MAIN_RELEASE_ENTITY_PAYLOAD,entityCompositionPayload:MAIN_RELEASE_ENTITY_COMPOSITION_PAYLOAD,retryPayload:MAIN_RELEASE_RETRY_PAYLOAD,transportPayload:MAIN_RELEASE_TRANSPORT_PAYLOAD,productionVerified:false});";
export const EXPERIENCE_RUNTIME_IMPORT="import {EXPERIENCE_BASE,EXPERIENCE_PATHS,EXPERIENCE_MAINTENANCE,myTimberExperienceHistoricalView} from './my-timber-experience-scope-20261022.mjs';\n";
export const EXPERIENCE_RUNTIME_BRANCH=" if(EXPERIENCE_ADDITIONAL_PATHS.includes(path)){\n  let existed;try{execFileSync('git',['cat-file','-e',EXPERIENCE_BASE+':'+path],{stdio:'ignore'});existed=true;}catch{existed=false;}\n  assert.equal(status,existed?'M':'A','Unexpected exact My Timber experience status: '+status+' '+path);return true;\n }\n";
export const EXPERIENCE_RUNTIME_FOOTER="\nexport const EXPERIENCE_ADDITIONAL_PATHS=Object.freeze([...EXPERIENCE_PATHS,...EXPERIENCE_MAINTENANCE].filter(p=>!RECONCILIATION_PATHS.has(p)));\nfor(const p of EXPERIENCE_ADDITIONAL_PATHS)RECONCILIATION_PATHS.add(p);\n";
export const EXPERIENCE_RUNTIME_VERIFY_BEFORE=" const memberDefaultRead=read===defaultReconciliationRead;\n // Preserve the original fail-closed assertion and its error identity. The one\n";
export const EXPERIENCE_RUNTIME_VERIFY_AFTER=" const memberDefaultRead=read===defaultReconciliationRead;\n const experienceView=myTimberExperienceHistoricalView(memberDefaultRead?null:read,{defaultReader:memberDefaultRead});\n read=experienceView.read;\n // Preserve the original fail-closed assertion and its error identity. The one\n";
export const EXPERIENCE_RUNTIME_MEMBER_BEFORE=" try{memberView=memberConsentHistoricalView(memberDefaultRead?null:read,{defaultReader:memberDefaultRead});}\n";
export const EXPERIENCE_RUNTIME_MEMBER_AFTER=" try{memberView=memberConsentHistoricalView(read,{defaultReader:false});}\n";
export const EXPERIENCE_NAVIGATION_IMPORT="import {originalExperiencePayload} from './my-timber-experience-scope-20261022.mjs';\n";
export const EXPERIENCE_NAVIGATION_HOOK=" if(p==='frontend/member/member-progress-v1.js')value=originalExperiencePayload(p,value);\n";
export const EXPERIENCE_MAIN_TEST_IMPORT="import {myTimberExperienceHistoricalView} from '../release/my-timber-experience-scope-20261022.mjs';\n";
export const EXPERIENCE_MAIN_TEST_BEFORE=" assert.equal(git('show','HEAD:release/approved-runtime-composition.json'),git('show',MAIN_RELEASE_BASE+':release/approved-runtime-composition.json'));";
export const EXPERIENCE_MAIN_TEST_AFTER=" const myTimber=myTimberExperienceHistoricalView();\n assert.equal(myTimber.content('HEAD','release/approved-runtime-composition.json').trimEnd(),git('show',MAIN_RELEASE_BASE+':release/approved-runtime-composition.json'));";
export const EXPERIENCE_HEALTH_TEST_IMPORT="import {myTimberExperienceHistoricalView} from '../release/my-timber-experience-scope-20261022.mjs';\n";
export const EXPERIENCE_HEALTH_TEST_BEFORE="assert.equal(git('show','HEAD:release/approved-runtime-composition.json'),git('show',HEALTH_BASE+':release/approved-runtime-composition.json'))";
export const EXPERIENCE_HEALTH_TEST_AFTER="const myTimber=myTimberExperienceHistoricalView();assert.equal(myTimber.content('HEAD','release/approved-runtime-composition.json').trimEnd(),git('show',HEALTH_BASE+':release/approved-runtime-composition.json'))";
export const EXPERIENCE_FINITE_GROWTH_IMPORT="import {myTimberExperienceHistoricalView} from './my-timber-experience-scope-20261022.mjs';\n";
export const EXPERIENCE_FINITE_GROWTH_BEFORE="export function finiteGrowthHistoricalView(){\n const memberView=memberConsentHistoricalView(),record=memberView.record,rawHead=memberView.head,repair=record.finiteGrowthRepair;";
export const EXPERIENCE_FINITE_GROWTH_AFTER="export function finiteGrowthHistoricalView(){\n const experience=myTimberExperienceHistoricalView();\n const memberView=memberConsentHistoricalView(experience.content,{defaultReader:false}),record=memberView.record,rawHead=memberView.head,repair=record.finiteGrowthRepair;";
export const EXPERIENCE_ROOT_SHARE_IMPORT="import {myTimberExperienceHistoricalView,myTimberExperienceReaderAffects,originalExperienceRootShare} from './my-timber-experience-scope-20261022.mjs';\n";
export const EXPERIENCE_ROOT_SHARE_INVERSE="  bytes=originalExperienceRootShare(bytes);\n";
export const EXPERIENCE_ROOT_SHARE_COMPARE_BEFORE=" const references=new Map();for(const[path,source]of currentRefs){if(!git('ls-tree',record.base,'--',path))continue;assert.equal(contents(head,path),contents(source,path),'Exact current-main callback source changed: '+path);assert.equal(reader('HEAD',path),reader(head,path),'Current-main callback aliases drift: '+path);references.set(path,record.base);}\n";
export const EXPERIENCE_ROOT_SHARE_COMPARE_AFTER=" const references=new Map();for(const[path,source]of currentRefs){if(!git('ls-tree',record.base,'--',path))continue;const actual=contents(head,path),expected=contents(source,path);if(actual!==expected){assert.equal(myTimberExperienceReaderAffects(reader,path),true,'Exact current-main callback source changed: '+path);assert.equal(reader('HEAD',path),reader(source,path),'Exact projected current-main callback source changed: '+path);}assert.equal(reader('HEAD',path),reader(head,path),'Current-main callback aliases drift: '+path);references.set(path,record.base);}\n";
export const EXPERIENCE_ROOT_SHARE_DEFAULT=" if(defaultReader){const experience=myTimberExperienceHistoricalView();if(experience.rawHead!==experience.head){reader=experience.read;defaultReader=false;}}\n";
const once=(text,before,after='')=>{assert.equal(text.split(before).length,2,'One exact My Timber experience hook required');return text.replace(before,after);};
export function originalExperienceCurrentMainSharedFooterTest(text){
 return once(text,EXPERIENCE_CURRENT_MAIN_TEST_AFTER,EXPERIENCE_CURRENT_MAIN_TEST_BEFORE);
}
export function originalExperienceMainRelease(text){
 text=once(text,EXPERIENCE_MAIN_IMPORT);
 text=once(text,EXPERIENCE_MAIN_AFTER,EXPERIENCE_MAIN_BEFORE);
 return once(text,EXPERIENCE_MAIN_END_AFTER,EXPERIENCE_MAIN_END_BEFORE);
}
export function originalExperienceRuntime(text){
 text=once(text,EXPERIENCE_RUNTIME_IMPORT);
 text=once(text,EXPERIENCE_RUNTIME_BRANCH);
 text=once(text,EXPERIENCE_RUNTIME_FOOTER);
 text=once(text,EXPERIENCE_RUNTIME_VERIFY_AFTER,EXPERIENCE_RUNTIME_VERIFY_BEFORE);
 text=once(text,EXPERIENCE_RUNTIME_MEMBER_AFTER,EXPERIENCE_RUNTIME_MEMBER_BEFORE);
 return text;
}
export function originalExperienceNavigation(text){
 for(const fragment of [EXPERIENCE_NAVIGATION_IMPORT,EXPERIENCE_NAVIGATION_HOOK])text=once(text,fragment);
 return text;
}
export function originalExperienceMainTest(text){
 text=once(text,EXPERIENCE_MAIN_TEST_IMPORT);
 return once(text,EXPERIENCE_MAIN_TEST_AFTER,EXPERIENCE_MAIN_TEST_BEFORE);
}
export function originalExperienceHealthTest(text){
 text=once(text,EXPERIENCE_HEALTH_TEST_IMPORT);
 return once(text,EXPERIENCE_HEALTH_TEST_AFTER,EXPERIENCE_HEALTH_TEST_BEFORE);
}
export function originalExperienceFiniteGrowth(text){
 text=once(text,EXPERIENCE_FINITE_GROWTH_IMPORT);
 return once(text,EXPERIENCE_FINITE_GROWTH_AFTER,EXPERIENCE_FINITE_GROWTH_BEFORE);
}
export function originalExperienceRootShare(text){
 text=once(text,EXPERIENCE_ROOT_SHARE_IMPORT);
 text=once(text,EXPERIENCE_ROOT_SHARE_INVERSE);
 text=once(text,EXPERIENCE_ROOT_SHARE_COMPARE_AFTER,EXPERIENCE_ROOT_SHARE_COMPARE_BEFORE);
 return once(text,EXPERIENCE_ROOT_SHARE_DEFAULT);
}

const sorted=values=>[...values].sort();
const native=(...args)=>execFileSync('git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6});
const git=(...args)=>native(...args).trimEnd();
const rawContent=(ref,path)=>native('show',ref+':'+path);
const rawBlob=(ref,path)=>git('rev-parse',ref+':'+path);
const rawDiff=(a,b)=>git('diff','--no-renames','--name-only',a,b).split('\n').filter(Boolean);
const rawAncestor=(a,b)=>{native('merge-base','--is-ancestor',a,b);return true;};
export function originalExperiencePayload(path,value){
 assert.equal(path,'frontend/member/member-progress-v1.js','Only the exact overlapping navigation payload may be projected');
 assert(Buffer.isBuffer(value),'Exact My Timber payload bytes required');
 const current=Buffer.from(rawContent(EXPERIENCE_SOURCE,path)),prior=Buffer.from(rawContent(EXPERIENCE_BASE,path));
 if(value.equals(prior))return value;
 assert(value.equals(current),'Exact current My Timber payload required before navigation projection');
 return prior;
}
export function originalExperiencePwaServiceWorker(value){
 const path='my-timber-pwa/service-worker.mjs';
 assert.equal(typeof value,'string','Exact My Timber service-worker source required');
 const current=rawContent(EXPERIENCE_SOURCE,path),prior=rawContent(EXPERIENCE_BASE,path);
 if(value===prior)return value;
 assert.equal(value,current,'Exact current My Timber service-worker source required before footer projection');
 return prior;
}
export function originalExperienceTabs(value){
 const path='preview/app-layout/tabs.mjs';
 assert.equal(typeof value,'string','Exact My Timber app-tabs source required');
 const current=rawContent(EXPERIENCE_SOURCE,path),prior=rawContent(EXPERIENCE_BASE,path);
 if(value===prior)return value;
 assert.equal(value,current,'Exact current My Timber app-tabs source required before footer projection');
 return prior;
}
function clean(head){
 assert.equal(realpathSync(git('rev-parse','--show-toplevel')),realpathSync(process.cwd()),'Actual current checkout required');
 assert.equal(git('rev-parse','HEAD'),head,'My Timber source HEAD changed');
 assert.equal(git('diff','--no-renames','--name-only','HEAD','--'),'','My Timber tracked working source is dirty');
 assert.equal(git('diff','--no-renames','--cached','--name-only','--'),'','My Timber staged source is dirty');
 assert.equal(git('for-each-ref','--format=%(refname)','refs/replace'),'','My Timber replacement history forbidden');
}
export function verifyMyTimberExperience(record,{head,read=rawBlob,blob=rawBlob,content=rawContent,diff=rawDiff,ancestor=rawAncestor}={}){
 const {maintenanceSource,...fixed}=record||{};
 assert.deepEqual(fixed,EXPERIENCE_RECORD,'Exact approved My Timber experience record required');
 assert.match(head,/^[a-f0-9]{40}$/);assert.match(maintenanceSource,/^[a-f0-9]{40}$/);
 const currentMainApplied=(()=>{try{return ancestor(EXPERIENCE_CURRENT_MAIN_SOURCE,head)===true;}catch{return false;}})();
 for(const ref of [record.base,record.source,maintenanceSource])ancestor(ref,head);
 ancestor(record.base,record.source);ancestor(record.source,maintenanceSource);
 assert.deepEqual(sorted(diff(record.base,record.source)),EXPERIENCE_PATHS,'Unrelated member-experience payload');
 assert.deepEqual(sorted(diff(record.source,maintenanceSource)),EXPERIENCE_MAINTENANCE,'Unrelated member-experience maintenance');
 if(currentMainApplied){
  ancestor(EXPERIENCE_CURRENT_MAIN_BASE,EXPERIENCE_CURRENT_MAIN_SOURCE);
  assert.deepEqual(sorted(diff(EXPERIENCE_CURRENT_MAIN_BASE,EXPERIENCE_CURRENT_MAIN_SOURCE)),EXPERIENCE_CURRENT_MAIN_PATHS,'Unrelated current-main footer composition');
 }
 const currentMainTail=currentMainApplied?EXPERIENCE_CURRENT_MAIN_PATHS:[];
 assert.deepEqual(sorted(diff(maintenanceSource,head)),sorted([EXPERIENCE_MANIFEST,...currentMainTail]),'Unreviewed member-experience registration tail');
 assert.deepEqual(sorted(diff(record.base,head)),sorted([...new Set([...EXPERIENCE_PATHS,...EXPERIENCE_MAINTENANCE,EXPERIENCE_MANIFEST,...currentMainTail])]),'Unlisted member-experience source');
 for(const [path,pin] of Object.entries(EXPERIENCE_PINS)){
  const composed=currentMainApplied&&Object.hasOwn(EXPERIENCE_CURRENT_MAIN_COMPOSED_PINS,path);
  assert.equal(blob(record.source,path),pin,'Frozen approved member-experience source drift: '+path);
  assert.equal(blob(head,path),composed?EXPERIENCE_CURRENT_MAIN_COMPOSED_PINS[path]:pin,'Current member-experience source drift: '+path);
  if(composed){
   assert.equal(originalExperienceCurrentMainSharedFooterTest(content(head,path)),content(record.source,path),'Exact current-main and My Timber test composition required');
   assert.equal(read('HEAD',path),read(head,path),'Fresh composed member-experience source drift: '+path);
  }else{
   assert.equal(read('HEAD',path),read(record.source,path),'Fresh member-experience source drift: '+path);
   assert.equal(read(head,path),read(record.source,path),'Fresh member-experience resolved-head source drift: '+path);
  }
  assert.match(git('ls-tree',head,'--',path),/^100644 blob [a-f0-9]{40}\t/,'Regular member-experience source required: '+path);
 }
 if(currentMainApplied)for(const [path,pin] of Object.entries(EXPERIENCE_CURRENT_MAIN_PINS)){
  assert.equal(blob(EXPERIENCE_CURRENT_MAIN_SOURCE,path),pin,'Frozen current-main footer composition drift: '+path);
  assert.equal(blob(head,path),EXPERIENCE_CURRENT_MAIN_COMPOSED_PINS[path],'Current composed footer source drift: '+path);
  assert.equal(read('HEAD',path),read(head,path),'Fresh current-main composed source drift: '+path);
  if(path!=='tests/shared-footer.test.mjs')assert.equal(content(head,path),content(EXPERIENCE_CURRENT_MAIN_SOURCE,path),'Exact current-main footer source required: '+path);
  assert.match(git('ls-tree',head,'--',path),/^100644 blob [a-f0-9]{40}\t/,'Regular current-main footer source required: '+path);
 }
 for(const path of EXPERIENCE_MAINTENANCE){
  assert.equal(blob(head,path),blob(maintenanceSource,path),'Current member-experience maintenance drift: '+path);
  assert.equal(read('HEAD',path),read(maintenanceSource,path),'Fresh member-experience maintenance drift: '+path);
  assert.equal(read(head,path),read(maintenanceSource,path),'Fresh member-experience resolved-head maintenance drift: '+path);
  assert.match(git('ls-tree',head,'--',path),/^100644 blob [a-f0-9]{40}\t/,'Regular member-experience maintenance required: '+path);
 }
 for(const path of ['wrangler.jsonc','wrangler.coaching.jsonc','wrangler.hq-management.jsonc','package.json','package-lock.json','worker-entry-v6.js','worker.js','shift-coach/worker.mjs','.github/workflows/cloudflare-production-promote.yml','my-timber-app','public','privacy-health-erasure-route-v1.js','member-experience/treatment-routes.mjs','member-experience/treatment-privacy.mjs','member-experience/treatment.sql']){
  const boundary=currentMainApplied&&Object.hasOwn(EXPERIENCE_CURRENT_MAIN_PINS,path)?EXPERIENCE_CURRENT_MAIN_SOURCE:record.base;
  assert.equal(blob(head,path),blob(boundary,path),'Protected member-experience boundary drift: '+path);
  assert.equal(read('HEAD',path),read(boundary,path),'Fresh protected member-experience boundary drift: '+path);
  assert.equal(read(head,path),read(boundary,path),'Fresh protected resolved-head member-experience boundary drift: '+path);
 }
 assert.equal(originalExperienceMainRelease(content(head,'release/main-release-readiness-scope-20261021.mjs')),content(record.base,'release/main-release-readiness-scope-20261021.mjs'),'All original release-readiness assertions and gates retained');
 assert.equal(originalExperienceRuntime(content(head,'release/approved-runtime-composition.mjs')),content(record.base,'release/approved-runtime-composition.mjs'),'All original runtime assertions and gates retained');
 assert.equal(originalExperienceNavigation(content(head,'release/recorded-week-navigation-outer-frame-20261018.mjs')),content(record.base,'release/recorded-week-navigation-outer-frame-20261018.mjs'),'All original navigation assertions and gates retained');
 assert.equal(originalExperienceMainTest(content(head,'tests/main-release-readiness-scope-20261021.test.mjs')),content(record.base,'tests/main-release-readiness-scope-20261021.test.mjs'),'All original release-readiness tests retained');
 assert.equal(originalExperienceHealthTest(content(head,'tests/health-vision-scope-20261021.test.mjs')),content(record.base,'tests/health-vision-scope-20261021.test.mjs'),'All original immutable Health tests retained');
 assert.equal(originalExperienceFiniteGrowth(content(head,'release/finite-growth-scope.mjs')),content(record.base,'release/finite-growth-scope.mjs'),'All original finite-growth assertions and historical mappings retained');
 assert.equal(originalExperienceRootShare(content(head,'release/root-share-preview-scope.mjs')),content(record.base,'release/root-share-preview-scope.mjs'),'All original root-share assertions and historical mappings retained');
 const current=JSON.parse(content(head,EXPERIENCE_MANIFEST)),prior=JSON.parse(content(record.base,EXPERIENCE_MANIFEST));
 assert.deepEqual(current[EXPERIENCE_KEY],record);delete current[EXPERIENCE_KEY];
 assert.deepEqual(current,prior,'Every previous approval, failure, receipt and hold retained');
 return record;
}

const admittedViews=new WeakSet(),admittedReaders=new WeakMap();
export function myTimberExperienceHistoricalView(reader=null,{defaultReader=reader===null}={}){
 const rawHead=git('rev-parse','HEAD');clean(rawHead);
 const current=JSON.parse(rawContent(rawHead,EXPERIENCE_MANIFEST)),record=current[EXPERIENCE_KEY];
 const supplied=defaultReader?rawBlob:reader;assert.equal(typeof supplied,'function','Current source reader required');
 const assertCurrent=()=>clean(rawHead);
 if(!record){const affected=()=>false,view={rawHead,head:rawHead,record:current,read:supplied,blob:rawBlob,content:rawContent,affected,assertCurrent,finish:assertCurrent};admittedViews.add(view);admittedReaders.set(view.read,affected);return Object.freeze(view);}
 const currentRef=ref=>ref==='HEAD'||ref===rawHead;
 const normal=(ref,path)=>{
  const value=supplied(ref,path),resolved=ref==='HEAD'?rawHead:ref;
  if(typeof value==='string'&&value.startsWith('tree ')){
   for(const display of [ref,resolved]){const authentic=rawContent(resolved,path),prefix='tree '+display+':'+path+'\n';if(value===authentic.replace('tree '+resolved+':'+path+'\n',prefix))return authentic.split('\n').slice(1).join('\n');}
  }
  return value;
 };
 verifyMyTimberExperience(record,{head:rawHead,read:normal});
 const currentMainApplied=(()=>{try{return rawAncestor(EXPERIENCE_CURRENT_MAIN_SOURCE,rawHead);}catch{return false;}})();
 const owned=[...EXPERIENCE_PATHS,...EXPERIENCE_MAINTENANCE,EXPERIENCE_MANIFEST];
 const currentMain=currentMainApplied?EXPERIENCE_CURRENT_MAIN_PATHS:[];
 const contains=(paths,path)=>paths.includes(path)||paths.some(p=>p.startsWith(path+'/'));
 const affected=path=>contains(owned,path)||contains(currentMain,path);
 // Project only the files authenticated above. Preserve a supplied reader's
 // HEAD alias everywhere else so older fail-closed drift checks retain the
 // caller contract they had before either overlay existed.
 const map=(ref,path)=>{
  if(!currentRef(ref))return ref;
  if(contains(owned,path))return record.base;
  if(contains(currentMain,path))return EXPERIENCE_CURRENT_MAIN_BASE;
  return ref;
 };
 const read=(ref,path)=>{
  return normal(map(ref,path),path);
 };
 const prior=structuredClone(current);delete prior[EXPERIENCE_KEY];assertCurrent();
 const view={rawHead,head:record.base,record:prior,read,blob:(r,p)=>rawBlob(map(r,p),p),content:(r,p)=>rawContent(map(r,p),p),affected,assertCurrent,finish:assertCurrent};
 admittedViews.add(view);admittedReaders.set(view.read,affected);return Object.freeze(view);
}
export function assertMyTimberExperienceView(view){assert(admittedViews.has(view),'Independently admitted My Timber view required');view.assertCurrent();return view;}
export function myTimberExperienceReaderAffects(reader,path){return admittedReaders.get(reader)?.(path)===true;}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){myTimberExperienceHistoricalView();console.log('PASS exact My Timber experience source; original release and rollback guards retained; no deployment claimed');}
