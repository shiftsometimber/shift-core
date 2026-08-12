import {buildIndustrialCatalogue} from './industrial-catalogue-v5.js';

let bad=false;
const must=(condition,message)=>{if(!condition){console.error(`FAIL ${message}`);bad=true;}};
const catalogue=buildIndustrialCatalogue();
const snacks=catalogue.recipes.filter(r=>String(r.id).startsWith('industrial-v4-'));
const forbidden=new Set(['flavouring or spice to match the title']);
const expectedStyle={
  classic:['cinnamon','1g'],berry:['mixed berries','80g'],apple:['diced apple','80g'],banana:['sliced banana','80g'],chocolate:['unsweetened cocoa','5g'],peanut:['peanut butter','15g'],coffee:['instant espresso','1g'],lemon:['lemon zest','1g'],orange:['orange zest','1g'],caramel:['caramel flavouring','2ml'],cherry:['cherries','80g'],mango:['mango','80g'],pineapple:['pineapple','80g'],'biscoff-style':['crushed wholegrain biscuit','20g'],'cheesecake-style':['light cream cheese','30g'],crunch:['pumpkin seeds','15g'],'weekend-treat':['dark chocolate chips','15g']
};
let placeholderCount=0,missingStyle=0,absurdQuantity=0;
for(const recipe of snacks){
  for(const ingredient of recipe.ingredients||[]){
    if(forbidden.has(ingredient.item))placeholderCount++;
    if(['cinnamon','instant espresso','lemon zest','orange zest','unsweetened cocoa','peanut butter','pumpkin seeds','dark chocolate chips'].includes(ingredient.item)&&/^80g$/i.test(String(ingredient.amount)))absurdQuantity++;
  }
  const style=(recipe.tags||[]).find(t=>Object.hasOwn(expectedStyle,t));
  const expected=expectedStyle[style];
  if(!expected||!(recipe.ingredients||[]).some(i=>i.item===expected[0]&&String(i.amount)===expected[1]))missingStyle++;
}
must(snacks.length===408,`industrial snack set remains 408 recipes (found ${snacks.length})`);
must(placeholderCount===0,`no placeholder flavour/spice ingredients remain (found ${placeholderCount})`);
must(absurdQuantity===0,`no known seasoning/flavour ingredient retains the former 80g blanket amount (found ${absurdQuantity})`);
must(missingStyle===0,`all 408 snacks carry the recipe-specific style ingredient and quantity (missing ${missingStyle})`);
if(bad)process.exit(1);
console.log(JSON.stringify({proof:'INDUSTRIAL_SNACK_RECIPE_QUALITY',snacks:snacks.length,placeholderIngredients:placeholderCount,missingStyleQuantities:missingStyle,absurdBlanketQuantities:absurdQuantity},null,2));
console.log('PASS industrial snack quality: 408 recipe objects use explicit style-specific ingredients/quantities with the placeholder removed.');
