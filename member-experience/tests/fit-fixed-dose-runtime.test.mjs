import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import {fitRuntime} from '../fit-approved-runtime.mjs';

function runtimeFunctions() {
  const hook = '  window.addEventListener("load", init, { once: true });';
  assert.equal(fitRuntime.split(hook).length, 2);
  const context = {window: {addEventListener() {}}};
  // Execute the generated browser asset, including its decoded injection sources.
  vm.runInNewContext(fitRuntime.replace(hook, '  globalThis.testFit = {exercise, adjustSession};\n' + hook), context);
  return context.testFit;
}

const escape = value => String(value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const unescape = value => value.replace(/&(amp|lt|gt|quot|#39);/g, entity => ({'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'"}[entity]));
const metricsHtml = html => html.match(/<div class="sf-metrics" data-sf-metrics>([\s\S]*?)<\/div>/)[1];

function cardFromRenderedHtml(html) {
  const dataset = {};
  for (const [, name, value] of html.slice(0, html.indexOf('>')).matchAll(/data-([\w-]+)="([^"]*)"/g)) {
    dataset[name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = unescape(value);
  }
  const metrics = {innerHTML: metricsHtml(html)};
  return {dataset, metrics, querySelector(selector) {assert.equal(selector, '[data-sf-metrics]'); return metrics;}};
}

function effortSession(cards) {
  const note = {textContent: ''};
  const buttons = ['easier', 'planned', 'harder'].map(level => ({
    dataset: {sfDifficulty: level},
    classList: {toggle(name, active) {assert.equal(name, 'active'); this.active = active;}},
    setAttribute(name, value) {assert.equal(name, 'aria-pressed'); this.pressed = value;},
    closest(selector) {assert.equal(selector, '.sf-session'); return session;},
  }));
  const session = {
    querySelectorAll(selector) {
      if (selector === '.sf-exercise') return cards;
      assert.equal(selector, '[data-sf-difficulty]'); return buttons;
    },
    querySelector(selector) {assert.equal(selector, '[data-sf-difficulty-note]'); return note;},
  };
  return {note, buttons};
}

test('generated Fit renderer shows the exact escaped fixed prescription, including timed sets', () => {
  const {exercise} = runtimeFunctions();
  const dose = '4 sets × 10 seconds; rest 50 seconds. <img src=x onerror="run()"> & keep "control".';
  const html = exercise({id: 'timed-leg-press', name: 'Leg press', dose_locked: true, dose_text: dose, sets: 4, time_seconds: 10, reps: null, minutes: 99, rest_seconds: 50}, 0, 0);
  assert.equal(metricsHtml(html), `<span>${escape(dose)}</span>`);
  assert.doesNotMatch(metricsHtml(html), /REPS|99 MIN|<img/);
  const card = cardFromRenderedHtml(html);
  assert.equal(card.dataset.doseLocked, 'true');
  assert.equal(card.dataset.doseText, dose);
  assert.equal(card.dataset.baseReps, '');
});

test('every effort control preserves fixed repetition and timed prescriptions and their rest', () => {
  const {exercise, adjustSession} = runtimeFunctions();
  const items = [
    {id: 'kickback', dose_locked: true, dose_text: '2 sets × 5 total reps across both arms; rest 75 seconds.', sets: 2, reps: 5, rest_seconds: 75},
    {id: 'leg-press', dose_locked: true, dose_text: '4 sets × 10 seconds; rest 50 seconds. Keep effort < maximum.', sets: 4, time_seconds: 10, reps: null, rest_seconds: 50},
  ];
  const before = structuredClone(items);
  const cards = items.map((item, index) => cardFromRenderedHtml(exercise(item, index, 0)));
  const session = effortSession(cards);
  for (const button of session.buttons) {
    adjustSession(button);
    cards.forEach((card, index) => assert.equal(card.metrics.innerHTML, `<span>${escape(items[index].dose_text)}</span>`));
    assert.match(session.note.textContent, /fixed prescriptions/i);
    assert.doesNotMatch(session.note.textContent, /20%|15 seconds/);
    session.buttons.forEach(other => assert.equal(other.pressed, String(other === button)));
  }
  assert.deepEqual(items, before);
});

test('mixed sessions retain legacy effort scaling while fixed prescriptions stay unchanged', () => {
  const {exercise, adjustSession} = runtimeFunctions();
  const legacy = cardFromRenderedHtml(exercise({id: 'legacy', sets: 2, reps: 10, minutes: 8, rest_seconds: 60, dose_text: 'Unused legacy text'}, 0, 0));
  const locked = cardFromRenderedHtml(exercise({id: 'fixed', dose_locked: true, dose_text: '1 set × 8 total reps. No between-set rest.', sets: 1, reps: 8}, 1, 0));
  assert.equal(legacy.metrics.innerHTML, '<span>2 SETS</span><span>10 REPS</span><span>8 MIN</span><span>60 SEC REST</span>');
  const fixedHtml = locked.metrics.innerHTML;
  const session = effortSession([legacy, locked]);
  const expected = {
    easier: '<span>2 SETS</span><span>8 REPS</span><span>6 MIN</span><span>75 SEC REST</span>',
    planned: '<span>2 SETS</span><span>10 REPS</span><span>8 MIN</span><span>60 SEC REST</span>',
    harder: '<span>2 SETS</span><span>12 REPS</span><span>10 MIN</span><span>45 SEC REST</span>',
  };
  for (const button of session.buttons) {
    adjustSession(button);
    assert.equal(legacy.metrics.innerHTML, expected[button.dataset.sfDifficulty]);
    assert.equal(locked.metrics.innerHTML, fixedHtml);
    assert.match(session.note.textContent, /Fixed prescriptions stay as written/);
  }
  const legacyOnly = effortSession([legacy]);
  adjustSession(legacyOnly.buttons[0]);
  assert.equal(legacyOnly.note.textContent, 'Easier: about 20% fewer reps or minutes, with 15 seconds more rest where rest is prescribed.');
});

test('reviewable functions and stable browser injection constants remain byte synchronized', () => {
  const source = readFileSync(new URL('../fit-approved-runtime.mjs', import.meta.url), 'utf8');
  for (const [name, start, end] of [
    ['exerciseSource', 'function purpose(', 'function difficultyControl('],
    ['difficultySource', 'function difficultyControl(', '// Function#toString'],
  ]) {
    const readable = '  ' + source.slice(source.indexOf(start), source.indexOf(end)).trimEnd().replace(/\nfunction /g, '\n  function ');
    const encoded = source.match(new RegExp(`const ${name} = decodeInjectedSource\\('([A-Za-z0-9+/=]+)'\\);`))[1];
    assert.equal(Buffer.from(encoded, 'base64').toString('utf8'), readable);
  }
});
