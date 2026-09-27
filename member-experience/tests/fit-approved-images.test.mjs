import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {fitRuntime} from '../fit-approved-runtime.mjs';
import {exercisePurpose} from '../../fit-exercise-purpose-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const approval = JSON.parse(
  fs.readFileSync(path.join(root, 'preview/fit-grub/v3/approval.json'), 'utf8'),
);
const approved = new Set(approval.records.map((record) => record.id));

test('Fit runtime renders approved PNGs instead of legacy inline diagrams', () => {
  assert.match(fitRuntime, /class="sf-approved-exercise-image"/);
  assert.match(fitRuntime, /\/fit-v3-images\/\$\{esc\(canonical\)\}\.png/);
  assert.doesNotMatch(fitRuntime, /<svg viewBox=/);
});

test('Fit cards explain their purpose and include bounded session effort controls', () => {
  assert.doesNotThrow(() => new Function(fitRuntime));
  assert.match(fitRuntime, /WHY THIS IS HERE/);
  assert.match(fitRuntime, /WHAT IT WORKS/);
  assert.match(fitRuntime, /HOW IT SUPPORTS YOUR GOALS/);
  assert.match(fitRuntime, /data-sf-difficulty/);
  assert.match(fitRuntime, /Go easier/);
  assert.match(fitRuntime, /Go harder/);
  assert.doesNotMatch(fitRuntime, /<button data-sf-show/);
  assert.equal((fitRuntime.match(/Show me how/g) || []).length, 1);
  assert.doesNotMatch(fitRuntime, /calories burned|calorie loss/i);
});

test('every approved image and every currently published Fit family is mapped', () => {
  assert.equal(approved.size, 300);
  for (const id of approved) {
    assert.ok(
      fs.existsSync(path.join(root, 'frontend/member/fit-v3-images', `${id}.png`)),
      `missing approved image: ${id}`,
    );
  }
  const decisions = JSON.parse(
    fs.readFileSync(
      path.join(root, 'evidence/fit-v1-final-decisions-2026-08-14.json'),
      'utf8',
    ),
  );
  for (const decision of decisions.decisions) {
    assert.ok(
      approved.has(decision.movement_id),
      `published Fit family lacks approved PNG: ${decision.movement_id}`,
    );
    assert.ok(
      exercisePurpose[decision.movement_id],
      `published Fit family lacks purpose guidance: ${decision.movement_id}`,
    );
  }
});
