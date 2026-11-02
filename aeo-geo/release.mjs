import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {runtimeRollbackDecision} from '../release/runtime-rollback-guard.mjs';
import {preparePackage,verifyPackage,hash} from './package.mjs';
import targets from './targets.json' with {type:'json'};
import {activeDeployment,replaceActiveTraffic} from './deployment.mjs';
const directory='aeo-geo-proof',account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
assert.equal(account,'9e5386dcf455be34c582d93f8bfc79e6');assert(token);mkdirSync(directory,{recursive:true});
const save=(name,value)=>writeFileSync(directory+'/'+name,JSON.stringify(value,null,2));
const api=async(path,init={})=>{
 const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{...init,headers:{Authorization:'Bearer '+token,...init.headers},signal:AbortSignal.timeout(60000)});
 const j=await r.json();assert(r.ok&&j.success,'Provider request failed: '+JSON.stringify(j.errors));return j.result;
};
const latest=async script=>{
 const {deployments}=await api('/workers/scripts/'+script+'/deployments');
 const d=deployments.toSorted((a,b)=>b.created_on.localeCompare(a.created_on))[0];return activeDeployment(d);
};
const version=(script,id)=>api('/workers/workers/'+script+'/versions/'+id+'?include=modules');
function currentMain(){
 assert.equal(process.env.GITHUB_REF,'refs/heads/main');assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);
 execFileSync('git',['fetch','--no-tags','origin','main'],{stdio:'pipe'});
 assert.equal(execFileSync('git',['rev-parse','origin/main'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA,'Main changed; stop stale publication');
}
const clean=html=>html.replace(/<script\b[^>]*\bsrc=["']https:\/\/static.cloudflareinsights.com[^"']*["'][\s\S]*?<\/script>/gi,'').replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi,'');
async function request(path){const r=await fetch('https://shiftsometimber.co.uk'+path,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(45000)});return {response:r,text:await r.text()};}
async function privateDocuments(){
 const rows={};for(const path of ['/member-login','/member/dashboard','/v1/member-state']){
  const {response,text}=await request(path);rows[path]={status:response.status,sha256:hash(clean(text)),cache:response.headers.get('Cache-Control')};
 }return rows;
}
const receiptsPath=directory+'/deployments.json';
if(process.argv[2]==='rollback'){
 if(!existsSync(receiptsPath)){console.log('No owned production mutation to restore');process.exit(0);}
 const receipts=JSON.parse(readFileSync(receiptsPath)),results=[];
 for(const receipt of receipts.toReversed()){
  try{
   const active=await latest(receipt.script);
   const decision=runtimeRollbackDecision({before:receipt.before,active,receipt,source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID});
   if(decision.action==='restore'){
    await api('/workers/scripts/'+receipt.script+'/deployments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy:'percentage',versions:receipt.before.providerVersions||[{version_id:decision.versionId,percentage:100}]})});
    assert.equal((await latest(receipt.script)).versions[0].version_id,decision.versionId);
   }
   results.push({script:receipt.script,...decision});
  }catch(error){results.push({script:receipt.script,restored:false,error:String(error.message)});}
 }save('rollback.json',results);assert(results.every(r=>!r.error),'Some serving leases moved; newer deployments were preserved');
}else{
 currentMain();
 const privateBefore=await privateDocuments();save('private-before.json',privateBefore);
 const planned=[];
 // Stage every exact provider package before changing any production traffic.
 for(const {script} of targets){
  const before=await latest(script),original=await version(script,before.versions[0].version_id),settings=await api('/workers/scripts/'+script+'/settings');
  const candidate=preparePackage(original,{includeCatalogue:['shift-core','shift-seo-followup-v3-20261024'].includes(script)});
  const metadata={main_module:candidate.main_module,compatibility_date:settings.compatibility_date,compatibility_flags:settings.compatibility_flags||[],bindings:original.bindings.map(b=>({type:'inherit',name:b.name})),keep_assets:true,annotations:{'workers/message':'AEO public catalogue and accurate structured data; preserve all existing source modules'}};
  for(const key of ['placement','limits','observability','logpush'])if(settings[key]!==undefined)metadata[key]=settings[key];
  const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');
  for(const module of candidate.modules){assert(/\.m?js$/.test(module.name),'Unexpected non-JavaScript module; preserve without retyping');form.set(module.name,new Blob([Buffer.from(module.content_base64,'base64')],{type:'application/javascript+module'}),module.name);}
  assert.equal((await latest(script)).id,before.id,'Serving version moved during preparation: '+script);
  const staged=await api('/workers/scripts/'+script+'/versions?bindings_inheritance=strict',{method:'POST',body:form});
  const proof=verifyPackage(original,await version(script,staged.id),candidate);
  planned.push({script,before,versionId:staged.id,...proof});save('staged.json',planned);
 }
 currentMain();for(const p of planned)assert.equal((await latest(p.script)).id,p.before.id,'Serving lease changed: '+p.script);
 const receipts=[];
 for(const p of planned){
  assert.equal((await latest(p.script)).id,p.before.id,'Serving lease changed before promotion: '+p.script);
  save('promotion-intent.json',{source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,script:p.script,versionId:p.versionId,previous:p.before.versions[0].version_id});
  const deployed=await api('/workers/scripts/'+p.script+'/deployments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy:'percentage',versions:replaceActiveTraffic(p.before,p.versionId)})});
  const receipt={kind:'owned_runtime_deployment',source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,script:p.script,deploymentId:deployed.id,versionId:p.versionId,before:p.before};receipts.push(receipt);save('deployments.json',receipts);
  assert.equal((await latest(p.script)).id,deployed.id);
 }
 const checked=[];
 for(const {path,script} of targets){const {response,text}=await request(path);assert.equal(response.status,200,path);assert.equal(response.headers.get('X-Shift-AEO-GEO'),'aeo-geo-20261102-v1',path+' wrapper missing');assert(text.includes('17393135'),path+' organisation missing');checked.push({path,script,status:response.status});}
 const data=JSON.parse(readFileSync(directory+'/public-catalogue.json'));
 for(const path of ['/recipes','/exercises',data.recipes[0].path,data.recipes.at(-1).path,data.exercises[0].path,data.exercises.at(-1).path]){
  const {response,text}=await request(path);assert.equal(response.status,200,path);assert(text.includes('application/ld+json'));assert(!/name="robots" content="noindex/.test(text));checked.push({path,status:response.status,bytes:Buffer.byteLength(text)});
 }
 for(const path of ['/sitemap.xml','/recipes/sitemap.xml','/exercises/sitemap.xml']){const {response,text}=await request(path);assert.equal(response.status,200);assert(text.includes('<urlset'));assert(!/<loc>[^<]*\/(?:member|checkout|admin)/.test(text));assert(text.includes(path.includes('exercises')?data.exercises[0].path:data.recipes[0].path));checked.push({path,status:response.status,urls:(text.match(/<loc>/g)||[]).length});}
 const privateAfter=await privateDocuments();save('private-after.json',privateAfter);assert.deepEqual(privateAfter,privateBefore,'Private/account response changed');
 save('live-verification.json',{at:new Date().toISOString(),source:process.env.GITHUB_SHA,checked,privateResponsesUnchanged:true,routeWrites:0,originalSourceModulesChanged:0,databaseWrites:0,publicRecipes:data.recipes.length,publicExercises:data.exercises.length});
 console.log(JSON.stringify({verified:true,workers:receipts.length,publicRecipes:data.recipes.length,publicExercises:data.exercises.length,releases:receipts.map(r=>({script:r.script,versionId:r.versionId,deploymentId:r.deploymentId}))}));
}
