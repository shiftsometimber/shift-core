import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
assert(account&&token);
const api=async path=>{const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(45000)});const j=await r.json();assert(r.ok&&j.success);return j.result;};
const d=await api('/workers/scripts/shift-core/deployments');
const active=(d.deployments??d).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
assert(active.id&&active.versions.length===1&&active.versions[0].percentage===100);
const v=await api('/workers/workers/shift-core/versions/'+active.versions[0].version_id+'?include=modules');
assert(v.modules?.length&&v.main_module);
const sha=b=>createHash('sha256').update(b).digest('hex');
const inventory={at:new Date().toISOString(),deploymentId:active.id,versionId:active.versions[0].version_id,main:v.main_module,modules:v.modules.map(m=>({name:m.name,type:m.content_type,bytes:Buffer.from(m.content_base64,'base64').length,sha256:sha(Buffer.from(m.content_base64,'base64'))}))};
const dir='nhs-nonclinical-cms-proof';mkdirSync(dir,{recursive:true});
writeFileSync(dir+'/serving-inventory.json',JSON.stringify(inventory,null,2));
// Code only; omit provider settings, binding values and credentials.
writeFileSync(dir+'/serving-modules.json',JSON.stringify({main_module:v.main_module,modules:v.modules},null,2));
console.log('SERVING_INVENTORY '+JSON.stringify(inventory));
for(const m of v.modules){const s=Buffer.from(m.content_base64,'base64').toString('utf8');const at=s.indexOf('async function babyLoveRoutes(');if(at>=0)console.log('WEBHOOK_LOCATION '+JSON.stringify({module:m.name,source:s.slice(Math.max(0,at-500),at+6500)}));}
