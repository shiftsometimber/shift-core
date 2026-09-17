import test from 'node:test';
import assert from 'node:assert/strict';
import {preserveTickerVersion} from '../public-ticker-preservation.mjs';
import {withPublicTicker,tickerVersion} from '../public-navigation-policy.mjs';
test('preservation covers every version marker emitted by the real page transformer',async()=>{
 const input='<html><head><title>Same page</title></head><body><header>Same header</header><main>Same article</main></body></html>';
 const current=await(await withPublicTicker(new Request('https://shiftsometimber.co.uk/programme'),new Response(input,{headers:{'Content-Type':'text/html'}}))).text();
 assert.equal(tickerVersion,'public-news-20260917-r3');
 const old=current.replaceAll(tickerVersion,'public-news-20260917-r2');
 assert.equal(old.split('public-news-20260917-r2').length-1,3);
 assert.equal(preserveTickerVersion(Buffer.from(old)).toString(),current);
 assert.equal(preserveTickerVersion(Buffer.from(current)).toString(),current);
 assert.notEqual(preserveTickerVersion(Buffer.from(old.replace('Same article','Changed article'))).toString(),current);
 assert.throws(()=>preserveTickerVersion(Buffer.from(old.replace('data-shift-ai-full-wire','data-other'))));
 assert.throws(()=>preserveTickerVersion(Buffer.from(old+old)));
});
