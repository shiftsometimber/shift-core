import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {
 MEDICINES_WATCH_SPECIALIST_BASE as base,
 MEDICINES_WATCH_SPECIALIST_SOURCE as source,
 MEDICINES_WATCH_SPECIALIST_PATHS as paths,
 MEDICINES_WATCH_SPECIALIST_MAINTENANCE as maintenance,
 RECONCILIATION_MANIFEST,
 verifyMedicinesWatchSpecialistEvidence,
 verifyReconciledRelease
} from '../release/approved-runtime-composition.mjs';

const receipt=()=>({
 proof:'EXACT_MEDICINES_WATCH_SPECIALIST_EVIDENCE_V1',base,source,
 paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),
 failedRun:37934545725,failedJob:113833531088,
 publicationStatus:'approved_for_guarded_release',
 editorialAuthorisationRecorded:true,primaryEvidenceReviewed:true,
 reviewUncertaintyPreserved:true,continuityVerifierCompositionFixed:true,
 clinicalApprovalClaimed:false,nhsAccessClaimed:false,actualSupplyClaimed:false,
 genericAdoptionAllowed:false,deploymentAuthorityBroadened:false,
 rollbackAuthorityBroadened:false,existingGatesWeakened:false
});
const options=()=>({
 head:'b'.repeat(40),ancestor:()=>{},read:()=> 'same',
 diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[RECONCILIATION_MANIFEST]
});

test('finite reviewed Watch evidence and verifier composition pass',()=>verifyMedicinesWatchSpecialistEvidence(receipt(),options()));
test('unrelated paths, fabricated approval and broadened authority remain rejected',()=>{
 for(const patch of [
  {editorialAuthorisationRecorded:false},{primaryEvidenceReviewed:false},
  {reviewUncertaintyPreserved:false},{continuityVerifierCompositionFixed:false},
  {clinicalApprovalClaimed:true},{nhsAccessClaimed:true},{actualSupplyClaimed:true},
  {genericAdoptionAllowed:true},{deploymentAuthorityBroadened:true},
  {rollbackAuthorityBroadened:true},{existingGatesWeakened:true}
 ])assert.throws(()=>verifyMedicinesWatchSpecialistEvidence({...receipt(),...patch},options()));
 const o=options();o.diff=()=>['unapproved.js'];
 assert.throws(()=>verifyMedicinesWatchSpecialistEvidence(receipt(),o));
});
test('every reviewed source and receipt byte is immutable',()=>{
 for(const path of [...paths,...maintenance]){
  const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';
  assert.throws(()=>verifyMedicinesWatchSpecialistEvidence(receipt(),o),/drift/);
 }
});
test('real composition preserves both the Watch evidence and Continuity repair',()=>{
 const c=verifyReconciledRelease();
 assert.equal(c.medicinesWatchSpecialistEvidence.source,source);
 assert.equal(c.continuityPreservationRepair.source,'7ad0c34d2551a609b959f2b350f1bde1e8313f10');
 const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
 for(const path of [...paths,...maintenance])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/drift/);
});
