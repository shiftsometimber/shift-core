import {buildIndustrialCatalogue as buildV5} from './industrial-catalogue-v5.js';

const EXPLICIT_PORTION_AMOUNTS=new Map([
  ['wholemeal bap','80g'],
  ['wholemeal wrap','65g'],
  ['wholemeal bread','80g'],
  ['wholemeal bagel','90g'],
  ['wholewheat noodles','75g dry'],
  ['wholemeal burger bun','80g'],
  ['wholemeal flatbread','80g'],
  ['oven chips','250g'],
  ['individual pizza base','150g']
]);

function explicitAmount(ingredient){
  const amount=String(ingredient?.amount||'').trim();
  const item=String(ingredient?.item||'');
  if(amount==='1 portion'&&EXPLICIT_PORTION_AMOUNTS.has(item))return {...ingredient,amount:EXPLICIT_PORTION_AMOUNTS.get(item)};
  if(amount==='2'&&(item==='large eggs'||item==='boiled eggs'))return {...ingredient,amount:'2 / 100g'};
  return ingredient;
}

export function buildIndustrialCatalogue(){
  const c=buildV5();
  let repairedPortionAmounts=0,repairedEggAmounts=0;
  const recipes=c.recipes.map(recipe=>({...recipe,ingredients:(recipe.ingredients||[]).map(ingredient=>{
    const fixed=explicitAmount(ingredient);
    if(fixed!==ingredient){
      if(String(ingredient.amount).trim()==='1 portion')repairedPortionAmounts++;
      else repairedEggAmounts++;
    }
    return fixed;
  })}));
  return {...c,recipes,metrics:{...c.metrics,repairedPortionAmounts,repairedEggAmounts,grubAuthored:recipes.length,totalWithOriginalStructured:{grub:recipes.length+32,fit:c.exercises.length+32}}};
}
