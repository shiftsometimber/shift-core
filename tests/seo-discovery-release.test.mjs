import {rankingGrowthHistoricalRef} from '../release/seo-growth-scope.mjs';
import {followPinnedRef} from '../release/seo-follow-through-scope.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';
import {validateDiscoveryComposition,verifyDiscoveryHistory,discoveryPinnedRef,DISCOVERY_PATHS} from '../release/seo-discovery-scope.mjs';
test('technical discovery has exact finite source pins and no production workflow change',()=>{
 const follow=JSON.parse(readFileSync('shift-coach/release-manifest.json')).seoFollowThroughComposition;const c=follow.technicalComposition.completionComposition.rankingComposition.discoveryComposition;validateDiscoveryComposition(c);verifyDiscoveryHistory(c);
 for(const p of DISCOVERY_PATHS)assert.equal(execFileSync('git',['rev-parse',rankingGrowthHistoricalRef('HEAD',p)+':'+p],{encoding:'utf8'}).trim(),execFileSync('git',['rev-parse',followPinnedRef(follow,p)+':'+p],{encoding:'utf8'}).trim(),p);
 for(const patch of [{proof:'other'},{payloadPaths:[...c.payloadPaths,'other']},{request:{...c.request,scope:'Any publication'}}])assert.throws(()=>validateDiscoveryComposition({...c,...patch}));
});
