import assert from 'node:assert/strict';import{execFileSync}from'node:child_process';
export const CONTACT_RUNTIME_BASE='17cf6a9da79782f7ae2fb7452caa25b203d6c138';
export const CONTACT_RUNTIME_SOURCE='61330cbb0c649baf4e2b40bd8a1c342aef0daf56';
export const CONTACT_RUNTIME_PATHS=Object.freeze(['release/contact-rollback-runtime.mjs','tests/contact-rollback-runtime.test.mjs','docs/contact-rollback-evidence-20261012.json','shift-coach/recover-cancelled-release.mjs','.github/workflows/shift-coach-integration.yml']);
export const CONTACT_RUNTIME_MAINT=Object.freeze(['release/approved-runtime-composition.mjs','release/contact-rollback-scope.mjs','tests/contact-rollback-composition.test.mjs','release/my-timber-progress-journey-scope.mjs','tests/my-timber-progress-journey-composition.test.mjs']);
export const CONTACT_RUNTIME_FLAGS=Object.freeze(['runtimeChanged','publicCopyChanged','medicalEvidenceChanged','customerDataChanged','externalCommunicationsSent','paidModelEnabled','deploymentAuthorityBroadened','rollbackAuthorityBroadened','genericAdoptionAllowed','existingGatesWeakened']);
const manifest='release/approved-runtime-composition.json',sorted=a=>[...a].sort();
export function verifyContactRuntimeComposition(c,{head,read,diff,ancestor,content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'})}){
 assert.equal(c?.proof,'EXACT_CONTACT_ROLLBACK_RETENTION_AFTER_EPIPE_20261012');assert.equal(c.base,CONTACT_RUNTIME_BASE);assert.equal(c.source,CONTACT_RUNTIME_SOURCE);assert.deepEqual(c.paths,CONTACT_RUNTIME_PATHS);assert.deepEqual(c.maintenancePaths,CONTACT_RUNTIME_MAINT);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.equal(c.originalCandidate,'2b2bfcef3bc4466de3e2bbc8fc0fe98c918234f8');assert.equal(c.failedPromotion,38306227092);assert.equal(c.integrationIssue,1065);assert.equal(c.retentionOnly,true);assert.equal(c.failedReleaseAccepted,false);for(const flag of CONTACT_RUNTIME_FLAGS)assert.equal(c[flag],false);
 for(const ref of[c.base,c.source,c.maintenanceSource,c.originalCandidate])ancestor(ref,head);ancestor(c.base,c.source);ancestor(c.source,c.maintenanceSource);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated contact retention payload');assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated contact retention maintenance');assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[manifest],'Unreviewed change after contact retention receipt');
 const prior=JSON.parse(content(c.base,manifest)),current=JSON.parse(content(head,manifest));delete current.contactRollbackRuntime;assert.deepEqual(current,prior,'Existing My Timber and EPIPE receipts must remain unchanged');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved composition source / boundary drift: Contact retention source drift: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved composition maintenance source drift: Contact retention maintenance drift: '+path);
 return c;
}
