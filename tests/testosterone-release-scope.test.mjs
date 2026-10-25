import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,appendFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {verifyTestosteroneExtension,TRT_BASE,TRT_PAYLOAD} from '../release/testosterone-scope-20261021.mjs';
import {verifyWebsiteEditorialCompletion} from '../release/website-editorial-scope-20261018.mjs';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:64e6}).trimEnd();
const record=()=>JSON.parse(git('show','HEAD:release/approved-runtime-composition.json')).websiteEditorialCompletion20261018;
test('exact approved TRT delta retains original approval ledger and no production credit',()=>{
 const r=verifyTestosteroneExtension();
 assert.equal(r.predecessor,TRT_BASE);assert.equal(r.payload,TRT_PAYLOAD);
 assert.equal(r.actual,git('rev-parse','HEAD'));assert.equal(r.productionVerified,false);
 assert.equal(git('show','HEAD:release/approved-runtime-composition.json'),git('show',TRT_BASE+':release/approved-runtime-composition.json'));
});
test('original historical editorial checks still execute against their pinned predecessor',()=>{
 const c=record();assert.equal(verifyWebsiteEditorialCompletion(c),c);
 assert.throws(()=>verifyWebsiteEditorialCompletion({...c,sourceBaseProductionAccepted:true}));
 assert.throws(()=>verifyWebsiteEditorialCompletion(c,{rawHead:TRT_BASE}));
 assert.throws(()=>verifyWebsiteEditorialCompletion(c,{readDiff:()=>[]}));
 assert.throws(()=>verifyWebsiteEditorialCompletion(c,{isAncestor:()=>false}));
});
test('forged TRT callback bytes cannot be hidden by historical projection',()=>{
 const actual=git('rev-parse','HEAD'),c=record();
 for(const alias of ['HEAD',actual]){
  assert.throws(()=>verifyWebsiteEditorialCompletion(c,{read:(r,p)=>r===alias&&p==='testosterone-guides.mjs'?'forged':git('rev-parse',r+':'+p)}));
  assert.throws(()=>verifyWebsiteEditorialCompletion(c,{readContent:(r,p)=>r===alias&&p==='testosterone-guides.mjs'?'forged':execFileSync('git',['show',r+':'+p],{encoding:'utf8',maxBuffer:64e6})}));
 }
});
test('real source tampering and unrelated committed changes fail in isolated checkout',()=>{
 const parent=mkdtempSync(join(tmpdir(),'trt-admission-rejection-')),dir=join(parent,'repo');
 try{
  execFileSync('git',['clone','--no-hardlinks','--quiet',process.cwd(),dir],{stdio:'pipe'});
  const g=(...a)=>execFileSync('git',a,{cwd:dir,encoding:'utf8',stdio:'pipe'});
  const run=()=>spawnSync(process.execPath,['--input-type=module','-e',"import {verifyTestosteroneExtension} from './release/testosterone-scope-20261021.mjs';verifyTestosteroneExtension();"],{cwd:dir,encoding:'utf8'});
  assert.equal(run().status,0);
  appendFileSync(join(dir,'testosterone-guides.mjs'),'\n// unauthorised tamper\n');assert.notEqual(run().status,0);
  g('restore','testosterone-guides.mjs');
  appendFileSync(join(dir,'worker-entry-v6.js'),'\n// unrelated change\n');
  g('add','worker-entry-v6.js');g('-c','user.name=Scope Test','-c','user.email=scope-test@example.invalid','commit','-m','Unrelated test mutation');
  assert.notEqual(run().status,0);
 }finally{rmSync(parent,{recursive:true,force:true});}
});
