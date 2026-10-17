import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {memberRecipe} from '../grub-search.mjs';
import {buildEverydayMealDrafts} from '../../content/grub/everyday-meals-draft-20261017.mjs';
process.env.COFID_INDEX='tests/fixtures/grub-cofid-2021-governed-subset.json';
const {APPROVED,grams}=await import('../../industrial-grub-systemic-v3.mjs');
const recipeMappings={...APPROVED,eggs:APPROVED['large eggs']};
const foods=new Map(JSON.parse(readFileSync(process.env.COFID_INDEX,'utf8')).foods.map(r=>[String(r.code),r]));
test('seven plain draft meals bind every amount to retained CoFID evidence without inheriting publication approval',()=>{
 const drafts=buildEverydayMealDrafts({foods,mappings:APPROVED,retainedGrams:grams});
 assert.equal(drafts.length,7);assert.equal(new Set(drafts.map(r=>r.id)).size,7);
 const stored=JSON.parse(readFileSync('content/grub/everyday-meals-draft-20261017.json','utf8'));
 assert.deepEqual(stored.candidates,drafts);
 for(const r of drafts){
  assert.equal(r.status,'draft');assert.equal(r.review.status,'pending');assert.equal(r.publication_ready,false);
  assert.equal(r.review.independent_review_claimed,false);assert.equal(memberRecipe(r),null);
  assert(r.data.ingredients.length<=5);assert.equal(r.data.ingredients.length,r.data.ingredient_evidence.length);
  assert(r.data.method.length>=2);assert(r.data.total_minutes<=10);assert.equal(r.data.servings,1);
  for(const key of ['kcal','protein_g','carbohydrate_g','fat_g','fibre_g']){
   const calculated=r.data.ingredients.reduce((sum,i)=>sum+Number(foods.get(String(recipeMappings[i.item].code))[key])*grams(i.amount,i.item)/100,0);
   assert(Math.abs(calculated-r.data.nutrition[key])<=0.051,r.title+' '+key);
  }
 }
 const ham=drafts.find(r=>r.id==='everyday-ham-sandwich');
 assert.equal(ham.data.cook_minutes,0);assert(ham.data.method.some(s=>s.includes('cold ham')));
 const beans=drafts.find(r=>r.id==='everyday-beans-on-toast');assert.equal(beans.data.total_minutes,8);
 assert(beans.data.method.some(s=>s.includes('packet instructions')));
 assert(!drafts.some(r=>r.data.provenance?.final_v1_acceptance||r.data.provenance?.grub_expansion_acceptance));
});
