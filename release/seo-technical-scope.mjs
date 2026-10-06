import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const TECHNICAL_BASE='ddde14b19d6ef79547e27afb4ed76bf1f4e39f05';
export const TECHNICAL_PAYLOAD='1ea9430e2ab79b2ae7b343bf19c4f9c8c976d932';
export const TECHNICAL_PAYLOAD_PATHS=["public-seo-technical-data.mjs","public-seo-technical.mjs","shift-coach/worker.mjs","tests/public-seo-technical.test.mjs"];
export const TECHNICAL_MAINTENANCE_PATHS=[".github/workflows/seo-technical-proof.yml","release/app-scope.mjs","release/seo-follow-through-preservation.mjs","release/seo-follow-through-scope.mjs","release/seo-technical-preservation-data.mjs","release/seo-technical-preservation.mjs","release/seo-technical-scope.mjs","scripts/verify-seo-closeout-live.mjs","scripts/verify-seo-follow-through.mjs","shift-coach/release-contract.mjs","tests/seo-technical-release.test.mjs"];
export const TECHNICAL_BASE_PATHS=["release/app-manifest.json","release/fit-300-scope.mjs","release/watch-registry-wave-scope.mjs","tests/b1-release-scope.test.mjs"];
// Exact current-main source pins preserve the concurrent Watch reconciliation.
export const TECHNICAL_PATHS=[...TECHNICAL_PAYLOAD_PATHS,...TECHNICAL_MAINTENANCE_PATHS,...TECHNICAL_BASE_PATHS];
export function validateTechnicalComposition(c){
 assert(c,'Exact technical SEO source composition required');
 assert.equal(c.proof,'EXACT_ARTICLE_IDENTITY_AND_NOINDEX_SITEMAP_V1');
 assert.equal(c.base,TECHNICAL_BASE);assert.equal(c.payloadSource,TECHNICAL_PAYLOAD);
 assert.deepEqual(c.payloadPaths,TECHNICAL_PAYLOAD_PATHS);assert.deepEqual(c.maintenancePaths,TECHNICAL_MAINTENANCE_PATHS);assert.deepEqual(c.basePaths,TECHNICAL_BASE_PATHS);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.deepEqual(c.request,{instruction:'Look into this - also resolve all pages seo',date:'2026-10-06',scope:'Existing article metadata and noindex sitemap exclusions; homepage and Start Here preserved; no new visible wording.'});
 return c;
}
export function technicalPinnedRef(c,path){
 if(!c)return null;validateTechnicalComposition(c);
 return TECHNICAL_PAYLOAD_PATHS.includes(path)?c.payloadSource:TECHNICAL_MAINTENANCE_PATHS.includes(path)?c.maintenanceSource:TECHNICAL_BASE_PATHS.includes(path)?c.base:null;
}
export function verifyTechnicalHistory(c){
 if(!c)return;validateTechnicalComposition(c);
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 for(const ref of [c.base,c.payloadSource,c.maintenanceSource])git('merge-base','--is-ancestor',ref,'HEAD');
 assert.deepEqual(git('diff','--name-only',c.base,c.payloadSource).split('\n').filter(Boolean).sort(),[...TECHNICAL_PAYLOAD_PATHS].sort());
 assert.deepEqual(git('diff','--name-only',c.payloadSource,c.maintenanceSource).split('\n').filter(Boolean).sort(),[...TECHNICAL_MAINTENANCE_PATHS,'shift-coach/release-manifest.json'].sort());
}
