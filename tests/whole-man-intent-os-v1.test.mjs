import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../frontend/member/whole-man-intent-os-v1.js', import.meta.url), 'utf8');
const journey = await readFile(new URL('../frontend/member/whole-man-journey-modes-v1.js', import.meta.url), 'utf8');
const setup = await readFile(new URL('../frontend/member/member-my-journey-v1.js', import.meta.url), 'utf8');

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

test('initial Next Shift CTA is a real button rather than a dead hash', () => {
  assert.ok(source.includes("action:'sort'"));
  assert.ok(source.includes('data-next-action="sort"'));
  assert.ok(source.includes("if(card.action==='sort'){event.preventDefault();openSort();return}"));
  assert.ok(!source.includes("href:'#sort'"));
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
  assert.ok(source.includes('partner, stock and governance gates'));
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
  assert.ok(!journey.toLowerCase().includes('leaderboard'));
});

test('ContinuityStay keeps Journey, CGQ, Lounge and human support without becoming a product', () => {
  for (const phrase of ['CONTINUITYSTAY','Clinic Gone Quiet','Open The Lounge','Message SHIFT']) assert.ok(journey.includes(phrase));
  for (const state of ['stopped','stranded','elsewhere','doing_alright']) assert.ok(journey.includes(state));
  assert.ok(journey.includes('billing stays off'));
  assert.ok(!journey.includes('SHIFT Continuity'));
});

test('Next Shift priority rules put safety and active journey work before Sort', () => {
  for (const priority of ['safety','continuity','journey_setup','clinical_checks','open_order']) assert.ok(source.includes(`priority:'${priority}'`));
});

test('One Shift Brain fields and analytics events use the locked names', () => {
  for (const field of ['intent_sort_current','intent_sort_history','journey_mode','next_shift_intent','next_shift_updated_at','life_back_priorities','life_back_reflections','mot_state','continuity_stay_active']) {
    assert.ok(source.includes(field) || journey.includes(field), `missing field: ${field}`);
  }
  for (const event of ['intent_sort_selected','next_shift_shown','next_shift_completed','journey_mode_changed','life_back_weekly_reflection','continuity_stay_selected']) {
    assert.ok(source.includes(event) || journey.includes(event), `missing event: ${event}`);
  }
});

test('mandatory Journey setup includes one or two Life Back priorities', () => {
  assert.ok(setup.includes('Life Back — why this stays'));
  assert.ok(setup.includes('lifeBack:{...(panel._journey.lifeBack||{}),priorities:lifeBackPriorities}'));
  assert.ok(setup.includes('life_back_setup_completed'));
  assert.ok(setup.includes('Choose at least one Life Back priority'));
});

test('mobile Sort collapses to one column and actions remain full-width', () => {
  assert.ok(source.includes('@media(max-width:560px)'));
  assert.ok(source.includes('.wm-sort-grid{grid-template-columns:1fr}'));
  assert.ok(source.includes('.wm-next a,.wm-next button{width:100%;text-align:center}'));
  assert.ok(journey.includes('@media(max-width:600px)'));
});
