// Offline additive authoring only. The caller owns exclusion of the accepted
// 798 and historic quarantine. This function changes no ingredient or nutrient.
export const FAKEAWAY_FOOD_SAFETY_SOURCE = 'https://www.gov.uk/government/publications/cooking-your-food/cooking-your-food';

const proteins = new Set(['chicken breast', '5% beef mince', 'lean pork loin', 'turkey mince', 'salmon fillet', 'firm tofu']);
const spices = new Set(['chilli powder', 'paprika', 'garlic powder', 'dried oregano', 'salt', 'black pepper']);
const condiments = new Set(['light mayonnaise', 'tomato ketchup', 'wholegrain mustard', 'burger relish', 'cider vinegar', 'garlic herb yoghurt']);
const hotSauces = new Set(['reduced-sugar BBQ sauce', 'peri-peri sauce', 'katsu-style sauce', 'tikka sauce']);
const baseItems = {
  burger: ['wholemeal burger bun', 'lettuce', 'tomato'],
  kebab: ['wholemeal flatbread', 'lettuce', 'tomato'],
  'loaded-fries': ['oven chips', 'red onion', 'mixed peppers'],
  pizza: ['individual pizza base', 'tomato passata', 'mixed peppers'],
};
const join = (items) => items.length < 2 ? items[0] || '' : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

function proteinPlan(protein, format) {
  const burger = format === 'burger';
  const kebab = format === 'kebab';
  const plans = {
    'chicken breast': burger
      ? {prep: 'Slice the chicken breast horizontally into cutlets about 1.5cm thick so they cook evenly and fit the bun.', cook: 'Cook the chicken cutlets over a medium heat for about 5–6 minutes on each side, lowering the heat if they brown too quickly.', finish: 'the cooked chicken cutlets'}
      : {prep: 'Cut the chicken breast into strips about 1.5cm thick.', cook: 'Cook the chicken strips over a medium-high heat for about 8–10 minutes, turning regularly so every side colours.', finish: 'the cooked chicken strips'},
    'lean pork loin': burger
      ? {prep: 'Slice the lean pork loin across the grain into cutlets about 1cm thick.', cook: 'Cook the pork cutlets over a medium heat for about 4–5 minutes on each side.', finish: 'the cooked pork cutlets'}
      : {prep: 'Cut the lean pork loin across the grain into strips about 1cm thick.', cook: 'Cook the pork strips over a medium-high heat for about 7–9 minutes, turning regularly.', finish: 'the cooked pork strips'},
    '5% beef mince': burger
      ? {prep: 'Press the 5% beef mince into a patty about 1.5cm thick, slightly wider than the bun; no binder is needed.', cook: 'Cook the beef patty over a medium heat for about 5–6 minutes on each side. Turn it carefully and leave it intact rather than repeatedly pressing it flat.', finish: 'the cooked beef patty'}
      : kebab
        ? {prep: 'Press the 5% beef mince firmly into three short koftas, each no thicker than 1.5cm; no skewers or binder are needed.', cook: 'Cook the beef koftas over a medium heat for about 10–12 minutes, turning them onto every side.', finish: 'the cooked beef koftas'}
        : {prep: 'Keep the 5% beef mince ready to break into small pieces in the pan.', cook: 'Cook the beef mince over a medium-high heat for about 8–10 minutes, breaking up clumps and stirring until browned.', finish: 'the cooked beef mince'},
    'turkey mince': burger
      ? {prep: 'Press the turkey mince into a patty about 1.5cm thick, slightly wider than the bun; no binder is needed.', cook: 'Cook the turkey patty over a medium heat for about 5–6 minutes on each side, turning carefully.', finish: 'the cooked turkey patty'}
      : kebab
        ? {prep: 'Press the turkey mince firmly into three short koftas, each no thicker than 1.5cm; no skewers or binder are needed.', cook: 'Cook the turkey koftas over a medium heat for about 10–12 minutes, turning them onto every side.', finish: 'the cooked turkey koftas'}
        : {prep: 'Keep the turkey mince ready to break into small pieces in the pan.', cook: 'Cook the turkey mince over a medium-high heat for about 8–10 minutes, breaking up clumps and stirring frequently.', finish: 'the cooked turkey mince'},
    'salmon fillet': {prep: 'Check the salmon fillet for pin bones and pat it dry. Keep it as a fillet for cooking.', cook: 'Cook the salmon over a medium heat for about 4–5 minutes on the first side and 3–4 minutes on the other; start skin-side down if it has skin. Turn with a wide spatula.', finish: burger ? 'the cooked salmon fillet' : 'large flakes of the cooked salmon'},
    'firm tofu': burger
      ? {prep: 'Drain the firm tofu, pat it dry and cut it into slabs about 1cm thick to fit the bun.', cook: 'Cook the tofu slabs over a medium-high heat for about 4–5 minutes on each side, until golden and hot through.', finish: 'the browned tofu slabs'}
      : {prep: 'Drain the firm tofu, pat it dry and cut it into 2cm cubes.', cook: 'Cook the tofu cubes over a medium-high heat for about 8–10 minutes, turning so several faces become golden and the centre is hot.', finish: 'the browned tofu cubes'},
  };
  const plan = plans[protein];
  if (!plan) return null;
  const safety = protein === 'firm tofu'
    ? 'Follow any longer cooking instruction on the tofu pack.'
    : protein === 'salmon fillet'
      ? 'Check the thickest part: the fish should be opaque through the centre and separate readily into flakes. Keep cooking if the centre is translucent.'
      : `Check the centre with a clean food thermometer: it must stay at 75°C or above for 30 seconds. Without a thermometer, cut the thickest piece open and check that it is steaming inside with no pink meat${['chicken breast', 'lean pork loin'].includes(protein) ? ' and the juices are clear' : ''}. Continue cooking until these checks are met; the suggested pan time alone is not a safety check.`;
  return {...plan, safety};
}

export function repairFakeawayMethod(recipe) {
  const match = String(recipe?.id || '').match(/^industrial-v3-(burger|kebab|loaded-fries|pizza)-/);
  if (!match) return null;
  const format = match[1];
  const names = (recipe.ingredients || []).map((row) => row.item);
  const presentProteins = names.filter((name) => proteins.has(name));
  if (presentProteins.length !== 1 || !baseItems[format].every((item) => names.includes(item)) || !names.includes('olive oil')) return null;
  const known = new Set([...proteins, ...spices, ...condiments, ...hotSauces, ...baseItems[format], 'olive oil']);
  if (names.some((name) => !known.has(name))) return null; // New ingredients need new authoring, never silent omission.
  const protein = presentProteins[0];
  const plan = proteinPlan(protein, format);
  const seasoning = names.filter((name) => spices.has(name));
  const cold = names.filter((name) => condiments.has(name));
  const hot = names.filter((name) => hotSauces.has(name));
  const equipment = ['hob', 'frying-pan', 'bowl', 'knife', 'chopping-board', 'wide-spatula', 'clean-plate'];
  if (!['firm tofu', 'salmon fillet'].includes(protein)) equipment.push('food-thermometer');
  if (hot.length) equipment.push('saucepan');
  const method = [];
  const coldStep = cold.length
    ? `Mix the measured ${join(cold)} in a clean small bowl. Keep this finishing sauce separate from the uncooked filling${cold.some((item) => /mayonnaise|yoghurt/.test(item)) ? ' and refrigerated until assembly' : ''}.`
    : null;
  const hotStep = hot.length
    ? `Put the measured ${join(hot)} into a small saucepan. Warm over a low heat, stirring, for about 2–3 minutes until bubbling and hot throughout; follow a longer cooking time on the sauce label. Keep warm for serving.`
    : null;
  const prep = `${plan.prep}${seasoning.length ? ` Coat with all the measured ${join(seasoning)}.` : ''} ${protein === 'firm tofu' ? 'Use clean utensils for the cooked tofu.' : `After handling raw ${protein}, wash hands and clean the board, knife and work surface before touching the ready-to-eat ingredients.`}`;
  const cook = `${format === 'loaded-fries' || format === 'pizza' ? 'Add the remaining half of the measured olive oil to the non-stick frying pan.' : 'Heat the measured olive oil in the non-stick frying pan.'} ${plan.cook} ${plan.safety}`;

  if (format === 'burger' || format === 'kebab') {
    method.push('Wash and dry the lettuce and tomato. Shred the lettuce and slice the tomato; put both on a clean plate, separate from the raw filling.');
    method.push(format === 'burger'
      ? 'Split the wholemeal burger bun and toast the cut faces in a dry frying pan over a medium heat for 1–2 minutes. Set it on a clean plate.'
      : 'Warm the wholemeal flatbread in a dry frying pan over a medium heat for 30–60 seconds on each side, until flexible. Keep it covered on a clean plate.');
    if (coldStep) method.push(coldStep);
    method.push(prep, cook);
    if (hotStep) method.push(hotStep);
    const sauces = [...(hot.length ? ['the warm sauce'] : []), ...(cold.length ? ['the cold finishing sauce'] : [])];
    method.push(format === 'burger'
      ? `Put the lettuce and tomato in the toasted bun, add ${plan.finish}${sauces.length ? ` and ${join(sauces)}` : ''}, then close the bun and serve immediately.`
      : `Put the lettuce and tomato on the warm flatbread. Add ${plan.finish}${sauces.length ? ` and ${join(sauces)}` : ''}, fold the bread around the filling and serve immediately.`);
  } else if (format === 'loaded-fries') {
    equipment.push('oven', 'tray', 'oven-gloves');
    equipment.push('kitchen-scales');
    method.push('Use plain, uncoated oven-ready chips without batter. Preheat the oven to the temperature on the oven-chips packet, commonly 220°C conventional or 200°C fan; use the packet setting if different. Spread enough oven chips on a tray in one layer to provide a 250g cooked portion, without adding extra oil, and bake for the packet time, usually about 20–30 minutes, turning halfway. They should be crisp and golden rather than dark brown. Weigh out 250g after cooking for this serving; the ingredient amount and nutrition use cooked chip weight.');
    method.push('Slice the red onion and mixed peppers thinly. Heat half of the measured olive oil in a non-stick frying pan over a medium heat. Cook the vegetables for 6–8 minutes, stirring, until softened with a little colour; transfer to a clean bowl.');
    if (coldStep) method.push(coldStep);
    method.push(prep, cook);
    method.push(`Return the cooked red onion and mixed peppers to the pan for 1–2 minutes, turning gently until hot.${protein === 'salmon fillet' ? ' Keep the salmon in large flakes rather than mashing it.' : ''}`);
    if (hotStep) method.push(hotStep);
    method.push(`Pile the crisp oven chips onto a plate and spoon over ${plan.finish}, the red onion and peppers${hot.length ? ', followed by the warm sauce' : ''}.${cold.length ? ' Drizzle the cold finishing sauce over the top after cooking.' : ''} Serve immediately while the chips are crisp.`);
  } else {
    equipment.push('oven', 'tray', 'oven-gloves');
    equipment.push('kitchen-scales');
    method.push('Weigh the individual pizza base before cooking, using the raw weight listed in the ingredients. Preheat the oven to the temperature stated on its packet. Put a baking tray inside to heat. Keep the base ready on a board; follow any packet instruction to pre-bake it, and use its stated baking time for the final oven stage.');
    method.push('Slice the mixed peppers thinly. Heat half of the measured olive oil in a non-stick frying pan over a medium heat and cook the peppers for 5–6 minutes until softened; transfer them to a clean bowl.');
    if (coldStep) method.push(coldStep);
    method.push(prep, cook);
    method.push(`Transfer ${plan.finish} to the bowl of peppers. Add the measured tomato passata to the empty frying pan and simmer gently for 3–4 minutes, stirring, until slightly thickened so it will not soak the base.`);
    if (hotStep) method.push(hotStep);
    method.push(`Spread all the thickened tomato passata over the individual pizza base, leaving a narrow border. Arrange the cooked peppers and ${plan.finish} evenly on top${hot.length ? ', then spoon over the warm sauce' : ''}. Carefully slide onto the hot tray.`);
    method.push(`Bake for the pizza base packet's stated time, until the dough is cooked through, the base is crisp underneath and the topping is hot throughout.${cold.length ? ' Spoon over the cold finishing sauce after the pizza comes out of the oven.' : ''} Rest for one minute, cut and serve.`);
  }
  return {method, equipment: [...new Set(equipment)]};
}
