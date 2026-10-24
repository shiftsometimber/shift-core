import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {verifyMemberRecordingRepair,validateRecordingRepairReceipt,RECORDING_REPAIR_RECEIPT,RECORDING_REPAIR_BLOBS,originalRecordingMaintenance,withMemberRecordingQualification} from '../release/member-recording-repair-20261024.mjs';
const receipt=()=>JSON.parse(readFileSync(RECORDING_REPAIR_RECEIPT,'utf8'));
test('exact native repair and its registration have no unrelated source tail',()=>{const proof=verifyMemberRecordingRepair();assert.equal(proof.paths.length,20);assert.deepEqual(proof.receipt.payloadBlobs,RECORDING_REPAIR_BLOBS);});
test('authority cannot be expanded to messages, real deletion, Health reads or a new Apple submission',()=>{for(const key of ['messaging','realAccountDeletionTest','personalHealthRead','newAppleSubmission','homepage']){const r=receipt();r.authority[key]=true;assert.throws(()=>validateRecordingRepairReceipt(r));}});
test('all runtime and acceptance-test pins reject drift',()=>{for(const key of Object.keys(RECORDING_REPAIR_BLOBS)){const r=receipt();r.payloadBlobs[key]='0'.repeat(40);assert.throws(()=>validateRecordingRepairReceipt(r));}});
test('forged source, provenance and extra receipt fields are rejected',()=>{for(const patch of [{base:'0'.repeat(40)},{payload:'0'.repeat(40)},{registrationSource:'unverified'},{ignoreOldGuards:true}])assert.throws(()=>validateRecordingRepairReceipt({...receipt(),...patch}));const r=receipt();r.registrationSource='a'.repeat(40);assert.throws(()=>verifyMemberRecordingRepair(r),/Native repair receipt/);});

test('qualified maintenance restores every original guard byte and rejects edited adapters',()=>{for(const path of ['release/my-shift-release-scope-20261024.mjs','release/approved-source-comparison-20261024.mjs','release/member-design-scope.mjs','release/app-scope.mjs','.github/workflows/seo-discovery-proof.yml','release/app-preflight.mjs','tests/approved-ranking-release.test.mjs','tests/seo-discovery-release.test.mjs']){const value=readFileSync(path,'utf8');assert.equal(typeof originalRecordingMaintenance(path,value),'string');assert.throws(()=>originalRecordingMaintenance(path,value+'unreviewed'));}});

test('closed native qualification reuse rejects changed current bytes in an isolated checkout',()=>{
 const fixture=mkdtempSync(tmpdir()+'/recording-qualification-tamper-');
 try{
  execFileSync('git',['clone','--quiet','--no-local','--single-branch','--no-tags',process.cwd(),fixture],{encoding:'utf8',maxBuffer:64e6});
  const code=String.raw`import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {verifyMemberRecordingRepair,withMemberRecordingQualification} from './release/member-recording-repair-20261024.mjs';
withMemberRecordingQualification(()=>{verifyMemberRecordingRepair();const path='docs/privacy-account-deletion.md',before=readFileSync(path);try{writeFileSync(path,Buffer.concat([before,Buffer.from('\nUnreviewed source change\n')]));assert.throws(()=>verifyMemberRecordingRepair(),/Actual repair bytes changed/);}finally{writeFileSync(path,before);}assert.equal(verifyMemberRecordingRepair().paths.length,20);});`;
  execFileSync(process.execPath,['--input-type=module','-e',code],{cwd:fixture,encoding:'utf8',maxBuffer:64e6});
 }finally{rmSync(fixture,{recursive:true,force:true});}
});

test('exact repair comparison composes with the original CLI admission instead of masking it',async()=>{const {approvedSourceComparison}=await import('../release/approved-source-comparison-20261024.mjs');const path='release/app-preflight.mjs',current=readFileSync(path,'utf8'),original=execFileSync('git',['show','2ac8456e8394c1508b13481fad1f68520926f10b:'+path],{encoding:'utf8'});const blob=value=>createHash('sha1').update('blob '+Buffer.byteLength(value)+'\0').update(value).digest('hex');assert.equal(approvedSourceComparison(path,current),original);assert.equal(approvedSourceComparison(path,blob(current)),blob(original));assert.equal(approvedSourceComparison(path,current+'unreviewed'),current+'unreviewed');assert.equal(approvedSourceComparison(path,original,'2ac8456e8394c1508b13481fad1f68520926f10b'),original);});


test('merged safety pins accept raw and qualified current hashes and reject forged readers',async()=>{
 const {memberRecordingComparisonValue}=await import('../release/member-recording-repair-20261024.mjs');
 const {myShiftSafetyComparison,MY_SHIFT_BASE}=await import('../release/my-shift-release-scope-20261024.mjs');
 const {verifyCurrentMainSafetyChecks}=await import('../release/app-scope.mjs');
 const pin=(ref,path)=>execFileSync('git',['rev-parse',ref+':'+path],{encoding:'utf8'}).trim();
 withMemberRecordingQualification(()=>{
  const paths=['release/approved-source-comparison-20261024.mjs','release/combined-finite-scope-20261014.mjs'];
  for(const path of paths){
   const native=pin('HEAD',path),qualified=memberRecordingComparisonValue(path,native),expected=pin(MY_SHIFT_BASE,path);
   assert.equal(myShiftSafetyComparison(path,native),expected,'Raw current safety pin: '+path);
   assert.equal(myShiftSafetyComparison(path,qualified),expected,'Qualified current safety pin: '+path);
   assert.equal(myShiftSafetyComparison(path,'0'.repeat(40)),'0'.repeat(40),'Forged hash must remain rejected');
   assert.equal(myShiftSafetyComparison(path,'unreviewed source'),'unreviewed source','Arbitrary reader values must remain unchanged');
  }
  const checked=verifyCurrentMainSafetyChecks();
  for(const target of paths){
   assert(checked.includes(target));
   assert.throws(()=>verifyCurrentMainSafetyChecks(path=>path===target?'0'.repeat(40):memberRecordingComparisonValue(path,pin('HEAD',path))),/Merged safety-check source drift/);
  }
 });
});
