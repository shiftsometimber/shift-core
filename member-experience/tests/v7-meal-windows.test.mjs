import test from 'node:test';import assert from 'node:assert/strict';
import{mealPeriod,mealView}from'../v7-meal-windows.mjs';
import{prepareMealOffers,v7Context}from'../v7-context.mjs';
import{applyV7Operation}from'../v7-model.mjs';
const day='2026-11-05';
const rows=['breakfast','lunch','dinner'].flatMap(meal=>Array.from({length:40},(_,i)=>({id:meal+i,name:meal+' meal '+i,meal_type:meal,minutes:15,ingredients:[],method:[],nutrition:{status:'validated',protein_g:30+i%3,kcal:400,methodology:'CoFID 2021 ingredient-level weighted calculation'}})));
const helpers={emptyGrub:()=>({}),grubMemberContext:()=>({}),recommendationFor:(_s,pool)=>({recipe:pool.find(r=>['lunch','dinner'].includes(r.meal_type)),reasons:[]})};
const prefs=()=>({food:{protein_target:127,calorie_target:2180},lifeBack:{progress:{revision:0,v7:{days:{},milestones:{},preferences:{showWeight:true}}}}});
test('exact UK minute boundaries including late-night tea',()=>{
 for(const[t,want]of[['00:00','tea'],['02:59','tea'],['03:00','breakfast'],['11:00','breakfast'],['11:01','lunch'],['15:00','lunch'],['15:01','tea'],['23:59','tea']])assert.equal(mealPeriod(day+'T'+t+':59Z'),want,t);
});
test('clock uses London summer time and daylight-saving transitions',()=>{
 assert.equal(mealPeriod('2026-07-05T02:00:00Z'),'breakfast');
 assert.equal(mealPeriod('2026-07-05T10:00:59Z'),'breakfast');
 assert.equal(mealPeriod('2026-07-05T10:01:00Z'),'lunch');
 assert.equal(mealPeriod('2026-07-05T14:01:00Z'),'tea');
 for(const at of ['2026-03-29T00:59:59Z','2026-03-29T01:00:00Z','2026-10-25T00:59:59Z','2026-10-25T01:00:00Z'])assert.equal(mealPeriod(at),'tea');
});
test('all three periods use canonical recipes and three same-source swaps within 5g, for ten starting actions',()=>{
 for(let n=0;n<10;n++){
  const source=rows.map(r=>({...r,id:r.id+'-'+n})),p=prefs(),before=structuredClone(source),o=prepareMealOffers(p,source,day+'T08:00:00Z',helpers);
  assert.equal(o.mealWindowsVersion,1);assert.equal(o.action.meal,'breakfast');
  for(const[period,offer]of Object.entries(o.mealOffers)){
   const meal=period==='tea'?'dinner':period;assert.equal(offer.action.meal,meal);assert.equal(offer.alternatives.length,3);
   for(const a of [offer.action,...offer.alternatives]){assert.equal(a.meal,meal);assert.equal(a.mealPeriod,period);assert(Math.abs(a.proteinG-offer.action.proteinG)<=5);assert.equal(a.nutrition.source.recordId,a.recipeId);}
  }
  assert.deepEqual(source,before,'ranking must not rewrite the source breakfast or nutrition');
 }
});
test('screen reads use only prepared offers; chosen/completed action remains pinned across boundaries',async()=>{
 const p=prefs();p.lifeBack.progress.v7.offers=prepareMealOffers(p,rows,day+'T08:00:00Z',helpers);
 const DB={prepare(){throw Error('No screen-open catalogue or nutrition query allowed')}};
 const morning=await v7Context(DB,1,p,day+'T08:00:00Z',{preparedOnly:true});
 assert.equal(morning.action.meal,'breakfast');assert.equal(morning.proteinTarget,127);
 const lunch=mealView(morning,day+'T11:01:00Z');assert.equal(lunch.action.meal,'lunch');
 const tea=mealView(lunch,day+'T15:01:00Z');assert.equal(tea.action.meal,'dinner');
 const selected=morning.alternatives[0];applyV7Operation(p.lifeBack.progress,{action:'v7-select',actionId:selected.id,revision:0},day+'T08:00:00Z',morning);
 const pinned=await v7Context(DB,1,p,day+'T16:00:00Z',{preparedOnly:true});assert.equal(pinned.action.id,selected.id);assert.strictEqual(mealView(pinned,day+'T20:00:00Z'),pinned);
 const context=await v7Context(DB,1,p,day+'T16:00:00Z',{preparedOnly:true});
 const input={action:'v7-complete',actionId:selected.id,operationId:'synthetic-meal-one'};
 assert.equal(applyV7Operation(p.lifeBack.progress,input,day+'T16:00:00Z',context),true);
 assert.equal(applyV7Operation(p.lifeBack.progress,{...input,operationId:'second-device'},day+'T18:00:00Z',tea),false);
 const done=await v7Context(DB,1,p,day+'T23:00:00Z',{preparedOnly:true});assert.equal(done.count,1);assert.equal(done.action.id,selected.id);assert.equal(done.proteinG,null);assert.strictEqual(mealView(done,day+'T23:30:00Z'),done);
});
test('old data, non-food fallback and mismatched preferences stay safe',async()=>{
 const p=prefs(),o=prepareMealOffers(p,rows,day+'T08:00:00Z',helpers);p.lifeBack.progress.v7.offers=o;
 const DB={prepare(){throw Error('No read')}};
 p.lifeBack.progress.v7.days[day]={selected:o.action,log:{id:'done',action:o.action}};
 p.food.protein_target=130;
 const v=await v7Context(DB,1,p,day+'T16:00:00Z',{preparedOnly:true});assert.equal(v.action.id,o.action.id);assert(v.actionPinned);assert.equal(v.proteinTarget,130);
 const routine={...v,completedToday:false,actionPinned:false,action:{kind:'routine'}};assert.strictEqual(mealView(routine),routine);
});
