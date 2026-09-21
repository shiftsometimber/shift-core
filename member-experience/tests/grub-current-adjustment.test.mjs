import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {enrichGrubRecipes} from '../grub-search.mjs';
import {emptyGrub,usableCatalogue,applyGrubOperation,workspaceView} from '../grub-workspace.mjs';
const recipes=usableCatalogue(enrichGrubRecipes(JSON.parse(fs.readFileSync(new URL('./fixtures/grub-illustrated-recipes.json',import.meta.url)))));
let id=0;
const adjust=(state,mode,pool=recipes)=>applyGrubOperation(state,{action:'recommendation-adjust',mode,revision:state.revision,operationId:'current-meal-repair-'+String(++id).padStart(5,'0')},pool);
test('quicker after higher protein compares with the current eight-minute meal',()=>{
 const first=adjust(emptyGrub(),'protein'),before=workspaceView(first,recipes).recommendation.recipe;
 const next=adjust(first,'quicker'),pick=workspaceView(next,recipes).recommendation;
 if(pick.recipe.id===before.id)assert.match(pick.message,/unchanged/);
 else assert(pick.recipe.minutes<before.minutes);
 assert.deepEqual(next.week,first.week);assert.deepEqual(next.shopping,first.shopping);
});
test('a reviewed recipe does not need an illustration to be a genuine faster alternative',()=>{
 const first=adjust(emptyGrub(),'protein'),before=workspaceView(first,recipes).recommendation.recipe;
 const fast={...structuredClone(before),id:'fictional-reviewed-fast-meal',name:'Fictional reviewed fast meal',minutes:5,image:null};
 const pool=[...recipes,fast],next=adjust(first,'quicker',pool),pick=workspaceView(next,pool).recommendation;
 assert.equal(pick.recipe.id,fast.id);assert.equal(pick.recipe.image,null);assert.equal(pick.baseId,before.id);
 assert.equal(workspaceView(JSON.parse(JSON.stringify(next)),pool).recommendation.recipe.id,fast.id);
});
test('repeating a maximum-protein request is an honest unchanged result',()=>{
 const first=adjust(emptyGrub(),'protein'),next=adjust(first,'protein');
 assert.equal(next.recommendation.recipeId,first.recommendation.recipeId);
 assert.match(next.recommendation.message,/unchanged/);
});
