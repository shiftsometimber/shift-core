import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../frontend/member/whole-man-intent-os-v1.js', import.meta.url), 'utf8');

const lockedLabels = [
  'My weight',
  'My energy',
  'My health',
  'My sleep',
  'My sex life / confidence',
  'My movement / fitness',
  'My hair',
  'My head / stress',
  'My drinking / smoking',
  'Not sure — give me an MOT',
  'Something else',
  'I’m doing alright — just keep me on track'
];

test('Whole-Man Sort contains the 12 locked options', () => {
  for (const label of lockedLabels) assert.ok(source.includes(label), `missing locked Sort option: ${label}`);
});

test('Whole-Man OS keeps one Next Shift and avoids product-wall language', () => {
  assert.ok(source.includes('MY NEXT SHIFT'));
  assert.ok(source.includes('exactly one') || source.includes('one useful next action') || source.includes('one next step'));
  assert.ok(!source.includes('LOW T? BUY TRT'));
  assert.ok(!source.includes('Coming Soon'));
  assert.ok(!source.includes('Add to basket'));
});

test('initial Next Shift CTA opens Sort rather than a dead hash', () => {
  assert.ok(source.includes("card.href==='#sort'"));
  assert.ok(source.includes('event.preventDefault();openSort();return'));
});

test('skipping Sort does not invent doing_alright intent', () => {
  const skipStart = source.indexOf('async function skipCheckin');
  assert.notEqual(skipStart, -1);
  const skipBody = source.slice(skipStart, source.indexOf('\n  async function boot', skipStart));
  assert.ok(skipBody.includes('sortCheckinSkippedAt'));
  assert.ok(!skipBody.includes('intentSortCurrent'));
  assert.ok(!skipBody.includes("doing_alright"));
});

test('regulated routes carry explicit partner gates', () => {
  assert.ok(source.includes("gate:'pharmacy'"));
  assert.ok(source.includes("gate:'diagnostics'"));
  assert.ok(source.includes("gate:'clinical'"));
});
