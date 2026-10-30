import test from 'node:test';
import assert from 'node:assert/strict';
import {scheduledEditorialFetcher} from './scheduled-public-fetch-v1.mjs';

test('scheduled editorial reads public SHIFT pages through the current worker without a self-fetch',async()=>{
 const calls=[];const env={marker:'env'},ctx={marker:'ctx'};
 const worker={async fetch(request,receivedEnv,receivedCtx){calls.push({side:'worker',request,receivedEnv,receivedCtx});return new Response('internal');}};
 const networkFetch=async request=>{calls.push({side:'network',request});return new Response('network');};
 const fetcher=scheduledEditorialFetcher(worker,env,ctx,networkFetch);
 const response=await fetcher('https://shiftsometimber.co.uk/sitemap.xml',{redirect:'error',headers:{Accept:'application/xml'}});
 assert.equal(await response.text(),'internal');assert.equal(calls.length,1);assert.equal(calls[0].side,'worker');
 assert.equal(calls[0].receivedEnv,env);assert.equal(calls[0].receivedCtx,ctx);
 assert.equal(calls[0].request.url,'https://shiftsometimber.co.uk/sitemap.xml');
 assert.equal(calls[0].request.redirect,'manual');assert.equal(calls[0].request.headers.get('Accept'),'application/xml');
});

test('www is internal, while primary evidence and other SHIFT subdomains retain normal network fetch',async()=>{
 const calls=[];const worker={async fetch(request){calls.push(['worker',request.url]);return new Response('internal');}};
 const networkFetch=async request=>{calls.push(['network',request.url,request.redirect]);return new Response('network');};
 const fetcher=scheduledEditorialFetcher(worker,{}, {},networkFetch);
 await fetcher('https://www.shiftsometimber.co.uk/articles/example');
 await fetcher('https://www.nhs.uk/example',{redirect:'error'});
 await fetcher('https://hq.shiftsometimber.co.uk/v1/hq/articles');
 assert.equal(calls[1][2],'manual');
 assert.deepEqual(calls.map(x=>x.slice(0,2)),[
  ['worker','https://www.shiftsometimber.co.uk/articles/example'],
  ['network','https://www.nhs.uk/example'],
  ['network','https://hq.shiftsometimber.co.uk/v1/hq/articles']
 ]);
});

test('invalid dependencies and URLs fail instead of falling through to an unintended origin',()=>{
 assert.throws(()=>scheduledEditorialFetcher({}, {}, {}),/scheduled_public_worker_missing/);
 assert.throws(()=>scheduledEditorialFetcher({fetch(){}},{},{},null),/scheduled_network_fetch_missing/);
 const fetcher=scheduledEditorialFetcher({fetch(){}},{},{},async()=>new Response());
 assert.throws(()=>fetcher('not a URL'),/(?:Invalid URL|Failed to parse URL)/);
});
