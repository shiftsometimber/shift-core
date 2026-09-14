import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {approvedFitPack,bindApprovedFit,fitV3Assets} from './v3-assets.mjs';
import {catalogueRecords} from './catalogue-data.mjs';
test('bulk approval excludes all 44 source failures plus frog pump and binds exact image bytes',()=>{
 const p=approvedFitPack();
 assert.equal(p.approvedImageVariantRows,2476);
 for(const id of ['frog-pump','wall-push-up','45-degree-sled-leg-press','seated-machine-leg-press']){
  const r=p.records.find(r=>r.id===id);assert.equal(r.status,'held');assert.equal(r.image,null);
  assert.equal(fs.existsSync(`preview/fit-grub/v3/images/${id}.png`),false);
 }
 const assets=fitV3Assets();assert.ok(assets['/fit-v3']);
 assert.equal(fs.readdirSync('preview/fit-grub/public/fit-v3-images').length,255);
});
test('all existing movements bind by exact ID while recipes, instructions and variant dosage remain unchanged',()=>{
 const before=catalogueRecords(),after=bindApprovedFit(before);
 assert.equal(after.filter(r=>r.kind==='movement'&&r.image).length,26);
 assert.deepEqual(after.filter(r=>r.kind==='food'),before.filter(r=>r.kind==='food'));
 for(let i=0;i<before.length;i++){
  assert.deepEqual(after[i].source,before[i].source);assert.deepEqual(after[i].variants,before[i].variants);
  if(after[i].kind==='movement'){
   assert.equal(after[i].image.url,`/fit-v3-images/${after[i].id}.png`);
   assert.equal(after[i].image.productionApproved,false);
  }
 }
 const held=bindApprovedFit([{kind:'movement',id:'frog-pump',image:{url:'/stale.png'}}]);assert.equal(held[0].image,undefined);
 assert.throws(()=>bindApprovedFit([{kind:'movement',id:'invented-identity'}]),/Missing v3/);
});
test('worker blocks excluded images before static serving and refuses state mutations',async()=>{
 // A build supplies the route table; no database, account or network service is connected.
 const {default:worker}=await import('./worker.js');
 let reads=0;const env={PREVIEW_ASSETS:{fetch:async()=>{reads++;return new Response('image');}}};
 for(const id of ['frog-pump','wall-push-up','45-degree-sled-leg-press','seated-machine-leg-press','unknown']){
  assert.equal((await worker.fetch(new Request(`https://preview.test/fit-v3-images/${id}.png`),env)).status,404);
 }
 assert.equal(reads,0);
 for(const method of ['POST','PUT','DELETE'])assert.equal((await worker.fetch(new Request('https://preview.test/fit-v3-images/walk.png',{method}),env)).status,405);
 const r=await worker.fetch(new Request('https://preview.test/fit-v3-images/walk.png'),env);assert.equal(r.status,200);assert.equal(reads,1);
 assert.match(r.headers.get('content-security-policy'),/connect-src 'none'/);assert.match(r.headers.get('x-robots-tag'),/noindex/);
});
