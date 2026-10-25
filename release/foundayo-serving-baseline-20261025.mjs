import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstatSync,readFileSync} from 'node:fs';
// Captured from the provider's SPECIFIC version endpoint and independently
// rebuilt byte-for-byte from the original owner hotfix with Wrangler4.146.0.
// This owner deployment is never described as a successful CI promotion.
export const FOUNDAYO_RUNTIME=Object.freeze({
 kind:'exact_owner_foundayo_serving_baseline_20261018',
 deployment:'486b4ea3-4fe5-4e79-9792-c67bac1155fe',
 version:'ac4e60d9-6f40-4bd5-a96f-83d6108dd716',
 deploymentCreatedOn:'2026-10-18T21:25:05.784417Z',
 createdOn:'2026-10-18T21:25:01.963465Z',
 etag:'f5bb76b149f326b66a9bb6465d71f18642e3959e32caf0f47718360d63ce4f02',
 source:'7c174e982f0549fad5cf526bfe3c64f9fcfe950d',
 tree:'052ac7a1bb8f943f20a27e0c821db957e18b4ea1',
 base:'0e4a765e7a360d705e2424264e0bcfcc1d6652be',
 module:'worker.js',bytes:32232540,
 sha256:'a3a1ba0bff57832793bb4d23efaa991da2ccdb34e496de79dc7e5469863df550',
 tag:'seo-foundayo-20261018',
 message:'SEO Foundayo redirect hotfix 7c174e982f0549fad5cf526bfe3c64f9fcfe950d; exact live base 0e4a765e7a360d705e2424264e0bcfcc1d6652be'
});
const p=FOUNDAYO_RUNTIME,account='9e5386dcf455be34c582d93f8bfc79e6';
const identity=d=>({id:d?.id,versions:d?.versions});
export function assertFoundayoIdentity(active){
 assert.equal(active?.id,p.deployment,'Unknown owner hotfix deployment');
 assert.deepEqual(active.versions,[{version_id:p.version,percentage:100}],'Owner hotfix moved or split');
 assert.equal(active.created_on,p.deploymentCreatedOn);
 assert.equal(active.source,'wrangler');assert.equal(active.strategy,'percentage');
 assert.equal(active.annotations?.['workers/message'],p.message);
 assert.equal(active.annotations?.['workers/triggered_by'],'deployment');
}
export function foundayoServingProof(){
 return {kind:p.kind,deployment:p.deployment,version:p.version,source:p.source,
  reconstruction:p.source,tree:p.tree,base:p.base,module:p.module,bytes:p.bytes,
  sha256:p.sha256,etag:p.etag,specificVersionAuthenticated:true,
  successfulCIPromotion:false,dataChanged:false,customerRecordsRead:0};
}
export function assertFoundayoProviderEvidence(active,version,modules){
 assertFoundayoIdentity(active);
 assert.equal(version?.id,p.version);assert.equal(version.metadata?.created_on,p.createdOn);
 assert.equal(version.metadata?.source,'wrangler');
 assert.equal(version.annotations?.['workers/tag'],p.tag);
 assert.equal(version.annotations?.['workers/message'],p.message);
 assert.equal(version.annotations?.['workers/triggered_by'],'version_upload');
 assert.equal(version.resources?.script?.etag,p.etag);
 assert.deepEqual(modules,[{module:p.module,bytes:p.bytes,sha256:p.sha256}],
  'Specific serving owner hotfix module differs from independently rebuilt original');
 return foundayoServingProof();
}
export function assertFoundayoSource(){
 const git=(...a)=>execFileSync('/usr/bin/git',['--no-replace-objects',...a],{encoding:'utf8',maxBuffer:4194304}).trim();
 assert.equal(git('status','--porcelain=v1','--untracked-files=no'),'','Source changed during owner baseline verification');
 assert.equal(git('rev-parse',p.source+'^{tree}'),p.tree);
 assert.equal(git('rev-parse',p.source+'^'),p.base);
 assert.deepEqual(git('diff','--no-renames','--name-only',p.base,p.source).split('\n'),
  ['public-https-redirect.mjs','public-https-redirect.test.mjs']);
 git('merge-base','--is-ancestor',p.base,'HEAD');
 for(const path of ['public-https-redirect.mjs','public-https-redirect.test.mjs']){
  const pin=git('rev-parse',p.source+':'+path);
  assert.equal(git('rev-parse','HEAD:'+path),pin,'Current candidate must preserve the exact serving redirect hotfix');
  const stat=lstatSync(path);assert(stat.isFile()&&!stat.isSymbolicLink(),'Regular hotfix source required');
  const bytes=readFileSync(path);
  assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),pin,'Actual serving hotfix source changed');
 }
 return {source:p.source,tree:p.tree,base:p.base};
}
export function assertFoundayoStartingPoint(record,active){
 assertFoundayoIdentity(active);
 assert.equal(record?.decision,'retain');assert.equal(record.from,p.version);assert.equal(record.to,p.version);
 for(const key of ['run','verifiedRun','ownedProof'])assert.equal(record[key],null,'Owner deployment must not fabricate CI ownership');
 assert.equal(record.dataChanged,false);assert.equal(record.customerRecordsRead,0);
 for(const key of ['technicalRecovery','unattributedRuntimeRecovery','laterUnattributedRuntimeRecovery','verifiedOwnedRollbackProof'])
  assert.equal(record[key],undefined,'Conflicting owner baseline recovery proof');
 assert.deepEqual(record.ownerCapturedProof,foundayoServingProof());
 return {kind:p.kind,source:p.source,run:null,version:p.version,reconstruction:p.source,deployment:p.deployment};
}
export async function verifyFoundayoRuntime(active,observedVersion,{
 token=process.env.CLOUDFLARE_API_TOKEN,fetcher=fetch,sourceCheck=assertFoundayoSource
}={}){
 assertFoundayoIdentity(active);assert(typeof token==='string'&&token.trim(),'Provider read access required');
 assert.deepEqual(sourceCheck(),{source:p.source,tree:p.tree,base:p.base});
 const api='https://api.cloudflare.com/client/v4/accounts/'+account;
 const get=async path=>{
  const r=await fetcher(api+path,{method:'GET',redirect:'error',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(60000)});
  assert(r.ok,'Specific owner baseline provider read failed');
  const data=await r.json();assert.equal(data.success,true);return data.result;
 };
 const version=await get('/workers/scripts/shift-core/versions/'+p.version);
 assert.deepEqual({id:observedVersion.id,metadata:observedVersion.metadata,annotations:observedVersion.annotations,etag:observedVersion.resources?.script?.etag},
  {id:version.id,metadata:version.metadata,annotations:version.annotations,etag:version.resources?.script?.etag},
  'Wrangler and fresh specific provider version disagree');
 const specific=await get('/workers/workers/shift-core/versions/'+p.version+'?include=modules');
 assert.equal(specific?.id,p.version,'Provider returned another specific version');
 assert(Array.isArray(specific.modules)&&specific.modules.length===1,'Exact original module inventory required');
 const modules=specific.modules.map(f=>{
  assert.equal(f.name,p.module);assert.equal(typeof f.content_base64,'string');
  const bytes=Buffer.from(f.content_base64,'base64');
  return {module:f.name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
 });
 const proof=assertFoundayoProviderEvidence(active,version,modules);
 const inventory=await get('/workers/scripts/shift-core/deployments');
 assert(Array.isArray(inventory.deployments)&&inventory.deployments.length);
 const after=inventory.deployments.toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
 assertFoundayoIdentity(after);assert.deepEqual(identity(after),identity(active),'Runtime moved during owner baseline verification');
 assert.deepEqual(sourceCheck(),{source:p.source,tree:p.tree,base:p.base});
 return proof;
}
