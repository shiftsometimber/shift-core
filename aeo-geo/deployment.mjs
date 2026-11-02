import assert from 'node:assert/strict';
export function activeDeployment(deployment){
 const all=deployment?.versions;assert(Array.isArray(all)&&all.length,'Missing serving versions');
 assert(all.every(v=>v.percentage===0||v.percentage===100),'A genuine traffic split requires separate qualification');
 const active=all.filter(v=>v.percentage>0);assert.equal(active.length,1,'Exactly one effective live version required');assert.equal(active[0].percentage,100);
 return {...deployment,versions:active,providerVersions:all};
}
export function replaceActiveTraffic(before,versionId){
 const normal=activeDeployment({...before,versions:before.providerVersions||before.versions});
 return normal.providerVersions.map(v=>v.percentage===100?{version_id:versionId,percentage:100}:{version_id:v.version_id,percentage:0});
}
