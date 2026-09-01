import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker-entry-v6.js';

for(const path of ['/member/tap-room','/member/tap-room.html'])test(`${path} redirects to the canonical Tap Room`,async()=>{
  const response=await worker.fetch(new Request(`https://shiftsometimber.co.uk${path}`),{},{});
  assert.equal(response.status,302);
  assert.equal(response.headers.get('location'),'https://shiftsometimber.co.uk/tap-room');
});
