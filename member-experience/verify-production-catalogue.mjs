import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {enrichGrubRecipes,searchGrubRecipes} from './grub-search.mjs';
import {emptyGrub,usableCatalogue,applyGrubOperation} from './grub-workspace.mjs';
import {recommendationFor,adjustRecommendation,grubModes} from './grub-intelligence.mjs';
import {grubImages} from './grub-image-map.mjs';
import {selectGovernedGrubRows} from '../grub-expansion-authority-v1.mjs';
const result=JSON.parse(readFileSync(process.argv[2],'utf8'));
assert(Array.isArray(result)&&result.every(x=>x.success!==false),'Production catalogue query failed');
const rows=result.flatMap(x=>x.results||[]);
assert(rows.every(row=>typeof row.review_json==='string'),'Production catalogue query must include review_json for exact serving authority');
const authority=await selectGovernedGrubRows(rows.map(row=>({...row,data:JSON.parse(row.data_json),review:JSON.parse(row.review_json)})));
assert.equal(authority.incomplete,false,'Production catalogue fails the proposed serving authority: '+authority.reason);
assert.equal(authority.accepted,798,'Production original accepted cohort is incomplete');
const records=enrichGrubRecipes(authority.rows);
const recipes=usableCatalogue(records);
assert(recipes.length>0,'No published, validated production recipes');
for(const image of grubImages)assert(recipes.find(r=>r.id===image.id)?.image,'Exact approved image does not match production recipe: '+image.id);
const recommendation=recommendationFor(emptyGrub(),recipes);
assert(recommendation.recipe?.image,'No illustrated production recommendation');
for(const mode of grubModes){
 const selected=adjustRecommendation(emptyGrub(),mode,recipes);
 const recipe=recipes.find(r=>r.id===selected.recipeId);
 assert(recipe&&recipe.nutrition.status==='validated'&&recipe.ingredients.length&&recipe.method.length>1,'Adjustment lost its reviewed recipe: '+mode);
 if(recipe.id===recommendation.recipe.id)assert.match(selected.message,/unchanged/);
 else if(mode==='quicker')assert(recipe.minutes<recommendation.recipe.minutes,'Quicker must improve the displayed meal');
 else if(mode==='protein')assert(recipe.protein_g>recommendation.recipe.protein_g,'Higher protein must improve the displayed meal');
}
const found=searchGrubRecipes({query:'Chicken, beef, noodles, bread'},records);
assert(found.top.length>0,'The reported ingredient search has no production results');
for(const style of ['protein','budget','fast','vegetarian']){
 const plan=applyGrubOperation(emptyGrub(),{action:'plan',revision:0,operationId:'production-read-only-'+style,options:{days:3,style,servings:2,exclude:''}},recipes);
 assert.equal(plan.week.length,9,'Incomplete '+style+' plan');
 assert(plan.shopping.length>0,'No ingredients for '+style);
}
console.log(JSON.stringify({status:'pass',published:rows.length,usable:recipes.length,originalAccepted:authority.accepted,reviewedExpansion:authority.expansionAccepted,exactServingAuthority:true,styles:['protein','budget','fast','vegetarian'],databaseWrites:false}));
