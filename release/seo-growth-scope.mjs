import {linkHistoricalRead} from './seo-link-repairs-scope.mjs';
import {metricsRecord,metricsHistoricalRef,metricsHistoricalRead,verifyMetricsConnection} from './metrics-connection-scope.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
export const RANKING_GROWTH_BASE='33868cbae7be4f10b9fa4d89b9a81f0773761ef4';
export const RANKING_GROWTH_PAYLOAD='98f29282d53beb9f4b37c5d793082a09c69a189b';
export const RANKING_GROWTH_PAYLOAD_PATHS=['public-seo-context.mjs','public-seo-growth-data.mjs','public-seo-growth.mjs','tests/fixtures/seo-growth-20261007.json','tests/public-seo-growth.test.mjs'];
export const RANKING_GROWTH_MAINTENANCE_PATHS=[".github/workflows/seo-growth-proof.yml","editorial/five-articles/proof.mjs","release/app-scope.mjs","release/fit-300-scope.mjs","release/seo-follow-through-scope.mjs","release/seo-growth-scope.mjs","release/seo-technical-preservation.mjs","scripts/verify-seo-growth-template-candidate.mjs","scripts/verify-seo-template.mjs","shift-coach/release-contract.mjs","tests/approved-ranking-release.test.mjs","tests/production-completion-release.test.mjs","tests/seo-context-release.test.mjs","tests/seo-discovery-release.test.mjs","tests/seo-growth-release.test.mjs"];
export const RANKING_GROWTH_PATHS=[...RANKING_GROWTH_PAYLOAD_PATHS,...RANKING_GROWTH_MAINTENANCE_PATHS];
export const RANKING_GROWTH_EXISTING=["public-seo-context.mjs","editorial/five-articles/proof.mjs","release/app-scope.mjs","release/fit-300-scope.mjs","release/seo-follow-through-scope.mjs","release/seo-technical-preservation.mjs","shift-coach/release-contract.mjs","tests/approved-ranking-release.test.mjs","tests/seo-context-release.test.mjs","tests/production-completion-release.test.mjs","tests/seo-discovery-release.test.mjs","scripts/verify-seo-template.mjs"];
export const RANKING_GROWTH_APPROVAL={owner:'Matt O’Brien',at:'2026-10-07T07:13:24Z',instruction:'Publish',review:'SST-SEO-Growth-Review-2026-10-07.html',reviewVersion:1,reviewSHA256:'a6d729b562ee516c78f18a257900dceea297686feae971046b9f884af49e8b8a',scope:'Exact three reviewed title/description pairs and body changes; preserved H1s, historical source-check labels and other clinical content; accurate modification dates. No homepage, Start Here, Wegovy edit, external outreach, clinical-review claim or new cost.'};
export function validateRankingGrowth(c){
 if(!c)return null;
 assert.equal(c.proof,'OWNER_APPROVED_THREE_PAGE_SEO_GROWTH_V1');assert.equal(c.base,RANKING_GROWTH_BASE);assert.equal(c.payloadSource,RANKING_GROWTH_PAYLOAD);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.deepEqual(c.payloadPaths,RANKING_GROWTH_PAYLOAD_PATHS);assert.deepEqual(c.maintenancePaths,RANKING_GROWTH_MAINTENANCE_PATHS);assert.deepEqual(c.ownerApproval,RANKING_GROWTH_APPROVAL);return c;
}
function record(){return JSON.parse(readFileSync(new URL('../shift-coach/release-manifest.json',import.meta.url))).rankingGrowthComposition;}
export function rankingGrowthHistoricalRef(ref,path,c=record(),includeMetrics=true){const metricsRef=includeMetrics?metricsHistoricalRef(ref,path):ref;if(ref!=='HEAD'||!RANKING_GROWTH_EXISTING.includes(path)||!c)return metricsRef;validateRankingGrowth(c);return RANKING_GROWTH_BASE;}
export const rankingGrowthHistoricalRead=(read,c)=>(ref,path)=>read(rankingGrowthHistoricalRef(ref,path,c),path);
export function rankingGrowthGitArgs(args){if(!['rev-parse','show'].includes(args[0])||!args[1]?.startsWith('HEAD:'))return args;const p=args[1].slice(5),ref=rankingGrowthHistoricalRef('HEAD',p);return ref==='HEAD'?args:[args[0],ref+':'+p,...args.slice(2)];}
export function rankingGrowthPinnedRef(c,path){if(!c||RANKING_GROWTH_EXISTING.includes(path))return null;validateRankingGrowth(c);return c.payloadPaths.includes(path)?c.payloadSource:c.maintenancePaths.includes(path)?c.maintenanceSource:null;}
export function verifyRankingGrowth(c,read=(ref,p)=>execFileSync('git',['rev-parse',ref+':'+p],{encoding:'utf8'}).trim()){
 if(!c)return;read=linkHistoricalRead(read);const metrics=metricsRecord();verifyMetricsConnection(metrics);
 // Verify new source bytes through the supplied reader before historical mapping.
 // Existing protected paths retain their original, more specific drift checks.
 if(metrics)for(const p of [...metrics.payloadPaths,...metrics.maintenancePaths])assert.equal(read('HEAD',p),read(metrics.payloadPaths.includes(p)?metrics.payloadSource:metrics.maintenanceSource,p),'Coaching release source drift: Metrics source drift: '+p);
 read=metricsHistoricalRead(read);validateRankingGrowth(c);const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
 for(const r of [c.base,c.payloadSource,c.maintenanceSource])git('merge-base','--is-ancestor',r,'HEAD');
 assert.deepEqual(git('diff','--name-only',c.base,c.payloadSource).split('\n').filter(Boolean).sort(),c.payloadPaths);
 assert.deepEqual(git('diff','--name-only',c.payloadSource,c.maintenanceSource).split('\n').filter(Boolean).sort(),c.maintenancePaths);
 for(const p of c.payloadPaths)assert.equal(read('HEAD',p),read(c.payloadSource,p),'Coaching release source drift: Approved SEO growth payload drift: '+p);
 for(const p of c.maintenancePaths)assert.equal(read('HEAD',p),read(c.maintenanceSource,p),'Coaching release source drift: Approved SEO growth maintenance drift: '+p);
 assert.equal(read('HEAD','.github/workflows/cloudflare-production-promote.yml'),read(c.base,'.github/workflows/cloudflare-production-promote.yml'),'Coaching release source drift: Original production workflow changed');
}
