import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {catalogueRecords,bindCatalogueImages,catalogueSummary,generationJobs} from './catalogue-data.mjs';
const rows=catalogueRecords(),manifest=JSON.parse(fs.readFileSync('preview/fit-grub/catalogue-images.json'));
test('accepted cohort remains 798 recipes and 1326 exact variants; drafts are excluded',()=>{
  const recipes=rows.filter(r=>r.kind==='food'),movements=rows.filter(r=>r.kind==='movement');
  assert.equal(recipes.length,798);assert.equal(movements.length,26);assert.equal(movements.reduce((n,r)=>n+r.variants.length,0),1326);
  assert.equal(new Set(movements.flatMap(r=>r.variants.map(v=>v.id))).size,1326);
  assert.equal(rows.some(r=>r.id==='porridge-apple-cinnamon'),false);
  assert.deepEqual(Object.fromEntries(['breakfast','lunch','dinner','snack'].map(m=>[m,recipes.filter(r=>r.meal===m).length])),{breakfast:212,lunch:204,dinner:195,snack:187});
});
test('changed ingredients cannot silently reuse a previous image; title similarity is insufficient',()=>{
  const changed=structuredClone(rows);changed.find(r=>r.id===manifest[0].id).sourceHash='changed';
  assert.throws(()=>bindCatalogueImages(changed,manifest),/Stale source/);
  assert.throws(()=>bindCatalogueImages(rows,[{...manifest[0],id:'porridge-apple-cinnamon'}]),/outside accepted/);
  assert.throws(()=>bindCatalogueImages(rows,[...manifest,manifest[0]]),/Duplicate visual/);
  const bound=bindCatalogueImages(rows,manifest);assert.ok(bound.filter(r=>!manifest.some(m=>m.id===r.id)).every(r=>!r.image));
});
test('base movement images do not approve their variants or confer production approval',()=>{
  const bound=bindCatalogueImages(rows,manifest),summary=catalogueSummary(bound);
  assert.equal(summary.recipeImages,4);assert.equal(summary.movementImages,2);assert.equal(summary.variantImageApprovals,0);assert.equal(summary.productionImagesApproved,0);
  assert.ok(bound.filter(r=>r.kind==='movement').flatMap(r=>r.variants).every(v=>!v.image));
  assert.throws(()=>bindCatalogueImages(rows,[{...manifest[0],productionApproved:true}]),/production approval/);
});
test('every accepted item has a source-bound generation brief and all exercise protocols remain available',()=>{
  const jobs=generationJobs(rows);assert.equal(jobs.length,824);assert.ok(jobs.every(j=>j.sourceHash&&j.prompt.includes(JSON.stringify(j.source))));
  const sit=jobs.find(j=>j.id==='sit-to-stand');assert.ok(sit.variants.some(v=>v.variation==='reduced-range-beginner'));assert.ok(sit.variants.some(v=>v.variation==='supported-advanced'));
});
test('static image serving stays read-only and cannot open production services',async()=>{
  const source=fs.readFileSync('preview/fit-grub/worker.js','utf8').replace("import assets from './assets.js';","const assets={};");
  const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  let calls=0;const env={PREVIEW_ASSETS:{fetch:async()=>{calls++;return new Response('image',{headers:{'Content-Type':'image/webp'}})}}};
  for(const path of ['/','/catalogue-images/test.webp','/v1/member/state'])assert.equal((await worker.fetch(new Request('https://preview.test'+path,{method:'POST'}),env)).status,405);
  assert.equal(calls,0);
  const response=await worker.fetch(new Request('https://preview.test/catalogue-images/test.webp'),env);
  assert.equal(calls,1);assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'image/webp');assert.match(response.headers.get('X-Robots-Tag'),/noindex/);assert.match(response.headers.get('Content-Security-Policy'),/connect-src 'none'/);
  assert.equal((await worker.fetch(new Request('https://preview.test/v1/member/state'),env)).status,404);assert.equal(calls,1);
});
