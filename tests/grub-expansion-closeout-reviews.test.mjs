import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { verifyGrubCloseoutReviews } from '../scripts/verify-grub-closeout-reviews.mjs';

const root = new URL('../', import.meta.url);
const dir = new URL('evidence/grub-expansion-closeout-2026-09-16/', root);
const read = name => JSON.parse(fs.readFileSync(new URL(name, dir), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
// Generated evidence is deliberately not tracked. Rebuild an isolated candidate
// from committed inputs so this suite works in any fresh-checkout test caller.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'grub-closeout-contract-'));
let bytes;
try{
  execFileSync(process.execPath,['grub-expansion-review-pack.mjs'],{
    cwd:fileURLToPath(root),stdio:'pipe',
    env:{...process.env,GRUB_EXPANSION_DIR:temp,COFID_INDEX:fileURLToPath(new URL('tests/fixtures/grub-cofid-2021-governed-subset.json',root))}
  });
  bytes=fs.readFileSync(path.join(temp,'grub-additive-candidate.json.gz'));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
const baseline = {
  candidate: JSON.parse(gunzipSync(bytes)), candidateSha: sha(bytes),
  report: read('independent-editorial-review.json'), authorship: read('authorship.json'),
  human: read('human-acceptance-required.json'), fingerprints: read('content-fingerprints.json'),
  fixtureSha: sha(fs.readFileSync(new URL('tests/fixtures/grub-cofid-2021-governed-subset.json', root))),
};

test('recorded complete editorial evidence verifies without creating publication authority', () => {
  const result = verifyGrubCloseoutReviews(baseline);
  assert.equal(result.recipes, 1873);
  assert.equal(result.families, 87);
  assert.equal(result.publication_authority, false);
  assert.equal(result.human_acceptance, 'pending');
});

for (const [name, change, error] of [
  ['missing recipe decision', value => value.report.decisions.pop(), /coverage is incomplete/],
  ['changed recipe content', value => value.candidate.candidates[0].method.push('Unreviewed change.'), /content hash mismatch/],
  ['stale recipe decision', value => { value.report.decisions[0].content_hash = 'stale'; }, /Exact recorded PASS missing/],
  ['wrong author roster', value => { value.report.decisions[0].author_ids = ['/different-author']; }, /author roster mismatch/],
  ['self review', value => { value.report.decisions[0].reviewer.id = value.report.decisions[0].author_ids[0]; }, /Independent AI reviewer/],
  ['missing substantive scope', value => { value.report.decisions[0].scopes = value.report.decisions[0].scopes.filter(scope => scope !== 'nutrition'); }, /Incomplete review scopes/],
  ['partial family descendants', value => value.report.families[0].descendants.pop(), /Exact full family review missing/],
  ['invented human approval', value => { value.human.families[0].decision = 'PASS'; }, /Human approval must remain unclaimed/],
  ['stale human hash', value => { value.human.families[0].recipes[0].content_hash = 'stale'; }, /Human scaffold hash mismatch/],
  ['invented publication authority', value => { value.report.publication_authority = true; }, /must not represent human or publication approval/],
  ['stale arithmetic fixture', value => { value.fixtureSha = 'changed'; }, /arithmetic evidence is stale/],
]) {
  test(`verifier rejects ${name}`, () => {
    const value = structuredClone(baseline);
    change(value);
    assert.throws(() => verifyGrubCloseoutReviews(value), error);
  });
}
