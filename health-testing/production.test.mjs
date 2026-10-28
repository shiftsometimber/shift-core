import test from 'node:test';
import assert from 'node:assert/strict';
import {composeTesting} from './production.mjs';
const shell='<html><head></head><body><main id="main-content"><div id="shift-health-range"><nav class="sst-health-grid" aria-label="Explore your health"></nav><section class="sst-linkline">Retained Health</section></div></main><script src="/existing-basket.js"></script></body></html>';
test('publication composes around the exact retained worker and delegates every unowned request unchanged',async()=>{
 const response=new Response('retained exact response'),calls=[];
 const worker=composeTesting({fetch:async(...args)=>{calls.push(args);return response;}});
 for(const url of ['https://shiftsometimber.co.uk/','https://shiftsometimber.co.uk/shift-health/supplements-nutrition','https://shiftsometimber.co.uk/shift-health/blood-tests','https://shiftsometimber.co.uk/my-timber','https://api.shiftsometimber.co.uk/v1/hq/supplements','https://shiftsometimber.co.uk/shift-health/assets/purchase-basket.js']){
  const request=new Request(url),env={},ctx={};assert.equal(await worker.fetch(request,env,ctx),response);assert.deepEqual(calls.at(-1),[request,env,ctx]);
 }
});
test('Health and HQ get only the testing discovery additions while retaining basket and nutrition scripts',async()=>{
 const worker=composeTesting({fetch:async()=>new Response(shell,{headers:{'Content-Type':'text/html'}})});
 const hub=await (await worker.fetch(new Request('https://shiftsometimber.co.uk/shift-health'),{},{})).text();
 assert.equal((hub.match(/sst-testing-route/g)||[]).length,1);assert(hub.includes('Retained Health'));assert(hub.includes('/existing-basket.js'));assert.equal((hub.match(/class="nft-hub"/g)||[]).length,1);
 const hq=await (await worker.fetch(new Request('https://hq.shiftsometimber.co.uk/'),{},{})).text();
 assert(hq.includes('/existing-basket.js'));assert.equal((hq.match(/assets\/hq-testing.js/g)||[]).length,1);
});
test('both public hostnames serve the new range and the closed purchase endpoint without calling the retained worker',async()=>{
 const worker=composeTesting({fetch:()=>{throw Error('Unexpected retained worker');}}),env={BLOG:{fetch:async()=>new Response(shell)}};
 for(const host of ['shiftsometimber.co.uk','www.shiftsometimber.co.uk']){
  const response=await worker.fetch(new Request('https://'+host+'/shift-health/testing'),env,{});assert.equal(response.status,200);assert((await response.text()).includes('20 of 20 products'));
 }
 assert.equal((await worker.fetch(new Request('https://shiftsometimber.co.uk/shift-health/testing/iron/purchase',{method:'POST'}),env,{})).status,409);
});
