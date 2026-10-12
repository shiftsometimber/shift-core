import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {supportContent,accountRecovery,recoveryControls,controlRecovery} from '../shift-coach/support-content-20261010.mjs';
import {preserveSupportRecovery} from '../release/support-recovery-preservation.mjs';
import {publicPageEvidence,assertPublicPagesPreserved} from '../medicines-watch/preservation.mjs';
const old='<html><head><title>Help</title></head><body><main><p>For registration, verification, sign-in or password-reset problems, start at <a href="/member-login">My Timber sign-in</a>. Never send your password by email.</p><h2>Health and urgent support</h2><p>Retained four-nation support.</p></main></body></html>';
const current=supportContent(old,'/help');
const hash=b=>createHash('sha256').update(b).digest('hex');
const evidence=b=>publicPageEvidence('/help',200,b,{hash});
test('exact approved Help addition restores every original byte before hash comparison',()=>{
 const b=Buffer.from(old),a=preserveSupportRecovery('/help',Buffer.from(current),{required:true});
 assert(a.equals(b));assert.equal(assertPublicPagesPreserved([evidence(a)],[evidence(b)]),'identical');
 assert.equal(preserveSupportRecovery('/help',b),b);
 assert.equal(Buffer.byteLength(current)-b.length,Buffer.byteLength(accountRecovery+recoveryControls+controlRecovery+' id="urgent-help"'));
});
test('missing, altered, duplicated or partial recovery fails closed',()=>{
 assert.throws(()=>preserveSupportRecovery('/help',Buffer.from(old),{required:true}));
 for(const block of [accountRecovery,recoveryControls,controlRecovery]){
  assert.throws(()=>preserveSupportRecovery('/help',Buffer.from(current.replace(block,''))));
  assert.throws(()=>preserveSupportRecovery('/help',Buffer.from(current.replace(block,block+block))));
  assert.throws(()=>preserveSupportRecovery('/help',Buffer.from(current.replace(block,block.replace('2026-10-11','2026-10-12')))));
 }
 assert.throws(()=>preserveSupportRecovery('/help',Buffer.from(current.replace('id="urgent-help"','id="urgent-other"'))));
});
test('moving approved blocks is rejected and unrelated content remains hash protected',()=>{
 assert.throws(()=>preserveSupportRecovery('/help',Buffer.from(current.replace(accountRecovery,'').replace('</main>',accountRecovery+'</main>'))));
 for(const replacement of ['Changed retained support.','<p>Unapproved addition</p>']){
  const mutated=current.replace('Retained four-nation support.',replacement);
  const normalized=preserveSupportRecovery('/help',Buffer.from(mutated),{required:true});
  assert.throws(()=>assertPublicPagesPreserved([evidence(normalized)],[evidence(Buffer.from(old))]),/changed outside/);
 }
});
test('other pages and homepage are returned unchanged',()=>{
 for(const path of ['/','/contact','/medical-disclaimer','/accessibility','/member-login','/treatment-centre']){
  const b=Buffer.from(current);assert.equal(preserveSupportRecovery(path,b,{required:true}),b);
 }
});
