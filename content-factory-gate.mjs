import fs from 'node:fs';
import path from 'node:path';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const fail = (message) => { throw new Error(message); };
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const arrayOfText = (value, min = 1) => Array.isArray(value) && value.length >= min && value.every(nonEmpty);
const batchFiles = (dir) => fs.readdirSync(dir).filter((name) => /^batch-\d+\.json$/.test(name)).sort().map((name) => path.join(dir, name));

const grubFiles = batchFiles('content/grub');
const fitFiles = batchFiles('content/fit');
if (!grubFiles.length || !fitFiles.length) fail('Structured Grub and Fit content batches are required');

const grubBatches = grubFiles.map((file) => ({file, items: readJson(file)}));
const fitBatches = fitFiles.map((file) => ({file, items: readJson(file)}));
const recipes = grubBatches.flatMap((batch) => batch.items);
const exercises = fitBatches.flatMap((batch) => batch.items);
const live = fs.readFileSync('member-product-v4.js', 'utf8');

function uniqueIds(items, label) {
  const ids = items.map((item) => item.id);
  if (new Set(ids).size !== ids.length) fail(`${label} contains duplicate IDs`);
  if (ids.some((id) => !/^[a-z0-9-]+$/.test(String(id)))) fail(`${label} contains an invalid ID`);
}

function validateRecipe(recipe) {
  if (recipe.schema_version !== 1) fail(`${recipe.id}: unsupported recipe schema`);
  if (!nonEmpty(recipe.id) || !nonEmpty(recipe.title)) fail('recipe identity required');
  if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(recipe.meal_type)) fail(`${recipe.id}: invalid meal type`);
  if (!Number.isFinite(recipe.servings) || recipe.servings < 1) fail(`${recipe.id}: servings required`);
  if (!Number.isFinite(recipe.prep_minutes) || !Number.isFinite(recipe.cook_minutes)) fail(`${recipe.id}: prep/cook minutes required`);
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length < 4) fail(`${recipe.id}: too few ingredients`);
  for (const ingredient of recipe.ingredients) {
    if (!nonEmpty(ingredient.amount) || !nonEmpty(ingredient.item)) fail(`${recipe.id}: ingredient quantity/item required`);
  }
  if (!arrayOfText(recipe.method, 3)) fail(`${recipe.id}: independently usable numbered method required`);
  if (!Array.isArray(recipe.allergens)) fail(`${recipe.id}: structured allergens required`);
  if (!Array.isArray(recipe.substitutions) || recipe.substitutions.length < 1) fail(`${recipe.id}: structured substitution required`);
  for (const substitution of recipe.substitutions) {
    if (![substitution.from, substitution.to, substitution.note].every(nonEmpty)) fail(`${recipe.id}: incomplete substitution`);
  }
  if (!recipe.storage || Object.keys(recipe.storage).length < 1) fail(`${recipe.id}: storage/reheating metadata required`);
  if (!Array.isArray(recipe.food_safety)) fail(`${recipe.id}: food-safety metadata required`);
  if (!recipe.nutrition || !['pending_validation', 'validated'].includes(recipe.nutrition.status)) fail(`${recipe.id}: nutrition validation state required`);
  if (recipe.nutrition.status === 'validated') {
    for (const key of ['kcal', 'protein_g', 'carbohydrate_g', 'fat_g', 'fibre_g']) {
      if (!Number.isFinite(recipe.nutrition[key])) fail(`${recipe.id}: validated nutrition missing ${key}`);
    }
    if (!nonEmpty(recipe.nutrition.methodology) || recipe.nutrition.methodology === 'curated_estimate') fail(`${recipe.id}: validated nutrition needs a real methodology`);
  }
  if (!recipe.review || !['draft', 'in_review', 'approved', 'rejected'].includes(recipe.review.status)) fail(`${recipe.id}: review state required`);
}

function recipeLaunchReady(recipe) {
  return recipe.nutrition?.status === 'validated' && recipe.review?.status === 'approved';
}

function validateExercise(exercise) {
  if (exercise.schema_version !== 1) fail(`${exercise.id}: unsupported exercise schema`);
  if (!nonEmpty(exercise.id) || !nonEmpty(exercise.title) || !nonEmpty(exercise.movement_group)) fail('exercise identity/group required');
  if (!Number.isFinite(exercise.minutes) || exercise.minutes < 2) fail(`${exercise.id}: sensible duration required`);
  if (!arrayOfText(exercise.equipment) || !arrayOfText(exercise.locations)) fail(`${exercise.id}: equipment/location tags required`);
  if (!exercise.dosage || !Number.isFinite(exercise.dosage.sets) || !Number.isFinite(exercise.dosage.rest_seconds)) fail(`${exercise.id}: dosage/rest required`);
  if (!arrayOfText(exercise.instructions, 3)) fail(`${exercise.id}: usable instructions required`);
  if (!arrayOfText(exercise.form_cues, 2)) fail(`${exercise.id}: form/safety cues required`);
  if (!arrayOfText(exercise.regressions) || !arrayOfText(exercise.progressions) || !arrayOfText(exercise.substitutions)) fail(`${exercise.id}: regression/progression/substitution required`);
  if (!exercise.limitations || !Array.isArray(exercise.limitations.avoid) || !Array.isArray(exercise.limitations.caution)) fail(`${exercise.id}: limitation metadata required`);
  if (!exercise.visual || !['pending', 'approved', 'rejected'].includes(exercise.visual.status)) fail(`${exercise.id}: visual state required`);
  if (exercise.visual.status === 'approved' && (!nonEmpty(exercise.visual.asset_ref) || !nonEmpty(exercise.visual.alt_text))) fail(`${exercise.id}: approved visual requires asset and alt text`);
  if (!exercise.review || !['draft', 'in_review', 'approved', 'rejected'].includes(exercise.review.status)) fail(`${exercise.id}: review state required`);
}

function exerciseLaunchReady(exercise) {
  return exercise.visual?.status === 'approved' && exercise.review?.status === 'approved';
}

for (const batch of grubBatches) {
  if (!Array.isArray(batch.items) || batch.items.length < 8) fail(`${batch.file} must contain a coherent authoring batch of at least 8 recipes`);
  batch.items.forEach(validateRecipe);
}
for (const batch of fitBatches) {
  if (!Array.isArray(batch.items) || batch.items.length < 8) fail(`${batch.file} must contain a coherent authoring batch of at least 8 exercises`);
  batch.items.forEach(validateExercise);
}

uniqueIds(recipes, 'Structured Grub catalogue');
uniqueIds(exercises, 'Structured Fit catalogue');

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
const mealDistribution = Object.fromEntries(mealTypes.map((type) => [type, recipes.filter((recipe) => recipe.meal_type === type).length]));
for (const type of mealTypes) if (!mealDistribution[type]) fail(`Structured Grub catalogue has no ${type}`);

const equipment = new Set(exercises.flatMap((exercise) => exercise.equipment));
for (const required of ['dumbbell', 'dumbbells', 'band', 'full-gym']) {
  if (!equipment.has(required)) fail(`Structured Fit catalogue missing ${required} coverage`);
}

const liveRecipes = (live.match(/R\('/g) || []).length;
const liveExercises = (live.match(/X\('/g) || []).length;
const launchReadyRecipes = recipes.filter(recipeLaunchReady).length;
const launchReadyExercises = exercises.filter(exerciseLaunchReady).length;
const approvedVisuals = exercises.filter((exercise) => exercise.visual?.status === 'approved').length;

// Evidence discipline: anything counted launch-ready must satisfy every hard commissioning dependency.
for (const recipe of recipes.filter((item) => item.review?.status === 'approved' && !recipeLaunchReady(item))) {
  fail(`${recipe.id}: review approved before nutrition validation`);
}
for (const exercise of exercises.filter((item) => item.review?.status === 'approved' && !exerciseLaunchReady(item))) {
  fail(`${exercise.id}: review approved before visual approval`);
}

const GRUB_FLOOR = 64;
const FIT_FLOOR = 48;
console.log(JSON.stringify({
  liveBaseline: {recipes: liveRecipes, exercises: liveExercises},
  structuredAuthoring: {
    grubBatches: grubFiles.length,
    recipes: recipes.length,
    mealDistribution,
    launchReadyRecipes,
    authoredGapToFloor: Math.max(0, GRUB_FLOOR - recipes.length),
    launchReadyGapToFloor: Math.max(0, GRUB_FLOOR - launchReadyRecipes),
    fitBatches: fitFiles.length,
    exercises: exercises.length,
    movementGroups: [...new Set(exercises.map((exercise) => exercise.movement_group))],
    launchReadyExercises,
    approvedVisuals,
    authoredExerciseGapToFloor: Math.max(0, FIT_FLOOR - exercises.length),
    launchReadyExerciseGapToFloor: Math.max(0, FIT_FLOOR - launchReadyExercises),
    visualGapToFloor: Math.max(0, FIT_FLOOR - approvedVisuals)
  },
  blockers: {
    grub: ['ingredient-level nutrition validation', 'second-person content review', 'publication/runtime cutover', 'longitudinal variety simulation'],
    fit: ['visual guidance', 'second-person content review', 'publication/runtime cutover', '12-week repetition/progression simulation']
  }
}, null, 2));
console.log(`PASS M11/M12 content-factory schema across ${grubFiles.length} Grub and ${fitFiles.length} Fit batches; no false launch-ready promotion`);
