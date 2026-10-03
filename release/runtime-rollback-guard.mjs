import assert from 'node:assert/strict';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export function latestDeployment(list){
 assert(Array.isArray(list)&&list.length,'Deployment inventory absent');
 const latest=list.toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
 assert(Number.isFinite(Date.parse(latest.created_on)),'Invalid deployment date');
 assert(uuid.test(latest.id),'Deployment ID absent');
 assert.equal(latest.versions?.length,1,'Split deployment needs operator review');
 assert.equal(latest.versions[0].percentage,100,'Split deployment needs operator review');
 assert(uuid.test(latest.versions[0].version_id),'Version ID absent');
 return latest;
}
export function runtimeRollbackDecision({before,active,receipt,source,run}){
 assert.match(source||'',/^[a-f0-9]{40}$/,'Exact release source required');
 assert.match(String(run||''),/^\d+$/,'Release run required');
 assert.equal(receipt?.source,source,'Receipt belongs to a different source');
 assert.equal(String(receipt?.run),String(run),'Receipt belongs to a different run');
 assert.equal(receipt?.kind,'owned_runtime_deployment','Owned deployment receipt required');
 assert(uuid.test(receipt.deploymentId)&&uuid.test(receipt.versionId),'Owned runtime identity absent');
 if(active.versions[0].version_id===before.versions[0].version_id)return{action:'retain',reason:'Captured previous version is already active'};
 assert.equal(active.id,receipt.deploymentId,'Newer deployment exists; refuse stale rollback');
 assert.equal(active.versions[0].version_id,receipt.versionId,'Active runtime is not owned by this release');
 return{action:'restore',versionId:before.versions[0].version_id};
}
