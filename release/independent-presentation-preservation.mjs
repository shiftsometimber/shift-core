import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const names=['shift-programme-member-20261023','shift-hq-member-comms-20261023'];
export async function captureIndependentPresentation({accountId,token,fetcher=fetch}={}){
 assert(/^[a-f0-9]{32}$/.test(accountId||''));assert(token);
 const active=async name=>{
  const r=await fetcher('https://api.cloudflare.com/client/v4/accounts/'+accountId+'/workers/scripts/'+name+'/deployments',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(45000)});
  assert(r.ok,'Independent provider read failed');const data=await r.json();assert(data.success);const rows=data.result.deployments;
  assert(Array.isArray(rows)&&rows.length);const current=rows.toSorted((a,b)=>b.created_on.localeCompare(a.created_on))[0];
  assert.match(current.id,/^[a-f0-9-]{36}$/);assert.equal(current.versions.length,1);assert.equal(current.versions[0].percentage,100);
  assert.match(current.versions[0].version_id,/^[a-f0-9-]{36}$/);
  return {deploymentId:current.id,versionId:current.versions[0].version_id};
 };
 const deployments={};for(const name of names)deployments[name]=await active(name);
 const response=await fetcher('https://shiftsometimber.co.uk/assets/my-timber-layout.mjs',{signal:AbortSignal.timeout(45000)});
 assert.equal(response.status,200);assert.match(response.headers.get('content-type')||'',/javascript/);
 const assetSHA256=createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
 for(const name of names)assert.deepEqual(await active(name),deployments[name],'Independent presentation moved during capture');
 return {deployments,assetSHA256};
}
