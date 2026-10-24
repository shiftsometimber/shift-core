import test from 'node:test';
import assert from 'node:assert/strict';
import {causesPublicRoute,renderCausesDocument} from '../causes-partners/production.mjs';
import {causesRuntime,causesStyles} from '../causes-partners/public-content.mjs';
const shell='<html><head><title>Programme</title><link rel="canonical" href="https://shiftsometimber.co.uk/programme"><script type="application/ld+json">{}</script></head><body><header class="site-header">Accepted header</header><main>Programme content</main><footer class="site-footer">Accepted footer</footer></body></html>';
test('public page keeps its shell and excludes private controls, statuses and integration mock-ups',()=>{
 const html=renderCausesDocument(shell);
 assert.match(html,/Accepted header/);assert.match(html,/Accepted footer/);
 assert.match(html,/class="causes-page"/);assert.match(html,/Life is bigger/);
 assert.match(html,/https:\/\/shiftsometimber.co.uk\/our-causes-partners/);
 assert.doesNotMatch(html,/PRIVATE BUILD|Private proposal|data-surface|data-view|preview-menu|Prospective contact|approached|data-template="shift-programme"/);
 assert.equal((html.match(/<main\b/g)||[]).length,1);assert.equal((html.match(/<dialog\b/g)||[]).length,1);
 assert.doesNotMatch(html,/data:image/);assert.match(html,/\/assets\/causes\/hopeful-outlook-hero.webp/);
 assert.doesNotThrow(()=>new Function(causesRuntime));
 assert.match(causesStyles,/\.causes-page \.opening/);
});
test('only exact public page and image paths are handled; read methods and security headers are preserved',async()=>{
 for(const path of ['/','/member/dashboard','/v1/me','/our-causes-partners-extra'])assert.equal(await causesPublicRoute(new Request('https://shiftsometimber.co.uk'+path),{},()=>{throw Error('not called')}),null);
 const load=()=>Promise.resolve(new Response(shell,{headers:{'content-type':'text/html','content-security-policy':"default-src 'self'",etag:'old'}}));
 const get=await causesPublicRoute(new Request('https://shiftsometimber.co.uk/our-causes-partners'),{},load);
 assert.equal(get.status,200);assert.equal(get.headers.get('etag'),null);assert.equal(get.headers.get('content-security-policy'),"default-src 'self'");
 const head=await causesPublicRoute(new Request('https://shiftsometimber.co.uk/our-causes-partners',{method:'HEAD'}),{},load);assert.equal(head.status,200);assert.equal(await head.text(),'');
 const post=await causesPublicRoute(new Request('https://shiftsometimber.co.uk/our-causes-partners',{method:'POST'}),{},()=>{throw Error('not called')});assert.equal(post.status,405);
 const image=await causesPublicRoute(new Request('https://shiftsometimber.co.uk/assets/causes/hopeful-outlook-hero.webp'),{MEMBER_ASSETS:{fetch:()=>new Response('image bytes')}},load);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/webp');
 const unavailable=await causesPublicRoute(new Request('https://shiftsometimber.co.uk/our-causes-partners'),{},()=>new Response('Unavailable',{status:503}));assert.equal(unavailable.status,503);
});
