import test from 'node:test';import assert from 'node:assert/strict';
import {reconstructOriginalGrubSourceRows} from '../../scripts/build-grub-owner-publication.mjs';
import {CATALOGUE_PUBLICATION_RELEASE as release} from '../../catalogue-publication-release-v1.mjs';
import {selectGovernedGrubRows} from '../../grub-expansion-authority-v1.mjs';
import {enrichGrubRecipes,filterRecipe} from '../grub-search.mjs';
import {usableCatalogue,buildWeek,mealFamily,emptyGrub,applyGrubOperation} from '../grub-workspace.mjs';
const raw=[...reconstructOriginalGrubSourceRows(),...release.additions.filter(x=>x.content_type==='recipe')];
const authority=await selectGovernedGrubRows(raw.map(x=>({...x,data:JSON.parse(x.data_json),review:JSON.parse(x.review_json)})));assert.equal(authority.incomplete,false);
const recipes=usableCatalogue(enrichGrubRecipes(authority.rows)),byId=new Map(recipes.map(r=>[r.id,r]));
test('the exact approved 2671-recipe set gives varied weeks for every style and retains constraints',()=>{
 assert.equal(recipes.length,2671);
 for(const style of ['protein','budget','fast','vegetarian'])for(const days of [3,5,7])for(const seed of [0,1,17]){
  const options={style,days,servings:2,exclude:'fish, mushrooms'},plan=buildWeek(recipes,options,seed),meals=plan.week.map(x=>byId.get(x.recipeId));
  assert.equal(meals.length,days*3);assert.equal(new Set(meals.map(r=>r.id)).size,meals.length);
  assert(meals.every(r=>filterRecipe(r,{protein:'high protein',budget:'budget',fast:'fast',vegetarian:'vegetarian'}[style])));
  const mains=plan.week.filter(x=>x.slot!=='breakfast').map(x=>byId.get(x.recipeId));assert(mains.filter(r=>mealFamily(r)==='bread').length<=2,style+' bread repetition');
  assert(new Set(mains.map(mealFamily)).size>=3,style+' format variety');
  assert(!meals.some(r=>/mushroom|salmon|tuna|cod|haddock|anchovy|mackerel|sardine/i.test(r.ingredients.map(i=>i.item).join(' '))));
 }
});
test('rebuild avoids recent/Nay recipes, keeps manual shopping and saved recipes, and exact retry does not rebuild',()=>{
 let state=emptyGrub();state.saved=[recipes[0].id];state.shopping=[{key:'manual:one',text:'Kitchen roll',source:'manual',done:true}];
 const options={days:7,style:'protein',servings:2,exclude:''};const first=applyGrubOperation(state,{action:'plan',options,revision:0,operationId:'variety-first-week-001'},recipes);
 first.learning={...first.learning,nay:[first.week[0].recipeId]};
 const request={action:'plan',options,revision:first.revision,operationId:'variety-second-week-002'},next=applyGrubOperation(first,request,recipes);
 assert(!next.week.some(x=>first.week.some(old=>old.recipeId===x.recipeId)));assert.deepEqual(next.saved,first.saved);assert(next.shopping.some(i=>i.key==='manual:one'&&i.done));assert(next.shopping.some(i=>i.source==='week'));
 assert.deepEqual(applyGrubOperation(next,request,recipes),next);
 assert.throws(()=>applyGrubOperation(next,{action:'plan',options,revision:next.revision,operationId:'variety-empty-pool-003'},[]),/saved week has not changed/);
 assert.equal(next.week.length,21);
});
