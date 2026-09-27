import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const timber=await readFile(new URL('../frontend/member/my-timber-v11.js',import.meta.url),'utf8');
const recovery=await readFile(new URL('../auth-recovery-v1.js',import.meta.url),'utf8');
const wrangler=await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8');

test('My Timber has a named human route and extensionless contact page',()=>{
  const human=timber.match(/<article\b[^>]*data-loop="human"[^>]*>([\s\S]*?)<\/article>/)?.[1];
  assert.ok(human,'My Timber must retain its human-support card');
  // Act2B routes support through the contact form instead of mailto aliases.
  assert.match(human,/<a\b[^>]*href="\/contact\?type=support"[^>]*>Message Matt<\/a>/);
  assert.match(human,/href="\/contact"/);
  assert.doesNotMatch(timber,/contact\.html/);
});

test('password reset has real email code and a configured Worker binding',()=>{
  assert.match(recovery,/env\.EMAIL\.send/);
  assert.match(recovery,/password_reset/);
  assert.match(wrangler,/"send_email"/);
  assert.match(wrangler,/"name": "EMAIL"/);
});
