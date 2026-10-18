const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=__dirname,account='9e5386dcf455be34c582d93f8bfc79e6',project='projectshift',prefix='/accounts/'+account+'/pages/projects/'+project;
const blake=require('/Users/shiftsometimberltd/SST/shift-rollout-grub-safety-20261006/node_modules/blake3-wasm');
const token=fs.readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8').match(/^oauth_token\s*=\s*"([^"]+)"/m)[1];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const assetHash=(b,p)=>blake.hash(b.toString('base64')+path.extname(p).slice(1)).toString('hex').slice(0,32);
async function api(route){const r=await fetch('https://api.cloudflare.com/client/v4'+route,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(45000)});const j=await r.json();if(!r.ok||!j.success)throw Error('Provider '+r.status+' '+JSON.stringify(j.errors));return j.result;}
(async()=>{
const project=await api(prefix),base=await api(prefix+'/deployments/'+project.canonical_deployment.id);
if(base.environment!=='production'||base.latest_stage?.status!=='success'||!base.files)throw Error('Current production source unavailable');
fs.mkdirSync(path.join(ROOT,'before'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'origin-manifest.json'),JSON.stringify(base.files));
const provenance={id:base.id,url:base.url,created_on:base.created_on,commit:base.deployment_trigger?.metadata?.commit_hash,files:Object.keys(base.files).length};
fs.writeFileSync(path.join(ROOT,'origin-provenance.json'),JSON.stringify(provenance,null,2));
for(const key of ['/shift-health.html','/programme.html','/sitemap.xml']){
if(!base.files[key]){console.log('Not in origin manifest: '+key);continue;}
const r=await fetch(base.url+key.replace(/\.html$/,''),{signal:AbortSignal.timeout(45000)});const bytes=Buffer.from(await r.arrayBuffer());
if(!r.ok||assetHash(bytes,key)!==base.files[key])throw Error('Exact origin source hash mismatch: '+key);
fs.writeFileSync(path.join(ROOT,'before',key.slice(1)),bytes);
console.log(JSON.stringify({path:key,sha256:sha(bytes),bytes:bytes.length,matchedProviderAsset:true}));
}
const health=await fetch('https://shiftsometimber.co.uk/shift-health',{signal:AbortSignal.timeout(45000)});const html=await health.text();
fs.writeFileSync(path.join(ROOT,'before','live-shift-health.html'),html);
const policyRoot='/Users/shiftsometimberltd/SST/privacy-policies-20261018',policy=JSON.parse(fs.readFileSync(path.join(policyRoot,'prepared-changes.json')));
const headers=fs.readFileSync(path.join(policyRoot,'_headers'));if(sha(headers)!==policy.headersSHA256)throw Error('Known current headers changed');
fs.writeFileSync(path.join(ROOT,'_headers'),headers);
console.log(JSON.stringify({provenance,liveHealth:{status:health.status,authority:health.headers.get('x-shift-health-authority'),title:html.match(/<title>(.*?)<\/title>/)?.[1]},bloodsExisting:Object.keys(base.files).filter(x=>x.includes('blood-tests')),headersSHA256:sha(headers)}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});