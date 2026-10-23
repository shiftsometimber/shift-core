import test from 'node:test';
import assert from 'node:assert/strict';
import {addCausesTeaser,withCausesTeaser} from '../causes-partners-teaser.mjs';
const page='<html><head><title>SHIFT</title></head><body><nav class="desktop-nav"><a href="/start-here">Start Here</a></nav><aside id="site-drawer"><nav><a href="/programme">Programme</a><span class="sst-shed-teaser">The Timber Shed</span></nav></aside><main>Original page</main><footer class="site-footer"><section><h2>Support</h2><a href="/help">Help</a></section></footer></body></html>';
test('approved causes link has a working destination without changing other navigation',()=>{
 const next=addCausesTeaser(page);
 assert.equal((next.match(/class="sst-causes-teaser"/g)||[]).length,2);
 assert.match(next,/<a class="sst-causes-teaser" href="\/our-causes-partners">/);
 assert.doesNotMatch(next,/aria-disabled="true"|tabindex|onclick/);
 assert.match(next,/<main>Original page<\/main>/);
 assert.match(next,/<nav class="desktop-nav"><a href="\/start-here">Start Here<\/a><\/nav>/);
 assert.match(next,/sst-shed-teaser/);
 assert.equal(addCausesTeaser(next),next);
});
test('recognised member menu gets the same public link without modifying account content',()=>{
 const member='<html><head></head><body><nav class="sst-global-menu"><a href="/member/dashboard">Today</a></nav><main>Member content</main></body></html>';
 const next=addCausesTeaser(member,'/member/dashboard');
 assert.match(next,/href="\/our-causes-partners"/);assert.match(next,/<main>Member content<\/main>/);
});
test('APIs, admin, failed responses and writes remain untouched; changed HTML retains security headers',async()=>{
 for(const path of ['/v1/me','/api/check','/hq','/staging/preview'])assert.equal(addCausesTeaser(page,path),page);
 for(const [method,status,type] of [['POST',200,'text/html'],['GET',403,'text/html'],['GET',200,'application/json']]){
  const response=new Response(page,{status,headers:{'content-type':type}});
  assert.equal(await withCausesTeaser(new Request('https://shiftsometimber.co.uk/',{method}),response),response);
 }
 const response=await withCausesTeaser(new Request('https://shiftsometimber.co.uk/help'),new Response(page,{headers:{'content-type':'text/html','etag':'old','content-length':'123','content-security-policy':"default-src 'self'"}}));
 assert.equal(response.headers.get('etag'),null);assert.equal(response.headers.get('content-length'),null);assert.equal(response.headers.get('content-security-policy'),"default-src 'self'");
 assert.match(await response.text(),/Our Causes &amp; Partners/);
});
