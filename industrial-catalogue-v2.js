import {buildIndustrialCatalogue as buildV1} from './industrial-catalogue-v1.js';
const MODS={
  classic:{amount:'10g',item:'pumpkin seeds',instruction:'Finish with measured pumpkin seeds for crunch.'},
  berry:{amount:'60g',item:'mixed berries',instruction:'Add the measured berries just before eating.'},
  apple:{amount:'60g',item:'apple, diced',instruction:'Fold through the measured diced apple.'},
  banana:{amount:'60g',item:'banana, sliced',instruction:'Add the measured sliced banana just before eating.'},
  cocoa:{amount:'1 tsp / 4g',item:'unsweetened cocoa powder',instruction:'Stir through the measured cocoa powder.'},
  cinnamon:{amount:'1/2 tsp / 1g',item:'ground cinnamon',instruction:'Finish with the measured cinnamon.'},
  lemon:{amount:'1 tsp / 2g',item:'lemon zest',instruction:'Add the measured lemon zest just before eating.'},
  orange:{amount:'1 tsp / 2g',item:'orange zest',instruction:'Add the measured orange zest just before eating.'}
};
function snackMod(id){for(const key of Object.keys(MODS))if(String(id).endsWith(`-${key}`))return MODS[key];return null}
export function buildIndustrialCatalogue(){
  const c=buildV1();
  const recipes=c.recipes.map(r=>{if(r.meal_type!=='snack')return r;const mod=snackMod(r.id);if(!mod)return r;return{...r,ingredients:[...r.ingredients,{amount:mod.amount,item:mod.item}],method:[...r.method,mod.instruction],variation_identity:String(r.id).split('-').at(-1)};});
  return{...c,recipes,metrics:{...c.metrics,grubAuthored:recipes.length}};
}
