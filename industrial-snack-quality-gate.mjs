import {buildIndustrialCatalogue} from './industrial-catalogue-v10.js';

let bad=false;
const must=(condition,message)=>{if(!condition){console.error(`FAIL ${message}`);bad=true;}};
const catalogue=buildIndustrialCatalogue();
const snacks=catalogue.recipes.filter(r=>r.meal_type==='snack');
const v4=snacks.filter(r=>String(r.id).startsWith('industrial-v4-'));
const forbidden=new Set(['flavouring or spice to match the title']);
let placeholderCount=0,absurdQuantity=0,sweetSavoryCollision=0,eggDessertCollision=0,coffeeFruitCollision=0;
const savoryIds=['egg-snack-box','bean-dip-box','tuna-snack-pot'];
const sweetTerms=/\b(berry|banana|cocoa|cinnamon|lemon|orange)\b/i;
for(const recipe of snacks){
  for(const ingredient of recipe.ingredients||[]){
    if(forbidden.has(ingredient.item))placeholderCount++;
    if(['cinnamon','instant espresso','lemon zest','orange zest','unsweetened cocoa','peanut butter','pumpkin seeds','dark chocolate chips'].includes(ingredient.item)&&/^80g$/i.test(String(ingredient.amount)))absurdQuantity++;
  }
  const id=String(recipe.id||''),title=String(recipe.title||'');
  if(savoryIds.some(x=>id.includes(`-${x}-`))&&sweetTerms.test(title))sweetSavoryCollision++;
  if(id.startsWith('industrial-v4-')&&/dessert|protein pot|work snack|big feed/i.test(title)&&(recipe.ingredients||[]).some(x=>x.item==='boiled eggs'))eggDessertCollision++;
  if(id.startsWith('industrial-v4-')&&/coffee fruit crunch/i.test(title))coffeeFruitCollision++;
}
must(v4.length===408,`industrial V4 snack set remains 408 recipes (found ${v4.length})`);
must(placeholderCount===0,`no placeholder flavour/spice ingredients remain (found ${placeholderCount})`);
must(absurdQuantity===0,`no known seasoning/flavour ingredient retains the former 80g blanket amount (found ${absurdQuantity})`);
must(sweetSavoryCollision===0,`no sweet modifier title remains on tuna/egg/bean savoury snack families (found ${sweetSavoryCollision})`);
must(eggDessertCollision===0,`no boiled-egg base remains inside V4 dessert/treat families (found ${eggDessertCollision})`);
must(coffeeFruitCollision===0,`no Coffee Fruit Crunch collision remains (found ${coffeeFruitCollision})`);
if(bad)process.exit(1);
console.log(JSON.stringify({proof:'INDUSTRIAL_SNACK_EDITORIAL_QUALITY',snacks:snacks.length,v4Snacks:v4.length,placeholderIngredients:placeholderCount,absurdBlanketQuantities:absurdQuantity,sweetSavoryCollisions:sweetSavoryCollision,eggDessertCollisions:eggDessertCollision,coffeeFruitCollisions:coffeeFruitCollision},null,2));
console.log('PASS industrial snack editorial quality: placeholder/quantity defects remain closed and the second-person review defects for sweet-savory combinations are now prevented systemically.');
