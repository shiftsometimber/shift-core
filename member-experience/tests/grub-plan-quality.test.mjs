import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {planNutrition,automaticPlanIssue} from '../grub-plan-quality.mjs';
import {grubPlanQualityClient} from '../grub-plan-quality-client.mjs';
import {emptyGrub,buildWeek,applyGrubOperation,workspaceView} from '../grub-workspace.mjs';
const slots=['breakfast','lunch','dinner'];
const catalogue=(energy=[500,500,500])=>slots.flatMap((meal_type,i)=>['beans','tomato'].map((item,j)=>({id:meal_type+j,name:meal_type+j,meal_type,servings:1,kcal:energy[i],protein_g:30,nutrition:{fibre_g:7},minutes:j?25:15,ingredients:[{item,amount:'100g'}],allergens:[],taxonomy:{budget:'budget'}})));
const options={days:3,style:'fast',servings:2,exclude:''};
const oneDay=recipes=>slots.map((slot,i)=>({key:'1:'+slot,day:1,slot,recipeId:recipes.find(r=>r.meal_type===slot).id,servings:2}));
const request=(state,input)=>({revision:state.revision,operationId:'quality-operation-12345',...input});
test('the exact observed low-total day is a review case without changing saved data or multiplying per-person nutrition',()=>{
 const recipes=catalogue([289,233.4,338.8]),week=oneDay(recipes),before=JSON.stringify(week),view=planNutrition(week,recipes);
 assert.equal(view.days[0].kcal,861.2);assert.equal(view.days[0].review,'low-energy');
 assert.match(automaticPlanIssue(week,recipes),/only 861.2 kcal per person/);
 assert.deepEqual(planNutrition(week.map(e=>({...e,servings:8})),recipes),view);
 assert.equal(JSON.stringify(week),before);
});
test('unknown, blank, negative and unavailable energy cannot become zero or a complete total; fibre coverage is explicit',()=>{
 for(const missing of [null,undefined,'',NaN,-1]){
  const recipes=catalogue();recipes[0].kcal=missing;recipes[0].nutrition.fibre_g=null;
  const d=planNutrition(oneDay(recipes),recipes).days[0];
  assert.equal(d.kcal,null);assert.equal(d.fibre,null);assert.equal(d.coverage.kcal,2);assert.equal(d.coverage.fibre,2);assert.equal(d.review,'unknown-energy');
  assert.match(automaticPlanIssue(oneDay(recipes),recipes),/missing energy information/);
 }
 const recipes=catalogue(),week=oneDay(recipes);week[0].recipeId='unpublished';assert.equal(planNutrition(week,recipes).totals.kcal,null);
});
test('the review boundary is inclusive and a larger total carries no adequacy claim',()=>{
 for(const [energy,issue] of [[400,true],[400.1,false]]){
  const recipes=catalogue([energy,energy,energy]),week=oneDay(recipes);
  assert.equal(!!automaticPlanIssue(week,recipes),issue);
  assert.equal('balanced' in planNutrition(week,recipes),false);
 }
});
test('partial or empty saved plans remain honest meal ideas, with no invented missing meal or nutrient',()=>{
 const recipes=catalogue(),week=oneDay(recipes).slice(0,1),view=planNutrition(week,recipes);
 assert.equal(view.days[0].meals,1);assert.equal(view.days[0].threeMeals,false);assert.equal(view.days[0].review,null);assert.equal(view.totals.kcal,500);
 assert.deepEqual(planNutrition([],recipes),{days:[],totals:{kcal:null,protein:null,fibre:null}});
});
test('a rejected automatic plan leaves the whole previous week, shopping, saved meals, learning and revision untouched',()=>{
 const recipes=catalogue([289,233.4,338.8]),state=emptyGrub();state.week=oneDay(recipes);state.saved=['breakfast0'];state.shopping=[{key:'manual:one',text:'Kitchen roll',source:'manual',done:true}];
 const before=JSON.stringify(state);
 assert.throws(()=>applyGrubOperation(state,request(state,{action:'plan',options}),recipes),/cannot save this as an automatic week/);
 assert.equal(JSON.stringify(state),before);
});
test('weekly generation reuses saved ingredient and cooking limits, retaining the explicit planner options',()=>{
 const recipes=catalogue(),state=emptyGrub(),context={exclusions:'tomato',maxMinutes:15};
 const next=applyGrubOperation(state,request(state,{action:'plan',options}),recipes,context);
 assert(next.week.every(e=>e.recipeId.endsWith('0')));assert.equal(next.options.exclude,'');assert.equal(next.options.servings,2);
 assert.deepEqual(workspaceView(next,recipes).nutritionContext,planNutrition(next.week,recipes));
 assert.throws(()=>buildWeek(recipes,options,0,{}, {maxMinutes:5}),/saved food settings/);
});
test('saved dietary review gates automatic generation and swaps before any state changes',()=>{
 const recipes=catalogue(),state=emptyGrub();state.week=oneDay(recipes);const before=JSON.stringify(state),context={dietaryReviewRequired:true};
 for(const input of [{action:'plan',options},{action:'swap',key:'1:breakfast'}])assert.throws(()=>applyGrubOperation(state,request(state,input),recipes,context),/saved dietary requirements/);
 assert.equal(JSON.stringify(state),before);
});
test('swapping cannot silently create a low-total three-meal day; explicit manual meal saving stays available',()=>{
 const recipes=catalogue();recipes[1].kcal=100;recipes[2].kcal=500;recipes[4].kcal=500;
 const state=emptyGrub();state.options=options;state.week=oneDay(recipes);const before=JSON.stringify(state);
 assert.throws(()=>applyGrubOperation(state,request(state,{action:'swap',key:'1:breakfast'}),recipes),/only 1100 kcal/);
 assert.equal(JSON.stringify(state),before);
 const manual=applyGrubOperation(state,request(state,{action:'add',day:1,slot:'breakfast',servings:2,recipeId:'breakfast1'}),recipes);
 assert.equal(workspaceView(manual,recipes).nutritionContext.days[0].review,'low-energy');
});
test('a swap uses current saved exclusions and cooking limits, and an empty pool preserves the plan',()=>{
 const recipes=catalogue(),state=emptyGrub();state.options=options;state.week=oneDay(recipes);const before=JSON.stringify(state);
 assert.throws(()=>applyGrubOperation(state,request(state,{action:'swap',key:'1:breakfast'}),recipes,{exclusions:'tomato',maxMinutes:15}),/saved food settings/);
 assert.equal(JSON.stringify(state),before);
});
const markup=nutritionContext=>vm.runInNewContext(grubPlanQualityClient+';nutritionContextMarkup()', {workspace:{nutritionContext},foodNumber:n=>String(n),esc:n=>String(n).replaceAll('<','&lt;')});
test('the compact client marks the original legacy API low-day response, names unknown fibre and retains a practical route',()=>{
 const html=markup({days:[{day:3,meals:3,kcal:861.2,protein:67.2,fibre:null}],totals:{kcal:861.2,protein:67.2,fibre:null}});
 assert.match(html,/These days need another look/);assert.match(html,/Day 3 has a low total/);assert.match(html,/fibre unknown/);assert.doesNotMatch(html,/—g|0g fibre/);assert.match(html,/href="\/guides\/food-guide"/);
 assert.match(html,/higher calorie total does not confirm/);assert.match(html,/not a complete daily allowance/);
 assert.equal(markup({days:[],totals:{}}),'');new Function(grubPlanQualityClient);
});
test('unknown-energy notices differ from low totals and normal meal sums have no success badge',()=>{
 assert.match(markup({days:[{day:1,meals:3,kcal:null}],totals:{}}),/missing energy information/);
 const html=markup({days:[{day:1,meals:3,kcal:1500,protein:80,fibre:20}],totals:{kcal:1500}});
 assert.doesNotMatch(html,/These days need another look|balanced day|meets your needs/);
});
