import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {digest,latestDeployment,assertProvider,assertPrepared,assertOwned,assertStock,settleOwnedCleanup} from './gp-priority-direct-owned-release-20261016.mjs';
export const LANE=Object.freeze({branch:'release/gp-priority-direct-activation-20261016',workflow:'.github/workflows/gp-priority-direct-activation-20261016.yml',main:'3ab4dc5f8f47e44108f3f6d5503ffbac90b6adef',repository:'shiftsometimber/shift-core'});
const sha=b=>createHash('sha256').update(b).digest('hex');
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
export function activationPredecessors(input){
 assert.match(input.source||'',/^[a-f0-9]{40}$/);assert.equal(input.observedMain,LANE.main);
 const specs={};for(const [key,config,script]of [['core','wrangler.jsonc','shift-core'],['hq','wrangler.hq-management.jsonc','shift-hq-management']]){
  const p=input[key];assert.equal(p.source,input.source);assert(Number.isSafeInteger(p.run)&&p.run>0);assert(Number.isSafeInteger(p.attempt)&&p.attempt>0);assert.equal(p.percentage,100);assert.equal(p.gpEnabled,false);assert.match(p.deploymentId||'',uuid);assert.match(p.versionId||'',uuid);assert.match(p.bundleSha256||'',/^[a-f0-9]{64}$/);assert(Number.isSafeInteger(p.bundleBytes)&&p.bundleBytes>0);assert.match(p.otherBindingsSha256||'',/^[a-f0-9]{64}$/);
  specs[key]={source:input.source,run:p.run,attempt:p.attempt,deployment:p.deploymentId,version:p.versionId,config,script};
 }assert.equal(specs.core.run,specs.hq.run);assert.equal(specs.core.attempt,specs.hq.attempt);return specs;
}
export function assertActivated(snapshot,expected,{hq=false}={}){
 const bindings=snapshot.version.resources?.bindings;assert(Array.isArray(bindings));
 const flags=bindings.filter(b=>b.name==='MEMBER_GP_DIRECTORY_V2_ENABLED');assert.equal(flags.length,1);assert.equal(flags[0].type,'plain_text');assert.equal(flags[0].text,'true');
 const isolated=structuredClone(snapshot);isolated.version.resources.bindings=isolated.version.resources.bindings.filter(b=>b.name!=='MEMBER_GP_DIRECTORY_V2_ENABLED');
 const proof=assertProvider(isolated,expected,{hq});assert.equal(proof.gpEnabled,false);return {...proof,gpEnabled:true,allBindingsSha256:digest(bindings.slice().sort((a,b)=>a.name.localeCompare(b.name)))};
}
export function assertActivationPrepared(prepared,before,accepted){
 assertActivated({deployment:{id:before.deployment.id,versions:[{version_id:prepared.version.id,percentage:100}]},version:prepared.version},{deployment:before.deployment.id,version:prepared.version.id});
 const isolated=structuredClone(prepared),previous=structuredClone(before);
 isolated.version.resources.bindings=isolated.version.resources.bindings.filter(b=>b.name!=='MEMBER_GP_DIRECTORY_V2_ENABLED');
 previous.version.resources.bindings=previous.version.resources.bindings.filter(b=>b.name!=='MEMBER_GP_DIRECTORY_V2_ENABLED');
 assertPrepared(isolated,previous);assert.equal(prepared.bundle.sha256,accepted.bundleSha256,'Activation must preserve the entire accepted GP OFF bundle');assert.equal(prepared.bundle.bytes,accepted.bundleBytes);
 assert.equal(digest(isolated.version.resources.bindings.slice().sort((a,b)=>a.name.localeCompare(b.name))),accepted.otherBindingsSha256);
}
export function assertLane(run,{sha,runId,attempt}={}){assert.equal(run.id,Number(runId));assert.equal(run.run_attempt,Number(attempt));assert.equal(run.head_sha,sha);assert.equal(run.head_branch,LANE.branch);assert.equal(run.event,'push');assert.equal(run.path,LANE.workflow);assert.equal(run.repository.full_name,LANE.repository);}

// Explicit branch/run authority; this script never impersonates a main workflow.
export async function execute(phase){
 const env=process.env,source=env.GITHUB_SHA,run=env.GITHUB_RUN_ID,attempt=env.GITHUB_RUN_ATTEMPT;
 assert.match(source||'',/^[a-f0-9]{40}$/);assert.match(run||'',/^\d+$/);assert.match(attempt||'',/^\d+$/);
 assert.equal(env.GITHUB_REF,'refs/heads/'+LANE.branch);assert.equal(env.GITHUB_REPOSITORY,LANE.repository);
 assert.equal(env.GITHUB_EVENT_NAME,'push');assert.equal(env.GITHUB_JOB,'release');
 const input=JSON.parse(execFileSync('/usr/bin/git',['--no-replace-objects','show',source+':release/gp-directory-activation-20261015.json'],{encoding:'utf8',maxBuffer:16e6})).predecessor;const PREDECESSORS=activationPredecessors(input);
 const out='gp-direct-directory-activation';mkdirSync(out,{recursive:true});
 const save=(name,value)=>writeFileSync(out+'/'+name+'.json',JSON.stringify(value,null,2)+'\n');
 const load=name=>JSON.parse(readFileSync(out+'/'+name+'.json','utf8'));
 const git=(...args)=>execFileSync('/usr/bin/git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6}).trim();
 const cli=(config,...args)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config',config],{encoding:'utf8',maxBuffer:64e6,timeout:180000});
 const headers={Authorization:'Bearer '+env.CLOUDFLARE_API_TOKEN};assert(env.CLOUDFLARE_API_TOKEN);assert.match(env.CLOUDFLARE_ACCOUNT_ID||'',/^[a-f0-9]{32}$/);
 async function gh(path){const r=await fetch('https://api.github.com/repos/'+LANE.repository+path,{headers:{Authorization:'Bearer '+env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'GitHub guard unavailable: '+r.status);return r.json();}
 async function api(script,path,{method='GET',body}={}){
  const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+env.CLOUDFLARE_ACCOUNT_ID+'/workers/scripts/'+script+path,{method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
  assert(r.ok,'Provider request failed: '+method+' '+path+' '+r.status);const j=await r.json();assert.equal(j.success,true,'Provider rejected request');return j.result;
 }
 async function current(spec){const deployment=latestDeployment((await api(spec.script,'/deployments')).deployments);const version=await api(spec.script,'/versions/'+deployment.versions[0].version_id);return {deployment,version};}
 async function sourceGuard(){
  assert.equal(git('rev-parse','HEAD'),source);assert.equal(git('diff','--name-only','HEAD','--'),'');assert.equal(git('diff','--cached','--name-only','HEAD','--'),'');
  assertLane(await gh('/actions/runs/'+run),{sha:source,runId:run,attempt});assert.equal((await gh('/git/ref/heads/'+LANE.branch)).object.sha,source,'Release branch moved');assert.equal((await gh('/git/ref/heads/main')).object.sha,LANE.main,'Coordinating main moved');
  const {verifyGpDirectoryActivation}=await import('./gp-directory-activation-direct-20261016.mjs');verifyGpDirectoryActivation(JSON.parse(readFileSync('release/approved-runtime-composition.json')).gpDirectoryActivation20261015);
  const {disableGpDirectoryConfiguration}=await import('./gp-directory-activation-contract-20261015.mjs');for(const config of ['wrangler.jsonc','wrangler.coaching.jsonc','wrangler.hq-management.jsonc'])assert.equal(disableGpDirectoryConfiguration(config,readFileSync(config,'utf8')).trim(),git('show',input.source+':'+config),'Every unrelated accepted GP OFF configuration byte must remain');
 }
 function snapshotStock(){
  const tables={};for(const table of ['medicine_products','medicine_variants','medicine_inventory']){
   const value=JSON.parse(cli('wrangler.jsonc','d1','execute','DB','--remote','--json','--command','SELECT * FROM '+table+' ORDER BY '+(table==='medicine_inventory'?'variant_id':'id')));
   assert(value.length&&value.every(r=>r.success));const rows=value.flatMap(r=>r.results||[]);tables[table]={rows:rows.length,sha256:sha(JSON.stringify(rows))};
  }
  return {tables,configurationSha256:Object.fromEntries(['wrangler.jsonc','wrangler.coaching.jsonc','wrangler.hq-management.jsonc'].map(p=>[p,sha(readFileSync(p))]))};
 }
 function directoryReady(){const result=JSON.parse(cli('wrangler.jsonc','d1','execute','DB','--remote','--json','--command','SELECT a.version,v.complete FROM gp_directory_active AS a JOIN gp_directory_versions AS v ON v.version=a.version WHERE a.singleton=1'));assert(result.length&&result.every(r=>r.success));const rows=result.flatMap(r=>r.results||[]);assert.equal(rows.length,1);assert.equal(rows[0].version,'672021e21d318162d9aa550f');assert.equal(rows[0].complete,1);assert.equal(rows[0].version,input.directory.version);return {...rows[0],checkedAt:new Date().toISOString(),productionWrites:0};}
 function journalGuard(j){assert.equal(j.source,source);assert.equal(j.run,run);assert.equal(j.attempt,attempt);assert.equal(j.tree,git('rev-parse','HEAD^{tree}'));}
 const summary=s=>({deployment:s.deployment,version:{id:s.version.id,number:s.version.number,metadata:s.version.metadata,annotations:s.version.annotations,script:s.version.resources?.script,script_runtime:s.version.resources?.script_runtime},bindingsSha256:digest(s.version.resources.bindings.slice().sort((a,b)=>a.name.localeCompare(b.name)))});
 async function uploadedBundle(spec,id){
  const latest=async()=>{const items=(await api(spec.script,'/versions?per_page=20')).items;assert(Array.isArray(items)&&items.length);return [...items].sort((a,b)=>Date.parse(b.metadata.created_on)-Date.parse(a.metadata.created_on))[0];};
  assert.equal((await latest()).id,id,'Latest upload is not owned; content endpoint cannot prove this version');
  const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+env.CLOUDFLARE_ACCOUNT_ID+'/workers/scripts/'+spec.script+'/content/v2',{headers,signal:AbortSignal.timeout(30000)});
  assert(r.ok);assert(r.headers.get('content-type')?.startsWith('multipart/form-data'));const entry=r.headers.get('cf-entrypoint');assert(entry&&!entry.includes('/')&&!entry.includes('..'));
  const parts=await r.formData(),files=[...parts].filter(([,v])=>typeof v!=='string');assert.equal(files.length,1,'Unexpected extra compiled modules require explicit proof');
  const part=parts.get(entry);assert(part&&typeof part.arrayBuffer==='function');const bytes=Buffer.from(await part.arrayBuffer());assert.equal((await latest()).id,id,'Latest upload moved while reading compiled bytes');
  return {module:entry,bytes:bytes.length,sha256:sha(bytes),at:new Date().toISOString(),attribution:'Owned latest upload before and after exact content read'};
 }
 if(phase==='prepare'){
  await sourceGuard();
  for(const spec of Object.values(PREDECESSORS)){const r=await gh('/actions/runs/'+spec.run+'/attempts/'+spec.attempt);assert.equal(r.run_attempt,spec.attempt);assert.equal(r.head_sha,spec.source);assert.equal(r.head_branch,'release/gp-priority-direct-20261016');assert.equal(r.event,'push');assert.equal(r.path,'.github/workflows/gp-priority-direct-release-20261016.yml');assert.equal(r.status,'completed');assert.equal(r.conclusion,'success');}
  const j={schema:'shift-gp-direct-owned-activation/v1',source,tree:git('rev-parse','HEAD^{tree}'),run,attempt,branch:LANE.branch,workflow:LANE.workflow,at:new Date().toISOString(),stock:snapshotStock(),workers:{},owned:{},trafficWrites:0,dataWrites:0};
  for(const [key,spec]of Object.entries(PREDECESSORS)){
   const before=await current(spec);assertProvider(before,spec,{hq:key==='hq'});const settings=await api(spec.script,'/script-settings');
   assert.equal(settings.observability?.redact_query_string,true,'Existing query redaction must already be enabled');
   j.workers[key]={before:summary(before),settingsSha256:digest(settings)};save('journal',j);
   const dir=out+'/bundle-'+key;mkdirSync(dir,{recursive:true});const result=cli(spec.config,'versions','upload','--keep-vars','--outdir',dir,'--tag','gp-activation-'+run+'-'+attempt,'--message','GP directory ON exact source '+source+' run '+run+' attempt '+attempt);
   writeFileSync(out+'/upload-'+key+'.log',result);const ids=[...result.matchAll(/(?:Worker )?Version ID:\s*([a-f0-9-]{36})/g)];assert.equal(ids.length,1,'One owned uploaded version required');const id=ids[0][1];
   const version=await api(spec.script,'/versions/'+id),bundle=await uploadedBundle(spec,id);
   const bytes=readFileSync(dir+'/'+bundle.module),local={bytes:bytes.length,sha256:sha(bytes)};const prepared={version,bundle,local};assertActivationPrepared(prepared,before,input[key]);
   assertActivated({deployment:{id:spec.deployment,versions:[{version_id:id,percentage:100}]},version},{deployment:spec.deployment,version:id},{hq:key==='hq'});
   j.workers[key].prepared={versionId:id,versionNumber:version.number,script:version.resources.script,script_runtime:version.resources.script_runtime,bundle,local,bindingsSha256:digest(version.resources.bindings.slice().sort((a,b)=>a.name.localeCompare(b.name)))};save('journal',j);
   assertProvider(await current(spec),spec,{hq:key==='hq'});
  }
  assertStock(j.stock,snapshotStock());j.directory=directoryReady();j.preparedAt=new Date().toISOString();save('journal',j);save('prepared',{source,run,attempt,status:'activation_upload_verified_not_deployed',trafficWrites:0,dataWrites:0});
 }else if(phase==='deploy'){
  const j=load('journal');journalGuard(j);assert(Date.now()-Date.parse(j.preparedAt)<300000,'Fresh prepared provider window required');await sourceGuard();
  for(const [key,spec]of Object.entries(PREDECESSORS))assertProvider(await current(spec),spec,{hq:key==='hq'});assertStock(j.stock,snapshotStock());directoryReady();
  for(const [key,spec]of Object.entries(PREDECESSORS)){
   await sourceGuard();assertProvider(await current(spec),spec,{hq:key==='hq'});const prepared=j.workers[key].prepared;assert(prepared);assert.equal(digest(await api(spec.script,'/script-settings')),j.workers[key].settingsSha256);
   const message='GP direct ON '+source+' run '+run+' attempt '+attempt;
   j.intent={key,versionId:prepared.versionId,message,at:new Date().toISOString()};save('journal',j);
   // Deploy a previously uploaded, hash-verified version; never rebuild during the traffic write.
   const deployment=await api(spec.script,'/deployments',{method:'POST',body:{strategy:'percentage',versions:[{version_id:prepared.versionId,percentage:100}],annotations:{'workers/message':message}}});
   const receipt={kind:'owned_runtime_deployment',source,run,attempt,deploymentId:deployment.id,versionId:prepared.versionId,previousDeploymentId:spec.deployment,previousVersionId:spec.version,at:new Date().toISOString(),dataRestored:false};j.owned[key]=receipt;j.trafficWrites++;delete j.intent;save('journal',j);save('owned-'+key,receipt);
   assertOwned((await current(spec)).deployment,receipt,source,run,attempt);
  }
 }else if(phase==='verify'){
  const j=load('journal');journalGuard(j);await sourceGuard();const result={schema:'shift-gp-direct-activation-receipt/v1',source,tree:j.tree,run,attempt,branch:LANE.branch,workflow:LANE.workflow,main:LANE.main,releaseBranch:LANE.branch,releaseWorkflow:LANE.workflow,releaseRun:Number(run),ownership:{mainBefore:LANE.main,mainAfter:LANE.main},at:new Date().toISOString(),gpEnabled:true,workers:{},dataWrites:0,externalMessages:0,featureAcceptance:false};
  for(const [key,spec]of Object.entries(PREDECESSORS)){
   const s=await current(spec),owned=j.owned[key];assert(owned);assertOwned(s.deployment,owned,source,run,attempt);const binding=assertActivated(s,{deployment:owned.deploymentId,version:owned.versionId},{hq:key==='hq'});assert.equal(binding.allBindingsSha256,j.workers[key].prepared.bindingsSha256);
   assert.equal(digest(await api(spec.script,'/script-settings')),j.workers[key].settingsSha256);const bundle=await uploadedBundle(spec,owned.versionId);assert.equal(bundle.sha256,j.workers[key].prepared.local.sha256);assert.equal(bundle.bytes,j.workers[key].prepared.local.bytes);
   result.workers[key]={source,run:Number(run),attempt:Number(attempt),deploymentId:owned.deploymentId,versionId:owned.versionId,percentage:100,bundleSha256:bundle.sha256,bundleBytes:bundle.bytes,allBindingsSha256:binding.allBindingsSha256,otherBindingsSha256:digest(s.version.resources.bindings.filter(b=>b.name!=='MEMBER_GP_DIRECTORY_V2_ENABLED').sort((a,b)=>a.name.localeCompare(b.name))),gpEnabled:true,...(key==='hq'?{partnersEnabled:true}:{})};
  }
  const checks=[];for(const path of ['/v1/member/details/gp-search?q=London','/v1/hq/management/gp-directory','/v1/hq/management/people/1/gp-details']){const r=await fetch('https://api.shiftsometimber.co.uk'+path,{headers:{Origin:path.includes('/hq/')?'https://hq.shiftsometimber.co.uk':'https://api.shiftsometimber.co.uk'},redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(r.status,401,'Unauthenticated private GP route must require authentication');checks.push({path,status:r.status});await r.body?.cancel();}
  assertStock(j.stock,snapshotStock());for(const [key,spec]of Object.entries(PREDECESSORS))assertOwned((await current(spec)).deployment,j.owned[key],source,run,attempt);
  result.directory=directoryReady();const mainAfter=(await gh('/git/ref/heads/main')).object.sha;assert.equal(mainAfter,LANE.main);result.ownership.mainAfter=mainAfter;
  result.anonymousBoundary=checks;result.status='directory_activated_provider_verified';result.authenticatedMemberAndHqAcceptance='separate original GP ON fictional-holder gate; not claimed here';save('runtime-receipt',result);console.log(JSON.stringify(result));
 }else if(phase==='rollback'){
  const j=load('journal');journalGuard(j);const errors=[];
  try{
  if(j.intent&&!j.owned[j.intent.key]){
   const intent=j.intent,spec=PREDECESSORS[intent.key],s=await current(spec);
   if(s.deployment.versions[0].version_id!==spec.version){
    assert.equal(s.deployment.annotations?.['workers/message'],intent.message,'Ambiguous write is not attributable to this exact intent');assert.deepEqual(s.deployment.versions,[{version_id:intent.versionId,percentage:100}]);assert(Date.parse(s.deployment.created_on)>=Date.parse(intent.at));
    j.owned[intent.key]={kind:'owned_runtime_deployment',source,run,attempt,deploymentId:s.deployment.id,versionId:intent.versionId,previousDeploymentId:spec.deployment,previousVersionId:spec.version,at:new Date().toISOString(),recoveredFromExactPersistedIntent:true,dataRestored:false};save('journal',j);
   }
  }
  }catch(e){errors.push({stage:'ambiguous_intent',error:String(e.message)});}
  const restored=await settleOwnedCleanup(Object.keys(j.owned).reverse(),async key=>{
   const spec=PREDECESSORS[key],owned=j.owned[key],s=await current(spec);if(s.deployment.versions[0].version_id===spec.version)return {key,action:'retain',versionId:spec.version};
   assertOwned(s.deployment,owned,source,run,attempt);const d=await api(spec.script,'/deployments',{method:'POST',body:{strategy:'percentage',versions:[{version_id:spec.version,percentage:100}],annotations:{'workers/message':'Owned GP directory activation '+run+' failed; restore exact captured predecessor; preserve all current data'}}});
   const after=await current(spec);assert.equal(after.deployment.id,d.id);assert.deepEqual(after.deployment.versions,[{version_id:spec.version,percentage:100}]);assert.equal(digest(after.version.resources.bindings.slice().sort((a,b)=>a.name.localeCompare(b.name))),j.workers[key].before.bindingsSha256);return {key,action:'restore',versionId:spec.version,deploymentId:d.id};
  });
  for(const [key,spec]of Object.entries(PREDECESSORS))try{assert.equal(digest(await api(spec.script,'/script-settings')),j.workers[key].settingsSha256,'Script settings changed after owned rollback');}catch(e){errors.push({key,stage:'settings_after_rollback',error:String(e.message)});}
  let stockAfter;try{stockAfter=snapshotStock();assertStock(j.stock,stockAfter);}catch(e){errors.push({stage:'stock_after_rollback',error:String(e.message)});}
  save('rollback',{source,run,attempt,at:new Date().toISOString(),restored,errors,stockAfter,dataRestored:false,releaseVerified:false});
  assert(!errors.length&&restored.every(r=>r.action!=='refused_or_failed'),'Owned rollback has unresolved technical errors; inspect retained exact evidence');
 }else throw Error('Unknown finite release phase');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await execute(process.argv[2]);
