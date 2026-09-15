import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {enrichGrubRecipes} from '../grub-search.mjs';
import {grubImages,imageForRecipe} from '../grub-image-map.mjs';
import {emptyGrub,usableCatalogue,applyGrubOperation,workspaceView} from '../grub-workspace.mjs';
import {recommendationFor,adjustRecommendation,grubModes,grubMemberContext} from '../grub-intelligence.mjs';
import {grubIntelligenceClient} from '../grub-intelligence-client.mjs';
import {memberExperienceRoutes} from '../entry.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('./fixtures/grub-illustrated-recipes.json',import.meta.url)));
const recipes=usableCatalogue(enrichGrubRecipes(rows));
let seq=0;const op=(s,input)=>applyGrubOperation(s,{revision:s.revision,operationId:'intelligence-check-'+String(++seq).padStart(5,'0'),...input},recipes);
test('every approved image matches exact recipe content and deployed binary',()=>{
 assert.equal(recipes.filter(r=>r.image).length,7);
 for(const asset of grubImages){
  const bytes=fs.readFileSync('frontend/member'+asset.src);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
  const changed=structuredClone(rows.find(r=>r.id===asset.id));changed.data.ingredients[0].amount='999g';
  assert.equal(imageForRecipe(changed),null);
 }
});
test('all five adjustments choose exact illustrated alternatives and satisfy the requested property',()=>{
 const state=emptyGrub(),base=recommendationFor(state,recipes).recipe;
 assert.equal(base.name,'Chicken Traybake');
 const checks={lighter:r=>r.kcal<base.kcal,fuller:r=>r.nutrition.fibre_g>base.nutrition.fibre_g,protein:r=>r.protein_g>base.protein_g,quicker:r=>r.minutes<base.minutes,budget:r=>['budget','budget-friendly'].includes(r.taxonomy.budget)};
 for(const mode of grubModes){
  const next=op(state,{action:'recommendation-adjust',mode});
  const r=workspaceView(next,recipes).recommendation.recipe;
  assert.notEqual(r.id,base.id);assert(r.image);assert(checks[mode](r),mode);
  assert.deepEqual(next.week,state.week);assert.deepEqual(next.shopping,state.shopping);
 }
});
test('saved dislikes, Nay and vegetarian constraints survive every adjustment; empty pools explain no change',()=>{
 const state=emptyGrub();state.options.style='vegetarian';
 for(const mode of grubModes){const selected=adjustRecommendation(state,mode,recipes);assert.equal(selected.recipeId,'industrial-v3-wrap-bbq-chickpea');assert.match(selected.message,/unchanged/)}
 const ctx=grubMemberContext({food:{dislikes:'chicken'}});assert.equal(ctx.exclusions,'chicken');
 assert.equal(recommendationFor(emptyGrub(),recipes,ctx).recipe.id,'industrial-v3-wrap-bbq-chickpea');
 assert.equal(recommendationFor(state,recipes,{dietaryReviewRequired:true}).recipe,null);
 let s=emptyGrub();const first=recommendationFor(s,recipes).recipe;
 s=op(s,{action:'recommendation-feedback',sentiment:'nay',recipeId:first.id});
 assert.notEqual(recommendationFor(s,recipes).recipe.id,first.id);
 for(const mode of grubModes)assert.notEqual(adjustRecommendation(s,mode,recipes).recipeId,first.id);
 const liked=recommendationFor(s,recipes).recipe.id;s=op(s,{action:'recommendation-feedback',sentiment:'yay',recipeId:liked});
 assert.equal(workspaceView(JSON.parse(JSON.stringify(s)),recipes).recommendation.learned.yay,1);
});
test('servings scale ingredients and shopping while planned nutrition stays per person',()=>{
 const base=recommendationFor(emptyGrub(),recipes).recipe;
 const scale=grubIntelligenceClient.slice(0,grubIntelligenceClient.indexOf('function drawRecommendation'));
 const doubled=vm.runInNewContext(scale+';scaledRecommendation(meal,2)',{meal:base});
 assert.equal(parseFloat(doubled.ingredients[0].amount),parseFloat(base.ingredients[0].amount)*2/base.servings);
 const one=op(emptyGrub(),{action:'add',recipeId:base.id,day:1,slot:'dinner',servings:1});
 const two=op(emptyGrub(),{action:'add',recipeId:base.id,day:1,slot:'dinner',servings:2});
 assert.notDeepEqual(one.shopping,two.shopping);
 assert.deepEqual(workspaceView(one,recipes).nutritionContext,workspaceView(two,recipes).nutritionContext);
 assert.equal(workspaceView(two,recipes).nutritionContext.totals.kcal,base.kcal);
});
test('Fit context only uses a completion recorded today',()=>{
 const p={fitJourney:{entries:{x:{recordedOn:'2026-09-14',status:'done'}}}};
 assert.equal(grubMemberContext(p,'2026-09-15').fitCompleted,false);
 p.fitJourney.entries.x.recordedOn='2026-09-15';assert.equal(grubMemberContext(p,'2026-09-15').fitCompleted,true);
});
test('deployed bundler preserves every member script byte for byte',async()=>{
 const bundled=await build({entryPoints:['member-experience/entry.mjs'],bundle:true,format:'esm',keepNames:true,write:false});
 const module=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
 for(const name of ['health','fit','grub']){
  const request=new Request('https://shiftsometimber.co.uk/assets/member-experience/'+name+'.mjs'),env={MEMBER_EXPERIENCE_V1_ENABLED:'true'};
  const source=await memberExperienceRoutes(request,env).text(),actual=await module.memberExperienceRoutes(request,env).text();
  assert.equal(actual,source,name+' runtime changed during bundle');new Function(actual);
 }
});
