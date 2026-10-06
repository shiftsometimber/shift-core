import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const FOLLOW_BASE='b4392ca89d9388352c0b29117488d44e9886c6c1';
export const FOLLOW_PAYLOAD='98220aae8b1c7135e43d1e100b32e6895eec7b34';
export const FOLLOW_PAYLOAD_PATHS=['ask-timber-v1.js','public-seo-follow-through.mjs','public-site-stream.mjs','shift-coach/worker.mjs'];
export const FOLLOW_MAINTENANCE_PATHS=['.github/workflows/seo-follow-through-proof.yml','release/fit-300-scope.mjs','release/seo-follow-through-scope.mjs','release/sitewide-seo-scope.mjs','scripts/verify-seo-follow-through.mjs','shift-coach/release-contract.mjs','tests/seo-follow-through-release.test.mjs','tests/sitewide-seo-release.test.mjs','tests/fixtures/seo-public-articles.json'];
export const FOLLOW_PATHS=[...FOLLOW_PAYLOAD_PATHS,...FOLLOW_MAINTENANCE_PATHS];
export function validateFollowComposition(c){
 assert(c,'Exact owner-approved SEO v3 composition required');
 assert.equal(c.proof,'SITEWIDE_SEO_OWNER_APPROVED_V3');assert.equal(c.base,FOLLOW_BASE);assert.equal(c.payloadSource,FOLLOW_PAYLOAD);
 assert.deepEqual(c.payloadPaths,FOLLOW_PAYLOAD_PATHS);assert.deepEqual(c.maintenancePaths,FOLLOW_MAINTENANCE_PATHS);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.deepEqual(c.ownerApproval,{owner:'Matt O’Brien',at:'2026-10-06T14:18:48Z',instruction:'fix it all',review:'SHIFT-Sitewide-SEO-Review-v3-2026-10-06.html'});
 return c;
}
export function followPinnedRef(c,path){if(!c)return null;validateFollowComposition(c);return c.payloadPaths.includes(path)?c.payloadSource:c.maintenancePaths.includes(path)?c.maintenanceSource:null;}
export function followHistoricalRead(read,c){if(!c)return read;validateFollowComposition(c);return(ref,path)=>read(ref==='HEAD'&&FOLLOW_PATHS.includes(path)?FOLLOW_BASE:ref,path);}
export function verifyFollowHistory(c){
 if(!c)return;validateFollowComposition(c);const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 for(const ref of [FOLLOW_BASE,FOLLOW_PAYLOAD,c.maintenanceSource])git('merge-base','--is-ancestor',ref,'HEAD');
 assert.deepEqual(git('diff','--name-only',FOLLOW_BASE,FOLLOW_PAYLOAD).split('\n').filter(Boolean).sort(),[...FOLLOW_PAYLOAD_PATHS].sort());
 assert.deepEqual(git('diff','--name-only',FOLLOW_PAYLOAD,c.maintenanceSource).split('\n').filter(Boolean).sort(),[...FOLLOW_MAINTENANCE_PATHS,'shift-coach/release-manifest.json'].sort(),'Exact v3 release maintenance scope required');
}
