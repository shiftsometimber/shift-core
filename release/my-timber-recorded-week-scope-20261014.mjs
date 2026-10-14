import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const RECORDED_WEEK_ACTIVATION_BASE="685ede249cd20c4801d0a25227fed16d46860618";
export const RECORDED_WEEK_ACTIVATION_SOURCE="6b568cde59e639f7138de719cb1bdce92b21b2d9";
export const RECORDED_WEEK_ACTIVATION_PATHS=Object.freeze(["member-experience/treatment-week-route.mjs","member-experience/treatment-week-client.mjs","wrangler.jsonc","member-experience/tests/treatment-week-route.test.mjs","docs/my-timber-recorded-week-activation-20261014.json","wrangler.coaching.jsonc"]);
export const RECORDED_WEEK_ACTIVATION_MAINTENANCE=Object.freeze(["release/my-timber-recorded-week-scope-20261014.mjs","tests/my-timber-recorded-week-activation-composition.test.mjs","release/combined-finite-scope-20261014.mjs","release/my-treatment-config.mjs","release/approved-runtime-composition.mjs",".github/workflows/shift-coach-integration.yml","member-experience/tests/weight-import-mapping-ui.test.mjs","member-experience/staging/verify-treatment-week.mjs"]);
const manifest='release/approved-runtime-composition.json',key='myTimberRecordedWeekActivation20261014';
export const RECORDED_WEEK_ACTIVATION_FLAG='    "MY_TIMBER_WEEK_VIEW_ENABLED": "true",\n';
const pairs={"release/combined-finite-scope-20261014.mjs":[["","import {recordedWeekActivationHistoricalView,recordedWeekActivationLegacyRead} from './my-timber-recorded-week-scope-20261014.mjs';\n"],[" const rawHead=git('rev-parse','HEAD').trim(),content=(ref,path)=>rawContent(ref==='HEAD'?rawHead:ref,path);\n const blob=(ref,path)=>rawBlob(ref==='HEAD'?rawHead:ref,path),rawRead=defaultReader?blob:reader,current=JSON.parse(content(rawHead,manifest)),c=current.combinedFinite20261014;"," const activation=recordedWeekActivationHistoricalView();\n const rawHead=activation.head,content=(ref,path)=>activation.content(ref==='HEAD'?rawHead:ref,path);\n const blob=(ref,path)=>activation.blob(ref==='HEAD'?rawHead:ref,path),rawRead=defaultReader?blob:recordedWeekActivationLegacyRead(reader,activation),current=activation.record,c=current.combinedFinite20261014;"],[" const normal=(ref,path)=>exactCombinedDirectoryDisplay(rawRead(ref,path),ref,path);"," const normal=(ref,path)=>exactCombinedDirectoryDisplay(rawRead(ref,path),ref==='HEAD'?rawHead:ref,path);"],[" assert.equal(git('rev-parse','HEAD').trim(),rawHead,'Source HEAD changed during combined verification');\n return{rawHead,head:c.base,record,read,blob:(ref,path)=>blob(map(ref,path),path),content:(ref,path)=>content(map(ref,path),path)};"," assert.equal(git('rev-parse','HEAD').trim(),activation.rawHead,'Source HEAD changed during combined verification');\n return{rawHead:activation.rawHead,head:c.base,record,read,blob:(ref,path)=>blob(map(ref,path),path),content:(ref,path)=>content(map(ref,path),path)};"],[" assert.equal(typeof reader,'function','A legacy comparison reader is required');"," assert.equal(typeof reader,'function','A legacy comparison reader is required');\n reader=recordedWeekActivationLegacyRead(reader,recordedWeekActivationHistoricalView());"],["export function verifyCombinedFinite(c,{head,read,blob=read,content,diff,ancestor}){","export function verifyCombinedFiniteOriginal(c,{head,read,blob=read,content,diff,ancestor}){"],["export function combinedFiniteHistoricalView(","\nexport function verifyCombinedFinite(c,options){\n const activation=recordedWeekActivationHistoricalView();\n if(options.head!==activation.rawHead||activation.head===activation.rawHead)return verifyCombinedFiniteOriginal(c,options);\n const {head,read,blob=read,content,diff,ancestor}=options;\n const projectedContent=(r,p)=>{\n  if(r===head||r==='HEAD'||r===activation.head){\n   const current=content(r===activation.head?head:r,p),authentic=rawContent(head,p);\n   if(p===manifest){const record=JSON.parse(current);delete record.myTimberRecordedWeekActivation20261014;return JSON.stringify(record);}\n   return current===authentic?rawContent(activation.head,p):current;\n  }return content(r,p);\n };\n const projectedDiff=(a,b)=>{\n  if(b!==head&&b!=='HEAD')return diff(a,b);\n  assert.deepEqual(diff(a,b),git('diff','--name-only',a,head).trim().split('\\n').filter(Boolean),'Unreviewed supplied activation source drift');\n  return diff(a,activation.head);\n };\n return verifyCombinedFiniteOriginal(c,{head:activation.head,read:recordedWeekActivationLegacyRead(read,activation),blob:recordedWeekActivationLegacyRead(blob,activation),content:projectedContent,diff:projectedDiff,ancestor});\n}\n\nexport function combinedFiniteHistoricalView("],[" reader=recordedWeekActivationLegacyRead(reader,recordedWeekActivationHistoricalView());"," const activation=recordedWeekActivationHistoricalView();\n reader=recordedWeekActivationLegacyRead(reader,activation);"],["exactCombinedDirectoryDisplay(headValue,'HEAD',path)!==exactCombinedDirectoryDisplay(aliasValue,actual.rawHead,path)","exactCombinedDirectoryDisplay(headValue,activation.affected(path)?activation.head:'HEAD',path)!==exactCombinedDirectoryDisplay(aliasValue,activation.affected(path)?activation.head:actual.rawHead,path)"]],"release/my-treatment-config.mjs":[["","import {withoutRecordedWeekActivationFlag} from './my-timber-recorded-week-scope-20261014.mjs';\n"],["export function withoutTreatmentFlag(config){return config.replace(TREATMENT_FLAG,'');}","export function withoutTreatmentFlag(config){return withoutRecordedWeekActivationFlag(config).replace(TREATMENT_FLAG,'');}"]],"release/approved-runtime-composition.mjs":[["","import {RECORDED_WEEK_ACTIVATION_PATHS,RECORDED_WEEK_ACTIVATION_MAINTENANCE} from './my-timber-recorded-week-scope-20261014.mjs';\n"],["","\n// Exact owner-authorised factual treatment-week activation; every old registration is retained.\nexport const RECORDED_WEEK_ACTIVATION_ADDITIONAL_PATHS=Object.freeze([...RECORDED_WEEK_ACTIVATION_PATHS,...RECORDED_WEEK_ACTIVATION_MAINTENANCE].filter(p=>!RECONCILIATION_PATHS.has(p)));\nfor(const p of RECORDED_WEEK_ACTIVATION_ADDITIONAL_PATHS)RECONCILIATION_PATHS.add(p);\n"]],".github/workflows/shift-coach-integration.yml":[["run: node --test tests/my-timber-week-closeout-composition.test.mjs tests/photo-baseline-starting-point-20261014.test.mjs","run: node --test tests/my-timber-week-closeout-composition.test.mjs tests/photo-baseline-starting-point-20261014.test.mjs tests/my-timber-recorded-week-activation-composition.test.mjs"]],"member-experience/tests/weight-import-mapping-ui.test.mjs":[["","import {recordedWeekActivationHistoricalView} from '../../release/my-timber-recorded-week-scope-20261014.mjs';\n"],["retained.base,'HEAD','--','my-timber-app'","retained.base,recordedWeekActivationHistoricalView().head,'--','my-timber-app'"]],"member-experience/staging/verify-treatment-week.mjs":[["assert.match(await w.innerText(),/awaiting qualified model/);","assert.doesNotMatch(await w.innerText(),/awaiting qualified model/);assert.equal(await w.locator('svg path').count(),0);"],["'unknowns-and-model-review-pending'","'recorded-facts-without-medication-model'"]]};
const expectedOldBlobs={"release/combined-finite-scope-20261014.mjs":"f223c1b8bf712eb7ab84953594d72fb1c1de9c06","release/my-treatment-config.mjs":"2e8330705baf9659678cb8a7f3bb21c9648df9da","release/approved-runtime-composition.mjs":"741515168292adb491a555c1cd39b2cc72dd7c0b",".github/workflows/shift-coach-integration.yml":"492e35523970b37e1c36c6bb6b3177fdbd4edc52","member-experience/tests/weight-import-mapping-ui.test.mjs":"cdbae1bcae36f3fc9d89e31406e2fba288fe236c","member-experience/staging/verify-treatment-week.mjs":"b8401363de47bed3eab7fdfcd955e16fd84bdd0a"};
const approval={"schema":"my-timber-recorded-week-activation/v1","owner":"Matt","instruction":"Action this. We don’t want an review","recordedAt":"2026-10-14T19:20:45.941Z","base":"685ede249cd20c4801d0a25227fed16d46860618","scope":"Activate factual recorded treatment weeks, selected owned context, private notes and factual exports","externalReviewRequiredForThisScope":false,"flag":{"name":"MY_TIMBER_WEEK_VIEW_ENABLED","value":"true","config":"wrangler.jsonc","mirroredConfig":"wrangler.coaching.jsonc"},"clinicalModelEnabled":false,"medicationLevelEstimateIncluded":false,"symptomPredictionIncluded":false,"clinicalApprovalClaimed":false,"prescribingChanged":false,"customerRecordsUsedForTests":false,"emailAuthority":false,"paidModelEnabled":false,"stockChanged":false,"homepageChanged":false,"ordinaryDeviceEvidenceNotInferred":true,"previousClinicalModelDraftRetained":true};
const immutableFacts=new Map(),sorted=a=>[...a].sort();
function git(...args){
 const fixed=(['show','rev-parse'].includes(args[0])&&/^[a-f0-9]{40}:/.test(args[1]||''))||(args[0]==='diff'&&args[1]==='--name-only'&&args.slice(2).every(v=>/^[a-f0-9]{40}$/.test(v)))||(args[0]==='merge-base'&&args[1]==='--is-ancestor'&&args.slice(2).every(v=>/^[a-f0-9]{40}$/.test(v)));
 const cacheKey=JSON.stringify([process.cwd(),args]);
 if(!fixed)return execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6});
 if(!immutableFacts.has(cacheKey))immutableFacts.set(cacheKey,execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6}));return immutableFacts.get(cacheKey);
}
const blob=(r,p)=>git('rev-parse',r+':'+p).trim(),content=(r,p)=>git('show',r+':'+p);
const diff=(a,b)=>git('diff','--name-only',a,b).trim().split('\n').filter(Boolean);
const ancestor=(a,b)=>git('merge-base','--is-ancestor',a,b);
function invert(p,s){
 if(p==='release/approved-runtime-composition.mjs'){
  const prefix=pairs[p][0][1],suffix=pairs[p][1][1];assert(s.startsWith(prefix)&&s.endsWith(suffix),'Exact recorded-week runtime patch required');return s.slice(prefix.length,-suffix.length);
 }
 for(const [old,now]of [...(pairs[p]||[])].reverse()){
  if(old===''){assert(s.startsWith(now),'Exact recorded-week import required');s=s.slice(now.length);}
  else{assert.equal(s.split(now).length,2,'Exact recorded-week maintenance patch required: '+p);s=s.replace(now,old);}
 }return s;
}
export function verifyRecordedWeekActivation(c,{head,read=blob,readContent=content,readDiff=diff,isAncestor=ancestor}={}){
 assert(c,'Exact recorded-week activation record required');
 assert.equal(c.proof,'EXACT_RECORDED_WEEK_FACTUAL_ACTIVATION_20261014');
 assert.equal(c.base,RECORDED_WEEK_ACTIVATION_BASE);assert.equal(c.source,RECORDED_WEEK_ACTIVATION_SOURCE);
 assert.deepEqual(c.paths,RECORDED_WEEK_ACTIVATION_PATHS);assert.deepEqual(c.maintenancePaths,RECORDED_WEEK_ACTIVATION_MAINTENANCE);
 assert.match(head,/^[a-f0-9]{40}$/);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.deepEqual(c.authority,approval);assert.equal(c.scope,'recorded_facts_only');assert.equal(c.externalReviewRequired,false);assert.equal(c.weekEnabled,true);
 for(const f of ['clinicalModelEnabled','medicationLevelsIncluded','symptomPredictionIncluded','clinicalApprovalClaimed','homepageChanged','stockChanged','emailAuthority','paidModelEnabled','genericAdoptionAllowed','rollbackAuthorityBroadened','originalAssertionsRemoved','timeoutsChanged'])assert.equal(c[f],false,'Recorded-week authority flag: '+f);
 for(const r of[c.base,c.source,c.maintenanceSource])isAncestor(r,head);isAncestor(c.base,c.source);isAncestor(c.source,c.maintenanceSource);
 assert.deepEqual(sorted(readDiff(c.base,c.source)),sorted(c.paths),'Recorded-week payload boundary');
 assert.deepEqual(sorted(readDiff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Recorded-week maintenance boundary');
 assert.deepEqual(sorted(readDiff(c.maintenanceSource,head)),[manifest],'Recorded-week final ledger boundary');
 for(const p of c.paths){
  assert.equal(blob(head,p),blob(c.source,p),'Recorded-week actual source drift: '+p);
  assert.equal(read('HEAD',p),read(c.source,p),'Approved composition source / boundary drift / Approved composition source drift: recorded week source '+p);
 }
 for(const p of c.maintenancePaths){
  assert.equal(blob(head,p),blob(c.maintenanceSource,p),'Recorded-week actual maintenance drift: '+p);
  assert.equal(read('HEAD',p),read(c.maintenanceSource,p),'Approved composition maintenance source drift: recorded week '+p);
 }
 const old=JSON.parse(readContent(c.base,manifest)),current=JSON.parse(readContent(head,manifest));delete current[key];assert.deepEqual(current,old,'All earlier authority records must remain exact');
 assert.deepEqual(JSON.parse(readContent(head,'docs/my-timber-recorded-week-activation-20261014.json')),approval);
 for(const p of ['wrangler.jsonc','wrangler.coaching.jsonc']){const config=readContent(head,p);assert.equal(config.split(RECORDED_WEEK_ACTIVATION_FLAG).length,2);assert.equal(config.replace(RECORDED_WEEK_ACTIVATION_FLAG,''),readContent(c.base,p),'Only exact factual week flag changes configuration: '+p);}
 assert.equal(readContent(head,'wrangler.jsonc'),readContent(head,'wrangler.coaching.jsonc'),'Same Worker deployment configurations remain identical');
 const routeOld="week:{...buildRecordedWeek({records,events:events.slice(0,1000),now,limited}),context}";
 const routeNew="week:{...buildRecordedWeek({records,events:events.slice(0,1000),now,limited}),curve:{status:'not_included',scope:'recorded_facts_only'},context}";
 assert.equal(readContent(head,'member-experience/treatment-week-route.mjs'),readContent(c.base,'member-experience/treatment-week-route.mjs').replace(routeOld,routeNew),'Only factual response changes');
 const clientOld=" function drawCurve(parent){\n  const curve=week.curve,allowed=";
 const clientNew=" function drawCurve(parent){\n  if(week.curve?.status==='not_included')return;\n  const curve=week.curve,allowed=";
 assert.equal(readContent(head,'member-experience/treatment-week-client.mjs'),readContent(c.base,'member-experience/treatment-week-client.mjs').replace(clientOld,clientNew),'Only unavailable-model display changes');
 for(const [p,oldBlob]of Object.entries(expectedOldBlobs)){assert.equal(blob(c.base,p),oldBlob);assert.equal(invert(p,readContent(head,p)),readContent(c.base,p),'Original maintenance bytes preserved: '+p);}
 for(const p of ['frontend','public','member-experience/treatment-week.mjs','member-experience/treatment-patterns.mjs','member-experience/treatment-model.mjs','.github/workflows/cloudflare-production-promote.yml','package.json','package-lock.json'])assert.equal(blob(head,p),blob(c.base,p),'Protected recorded-week boundary: '+p);
 return c;
}
export function recordedWeekActivationHistoricalView(){
 const rawHead=git('rev-parse','HEAD').trim(),record=JSON.parse(content(rawHead,manifest)),c=record[key];
 if(!c)return{rawHead,head:rawHead,record,affected:()=>false,read:blob,blob,content};
 assert.equal(git('diff','--name-only').trim(),'','Unreviewed tracked source drift: source must be clean');assert.equal(git('diff','--cached','--name-only').trim(),'','Unreviewed staged source drift: source must be clean');
 verifyRecordedWeekActivation(c,{head:rawHead});
 const changed=new Set([...c.paths,...c.maintenancePaths,manifest]),affected=p=>changed.has(p)||[...changed].some(x=>x.startsWith(p+'/'));
 const map=(r,p)=>(r==='HEAD'||r===rawHead)&&affected(p)?c.base:r==='HEAD'?rawHead:r;
 const previous=structuredClone(record);delete previous[key];
 assert.equal(git('rev-parse','HEAD').trim(),rawHead,'Source changed during activation verification');
 return{rawHead,head:c.base,record:previous,affected,read:(r,p)=>blob(map(r,p),p),blob:(r,p)=>blob(map(r,p),p),content:(r,p)=>content(map(r,p),p)};
}
// Compatibility for existing abstract legacy comparators after independent actual
// source admission above. Caller outputs remain fresh; this does not grant approval.
export function recordedWeekActivationLegacyRead(reader,view){
 assert.equal(typeof reader,'function');
 if(view.rawHead===view.head)return reader;
 return(r,p)=>{
  if((r==='HEAD'||r===view.rawHead)&&view.affected(p)){
   if(r==='HEAD'){const a=reader('HEAD',p),b=reader(view.rawHead,p);if(a!==b&&a.replace(/^tree [^\n]+\n/,'')!==b.replace(/^tree [^\n]+\n/,''))return a;}
   return reader(view.head,p);
  }return reader(r,p);
 };
}
export function withoutRecordedWeekActivationFlag(config){
 if(!config.includes(RECORDED_WEEK_ACTIVATION_FLAG))return config;
 const view=recordedWeekActivationHistoricalView();assert.notEqual(view.rawHead,view.head,'Unregistered week activation flag');
 assert.equal(config,content(view.rawHead,'wrangler.jsonc'),'Only exact current authorised configuration can be projected');
 return config.replace(RECORDED_WEEK_ACTIVATION_FLAG,'');
}
