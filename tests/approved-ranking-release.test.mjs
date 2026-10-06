import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {validateRankingComposition,verifyRankingHistory,rankingPinnedRef,RANKING_PATHS} from '../release/approved-ranking-scope.mjs';
test('owner-approved publication has finite exact source pins and retained approval',()=>{
 const c=JSON.parse(readFileSync('shift-coach/release-manifest.json')).seoFollowThroughComposition.technicalComposition.completionComposition.rankingComposition;
 validateRankingComposition(c);verifyRankingHistory(c);
 for(const p of RANKING_PATHS)assert.equal(execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}).trim(),execFileSync('git',['rev-parse',rankingPinnedRef(c,p)+':'+p],{encoding:'utf8'}).trim(),p);
 for(const patch of [{proof:'other'},{payloadPaths:[...c.payloadPaths,'arbitrary']},{ownerApproval:{...c.ownerApproval,scope:'Any communication'}}])assert.throws(()=>validateRankingComposition({...c,...patch}));
});
