export const WEEK_SCOPE_IMPORT="import {withImmutableHistoryVerification,immutableHistoryExecFileSync} from '../release/approved-runtime-composition.mjs';\n";
export const WEEK_SCOPE_ALIAS="const execFileSync=(...args)=>immutableHistoryExecFileSync(...args);\n";
export const WEEK_SCOPE_BEGIN="const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim(),candidate=process.env.SHIFT_COACH_SOURCE||'HEAD';\n";
export const WEEK_SCOPE_END="console.log(JSON.stringify({...verifyCoachingRelease(),listedAdditions:additions.size,listedBackendChanges:COACH_BACKEND_PATHS.size,productionActivated:false}));\n";
export const WEEK_B1_IMPORT="import {withImmutableHistoryVerification,immutableHistoryExecFileSync} from '../release/approved-runtime-composition.mjs';\n";
export const WEEK_B1_ALIAS="const execFileSync=(...args)=>immutableHistoryExecFileSync(...args);\n";
export const WEEK_B1_BEGIN="export function verifyScope(){\n";
export const WEEK_B1_END=" return report;\n}\nconst sha=value=>createHash('sha256').update(value).digest('hex');\n";
export const MY_TIMBER_WEEK_CANCELLED_PHOTO=Object.freeze({"source": "9167d3ae3ffd0ba81da115ea0578637ede5ef832", "run": 38527223352, "job": 115730418888, "deployment": "8be2ef4c-e00c-418b-87ee-f4f1233d24c7", "version": "55de38ee-ddc9-4c29-a8a0-b580775242d5", "previousSource": "77a1f511ee93243351b4b885fb604f33ac623d4d", "previousRun": 38507512275, "previousJob": 115668367027, "previousDeployment": "393f7a40-10f9-41b6-934b-5627bb09e4c1", "previousVersion": "779eea92-d8a7-4c29-81ac-8ba62260c096", "artifact": 11878991663, "artifactBytes": 6457394, "artifactSHA256": "c44b0b7722c4e59cc07db568c0f0721260c43c0c227073ba382b598565c0acf1", "configurationSha256": "a030adf52fc1f5ee82f327aad59b9552dc598ff3471792f3a3d7242e7217d387", "tables": {"medicine_products": {"rows": 7, "sha256": "c8bd883da93a22686a8ef600f1b1d2c60b7a1e6726ac360d5c94f34f2a740031"}, "medicine_variants": {"rows": 39, "sha256": "8b3faf0e3bbb1cf756a6fd20b549bb1c1a58b1b2493a96a46282f2666ea565f8"}, "medicine_inventory": {"rows": 38, "sha256": "651986206bb0e9b1b833aa9da2eb031864946cda98a5e1a9e71f880d2eef49bb"}}});
export const WEEK_COACH_SOURCE_START="export function validateCoachingSource(read,manifest){\n";
export const WEEK_COACH_SOURCE_END=" return {recordedMain:COACH_BASE,applicationCommit:manifest.applicationCommit,paths:manifest.pinnedPaths.length};\n}\n";
export const WEEK_CONSENT_TEST_IMPORT="import {myTimberWeekHistoricalFile} from '../release/my-timber-week-scope.mjs';\n";
export const WEEK_CONSENT_TEST_OLD="const path='shift-coach/release-contract.mjs',current=readFileSync(path,'utf8');";
export const WEEK_CONSENT_TEST_NEW="const path='shift-coach/release-contract.mjs',current=myTimberWeekHistoricalFile(path,readFileSync(path,'utf8'));";
export const WEEK_COACH_IMPORT="import {withImmutableHistoryVerification,immutableHistoryExecFileSync} from '../release/approved-runtime-composition.mjs';\n";
export const WEEK_COACH_ALIAS="const execFileSync=(...args)=>immutableHistoryExecFileSync(...args);\n";
export const WEEK_COACH_START="export function verifyCoachingRelease({requireLaunch=false}={}){\n";
export const WEEK_COACH_END=" return {...proof,completeV2:false,productionLaunchApproved:manifest.decisions.productionLaunch.approved,requireLaunch};\n}\n";
export const WEEK_RECOVERY_IMPORT="import {PHOTO_CANCELLED,completeExactPhotoCancelledStock} from '../release/photo-cancelled-stock-completion-20261014.mjs';\n";
export const WEEK_RECOVERY_BRANCH="if(before.id===PHOTO_CANCELLED.deployment){\n const getLogs=async id=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/jobs/'+id+'/logs',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Exact original photo job logs required');return r.text();};\n const getArtifact=async id=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/artifacts/'+id+'/zip',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Exact original photo archive required');return Buffer.from(await r.arrayBuffer());};\n const freshSnapshot=async()=>{\n  const tables={};for(const table of ['medicine_products','medicine_variants','medicine_inventory']){\n   const sql='SELECT * FROM '+table+' ORDER BY '+(table==='medicine_inventory'?'variant_id':'id');\n   const raw=JSON.parse(wrangler('d1','execute','DB','--remote','--json','--command',sql));assert(raw.length&&raw.every(r=>r.success),'Original public stock snapshot query required');\n   const rows=raw.flatMap(r=>r.results||[]);tables[table]={rows:rows.length,sha256:createHash('sha256').update(JSON.stringify(rows)).digest('hex')};\n  }\n  return{phase:'after',checkedAt:new Date().toISOString(),release:process.env.GITHUB_SHA,tables,configurationSha256:createHash('sha256').update(readFileSync('wrangler.jsonc')).digest('hex'),customerRecordsRead:false,productionWrites:0};\n };\n ownedProof=await completeExactPhotoCancelledStock(before,version,get,getLogs,getArtifact,async()=>[active()],freshSnapshot);const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved after one exact cancelled photo baseline completion');decision='retain';\n}else ";
export const WEEK_ACCEPTANCE_TEST_IMPORT="import {myTimberWeekHistoricalView} from '../release/my-timber-week-scope.mjs';\n";
export const WEEK_ACCEPTANCE_TEST_OLD="execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'})";
export const WEEK_ACCEPTANCE_TEST_NEW="execFileSync('git',['rev-parse',myTimberWeekHistoricalView().head+':'+p],{encoding:'utf8'})";
export const WEEK_PHOTO_SCOPE_IMPORT="import {myTimberWeekHistoricalView,myTimberWeekHistoricalFile,weekRuntimeIfPresent,weekWorkflowIfPresent,weekRootIfPresent} from './my-timber-week-scope.mjs';\n";
export const WEEK_PHOTO_HEAD_OLD=" const rawHead=git('rev-parse','HEAD').trim(),contents=(r,p)=>git('show',(r==='HEAD'?rawHead:r)+':'+p),current=JSON.parse(contents(rawHead,manifest)),c=current.photoAcceptanceMaintenance;";
export const WEEK_PHOTO_HEAD_NEW=" const week=myTimberWeekHistoricalView(reader,{defaultReader}),rawHead=week.head,contents=week.content,current=week.record,c=current.photoAcceptanceMaintenance;";
export const WEEK_PHOTO_READ_OLD=" const rawBlob=(r,p)=>git('rev-parse',(r==='HEAD'?rawHead:r)+':'+p).trim(),rawRead=defaultReader?rawBlob:reader;";
export const WEEK_PHOTO_READ_NEW=" const rawBlob=week.blob,rawRead=week.read;";
export const WEEK_PHOTO_FILE_OLD="export function photoAcceptanceHistoricalFile(p,bytes){const v=photoAcceptanceHistoricalView();assert.equal(bytes,git('show',v.rawHead+':'+p),'Actual current photo maintenance file required');return v.rawHead===v.head?bytes:git('show',v.head+':'+p);}";
export const WEEK_PHOTO_FILE_NEW="export function photoAcceptanceHistoricalFile(p,bytes){const week=myTimberWeekHistoricalView();bytes=myTimberWeekHistoricalFile(p,bytes);const v=photoAcceptanceHistoricalView();assert.equal(bytes,git('show',week.head+':'+p),'Actual current photo maintenance file required');return week.head===v.head?bytes:git('show',v.head+':'+p);}";
export const WEEK_ROOT_IMPORT="import {weekPhotoTestIfPresent,weekRecoveryIfPresent} from './my-timber-week-scope.mjs';\n";
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export const MY_TIMBER_WEEK_BASE="9167d3ae3ffd0ba81da115ea0578637ede5ef832";
export const MY_TIMBER_WEEK_SOURCE="e80ab18db5046f7c13ad1b5cdd28beb4cac57c35";
export const MY_TIMBER_WEEK_CANDIDATE="8e8895afb82bd82e2354fc69acbcd9acfe39fba4";
export const MY_TIMBER_WEEK_PATHS=Object.freeze(["docs/my-timber-app-benchmark-20261013.md","docs/my-timber-treatment-week-20261013.md","docs/my-timber-treatment-week-20261013.receipt.json","frontend/member/member-progress-v1.js","member-experience/entry.mjs","member-experience/staging/verify-treatment-week.mjs","member-experience/tests/treatment-week-route.test.mjs","member-experience/tests/treatment-week.test.mjs","member-experience/treatment-routes.mjs","member-experience/treatment-week-client.mjs","member-experience/treatment-week-route.mjs","member-experience/treatment-week.mjs"]);
export const MY_TIMBER_WEEK_MAINTENANCE=Object.freeze(["release/my-timber-week-scope.mjs", "tests/my-timber-week-composition.test.mjs", "release/photo-acceptance-maintenance-scope.mjs", "release/root-share-completion-scope.mjs", "release/approved-runtime-composition.mjs", ".github/workflows/shift-coach-integration.yml", "tests/photo-calendar-composition.test.mjs", "tests/photo-acceptance-maintenance-composition.test.mjs", "shift-coach/release-contract.mjs", "shift-coach/recover-cancelled-release.mjs", "release/photo-cancelled-stock-completion-20261014.mjs", "tests/photo-cancelled-stock-completion-20261014.test.mjs", "tests/member-consent-repair-composition.test.mjs", "shift-coach/scope.mjs", "scripts/b1-release-scope.mjs"]);
export const MY_TIMBER_WEEK_APPROVAL=Object.freeze({"owner":"Matt","instruction":"Deploy - agreed","recordedAt":"2026-10-14T06:38:20Z","source":"8e8895afb82bd82e2354fc69acbcd9acfe39fba4","scope":"Deploy the exact connected treatment-week code through #1065; optional member activation and qualified clinical/model review remain held","integrationIssue":1065,"emailAuthority":false,"modelReviewGranted":false,"activationGranted":false,"rollbackAuthorityBroadened":false});
export const MY_TIMBER_WEEK_BLOBS=Object.freeze({"docs/my-timber-app-benchmark-20261013.md":"0a6e6bdecf764371077c78e88dc5ce22f6290941","docs/my-timber-treatment-week-20261013.md":"351955ca26ecb1c34179077d12920b5a65d7a313","docs/my-timber-treatment-week-20261013.receipt.json":"c81f12c9c1ca5cac3602ed224a42d1af1174d3b3","frontend/member/member-progress-v1.js":"fa421afaa6f7f5fd20df0965873be1896924ddac","member-experience/entry.mjs":"cdb3c419760c11c8511e4dfb68ac5a8cab4b8bad","member-experience/staging/verify-treatment-week.mjs":"b8401363de47bed3eab7fdfcd955e16fd84bdd0a","member-experience/tests/treatment-week-route.test.mjs":"9bb89687466e40da4ce0f2f2cd193e6a06972940","member-experience/tests/treatment-week.test.mjs":"f1110d80d4fdbe3d559b0f08b885bddf83526916","member-experience/treatment-routes.mjs":"50ede67bbc6c50b4733cc899d5c6cd9b99a8a9ff","member-experience/treatment-week-client.mjs":"ab146cece24f53985ac94a12415ec0aa56a4f630","member-experience/treatment-week-route.mjs":"33f0c49418c31fd31234c8c4b24e67cf1d387e55","member-experience/treatment-week.mjs":"cc36bf0fdfbec7db4a1ae00cbf9e5c4439c96702"});
export const MY_TIMBER_WEEK_PHOTO_SOURCE="301c8ae0f8d004e3d3abc8379a22121738ae0989";
export const MY_TIMBER_WEEK_PHOTO_BLOBS=Object.freeze({"g2-013-progress-picture-rendered-production.mjs":"8051ff5034726726197b82dca7a4c7addcac2d87","rendered-member-acceptance-support.mjs":"6ba6f6f336a8658b40b5a1c0e16e43e1e3bbc12d","tests/rendered-member-acceptance-support.test.mjs":"4dd2eca6cdbc3977c56d0f2f8be8b776bc1b9f1f"});
export const WEEK_COMPLETION_IMPORT="import {myTimberWeekHistoricalView,weekRuntimeIfPresent,weekWorkflowIfPresent,weekPhotoTestIfPresent} from './my-timber-week-scope.mjs';\n";
export const WEEK_COMPLETION_OLD1=" const rawHead=git('rev-parse','HEAD'),current=JSON.parse(contents(rawHead,manifest)),c=current.rootShareCompletionRepair;";
export const WEEK_COMPLETION_NEW1=" const week=myTimberWeekHistoricalView(reader,{defaultReader}),rawHead=week.head,current=week.record,c=current.rootShareCompletionRepair;";
export const WEEK_COMPLETION_OLD2=" const rawBlob=(r,p)=>git('rev-parse',(r==='HEAD'?rawHead:r)+':'+p),rawRead=defaultReader?rawBlob:reader,rawContent=(r,p)=>contents(r==='HEAD'?rawHead:r,p);";
export const WEEK_COMPLETION_NEW2=" const rawBlob=week.blob,rawRead=week.read,rawContent=week.content;";
export const WEEK_RUNTIME_HOOK="bytes=weekRuntimeIfPresent(bytes);";
export const WEEK_WORKFLOW_HOOK="bytes=weekWorkflowIfPresent(bytes);";
export const WEEK_RUNTIME_IMPORT="import {MY_TIMBER_WEEK_BASE,MY_TIMBER_WEEK_PATHS,MY_TIMBER_WEEK_MAINTENANCE} from './my-timber-week-scope.mjs';\n";
export const WEEK_RUNTIME_BRANCH=" if(MY_TIMBER_WEEK_ADDITIONAL_PATHS.includes(path)){\n  let existed;try{execFileSync('git',['cat-file','-e',MY_TIMBER_WEEK_BASE+':'+path],{stdio:'ignore'});existed=true;}catch{existed=false;}\n  assert((existed?['A','M']:['A']).includes(status),'Unexpected approved My Timber week file status: '+status+' '+path);return true;\n }\n";
export const WEEK_RUNTIME_FOOTER="\nexport const MY_TIMBER_WEEK_ADDITIONAL_PATHS=Object.freeze([...MY_TIMBER_WEEK_PATHS,...MY_TIMBER_WEEK_MAINTENANCE].filter(p=>!RECONCILIATION_PATHS.has(p)));\nfor(const p of MY_TIMBER_WEEK_ADDITIONAL_PATHS)RECONCILIATION_PATHS.add(p);\n";
export const WEEK_WORKFLOW_STEP="      - name: Verify approved My Timber week code and retained clinical activation hold\n        run: node --test tests/my-timber-week-composition.test.mjs member-experience/tests/treatment-week.test.mjs member-experience/tests/treatment-week-route.test.mjs tests/rendered-member-acceptance-support.test.mjs tests/photo-cancelled-stock-completion-20261014.test.mjs\n";

export const WEEK_PHOTO_TEST_IMPORT="import {myTimberWeekHistoricalFile} from '../release/my-timber-week-scope.mjs';\n";
export const WEEK_PHOTO_TEST_OLD="inverse(readFileSync('frontend/member/member-progress-v1.js','utf8'))";
export const WEEK_PHOTO_TEST_NEW="inverse(myTimberWeekHistoricalFile('frontend/member/member-progress-v1.js',readFileSync('frontend/member/member-progress-v1.js','utf8')))";
export const WEEK_PHOTO_TEST_HOOK="bytes=weekPhotoTestIfPresent(bytes);";
export const WEEK_BROWSER_ENV="          TREATMENT_WEEK_PROOF_DIR: ${{ runner.temp }}/coaching-proof/my-timber-week\n";
export const WEEK_BROWSER_RUN="          node member-experience/staging/verify-treatment-week.mjs\n";
const manifest='release/approved-runtime-composition.json',sort=a=>[...a].sort();
const facts=new Map();
function fact(...a){
 const immutable=(['show','rev-parse'].includes(a[0])&&/^[a-f0-9]{40}:/.test(a[1]||''))||(a[0]==='diff'&&a[1]==='--name-only'&&a.slice(2).every(v=>/^[a-f0-9]{40}$/.test(v)))||(a[0]==='merge-base'&&a[1]==='--is-ancestor'&&a.slice(2).every(v=>/^[a-f0-9]{40}$/.test(v)));
 const key=JSON.stringify([process.cwd(),...a]);if(!immutable)return execFileSync('git',a,{encoding:'utf8'});
 if(!facts.has(key))facts.set(key,execFileSync('git',a,{encoding:'utf8'}));return facts.get(key);
}
const git=(...a)=>fact(...a).trim(),bytes=(r,p)=>fact('show',r+':'+p);
const once=(s,part)=>{assert.equal(s.split(part).length,2,'Exact single My Timber week inverse required');return s.replace(part,'');};
export function originalWeekCompletion(s){return once(once(once(s,WEEK_ROOT_IMPORT),WEEK_PHOTO_TEST_HOOK),'bytes=weekRecoveryIfPresent(bytes);');}
export const weekRootIfPresent=s=>s.includes(WEEK_ROOT_IMPORT)?originalWeekCompletion(s):s;
export function originalWeekPhotoScope(s){
 s=once(s,WEEK_PHOTO_SCOPE_IMPORT);
 for(const[a,b]of [[WEEK_PHOTO_HEAD_NEW,WEEK_PHOTO_HEAD_OLD],[WEEK_PHOTO_READ_NEW,WEEK_PHOTO_READ_OLD],[WEEK_PHOTO_FILE_NEW,WEEK_PHOTO_FILE_OLD]]){assert.equal(s.split(a).length,2);s=s.replace(a,b);}
 assert.equal(s.split('rawHead:week.rawHead').length,3);s=s.replaceAll('rawHead:week.rawHead','rawHead');
 for(const hook of ['s=weekRootIfPresent(s);','s=weekRuntimeIfPresent(s);','s=weekWorkflowIfPresent(s);'])s=once(s,hook);
 return s;
}
export function originalWeekAcceptanceTest(s){s=once(s,WEEK_ACCEPTANCE_TEST_IMPORT);assert.equal(s.split(WEEK_ACCEPTANCE_TEST_NEW).length,2);return s.replace(WEEK_ACCEPTANCE_TEST_NEW,WEEK_ACCEPTANCE_TEST_OLD);}
export function originalWeekCoach(s){
 s=once(s,WEEK_COACH_IMPORT);s=s.replace(WEEK_COACH_ALIAS,"import {execFileSync} from 'node:child_process';\n");
 assert.equal(s.split(WEEK_COACH_START+" return withImmutableHistoryVerification(()=>{\n").length,2);s=s.replace(WEEK_COACH_START+" return withImmutableHistoryVerification(()=>{\n",WEEK_COACH_START);
 for(const[start,end]of[[WEEK_COACH_START,WEEK_COACH_END],[WEEK_COACH_SOURCE_START,WEEK_COACH_SOURCE_END]]){const wrapped=start+" return withImmutableHistoryVerification(()=>{\n";if(s.includes(wrapped)){assert.equal(s.split(wrapped).length,2);s=s.replace(wrapped,start);}const tail=end.slice(0,-2)+" });\n}\n";assert.equal(s.split(tail).length,2);s=s.replace(tail,end);}return s;
}
export function originalWeekRecovery(s){return once(once(s,WEEK_RECOVERY_IMPORT),WEEK_RECOVERY_BRANCH);}
export const weekRecoveryIfPresent=s=>s.includes(WEEK_RECOVERY_IMPORT)?originalWeekRecovery(s):s;
export function originalWeekConsentTest(s){s=once(s,WEEK_CONSENT_TEST_IMPORT);assert.equal(s.split(WEEK_CONSENT_TEST_NEW).length,2);return s.replace(WEEK_CONSENT_TEST_NEW,WEEK_CONSENT_TEST_OLD);}
export function originalWeekScope(s){
 s=once(s,WEEK_SCOPE_IMPORT);assert.equal(s.split(WEEK_SCOPE_ALIAS).length,2);s=s.replace(WEEK_SCOPE_ALIAS,"import {execFileSync} from 'node:child_process';\n");
 assert.equal(s.split('withImmutableHistoryVerification(()=>{\n'+WEEK_SCOPE_BEGIN).length,2);s=s.replace('withImmutableHistoryVerification(()=>{\n'+WEEK_SCOPE_BEGIN,WEEK_SCOPE_BEGIN);
 assert.equal(s.split(WEEK_SCOPE_END+'});\n').length,2);return s.replace(WEEK_SCOPE_END+'});\n',WEEK_SCOPE_END);
}
export function originalWeekB1(s){
 s=once(s,WEEK_B1_IMPORT);assert.equal(s.split(WEEK_B1_ALIAS).length,2);s=s.replace(WEEK_B1_ALIAS,"import {execFileSync} from 'node:child_process';\n");
 assert.equal(s.split(WEEK_B1_BEGIN+' return withImmutableHistoryVerification(()=>{\n').length,2);s=s.replace(WEEK_B1_BEGIN+' return withImmutableHistoryVerification(()=>{\n',WEEK_B1_BEGIN);
 const wrapped=" return report;\n });\n}\nconst sha=value=>createHash('sha256').update(value).digest('hex');\n";assert.equal(s.split(wrapped).length,2);return s.replace(wrapped,WEEK_B1_END);
}
export function originalWeekRuntime(s){for(const part of[WEEK_RUNTIME_IMPORT,WEEK_RUNTIME_BRANCH,WEEK_RUNTIME_FOOTER])s=once(s,part);return s;}
export function originalWeekWorkflow(s){for(const p of[WEEK_WORKFLOW_STEP,WEEK_BROWSER_ENV,WEEK_BROWSER_RUN])s=once(s,p);return s;}
export function originalWeekPhotoTest(s){s=once(s,WEEK_PHOTO_TEST_IMPORT);assert.equal(s.split(WEEK_PHOTO_TEST_NEW).length,2);return s.replace(WEEK_PHOTO_TEST_NEW,WEEK_PHOTO_TEST_OLD);}
export const weekRuntimeIfPresent=s=>s.includes(WEEK_RUNTIME_IMPORT)?originalWeekRuntime(s):s;
export const weekWorkflowIfPresent=s=>s.includes(WEEK_WORKFLOW_STEP)?originalWeekWorkflow(s):s;
export const weekPhotoTestIfPresent=s=>s.includes(WEEK_PHOTO_TEST_IMPORT)?originalWeekPhotoTest(s):s;
export function verifyMyTimberWeekSource(c,{head,read,blob=read,diff,ancestor,content}){
 assert.equal(c?.proof,'EXACT_MY_TIMBER_WEEK_CODE_HELD_ACTIVATION_20261014');
 assert.equal(c.base,MY_TIMBER_WEEK_BASE);assert.equal(c.source,MY_TIMBER_WEEK_SOURCE);assert.equal(c.candidate,MY_TIMBER_WEEK_CANDIDATE);
 assert.deepEqual(c.paths,MY_TIMBER_WEEK_PATHS);assert.deepEqual(c.maintenancePaths,MY_TIMBER_WEEK_MAINTENANCE);
 assert.deepEqual(c.releaseApproval,MY_TIMBER_WEEK_APPROVAL,'Recorded deployment authority does not grant clinical review or member activation');
 assert.equal(c.integrationIssue,1065);assert.equal(c.photoVerificationSource,MY_TIMBER_WEEK_PHOTO_SOURCE);
 for(const k of['activationEnabled','qualifiedReviewGranted','homepageChanged','clinicalAdviceAdded','prescribingChanged','stockChanged','checkoutChanged','customerDataMigration','paidModelEnabled','externalCommunicationsSent','emailGeneratingStepsStarted','existingGatesWeakened','genericAdoptionAllowed','rollbackAuthorityBroadened'])assert.equal(c[k],false,'My Timber week held boundary: '+k);
 assert.deepEqual(c.exactCancelledPhotoBaseline,MY_TIMBER_WEEK_CANCELLED_PHOTO,'One exact recorded cancelled baseline only; no broader adoption');
 assert.equal(c.modelReviewStatus,'pending');assert.equal(c.productionWeekSwitch,'absent/off');
 for(const ref of[c.base,c.source,c.candidate,c.photoVerificationSource,c.maintenanceSource])ancestor(ref,head);
 ancestor(c.base,c.source);ancestor(c.candidate,c.source);ancestor(c.source,c.maintenanceSource);
 assert.deepEqual(sort(diff(c.base,c.source)),sort(c.paths),'Unrelated My Timber week payload');
 assert.deepEqual(sort(diff(c.source,c.maintenanceSource)),sort(c.maintenancePaths),'Unrelated My Timber week maintenance');
 assert.deepEqual(diff(c.maintenanceSource,head),[manifest],'Unreviewed My Timber week registration tail');
 for(const p of c.paths){assert.equal(blob(c.source,p),MY_TIMBER_WEEK_BLOBS[p],'Approved composition source / boundary drift: Frozen week source drift: '+p);assert.equal(blob('HEAD',p),MY_TIMBER_WEEK_BLOBS[p],'Approved composition source / boundary drift: My Timber week source drift: '+p);assert.equal(read('HEAD',p),read(c.source,p),'Approved composition source / boundary drift: My Timber week fresh reader drift: '+p);}
 for(const p of c.maintenancePaths){assert.equal(blob('HEAD',p),blob(c.maintenanceSource,p),'Approved composition source / boundary drift: My Timber week maintenance drift: '+p);assert.equal(read('HEAD',p),read(c.maintenanceSource,p),'Approved composition source / boundary drift: My Timber week maintenance fresh reader drift: '+p);}
 for(const p of['wrangler.jsonc','wrangler.coaching.jsonc','package.json','package-lock.json','.github/workflows/cloudflare-production-promote.yml','member-experience/treatment-patterns.mjs','member-experience/staging/verify-treatment-detail.mjs','share-preview/metadata.mjs','share-preview/asset.mjs','shift-coach/worker.mjs'])assert.equal(read('HEAD',p),read(c.base,p),'Approved composition source / boundary drift: My Timber week protected boundary: '+p);
 for(const[p,inverse]of [['shift-coach/scope.mjs',originalWeekScope],['scripts/b1-release-scope.mjs',originalWeekB1],['tests/member-consent-repair-composition.test.mjs',originalWeekConsentTest],['shift-coach/release-contract.mjs',originalWeekCoach],['shift-coach/recover-cancelled-release.mjs',originalWeekRecovery],['tests/photo-acceptance-maintenance-composition.test.mjs',originalWeekAcceptanceTest],['release/photo-acceptance-maintenance-scope.mjs',originalWeekPhotoScope],['release/root-share-completion-scope.mjs',originalWeekCompletion],['release/approved-runtime-composition.mjs',originalWeekRuntime],['.github/workflows/shift-coach-integration.yml',originalWeekWorkflow],['tests/photo-calendar-composition.test.mjs',originalWeekPhotoTest]])assert.equal(inverse(content(head,p)),content(c.base,p),'Every original byte outside finite week hooks retained: '+p);
 for(const[p,expected]of Object.entries(MY_TIMBER_WEEK_PHOTO_BLOBS)){assert.equal(blob('HEAD',p),expected,'Approved composition source / boundary drift: photo test source drift');assert.equal(blob(c.photoVerificationSource,p),expected);assert.equal(read('HEAD',p),read(c.photoVerificationSource,p),'Approved composition source / boundary drift: photo test fresh reader drift');}
 const old=JSON.parse(content(c.base,manifest)),current=JSON.parse(content(head,manifest));delete current.myTimberWeekCode;
 assert.deepEqual(current,old,'Every prior source, approval, watermark and receipt preserved');
 return c;
}
export function myTimberWeekHistoricalView(reader=null,{defaultReader=reader===null}={}){
 const rawHead=git('rev-parse','HEAD'),current=JSON.parse(bytes(rawHead,manifest));
 const blob=(r,p)=>git('rev-parse',(r==='HEAD'?rawHead:r)+':'+p),read=defaultReader?blob:reader,content=(r,p)=>bytes(r==='HEAD'?rawHead:r,p),c=current.myTimberWeekCode;
 if(!c)return{rawHead,head:rawHead,record:current,read,blob,content};
 verifyMyTimberWeekSource(c,{head:rawHead,read,blob,diff:(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>git('merge-base','--is-ancestor',a,b),content});
 const record=structuredClone(current);delete record.myTimberWeekCode;
 const changed=new Set([...c.paths,...c.maintenancePaths,manifest]),map=(r,p)=>r==='HEAD'&&changed.has(p)?c.base:r;
 return{rawHead,head:c.base,record,read:(r,p)=>read(map(r,p),p),blob:(r,p)=>blob(map(r,p),p),content:(r,p)=>content(map(r,p),p)};
}
export function myTimberWeekHistoricalFile(p,s){
 const view=myTimberWeekHistoricalView(),actual=bytes(view.rawHead,p);if(view.rawHead===view.head){assert.equal(s,actual);return s;}
 const prior=bytes(view.head,p);assert(s===actual||s===prior,'Exact original byte / single completion inverse: My Timber week historical file must match an approved state');return prior;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){myTimberWeekHistoricalView();console.log('PASS exact approved My Timber code and retained activation/clinical holds');}
