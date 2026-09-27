import test from 'node:test';
import assert from 'node:assert/strict';
import {createRadarSourceFetch, retryDelay} from '../radar-source-fetch-v1.js';

function clock() { let time = 1000; const waits = []; return {now: () => time, waits, sleep: async ms => {waits.push(ms);time += ms;}}; }
test('PubMed search and summary are paced below its unauthenticated request limit', async () => {
 const time = clock(), starts = [];
 const read = createRadarSourceFetch({...time, fetchImpl: async () => {starts.push(time.now());return new Response('{}');}});
 await read('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi');
 await read('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi');
 assert.deepEqual(starts, [1000, 1400]);
});
test('concurrent Google discovery reads are queued with a gap', async () => {
 const time = clock(), starts = [];
 const read = createRadarSourceFetch({...time, fetchImpl: async input => {starts.push([String(input),time.now()]);return new Response('<rss/>');}});
 await Promise.all([1,2,3].map(n => read('https://news.google.com/rss/search?q='+n)));
 assert.deepEqual(starts.map(x => x[1]), [1000,2000,3000]);
});
test('a temporary rate limit respects Retry-After and returns a successful retry', async () => {
 const time = clock(); let calls = 0, cancelled = false;
 const read = createRadarSourceFetch({...time, fetchImpl: async () => ++calls === 1
  ? new Response(new ReadableStream({cancel(){cancelled=true;}}), {status:429,headers:{'Retry-After':'3'}})
  : new Response('<rss/>')});
 assert.equal((await read('https://example.test/feed')).status, 200);
 assert.equal(calls, 2); assert.equal(cancelled, true); assert.deepEqual(time.waits, [3000]);
});
test('persistent service failure remains failure after a bounded number of reads', async () => {
 const time = clock(); let calls = 0;
 const read = createRadarSourceFetch({...time, fetchImpl: async () => {calls++;return new Response('Unavailable',{status:503});}});
 assert.equal((await read('https://example.test/feed')).status,503);
 assert.equal(calls,3);assert.deepEqual(time.waits,[1000,2000]);
});
test('access denial, missing pages, long cooldowns and network failures are not retried', async () => {
 for (const [status,headers] of [[403,{}],[404,{}],[429,{'Retry-After':'60'}]]) {
  let calls=0;const read=createRadarSourceFetch({fetchImpl:async()=>{calls++;return new Response('blocked',{status,headers});}});
  assert.equal((await read('https://example.test/feed')).status,status);assert.equal(calls,1);
 }
 let calls=0;const read=createRadarSourceFetch({fetchImpl:async()=>{calls++;throw Error('network_failure');}});
 await assert.rejects(read('https://example.test/feed'),/network_failure/);assert.equal(calls,1);
});
test('HTTP-date retry instructions and malformed values are handled conservatively', () => {
 const now=Date.parse('2026-09-17T07:00:00Z');
 assert.equal(retryDelay(new Response('',{status:503,headers:{'Retry-After':'Thu, 17 Sep 2026 07:00:05 GMT'}}),0,now),5000);
 assert.equal(retryDelay(new Response('',{status:503,headers:{'Retry-After':'invalid'}}),1,now),2000);
});
test('source reader rejects writes and a failed origin cannot hold the queue', async () => {
 let calls=0;const read=createRadarSourceFetch({fetchImpl:async()=>{if(++calls===1)throw Error('offline');return new Response('ok');}});
 await assert.rejects(read('https://example.test/mail',{method:'POST'}),/get_only/);
 assert.equal(calls,0);
 await assert.rejects(read('https://example.test/feed'),/offline/);
 assert.equal((await read('https://example.test/feed')).status,200);
});
