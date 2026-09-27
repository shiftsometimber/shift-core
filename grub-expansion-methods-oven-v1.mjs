// Draft-only methods for the previously unresolved oven/pasta/hash formats.
// Ingredient quantities and the accepted V1 source are never modified here.
export const OVEN_METHOD_SOURCE = 'https://www.gov.uk/government/publications/cooking-your-food/cooking-your-food';
const name = row => row.item;
const words = rows => rows.map(name).join(', ');
const measured = row => `${row.amount} ${row.item}`;
const finished = item => item.replace(/^(raw|cooked)\s+/i, '').replace(/, drained$/i, '');
function format(recipe) {
  return recipe.id.match(/^industrial-v3-(pasta|pie|roast)-/)?.[1]
    || recipe.id.match(/^industrial-dinner-.+-(pasta-bake|taco-bowl)$/)?.[1]
    || (recipe.id.startsWith('industrial-breakfast-potato-hash-') ? 'hash' : null);
}
function panProtein(item) {
  if (/^cooked (chicken|turkey)/.test(item)) return `Add the ${item} in bite-size pieces and heat for 3–5 minutes, turning until steaming hot right through. It is already cooked; do not treat it as raw meat.`;
  if (/mince/.test(item)) return `Add the ${item}, break it into small pieces with a spoon and fry over medium-high heat for about 8–10 minutes. Keep turning until browned and steaming hot throughout; check the centre reaches 75°C for 30 seconds with a clean thermometer.`;
  if (/chicken|turkey|pork/.test(item)) return `Cut the ${item} into even 2cm pieces. Fry over medium-high heat for about 8–12 minutes, turning regularly. Cook until no pink remains inside and the pieces are steaming hot throughout; a clean thermometer should read 75°C for 30 seconds at the centre.`;
  if (/salmon/.test(item)) return `Cook the salmon fillet separately over medium heat for about 4–5 minutes on each side, adjusting for thickness, until the centre is opaque and flakes easily. Lift onto a clean plate and break into large flakes, checking for bones.`;
  if (/prawn/.test(item)) return `Cook the raw king prawns over medium-high heat for about 3–5 minutes, turning until firm and opaque all the way through. Transfer to a clean plate.`;
  if (/tofu/.test(item)) return 'Pat the firm tofu dry, cut into 2cm cubes and cook over medium heat for 6–8 minutes, turning until the edges are golden and the middle is hot.';
  if (/lentils/.test(item)) return 'Add the cooked green lentils and warm for 3–4 minutes, stirring until steaming hot throughout. They are already cooked and do not need a long simmer.';
  if (/beans/.test(item)) return `Use ready-cooked canned ${finished(item)}, drained before weighing. Heat for 3–4 minutes, stirring until steaming hot throughout.`;
  if (/eggs/.test(item)) return 'Beat the large eggs, pour them into the pan and stir gently for 2–3 minutes until fully set, with no liquid egg left.';
  throw new Error(`Unreviewed oven-lane protein: ${item}`);
}
function sauceParts(recipe) {
  const flavours = recipe.ingredients.slice(4).filter(row => row.item !== 'olive oil');
  const chilled = flavours.some(row => /mayonnaise|yoghurt|cream cheese/i.test(row.item));
  return { flavours, chilled,
    prepare: chilled ? `Stir together the measured ${words(flavours)} in a small bowl and keep this dressing chilled until serving.`
      : `Measure the ${words(flavours)} ready to add near the end of cooking.`,
    finish: chilled ? `Take the pan off the heat before folding through the ${words(flavours)} dressing; do not boil it.`
      : `Stir in the measured ${words(flavours)} and 2 tablespoons of cooking water. Heat gently for 1–2 minutes, stirring until the coating is hot.` };
}

function pasta(recipe) {
  const p = recipe.ingredients[0], grain = recipe.ingredients[1], veg = recipe.ingredients.slice(2, 4), sauce = sauceParts(recipe);
  return { equipment: ['hob', 'saucepan', 'frying-pan', 'colander'], method: [
    `Bring a saucepan of water to the boil. The ${measured(grain)} is a dry weight: cook according to its packet until tender, then drain, saving a small cup of pasta water.`,
    `Dice the ${words(veg)} into bite-size pieces. ${sauce.prepare}`,
    `Heat half the measured olive oil in a non-stick frying pan. ${panProtein(p.item)} Transfer the cooked filling to a clean plate.`,
    `Add the remaining measured olive oil and ${words(veg)} to the pan. Cook over medium heat for 6–8 minutes, stirring until the courgette softens and the tomatoes release their juices.`,
    `Add the cooked pasta and filling. ${sauce.finish} Toss gently, using another spoonful of reserved pasta water if it needs loosening. Serve immediately.`
  ] };
}
function pie(recipe) {
  const p = recipe.ingredients[0], sauce = sauceParts(recipe);
  return { equipment: ['oven', 'hob', 'saucepan', 'frying-pan-with-lid', 'small-ovenproof-dish'], method: [
    'Heat the oven to 200°C fan. Peel and cut the potatoes into even 2cm chunks. Boil for 15–20 minutes until a knife goes through easily, then drain and mash with 2–3 tablespoons of the hot cooking water; no milk or butter is added.',
    `Dice the carrots finely. ${sauce.prepare}`,
    `Heat half the measured olive oil in a non-stick frying pan. ${panProtein(p.item)} Transfer the cooked filling to a clean plate.`,
    'Add the remaining measured olive oil, carrots and 60ml water to the pan. Cover and simmer gently for 8–10 minutes until the carrots soften; add the peas for the final 3 minutes and cook until piping hot. Add a spoonful of water if the pan dries before the carrots are tender.',
    `Return the cooked filling to the vegetables. ${sauce.chilled ? 'Keep the chilled dressing separate for serving; spoon the hot filling into a small ovenproof dish.' : `Stir in the ${words(sauce.flavours)}, heat for 1–2 minutes, then spoon into a small ovenproof dish.`}`,
    `Spread the mashed potato over the filling and roughen the top with a fork. Bake for 15–20 minutes, until the top colours and the centre of the pie is steaming hot. Rest for 2 minutes. ${sauce.chilled ? `Serve the ${words(sauce.flavours)} dressing alongside.` : 'Serve while hot.'}`
  ] };
}
function roast(recipe) {
  const p = recipe.ingredients[0], sauce = sauceParts(recipe);
  let protein;
  if (/mince/.test(p.item)) protein = `Shape the ${p.item} into two compact, flattened portions about 2cm thick; this uses mince, not a roasting joint. Bake on a separate lined tray for approximately 18–22 minutes, turning halfway, until steaming hot through the centre. Check 75°C for 30 seconds with a clean thermometer.`;
  else if (/chicken|pork/.test(p.item)) protein = `Place the ${p.item} on a separate lined tray and roast for approximately 20–25 minutes, adjusting for thickness. Check the thickest part is steaming hot with no pink and reaches 75°C for 30 seconds on a clean thermometer.`;
  else if (/salmon/.test(p.item)) protein = 'Place the salmon fillet on a separate lined tray and roast for approximately 12–15 minutes, until opaque at the thickest point and easy to flake. Check for bones before serving.';
  else if (/tofu/.test(p.item)) protein = 'Pat the firm tofu dry, cut it into 2cm slabs and roast on a separate lined tray for 20–25 minutes, turning halfway, until the edges are golden and the centre is hot.';
  else throw new Error(`Unreviewed roast protein: ${p.item}`);
  return { equipment: ['oven', 'two-roasting-trays', 'hob', 'saucepan'], method: [
    'Heat the oven to 200°C fan. Peel the potatoes and weigh the listed raw portion before cutting into even 3cm chunks. Parboil in water for 8–10 minutes, drain and shake gently to roughen the edges. Toss with half the measured olive oil and roast on a non-stick tray for 35–40 minutes, turning halfway, until golden and tender. Time the other components to finish alongside the potatoes.',
    'Cut the carrots into slim batons, toss them with one quarter of the measured olive oil and roast on the potato tray for the final 20–25 minutes, turning once, until tender. Keep them separate from uncooked meat or fish.',
    `Use the final quarter of the measured olive oil on the separate protein tray. ${protein}`,
    'Cut the broccoli into small florets and boil for 4–6 minutes until tender with a little bite. Drain well.',
    sauce.chilled ? sauce.prepare : `Warm the ${words(sauce.flavours)} in a small saucepan with 2 tablespoons of water for 1–2 minutes, stirring until hot.`,
    `Serve the cooked ${p.item}, roast potatoes, carrots and broccoli together. ${sauce.chilled ? `Spoon the chilled ${words(sauce.flavours)} dressing alongside after cooking.` : `Spoon the hot ${words(sauce.flavours)} over the cooked protein.`}`
  ] };
}
function pastaBake(recipe) {
  const p = recipe.ingredients[0];
  return { equipment: ['oven', 'hob', 'saucepan', 'non-stick-frying-pan-with-lid', 'small-ovenproof-dish', 'colander'], method: [
    'Heat the oven to 200°C fan. Cook the measured dry wholewheat pasta in boiling water for 2 minutes less than its packet time. Drain, saving a small cup of cooking water.',
    `Dice the courgette. Heat a non-stick frying pan over medium heat with 2 tablespoons of water; no oil is listed for this recipe. ${panProtein(p.item)} Add another spoonful of water if needed to prevent sticking, then transfer the cooked filling to a clean plate.`,
    'Add the courgette, chopped tomatoes and 3 tablespoons of pasta cooking water to the pan. Cover and simmer for 6–8 minutes until the courgette softens, then remove the lid.',
    `Fold in the drained pasta and cooked ${finished(p.item)}${/salmon/.test(p.item) ? ', broken into large flakes' : ''}. Transfer to a small ovenproof dish and scatter over the measured reduced-fat cheddar.`,
    'Bake for 12–15 minutes until the cheese melts and the centre is bubbling and steaming hot. Rest for 2 minutes before serving.'
  ] };
}
function tacoBowl(recipe) {
  const p = recipe.ingredients[0];
  return { equipment: ['hob', 'saucepan', 'non-stick-frying-pan'], method: [
    'Cook the measured dry brown rice in boiling water according to its packet instructions, then drain if needed. Keep the yoghurt refrigerated while the hot components cook.',
    `Heat a non-stick frying pan over medium heat with 2 tablespoons of water; this recipe has no added oil. ${panProtein(p.item)} Add a spoonful of water if the pan starts sticking.`,
    `Add the sweetcorn and tomato salsa to the pan. Cook for 3–5 minutes, stirring until hot; if using frozen sweetcorn, follow its packet cooking time. ${/salmon|prawn/.test(p.item) ? `Return the cooked ${finished(p.item)} from its plate and fold in gently until steaming hot.` : 'Stir the cooked filling through and check it is steaming hot.'}`,
    'Spoon the cooked rice into a bowl, add the hot filling and take it away from the heat before adding the measured Greek yoghurt as a cool topping.',
    'Eat immediately, or portion and cool leftovers promptly following the rice-storage instructions. Keep the yoghurt topping separate when packing a portion for reheating.'
  ] };
}
function hash(recipe) {
  const p = recipe.ingredients[1], veg = recipe.ingredients[2], onion = recipe.ingredients[3];
  const leafy = /spinach|kale/.test(veg.item);
  const reheatedPoultry = /^cooked (chicken|turkey)/.test(p.item);
  return { equipment: ['hob', 'saucepan', 'frying-pan', 'colander'], ...(reheatedPoultry ? { storage: {
    chilled: 'Keep the ingredients chilled separately before preparing. Make only the portion you will eat immediately: the cooked poultry is reheated during preparation.',
    reheat: 'Do not cool and reheat the finished hash; that would reheat the already-cooked poultry a second time.',
    freezer: 'Do not freeze the assembled reheated hash for another reheating.'
  } } : {}), method: [
    'Cut the baby potatoes into even 1–2cm pieces. Boil for 8–10 minutes until just tender, then drain and let the steam escape for a minute.',
    `Chop the ${onion.item} and ${veg.item}. Heat the measured olive oil in a wide non-stick frying pan; cook the ${onion.item}${leafy ? '' : ` and ${veg.item}`} over medium heat for 4–5 minutes.`,
    'Add the potatoes in a single layer. Cook for 6–8 minutes, turning a few times, until the edges are golden.',
    `${leafy ? `Stir in the ${veg.item} and cook for 2–3 minutes until wilted and hot. ` : ''}${panProtein(p.item)}`,
    `Serve the ${finished(p.item)}, potatoes and vegetables immediately. ${reheatedPoultry ? 'Do not cool and reheat this assembled hash again.' : 'For another portion, follow the chilled-storage and single-reheat instructions.'}`
  ] };
}

export function repairOvenMethod(recipe) {
  const kind = format(recipe);
  const fn = { pasta, pie, roast, 'pasta-bake': pastaBake, 'taco-bowl': tacoBowl, hash }[kind];
  if (!fn) return null;
  const result = fn(recipe);
  result.equipment = [...new Set([...result.equipment, 'knife', 'chopping-board', 'spoon-or-spatula', 'clean-plate', 'bowl',
    ...(/chicken|turkey|pork|beef/.test(recipe.ingredients[0]?.item || '') ? ['food-thermometer'] : []),
    ...(['pie', 'roast', 'pasta-bake'].includes(kind) ? ['oven-gloves'] : []),
    ...(kind === 'pie' ? ['colander', 'potato-masher-or-fork'] : []),
    ...(kind === 'roast' ? ['colander', 'kitchen-scales'] : [])])];
  return result;
}
