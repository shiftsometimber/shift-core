import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,cpSync,realpathSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const account='https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID;
const scripts=account+'/workers/scripts/shift-core';
const worker=account+'/workers/workers/shift-core';
async function get(url){const r=await fetch(url,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN}});assert(r.ok,'Provider read failed '+new URL(url).pathname+' HTTP '+r.status);return r;}
async function active(){const d=await (await get(scripts+'/deployments')).json();return d.result.deployments.toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];}

const before=await active(),version=before.versions[0].version_id;
assert.deepEqual(before.versions,[{version_id:version,percentage:100}]);

const metadata=await (await get(scripts+'/versions/'+version)).json();
const exact=await (await get(worker+'/versions/'+version+'?include=modules')).json();
assert.equal(exact.result.id,version,'Specific-version API returned the wrong version');
assert(Array.isArray(exact.result.modules)&&exact.result.modules.length>0,'Specific-version API returned no modules');
const modules=exact.result.modules.map(module=>{
  assert.equal(typeof module.name,'string','Version module has no name');
  assert.equal(typeof module.content_base64,'string','Version module has no encoded content');
  const bytes=Buffer.from(module.content_base64,'base64');
  return {module:module.name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
});

assert.deepEqual((await active()).versions,before.versions,'Runtime moved during capture');
console.log(JSON.stringify({kind:'tablet_runtime_attribution',deployment:before.id,version,createdOn:exact.result.created_on,etag:metadata.result.resources.script.etag,modules}));

const candidates=['92a5b8d280b090e609b8f14ed5adf5393bc355f0','793b5135ce7bcdb42d77597b238c769c32a7dc67','3df83d33f1bc26e3119dfeba2cbc54b10cedafdb','0d68bce77505ef4fa77412929ff6d4d2dc0a65e7','59ddd4353fd337631478c3a2704017e1556cf987'];
for(const source of candidates){
  const dir='/tmp/attribution-'+source.slice(0,8);
  execFileSync('git',['worktree','add','--detach',dir,source],{stdio:'pipe',maxBuffer:4*1024*1024});
  cpSync(realpathSync('node_modules'),dir+'/node_modules',{recursive:true,dereference:false});
  execFileSync(process.execPath,[dir+'/node_modules/wrangler/bin/wrangler.js','deploy','--dry-run','--config',dir+'/wrangler.jsonc','--outdir',dir+'/build'],{cwd:dir,stdio:'pipe',maxBuffer:4*1024*1024});
  const bytes=readFileSync(dir+'/build/worker.js');
  const hash=createHash('sha256').update(bytes).digest('hex');
  console.log(JSON.stringify({kind:'tablet_runtime_candidate',source,bytes:bytes.length,sha256:hash,matches:modules.some(m=>m.bytes===bytes.length&&m.sha256===hash)}));
}
console.log('PASS read-only runtime attribution; no deployment or data change');
