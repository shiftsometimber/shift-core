import test from 'node:test';
import assert from 'node:assert/strict';
import {withPublicHtmlCorrections} from './public-html-corrections.mjs';

const request=(path='/shift-health/blood-tests',method='GET')=>new Request('https://shiftsometimber.co.uk'+path,{method});
const html=body=>new Response(body,{headers:{'Content-Type':'text/html; charset=utf-8','ETag':'old','Content-Length':String(body.length)}});

test('corrects delivered and structured Bloods titles once',async()=>{
 const input='<title>Explore Baseline, Advanced &amp;amp; Complete | SHIFT Bloods</title><meta property="og:title" content="Explore Baseline, Advanced &amp;amp; Complete | SHIFT Bloods"><script type="application/ld+json">{"name":"Explore Baseline, Advanced &amp; Complete | SHIFT Bloods"}</script>';
 const response=await withPublicHtmlCorrections(request(),html(input));
 const body=await response.text();
 assert.match(body,/<title>Explore Baseline, Advanced &amp; Complete \| SHIFT Bloods<\/title>/);
 assert.match(body,/content="Explore Baseline, Advanced &amp; Complete \| SHIFT Bloods"/);
 assert.match(body,/"name":"Explore Baseline, Advanced & Complete \| SHIFT Bloods"/);
 assert.doesNotMatch(body,/&amp;amp;/);
 assert.equal(response.headers.get('ETag'),null);
 assert.equal(response.headers.get('Content-Length'),null);
 assert.equal(response.headers.get('X-Shift-Public-Correction'),'bloods-title-20261029');
});

test('is idempotent after the source title is corrected',async()=>{
 const input='<title>Explore Baseline, Advanced &amp; Complete | SHIFT Bloods</title><script type="application/ld+json">{"name":"Explore Baseline, Advanced & Complete | SHIFT Bloods"}</script>';
 const once=await withPublicHtmlCorrections(request(),html(input));
 assert.equal(await once.text(),input);
 assert.equal(once.headers.get('X-Shift-Public-Correction'),null);
});

test('does not rewrite other pages, methods or content types',async()=>{
 const input='<title>Explore Baseline, Advanced &amp;amp; Complete | SHIFT Bloods</title>';
 const other=html(input);assert.equal(await withPublicHtmlCorrections(request('/programme'),other),other);
 const head=html(input);assert.equal(await withPublicHtmlCorrections(request('/shift-health/blood-tests','HEAD'),head),head);
 const json=new Response('{}',{headers:{'Content-Type':'application/json'}});assert.equal(await withPublicHtmlCorrections(request(),json),json);
});

