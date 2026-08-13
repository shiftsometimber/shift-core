import {buildIndustrialCatalogue as buildV6} from './industrial-catalogue-v6.js';

// V3 deliberately varied flavour identities, but assigned the same 40g amount to
// sauces, relishes, dressings, cheese and dry seasonings. That is measurable but
// not credible recipe content. Repair those shared families once before nutrition.
const DRY_SEASONINGS=new Set([
  'Cajun seasoning','salt and pepper seasoning','kebab seasoning','hot chicken seasoning'
]);
const RELISHES=new Set([
  'brown sauce','smoked paprika relish','black pepper relish','hot pepper sauce','tomato relish',
  'chipotle salsa','tomato and herb relish','caramelised onion relish','tomato salsa','pickle mustard relish',
  'tomato pepper relish','burger relish','smoked chilli relish'
]);
const MAYO_DRESSINGS=new Set([
  'light mayonnaise','mustard mayo','light Caesar dressing','smoked paprika dressing','house burger sauce',
  'loaded house sauce','house treat sauce'
]);
const CHEESE=new Set(['reduced-fat cheddar']);

function repair(ingredient){
  const item=String(ingredient?.item||'');
  const amount=String(ingredient?.amount||'').trim();
  if(amount!=='40g') return ingredient;
  if(DRY_SEASONINGS.has(item)) return {...ingredient,amount:'5g'};
  if(RELISHES.has(item)) return {...ingredient,amount:'30g'};
  if(MAYO_DRESSINGS.has(item)) return {...ingredient,amount:'30g'};
  if(CHEESE.has(item)) return {...ingredient,amount:'30g'};
  return ingredient;
}

export function buildIndustrialCatalogue(){
  const c=buildV6();
  let repairedFlavourAmounts=0;
  const recipes=c.recipes.map(recipe=>({...recipe,ingredients:(recipe.ingredients||[]).map(ingredient=>{
    const fixed=repair(ingredient);
    if(fixed!==ingredient) repairedFlavourAmounts++;
    return fixed;
  })}));
  return {...c,recipes,metrics:{...c.metrics,repairedFlavourAmounts,grubAuthored:recipes.length,totalWithOriginalStructured:{grub:recipes.length+32,fit:c.exercises.length+32}}};
}
