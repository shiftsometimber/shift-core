import {buildIndustrialCatalogue as buildV7} from './industrial-catalogue-v7.js';

// The remaining nutrition quarantine is dominated by generated composite labels
// ("house sauce", "Cajun seasoning", "peppercorn sauce", etc.) that do not have
// a trustworthy one-row CoFID identity. Do not force a dubious proxy. Replace
// those generated labels with explicit measurable ingredients whose nutrition
// can be governed independently and propagated honestly.
const COMPONENTS={
  'toasted oat crunch':[
    {amount:'15g',item:'rolled oats',allergens:['gluten']},
    {amount:'5g',item:'pumpkin seeds'}
  ],
  'light peppercorn sauce':[
    {amount:'20g',item:'light mayonnaise',allergens:['egg']},
    {amount:'4g',item:'wholegrain mustard',allergens:['mustard']},
    {amount:'1g',item:'black pepper'}
  ],
  'buffalo hot sauce':[
    {amount:'20g',item:'tomato ketchup'},
    {amount:'2g',item:'chilli powder'},
    {amount:'2g',item:'paprika'},
    {amount:'5ml',item:'cider vinegar'}
  ],
  'Cajun seasoning':[
    {amount:'2g',item:'paprika'},
    {amount:'1g',item:'chilli powder'},
    {amount:'1g',item:'garlic powder'},
    {amount:'1g',item:'dried oregano'}
  ],
  'chipotle salsa':[
    {amount:'20g',item:'tomato ketchup'},
    {amount:'2g',item:'chilli powder'},
    {amount:'1g',item:'paprika'},
    {amount:'5ml',item:'cider vinegar'}
  ],
  'garlic herb sauce':[
    {amount:'20g',item:'light mayonnaise',allergens:['egg']},
    {amount:'1g',item:'garlic powder'},
    {amount:'1g',item:'dried parsley'}
  ],
  'lemon herb sauce':[
    {amount:'20g',item:'light mayonnaise',allergens:['egg']},
    {amount:'5ml',item:'lemon juice'},
    {amount:'1g',item:'dried parsley'}
  ],
  'salt and pepper seasoning':[
    {amount:'3g',item:'salt'},
    {amount:'2g',item:'black pepper'}
  ],
  'kebab seasoning':[
    {amount:'2g',item:'paprika'},
    {amount:'1g',item:'chilli powder'},
    {amount:'1g',item:'garlic powder'},
    {amount:'1g',item:'dried oregano'}
  ],
  'hot chicken seasoning':[
    {amount:'2g',item:'paprika'},
    {amount:'2g',item:'chilli powder'},
    {amount:'1g',item:'garlic powder'}
  ],
  'house burger sauce':[
    {amount:'15g',item:'light mayonnaise',allergens:['egg']},
    {amount:'10g',item:'tomato ketchup'},
    {amount:'5g',item:'wholegrain mustard',allergens:['mustard']}
  ],
  'loaded house sauce':[
    {amount:'15g',item:'light mayonnaise',allergens:['egg']},
    {amount:'10g',item:'tomato ketchup'},
    {amount:'2g',item:'paprika'},
    {amount:'2g',item:'chilli powder'}
  ],
  'house treat sauce':[
    {amount:'15g',item:'light mayonnaise',allergens:['egg']},
    {amount:'10g',item:'tomato ketchup'},
    {amount:'2g',item:'paprika'},
    {amount:'1g',item:'garlic powder'}
  ],
  'smoked chilli relish':[
    {amount:'20g',item:'tomato ketchup'},
    {amount:'2g',item:'chilli powder'},
    {amount:'2g',item:'paprika'},
    {amount:'5ml',item:'cider vinegar'}
  ],
  'black pepper relish':[
    {amount:'20g',item:'tomato ketchup'},
    {amount:'1g',item:'black pepper'},
    {amount:'5ml',item:'cider vinegar'}
  ],
  'hot pepper sauce':[
    {amount:'20g',item:'tomato ketchup'},
    {amount:'2g',item:'chilli powder'},
    {amount:'5ml',item:'cider vinegar'}
  ],
  'smoked paprika relish':[
    {amount:'20g',item:'tomato ketchup'},
    {amount:'2g',item:'paprika'},
    {amount:'5ml',item:'cider vinegar'}
  ],
  'tomato relish':[
    {amount:'25g',item:'tomato ketchup'},
    {amount:'5ml',item:'cider vinegar'}
  ],
  'tomato and herb relish':[
    {amount:'25g',item:'tomato ketchup'},
    {amount:'1g',item:'dried oregano'},
    {amount:'5ml',item:'cider vinegar'}
  ],
  'garlic and parsley yoghurt':[
    {amount:'35g',item:'0% Greek yoghurt',allergens:['milk']},
    {amount:'1g',item:'garlic powder'},
    {amount:'1g',item:'dried parsley'}
  ],
  'caramelised onion relish':[
    {amount:'20g',item:'onion'},
    {amount:'10g',item:'tomato ketchup'},
    {amount:'5ml',item:'cider vinegar'}
  ]
};

function parseMeasured(amount){
  const m=String(amount||'').trim().match(/^(\d+(?:\.\d+)?)\s*(g|ml)$/i);
  return m?{value:Number(m[1]),unit:m[2].toLowerCase()}:null;
}
function mergeIngredients(items){
  const out=[];
  for(const ingredient of items){
    const current=out.find(x=>x.item===ingredient.item);
    const a=current&&parseMeasured(current.amount),b=parseMeasured(ingredient.amount);
    if(current&&a&&b&&a.unit===b.unit){
      current.amount=`${Math.round((a.value+b.value)*10)/10}${a.unit}`;
      current.allergens=[...new Set([...(current.allergens||[]),...(ingredient.allergens||[])])];
    }else out.push({...ingredient});
  }
  return out;
}
function derivedAllergens(ingredients){
  return [...new Set((ingredients||[]).flatMap(x=>x.allergens||[]))];
}
function replaceMethod(method,target){
  return (method||[]).map(step=>String(step).replace(`measured ${target}`,'measured flavour ingredients').replace(`the ${target}`,'the flavour ingredients'));
}
function repairCompositeRecipe(recipe){
  let changed=false;
  let ingredients=[];
  let method=recipe.method||[];
  for(const ingredient of recipe.ingredients||[]){
    const components=COMPONENTS[ingredient.item];
    if(!components){ingredients.push(ingredient);continue}
    changed=true;
    ingredients.push(...components);
    method=replaceMethod(method,ingredient.item);
  }
  if(!changed)return recipe;
  ingredients=mergeIngredients(ingredients);
  return{
    ...recipe,
    ingredients,
    method,
    allergens:derivedAllergens(ingredients),
    provenance:{...(recipe.provenance||{}),composite_repair:'industrial-v8-explicit-components'}
  };
}

function repairChickenSausage(recipe){
  if(!(recipe.ingredients||[]).some(x=>x.item==='chicken sausages'))return recipe;
  const ingredients=(recipe.ingredients||[]).map(x=>x.item==='chicken sausages'?{...x,item:'chicken breast',amount:'100g'}:x);
  const title=String(recipe.title||'').replace(/Chicken Sausage/gi,'Chicken');
  const method=(recipe.method||[]).map(step=>String(step).replace(/chicken sausages/gi,'chicken breast'));
  const tags=(recipe.tags||[]).map(x=>x==='chicken-sausage'?'chicken':x);
  const relatedTags=(recipe.relationships?.related_tags||[]).map(x=>x==='chicken-sausage'?'chicken':x);
  const brainFacets=(recipe.relationships?.brain_facets||[]).map(x=>x==='protein:chicken-sausage'?'protein:chicken':x);
  return{
    ...recipe,
    title,
    main_protein:'chicken',
    ingredients,
    method,
    tags,
    taxonomy:{...(recipe.taxonomy||{}),main_protein:'chicken'},
    relationships:{...(recipe.relationships||{}),related_tags:relatedTags,brain_facets:brainFacets},
    allergens:derivedAllergens(ingredients),
    provenance:{...(recipe.provenance||{}),protein_repair:'industrial-v8-chicken-breast'}
  };
}

export function buildIndustrialCatalogue(){
  const c=buildV7();
  let compositeRecipesRepaired=0,chickenSausageRecipesRepaired=0;
  const recipes=c.recipes.map(original=>{
    const composite=repairCompositeRecipe(original);
    if(composite!==original)compositeRecipesRepaired++;
    const protein=repairChickenSausage(composite);
    if(protein!==composite)chickenSausageRecipesRepaired++;
    return protein;
  });
  return{
    ...c,
    recipes,
    metrics:{
      ...c.metrics,
      compositeRecipesRepaired,
      chickenSausageRecipesRepaired,
      grubAuthored:recipes.length,
      totalWithOriginalStructured:{grub:recipes.length+32,fit:c.exercises.length+32}
    }
  };
}
