import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
// Real HTTP contract shared by local Worker integration and hosted staging.
// The caller owns fictional sessions; no passwords, cookies or personal data
// are returned as evidence.
export async function probeGrub({call,member,other,patch}){
 const checks=[],get=async cookie=>{const r=await call('/v1/grub/workspace',undefined,cookie);assert.equal(r.status,200,await r.clone().text());return r.json()};
 assert.equal((await call('/v1/grub/workspace')).status,401);
 const search=await call('/v1/grub/search',{query:'Chicken, beef, noodles, bread'},member);assert.equal(search.status,200,await search.clone().text());const result=await search.json();assert(result.top.length);assert(result.top.every(r=>r.ingredients.length&&r.method.length>1));checks.push('Authenticated recipe search returns approved quantities and cooking instructions');
 const fast=await(await call('/v1/grub/search',{query:'chicken',filter:'Fast'},member)).json();assert(fast.top.length);assert(fast.top.every(r=>r.minutes<=25));
 let state=await get(member);const baselineOther=await get(other);
 const change=async action=>{const input={...action,revision:state.revision,operationId:randomUUID()},r=await call('/v1/grub/workspace',input,member);assert.equal(r.status,200,await r.clone().text());state=await r.json();return input};
 await change({action:'save',recipeId:result.top[0].id,saved:true});assert((await get(member)).saved.includes(result.top[0].id));checks.push('Saving uses a stable recipe ID and survives a fresh request');
 await change({action:'plan',options:{days:3,style:'fast',servings:2,exclude:'fish'}});assert.equal(state.week.length,9);assert(state.shopping.length>0);assert(state.shopping.every(x=>!x.text.startsWith('Ingredients for')));assert(state.recipes.every(r=>r.method.length>1));
 const first=state.week[0],others=state.week.slice(1);await change({action:'swap',key:first.key});assert.notEqual(state.week[0].recipeId,first.recipeId);assert.deepEqual(state.week.slice(1),others);checks.push('Three-day plan, single-meal swap and scaled real-ingredient shopping list persist');
 await change({action:'add',recipeId:result.top[0].id,day:4,slot:'dinner',servings:3});assert(state.week.some(x=>x.day===4&&x.servings===3));
 const manual=await change({action:'shopping-add',text:'Fictional household item'}),revision=state.revision;const repeat=await(await call('/v1/grub/workspace',manual,member)).json();assert.equal(repeat.revision,revision);assert.equal(repeat.shopping.filter(x=>x.text==='Fictional household item').length,1);
 const item=state.shopping.find(x=>x.text==='Fictional household item');await change({action:'shopping-check',key:item.key,done:true});assert((await get(member)).shopping.find(x=>x.key===item.key).done);checks.push('Shopping edits survive reload; duplicate network retries do not create duplicate items');
 assert.deepEqual(await get(other),baselineOther);assert.equal((await call('/v1/grub/workspace',{action:'clear-week',revision:0,operationId:randomUUID()},member)).status,409);checks.push('Accounts are isolated and stale-tab writes are rejected');
 if(patch){const r=await patch('/v1/member-state',{preferences:{example:'unrelated setting',grubV2:{revision:0,saved:[]}}},member);assert.equal(r.status,200);assert.equal((await get(member)).revision,state.revision);assert((await get(member)).saved.includes(result.top[0].id));checks.push('Legacy preference updates cannot erase the new food workspace')}
 await change({action:'shopping-remove',key:item.key});await change({action:'remove-meal',key:'4:dinner'});assert.equal(state.week.length,9);await change({action:'save',recipeId:result.top[0].id,saved:false});assert(!state.saved.includes(result.top[0].id));
 return checks;
}
