import {buildIndustrialCatalogue as buildV5} from './industrial-catalogue-v5.js';

const EXPLICIT_PORTION_AMOUNTS=new Map([
  ['wholemeal bap','80g'],
  ['wholemeal wrap','65g'],
  ['wholemeal bread','80g'],
  ['wholemeal bagel','90g'],
  ['wholemeal pitta','80g'],
  ['brown rice, dry','75g dry'],
  ['wholewheat pasta, dry','75g dry'],
  ['baking potato','300g'],
  ['couscous, dry','75g dry'],
  ['wholewheat noodles','75g dry'],
  ['wholemeal burger bun','80g'],
  ['wholemeal flatbread','80g'],
  ['oven chips','250g'],
  ['individual pizza base','150g']
]);
const EXPLICIT_MEASURED_AMOUNTS=new Map([
  ['olive oil','5ml'],
  ['medium curry paste','25g'],
  ['reduced-salt soy sauce','15ml'],
  ['smoked paprika','5g'],
  ['reduced-fat cheddar','30g'],
  ['0% Greek yoghurt','50g'],
  ['reduced-salt stock','250ml']
]);

function explicitAmount(ingredient){
  const amount=String(ingredient?.amount||'').trim();
  const item=String(ingredient?.item||'');
  if(amount==='1 portion'&&EXPLICIT_PORTION_AMOUNTS.has(item))return {...ingredient,amount:EXPLICIT_PORTION_AMOUNTS.get(item)};
  if(amount==='1 measured portion'&&EXPLICIT_MEASURED_AMOUNTS.has(item))return {...ingredient,amount:EXPLICIT_MEASURED_AMOUNTS.get(item)};
  if(amount==='2'&&(item==='large eggs'||item==='boiled eggs'))return {...ingredient,amount:'2 / 100g'};
  return ingredient;
}

export function buildIndustrialCatalogue(){
  const c=buildV5();
  let repairedPortionAmounts=0,repairedMeasuredAmounts=0,repairedEggAmounts=0;
  const recipes=c.recipes.map(recipe=>({...recipe,ingredients:(recipe.ingredients||[]).map(ingredient=>{
    const fixed=explicitAmount(ingredient);
    if(fixed!==ingredient){
      const before=String(ingredient.amount).trim();
      if(before==='1 portion')repairedPortionAmounts++;
      else if(before==='1 measured portion')repairedMeasuredAmounts++;
      else repairedEggAmounts++;
    }
    return fixed;
  })}));
  return {...c,recipes,metrics:{...c.metrics,repairedPortionAmounts,repairedMeasuredAmounts,repairedEggAmounts,grubAuthored:recipes.length,totalWithOriginalStructured:{grub:recipes.length+32,fit:c.exercises.length+32}}};
}
