import {completionHistoricalRef,TECHNICAL_PATHS,TECHNICAL_BASE,technicalPinnedRef,validateTechnicalComposition,verifyTechnicalHistory} from './seo-technical-scope.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const FOLLOW_BASE='b4392ca89d9388352c0b29117488d44e9886c6c1';
export const FOLLOW_PAYLOAD='c72474347df03dd1e55178721be02ad85bf80889';
export const FOLLOW_PAYLOAD_PATHS=['ask-timber-v1.js','public-seo-follow-through.mjs','public-site-stream.mjs','shift-coach/worker.mjs'];
export const FOLLOW_MAINTENANCE_PATHS=['.github/workflows/seo-follow-through-proof.yml','release/fit-300-scope.mjs','release/seo-follow-through-scope.mjs','release/sitewide-seo-scope.mjs','scripts/verify-seo-follow-through.mjs','shift-coach/release-contract.mjs','tests/seo-follow-through-release.test.mjs','tests/sitewide-seo-release.test.mjs','tests/fixtures/seo-public-articles.json','scripts/b1-release-scope.mjs','scripts/verify-knowledge-headings.cjs','release/seo-follow-through-preservation.mjs','editorial/five-articles/proof.mjs','member-experience/public-preservation.mjs','scripts/verify-public-continuity-live.mjs','scripts/verify-six-topic-seo.mjs','release/six-topic-seo-scope.mjs','release/growth-scope.mjs','release/seo794-preservation.mjs','tests/seo794-preservation.test.mjs','release/book-voice-scope.mjs','tests/book-voice-release.test.mjs','shift-coach/release.test.mjs','scripts/verify-shift-take-live.mjs','my-timber-pwa/verify-live.mjs','release/app-scope.mjs'];
const ORIGINAL_FOLLOW_PATHS=[...FOLLOW_PAYLOAD_PATHS,...FOLLOW_MAINTENANCE_PATHS];
export const FOLLOW_PATHS=[...new Set([...ORIGINAL_FOLLOW_PATHS,...TECHNICAL_PATHS])];
export function validateFollowComposition(c){
 assert(c,'Exact owner-approved SEO v3 composition required');
 assert.equal(c.proof,'SITEWIDE_SEO_OWNER_APPROVED_V3');assert.equal(c.base,FOLLOW_BASE);assert.equal(c.payloadSource,FOLLOW_PAYLOAD);
 assert.deepEqual(c.payloadPaths,FOLLOW_PAYLOAD_PATHS);assert.deepEqual(c.maintenancePaths,FOLLOW_MAINTENANCE_PATHS);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.deepEqual(c.ownerApproval,{owner:'Matt O’Brien',at:'2026-10-06T14:18:48Z',instruction:'fix it all',review:'SHIFT-Sitewide-SEO-Review-v3-2026-10-06.html'});
 if(c.technicalComposition)validateTechnicalComposition(c.technicalComposition);
 return c;
}
export function followPinnedRef(c,path){if(!c)return null;validateFollowComposition(c);return technicalPinnedRef(c.technicalComposition,path)|| (c.payloadPaths.includes(path)?c.payloadSource:c.maintenancePaths.includes(path)?c.maintenanceSource:null);}
export function followHistoricalRead(read,c){if(!c)return read;validateFollowComposition(c);return(ref,path)=>read(ref==='HEAD'&&ORIGINAL_FOLLOW_PATHS.includes(path)?FOLLOW_BASE:completionHistoricalRef(c.technicalComposition,ref,path)!==ref?completionHistoricalRef(c.technicalComposition,ref,path):ref==='HEAD'&&c.technicalComposition&&TECHNICAL_PATHS.includes(path)?TECHNICAL_BASE:ref,path);}
export function verifyFollowHistory(c){
 if(!c)return;validateFollowComposition(c);verifyTechnicalHistory(c.technicalComposition);const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 for(const ref of [FOLLOW_BASE,FOLLOW_PAYLOAD,c.maintenanceSource])git('merge-base','--is-ancestor',ref,'HEAD');
 assert.deepEqual(git('diff','--name-only',FOLLOW_BASE,FOLLOW_PAYLOAD).split('\n').filter(Boolean).sort(),[...FOLLOW_PAYLOAD_PATHS].sort());
 assert.deepEqual(git('diff','--name-only',FOLLOW_PAYLOAD,c.maintenanceSource).split('\n').filter(Boolean).sort(),[...FOLLOW_MAINTENANCE_PATHS,'shift-coach/release-manifest.json'].sort(),'Exact v3 release maintenance scope required');
}
