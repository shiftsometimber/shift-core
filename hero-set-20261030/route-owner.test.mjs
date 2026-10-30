import test from 'node:test';
import assert from 'node:assert/strict';
import {routeOwner} from './route-owner.mjs';
const host='shiftsometimber.co.uk';
const routes=[
 {pattern:'https://'+host+'/weight-loss-support-for-men*',script:'shift-public-answers'},
 {pattern:host+'/*',script:'shift-core'},
 {pattern:host+'/weight-loss-support-for-men',script:'shift-support-presentation-20261022'},
 {pattern:'https://'+host+'/mens-weight-management*',script:'shift-public-answers'},
 {pattern:'https://'+host+'/mens-weight-management',script:'shift-public-presentation-batch-20261022'}
];
test('the audited exact support route wins over the longer scheme-qualified wildcard',()=>{
 assert.equal(routeOwner(routes,'https://'+host+'/weight-loss-support-for-men').script,'shift-support-presentation-20261022');
 assert.equal(routeOwner(routes,'https://'+host+'/mens-weight-management').script,'shift-public-presentation-batch-20261022');
});
test('query and slash variants retain their existing wildcard owner',()=>{
 for(const suffix of ['?source=member','/','.html'])assert.equal(routeOwner(routes,'https://'+host+'/weight-loss-support-for-men'+suffix).script,'shift-public-answers');
});
test('scheme-qualified routes do not match another scheme',()=>{
 assert.equal(routeOwner(routes,'http://'+host+'/mens-weight-management').script,'shift-core');
});
