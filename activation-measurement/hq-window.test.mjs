import test from 'node:test';
import assert from 'node:assert/strict';
import hq from '../hq-ai-v2.js';
import legacy from '../hq-ai.js';

test('HQ journey window stays behind authentication and clamps external input',async t=>{
 const original=legacy.fetch;t.after(()=>{legacy.fetch=original});
 let reads=0;const DB={prepare(){reads++;return {async all(){return {results:[]}},async first(){return null}}}};
 legacy.fetch=async()=>new Response('{}',{status:401});
 assert.equal((await hq.fetch(new Request('https://test.invalid/v1/hq/journey?days=90'),{DB},{})).status,401);
 assert.equal(reads,0);
 legacy.fetch=async request=>{assert.equal(new URL(request.url).pathname,'/v1/hq/me');return Response.json({user:{id:1}})};
 for(const [query,days] of [['',30],['?days=90',90],['?days=999999',365],['?days=-1',1],['?days=invalid',30]]){
  const r=await hq.fetch(new Request('https://test.invalid/v1/hq/journey'+query),{DB},{});
  assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');
  const body=await r.json();assert.equal(body.windowDays,days);assert.equal(body.activation.available,false);
 }
});
