import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker-entry-v6.js';

for(const path of ['/member/tap-room','/member/tap-room.html'])test(`${path} permanently redirects to The Lounge`,async()=>{
  const response=await worker.fetch(new Request(`https://shiftsometimber.co.uk${path}`),{},{});
  assert.equal(response.status,301);
  assert.equal(response.headers.get('location'),'https://shiftsometimber.co.uk/lounge');
});
