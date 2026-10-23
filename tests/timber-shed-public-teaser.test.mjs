import test from 'node:test';
import assert from 'node:assert/strict';
import {addTimberShedTeaser,withTimberShedTeaser} from '../timber-shed-public-teaser.mjs';
import {publicHeader,publicDrawer,publicFooter} from '../public-shell-contract.mjs';
import {approvedFooter} from '../shared-footer.mjs';

const page=footer=>'<html><head><title>SHIFT</title></head><body>'+publicHeader+publicDrawer+'<main><h1>Original home page</h1></main>'+footer+'</body></html>';
test('public header, drawer and canonical footer get exactly one visible, disabled teaser',()=>{
 for(const footer of [publicFooter,approvedFooter]){
  const before=page(footer),after=addTimberShedTeaser(before,'/');
  assert.notEqual(after,before);
  assert.equal((after.match(/class="sst-shed-teaser/g)||[]).length,3);
  assert.equal((after.match(/The Timber Shed/g)||[]).length,6);
  assert.match(after,/aria-label="The Timber Shed — coming soon"/);
  assert.match(after,/\bSOON<\/small>/);
  assert.match(after,/\.desktop-nav \.sst-shed-teaser::before/);
  assert.match(after,/font-size:12px;position:relative;padding:10px 0/);
  assert.doesNotMatch(after,/font-size:\.(?:88|76)em/);
  assert.match(after,/<a href="\/member\/dashboard">My Timber<\/a><span class="sst-shed-teaser sst-shed-footer"/);
  assert.match(after,/<main><h1>Original home page<\/h1><\/main>/);
  assert.doesNotMatch(after,/href=["'][^"']*(?:timber-shed|thetimbershed)/i);
  assert.doesNotMatch(after,/<a[^>]*class=["']sst-shed-teaser/);
  assert.equal(addTimberShedTeaser(after,'/'),after);
 }
});
test('private member and non-HTML content remain unchanged',async()=>{
 const input=page(approvedFooter);
 for(const path of ['/member/dashboard','/member/timber-shed','/v1/me','/hq','/api/test'])assert.equal(addTimberShedTeaser(input,path),input);
 assert.equal(addTimberShedTeaser('<html><head></head><body>Nothing</body></html>','/'),'<html><head></head><body>Nothing</body></html>');
 const res=await withTimberShedTeaser(new Request('https://shiftsometimber.co.uk/'),new Response(input,{headers:{'content-type':'text/html','etag':'"old"','content-length':'12345','content-security-policy':"default-src 'self'"}}));
 assert.equal(res.status,200);
 assert.equal(res.headers.get('etag'),null);
 assert.equal(res.headers.get('content-length'),null);
 assert.equal(res.headers.get('content-security-policy'),"default-src 'self'");
 assert.match(await res.text(),/sst-timber-shed-teaser-css/);
 const privateRes=await withTimberShedTeaser(new Request('https://shiftsometimber.co.uk/member/dashboard'),new Response(input,{headers:{'content-type':'text/html'}}));
 assert.equal(await privateRes.text(),input);
});
