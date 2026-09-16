import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { compoundGrams, repairExpansionRecipe, recalculateNutrition, EXPANSION_MAPPING_OVERRIDES, expansionTechnicalIssues, bindExpansionFamilies } from '../grub-expansion-repairs-v1.mjs';
import { buildExpansionReview, renderReview, DEFAULT_COFID_INDEX } from '../grub-expansion-review-pack.mjs';

process.env.COFID_INDEX ||= DEFAULT_COFID_INDEX;
const { APPROVED, grams } = await import('../industrial-grub-systemic-v3.mjs');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'grub-expansion-test-'));
execFileSync(process.execPath, ['grub-editorial-review-surface.mjs'], { stdio: 'pipe', env: { ...process.env, REVIEW_PACK_DIR: temp } });
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const options = { pack: read(path.join(temp, 'grub-second-person-review-pack.json')), launch: read(path.join(temp, 'grub-v1-launch-cohort.json')),
  decisions: read('evidence/grub-v1-final-decisions-2026-08-14.json'),
  foods: new Map(read(process.env.COFID_INDEX).foods.map(row => [String(row.code), row])), mappings: APPROVED, retainedGrams: grams };
const before = JSON.stringify(options.pack);
const result = buildExpansionReview(options);

test('additive partition preserves all 798 accepted records and 205 quarantined recipes', () => {
  assert.equal(JSON.stringify(options.pack), before);
  const protectedIds = new Set(result.protected_v1.map(row => row.id));
  const quarantined = new Set(result.quarantined.map(row => row.id));
  assert.equal(protectedIds.size, 798);
  assert.equal(result.candidates.length, 1873);
  assert.equal(quarantined.size, 205);
  assert.ok(result.candidates.every(row => !protectedIds.has(row.id) && !quarantined.has(row.id)));
  assert.equal(result.families.length, 87);
  assert.equal(result.summary.publication_ready, false);
  assert.ok(result.candidates.every(row => row.status === 'draft' && !row.review.approved));
});

test('compound quantity arithmetic counts both additions and only one slash equivalence', () => {
  assert.ok(Math.abs(compoundGrams('5ml + 1 tsp / 5ml', 'olive oil', grams) - 9.2) < 1e-9);
  assert.ok(Math.abs(compoundGrams('1/2 tsp + 1/2 tsp / 1g', 'ground cinnamon', grams) - 2.3) < 1e-9);
  assert.throws(() => compoundGrams('5ml + unknown', 'olive oil', grams), /unresolved quantity/);
  const id = 'industrial-v3-breakfast-hash-hash-brown-bacon';
  const source = options.pack.reviewable.find(row => row.id === id);
  const repaired = result.candidates.find(row => row.id === id);
  assert.equal(repaired.ingredients.find(row => row.item === 'olive oil').amount, '10ml');
  const halfOil = structuredClone(repaired);
  halfOil.ingredients.find(row => row.item === 'olive oil').amount = '5ml';
  const control = recalculateNutrition(halfOil, options.foods, { ...APPROVED, ...EXPANSION_MAPPING_OVERRIDES }, grams).nutrition;
  assert.ok(Math.abs(repaired.nutrition.kcal - control.kcal - 41.4) < 0.11);
  assert.ok(Math.abs(repaired.nutrition.fat_g - control.fat_g - 4.6) < 0.11);
  assert.equal(result.candidates.filter(row => row.expansion_repairs.includes('compound_quantity_summed_and_nutrition_recalculated')).length, 13);
  assert.equal(result.protectedQuantityIssues.length, 12);
});

test('rice safety and cooked assembly are explicit without changing dry input quantities', () => {
  const riceRecipes = result.candidates.filter(row => row.ingredients.some(ingredient => /\brice\b/i.test(ingredient.item)));
  assert.equal(riceRecipes.length, 284);
  assert.ok(riceRecipes.every(row => /one hour/.test(row.storage.chilled) && /24 hours/.test(row.storage.chilled)));
  const bowl = result.candidates.find(row => row.id === 'industrial-lunch-chicken-rice-bowl');
  assert.equal(bowl.ingredients.find(row => row.item === 'brown rice, dry').amount, '75g dry');
  assert.ok(bowl.method.some(step => /hot cooked rice/.test(step)));
  assert.ok(bowl.method.some(step => /dry(?:, uncooked)? weight/.test(step)));
});

test('protected oil corrections are exact versioned proposals and leave all other content unchanged', () => {
  assert.equal(result.protectedQuantityRevisions.length, 12);
  for (const revision of result.protectedQuantityRevisions) {
    const source = options.pack.reviewable.find(row => row.id === revision.source_id);
    assert.equal(revision.expected_current_content_hash, source.content_hash);
    assert.notEqual(revision.proposed_content_hash, source.content_hash);
    assert.equal(revision.status, 'draft');
    assert.equal(revision.publication_ready, false);
    assert.equal(revision.approved, false);
    assert.equal(revision.changes.length, 1);
    assert.deepEqual(revision.changes[0], { item: 'olive oil', before_amount: '5ml + 1 tsp / 5ml', after_amount: '10ml', after_grams: 9.2 });
    assert.equal(revision.nutrition_delta.fat_g, 4.6);
    assert.ok(revision.nutrition_delta.kcal >= 40);
    for (const key of revision.retained_fields_unchanged) assert.deepEqual(revision.proposed_content[key], source[key]);
    assert.equal(revision.proposed_content.ingredients.filter(row => row.item === 'olive oil')[0].amount, '10ml');
  }
  assert.equal(JSON.stringify(options.pack), before);
});

test('known allergens, unlisted orange zest and duplicate words are repaired', () => {
  const mayo = result.candidates.find(row => row.id === 'industrial-v3-bagel-classic-chicken');
  assert.ok(mayo.allergens.includes('egg'));
  const orange = result.candidates.find(row => row.id === 'industrial-snack-yoghurt-pot-orange');
  assert.ok(orange.method.some(step => /orange juice/.test(step)));
  assert.ok(!orange.method.some(step => /orange zest/.test(step)));
  const apple = result.candidates.find(row => row.id === 'industrial-snack-apple-protein-snack-apple');
  assert.equal(apple.title, 'Apple Protein Snack');
});

test('technical holds cannot masquerade as completed editorial review', () => {
  const generic = result.candidates.find(row => row.id === 'industrial-v3-curry-curry-house-chicken');
  assert.deepEqual(expansionTechnicalIssues(generic), []);
  assert.equal(generic.review.status, 'awaiting_second_person_review');
  const family = result.families.find(row => row.recipe_ids.includes(generic.id));
  assert.equal(family.eligible_for_review, true);
  assert.equal(family.required_decision, 'PENDING');
  assert.equal(result.summary.template_decisions_recorded, 0);
  const salmon = result.candidates.find(row => row.id === 'industrial-v3-chilli-curry-house-salmon');
  assert.equal(salmon.review.status, 'awaiting_second_person_review');
  assert.deepEqual(salmon.technical_issues, []);
  const mutation = { ...salmon, method: ['Finish the base of the meal, then add the salmon.'] };
  assert.ok(expansionTechnicalIssues(mutation).includes('method_requires_format_specific_authoring'));
  assert.equal(result.summary.technical_hold_recipes, 0);
});

test('raw/cooked food identities, expected allergens and real resting times are explicit', () => {
  const get = id => result.candidates.find(row => row.id === id);
  const stirFry = get('industrial-v3-stir-fry-teriyaki-salmon');
  assert.ok(stirFry.ingredients.some(row => row.item === 'dried egg noodles'));
  for (const allergen of ['fish', 'egg', 'gluten', 'soya']) assert.ok(stirFry.allergens.includes(allergen));
  const turkey = get('industrial-v3-burger-classic-turkey');
  assert.ok(turkey.ingredients.some(row => row.item === '100% turkey breast mince, raw'));
  assert.equal(turkey.ingredient_evidence.find(row => row.item === '100% turkey breast mince, raw').cofid_code, '18-349');
  const bacon = get('industrial-v3-breakfast-hash-classic-bacon');
  assert.equal(bacon.ingredient_evidence.find(row => row.item === 'lean back bacon').cofid_code, '19-646');
  const chips = get('industrial-v3-loaded-fries-classic-chicken');
  assert.equal(chips.ingredients.find(row => row.item === 'oven chips').amount, '250g cooked');
  const roast = get('industrial-v3-roast-chilli-chicken');
  assert.equal(roast.ingredient_evidence.find(row => row.item === 'potatoes, peeled, raw').cofid_code, '13-489');
  const oats = result.candidates.filter(row => row.authoring_notes?.some(note => note.code === 'measured_overnight_oat_milk_added'));
  assert.equal(oats.length, 51);
  assert.ok(oats.every(row => row.ingredients.some(ingredient => ingredient.item === 'semi-skimmed milk' && ingredient.amount === '210ml') && row.allergens.includes('milk') && row.total_minutes >= 360));
  assert.ok(result.candidates.every(row => row.total_minutes === row.prep_minutes + row.cook_minutes + row.rest_minutes));
  assert.ok(result.candidates.filter(row => row.total_minutes > 25).every(row => row.taxonomy.prep_band !== 'quick' && !row.tags.some(tag => /^(quick|fast)(?:[-_ ]|$)/i.test(tag))));
  assert.ok(result.candidates.every(row => !['practical', 'work-meal', 'portion-controlled', 'prepared-meal'].includes(row.food_format)));
});

test('single reheating and pasta-bake cooking instructions survive generic repair stages', () => {
  const hash = result.candidates.find(row => row.id === 'industrial-breakfast-potato-hash-banana-cocoa-1');
  assert.equal(hash.food_format, 'potato-hash');
  assert.match(hash.storage.reheat, /Do not cool and reheat/);
  const toastie = result.candidates.find(row => row.id === 'industrial-v3-toastie-classic-chicken');
  assert.match(toastie.storage.reheat, /Do not|do not|once/i);
  const pasta = result.candidates.find(row => row.id === 'industrial-dinner-chicken-pasta-bake');
  assert.ok(pasta.method.some(step => /2 minutes less/.test(step)));
  assert.ok(!pasta.method.some(step => /Cook it following its packet instructions before adding/.test(step)));
});

test('half-boundary nutrition uses exact decimal totals before rounding per serving', () => {
  const curry = result.candidates.find(row => row.id === 'industrial-dinner-chicken-curry');
  assert.equal(curry.nutrition.kcal, 531.4);
  const wrap = result.candidates.find(row => row.id === 'industrial-lunch-chicken-wholemeal-wrap');
  assert.equal(wrap.nutrition.protein_g, 46.7);
});

test('changed content or approvals cannot reuse accepted V1 authority', () => {
  const bad = structuredClone(options.pack);
  bad.reviewable.find(row => row.id === options.launch.recipeIds[0]).title += ' changed';
  assert.throws(() => buildExpansionReview({ ...options, pack: bad }), /protected V1 content hash mismatch/);
  const decisions = structuredClone(options.decisions); decisions.decisions[0].decision = 'FIX';
  assert.throws(() => buildExpansionReview({ ...options, decisions }), /retained decisions/);
});

test('expansion digest includes title, evidence and technical-hold changes', () => {
  const source = result.candidates.find(row => !row.technical_issues.length);
  const original = bindExpansionFamilies([structuredClone(source)])[0].template_digest;
  for (const mutate of [row => { row.title += ' changed'; }, row => { row.ingredient_evidence[0].grams += 1; }, row => { row.technical_issues.push('new_hold'); }]) {
    const changed = structuredClone(source); mutate(changed);
    assert.notEqual(bindExpansionFamilies([changed])[0].template_digest, original);
  }
});

test('review surface includes every candidate, exact digests and pending status', () => {
  const html = renderReview(result);
  assert.equal((html.match(/<details>/g) || []).length, 1873);
  for (const family of result.families) assert.ok(html.includes(family.template_digest));
  assert.ok(html.includes('Zero new human approvals or publication actions'));
});
