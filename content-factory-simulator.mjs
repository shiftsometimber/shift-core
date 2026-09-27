import fs from 'node:fs';
import path from 'node:path';

const loadBatches = (dir) => fs.readdirSync(dir)
  .filter((name) => /^batch-\d+\.json$/.test(name))
  .sort()
  .flatMap((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));

const source = fs.readFileSync('member-product-v4.js', 'utf8');
const legacyRecipes = [...source.matchAll(/R\('([^']+)','(breakfast|lunch|dinner|snack)','([^']+)'/g)]
  .map((match) => ({id: match[1], meal_type: match[2], title: match[3], source: 'legacy-live'}));
const legacyExercises = [...source.matchAll(/X\('([^']+)','([^']+)','([^']+)'/g)]
  .map((match) => ({id: match[1], title: match[2], movement_group: match[3], source: 'legacy-live'}));
const structuredRecipes = loadBatches('content/grub').map((item) => ({...item, source: 'structured-draft'}));
const structuredExercises = loadBatches('content/fit').map((item) => ({...item, source: 'structured-draft'}));

const rotatePick = (pool, index) => pool[index % pool.length];

function grubSimulation(days, pool) {
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const sequence = [];
  for (let day = 0; day < days; day += 1) {
    for (const mealType of mealTypes) {
      const candidates = pool.filter((recipe) => recipe.meal_type === mealType);
      if (!candidates.length) throw new Error(`No ${mealType} candidates for simulation`);
      sequence.push({day: day + 1, mealType, item: rotatePick(candidates, day)});
    }
  }
  const perMeal = {};
  for (const mealType of mealTypes) {
    const rows = sequence.filter((row) => row.mealType === mealType);
    const seen = new Set();
    const firstRepeatIndex = rows.findIndex((row) => seen.has(row.item.id) || !seen.add(row.item.id));
    perMeal[mealType] = {
      pool: pool.filter((recipe) => recipe.meal_type === mealType).length,
      firstExactRepeatDay: firstRepeatIndex < 0 ? null : firstRepeatIndex + 1,
      uniqueUsed: new Set(rows.map((row) => row.item.id)).size,
      repeats: rows.length - new Set(rows.map((row) => row.item.id)).size
    };
  }
  return {days, slots: sequence.length, perMeal};
}

function fitSimulation(pool, weeks = 12, sessionsPerWeek = 3, slotsPerSession = 5) {
  const sessions = weeks * sessionsPerWeek;
  const counts = new Map();
  const patternCounts = new Map();
  for (let slot = 0; slot < sessions * slotsPerSession; slot += 1) {
    const exercise = rotatePick(pool, slot);
    counts.set(exercise.id, (counts.get(exercise.id) || 0) + 1);
    patternCounts.set(exercise.movement_group, (patternCounts.get(exercise.movement_group) || 0) + 1);
  }
  const appearances = [...counts.values()];
  return {
    weeks,
    sessions,
    exerciseSlots: sessions * slotsPerSession,
    uniqueExercises: counts.size,
    movementGroups: patternCounts.size,
    maxAppearancesOfOneExercise: appearances.length ? Math.max(...appearances) : 0,
    averageAppearancesPerExercise: appearances.length ? Number((appearances.reduce((sum, value) => sum + value, 0) / appearances.length).toFixed(2)) : 0
  };
}

const liveGrub = [7, 14, 30, 60].map((days) => grubSimulation(days, legacyRecipes));
const prospectiveGrub = [7, 14, 30, 60].map((days) => grubSimulation(days, [...legacyRecipes, ...structuredRecipes]));
const liveFit = fitSimulation(legacyExercises);
const prospectiveFit = fitSimulation([...legacyExercises, ...structuredExercises]);

const result = {
  inventory: {
    liveRecipes: legacyRecipes.length,
    structuredAuthoredRecipes: structuredRecipes.length,
    prospectiveRecipePool: legacyRecipes.length + structuredRecipes.length,
    launchReadyStructuredRecipes: structuredRecipes.filter((recipe) => recipe.nutrition?.status === 'validated' && recipe.review?.status === 'approved').length,
    liveExercises: legacyExercises.length,
    structuredAuthoredExercises: structuredExercises.length,
    prospectiveExercisePool: legacyExercises.length + structuredExercises.length,
    approvedStructuredVisuals: structuredExercises.filter((exercise) => exercise.visual?.status === 'approved').length,
    launchReadyStructuredExercises: structuredExercises.filter((exercise) => exercise.visual?.status === 'approved' && exercise.review?.status === 'approved').length
  },
  grub: {
    currentLive: liveGrub,
    withStructuredDraftsForCapacityTestingOnly: prospectiveGrub,
    provisionalLaunchFloor: 64,
    acceptance: '30/60-day simulations must demonstrate acceptable variety under real composer preferences/Nays before M11 can PASS'
  },
  fit: {
    currentLive: liveFit,
    withStructuredDraftsForCapacityTestingOnly: prospectiveFit,
    provisionalLaunchFloor: 48,
    acceptance: '12-week 3x/week simulation must demonstrate acceptable movement/session variety, progression and limitation handling before M12 can PASS'
  }
};

console.log(JSON.stringify(result, null, 2));
console.log('PASS content-factory capacity simulator executed; authored drafts remain non-production until validation/review/publication gates pass');
