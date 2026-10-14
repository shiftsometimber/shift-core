import checker from '../scripts/verify-tool-page-schema.cjs';
import assert from 'node:assert/strict';
import {PHOTO_CANCELLED,completeExactPhotoCancelledStock} from './photo-cancelled-stock-completion-20261014.mjs';
export const PHOTO_STARTING_KIND='one_exact_cancelled_photo_baseline_completed_stock_20261014';
export function assertExactPhotoStartingRecord(record,active){
 const p=PHOTO_CANCELLED,r=record?.ownedProof;
 assert.equal(active.id,p.deployment);assert.deepEqual(active.versions,[{version_id:p.version,percentage:100}]);
 assert.equal(record.decision,'retain');assert.equal(record.from,p.version);assert.equal(record.to,p.version);assert.equal(record.verifiedRun,p.run);assert.equal(record.dataChanged,false);assert.equal(record.customerRecordsRead,0);
 for(const[k,v]of Object.entries({run:p.run,source:p.source,version:p.version,artifact:p.artifact,artifactSHA256:p.artifactSHA256,evidenceKind:'one_exact_cancelled_photo_baseline_with_fresh_original_stock_and_public_predicates',originalRunAccepted:false,originalWorkflowStatus:'cancelled',baselineStockCompleted:true,rollbackPerformed:false,genericAdoptionAllowed:false,customerRecordsRead:0,dataChanged:false}))assert.equal(r?.[k],v,'Exact original fresh baseline completion required: '+k);
 assert.deepEqual(r.stock?.tables,p.tables);assert.equal(r.stock?.configurationSha256,p.configurationSha256);assert.equal(r.stock?.customerRecordsRead,false);assert.equal(r.stock?.productionWrites,0);
 const q=r.publicProof;assert.equal(q?.source,p.source);assert.equal(String(q?.run),String(p.run));assert.equal(q?.status,'passed');assert.equal(q?.toolChecksVerified,true);assert.equal(q?.checks?.length,9);assert(q.checks.every(x=>x.passed===true));assert.deepEqual(q.checks.map(x=>x.path).sort(),[...checker.paths].sort(),'All original nine public destinations required');
 for(const v of [q.deployed,q.afterChecks])assert.deepEqual(v,{deploymentId:p.deployment,versionId:p.version,percentage:100});
 assert.deepEqual(q.expected,{deploymentId:p.deployment,versionId:p.version});
 assert.equal(record.ownerCapturedProof,undefined);return true;
}
export async function exactPhotoStartingPoint(record,active,version,get,getLogs,getArtifact,inventory,freshSnapshot){
 assertExactPhotoStartingRecord(record,active);
 const proof=await completeExactPhotoCancelledStock(active,version,get,getLogs,getArtifact,inventory,freshSnapshot);
 assert.equal(proof.originalRunAccepted,false);assert.equal(proof.baselineStockCompleted,true);
 return{source:PHOTO_CANCELLED.source,version:PHOTO_CANCELLED.version,run:PHOTO_CANCELLED.run,kind:PHOTO_STARTING_KIND,originalRunAccepted:false,reconstruction:proof};
}
