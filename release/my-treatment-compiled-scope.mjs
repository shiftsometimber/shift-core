import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const TREATMENT_COMPILED_BASE='e13c49dde529f82155498b875ea0ef7bb3169bf8';
export const TREATMENT_COMPILED_SOURCE='e279e1c80dad999373d215084295a75391795508';
export const TREATMENT_COMPILED_PATHS=Object.freeze(["release/my-treatment-live.mjs","release/my-treatment-compiled-control.mjs","tests/my-treatment-compiled-control.test.mjs","release/my-treatment-rollback-runtime.mjs","tests/my-treatment-rollback-runtime.test.mjs","docs/my-treatment-rollback-evidence-20261013.json","shift-coach/recover-cancelled-release.mjs",".github/workflows/my-treatment-compiled-proof.yml"]);
export const TREATMENT_COMPILED_MAINTENANCE=Object.freeze(["release/approved-runtime-composition.mjs","release/my-treatment-compiled-scope.mjs","tests/my-treatment-compiled-composition.test.mjs","release/my-timber-progress-journey-scope.mjs","tests/contact-rollback-composition.test.mjs","tests/my-timber-progress-journey-composition.test.mjs",".github/workflows/shift-coach-integration.yml",".github/workflows/cloudflare-production-promote.yml"]);
export const TREATMENT_COMPILED_FLAGS=Object.freeze(['runtimeChanged','productBytesChanged','publicCopyChanged','customerDataChanged','externalCommunicationsSent','paidModelEnabled','formatNormalisationAllowed','existingGatesWeakened','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened']);
export const TREATMENT_COMPILED_SUPERSEDES=Object.freeze({"maintenanceSource":"d9419fb16eb9e0c87189854f5f5670cb884b8e50","receipt":"c3018e1d62ae98e2cb14f5da9b0fbb9913bdd538","date":"2026-10-13","reason":"Preserve the same payload and original root bytes without a duplicate lexical binding"});
const manifest='release/approved-runtime-composition.json',sorted=a=>[...a].sort();
export function verifyTreatmentCompiledComposition(c,{head,read,diff,ancestor,content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'})}){
 assert.equal(c?.proof,'EXACT_COMPILED_MY_TREATMENT_DELIVERY_20261013');assert.equal(c.base,TREATMENT_COMPILED_BASE);assert.equal(c.source,TREATMENT_COMPILED_SOURCE);assert.deepEqual(c.paths,TREATMENT_COMPILED_PATHS);assert.deepEqual(c.maintenancePaths,TREATMENT_COMPILED_MAINTENANCE);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.match(head,/^[a-f0-9]{40}$/);
 assert.deepEqual(c.maintenanceSupersedes,TREATMENT_COMPILED_SUPERSEDES);ancestor(c.maintenanceSupersedes.receipt,c.maintenanceSource);
 assert.equal(c.integrationIssue,1065);assert.equal(c.failedRun,38316073865);assert.equal(c.failedJob,115032993314);assert.equal(c.exactCompiledAssetEquality,true);assert.equal(c.retentionOnly,true);assert.equal(c.failedReleaseAccepted,false);assert.equal(c.preDeploymentCompiledCheck,true);for(const flag of TREATMENT_COMPILED_FLAGS)assert.equal(c[flag],false);
 for(const ref of[c.base,c.source,c.maintenanceSource])ancestor(ref,head);ancestor(c.base,c.source);ancestor(c.source,c.maintenanceSource);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated compiled-delivery payload');assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated compiled-delivery maintenance');assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[manifest],'Unreviewed change after compiled-delivery receipt');
 const prior=JSON.parse(content(c.base,manifest)),current=JSON.parse(content(head,manifest));delete current.treatmentCompiledDelivery;assert.deepEqual(current,prior,'Every previous contact, My Timber, EPIPE and historical receipt must remain unchanged');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved composition source / boundary drift: Compiled treatment source drift: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved composition maintenance source drift: Compiled treatment maintenance drift: '+path);
 return c;
}
const raw=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim(),content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'});
export function verifiedTreatmentHistoricalView(){
 const record=JSON.parse(content('HEAD',manifest)),head=raw('rev-parse','HEAD'),repair=record.treatmentCompiledDelivery;
 if(repair)verifyTreatmentCompiledComposition(repair,{head,read:(ref,path)=>raw('rev-parse',ref+':'+path),diff:(a,b)=>raw('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>raw('merge-base','--is-ancestor',a,b),content});
 return {record,head:repair?repair.base:head,read:(ref,path)=>raw('rev-parse',(repair&&ref==='HEAD'&&[...repair.paths,...repair.maintenancePaths,manifest].includes(path)?repair.base:ref)+':'+path)};
}
export function treatmentHistoricalRecord(record){const {record:current}=verifiedTreatmentHistoricalView();assert.deepEqual(record,current,'Only the verified current record can expose a historical view');const prior=structuredClone(record);delete prior.treatmentCompiledDelivery;return prior;}
export function treatmentHistoricalFile(path,bytes){const {record}=verifiedTreatmentHistoricalView();assert.equal(bytes,content('HEAD',path),'Historical file must be the exact current bytes');assert(TREATMENT_COMPILED_MAINTENANCE.includes(path),'Unlisted historical file');return record.treatmentCompiledDelivery?content(record.treatmentCompiledDelivery.base,path):bytes;}
