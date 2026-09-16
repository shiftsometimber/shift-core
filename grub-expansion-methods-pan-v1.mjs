// Offline authoring for additive drafts only. No publication or review decisions.
// FSA cooking endpoints: https://www.gov.uk/government/publications/cooking-your-food/cooking-your-food
// Rice/canned-bean handling: https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker
const PROTEINS = new Set(['chicken breast', 'turkey breast', 'turkey mince', '5% beef mince', 'lean pork loin', 'salmon fillet', 'raw king prawns', 'firm tofu', 'cooked green lentils']);
const HOT_SAUCES = new Set(['medium curry sauce', 'tikka masala sauce', 'pepper and tomato masala', 'balti-style sauce', 'madras-style sauce', 'smoked chilli tomato sauce', 'reduced-sugar BBQ glaze', 'peri-peri sauce', 'Cajun tomato sauce', 'tomato olive herb sauce', 'harissa tomato sauce', 'reduced-salt teriyaki sauce', 'hoisin-style sauce', 'sweet chilli sauce', 'reduced-salt soy sauce']);
const join = list => list.length < 2 ? list[0] || '' : `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`;
const safeMeat = 'Check the centre with a clean food thermometer: it must reach 70°C for 2 minutes. Keep cooking if it has not reached that endpoint; the suggested time is a guide.';

function proteinSteps(item, amount, oil, format) {
  const heat = oil ? 'Heat half the listed olive oil in a non-stick frying pan over a medium heat.' : 'Warm a non-stick frying pan over a medium-low heat; this recipe does not include frying oil.';
  const transfer = 'Transfer to a clean plate; keep the pan for the vegetables. Never reuse the plate or utensils that held the raw food without washing them.';
  if (item === 'cooked green lentils') return {prep: `Use ${amount} ready-cooked green lentils; drain before weighing. Do not start this method with dry lentils.`, cook: null, finish: 'Fold in the cooked green lentils and heat gently for 3–5 minutes, stirring, until steaming hot throughout.'};
  if (item === 'firm tofu') return {prep: `Drain and pat dry the ${amount} firm tofu, then cut into 2cm cubes.`, cook: `${heat} Add the firm tofu and cook for 8–10 minutes, turning carefully until lightly golden on several sides and hot through. ${transfer}`, finish: 'Return the cooked firm tofu and any collected juices to the pan; fold gently to keep the cubes intact.'};
  if (item === 'salmon fillet') return {prep: `Check the ${amount} salmon fillet for bones. Keep it as a fillet for pan cooking, then flake it after cooking.`, cook: `${heat} Put in the salmon fillet, skin-side down if it has skin. Cook for 4–5 minutes, turn carefully and cook for another 3–5 minutes until the centre is opaque, steaming hot and flakes easily; a thicker piece needs longer. ${transfer}`, finish: 'Flake the cooked salmon into large pieces and fold into the pan at the end; avoid breaking it up with vigorous stirring.'};
  if (item === 'raw king prawns') return {prep: `Use ${amount} peeled raw king prawns. Fully defrost frozen prawns in the fridge and drain before cooking. Keep them separate from the prepared vegetables.`, cook: `${heat} Add the raw king prawns in one layer and cook for 3–5 minutes, turning, until every prawn is pink outside and opaque in the centre with no translucent flesh. ${transfer}`, finish: 'Return the cooked prawns at the end and heat for 1 minute until the whole dish is steaming hot; do not simmer them through the longer vegetable cooking stage.'};
  if (item === 'turkey mince' || item === '5% beef mince') return {prep: `Keep the ${amount} ${item} chilled until the pan is ready. Do not rinse raw mince.`, cook: `${heat} Add the ${item}, break it into small pieces with a spatula and cook for 8–10 minutes, stirring until no raw clumps remain and it is steaming hot throughout. ${safeMeat} ${transfer}`, finish: `Return the cooked ${item} and its juices to the pan and stir through.`};
  const cut = format === 'stir-fry' ? 'thin strips about 1cm thick' : 'pieces no larger than 2cm';
  return {prep: `Cut the ${amount} ${item} into ${cut} on a separate board. Wash hands, the board and knife after handling the raw meat; do not rinse it.`, cook: `${heat} Add the ${item} in one layer and cook for ${format === 'stir-fry' ? '7–10' : '10–12'} minutes, turning regularly. Lower the heat if the outside browns too quickly. ${safeMeat} ${transfer}`, finish: `Return the cooked ${item} and its juices to the pan and stir through.`};
}

export function repairPanMethod(recipe) {
  const match = /^industrial-v3-(curry|chilli|stir-fry)-/.exec(recipe.id) || /^industrial-dinner-.+-(curry|chilli|stir-fry)$/.exec(recipe.id);
  if (!match) return null;
  const format = match[1], rows = recipe.ingredients, byItem = new Map(rows.map(row => [row.item, row]));
  if (byItem.size !== rows.length) throw new Error(`Duplicate ingredient needs resolution: ${recipe.id}`);
  const proteins = rows.filter(row => PROTEINS.has(row.item));
  if (proteins.length !== 1) throw new Error(`Unsupported protein combination: ${recipe.id}`);
  const protein = proteins[0], oil = byItem.has('olive oil'), tomato = byItem.has('chopped tomatoes'), cold = byItem.has('light mayonnaise');
  const grain = rows.find(row => /^(basmati rice, dry|brown rice, dry|wholewheat noodles)$/.test(row.item));
  if (!grain) throw new Error(`Missing expected dry base: ${recipe.id}`);
  const allowed = new Set([...PROTEINS, ...HOT_SAUCES, grain.item, 'olive oil', 'onion', 'mixed peppers', 'red pepper', 'broccoli', 'spinach', 'kidney beans', 'chopped tomatoes', 'medium curry paste', 'smoked paprika', 'light mayonnaise', 'garlic powder', 'dried parsley', 'lemon juice']);
  if (rows.some(row => !allowed.has(row.item))) throw new Error(`Unmapped pan ingredient: ${recipe.id}`);
  const label = item => `${byItem.get(item).amount} ${item}`;
  const p = proteinSteps(protein.item, protein.amount, oil, format);
  const method = [], equipment = ['hob', 'non-stick frying pan with lid', 'saucepan', 'sieve or colander', 'knife', 'chopping board', 'spatula', 'clean plate'];
  if (/chicken|turkey|beef|pork/.test(protein.item)) equipment.push('food thermometer');
  const dryName = grain.item.replace(', dry', '');
  if (format === 'stir-fry') {
    equipment.push('slotted spoon');
    method.push(`The listed ${grain.amount} ${dryName} is an uncooked weight. Cut the ${label('broccoli')} into small florets. Bring a saucepan of water to the boil, cook the broccoli for 3–4 minutes until just tender, then lift it onto a plate with a slotted spoon. Cook the noodles in the same boiling water for the time on their packet until tender, then drain well. Time this to finish shortly before the pan ingredients are ready.`);
  } else {
    method.push(`Start the ${grain.amount} ${dryName} first: this is the uncooked weight. Use the water quantity and cooking time on the rice packet; simmer until tender, then drain if the packet method requires it. Keep covered briefly while finishing the pan, then serve immediately.`);
  }
  const prep = [];
  if (byItem.has('onion')) prep.push(`peel and finely slice the ${label('onion')}`);
  if (byItem.has('mixed peppers')) prep.push(`deseed and thinly slice the ${label('mixed peppers')}`);
  if (byItem.has('red pepper')) prep.push(`deseed and dice the ${label('red pepper')}`);
  if (byItem.has('spinach')) prep.push(`wash and drain the ${label('spinach')}`);
  if (byItem.has('kidney beans')) prep.push(`drain and rinse canned, ready-cooked kidney beans, then weigh out ${byItem.get('kidney beans').amount}; raw or dried kidney beans cannot be used in this method`);
  method.push(`${prep.length ? `${join(prep)}. ` : ''}${p.prep}`.replace(/^./, char => char.toUpperCase()));
  if (cold) {
    equipment.push('small bowl', 'spoon');
    const dressing = ['light mayonnaise', 'garlic powder', 'lemon juice', 'dried parsley'].filter(item => byItem.has(item));
    method.push(`Mix ${join(dressing.map(label))} in a small bowl. Keep this dressing cold until serving; it is not a cooking sauce and must not be simmered in the pan.`);
  }
  if (p.cook) method.push(p.cook);

  if (tomato) {
    const seasoning = byItem.has('medium curry paste') ? label('medium curry paste') : label('smoked paprika');
    method.push(`Put the ${label('chopped tomatoes')} and ${seasoning} into ${p.cook ? 'the same frying pan' : 'the non-stick frying pan'}. Stir over a medium-low heat, then cover and simmer gently for 5 minutes. Stir twice; keep the heat low enough that the tomato liquid does not boil dry.`);
    if (byItem.has('kidney beans')) method.push('Add the drained kidney beans, cover and simmer for 5 minutes, stirring halfway, until the beans are hot through.');
    if (byItem.has('spinach')) method.push('Add the washed spinach in two handfuls, cover for 1 minute, then stir. Cook for another 2–3 minutes until wilted throughout.');
    method.push(`${p.finish}${['raw king prawns', 'cooked green lentils'].includes(protein.item) ? '' : ' Heat everything together over a low heat for 2–3 minutes, stirring gently, until steaming hot throughout.'} Spoon over the freshly cooked rice and serve immediately.`);
  } else {
    const vegetables = ['onion', 'mixed peppers', 'red pepper'].filter(item => byItem.has(item));
    const start = oil ? `Add ${p.cook ? 'the remaining half of' : 'all'} the listed olive oil to ${p.cook ? 'the same pan' : 'the non-stick frying pan'}.` : `Use the non-stick pan over a medium-low heat; no oil is listed for this recipe.`;
    method.push(`${start} Add ${join(vegetables.map(label))} and cook for ${format === 'stir-fry' ? '4–6' : '6–8'} minutes, stirring often, until softened with some bite. ${!oil ? 'Cover between stirs for the first 3 minutes so the peppers soften in their own moisture; lower the heat if they catch.' : 'Keep the heat moderate so the small measured amount of oil does not smoke.'}`);
    if (byItem.has('kidney beans')) method.push('Add the drained kidney beans. Cover and heat for 3–4 minutes over a low heat, stirring halfway, until the beans are steaming hot.');
    if (format === 'stir-fry') method.push('Add the drained noodles and broccoli to the pan. Toss gently for 1–2 minutes to combine without crushing the florets.');
    const hotSauces = rows.filter(row => HOT_SAUCES.has(row.item));
    if (hotSauces.length > 1 || (!hotSauces.length && !cold)) throw new Error(`Unresolved sauce: ${recipe.id}`);
    if (hotSauces.length) method.push(`Turn the heat to low and fold in the ${label(hotSauces[0].item)}. Stir for 1–2 minutes until hot, following any longer heating instruction on the sauce label. This measured sauce coats the food; do not boil it dry or add an unlisted jar of sauce.`);
    method.push(`${p.finish} Heat gently until the whole pan is steaming hot${protein.item === 'salmon fillet' || protein.item === 'raw king prawns' ? ', folding carefully so the seafood stays intact' : ', stirring to distribute the heat'}. ${format === 'stir-fry' ? 'Divide the noodles, vegetables and ' + protein.item + ' between serving bowls.' : 'Spoon the pan mixture over the freshly cooked rice.'}${cold ? ' Take the pan off the heat and spoon the cold dressing over each serving; do not return it to the hob.' : ''} Serve immediately.`);
  }
  const result = {method, equipment};
  if (cold && (format === 'curry' || format === 'chilli')) {
    result.title = recipe.title.replace(/\b(?:Proper )?Curry\b/i, 'Rice Bowl').replace(/\b(?:Big )?Chilli\b/i, 'and Bean Rice Bowl');
    result.authoring_notes = ['Candidate title now describes its actual rice, vegetables, protein and cold mayonnaise dressing; no curry or chilli ingredient was added or inferred.'];
  }
  return result;
}
