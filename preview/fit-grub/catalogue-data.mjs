import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {buildIndustrialCatalogue} from '../../industrial-catalogue-v14.js';
import {FIT_CANONICAL_GUIDANCE} from '../../fit-canonical-guidance-v1.mjs';

export const fingerprint=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const root='preview/fit-grub';

export function catalogueRecords(){
  const foods=['breakfast','lunch','dinner','snack'].flatMap(meal=>read(`${root}/catalogue/${meal}.json`));
  assert.equal(foods.length,798,'Accepted recipe cohort must remain 798');
  assert.equal(new Set(foods.map(r=>r.id)).size,798,'Duplicate recipe ID');
  const accepted=read('evidence/fit-v1-final-decisions-2026-08-14.json').decisions;
  assert.equal(accepted.length,26);assert.ok(accepted.every(r=>r.decision==='PASS'));
  const source=buildIndustrialCatalogue();
  const recipeIds=new Map(source.recipes.map(r=>[r.id,r.title]));
  for(const r of foods)assert.equal(recipeIds.get(r.id),r.title,`Recipe identity changed: ${r.id}`);
  const movements=accepted.map(({movement_id:id})=>{
    const variants=source.exercises.filter(r=>r.id.startsWith('industrial-v3-fit-')&&r.canonical_movement===id).map(r=>({id:r.id,title:r.title,variation:r.variation_identity,instructions:r.instructions,dosage:r.dosage,equipment:r.equipment,limitations:r.limitations}));
    assert.equal(variants.length,51,`Missing movement variants: ${id}`);
    const guidance=FIT_CANONICAL_GUIDANCE[id];assert.ok(guidance);
    return {id,kind:'movement',title:id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '),source:guidance,variants};
  });
  return [...foods,...movements].map(r=>({...r,sourceHash:fingerprint(r.source),status:'awaiting-image'}));
}

// Exact identity AND source content are required. No title, category or family fallback.
// A canonical Fit illustration is never counted as approval of its 51 variants.
export function bindCatalogueImages(records,manifest){
  const byId=new Map(records.map(r=>[r.id,r])),seen=new Set();
  for(const m of manifest){
    assert.ok(!seen.has(m.id),`Duplicate visual assignment: ${m.id}`);seen.add(m.id);
    const r=byId.get(m.id);assert.ok(r,`Image outside accepted catalogue: ${m.id}`);
    assert.equal(m.sourceHash,r.sourceHash,`Stale source for image: ${m.id}`);
    assert.equal(m.productionApproved,false,'Preview must not confer production approval');
    assert.equal(m.scope,r.kind==='food'?'exact-recipe':'canonical-example');
    assert.match(m.file,/^[a-z0-9-]+\.webp$/);
    const bytes=fs.readFileSync(`${root}/images/${m.file}`);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),m.imageHash,`Changed image: ${m.id}`);
  }
  return records.map(r=>{
    const m=manifest.find(m=>m.id===r.id);
    return m?{...r,status:r.kind==='food'?'preview-image':'technique-review',image:{...m,url:`/catalogue-images/${m.file}`}}:r;
  });
}

export function catalogueSummary(records){
  const foods=records.filter(r=>r.kind==='food'),fit=records.filter(r=>r.kind==='movement');
  return {scope:'accepted catalogue snapshot; not a fresh live database audit',recipes:foods.length,recipeImages:foods.filter(r=>r.image).length,movements:fit.length,movementImages:fit.filter(r=>r.image).length,exerciseVariants:fit.reduce((n,r)=>n+r.variants.length,0),variantImageApprovals:0,productionImagesApproved:0,liveWebsiteChanged:false};
}

export function generationJobs(records){
  return records.map(r=>({id:r.id,kind:r.kind,sourceHash:r.sourceHash,status:r.status,source:r.source,...(r.variants?{variants:r.variants}:{}),prompt:r.kind==='food'
    ?`Photorealistic natural editorial food photo for SHIFT GRUB. One 4:3 image of ${r.title}. Exact source: ${JSON.stringify(r.source)}. Match the ingredients AND cooking method. No unlisted toppings, garnish, sides or ingredient substitutions. Normal serving; quantities cannot be certified visually. Cream ceramic, dark charcoal surface, restrained olive linen, warm window light. No text or logos. Flag source ambiguity instead of inventing a dish.`
    :`Photorealistic editorial demonstration for SHIFT FIT, ${r.title}. Source instructions: ${JSON.stringify(r.source)}. Same ordinary adult man, same equipment and camera across setup, movement and return. Complete body, hands, feet and support visible, restrained cream/charcoal/olive environment. No text or logos. Canonical example only: protocol-specific variations need separate matching review. Professional technique review required before use as a coaching visual.`}));
}
