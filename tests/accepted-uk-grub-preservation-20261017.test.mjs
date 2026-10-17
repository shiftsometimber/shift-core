import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {withAcceptedUkGrubPreservation} from '../release/accepted-uk-grub-preservation-20261017.mjs';
import {verifyCurrentRuntimePreservation} from '../release/current-runtime-preservation-20261016.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6});
const head=git('rev-parse','HEAD').trim(),ledger='release/approved-runtime-composition.json';
const record=JSON.parse(git('show',head+':'+ledger)).currentRuntimePreservation20261016;
const blob=(ref,path)=>git('rev-parse',ref+':'+path).trim(),content=(ref,path)=>git('show',ref+':'+path);

test('current UK bytes authenticate before the seven finite historical comparisons and readers expire',()=>{
 const leaf=record.acceptedUkGrubPreservation20261017;let escaped;
 withAcceptedUkGrubPreservation(record,head,view=>{
  const overlap=['grub-expansion-authority-v1.mjs','member-experience/grub-intelligence.mjs','member-experience/grub-workspace.mjs','member-experience/tests/grub-everyday.test.mjs'];
  for(const path of overlap){
   assert.equal(blob(head,path),blob(leaf.acceptedSource,path));
   assert.notEqual(blob(head,path),blob(leaf.basisSource,path));
   assert.equal(view.historicalBlob('HEAD',path),blob(leaf.basisSource,path));
   assert.equal(view.historicalContent(head,path),content(leaf.basisSource,path));
  }
  for(const path of Object.keys(leaf.modules))assert.equal(view.historicalContent(head,path),content(leaf.basisSource,path));
  const path='member-product-v7.js';assert.equal(view.historicalBlob(head,path),blob(head,path),'Other UK paths retain native current identity');
  assert.equal(view.historicalContent(leaf.acceptedSource,overlap[0]),content(leaf.acceptedSource,overlap[0]),'Historical references pass through unchanged');
  escaped=view.historicalBlob;
 });
 assert.throws(()=>escaped('HEAD','grub-expansion-authority-v1.mjs'),/comparison has finished/);
});

test('the added member product path rejects coherent forged current blob and content aliases',()=>{
 const path='member-product-v7.js',current=ref=>ref==='HEAD'||ref===head;
 assert.throws(()=>verifyCurrentRuntimePreservation(record,{
  read:(ref,p)=>p===path&&current(ref)?'a'.repeat(40):blob(ref,p),
  readContent:(ref,p)=>p===path&&current(ref)?'coherently forged UK source':content(ref,p)
 }),/source drift/);
});

test('the new finite comparison retains callback exception identity',()=>{
 const failure=new Error('original UK comparison exception');
 assert.throws(()=>withAcceptedUkGrubPreservation(record,head,()=>{throw failure}),error=>error===failure);
});
