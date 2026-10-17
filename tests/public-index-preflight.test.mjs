import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {readCurrentPublicIndex,requireCurrentPublicIndex} from '../release/public-index-preflight.mjs';
import {PUBLIC_INDEX_FRESHNESS_SQL} from '../release/app-index-freshness.mjs';
const now=Date.parse('2026-10-14T19:04:13.000Z'),fresh={indexed:245,chunks:669,stale:0,lifeBackFresh:1,oldestUpdatedAt:'2026-10-14T18:00:00.000Z',checkedAt:'2026-10-14T19:04:13.000Z'};
test('point-of-use decision executes only the shared public SELECT and records current evidence',()=>{
 const calls=[];const snapshot=readCurrentPublicIndex(sql=>{calls.push(sql);return[{success:true,results:[fresh]}]},{now,source:'a'.repeat(40)});
 assert.deepEqual(calls,[PUBLIC_INDEX_FRESHNESS_SQL]);assert.match(calls[0],/^SELECT /);assert.doesNotMatch(calls[0],/\b(?:INSERT|UPDATE|DELETE|ALTER|CREATE)\b/i);
 assert.equal(snapshot.reuse,true);assert.equal(snapshot.customerRecordsRead,0);assert.equal(snapshot.databaseWrites,0);assert.equal(snapshot.source,'a'.repeat(40));assert.equal(requireCurrentPublicIndex(snapshot),snapshot);
});
test('fresh query capture reads the local clock after the remote aggregate completes',()=>{
 let executed=false;const snapshot=readCurrentPublicIndex(()=>{executed=true;return[{success:true,results:[fresh]}]},{now:()=>{assert.equal(executed,true);return now;}});assert.equal(snapshot.reuse,true);
});
test('a later freshness decision cannot reuse an earlier successful decision',()=>{
 let reads=0;const execute=()=>[{success:true,results:[reads++?{...fresh,stale:1,lifeBackFresh:0}:fresh]}];
 assert.equal(readCurrentPublicIndex(execute,{now}).reuse,true);
 const later=readCurrentPublicIndex(execute,{now:now+40*60*1000});assert.equal(later.reuse,false);assert.throws(()=>requireCurrentPublicIndex(later),/must remain eligible/);assert.equal(reads,2);
});
test('missing, failed and ambiguous public query results remain terminal',()=>{
 for(const result of [[],[{success:false,results:[fresh]}],[{success:true,results:[]}],[{success:true,results:[fresh,fresh]}],[{success:true,results:[{...fresh,indexed:49}]}],[{success:true,results:[{...fresh,chunks:0}]}]])assert.throws(()=>readCurrentPublicIndex(()=>result,{now}));
});
test('release rechecks at use and after refresh without relying on the early reuse boolean',()=>{
 const workflow=readFileSync(new URL('../.github/workflows/cloudflare-production-promote.yml',import.meta.url),'utf8');
 const decision=workflow.indexOf('id: public_index_freshness'),index=workflow.indexOf('- name: Index existing public SHIFT pages'),require=workflow.indexOf('node release/public-index-preflight.mjs require'),deploy=workflow.indexOf('- name: Deploy current main to production');
 assert(decision>=0&&index>decision&&require>index&&deploy>require);
 assert.match(workflow.slice(index,require),/if: steps\.public_index_freshness\.outputs\.existing_index != 'true'/);
 assert.doesNotMatch(workflow.slice(index,require),/growth_deployed\.outputs\.existing_index/);
 assert.match(readFileSync(new URL('../release/ai-response-proof.mjs',import.meta.url),'utf8'),/assert\.equal\(value\.sources\[0\]\.url,'https:\/\/shiftsometimber\.co\.uk\/life-back'\)/);
});
