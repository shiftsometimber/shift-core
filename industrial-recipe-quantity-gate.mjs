import {buildIndustrialCatalogue} from './industrial-catalogue-v6.js';

let bad=false;
const must=(condition,message)=>{if(!condition){console.error(`FAIL ${message}`);bad=true;}};
const c=buildIndustrialCatalogue();
const recipes=c.recipes||[];
let vaguePortions=0,vagueMeasuredPortions=0,countOnlyEggs=0,unmeasurableV3Bases=0;
for(const recipe of recipes){
  for(const ingredient of recipe.ingredients||[]){
    const amount=String(ingredient.amount||'').trim();
    if(amount==='1 portion')vaguePortions++;
    if(amount==='1 measured portion')vagueMeasuredPortions++;
    if(amount==='2'&&(ingredient.item==='large eggs'||ingredient.item==='boiled eggs'))countOnlyEggs++;
  }
  if(String(recipe.id).startsWith('industrial-v3-')){
    const base=(recipe.ingredients||[])[1];
    if(base&&!/\d+(?:\.\d+)?\s*(?:g|ml)\b/i.test(String(base.amount||'')))unmeasurableV3Bases++;
  }
}
must(recipes.length===2876,`industrial Grub universe remains 2876 recipes (found ${recipes.length})`);
must(vaguePortions===0,`no vague '1 portion' ingredient quantities remain (found ${vaguePortions})`);
must(vagueMeasuredPortions===0,`no vague '1 measured portion' ingredient quantities remain (found ${vagueMeasuredPortions})`);
must(countOnlyEggs===0,`egg quantities include a measurable weight rather than count only (found ${countOnlyEggs})`);
must(unmeasurableV3Bases===0,`all industrial-v3 recipe base ingredients are measurable by weight/volume (found ${unmeasurableV3Bases})`);
must(Number(c.metrics?.repairedPortionAmounts||0)>0,'systemic portion repair applied');
must(Number(c.metrics?.repairedMeasuredAmounts||0)>0,'systemic measured-portion repair applied');
must(Number(c.metrics?.repairedEggAmounts||0)>0,'systemic egg quantity repair applied');
if(bad)process.exit(1);
console.log(JSON.stringify({proof:'INDUSTRIAL_RECIPE_EXACT_QUANTITY_QUALITY',recipes:recipes.length,vaguePortions,vagueMeasuredPortions,countOnlyEggs,unmeasurableV3Bases,repairedPortionAmounts:c.metrics.repairedPortionAmounts,repairedMeasuredAmounts:c.metrics.repairedMeasuredAmounts,repairedEggAmounts:c.metrics.repairedEggAmounts},null,2));
console.log('PASS industrial recipe exact-quantity quality: generated bases, flavour portions and eggs use explicit measurable quantities rather than serving placeholders.');
