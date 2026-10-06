import {CONTEXT_PATHS,contextPinnedRef,validateContextComposition,verifyContextHistory} from './seo-context-scope.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const DISCOVERY_BASE='5c6bec0e59d914b234dffac400da9b6f3c0f1578';
export const DISCOVERY_PAYLOAD='506dfd63d9267c936ab31c2a8ae167b3717b49f5';
export const DISCOVERY_PAYLOAD_PATHS=["public-seo-discovery.mjs", "shift-coach/worker.mjs", "tests/public-seo-discovery.test.mjs"];
export const DISCOVERY_MAINTENANCE_PATHS=["release/seo-discovery-scope.mjs", "release/approved-ranking-scope.mjs", "release/seo-technical-scope.mjs", "tests/seo-discovery-release.test.mjs", ".github/workflows/seo-discovery-proof.yml"];
export const DISCOVERY_ORIGINAL_PATHS=[...DISCOVERY_PAYLOAD_PATHS,...DISCOVERY_MAINTENANCE_PATHS];
export const DISCOVERY_PATHS=[...DISCOVERY_ORIGINAL_PATHS,...CONTEXT_PATHS];
export const DISCOVERY_REQUEST={"instruction": "Look into this - also resolve all pages seo", "date": "2026-10-06", "scope": "Exact root IndexNow ownership-key endpoint, removal of the closed treatment-order discovery line and accurate 6 October lastmod for the two published articles; no new editorial wording, homepage, member route, outreach or clinical approval."};
export function validateDiscoveryComposition(c){
 assert(c,'Exact technical discovery composition required');assert.equal(c.proof,'EXACT_INDEXNOW_AND_PUBLIC_DISCOVERY_V1');
 assert.equal(c.base,DISCOVERY_BASE);assert.equal(c.payloadSource,DISCOVERY_PAYLOAD);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.deepEqual(c.payloadPaths,DISCOVERY_PAYLOAD_PATHS);assert.deepEqual(c.maintenancePaths,DISCOVERY_MAINTENANCE_PATHS);assert.deepEqual(c.request,DISCOVERY_REQUEST);if(c.contextComposition)validateContextComposition(c.contextComposition);return c;
}
export function discoveryPinnedRef(c,path){if(!c)return null;validateDiscoveryComposition(c);return contextPinnedRef(c.contextComposition,path)||(DISCOVERY_PAYLOAD_PATHS.includes(path)?c.payloadSource:DISCOVERY_MAINTENANCE_PATHS.includes(path)?c.maintenanceSource:null);}
export function verifyDiscoveryHistory(c){
 if(!c)return;validateDiscoveryComposition(c);verifyContextHistory(c.contextComposition);const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
 for(const ref of [c.base,c.payloadSource,c.maintenanceSource])git('merge-base','--is-ancestor',ref,'HEAD');
 assert.deepEqual(git('diff','--name-only',c.base,c.payloadSource).split('\n').filter(Boolean).sort(),[...DISCOVERY_PAYLOAD_PATHS].sort());
 assert.deepEqual(git('diff','--name-only',c.payloadSource,c.maintenanceSource).split('\n').filter(Boolean).sort(),[...DISCOVERY_MAINTENANCE_PATHS,'shift-coach/release-manifest.json'].sort());
 assert.equal(git('rev-parse',c.base+':.github/workflows/cloudflare-production-promote.yml'),git('rev-parse','HEAD:.github/workflows/cloudflare-production-promote.yml'));
}
