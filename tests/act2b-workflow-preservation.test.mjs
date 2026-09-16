import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const workflows = [
  'act2b-live-serving-closeout.yml',
  'act2b-route-origin-repair.yml',
  'p0-contact-menu-footer-audit.yml',
];

test('obsolete one-shot source mutator stays retired', () => {
  assert.equal(existsSync(new URL('../.github/workflows/act2b-one-shot.yml', import.meta.url)), false);
});

for (const name of workflows) test(`${name} cannot rewrite or push the approved baseline`, () => {
  const workflow = read(`.github/workflows/${name}`);
  assert.match(workflow, /permissions:\s*\n\s+contents: read/);
  assert.match(workflow, /persist-credentials: false/);
  assert.doesNotMatch(workflow, /contents: write|write-all|git (?:push|commit|reset|restore)|git checkout -f|git show [0-9a-f]{7,}|\.write_text\(|act2b_cleanup\.py/);
  assert.match(workflow, /git diff --exit-code/);
});

test('source and route diagnostics remain active after retiring repairs', () => {
  const closeout = read('.github/workflows/act2b-live-serving-closeout.yml');
  const routes = read('.github/workflows/act2b-route-origin-repair.yml');
  const contact = read('.github/workflows/p0-contact-menu-footer-audit.yml');
  assert.match(closeout, /node frontend-member-source-gate\.mjs/);
  assert.match(closeout, /GIT_MEMBER_ASSETS/);
  assert.match(closeout, /commissioningOidc/);
  assert.match(routes, /ACT2B_PAGES_CONTENT_FALLTHROUGH/);
  assert.match(routes, /https:\/\/projectshift\.pages\.dev https:\/\/shiftsometimber\.co\.uk/);
  assert.match(routes, /\/faq\/are-carbs-bad \/tools\/bmi/);
  assert.match(routes, /exit 1/);
  assert.match(contact, /x-shift-act2b-chrome: v42-enclosure-deleted/);
  assert.match(contact, /Prove Rugby Drive is absent across sitemap estate/);
  assert.match(contact, /--data '\{\}'/);
  assert.doesNotMatch(contact, /Act2B Website Test|"consent":true/);
});
