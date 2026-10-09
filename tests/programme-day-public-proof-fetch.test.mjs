import test from 'node:test';import assert from 'node:assert/strict';
import {fetchPublicProof} from '../release/public-proof-fetch.mjs';
const reset=()=>Object.assign(new TypeError('fetch failed'),{cause:{code:'ECONNRESET'}});
const opts=fetcher=>({fetcher,wait:async()=>{},report:()=>{}});
test('bounded GET retries recover reset fetches and interrupted body reads, retaining exact headers and bytes',async()=>{
 for(const phase of ['fetch','body']){
  let calls=0;const entries=[];
  const r=await fetchPublicProof('https://shiftsometimber.co.uk/asset?private=omit',{redirect:'manual'},{...opts(async(url,options)=>{calls++;assert.equal(options.redirect,'manual');if(calls===1){if(phase==='fetch')throw reset();return{status:200,arrayBuffer:async()=>{throw reset()}}}return new Response('approved exact bytes',{headers:{'x-authority':'approved'}});}),report:e=>entries.push(e)});
  assert.equal(await r.text(),'approved exact bytes');assert.equal(r.headers.get('x-authority'),'approved');assert.equal(calls,2);assert.equal(entries[0].path,'/asset');assert(!JSON.stringify(entries).includes('private'));
 }
});
test('persistent network and HTTP failures remain failures after exactly three attempts',async()=>{
 let calls=0;await assert.rejects(()=>fetchPublicProof('https://shiftsometimber.co.uk/asset',{},opts(async()=>{calls++;throw reset()})),/fetch failed/);assert.equal(calls,3);
 calls=0;const r=await fetchPublicProof('https://shiftsometimber.co.uk/asset',{},opts(async()=>{calls++;return new Response('bad gateway',{status:502})}));assert.equal(r.status,502);assert.equal(calls,3);
});
test('401 and changed content are returned unchanged for existing assertions; nontransient errors and mutations are never retried',async()=>{
 for(const [status,body]of [[401,'unauthorised'],[200,'changed source'],[500,'server error']]){let calls=0;const r=await fetchPublicProof('https://shiftsometimber.co.uk/asset',{},opts(async()=>{calls++;return new Response(body,{status})}));assert.equal(r.status,status);assert.equal(await r.text(),body);assert.equal(calls,1);}
 let calls=0;await assert.rejects(()=>fetchPublicProof('https://shiftsometimber.co.uk/asset',{},opts(async()=>{calls++;throw Error('assertion-like failure')})));assert.equal(calls,1);
 for(const method of ['POST','PUT','DELETE'])await assert.rejects(()=>fetchPublicProof('https://shiftsometimber.co.uk/asset',{method},opts(async()=>{throw Error('must not run')})),/restricted to GET/);
});
