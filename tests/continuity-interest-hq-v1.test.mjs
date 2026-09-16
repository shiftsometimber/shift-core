import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import entry from '../worker-entry-v6.js';
const hq=fs.readFileSync(new URL('../hq-commerce-content-v1.js',import.meta.url),'utf8'),worker=fs.readFileSync(new URL('../worker-entry-v6.js',import.meta.url),'utf8');
test('HQ can inspect the consent register but only through authenticated commerce authority',()=>{assert.match(hq,/path==='\/v1\/hq\/continuity-interest'/);assert.match(hq,/if\(!canCommerce\(a\.user\)\)/);assert.match(hq,/consent_version,consented_at,active,withdrawn_at/)});
test('public capture is CORS-wrapped for the official site and never marked as checkout',async()=>{
  assert.match(worker,/continuityInterestRoutes/);
  assert.match(worker,/withMemberCors\(\s*continuityInterest\s*,\s*request\s*\)/);
  assert.match(worker,/path\s*===\s*['"]\/v1\/continuity-interest['"]/);
  for(const origin of ['https://shiftsometimber.co.uk','https://hostile.example']){
    const response=await entry.fetch(new Request('https://api.shiftsometimber.co.uk/v1/continuity-interest',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'}),{},{});
    assert.equal(response.status,503);
    assert.deepEqual(await response.json(),{ok:false,error:'capture_unavailable'});
    assert.equal(response.headers.get('access-control-allow-origin'),origin==='https://shiftsometimber.co.uk'?origin:null);
    assert.equal(response.headers.get('location'),null);
  }
  const preflight=await entry.fetch(new Request('https://api.shiftsometimber.co.uk/v1/continuity-interest',{method:'OPTIONS',headers:{Origin:'https://shiftsometimber.co.uk'}}),{},{});
  assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'https://shiftsometimber.co.uk');
});
