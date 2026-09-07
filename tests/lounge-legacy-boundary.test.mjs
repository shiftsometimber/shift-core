import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker = fs.readFileSync(new URL('../worker-entry-v6.js', import.meta.url), 'utf8');
const loungeClient = fs.readFileSync(new URL('../frontend/member/tap-room-v1.js', import.meta.url), 'utf8');
const legacyRedirect = fs.readFileSync(new URL('../frontend/member/tap-room.html', import.meta.url), 'utf8');

test('legacy Tap Room URL is compatibility-only and canonicalises to The Lounge', () => {
  assert.match(legacyRedirect, /<title>The Lounge \| Shift Some Timber<\/title>/);
  assert.match(legacyRedirect, /url=\/lounge/);
  assert.match(legacyRedirect, /rel="canonical" href="https:\/\/shiftsometimber\.co\.uk\/lounge"/);
  assert.doesNotMatch(legacyRedirect, />\s*(?:The )?Tap Room\s*</i);
});

test('member Lounge client uses Lounge API and public language only', () => {
  assert.match(loungeClient, /const api='\/v1\/lounge'/);
  assert.match(loungeClient, /The Lounge is open\./);
  assert.match(loungeClient, /The Lounge could not open\./);
  assert.doesNotMatch(loungeClient, /["'`]The Tap Room["'`]/i);
});

test('public chrome rewrites retired Tap Room links to The Lounge', () => {
  assert.match(worker, /path==='\/tap-room'/);
  assert.match(worker, /link\.href='\/lounge'/);
  assert.match(worker, /link\.textContent='The Lounge'/);
  assert.match(worker, /replaceAll\('>Tap Room<','>The Lounge<'\)/);
});

test('legacy implementation identifiers are not treated as a public product name', () => {
  // tap_room DB/API aliases remain temporarily for backward compatibility.
  // This test deliberately locks the public boundary rather than forcing a risky schema rename.
  assert.match(worker, /path\.startsWith\('\/v1\/tap-room'\)/);
  assert.match(worker, /path\.startsWith\('\/v1\/lounge'\)/);
});
