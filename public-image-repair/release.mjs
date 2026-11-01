import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import manifest from './manifest.json' with {type:'json'};
import {repairPackage,verifyPackage,hash,snapshotDocument,SECURITY_HEADERS} from './package.mjs';

const directory='public-image-repair-proof', script='shift-core';
mkdirSync(directory,{recursive:true});
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
assert.equal(account,'9e5386dcf455be34c582d93f8bfc79e6');assert(token,'Existing deployment credential required');
const apiRoot='https://api.cloudflare.com/client/v4/accounts/'+account;
async function api(path,init={}) {
  const response=await fetch(apiRoot+path,{...init,headers:{Authorization:'Bearer '+token,...init.headers},signal:AbortSignal.timeout(60000)});
  const data=await response.json();assert(response.ok&&data.success,'Cloudflare operation failed: '+JSON.stringify(data.errors));return data.result;
}
const latest=async()=>{
  const {deployments}=await api('/workers/scripts/'+script+'/deployments');
  const current=deployments.toSorted((a,b)=>b.created_on.localeCompare(a.created_on))[0];
  assert.equal(current.versions.length,1);assert.equal(current.versions[0].percentage,100);return current;
};
const version=id=>api('/workers/workers/'+script+'/versions/'+id+'?include=modules');
const save=(name,value)=>writeFileSync(directory+'/'+name,JSON.stringify(value,null,2));
const clean=html=>html.replace(/<script\b[^>]*\bsrc=["']https:\/\/static.cloudflareinsights.com[^"']*["'][\s\S]*?<\/script>/gi,'').replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi,'');
const protectedPaths=[...manifest.pages.map(p=>p.page),'/','/about','/member-login','/knowledge','/articles/glp-1-weight-regain'];
async function documents(){
  const pages={};
  for(const path of protectedPaths){
    const r=await fetch('https://shiftsometimber.co.uk'+path,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});
    assert.equal(r.status,200,path);const text=clean(await r.text());
    pages[path]=snapshotDocument(r,text);
    if(manifest.pages.some(item=>item.page===path))for(const header of SECURITY_HEADERS)assert(r.headers.get(header),path+' '+header);
  }
  return pages;
}
async function images(after=false){
  const rows=[];
  for(const item of manifest.pages){
    const r=await fetch('https://shiftsometimber.co.uk'+item.image,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});
    assert.equal(r.status,after?200:item.before,item.image);
    const data=Buffer.from(await r.arrayBuffer());
    if(r.status===200){assert.equal(r.headers.get('content-type'),'image/webp');assert.equal(data.length,item.bytes);assert.equal(hash(data),item.sha256);}
    rows.push({path:item.image,status:r.status,bytes:data.length,sha256:hash(data)});
  }
  return rows;
}
function requireCurrentMain(){
  assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);
  execFileSync('git',['fetch','--no-tags','origin','main'],{stdio:'pipe'});
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
  assert.equal(execFileSync('git',['rev-parse','origin/main'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA,'Current main changed; do not deploy a stale candidate');
}
const mode=process.argv[2]||'release';
if(mode==='rollback'){
  const intent=JSON.parse(readFileSync(directory+'/promotion-intent.json'));
  const current=await latest();
  if(current.versions[0].version_id===intent.owned){
    const result=await api('/workers/scripts/'+script+'/deployments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy:'percentage',versions:[{version_id:intent.previous,percentage:100}]})});
    assert.equal((await latest()).versions[0].version_id,intent.previous);save('rollback.json',{restored:intent.previous,failed:intent.owned,deployment:result.id});
  }else save('rollback.json',{skipped:true,reason:'A different owner selected a newer deployment',current:current.id});
}else{
  requireCurrentMain();
  const before=await latest();assert.equal(before.id,manifest.baselineDeployment,'Serving deployment changed; reconcile before staging');
  assert.equal(before.versions[0].version_id,manifest.baselineVersion);
  const original=await version(manifest.baselineVersion), settings=await api('/workers/scripts/'+script+'/settings');
  save('before.json',{deployment:before,main:original.main_module,modules:original.modules.map(m=>({name:m.name,sha256:hash(Buffer.from(m.content_base64,'base64'))}))});
  save('documents-before.json',await documents());save('images-before.json',await images());
  const planned=repairPackage(original);
  const metadata={main_module:planned.main_module,compatibility_date:settings.compatibility_date,compatibility_flags:settings.compatibility_flags||[],bindings:original.bindings.map(b=>({type:'inherit',name:b.name})),keep_assets:true,annotations:{'workers/message':'Restore only the exact approved CT3 Tools image; retain every serving module'}};
  for(const key of ['placement','limits','observability','logpush'])if(settings[key]!==undefined)metadata[key]=settings[key];
  const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');
  for(const module of planned.modules)form.set(module.name,new Blob([Buffer.from(module.content_base64,'base64')],{type:'application/javascript+module'}),module.name);
  requireCurrentMain();assert.equal((await latest()).id,before.id);
  const uploaded=await api('/workers/scripts/'+script+'/versions?bindings_inheritance=strict',{method:'POST',body:form});
  const staged=await version(uploaded.id);verifyPackage(original,staged,planned);
  save('staged.json',{source:process.env.GITHUB_SHA,version:uploaded.id,unchangedModules:original.modules.length,addedModules:3,bindingsPreserved:true});
  requireCurrentMain();assert.equal((await latest()).id,before.id,'Serving owner moved during staging');
  save('promotion-intent.json',{source:process.env.GITHUB_SHA,previous:manifest.baselineVersion,owned:uploaded.id});
  const promoted=await api('/workers/scripts/'+script+'/deployments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy:'percentage',versions:[{version_id:uploaded.id,percentage:100}]})});
  assert.equal((await latest()).versions[0].version_id,uploaded.id);
  save('deployed.json',{source:process.env.GITHUB_SHA,version:uploaded.id,deployment:promoted.id,previous:manifest.baselineVersion});
  const after=await documents();assert.deepEqual(after,JSON.parse(readFileSync(directory+'/documents-before.json')),'Protected page HTML changed');
  save('documents-after.json',after);save('images-after.json',await images(true));
  for(const host of ['shiftsometimber.co.uk','www.shiftsometimber.co.uk'])for(const suffix of ['','?utm_source=image-repair']){
    const r=await fetch('https://'+host+manifest.pages[0].image+suffix,{method:'HEAD',signal:AbortSignal.timeout(30000)});assert.equal(r.status,200);assert.equal((await r.arrayBuffer()).byteLength,0);assert.equal(r.headers.get('content-type'),'image/webp');
  }
  console.log(JSON.stringify({deployed:true,version:uploaded.id,images:8,documentsUnchanged:protectedPaths.length,renderedVerification:'pending'}));
}
