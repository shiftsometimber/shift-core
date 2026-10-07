import {rankingGrowthHistoricalRef} from '../release/seo-growth-scope.mjs';
import {followPinnedRef} from '../release/seo-follow-through-scope.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';
import {validateContextComposition,verifyContextHistory,contextPinnedRef,CONTEXT_PATHS} from '../release/seo-context-scope.mjs';
test('internal links have finite source pins and the original guarded production workflow',()=>{
 const follow=JSON.parse(readFileSync('shift-coach/release-manifest.json')).seoFollowThroughComposition;const c=follow.technicalComposition.completionComposition.rankingComposition.discoveryComposition.contextComposition;validateContextComposition(c);verifyContextHistory(c);
 for(const p of CONTEXT_PATHS)assert.equal(execFileSync('git',['rev-parse',rankingGrowthHistoricalRef('HEAD',p)+':'+p],{encoding:'utf8'}).trim(),execFileSync('git',['rev-parse',followPinnedRef(follow,p)+':'+p],{encoding:'utf8'}).trim(),p);
 for(const patch of [{proof:'other'},{payloadPaths:[...c.payloadPaths,'other']},{request:{...c.request,scope:'Any publication'}}])assert.throws(()=>validateContextComposition({...c,...patch}));
});
