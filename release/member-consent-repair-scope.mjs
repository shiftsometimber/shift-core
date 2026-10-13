import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export const MEMBER_CONSENT_BASE= "fc196ebeaf47e04fbe5aec8d9ddefc93b9a50a5e";
export const MEMBER_CONSENT_SOURCE= "c44221d219f870c1683cb7837e63c1c2038b95f8";
export const MEMBER_CONSENT_BLOBS=Object.freeze({
 "frontend/member/api-adapter-v33d.js": "8d71b0314e5a80a35447a5412ac62acd4763b231",
 "frontend/member/member-product-v33d.js": "6798dcbdff6b1631608b28a9cad799eb2cc11197",
 "g2-011-progress-story-production.mjs": "a5e639024d121df61b722e92a68e259a8722b451",
 "g2-013-progress-picture-rendered-production.mjs": "98d4dfd5f14c638341232caeef63183dca8f27a7",
 "g2-014-progress-picture-premium-production.mjs": "197e25284a15c7f91db108ac34f6a6c50c979594",
 "health-passport/acceptance-diagnostics.mjs": "c2507de334bb6ebbaf3cb4153dba61a908a8bcc1",
 "my-timber-final-production.mjs": "f0592648232bcd1d49dfb498c1ed1e7efaba9a32",
 "rendered-member-acceptance-support.mjs": "fea6008413c80a69e120cff606c9bb564d690e55",
 "tests/photo-tracking-choice.test.mjs": "18b625601da21714374ea3a29e99b7cead880978",
 "tests/rendered-member-acceptance-support.test.mjs": "467a4fac8152fa396201b8688a54f30a0244dc04",
 "tests/request-evidence-privacy.test.mjs": "7848b43aa2c2dbb8607133a7d38e48084dd35c9a"
});
export const MEMBER_CONSENT_PATHS=Object.freeze(Object.keys(MEMBER_CONSENT_BLOBS));
export const MEMBER_CONSENT_MAINTENANCE=Object.freeze([
 "release/member-consent-repair-scope.mjs",
 "tests/member-consent-repair-composition.test.mjs",
 "release/finite-growth-scope.mjs",
 "release/approved-runtime-composition.mjs",
 "tests/finite-growth-composition.test.mjs",
 ".github/workflows/shift-coach-integration.yml",
 ".github/workflows/cloudflare-production-promote.yml"
]);
export const MEMBER_CONSENT_FLAGS=Object.freeze(['homepageChanged','clinicalChanged','stockChanged','customerDataChanged','sourceConsentAutomaticallyGranted','storagePolicyChanged','emailGeneratingStepsStarted','externalCommunicationsSent','paidModelEnabled','existingGatesWeakened','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened']);
const manifest='release/approved-runtime-composition.json',sorted=a=>[...a].sort();
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'});
export function verifyMemberConsentSource(c,{head,read,blob=read,diff,ancestor,content:contents}){
 assert.equal(c?.proof,'EXACT_MEMBER_CONSENT_REPAIR_SOURCE_20261013');
 assert.equal(c.base,MEMBER_CONSENT_BASE);assert.equal(c.source,MEMBER_CONSENT_SOURCE);assert.equal(c.integrationIssue,1065);
 assert.deepEqual(c.paths,MEMBER_CONSENT_PATHS);assert.deepEqual(c.maintenancePaths,MEMBER_CONSENT_MAINTENANCE);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.match(head,/^[a-f0-9]{40}$/);
 for(const f of MEMBER_CONSENT_FLAGS)assert.equal(c[f],false,'Member repair boundary: '+f);
 for(const ref of [c.base,c.source,c.maintenanceSource])ancestor(ref,head);
 ancestor(c.base,c.source);ancestor(c.source,c.maintenanceSource);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated member payload');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated member maintenance');
 assert.deepEqual(diff(c.maintenanceSource,head),[manifest],'Unreviewed change after member source registration');
 for(const path of c.paths){assert.equal(blob(c.source,path),MEMBER_CONSENT_BLOBS[path],'Frozen member source changed: '+path);assert.equal(blob('HEAD',path),MEMBER_CONSENT_BLOBS[path],'Member source drift: '+path);assert.equal(read('HEAD',path),read(c.source,path),'Member source drift: '+path);}
 for(const path of c.maintenancePaths){assert.equal(blob('HEAD',path),blob(c.maintenanceSource,path),'Member maintenance drift: '+path);assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Member maintenance drift: '+path);}
 const before=JSON.parse(contents(c.base,manifest)),after=JSON.parse(contents(head,manifest));delete after.memberConsentRepair;
 assert.deepEqual(after,before,'Every prior approval and release record must remain unchanged');
 return c;
}
export function requireMemberConsentReleaseAuthority(c){
 const a=c?.releaseApproval;
 assert(a,'Exact member repair publication and production approval is missing');
 assert.equal(a.owner,'Matt');assert.equal(a.instruction,'Publish and guarded deploy this exact member repair');
 assert.equal(a.source,MEMBER_CONSENT_SOURCE);assert.equal(a.maintenanceSource,c.maintenanceSource);
 assert.match(a.recordedAt,/^2026-\d{2}-\d{2}T/);assert.equal(a.integrationIssue,1065);
 assert.equal(a.emailAuthority,false);assert.equal(a.rollbackAuthorityBroadened,false);
 return a;
}
export function memberConsentHistoricalView(reader=(ref,path)=>git('rev-parse',ref+':'+path)){
 const rawHead=git('rev-parse','HEAD'),current=JSON.parse(content('HEAD',manifest)),repair=current.memberConsentRepair;
 if(!repair)return {record:current,rawHead,head:rawHead,read:reader,content};
 verifyMemberConsentSource(repair,{head:rawHead,read:reader,blob:(ref,path)=>git('rev-parse',ref+':'+path),diff:(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>git('merge-base','--is-ancestor',a,b),content});
 const record=structuredClone(current);delete record.memberConsentRepair;
 const changed=new Set([...repair.paths,...repair.maintenancePaths,manifest]);
 const read=(ref,path)=>{
  if(ref!=='HEAD')return reader(ref,path);
  const expected=repair.paths.includes(path)?repair.source:repair.maintenancePaths.includes(path)?repair.maintenanceSource:repair.base;
  // Preserve fresh supplied-reader checks even after a verified historical view.
  if(path!==manifest)assert.equal(reader('HEAD',path),reader(expected,path),'Member historical source drift: '+path);
  return reader(repair.base,path);
 };
 return {record,rawHead,head:repair.base,read,content:(ref,path)=>content(ref==='HEAD'?repair.base:ref,path)};
}
export function memberConsentHistoricalFile(path,bytes){
 const view=memberConsentHistoricalView();assert.equal(bytes,content('HEAD',path),'Historical file must be exact current bytes');
 if(view.rawHead===view.head)return bytes;
 assert(MEMBER_CONSENT_MAINTENANCE.includes(path),'Unlisted member maintenance historical file');
 return content(MEMBER_CONSENT_BASE,path);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const record=JSON.parse(content('HEAD',manifest));memberConsentHistoricalView();
 if(process.argv.includes('--require-release-authority')&&record.memberConsentRepair)requireMemberConsentReleaseAuthority(record.memberConsentRepair);
 console.log('PASS exact bounded member source'+(process.argv.includes('--require-release-authority')?' and release authority':''));
}
