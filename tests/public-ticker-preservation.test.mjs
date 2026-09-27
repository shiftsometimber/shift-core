import test from 'node:test';
import assert from 'node:assert/strict';
import {preserveTickerVersion,previousTickerStyles} from '../public-ticker-preservation.mjs';
import {withPublicTicker,tickerVersion,tickerStyles} from '../public-navigation-policy.mjs';
test('only exact old ticker styles and all three version markers are normalised',async()=>{
 const input='<html><head><title>Same page</title></head><body><header>Same header</header><main>Same article</main></body></html>';
 const current=await(await withPublicTicker(new Request('https://shiftsometimber.co.uk/programme'),new Response(input,{headers:{'Content-Type':'text/html'}}))).text();
 assert.equal(tickerVersion,'public-news-20260917-r4');
 for(const version of ['public-news-20260917-r2','public-news-20260917-r3']){
 const old=current.replaceAll(tickerVersion,version).replace(tickerStyles,previousTickerStyles).replace('</section>',"<button type=\"button\" class=\"shift-news-pause\" aria-label=\"Pause news ticker\" aria-pressed=\"false\" hidden>Pause</button></section>");
 assert.equal(old.split(version).length-1,3);
 assert.equal(preserveTickerVersion(Buffer.from(old)).toString(),current);
 assert.equal(preserveTickerVersion(Buffer.from(current)).toString(),current);
 assert.notEqual(preserveTickerVersion(Buffer.from(old.replace('Same article','Changed article'))).toString(),current);
 assert.throws(()=>preserveTickerVersion(Buffer.from(old.replace('data-shift-ai-full-wire','data-other'))));
 assert.throws(()=>preserveTickerVersion(Buffer.from(old+old)));
 assert.throws(()=>preserveTickerVersion(Buffer.from(old.replace('90s linear','10s linear'))));
 }
});
