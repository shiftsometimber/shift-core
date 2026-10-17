import test from 'node:test';
import assert from 'node:assert/strict';
import {DB,server} from './grub-ease-fixture.mjs';
import {loadGrubCatalogue} from '../grub-routes.mjs';
import {emptyGrub,usableCatalogue,applyGrubOperation} from '../grub-workspace.mjs';
import {everydayMeal,everydayCookedMeal,recommendationFor} from '../grub-intelligence.mjs';

test('published catalogue leads with cold everyday food and retains real quantities and methods',async()=>{
 try{
  const recipes=usableCatalogue(await loadGrubCatalogue(DB));
  const simple=recipes.filter(everydayMeal);
  assert.equal(simple.length,11);
  let state=emptyGrub();
  const first=recommendationFor(state,recipes).recipe;
  assert.equal(first.id,'everyday-chicken-salad-sandwich'); // UK discovery leads with the retained complete sandwich.
  assert(first.ingredients.some(i=>i.item==='cooked chicken breast'));
  assert.equal(first.ingredients.length,4);
  assert(first.method.some(s=>s.includes('already-cooked')));
  const seen=[];
  for(let i=0;i<6;i++){
   const meal=recommendationFor(state,recipes).recipe;
   assert(everydayMeal(meal));seen.push(meal.id);
   state=applyGrubOperation(state,{action:'recommendation-next',recipeId:meal.id,revision:state.revision,operationId:'everyday-operation-'+i},recipes,{date:'2026-10-17'});
  }
  assert.equal(new Set(seen).size,6);
  assert.match(seen[1],/tuna/);
  assert.deepEqual(state.shopping,[]);assert.equal(state.today,undefined);
  assert.equal(everydayMeal({...first,minutes:30}),false);
  assert.equal(everydayMeal({...first,method:['Warm the filling in a hot pan']}),false);
  assert.equal(everydayMeal({...first,ingredients:[...first.ingredients,{item:'extra sauce'},{item:'another sauce'}]}),false);
  const restricted=emptyGrub();restricted.options.exclude='chicken,fish';
  assert.match(recommendationFor(restricted,recipes).recipe.id,/ham|bean/);
  assert.equal(recommendationFor(state,recipes,{dietaryReviewRequired:true}).recipe,null);
  const limited=recommendationFor(state,recipes,{maxMinutes:5}).recipe;
  assert(limited===null||limited.minutes<=5);
  const willing=emptyGrub();willing.options.effort='cook';assert(everydayCookedMeal(recommendationFor(willing,recipes).recipe));
  const saved=emptyGrub();saved.recommendation={recipeId:'industrial-dinner-chicken-traybake'};
  assert.equal(recommendationFor(saved,recipes).recipe.id,'industrial-dinner-chicken-traybake');
 }finally{await new Promise(resolve=>server.close(resolve))}
});
