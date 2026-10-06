import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';
import {validateContextComposition,verifyContextHistory,contextPinnedRef,CONTEXT_PATHS} from '../release/seo-context-scope.mjs';
test('internal links have finite source pins and the original guarded production workflow',()=>{
 const c=JSON.parse(readFileSync('shift-coach/release-manifest.json')).seoFollowThroughComposition.technicalComposition.completionComposition.rankingComposition.discoveryComposition.contextComposition;validateContextComposition(c);verifyContextHistory(c);
 for(const p of CONTEXT_PATHS)assert.equal(execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}).trim(),execFileSync('git',['rev-parse',contextPinnedRef(c,p)+':'+p],{encoding:'utf8'}).trim(),p);
 for(const patch of [{proof:'other'},{payloadPaths:[...c.payloadPaths,'other']},{request:{...c.request,scope:'Any publication'}}])assert.throws(()=>validateContextComposition({...c,...patch}));
});
