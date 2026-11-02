import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareRecipeFamilyPilot,renderRecipeFamilyPreview,PILOT_OWNER} from '../aeo-geo/recipe-family-pilot.mjs';
const recipe={id:'a',title:'Berries yoghurt pot — Greek yoghurt',path:PILOT_OWNER,servings:1,mealType:'snack',minutes:5,ingredients:['200g Greek yoghurt','105g berries'],method:['Use the ingredients for the chosen version.'],nutrition:{kcal:338.6,protein_g:18.4,carbohydrate_g:46.3,fat_g:10.2,fibre_g:null,saturates_g:1.7},allergens:['milk'],safety:['Check labels.'],storage:['Keep chilled.'],equipment:['bowl'],methodology:'Estimated nutrition. No independent cooking validation claimed.'};
const other={...recipe,id:'b',title:'Berries yoghurt pot — protein yoghurt',path:'/recipes/existing-protein-yoghurt',ingredients:['200g protein yoghurt','105g berries'],nutrition:{...recipe.nutrition,kcal:350},allergens:['milk','label-specific']};
test('one reviewable owner retains each distinct ingredient, nutrition and allergen version without mutating the catalogue',()=>{
 const source={recipes:[recipe,other]},before=JSON.stringify(source),p=prepareRecipeFamilyPilot(source),html=renderRecipeFamilyPreview(p);
 assert.equal(JSON.stringify(source),before);assert.equal(p.canonicalOwner,PILOT_OWNER);assert.equal(p.variants.length,2);
 for(const value of ['200g Greek yoghurt','200g protein yoghurt','338.6 kcal','350 kcal','label-specific','Not available'])assert(html.includes(value),value);
 assert.equal(p.status,'prepared_for_editorial_review_only');assert(!html.includes('rel="canonical"'));assert(!html.includes('dateModified'));assert(!html.includes('<img'));
});
test('a missing existing owner or incompatible method/serving rejects automatic consolidation',()=>{
 assert.throws(()=>prepareRecipeFamilyPilot({recipes:[other]}),/owner is missing/);
 for(const variant of [{...other,method:['A different method.']},{...other,servings:2}])
  assert.throws(()=>prepareRecipeFamilyPilot({recipes:[recipe,variant]}),/separate method\/portion review/);
});
test('rendered source fields stay text and cannot inject markup',()=>{
 const x={...other,ingredients:['<script>unsafe()</script>']};
 const html=renderRecipeFamilyPreview(prepareRecipeFamilyPilot({recipes:[recipe,x]}));
 assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));
});
