import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const MY_TIMBER_PROGRESS_BASE="7da4c5406a59bcd929240bd72cb5c7a7b96c8b60";
export const MY_TIMBER_PROGRESS_SOURCE="d3060df666e56055aaf727362e634cc8c727b09b";
export const MY_TIMBER_PROGRESS_PATHS=Object.freeze([
  "ask-timber-v1.js",
  "docs/my-timber-detail-upgrade-20261012.md",
  "docs/my-timber-patterns-20261012.md",
  "docs/my-timber-progress-journey-20261012.md",
  "docs/my-timber-progress-journey-20261012.receipt.json",
  "frontend/member/api-adapter-v33d.js",
  "frontend/member/member-progress-v1.js",
  "member-daily-v2.js",
  "member-experience/entry.mjs",
  "member-experience/food-diary-client.mjs",
  "member-experience/grub-runtime.mjs",
  "member-experience/health-routes.mjs",
  "member-experience/journey-portability.mjs",
  "member-experience/progress-journey.mjs",
  "member-experience/staging/verify-treatment-detail.mjs",
  "member-experience/tests/journey-portability.test.mjs",
  "member-experience/tests/progress-journey.test.mjs",
  "member-experience/tests/treatment-detail.test.mjs",
  "member-experience/tests/treatment-patterns.test.mjs",
  "member-experience/treatment-detail.mjs",
  "member-experience/treatment-page.mjs",
  "member-experience/treatment-patterns.mjs",
  "member-experience/treatment-routes.mjs",
  "my-journey-v1.js",
  "member-experience/public-preservation.mjs",
  "release/support-recovery-preservation.mjs",
  "tests/support-recovery-20261011.test.mjs",
  "privacy-health-erasure-route-v1.js",
  "shift-visualise-v1.js",
  "tests/progress-charts.test.mjs",
  "tests/progress-photo-journey.test.mjs",
  "release/app-preflight.mjs"
]);
export const MY_TIMBER_PROGRESS_MAINTENANCE=Object.freeze([
  "release/approved-runtime-composition.mjs",
  "release/my-timber-progress-journey-scope.mjs",
  "tests/my-timber-progress-journey-composition.test.mjs",
  ".github/workflows/shift-coach-integration.yml",
  ".github/workflows/continuity-release-proof.yml",
  "tests/support-recovery-integration-budget-composition.test.mjs",
  "tests/support-recovery-integration-budget-test-repair-composition.test.mjs",
  "tests/support-recovery-historical-scope-composition.test.mjs"
]);
export const MY_TIMBER_SUPERSEDED_RECEIPT=Object.freeze({source:"ed7f9216931c829bd333830dc8c7596fa64f242a",maintenanceSource:"090bd16fc769d4219f32ff743a1b6856f2d8215c",receipt:"a2883f0b6080b9b3a3eb5eda53986de742de76bf",date:"2026-10-12",reason:"Hosted Journey deletion compatibility, exact historical recipe prerequisites and registered Help preservation repair"});
export const MY_TIMBER_MAINTENANCE_SUPERSEDED=Object.freeze({maintenanceSource:"6b915b35c6a3908741758767d312947c7f981b5a",receipt:"73a2738324ecee18608ea972b1872a4ed505c5ae",date:"2026-10-12",reason:"Preserve the existing metrics tamper-rejection diagnostic for the exact public preservation path"});
export const MY_TIMBER_PAYLOAD_SUPERSEDED=Object.freeze({source:"9b3f60af03a9061d8620816570c188a7dd0421ba",maintenanceSource:"29fbc3eca075c6cead3da48e68159500e9a1b8e5",receipt:"fda47c745f0ff17f023dfff563aadda77b782cfd",date:"2026-10-12",reason:"Exact previously registered support security-client preservation from verified live predecessor"});
export const MY_TIMBER_PRESERVATION_SUPERSEDED=Object.freeze({"source":"7adb5a4948e358530723b78447b7e65dc4189920","maintenanceSource":"612adc6ec645b15f758af9908dcd01db4f006728","receipt":"37dd8f6154aa4d795663c5273b9f2faf4e9f00aa","date":"2026-10-12","reason":"Exact compiled Help raw-response position, frozen trailing pillar chrome and approved bounded app-preflight transport"});
const sorted=xs=>[...xs].sort();
const manifest='release/approved-runtime-composition.json';
const flags=['homepageChanged','publicNavigationChanged','prescribingChanged','stockChanged','checkoutChanged','doseAdviceAdded','paidModelEnabled','externalCommunicationsSent','existingGatesWeakened','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened'];
export function verifyMyTimberProgressJourney(c,{head,read,diff,ancestor,content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'})}){
 assert.equal(c?.proof,'EXACT_MY_TIMBER_PROGRESS_JOURNEY_20261012');
 assert.deepEqual(c.preservationSupersedes,MY_TIMBER_PRESERVATION_SUPERSEDED,'Preservation predecessor must remain dated and exact');ancestor(c.preservationSupersedes.receipt,c.source);
 ancestor('11ab92f35560be64a753a0a879e6db947bf799f5',c.source);ancestor('79e3055163e81ce8befbcfa09fc52226dd43f594',c.source);
 assert.deepEqual(c.supersedes,MY_TIMBER_SUPERSEDED_RECEIPT,'Prior My Timber receipt supersession must remain dated and exact');
 ancestor(c.supersedes.receipt,c.source);
 assert.deepEqual(c.payloadSupersedes,MY_TIMBER_PAYLOAD_SUPERSEDED,'Payload predecessor must remain exact');ancestor(c.payloadSupersedes.receipt,c.source);
 assert.deepEqual(c.maintenanceSupersedes,MY_TIMBER_MAINTENANCE_SUPERSEDED,'Maintenance predecessor must remain exact');ancestor(c.maintenanceSupersedes.receipt,c.maintenanceSource);
 assert.equal(c.base,MY_TIMBER_PROGRESS_BASE);assert.equal(c.source,MY_TIMBER_PROGRESS_SOURCE);
 assert.deepEqual(c.paths,MY_TIMBER_PROGRESS_PATHS);assert.deepEqual(c.maintenancePaths,MY_TIMBER_PROGRESS_MAINTENANCE);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.equal(c.integrationIssue,1065);assert.equal(c.publicationStatus,'matt_authorised_guarded_release_20261012');
 assert.equal(c.informationalOnly,true);assert.equal(c.privatePhotoStorageReused,true);assert.equal(c.additiveFoodTable,true);assert.equal(c.photoIndividualDelete,'owned_physical_row_delete');
 for(const flag of flags)assert.equal(c[flag],false);
 for(const ref of[c.base,c.source,c.maintenanceSource])ancestor(ref,head);ancestor(c.base,c.source);ancestor(c.source,c.maintenanceSource);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated My Timber payload');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated My Timber release maintenance');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[manifest],'Unreviewed change after My Timber receipt');
 const prior=JSON.parse(content(c.base,manifest)),current=JSON.parse(content(head,manifest));delete current.myTimberProgressJourney;assert.deepEqual(current,prior,'Prior release receipts changed by My Timber registration');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),(path==='member-experience/public-preservation.mjs'?'Metrics maintenance source drift: ':'')+'Approved composition source / boundary drift: My Timber payload source drift: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved composition maintenance source drift: My Timber maintenance source drift: '+path);
 return c;
}

const rawGit=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
function verifyCurrentJourney(){const c=JSON.parse(execFileSync('git',['show','HEAD:'+manifest],{encoding:'utf8'}));if(c.myTimberProgressJourney)verifyMyTimberProgressJourney(c.myTimberProgressJourney,{head:rawGit('rev-parse','HEAD'),read:(ref,path)=>rawGit('rev-parse',ref+':'+path),diff:(a,b)=>rawGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>rawGit('merge-base','--is-ancestor',a,b)});return c;}
export function myTimberHistoricalRecord(record){const current=verifyCurrentJourney();assert.deepEqual(record,current,'Only the fully verified current record can expose the prior historical view');const prior=structuredClone(record);delete prior.myTimberProgressJourney;return prior;}
export function myTimberHistoricalIntegrationWorkflow(after){const current=verifyCurrentJourney();assert.equal(after,execFileSync('git',['show','HEAD:.github/workflows/shift-coach-integration.yml'],{encoding:'utf8'}),'Current integration workflow bytes differ');return current.myTimberProgressJourney?execFileSync('git',['show',MY_TIMBER_PROGRESS_BASE+':.github/workflows/shift-coach-integration.yml'],{encoding:'utf8'}):after;}
