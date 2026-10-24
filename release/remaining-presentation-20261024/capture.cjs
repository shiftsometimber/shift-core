const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const c=require('/Users/shiftsometimberltd/SST/shift-bloods-blog-review-v1-20261018/release/approved-bloods-blogs-20261019/common.cjs');
const root='/Users/shiftsometimberltd/SST/website-review-evidence-20261023/remaining-presentation-20261024',a='/accounts/9e5386dcf455be34c582d93f8bfc79e6';
fs.mkdirSync(root,{recursive:true});
(async()=>{
 const token=fs.readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8').match(/^oauth_token\s*=\s*"([^"]+)"/m)[1];
 for(const name of ['shift-bloods-public','shift-timber-mill-presentation-20261021']){
  const d=path.join(root,name);fs.mkdirSync(d,{recursive:true});assert(!fs.existsSync(d+'/before.json'),'Already captured; reconcile');
  const r=await fetch('https://api.cloudflare.com/client/v4'+a+'/workers/scripts/'+name,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});assert.equal(r.status,200);
  const main=r.headers.get('cf-entrypoint');const parts=await r.formData(),modules=[];
  for(const [key,value]of parts.entries()){
   if(key==='metadata'){fs.writeFileSync(d+'/metadata-private.json',String(value));continue;}
   const bytes=typeof value==='string'?Buffer.from(value):Buffer.from(await value.arrayBuffer());const file=path.join(d,key);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);modules.push({name:key,type:typeof value==='string'?'application/javascript+module':value.type,sha:c.sha(bytes),bytes:bytes.length});
  }
  const settings=await c.organicApi(a+'/workers/scripts/'+name+'/settings'),dep=(await c.organicApi(a+'/workers/scripts/'+name+'/deployments')).deployments[0];
  fs.writeFileSync(d+'/before.json',JSON.stringify({name,main,modules,settings,deployment:dep},null,2));
  console.log(JSON.stringify({name,main,modules,version:dep.versions}));
 }
 const p=await c.organicApi(c.pages);console.log('Pages '+p.canonical_deployment.id);
 const old=await c.get('https://shiftsometimber.co.uk/consent-v4a.js');fs.writeFileSync(root+'/consent-v4a.js',old.bytes);console.log('consent bytes '+old.bytes.length);
})();
