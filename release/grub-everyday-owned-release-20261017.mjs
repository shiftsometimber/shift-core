import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createGithubProofGet} from './github-proof-get.mjs';
import {digest,latestDeployment,assertPrepared,assertOwned,assertStock,settleOwnedCleanup} from './gp-priority-direct-owned-release-20261016.mjs';
import {assertActivated} from './gp-priority-direct-activation-owned-20261016.mjs';
import {verifyGrubEverydaySource} from './grub-everyday-source-20261017.mjs';

export const LANE=Object.freeze({branch:'release/grub-everyday-direct-20261017',workflow:'.github/workflows/grub-everyday-release-20261017.yml',repository:'shiftsometimber/shift-core'});
const BASELINE_PATH='release/grub-everyday-baseline-20261017.json';
const sha=b=>createHash('sha256').update(b).digest('hex');
const sorted=rows=>rows.slice().sort((a,b)=>a.name.localeCompare(b.name));
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const sha40=v=>assert.match(v||'',/^[a-f0-9]{40}$/);
const sha64=v=>assert.match(v||'',/^[a-f0-9]{64}$/);
export function canonicalId(v){const s=String(v);assert.match(s,/^[1-9][0-9]*$/);assert(BigInt(s)<=BigInt(Number.MAX_SAFE_INTEGER));return s;}
export function assertGrubLane(run,{source,runId,attempt}={}){
 assert.equal(canonicalId(run.id),canonicalId(runId));assert.equal(canonicalId(run.run_attempt),canonicalId(attempt));
 assert.equal(run.head_sha,source);assert.equal(run.head_branch,LANE.branch);assert.equal(run.path,LANE.workflow);assert.equal(run.event,'push');assert.equal(run.repository.full_name,LANE.repository);
}
export function assertCoreWrite(script,path,method){assert.equal(script,'shift-core','HQ is retained; writes are Core only');assert.equal(path,'/deployments');assert.equal(method,'POST');}
export function assertPreparedWindow(at,now=Date.now()){const value=Date.parse(at);assert(Number.isFinite(value)&&value<=now&&now-value<300000,'Fresh five-minute prepared provider window required');}
export function assertBaselineProvider(snapshot,accepted,{hq=false}={}){
 const proof=assertActivated(snapshot,{deployment:accepted.deploymentId,version:accepted.versionId},{hq});
 assert.equal(proof.allBindingsSha256,accepted.allBindingsSha256,'Every accepted provider binding must remain identical');
 assert.equal(digest(snapshot.version),accepted.versionSnapshotSha256,'Exact immutable baseline version metadata required');
 assert.equal(digest(snapshot.deployment),accepted.deploymentSnapshotSha256,'Exact captured serving deployment required');
 if(!hq){const flags=snapshot.version.resources.bindings.filter(b=>b.name==='MY_TIMBER_WEEK_VIEW_ENABLED');assert.deepEqual(flags,[{name:'MY_TIMBER_WEEK_VIEW_ENABLED',type:'plain_text',text:'true'}],'Recorded week must remain enabled');}
 return proof;
}
export function assertGrubPrepared(prepared,before){assertPrepared(prepared,before);assertActivated({deployment:{id:before.deployment.id,versions:[{version_id:prepared.version.id,percentage:100}]},version:prepared.version},{deployment:before.deployment.id,version:prepared.version.id});return true;}
export function assertCompletedProducer(run,expected){
 assert.equal(canonicalId(run.id),canonicalId(expected.id));assert.equal(canonicalId(run.run_attempt),canonicalId(expected.attempt));
 assert.equal(run.head_sha,expected.source);assert.equal(run.head_branch,expected.branch);assert.equal(run.path,expected.workflow);assert.equal(run.repository.full_name,LANE.repository);assert.equal(run.event,'push');assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');
}
export function assertRestoringRun(run,expected){
 assert.equal(canonicalId(run.id),canonicalId(expected.id));assert.equal(canonicalId(run.run_attempt),canonicalId(expected.attempt));
 assert.equal(run.head_sha,expected.source);assert.equal(run.head_branch,'main');assert.equal(run.path,'.github/workflows/cloudflare-production-promote.yml');assert.equal(run.repository.full_name,LANE.repository);assert.equal(run.event,'push');assert.equal(run.status,'completed');assert.equal(run.conclusion,expected.conclusion);assert(['failure','cancelled'].includes(run.conclusion),'Only the recorded terminal owned-rollback failure/cancellation is accepted');
}
export function assertCapturedGrubRollback(baseline){
 const prior=baseline.previousGrubAttempt;assert(prior);assert.equal(prior.conclusion,'failure');sha40(prior.source);sha64(prior.artifact.sha256);
 const owned=prior.ownedReceipt,rollback=prior.rollbackReceipt;for(const receipt of [owned,rollback]){assert.equal(receipt.source,prior.source);assert.equal(canonicalId(receipt.run),canonicalId(prior.id));assert.equal(canonicalId(receipt.attempt),canonicalId(prior.attempt));assert.equal(receipt.dataRestored,false);}
 assert.equal(sha(JSON.stringify(owned,null,2)+'\n'),prior.ownedReceiptSha256,'Exact failed owned-deployment receipt required');assert.equal(sha(JSON.stringify(rollback,null,2)+'\n'),prior.rollbackReceiptSha256,'Exact successful owned-rollback receipt required');
 assert.deepEqual(rollback.errors,[]);assert.equal(rollback.restored.length,1);const restored=rollback.restored[0];assert.equal(restored.key,'core');assert.equal(restored.action,'restored');assert.equal(restored.dataRestored,false);
 assert.equal(owned.previousDeploymentId,prior.predecessorCore.deploymentId);assert.equal(owned.previousVersionId,prior.predecessorCore.versionId);assert.notEqual(owned.versionId,owned.previousVersionId);
 assert.equal(restored.versionId,owned.previousVersionId);assert.equal(baseline.workers.core.versionId,restored.versionId);assert.equal(baseline.workers.core.deploymentId,restored.deploymentId,'Only the actual successfully restored deployment is the new baseline');
}
export function assertPreviousGrubFailure(run,baseline){const prior=baseline.previousGrubAttempt;assertCapturedGrubRollback(baseline);assertGrubLane(run,{source:prior.source,runId:prior.id,attempt:prior.attempt});assert.equal(run.status,'completed');assert.equal(run.conclusion,'failure','Failed Grub publication is not accepted runtime evidence');}
export function recoverGrubIntent(snapshot,intent,{source,run,attempt,baseline}={}){
 if(snapshot.deployment.versions[0].version_id===baseline.versionId)return null;
 assert.equal(intent.key,'core');assert.equal(snapshot.deployment.annotations?.['workers/message'],intent.message,'Ambiguous write is not attributable to this persisted intent');assert.deepEqual(snapshot.deployment.versions,[{version_id:intent.versionId,percentage:100}]);
 const created=Date.parse(snapshot.deployment.created_on),started=Date.parse(intent.at);assert(Number.isFinite(created)&&Number.isFinite(started)&&created>=started,'Owned intent requires actual subsequent provider timestamp');
 return {kind:'owned_runtime_deployment',source,run,attempt,deploymentId:snapshot.deployment.id,versionId:intent.versionId,previousDeploymentId:baseline.deploymentId,previousVersionId:baseline.versionId,recoveredFromExactPersistedIntent:true,dataRestored:false};
}
export async function execute(phase){
 assert(['prepare','deploy','verify','rollback'].includes(phase));
 const env=process.env,source=env.GITHUB_SHA,run=canonicalId(env.GITHUB_RUN_ID),attempt=canonicalId(env.GITHUB_RUN_ATTEMPT);sha40(source);
 assert.equal(env.GITHUB_REF,'refs/heads/'+LANE.branch);assert.equal(env.GITHUB_REPOSITORY,LANE.repository);assert.equal(env.GITHUB_EVENT_NAME,'push');assert.equal(env.GITHUB_JOB,'release');
 const baseline=JSON.parse(readFileSync(BASELINE_PATH,'utf8'));
 assert.equal(baseline.schema,'shift-grub-everyday-captured-baseline/v1');assertCapturedGrubRollback(baseline);assert.equal(baseline.source,'b6f9c0c36d4303e5d384fb2d62b58968b998aa64');sha40(baseline.tree);sha40(baseline.coordinatingMain);
 for(const name of ['core','hq']){const w=baseline.workers[name];assert.match(w.deploymentId,uuid);assert.match(w.versionId,uuid);for(const k of ['allBindingsSha256','versionSnapshotSha256','deploymentSnapshotSha256','bundleSha256'])sha64(w[k]);assert(Number.isSafeInteger(w.bundleBytes)&&w.bundleBytes>0);}
 const specs={core:{script:'shift-core',config:'wrangler.jsonc'},hq:{script:'shift-hq-management',config:'wrangler.hq-management.jsonc'}};
 const out='grub-everyday-runtime-release';mkdirSync(out,{recursive:true});
 const save=(name,value)=>writeFileSync(out+'/'+name+'.json',JSON.stringify(value,null,2)+'\n');
 const load=name=>JSON.parse(readFileSync(out+'/'+name+'.json','utf8'));
 const git=(...args)=>execFileSync('/usr/bin/git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6}).trim();
 const cli=(config,args,timeout=180000)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config',config],{encoding:'utf8',maxBuffer:64e6,timeout});
 assert.equal(JSON.parse(readFileSync('node_modules/wrangler/package.json','utf8')).version,'4.112.0','Retain the original production compiler');
 assert(env.CLOUDFLARE_API_TOKEN);assert.match(env.CLOUDFLARE_ACCOUNT_ID||'',/^[a-f0-9]{32}$/);assert(env.GITHUB_TOKEN);
 const headers={Authorization:'Bearer '+env.CLOUDFLARE_API_TOKEN},gh=createGithubProofGet({token:env.GITHUB_TOKEN});
 async function api(script,path,{method='GET',body}={}){
  if(method!=='GET')assertCoreWrite(script,path,method);
  const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+env.CLOUDFLARE_ACCOUNT_ID+'/workers/scripts/'+script+path,{method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
  assert(r.ok,'Provider request failed: '+method+' '+path+' '+r.status);const j=await r.json();assert.equal(j.success,true,'Provider rejected request');return j.result;
 }
 async function current(name){const deployment=latestDeployment((await api(specs[name].script,'/deployments')).deployments);const version=await api(specs[name].script,'/versions/'+deployment.versions[0].version_id);return {deployment,version};}
 async function sourceGuard(){
  assert.equal(git('rev-parse','HEAD'),source);assert.equal(git('diff','--name-only','HEAD','--'),'');assert.equal(git('diff','--cached','--name-only','HEAD','--'),'');
  assertGrubLane(await gh('/actions/runs/'+run),{source,runId:run,attempt});assert.equal((await gh('/git/ref/heads/'+LANE.branch)).object.sha,source,'Release branch moved');assert.equal((await gh('/git/ref/heads/main')).object.sha,baseline.coordinatingMain,'Coordinating main moved');
  const record=JSON.parse(readFileSync('release/approved-runtime-composition.json','utf8')).grubEverydayDirect20261017;assert.equal(verifyGrubEverydaySource(record),record);assert.deepEqual(record.acceptedBaseline,baseline);
 }
 async function baselineRuns(){
  for(const p of baseline.producers)assertCompletedProducer(await gh('/actions/runs/'+p.id+'/attempts/'+p.attempt),p);
  assertRestoringRun(await gh('/actions/runs/'+baseline.restoration.id+'/attempts/'+baseline.restoration.attempt),baseline.restoration);
  assertPreviousGrubFailure(await gh('/actions/runs/'+baseline.previousGrubAttempt.id+'/attempts/'+baseline.previousGrubAttempt.attempt),baseline);
 }
 function snapshotStock(){
  const tables={};for(const table of ['medicine_products','medicine_variants','medicine_inventory']){const value=JSON.parse(cli('wrangler.jsonc',['d1','execute','DB','--remote','--json','--command','SELECT * FROM '+table+' ORDER BY '+(table==='medicine_inventory'?'variant_id':'id')]));assert(value.length&&value.every(r=>r.success));const rows=value.flatMap(r=>r.results||[]);tables[table]={rows:rows.length,sha256:sha(JSON.stringify(rows))};}
  return {tables,configurationSha256:Object.fromEntries(['wrangler.jsonc','wrangler.coaching.jsonc','wrangler.hq-management.jsonc'].map(p=>[p,sha(readFileSync(p))]))};
 }
 function directoryReady(){
  const value=JSON.parse(cli('wrangler.jsonc',['d1','execute','DB','--remote','--json','--command','SELECT a.version,v.complete FROM gp_directory_active AS a JOIN gp_directory_versions AS v ON v.version=a.version WHERE a.singleton=1']));
  assert(value.length&&value.every(r=>r.success));const rows=value.flatMap(r=>r.results||[]);assert.equal(rows.length,1);assert.equal(rows[0].version,'672021e21d318162d9aa550f');assert.equal(rows[0].complete,1);return {...rows[0],checkedAt:new Date().toISOString(),productionWrites:0};
 }
 function journalGuard(j){assert.equal(j.schema,'shift-grub-everyday-owned-release/v1');assert.equal(j.source,source);assert.equal(j.run,run);assert.equal(j.attempt,attempt);assert.equal(j.tree,git('rev-parse','HEAD^{tree}'));assert.deepEqual(j.baseline,baseline);assert.deepEqual(Object.keys(j.workers).sort(),['core','hq']);assert(Object.keys(j.owned).every(k=>k==='core'));}
 async function exactOwnedBundle(id){
  const latest=async()=>{const items=(await api(specs.core.script,'/versions?per_page=20')).items;assert(Array.isArray(items)&&items.length);return [...items].sort((a,b)=>Date.parse(b.metadata.created_on)-Date.parse(a.metadata.created_on))[0];};
  assert.equal((await latest()).id,id,'Latest upload is not the exact owned version; content attribution unavailable');
  const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+env.CLOUDFLARE_ACCOUNT_ID+'/workers/scripts/'+specs.core.script+'/content/v2',{headers,signal:AbortSignal.timeout(30000)});assert(r.ok);assert(r.headers.get('content-type')?.startsWith('multipart/form-data'));const module=r.headers.get('cf-entrypoint');assert(module&&!module.includes('/')&&!module.includes('..'));
  const parts=await r.formData(),files=[...parts].filter(([,value])=>typeof value!=='string');assert.equal(files.length,1,'Unexpected compiled modules require exact additional proof');const part=parts.get(module);assert(part&&typeof part.arrayBuffer==='function');const bytes=Buffer.from(await part.arrayBuffer());assert.equal((await latest()).id,id,'Latest upload moved during exact content read');return {module,bytes:bytes.length,sha256:sha(bytes),at:new Date().toISOString(),attribution:'Exact owned latest version before and after whole content read'};
 }
 async function acceptedCurrent(name){const snapshot=await current(name),proof=assertBaselineProvider(snapshot,baseline.workers[name],{hq:name==='hq'});return {snapshot,proof};}
 async function retainedHq(j){const {snapshot}=await acceptedCurrent('hq');assert.deepEqual(snapshot,j.workers.hq.before,'Retained HQ provider metadata changed');assert.equal(digest(await api(specs.hq.script,'/script-settings')),j.workers.hq.settingsSha256,'Retained HQ settings changed');return snapshot;}
 if(phase==='prepare'){
  await sourceGuard();await baselineRuns();
  const j={schema:'shift-grub-everyday-owned-release/v1',source,tree:git('rev-parse','HEAD^{tree}'),run,attempt,branch:LANE.branch,workflow:LANE.workflow,baseline,at:new Date().toISOString(),stock:snapshotStock(),workers:{},owned:{},trafficWrites:0,dataWrites:0};
  for(const name of ['core','hq']){const {snapshot,proof}=await acceptedCurrent(name),settings=await api(specs[name].script,'/script-settings');assert.equal(settings.observability?.redact_query_string,true,'Existing query redaction must remain enabled');j.workers[name]={before:snapshot,settingsSha256:digest(settings),...proof};save('journal',j);}
  await sourceGuard();await retainedHq(j);const {snapshot:before}=await acceptedCurrent('core');assert.deepEqual(before,j.workers.core.before);assertStock(j.stock,snapshotStock());j.directoryBefore=directoryReady();
  const dir=out+'/bundle-core';mkdirSync(dir,{recursive:true});const result=cli(specs.core.config,['versions','upload','--keep-vars','--outdir',dir,'--tag','grub-'+run+'-'+attempt,'--message','Everyday Grub exact source '+source+' run '+run+' attempt '+attempt],300000);writeFileSync(out+'/upload-core.log',result);
  const ids=[...result.matchAll(/(?:Worker )?Version ID:\s*([a-f0-9-]{36})/g)];assert.equal(ids.length,1,'One exact owned Core upload required');const id=ids[0][1],version=await api(specs.core.script,'/versions/'+id),bundle=await exactOwnedBundle(id),bytes=readFileSync(dir+'/'+bundle.module),local={bytes:bytes.length,sha256:sha(bytes)};
  assertGrubPrepared({version,bundle,local},before);j.workers.core.prepared={versionId:id,version,bundle,local};save('journal',j);
  await acceptedCurrent('core');await retainedHq(j);assertStock(j.stock,snapshotStock());j.directoryAfterUpload=directoryReady();j.preparedAt=new Date().toISOString();save('journal',j);save('prepared',{source,run,attempt,status:'uploaded_verified_not_deployed',trafficWrites:0,dataWrites:0});
 }else if(phase==='deploy'){
  const j=load('journal');journalGuard(j);assertPreparedWindow(j.preparedAt);await sourceGuard();await acceptedCurrent('core');await retainedHq(j);assertStock(j.stock,snapshotStock());directoryReady();
  assert.equal(digest(await api(specs.core.script,'/script-settings')),j.workers.core.settingsSha256);const p=j.workers.core.prepared;assert(p);const bundle=await exactOwnedBundle(p.versionId);assert.equal(bundle.sha256,p.local.sha256);assert.equal(bundle.bytes,p.local.bytes);
  const message='Everyday Grub '+source+' run '+run+' attempt '+attempt;j.intent={key:'core',versionId:p.versionId,message,at:new Date().toISOString()};save('journal',j);
  assertPreparedWindow(j.preparedAt);
  const deployment=await api(specs.core.script,'/deployments',{method:'POST',body:{strategy:'percentage',versions:[{version_id:p.versionId,percentage:100}],annotations:{'workers/message':message}}});
  j.owned.core={kind:'owned_runtime_deployment',source,run,attempt,deploymentId:deployment.id,versionId:p.versionId,previousDeploymentId:baseline.workers.core.deploymentId,previousVersionId:baseline.workers.core.versionId,at:new Date().toISOString(),dataRestored:false};j.trafficWrites++;delete j.intent;save('journal',j);save('owned-core',j.owned.core);assertOwned((await current('core')).deployment,j.owned.core,source,run,attempt);
 }else if(phase==='verify'){
  const j=load('journal');journalGuard(j);await sourceGuard();await retainedHq(j);
  const snapshot=await current('core'),owned=j.owned.core;assert(owned);assertOwned(snapshot.deployment,owned,source,run,attempt);assert.equal(digest(sorted(snapshot.version.resources.bindings)),digest(sorted(j.workers.core.prepared.version.resources.bindings)));assert.deepEqual(snapshot.version.resources.script_runtime,j.workers.core.before.version.resources.script_runtime);
  assert.equal(digest(await api(specs.core.script,'/script-settings')),j.workers.core.settingsSha256);const bundle=await exactOwnedBundle(owned.versionId);assert.equal(bundle.sha256,j.workers.core.prepared.local.sha256);assert.equal(bundle.bytes,j.workers.core.prepared.local.bytes);
  const {verifyGrubLive}=await import('./grub-everyday-live-20261017.mjs');const live=await verifyGrubLive();
  assertStock(j.stock,snapshotStock());directoryReady();await retainedHq(j);assertOwned((await current('core')).deployment,owned,source,run,attempt);
  const result={schema:'shift-grub-everyday-runtime-receipt/v1',source,tree:j.tree,run,attempt,branch:LANE.branch,workflow:LANE.workflow,coordinatingMain:baseline.coordinatingMain,scope:'Everyday Grub only; retained serving Core and HQ',core:{deploymentId:owned.deploymentId,versionId:owned.versionId,bundleSha256:bundle.sha256,bundleBytes:bundle.bytes,allBindingsSha256:digest(sorted(snapshot.version.resources.bindings))},retainedHq:baseline.workers.hq,live,stockVerified:true,configurationUnchanged:true,clinicalAndGpChanged:false,homepageChanged:false,dataWrites:0,externalMessages:0,physicalDeviceAcceptance:false};save('runtime-receipt',result);console.log(JSON.stringify(result));
 }else{
  const j=load('journal');journalGuard(j);const errors=[];
  try{if(j.intent&&!j.owned.core){const recovered=recoverGrubIntent(await current('core'),j.intent,{source,run,attempt,baseline:baseline.workers.core});if(recovered){j.owned.core=recovered;save('journal',j);}}}catch(e){errors.push({stage:'ambiguous_intent',error:String(e.message)});}
  const restored=await settleOwnedCleanup(Object.keys(j.owned).reverse(),async name=>{
   assert.equal(name,'core');const owned=j.owned.core,s=await current('core');if(s.deployment.versions[0].version_id===baseline.workers.core.versionId)return {key:name,action:'retain',versionId:baseline.workers.core.versionId};
   assertOwned(s.deployment,owned,source,run,attempt);assert.equal(owned.previousVersionId,baseline.workers.core.versionId);assert.equal(owned.previousDeploymentId,baseline.workers.core.deploymentId);
   const d=await api(specs.core.script,'/deployments',{method:'POST',body:{strategy:'percentage',versions:[{version_id:baseline.workers.core.versionId,percentage:100}],annotations:{'workers/message':'Owned Grub '+run+' failed; restore exact captured predecessor; preserve all data'}}});
   const after=await current('core');assert.equal(after.deployment.id,d.id);assert.deepEqual(after.deployment.versions,[{version_id:baseline.workers.core.versionId,percentage:100}]);assert.equal(digest(after.version),baseline.workers.core.versionSnapshotSha256);return {key:name,action:'restored',deploymentId:d.id,versionId:baseline.workers.core.versionId,dataRestored:false};
  });
  try{await retainedHq(j);assertStock(j.stock,snapshotStock());directoryReady();}catch(e){errors.push({stage:'post_rollback',error:String(e.message)});}
  const result={source,run,attempt,restored,errors,dataRestored:false};save('rollback',result);assert.equal(errors.length,0);assert(restored.every(r=>r.action!=='refused_or_failed'),'Owned cleanup incomplete');
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)execute(process.argv[2]).catch(e=>{console.error(e);process.exitCode=1;});
