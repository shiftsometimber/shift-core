import test from 'node:test';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';import {continuityPages} from '../public-continuity.mjs';
import {additions,preserveContinuityUpgrade} from '../release/continuity-content-20261009.mjs';
test('finite upgrade retains every old body and does not change other continuity pages',async()=>{
 const old=execFileSync('git',['show','2a6222b9a82710bfa2e40e33efb47c7bdd8ec80f:public-continuity.mjs'],{encoding:'utf8'});
 const prior=await import('data:text/javascript;base64,'+Buffer.from(old).toString('base64'));
 for(const [path,page] of Object.entries(continuityPages))assert.equal(preserveContinuityUpgrade(path,Buffer.from(page.body),{required:!!additions[path]}).toString(),prior.continuityPages[path].body);
 assert.deepEqual(prior.CONTINUITY_REDIRECTS,(await import('../public-continuity.mjs')).CONTINUITY_REDIRECTS);
});
test('preservation rejects removed, duplicated, changed or misrouted registered content',()=>{
 for(const [path,addition] of Object.entries(additions)){
  assert.equal(preserveContinuityUpgrade(path,Buffer.from('before'+addition+'after'),{required:true}).toString(),'beforeafter');
  for(const text of ['',addition+addition,addition.replace('href="','href="/wrong'),addition.replace('<h2>','<h2>changed ')])assert.throws(()=>preserveContinuityUpgrade(path,Buffer.from(text),{required:true}));
 }
});
