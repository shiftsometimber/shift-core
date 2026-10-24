import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {deltas} from '../release/approved-source-comparison-data-20261024.mjs';
import {originalApprovedComparisonSource,approvedSourceComparison,approvedSourceComparisonFrame} from '../release/approved-source-comparison-20261024.mjs';
const g=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6});
for(const [path,d] of Object.entries(deltas))test('current reviewed source restores every original byte and rejects tampering: '+path,()=>{
 const bytes=g('show','HEAD:'+path),old=g('cat-file','blob',d.original);
 assert.equal(originalApprovedComparisonSource(path,bytes),old);assert.equal(approvedSourceComparison(path,d.current),d.original);
 assert.throws(()=>originalApprovedComparisonSource(path,bytes+'unreviewed'),/current bytes changed/);
 assert.equal(approvedSourceComparison(path,'changed-callback-value'),'changed-callback-value');
 assert.equal(approvedSourceComparison(path,d.original),d.original);
 assert(Object.isFrozen(d));assert(Object.isFrozen(d.edits));for(const e of d.edits)assert(Object.isFrozen(e));
});
test('all source authentication calls precede comparison projection and exceptions propagate',()=>{
 const head=g('rev-parse','HEAD').trim(),seen=[];const p='release/root-share-preview-scope.mjs',d=deltas[p];
 const base={rawHead:head,assertCurrent(){},read:(r,p)=>{seen.push(['read',r,p]);return deltas[p]?.current||'unchanged'},blob:(r,p)=>deltas[p]?.current||'unchanged',content:(r,p)=>g('show',r==='HEAD'?'HEAD:'+p:r+':'+p),projectRead:reader=>(r,p)=>{seen.push(['authenticate',r,p]);const value=reader(r,p);assert.equal(value,deltas[p]?.current||'unchanged','Fresh native supplied source rejected');return value;},projectContent:reader=>reader,finish:()=>seen.push(['finish'])};
 const view=approvedSourceComparisonFrame(base),native=()=>d.current;
 assert.equal(view.projectRead(native)('HEAD',p),d.original);assert(seen.some(x=>x[0]==='authenticate'));
 assert.throws(()=>view.projectRead(()=>d.original)('HEAD',p),/Fresh native supplied source rejected/);
 assert.throws(()=>view.projectRead(()=>{throw Error('caller mutation')})('HEAD',p),/caller mutation/);
 assert.equal(view.read('HEAD','other.mjs'),'unchanged');view.finish();assert(seen.some(x=>x[0]==='finish'));
});
