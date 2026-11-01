import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recipeDraft,buildRecipeCatalogue} from '../recipe_catalogue.mjs';

const fixture={recipes:[{id:'beans',title:'Beans on toast',content_sha256:'current',recipe_yield:2,nutrition:{kcal:300,protein_g:12,carbohydrate_g:40,fat_g:0,fibre_g:null}}]};
const confirmed={recipeId:'beans',recipeHash:'current',memberConfirmed:true,servingsEaten:1.5,includeNutrition:true};
test('recipe and portion must be explicitly confirmed against the current version',()=>{
 assert.throws(()=>recipeDraft(fixture,{...confirmed,memberConfirmed:false}),/Confirm/);
 assert.throws(()=>recipeDraft(fixture,{...confirmed,recipeHash:'old'}),/changed/);
 for(const amount of [undefined,0,NaN,Infinity,9])assert.throws(()=>recipeDraft(fixture,{...confirmed,servingsEaten:amount}),/how many/);
});
test('known per-serving estimates scale once; unknown stays absent and zero stays zero',()=>{
 const draft=recipeDraft(fixture,confirmed);
 assert.deepEqual(draft.nutrition,{kcal:450,proteinG:18,carbsG:60,fatG:0});
 assert.equal(draft.requiresReview,true);assert.equal(draft.autoSave,false);
 assert.equal(draft.recipe.recipeYield,2);
});
test('optional nutrition remains off by default and substitutions do not inherit recipe numbers',()=>{
 assert.deepEqual(recipeDraft(fixture,{...confirmed,includeNutrition:undefined}).nutrition,{});
 assert.deepEqual(recipeDraft(fixture,{...confirmed,ingredientsChanged:true}).nutrition,{});
});
test('actual governed source recipes qualify, while altered publication bytes fail',()=>{
 const root=new URL('../../',import.meta.url);
 const paths={full:'grub-uk-full-publication-20261018.mjs',core:'grub-uk-core-publication-20261017.mjs',everyday:'grub-everyday-publication-v1.mjs',images:'member-experience/grub-image-map.mjs'};
 const files=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,readFileSync(new URL(p,root),'utf8')]));
 const catalogue=buildRecipeCatalogue(files);
 assert.equal(catalogue.stats.recipes,2692);
 const beans=catalogue.recipes.find(r=>r.id==='everyday-beans-on-toast');assert(beans);
 const draft=recipeDraft(catalogue,{recipeId:beans.id,recipeHash:beans.content_sha256,memberConfirmed:true,servingsEaten:1,includeNutrition:true});
 assert.equal(draft.nutrition.kcal,beans.nutrition.kcal);
 assert.equal(draft.food,'Beans on toast');
 assert.throws(()=>buildRecipeCatalogue({...files,full:files.full.replace('Egg breakfast wrap','Tampered breakfast wrap')}),/qualification/);
 assert(catalogue.recipes.every(r=>!r.image||r.image_status==='exact_source_binding'));
});
