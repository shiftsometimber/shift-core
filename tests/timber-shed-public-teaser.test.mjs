import test from 'node:test';
import assert from 'node:assert/strict';
import {addTimberShedTeaser,withTimberShedTeaser} from '../timber-shed-public-teaser.mjs';
import {publicHeader,publicDrawer,publicFooter} from '../public-shell-contract.mjs';
import {approvedFooter} from '../shared-footer.mjs';

const page=footer=>'<html><head><title>SHIFT</title></head><body>'+publicHeader+publicDrawer+'<main><h1>Original public page</h1></main>'+footer+'</body></html>';
const tag='<span class="sst-shed-teaser" aria-label="The Timber Shed — coming soon">The Timber Shed <small>SOON</small></span>';
const drawerTag='<span class="sst-shed-teaser sst-shed-drawer" aria-label="The Timber Shed — coming soon">The Timber Shed <small>SOON</small></span>';
const footerTag='<span class="sst-shed-teaser sst-shed-footer" aria-label="The Timber Shed — coming soon">The Timber Shed <small>SOON</small></span>';
const css='<style id="sst-timber-shed-teaser-css">.sst-shed-teaser{display:inline-flex}</style>';
const contaminated=footer=>page(footer).replace('</head>',css+'</head>').replace('</body>',tag+drawerTag+footerTag+'</body>');

test('retired Timber Shed teaser is removed while the public shell and canonical footer remain',()=>{
 for(const footer of [publicFooter,approvedFooter]){
  const before=contaminated(footer),after=addTimberShedTeaser(before,'/work-with-us');
  assert.notEqual(after,before);
  assert.doesNotMatch(after,/sst-shed-teaser|sst-timber-shed-teaser-css|The Timber Shed|>SOON</i);
  assert.match(after,/<main><h1>Original public page<\/h1><\/main>/);
  assert.match(after,/<a href="\/member\/dashboard">My Timber<\/a>/);
  assert.equal(addTimberShedTeaser(after,'/work-with-us'),after);
 }
});

test('clean pages, private routes and non-HTML responses retain their bytes',async()=>{
 const clean=page(approvedFooter);
 assert.equal(addTimberShedTeaser(clean,'/knowledge'),clean);
 assert.equal(addTimberShedTeaser(null,'/knowledge'),null);
 const publicRes=await withTimberShedTeaser(new Request('https://shiftsometimber.co.uk/work-with-us'),new Response(contaminated(approvedFooter),{headers:{'content-type':'text/html','etag':'"old"','content-length':'12345','content-security-policy':"default-src 'self'"}}));
 assert.equal(publicRes.status,200);
 assert.equal(publicRes.headers.get('etag'),null);
 assert.equal(publicRes.headers.get('content-length'),null);
 assert.equal(publicRes.headers.get('content-security-policy'),"default-src 'self'");
 assert.equal(publicRes.headers.get('x-shift-timber-shed-policy'),'retired-20261031');
 assert.doesNotMatch(await publicRes.text(),/sst-shed-teaser|The Timber Shed|>SOON/i);
 const privateInput=contaminated(approvedFooter);
 const privateRes=await withTimberShedTeaser(new Request('https://shiftsometimber.co.uk/member/dashboard'),new Response(privateInput,{headers:{'content-type':'text/html'}}));
 assert.equal(await privateRes.text(),privateInput);
 const jsonRes=new Response('{"ok":true}',{headers:{'content-type':'application/json'}});
 assert.equal(await withTimberShedTeaser(new Request('https://shiftsometimber.co.uk/work-with-us'),jsonRes),jsonRes);
});
