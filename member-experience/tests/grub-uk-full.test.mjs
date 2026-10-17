import test from 'node:test';import assert from 'node:assert/strict';import fs from'node:fs';import{createHash}from'node:crypto';
import{DB,server}from'./grub-ease-fixture.mjs';
import{loadGrubCatalogue}from'../grub-routes.mjs';
import{searchGrubRecipes,memberRecipe,filterRecipe}from'../grub-search.mjs';
import{UK_FULL_PUBLICATION}from'../../grub-uk-full-publication-20261018.mjs';
import{applyFullUKCorrections}from'../../grub-uk-full-authority-20261018.mjs';
import{GRUB_DISCOVERY_MANIFEST}from'../grub-discovery-manifest-20261017.mjs';
const pack=JSON.parse(fs.readFileSync('content/grub/uk-full-corrections-20261018.json')),sha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
test('actual original publication tools feed a full corrected catalogue; every page is reachable once',async()=>{
 try{
 const records=await loadGrubCatalogue(DB);assert.equal(records.length,2692);
 const visible=records.filter(r=>r.discovery.eligible);assert.equal(visible.length,2542);assert.equal(new Set(visible.map(r=>r.title)).size,2542);
 const first=searchGrubRecipes({},records),seen=new Set();assert.equal(first.total,2542);
 for(let offset=0;offset<first.total;offset+=12){const page=searchGrubRecipes({offset},records);assert.equal(page.offset,offset);assert.equal(page.has_more,offset+page.top.length<2542);for(const r of page.top){assert(!seen.has(r.id),r.id);seen.add(r.id);assert.equal(r.image,null);assert(r.ingredients.length&&r.method.length>=2);}}
 assert.equal(seen.size,2542);
 assert.deepEqual(searchGrubRecipes({query:'pizza'},records).top.slice(0,4).map(r=>r.name),['Margherita pizza with side salad','Pepperoni pizza with side salad','Ham and pineapple pizza with side salad','Mushroom pizza with side salad']);
 for(const r of visible){const m=memberRecipe(r);assert(m);assert(m.minutes>0&&m.hands_on_minutes>0&&m.hands_on_minutes<=m.minutes,r.id);assert(m.equipment.length,r.id);if(/overnight/i.test(m.name))assert(m.minutes>=360,r.id);if(filterRecipe(m,'vegetarian'))assert(!/suitability.*not established/.test(m.allergen_note));}
 for(const row of records.filter(r=>r.discovery.eligible===false))assert(memberRecipe(row),'Saved identity remains usable '+row.id);
 }finally{await new Promise(r=>server.close(r));}
});
test('every exact revision reconciles measured ingredients and finite macro estimates with declared food sources',()=>{
 assert.equal(pack.recipes.length,2671);assert.equal(UK_FULL_PUBLICATION.recipes.length,2671);assert.equal(GRUB_DISCOVERY_MANIFEST.rows.length,2692);
 for(const row of pack.recipes){
 const d=row.data;assert.equal(row.human_review_claimed,false);assert.equal(row.physical_cooking_trial_claimed,false);assert.equal(d.ingredients.length,d.ingredient_evidence.length);
 for(const i of d.ingredients){const e=d.ingredient_evidence.find(e=>e.item===i.item);assert(e&&e.amount===i.amount&&e.calculation_grams>0,row.id);}
 if(d.method.some(s=>s.includes('measured oil')))assert(d.ingredients.some(i=>i.item==='olive oil'),row.id);
 if(d.food_format==='pizza'){assert(d.ingredients.some(i=>/mozzarella/.test(i.item)));assert.equal(d.servings,2);}
 for(const nutrient of ['kcal','protein_g','carbohydrate_g','fat_g','fibre_g','saturates_g']){
 const missing=d.ingredient_evidence.filter(i=>!Number.isFinite(Number(pack.foods[i.food_code][nutrient]))&&pack.foods[i.food_code][nutrient]!=='Tr'||pack.foods[i.food_code][nutrient]===null||pack.foods[i.food_code][nutrient]==='');
 if(missing.length){assert.equal(d.nutrition[nutrient],null,row.id+nutrient);assert(d.nutrition.unknown_nutrients[nutrient].length);continue;}
 const total=d.ingredient_evidence.reduce((sum,i)=>{const f=pack.foods[i.food_code];return sum+(f[nutrient]==='Tr'?0:Number(f[nutrient]))*i.calculation_grams/(f.reference_grams||100);},0)/d.servings;
 assert(Math.abs(total-d.nutrition[nutrient])<=.0500001,row.id+nutrient);
 }
 }
});
test('changed content, fake human attestation, source drift and incomplete authority fail closed',async()=>{
 for(const mutate of [p=>p.recipes[0].data.method[0]='Invented',p=>p.recipes.pop(),p=>p.human_editorial_review_claimed=true,p=>p.owner.id='Another owner']){const pub=structuredClone(UK_FULL_PUBLICATION);mutate(pub);await assert.rejects(()=>applyFullUKCorrections({rows:[],incomplete:false},pub));}
 const row=UK_FULL_PUBLICATION.recipes[0];await assert.rejects(()=>applyFullUKCorrections({rows:[{id:row.id,title:'Changed source',data:{},review:{}}]}),/parent changed/);
 const incomplete={incomplete:true,rows:[]};assert.equal(await applyFullUKCorrections(incomplete),incomplete);
});
