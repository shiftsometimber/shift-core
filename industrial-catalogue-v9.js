import {buildIndustrialCatalogue as buildV8} from './industrial-catalogue-v8.js';

// Final quarantine repair wave. These are recipe-content repairs, not nutrition
// shortcuts: vague/non-CoFID generator labels are replaced with explicit edible
// ingredients that still match the member-facing recipe idea.
const COMPONENTS={
  'oven hash brown':[
    {amount:'120g',item:'baby potatoes'},
    {amount:'20g',item:'onion'},
    {amount:'5ml',item:'olive oil'}
  ],
  'lemon dressing':[
    {amount:'5ml',item:'olive oil'},
    {amount:'5ml',item:'lemon juice'},
    {amount:'4g',item:'wholegrain mustard',allergens:['mustard']}
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
function allergens(ingredients){return [...new Set((ingredients||[]).flatMap(x=>x.allergens||[]))]}
function repair(recipe){
  let changed=false;
  let ingredients=[];
  let title=String(recipe.title||'');
  let tags=[...(recipe.tags||[])];
  let related=[...(recipe.relationships?.related_tags||[])];
  let facets=[...(recipe.relationships?.brain_facets||[])];
  const repairs=[];

  for(const ingredient of recipe.ingredients||[]){
    if(ingredient.item==='orange zest'){
      changed=true;repairs.push('orange-zest-to-juice');
      ingredients.push({amount:'15ml',item:'orange juice'});
      continue;
    }
    if(ingredient.item==='lemon zest'&&/tsp/i.test(String(ingredient.amount||''))){
      changed=true;repairs.push('lemon-zest-measure-normalised');
      ingredients.push({...ingredient,amount:'1g'});
      continue;
    }
    if(ingredient.item==='vanilla extract'){
      changed=true;repairs.push('unsupported-vanilla-to-cinnamon');
      ingredients.push({amount:'1/2 tsp',item:'ground cinnamon'});
      title=title.replace(/Berry Vanilla/gi,'Berry Cinnamon');
      continue;
    }
    if(ingredient.item==='black beans'||ingredient.item==='mixed beans'){
      changed=true;repairs.push('unsupported-bean-to-kidney-beans');
      ingredients.push({...ingredient,item:'kidney beans'});
      title=title.replace(/Black Beans/gi,'Kidney Beans').replace(/Mixed Beans/gi,'Kidney Beans');
      continue;
    }
    if(ingredient.item==='caramel flavouring'){
      changed=true;repairs.push('caramel-flavour-to-honey');
      ingredients.push({amount:'8g',item:'honey'});
      title=title.replace(/Caramel-Style/gi,'Honey');
      tags=tags.map(x=>x==='caramel'?'honey':x);
      related=related.map(x=>x==='caramel'?'honey':x);
      facets=facets.map(x=>x==='style:caramel'?'style:honey':x);
      continue;
    }
    if(ingredient.item==='reduced-salt stock'){
      changed=true;repairs.push('measurable-reduced-salt-stock');
      ingredients.push({amount:'5g',item:'reduced-salt vegetable stock cube (make up to 250ml with water)'});
      continue;
    }
    const parts=COMPONENTS[ingredient.item];
    if(parts){changed=true;repairs.push(`explicit-${ingredient.item.replaceAll(' ','-')}`);ingredients.push(...parts);continue}
    ingredients.push(ingredient);
  }
  if(!changed)return recipe;
  ingredients=mergeIngredients(ingredients);
  return{
    ...recipe,
    title,
    ingredients,
    tags,
    allergens:allergens(ingredients),
    relationships:{...(recipe.relationships||{}),related_tags:related,brain_facets:facets},
    provenance:{...(recipe.provenance||{}),final_quarantine_repairs:[...new Set(repairs)]}
  };
}

export function buildIndustrialCatalogue(){
  const c=buildV8();
  let repairedRecipes=0;
  const recipes=c.recipes.map(r=>{const x=repair(r);if(x!==r)repairedRecipes++;return x});
  return {...c,recipes,metrics:{...c.metrics,finalQuarantineRecipesRepaired:repairedRecipes,grubAuthored:recipes.length,totalWithOriginalStructured:{grub:recipes.length+32,fit:c.exercises.length+32}}};
}
