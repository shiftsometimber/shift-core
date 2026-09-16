// Read-only verification of recorded editorial decisions. This script never
// creates PASS decisions, human approval, publication data or database writes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

const SCOPES = ['title', 'ingredients', 'method', 'equipment', 'allergens', 'nutrition', 'storage', 'food_safety', 'serving_metadata'];
const sha = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const need = (condition, message) => { if (!condition) throw new Error(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sorted = values => [...values].sort();
const descendants = rows => rows.map(({ id, content_hash }) => ({ id, content_hash })).sort((a, b) => a.id.localeCompare(b.id));
function indexed(rows, key, label) {
  need(Array.isArray(rows), `${label}: array required`);
  const map = new Map();
  for (const row of rows) {
    need(typeof row?.[key] === 'string' && row[key] && !map.has(row[key]), `${label}: duplicate or missing ${key}`);
    map.set(row[key], row);
  }
  return map;
}

export function verifyGrubCloseoutReviews({ candidate, candidateSha, report, authorship, human, fingerprints, fixtureSha }) {
  need(candidate?.summary?.proof === 'GRUB_ADDITIVE_EXPANSION_REVIEW_V1', 'Candidate proof missing');
  const recipes = indexed(candidate.candidates, 'id', 'Candidate');
  const families = indexed(candidate.families, 'template_key', 'Candidate families');
  const protectedRows = indexed(candidate.protected_v1, 'id', 'Protected cohort');
  const quarantine = indexed(candidate.quarantined, 'id', 'Quarantine');
  need(recipes.size === 1873 && families.size === 87 && protectedRows.size === 798 && quarantine.size === 205, 'Catalogue partition changed');
  need(candidate.summary.publication_ready === false && candidate.summary.production_mutated === false, 'Candidate must remain staged');
  need(same(descendants(fingerprints.accepted), descendants(candidate.protected_v1)), 'Protected fingerprints changed');
  need(same(descendants(fingerprints.additive), descendants(candidate.candidates)), 'Additive fingerprints changed');
  for (const id of protectedRows.keys()) need(!quarantine.has(id), `Protected/quarantine overlap: ${id}`);

  need(report?.proof === 'GRUB_INDEPENDENT_EDITORIAL_REVIEW_V1', 'Recorded independent review required');
  need(report.source_candidate_sha256 === candidateSha && authorship.source_candidate_sha256 === candidateSha, 'Review or authorship is bound to a different candidate');
  need(report.publication_authority === false && report.human_editorial_acceptance === 'pending', 'AI review must not represent human or publication approval');
  need(authorship.proof === 'GRUB_ADDITIVE_AUTHORSHIP_V1', 'Authorship proof missing');
  const decisions = indexed(report.decisions, 'id', 'Recorded decisions');
  const familyDecisions = indexed(report.families, 'template_key', 'Recorded family decisions');
  const authors = indexed(authorship.recipes, 'id', 'Authorship');
  const reviewers = indexed(report.reviewers, 'id', 'Reviewer registry');
  need(decisions.size === recipes.size && authors.size === recipes.size && familyDecisions.size === families.size, 'Recorded review coverage is incomplete');
  need(report.summary?.recipes === 1873 && report.summary.pass === 1873 && report.summary.fix === 0 && report.summary.complete_families === 87, 'Review summary does not match complete coverage');

  for (const [id, recipe] of recipes) {
    need(!protectedRows.has(id) && !quarantine.has(id), `Candidate overlaps preserved cohort: ${id}`);
    need(recipe.content_hash === sha(Object.fromEntries(Object.entries(recipe).filter(([key]) => key !== 'content_hash'))), `Recipe content hash mismatch: ${id}`);
    need(recipe.status === 'draft' && recipe.review?.approved === false && recipe.review.status === 'awaiting_second_person_review', `Candidate state changed: ${id}`);
    need(Array.isArray(recipe.technical_issues) && recipe.technical_issues.length === 0, `Technical hold: ${id}`);
    const decision = decisions.get(id), author = authors.get(id);
    need(decision?.decision === 'PASS' && decision.content_hash === recipe.content_hash, `Exact recorded PASS missing: ${id}`);
    need(author?.content_hash === recipe.content_hash && Array.isArray(author.author_ids) && author.author_ids.length && author.author_ids.every(value => typeof value === 'string' && value.trim()) && new Set(author.author_ids).size === author.author_ids.length, `Exact authorship missing: ${id}`);
    need(Array.isArray(decision.author_ids) && same(sorted(decision.author_ids), sorted(author.author_ids)), `Decision author roster mismatch: ${id}`);
    need(Array.isArray(report.author_roster?.[id]) && same(sorted(report.author_roster[id]), sorted(author.author_ids)), `Consolidated author roster mismatch: ${id}`);
    need(decision.reviewer?.kind === 'ai' && reviewers.get(decision.reviewer.id)?.kind === 'ai' && !author.author_ids.includes(decision.reviewer.id), `Independent AI reviewer required: ${id}`);
    need(Number.isFinite(Date.parse(decision.reviewed_at)), `Review timestamp missing: ${id}`);
    need(Array.isArray(decision.scopes) && SCOPES.every(scope => decision.scopes.includes(scope)) && Array.isArray(decision.findings) && decision.findings.length === 0, `Incomplete review scopes or unresolved finding: ${id}`);
  }

  need(human?.proof === 'GRUB_ADDITIVE_HUMAN_ACCEPTANCE_V1' && human.status === 'pending' && human.policy_source === 'docs/SHIFT-MEMBER-HUMANNESS-STANDARD.md', 'Pending human review scaffold required');
  const humanFamilies = indexed(human.families, 'template_key', 'Human scaffold');
  need(humanFamilies.size === families.size, 'Human scaffold coverage changed');
  const seen = new Set();
  for (const [key, family] of families) {
    const members = [...recipes.values()].filter(recipe => recipe.template_key === key);
    const expected = descendants(members);
    need(members.length && same(sorted(family.recipe_ids), sorted(members.map(recipe => recipe.id))), `Family membership mismatch: ${key}`);
    need(family.template_digest === sha({ scope: 'GRUB_ADDITIVE_EXPANSION_V1', key, descendants: expected }), `Family digest mismatch: ${key}`);
    need(family.eligible_for_review === true && Array.isArray(family.technical_holds) && family.technical_holds.length === 0, `Family technical hold: ${key}`);
    const decision = familyDecisions.get(key), pending = humanFamilies.get(key);
    need(decision?.decision === 'PASS' && decision.coverage_complete === true && decision.template_digest === family.template_digest && same(descendants(decision.descendants), expected), `Exact full family review missing: ${key}`);
    need(pending?.template_digest === family.template_digest && same(descendants(pending.recipes), expected), `Human scaffold hash mismatch: ${key}`);
    need(pending.decision === 'PENDING' && pending.reviewer === null && pending.reviewed_at === null && Array.isArray(pending.scopes) && pending.scopes.length === 0 && Array.isArray(pending.findings) && pending.findings.length === 0, `Human approval must remain unclaimed: ${key}`);
    need(Array.isArray(pending.required_scopes) && [...SCOPES, 'member_humanness'].every(scope => pending.required_scopes.includes(scope)), `Human required scopes missing: ${key}`);
    members.forEach(recipe => seen.add(recipe.id));
  }
  need(seen.size === recipes.size, 'Recipe omitted from family coverage');
  const audit = report.independent_arithmetic;
  need(audit?.candidate_sha256 === candidateSha && audit.fixture_sha256 === fixtureSha && audit.recipes === 1873 && audit.nutrient_fields === 9365 && audit.fixture_foods === 113, 'Independent arithmetic evidence is stale or incomplete');
  for (const field of ['fixture_primary_discrepancies', 'quantity_discrepancies', 'nutrient_discrepancies']) need(Array.isArray(audit[field]) && audit[field].length === 0, `Independent arithmetic discrepancy: ${field}`);
  return { proof: 'GRUB_CLOSEOUT_REVIEW_VERIFICATION_V1', recipes: recipes.size, families: families.size, protected: protectedRows.size, quarantined: quarantine.size, candidate_sha256: candidateSha, publication_authority: false, human_acceptance: 'pending' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const dir = path.join(root, 'evidence/grub-expansion-closeout-2026-09-16');
  const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  const bytes = fs.readFileSync(path.join(dir, 'grub-additive-candidate.json.gz'));
  const result = verifyGrubCloseoutReviews({
    candidate: JSON.parse(gunzipSync(bytes)), candidateSha: sha(bytes),
    report: read('independent-editorial-review.json'), authorship: read('authorship.json'),
    human: read('human-acceptance-required.json'), fingerprints: read('content-fingerprints.json'),
    fixtureSha: sha(fs.readFileSync(path.join(root, 'tests/fixtures/grub-cofid-2021-governed-subset.json'))),
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
