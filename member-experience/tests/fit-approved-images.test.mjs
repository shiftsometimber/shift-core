import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {fitRuntime} from '../fit-approved-runtime.mjs';

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
  }
});
