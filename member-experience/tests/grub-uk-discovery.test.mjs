import fs from 'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import {applyGrubDiscovery,discoverable} from '../grub-discovery.mjs';
import {GRUB_DISCOVERY_MANIFEST} from '../grub-discovery-manifest-20261017.mjs';
import {searchGrubRecipes,enrichGrubRecipes,memberRecipe} from '../grub-search.mjs';
import {emptyGrub,usableCatalogue,buildWeek,workspaceView,applyGrubOperation,shoppingForWeek} from '../grub-workspace.mjs';
import {recommendationFor,repeatMeals,nextRecommendation} from '../grub-intelligence.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const fixture=JSON.parse(fs.readFileSync(process.env.UK_GRUB_CATALOGUE_INPUT||new URL('./fixtures/uk-grub-public-witnesses-20261017.json',import.meta.url)));
const authority=fixture.authority;
const original=JSON.stringify(authority);
const approved={...GRUB_DISCOVERY_MANIFEST,status:'approved'}; // isolated candidate exercise, not publication authority
const curated=await applyGrubDiscovery(authority,approved);
const records=enrichGrubRecipes(curated.rows),recipes=usableCatalogue(records);
test('pending real manifest preserves deployed catalogue and draft recipes stay out',async()=>{
 assert.equal(GRUB_DISCOVERY_MANIFEST.status,'approved');
 assert.equal(await applyGrubDiscovery(authority,{...GRUB_DISCOVERY_MANIFEST,status:'pending_editorial_publication'}),authority);
 const drafts=JSON.parse(fs.readFileSync(new URL('../../content/grub/uk-core-drafts-20261017.json',import.meta.url)));
 assert.equal(drafts.publication_ready,false);
 for(const r of drafts.candidates){assert.equal(r.publication_ready,false);assert.equal(r.review.human_review_claimed,false);assert.equal(memberRecipe(r),null);}
});
test('every current identity remains; discovery does not alter one recipe byte or source authority',()=>{
 assert.equal(curated.rows.length,authority.rows.length);
 assert.deepEqual(curated.rows.map(({discovery,...r})=>r),authority.rows);
 assert.equal(JSON.stringify(authority),original);
 assert.equal(records.filter(discoverable).length,32);
});
test('retained row content drift hides new suggestions and keeps saved access',async()=>{
 const changed=structuredClone(authority);
 const row=changed.rows.find(r=>r.id==='everyday-tuna-sandwich');row.data.ingredients[0].amount='999g';
 const result=await applyGrubDiscovery(changed,approved),r=result.rows.find(r=>r.id===row.id);
 assert.equal(r.discovery.eligible,false);assert.equal(r.data.ingredients[0].amount,'999g');
 assert.equal(result.rows.length,authority.rows.length);
});
test('all discovery and fridge results exclude withdrawn variants; normal lunches and cooked dinners are findable',()=>{
 for(const input of [{query:''},{query:'pizza'},{query:'sandwich'},{query:'pasta'},{query:'curry'},{mode:'fridge',items:['chicken','bread']}]){
  const r=searchGrubRecipes(input,records);assert(r.top.every(discoverable));
  assert(!r.top.some(x=>/buffalo|nashville/i.test(x.name)));
 }
 assert(searchGrubRecipes({query:'sandwich'},records).top.some(r=>r.name==='Tuna sandwich'));
 assert(searchGrubRecipes({query:'pasta'},records).top.some(r=>r.name==='Chicken Pasta Bake'));
 assert(searchGrubRecipes({query:'curry'},records).top.some(r=>r.name==='Lentil Curry'));
 assert.equal(searchGrubRecipes({query:'pizza'},records).top.length,0,'new pizza drafts must not masquerade as published classics');
});
test('withdrawing current stored suggestion replaces it but never changes the saved state',()=>{
 const savedOnly=recipes.find(r=>!discoverable(r)&&r.meal_type==='lunch');
 const state={...emptyGrub(),saved:[savedOnly.id],recommendation:{recipeId:savedOnly.id,baseId:savedOnly.id,mode:'planned'},learning:{yay:[savedOnly.id],nay:[],recent:[]}};
 const before=JSON.stringify(state),r=recommendationFor(state,recipes,{date:'2026-10-17'});
 assert(r.recipe&&discoverable(r.recipe));assert.equal(JSON.stringify(state),before);
 assert.equal(repeatMeals(state,recipes)[0].id,savedOnly.id);
});
test('saved, week, Today and manual shopping survive refresh, swaps, repeat and account isolation',()=>{
 const archived=recipes.find(r=>!discoverable(r)&&r.meal_type==='lunch');
 const entry={key:'1:lunch',day:1,slot:'lunch',recipeId:archived.id,servings:2};
 let state={...emptyGrub(),saved:[archived.id],week:[entry],shopping:[],learning:{yay:[archived.id],nay:[],recent:[]}};
 state.shopping=shoppingForWeek(state.week,recipes,[{key:'manual:one',text:'Milk for the family',source:'manual',done:false}]);
 const before=structuredClone(state),context={date:'2026-10-17',at:'2026-10-17T22:00:00Z'};
 const view=workspaceView(state,recipes,context);
 assert(view.recipes.some(r=>r.id===archived.id));assert.equal(view.week[0].recipeId,archived.id);
 state=applyGrubOperation(state,{action:'repeat-and-shop',recipeId:archived.id,servings:2,revision:0,operationId:'uk-catalogue-repeat-0001'},recipes,context);
 assert.equal(state.today.recipeId,archived.id);assert.deepEqual(state.saved,before.saved);
 assert.deepEqual(state.week,before.week);assert(state.shopping.some(i=>i.key==='manual:one'));
 assert.equal(emptyGrub().saved.length,0);assert.equal(emptyGrub().week.length,0);
});
test('no-cook and five-minute choices use actual times and methods; overnight oats never claim five-minute readiness',()=>{
 for(const effort of ['no-cook','five','cook']){
  const state={...emptyGrub(),options:{...emptyGrub().options,effort}};
  const r=recommendationFor(state,recipes).recipe;assert(r&&discoverable(r));
  if(effort==='five')assert(r.minutes<=5);
  if(effort==='no-cook')assert.equal(r.cook_minutes,0);
 }
 const oats=recipes.filter(r=>/overnight/i.test(r.name));assert(oats.every(r=>r.minutes>=360));
});
test('plans in each style contain no withdrawn recipes and preserve source state on an impossible request',()=>{
 for(const style of ['protein','vegetarian','fast','budget']){
  const result=buildWeek(recipes,{days:3,style,servings:4,exclude:''});
  assert(result.week.every(e=>discoverable(recipes.find(r=>r.id===e.recipeId))));
 }
});
test('pizza prototype data are actual classics, not renamed legacy recipes',()=>{
 const pack=JSON.parse(fs.readFileSync(new URL('../../content/grub/uk-core-drafts-20261017.json',import.meta.url)));
 const pizzas=pack.candidates.filter(r=>r.data.food_format==='pizza');
 assert.deepEqual(pizzas.map(r=>r.title),['Margherita pizza with side salad','Pepperoni pizza with side salad','Ham and pineapple pizza with side salad','Mushroom pizza with side salad']);
 for(const r of pizzas){
  assert(r.data.ingredients.some(i=>/mozzarella/i.test(i.item)));
  assert(r.data.ingredients.some(i=>/tomato purée/i.test(i.item)));
  assert(r.data.method.join(' ').includes('two portions'));
  assert.equal(r.data.servings,2);
 }
 assert(pizzas[1].data.ingredients.some(i=>/pepperoni/.test(i.item)));
 assert(pizzas[2].data.ingredients.some(i=>/ham/.test(i.item))&&pizzas[2].data.ingredients.some(i=>/pineapple/.test(i.item)));
});

import {buildUKCorePublication,ukReviewScopes} from '../../grub-uk-core-publication-gate-20261017.mjs';
import {appendUKCorePublication} from '../../grub-uk-core-authority-20261017.mjs';
import {UK_CORE_PUBLICATION} from '../../grub-uk-core-publication-20261017.mjs';
const pack=JSON.parse(fs.readFileSync(new URL('../../content/grub/uk-core-drafts-20261017.json',import.meta.url)));
test('new publication refuses absent, AI, stale, partial, self-reviewed and unresolved human review',()=>{
 assert.equal(UK_CORE_PUBLICATION.status,'approved');assert.equal(UK_CORE_PUBLICATION.human_review_claimed,false);
 assert.throws(()=>buildUKCorePublication(pack,null),/human second-person/);
 const synthetic={proof:'GRUB_UK_HUMAN_SECOND_PERSON_REVIEW_20261017',status:'approved',pack_sha256:hash(pack),reviewer:{kind:'human',id:'TEST ONLY: synthetic independent human'},reviewed_at:'2026-10-17T22:00:00Z',source_receipt:'TEST ONLY: no actual human review or publication authority',physical_cooking_trial_claimed:false,recipes:pack.candidates.map(r=>({id:r.id,content_hash:r.content_hash,decision:'PASS',scopes:ukReviewScopes,findings:[]}))};
 assert.throws(()=>buildUKCorePublication(pack,{...synthetic,reviewer:{kind:'ai',id:'test'}}),/actual reviewer/);
 assert.throws(()=>buildUKCorePublication(pack,{...synthetic,pack_sha256:'0'.repeat(64)}),/Exact pack/);
 assert.throws(()=>buildUKCorePublication(pack,{...synthetic,recipes:synthetic.recipes.slice(1)}),/Every exact/);
 assert.throws(()=>buildUKCorePublication(pack,{...synthetic,reviewer:{kind:'human',id:'/root'}}),/Independent reviewer/);
 const unresolved=structuredClone(synthetic);unresolved.recipes[0].findings=['Unresolved finding'];assert.throws(()=>buildUKCorePublication(pack,unresolved),/unresolved/);
 const changed=structuredClone(pack);changed.candidates[0].data.ingredients[0].amount='999g';
 assert.throws(()=>buildUKCorePublication(changed,{...synthetic,pack_sha256:hash(changed)}),/Draft content hash changed/);
});
test('hypothetical reviewed publication preserves real portions and ranks the three familiar pizzas first in isolated logic only',async()=>{
 // This synthetic object is never written into the pending production publication module.
 const synthetic={proof:'GRUB_UK_HUMAN_SECOND_PERSON_REVIEW_20261017',status:'approved',pack_sha256:hash(pack),reviewer:{kind:'human',id:'TEST ONLY: synthetic independent human'},reviewed_at:'2026-10-17T22:00:00Z',source_receipt:'TEST ONLY: no actual human review or publication authority',physical_cooking_trial_claimed:false,recipes:pack.candidates.map(r=>({id:r.id,content_hash:r.content_hash,decision:'PASS',scopes:ukReviewScopes,findings:[]}))};
 const pub=buildUKCorePublication(pack,synthetic);
 const extended=await appendUKCorePublication(authority,pub);
 const future={...approved,rows:[...approved.rows,...pub.items.map((r,index)=>({id:r.id,eligible:true,tier:'core',rank:index,content_sha256:hash({title:r.title,data:r.data,review:r.review})}))]};
 const result=await applyGrubDiscovery(extended,future);
 const found=searchGrubRecipes({query:'pizza'},enrichGrubRecipes(result.rows));
 assert.deepEqual(found.top.slice(0,3).map(r=>r.name),['Margherita pizza with side salad','Pepperoni pizza with side salad','Ham and pineapple pizza with side salad']);
 assert.equal(found.top[0].minutes,25,'preheating is included in elapsed time');
 assert.equal(found.top[0].servings,2);assert.equal(found.top[0].image,null);
 assert.deepEqual(authority.rows,JSON.parse(original).rows);
 const changed=structuredClone(pub);changed.items[0].data.ingredients[0].amount='999g';
 await assert.rejects(()=>appendUKCorePublication(authority,changed),/publication changed/);
 assert.equal(UK_CORE_PUBLICATION.status,'approved');assert.equal(UK_CORE_PUBLICATION.human_review_claimed,false);
 assert.equal(UK_CORE_PUBLICATION.items.length,14);
});

test('every retained choice has an honest estimated hands-on time as well as total time',()=>{
 for(const r of recipes.filter(discoverable)){
  assert(Number.isFinite(r.hands_on_minutes)&&r.hands_on_minutes>0,r.id);
  assert(r.hands_on_minutes<=r.minutes,r.id);
  assert.equal(r.timing_is_estimate,true);
 }
 const oats=recipes.find(r=>r.id==='industrial-breakfast-overnight-oats-apple-cinnamon-0');
 assert.equal(oats.hands_on_minutes,10);assert.equal(oats.minutes,370);
});
