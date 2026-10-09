import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,cpSync,realpathSync,mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const api='https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID+'/workers/scripts/shift-core';
async function get(path){const r=await fetch(api+path,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN}});assert(r.ok,'Provider read failed '+path+' HTTP '+r.status);return r;}
async function active(){const d=await (await get('/deployments')).json();return d.result.deployments.toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];}
const before=await active(),version=before.versions[0].version_id;
assert.deepEqual(before.versions,[{version_id:version,percentage:100}]);
const versions=await (await get('/versions')).json();const timeline=versions.result.items||versions.result;
assert.equal(timeline.toSorted((a,b)=>Date.parse(b.metadata.created_on)-Date.parse(a.metadata.created_on))[0].id,version,'Content endpoint cannot identify an older serving version');
const metadata=await (await get('/versions/'+version)).json();
const r=await get('/content/v2');const form=await r.formData();const modules=[];for(const [name,file]of form)if(typeof file!=='string'){const bytes=Buffer.from(await file.arrayBuffer());modules.push({module:name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
assert.deepEqual((await active()).versions,before.versions,'Runtime moved during capture');
console.log(JSON.stringify({kind:'tablet_runtime_attribution',deployment:before.id,version,createdOn:metadata.result.metadata.created_on,etag:metadata.result.resources.script.etag,modules}));
const candidates=['92a5b8d280b090e609b8f14ed5adf5393bc355f0','793b5135ce7bcdb42d77597b238c769c32a7dc67','3df83d33f1bc26e3119dfeba2cbc54b10cedafdb','0d68bce77505ef4fa77412929ff6d4d2dc0a65e7'];
for(const source of candidates){const dir='/tmp/attribution-'+source.slice(0,8);execFileSync('git',['worktree','add','--detach',dir,source],{stdio:'pipe',maxBuffer:4*1024*1024});cpSync(realpathSync('node_modules'),dir+'/node_modules',{recursive:true,dereference:false});execFileSync(process.execPath,[dir+'/node_modules/wrangler/bin/wrangler.js','deploy','--dry-run','--config',dir+'/wrangler.jsonc','--outdir',dir+'/build'],{cwd:dir,stdio:'pipe',maxBuffer:4*1024*1024});const bytes=readFileSync(dir+'/build/worker.js');const hash=createHash('sha256').update(bytes).digest('hex');console.log(JSON.stringify({kind:'tablet_runtime_candidate',source,bytes:bytes.length,sha256:hash,matches:modules.some(m=>m.bytes===bytes.length&&m.sha256===hash)}));}
console.log('PASS read-only runtime attribution; no deployment or data change');
