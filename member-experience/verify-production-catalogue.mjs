import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {enrichGrubRecipes,searchGrubRecipes} from './grub-search.mjs';
import {emptyGrub,usableCatalogue,applyGrubOperation} from './grub-workspace.mjs';
const result=JSON.parse(readFileSync(process.argv[2],'utf8'));
assert(Array.isArray(result)&&result.every(x=>x.success!==false),'Production catalogue query failed');
const rows=result.flatMap(x=>x.results||[]);
const records=enrichGrubRecipes(rows.map(r=>({id:r.id,title:r.title,data:JSON.parse(r.data_json)})));
const recipes=usableCatalogue(records);
assert(recipes.length>0,'No published, validated production recipes');
const found=searchGrubRecipes({query:'Chicken, beef, noodles, bread'},records);
assert(found.top.length>0,'The reported ingredient search has no production results');
for(const style of ['protein','budget','fast','vegetarian']){
 const plan=applyGrubOperation(emptyGrub(),{action:'plan',revision:0,operationId:'production-read-only-'+style,options:{days:3,style,servings:2,exclude:''}},recipes);
 assert.equal(plan.week.length,9,'Incomplete '+style+' plan');
 assert(plan.shopping.length>0,'No ingredients for '+style);
}
console.log(JSON.stringify({status:'pass',published:rows.length,usable:recipes.length,styles:['protein','budget','fast','vegetarian'],databaseWrites:false}));
