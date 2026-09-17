import test from 'node:test';
import assert from 'node:assert/strict';
import {preserveTickerVersion} from '../public-ticker-preservation.mjs';
test('preservation permits only the exact two ticker cache-version tokens',()=>{
 const old='<header>Same header</header><section data-shift-news-ticker="public-news-20260917-r2">Same links</section><main>Same article</main><script defer src="/assets/public-news-ticker-v1.js?v=public-news-20260917-r2"></script>';
 const next=old.replaceAll('public-news-20260917-r2','public-news-20260917-r3');
 assert.equal(preserveTickerVersion(Buffer.from(old)).toString(),next);
 assert.equal(preserveTickerVersion(Buffer.from(next)).toString(),next);
 assert.notEqual(preserveTickerVersion(Buffer.from(old.replace('Same article','Changed article'))).toString(),next);
 assert.throws(()=>preserveTickerVersion(Buffer.from(old.replace('data-shift-news-ticker','data-other'))));
 assert.throws(()=>preserveTickerVersion(Buffer.from(old+old)));
});
