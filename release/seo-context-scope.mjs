import {reconciliationHistoricalRef} from './approved-runtime-composition.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const CONTEXT_BASE='4460ea56f931da4003ace68d5d404831c47e08f7';
export const CONTEXT_PAYLOAD='25efa17b1b21bea5c140b87707041eb728865e38';
export const CONTEXT_PAYLOAD_PATHS= ["public-seo-context-data.mjs", "public-seo-context.mjs", "shift-coach/worker.mjs", "tests/public-seo-context.test.mjs"];
export const CONTEXT_MAINTENANCE_PATHS= ["release/seo-context-scope.mjs", "release/seo-discovery-scope.mjs", "release/approved-ranking-scope.mjs", "release/seo-technical-preservation.mjs", "tests/seo-context-release.test.mjs", ".github/workflows/seo-context-proof.yml"];
export const CONTEXT_PATHS=[...CONTEXT_PAYLOAD_PATHS,...CONTEXT_MAINTENANCE_PATHS];
export const CONTEXT_REQUEST= {"instruction": "Continue here now", "date": "2026-10-06", "scope": "Six internal links from five relevant existing pages to three indexed low-ranking guides, using existing titles and unchanged clinical sentences; accurate lastmod for those link sources. No homepage, Start Here, clinical-review attestation, external outreach or member change."};
export function validateContextComposition(c){
 assert(c,'Exact internal-link composition required');assert.equal(c.proof,'EXACT_RELEVANT_INTERNAL_LINKS_V1');
 assert.equal(c.base,CONTEXT_BASE);assert.equal(c.payloadSource,CONTEXT_PAYLOAD);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.deepEqual(c.payloadPaths,CONTEXT_PAYLOAD_PATHS);assert.deepEqual(c.maintenancePaths,CONTEXT_MAINTENANCE_PATHS);assert.deepEqual(c.request,CONTEXT_REQUEST);return c;
}
export function contextPinnedRef(c,path){if(!c)return null;validateContextComposition(c);return CONTEXT_PAYLOAD_PATHS.includes(path)?c.payloadSource:CONTEXT_MAINTENANCE_PATHS.includes(path)?c.maintenanceSource:null;}
export function verifyContextHistory(c){
 if(!c)return;validateContextComposition(c);const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
 for(const ref of [c.base,c.payloadSource,c.maintenanceSource])git('merge-base','--is-ancestor',ref,'HEAD');
 assert.deepEqual(git('diff','--name-only',c.base,c.payloadSource).split('\n').filter(Boolean).sort(),[...CONTEXT_PAYLOAD_PATHS].sort());
 assert.deepEqual(git('diff','--name-only',c.payloadSource,c.maintenanceSource).split('\n').filter(Boolean).sort(),[...CONTEXT_MAINTENANCE_PATHS,'shift-coach/release-manifest.json'].sort());
 assert.equal(git('rev-parse',c.base+':.github/workflows/cloudflare-production-promote.yml'),git('rev-parse',reconciliationHistoricalRef('HEAD','.github/workflows/cloudflare-production-promote.yml')+':.github/workflows/cloudflare-production-promote.yml'));
}
