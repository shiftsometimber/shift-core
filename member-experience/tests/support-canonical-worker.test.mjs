import test from 'node:test';
import assert from 'node:assert/strict';
import {composeMyTimberSupport} from '../support-canonical-worker.mjs';

test('canonical composition retains scheduled work and the exact public response',async()=>{
 const publicResponse=new Response('unchanged public homepage'),scheduled=()=>{};
 const before={fetch:async()=>publicResponse,scheduled},worker=composeMyTimberSupport(before);
 assert.equal(worker.scheduled,scheduled);
 assert.equal(await worker.fetch(new Request('https://shiftsometimber.co.uk/'),{MY_TIMBER_V6_RELEASE_ENABLED:'true'},{}),publicResponse);
});
test('canonical composition keeps unenabled members on their existing runtime',async()=>{
 const before={fetch:async()=>new Response('existing member runtime')},worker=composeMyTimberSupport(before);
 assert.equal(await(await worker.fetch(new Request('https://shiftsometimber.co.uk/member/dashboard'),{},{})).text(),'existing member runtime');
 const candidate=await worker.fetch(new Request('https://shiftsometimber.co.uk/member/life-back/support'),{MY_TIMBER_V6_RELEASE_ENABLED:'true',MEMBER_EXPERIENCE_V1_ENABLED:'true'},{});
 assert.equal(candidate.status,200);assert.match(await candidate.text(),/supportPlanMain/);
});
