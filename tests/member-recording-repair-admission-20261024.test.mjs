import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyMemberRecordingRepair,validateRecordingRepairReceipt,RECORDING_REPAIR_RECEIPT,RECORDING_REPAIR_BLOBS} from '../release/member-recording-repair-20261024.mjs';
const receipt=()=>JSON.parse(readFileSync(RECORDING_REPAIR_RECEIPT,'utf8'));
test('exact native repair and its registration have no unrelated source tail',()=>{const proof=verifyMemberRecordingRepair();assert.equal(proof.paths.length,20);assert.deepEqual(proof.receipt.payloadBlobs,RECORDING_REPAIR_BLOBS);});
test('authority cannot be expanded to messages, real deletion, Health reads or a new Apple submission',()=>{for(const key of ['messaging','realAccountDeletionTest','personalHealthRead','newAppleSubmission','homepage']){const r=receipt();r.authority[key]=true;assert.throws(()=>validateRecordingRepairReceipt(r));}});
test('all runtime and acceptance-test pins reject drift',()=>{for(const key of Object.keys(RECORDING_REPAIR_BLOBS)){const r=receipt();r.payloadBlobs[key]='0'.repeat(40);assert.throws(()=>validateRecordingRepairReceipt(r));}});
test('forged source, provenance and extra receipt fields are rejected',()=>{for(const patch of [{base:'0'.repeat(40)},{payload:'0'.repeat(40)},{registrationSource:'unverified'},{ignoreOldGuards:true}])assert.throws(()=>validateRecordingRepairReceipt({...receipt(),...patch}));const r=receipt();r.registrationSource='a'.repeat(40);assert.throws(()=>verifyMemberRecordingRepair(r),/Native repair receipt/);});
