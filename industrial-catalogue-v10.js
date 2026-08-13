import {buildIndustrialCatalogue as buildV9} from './industrial-catalogue-v9.js';

// Editorial coherence layer. Review remains draft: this only removes combinations
// the independent pack showed were not credible member food.
const SWEET_MOD_ITEMS=new Set(['pumpkin seeds','mixed berries','apple, diced','banana, sliced','unsweetened cocoa powder','ground cinnamon','lemon zest','orange juice']);
const SAVOURY_VARIANTS={
  classic:{label:'Pepper',ingredient:{amount:'1/4 tsp',item:'black pepper'}},
  berry:{label:'Tomato',ingredient:{amount:'60g',item:'tomato'}},
  apple:{label:'Mustard',ingredient:{amount:'5g',item:'wholegrain mustard',allergens:['mustard']}},
  banana:{label:'Red Pepper',ingredient:{amount:'60g',item:'red pepper'}},
  cocoa:{label:'Paprika',ingredient:{amount:'1g',item:'paprika'}},
  cinnamon:{label:'Rocket',ingredient:{amount:'50g',item:'rocket'}},
  lemon:{label:'Cucumber',ingredient:{amount:'60g',item:'cucumber'}},
  orange:{label:'Brown Sauce',ingredient:{amount:'10g',item:'brown sauce'}}
};
const SAVOURY_BASES={
  'egg-snack-box':{name:'Egg Snack Box',step:'Halve the eggs and pack them with the vegetables, crackers and measured savoury add-on.'},
  'bean-dip-box':{name:'Bean Dip Box',step:'Lightly crush the chickpeas with the measured savoury add-on, then pack with the vegetables and crackers.'},
  'tuna-snack-pot':{name:'Tuna Snack Pot',step:'Drain the tuna well, combine it with the vegetables and measured savoury add-on, and keep the crackers separate until eating.'}
};
const text=x=>String(x||'');
function suffix(id,keys){return keys.find(key=>text(id).endsWith(`-${key}`))}
function provenance(recipe,repair){return{...recipe,provenance:{...(recipe.provenance||{}),editorial_repairs_v10:[...new Set([...(recipe.provenance?.editorial_repairs_v10||[]),repair])]}}}
function repairLegacySavorySnack(recipe){
  const id=text(recipe.id),baseKey=Object.keys(SAVOURY_BASES).find(key=>id.includes(`-${key}-`));
  if(!baseKey)return recipe;
  const variant=SAVOURY_VARIANTS[suffix(id,Object.keys(SAVOURY_VARIANTS))];
  if(!variant)return recipe;
  const ingredients=(recipe.ingredients||[]).filter(x=>!SWEET_MOD_ITEMS.has(text(x.item))).map(x=>({...x}));
  ingredients.push({...variant.ingredient});
  const base=SAVOURY_BASES[baseKey];
  const allergens=[...new Set([...(recipe.allergens||[]),...(variant.ingredient.allergens||[])])];
  const method=['Measure everything before assembling the snack so the portion stays intentional.',base.step,'Keep chilled protein and vegetables refrigerated until you are ready to eat.','Eat immediately or cover and refrigerate; use within 24 hours and follow the shortest ingredient use-by date.'];
  return provenance({...recipe,title:`${variant.label} ${base.name}`,ingredients,allergens,method},'savory-snack-variant-coherence');
}
export function buildIndustrialCatalogue(){
  const c=buildV9();let repaired=0;
  const recipes=c.recipes.map(recipe=>{const next=repairLegacySavorySnack(recipe);if(next!==recipe)repaired++;return next});
  return{...c,recipes,metrics:{...c.metrics,editorialV10RecipesRepaired:repaired,grubAuthored:recipes.length,totalWithOriginalStructured:{grub:recipes.length+32,fit:c.exercises.length+32}}};
}
