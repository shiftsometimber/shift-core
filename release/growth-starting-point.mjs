import assert from 'node:assert/strict';
import {OWNER_RUNTIME,verifyOwnerRuntime} from './owner-captured-runtime.mjs';
import {SUPPORT_RUNTIME,verifySupportRuntime} from './live-support-runtime.mjs';

// A provider-matched or owner-captured runtime deliberately has no hosted
// deployment run. Verify the exact provider evidence again instead of trying
// to fetch a fabricated GitHub run ID.
export async function verifyCapturedStartingPoint(point,record,active,version,{verifyOwner=verifyOwnerRuntime,verifySupport=verifySupportRuntime}={}){
 assert.equal(point?.run,null,'Hosted releases must use their recorded successful run');
 let proof;
 if(point.kind===SUPPORT_RUNTIME.kind)proof=await verifySupport(active,version);
 else{assert.equal(point.kind,OWNER_RUNTIME.kind,'Unknown captured runtime kind');proof=await verifyOwner(active,version);}
 assert.deepEqual(record?.ownerCapturedProof,proof,'Captured runtime proof changed between recovery and adoption');
 return proof;
}
