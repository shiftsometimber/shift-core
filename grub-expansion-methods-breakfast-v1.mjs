// Scoped additive draft authoring. Accepted V1 recipes never enter this module.
export const OATS_LIQUID_EVIDENCE = {
  url: 'https://milk.co.uk/recipes/trio-of-overnight-oats-with-yogurt/',
  basis: 'Published base uses 50 g oats with 150 ml semi-skimmed milk per person. Scale that milk-to-oat ratio to 70 g oats: 210 ml. Toppings remain this catalogue’s own ingredients.',
  reviewedAt: '2026-09-16',
};
const join = rows => rows.map(row => `${row.amount} ${row.item}`).join(', ');
const rawMeat = item => ['lean back bacon', 'reduced-fat pork sausages', 'chicken breast'].includes(item);
const safeMeat = 'Check the thickest piece is steaming hot through the centre. A clean probe should read 70°C for 2 minutes.';

function proteinInstruction(item, stage) {
  if (rawMeat(item)) return `Use half the measured olive oil in a frying pan. ${item === 'chicken breast' ? 'Dice the chicken into roughly 2 cm pieces. ' : item === 'lean back bacon' ? 'Cut the bacon into bite-size pieces. ' : 'Follow the sausage packet cooking guidance. '}Cook the ${item} thoroughly, turning regularly. ${safeMeat}${item === 'chicken breast' ? ' The chicken must have no pink flesh and its juices should run clear.' : ''} Transfer to a clean plate.${item === 'reduced-fat pork sausages' ? ` Slice the cooked sausages before ${stage}.` : ''}`;
  if (item === 'large eggs') return 'Beat the measured eggs in a clean bowl and set them aside while cooking the vegetables.';
  if (item === 'cooked turkey breast') return 'Keep the already-cooked turkey refrigerated while preparing the vegetables. Add it near the end and heat until steaming hot throughout.';
  if (item === 'baked beans') return 'Use ready-cooked canned baked beans. Add them near the end and heat gently until steaming hot; do not try to brown the beans.';
  throw new Error(`Unsupported breakfast protein: ${item}`);
}

function flavourInstructions(rows, coldDip = false) {
  const cold = rows.filter(row => /yoghurt/.test(row.item));
  const cheese = rows.filter(row => /cheddar/.test(row.item));
  const warm = rows.filter(row => !cold.includes(row) && !cheese.includes(row));
  return [
    ...(warm.length ? [`Stir in the listed flavour ingredients (${join(warm)}), mixing powders and liquids evenly; heat any beans or mushrooms until steaming hot.`] : []),
    ...(cheese.length ? [`Scatter over the ${join(cheese)} and let it melt over the hot filling.`] : []),
    ...(cold.length ? [coldDip ? `Keep the ${join(cold)} chilled and serve it alongside the finished toastie as a dip; it is included in the listed meal quantities.` : `Take the pan off the heat before stirring through the ${join(cold)}.`] : []),
  ];
}

export function repairBreakfastRecipe(recipe) {
  const key = recipe.template_key || '';
  if (key.includes('|overnight-oats|')) {
    const ingredients = structuredClone(recipe.ingredients);
    const oats = ingredients.find(row => row.item === 'rolled oats');
    if (!oats) throw new Error(`Missing overnight oats: ${recipe.id}`);
    let milk = ingredients.find(row => row.item === 'semi-skimmed milk');
    const notes = [];
    if (!milk) {
      const match = String(oats.amount).match(/^(\d+(?:\.\d+)?)g$/);
      if (!match) throw new Error(`Unresolved overnight-oat weight: ${recipe.id}`);
      milk = { amount: `${Number(match[1]) * 3}ml`, item: 'semi-skimmed milk', allergens: ['milk'] };
      ingredients.push(milk);
      notes.push({ code: 'measured_overnight_oat_milk_added', ingredient: milk, evidence: OATS_LIQUID_EVIDENCE });
    }
    const yoghurt = ingredients.filter(row => /yoghurt|cream cheese/.test(row.item));
    const crunch = ingredients.filter(row => /seeds|crackers|biscuit|chocolate/.test(row.item) && !/cocoa/.test(row.item));
    const extras = ingredients.filter(row => row !== oats && row !== milk && !yoghurt.includes(row) && !crunch.includes(row));
    return {
      ingredients, equipment: ['lidded-container', 'spoon', 'knife', 'chopping-board'],
      method: [
        `Put ${join([oats])} and ${join([milk])} into a clean lidded container and stir until all the oats are wet.`,
        ...(yoghurt.length ? [`Stir in ${join(yoghurt)} until evenly mixed.`] : []),
        ...(extras.length ? [`Wash and prepare the fruit, removing any stones or inedible peel, then mix in the measured additions: ${join(extras)}. Stir powder flavourings into the milk mixture so no dry pockets remain.`] : []),
        'Cover and refrigerate for at least 6 hours or overnight. Stir well before eating; the oats should be soft throughout.',
        ...(crunch.length ? [`Keep ${join(crunch)} separate until serving. Add seeds, biscuit or chocolate as a topping; serve any crackers alongside.`] : []),
        'Keep chilled and eat within 24 hours of preparation, following any shorter ingredient use-by date. The listed quantities include every topping and side.',
      ],
      authoring_notes: [...notes, { code: 'overnight_oats_all_ingredients_explicit' }],
    };
  }

  const hash = key.includes('|breakfast-hash|');
  const toastie = key.includes('|breakfast-toastie|');
  if (!hash && !toastie) return null;
  const protein = recipe.ingredients[0].item;
  const core = new Set([protein, 'olive oil', 'baby potatoes', 'onion', hash ? 'mixed peppers' : 'tomato', ...(toastie ? ['spinach', 'wholemeal bread'] : [])]);
  const flavours = recipe.ingredients.filter(row => !core.has(row.item));
  const potatoes = recipe.ingredients.find(row => row.item === 'baby potatoes');
  const vegetableNames = recipe.ingredients.filter(row => ['onion', 'mixed peppers', 'tomato', 'spinach'].includes(row.item)).map(row => row.item).join(', ');
  const preparation = [
    'Wash the vegetables. Chop onion and peppers where listed; slice tomato where listed and keep raw meat preparation separate.',
    ...(potatoes ? [`Cut the ${potatoes.amount} baby potatoes into roughly 1 cm cubes. Simmer in a saucepan of water for about 6–8 minutes, continuing until a knife enters the centre easily. Drain thoroughly and let steam escape.`] : []),
    proteinInstruction(protein, hash ? 'returning to the hash' : 'assembling the toastie'),
    `Heat ${rawMeat(protein) ? 'the remaining half of' : 'all'} the measured olive oil in the frying pan. ${potatoes ? 'Add the drained potatoes and turn occasionally until golden. ' : ''}Add the ${vegetableNames}; cook until softened, with spinach wilted and excess liquid evaporated where listed.`,
    ...(rawMeat(protein) ? [`Return the fully cooked ${protein} to the pan and heat through.`] : protein === 'large eggs' ? ['Add the beaten eggs to the cooked vegetables and stir until fully set.'] : [`Add the ${protein} and heat gently until steaming hot throughout.`]),
    ...flavourInstructions(flavours, toastie),
  ];
  if (hash) return {
    method: [...preparation, 'Check the potatoes are tender inside, the vegetables are cooked and the whole hash is hot. Serve the full measured portion immediately.'],
    equipment: ['hob', 'frying-pan', 'saucepan', 'colander', 'knife', 'chopping-board', 'spoon', 'bowl', ...(rawMeat(protein) ? ['food-thermometer'] : [])],
    ...(protein === 'cooked turkey breast' ? { storage: { ...recipe.storage, reheat: 'The already-cooked turkey is reheated while making the hash. Eat immediately; do not cool and reheat the finished hash again.' } } : {}),
    authoring_notes: [{ code: 'hash_potato_prep_and_protein_specific_order' }],
  };
  return {
    method: [...preparation,
      'Heat the sandwich toaster. Spoon the cooked filling between the measured bread slices, spreading it evenly and keeping wetter ingredients away from the edges. Do not overfill; serve any remaining cooked filling alongside.',
      'Toast for around 4–6 minutes, following the appliance guidance, until the bread is crisp and the filling is steaming hot in the centre. Rest for one minute before cutting.',
      'Serve the toastie with any remaining measured filling. Nutrition includes the whole portion, including the side.',
    ],
    equipment: ['hob', 'frying-pan', 'sandwich-toaster', 'knife', 'chopping-board', 'spoon', 'bowl', ...(potatoes ? ['saucepan', 'colander'] : []), ...(rawMeat(protein) ? ['food-thermometer'] : [])],
    storage: { ...recipe.storage, chilled: 'Keep components chilled separately and use within 24 hours or the shortest ingredient use-by date. Cook and assemble the filling just before toasting.', reheat: 'Eat the freshly toasted sandwich immediately. Do not cool and reheat the finished toastie again.' },
    authoring_notes: [{ code: 'toastie_all_ingredients_cooked_and_equipment_complete' }],
  };
}
