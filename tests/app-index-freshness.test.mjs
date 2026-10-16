import test from 'node:test';import assert from 'node:assert/strict';import {reusablePublicIndex} from '../release/app-index-freshness.mjs';
test('release reuses only a complete current public index with eligible Life Back evidence',()=>{
 const current={indexed:70,chunks:100,stale:0,lifeBackFresh:1};assert.equal(reusablePublicIndex(current),true);
 for(const patch of [{stale:1},{lifeBackFresh:0},{indexed:49},{chunks:0},{stale:undefined},{lifeBackFresh:undefined}])assert.equal(reusablePublicIndex({...current,...patch}),false);
});
