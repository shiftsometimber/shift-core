// Additive draft authoring only. Ingredient quantities and the accepted V1
// recipes are not changed here. Independent review must bind the final hashes.
export const LUNCH_FOOD_SAFETY_SOURCE = 'https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker';

const proteins = new Set([
  'cooked chicken breast', 'cooked turkey breast', 'tuna in spring water, drained',
  'cooked salmon', 'boiled eggs', 'mixed beans, drained', 'chickpeas, drained',
  'firm tofu', 'lean ham',
]);
const base = {
  'wholemeal-wrap': ['wholemeal wrap', 'salad leaves', 'tomato'],
  pitta: ['wholemeal pitta', 'shredded lettuce', 'cucumber'],
  'rice-bowl': ['brown rice, dry', 'mixed peppers', 'sweetcorn'],
  'pasta-pot': ['wholewheat pasta, dry', 'cherry tomatoes', 'rocket'],
  'grain-salad': ['couscous, dry', 'cucumber', 'tomato'],
  bagel: ['wholemeal bagel', 'rocket', 'tomato'],
  toastie: ['wholemeal bread', 'tomato', 'spinach'],
  'jacket-potato': ['baking potato', 'mixed salad', 'spring onion'],
  'meal-prep-bowl': ['brown rice, dry', 'mixed peppers', 'sweetcorn'],
};
const dressingItems = new Set([
  '0% Greek yoghurt dressing', 'lemon yoghurt dressing', 'lime yoghurt dressing',
  '0% Greek yoghurt', 'tomato pesto', 'olive oil', 'lemon juice',
  'wholegrain mustard', 'reduced-fat cheddar', 'light mayonnaise', 'mustard mayo',
  'reduced-sugar BBQ sauce', 'peri-peri yoghurt', 'Cajun yoghurt',
  'tomato ketchup', 'chilli powder', 'paprika', 'cider vinegar',
  'light Caesar dressing', 'lemon herb yoghurt', 'tomato salsa', 'tikka yoghurt',
  'katsu-style sauce', 'sweet chilli sauce', 'garlic herb yoghurt',
  'smoked paprika dressing', 'smoked paprika', 'pickle mustard relish', 'tomato pepper relish',
]);
const join = rows => rows.length < 2 ? rows[0] || '' : `${rows.slice(0, -1).join(', ')} and ${rows.at(-1)}`;
const utensils = ['bowl', 'knife', 'chopping-board'];
const packed = 'Eat now, or put the meal and any side salad into a covered container and refrigerate promptly. Eat within 24 hours and follow any shorter ingredient use-by date; keep it chilled until eating.';
const ricePacked = 'For a cold packed lunch, spread the rice in a shallow container and chill quickly, ideally within one hour, before combining it with the chilled filling. Refrigerate the finished meal and eat within 24 hours, following any shorter ingredient use-by date. Keep it chilled until eating.';

function format(recipe) {
  const id = String(recipe?.id || '');
  return id.match(/^industrial-v3-(bagel|toastie|jacket-potato|meal-prep-bowl)-.+-(chicken|turkey|tuna|egg|ham|chickpea)$/)?.[1]
    || id.match(/^industrial-lunch-(?:chicken|turkey|tuna|salmon|egg|bean|chickpea|tofu)-(wholemeal-wrap|pitta|rice-bowl|pasta-pot|jacket-potato|grain-salad|toastie)$/)?.[1]
    || null;
}

function proteinPrep(item, sandwich = false) {
  if (/^cooked (chicken|turkey)/.test(item)) return `Use chilled, already-cooked ${item.replace('cooked ', '')}; slice it thinly or shred it into small pieces. Keep it refrigerated until assembly.`;
  if (item === 'tuna in spring water, drained') return 'Use canned tuna in spring water. Drain it before weighing, then break it into small flakes with a fork.';
  if (item === 'cooked salmon') return 'Use chilled, already-cooked salmon. Check for bones, remove any skin and break the flesh into small flakes.';
  if (item === 'boiled eggs') return 'Use already-boiled, cooled eggs. Peel them and cut them into thin slices; the listed weight is the edible egg without shells.';
  if (item === 'lean ham') return 'Use ready-to-eat cooked lean ham and cut it into thin strips. Keep it chilled until assembly.';
  if (item === 'firm tofu') return `Choose firm tofu labelled ready to eat. Drain and pat it dry, then ${sandwich ? 'cut it into thin slices' : 'cut it into small cubes'}; keep it chilled until assembly.`;
  if (item === 'mixed beans, drained' || item === 'chickpeas, drained') return `Use ready-cooked canned ${item.replace(', drained', '')}. Drain and rinse before weighing${sandwich ? ', then roughly mash with a fork so the filling holds together' : ''}.`;
  throw new Error(`Unreviewed lunch protein: ${item}`);
}

function dressing(recipe, useOil) {
  const rows = recipe.ingredients.slice(4).filter(row => row.item !== 'olive oil');
  const cheeseOnly = rows.length === 1 && rows[0].item === 'reduced-fat cheddar';
  const names = rows.map(row => row.item);
  const grate = names.includes('reduced-fat cheddar') ? 'Finely grate the measured reduced-fat cheddar. ' : '';
  const oil = useOil && recipe.ingredients.some(row => row.item === 'olive oil');
  if (cheeseOnly) return {
    prepare: `${grate}${oil ? 'Use all the measured olive oil to dress the prepared vegetables.' : 'Keep the cheese ready for assembly.'}`,
    finish: 'the grated reduced-fat cheddar',
  };
  const parts = [...names, ...(oil ? ['olive oil'] : [])];
  const prepare = rows.length === 1
    ? `${grate}Use the measured ${names[0]} as a ready-to-eat sauce or dressing${oil ? '; stir in all the measured olive oil' : ''}. Keep chilled sauces refrigerated until assembly.`
    : `${grate}Stir together all the measured ${join(parts)} in a small bowl to make the dressing. Keep it refrigerated until assembly.`;
  return {prepare, finish: rows.length === 1 ? `the measured ${names[0]}${oil ? ' and olive oil dressing' : ''}` : 'the prepared dressing'};
}

function coldBread(recipe, kind) {
  const sauce = dressing(recipe, true);
  const [bread, leaf, vegetable] = base[kind];
  const preparation = kind === 'wholemeal-wrap'
    ? 'Use a ready-to-eat wholemeal wrap and lay it flat on a clean plate.'
    : kind === 'pitta'
      ? 'Use ready-to-eat wholemeal pitta. Cut it into two halves and carefully open the pockets.'
      : 'Split the wholemeal bagel. Toast the cut halves lightly if desired, then let them cool slightly before filling.';
  const assembly = kind === 'wholemeal-wrap'
    ? 'Put a manageable layer of filling down the centre, fold in the sides and roll up firmly.'
    : kind === 'pitta'
      ? 'Spoon a manageable layer of filling into each pitta pocket.'
      : 'Put a manageable layer of filling on the lower bagel half and add the top.';
  return {equipment: [...(kind === 'bagel' ? ['toaster'] : []), ...utensils], method: [
    `Wash and dry the ${leaf} and ${vegetable}; shred the leaves and slice the ${vegetable} thinly. Reserve most of the leaves and any excess ${vegetable} for a side salad so the ${bread} can close.`,
    proteinPrep(recipe.ingredients[0].item, true),
    sauce.prepare,
    preparation,
    `Combine the prepared filling with ${sauce.finish}. Add a small handful of the prepared leaves and some sliced ${vegetable}. ${assembly} Serve all remaining filling and vegetables alongside as the side salad.`,
    packed,
  ]};
}

function toastie(recipe) {
  const sauce = dressing(recipe, false);
  const oil = recipe.ingredients.some(row => row.item === 'olive oil');
  return {equipment: ['sandwich-toaster', ...utensils], storage: {
    chilled: 'Keep the filling, bread and side salad chilled separately. Assemble and toast just before eating, within 24 hours of preparation and before any shorter ingredient use-by date.',
    reheat: 'Eat the freshly toasted sandwich immediately; do not cool and reheat it again. Keep ingredients chilled and toast only once.',
    freezer: 'Do not freeze the assembled or toasted sandwich. Keep the fresh filling and side salad chilled and prepare it within the stated chilled-storage window.',
  }, method: [
    'Wash and dry the tomato and spinach. Slice the tomato thinly and shred the spinach. Reserve most of the leaves and any excess tomato for a side salad.',
    proteinPrep(recipe.ingredients[0].item, true),
    sauce.prepare,
    `Preheat the sandwich toaster according to its instructions. Use the measured wholemeal bread as two slices${oil ? ' and brush all the measured olive oil over the two outer faces' : ''}.`,
    `Put a thin, even layer of the prepared filling, a few spinach leaves, some tomato and ${sauce.finish} between the slices. Keep excess filling and vegetables chilled for the side salad; do not overfill the toaster.`,
    'Toast following the appliance instructions until the bread is crisp and the filling is steaming hot through the centre. Check by cutting into the middle and continue heating if needed. This is the single reheating step for the already-cooked filling.',
    'Rest for a minute, cut and serve immediately with all the remaining filling and vegetables as a side salad. For a packed lunch, keep the components chilled and assemble and toast once just before eating.',
  ]};
}

function jacket(recipe) {
  const sauce = dressing(recipe, true);
  return {equipment: ['oven-or-microwave', 'oven-tray-or-microwave-safe-plate', 'fork', ...utensils], method: [
    'Scrub the baking potato and pierce it several times with a fork. For an oven, heat to 200°C (180°C fan), put the potato on a tray and bake for about 60–75 minutes. For an 800W microwave, put it on a microwave-safe plate and cook for 8 minutes, turning halfway; continue in 1-minute bursts as needed. In either case, check the centre is completely soft when pierced and allow it to stand for 2 minutes; size and appliance affect the time.',
    'Wash and dry the mixed salad and spring onion. Trim and slice the spring onion very finely, then mix it with the salad to serve alongside the potato.',
    proteinPrep(recipe.ingredients[0].item),
    sauce.prepare,
    `Split the cooked potato and fluff the centre with a fork. Add the prepared ready-to-eat filling and ${sauce.finish}; the filling is served chilled on the hot potato. Serve the full mixed salad and finely sliced spring onion alongside, and eat immediately.`,
    'For a packed lunch, cool the cooked potato promptly before covering and refrigerating it; pack the chilled filling, dressing and salad separately. Eat within 24 hours and follow any shorter ingredient use-by date. Reheat the potato once until steaming hot throughout, then add the cold toppings immediately before eating.',
  ]};
}

function riceBowl(recipe) {
  const sauce = dressing(recipe, true);
  return {equipment: ['hob', 'saucepan', 'sieve', ...utensils], method: [
    'The listed brown rice is a dry weight. Cook it in a saucepan using the water quantity and cooking time on its packet, until tender; drain if needed.',
    'Wash and dice the mixed peppers. Use ready-to-eat canned sweetcorn, drained before weighing; keep both ready for assembly.',
    proteinPrep(recipe.ingredients[0].item),
    sauce.prepare,
    `For immediate serving, put the hot cooked rice in a bowl, add the peppers, sweetcorn and chilled ready-to-eat filling, then fold through ${sauce.finish}. Eat immediately.`,
    ricePacked,
  ]};
}

function pastaPot(recipe) {
  const sauce = dressing(recipe, true);
  return {equipment: ['hob', 'saucepan', 'colander', ...utensils], method: [
    'The listed wholewheat pasta is a dry weight. Cook it in boiling water for the packet time until tender, then drain well.',
    'Wash and dry the cherry tomatoes and rocket. Halve the tomatoes and roughly chop the rocket.',
    proteinPrep(recipe.ingredients[0].item),
    sauce.prepare,
    `Toss the drained cooked pasta with ${sauce.finish}, then fold in the tomatoes, rocket and prepared ready-to-eat filling. Eat immediately.`,
    'For a packed lunch, cool the cooked pasta promptly before combining it with the chilled filling. Cover, refrigerate and eat within 24 hours, following any shorter ingredient use-by date. Keep the meal chilled until eating.',
  ]};
}

function grainSalad(recipe) {
  const sauce = dressing(recipe, true);
  return {equipment: ['kettle', 'heatproof-bowl', 'plate-or-lid', 'fork', ...utensils], method: [
    'Use instant couscous suitable for preparation with boiling water. Put the measured dry couscous in a heatproof bowl, pour over the boiling-water quantity stated on its packet, cover and leave for the packet time. Fluff with a fork; it should be tender with no hard grains.',
    'Wash the cucumber and tomato, then dice both into small pieces.',
    proteinPrep(recipe.ingredients[0].item),
    sauce.prepare,
    `Fold the cooked couscous, cucumber, tomato and prepared ready-to-eat filling together with ${sauce.finish}. Eat immediately.`,
    'For a packed lunch, cool the prepared couscous promptly before combining it with the chilled filling. Cover, refrigerate and eat within 24 hours, following any shorter ingredient use-by date. Keep the meal chilled until eating.',
  ]};
}

export function repairLunchMethod(recipe) {
  const kind = format(recipe);
  if (!kind || recipe.meal_type !== 'lunch' || !Array.isArray(recipe.ingredients)) return null;
  const rows = recipe.ingredients;
  if (!proteins.has(rows[0]?.item) || !base[kind].every((item, index) => rows[index + 1]?.item === item)) return null;
  if (rows.length < 5 || rows.slice(4).some(row => !dressingItems.has(row.item))) return null;
  if (['wholemeal-wrap', 'pitta', 'bagel'].includes(kind)) return coldBread(recipe, kind);
  if (kind === 'toastie') return toastie(recipe);
  if (kind === 'jacket-potato') return jacket(recipe);
  if (kind === 'rice-bowl' || kind === 'meal-prep-bowl') return riceBowl(recipe);
  if (kind === 'pasta-pot') return pastaPot(recipe);
  if (kind === 'grain-salad') return grainSalad(recipe);
  return null;
}
