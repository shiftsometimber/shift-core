import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync,gzipSync} from 'node:zlib';
assert.equal(process.env.GITHUB_ACTIONS,'true');
assert.equal(process.env.GITHUB_ACTOR_ID,'315011648');
const dir='platform-content-inventory';mkdirSync(dir,{recursive:true});
const account=process.env.CLOUDFLARE_ACCOUNT_ID;
const get=async path=>{const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(25000)});const j=await r.json();assert(r.ok&&j.success,'Read-only platform inventory failed: '+path+' HTTP'+r.status);return j.result;};
const p=await get('/pages/projects/projectshift'),d=p.canonical_deployment;
assert.equal(p.name,'projectshift');assert.equal(p.production_branch,'main');assert(d?.id);
const r=await fetch(d.url+'/DEPLOYMENT-FINGERPRINT.json',{signal:AbortSignal.timeout(25000)});assert(r.ok);const fingerprintBytes=Buffer.from(await r.arrayBuffer()),fingerprint=JSON.parse(fingerprintBytes);
writeFileSync(dir+'/pages-fingerprint.json',JSON.stringify(fingerprint,null,2));
const provenance={at:new Date().toISOString(),project:p.name,productionBranch:p.production_branch,deployment:{id:d.id,url:d.url,createdOn:d.created_on,commit:d.deployment_trigger?.metadata?.commit_hash,branch:d.deployment_trigger?.metadata?.branch},fingerprint:fingerprint.aggregate_sha256,fileCount:fingerprint.file_count,productionWrites:0};
writeFileSync(dir+'/pages-provenance.json',JSON.stringify(provenance,null,2));console.log(JSON.stringify(provenance));
assert.equal(provenance.deployment.commit,'9bdcc2f7f69dc7950b90011f47e83a34fd5a64a1','Pages source moved; stop');
assert.equal(fingerprint.aggregate_sha256,'af8e6d6669898ee32d060b4435dbb03c282ce6e3c41fb0e2e4ab3c52ecf2f4dd');
const old=JSON.parse(gunzipSync(readFileSync('pages-authority/release/public-pages-20260911/source.json.gz'))),overrides={},binary_overrides={};
const hash=b=>createHash('sha256').update(b).digest('hex');
const textPath=n=>/\.(html|css|js|mjs|cjs|json|txt|xml|webmanifest|py|md|yml|yaml|toml|jsonc)$/.test(n)||['_headers','_redirects'].includes(n);
const pending=[...fingerprint.files];
await Promise.all(Array.from({length:6},async()=>{while(pending.length){const e=pending.shift();let b;
 if(old.overrides[e.path]!==undefined){const cached=Buffer.from(old.overrides[e.path]);if(hash(cached)===e.sha256&&cached.length===e.bytes)b=cached;}
 if(!b&&old.binary_overrides?.[e.path]){const cached=Buffer.from(old.binary_overrides[e.path],'base64');if(hash(cached)===e.sha256&&cached.length===e.bytes)b=cached;}
 if(!b&&textPath(e.path)){const f=await fetch(d.url+'/'+e.path,{signal:AbortSignal.timeout(35000)});assert(f.ok,'Exact source unavailable: '+e.path);b=Buffer.from(await f.arrayBuffer());}
 if(!b)continue;
 assert.equal(hash(b),e.sha256,'Source hash mismatch: '+e.path);assert.equal(b.length,e.bytes);
 if(textPath(e.path))overrides[e.path]=b.toString('utf8');else binary_overrides[e.path]=b.toString('base64');
}}));
overrides['DEPLOYMENT-FINGERPRINT.json']=fingerprintBytes.toString('utf8');
const files=[...fingerprint.files,{path:'DEPLOYMENT-FINGERPRINT.json',sha256:hash(fingerprintBytes),bytes:fingerprintBytes.length}].sort((a,b)=>a.path.localeCompare(b.path,'en'));
writeFileSync(dir+'/pages-source.json.gz',gzipSync(Buffer.from(JSON.stringify({source_fingerprint:fingerprint.aggregate_sha256,baseline_fingerprint:fingerprint.aggregate_sha256,files,overrides,binary_overrides})),{mtime:0}));
console.log(JSON.stringify({exactTextSources:Object.keys(overrides).length,exactBinarySources:Object.keys(binary_overrides).length,trackedFiles:files.length,productionWrites:0}));
const databases=await get('/d1/database');
const allowed=new Set(['shift-core-db','shift-evidence-desk-r12-nonprod-db','shift-stabilisation-preview-auth-20260917']);
writeFileSync(dir+'/database-settings.json',JSON.stringify({at:new Date().toISOString(),readOnly:true,contractOrProcessorCertification:false,databases:databases.filter(x=>allowed.has(x.name)).map(x=>({name:x.name,uuid:x.uuid,createdAt:x.created_at,version:x.version,fileSize:x.file_size,jurisdiction:x.jurisdiction??null}))},null,2));
