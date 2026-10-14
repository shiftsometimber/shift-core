import {myTimberWeekHistoricalView,myTimberWeekHistoricalFile,weekRuntimeIfPresent,weekWorkflowIfPresent,weekRootIfPresent} from './my-timber-week-scope.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export const PHOTO_ACCEPTANCE_BASE='77a1f511ee93243351b4b885fb604f33ac623d4d';
export const PHOTO_ACCEPTANCE_SOURCE='301c8ae0f8d004e3d3abc8379a22121738ae0989';
export const PHOTO_ACCEPTANCE_BLOBS=Object.freeze({'g2-013-progress-picture-rendered-production.mjs':'8051ff5034726726197b82dca7a4c7addcac2d87','rendered-member-acceptance-support.mjs':'6ba6f6f336a8658b40b5a1c0e16e43e1e3bbc12d','tests/rendered-member-acceptance-support.test.mjs':'4dd2eca6cdbc3977c56d0f2f8be8b776bc1b9f1f'});
export const PHOTO_ACCEPTANCE_PATHS=Object.freeze(Object.keys(PHOTO_ACCEPTANCE_BLOBS));
export const PHOTO_ACCEPTANCE_MAINTENANCE=Object.freeze(['release/photo-acceptance-maintenance-scope.mjs','tests/photo-acceptance-maintenance-composition.test.mjs','release/root-share-completion-scope.mjs','tests/root-share-completion-composition.test.mjs','release/approved-runtime-composition.mjs','.github/workflows/shift-coach-integration.yml','docs/photo-acceptance-maintenance-20261014.json']);
export const PHOTO_ACCEPTANCE_APPROVAL=Object.freeze({"owner":"Matt","instruction":"Do","recordedAt":"2026-10-12T18:46:03Z","scope":"Existing My Timber upgrade through #1065, including photo access and deletion verification; bounded corrective work only","source":"9610259f261ff0a125c9af753d447268d7ab2e3d","maintenanceSource":"dac6e5c392cd89b122598b37be44d9565cd1b7ba","integrationIssue":1065,"emailAuthority":false,"rollbackAuthorityBroadened":false});
export const PHOTO_ACCEPTANCE_RELEASE_APPROVAL=Object.freeze({owner:'Matt',instruction:'Deploy',recordedAt:'2026-10-14T06:38:34Z',scope:'Prepared three-file photo-consent verification correction through #1065; required finite maintenance only; no runtime or business change',source:PHOTO_ACCEPTANCE_SOURCE,integrationIssue:1065,emailAuthority:false,rollbackAuthorityBroadened:false});
export const PHOTO_ACCEPTANCE_EVIDENCE=Object.freeze({source:'2477783ae8dac9c055a620958d1112611296b57a',base:PHOTO_ACCEPTANCE_BASE,servingProduction:38507512275,renderedRun:38518868843,renderedJob:115703730442,renderedTerminal:'2026-10-14T05:58:43Z',memberRun:38518868807,memberJob:115703729989,memberTerminal:'2026-10-14T05:56:54Z',renderedArtifact:11872774088,renderedBytes:4833869,renderedSHA256:'ecd9965e21871c55a168bf9e27902a4b52f56faf05754c7c5273b73b1c7b9861',singleVisibilityDeadlineMs:15000});
export const PHOTO_ACCEPTANCE_FLAGS=Object.freeze(['runtimeChanged','homepageChanged','clinicalChanged','stockChanged','customerDataChanged','consentAutomaticallyGranted','storagePolicyChanged','paidModelEnabled','emailGeneratingStepsStarted','externalCommunicationsSent','existingGatesWeakened','deploymentAuthorityBroadened','rollbackAuthorityBroadened']);
export const ROOT_IMPORT="import {photoAcceptanceHistoricalView,photoAcceptanceHistoricalFile} from './photo-acceptance-maintenance-scope.mjs';\n";
export const ROOT_HEAD_OLD=" const rawHead=git('rev-parse','HEAD'),current=JSON.parse(contents(rawHead,manifest)),c=current.rootShareCompletionRepair;";
export const ROOT_HEAD_NEW=" const overlay=photoAcceptanceHistoricalView(reader,{defaultReader}),rawHead=overlay.head,current=overlay.record,c=current.rootShareCompletionRepair;";
export const ROOT_READ_OLD=" const rawBlob=(r,p)=>git('rev-parse',(r==='HEAD'?rawHead:r)+':'+p),rawRead=defaultReader?rawBlob:reader,rawContent=(r,p)=>contents(r==='HEAD'?rawHead:r,p);";
export const ROOT_READ_NEW=" const rawBlob=overlay.blob,rawRead=overlay.read,rawContent=overlay.content;";
export const ROOT_RAW_OLD='rawHead,head',ROOT_RAW_NEW='rawHead:overlay.rawHead,head';
export const ROOT_FILE_OLD="export function rootShareCompletionHistoricalFile(p,bytes){const v=rootShareCompletionHistoricalView();assert.equal(bytes,contents(v.rawHead,p),'Actual current completion file required');return v.rawHead===v.head?bytes:contents(v.head,p);}";
export const ROOT_FILE_NEW="export function rootShareCompletionHistoricalFile(p,bytes){const photo=photoAcceptanceHistoricalView();bytes=photoAcceptanceHistoricalFile(p,bytes);const v=rootShareCompletionHistoricalView();assert.equal(bytes,contents(photo.head,p),'Actual current completion file required');return photo.head===v.head?bytes:contents(v.head,p);}";
export const TEST_IMPORT="import {photoAcceptanceHistoricalFile} from '../release/photo-acceptance-maintenance-scope.mjs';\n";
export const TEST_OLD="inverse(readFileSync(p,'utf8'))",TEST_NEW="inverse(photoAcceptanceHistoricalFile(p,readFileSync(p,'utf8')))";
export const RUNTIME_IMPORT="import {PHOTO_ACCEPTANCE_BASE,PHOTO_ACCEPTANCE_PATHS,PHOTO_ACCEPTANCE_MAINTENANCE} from './photo-acceptance-maintenance-scope.mjs';\n";
export const RUNTIME_BRANCH=" if(PHOTO_ACCEPTANCE_ADDITIONAL_PATHS.includes(path)){\n  let existed;try{execFileSync('git',['cat-file','-e',PHOTO_ACCEPTANCE_BASE+':'+path],{stdio:'ignore'});existed=true;}catch{existed=false;}\n  assert((existed?['A','M']:['A']).includes(status),'Unexpected photo acceptance maintenance status: '+status+' '+path);return true;\n }\n";
export const RUNTIME_FOOTER="\nexport const PHOTO_ACCEPTANCE_ADDITIONAL_PATHS=Object.freeze([...PHOTO_ACCEPTANCE_PATHS,...PHOTO_ACCEPTANCE_MAINTENANCE].filter(p=>!RECONCILIATION_PATHS.has(p)));\nfor(const p of PHOTO_ACCEPTANCE_ADDITIONAL_PATHS)RECONCILIATION_PATHS.add(p);\n";
export const WORKFLOW_HOOK="      - name: Verify exact retained photo acceptance maintenance\n        run: node --test tests/photo-acceptance-maintenance-composition.test.mjs tests/rendered-member-acceptance-support.test.mjs\n";
const exactlyOnce=(s,a,b='')=>{assert.equal(s.split(a).length,2,'Exact single photo maintenance inverse required');return s.replace(a,b);};
export function originalPhotoAcceptanceRoot(s){s=weekRootIfPresent(s);s=exactlyOnce(s,ROOT_IMPORT);for(const[a,b]of [[ROOT_HEAD_NEW,ROOT_HEAD_OLD],[ROOT_READ_NEW,ROOT_READ_OLD],[ROOT_FILE_NEW,ROOT_FILE_OLD]])s=exactlyOnce(s,a,b);assert.equal(s.split(ROOT_RAW_NEW).length,3,'Exact two actual-HEAD identity hooks required');return s.replaceAll(ROOT_RAW_NEW,ROOT_RAW_OLD);}
export function originalPhotoAcceptanceTest(s){return exactlyOnce(exactlyOnce(s,TEST_IMPORT),TEST_NEW,TEST_OLD);}
export function originalPhotoAcceptanceRuntime(s){s=weekRuntimeIfPresent(s);for(const a of [RUNTIME_IMPORT,RUNTIME_BRANCH,RUNTIME_FOOTER])s=exactlyOnce(s,a);return s;}
export function originalPhotoAcceptanceWorkflow(s){s=weekWorkflowIfPresent(s);return exactlyOnce(s,WORKFLOW_HOOK);}
const manifest='release/approved-runtime-composition.json',sort=a=>[...a].sort();
const immutableFacts=new Map();
function git(...args){const immutable=args.slice(1).every(a=>!a.includes('HEAD')),key=JSON.stringify([process.cwd(),...args]);if(!immutable)return execFileSync('git',args,{encoding:'utf8'});if(!immutableFacts.has(key))immutableFacts.set(key,execFileSync('git',args,{encoding:'utf8'}));return immutableFacts.get(key);}
const inverses=[['release/root-share-completion-scope.mjs',originalPhotoAcceptanceRoot],['tests/root-share-completion-composition.test.mjs',originalPhotoAcceptanceTest],['release/approved-runtime-composition.mjs',originalPhotoAcceptanceRuntime],['.github/workflows/shift-coach-integration.yml',originalPhotoAcceptanceWorkflow]];
export function verifyPhotoAcceptanceMaintenance(c,{head,read,blob=read,diff,ancestor,content}){
 assert.equal(c?.proof,'EXACT_RETAINED_PHOTO_ACCEPTANCE_MAINTENANCE_20261014');assert.equal(c.base,PHOTO_ACCEPTANCE_BASE);assert.equal(c.source,PHOTO_ACCEPTANCE_SOURCE);assert.equal(c.integrationIssue,1065);assert.deepEqual(c.paths,PHOTO_ACCEPTANCE_PATHS);assert.deepEqual(c.maintenancePaths,PHOTO_ACCEPTANCE_MAINTENANCE);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.match(head,/^[a-f0-9]{40}$/);assert.deepEqual(c.existingApprovalReference,PHOTO_ACCEPTANCE_APPROVAL);assert.deepEqual(c.releaseApproval,PHOTO_ACCEPTANCE_RELEASE_APPROVAL);assert.deepEqual(c.verificationEvidence,PHOTO_ACCEPTANCE_EVIDENCE);
 for(const flag of PHOTO_ACCEPTANCE_FLAGS)assert.equal(c[flag],false,'Photo maintenance boundary: '+flag);
 for(const ref of [c.base,c.source,c.maintenanceSource])ancestor(ref,head);
 ancestor(c.base,c.source);ancestor(c.source,c.maintenanceSource);
 assert.deepEqual(sort(diff(c.base,c.source)),sort(c.paths),'Unrelated photo test payload');assert.deepEqual(sort(diff(c.source,c.maintenanceSource)),sort(c.maintenancePaths),'Unrelated photo maintenance');assert.deepEqual(diff(c.maintenanceSource,head),[manifest],'Unreviewed photo registration tail');assert.deepEqual(sort(diff(c.base,head)),sort([...c.paths,...c.maintenancePaths,manifest]),'Unreviewed photo paths');
 for(const[p,expected]of Object.entries(PHOTO_ACCEPTANCE_BLOBS)){assert.equal(blob(c.source,p),expected,'Frozen photo test payload drift');assert.equal(blob(PHOTO_ACCEPTANCE_EVIDENCE.source,p),expected,'Original terminal verification source drift');assert.equal(blob('HEAD',p),expected,'Approved composition source drift / photo test payload drift');assert.equal(read('HEAD',p),read(c.source,p),'Approved composition source drift / photo fresh reader drift');}
 for(const p of c.maintenancePaths){assert.equal(blob('HEAD',p),blob(c.maintenanceSource,p),'Approved composition source drift / photo maintenance drift');assert.equal(read('HEAD',p),read(c.maintenanceSource,p),'Approved composition source drift / photo maintenance fresh reader drift');}
 for(const[p,inverse]of inverses)assert.equal(inverse(content(head,p)),content(c.base,p),'Every original source/gate byte outside exact photo maintenance hooks retained: '+p);
 const prior=JSON.parse(content(c.base,manifest)),current=JSON.parse(content(head,manifest));delete current.photoAcceptanceMaintenance;assert.deepEqual(current,prior,'All prior identities/approvals/watermarks/evidence preserved');assert.deepEqual(prior.memberConsentRepair.releaseApproval,PHOTO_ACCEPTANCE_APPROVAL);
 return c;
}
export function photoAcceptanceHistoricalView(reader=null,{defaultReader=reader===null}={}){
 const week=myTimberWeekHistoricalView(reader,{defaultReader}),rawHead=week.head,contents=week.content,current=week.record,c=current.photoAcceptanceMaintenance;
 const rawBlob=week.blob,rawRead=week.read;
 if(!c)return{record:current,rawHead:week.rawHead,head:rawHead,read:rawRead,blob:rawBlob,content:contents};
 verifyPhotoAcceptanceMaintenance(c,{head:rawHead,read:rawRead,blob:rawBlob,diff:(a,b)=>git('diff','--name-only',a,b).trim().split('\n').filter(Boolean),ancestor:(a,b)=>git('merge-base','--is-ancestor',a,b),content:contents});
 const record=structuredClone(current);delete record.photoAcceptanceMaintenance;const changed=new Set([...c.paths,...c.maintenancePaths,manifest]),mapped=(r,p)=>r==='HEAD'&&changed.has(p)?c.base:r;
 return{record,rawHead:week.rawHead,head:c.base,read:(r,p)=>rawRead(mapped(r,p),p),blob:(r,p)=>rawBlob(mapped(r,p),p),content:(r,p)=>contents(mapped(r,p),p)};
}
export function photoAcceptanceHistoricalFile(p,bytes){const week=myTimberWeekHistoricalView();bytes=myTimberWeekHistoricalFile(p,bytes);const v=photoAcceptanceHistoricalView();assert.equal(bytes,git('show',week.head+':'+p),'Actual current photo maintenance file required');return week.head===v.head?bytes:git('show',v.head+':'+p);}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){photoAcceptanceHistoricalView();console.log('PASS exact retained photo test source, total15s, every original gate and prior identity');}

