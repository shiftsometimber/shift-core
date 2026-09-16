import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {digest, loadFitV3Inputs, reconcileFitV3, reviewFitV3Candidate, stageFitV3Additions, inspectDose} from '../scripts/fit-v3-closeout.mjs';

const input = loadFitV3Inputs();
const originalHash = digest(input);
const report = reconcileFitV3(input);
const reviewed = reviewFitV3Candidate(report);
const acceptedIds = new Set(input.accepted.decisions.map((row) => row.movement_id));
const existing = input.source.filter((row) => row.id.startsWith('industrial-v3-fit-') && acceptedIds.has(row.canonical_movement));

test('real workbook reconciliation isolates substantive reused-ID changes from truly new additions', () => {
  assert.deepEqual(report.counts, {movements: 300, approvedImages: 300, sourceProtocols: 2688, acceptedMovements: 26, acceptedProtocols: 1326, existingUnchanged: 1146, existingChanged: 180, newMovements: 274, newProtocols: 1362});
  assert.equal(report.rows.filter((row) => row.differences.includes('dose')).length, 162);
  assert.equal(report.rows.filter((row) => !row.imageMappingTitleCurrent).length, 180);
  const plank = report.rows.find((row) => row.id === 'industrial-v3-fit-plank-standard-beginner');
  assert.equal(plank.disposition, 'existing-id-changed-draft');
  assert.match(plank.currentProtocol.dose, /reps: 8/);
  assert.match(plank.proposedProtocol.dose, /10-second forearm-plank holds/);
});

test('all original objects, workbook flags, image decisions and accepted source remain unchanged', () => {
  const before = JSON.stringify(existing);
  const staged = stageFitV3Additions(existing, reviewed.candidate);
  assert.equal(JSON.stringify(staged.existingItems), before);
  assert.ok(staged.existingItems.every((row, index) => row === existing[index]));
  assert.equal(digest(input), originalHash);
  assert.equal(digest(JSON.parse(fs.readFileSync('preview/fit-grub/guidance/workbook.json'))), digest(input.workbook));
  assert.ok(staged.additions.every((row) => row.status === 'draft' && row.review.status === 'pending' && !row.review.memberServingAllowed));
  assert.equal(staged.additions.length, 1362);
  assert.equal(staged.excludedReplacementIds.length, 180);
  assert.ok(staged.additions.every((row) => !acceptedIds.has(row.data.canonical_movement)));
});

test('converter fails closed on an existing-ID collision instead of overwriting', () => {
  const id = reviewed.candidate.rows.find((row) => row.disposition === 'new-draft').id;
  assert.throws(() => stageFitV3Additions([...existing, {id, savedMemberUse: true}], reviewed.candidate), /Refusing existing-ID overwrite/);
});

test('source identity, missing legacy row and image mapping drift fail closed', () => {
  let changed = structuredClone(input);
  changed.workbook.movements[0].variants[0].id = changed.workbook.movements[0].variants[1].id;
  assert.throws(() => reconcileFitV3(changed), /duplicate id/);
  changed = structuredClone(input);
  changed.workbook.movements[0].variants[0].id = 'SST-FIT-made-up';
  assert.throws(() => reconcileFitV3(changed), /Missing accepted protocol/);
  changed = structuredClone(input);
  changed.assets.records[0].variants[0].id = 'SST-FIT-wrong-map';
  assert.throws(() => reconcileFitV3(changed), /Image mapping mismatch/);
});

test('accepted protocol may not be reassigned to a different canonical movement', () => {
  const changed = structuredClone(input);
  const first = changed.workbook.movements[0], second = changed.workbook.movements[1];
  [first.variants[0], second.variants[0]] = [second.variants[0], first.variants[0]];
  changed.assets.records.find((row) => row.id === first.id).variants = first.variants.map((row) => ({id: row.id, name: row.name}));
  changed.assets.records.find((row) => row.id === second.id).variants = second.variants.map((row) => ({id: row.id, name: row.name}));
  assert.throws(() => reconcileFitV3(changed), /Protocol moved between movements/);
});

test('source comparison does not trust a preserved-source label or an opaque workbook sourceHash', () => {
  const changed = structuredClone(input);
  changed.workbook.movements[0].variants[0].dose = 'sets: 99\nreps: 99\nrest seconds: 0';
  const result = reconcileFitV3(changed);
  assert.equal(result.counts.existingChanged, 181);
  assert.notEqual(result.rows[0].sourceSnapshotSha256, report.rows[0].sourceSnapshotSha256);
  assert.equal(result.rows[0].workbookSourceHash, report.rows[0].workbookSourceHash);
});

test('all 1542 proposed changed/new doses parse with declared units; no suitability claim inferred', () => {
  assert.equal(reviewed.summary.reviewedRecords, 1542);
  assert.equal(reviewed.summary.parsedDoses, 1542);
  assert.equal(reviewed.summary.professionalApprovalClaimed, false);
  assert.equal(inspectDose('3 x loads of effort'), null);
  assert.equal(inspectDose('2 minutes easy, then 4 × (2 minutes moderate + 1 minute easy), then 2 minutes easy.').minutes, 16);
  assert.equal(inspectDose('2 bouts × 10s per side; 15s rest between bouts.').sideScope, 'per side');
});

test('rope repair removes an erroneous side multiplier while keeping the authored work/rest numbers', () => {
  const rows = reviewed.candidate.rows.filter((row) => row.movementId === 'battle-rope-alternating-waves');
  assert.equal(rows.length, 3);
  for (const row of rows) {
    assert.doesNotMatch(row.proposedProtocol.dose, /per side/);
    assert.match(row.proposedProtocol.instructions, /both arms together/);
    const before = report.rows.find((source) => source.id === row.id);
    assert.deepEqual(row.proposedProtocol.dose.match(/\d+/g), before.proposedProtocol.dose.match(/\d+/g));
    assert.notEqual(row.candidateSnapshotSha256, row.sourceSnapshotSha256);
  }
});

test('leg-press candidate loses turf-sled/rope metadata and retains an explicit programming decision', () => {
  const guide = reviewed.candidate.guides.find((row) => row.id === '45-degree-sled-leg-press');
  assert.equal(guide.movementType, 'Strength timed sets');
  assert.doesNotMatch(guide.space + guide.equipmentSetup, /rope|lane|secure anchor/);
  assert.doesNotMatch(guide.safety, /shoulder position/);
  const rows = reviewed.candidate.rows.filter((row) => row.movementId === guide.id);
  assert.ok(rows.every((row) => row.objectiveReview.issues.some((issue) => issue.includes('Trainer must decide'))));
});

test('nine concrete programming ambiguities and 164 redundant legacy replacements remain visible', () => {
  assert.equal(reviewed.summary.specificIssues.length, 9);
  assert.equal(reviewed.summary.equivalentRecords, 164);
  assert.equal(reviewed.summary.correctedGuides, 7);
  assert.equal(reviewed.summary.correctedProtocols, 9);
  assert.equal(reviewed.summary.correctedMovements, 11);
  const rows = reviewed.candidate.rows.filter((row) => row.movementId === 'loaded-carry');
  assert.equal(rows.filter((row) => row.objectiveReview.equivalentProtocolId).length, 50);
});

test('singular-repetition correction changes one but never a multi-digit repetition count', () => {
  const changed = structuredClone(report);
  const row = changed.rows.find((item) => item.movementId === 'kettlebell-single-arm-swing' && /\b1 reps\b/.test(item.proposedProtocol.dose));
  assert.ok(row, 'The single-arm swing source identity must remain available');
  row.proposedProtocol.dose = '5 sets × 21 reps per side; 45s rest between sets.';
  row.proposedProtocol.instructions = '5 sets × 21 reps per side; 45s rest between sets. Keep control.';
  const result = reviewFitV3Candidate(changed);
  const after = result.candidate.rows.find((item) => item.id === row.id);
  assert.equal(after.proposedProtocol.dose, row.proposedProtocol.dose);
  assert.equal(after.proposedProtocol.instructions, row.proposedProtocol.instructions);
  assert.ok(!result.corrections.some((item) => item.id === row.id));
  assert.ok(result.candidate.rows.some((item) => /5 sets × 1 rep;/.test(item.proposedProtocol.dose)));
});

test('candidate guide fingerprints and protocol fingerprints bind the actual corrected content', () => {
  const staged = stageFitV3Additions(existing, reviewed.candidate);
  for (const guide of staged.guides) {
    const {guideHash, image, ...written} = guide;
    assert.equal(digest(written), guideHash);
    for (const row of staged.additions.filter((item) => item.data.canonical_movement === guide.id)) {
      assert.equal(row.data.guideHash, guideHash);
      assert.equal(row.review.candidateSnapshotSha256, digest({guide: written, variant: row.data.protocol, imageSha256: image.sha256}));
    }
  }
});
