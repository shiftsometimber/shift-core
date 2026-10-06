import {completionHistoricalRef,TECHNICAL_PATHS,TECHNICAL_BASE,technicalPinnedRef,validateTechnicalComposition,verifyTechnicalHistory} from './seo-technical-scope.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const FOLLOW_BASE='b4392ca89d9388352c0b29117488d44e9886c6c1';
export const FOLLOW_PAYLOAD='c72474347df03dd1e55178721be02ad85bf80889';
export const FOLLOW_PAYLOAD_PATHS=['ask-timber-v1.js','public-seo-follow-through.mjs','public-site-stream.mjs','shift-coach/worker.mjs'];
export const FOLLOW_MAINTENANCE_PATHS=['.github/workflows/seo-follow-through-proof.yml','release/fit-300-scope.mjs','release/seo-follow-through-scope.mjs','release/sitewide-seo-scope.mjs','scripts/verify-seo-follow-through.mjs','shift-coach/release-contract.mjs','tests/seo-follow-through-release.test.mjs','tests/sitewide-seo-release.test.mjs','tests/fixtures/seo-public-articles.json','scripts/b1-release-scope.mjs','scripts/verify-knowledge-headings.cjs','release/seo-follow-through-preservation.mjs','editorial/five-articles/proof.mjs','member-experience/public-preservation.mjs','scripts/verify-public-continuity-live.mjs','scripts/verify-six-topic-seo.mjs','release/six-topic-seo-scope.mjs','release/growth-scope.mjs','release/seo794-preservation.mjs','tests/seo794-preservation.test.mjs','release/book-voice-scope.mjs','tests/book-voice-release.test.mjs','shift-coach/release.test.mjs','scripts/verify-shift-take-live.mjs','my-timber-pwa/verify-live.mjs','release/app-scope.mjs'];
export const TABLET_GUIDANCE_BASE='4460ea56f931da4003ace68d5d404831c47e08f7';
export const TABLET_GUIDANCE_PATHS=[".github/workflows/practical-guides-proof.yml","docs/seo/2026-10-06-practical-guides.md","public-practical-guides.mjs","release/seo-follow-through-scope.mjs","release/six-topic-seo-scope.mjs","scripts/verify-practical-guides-handler.mjs","scripts/verify-practical-guides.mjs","shift-coach/worker.mjs","tests/approved-ranking-release.test.mjs","tests/practical-guides.test.mjs","tests/production-completion-release.test.mjs","tests/seo-follow-through-release.test.mjs"];
export function validateTabletGuidance(c){
 assert.equal(c.proof,'TABLET_GUIDANCE_EXACT_V1');assert.equal(c.base,TABLET_GUIDANCE_BASE);
 assert.deepEqual(c.paths,TABLET_GUIDANCE_PATHS);assert.match(c.source,/^[a-f0-9]{40}$/);
 if(c.run!==undefined){assert(Number.isSafeInteger(c.run)&&c.run>0);assert.match(c.proofSource,/^[a-f0-9]{40}$/);}
 return c;
}
export const TABLET_USEFULNESS_PAYLOAD=["member-experience/tablet-routine-client.mjs", "member-experience/tablet-routine.mjs", "public-practical-guides.mjs", "tests/tablet-routine-browser.mjs", "tests/tablet-routine.test.mjs"];
export const TABLET_USEFULNESS_MAINTENANCE=[".github/workflows/practical-guides-proof.yml", "release/app-manifest.json", "release/fit-300-scope.mjs", "release/seo-follow-through-scope.mjs", "scripts/verify-practical-guides-handler.mjs", "shift-coach/release-contract.mjs", "tests/seo-follow-through-release.test.mjs"];
export function validateTabletUsefulness(c){
 assert.equal(c.proof,'TABLET_USEFULNESS_OWNER_APPROVED_V1');
 assert.equal(c.payloadBase,'d71db6bf5f9a4ce2339bd3948686b93500e9ff04');
 assert.equal(c.payloadSource,'409f93612932ae9ff3715d04a8076dd4d1a9d3e7');
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.deepEqual(c.payloadPaths,TABLET_USEFULNESS_PAYLOAD);assert.deepEqual(c.maintenancePaths,TABLET_USEFULNESS_MAINTENANCE);
 assert.deepEqual(c.approval,{owner:'Matt',at:'2026-10-06T21:26:01Z',instruction:'Yes',review:'SHIFT-tablet-usefulness-review.html'});
 return c;
}
export function usefulnessPinnedRef(c,path){const u=c?.tabletUsefulnessComposition;if(!u)return null;validateTabletUsefulness(u);return u.payloadPaths.includes(path)?u.payloadSource:u.maintenancePaths.includes(path)?u.maintenanceSource:null;}
const ORIGINAL_FOLLOW_PATHS=[...FOLLOW_PAYLOAD_PATHS,...FOLLOW_MAINTENANCE_PATHS];
export const FOLLOW_PATHS=[...new Set([...ORIGINAL_FOLLOW_PATHS,...TECHNICAL_PATHS])];
export function validateFollowComposition(c){
 assert(c,'Exact owner-approved SEO v3 composition required');
 assert.equal(c.proof,'SITEWIDE_SEO_OWNER_APPROVED_V3');assert.equal(c.base,FOLLOW_BASE);assert.equal(c.payloadSource,FOLLOW_PAYLOAD);
 assert.deepEqual(c.payloadPaths,FOLLOW_PAYLOAD_PATHS);assert.deepEqual(c.maintenancePaths,FOLLOW_MAINTENANCE_PATHS);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.deepEqual(c.ownerApproval,{owner:'Matt O’Brien',at:'2026-10-06T14:18:48Z',instruction:'fix it all',review:'SHIFT-Sitewide-SEO-Review-v3-2026-10-06.html'});
 if(c.technicalComposition)validateTechnicalComposition(c.technicalComposition);
 if(c.tabletGuidanceComposition)validateTabletGuidance(c.tabletGuidanceComposition);
 if(c.tabletUsefulnessComposition)validateTabletUsefulness(c.tabletUsefulnessComposition);
 return c;
}
export function followPinnedRef(c,path){if(!c)return null;validateFollowComposition(c);return usefulnessPinnedRef(c,path)||(c.tabletGuidanceComposition?.paths.includes(path)?c.tabletGuidanceComposition.source:null)||technicalPinnedRef(c.technicalComposition,path)|| (c.payloadPaths.includes(path)?c.payloadSource:c.maintenancePaths.includes(path)?c.maintenanceSource:null);}
export function followHistoricalRead(read,c){if(!c)return read;validateFollowComposition(c);return(ref,path)=>read(ref==='HEAD'&&ORIGINAL_FOLLOW_PATHS.includes(path)?FOLLOW_BASE:completionHistoricalRef(c.technicalComposition,ref,path)!==ref?completionHistoricalRef(c.technicalComposition,ref,path):ref==='HEAD'&&c.technicalComposition&&TECHNICAL_PATHS.includes(path)?TECHNICAL_BASE:ref==='HEAD'&&c.tabletGuidanceComposition?.paths.includes(path)?TABLET_GUIDANCE_BASE:ref,path);}
export function verifyFollowHistory(c){
 if(!c)return;validateFollowComposition(c);verifyTechnicalHistory(c.technicalComposition);const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 if(c.tabletUsefulnessComposition){const u=validateTabletUsefulness(c.tabletUsefulnessComposition);
  for(const r of [u.payloadSource,u.maintenanceSource])git('merge-base','--is-ancestor',r,'HEAD');
  assert.deepEqual(git('diff','--name-only',u.payloadBase,u.payloadSource).split('\n').filter(Boolean).sort(),u.payloadPaths);
  assert.deepEqual(git('diff','--name-only','409f93612932ae9ff3715d04a8076dd4d1a9d3e7',u.maintenanceSource).split('\n').filter(Boolean).sort(),u.maintenancePaths);
  for(const p of [...u.payloadPaths,...u.maintenancePaths])assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',usefulnessPinnedRef(c,p)+':'+p),'Tablet usefulness source drift: '+p);
 }
 if(c.tabletGuidanceComposition){const t=validateTabletGuidance(c.tabletGuidanceComposition);
  git('merge-base','--is-ancestor',t.base,t.source);git('merge-base','--is-ancestor',t.source,'HEAD');
  assert.deepEqual(git('diff','--name-only',t.base,t.source).split('\n').filter(Boolean).sort(),[...TABLET_GUIDANCE_PATHS].sort(),'Exact tablet guidance payload required');
  for(const p of t.paths)assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',(usefulnessPinnedRef(c,p)||t.source)+':'+p),'Tablet guidance source drift: '+p);
  if(t.proofSource){git('merge-base','--is-ancestor',t.source,t.proofSource);git('merge-base','--is-ancestor',t.proofSource,'HEAD');assert.deepEqual(git('diff','--name-only',t.source,t.proofSource).split('\n').filter(Boolean),['shift-coach/release-manifest.json']);}
 }
 for(const ref of [FOLLOW_BASE,FOLLOW_PAYLOAD,c.maintenanceSource])git('merge-base','--is-ancestor',ref,'HEAD');
 assert.deepEqual(git('diff','--name-only',FOLLOW_BASE,FOLLOW_PAYLOAD).split('\n').filter(Boolean).sort(),[...FOLLOW_PAYLOAD_PATHS].sort());
 assert.deepEqual(git('diff','--name-only',FOLLOW_PAYLOAD,c.maintenanceSource).split('\n').filter(Boolean).sort(),[...FOLLOW_MAINTENANCE_PATHS,'shift-coach/release-manifest.json'].sort(),'Exact v3 release maintenance scope required');
}
