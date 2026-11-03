import test from 'node:test';import assert from 'node:assert/strict';
import {recipeNutrition,proteinMatchedSwaps,ownNutritionTargets,trafficLight,portionNutrition,nutritionDay} from '../v7-nutrition.mjs';
const recipe=(id,p)=>({id,nutrition:{status:'validated',protein_g:p,kcal:500,methodology:'CoFID 2021 ingredient-level weighted calculation'}});
const action=(id,p)=>({id,kind:'food',nutrition:recipeNutrition(recipe(id,p))});
test('ten original actions have three swaps within 5g using unrounded source data',()=>{
 for(let i=0;i<10;i++){
  const original=action('original-'+i,35+i),candidates=[action('a',35+i-1),action('b',35+i),action('c',35+i+3),action('too-high',35+i+5.001),action('too-low',35+i-5.001)];
  const swaps=proteinMatchedSwaps(original,candidates);assert.equal(swaps.length,3);
  for(const picked of [original,...swaps])for(const other of [original,...swaps])assert(Math.abs(picked.nutrition.proteinG-other.nutrition.proteinG)<=5);
  for(const swap of swaps){assert(Math.abs(swap.nutrition.proteinG-original.nutrition.proteinG)<=5);assert.equal(swap.nutrition.source.name,original.nutrition.source.name);assert.equal(swap.nutrition.source.version,original.nutrition.source.version);}
 }
});
test('different database versions, missing values and unverified recipes cannot pass as matched swaps',()=>{
 const original=action('original',45),wrong=action('wrong',45);wrong.nutrition.source.version='other';
 assert.equal(proteinMatchedSwaps(original,[wrong,action('boundary',50),action('outside',50.001)]).length,1);
 assert.equal(recipeNutrition({id:'invented',nutrition:{status:'validated',protein_g:45,kcal:500}}),null);
 assert.equal(recipeNutrition(recipe('real',45)).saltG,null);
});
test('own saved plan targets are used, and absent or zero targets stay unknown',()=>{
 assert.deepEqual(ownNutritionTargets({food:{protein_target:127,calorie_target:2180}}),{proteinG:127,kcal:2180});
 for(const p of [{},{food:{protein_target:0,calorie_target:''}},{food:{protein_target:'NaN'}}])assert.deepEqual(ownNutritionTargets(p),{proteinG:null,kcal:null});
});
test('UK FoP exact boundaries, food/drink differences and large-portion overrides',()=>{
 assert.equal(trafficLight('fatG',3,3,{portionSize:100}),'low');
 assert.equal(trafficLight('fatG',17.5,17.5,{portionSize:100}),'medium');
 assert.equal(trafficLight('fatG',17.5001,17.5001,{portionSize:100}),'high');
 assert.equal(trafficLight('saltG',.3,.3,{portionSize:100}),'low');
 assert.equal(trafficLight('saltG',.3,1.81,{portionSize:604}),'high');
 assert.equal(trafficLight('sugarsG',5,5,{portionSize:100}),'low');
 assert.equal(trafficLight('sugarsG',5,5,{kind:'drink',portionSize:100}),'medium');
 assert.equal(trafficLight('sugarsG',8,14,{kind:'drink',portionSize:175}),'high');
 assert.equal(trafficLight('sugarsG',9,13.5,{kind:'drink',portionSize:150}),'medium');
 for(const k of ['kcal','proteinG','carbohydrateG','fibreG'])assert.equal(trafficLight(k,100,100,{portionSize:200}),null);
 assert.equal(trafficLight('saltG',null,1,{portionSize:200}),null);
});
test('portions preserve source, leave missing nutrients unknown, and actual-eaten totals ignore planned meals',()=>{
 const food={kind:'food',per100:{proteinG:10,kcal:100,saltG:.5},source:{name:'UK CoFID 2021',recordId:'actual-record',version:'2021'}};
 const n=portionNutrition(food,250);assert.equal(n.proteinG,25);assert.equal(n.kcal,250);assert.equal(n.sugarsG,null);assert.equal(n.lights.saltG,'medium');
 const day=nutritionDay([{...n,on:'2026-11-03'},{proteinG:999,kcal:999,on:'2026-11-04'}],{proteinG:120,kcal:2200},'2026-11-03');
 assert.equal(day.totals.proteinG,25);assert.equal(day.totals.kcal,250);assert.equal(day.underEating.enabled,false);
 assert.equal(day.entries.length,1);assert.equal(day.unknown.sugarsG,true);
});
