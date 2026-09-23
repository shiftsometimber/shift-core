import test from 'node:test';import assert from 'node:assert/strict';import {accountDeletionPublicRoute} from '../app-store-public-v1.js';
test('public account-deletion route is safe and discoverable',()=>{
 const r=accountDeletionPublicRoute(new Request('https://shiftsometimber.co.uk/account-deletion'));
 assert.equal(r.status,200);assert.match(r.headers.get('Content-Type'),/text\/html/);assert.match(r.headers.get('X-Robots-Tag'),/noindex/);
});
test('does not intercept unrelated routes or writes',()=>{
 assert.equal(accountDeletionPublicRoute(new Request('https://shiftsometimber.co.uk/member/settings')),null);
 assert.equal(accountDeletionPublicRoute(new Request('https://shiftsometimber.co.uk/account-deletion',{method:'POST'})),null);
});
