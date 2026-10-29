import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const out='prescription-release-evidence';mkdirSync(out,{recursive:true});
const base='https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/shift-core';
const headers={Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN};assert(process.env.CLOUDFLARE_API_TOKEN);
const get=async path=>{const r=await fetch(base+path,{headers,signal:AbortSignal.timeout(30000)});assert(r.ok,'Provider read failed: '+r.status);const j=await r.json();assert(j.success);return j.result;};
const deployment=(await get('/deployments')).deployments[0];assert.equal(deployment.versions.length,1);assert.equal(deployment.versions[0].percentage,100);
const active=deployment.versions[0].version_id,version=await get('/versions/'+active),latest=(await get('/versions')).items[0];
assert.equal(latest.id,active,'Latest uploaded content is not the serving version; do not attribute it to live traffic');
const response=await fetch(base+'/content/v2',{headers,signal:AbortSignal.timeout(30000)});assert(response.ok);
const form=await response.formData();const modules=[];
for(const [name,value]of form){if(typeof value==='string')continue;assert(!name.includes('..')&&!name.startsWith('/'));const data=Buffer.from(await value.arrayBuffer());const filename='capture-'+modules.length+'.bin';writeFileSync(out+'/'+filename,data);modules.push({name,type:value.type,filename,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}
assert.equal((await get('/versions')).items[0].id,active);assert.equal((await get('/deployments')).deployments[0].id,deployment.id);
const settings=await get('/script-settings');
writeFileSync(out+'/snapshot.json',JSON.stringify({source:process.env.GITHUB_SHA,deployment,version,settings,modules,entry:response.headers.get('cf-entrypoint'),capturedAt:new Date().toISOString()},null,2));
console.log(JSON.stringify({source:process.env.GITHUB_SHA,deployment:deployment.id,active,entry:response.headers.get('cf-entrypoint'),modules,bindingNames:version.resources.bindings.map(x=>({name:x.name,type:x.type})),runtime:version.resources.script_runtime}));
