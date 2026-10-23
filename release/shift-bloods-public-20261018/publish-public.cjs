const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const ROOT=__dirname,account='9e5386dcf455be34c582d93f8bfc79e6',prefix='/accounts/'+account+'/pages/projects/projectshift';
const GH='/Users/shiftsometimberltd/SST/shift-master-finish-20261013-7KGzrW/github-cli-private-20261013/gh_2.102.0_macOS_arm64/bin/gh';
const blake=require('/Users/shiftsometimberltd/SST/shift-rollout-grub-safety-20261006/node_modules/blake3-wasm');
const token=fs.readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8').match(/^oauth_token\s*=\s*"([^"]+)"/m)[1];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=n=>JSON.parse(fs.readFileSync(path.join(ROOT,n)));
async function api(route,{method='GET',body,auth=token}={}){const r=await fetch('https://api.cloudflare.com/client/v4'+route,{method,headers:{Authorization:'Bearer '+auth,...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000)});const d=await r.json();if(!r.ok||!d.success)throw Error('Provider HTTP '+r.status+' '+JSON.stringify(d.errors));return d.result;}
const safe=d=>({id:d.id,url:d.url,environment:d.environment,created_on:d.created_on,latest_stage:d.latest_stage,deployment_trigger:d.deployment_trigger});
(async()=>{
const mode=process.argv[2];if(!['preview','production','preview-status','production-status'].includes(mode))throw Error('Expected preview or production mode');
if(mode.endsWith('-status')){const kind=mode.split('-')[0],own=read(kind+'-deployment.json'),d=await api(prefix+'/deployments/'+own.id);fs.writeFileSync(path.join(ROOT,kind+'-status.json'),JSON.stringify(safe(d),null,2));console.log(JSON.stringify(safe(d)));return;}
const prep=read('prepared-changes.json'),base=read('origin-manifest.json'),source=read('source-publication.json');
if(!source.remoteVerified)throw Error('Source branch not verified');
if(fs.existsSync(path.join(ROOT,mode+'-deployment.json'))||fs.existsSync(path.join(ROOT,mode+'-intent.json')))throw Error('Prior '+mode+' publication exists: reconcile it instead of submitting again');
if(mode==='production'&&!read('preview-proof.json').pass)throw Error('Visual and functional preview proof is incomplete');
const ref=JSON.parse(execFileSync(GH,['api','repos/shiftsometimber/shift-core/git/ref/heads/'+source.branch],{encoding:'utf8',timeout:45000}));if(ref.object.sha!==source.commit)throw Error('Source branch changed');
const current=await api(prefix);if(current.canonical_deployment.id!==prep.baseDeployment)throw Error('Public source changed; recapture and preserve the current baseline before publishing');
const manifest={...base},available=new Map(),effective=[];
// The Worker adds Bloods discovery routes atomically with routing activation.
// Preserve the existing Pages sitemap until the routing release is serving.
for(const c of prep.changes.filter(c=>c.path!=='/sitemap.xml')){
 const bytes=fs.readFileSync(path.join(ROOT,'after',c.path));if(sha(bytes)!==c.sha256)throw Error('Content drift '+c.path);
 if(base[c.path])throw Error('Bloods release must add new assets only: '+c.path);
 const key=blake.hash(bytes.toString('base64')+path.extname(c.path).slice(1)).toString('hex').slice(0,32);manifest[c.path]=key;available.set(key,{bytes,contentType:c.contentType});effective.push({...c,key});
}
if(effective.length!==15)throw Error('Expected nine information pages and six versioned assets');
if(mode==='preview')for(const [p,file]of [['/bloods-layout-review.html','review/bloods-layout-review.html'],['/shift-health.html','review/shift-health.html']]){const bytes=fs.readFileSync(path.join(ROOT,file)),key=blake.hash(bytes.toString('base64')+'html').toString('hex').slice(0,32);manifest[p]=key;available.set(key,{bytes,contentType:'text/html; charset=utf-8'});}
if(mode==='production')for(const [k,v]of Object.entries(base))if(manifest[k]!==v)throw Error('Retained asset changed '+k);
const headers=fs.readFileSync(path.join(ROOT,'_headers'));if(sha(headers)!==prep.headersSHA256)throw Error('Security headers changed');
const {jwt}=await api(prefix+'/upload-token'),missing=await api('/pages/assets/check-missing',{method:'POST',body:{hashes:Object.values(manifest)},auth:jwt});
for(const hash of missing)if(!available.has(hash))throw Error('A retained asset is missing; no reconstruction is permitted');
if(missing.length)await api('/pages/assets/upload',{method:'POST',body:missing.map(key=>({key,value:available.get(key).bytes.toString('base64'),metadata:{contentType:available.get(key).contentType},base64:true})),auth:jwt});
await api('/pages/assets/upsert-hashes',{method:'POST',body:{hashes:Object.values(manifest)},auth:jwt});
const remaining=await api('/pages/assets/check-missing',{method:'POST',body:{hashes:Object.values(manifest)},auth:jwt});if(remaining.length)throw Error('Upload incomplete');
const again=await api(prefix);if(again.canonical_deployment.id!==prep.baseDeployment)throw Error('Public source changed before publication');
const form=new FormData();form.append('manifest',JSON.stringify(manifest));form.append('branch',mode==='preview'?'bloods-preview-20261018':'main');form.append('commit_hash',source.commit);form.append('commit_message','SHIFT Bloods coming-soon information pages');form.append('commit_dirty','false');
const headerBytes=mode==='preview'?Buffer.concat([headers,Buffer.from('\n/*\n  X-Robots-Tag: noindex, nofollow\n')]):headers;form.append('_headers',new Blob([headerBytes]),'_headers');
fs.writeFileSync(path.join(ROOT,mode+'-manifest.json'),JSON.stringify(manifest));
fs.writeFileSync(path.join(ROOT,mode+'-intent.json'),JSON.stringify({at:new Date().toISOString(),mode,sourceCommit:source.commit,expectedPreviousDeployment:prep.baseDeployment,manifestSHA256:sha(Buffer.from(JSON.stringify(manifest))),newAssets:effective.length,retainedAssets:Object.keys(base).length,homepagePreserved:true,policiesPreserved:true,patientDataForms:false,ordersEnabled:false},null,2));
const d=await api(prefix+'/deployments',{method:'POST',body:form});fs.writeFileSync(path.join(ROOT,mode+'-deployment.json'),JSON.stringify(safe(d),null,2));console.log(JSON.stringify({publication:safe(d),newAssets:effective.length,retainedAssets:Object.keys(base).length,homepagePreserved:true,headersPreserved:true,ordersEnabled:false}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
