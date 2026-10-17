import {createGithubProofGet} from './github-proof-get.mjs';
import {setTimeout as githubProofDelay} from 'node:timers/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {digest,latestDeployment,assertPrepared,assertOwned,assertStock,settleOwnedCleanup} from './gp-priority-direct-owned-release-20261016.mjs';
import {assertActivated} from './gp-priority-direct-activation-owned-20261016.mjs';

// Retry only this repository's immutable GET evidence, inside the original
// single 30-second request deadline. Provider writes are never retried here.
export function createRecordedWeekGithubGet({fetcher=fetch,token,wait=githubProofDelay,deadline=ms=>AbortSignal.timeout(ms)}={}){
 return path=>{
  const budget=deadline(30000);
  const get=createGithubProofGet({token,
   fetcher:(url,options)=>{budget.throwIfAborted();return fetcher(url,{...options,signal:AbortSignal.any([options.signal,budget])});},
   wait:ms=>{budget.throwIfAborted();return wait(ms,undefined,{signal:budget});}});
  return get(path);
 };
}
export const LANE=Object.freeze({branch:'release/factual-recorded-week-direct-20261016',workflow:'.github/workflows/factual-recorded-week-direct-release-20261016.yml',repository:'shiftsometimber/shift-core'});
export const WEEK_FLAG='MY_TIMBER_WEEK_VIEW_ENABLED';
export const SPLIT_CODE_ACCEPTANCE='qualified_core_code_with_retained_gp_hq';
const BASELINE_PATH='release/recorded-week-direct-baseline-20261016.json';
const sha=b=>createHash('sha256').update(b).digest('hex');
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const sorted=bindings=>bindings.slice().sort((a,b)=>a.name.localeCompare(b.name));
const bindingHash=bindings=>digest(sorted(bindings));
const sha40=v=>assert.match(v||'',/^[a-f0-9]{40}$/);
const sha64=v=>assert.match(v||'',/^[a-f0-9]{64}$/);
export function canonicalId(value){if(typeof value==='number'){assert(Number.isSafeInteger(value)&&value>0);return String(value);}assert.equal(typeof value,'string');assert.match(value,/^[1-9][0-9]*$/);assert(BigInt(value)<=BigInt(Number.MAX_SAFE_INTEGER));return value;}
export function baselineGpStatus(baseline){return baseline.acceptanceMode===SPLIT_CODE_ACCEPTANCE?{gpFeatureAcceptance:false,gpAssessmentReuse:{status:'blocked_contract_inactive'}}:{};}
export function baselineRunRoles(baseline){return baseline.acceptanceMode===SPLIT_CODE_ACCEPTANCE?['release','retainedHqRelease']:['release','member'];}
export function recordedWeekPredecessors(baseline){
 assert.equal(baseline.schema,'direct-coding-completed-baseline-documents/v1');sha40(baseline.source);sha40(baseline.tree);sha40(baseline.coordinatingMainAtAcceptance);
 assert.equal(baseline.currentProviderCheckRequiredBeforeDeployment,true);assert.equal(baseline.originalHqHolderAcceptanceStillOpen,true);
 const split=baseline.acceptanceMode===SPLIT_CODE_ACCEPTANCE;
 if(split){
  assert.equal(baseline.gpFeatureAcceptance,false,'Accepted coding does not establish complete GP feature acceptance');assert.deepEqual(baseline.gpAssessmentReuse,{status:'blocked_contract_inactive'});
  sha64(baseline.runtimeReceiptSHA256);sha64(baseline.retainedHqRuntimeReceiptSHA256);
  assert.equal(baseline.release.source,baseline.source);assert.equal(baseline.release.tree,baseline.tree);
  assert.equal(baseline.release.branch,'fix/questionnaire-handover-20261016');assert.equal(baseline.release.workflow,'.github/workflows/questionnaire-handover-release-20261016.yml');assert.equal(baseline.release.name,'Questionnaire Handover Nonclinical Release');
  const hq=baseline.retainedHqRelease;assert(hq);sha40(hq.source);sha40(hq.tree);assert.notEqual(hq.source,baseline.source,'The retained HQ owner must remain distinct from current Core');
  assert.equal(hq.branch,'release/gp-priority-direct-activation-20261016');assert.equal(hq.workflow,'.github/workflows/gp-priority-direct-activation-20261016.yml');assert.equal(hq.name,'GP Priority Direct Directory Activation');
 }else{
  assert(baseline.acceptanceMode===undefined||baseline.acceptanceMode==='completed_gp_member_acceptance','Unknown baseline acceptance mode');
  for(const k of ['runtimeReceiptSHA256','memberReportSHA256','ownedProofSHA256'])sha64(baseline[k]);
  assert.equal(baseline.release.branch,'release/gp-priority-direct-activation-20261016');assert.equal(baseline.release.workflow,'.github/workflows/gp-priority-direct-activation-20261016.yml');assert.equal(baseline.member.workflow,'.github/workflows/rendered-member-production-acceptance.yml');
  canonicalId(baseline.member.id);canonicalId(baseline.member.attempt);sha40(baseline.member.source);sha40(baseline.member.tree);assert.equal(baseline.member.runtimeSource,baseline.source,'Member verifier identity must name the actual retained H runtime separately');
 }
 for(const role of baselineRunRoles(baseline)){canonicalId(baseline[role].id);canonicalId(baseline[role].attempt);}
 const specs={};for(const [name,script,config]of [['core','shift-core','wrangler.jsonc'],['hq','shift-hq-management','wrangler.hq-management.jsonc']]){
  const row=baseline.workers[name],owner=split&&name==='hq'?baseline.retainedHqRelease:baseline.release,expectedSource=split&&name==='hq'?owner.source:baseline.source;
  assert.equal(row.source,expectedSource);assert.equal(canonicalId(row.run),canonicalId(owner.id));assert.equal(canonicalId(row.attempt),canonicalId(owner.attempt));assert.equal(row.percentage,100);assert.equal(row.gpEnabled,true);if(name==='hq')assert.equal(row.partnersEnabled,true);
  assert.match(row.deploymentId||'',uuid);assert.match(row.versionId||'',uuid);for(const key of ['bundleSha256','allBindingsSha256','otherBindingsSha256'])sha64(row[key]);assert(Number.isSafeInteger(row.bundleBytes)&&row.bundleBytes>0);
  specs[name]={script,config,source:row.source,run:row.run,attempt:row.attempt,deployment:row.deploymentId,version:row.versionId};
 }return specs;
}
export function weekBinding(bindings){
 assert(Array.isArray(bindings));assert.equal(new Set(bindings.map(b=>b.name)).size,bindings.length,'Duplicate provider binding');
 const rows=bindings.filter(b=>b.name===WEEK_FLAG);assert(rows.length<=1,'Duplicate W flag');if(!rows.length)return {present:false};
 assert.deepEqual(Object.keys(rows[0]).sort(),['name','text','type']);assert.equal(rows[0].type,'plain_text','Existing W flag must be observable plain text');assert(['false','true'].includes(rows[0].text),'Existing W flag must have an explicit boolean string');return {present:true,type:'plain_text',text:rows[0].text};
}
export function assertAcceptedProvider(snapshot,expected,accepted,{hq=false}={}){
 const proof=assertActivated(snapshot,expected,{hq});const bindings=snapshot.version.resources.bindings;
 assert.equal(proof.allBindingsSha256,accepted.allBindingsSha256,'Actual full inventory must match the accepted owner receipt');
 assert.equal(bindingHash(bindings.filter(b=>b.name!=='MEMBER_GP_DIRECTORY_V2_ENABLED')),accepted.otherBindingsSha256,'Actual accepted protected binding inventory changed');
 if(hq)return proof;
 return {...proof,weekBindingBefore:weekBinding(bindings),protectedBeforeBindingsSha256:bindingHash(bindings.filter(b=>b.name!==WEEK_FLAG))};
}
export function assertRecordedWeekProvider(snapshot,expected,protectedBeforeBindingsSha256){
 const proof=assertActivated(snapshot,expected);const bindings=snapshot.version.resources.bindings,flag=weekBinding(bindings);assert.equal(flag.present,true);assert.equal(flag.text,'true','W must be explicitly ON');
 const otherBindingsSha256=bindingHash(bindings.filter(b=>b.name!==WEEK_FLAG));assert.equal(otherBindingsSha256,protectedBeforeBindingsSha256,'Only the W flag may differ from the actual accepted Core inventory');
 return {...proof,weekEnabled:true,otherBindingsSha256};
}
export function assertWeekPrepared(prepared,before,accepted){
 const beforeProof=assertAcceptedProvider(before,{deployment:before.deployment.id,version:before.version.id},accepted);
 assertRecordedWeekProvider({deployment:{id:before.deployment.id,versions:[{version_id:prepared.version.id,percentage:100}]},version:prepared.version},{deployment:before.deployment.id,version:prepared.version.id},beforeProof.protectedBeforeBindingsSha256);
 const previous=structuredClone(before),isolated=structuredClone(prepared);
 for(const row of [previous,isolated])row.version.resources.bindings=row.version.resources.bindings.filter(b=>b.name!==WEEK_FLAG);
 assertPrepared(isolated,previous);return beforeProof;
}
export function assertLane(run,{source,runId,attempt}={}){
 assert.equal(canonicalId(run.id),canonicalId(runId));assert.equal(canonicalId(run.run_attempt),canonicalId(attempt));assert.equal(run.head_sha,source);assert.equal(run.head_branch,LANE.branch);assert.equal(run.path,LANE.workflow);assert.equal(run.event,'push');assert.equal(run.repository.full_name,LANE.repository);
}
export function assertCompletedBaselineRun(run,baseline,role){
 assert(baselineRunRoles(baseline).includes(role));const expected=baseline[role];
 assert.equal(canonicalId(run.id),canonicalId(expected.id));assert.equal(canonicalId(run.run_attempt),canonicalId(expected.attempt));assert.equal(run.head_sha,role==='release'?baseline.source:expected.source);
 if(baseline.acceptanceMode===SPLIT_CODE_ACCEPTANCE)assert.equal(run.name,expected.name);
 assert.equal(run.path,expected.workflow);assert.equal(run.head_branch,expected.branch);assert.equal(run.repository.full_name,LANE.repository);assert.equal(run.event,'push');assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');
}
export function assertCoreWrite(script,path,method){assert.equal(script,'shift-core','HQ is retained; provider writes are Core only');assert.equal(path,'/deployments');assert.equal(method,'POST');}
export function assertPreparedWindow(preparedAt,now=Date.now()){const at=Date.parse(preparedAt);assert(Number.isFinite(at)&&at<=now&&now-at<300000,'Fresh five-minute prepared provider window required');}
export function assertRollbackPredecessor(owned,spec){assert.equal(owned.previousDeploymentId,spec.deployment);assert.equal(owned.previousVersionId,spec.version,'Rollback must target the captured Core predecessor');}

// The sidecar is authenticated by the native W kernel before every forward
// phase. It is read dynamically; no H source/run/provider tuple is invented.
export async function execute(phase){
 const env=process.env,source=env.GITHUB_SHA,run=canonicalId(env.GITHUB_RUN_ID),attempt=canonicalId(env.GITHUB_RUN_ATTEMPT);sha40(source);
 assert.equal(env.GITHUB_REF,'refs/heads/'+LANE.branch);assert.equal(env.GITHUB_REPOSITORY,LANE.repository);assert.equal(env.GITHUB_EVENT_NAME,'push');assert.equal(env.GITHUB_JOB,'release');
 const baseline=JSON.parse(readFileSync(BASELINE_PATH,'utf8')),specs=recordedWeekPredecessors(baseline),main=baseline.coordinatingMainAtAcceptance;
 const out='recorded-week-direct-runtime-release';mkdirSync(out,{recursive:true});
 const save=(name,value)=>writeFileSync(out+'/'+name+'.json',JSON.stringify(value,null,2)+'\n');
 const load=name=>JSON.parse(readFileSync(out+'/'+name+'.json','utf8'));
 const git=(...args)=>execFileSync('/usr/bin/git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6}).trim();
 const cli=(config,args,timeout=180000)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config',config],{encoding:'utf8',maxBuffer:64e6,timeout});
 assert.equal(JSON.parse(readFileSync('node_modules/wrangler/package.json','utf8')).version,'4.112.0','Retain the original production compiler');
 const headers={Authorization:'Bearer '+env.CLOUDFLARE_API_TOKEN};assert(env.CLOUDFLARE_API_TOKEN);assert.match(env.CLOUDFLARE_ACCOUNT_ID||'',/^[a-f0-9]{32}$/);assert(env.GITHUB_TOKEN);
 const gh=createRecordedWeekGithubGet({token:env.GITHUB_TOKEN});
 async function api(script,path,{method='GET',body}={}){
  if(method!=='GET')assertCoreWrite(script,path,method);
  const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+env.CLOUDFLARE_ACCOUNT_ID+'/workers/scripts/'+script+path,{method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
  assert(r.ok,'Provider request failed: '+method+' '+path+' '+r.status);const j=await r.json();assert.equal(j.success,true,'Provider rejected request');return j.result;
 }
 async function current(spec){const deployment=latestDeployment((await api(spec.script,'/deployments')).deployments);const version=await api(spec.script,'/versions/'+deployment.versions[0].version_id);return {deployment,version};}
 async function sourceGuard(){
  assert.equal(git('rev-parse','HEAD'),source);assert.equal(git('diff','--name-only','HEAD','--'),'');assert.equal(git('diff','--cached','--name-only','HEAD','--'),'');
  assertLane(await gh('/actions/runs/'+run),{source,runId:run,attempt});assert.equal((await gh('/git/ref/heads/'+LANE.branch)).object.sha,source,'Release branch moved');assert.equal((await gh('/git/ref/heads/main')).object.sha,main,'Coordinating main moved');
  const record=JSON.parse(readFileSync('release/approved-runtime-composition.json','utf8')).myTimberRecordedWeekActivation20261014;
  const {verifyRecordedWeekDirect}=await import('./recorded-week-direct-scope-20261016.mjs');assert.equal(verifyRecordedWeekDirect(record),record);assert.deepEqual(record.acceptedBaseline,baseline);assert.equal(record.base,baseline.source);assert.equal(record.baseTree,baseline.tree);
 }
 async function baselineRuns(){
  for(const role of baselineRunRoles(baseline)){const expected=baseline[role],r=await gh('/actions/runs/'+expected.id+'/attempts/'+expected.attempt);assertCompletedBaselineRun(r,baseline,role);}
 }
 function snapshotStock(){
  const tables={};for(const table of ['medicine_products','medicine_variants','medicine_inventory']){const value=JSON.parse(cli('wrangler.jsonc',['d1','execute','DB','--remote','--json','--command','SELECT * FROM '+table+' ORDER BY '+(table==='medicine_inventory'?'variant_id':'id')]));assert(value.length&&value.every(r=>r.success));const rows=value.flatMap(r=>r.results||[]);tables[table]={rows:rows.length,sha256:sha(JSON.stringify(rows))};}
  return {tables,configurationSha256:Object.fromEntries(['wrangler.jsonc','wrangler.coaching.jsonc','wrangler.hq-management.jsonc'].map(p=>[p,sha(readFileSync(p))]))};
 }
 function directoryReady(){const value=JSON.parse(cli('wrangler.jsonc',['d1','execute','DB','--remote','--json','--command','SELECT a.version,v.complete FROM gp_directory_active AS a JOIN gp_directory_versions AS v ON v.version=a.version WHERE a.singleton=1']));assert(value.length&&value.every(r=>r.success));const rows=value.flatMap(r=>r.results||[]);assert.equal(rows.length,1);assert.equal(rows[0].version,'672021e21d318162d9aa550f');assert.equal(rows[0].complete,1);return {...rows[0],checkedAt:new Date().toISOString(),productionWrites:0};}
 function journalGuard(j){assert.equal(j.schema,'shift-recorded-week-direct-owned-release/v1');assert.equal(j.source,source);assert.equal(j.run,run);assert.equal(j.attempt,attempt);assert.equal(j.tree,git('rev-parse','HEAD^{tree}'));assert.deepEqual(j.baseline,baseline);assert.equal(j.main,main);assert.deepEqual(Object.keys(j.workers).sort(),['core','hq']);assert(Object.keys(j.owned).every(k=>k==='core'));}
 async function exactBundle(spec,id){
  const latest=async()=>{const items=(await api(spec.script,'/versions?per_page=20')).items;assert(Array.isArray(items)&&items.length);return [...items].sort((a,b)=>Date.parse(b.metadata.created_on)-Date.parse(a.metadata.created_on))[0];};
  assert.equal((await latest()).id,id,'Latest upload is not the exact version; content attribution unavailable');
  const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+env.CLOUDFLARE_ACCOUNT_ID+'/workers/scripts/'+spec.script+'/content/v2',{headers,signal:AbortSignal.timeout(30000)});assert(r.ok);assert(r.headers.get('content-type')?.startsWith('multipart/form-data'));const module=r.headers.get('cf-entrypoint');assert(module&&!module.includes('/')&&!module.includes('..'));
  const parts=await r.formData(),files=[...parts].filter(([,value])=>typeof value!=='string');assert.equal(files.length,1,'Unexpected compiled modules require exact additional proof');const part=parts.get(module);assert(part&&typeof part.arrayBuffer==='function');const bytes=Buffer.from(await part.arrayBuffer());assert.equal((await latest()).id,id,'Latest upload moved during exact content read');return {module,bytes:bytes.length,sha256:sha(bytes),at:new Date().toISOString(),attribution:'Exact latest version before and after whole content read'};
 }
 async function acceptedCurrent(name){const s=await current(specs[name]);const proof=assertAcceptedProvider(s,specs[name],baseline.workers[name],{hq:name==='hq'});return {snapshot:s,proof};}
 async function retainedHq(j){const {snapshot}=await acceptedCurrent('hq');assert.deepEqual(snapshot,j.workers.hq.before,'Retained HQ provider metadata changed');assert.equal(digest(await api(specs.hq.script,'/script-settings')),j.workers.hq.settingsSha256,'Retained HQ settings changed');const bundle=await exactBundle(specs.hq,specs.hq.version);assert.equal(bundle.sha256,baseline.workers.hq.bundleSha256);assert.equal(bundle.bytes,baseline.workers.hq.bundleBytes);return snapshot;}
 if(phase==='prepare'){
  await sourceGuard();await baselineRuns();
  const j={schema:'shift-recorded-week-direct-owned-release/v1',source,tree:git('rev-parse','HEAD^{tree}'),run,attempt,branch:LANE.branch,workflow:LANE.workflow,main,baseline,at:new Date().toISOString(),stock:snapshotStock(),workers:{},owned:{},trafficWrites:0,dataWrites:0};
  for(const name of ['core','hq']){const {snapshot,proof}=await acceptedCurrent(name),settings=await api(specs[name].script,'/script-settings');assert.equal(settings.observability?.redact_query_string,true,'Existing query redaction must remain enabled');const bundle=await exactBundle(specs[name],specs[name].version);assert.equal(bundle.sha256,baseline.workers[name].bundleSha256);assert.equal(bundle.bytes,baseline.workers[name].bundleBytes);j.workers[name]={before:snapshot,settingsSha256:digest(settings),bundleBefore:bundle,...proof};save('journal',j);}
  await sourceGuard();await retainedHq(j);const {snapshot:before}=await acceptedCurrent('core');assert.deepEqual(before,j.workers.core.before);assertStock(j.stock,snapshotStock());j.directoryBefore=directoryReady();
  const dir=out+'/bundle-core';mkdirSync(dir,{recursive:true});
  const result=cli(specs.core.config,['versions','upload','--keep-vars','--outdir',dir,'--tag','recorded-week-'+run+'-'+attempt,'--message','Factual recorded week exact source '+source+' run '+run+' attempt '+attempt],300000);writeFileSync(out+'/upload-core.log',result);
  const ids=[...result.matchAll(/(?:Worker )?Version ID:\s*([a-f0-9-]{36})/g)];assert.equal(ids.length,1,'One exact owned Core upload required');const id=ids[0][1],version=await api(specs.core.script,'/versions/'+id),bundle=await exactBundle(specs.core,id),bytes=readFileSync(dir+'/'+bundle.module),local={bytes:bytes.length,sha256:sha(bytes)};
  assertWeekPrepared({version,bundle,local},before,baseline.workers.core);j.workers.core.prepared={versionId:id,version,bundle,local};save('journal',j);
  await acceptedCurrent('core');await retainedHq(j);assertStock(j.stock,snapshotStock());j.directoryAfterUpload=directoryReady();j.preparedAt=new Date().toISOString();save('journal',j);save('prepared',{source,run,attempt,status:'core_week_upload_verified_not_deployed',hqRetained:true,trafficWrites:0,dataWrites:0});
 }else if(phase==='deploy'){
  const j=load('journal');journalGuard(j);assertPreparedWindow(j.preparedAt);await sourceGuard();await baselineRuns();await retainedHq(j);const {snapshot:before}=await acceptedCurrent('core');assert.deepEqual(before,j.workers.core.before);assertStock(j.stock,snapshotStock());directoryReady();
  const prepared=j.workers.core.prepared;assert(prepared);assertWeekPrepared(prepared,before,baseline.workers.core);assert.equal(digest(await api(specs.core.script,'/script-settings')),j.workers.core.settingsSha256);await sourceGuard();await retainedHq(j);await acceptedCurrent('core');assertPreparedWindow(j.preparedAt);
  const message='Factual recorded week '+source+' run '+run+' attempt '+attempt;j.intent={key:'core',versionId:prepared.versionId,message,at:new Date().toISOString()};save('journal',j);
  const deployment=await api(specs.core.script,'/deployments',{method:'POST',body:{strategy:'percentage',versions:[{version_id:prepared.versionId,percentage:100}],annotations:{'workers/message':message}}});
  const owned={kind:'owned_runtime_deployment',source,run,attempt,deploymentId:deployment.id,versionId:prepared.versionId,previousDeploymentId:specs.core.deployment,previousVersionId:specs.core.version,at:new Date().toISOString(),dataRestored:false};j.owned.core=owned;j.trafficWrites++;delete j.intent;save('journal',j);save('owned-core',owned);assertOwned((await current(specs.core)).deployment,owned,source,run,attempt);
 }else if(phase==='verify'){
  const j=load('journal');journalGuard(j);await sourceGuard();await retainedHq(j);const s=await current(specs.core),owned=j.owned.core;assert(owned);assertRollbackPredecessor(owned,specs.core);assertOwned(s.deployment,owned,source,run,attempt);const binding=assertRecordedWeekProvider(s,{deployment:owned.deploymentId,version:owned.versionId},j.workers.core.protectedBeforeBindingsSha256);assert.equal(binding.allBindingsSha256,bindingHash(j.workers.core.prepared.version.resources.bindings));assert.equal(digest(await api(specs.core.script,'/script-settings')),j.workers.core.settingsSha256);const bundle=await exactBundle(specs.core,owned.versionId);assert.equal(bundle.sha256,j.workers.core.prepared.local.sha256);assert.equal(bundle.bytes,j.workers.core.prepared.local.bytes);
  const checks=[];for(const path of ['/v1/member/treatment/week?sources=treatment','/v1/member/details/gp-search?q=London','/v1/hq/management/gp-directory']){const r=await fetch('https://api.shiftsometimber.co.uk'+path,{headers:{Origin:path.includes('/hq/')?'https://hq.shiftsometimber.co.uk':'https://api.shiftsometimber.co.uk'},redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(r.status,401,'Private factual W/GP route requires authentication');checks.push({path,status:r.status});await r.body?.cancel();}
  assertStock(j.stock,snapshotStock());await retainedHq(j);assertOwned((await current(specs.core)).deployment,owned,source,run,attempt);const directory=directoryReady(),mainAfter=(await gh('/git/ref/heads/main')).object.sha;assert.equal(mainAfter,main);
  const result={schema:'shift-recorded-week-direct-runtime-receipt/v1',status:'recorded_week_provider_verified',source,tree:j.tree,run,attempt,branch:LANE.branch,workflow:LANE.workflow,releaseBranch:LANE.branch,releaseWorkflow:LANE.workflow,releaseRun:Number(run),main,ownership:{mainBefore:main,mainAfter},at:new Date().toISOString(),weekEnabled:true,gpEnabled:true,...baselineGpStatus(baseline),workers:{core:{source,run:Number(run),attempt:Number(attempt),deploymentId:owned.deploymentId,versionId:owned.versionId,percentage:100,bundleSha256:bundle.sha256,bundleBytes:bundle.bytes,allBindingsSha256:binding.allBindingsSha256,otherBindingsSha256:binding.otherBindingsSha256,baselineAllBindingsSha256:baseline.workers.core.allBindingsSha256,protectedBeforeBindingsSha256:j.workers.core.protectedBeforeBindingsSha256,weekBindingBefore:j.workers.core.weekBindingBefore,weekEnabled:true,gpEnabled:true},hq:{...baseline.workers.hq,retained:true}},directory,anonymousBoundary:checks,settingsSha256:{core:j.workers.core.settingsSha256,hq:j.workers.hq.settingsSha256},protectedStock:j.stock,trafficWrites:j.trafficWrites,dataWrites:0,externalMessages:0,featureAcceptance:false,authenticatedMemberAndHqAcceptance:'separate original factual W fictional-holder gate; not claimed here'};save('runtime-receipt',result);console.log(JSON.stringify(result));
 }else if(phase==='rollback'){
  const j=load('journal');journalGuard(j);const errors=[];
  try{if(j.intent&&!j.owned.core){assert.equal(j.intent.key,'core');const intent=j.intent,s=await current(specs.core);if(s.deployment.versions[0].version_id!==specs.core.version){assert.equal(s.deployment.annotations?.['workers/message'],intent.message,'Ambiguous write is not this exact persisted intent');assert.deepEqual(s.deployment.versions,[{version_id:intent.versionId,percentage:100}]);assert(Date.parse(s.deployment.created_on)>=Date.parse(intent.at));j.owned.core={kind:'owned_runtime_deployment',source,run,attempt,deploymentId:s.deployment.id,versionId:intent.versionId,previousDeploymentId:specs.core.deployment,previousVersionId:specs.core.version,at:new Date().toISOString(),recoveredFromExactPersistedIntent:true,dataRestored:false};save('journal',j);}}}catch(error){errors.push({stage:'ambiguous_intent',error:String(error.message)});}
  const restored=await settleOwnedCleanup(Object.keys(j.owned),async key=>{assert.equal(key,'core');const owned=j.owned.core;assertRollbackPredecessor(owned,specs.core);const s=await current(specs.core);if(s.deployment.versions[0].version_id===specs.core.version){assertAcceptedProvider(s,{deployment:s.deployment.id,version:specs.core.version},baseline.workers.core);return {key,action:'retain',versionId:specs.core.version};}assertOwned(s.deployment,owned,source,run,attempt);const d=await api(specs.core.script,'/deployments',{method:'POST',body:{strategy:'percentage',versions:[{version_id:specs.core.version,percentage:100}],annotations:{'workers/message':'Owned factual W '+run+' failed; restore exact captured Core predecessor; preserve all current data'}}});const after=await current(specs.core);assertAcceptedProvider(after,{deployment:d.id,version:specs.core.version},baseline.workers.core);assert.deepEqual(after.version,j.workers.core.before.version);return {key,action:'restore',versionId:specs.core.version,deploymentId:d.id};});
  for(const name of ['core','hq'])try{assert.equal(digest(await api(specs[name].script,'/script-settings')),j.workers[name].settingsSha256);}catch(error){errors.push({stage:'settings_after_rollback',key:name,error:String(error.message)});}
  try{await retainedHq(j);}catch(error){errors.push({stage:'retained_hq_after_rollback',error:String(error.message)});}let stockAfter;try{stockAfter=snapshotStock();assertStock(j.stock,stockAfter);}catch(error){errors.push({stage:'stock_after_rollback',error:String(error.message)});}
  save('rollback',{source,run,attempt,at:new Date().toISOString(),restored,errors,stockAfter,hqRetained:true,dataRestored:false,releaseVerified:false});assert(!errors.length&&restored.every(row=>row.action!=='refused_or_failed'),'Owned rollback unresolved; inspect retained original evidence');
 }else throw Error('Unknown finite recorded-week release phase');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await execute(process.argv[2]);
