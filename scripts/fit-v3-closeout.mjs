// Read-only reconciliation and offline draft conversion. No Worker import, D1,
// publication SQL, network call or inferred review decision belongs in this file.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {buildIndustrialCatalogue} from '../industrial-catalogue-v14.js';
import {approvedFitPack} from '../preview/fit-grub/v3-assets.mjs';

export const digest = (value) => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const requiredReview = ['technique', 'programming and suitability', 'member content'];
const sourceFiles = [
  'preview/fit-grub/guidance/workbook.json',
  'preview/fit-grub/v3/approval.json',
  'evidence/fit-v1-final-decisions-2026-08-14.json',
  'fit-canonical-guidance-v1.mjs',
  'final-v1-production-publication.mjs',
  ...Array.from({length: 14}, (_, i) => `industrial-catalogue-v${i + 1}.js`),
];

export function legacyProjection(source) {
  return {
    name: source.title,
    difficulty: source.intensity.level,
    dose: Object.entries(source.dosage).map(([key, value]) => `${key.replaceAll('_', ' ')}: ${value}`).join('\n'),
    instructions: source.instructions.map((step, i) => `${i + 1}. ${step}`).join('\n'),
  };
}

function unique(rows, key, label) {
  const map = new Map();
  for (const row of rows) {
    assert.ok(row[key] && !map.has(row[key]), `${label}: missing or duplicate ${key} ${row[key]}`);
    map.set(row[key], row);
  }
  return map;
}

export function reconcileFitV3({workbook, assets, accepted, source}) {
  assert.equal(workbook.libraryVersion, 3);
  assert.equal(workbook.movements.length, 300);
  assert.equal(accepted.proof, 'FIT_V1_DOMAIN_MEMBER_ACCEPTANCE');
  assert.equal(accepted.decisions.length, 26);
  assert.ok(accepted.decisions.every((row) => row.decision === 'PASS'));
  const acceptedIds = new Set(unique(accepted.decisions, 'movement_id', 'Accepted movement').keys());
  const existing = source.filter((row) => row.id.startsWith('industrial-v3-fit-') && acceptedIds.has(row.canonical_movement));
  assert.equal(existing.length, 1326);
  const current = unique(existing, 'id', 'Accepted protocol');
  const movements = unique(workbook.movements, 'id', 'Workbook movement');
  const images = unique(assets.records, 'id', 'Approved image');
  assert.equal(images.size, movements.size);
  const protocols = unique(workbook.movements.flatMap((row) => row.variants), 'id', 'Workbook protocol');
  assert.equal(protocols.size, 2688);
  for (const id of acceptedIds) {
    assert.ok(movements.has(id), `Missing accepted movement: ${id}`);
    assert.equal(existing.filter((row) => row.canonical_movement === id).length, 51);
  }
  for (const id of current.keys()) assert.ok(protocols.has(id), `Missing accepted protocol: ${id}`);

  const rows = [];
  const guides = [];
  const matrix = [];
  for (const movement of workbook.movements) {
    const {variants, ...guide} = movement;
    const asset = images.get(movement.id);
    assert.ok(asset, `Missing approved image: ${movement.id}`);
    assert.equal(asset.status, 'approved', `Image not approved: ${movement.id}`);
    assert.match(asset.sha256, /^[a-f0-9]{64}$/);
    assert.equal(asset.image, `/fit-v3-images/${movement.id}.png`);
    const mapped = unique(asset.variants, 'id', 'Image protocol mapping');
    assert.deepEqual([...mapped.keys()].sort(), variants.map((row) => row.id).sort(), `Image mapping mismatch: ${movement.id}`);
    for (const key of ['setup', 'cues', 'mistakes', 'modifications', 'safety', 'equipmentSetup', 'space']) {
      assert.ok(guide[key], `Missing ${key}: ${movement.id}`);
    }
    const guideHash = digest(guide);
    guides.push({...guide, guideHash, image: {path: asset.image, sha256: asset.sha256, scope: 'approved canonical visual; not protocol approval'}});
    const counts = {existingUnchanged: 0, existingChanged: 0, newProtocols: 0};
    for (const variant of variants) {
      const original = current.get(variant.id);
      assert.match(variant.sourceHash, /^[a-f0-9]{64}$/);
      if (original) assert.equal(original.canonical_movement, movement.id, `Protocol moved between movements: ${variant.id}`);
      else assert.ok(!acceptedIds.has(movement.id), `Unexpected new protocol on an accepted movement: ${variant.id}`);
      const projected = original ? legacyProjection(original) : null;
      const differences = projected ? Object.keys(projected).filter((key) => projected[key] !== variant[key]) : [];
      const disposition = !original ? 'new-draft' : differences.length ? 'existing-id-changed-draft' : 'existing-source-preserved';
      counts[!original ? 'newProtocols' : differences.length ? 'existingChanged' : 'existingUnchanged']++;
      rows.push({
        id: variant.id, movementId: movement.id, disposition,
        sourceSnapshotSha256: digest({guide, variant, imageSha256: asset.sha256}),
        guideHash, imageSha256: asset.sha256,
        // sourceHash is retained workbook provenance. Its original cell-hashing
        // recipe is unavailable; it is never represented as recomputed proof.
        workbookSourceHash: variant.sourceHash,
        imageMappingTitle: mapped.get(variant.id).name,
        imageMappingTitleCurrent: mapped.get(variant.id).name === variant.name,
        currentSourceSha256: original ? digest(original) : null,
        differences, currentProtocol: projected, proposedProtocol: {...variant},
        outstanding: disposition === 'existing-source-preserved'
          ? ['Workbook display flags are stale for the existing accepted source; no republishing or new approval required.']
          : requiredReview,
      });
    }
    matrix.push({movementId: movement.id, title: movement.title, ...counts, approvedImageSha256: asset.sha256,
      action: counts.existingChanged ? 'Keep accepted source; review replacement protocols separately.'
        : counts.newProtocols ? 'Review new movement technique and every proposed dose/suitability mapping.'
          : 'Keep existing accepted source; workbook flags do not revoke its acceptance.'});
  }
  const count = (type) => rows.filter((row) => row.disposition === type).length;
  return {
    proof: 'FIT_V3_SOURCE_RECONCILIATION_V1',
    scope: 'Source reconciliation against the accepted V1 generator; not a fresh production database audit.',
    counts: {movements: movements.size, approvedImages: images.size, sourceProtocols: rows.length,
      acceptedMovements: acceptedIds.size, acceptedProtocols: existing.length,
      existingUnchanged: count('existing-source-preserved'), existingChanged: count('existing-id-changed-draft'),
      newMovements: movements.size - acceptedIds.size, newProtocols: count('new-draft')},
    acceptedSourceSha256: digest(existing), guides, matrix, rows,
    productionChanged: false, publicationReady: false,
  };
}

// Parse units, not fitness suitability. A parse PASS never certifies that this
// dose is right for an individual or that generic published guidance validates it.
export function inspectDose(dose) {
  let match;
  if ((match = dose.match(/^(\d+) sets? × (\d+) reps?( per side| each direction| per lead foot)?(?:; (\d+)s rest between sets)?\.$/)))
    return {unit: 'repetitions', sets: +match[1], repetitions: +match[2], sideScope: (match[3] || 'total').trim(), restSeconds: +(match[4] || 0)};
  if ((match = dose.match(/^(\d+) bouts × (\d+)s( per side| each direction| per lead foot)?; (\d+)s rest between bouts\.$/)))
    return {unit: 'seconds', bouts: +match[1], seconds: +match[2], sideScope: (match[3] || 'total').trim(), restSeconds: +match[4]};
  if ((match = dose.match(/^(\d+) minutes continuous at an easy conversational pace\.$/)))
    return {unit: 'minutes', minutes: +match[1]};
  if ((match = dose.match(/^(\d+) minutes easy, then (\d+) × \((\d+) minute[s]? moderate \+ (\d+) minute[s]? easy\), then (\d+) minutes easy\.$/)))
    return {unit: 'interval_minutes', minutes: +match[1] + +match[2] * (+match[3] + +match[4]) + +match[5]};
  if (/^sets: \d+\n(?:reps|time seconds): \d+\nrest seconds: \d+$/.test(dose))
    return {unit: 'legacy_structured', values: Object.fromEntries(dose.split('\n').map((line) => {const [key, value] = line.split(': '); return [key, +value];}))};
  if ((match = dose.match(/^(\d+) × (\d+)-second (?:carries|forearm-plank holds); (\d+) seconds rest between (?:carries|holds)\.$/)))
    return {unit: 'seconds', bouts: +match[1], seconds: +match[2], restSeconds: +match[3]};
  if ((match = dose.match(/^(\d+) minutes easy continuous movement at a conversational pace\.$/)))
    return {unit: 'minutes', minutes: +match[1]};
  return null;
}

export function reviewFitV3Candidate(reconciliation) {
  const candidate = structuredClone(reconciliation);
  const corrections = [];
  const equivalents = new Map();
  for (const guide of candidate.guides) {
    if (guide.muscles.includes('; chest and anterior deltoids also assist dips') && guide.id !== 'assisted-dip') {
      corrections.push({movementId: guide.id, field: 'muscles', before: guide.muscles, after: 'Triceps brachii', reason: 'Remove dip-specific template text from an elbow-extension isolation guide.'});
      guide.muscles = 'Triceps brachii';
    }
    if (guide.id === '45-degree-sled-leg-press') {
      const repairs = {
        movementType: 'Strength timed sets',
        equipmentSetup: 'Sled leg-press machine. Follow the machine setup instructions and user-weight limit; adjust pads/seat and check the safety catches before starting. Keep the sled travel path clear.',
        space: 'The machine footprint and manufacturer-specified clearance, with unobstructed access and sled travel.',
        safety: 'Suitability review pending. Stop for pain, dizziness or unusual breathlessness; do not force range or train to failure. Keep the back and pelvis supported and use only a comfortable range. Obtain an equipment induction before using the machine.',
      };
      for (const [field, after] of Object.entries(repairs)) {corrections.push({movementId: guide.id, field, before: guide[field], after, reason: 'A 45-degree leg-press sled is a strength machine, not a turf sled/rope conditioning lane.'}); guide[field] = after;}
    }
  }
  for (const row of candidate.rows) {
    if (row.disposition === 'existing-source-preserved') continue;
    const before = structuredClone(row.proposedProtocol);
    const proposed = row.proposedProtocol;
    if (row.movementId === 'battle-rope-alternating-waves') {
      proposed.dose = proposed.dose.replace(' per side', '');
      proposed.instructions = proposed.instructions.replaceAll(' per side', '').replace('Complete all bouts on both sides/directions, with the stated rest after every bout.', 'Alternate both arms during each timed bout; the stated time covers both arms together. Rest after each bout.');
    }
    if (/\b1 reps\b/.test(proposed.dose)) {
      proposed.dose = proposed.dose.replace(/\b1 reps\b/, '1 rep');
      proposed.instructions = proposed.instructions.replace(/\b1 reps\b/, '1 rep');
    }
    if (row.movementId === '45-degree-sled-leg-press') {
      proposed.instructions += ' Perform controlled press-and-return repetitions during the timed set; this is not a static hold or a race against the clock.';
    }
    for (const field of ['dose', 'instructions']) if (before[field] !== proposed[field]) corrections.push({id: row.id, movementId: row.movementId, field, before: before[field], after: proposed[field], reason: row.movementId === 'battle-rope-alternating-waves' ? 'Both arms alternate in the same bout; remove the erroneous per-side multiplier.' : row.movementId === '45-degree-sled-leg-press' ? 'Clarify the existing timed draft without inventing a replacement prescription.' : 'Correct singular repetition wording; numbers unchanged.'});
    const guide = candidate.guides.find((item) => item.id === row.movementId);
    const {guideHash: previousGuideHash, image, ...writtenGuide} = guide;
    row.guideHash = digest(writtenGuide);
    guide.guideHash = row.guideHash;
    row.candidateSnapshotSha256 = digest({guide: writtenGuide, variant: proposed, imageSha256: row.imageSha256});
    const dose = inspectDose(proposed.dose);
    const issues = [];
    if (!dose) issues.push('Unrecognised dose syntax; explicit unit mapping required.');
    if (row.movementId === 'dumbbell-triceps-kickback') issues.push('Single-arm setup has no per-arm dose scope. Reviewer must decide total versus per-arm repetitions; doubling is not inferred.');
    if (row.movementId === '45-degree-sled-leg-press') issues.push('Trainer must decide whether the existing timed strength sets or a replacement repetition prescription suits the intended beginner audience.');
    const key = digest({movementId: row.movementId, name: proposed.name, dose: proposed.dose, instructions: proposed.instructions});
    const duplicateOf = equivalents.get(key) || null;
    if (!duplicateOf) equivalents.set(key, row.id);
    row.objectiveReview = {reviewer: 'Codex', scope: 'Editorial consistency, unit parsing, exact source comparison and explicit equipment/side-scope conflicts; not individual or professional clearance.',
      dose, issues, equivalentProtocolId: duplicateOf,
      status: issues.length || duplicateOf ? 'specific-review-required' : 'checked-within-scope'};
  }
  return {candidate, corrections, summary: {
    reviewedRecords: candidate.rows.filter((row) => row.objectiveReview).length,
    parsedDoses: candidate.rows.filter((row) => row.objectiveReview?.dose).length,
    specificIssues: candidate.rows.filter((row) => row.objectiveReview?.issues.length).map((row) => ({id: row.id, issues: row.objectiveReview.issues})),
    equivalentRecords: candidate.rows.filter((row) => row.objectiveReview?.equivalentProtocolId).length,
    correctedGuides: new Set(corrections.filter((row) => !row.id).map((row) => row.movementId)).size,
    correctedProtocols: new Set(corrections.filter((row) => row.id).map((row) => row.id)).size,
    correctedMovements: new Set(corrections.map((row) => row.movementId)).size,
    numericDosesInvented: 0, professionalApprovalClaimed: false,
  }};
}

// Additive by construction: existing objects retain their exact identity, bytes
// and order. Only new IDs are staged, always draft. Changed legacy IDs are never
// silently treated as additions and never enter this payload.
export function stageFitV3Additions(existingItems, reconciliation) {
  const ids = new Set(unique(existingItems, 'id', 'Existing item').keys());
  const additions = [];
  for (const row of reconciliation.rows.filter((row) => row.disposition === 'new-draft')) {
    assert.ok(!ids.has(row.id), `Refusing existing-ID overwrite: ${row.id}`);
    assert.ok(row.id.startsWith('SST-FIT-'), `New protocol identity not recognised: ${row.id}`);
    ids.add(row.id);
    additions.push({id: row.id, contentType: 'exercise', status: 'draft',
      data: {canonical_movement: row.movementId, guideHash: row.guideHash, protocol: {...row.proposedProtocol}},
      review: {status: 'pending', sourceSnapshotSha256: row.sourceSnapshotSha256,
        candidateSnapshotSha256: row.candidateSnapshotSha256 || row.sourceSnapshotSha256,
        objectiveReview: row.objectiveReview || null,
        required: [...requiredReview], memberServingAllowed: false},
    });
  }
  assert.equal(additions.length, reconciliation.counts.newProtocols);
  return {proof: 'FIT_V3_OFFLINE_ADDITIVE_DRAFTS_V1', publicationReady: false,
    existingItems: [...existingItems], additions,
    guides: reconciliation.guides.filter((guide) => additions.some((row) => row.data.canonical_movement === guide.id)),
    excludedReplacementIds: reconciliation.rows.filter((row) => row.disposition === 'existing-id-changed-draft').map((row) => row.id)};
}

export function loadFitV3Inputs() {
  return {workbook: read(sourceFiles[0]), assets: approvedFitPack(), accepted: read(sourceFiles[2]), source: buildIndustrialCatalogue().exercises};
}

export function writeFitV3Closeout(outDir) {
  const inputs = loadFitV3Inputs();
  const report = reconcileFitV3(inputs);
  const existing = inputs.source.filter((row) => report.rows.some((review) => review.id === row.id && review.currentSourceSha256));
  const reviewed = reviewFitV3Candidate(report);
  const staging = stageFitV3Additions(existing, reviewed.candidate);
  const fingerprints = Object.fromEntries(sourceFiles.map((file) => [file, digest(fs.readFileSync(file))]));
  fs.mkdirSync(outDir, {recursive: true});
  const write = (name, data) => fs.writeFileSync(path.join(outDir, name), typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n');
  write('summary.json', {proof: report.proof, scope: report.scope, counts: report.counts,
    acceptedSourceSha256: report.acceptedSourceSha256, sourceFiles: fingerprints,
    replacementIdsExcluded: staging.excludedReplacementIds.length, draftAdditions: staging.additions.length,
    objectiveReview: reviewed.summary,
    publicationReady: false, productionChanged: false,
    hashScope: 'Comparison hashes bind exact current generator objects and exact workbook snapshots. Historical workbook sourceHash values are retained as provenance, not claimed recomputed.'});
  write('protocol-review.json', {guides: report.guides, rows: report.rows});
  write('candidate-review.json', {guides: reviewed.candidate.guides, rows: reviewed.candidate.rows.filter((row) => row.objectiveReview), corrections: reviewed.corrections, summary: reviewed.summary});
  write('draft-additions.json', {...staging, existingItems: undefined});
  write('movement-review.md', '# Fit v3 exact review matrix\n\n300 images are approved. Existing accepted protocols remain live; these are source comparisons, not new clinical approvals.\n\n| Movement | Unchanged existing | Changed existing | New drafts | Required action |\n| --- | ---: | ---: | ---: | --- |\n' + report.matrix.map((row) => `| ${row.movementId} | ${row.existingUnchanged} | ${row.existingChanged} | ${row.newProtocols} | ${row.action} |`).join('\n') + '\n');
  write('checksums.json', Object.fromEntries(['summary.json', 'protocol-review.json', 'candidate-review.json', 'draft-additions.json', 'movement-review.md'].map((file) => [file, digest(fs.readFileSync(path.join(outDir, file)))])));
  return report.counts;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(writeFitV3Closeout(process.argv[2] || 'evidence/fit-v3-closeout-2026-09-16'), null, 2));
}
