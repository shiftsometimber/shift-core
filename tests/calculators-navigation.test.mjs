import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {publicHeader,publicDrawer,publicFooter,reconcilePublicDocument,withPublicShellContract} from '../public-shell-contract.mjs';

const link='<a href="/tools">Calculators &amp; Tools</a>';
const hrefs=html=>[...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(match=>match[1]);
const fixture='<html><head><title>Existing page</title></head><body>'+publicHeader+publicDrawer.replace(link,'')+'<main><h1>Existing calculator</h1><form id="calculator"><input name="height"></form><p>No stock available today</p></main>'+publicFooter.replace(link,'')+'</body></html>';

test('footer Explore has exactly one ordinary, accessible calculators link',()=>{
 const explore=publicFooter.match(/<section><h2>Explore<\/h2>([\s\S]*?)<\/section>/)?.[1];
 assert.ok(explore);
 assert.equal(explore.split(link).length-1,1);
 assert.equal(hrefs(publicFooter).filter(path=>path==='/tools').length,1);
});
test('drawer has exactly one calculators link in the alphabetical section',()=>{
 assert.equal(publicDrawer.split(link).length-1,1);
 assert.ok(publicDrawer.indexOf('>Ask Timber</a>')<publicDrawer.indexOf(link));
 assert.ok(publicDrawer.indexOf(link)<publicDrawer.indexOf('>Contact</a>'));
 assert.deepEqual(hrefs(publicDrawer).slice(0,5),['/start-here','/programme','/shift-health','/treatment-centre','/member/dashboard']);
});
test('desktop header, Treatments and My Timber remain unchanged',()=>{
 const primary=publicHeader.match(/<nav\b[^>]*class="desktop-nav"[^>]*>(.*?)<\/nav>/s)?.[1];
 assert.deepEqual(hrefs(primary),['/start-here','/programme','/shift-health','/treatment-centre','/member/dashboard']);
 assert.ok(!publicHeader.includes('/tools'));
});
test('existing public pages acquire both links without changing forms or content',()=>{
 for(const path of ['/','/programme','/shift-health','/treatment-centre','/about','/privacy','/articles/mounjaro-cost-uk']){
  const once=reconcilePublicDocument(fixture,path);
  assert.equal(once.split(link).length-1,2,path);
  assert.match(once,/<form id="calculator"><input name="height"><\/form>/);
  assert.match(once,/<p>No stock available today<\/p>/);
  assert.equal(reconcilePublicDocument(once,path),once,path);
 }
});
test('tools hub, trailing-slash and calculator children receive current-page markers',()=>{
 for(const path of ['/tools','/tools/','/tools.html','/tools/bmi']){
  const result=reconcilePublicDocument(fixture,path);
  assert.equal((result.match(/href="\/tools" aria-current="page">Calculators &amp; Tools<\/a>/g)||[]).length,2,path);
 }
});
test('private member, API and HQ paths remain outside this repair',()=>{
 for(const path of ['/member/dashboard','/member/orders','/v1/profile','/api/example','/hq'])assert.equal(reconcilePublicDocument(fixture,path),fixture,path);
});
test('the HTTP wrapper serves the links while preserving security headers',async()=>{
 const result=await withPublicShellContract(new Request('https://shiftsometimber.co.uk/programme'),new Response(fixture,{headers:{'content-type':'text/html','content-security-policy':"default-src 'self'",'etag':'obsolete'}}));
 assert.equal(result.headers.get('content-security-policy'),"default-src 'self'");
 assert.equal(result.headers.get('etag'),null);
 assert.equal((await result.text()).split(link).length-1,2);
});
test('this release changes only the two anchors in the production shell', {skip:!process.env.CALCULATORS_BASELINE},()=>{
 const before=execFileSync('git',['show',process.env.CALCULATORS_BASELINE+':public-shell-contract.mjs'],{encoding:'utf8'});
 const after=readFileSync(new URL('../public-shell-contract.mjs',import.meta.url),'utf8');
 const escaped=link.replaceAll('"','\\"');
 assert.equal(after.split(escaped).length-1,2);
 assert.equal(after.replaceAll(escaped,''),before);
});
