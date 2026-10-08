import {COMPOSITION_BASE} from '../release/approved-runtime-composition.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {RANKING_GROWTH_APPROVAL,RANKING_GROWTH_BASE,RANKING_GROWTH_PATHS,RANKING_GROWTH_PAYLOAD,RANKING_GROWTH_PAYLOAD_PATHS,RANKING_GROWTH_MAINTENANCE_PATHS,validateRankingGrowth,verifyRankingGrowth,rankingGrowthHistoricalRef,rankingGrowthPinnedRef} from '../release/seo-growth-scope.mjs';
const c=JSON.parse(readFileSync('shift-coach/release-manifest.json')).rankingGrowthComposition;
test('three-page composition requires the exact reviewed public-copy payload, approval and finite maintenance',()=>{
 validateRankingGrowth(c);verifyRankingGrowth(c);assert.equal(c.ownerApproval.instruction,'Publish');assert.equal(c.ownerApproval.reviewVersion,1);
 for(const p of ['.github/workflows/cloudflare-production-promote.yml','wrangler.jsonc','worker-entry-v6.js'])assert(!RANKING_GROWTH_PATHS.includes(p));
 for(const patch of [{payloadSource:'a'.repeat(40)},{base:'a'.repeat(40)},{payloadPaths:[...c.payloadPaths,'worker-entry-v6.js']},{maintenancePaths:[]},{ownerApproval:{...RANKING_GROWTH_APPROVAL,reviewSHA256:'b'.repeat(64)}}])assert.throws(()=>validateRankingGrowth({...c,...patch}));
});
test('historical normalisation is bounded and raw current bytes remain independently pinned',()=>{
 assert.equal(rankingGrowthHistoricalRef('HEAD','public-seo-context.mjs',c),RANKING_GROWTH_BASE);assert.equal(rankingGrowthHistoricalRef('HEAD','worker-entry-v6.js',c),COMPOSITION_BASE);assert.equal(rankingGrowthHistoricalRef('HEAD','public-seo-growth.mjs',c),'HEAD');assert.equal(rankingGrowthHistoricalRef('a'.repeat(40),'public-seo-context.mjs',c),'a'.repeat(40));
 assert.equal(rankingGrowthPinnedRef(c,'public-seo-growth.mjs'),RANKING_GROWTH_PAYLOAD);assert.equal(rankingGrowthPinnedRef(c,'release/seo-growth-scope.mjs'),c.maintenanceSource);assert.equal(rankingGrowthPinnedRef(c,'release/app-scope.mjs'),null);
 assert.throws(()=>verifyRankingGrowth(c,(ref,p)=>ref==='HEAD'&&p==='public-seo-context.mjs'?'unapproved-change':ref==='HEAD'?'same':p==='public-seo-context.mjs'?'approved':'same'),/payload drift/);
 assert.deepEqual(c.payloadPaths,RANKING_GROWTH_PAYLOAD_PATHS);assert.deepEqual(c.maintenancePaths,RANKING_GROWTH_MAINTENANCE_PATHS);
});
