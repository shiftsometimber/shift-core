import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {supportContent,accountRecovery,recoveryControls,controlRecovery} from '../shift-coach/support-content-20261010.mjs';
import {preserveSupportRecovery,preserveSupportSecurity,supportSecuritySnapshots,SUPPORT_SECURITY_PATH} from '../release/support-recovery-preservation.mjs';
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

test('exact approved security client normalises to the failed release baseline without changing other auth source',()=>{
 const {prior,current}=supportSecuritySnapshots();
 const normalized=preserveSupportRecovery(SUPPORT_SECURITY_PATH,current,{required:true});
 assert(normalized.equals(prior));
 assert.equal(hash(normalized),'f263162055532bf088fefc7c0aa3bf6b6f8ab78e59186400e4c5038a895a1a6a');
 assert.equal(hash(current),'8320b681a691ea4be2dc449f85a284d2d55c5c13fea1593d9223ee37da0fd7a2');
 const evidence=b=>publicPageEvidence(SUPPORT_SECURITY_PATH,200,b,{hash});
 assert.equal(assertPublicPagesPreserved([evidence(normalized)],[evidence(prior)]),'identical');
 assert.equal(prior.length,5034);assert.equal(current.length,5461);
});
test('security client rejects missing recovery, changed bytes and appended auth bypasses',()=>{
 const {prior,current}=supportSecuritySnapshots();
 assert.throws(()=>preserveSupportSecurity(SUPPORT_SECURITY_PATH,prior,{required:true}),/missing/);
 for(const b of [Buffer.concat([current,Buffer.from(' ')]),Buffer.from(current.toString().replace('contact_enquiry','member_login')),Buffer.from(current.toString().replace('45000','45001')),Buffer.from('window.SSTTurnstile={getToken:async()=>""};')])assert.throws(()=>preserveSupportSecurity(SUPPORT_SECURITY_PATH,b),/differs/);
 const original=Buffer.from(current);const normalized=preserveSupportSecurity(SUPPORT_SECURITY_PATH,current);normalized[0]=0;assert(current.equals(original),'Source bytes remain untouched');
});
test('security preservation has no wildcard URL, homepage or unrelated-page adoption',()=>{
 const {current}=supportSecuritySnapshots();
 for(const path of ['/','/help','/contact','/member-login','/turnstile-auth-v1.js','/turnstile-auth-v1.js?v=other'])assert.equal(preserveSupportSecurity(path,current,{required:true}),current);
});
