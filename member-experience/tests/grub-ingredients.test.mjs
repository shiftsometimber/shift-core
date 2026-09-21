import test from 'node:test';import assert from 'node:assert/strict';
import {ingredientOptions} from '../grub-ingredients.mjs';
import {searchGrubRecipes} from '../grub-search.mjs';
import {withSessionState} from '../session-state.mjs';
import {readFileSync} from 'node:fs';
test('suggestions are exact catalogue ingredient names, deduplicated without recipe mutation',()=>{
 const recipes=[{ingredients:[{item:'chickpeas, drained'},{item:'Chicken breast'}]},{ingredients:[{item:'chicken breast'},{item:'Rice'}]}],before=JSON.stringify(recipes);
 assert.deepEqual(ingredientOptions(recipes),['Chicken breast','chickpeas, drained','Rice']);assert.equal(JSON.stringify(recipes),before);
});
test('one structured ingredient containing a comma is not split into unrelated pantry words',()=>{
 const recipe=(id,item)=>({id,title:item,data:{ingredients:[{item,amount:'100g'}],method:['Prepare.','Cook.'],nutrition:{status:'validated'},meal_type:'lunch'}});
 const r=searchGrubRecipes({mode:'fridge',items:['chickpeas, drained']},[recipe('a','chickpeas, drained'),recipe('b','kidney beans, drained')]);
 assert.deepEqual(r.top.map(x=>x.id),['a']);assert.deepEqual(r.top[0].matched,['chickpeas, drained']);
});
test('legacy dashboard gets one recovery link; canonical login keeps its existing recovery owner',()=>{
 const dashboard=readFileSync(new URL('../test-support/dashboard.html',import.meta.url),'utf8');const upgraded=withSessionState(dashboard);
 assert.equal((upgraded.match(/data-dashboard-password-recovery/g)||[]).length,1);assert.match(upgraded,/member-login\?returnTo=%2Fmember%2Fdashboard#forgot-password/);assert.equal(withSessionState(upgraded),upgraded);
 const canonical=readFileSync(new URL('../../frontend/member/my-timber-preview.html',import.meta.url),'utf8');assert.doesNotMatch(withSessionState(canonical),/data-dashboard-password-recovery/);assert.match(withSessionState(canonical),/data-forgot-password/);
});
