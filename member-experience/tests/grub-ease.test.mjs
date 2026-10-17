import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyGrub,applyGrubOperation,workspaceView} from '../grub-workspace.mjs';
import {nextRecommendation,recommendationFor} from '../grub-intelligence.mjs';

const recipes=['chicken','beans','fish'].map((name,i)=>({id:'ease-'+name,name,meal_type:'dinner',servings:1,minutes:15,protein_g:30,kcal:400,
 nutrition:{fibre_g:5},taxonomy:{budget:'budget'},ingredients:[{item:name,amount:'100g'}],method:['Prepare '+name,'Cook '+name],allergens:[]}));
const context={date:'2026-10-17',at:'2026-10-17T10:00:00Z'};
let sequence=0;
const op=(s,a,pool=recipes,ctx=context)=>applyGrubOperation(s,{revision:s.revision,operationId:'ease-operation-'+String(++sequence).padStart(8,'0'),...a},pool,ctx);
const pick=s=>recommendationFor(s,recipes,context).recipe.id;

test('one confirmed choice saves Today, remembered servings and actual shopping quantities atomically',()=>{
 const original=emptyGrub(),s=op(original,{action:'choose-and-shop',recipeId:pick(original),servings:2});
 assert.equal(s.today.recipeId,pick(original));assert.equal(s.today.servings,2);assert.equal(s.options.servings,2);
 assert.equal(s.shopping.length,1);assert.match(s.shopping[0].text,/^200 g /);
 assert.deepEqual(s.week,[]);assert.deepEqual(original,emptyGrub());
 const reopened=workspaceView(JSON.parse(JSON.stringify(s)),recipes,context);
 assert.equal(reopened.today.recipeId,s.today.recipeId);assert.equal(reopened.recommendation.servings,2);
 assert.deepEqual(reopened.shopping,s.shopping);
});
test('choosing and changing a meal preserves an existing plan, manual items and checked unchanged quantities',()=>{
 let s=op(emptyGrub(),{action:'add',recipeId:'ease-fish',day:3,slot:'dinner',servings:1});
 s=op(s,{action:'shopping-add',text:'Washing-up liquid'});
 s=op(s,{action:'shopping-check',key:s.shopping.find(x=>x.source==='manual').key,done:true});
 const week=structuredClone(s.week);
 s=op(s,{action:'choose-and-shop',recipeId:pick(s),servings:1});
 const first=s.today.recipeId;
 assert.deepEqual(s.week,week);assert.equal(s.shopping.find(x=>x.source==='manual').done,true);
 s=op(s,{action:'recommendation-next',recipeId:first});
 s=op(s,{action:'choose-and-shop',recipeId:pick(s),servings:2});
 assert.deepEqual(s.week,week);assert.equal(s.shopping.find(x=>x.source==='manual').done,true);
 assert(!s.shopping.some(x=>x.text.includes(first.replace('ease-','')))&&first!=='ease-fish');
 assert(s.shopping.some(x=>x.text==='100 g fish'));
});
test('a chosen meal already covered by the weekly plan does not duplicate its ingredients',()=>{
 let s=emptyGrub(),id=pick(s);
 s.recommendation={recipeId:id};
 s=op(s,{action:'add',recipeId:id,day:2,slot:'dinner',servings:2});
 const before=s.shopping;
 s=op(s,{action:'choose-and-shop',recipeId:id,servings:2});
 assert.deepEqual(s.shopping,before);
});
test('retries are idempotent; stale, invalid and unsupported choices cannot partially save',()=>{
 const s=emptyGrub(),input={revision:0,operationId:'ease-idempotent-000001',action:'choose-and-shop',recipeId:pick(s),servings:1};
 const once=applyGrubOperation(s,input,recipes,context);
 assert.deepEqual(applyGrubOperation(once,input,recipes,context),once);
 assert.throws(()=>applyGrubOperation(once,{...input,operationId:'ease-stale-00000001'},recipes,context),/another tab/);
 for(const servings of [0,9,1.5,'2'])assert.throws(()=>op(s,{action:'choose-and-shop',recipeId:pick(s),servings}),/1–8/);
 assert.throws(()=>op(s,{action:'choose-and-shop',recipeId:pick(s),servings:1},recipes,{...context,date:''}),/Today is unavailable/);
 assert.deepEqual(s,emptyGrub());
});
test('Something else changes the suggestion without saving Today, shopping or a permanent dislike',()=>{
 let s=emptyGrub();const seen=[];
 for(let i=0;i<3;i++){
  const before=pick(s);seen.push(before);s=op(s,{action:'recommendation-next',recipeId:before});
  assert.notEqual(pick(s),before);assert.deepEqual(s.learning.nay,[]);
  assert.equal(s.today,undefined);assert.deepEqual(s.week,[]);assert.deepEqual(s.shopping,[]);
 }
 assert.equal(new Set(seen).size,3);
 assert.equal(workspaceView(JSON.parse(JSON.stringify(s)),recipes,context).recommendation.recipe.id,pick(s));
});
test('alternatives respect exclusions, explicit dislikes and dietary-review boundaries',()=>{
 const s=emptyGrub();s.options.exclude='fish';
 s.learning={yay:[],nay:['ease-beans'],recent:[]};
 assert.match(nextRecommendation(s,recipes,context).message,/unchanged/);
 assert.throws(()=>nextRecommendation(s,recipes,{...context,dietaryReviewRequired:true}),/dietary requirements/);
 assert.throws(()=>op(emptyGrub(),{action:'choose-and-shop',recipeId:'ease-fish',servings:1}),/suggestion changed/);
 const equivalent={...recipes[0],id:'same-ingredients-different-title',name:'Different title'};
 assert.match(nextRecommendation(emptyGrub(),[recipes[0],equivalent],context).message,/unchanged/);
});
test('the new route state is private to the supplied account object',()=>{
 const a=emptyGrub(),b=emptyGrub(),before=JSON.stringify(b);
 const chosen=op(a,{action:'choose-and-shop',recipeId:pick(a),servings:3});
 assert(chosen.shopping.length);assert.equal(JSON.stringify(b),before);assert.equal(b.today,undefined);
});

test('otherwise equally suitable alternatives prefer less cooking time',()=>{
 const pool=structuredClone(recipes);pool[1].minutes=75;pool[2].minutes=10;
 const state=emptyGrub();state.recommendation={recipeId:pool[0].id};
 assert.equal(nextRecommendation(state,pool,context).recipeId,pool[2].id);
});
