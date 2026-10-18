import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,readdirSync,realpathSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {LANE,PREDECESSORS,latestDeployment,assertOwned,digest} from '../../runtime/release/questionnaire-handover-owned-release-20261016.mjs';

export const GP_ON_BRANCH='release/gp-priority-direct-activation-20261016';
export const GP_ON_WORKFLOW='.github/workflows/gp-priority-direct-activation-20261016.yml';
const repository='shiftsometimber/shift-core';
const directory='growth-member-live-evidence';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('/usr/bin/git',['--no-replace-objects','--no-optional-locks',...args],{encoding:'utf8'}).trim();
const sha40=value=>assert.match(value||'',/^[a-f0-9]{40}$/);
const sha64=value=>assert.match(value||'',/^[a-f0-9]{64}$/);
const uuid=value=>assert.match(value||'',/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i);
export const QA_BRANCH='verification/gp-direct-h55-live-20261016';
export const QA_WORKFLOW='.github/workflows/rendered-member-production-acceptance.yml';
export const TARGET_RUNTIME_SOURCE='0e4a765e7a360d705e2424264e0bcfcc1d6652be';
const HISTORICAL_Q_SOURCE='e9491c2686105afc465d1c94e37e5cef63240e11',HISTORICAL_Q_TREE='c3db6341f2b6c20dcda0eede3eb5fa3dc91a8611';
export const TARGET_RUNTIME_TREE='1ea393678bcc4caed8e6ae08984ad1212a3dce49';
export const GP_ACTIVATION_SOURCE='55b73025f5b6d2302fab42bce73a222653404186';
export const GP_ACTIVATION_TREE='550bec05b5dbf98bb31eed006b2158f73b4ee79f';
export const CURRENT_CORE_BRANCH='fix/questionnaire-handover-20261016';
export const CURRENT_CORE_WORKFLOW='.github/workflows/questionnaire-handover-release-20261016.yml';
export const CURRENT_CORE_RUN=38980756381,ACTIVATION_RUN=38974318146;
export function assertCurrentCoreRun(run,{terminal=true}={}){
 assert.equal(run.head_sha,HISTORICAL_Q_SOURCE);assert.equal(run.head_branch,CURRENT_CORE_BRANCH);assert.equal(run.path,CURRENT_CORE_WORKFLOW);assert.equal(run.name,'Questionnaire Handover Nonclinical Release');
 assert.equal(run.event,'push');assert.equal(run.head_repository?.full_name,repository);assert.equal(run.id,CURRENT_CORE_RUN);assert.equal(run.html_url,'https://github.com/'+repository+'/actions/runs/'+run.id);assert(Number.isSafeInteger(run.run_attempt)&&run.run_attempt>0);
 if(terminal){assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');}return run;
}
export function assertCompositeReceipts({code,codeRun,activation,activationRun}){
 assertCurrentCoreRun(codeRun);assertOwnedOnReceipt(activation,activationRun,GP_ACTIVATION_SOURCE,GP_ACTIVATION_TREE);
 assert.equal(code.schema,'shift-questionnaire-runtime-receipt/v1');assert.equal(code.source,HISTORICAL_Q_SOURCE);assert.equal(code.tree,HISTORICAL_Q_TREE);assert.equal(code.branch,CURRENT_CORE_BRANCH);assert.equal(code.workflow,CURRENT_CORE_WORKFLOW);assert.equal(code.releaseBranch,CURRENT_CORE_BRANCH);assert.equal(code.releaseWorkflow,CURRENT_CORE_WORKFLOW);assert.equal(code.releaseRun,codeRun.id);
 assert.equal(String(code.run),String(codeRun.id));assert.equal(String(code.attempt),String(codeRun.run_attempt));assert.equal(code.main,activation.main);assert.equal(code.ownership.mainBefore,code.main);assert.equal(code.ownership.mainAfter,code.main);
 assert.equal(code.status,'code_only_verified');assert.equal(code.gpEnabled,true);assert.equal(code.partnerContractActivated,false);assert.equal(code.partnerTestPassed,false);assert.equal(code.featureAcceptance,false);assert.equal(code.dataWrites,0);assert.equal(code.externalMessages,0);assert.deepEqual(Object.keys(code.workers),['core']);
 const core=code.workers.core;assert.equal(core.source,HISTORICAL_Q_SOURCE);assert.equal(core.run,codeRun.id);assert.equal(core.attempt,codeRun.run_attempt);uuid(core.deploymentId);uuid(core.versionId);assert.equal(core.percentage,100);assert.equal(core.gpEnabled,true);assert.equal(core.bundleSha256,'19092d5b673c5fb8201ebda993d0ae373a206eee57fd334598a36a58f33730f3');assert.equal(core.bundleBytes,14775946);assert.equal(core.allBindingsSha256,activation.workers.core.allBindingsSha256);assert.equal(core.otherBindingsSha256,activation.workers.core.otherBindingsSha256);
 const privateChecks=code.anonymousBoundary.filter(row=>row.privateDenialVerified);assert.equal(privateChecks.length,4);assert.deepEqual(privateChecks.map(r=>[r.origin,r.path,r.status]).sort(),['https://shiftsometimber.co.uk','https://api.shiftsometimber.co.uk'].flatMap(origin=>['/v1/member/details','/v1/member/details/gp-search'].map(path=>[origin,path,401])).sort());
 assert.equal(code.anonymousBoundary.filter(r=>r.exactCompiledResponse===true&&r.status===200).length,3);
 return{schema:'shift-gp-current-composite/v1',source:HISTORICAL_Q_SOURCE,tree:HISTORICAL_Q_TREE,main:code.main,workers:{core,hq:activation.workers.hq},code,codeRun,activation,activationRun};
}
export function inverseLiteral(value,edits){
 for(const [before,after,count=1]of [...edits].reverse()){
  if(count==='suffix'){assert(value.endsWith(after),'Exact original QA workflow suffix required');value=value.slice(0,-after.length);}
  else{assert.equal(value.split(after).length-1,count,'Every bounded inverse must be unique and complete');value=value.split(after).join(before);}
 }return value;
}
export function assertQaFileInverses(){
 const policy=JSON.parse(readFileSync(resolve(verifierRoot,'release/gp-h55-live-qa-policy-20261016.json'),'utf8'));
 for(const name of ['helper','runner']){const row=policy[name],body=readFileSync(resolve(verifierRoot,row.path),'utf8');assert.equal(hash(body),row.sha256,'Frozen QA '+name+' hash changed');const original=inverseLiteral(body,row.wholeInverse);assert.equal(hash(original),row.originalSha256,'Every original '+name+' assertion and control must remain');const path=name==='helper'?'release/gp-directory-live-20261015.mjs':'release/gp-member-directory-activation-live-20261016.mjs';assert.equal(original,originalGpDonor(path),'Original native B6 QA donor differs');}
 const restored=inverseLiteral(readFileSync(resolve(verifierRoot,QA_WORKFLOW),'utf8'),policy.workflowInverse);assert.equal(restored,readFileSync(resolve(verifierRoot,'../runtime',QA_WORKFLOW),'utf8'),'Every original workflow command and authority remains exact');return{originalAssertionsAndCommandsRetained:true,providerWrites:0};
}
const verifierRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const native=(dir,...args)=>execFileSync('/usr/bin/git',['--no-replace-objects','--no-optional-locks','-C',dir,...args],{encoding:'utf8',env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0'},maxBuffer:64e6}).trim();
export function assertQaIdentity(run,{source,runId,attempt}){
 sha40(source);assert.equal(run.head_sha,source);assert.equal(run.head_branch,QA_BRANCH);assert.equal(run.path,QA_WORKFLOW);assert.equal(run.event,'push');assert.equal(run.head_repository.full_name,repository);
 assert.equal(String(run.id),String(runId));assert.equal(String(run.run_attempt),String(attempt));assert(Number.isSafeInteger(run.id)&&run.id>0);assert(Number.isSafeInteger(run.run_attempt)&&run.run_attempt>0);return run;
}
function actualVerifier(){
 assert.equal(process.env.GITHUB_REPOSITORY,repository);assert.equal(process.env.GITHUB_REF,'refs/heads/'+QA_BRANCH);assert.equal(process.env.GITHUB_EVENT_NAME,'push');
 const source=process.env.GITHUB_SHA;sha40(source);assert.equal(native(verifierRoot,'rev-parse','HEAD'),source);
 assert.equal(native(verifierRoot,'status','--porcelain','--untracked-files=no'),'');
 assertQaFileInverses();
 const manifest=JSON.parse(readFileSync(resolve(verifierRoot,'release/gp-h55-live-qa-policy-20261016.json'),'utf8'));
 assert.equal(manifest.runtimeSource,TARGET_RUNTIME_SOURCE);assert.equal(manifest.runtimeTree,TARGET_RUNTIME_TREE);assert.equal(manifest.schema,'shift-gp-h55-ui-verifier-policy/v1');assertAcceptedUtilityMode(manifest);assertAcceptedUtilityRuntime();
 const expected=['.github/workflows/rendered-member-production-acceptance.yml','release/gp-h55-live-qa-20261016.mjs','release/gp-directory-live-h55-qa-20261016.mjs','release/gp-h55-live-qa-policy-20261016.json','tests/gp-h55-live-qa-20261016.test.mjs'];
 assert.deepEqual([...manifest.paths].sort(),expected.sort());assert.deepEqual(native(verifierRoot,'diff','--no-ext-diff','--no-textconv','--no-renames','--name-only',TARGET_RUNTIME_SOURCE,source,'--').split('\n').filter(Boolean).sort(),expected.sort(),'Only the finite QA verifier files may differ from H55');
 for(const path of expected){const bytes=readFileSync(resolve(verifierRoot,path)),nativeBytes=execFileSync('/usr/bin/git',['--no-replace-objects','--no-optional-locks','-C',verifierRoot,'show',source+':'+path],{maxBuffer:64e6});assert.equal(hash(bytes),hash(nativeBytes));}
 return{source,tree:native(verifierRoot,'rev-parse','HEAD^{tree}'),branch:QA_BRANCH,workflow:QA_WORKFLOW,run:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,overlaySha256:manifest.helper.sha256};
}

import {assertProvider} from '../../runtime/release/questionnaire-handover-owned-release-20261016.mjs';
import {verifiedOwnedRuntime} from '../../runtime/shift-coach/cancelled-release-recovery.mjs';
import {readRecordedWeekCurrentWitness,PRESERVED_CURRENT_RUNTIME} from '../../runtime/release/accepted-current-runtime-starting-point-20261017.mjs';

export const QUALIFIED_CANDIDATE='b138e845ce63542d8d1847400b67ccd0eba23877';
export const ACCEPTED_UTILITY_PR=1380;
export const ACCEPTED_UTILITY_CORE_BASE='5e640279d2a0db1bd578e67269456a1575c5476f';

function modePolicy(){return JSON.parse(readFileSync(resolve(verifierRoot,'release/gp-h55-live-qa-policy-20261016.json'),'utf8'));}
export function assertAcceptedUtilityMode(policy,{source=TARGET_RUNTIME_SOURCE,tree=TARGET_RUNTIME_TREE,qualified=QUALIFIED_CANDIDATE,pr=ACCEPTED_UTILITY_PR,coreBase=ACCEPTED_UTILITY_CORE_BASE}={}){
 assert.equal(policy.activationReady,true,'Prepared GP mode cannot create fixtures before actual accepted utility runtime exists');assert.equal(policy.mode,'gp-settings-on-accepted-utility');assert.equal(policy.runtimeSource,source);assert.equal(policy.runtimeTree,tree);assert.equal(policy.qualifiedCandidate,qualified);assert.equal(policy.acceptedUtilityPr,pr);assert.equal(policy.acceptedUtilityCoreBase,coreBase);return policy;
}

export function assertAcceptedUtilityRuntime(){
 assertAcceptedUtilityMode(modePolicy());
 const root=resolve(verifierRoot,'../runtime'),path='member-experience/chrome.mjs';
 const patch='19cd0cd57021dc10a9e155eec5e84b2a9a31ed57',base='98d584e167fc0785ee791891d763e504286ee603';
 assert.equal(native(root,'rev-parse','HEAD'),TARGET_RUNTIME_SOURCE);
 assert.equal(native(root,'rev-parse','HEAD^{tree}'),TARGET_RUNTIME_TREE);
 assert.equal(native(root,'status','--porcelain','--untracked-files=no'),'');
 assert.equal(native(root,'rev-parse',patch+'^'),base);
 assert.equal(native(root,'rev-parse',patch+'^{tree}'),'dc364d21319e1e3127125ff5c503e366c3a7c76f');
 assert.deepEqual(native(root,'diff','--no-renames','--name-only',base,patch).split('\n'),[path]);
 assert.equal(native(root,'rev-parse',ACCEPTED_UTILITY_CORE_BASE+'^{tree}'),'b36237f7ffc91a11e8aa35ea99d2d6f7bd443b89');
 native(root,'merge-base','--is-ancestor',base,ACCEPTED_UTILITY_CORE_BASE);
 native(root,'merge-base','--is-ancestor',ACCEPTED_UTILITY_CORE_BASE,TARGET_RUNTIME_SOURCE);
 const read=ref=>execFileSync('/usr/bin/git',['--no-replace-objects','-C',root,'show',ref+':'+path],{encoding:'utf8'});
 const before=read(base),corrected=read(patch),actual=read(TARGET_RUNTIME_SOURCE);
 assert.equal(hash(before),'842e80408c00464c3cec28d1d800c1abe575ecb49808d8ee2d558831875b27df');
 assert.equal(hash(corrected),'d6563886e01c36decf747596e54cb04b0e93e398642b3cd04ccb0ad83962b2af');
 const rule='html body[data-member-chrome="v1"] #memberUtilities #askTimberLaunch{position:relative!important}\n';
 assert.equal(corrected.split(rule).length,2);assert.equal(corrected.replace(rule,''),before);
 assert.equal(actual,corrected,'Whole exact independently qualified member utility correction required');
 assert.equal(readFileSync(resolve(root,path),'utf8'),actual,'No working-tree CSS substitution');
 return {source:TARGET_RUNTIME_SOURCE,tree:TARGET_RUNTIME_TREE,patch,wholeFileInverse:true};
}

export function originalGpNativeContract(){
 const row=modePolicy().originalGpContract;assert.equal(row.source,'b6f9c0c36d4303e5d384fb2d62b58968b998aa64');assert.equal(row.path,'release/gp-directory-live-contract-20261015.mjs');
 const root=resolve(verifierRoot,'../runtime');assert.equal(native(root,'rev-parse',row.source+':'+row.path),row.blob);const body=execFileSync('/usr/bin/git',['--no-replace-objects','-C',root,'show',row.source+':'+row.path]);assert.equal(hash(body),row.sha256,'Whole unchanged native original GP contract required');assert.equal(createHash('sha1').update('blob '+body.length+'\0').update(body).digest('hex'),row.blob);return body.toString('base64');
}
function originalGpDonor(path){
 const policy=modePolicy(),row=policy.originalGpDonors[path];assert(row&&row.source==='b6f9c0c36d4303e5d384fb2d62b58968b998aa64');const root=resolve(verifierRoot,'../runtime');const body=execFileSync('/usr/bin/git',['--no-replace-objects','-C',root,'show',row.source+':'+path]);assert.equal(hash(body),row.sha256);assert.equal(createHash('sha1').update('blob '+body.length+'\0').update(body).digest('hex'),row.blob);return body.toString('utf8');
}
function readNormalMainGpBaseline(){const bytes=readRecordedWeekCurrentWitness();assert.equal(hash(bytes),PRESERVED_CURRENT_RUNTIME.receiptSHA256);const original=JSON.parse(bytes);assert.equal(original.gpAssessmentReuse.status,'blocked_contract_inactive');return original;}
export function assertMainOwnership(active,run,job,receipt,source){
 assert.equal(run.head_sha,source);assert.equal(run.run_attempt,Number(receipt.attempt||run.run_attempt));assert.equal(verifiedOwnedRuntime(active,run,job,receipt),true,'Original normal-main ownership validator must pass');return receipt;
}
async function currentProvider(script){
 const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;assert.match(account||'',/^[a-f0-9]{32}$/);assert(token);
 const request=async path=>{const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+'/workers/scripts/'+script+path,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});assert.equal(r.status,200);const b=await r.json();assert.equal(b.success,true);return b.result;};
 const deployment=latestDeployment((await request('/deployments')).deployments),version=await request('/versions/'+deployment.versions[0].version_id);
 return{deployment,version,request};
}
async function currentMainRuntime({withBundle=false}={}){
 const started=Date.now();actualVerifier();assertQaIdentity(await api('/actions/runs/'+process.env.GITHUB_RUN_ID),{source:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT});
 assert.equal((await api('/git/ref/heads/'+QA_BRANCH)).object.sha,process.env.GITHUB_SHA);assert.equal((await api('/git/ref/heads/main')).object.sha,TARGET_RUNTIME_SOURCE);
 const pr=await api('/pulls/'+ACCEPTED_UTILITY_PR);assert.equal(pr.merged,true);assert.equal(pr.head.sha,QUALIFIED_CANDIDATE);assert.equal(pr.merge_commit_sha,TARGET_RUNTIME_SOURCE);
 const candidates=(await api('/actions/workflows/cloudflare-production-promote.yml/runs?branch=main&event=push&per_page=20')).workflow_runs.filter(r=>r.head_sha===TARGET_RUNTIME_SOURCE&&r.status==='completed'&&r.conclusion==='success');
 assert(candidates.length,'Original normal-main production checks must all have completed successfully');const run=candidates.sort((a,b)=>b.id-a.id)[0];
 const jobs=(await api('/actions/runs/'+run.id+'/jobs')).jobs.filter(j=>j.name==='promote'&&j.status==='completed'&&j.conclusion==='success');assert.equal(jobs.length,1);const job=jobs[0];
 const token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN;const response=await fetch('https://api.github.com/repos/'+repository+'/actions/jobs/'+job.id+'/logs',{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(30000)});assert.equal(response.status,200);const logs=await response.text();
 const receipts=logs.split('\n').flatMap(line=>{const n=line.indexOf('{"kind":"owned_runtime_deployment"');if(n<0)return[];try{return[JSON.parse(line.slice(n))]}catch{return[]}});
 const core=await currentProvider('shift-core'),hq=await currentProvider('shift-hq-management'),matches=receipts.filter(r=>verifiedOwnedRuntime(core.deployment,run,job,r));assert.equal(matches.length,1);assertMainOwnership(core.deployment,run,job,matches[0],TARGET_RUNTIME_SOURCE);
 const witnessBytes=readRecordedWeekCurrentWitness();assert.equal(hash(witnessBytes),PRESERVED_CURRENT_RUNTIME.receiptSHA256);const witness=JSON.parse(witnessBytes),retained=witness.workers.hq;
 const cp=assertProvider(core,{deployment:matches[0].deploymentId,version:matches[0].versionId,gpEnabled:true}),hp=assertProvider(hq,{deployment:retained.deploymentId,version:retained.versionId,gpEnabled:true},{hq:true});
 assert.equal(cp.bindingsSha256,witness.workers.core.allBindingsSha256,'All genuinely serving W configuration remains exact');assert.equal(hp.bindingsSha256,retained.allBindingsSha256);assertOwned(hq.deployment,retained,retained.source,retained.run,retained.attempt);
 assert.equal(core.version.resources.bindings.find(b=>b.name==='MY_TIMBER_WEEK_VIEW_ENABLED')?.text,'true');const publicMetadata={source:TARGET_RUNTIME_SOURCE,run:run.id,attempt:run.run_attempt,deploymentId:core.deployment.id,versionId:core.version.id,percentage:100,allBindingsSha256:cp.bindingsSha256};
 if(withBundle){
  const latest=async()=>[...(await core.request('/versions?per_page=20')).items].sort((a,b)=>Date.parse(b.metadata.created_on)-Date.parse(a.metadata.created_on))[0];
  assert.equal((await latest()).id,core.version.id,'Original content ownership control: latest upload must be active version');
  const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID+'/workers/scripts/shift-core/content/v2',{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(30000)});assert.equal(r.status,200);assert(r.headers.get('content-type')?.startsWith('multipart/form-data'));
  const entry=r.headers.get('cf-entrypoint');assert(entry&&!entry.includes('/')&&!entry.includes('..'));const parts=await r.formData();assert.equal([...parts].filter(([,p])=>typeof p!=='string').length,1);const part=parts.get(entry);assert(part&&typeof part.arrayBuffer==='function');const bytes=Buffer.from(await part.arrayBuffer());assert.equal((await latest()).id,core.version.id);
  publicMetadata.bundleSha256=hash(bytes);publicMetadata.bundleBytes=bytes.length;
 }
 assert.equal((await api('/git/ref/heads/main')).object.sha,TARGET_RUNTIME_SOURCE);assert(Date.now()-started<=300000,'Original five-minute current ownership window retained');
 return{at:new Date().toISOString(),source:TARGET_RUNTIME_SOURCE,tree:TARGET_RUNTIME_TREE,main:TARGET_RUNTIME_SOURCE,workers:{core:publicMetadata,hq:retained},run,job:job.id,receipt:matches[0],originalPromoteLogSha256:hash(logs),originalW:{source:witness.source,run:witness.run,receiptSHA256:hash(witnessBytes)},verifier:actualVerifier()};
}

function actualSource(){
 actualVerifier();assert.equal(realpathSync(process.cwd()),realpathSync(resolve(verifierRoot,'../runtime')),'Use the independently checked-out H55 runtime directory');
 const source=native(process.cwd(),'rev-parse','HEAD');assert.equal(source,TARGET_RUNTIME_SOURCE);assert.equal(native(process.cwd(),'rev-parse','HEAD^{tree}'),TARGET_RUNTIME_TREE);
 assert.equal(native(process.cwd(),'status','--porcelain','--untracked-files=no'),'');
 assertAcceptedUtilityRuntime();
 for(const row of native(process.cwd(),'ls-files','-v','-z').split('\0').filter(Boolean))assert(row.startsWith('H '),'Hidden tracked H55 runtime refused');
 return source;
}
export function assertOwnedOnRun(run,source,{terminal=true}={}){
 sha40(source);assert.equal(run.head_sha,source);assert.equal(run.head_branch,GP_ON_BRANCH);
 assert.equal(run.path,GP_ON_WORKFLOW);assert.equal(run.name,'GP Priority Direct Directory Activation');
 assert.equal(run.event,'push');assert.equal(run.head_repository?.full_name,repository);
 assert(Number.isSafeInteger(run.id)&&run.id>0);assert(Number.isSafeInteger(run.run_attempt)&&run.run_attempt>0);
 assert.equal(run.html_url,'https://github.com/'+repository+'/actions/runs/'+run.id);
 if(terminal){assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');}
 return run;
}
export function assertOwnedOnReceipt(receipt,run,source,tree){
 assertOwnedOnRun(run,source);sha40(tree);
 assert.equal(receipt.schema,'shift-gp-direct-activation-receipt/v1');
 assert.equal(receipt.source,source);assert.equal(receipt.tree,tree);
 assert.equal(String(receipt.run),String(run.id));assert.equal(String(receipt.attempt),String(run.run_attempt));
 assert.equal(receipt.releaseBranch,GP_ON_BRANCH);assert.equal(receipt.releaseWorkflow,GP_ON_WORKFLOW);assert.equal(String(receipt.releaseRun),String(run.id));
 sha40(receipt.main);assert.equal(receipt.ownership.mainBefore,receipt.main);assert.equal(receipt.ownership.mainAfter,receipt.main);
 assert.equal(receipt.status,'directory_activated_provider_verified');assert.equal(receipt.dataWrites,0);assert.equal(receipt.externalMessages,0);assert.equal(receipt.featureAcceptance,false);
 for(const name of ['core','hq']){
  const row=receipt.workers[name];assert.equal(row.source,source);assert.equal(String(row.run),String(run.id));assert.equal(String(row.attempt),String(run.run_attempt));
  uuid(row.deploymentId);uuid(row.versionId);assert.equal(row.percentage,100);assert.equal(row.gpEnabled,true);
  sha64(row.bundleSha256);assert(Number.isSafeInteger(row.bundleBytes)&&row.bundleBytes>0);sha64(row.allBindingsSha256);sha64(row.otherBindingsSha256);
 }
 assert.equal(receipt.workers.hq.partnersEnabled,true);assert.equal(receipt.gpEnabled,true);assert.equal(receipt.directory.version,'672021e21d318162d9aa550f');assert.equal(receipt.directory.complete,1);assert.equal(receipt.directory.productionWrites,0);
 return receipt;
}
async function api(path){
 const token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN;assert(token,'Existing Actions read credential required');
 const response=await fetch('https://api.github.com/repos/'+repository+path,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(30000)});
 assert.equal(response.status,200,'Owned GP release metadata unavailable');return response.json();
}
async function providerDeployments(script){
 const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
 assert.match(account||'',/^[a-f0-9]{32}$/);assert(token,'Existing read-only provider guard credential required');
 const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+'/workers/scripts/'+script+'/deployments',{method:'GET',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
 assert.equal(response.status,200,'Actual owned provider deployment unavailable');const body=await response.json();assert.equal(body.success,true);return body.result.deployments;
}
export async function assertCurrentOwnedOn(receipt,run,source,{readProvider=providerDeployments,readGithub=api}={}){
 const startedAt=new Date().toISOString(),checkStarted=Date.now();actualSource();assertQaIdentity(await readGithub('/actions/runs/'+process.env.GITHUB_RUN_ID),{source:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT});
 assert.equal((await readGithub('/git/ref/heads/'+QA_BRANCH)).object.sha,process.env.GITHUB_SHA,'QA verifier branch moved');
 assert.equal(receipt.main,LANE.main,'Original coordinating main identity changed');
 assert.equal((await readGithub('/git/ref/heads/main')).object.sha,receipt.main,'Current main moved before member proof');
 assertCompositeReceipts(receipt);assert.equal(run.id,receipt.codeRun.id);
 assert.equal((await readGithub('/git/ref/heads/'+GP_ON_BRANCH)).object.sha,GP_ACTIVATION_SOURCE,'Historical GP activation branch moved');
 assert.equal((await readGithub('/git/ref/heads/'+CURRENT_CORE_BRANCH)).object.sha,source,'Actual Core release branch moved');
 const currentCore=assertCurrentCoreRun(await readGithub('/actions/runs/'+receipt.codeRun.id));assert.equal(currentCore.run_attempt,receipt.codeRun.run_attempt);const currentActivation=assertOwnedOnRun(await readGithub('/actions/runs/'+receipt.activationRun.id),GP_ACTIVATION_SOURCE);assert.equal(currentActivation.run_attempt,receipt.activationRun.run_attempt);
 const actual={};
 for(const name of ['core','hq']){
  const active=latestDeployment(await readProvider(PREDECESSORS[name].script));
  const row=receipt.workers[name];assertOwned(active,row,row.source,row.run,row.attempt);
  actual[name]={deploymentId:active.id,versionId:active.versions[0].version_id,percentage:active.versions[0].percentage};
 }
 const proof={startedAt,at:new Date().toISOString(),source,main:receipt.main,workers:actual,verifier:actualVerifier()};const elapsed=Date.now()-checkStarted;assert(elapsed>=0&&elapsed<=300000,'Actual owned provider/source proof must be current within five minutes from first read');return proof;
}
function jsonFiles(root){return readdirSync(root,{withFileTypes:true}).flatMap(row=>row.isDirectory()?jsonFiles(join(root,row.name)):row.isFile()&&row.name.endsWith('.json')?[join(root,row.name)]:[]);}
async function waitForOn(){
 const source=actualSource(),started=Date.now();mkdirSync(directory,{recursive:true});
 let codeRun;
 while(Date.now()-started<1200000){codeRun=assertCurrentCoreRun(await api('/actions/runs/'+CURRENT_CORE_RUN),{terminal:false});if(codeRun.status==='completed'){assertCurrentCoreRun(codeRun);break;}await new Promise(resolve=>setTimeout(resolve,10000));}
 assert(codeRun?.status==='completed'&&codeRun.conclusion==='success','Actual current Core release did not succeed inside the original finite20-minute wait');
 const activationRun=assertOwnedOnRun(await api('/actions/runs/'+ACTIVATION_RUN),GP_ACTIVATION_SOURCE);
 async function receipt(run,name,schema){
  const artifacts=(await api('/actions/runs/'+run.id+'/artifacts')).artifacts.filter(row=>row.name===name&&!row.expired);assert.equal(artifacts.length,1);assert(artifacts[0].size_in_bytes>0);assert.match(artifacts[0].digest||'',/^sha256:[a-f0-9]{64}$/);
  const target=join(directory,'owned-'+run.id);mkdirSync(target,{recursive:true});execFileSync('gh',['run','download',String(run.id),'--repo',repository,'--name',name,'--dir',target],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
  const rows=jsonFiles(target).map(path=>({path,bytes:readFileSync(path,'utf8')})).map(row=>({...row,value:JSON.parse(row.bytes)})).filter(row=>row.value.schema===schema);assert.equal(rows.length,1);return{path:rows[0].path,sha256:hash(rows[0].bytes),artifact:artifacts[0].id,artifactDigest:artifacts[0].digest,value:rows[0].value};
 }
 const code=await receipt(codeRun,'questionnaire-runtime-release-'+codeRun.id,'shift-questionnaire-runtime-receipt/v1'),activation=await receipt(activationRun,'gp-direct-directory-activation-'+activationRun.id,'shift-gp-direct-activation-receipt/v1');
 assertCompositeReceipts({code:code.value,codeRun,activation:activation.value,activationRun});
 assert.equal(assertCurrentCoreRun(await api('/actions/runs/'+codeRun.id)).run_attempt,codeRun.run_attempt);assert.equal(assertOwnedOnRun(await api('/actions/runs/'+activationRun.id),GP_ACTIVATION_SOURCE).run_attempt,activationRun.run_attempt);
 writeFileSync(join(directory,'owned-on-run.json'),JSON.stringify(codeRun,null,2)+'\n');writeFileSync(join(directory,'owned-activation-run.json'),JSON.stringify(activationRun,null,2)+'\n');
 delete code.value;delete activation.value;writeFileSync(join(directory,'owned-on-proof.json'),JSON.stringify({source,tree:TARGET_RUNTIME_TREE,code,activation},null,2)+'\n');
 console.log('PASS actual accepted Q Core and unchanged H HQ receipts; original timestamps preserved; authenticated member proof has not run');
}
async function verifyOn(){
 const source=actualSource(),tree=git('rev-parse','HEAD^{tree}'),baseline=readNormalMainGpBaseline();
 const runtime={...await currentMainRuntime({withBundle:true}),gpAssessmentReuse:baseline.gpAssessmentReuse},run=runtime.run,current=run;const finished=assertFreshWindow(runtime.at);
 const activationRun=assertOwnedOnRun(await api('/actions/runs/'+baseline.workers.hq.run),GP_ACTIVATION_SOURCE);assert.equal(activationRun.run_attempt,baseline.workers.hq.attempt);
 const oidc=process.env.SHIFT_COMMISSIONING_OIDC;assert(oidc,'Existing allowed-workflow commissioning identity required');
 const{chromium}=createRequire(resolve(process.cwd(),'package.json'))('playwright');const{commissioningLogin}=await import('../../runtime/rendered-member-acceptance-support.mjs');const{verifyGpDirectoryLive,verifyGpIsolationFromExistingHolder}=await import('./gp-directory-live-h55-qa-20261016.mjs');
 assert.equal(typeof chromium.launch,'function');assert.equal(typeof commissioningLogin,'function');assert.equal(typeof verifyGpDirectoryLive,'function');assert.equal(typeof verifyGpIsolationFromExistingHolder,'function');
 const{compiledTreatmentAssets}=await import('../../runtime/release/my-treatment-compiled-control.mjs');
 const compiled=await compiledTreatmentAssets();assert.equal(compiled.source,source);assert.equal(compiled.bundleSha256,runtime.workers.core.bundleSha256,'Actual W CI whole bundle must match the configured local compiler before any fixture');
 const site='https://shiftsometimber.co.uk',apiOrigin='https://api.shiftsometimber.co.uk';
 const first={email:'shiftsometimber+structured-growth-'+randomUUID()+'@gmail.com',password:'SST-GP-'+randomUUID()+'-Aa1!'};
 const second={email:'shiftsometimber+structured-progressstory-'+Date.now()+'-desktop@gmail.com',password:'SST-GP-'+randomUUID()+'-Aa1!'};
 for(const fixture of [first,second]){console.log('::add-mask::'+fixture.email);console.log('::add-mask::'+fixture.password);}
 const report={schema:'shift-gp-h55-member-qa-live/v1',runtimeSource:source,verifier:actualVerifier(),historicalRuntimeTerminalAt:current.updated_at,currentOwnershipRequired:true,at:new Date().toISOString(),source,commit:source,tree,run:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,ownedReleaseRun:run.id,ownedReleaseAttempt:run.run_attempt,unchangedHqActivationRun:activationRun.id,coreSource:source,hqSource:GP_ACTIVATION_SOURCE,synthetic:true,realCustomerRecordsRead:false,checks:[],status:'running',featureAcceptance:false,notificationsSent:0,realCustomerWrites:0,commissioningIdentity:'github_actions_oidc',genuineHqHolderAcceptance:false};
 async function create(fixture){
  const serving=await assertCurrentOwnedWeek(runtime,run,source,baseline);assertFreshWindow(serving.at);
  report.checks.push({requirement:'Actual owned ON identity before fictional fixture',...serving});
  const registered=await fetch(apiOrigin+'/v1/auth/register',{method:'POST',headers:{Origin:site,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':oidc},body:JSON.stringify({email:fixture.email,password:fixture.password,firstName:'SyntheticGP',lastName:'Commissioning',phone:'07700 900123',dateOfBirth:'1980-01-01',postcode:'SW1A 1AA',source:'commissioning-growth-20260928'}),signal:AbortSignal.timeout(30000)});
  assert.equal(registered.status,201,'Original authorised fictional registration must succeed without fallback');
  assert.equal((await registered.json()).commissioningIdentity,'github_actions_oidc','Only the original validated no-email commissioning path is allowed');
 }
 const browser=await chromium.launch({headless:true});
 try{
  await create(first);
  let context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
  await commissioningLogin(page,{site,api:apiOrigin,oidc,email:first.email,password:first.password});
  const initial=await context.request.get(site+'/v1/member/details',{headers:{Origin:site,'Cache-Control':'no-cache'}});assert.equal(initial.status(),200);assert.equal((await initial.json()).gpDirectoryV2,true);
  page=await verifyGpDirectoryLive({page,site,api:apiOrigin,email:first.email,dir:directory,report,runtimeSource:source,clinicalConnectionExpectedInactive:runtime.gpAssessmentReuse.status==='blocked_contract_inactive',freshSession:async()=>{
   await context.request.post(apiOrigin+'/v1/auth/logout',{headers:{Origin:site,'Content-Type':'application/json'},data:{}});
   await context.close();context=await browser.newContext({viewport:{width:390,height:844}});page=await context.newPage();
   await commissioningLogin(page,{site,api:apiOrigin,oidc,email:first.email,password:first.password});return page;
  }});
  const firstFlow=report.checks.find(row=>row.requirement==='GP directory member flow');assert.equal(firstFlow.status,'pass');assert.notEqual(firstFlow.flagsOff,true);
  // This is the real first-holder result consumed by the unchanged second-holder
  // isolation assertion. Final two-holder acceptance is still pending here.
  writeFileSync(join(directory,'results.json'),JSON.stringify({...report,status:'pass',stage:'first_holder_gp_flow_passed_isolation_pending'},null,2)+'\n');
  await create(second);
  const other=await browser.newContext({viewport:{width:1440,height:1000}}),otherPage=await other.newPage();
  await commissioningLogin(otherPage,{site,api:apiOrigin,oidc,email:second.email,password:second.password});
  await otherPage.setViewportSize({width:390,height:900});
   const mobileIsolation=await verifyGpIsolationFromExistingHolder({page:otherPage,site,api:apiOrigin,email:second.email,runtimeSource:source});
   assert.equal(mobileIsolation.status,'pass');assert.equal(mobileIsolation.source,source);assert.equal(mobileIsolation.actualDistinctAccounts,true);assert.equal(mobileIsolation.ownGpUnchanged,true);assert.equal(mobileIsolation.firstHolderMarkerAbsent,true);assert.equal(mobileIsolation.hqSignedInAcceptance,false);
   report.checks.push({requirement:'Actual second fictional holder isolation at mobile width',width:390,...mobileIsolation});
   await otherPage.setViewportSize({width:1440,height:900});
  const isolation=await verifyGpIsolationFromExistingHolder({page:otherPage,site,api:apiOrigin,email:second.email,runtimeSource:source});
  assert.equal(isolation.status,'pass');assert.equal(isolation.source,source);assert.equal(isolation.actualDistinctAccounts,true);assert.equal(isolation.ownGpUnchanged,true);assert.equal(isolation.firstHolderMarkerAbsent,true);assert.equal(isolation.hqSignedInAcceptance,false);
  report.checks.push({requirement:'Actual second fictional holder isolation',...isolation});
  report.servingAfter=await assertCurrentOwnedWeek(runtime,run,source,baseline);assertFreshWindow(report.servingAfter.at);
  assert.equal(git('rev-parse','HEAD'),source);assert.equal(git('status','--porcelain','--untracked-files=no'),'');
  report.gpSettingsAndIsolationAcceptance=true;
  const clinical=report.checks.find(row=>row.requirement==='Original positive GP reuse in clinical assessment');assert(clinical,'Original clinical GP reuse case must remain explicitly accounted for');report.clinicalAssessmentReuseAcceptance=clinical.status==='pass';
  if(clinical.status==='blocked'){report.status='blocked_by_clinical_activation';report.featureAcceptance=false;const error=new Error('Live GP settings and two-holder isolation passed. Original positive clinical assessment GP reuse remains BLOCKED by retained clinical activation/selection controls; no clinical, stock, sales or original assertion bypass.');error.clinicalGate=true;throw error;}
  assert.equal(clinical.status,'pass');assert.equal(clinical.originalPositiveAssertionsExecuted,true);report.status='pass';report.featureAcceptance=true;
 }catch(error){report.status=error.clinicalGate?'blocked_by_clinical_activation':'failed';report.error=String(error?.message||error);for(const fixture of [first,second])report.error=report.error.replaceAll(fixture.email,'[synthetic]').replaceAll(fixture.password,'[redacted]');throw error;}
 finally{writeFileSync(join(directory,'gp-h55-member-qa-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
 console.log('PASS actual GP lookup, selection, save/reopen and two-fictional-holder isolation; genuine signed-in HQ holder acceptance remains separate');
}

export const W_BRANCH='release/factual-recorded-week-direct-20261016';
export const W_WORKFLOW='.github/workflows/factual-recorded-week-direct-release-20261016.yml';
export function assertFreshWindow(at,now=Date.now()){
 const finished=Date.parse(at);assert(Number.isFinite(finished)&&finished<=now&&now-finished<=900000,'Original fifteen-minute freshness limit retained for actual current ownership');return finished;
}
export function assertOwnedWeekRun(run,source,{terminal=true}={}){
 sha40(source);assert.equal(run.head_sha,source);assert.equal(run.head_branch,W_BRANCH);
 assert.equal(run.path,W_WORKFLOW);assert.equal(run.name,'Factual Recorded Week Direct Runtime Release');
 assert.equal(run.event,'push');assert.equal(run.head_repository?.full_name,repository);
 assert(Number.isSafeInteger(run.id)&&run.id>0);assert(Number.isSafeInteger(run.run_attempt)&&run.run_attempt>0);
 assert.equal(run.html_url,'https://github.com/'+repository+'/actions/runs/'+run.id);
 if(terminal){assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');}
 return run;
}
export function canonicalId(value){
 if(typeof value==='number'){assert(Number.isSafeInteger(value)&&value>0);return String(value);}
 assert.equal(typeof value,'string');assert.match(value,/^[1-9][0-9]*$/);assert(BigInt(value)<=BigInt(Number.MAX_SAFE_INTEGER));return value;
}
function readBaseline(){
 const baseline=JSON.parse(readFileSync('release/recorded-week-direct-baseline-20261016.json','utf8'));
 const c=JSON.parse(readFileSync('release/approved-runtime-composition.json','utf8')).myTimberRecordedWeekActivation20261014;
 assert.equal(c.proof,'EXACT_RECORDED_WEEK_DIRECT_ACCEPTED_BASE_20261016');assert.deepEqual(c.acceptedBaseline,baseline);
 assert.equal(c.base,baseline.source);assert.equal(c.baseTree,baseline.tree);return baseline;
}
export function assertWeekBeforeJournal(journal,receipt,baseline){
 assert.equal(journal.schema,'shift-recorded-week-direct-owned-release/v1');assert.equal(journal.source,receipt.source);assert.equal(journal.tree,receipt.tree);assert.equal(canonicalId(journal.run),canonicalId(receipt.run));assert.equal(canonicalId(journal.attempt),canonicalId(receipt.attempt));assert.equal(journal.branch,W_BRANCH);assert.equal(journal.workflow,W_WORKFLOW);assert.equal(journal.main,receipt.main);assert.deepEqual(journal.baseline,baseline);
 assert.equal(journal.dataWrites,0);assert.equal(journal.trafficWrites,1);assert.deepEqual(Object.keys(journal.owned).sort(),['core']);
 const owned=journal.owned.core;for(const key of ['source','deploymentId','versionId'])assert.equal(owned[key],receipt.workers.core[key]);for(const key of ['run','attempt'])assert.equal(canonicalId(owned[key]),canonicalId(receipt.workers.core[key]));
 const row=journal.workers.core,before=row.before;
 assert.equal(before.deployment.id,baseline.workers.core.deploymentId);assert.deepEqual(before.deployment.versions,[{version_id:baseline.workers.core.versionId,percentage:100}]);assert.equal(before.version.id,baseline.workers.core.versionId);
 const bindings=before.version.resources.bindings;assert(Array.isArray(bindings));assert.equal(new Set(bindings.map(b=>b.name)).size,bindings.length);
 const bindingHash=value=>digest(value.slice().sort((a,b)=>a.name.localeCompare(b.name)));
 const whole=bindingHash(bindings),protectedBefore=bindingHash(bindings.filter(b=>b.name!=='MY_TIMBER_WEEK_VIEW_ENABLED'));
 assert.equal(whole,baseline.workers.core.allBindingsSha256,'Actual whole before inventory must match the accepted H baseline');
 const flags=bindings.filter(b=>b.name==='MY_TIMBER_WEEK_VIEW_ENABLED');assert(flags.length<=1);let weekBefore={present:false};
 if(flags.length){assert.equal(flags[0].type,'plain_text');assert(['true','false'].includes(flags[0].text));weekBefore={present:true,type:'plain_text',text:flags[0].text};}else assert.equal(protectedBefore,whole);
 assert.equal(row.allBindingsSha256,whole);assert.equal(row.protectedBeforeBindingsSha256,protectedBefore);assert.deepEqual(row.weekBindingBefore,weekBefore);
 const core=receipt.workers.core;assert.equal(core.baselineAllBindingsSha256,whole);assert.equal(core.protectedBeforeBindingsSha256,protectedBefore);assert.deepEqual(core.weekBindingBefore,weekBefore);assert.equal(core.otherBindingsSha256,protectedBefore,'Every actual before binding except only the approved W flag must survive');return{whole,protectedBefore,weekBefore};
}
export function assertOwnedWeekReceipt(receipt,run,source,tree,baseline,journal){
 assertOwnedWeekRun(run,source);sha40(tree);
 assert.equal(baseline.schema,'direct-coding-completed-baseline-documents/v1');sha40(baseline.source);sha40(baseline.tree);
 assert.equal(receipt.schema,'shift-recorded-week-direct-runtime-receipt/v1');assert.equal(receipt.status,'recorded_week_provider_verified');
 assert.equal(receipt.source,source);assert.equal(receipt.tree,tree);assert.equal(canonicalId(receipt.run),canonicalId(run.id));assert.equal(canonicalId(receipt.attempt),canonicalId(run.run_attempt));
 assert.equal(receipt.branch,W_BRANCH);assert.equal(receipt.workflow,W_WORKFLOW);assert.equal(receipt.releaseBranch,W_BRANCH);assert.equal(receipt.releaseWorkflow,W_WORKFLOW);assert.equal(canonicalId(receipt.releaseRun),canonicalId(run.id));
 assert.equal(receipt.main,baseline.coordinatingMainAtAcceptance);assert.equal(receipt.main,LANE.main);assert.equal(receipt.ownership.mainBefore,receipt.main);assert.equal(receipt.ownership.mainAfter,receipt.main);
 assert.equal(receipt.weekEnabled,true);assert.equal(receipt.gpEnabled,true);assert.equal(receipt.dataWrites,0);assert.equal(receipt.externalMessages,0);assert.equal(receipt.featureAcceptance,false);
 if(baseline.acceptanceMode==='qualified_core_code_with_retained_gp_hq'){assert.equal(baseline.gpFeatureAcceptance,false);assert.equal(baseline.gpAssessmentReuse.status,'blocked_contract_inactive');assert.equal(receipt.gpFeatureAcceptance,false);assert.equal(receipt.gpAssessmentReuse.status,'blocked_contract_inactive');}
 const core=receipt.workers.core,hq=receipt.workers.hq;
 assert.equal(core.source,source);assert.equal(canonicalId(core.run),canonicalId(run.id));assert.equal(canonicalId(core.attempt),canonicalId(run.run_attempt));assert.equal(core.weekEnabled,true);assert.equal(core.gpEnabled,true);
 assertWeekBeforeJournal(journal,receipt,baseline);
 assert.equal(hq.retained,true);assert.equal(hq.source,baseline.workers.hq.source);assert.equal(canonicalId(hq.run),canonicalId(baseline.workers.hq.run));assert.equal(canonicalId(hq.attempt),canonicalId(baseline.workers.hq.attempt));assert.equal(hq.gpEnabled,true);assert.equal(hq.partnersEnabled,true);
 for(const key of ['deploymentId','versionId','bundleSha256','bundleBytes','allBindingsSha256','otherBindingsSha256'])assert.equal(hq[key],baseline.workers.hq[key],'Actual accepted H HQ must be retained byte/identity-exact');
 for(const row of [core,hq]){uuid(row.deploymentId);uuid(row.versionId);assert.equal(row.percentage,100);sha64(row.bundleSha256);sha64(row.allBindingsSha256);sha64(row.otherBindingsSha256);assert(Number.isSafeInteger(row.bundleBytes)&&row.bundleBytes>0);}
 return receipt;
}
export async function assertCurrentOwnedWeek(receipt,run,source,baseline){
 assert.equal(source,TARGET_RUNTIME_SOURCE);const actual=await currentMainRuntime();
 for(const name of ['core','hq'])for(const key of ['source','run','attempt','deploymentId','versionId','percentage','allBindingsSha256'])assert.equal(String(actual.workers[name][key]),String(receipt.workers[name][key]),'Actual owned current '+name+' '+key+' changed');
 const activation=assertOwnedOnRun(await api('/actions/runs/'+baseline.workers.hq.run),GP_ACTIVATION_SOURCE);assert.equal(activation.run_attempt,baseline.workers.hq.attempt);assert.equal((await api('/git/ref/heads/'+GP_ON_BRANCH)).object.sha,GP_ACTIVATION_SOURCE,'Historical H activation branch must remain exact');
 assert.equal(actual.run.id,run.id);assertFreshWindow(actual.at);return actual;
}
async function waitForWeek(){mkdirSync(directory,{recursive:true});actualSource();console.log('PASS separate actual accepted utility runtime native admission, current-main identity and complete original GP inverses; no fixture/provider write');}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const mode=process.argv[2];
 if(mode==='--wait-on')await waitForWeek();
 else if(mode==='--verify-on')await verifyOn();
 else throw Error('Explicit --wait-on or --verify-on required');
}
