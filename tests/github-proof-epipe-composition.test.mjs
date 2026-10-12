import test from 'node:test';
import assert from 'node:assert/strict';
import {
 GITHUB_PROOF_EPIPE_SOURCE,
 GITHUB_PROOF_EPIPE_PATHS,
 GITHUB_PROOF_EPIPE_MAINTENANCE,
 verifyReconciledRelease,
 reconciliationChangedPath
} from '../release/approved-runtime-composition.mjs';

test('broken-pipe proof retry is finite, immutable and retains fail-closed evidence checks',()=>{
 const receipt=verifyReconciledRelease().githubProofEpipeRetry;
 assert.equal(receipt.source,GITHUB_PROOF_EPIPE_SOURCE);
 assert.deepEqual(receipt.paths,GITHUB_PROOF_EPIPE_PATHS);
 assert.deepEqual(receipt.maintenancePaths,GITHUB_PROOF_EPIPE_MAINTENANCE);
 assert.equal(receipt.observedCode,'EPIPE');
 assert.equal(receipt.deploymentAttempted,false);
 for(const flag of ['runtimeChanged','publicCopyChanged','workflowChanged','approvalAssertionsChanged','httpErrorsRetried','malformedEvidenceAccepted','customerDataChanged','externalCommunicationsSent','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'])assert.equal(receipt[flag],false);
 for(const path of GITHUB_PROOF_EPIPE_PATHS){assert.equal(reconciliationChangedPath('M',path),true);for(const status of ['D','R','T','C'])assert.throws(()=>reconciliationChangedPath(status,path),/Unexpected/);}
 for(const path of GITHUB_PROOF_EPIPE_MAINTENANCE){assert.equal(reconciliationChangedPath('A',path),true);assert.throws(()=>reconciliationChangedPath('M',path),/Unexpected/);for(const status of ['D','R','T','C'])assert.throws(()=>reconciliationChangedPath(status,path),/Unexpected/);}
});
