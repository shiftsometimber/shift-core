import test from 'node:test';
import assert from 'node:assert/strict';
import {searchGrubRecipes} from '../grub-search.mjs';
import {memberReviewRoutes} from '../staging/routes.mjs';
const row=(id,title,items,extra={})=>({id,title,status:'published',data:{servings:2,ingredients:items.map(item=>({item,amount:100,unit:'g'})),method:['Prepare the ingredients.','Cook and serve.'],nutrition:{status:'validated',protein_g:31.6,kcal:410},prep_minutes:5,cook_minutes:15,taxonomy:{budget:'budget-friendly',family_size:'scalable'},...extra}});
const records=[row('chicken','Chicken noodles',['chicken breast','noodles','soy sauce']),row('beef','Beef sandwich',['beef','bread']),row('beans','Bean bowl',['kidney beans','rice'])];
test('ingredient search returns actual matching records, quantities and methods',()=>{
 const r=searchGrubRecipes({query:'Chicken, beef, noodles, bread'},records);assert.deepEqual(r.top.map(x=>x.id).sort(),['beef','chicken']);assert.deepEqual(r.top.find(x=>x.id==='chicken').ingredients,records[0].data.ingredients);assert.equal(r.top[0].protein_g,31.6);assert.equal(r.top[0].minutes,20);
});
test('filters apply to the search and never become invented recipe titles',()=>{
 for(const filter of ['Fast','Family','High protein','Budget'])assert.deepEqual(searchGrubRecipes({query:'chicken',filter},records).top.map(x=>x.id),['chicken']);
 assert.deepEqual(searchGrubRecipes({filter:'Vegetarian'},records).top.map(x=>x.id),['beans']);
 assert.equal(searchGrubRecipes({query:'chicken',filter:'Vegetarian'},records).top.length,0);
});
test('fridge matching lists every missing item and distinguishes sauce from milk',()=>{
 const r=searchGrubRecipes({mode:'fridge',items:['chicken','soy milk']},records).top[0];assert.deepEqual(r.matched,['chicken breast']);assert.deepEqual(r.missing,['noodles','soy sauce']);
});
test('unknown ingredients and exclusions produce an honest empty result',()=>{
 assert.equal(searchGrubRecipes({query:'dragonfruit'},records).top.length,0);assert.match(searchGrubRecipes({query:'no fish'},records).message,/cannot verify/);
});
test('records without validated nutrition or an actual method are excluded',()=>{
 assert.equal(searchGrubRecipes({},[row('x','Incomplete',['bread'],{method:[]}),row('y','Unvalidated',['rice'],{nutrition:{status:'pending'}})]).top.length,0);
});
test('trial search serves only catalogue data and refuses cross-origin calls',async()=>{
 const env={STAGING_ASSETS:{fetch:async()=>Response.json(records)}};
 const ok=await memberReviewRoutes(new Request('https://stage.test/staging/member/grub/search',{method:'POST',headers:{Origin:'https://stage.test'},body:JSON.stringify({query:'chicken'})}),env);assert.equal(ok.status,200);assert.equal((await ok.json()).top[0].id,'chicken');
 const denied=await memberReviewRoutes(new Request('https://stage.test/staging/member/grub/search',{method:'POST',headers:{Origin:'https://elsewhere.test'},body:'{}'}),env);assert.equal(denied.status,403);
 const save=await memberReviewRoutes(new Request('https://stage.test/staging/member/grub',{method:'POST',body:'{}'}),env);assert.equal(save.status,405);
});
