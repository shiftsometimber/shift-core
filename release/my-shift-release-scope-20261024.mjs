import {nativeWorkingSourceDifferenceSize} from './immutable-git-facts.mjs';
import {verifyMemberRecordingRepair,RECORDING_REPAIR_BASE,memberRecordingComparisonValue,recordingRepairLegacyPaths,withMemberRecordingQualification} from './member-recording-repair-20261024.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync as actualReadFileSync,lstatSync} from 'node:fs';
import {execFileSync as exec} from 'node:child_process';
import {createRequire} from 'node:module';

export const MY_SHIFT_BASE='44ade5dfee81c299008912ac48c8e7f2a1adbe92';
export const MY_SHIFT_PAYLOAD='ea098411391682ee838f2af4af7221b40629d178';
export const MY_SHIFT_RECEIPT='release/my-shift-release-20261024.json';
export const MY_SHIFT_APPROVED_HEAD='ca5311330206b4360dd70742452afd26fc6f4663';
export const MY_SHIFT_SHARED_MAIN='625016ab3426bc5aa4ad84fcfcaed8c438e3e7e7';
export const MY_SHIFT_INTEGRATED='c09b42ee9210f55b03386e251508b4d066b4d35d';
export const MY_SHIFT_COMPOSITION_PATHS=Object.freeze(['release/app-scope.mjs','release/my-shift-release-scope-20261024.mjs','tests/my-shift-release-scope-20261024.test.mjs']);
export const MY_SHIFT_COMPOSITION_MARKER='// My Shift composition: retain both exact approved merge parents; see my-shift-release-scope-20261024.mjs.\n';
export const MY_SHIFT_BLOBS=Object.freeze({
 'docs/MY-SHIFT-RELEASE-20261024.md':'d26a3d18e3a316282c15a169a1aaa96e5d72f86b',
 'member-experience/entry.mjs':'3c216ea16a404c0b377f7ac94a4b2716c89e8d2a',
 'member-experience/my-shift.mjs':'6fa31c6ab75f6d9b7471beb81d3eae72a2aaff68',
 'member-experience/tests/my-shift.test.mjs':'00c98718adbe67e44ed9a0350dd48460b802856a',
 'preview/my-shift-browser.mjs':'e848219205047e58a461b4415dc2655a75e0be05',
 'preview/my-shift-proof/browser-receipt.json':'8b0b8b41489b2342fb09a542f8660f64916eada7'
});
export const MY_SHIFT_MAINTENANCE=Object.freeze(['release/my-shift-release-scope-20261024.mjs','tests/my-shift-release-scope-20261024.test.mjs','release/approved-source-comparison-20261024.mjs','release/app-scope.mjs','release/combined-finite-scope-20261014.mjs']);
export const MY_SHIFT_PATHS=Object.freeze([...Object.keys(MY_SHIFT_BLOBS),...MY_SHIFT_MAINTENANCE,MY_SHIFT_RECEIPT]);
export const MY_SHIFT_APPROVAL=Object.freeze({owner:'Matt',instruction:'Please do',scope:'Exact My Shift source registration and guarded deployment; preserve all safety assertions',homepage:false,purchasing:false,clinicalActivation:false,messaging:false});
export const COMPARISON_IMPORT="import {myShiftComparisonValue} from './my-shift-release-scope-20261024.mjs';\n";
export const COMPARISON_HOOK=" const shift=myShiftComparisonValue(path,value,head);if(shift!==value)return shift;\n";
export const DEFAULT_BEFORE=" if(defaultReader)return{...actual,currentReaderAuthenticated:true,legacyComparisonOnly:false};";
export const DEFAULT_AFTER=" if(defaultReader)return{...actual,read:(ref,path)=>approvedLegacyComparisonValue(ref,path,actual.read(ref,path),actual.rawHead),currentReaderAuthenticated:true,legacyComparisonOnly:false};";
export const APP_IMPORT="import {verifyMyShiftRelease,myShiftSafetyComparison,MY_SHIFT_PATHS} from './my-shift-release-scope-20261024.mjs';\n";
export const APP_BEFORE=" for(const [path,expected] of Object.entries(CURRENT_MAIN_SAFETY_CHECK_BLOBS))assert.equal(read(path),expected,'Merged safety-check source drift: '+path);\n return Object.keys(CURRENT_MAIN_SAFETY_CHECK_BLOBS);";
export const APP_AFTER=" verifyMyShiftRelease();\n for(const path of MY_SHIFT_PATHS)APP_PATHS.add(path);\n for(const [path,expected] of Object.entries(CURRENT_MAIN_SAFETY_CHECK_BLOBS))assert.equal(myShiftSafetyComparison(path,read(path)),expected,'Merged safety-check source drift: '+path);\n return Object.keys(CURRENT_MAIN_SAFETY_CHECK_BLOBS);";
let recordingProjection=false;
const nativeReadFileSync=(path,...args)=>recordingProjection&&typeof path==='string'?bytes(RECORDING_REPAIR_BASE,path):actualReadFileSync(path,...args);
let recoveryProjection=null;
const readFileSync=(path,...args)=>recoveryProjection&&(RECOVERY_FILES.includes(path)||path===MY_SHIFT_RECEIPT)?bytes(RECOVERY_BASE,path):nativeReadFileSync(path,...args);
const git=(...args)=>exec('git',recordingProjection?args.map(value=>value==='HEAD'?RECORDING_REPAIR_BASE:value.startsWith('HEAD:')?RECORDING_REPAIR_BASE+value.slice(4):value):args,{encoding:'utf8',maxBuffer:64e6}).trimEnd();
const bytes=(ref,path)=>exec('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:64e6});
const oid=value=>createHash('sha1').update('blob '+Buffer.byteLength(value)+'\0').update(value).digest('hex');
const sorted=values=>[...values].sort();
const changed=(a,b)=>git('diff','--no-renames','--name-only',a,b).split('\n').filter(Boolean);
const once=(value,part,replacement='')=>{assert.equal(value.split(part).length,2,'One exact My Shift maintenance inverse required');return value.replace(part,replacement);};
export function originalMyShiftMaintenance(path,value){
 value=memberRecordingComparisonValue(path,value);
 if(path==='release/approved-source-comparison-20261024.mjs')return once(once(value,COMPARISON_IMPORT),COMPARISON_HOOK);
 if(path==='release/app-scope.mjs'){if(value.includes(MY_SHIFT_COMPOSITION_MARKER))value=once(value,MY_SHIFT_COMPOSITION_MARKER);return once(once(value,APP_IMPORT),APP_AFTER,APP_BEFORE);}
 if(path==='release/combined-finite-scope-20261014.mjs')return once(value,DEFAULT_AFTER,DEFAULT_BEFORE);
 return value;
}
export function originalMyShiftEntry(value){
 value=memberRecordingComparisonValue('member-experience/entry.mjs',value);
 assert.equal(oid(value),MY_SHIFT_BLOBS['member-experience/entry.mjs'],'Exact approved My Shift route source required');
 value=once(value,"import {myShiftHTML,myShiftStyles,myShiftRuntime} from './my-shift.mjs';\n");
 value=once(value,"  if(['/member/my-shift','/member/my-shift.html','/my-shift'].includes(path))return new Response(request.method==='HEAD'?null:myShiftHTML(env),{headers:{...privateHeaders,'Content-Type':'text/html; charset=utf-8','Vary':'Cookie'}});\n  const shiftAsset={'/assets/member-experience/my-shift.mjs':[myShiftRuntime,'text/javascript'],'/assets/member-experience/my-shift.css':[myShiftStyles,'text/css']}[path];\n  if(shiftAsset)return new Response(request.method==='HEAD'?null:shiftAsset[0],{headers:{...privateHeaders,'Content-Type':shiftAsset[1]+'; charset=utf-8','Vary':'Cookie'}});\n");
 value=once(value,"ordersHTML(env.WORK_V1_ENABLED==='true').replace('<main id=\"main-content\">','<main id=\"main-content\"><p><a href=\"/member/my-shift\">Open My Shift · your account, care &amp; orders →</a></p>')","ordersHTML(env.WORK_V1_ENABLED==='true')");
 assert.equal(oid(value),'cdb3c419760c11c8511e4dfb68ac5a8cab4b8bad','Every original member route byte must remain');return value;
}
function verifyFrozenMyShiftRelease(){
 const head=MY_SHIFT_APPROVED_HEAD;
 const receipt=JSON.parse(bytes(head,MY_SHIFT_RECEIPT));assert.equal(receipt.kind,'EXACT_MY_SHIFT_OWNER_APPROVED_RELEASE_20261024');assert.equal(receipt.base,MY_SHIFT_BASE);assert.equal(receipt.payload,MY_SHIFT_PAYLOAD);assert.deepEqual(receipt.approval,MY_SHIFT_APPROVAL);assert.match(receipt.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.deepEqual(receipt.payloadBlobs,MY_SHIFT_BLOBS);assert.deepEqual(receipt.maintenancePaths,MY_SHIFT_MAINTENANCE);
 for(const [a,b]of [[MY_SHIFT_BASE,MY_SHIFT_PAYLOAD],[MY_SHIFT_PAYLOAD,receipt.maintenanceSource],[receipt.maintenanceSource,head]])git('merge-base','--is-ancestor',a,b);
 assert.deepEqual(sorted(changed(MY_SHIFT_BASE,MY_SHIFT_PAYLOAD)),sorted(Object.keys(MY_SHIFT_BLOBS)),'Only the reviewed My Shift payload may be admitted');
 assert.deepEqual(sorted(changed(MY_SHIFT_PAYLOAD,receipt.maintenanceSource)),sorted(MY_SHIFT_MAINTENANCE),'Only exact My Shift registration maintenance may be admitted');
 assert.deepEqual(changed(receipt.maintenanceSource,head),[MY_SHIFT_RECEIPT],'No unreviewed My Shift registration tail');
 assert.deepEqual(sorted(changed(MY_SHIFT_BASE,head)),sorted(MY_SHIFT_PATHS),'Unrelated production source, configuration or workflow change rejected');
 for(const [path,expected]of Object.entries(MY_SHIFT_BLOBS)){assert.equal(git('rev-parse',head+':'+path),expected,'My Shift payload drift: '+path);assert.equal(git('rev-parse',MY_SHIFT_PAYLOAD+':'+path),expected);}
 for(const path of MY_SHIFT_MAINTENANCE)assert.equal(git('rev-parse',head+':'+path),git('rev-parse',receipt.maintenanceSource+':'+path),'My Shift registration drift: '+path);
 for(const path of MY_SHIFT_PATHS)assert(git('ls-tree',head,'--',path).startsWith('100644 blob '),'Regular My Shift source required: '+path);
 assert.equal(originalMyShiftEntry(bytes(head,'member-experience/entry.mjs')),bytes(MY_SHIFT_BASE,'member-experience/entry.mjs'));
 for(const path of ['release/approved-source-comparison-20261024.mjs','release/app-scope.mjs','release/combined-finite-scope-20261014.mjs'])assert.equal(originalMyShiftMaintenance(path,bytes(head,path)),bytes(MY_SHIFT_BASE,path),'Every prior release assertion and pin must remain: '+path);
 return receipt;
}
function verifyOriginalMyShiftComposition({head,receipt}){
 const frozen=verifyFrozenMyShiftRelease(),{compositionMaintenance,...originalReceipt}=receipt;
 assert.deepEqual(originalReceipt,frozen,'Original My Shift receipt must remain immutable');
 assert.match(compositionMaintenance,/^[a-f0-9]{40}$/,'Exact composition maintenance source required');
 assert.equal(git('show','-s','--format=%P',MY_SHIFT_INTEGRATED),MY_SHIFT_SHARED_MAIN+' '+MY_SHIFT_APPROVED_HEAD,'Exact independently merged main parents required');
 git('merge-base','--is-ancestor',MY_SHIFT_BASE,MY_SHIFT_SHARED_MAIN);
 const sharedPaths=['.github/workflows/online-privacy-recovery-proof.yml','home-header-baseline-20261024.mjs','home-speed-repair.mjs','release/app-scope.mjs','release/approved-source-comparison-data-20261024.mjs','timber-shed-public-teaser.mjs'];
 assert.deepEqual(changed(MY_SHIFT_BASE,MY_SHIFT_SHARED_MAIN),sharedPaths,'Only the exact independently merged release may compose');
 assert.deepEqual(changed(MY_SHIFT_APPROVED_HEAD,MY_SHIFT_INTEGRATED),sharedPaths,'Unexpected merge resolution rejected');
 for(const path of sharedPaths){
  if(path==='release/app-scope.mjs')assert.equal(originalMyShiftMaintenance(path,bytes(MY_SHIFT_INTEGRATED,path)),bytes(MY_SHIFT_SHARED_MAIN,path),'Both releases must retain every safety assertion');
  else assert.equal(bytes(MY_SHIFT_INTEGRATED,path),bytes(MY_SHIFT_SHARED_MAIN,path),'Independent main release byte drift: '+path);
 }
 for(const [a,b]of [[MY_SHIFT_INTEGRATED,compositionMaintenance],[compositionMaintenance,head]])git('merge-base','--is-ancestor',a,b);
 assert.deepEqual(changed(MY_SHIFT_INTEGRATED,compositionMaintenance),sorted(MY_SHIFT_COMPOSITION_PATHS),'Only composition qualification and its tests may change');
 assert.deepEqual(changed(compositionMaintenance,head),[MY_SHIFT_RECEIPT],'No unreviewed composition tail');
 assert.deepEqual(changed(MY_SHIFT_INTEGRATED,head),sorted([...MY_SHIFT_COMPOSITION_PATHS,MY_SHIFT_RECEIPT]),'Runtime, workflow or unrelated source change rejected');
 for(const path of MY_SHIFT_COMPOSITION_PATHS)assert.equal(bytes(head,path),bytes(compositionMaintenance,path),'Composition maintenance byte drift: '+path);
 const checked=sorted(new Set([...MY_SHIFT_PATHS,...sharedPaths]));
 for(const path of checked){
  assert(git('ls-tree',head,'--',path).startsWith('100644 blob '),'Regular composition source required: '+path);
  assert.equal(readFileSync(path,'utf8'),bytes(head,path),'Actual composition worktree bytes changed: '+path);
  if(path==='release/app-scope.mjs')assert.equal(once(bytes(head,path),MY_SHIFT_COMPOSITION_MARKER),bytes(MY_SHIFT_INTEGRATED,path),'Only the exact owning scope composition note may change');
  if(![...MY_SHIFT_COMPOSITION_PATHS,MY_SHIFT_RECEIPT].includes(path))assert.equal(bytes(head,path),bytes(MY_SHIFT_INTEGRATED,path),'Integrated runtime or original safety assertion drift: '+path);
 }
 return {head,paths:MY_SHIFT_PATHS,receipt};
}
export function verifyMyShiftRelease(requestedHead){return withMemberRecordingQualification(()=>verifyRecordingAwareMyShiftRelease(requestedHead));}
function verifyRecordingAwareMyShiftRelease(requestedHead){
 const head=git('rev-parse','HEAD');if(requestedHead)assert.equal(requestedHead,head,'Actual My Shift source HEAD required');
 assert.equal(nativeWorkingSourceDifferenceSize(),0,'My Shift tracked working source changed');assert.equal(git('diff','--cached','--name-only','--'),'','My Shift staged source changed');
 const receipt=JSON.parse(bytes(head,MY_SHIFT_RECEIPT));
 verifyMyShiftComposition({head,receipt});
 // Register only after native qualification of both exact finite increments.
 // Resolve the already-initialised registry lazily: a static import introduces
 // an ESM cycle when the existing comparison module is imported independently.
 const {RECONCILIATION_PATHS}=createRequire(import.meta.url)('./approved-runtime-composition.mjs');
 for(const path of MY_SHIFT_PATHS)RECONCILIATION_PATHS.add(path);
 for(const path of recordingRepairLegacyPaths())RECONCILIATION_PATHS.add(path);
 return Object.freeze({head,paths:MY_SHIFT_PATHS,receipt});
}
export function myShiftComparisonValue(path,value,head){
 if(RECOVERY_FILES.includes(path)){
  const current=memberRecordingComparisonValue(path,git('rev-parse','HEAD:'+path),head);
  value=memberRecordingComparisonValue(path,value,head);
  const identifier=value===current,content=typeof value==='string'&&oid(value)===current;
  if(!identifier&&!content)return value;
  const proof=verifyMyShiftRelease(head);if(!proof.receipt.releaseRecoveryMaintenance)return value;
  return identifier?git('rev-parse',RECOVERY_BASE+':'+path):bytes(RECOVERY_BASE,path);
 }
 if(path!=='member-experience/entry.mjs')return value;
 const current=MY_SHIFT_BLOBS[path],identifier=value===current,content=typeof value==='string'&&oid(value)===current;
 if(!identifier&&!content)return value;
 const proof=verifyMyShiftRelease(head);return identifier?'cdb3c419760c11c8511e4dfb68ac5a8cab4b8bad':originalMyShiftEntry(bytes(proof.head,path));
}
export function myShiftSafetyComparison(path,value){
 if(!['release/approved-source-comparison-20261024.mjs','release/combined-finite-scope-20261014.mjs'].includes(path))return value;
 return withMemberRecordingQualification(()=>{
  const {head}=verifyMyShiftRelease(),actual=memberRecordingComparisonValue(path,git('rev-parse',head+':'+path),head);
  value=memberRecordingComparisonValue(path,value,head);if(value!==actual)return value;
  return git('rev-parse',MY_SHIFT_BASE+':'+path);
 });
}

export const RECOVERY_BASE='2ac8456e8394c1508b13481fad1f68520926f10b';
export const RECOVERY_FILES=Object.freeze(['release/app-preflight.mjs','release/my-shift-release-scope-20261024.mjs','scripts/b1-release-scope.mjs','tests/my-shift-release-scope-20261024.test.mjs']);
const ADMISSION_BLOBS=Object.freeze({
 ".github/workflows/online-privacy-recovery-proof.yml": "52341409f18e452c6fe4c83fb1730427e0b1e544",
 ".github/workflows/whole-estate-route-sweep.yml": "7252162d1ac21edafd8e71ae504f7c7ad6023ac3",
 "approved-public-corrections-20261024.mjs": "79ef8d2d5c07b228523ee2c85551ff7363b93df0",
 "approved-public-corrections-data-20261024.mjs": "03d46a1e31d6247a7fdaff6af3397238125a0812",
 "babylove/dynamic-public.mjs": "30accc79e573188eebe2dd3432a1ab3a4287fc0d",
 "causes-partners-teaser.mjs": "988f6bcd0c30a6d1f1dcbdb40c20062c1ac471a3",
 "causes-partners/README.md": "719c8c220010064561446bbbdc347e50f3c776ff",
 "causes-partners/index.html": "ed94be14806e90842f4fa7364f10ceb206862e9d",
 "causes-partners/production.mjs": "f0ccef7b041750f4ace8fd87c508e77fc6d56014",
 "causes-partners/public-content.mjs": "bdb0719796941fc05a6911f0c07c36bba1a7400c",
 "continuity-interest-v1.js": "9c82570da17bfbc5e45b0b5d343f8ce56503f405",
 "docs/MY-SHIFT-RELEASE-20261024.md": "d26a3d18e3a316282c15a169a1aaa96e5d72f86b",
 "frontend/member/assets/causes/hopeful-outlook-hero.webp": "11653daaccd8d7e56cae8c40813ef8368b6fe8db",
 "gate1-whole-estate-production-sweep.mjs": "5a9a737b89267158c63ca7634b0b22a62ec1fa88",
 "home-header-baseline-20261024.mjs": "8dcab2585a0a07844a73c9670f609055ac909410",
 "home-speed-repair.mjs": "f0d2db246ea89b2cce17a2a05c9d8d77fe6f008f",
 "member-experience/entry.mjs": "3c216ea16a404c0b377f7ac94a4b2716c89e8d2a",
 "member-experience/my-shift.mjs": "6fa31c6ab75f6d9b7471beb81d3eae72a2aaff68",
 "member-experience/tests/my-shift.test.mjs": "00c98718adbe67e44ed9a0350dd48460b802856a",
 "preview/my-shift-browser.mjs": "e848219205047e58a461b4415dc2655a75e0be05",
 "preview/my-shift-proof/browser-receipt.json": "8b0b8b41489b2342fb09a542f8660f64916eada7",
 "public-response-policy.test.mjs": "d2c8c91a42e994c56b3454918bb657e5a348d8f3",
 "release/app-scope.mjs": "359a0ad45db487b3d67f0d594722c8a1ec887dc4",
 "release/approved-source-comparison-20261024.mjs": "c2ce48a0c6b4e8151fcf3abd99953685c43a0cf8",
 "release/approved-source-comparison-data-20261024.mjs": "b212df000aee8b17cc3055df232f60f2794df016",
 "release/combined-finite-scope-20261014.mjs": "635bd74e852690e8f0e3856418b604485263dd4b",
 "release/current-runtime-preservation-20261016.mjs": "c83b127e10e6de3362c6c723f489c79a7526bcf4",
 "release/health-vision-scope-20261021.json": "dfe23473a3247db95a78c76aa7d346c03b395124",
 "release/health-vision-scope-20261021.mjs": "6774ca1d4e35bc9b241ac7d527aedc9557ca5f96",
 "release/my-shift-release-20261024.json": "fd5e96adcd344062c1b988915a7d70c893d5d95d",
 "release/my-shift-release-scope-20261024.mjs": "31a91e9dba1ff0d71d8817af5b9685c32db54ad5",
 "release/recorded-week-navigation-outer-frame-20261018.mjs": "dd48e3d21472804243a7e9c141b0ff8a7ee89a77",
 "release/root-share-preview-scope.mjs": "aff239d1880a84481dd62ff1d71b3eef17216811",
 "release/shift-health-vision-20261021/STATUS.json": "bc63135b2c67ed828df735eab7fde6c92f2e1486",
 "release/shift-health-vision-20261021/checks.json": "5c9a580e49d3acb0ddb5396ae66a5ef060be9333",
 "release/shift-health-vision-20261021/health-vision-preservation.json": "9c9f961bc14e28fc4a2990b10061f6cf4032b05c",
 "release/shift-health-vision-20261021/live-status-latest.json": "fe50e877b49381b5a650c173d7055cca9976e704",
 "release/shift-health-vision-20261021/production-bundle-final.log": "f52f3b60fc8f8515fd8d098e86dfc75c95ac1b7e",
 "release/shift-health-vision-20261021/source-tests-final.log": "a205e7e0db556eb9c2d2e885635d81d3f4cacd86",
 "reta-styles-data.mjs": "80d7fa9573ade9b48600c568d3843fba8b7e0d3a",
 "review/nhs-vs-private-eligibility-exact-body-20261023.md": "aa70e4acabd1aedba74f04d543ca84f518075fed",
 "review/saxenda-orlistat-exact-addendum-20261023.md": "5cda45dd5ac0648a0559438da27cf82399d59be3",
 "review/shift-product-events-v42m-generic-form-removal.diff": "007fdd8957545cf670c9ce5225ce750171135bc5",
 "review/shift-product-events-v42m-generic-form-removal.proposed.js": "c04b5e2eb1b08e15dcf7f1fa38f007166371cd11",
 "shift-coach/release-contract.mjs": "9b86959aa0b88793d8b3df38f397880e971119f3",
 "shift-health-vision-content.mjs": "4977181a6d1234b3e4870015e80988b33133a757",
 "tests/approved-public-corrections-20261024.test.mjs": "f87dc2a7dc796b50691553f3851b4be0288dc175",
 "tests/approved-source-comparison-20261024.test.mjs": "9c9e3af228b7dde074621698ebe8f49c85323f45",
 "tests/causes-partners-teaser.test.mjs": "58075dcb2c12fe5b7fa8f28b47d7b4123862c202",
 "tests/causes-public.test.mjs": "1f9b1a1771a7469cc1d3c7e97322b7462d12e356",
 "tests/contact-delivery-contract.test.mjs": "2195328a74ec0c86a49a6fcc6b61aebcc418e1fd",
 "tests/contact-success-analytics.test.mjs": "ec8387b925cd7d97420a585d30c8c81d31ef76fe",
 "tests/fixtures/approved-corrections-20261024/nhs-before.json": "297367c88854c575b79dea953df729fe5d726c22",
 "tests/generic-form-telemetry-removal.test.mjs": "bd1c15590b3d6a1580978c825ff8bee7c3b86625",
 "tests/health-vision-scope-20261021.test.mjs": "cfcf23c78067ca32135e9ea2f241554373e0372f",
 "tests/my-shift-release-scope-20261024.test.mjs": "0ac1c140eb445fa9dfd47f1dd6239557f08db8d1",
 "tests/release-recovery-safety-20261024.test.mjs": "8e364b0358faf18ab78053859db2756e635e754e",
 "tests/root-share-preview-composition.test.mjs": "cb410665b8b0294a102d9a04d4f84ffe44e2387f",
 "tests/root-share-preview.test.mjs": "d69bcf08a28cb1008b38693968377352fb976044",
 "tests/timber-shed-public-teaser.test.mjs": "38710aaa9c900322a1cac68276104a738c74a6f8",
 "timber-shed-public-teaser.mjs": "3d8d11d641a1409aab7b8013bb7cb4d941d98506",
 "transactional-email-v1.js": "4713c190b1d502bac7f22d8c6a4d476c0cf5857b",
 "worker-entry-v6.js": "02f14a8badfacae1fd829b1148ba3169fb2e5459"
});
const CLI_INVERSES=Object.freeze({
 "release/app-preflight.mjs": [
  {
   "start": 0,
   "after": "import {verifiedCurrentReleaseAdmission} from './my-shift-release-scope-20261024.mjs';\n",
   "before": ""
  },
  {
   "start": 2083,
   "after": "();\nconst currentReleaseAdmission=verifiedCurrentReleaseAdmission",
   "before": ""
  },
  {
   "start": 15155,
   "after": "currentReleaseAdmission.refs.get(p)??(",
   "before": ""
  },
  {
   "start": 16197,
   "after": ")",
   "before": ""
  }
 ],
 "scripts/b1-release-scope.mjs": [
  {
   "start": 0,
   "after": "import {verifiedCurrentReleaseAdmission} from '../release/my-shift-release-scope-20261024.mjs';\n",
   "before": ""
  },
  {
   "start": 24915,
   "after": "currentReleaseAdmission=verifiedCurrentReleaseAdmission();\n  const ",
   "before": ""
  },
  {
   "start": 25039,
   "after": "!currentReleaseAdmission.refs.has(path)&&",
   "before": ""
  }
 ]
});
export function originalAdmissionCli(path,value){
 value=memberRecordingComparisonValue(path,value);
 const edits=CLI_INVERSES[path];assert(edits,'Only the two source-admission CLIs have an inverse');
 for(const edit of [...edits].reverse()){
  assert.equal(value.slice(edit.start,edit.start+edit.after.length),edit.after,'Exact source-admission repair changed');
  value=value.slice(0,edit.start)+edit.before+value.slice(edit.start+edit.after.length);
 }
 assert.equal(value,bytes(RECOVERY_BASE,path),'Every original admission assertion and byte must remain');return value;
}
function qualifyRecovery(head,receipt){
 const {releaseRecoveryMaintenance,...prior}=receipt;
 assert.deepEqual(prior,JSON.parse(bytes(RECOVERY_BASE,MY_SHIFT_RECEIPT)),'Original composed release receipt must remain immutable');
 assert.equal(releaseRecoveryMaintenance.base,RECOVERY_BASE,'Exact recovery base required');
 assert.deepEqual(Object.keys(releaseRecoveryMaintenance).sort(),['base','source'],'Only exact recovery provenance fields allowed');
 const source=releaseRecoveryMaintenance.source;assert.match(source,/^[a-f0-9]{40}$/,'Exact recovery maintenance source required');
 for(const [a,b]of [[RECOVERY_BASE,source],[source,head]])git('merge-base','--is-ancestor',a,b);
 assert.deepEqual(changed(RECOVERY_BASE,source),sorted(RECOVERY_FILES),'Only the exact source-admission repair files may change');
 assert.deepEqual(changed(source,head),[MY_SHIFT_RECEIPT],'No unreviewed recovery receipt tail');
 for(const path of [...RECOVERY_FILES,MY_SHIFT_RECEIPT]){
  assert(git('ls-tree',head,'--',path).startsWith('100644 blob '),'Regular recovery source required');
  assert(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink(),'Actual regular recovery source required');
  assert.equal(nativeReadFileSync(path,'utf8'),bytes(head,path),'Actual recovery worktree bytes changed');
  if(path!==MY_SHIFT_RECEIPT)assert.equal(bytes(head,path),bytes(source,path),'Recovery maintenance byte drift');
 }
 for(const path of Object.keys(CLI_INVERSES))originalAdmissionCli(path,bytes(head,path));
 return {source,prior};
}
export function verifyMyShiftComposition({head,receipt}){
 if(!recordingProjection){const recording=verifyMemberRecordingRepair();assert.equal(head,recording.head,'Actual repair source HEAD required');const actual=JSON.parse(bytes(head,MY_SHIFT_RECEIPT));assert.match(receipt.compositionMaintenance,/^[a-f0-9]{40}$/,'Exact composition maintenance source required');assert.deepEqual(receipt.releaseRecoveryMaintenance,actual.releaseRecoveryMaintenance,'Native recovery receipt required');assert.deepEqual(receipt,actual,'Original My Shift receipt must remain immutable');recordingProjection=true;try{return verifyMyShiftComposition({head:RECORDING_REPAIR_BASE,receipt:JSON.parse(bytes(RECORDING_REPAIR_BASE,MY_SHIFT_RECEIPT))});}finally{recordingProjection=false;}}
 if(!receipt.releaseRecoveryMaintenance)return verifyOriginalMyShiftComposition({head,receipt});
 assert.equal(head,git('rev-parse','HEAD'),'Actual recovery source HEAD required');
 const native=JSON.parse(bytes(head,MY_SHIFT_RECEIPT)),proof=qualifyRecovery(head,native);
 assert.deepEqual(receipt.releaseRecoveryMaintenance,native.releaseRecoveryMaintenance,'Native recovery receipt required');
 const {releaseRecoveryMaintenance,...prior}=receipt;
 const previous=recoveryProjection;recoveryProjection=proof;
 try{return verifyOriginalMyShiftComposition({head:RECOVERY_BASE,receipt:prior});}
 finally{recoveryProjection=previous;}
}
export function verifiedCurrentReleaseAdmission(){
 return withMemberRecordingQualification(()=>{
 const proof=verifyMyShiftRelease(),repair=proof.receipt.releaseRecoveryMaintenance,refs=new Map();
 for(const [path,pin]of Object.entries(ADMISSION_BLOBS)){
  const recording=memberRecordingComparisonValue(path,git('rev-parse',proof.head+':'+path),proof.head);
  const ref=repair&&path===MY_SHIFT_RECEIPT?proof.head:repair&&RECOVERY_FILES.includes(path)?repair.source:RECOVERY_BASE;
  const expected=ref===RECOVERY_BASE?pin:git('rev-parse',ref+':'+path);
  assert.equal(recording,expected,'Exact current release admission source drift: '+path);
  assert(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink(),'Actual regular admission source required');
  assert.equal(memberRecordingComparisonValue(path,oid(actualReadFileSync(path)),proof.head),expected,'Actual admission source bytes changed: '+path);
  refs.set(path,ref);
 }
 for(const path of recordingRepairLegacyPaths())refs.set(path,proof.head);
 return {head:proof.head,refs};
 });
}
