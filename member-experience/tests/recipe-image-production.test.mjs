import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {grubImages,imageForRecipe} from '../grub-image-map.mjs';
import {recipeSource} from '../grub-client.mjs';
const root=new URL('../../',import.meta.url);
const inventory=JSON.parse(zlib.gunzipSync(fs.readFileSync(new URL('evidence/grub-image-coverage-2026-10-04/recipe-image-queue.json.gz',root))));
const recipes=new Map(inventory.recipes.map(r=>[r.id,r]));
const row=r=>({id:r.id,title:r.title,data:{ingredients:r.ingredients,method:r.method}});
test('all image bindings agree with governed recipe content and reject changes',()=>{
 assert.equal(recipes.size,2671);assert.equal(new Set(grubImages.map(m=>m.id)).size,grubImages.length);
 for(const image of grubImages){
  const r=recipes.get(image.id);assert(r,image.id);assert.equal(image.title,r.title);assert.deepEqual(image.ingredients,r.ingredients);assert.deepEqual(image.method,r.method);
  const exact=row(r);assert(imageForRecipe(exact),image.id);assert.equal(imageForRecipe({...exact,title:r.title+' changed'}),null);
  const changed=structuredClone(exact);changed.data.ingredients[0].amount+=' changed';assert.equal(imageForRecipe(changed),null);
  const prepared=structuredClone(exact);prepared.data.method[0]+=' changed';assert.equal(imageForRecipe(prepared),null);
  assert.equal(imageForRecipe({...exact,id:'unknown-'+r.id}),null);
 }
});
test('every bound asset has its recorded SHA256 and responsive variants exist',()=>{
 for(const image of grubImages){
  const path=new URL('frontend/member'+image.src,root);const bytes=fs.readFileSync(path);assert(bytes.length>0);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),image.sha256,image.id);
  assert.match(bytes.toString('ascii',0,4),/^RIFF$/);assert.equal(bytes.toString('ascii',8,12),'WEBP');
  if(image.srcSet)for(const entry of image.srcSet.split(', ')){const [src,width]=entry.split(' ');assert(['480w','960w'].includes(width));assert(fs.statSync(new URL('frontend/member'+src,root)).size>0);}
 }
});
test('every staged accepted group has a source-specific review, both verified variants and exact bindings',()=>{
 const state=new URL('evidence/recipe-image-worker/',root);
 const decisions=JSON.parse(fs.readFileSync(new URL('visual-reviews.json',state)));
 const rejected=new Set(fs.readdirSync(new URL('rejected/',state)).map(name=>{
  const r=JSON.parse(fs.readFileSync(new URL('rejected/'+name,state)));return r.groupId+':'+r.source_sha256;
 }));
 for(const name of fs.readdirSync(new URL('staged/',state))){
  const r=JSON.parse(fs.readFileSync(new URL('staged/'+name,state)));if(!r.integrated)continue;
  const review=decisions[r.groupId];assert.equal(review.decision,'pass');assert.equal(review.source_sha256,r.source_sha256);assert(!rejected.has(r.groupId+':'+r.source_sha256));
  assert.deepEqual(review.recipe_ids,r.recipe_ids);assert.deepEqual(review.titles,r.titles);assert(review.notes&&review.alt);
  assert.equal(r.variants.length,2);for(const variant of r.variants){const b=fs.readFileSync(new URL(variant.asset,root));assert.equal(crypto.createHash('sha256').update(b).digest('hex'),variant.sha256);}
  for(const id of r.recipe_ids){const m=grubImages.find(m=>m.id===id);assert(m,id);assert.equal(m.sha256,r.variants[1].sha256);}
 }
});
test('seven original mappings are preserved byte-for-byte in content',()=>{
 const source=execFileSync('git',['show','6763579:member-experience/grub-image-map.mjs'],{encoding:'utf8'});
 const baseline=JSON.parse(source.slice(source.indexOf('export const grubImages=')+'export const grubImages='.length,source.indexOf('];')+1));
 assert.equal(baseline.length,7);for(const original of baseline)assert.deepEqual(grubImages.find(m=>m.id===original.id),original);
});
test('renderer emits responsive sizes, actual aspect ratio and escaped alt text',()=>{
 const meal={name:'Test meal',image:{src:'/assets/test.webp',alt:'A "quoted" & accurate meal',srcSet:'/assets/test-480.webp 480w, /assets/test.webp 960w',width:960,height:720}};
 const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const html=vm.runInNewContext('('+recipeSource+')(meal)',{meal,esc});assert.match(html,/srcset="\/assets\/test-480.webp 480w, \/assets\/test.webp 960w"/);assert.match(html,/sizes="\(max-width: 600px\)/);assert.match(html,/width="960" height="720" loading="lazy" decoding="async"/);assert.match(html,/alt="A &quot;quoted&quot; &amp; accurate meal"/);
});
test('catalogue coverage is counted from exact bindings, not from queued jobs',()=>{
 const bound=new Set(grubImages.map(m=>m.id));const missing=inventory.recipes.filter(r=>!bound.has(r.id));assert.equal(bound.size+missing.length,2671);assert(missing.length>0,'Full coverage requires a fresh completeness review before changing this assertion');
 console.log(JSON.stringify({usable:2671,integrated:bound.size,missing:missing.length,liveVerified:false}));
});
