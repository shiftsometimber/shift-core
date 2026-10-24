const fs=require('fs'),path=require('path'),assert=require('assert/strict'),cp=require('child_process');
const c=require('/Users/shiftsometimberltd/SST/shift-bloods-blog-review-v1-20261018/release/approved-bloods-blogs-20261019/common.cjs');
const r=__dirname,root=path.resolve(r,'../..'),d='/Users/shiftsometimberltd/SST/website-review-evidence-20261023/remaining-presentation-20261024',a='/accounts/9e5386dcf455be34c582d93f8bfc79e6';
const names={bloods:'shift-bloods-public',shop:'shift-timber-mill-presentation-20261021'};
(async()=>{
 const key=process.argv[2],name=names[key];assert(name);
 const read=n=>JSON.parse(fs.readFileSync(d+'/'+n+'.json'));
 assert(!fs.existsSync(d+'/'+key+'-production-deployment.json'),'Already reconciled');
 const intent=read(key+'-production-intent'),upload=read(key+'-production-upload'),before=read(name+'/before');
 const wanted=fs.readFileSync(r+'/'+name+'/main.mjs');
 assert(cp.execFileSync('git',['show',intent.head+':release/remaining-presentation-20261024/'+name+'/main.mjs'],{cwd:root}).equals(wanted));
 const token=fs.readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8').match(/^oauth_token\s*=\s*"([^"]+)"/m)[1];
 const current=(await c.organicApi(a+'/workers/scripts/'+name+'/deployments')).deployments[0];
 assert(Date.parse(current.created_on)>=Date.parse(intent.phase.at),'Current deployment predates our intent');
 assert(current.versions.some(v=>v.percentage===100&&v.version_id.replaceAll('-','')===upload.deployment_id),'Active version does not match our exact uploaded version ID');
 const response=await fetch('https://api.cloudflare.com/client/v4'+a+'/workers/scripts/'+name,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
 assert.equal(response.status,200);assert.equal(response.headers.get('cf-entrypoint'),before.main);
 assert.equal((response.headers.get('etag')||'').replaceAll('"',''),upload.etag,'Downloaded script differs from our exact upload ETag');
 const parts=await response.formData(),actual=[];
 for(const [n,v] of parts.entries()){
  if(n==='metadata')continue;
  const bytes=typeof v==='string'?Buffer.from(v):Buffer.from(await v.arrayBuffer());
  const base=before.modules.find(x=>x.name===n);assert(base,'Unexpected module '+n);
  const expected=n===before.main?wanted:fs.readFileSync(d+'/'+name+'/'+n);
  assert(bytes.equals(expected),'Module bytes differ from exact upload '+n);actual.push({name:n,sha:c.sha(bytes)});
 }
 assert.equal(actual.length,before.modules.length);
 assert.deepEqual((await c.organicApi(a+'/workers/scripts/'+name+'/deployments')).deployments[0],current,'Provider ownership changed during readback');
 const proof={source:intent.head,name,deployment:current,at:new Date().toISOString(),uploadedETag:upload.etag,exactModuleReadback:actual,legacyUploadId:upload.deployment_id,readbackReason:'Legacy upload deployment_id is not the modern deployment UUID. Source authenticated through exact upload ETag, every module byte and stable current deployment before/after readback. No second upload.'};
 fs.writeFileSync(d+'/'+key+'-production-deployment.json',JSON.stringify(proof,null,2));
 console.log(JSON.stringify({pass:true,name,deployment:current.id,versions:current.versions,exactModules:actual.length,noRepeatUpload:true}));
})().catch(e=>{console.error(e.stack);process.exitCode=1});
