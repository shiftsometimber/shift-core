import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {approvedFitPack,bindApprovedFit,fitV3Assets} from './v3-assets.mjs';
import {catalogueRecords} from './catalogue-data.mjs';
test('all 45 corrections bind to reviewed replacement bytes while original approvals and guidance stay unchanged',()=>{
 const p=approvedFitPack();
 const baseline=JSON.parse(fs.readFileSync('preview/fit-grub/v3/corrections/baseline.json'));
 const reviews=JSON.parse(fs.readFileSync('preview/fit-grub/v3/corrections/review.json'));
 assert.equal(p.approvedImages,300);assert.equal(p.heldImages,0);assert.equal(p.approvedImageVariantRows,2688);
 assert.equal(reviews.records.length,45);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('preview/fit-grub/guidance/workbook.json')).digest('hex'),baseline.guidanceSha256);
 for(const before of baseline.records){
  const after=p.records.find(r=>r.id===before.id);
  assert.deepEqual(after.variants,before.variants);assert.equal(after.techniqueReview,before.techniqueReview);
  if(before.status==='approved'){assert.deepEqual(after,before);continue;}
  const review=reviews.records.find(r=>r.id===before.id);
  assert.equal(review.status,'pass');assert.equal(review.sha256,after.sha256);
  assert.equal(review.originalRejectedSha256,before.sha256);assert.notEqual(after.sha256,before.sha256);
  assert.equal(after.correctionReview.originalHoldReason,before.reason);
  assert.equal(after.approvalMethod,'delegated AI visual correction review');
 }
 const assets=fitV3Assets();assert.ok(assets['/fit-v3']);
 assert.equal(fs.readdirSync('preview/fit-grub/public/fit-v3-images').length,300);
 assert.match(assets['/fit-v3'].body,/300 images ready/);assert.match(assets['/fit-v3'].body,/0 held for correction/);
});
test('unreviewed or altered correction bytes cannot pass the asset gate',()=>{
 const p=approvedFitPack(),changed=structuredClone(p),r=changed.records.find(r=>r.correctionReview);
 r.correctionReview.status='retry';assert.throws(()=>approvedFitPack(changed),/Correction review missing/);
 r.correctionReview.status='pass';r.sha256='0'.repeat(64);r.correctionReview.sha256=r.sha256;
 assert.throws(()=>approvedFitPack(changed),/Approval bytes changed/);
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
 const heldPack=structuredClone(approvedFitPack());heldPack.records.find(r=>r.id==='frog-pump').status='held';
 const held=bindApprovedFit([{kind:'movement',id:'frog-pump',image:{url:'/stale.png'}}],heldPack);assert.equal(held[0].image,undefined);
 assert.throws(()=>bindApprovedFit([{kind:'movement',id:'invented-identity'}]),/Missing v3/);
});
test('worker blocks excluded images before static serving and refuses state mutations',async()=>{
 // A build supplies the route table; no database, account or network service is connected.
 const {default:worker}=await import('./worker.js');
 let reads=0;const env={PREVIEW_ASSETS:{fetch:async()=>{reads++;return new Response('image');}}};
 for(const id of ['unknown','unreviewed-candidate']){
  assert.equal((await worker.fetch(new Request(`https://preview.test/fit-v3-images/${id}.png`),env)).status,404);
 }
 assert.equal(reads,0);
 for(const method of ['POST','PUT','DELETE'])assert.equal((await worker.fetch(new Request('https://preview.test/fit-v3-images/walk.png',{method}),env)).status,405);
 const r=await worker.fetch(new Request('https://preview.test/fit-v3-images/walk.png'),env);assert.equal(r.status,200);assert.equal(reads,1);
 for(const id of ['frog-pump','wall-push-up','45-degree-sled-leg-press','seated-machine-leg-press'])assert.equal((await worker.fetch(new Request(`https://preview.test/fit-v3-images/${id}.png`),env)).status,200);
 assert.match(r.headers.get('content-security-policy'),/connect-src 'none'/);assert.match(r.headers.get('x-robots-tag'),/noindex/);
});
