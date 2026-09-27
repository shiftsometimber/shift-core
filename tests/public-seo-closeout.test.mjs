import test from 'node:test';
import assert from 'node:assert/strict';
import {mentalHealthDescription,withPublicSeoCloseout,SHARING_IMAGE_PATHS,PUBLIC_TWITTER_IMAGE,completePublicSharingImage,repairPublicSeoLinks} from '../public-seo-closeout.mjs';

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

test('the eight missing sharing images are completed once and existing editorial images survive',()=>{
 for(const path of SHARING_IMAGE_PATHS){const once=completePublicSharingImage(shell,path);assert.equal(once.replace(PUBLIC_TWITTER_IMAGE,''),shell);assert.equal(completePublicSharingImage(once,path),once)}
 const custom=shell.replace('</head>',`<meta content="/real-article.jpg" name='twitter:image'></head>`);
 assert.equal(completePublicSharingImage(custom,'/programme'),custom);
 assert.equal(completePublicSharingImage(shell,'/about'),shell);
});

test('legacy anchors use final destinations with queries and the correct Journey fragment',()=>{
 const html=`<a href="/articles/mounjaro-vs-wegovy#evidence">Compare</a><a href='/member/journey?from=programme#old'>Journey</a><a href="https://www.shiftsometimber.co.uk/member/progress">Progress</a>`;
 const result=repairPublicSeoLinks(html);
 assert.equal(result,`<a href="/compare-weight-loss-treatments#evidence">Compare</a><a href='/member/dashboard?from=programme#journey'>Journey</a><a href="/member/dashboard#journey">Progress</a>`);
 assert.equal(repairPublicSeoLinks(result),result);
});

test('link repair preserves external anchors, scripts, form actions and unrelated data attributes',()=>{
 const html=`<a href="https://example.org/member/progress">External</a><a data-href="/member/progress">Data</a><script>const example='<a href="/member/journey">';</script><form action="/member/progress"></form><!-- <a href="/member/progress"> -->`;
 assert.equal(repairPublicSeoLinks(html),html);
});
