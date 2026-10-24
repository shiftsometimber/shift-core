import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {immutableHistoryExecFileSync as exec} from './immutable-git-facts.mjs';
import {createRequire} from 'node:module';

export const MY_SHIFT_BASE='44ade5dfee81c299008912ac48c8e7f2a1adbe92';
export const MY_SHIFT_PAYLOAD='ea098411391682ee838f2af4af7221b40629d178';
export const MY_SHIFT_RECEIPT='release/my-shift-release-20261024.json';
export const MY_SHIFT_APPROVED_HEAD='ca5311330206b4360dd70742452afd26fc6f4663';
export const MY_SHIFT_SHARED_MAIN='625016ab3426bc5aa4ad84fcfcaed8c438e3e7e7';
export const MY_SHIFT_INTEGRATED='c09b42ee9210f55b03386e251508b4d066b4d35d';
export const MY_SHIFT_COMPOSITION_PATHS=Object.freeze(['release/my-shift-release-scope-20261024.mjs','tests/my-shift-release-scope-20261024.test.mjs']);
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
const git=(...args)=>exec('git',args,{encoding:'utf8',maxBuffer:64e6}).trimEnd();
const bytes=(ref,path)=>exec('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:64e6});
const oid=value=>createHash('sha1').update('blob '+Buffer.byteLength(value)+'\0').update(value).digest('hex');
const sorted=values=>[...values].sort();
const changed=(a,b)=>git('diff','--no-renames','--name-only',a,b).split('\n').filter(Boolean);
const once=(value,part,replacement='')=>{assert.equal(value.split(part).length,2,'One exact My Shift maintenance inverse required');return value.replace(part,replacement);};
export function originalMyShiftMaintenance(path,value){
 if(path==='release/approved-source-comparison-20261024.mjs')return once(once(value,COMPARISON_IMPORT),COMPARISON_HOOK);
 if(path==='release/app-scope.mjs')return once(once(value,APP_IMPORT),APP_AFTER,APP_BEFORE);
 if(path==='release/combined-finite-scope-20261014.mjs')return once(value,DEFAULT_AFTER,DEFAULT_BEFORE);
 return value;
}
export function originalMyShiftEntry(value){
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
export function verifyMyShiftComposition({head,receipt}){
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
  if(![...MY_SHIFT_COMPOSITION_PATHS,MY_SHIFT_RECEIPT].includes(path))assert.equal(bytes(head,path),bytes(MY_SHIFT_INTEGRATED,path),'Integrated runtime or original safety assertion drift: '+path);
 }
 return {head,paths:MY_SHIFT_PATHS,receipt};
}
export function verifyMyShiftRelease(requestedHead){
 const head=git('rev-parse','HEAD');if(requestedHead)assert.equal(requestedHead,head,'Actual My Shift source HEAD required');
 assert.equal(git('diff','--name-only','HEAD','--'),'','My Shift tracked working source changed');assert.equal(git('diff','--cached','--name-only','--'),'','My Shift staged source changed');
 const receipt=JSON.parse(bytes(head,MY_SHIFT_RECEIPT));
 verifyMyShiftComposition({head,receipt});
 // Register only after native qualification of both exact finite increments.
 // Resolve the already-initialised registry lazily: a static import introduces
 // an ESM cycle when the existing comparison module is imported independently.
 const {RECONCILIATION_PATHS}=createRequire(import.meta.url)('./approved-runtime-composition.mjs');
 for(const path of MY_SHIFT_PATHS)RECONCILIATION_PATHS.add(path);
 return Object.freeze({head,paths:MY_SHIFT_PATHS,receipt});
}
export function myShiftComparisonValue(path,value,head){
 if(path!=='member-experience/entry.mjs')return value;
 const current=MY_SHIFT_BLOBS[path],identifier=value===current,content=typeof value==='string'&&oid(value)===current;
 if(!identifier&&!content)return value;
 const proof=verifyMyShiftRelease(head);return identifier?'cdb3c419760c11c8511e4dfb68ac5a8cab4b8bad':originalMyShiftEntry(bytes(proof.head,path));
}
export function myShiftSafetyComparison(path,value){
 if(!['release/approved-source-comparison-20261024.mjs','release/combined-finite-scope-20261014.mjs'].includes(path))return value;
 const {head}=verifyMyShiftRelease(),actual=git('rev-parse',head+':'+path);if(value!==actual)return value;
 return git('rev-parse',MY_SHIFT_BASE+':'+path);
}
