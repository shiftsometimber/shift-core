import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyGrub,applyGrubOperation,buildWeek,shoppingForWeek} from '../grub-workspace.mjs';
import {grubRuntime,upgradeGrubHTML} from '../grub-runtime.mjs';
const recipes=['breakfast','lunch','dinner'].flatMap((meal_type,i)=>[0,1].map(j=>({id:meal_type+j,name:meal_type+j,meal_type,servings:1,minutes:15,protein_g:30,taxonomy:{budget:'budget',family_size:'scalable'},ingredients:[{item:'rice',amount:'100g'},{item:'olive oil',amount:'1 tsp (5ml)'}],allergens:[]})));
let seq=0;const op=(state,action)=>applyGrubOperation(state,{revision:state.revision,operationId:'test-operation-'+String(++seq).padStart(8,'0'),...action},recipes);
test('plan is complete, saved IDs are stable, swaps preserve other meals and servings reach real ingredient list',()=>{
 let s=op(emptyGrub(),{action:'save',recipeId:'dinner0',saved:true});assert.deepEqual(s.saved,['dinner0']);
 s=op(s,{action:'plan',options:{days:3,style:'fast',servings:2,exclude:''}});assert.equal(s.week.length,9);assert.equal(s.shopping[0].text,'1800 g rice');assert.match(s.shopping[1].text,/1 tsp \(5ml\) × 2/);
 const original=structuredClone(s.week),key=s.week[0].key;s=op(s,{action:'swap',key});assert.notEqual(s.week[0].recipeId,original[0].recipeId);assert.deepEqual(s.week.slice(1),original.slice(1));
 s=op(s,{action:'shopping-add',text:'Washing-up liquid'});s=op(s,{action:'shopping-check',key:s.shopping.at(-1).key,done:true});assert.equal(s.shopping.at(-1).done,true);
 s=op(s,{action:'remove-meal',key});assert.equal(s.week.length,8);assert.equal(s.shopping[0].text,'1600 g rice');assert.equal(s.shopping.at(-1).text,'Washing-up liquid');
});
test('stale edits, unsupported preferences and missing content cannot overwrite a week',()=>{
 const s=op(emptyGrub(),{action:'plan',options:{days:3,style:'fast',servings:1,exclude:''}}),before=JSON.stringify(s);
 assert.throws(()=>applyGrubOperation(s,{revision:0,operationId:'valid-operation-12345',action:'clear-week'},recipes),/another tab/);
 assert.throws(()=>op(s,{action:'plan',options:{days:3,style:'fast',servings:1,exclude:'nut-free'}}),/ingredient names/);
 assert.throws(()=>buildWeek(recipes,{days:3,style:'fast',servings:1,exclude:'rice'}),/Your saved week has not changed/);
 assert.equal(JSON.stringify(s),before);
});
test('retry with same operation identity cannot add a shopping item twice',()=>{
 const input={action:'shopping-add',text:'Bread',revision:0,operationId:'repeat-operation-12345'},one=applyGrubOperation(emptyGrub(),input,recipes),two=applyGrubOperation(one,input,recipes);assert.deepEqual(two,one);
});
test('shopping units stay separate and changed quantities cannot remain checked',()=>{
 const list=shoppingForWeek([{recipeId:'dinner0',servings:1}],recipes);list[0].done=true;
 const next=shoppingForWeek([{recipeId:'dinner0',servings:2}],recipes,list);assert.equal(next[0].done,false);assert.equal(next[0].text,'200 g rice');
});
test('client parses after bundling and replaces both obsolete persistence handlers',()=>{
 new Function(grubRuntime);assert.doesNotMatch(grubRuntime,/__name\b|SST_API|localStorage|Fictional saved meal|Ingredients for /);
 const html=upgradeGrubHTML('<html><body><main><nav class="grub-v8-tabs"></nav></main><script defer src="/assets/member-grub-v8.js?v=1"></script><script defer src="/assets/member-grub-persistence-v1.js?v=1"></script></body></html>');assert.doesNotMatch(html,/src="[^"]*member-grub-(v8|persistence)/);assert.match(html,/grub\.mjs/);assert.match(html,/grubAccountStatus/);
});
