// Additive authoring only. Never import this module into the accepted V1 builder.
import crypto from 'node:crypto';
import { repairFakeawayMethod } from './grub-expansion-methods-fakeaway-v1.mjs';
import { repairPanMethod } from './grub-expansion-methods-pan-v1.mjs';
import { repairOvenMethod } from './grub-expansion-methods-oven-v1.mjs';
import { repairBreakfastRecipe } from './grub-expansion-methods-breakfast-v1.mjs';
import { repairLunchMethod } from './grub-expansion-methods-lunch-v1.mjs';

export const FOOD_SAFETY_SOURCE = 'https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker';
export const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const EXPANSION_MAPPING_OVERRIDES = {
  'lean back bacon': { code: '19-646', state: 'exact', confidence: 'high', basis: 'Raw back-bacon rashers with visible fat trimmed; weighed raw before cooking, matching the revised preparation instruction.' },
  '100% turkey breast mince, raw': { code: '18-349', state: 'approved_canonical_proxy', confidence: 'medium', basis: 'The revised ingredient is explicitly unseasoned 100% raw skinless turkey breast mince; raw turkey light meat is the existing governed macro analogue.', limitation: 'CoFID identifies raw light meat rather than an anatomical breast-only minced product. Mixed dark-meat/commercial mince is not this ingredient.' },
  'dried egg noodles': { code: '11-719', state: 'exact', confidence: 'high', basis: 'Explicit dried egg noodles weighed dry, matching the CoFID raw dried egg-noodle identity; egg and gluten are declared.' },
  'potatoes, peeled, raw': { code: '13-489', state: 'exact', confidence: 'high', basis: 'Raw peeled old potatoes weighed before parboiling/roasting; excludes skin and added oil, which is measured separately.' }
};
const nutrients = ['kcal', 'protein_g', 'carbohydrate_g', 'fat_g', 'fibre_g'];
const round = n => Math.round((n + Number.EPSILON) * 10) / 10;
const DECIMAL_SCALE = 1_000_000_000n;
const decimalUnits = value => BigInt(Number(value).toFixed(9).replace('.', ''));
const unique = values => [...new Set(values)].sort();

// The retained parser consumes the first mass/volume in a joined quantity.
// Split addition first; slash pairs (1 tsp / 5ml) are equivalent measures.
export function compoundGrams(amount, item, retainedGrams) {
  const parts = String(amount).split('+').map(x => x.trim());
  const weights = parts.map(part => retainedGrams(part, item));
  if (weights.some(x => !Number.isFinite(x) || x <= 0)) throw new Error(`unresolved quantity: ${item}: ${amount}`);
  return weights.reduce((sum, value) => sum + value, 0);
}

export function recalculateNutrition(recipe, foods, mappings, retainedGrams) {
  // Exact fixed-decimal accumulation prevents binary floating point turning
  // e.g. 531.35 kcal into 531.349999... and rounding it down by 0.1.
  const totals = Object.fromEntries(nutrients.map(key => [key, 0n]));
  const evidence = recipe.ingredients.map(ingredient => {
    const mapping = mappings[ingredient.item];
    const food = mapping && foods.get(String(mapping.code));
    if (!food) throw new Error(`missing retained CoFID mapping: ${ingredient.item}`);
    const weight = compoundGrams(ingredient.amount, ingredient.item, retainedGrams);
    for (const key of nutrients) {
      if (!Number.isFinite(Number(food[key]))) throw new Error(`invalid CoFID ${key}: ${ingredient.item}`);
      totals[key] += decimalUnits(food[key]) * decimalUnits(weight);
    }
    return { item: ingredient.item, amount: ingredient.amount, grams: round(weight), cofid_code: food.code,
      cofid_name: food.name, mapping_state: mapping.state, mapping_confidence: mapping.confidence,
      mapping_basis: mapping.basis, ...(mapping.limitation ? { mapping_limitation: mapping.limitation } : {}) };
  });
  const servings = Number(recipe.servings);
  if (!Number.isFinite(servings) || servings <= 0) throw new Error(`invalid servings: ${recipe.id}`);
  const denominator = 100n * DECIMAL_SCALE * decimalUnits(servings);
  const perServing = total => Number((total * 10n + denominator / 2n) / denominator) / 10;
  return { nutrition: Object.fromEntries(nutrients.map(key => [key, perServing(totals[key])])), ingredient_evidence: evidence };
}

export function proposeProtectedQuantityRevision(source, { foods, mappings, retainedGrams }) {
  const corrected = structuredClone(source);
  const changes = [];
  corrected.ingredients = corrected.ingredients.map(row => {
    if (!String(row.amount).includes('+')) return row;
    const weight = compoundGrams(row.amount, row.item, retainedGrams);
    const amount = row.item === 'olive oil' ? `${round(weight / 0.92)}ml` : `${round(weight)}g`;
    changes.push({ item: row.item, before_amount: row.amount, after_amount: amount, after_grams: round(weight) });
    return { ...row, amount };
  });
  if (!changes.length) throw new Error(`no compound quantity to revise: ${source.id}`);
  Object.assign(corrected, recalculateNutrition(corrected, foods, mappings, retainedGrams));
  const contentKeys = ['title', 'meal_type', 'servings', 'ingredients', 'method', 'equipment', 'allergens', 'storage', 'food_safety', 'nutrition', 'shift_says'];
  const content = Object.fromEntries(contentKeys.map(key => [key, corrected[key]]));
  const proposal = {
    proof: 'GRUB_PROTECTED_QUANTITY_CORRECTION_V1', source_id: source.id,
    revision_id: `${source.id}@compound-quantity-v1`, status: 'draft', approved: false,
    expected_current_content_hash: source.content_hash,
    proposed_content_hash: digest(content), changes,
    before_nutrition: source.nutrition, after_nutrition: corrected.nutrition,
    nutrition_delta: Object.fromEntries(nutrients.map(key => [key, round(corrected.nutrition[key] - source.nutrition[key])])),
    proposed_content: content, ingredient_evidence: corrected.ingredient_evidence,
    retained_fields_unchanged: contentKeys.filter(key => !['ingredients', 'nutrition'].includes(key)),
    required_review: 'Independent approval of this exact versioned revision, followed by a new immutable publication authority; no original PASS decision is inherited.',
    publication_ready: false
  };
  return { ...proposal, correction_digest: digest(proposal) };
}

function additionalAllergens(ingredients) {
  // Known identities only; this is deliberately not an allergy-free claim.
  const rules = [[/\b(salmon|tuna)\b/i, 'fish'], [/\bprawns?\b/i, 'crustaceans'],
    [/\b(milk|yoghurt|cheddar|cottage cheese|cream cheese|creme fraiche)\b/i, 'milk'],
    [/\b(eggs?|mayonnaise|mayo)\b/i, 'egg'], [/\bpeanut/i, 'peanuts'], [/\bmustard\b/i, 'mustard'],
    [/\b(tofu|soy sauce|teriyaki|hoisin)\b/i, 'soya'], [/wholewheat|wholemeal|wholegrain crackers|\boats\b|\bcouscous\b|soy sauce|teriyaki|hoisin/i, 'gluten']];
  return unique(ingredients.flatMap(row => [...(row.allergens || []), ...rules.filter(([pattern]) => pattern.test(row.item)).map(([, allergen]) => allergen)]));
}

export function repairExpansionRecipe(source, { foods, mappings, retainedGrams }) {
  const recipe = structuredClone(source);
  const repairs = [];
  let authoredStorage = {};
  recipe.ingredients = recipe.ingredients.map(row => {
    if (!String(row.amount).includes('+')) return row;
    const weight = compoundGrams(row.amount, row.item, retainedGrams);
    repairs.push('compound_quantity_summed_and_nutrition_recalculated');
    return { ...row, amount: row.item === 'olive oil' ? `${round(weight / 0.92)}ml` : `${round(weight)}g` };
  });
  const compositeDressings = {
    'mustard mayo': [['light mayonnaise', 0.8], ['wholegrain mustard', 0.2]],
    'light Caesar dressing': [['0% Greek yoghurt', 0.6], ['light mayonnaise', 0.3], ['reduced-fat cheddar', 0.1]],
    'smoked paprika dressing': [['0% Greek yoghurt', 0.9], ['lemon juice', 1 / 15], ['smoked paprika', 1 / 30]]
  };
  recipe.ingredients = recipe.ingredients.flatMap(row => {
    const parts = compositeDressings[row.item];
    if (!parts) return [row];
    const weight = compoundGrams(row.amount, row.item, retainedGrams);
    let used = 0;
    const components = parts.map(([item, fraction], index) => {
      const grams = index === parts.length - 1 ? round(weight - used) : round(weight * fraction);
      used += grams;
      return { item, amount: `${grams}g` };
    });
    if (row.item === 'light Caesar dressing') recipe.title = recipe.title.replace(/Caesar/g, 'Creamy Cheddar');
    repairs.push('opaque_dressing_replaced_with_measured_components');
    return components;
  });
  for (const repair of [repairBreakfastRecipe, repairLunchMethod, repairFakeawayMethod, repairPanMethod, repairOvenMethod]) {
    const change = repair(recipe);
    if (!change) continue;
    Object.assign(recipe, change);
    authoredStorage = change.storage || {};
    repairs.push('format_specific_method_authored');
    if (change.title && change.title !== source.title) repairs.push('title_matches_ingredients');
    break;
  }
  recipe.ingredients = recipe.ingredients.map(row => {
    if (row.item === 'turkey mince') { repairs.push('raw_turkey_breast_mince_identity'); return { ...row, item: '100% turkey breast mince, raw' }; }
    if (row.item === 'wholewheat noodles') { repairs.push('explicit_dried_egg_noodles_identity'); return { ...row, item: 'dried egg noodles', allergens: unique([...(row.allergens || []), 'egg', 'gluten']) }; }
    if (row.item === 'roast potatoes') { repairs.push('raw_peeled_potatoes_roasted_from_scratch'); return { ...row, item: 'potatoes, peeled, raw' }; }
    if (row.item === 'oven chips') { repairs.push('oven_chip_portion_weighed_cooked'); return { ...row, amount: `${compoundGrams(row.amount, row.item, retainedGrams)}g cooked` }; }
    if (row.item === 'lean back bacon') repairs.push('raw_trimmed_bacon_nutrition_identity');
    return row;
  });
  recipe.method = recipe.method.map(step => step.replace(/\bturkey mince\b/g, 'turkey breast mince').replace(/wholewheat noodles/g, 'egg noodles'));
  if (recipe.ingredients.some(row => row.item === '100% turkey breast mince, raw')) recipe.method.unshift('Use unseasoned mince made from 100% skinless turkey breast, weighed raw. Commercial mixed-cut turkey mince is not the specified ingredient; ask the butcher for breast mince or mince skinless breast at home.');
  if (recipe.ingredients.some(row => row.item === 'lean back bacon')) recipe.method.unshift('Trim visible fat from the back-bacon rashers and weigh the listed portion raw before cooking.');
  const allergens = unique([...(recipe.allergens || []), ...additionalAllergens(recipe.ingredients)]);
  if (JSON.stringify(allergens) !== JSON.stringify(unique(recipe.allergens || []))) repairs.push('known_ingredient_allergens_restored');
  recipe.allergens = allergens;
  const rice = recipe.ingredients.some(row => /\brice\b/i.test(row.item));
  recipe.storage = {
    ...(recipe.storage || {}),
    chilled: rice
      ? 'Divide leftover rice into shallow portions and chill quickly, ideally within one hour. Refrigerate and eat within 24 hours; follow any shorter ingredient use-by date.'
      : 'Cover and refrigerate prepared food promptly. Eat within 24 hours and follow any shorter ingredient use-by date. Cool cooked food before refrigerating.',
    reheat: 'If reheating, reheat once only, until steaming hot throughout. Eat immediately.',
    ...(rice ? { freezer: 'For freezing, cool and freeze rice within one hour of cooking. Defrost in the fridge, reheat until steaming hot throughout and eat immediately.' } : {}),
    ...authoredStorage
  };
  repairs.push(rice ? 'rice_cooling_and_24_hour_storage' : 'explicit_storage_window');
  recipe.food_safety = unique([...(recipe.food_safety || []),
    'Check the labels of all bought ingredients for allergens and the shortest use-by date. Recipe tags do not guarantee suitability for an allergy.',
    ...(rice ? ['Cool leftover rice quickly, ideally within one hour; refrigerate and consume within 24 hours.'] : []),
    ...(recipe.ingredients.some(row => /kidney beans|mixed beans|chickpeas/i.test(row.item))
      ? ['Use canned, ready-cooked beans or chickpeas, drained before weighing. Dried beans need separate preparation; never substitute raw kidney beans directly.'] : [])]);
  if (recipe.ingredients.some(row => /teriyaki|hoisin|soy sauce/i.test(row.item))) recipe.food_safety.push('Generic soy, teriyaki and hoisin sauces are tagged for expected soya and wheat/gluten. Check the actual product label and any substitution before choosing this recipe.');
  if (recipe.ingredients.some(row => /kidney beans|mixed beans|chickpeas/i.test(row.item))) repairs.push('ready_cooked_pulse_requirement');

  recipe.method = recipe.method.map(step => {
    let text = step.replace(/eat within the stated storage window/gi, 'eat within 24 hours, following any shorter ingredient use-by date');
    if (recipe.ingredients.some(row => row.item === 'orange juice') && /orange zest/i.test(text)) {
      text = text.replace(/orange zest/gi, 'orange juice'); repairs.push('orange_juice_method_matches_ingredient');
    }
    // Ingredient records remain dry weights. Serving instructions must describe the cooked food.
    text = text.replace(/(Assemble with|Finish with|Prepare or warm) the (brown rice|basmati rice|couscous|wholewheat pasta), dry/gi,
      (_, action, food) => `${action === 'Prepare or warm' ? 'Use' : action} the cooked ${food}`);
    if (text !== step && /\bdry\b/.test(step)) repairs.push('cooked_grain_serving_state');
    if (/molten cheese/i.test(text) && !recipe.ingredients.some(row => /cheese|cheddar/i.test(row.item))) {
      text = 'Rest for one minute before cutting so the hot filling settles and the toastie holds together.';
      repairs.push('removed_unlisted_cheese');
    }
    return text;
  });
  if (recipe.meal_type === 'snack') {
    const eat = recipe.method.findIndex(step => /^Eat (?:straight away|immediately)/i.test(step));
    if (eat >= 0 && eat < recipe.method.length - 1) {
      const [instruction] = recipe.method.splice(eat, 1); recipe.method.push(instruction);
      repairs.push('finish_before_eat_instruction');
    }
    if (/^industrial-snack-bean-dip-box-/.test(recipe.id)) {
      recipe.method = recipe.method.map(step => step.replace('Lightly crush the chickpeas with the measured savoury add-on', 'Lightly crush the ready-cooked canned chickpeas with the measured lemon juice and savoury add-on'));
      repairs.push('bean_dip_measured_lemon_juice');
    }
    if (/^industrial-snack-tuna-snack-pot-/.test(recipe.id)) {
      recipe.method.unshift('Use canned ready-to-eat sweetcorn, drained before weighing the listed portion. Keep it chilled until assembling the pot.');
      repairs.push('ready_to_eat_canned_sweetcorn');
    }
    if (recipe.ingredients.some(row => row.item === 'instant espresso')) {
      recipe.method.unshift('Dissolve the listed instant espresso in 1 teaspoon of freshly boiled water, then let it cool before mixing it into the snack.');
      repairs.push('espresso_dissolving_step');
    }
    if (recipe.ingredients.some(row => row.item === 'cherries')) {
      recipe.method.unshift('Remove the stones from fresh cherries and weigh the edible fruit to match the listed quantity before assembling.');
      repairs.push('cherries_edible_weight');
    }
  }
  if (/^industrial-breakfast-egg-toast-/.test(recipe.id)) {
    recipe.method.unshift('Wash the vegetables and slice or finely chop them before cooking.');
    recipe.method[recipe.method.length - 1] = 'Serve the eggs and vegetables on the toast and season with the measured black pepper.';
    recipe.equipment = unique([...recipe.equipment, 'knife', 'chopping-board', 'spatula', 'plate']);
    repairs.push('egg_toast_measured_pepper_and_preparation');
  }
  if (/^industrial-breakfast-yoghurt-pot-/.test(recipe.id)) {
    recipe.equipment = ['bowl-or-lidded-container', 'spoon', 'knife', 'chopping-board'];
    recipe.method[1] = 'Wash and prepare the fruit, removing any stones, cores or inedible peel, then weigh the edible portion and add it to the yoghurt.';
    repairs.push('yoghurt_pot_preparation_and_equipment');
  }
  if (/^industrial-breakfast-(?:protein-oats|yoghurt-pot|overnight-oats)-/.test(recipe.id) && recipe.ingredients.some(row => row.item === 'cherries')) {
    recipe.method.unshift('Remove the stones from fresh cherries and weigh the edible fruit to match the listed quantity before assembling.');
    repairs.push('cherries_edible_weight');
  }
  const dry = recipe.ingredients.filter(row => /\bdry\b/.test(row.item));
  if (dry.length) {
    const names = dry.map(row => row.item.replace(/,?\s*dry\b/, ''));
    recipe.method.unshift(`The listed ${names.join(' and ')} quantity is the dry, uncooked weight. Follow the cooking and assembly steps below for this measured portion.`);
    repairs.push('dry_weight_cooking_instruction');
  }
  if (/parboil/i.test(recipe.method.join(' ')) && !recipe.equipment.includes('saucepan')) {
    recipe.equipment.push('saucepan'); repairs.push('parboiling_equipment');
  }
  const dedupedTitle = recipe.title.replace(/\b(\w+)\s+\1\b/gi, '$1');
  if (dedupedTitle !== recipe.title) { recipe.title = dedupedTitle; repairs.push('duplicate_title_word'); }
  Object.assign(recipe, recalculateNutrition(recipe, foods, { ...mappings, ...EXPANSION_MAPPING_OVERRIDES }, retainedGrams));
  Object.assign(recipe, servingMetadata(recipe));
  delete recipe.content_hash;
  delete recipe.method_template;
  recipe.status = 'draft';
  recipe.review = { status: 'awaiting_second_person_review', approved: false };
  recipe.expansion_repairs = unique(repairs);
  return recipe;
}

function servingMetadata(recipe) {
  const id = recipe.id, oats = recipe.template_key.includes('|overnight-oats|');
  let prep = Number(recipe.prep_minutes) || 10, cook = Number(recipe.cook_minutes) || 0, rest = 0;
  let basis = 'Authoring estimate; follow the recipe and product/appliance instructions for doneness.';
  if (oats) { prep = 10; cook = 0; rest = 360; basis = 'Includes the minimum six-hour refrigerated soak; not an immediate quick meal.'; }
  else if (/^industrial-v3-breakfast-hash-|^industrial-breakfast-potato-hash-/.test(id)) { prep = 10; cook = 35; }
  else if (/^industrial-v3-breakfast-toastie-/.test(id)) { prep = 10; cook = recipe.ingredients.some(row => row.item === 'baby potatoes') ? 35 : 25; }
  else if (recipe.meal_type === 'lunch') {
    prep = 10;
    cook = /jacket-potato/.test(id) ? 80 : /rice-bowl|meal-prep-bowl/.test(id) ? 40 : /pasta-pot/.test(id) ? 15 : /grain-salad|toastie/.test(id) ? 10 : 0;
    if (/jacket-potato/.test(id)) basis = 'Conservative oven-route estimate; the microwave option in the method is faster.';
  } else if (/^industrial-v3-(burger|kebab|loaded-fries|pizza)-/.test(id)) { prep = 15; cook = /loaded-fries|pizza/.test(id) ? 35 : 25; }
  else if (/^industrial-v3-(pasta|pie|roast)-|^industrial-dinner-.+-(pasta-bake|taco-bowl)$/.test(id)) {
    prep = 15; cook = /-pie-/.test(id) ? 65 : /-roast-/.test(id) ? 60 : /taco-bowl/.test(id) ? 55 : 45;
  } else if (recipe.meal_type === 'dinner') {
    prep = 15; cook = recipe.ingredients.some(row => row.item === 'brown rice, dry') ? 60 : recipe.ingredients.some(row => row.item === 'basmati rice, dry') ? 45 : 35;
  } else if (recipe.meal_type === 'snack') { prep = 10; cook = 0; }
  const renamed = recipe.title.includes('Rice Bowl') && /^industrial-v3-(curry|chilli)-/.test(id);
  const basicFormat = id.match(/^industrial-breakfast-(protein-oats|yoghurt-pot|egg-toast|potato-hash|overnight-oats|cottage-cheese-toast)-/)?.[1]
    || id.match(/^industrial-snack-(yoghurt-pot|cottage-cheese-pot|apple-protein-snack|egg-snack-box|bean-dip-box|tuna-snack-pot|overnight-oats-pot)-/)?.[1]
    || (/^industrial-lunch-/.test(id) ? id.match(/-(wholemeal-wrap|pitta|rice-bowl|pasta-pot|jacket-potato|grain-salad|toastie)$/)?.[1] : null)
    || (/^industrial-dinner-/.test(id) ? id.match(/-(curry|stir-fry|chilli|pasta-bake|taco-bowl)$/)?.[1] : null);
  const format = renamed ? 'rice-bowl' : basicFormat || recipe.food_format || recipe.taxonomy?.food_format || 'prepared-meal';
  const tags = (recipe.tags || [recipe.meal_type]).map(tag => renamed && ['curry', 'chilli'].includes(tag) ? 'rice-bowl' : tag);
  const total = prep + cook + rest;
  const filteredTags = tags.filter(tag => !(recipe.allergens.includes('milk') && /vegan|dairy[-_ ]?free|milk[-_ ]?free/i.test(tag)))
    .filter(tag => !(total > 25 && /^(quick|fast)(?:[-_ ]|$)/i.test(tag)));
  const taxonomy = { ...(recipe.taxonomy || {}), meal_type: recipe.meal_type, food_format: format };
  if (taxonomy.prep_band === 'quick' && total > 25) taxonomy.prep_band = 'standard';
  return { prep_minutes: prep, cook_minutes: cook, rest_minutes: rest, total_minutes: prep + cook + rest,
    timing_basis: basis, timing_is_estimate: true, food_format: format,
    tags: unique(filteredTags), taxonomy };
}

export function expansionTechnicalIssues(recipe) {
  const issues = [];
  const method = recipe.method.join(' ');
  if (/required equipment|safely and thoroughly where required|safely cooked through where required|normal cooking method|meal format|stated format|incompatible|rather than forcing|chosen protein|finish the base of the meal/i.test(method)) {
    issues.push('method_requires_format_specific_authoring');
  }
  if (recipe.ingredients.some(row => /\+/.test(row.amount))) issues.push('compound_quantity_unresolved');
  if (/\bthe the filling\b|stated storage (?:window|period)|orange zest/i.test(method)) issues.push('unresolved_method_reference');
  if (recipe.ingredients.some(row => /\brice\b/.test(row.item)) && !/24 hours/.test(recipe.storage.chilled)) issues.push('rice_storage_incomplete');
  return issues;
}

export function bindExpansionFamilies(recipes) {
  const grouped = new Map();
  for (const recipe of recipes) {
    // Include every member-facing field, nutrition evidence and holding state.
    recipe.content_hash = digest(Object.fromEntries(Object.entries(recipe).filter(([key]) => key !== 'content_hash')));
    const list = grouped.get(recipe.template_key) || []; list.push(recipe); grouped.set(recipe.template_key, list);
  }
  return [...grouped].sort(([a], [b]) => a.localeCompare(b)).map(([key, rows]) => ({
    template_key: key,
    template_digest: digest({ scope: 'GRUB_ADDITIVE_EXPANSION_V1', key, descendants: rows.map(row => ({ id: row.id, content_hash: row.content_hash })).sort((a, b) => a.id.localeCompare(b.id)) }),
    recipe_ids: rows.map(row => row.id).sort(),
    required_decision: 'PENDING', approved: false,
    technical_holds: unique(rows.flatMap(row => row.technical_issues)),
    eligible_for_review: rows.every(row => !row.technical_issues.length)
  }));
}
