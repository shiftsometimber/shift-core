import test from 'node:test';import assert from 'node:assert/strict';import {accountDeletionPublicRoute} from '../app-store-public-v1.js';
test('public account-deletion route is safe and discoverable',async()=>{
 const r=accountDeletionPublicRoute(new Request('https://shiftsometimber.co.uk/account-deletion'));
 assert.equal(r.status,200);assert.match(r.headers.get('Content-Type'),/text\/html/);assert.match(r.headers.get('X-Robots-Tag'),/noindex/);
 const body=await r.text();assert.match(body,/Request account deletion/);assert.match(body,/\/member-login\?returnTo=/);
});
test('public My Timber privacy notice identifies app data categories and contact',async()=>{
 const r=accountDeletionPublicRoute(new Request('https://shiftsometimber.co.uk/my-timber/privacy'));
 assert.equal(r.status,200);const body=await r.text();assert.match(body,/Health and wellbeing information/);assert.match(body,/privacy@shiftsometimber\.co\.uk/);assert.match(body,/\/account-deletion/);
});
test('HEAD has no body and writes/unrelated routes are not intercepted',async()=>{
 const h=accountDeletionPublicRoute(new Request('https://shiftsometimber.co.uk/account-deletion',{method:'HEAD'}));assert.equal(h.status,200);assert.equal(await h.text(),'');
 assert.equal(accountDeletionPublicRoute(new Request('https://shiftsometimber.co.uk/member/settings')),null);
 assert.equal(accountDeletionPublicRoute(new Request('https://shiftsometimber.co.uk/account-deletion',{method:'POST'})),null);
});
