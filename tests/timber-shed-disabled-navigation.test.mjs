import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import worker,{publicNavigationAsset,disabledNavigationClient} from '../member-experience/timber-shed-disabled-navigation-entry.mjs';
import original from '../member-experience/timber-shed-original-footer-social.mjs';
test('complete original footer script is retained as an unchanged prefix',()=>{
 assert(publicNavigationAsset.startsWith(original));assert.equal(publicNavigationAsset.slice(original.length),disabledNavigationClient);new vm.Script(publicNavigationAsset);
 assert.match(original,/https:\/\/www.instagram.com\/shiftsometimber/);assert.match(original,/https:\/\/www.youtube.com\/@ShiftSomeTimber/);
});
test('asset release owns only two exact public asset routes with no data bindings',()=>{
 const c=JSON.parse(readFileSync(new URL('../wrangler.timber-shed-disabled-navigation.jsonc',import.meta.url)));
 assert.deepEqual(c.routes.map(r=>r.pattern),['shiftsometimber.co.uk/assets/footer-social-links-v1.js*','www.shiftsometimber.co.uk/assets/footer-social-links-v1.js*']);
 assert.equal(c.workers_dev,false);assert.equal(c.preview_urls,false);assert.equal(c.d1_databases,undefined);assert.equal(c.services,undefined);
});
test('JavaScript response has correct type and cannot retain stale content',async()=>{
 const r=await worker.fetch(new Request('https://shiftsometimber.co.uk/assets/footer-social-links-v1.js?v=20261020'));
 assert.equal(r.status,200);assert.match(r.headers.get('Content-Type'),/javascript/);assert.equal(r.headers.get('Cache-Control'),'no-store');assert.equal(await r.text(),publicNavigationAsset);
 const head=await worker.fetch(new Request('https://www.shiftsometimber.co.uk/assets/footer-social-links-v1.js',{method:'HEAD'}));assert.equal(head.status,200);assert.equal(await head.text(),'');
});
test('page, forum and unrelated asset routes are not served',async()=>{
 for(const url of ['https://shiftsometimber.co.uk/','https://shiftsometimber.co.uk/member/timber-shed','https://shiftsometimber.co.uk/v1/timber-shed/forum/latest','https://shiftsometimber.co.uk/assets/other.js','https://example.invalid/assets/footer-social-links-v1.js'])
 assert.equal((await worker.fetch(new Request(url))).status,404);
 assert.equal((await worker.fetch(new Request('https://shiftsometimber.co.uk/assets/footer-social-links-v1.js',{method:'POST'}))).status,405);
});
test('approved green disabled labels use spans and cannot create a forum link',()=>{
 assert.match(disabledNavigationClient,/#707762/);assert.match(disabledNavigationClient,/createElement\('span'\)/);
 assert.match(disabledNavigationClient,/aria-disabled/);assert.doesNotMatch(disabledNavigationClient,/createElement\('a'\)|\.href\s*=|location\.(?:href|assign|replace)|fetch\(/);
});
