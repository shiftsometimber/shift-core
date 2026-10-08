import test from 'node:test';
import assert from 'node:assert/strict';
import {createGithubProofGet} from '../release/github-proof-get.mjs';
const socket=()=>Object.assign(new TypeError('fetch failed'),{cause:{code:'UND_ERR_SOCKET'}});
test('a closed socket retries the same authenticated read and returns actual evidence',async()=>{
 const calls=[],waits=[],proof={head_sha:'actual',conclusion:'failure'};
 const get=createGithubProofGet({token:'synthetic-token',wait:async ms=>waits.push(ms),fetcher:async(url,options)=>{calls.push({url,options});if(calls.length<3)throw socket();return {ok:true,json:async()=>proof};}});
 assert.equal(await get('/actions/runs/123'),proof);assert.deepEqual(waits,[1000,2000]);
 for(const {url,options} of calls){assert.equal(url,'https://api.github.com/repos/shiftsometimber/shift-core/actions/runs/123');assert.equal(options.method,'GET');assert.equal(options.headers.Authorization,'Bearer synthetic-token');assert(options.signal instanceof AbortSignal);}
 assert.throws(()=>assert.equal(proof.conclusion,'success'));
});
test('three transport failures stop rather than produce a successful proof',async()=>{
 let attempts=0;const get=createGithubProofGet({wait:async()=>{},fetcher:async()=>{attempts++;throw socket();}});
 await assert.rejects(()=>get('/actions/runs/123'),/fetch failed/);assert.equal(attempts,3);
});
test('HTTP denial, missing evidence, invalid JSON and nontransport errors remain terminal',async()=>{
 for(const response of [{ok:false,status:401},{ok:false,status:403},{ok:false,status:404},{ok:false,status:500},{ok:true,json:async()=>{throw new SyntaxError('invalid JSON');}}]){
  let attempts=0;const get=createGithubProofGet({fetcher:async()=>{attempts++;return response;},wait:async()=>assert.fail('must not retry')});
  await assert.rejects(()=>get('/actions/runs/123'));assert.equal(attempts,1);
 }
 let attempts=0;await assert.rejects(()=>createGithubProofGet({fetcher:async()=>{attempts++;throw Error('invalid request');}})('/actions/runs/123'),/invalid request/);assert.equal(attempts,1);
});
test('other origins and normalized repository escapes are rejected before fetching',async()=>{
 for(const path of ['https://example.invalid','//example.invalid','/../../other','/../other','/\\example.invalid'])await assert.rejects(()=>createGithubProofGet({fetcher:async()=>assert.fail('must not fetch')})(path));
});
