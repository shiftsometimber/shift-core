import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
export const FOUNDAYO_RUNTIME=Object.freeze({
 kind:'exact-owner-authorised-foundayo-runtime-20261018',
 source:'7c174e982f0549fad5cf526bfe3c64f9fcfe950d',tree:'052ac7a1bb8f943f20a27e0c821db957e18b4ea1',
 deployment:'486b4ea3-4fe5-4e79-9792-c67bac1155fe',version:'ac4e60d9-6f40-4bd5-a96f-83d6108dd716',
 createdOn:'2026-10-18T21:25:01.963465Z',etag:'f5bb76b149f326b66a9bb6465d71f18642e3959e32caf0f47718360d63ce4f02',
 module:'worker.js',bytes:32232540,sha256:'a3a1ba0bff57832793bb4d23efaa991da2ccdb34e496de79dc7e5469863df550',
 bindingsSHA256:'574ec3ce9996d4aa12611a204d124f001031df09e15ae7996d32a8ac2e0e544c',
 message:'SEO Foundayo redirect hotfix 7c174e982f0549fad5cf526bfe3c64f9fcfe950d; exact live base 0e4a765e7a360d705e2424264e0bcfcc1d6652be'
});
const p=FOUNDAYO_RUNTIME,sha=x=>createHash('sha256').update(x).digest('hex');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
export function assertFoundayoIdentity(active){
 assert.equal(active?.id,p.deployment,'Unknown Foundayo deployment');
 assert.deepEqual(active.versions,[{version_id:p.version,percentage:100}],'Foundayo version moved or traffic split');
}
export function assertFoundayoEvidence(active,version,module){
 assertFoundayoIdentity(active);assert.equal(version?.id,p.version);assert.equal(version.metadata?.created_on,p.createdOn);
 assert.equal(version.metadata?.source,'wrangler');assert.equal(version.resources?.script?.etag,p.etag);
 assert.equal(version.annotations?.['workers/message'],p.message);
 assert.equal(sha(JSON.stringify(canonical([...version.resources.bindings].sort((a,b)=>a.name.localeCompare(b.name))))),p.bindingsSHA256,'Foundayo binding metadata changed');
 assert.deepEqual(module,{name:p.module,bytes:p.bytes,sha256:p.sha256},'Exact serving Foundayo module required');
 return {kind:p.kind,deployment:p.deployment,version:p.version,source:p.source,tree:p.tree,module:p.module,bytes:p.bytes,sha256:p.sha256,etag:p.etag,bindingsSHA256:p.bindingsSHA256,manualOwnerRelease:true,hostedDeploymentClaimed:false};
}
export function foundayoStartingPoint(proof,active){
 assertFoundayoIdentity(active);assert.deepEqual(proof.identity,{kind:p.kind,deployment:p.deployment,version:p.version,source:p.source,tree:p.tree,module:p.module,bytes:p.bytes,sha256:p.sha256,etag:p.etag,bindingsSHA256:p.bindingsSHA256,manualOwnerRelease:true,hostedDeploymentClaimed:false});
 assert.equal(proof.productionWrites,0);assert.equal(proof.dataRestored,false);assert.equal(proof.customerRecordsRead,0);
 return {kind:p.kind,source:null,run:null,version:p.version,reconstruction:p.source,deployment:p.deployment};
}
export function assertSameFoundayoWindow(previous,current){
 const strip=x=>{const {checkedAt,...rest}=x;return rest;};assert.deepEqual(strip(current),strip(previous),'Foundayo baseline or protected release window changed');assert(Date.parse(current.checkedAt)>=Date.parse(previous.checkedAt));
}
export async function verifyFoundayoRuntimeWindow({wrangler,proof,stage,token=process.env.CLOUDFLARE_API_TOKEN,fetcher=fetch,now=()=>new Date().toISOString()}){
 assert(['recovery','adoption'].includes(stage));assert.equal(typeof token,'string');assert(token.trim(),'Existing provider read access required');
 const latest=()=>JSON.parse(wrangler('deployments','list','--json')).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
 const active=latest();assertFoundayoIdentity(active);const version=JSON.parse(wrangler('versions','view',p.version,'--json'));
 const original=await proof.get('/git/commits/'+p.source);assert.equal(original.sha,p.source);assert.equal(original.tree?.sha,p.tree,'Original approved hotfix source changed');
 const response=await fetcher('https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/workers/shift-core/versions/'+p.version+'?include=modules',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(45000)});
 assert(response.ok,'Exact serving-version code unavailable');const body=await response.json();assert.equal(body.success,true);assert.equal(body.result?.id,p.version,'Latest upload cannot be attributed to serving traffic');
 const modules=body.result.modules?.filter(m=>/\.(?:mjs|js)$/.test(m.name));assert.equal(modules?.length,1);assert.equal(modules[0].name,p.module);assert.equal(typeof modules[0].content_base64,'string');const bytes=Buffer.from(modules[0].content_base64,'base64');
 const identity=assertFoundayoEvidence(active,version,{name:modules[0].name,bytes:bytes.length,sha256:sha(bytes)});
 const beforeBytes=readFileSync('b1-runtime-release/before.json'),before=JSON.parse(beforeBytes);assert.equal(before.release,process.env.GITHUB_SHA,'Current release stock capture required');assert.equal(before.customerRecordsRead,false);assert.equal(before.productionWrites,0);
 const checkedAt=now(),age=Date.parse(checkedAt)-Date.parse(before.checkedAt);assert(age>=0&&age<=300000,'Fresh protected stock window required');
 const tables={};for(const table of ['medicine_products','medicine_variants','medicine_inventory']){
  const rows=JSON.parse(wrangler('d1','execute','DB','--remote','--json','--command','SELECT * FROM '+table+' ORDER BY '+(table==='medicine_inventory'?'variant_id':'id')));assert(rows.length&&rows.every(r=>r.success),'Original protected stock query required');const values=rows.flatMap(r=>r.results||[]);tables[table]={rows:values.length,sha256:sha(JSON.stringify(values))};
 }
 assert.deepEqual(tables,before.tables,'Protected stock changed');const configSHA256=sha(readFileSync('wrangler.jsonc'));assert.equal(configSHA256,before.configurationSha256,'Current provider configuration changed');
 const after=latest();assert.deepEqual(after,active,'Runtime moved during exact baseline qualification');
 return {identity,checkedAt,release:process.env.GITHUB_SHA,releaseStockWindow:{beforeSHA256:sha(beforeBytes),beforeAt:before.checkedAt,tables,configurationSHA256:configSHA256},productionWrites:0,dataRestored:false,customerRecordsRead:0};
}
