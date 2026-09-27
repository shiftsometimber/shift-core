import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import crypto from 'node:crypto';
import { buildIndustrialCatalogue } from './industrial-catalogue-v14.js';
import { repairExpansionRecipe, proposeProtectedQuantityRevision, expansionTechnicalIssues, bindExpansionFamilies, digest, FOOD_SAFETY_SOURCE } from './grub-expansion-repairs-v1.mjs';

export const DEFAULT_COFID_INDEX = fileURLToPath(new URL('./tests/fixtures/grub-cofid-2021-governed-subset.json', import.meta.url));

export function buildExpansionReview({ pack, launch, decisions, foods, mappings, retainedGrams }) {
  const accepted = new Map(decisions.decisions.map(row => [row.template_digest, row]));
  if (decisions.proof !== 'M11_SECOND_PERSON_DECISIONS' || accepted.size !== 8 || launch.recipeIds.length !== 798) throw new Error('V1 authority count/marker mismatch');
  if (launch.templateDigests.some(key => accepted.get(key)?.decision !== 'PASS')) throw new Error('retained decisions do not match regenerated V1 digests');
  const protectedIds = new Set(launch.recipeIds);
  const rawById = new Map(buildIndustrialCatalogue().recipes.map(recipe => [recipe.id, recipe]));
  const protectedRows = pack.reviewable.filter(row => protectedIds.has(row.id));
  if (protectedIds.size !== 798 || protectedRows.length !== 798) throw new Error('protected V1 recipe reconciliation failed');
  const acceptedKeys = new Set();
  for (const family of pack.templateFamilies.filter(row => accepted.has(row.template_digest))) {
    const rows = pack.reviewable.filter(row => row.template_key === family.template_key);
    if (rows.some(row => !protectedIds.has(row.id))) throw new Error('accepted family escaped protected V1 cohort');
    for (const row of rows) {
      const keys = ['title', 'meal_type', 'servings', 'ingredients', 'method', 'equipment', 'allergens', 'storage', 'food_safety', 'nutrition', 'shift_says'];
      if (digest(Object.fromEntries(keys.map(key => [key, row[key]]))) !== row.content_hash) throw new Error(`protected V1 content hash mismatch: ${row.id}`);
    }
    if (digest({ key: family.template_key, contentHashes: rows.map(row => row.content_hash).sort() }) !== family.template_digest) throw new Error('protected V1 family digest mismatch');
    acceptedKeys.add(family.template_key);
  }
  if (acceptedKeys.size !== 8 || protectedRows.some(row => !acceptedKeys.has(row.template_key))) throw new Error('protected V1 family reconciliation failed');
  const candidates = pack.reviewable.filter(row => !protectedIds.has(row.id)).map(source => {
    const raw = rawById.get(source.id);
    const serving = Object.fromEntries(['prep_minutes', 'cook_minutes', 'tags', 'taxonomy', 'food_format'].map(key => [key, raw?.[key]]));
    const recipe = repairExpansionRecipe({ ...source, ...serving }, { foods, mappings, retainedGrams });
    recipe.technical_issues = expansionTechnicalIssues(recipe);
    if (recipe.technical_issues.length) recipe.review.status = 'technical_hold';
    return recipe;
  });
  const titleIds = new Map();
  for (const recipe of [...protectedRows, ...candidates]) {
    const key = recipe.title.toLowerCase().replace(/\s+/g, ' ').trim();
    const list = titleIds.get(key) || []; list.push(recipe.id); titleIds.set(key, list);
  }
  for (const recipe of candidates) {
    if (titleIds.get(recipe.title.toLowerCase().replace(/\s+/g, ' ').trim()).length > 1) {
      recipe.technical_issues.push('duplicate_recipe_title'); recipe.review.status = 'technical_hold';
    }
  }
  const families = bindExpansionFamilies(candidates);
  const repairCounts = {}, technicalIssueCounts = {};
  for (const recipe of candidates) {
    for (const code of recipe.expansion_repairs) repairCounts[code] = (repairCounts[code] || 0) + 1;
    for (const code of recipe.technical_issues) technicalIssueCounts[code] = (technicalIssueCounts[code] || 0) + 1;
  }
  const protectedQuantityIssues = protectedRows.filter(row => row.ingredients.some(ingredient => String(ingredient.amount).includes('+')))
    .map(row => ({ id: row.id, title: row.title, content_hash: row.content_hash,
      issues: row.ingredients.filter(ingredient => String(ingredient.amount).includes('+')).map(ingredient => ({ item: ingredient.item, amount: ingredient.amount, code: 'retained_first_component_quantity_parser' })) }));
  const protectedQuantityRevisions = protectedRows.filter(row => protectedQuantityIssues.some(issue => issue.id === row.id))
    .map(row => proposeProtectedQuantityRevision(row, { foods, mappings, retainedGrams }));
  const summary = {
    proof: 'GRUB_ADDITIVE_EXPANSION_REVIEW_V1', accepted_v1_preserved: protectedRows.length,
    source_catalogue: pack.summary.catalogue, source_semantic_ready: pack.summary.editorial_ready,
    source_quarantine: pack.editorialQuarantine.length, source_quarantine_issue_counts: pack.summary.editorial_issue_counts,
    additive_drafts: candidates.length, nutrition_recalculated: candidates.length,
    additional_template_decisions: families.length, template_decisions_recorded: 0,
    technical_hold_recipes: candidates.filter(row => row.technical_issues.length).length,
    technical_reviewable_recipes: candidates.filter(row => !row.technical_issues.length).length,
    technical_reviewable_families: families.filter(row => row.eligible_for_review).length,
    technicalIssueCounts, repairCounts,
    protected_quantity_issues_requiring_separate_revision: protectedQuantityIssues.length,
    publication_ready: false, production_mutated: false,
    remaining_approval: 'Human second-person acceptance under docs/SHIFT-MEMBER-HUMANNESS-STANDARD.md, bound to each exact recipe and family digest. Separate AI editorial reports are supporting evidence, not human acceptance. Existing V1 decisions do not authorise these drafts.',
    food_safety_source: FOOD_SAFETY_SOURCE
  };
  if (summary.additive_drafts !== 1873 || families.length !== 87 || summary.source_quarantine !== 205) throw new Error('unexpected expansion partition; review authority before continuing');
  return { summary, protected_v1: protectedRows.map(row => ({ id: row.id, content_hash: row.content_hash })), protectedQuantityIssues, protectedQuantityRevisions,
    quarantined: pack.editorialQuarantine, families, candidates };
}

const esc = text => String(text ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
export function renderReview(result) {
  const byId = new Map(result.candidates.map(recipe => [recipe.id, recipe]));
  const recipeCard = recipe => `<details><summary>${esc(recipe.title)} — ${esc(recipe.review.status)}</summary><p><code>${esc(recipe.id)}</code></p><ul>${recipe.ingredients.map(row => `<li>${esc(row.amount)} ${esc(row.item)}</li>`).join('')}</ul><ol>${recipe.method.map(step => `<li>${esc(step)}</li>`).join('')}</ol><p>Nutrition per serving: ${esc(JSON.stringify(recipe.nutrition))}</p><p>Allergens: ${esc(recipe.allergens.join(', '))}. Check ingredient labels.</p><p>${esc(recipe.storage.chilled)}</p><p>${esc(recipe.storage.reheat)}</p><p>Equipment: ${esc(recipe.equipment.join(', '))}</p><p>Food safety: ${esc(recipe.food_safety.join(' '))}</p><p>Repairs: ${esc(recipe.expansion_repairs.join(', '))}</p><p>Remaining issues: ${esc(recipe.technical_issues.join(', ') || 'No detected technical holds; human acceptance pending (AI review evidence is separate)')}</p><p>Content SHA-256: <code>${esc(recipe.content_hash)}</code></p></details>`;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Grub expansion review</title><style>body{max-width:1050px;margin:0 auto;padding:24px;font:16px/1.5 system-ui;background:#E7E3DA;color:#050505}h1,h2{line-height:1.2}article{border-top:3px solid #707762;margin-top:24px}details{padding:10px 0;border-bottom:1px solid #707762}summary{cursor:pointer}code{overflow-wrap:anywhere}button{font:inherit;padding:10px}small{display:block}</style><h1>Grub expansion — exact additive drafts</h1><p>${result.summary.accepted_v1_preserved} accepted recipes preserved. ${result.summary.additive_drafts} additional drafts in ${result.summary.additional_template_decisions} families. ${result.summary.technical_hold_recipes} drafts have technical holds. Zero new human approvals or publication actions.</p><p>Every recipe can be expanded below. The downloadable JSON retains ingredient-level CoFID evidence. Human second-person acceptance must cover all descendants and exact content hashes under the permanent SHIFT member humanness standard. Separate AI editorial reports support that review; they do not replace it. Technical holds require repair first.</p><p>Food storage evidence: <a href="${FOOD_SAFETY_SOURCE}">Food Standards Agency</a>.</p>${result.families.map((family, index) => `<article><h2>${index + 1}. ${esc(family.template_key)}</h2><p>${family.recipe_ids.length} recipes · ${family.eligible_for_review ? 'Awaiting human second-person acceptance' : 'Technical hold — '+esc(family.technical_holds.join(', '))}</p><p>Decision: PENDING. SHA-256: <code>${family.template_digest}</code></p>${family.recipe_ids.map(id => recipeCard(byId.get(id))).join('')}</article>`).join('')}</html>`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const out = path.resolve(process.env.GRUB_EXPANSION_DIR || 'evidence/grub-expansion-closeout-2026-09-16');
  const indexPath = process.env.COFID_INDEX || DEFAULT_COFID_INDEX;
  process.env.COFID_INDEX = indexPath;
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'grub-expansion-authority-'));
  execFileSync(process.execPath, ['grub-editorial-review-surface.mjs'], { stdio: 'pipe', env: { ...process.env, REVIEW_PACK_DIR: temp } });
  const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
  const { APPROVED, grams } = await import('./industrial-grub-systemic-v3.mjs');
  const result = buildExpansionReview({ pack: read(path.join(temp, 'grub-second-person-review-pack.json')),
    launch: read(path.join(temp, 'grub-v1-launch-cohort.json')), decisions: read('evidence/grub-v1-final-decisions-2026-08-14.json'),
    foods: new Map(read(indexPath).foods.map(food => [String(food.code), food])), mappings: APPROVED, retainedGrams: grams });
  result.summary.cofid_index_sha256 = crypto.createHash('sha256').update(fs.readFileSync(indexPath)).digest('hex');
  result.summary.cofid_provenance = read(indexPath).provenance || { source_url: read(indexPath).source_url };
  fs.mkdirSync(out, { recursive: true });
  const candidateName = 'grub-additive-candidate.json.gz';
  fs.writeFileSync(path.join(out, candidateName), gzipSync(JSON.stringify(result), { level: 9 }));
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(result.summary, null, 2) + '\n');
  fs.writeFileSync(path.join(out, 'required-decisions.json'), JSON.stringify({ proof: 'GRUB_ADDITIVE_PENDING_DECISIONS_V1', approved: false, families: result.families }, null, 2) + '\n');
  fs.writeFileSync(path.join(out, 'protected-quantity-review.json'), JSON.stringify(result.protectedQuantityIssues, null, 2) + '\n');
  fs.writeFileSync(path.join(out, 'protected-quantity-revisions.json'), JSON.stringify({ proof: 'GRUB_PROTECTED_QUANTITY_REVISION_PACK_V1', publication_ready: false, revisions: result.protectedQuantityRevisions }, null, 2) + '\n');
  fs.writeFileSync(path.join(out, 'grub-expansion-review.html'), renderReview(result));
  fs.writeFileSync(path.join(out, 'content-fingerprints.json'), JSON.stringify({ accepted: result.protected_v1, additive: result.candidates.map(row => ({ id: row.id, content_hash: row.content_hash })) }, null, 2) + '\n');
  console.log(JSON.stringify(result.summary, null, 2));
}
