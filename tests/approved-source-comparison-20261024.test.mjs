import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {deltas} from '../release/approved-source-comparison-data-20261024.mjs';
import {originalApprovedComparisonSource,approvedSourceComparison,approvedLegacyComparisonValue} from '../release/approved-source-comparison-20261024.mjs';
const g=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6});
for(const [path,d] of Object.entries(deltas))test('current reviewed source restores every original byte and rejects tampering: '+path,()=>{
 const bytes=g('show','HEAD:'+path),old=g('cat-file','blob',d.original);
 assert.equal(originalApprovedComparisonSource(path,bytes),old);assert.equal(approvedSourceComparison(path,d.current),d.original);
 assert.throws(()=>originalApprovedComparisonSource(path,bytes+'unreviewed'),/current bytes changed/);
 assert.equal(approvedSourceComparison(path,'changed-callback-value'),'changed-callback-value');
 assert.equal(approvedSourceComparison(path,d.original),d.original);
 assert(Object.isFrozen(d));assert(Object.isFrozen(d.edits));for(const e of d.edits)assert(Object.isFrozen(e));
});
test('comparison projection is limited to current aliases; immutable prior refs and bad caller values remain unchanged',()=>{
 const head=g('rev-parse','HEAD').trim(),p='release/root-share-preview-scope.mjs',d=deltas[p];
 for(const ref of ['HEAD',head])assert.equal(approvedLegacyComparisonValue(ref,p,d.current,head),d.original);
 assert.equal(approvedLegacyComparisonValue('975afe81bfc316f73ea7b13a16032c72089ff7c1',p,d.current,head),d.current);
 assert.equal(approvedLegacyComparisonValue('HEAD',p,'mutated-reader-output',head),'mutated-reader-output');
 const bytes=g('show','HEAD:'+p);assert.equal(approvedLegacyComparisonValue('HEAD',p,bytes,head),g('cat-file','blob',d.original));
});
