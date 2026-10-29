import test from 'node:test';
import assert from 'node:assert/strict';
import {configuredWorkerRouteCovers as covers} from '../scripts/configured-worker-route.mjs';
test('consolidated and explicit Worker routes retain HTTPS asset coverage on both hosts',()=>{
  for(const pattern of ['shiftsometimber.co.uk/*','https://shiftsometimber.co.uk/*','shiftsometimber.co.uk/member-product-v33d.js*'])assert.equal(covers(JSON.stringify({routes:[{pattern}]}),'shiftsometimber.co.uk','/member-product-v33d.js'),true);
  assert.equal(covers('{"routes":[{"pattern":"www.shiftsometimber.co.uk/*"}]}','shiftsometimber.co.uk','/asset.js'),false);
  assert.equal(covers('{"routes":[{"pattern":"shiftsometimber.co.uk/member/*"}]}','shiftsometimber.co.uk','/asset.js'),false);
  assert.equal(covers('{"routes":[{"pattern":"http://shiftsometimber.co.uk/*"}]}','shiftsometimber.co.uk','/asset.js'),false);
  assert.equal(covers('// {"pattern":"shiftsometimber.co.uk/*"}\n{"routes":[]}','shiftsometimber.co.uk','/asset.js'),false);
  assert.equal(covers('/* {"pattern":"shiftsometimber.co.uk/*"} */ {"routes":[]}','shiftsometimber.co.uk','/asset.js'),false);
});
