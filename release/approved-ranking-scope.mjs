import {CONTEXT_BASE,CONTEXT_PATHS} from './seo-context-scope.mjs';
import {DISCOVERY_BASE,DISCOVERY_PATHS,DISCOVERY_ORIGINAL_PATHS,discoveryPinnedRef,validateDiscoveryComposition,verifyDiscoveryHistory} from './seo-discovery-scope.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const RANKING_BASE='115b4e53279aeffd9b8248909e2dda5bbf768f80';
export const RANKING_PAYLOAD='d8eb3a87f1e33a77cf22fbe6cd265f51b330b1a7';
export const RANKING_PAYLOAD_PATHS=["public-seo-approved-data.mjs", "public-seo-approved.mjs", "prescriber-questions.mjs", "shift-coach/worker.mjs", "tests/public-seo-approved.test.mjs"];
export const RANKING_MAINTENANCE_PATHS=["release/approved-ranking-scope.mjs", "release/production-completion-scope.mjs", "release/seo-technical-scope.mjs", "release/seo-technical-preservation.mjs", "tests/production-completion-release.test.mjs", "tests/seo-technical-release.test.mjs", "tests/approved-ranking-release.test.mjs", ".github/workflows/approved-ranking-proof.yml"];
export const RANKING_PATHS=[...RANKING_PAYLOAD_PATHS,...RANKING_MAINTENANCE_PATHS,...DISCOVERY_PATHS];
export const RANKING_APPROVAL={"owner": "Matt O’Brien", "at": "2026-10-06T19:52:25Z", "instruction": "approved but need to really crack on now", "review": "SST-Organic-Reach-Authority-Review-2026-10-06.html", "reviewVersion": 1, "scope": "Five exact reviewed page changes and prescriber worksheet web publication; no homepage, Start Here, outgoing message or clinical-review attestation."};
export function validateRankingComposition(c){
 assert(c,'Exact approved ranking composition required');assert.equal(c.proof,'EXACT_OWNER_APPROVED_FIVE_PAGE_RANKING_V1');
 assert.equal(c.base,RANKING_BASE);assert.equal(c.payloadSource,RANKING_PAYLOAD);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.deepEqual(c.payloadPaths,RANKING_PAYLOAD_PATHS);assert.deepEqual(c.maintenancePaths,RANKING_MAINTENANCE_PATHS);assert.deepEqual(c.ownerApproval,RANKING_APPROVAL);if(c.discoveryComposition)validateDiscoveryComposition(c.discoveryComposition);return c;
}
export function rankingPinnedRef(c,path){if(!c)return null;validateRankingComposition(c);return discoveryPinnedRef(c.discoveryComposition,path)|| (RANKING_PAYLOAD_PATHS.includes(path)?c.payloadSource:RANKING_MAINTENANCE_PATHS.includes(path)?c.maintenanceSource:null);}
export function verifyRankingHistory(c){
 if(!c)return;validateRankingComposition(c);verifyDiscoveryHistory(c.discoveryComposition);const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
 for(const ref of [c.base,c.payloadSource,c.maintenanceSource])git('merge-base','--is-ancestor',ref,'HEAD');
 assert.deepEqual(git('diff','--name-only',c.base,c.payloadSource).split('\n').filter(Boolean).sort(),[...RANKING_PAYLOAD_PATHS].sort());
 assert.deepEqual(git('diff','--name-only',c.payloadSource,c.maintenanceSource).split('\n').filter(Boolean).sort(),[...RANKING_MAINTENANCE_PATHS,'shift-coach/release-manifest.json'].sort());
}

export function discoveryHistoricalRef(c,ref,path){if(ref!=='HEAD'||!c?.discoveryComposition)return ref;if(DISCOVERY_ORIGINAL_PATHS.includes(path))return DISCOVERY_BASE;return c.discoveryComposition.contextComposition&&CONTEXT_PATHS.includes(path)&&![...RANKING_PAYLOAD_PATHS,...RANKING_MAINTENANCE_PATHS].includes(path)?CONTEXT_BASE:ref;}
