import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../frontend/member/whole-man-intent-os-v1.js', import.meta.url), 'utf8');
const journey = await readFile(new URL('../frontend/member/whole-man-journey-modes-v1.js', import.meta.url), 'utf8');

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

test('Journey modes stay inside one Journey and include the locked wider-health states', () => {
  for (const phrase of ['KEEP IT OFF','CONTINUITY','How’s the engine?','Private men’s health check-in','Lose timber. Keep strength.']) {
    assert.ok(journey.includes(phrase), `missing Journey mode copy: ${phrase}`);
  }
  assert.ok(journey.includes("document.getElementById('panel-journey')"));
  assert.ok(!journey.includes('Coming Soon'));
  assert.ok(!journey.includes('Add to basket'));
  assert.ok(!journey.includes('LOW T? BUY TRT'));
});

test('MOT remains framing-only and mens check-in rejects symptom-to-TRT shortcut', () => {
  assert.ok(journey.includes("motState:'intake_started'"));
  assert.ok(journey.includes('no payment or fake test has been created'));
  assert.ok(journey.includes('Symptoms alone do not diagnose low testosterone'));
  assert.ok(journey.includes('diagnostics + clinical governance are live'));
});

test('Life Back uses one or two priorities, never leaderboard theatre', () => {
  assert.ok(journey.includes('What do you want back?'));
  assert.ok(journey.includes('selected.length<2'));
  assert.ok(!journey.includes('leaderboard'));
});
