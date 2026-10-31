import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ownedRecovery,routeOwner} from './deploy.mjs';
const state={versionId:'candidate',previousVersion:'predecessor',promotionAttempted:true,promotionMessage:'unique-live',zeroAttempted:true,zeroMessage:'unique-zero'};
test('reconciles lost provider responses only when the version split and unique release intent agree',()=>{
 const live={id:'live-id',versions:[{version_id:'candidate',percentage:100}],annotations:{'workers/message':'unique-live'}};
 const zero={id:'zero-id',versions:[{version_id:'predecessor',percentage:100},{version_id:'candidate',percentage:0}],annotations:{'workers/message':'unique-zero'}};
 assert.deepEqual(ownedRecovery(state,live),{mode:'live',deploymentId:'live-id',reconciled:true});
 assert.deepEqual(ownedRecovery(state,zero),{mode:'zero',deploymentId:'zero-id',reconciled:true});
 for(const current of [{...live,annotations:{'workers/message':'different-release'}},{...live,versions:[{version_id:'candidate',percentage:99},{version_id:'foreign',percentage:1}]},{...zero,versions:[{version_id:'foreign',percentage:100},{version_id:'candidate',percentage:0}]}])assert.equal(ownedRecovery(state,current),null);
});
test('does not roll back a later unrelated deployment of an old or different version',()=>{
 const known={...state,ownedDeployment:'owned-id',zeroDeployment:'owned-zero'};
 assert.equal(ownedRecovery(known,{id:'newer-id',versions:[{version_id:'foreign',percentage:100}],annotations:{'workers/message':'unique-live'}}),null);
 assert.equal(ownedRecovery(known,{id:'newer-id',versions:[{version_id:'candidate',percentage:100}],annotations:{'workers/message':'someone-else'}}),null);
 assert.equal(ownedRecovery(known,{id:'owned-id',versions:[{version_id:'candidate',percentage:100}]}).reconciled,false);
});
test('discovers existing owners across exact, query and wildcard routes without preferring scheme length',()=>{
 const routes=[{pattern:'https://shiftsometimber.co.uk/*',script:'core'},{pattern:'shiftsometimber.co.uk/clinic-gone-quiet*',script:'continuity'},{pattern:'shiftsometimber.co.uk/assets/my-timber-welcome-20261021.js*',script:'welcome'}];
 assert.equal(routeOwner(routes,'https://shiftsometimber.co.uk/clinic-gone-quiet?existing=1').script,'continuity');
 assert.equal(routeOwner(routes,'https://shiftsometimber.co.uk/assets/my-timber-welcome-20261021.js?v=3').script,'welcome');
 assert.equal(routeOwner(routes,'https://shiftsometimber.co.uk/member/dashboard').script,'core');
 assert.equal(routeOwner(routes,'https://different.example/'),undefined);
});
test('refuses equally specific conflicting ownership',()=>{
 assert.throws(()=>routeOwner([{pattern:'shiftsometimber.co.uk/clinic-gone-quiet*',script:'a'},{pattern:'shiftsometimber.co.uk/clinic-gone-quiet*',script:'b'}],'https://shiftsometimber.co.uk/clinic-gone-quiet'),/Ambiguous/);
});
