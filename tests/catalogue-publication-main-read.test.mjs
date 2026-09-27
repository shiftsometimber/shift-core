import test from 'node:test';
import assert from 'node:assert/strict';
import {readCurrentMain} from '../scripts/current-main-guard.mjs';
const SHA='a'.repeat(40),env={GITHUB_REPOSITORY:'shiftsometimber/shift-core',GITHUB_REF:'refs/heads/main',GITHUB_SHA:SHA,GITHUB_TOKEN:'test-only-not-a-token'};
const ok=()=>Response.json({object:{sha:SHA}});
function runSequence(items){let calls=0;const waits=[];return {waits,get calls(){return calls},run:(e=env)=>readCurrentMain(e,async(url,options)=>{assert.equal(url,'https://api.github.com/repos/shiftsometimber/shift-core/git/ref/heads/main');assert.equal(options.headers.Authorization,'Bearer test-only-not-a-token');assert.equal(options.redirect,'error');assert.ok(options.signal);const value=items[calls++];if(value instanceof Error)throw value;return typeof value==='function'?value():value},{sleep:async ms=>{waits.push(ms)},now:()=>100000})}}
test('exact main succeeds in one request',async()=>{const s=runSequence([ok]);assert.equal(await s.run(),SHA);assert.equal(s.calls,1)});
test('transient 503 retries GET then verifies main',async()=>{const s=runSequence([new Response('',{status:503}),ok]);assert.equal(await s.run(),SHA);assert.equal(s.calls,2);assert.deepEqual(s.waits,[1000])});
test('network failure is bounded and can recover',async()=>{const s=runSequence([new TypeError('network'),ok]);assert.equal(await s.run(),SHA);assert.equal(s.calls,2)});
test('transport exhaustion stops after three requests',async()=>{const s=runSequence([new Error('x'),new Error('x'),new Error('x')]);await assert.rejects(s.run(),/transport_failed/);assert.equal(s.calls,3)});
test('stale SHA fails immediately without retry',async()=>{const s=runSequence([()=>Response.json({object:{sha:'b'.repeat(40)}}),ok]);await assert.rejects(s.run(),/stale_main_rejected/);assert.equal(s.calls,1)});
test('401, ordinary 403 and 404 never retry',async()=>{for(const status of [401,403,404]){const s=runSequence([new Response('',{status}),ok]);await assert.rejects(s.run(),new RegExp('http_'+status));assert.equal(s.calls,1)}});
test('429 obeys a bounded Retry-After',async()=>{const s=runSequence([new Response('',{status:429,headers:{'retry-after':'2'}}),ok]);assert.equal(await s.run(),SHA);assert.deepEqual(s.waits,[2000])});
test('long rate-limit delays fail closed, without sleeping or retrying early',async()=>{const s=runSequence([new Response('',{status:429,headers:{'retry-after':'60'}}),ok]);await assert.rejects(s.run(),/retry_later/);assert.equal(s.calls,1);assert.deepEqual(s.waits,[])});
test('403 retries only an explicit exhausted rate-limit',async()=>{const s=runSequence([new Response('',{status:403,headers:{'x-ratelimit-remaining':'0','x-ratelimit-reset':'102'}}),ok]);assert.equal(await s.run(),SHA);assert.deepEqual(s.waits,[2000])});
test('HTTP error exhaustion is bounded',async()=>{const s=runSequence([502,502,502].map(status=>new Response('',{status})));await assert.rejects(s.run(),/http_502/);assert.equal(s.calls,3)});
test('invalid JSON or malformed SHA cannot pass or retry',async()=>{for(const value of [new Response('not json'),Response.json({object:{sha:'bad'}}),Response.json(null)]){const s=runSequence([value,ok]);await assert.rejects(s.run(),/invalid_response/);assert.equal(s.calls,1)}});
test('incorrect repository, ref, SHA or missing token never reach GitHub',async()=>{for(const e of [{...env,GITHUB_REPOSITORY:'other/repo'},{...env,GITHUB_REF:'refs/heads/preview'},{...env,GITHUB_SHA:'bad'},{...env,GITHUB_TOKEN:''}]){const s=runSequence([ok]);await assert.rejects(s.run(e));assert.equal(s.calls,0)}});
