import test from 'node:test';
import assert from 'node:assert/strict';
import {mentalHealthDescription,withPublicSeoCloseout} from '../public-seo-closeout.mjs';

const old='Plain-English guidance ending professional or.';
const shell=`<html><head><meta content="${old}" name="description"><meta name="twitter:description" content="${old}"><meta content="${old}" property="og:description"></head><body>Preserved page</body></html>`;

test('the two approved mental-health descriptions replace malformed metadata exactly once',async()=>{
 for(const path of ['/mental-health/medication-and-weight','/mental-health/when-someone-refuses-help']){
  const request=new Request('https://shiftsometimber.co.uk'+path);
  const response=await withPublicSeoCloseout(new Response(shell,{headers:{'content-type':'text/html; charset=utf-8'}}),request);
  const html=await response.text(),description=mentalHealthDescription(path);
  assert.ok(description);assert.doesNotMatch(description,/professional or\./);assert.ok(html.includes('Preserved page'));
  assert.equal((html.match(/name="description"/g)||[]).length,1);
  assert.equal((html.match(/property="og:description"/g)||[]).length,1);
  assert.equal((html.match(/name="twitter:description"/g)||[]).length,1);
  assert.equal((html.match(new RegExp(description.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length,3);
 }
});

test('unrelated public pages remain byte-for-byte untouched',async()=>{
 const response=new Response(shell,{headers:{'content-type':'text/html'}});
 assert.equal(await withPublicSeoCloseout(response,new Request('https://shiftsometimber.co.uk/about')),response);
});
