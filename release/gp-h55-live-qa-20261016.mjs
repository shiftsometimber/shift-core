import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,readdirSync,realpathSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {LANE,PREDECESSORS,latestDeployment,assertOwned} from '../../runtime/release/gp-priority-direct-owned-release-20261016.mjs';

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
export const TARGET_RUNTIME_SOURCE='e9491c2686105afc465d1c94e37e5cef63240e11';
export const TARGET_RUNTIME_TREE='c3db6341f2b6c20dcda0eede3eb5fa3dc91a8611';
export const GP_ACTIVATION_SOURCE='55b73025f5b6d2302fab42bce73a222653404186';
export const GP_ACTIVATION_TREE='550bec05b5dbf98bb31eed006b2158f73b4ee79f';
export const CURRENT_CORE_BRANCH='fix/questionnaire-handover-20261016';
export const CURRENT_CORE_WORKFLOW='.github/workflows/questionnaire-handover-release-20261016.yml';
export const CURRENT_CORE_RUN=38980756381,ACTIVATION_RUN=38974318146;
export function assertCurrentCoreRun(run,{terminal=true}={}){
 assert.equal(run.head_sha,TARGET_RUNTIME_SOURCE);assert.equal(run.head_branch,CURRENT_CORE_BRANCH);assert.equal(run.path,CURRENT_CORE_WORKFLOW);assert.equal(run.name,'Questionnaire Handover Nonclinical Release');
 assert.equal(run.event,'push');assert.equal(run.head_repository?.full_name,repository);assert.equal(run.id,CURRENT_CORE_RUN);assert.equal(run.html_url,'https://github.com/'+repository+'/actions/runs/'+run.id);assert(Number.isSafeInteger(run.run_attempt)&&run.run_attempt>0);
 if(terminal){assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');}return run;
}
export function assertCompositeReceipts({code,codeRun,activation,activationRun}){
 assertCurrentCoreRun(codeRun);assertOwnedOnReceipt(activation,activationRun,GP_ACTIVATION_SOURCE,GP_ACTIVATION_TREE);
 assert.equal(code.schema,'shift-questionnaire-runtime-receipt/v1');assert.equal(code.source,TARGET_RUNTIME_SOURCE);assert.equal(code.tree,TARGET_RUNTIME_TREE);assert.equal(code.branch,CURRENT_CORE_BRANCH);assert.equal(code.workflow,CURRENT_CORE_WORKFLOW);assert.equal(code.releaseBranch,CURRENT_CORE_BRANCH);assert.equal(code.releaseWorkflow,CURRENT_CORE_WORKFLOW);assert.equal(code.releaseRun,codeRun.id);
 assert.equal(String(code.run),String(codeRun.id));assert.equal(String(code.attempt),String(codeRun.run_attempt));assert.equal(code.main,activation.main);assert.equal(code.ownership.mainBefore,code.main);assert.equal(code.ownership.mainAfter,code.main);
 assert.equal(code.status,'code_only_verified');assert.equal(code.gpEnabled,true);assert.equal(code.partnerContractActivated,false);assert.equal(code.partnerTestPassed,false);assert.equal(code.featureAcceptance,false);assert.equal(code.dataWrites,0);assert.equal(code.externalMessages,0);assert.deepEqual(Object.keys(code.workers),['core']);
 const core=code.workers.core;assert.equal(core.source,TARGET_RUNTIME_SOURCE);assert.equal(core.run,codeRun.id);assert.equal(core.attempt,codeRun.run_attempt);uuid(core.deploymentId);uuid(core.versionId);assert.equal(core.percentage,100);assert.equal(core.gpEnabled,true);assert.equal(core.bundleSha256,'19092d5b673c5fb8201ebda993d0ae373a206eee57fd334598a36a58f33730f3');assert.equal(core.bundleBytes,14775946);assert.equal(core.allBindingsSha256,activation.workers.core.allBindingsSha256);assert.equal(core.otherBindingsSha256,activation.workers.core.otherBindingsSha256);
 const privateChecks=code.anonymousBoundary.filter(row=>row.privateDenialVerified);assert.equal(privateChecks.length,4);assert.deepEqual(privateChecks.map(r=>[r.origin,r.path,r.status]).sort(),['https://shiftsometimber.co.uk','https://api.shiftsometimber.co.uk'].flatMap(origin=>['/v1/member/details','/v1/member/details/gp-search'].map(path=>[origin,path,401])).sort());
 assert.equal(code.anonymousBoundary.filter(r=>r.exactCompiledResponse===true&&r.status===200).length,3);
 return{schema:'shift-gp-current-composite/v1',source:TARGET_RUNTIME_SOURCE,tree:TARGET_RUNTIME_TREE,main:code.main,workers:{core,hq:activation.workers.hq},code,codeRun,activation,activationRun};
}
function inverseLiteral(value,edits){
 for(const [before,after,count=1]of [...edits].reverse()){
  if(count==='suffix'){assert(value.endsWith(after),'Exact original QA workflow suffix required');value=value.slice(0,-after.length);}
  else{assert.equal(value.split(after).length-1,count,'Every bounded inverse must be unique and complete');value=value.split(after).join(before);}
 }return value;
}
export function assertQaFileInverses(){
 const policy=JSON.parse(readFileSync(resolve(verifierRoot,'release/gp-h55-live-qa-policy-20261016.json'),'utf8'));
 for(const name of ['helper','runner']){const row=policy[name],body=readFileSync(resolve(verifierRoot,row.path),'utf8');assert.equal(hash(body),row.sha256,'Frozen QA '+name+' hash changed');const original=inverseLiteral(body,row.wholeInverse);assert.equal(hash(original),row.originalSha256,'Every original '+name+' assertion and control must remain');const path=name==='helper'?'release/gp-directory-live-20261015.mjs':'release/gp-member-directory-activation-live-20261016.mjs';assert.equal(original,readFileSync(resolve(verifierRoot,'../runtime',path),'utf8'),'Original runtime QA donor differs');}
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
 assert.equal(manifest.runtimeSource,TARGET_RUNTIME_SOURCE);assert.equal(manifest.runtimeTree,TARGET_RUNTIME_TREE);assert.equal(manifest.schema,'shift-gp-h55-ui-verifier-policy/v1');
 const expected=['.github/workflows/rendered-member-production-acceptance.yml','release/gp-h55-live-qa-20261016.mjs','release/gp-directory-live-h55-qa-20261016.mjs','release/gp-h55-live-qa-policy-20261016.json','tests/gp-h55-live-qa-20261016.test.mjs'];
 assert.deepEqual([...manifest.paths].sort(),expected.sort());assert.deepEqual(native(verifierRoot,'diff','--no-ext-diff','--no-textconv','--no-renames','--name-only',TARGET_RUNTIME_SOURCE,source,'--').split('\n').filter(Boolean).sort(),expected.sort(),'Only the finite QA verifier files may differ from H55');
 for(const path of expected){const bytes=readFileSync(resolve(verifierRoot,path)),nativeBytes=execFileSync('/usr/bin/git',['--no-replace-objects','--no-optional-locks','-C',verifierRoot,'show',source+':'+path],{maxBuffer:64e6});assert.equal(hash(bytes),hash(nativeBytes));}
 return{source,tree:native(verifierRoot,'rev-parse','HEAD^{tree}'),branch:QA_BRANCH,workflow:QA_WORKFLOW,run:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,overlaySha256:manifest.helper.sha256};
}
function actualSource(){
 actualVerifier();assert.equal(realpathSync(process.cwd()),realpathSync(resolve(verifierRoot,'../runtime')),'Use the independently checked-out H55 runtime directory');
 const source=native(process.cwd(),'rev-parse','HEAD');assert.equal(source,TARGET_RUNTIME_SOURCE);assert.equal(native(process.cwd(),'rev-parse','HEAD^{tree}'),TARGET_RUNTIME_TREE);
 assert.equal(native(process.cwd(),'status','--porcelain','--untracked-files=no'),'');
 const admitted=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',"import {verifyQuestionnaireSource} from './release/questionnaire-handover-source-20261016.mjs'; console.log(JSON.stringify(verifyQuestionnaireSource()))"],{encoding:'utf8',maxBuffer:1e6}));assert.equal(admitted.source,source);assert.equal(admitted.tree,TARGET_RUNTIME_TREE);
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
 const source=actualSource(),tree=git('rev-parse','HEAD^{tree}');
 const proof=JSON.parse(readFileSync(join(directory,'owned-on-proof.json'),'utf8'));
 const run=JSON.parse(readFileSync(join(directory,'owned-on-run.json'),'utf8'));
 const activationRun=JSON.parse(readFileSync(join(directory,'owned-activation-run.json'),'utf8'));
 const codeBytes=readFileSync(proof.code.path,'utf8'),activationBytes=readFileSync(proof.activation.path,'utf8');assert.equal(hash(codeBytes),proof.code.sha256);assert.equal(hash(activationBytes),proof.activation.sha256);
 const runtime=assertCompositeReceipts({code:JSON.parse(codeBytes),codeRun:run,activation:JSON.parse(activationBytes),activationRun});
 const current=assertCurrentCoreRun(await api('/actions/runs/'+run.id));assert.equal(current.run_attempt,run.run_attempt);assert.equal(assertOwnedOnRun(await api('/actions/runs/'+activationRun.id),GP_ACTIVATION_SOURCE).run_attempt,activationRun.run_attempt);
 const finished=Date.parse(current.updated_at);assert(Number.isFinite(finished)&&finished<=Date.now(),'Retain the true historical terminal; fresh current ownership remains separately required before each fixture');
 const oidc=process.env.SHIFT_COMMISSIONING_OIDC;assert(oidc,'Existing allowed-workflow commissioning identity required');
 const{chromium}=createRequire(resolve(process.cwd(),'package.json'))('playwright');const{commissioningLogin}=await import('../../runtime/rendered-member-acceptance-support.mjs');const{verifyGpDirectoryLive,verifyGpIsolationFromExistingHolder}=await import('./gp-directory-live-h55-qa-20261016.mjs');
 assert.equal(typeof chromium.launch,'function');assert.equal(typeof commissioningLogin,'function');assert.equal(typeof verifyGpDirectoryLive,'function');assert.equal(typeof verifyGpIsolationFromExistingHolder,'function');
 const site='https://shiftsometimber.co.uk',apiOrigin='https://api.shiftsometimber.co.uk';
 const first={email:'shiftsometimber+structured-growth-'+randomUUID()+'@gmail.com',password:'SST-GP-'+randomUUID()+'-Aa1!'};
 const second={email:'shiftsometimber+structured-progressstory-'+Date.now()+'-desktop@gmail.com',password:'SST-GP-'+randomUUID()+'-Aa1!'};
 for(const fixture of [first,second]){console.log('::add-mask::'+fixture.email);console.log('::add-mask::'+fixture.password);}
 const report={schema:'shift-gp-h55-member-qa-live/v1',runtimeSource:source,verifier:actualVerifier(),historicalRuntimeTerminalAt:current.updated_at,currentOwnershipRequired:true,at:new Date().toISOString(),source,commit:source,tree,run:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,ownedReleaseRun:run.id,ownedReleaseAttempt:run.run_attempt,unchangedHqActivationRun:activationRun.id,coreSource:source,hqSource:GP_ACTIVATION_SOURCE,synthetic:true,realCustomerRecordsRead:false,checks:[],status:'running',featureAcceptance:false,notificationsSent:0,realCustomerWrites:0,commissioningIdentity:'github_actions_oidc',genuineHqHolderAcceptance:false};
 async function create(fixture){
  const serving=await assertCurrentOwnedOn(runtime,run,source);
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
  page=await verifyGpDirectoryLive({page,site,api:apiOrigin,email:first.email,dir:directory,report,runtimeSource:source,clinicalConnectionExpectedInactive:runtime.code.partnerContractActivated===false,freshSession:async()=>{
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
  const isolation=await verifyGpIsolationFromExistingHolder({page:otherPage,site,api:apiOrigin,email:second.email,runtimeSource:source});
  assert.equal(isolation.status,'pass');assert.equal(isolation.source,source);assert.equal(isolation.actualDistinctAccounts,true);assert.equal(isolation.ownGpUnchanged,true);assert.equal(isolation.firstHolderMarkerAbsent,true);assert.equal(isolation.hqSignedInAcceptance,false);
  report.checks.push({requirement:'Actual second fictional holder isolation',...isolation});
  report.servingAfter=await assertCurrentOwnedOn(runtime,run,source);
  assert.equal(git('rev-parse','HEAD'),source);assert.equal(git('status','--porcelain','--untracked-files=no'),'');
  report.gpSettingsAndIsolationAcceptance=true;
  const clinical=report.checks.find(row=>row.requirement==='Original positive GP reuse in clinical assessment');assert(clinical,'Original clinical GP reuse case must remain explicitly accounted for');report.clinicalAssessmentReuseAcceptance=clinical.status==='pass';
  if(clinical.status==='blocked'){report.status='blocked_by_clinical_activation';report.featureAcceptance=false;const error=new Error('Live GP settings and two-holder isolation passed. Original positive clinical assessment GP reuse remains BLOCKED by retained clinical activation/selection controls; no clinical, stock, sales or original assertion bypass.');error.clinicalGate=true;throw error;}
  assert.equal(clinical.status,'pass');assert.equal(clinical.originalPositiveAssertionsExecuted,true);report.status='pass';report.featureAcceptance=true;
 }catch(error){report.status=error.clinicalGate?'blocked_by_clinical_activation':'failed';report.error=String(error?.message||error);for(const fixture of [first,second])report.error=report.error.replaceAll(fixture.email,'[synthetic]').replaceAll(fixture.password,'[redacted]');throw error;}
 finally{writeFileSync(join(directory,'gp-h55-member-qa-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
 console.log('PASS actual GP lookup, selection, save/reopen and two-fictional-holder isolation; genuine signed-in HQ holder acceptance remains separate');
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const mode=process.argv[2];
 if(mode==='--wait-on')await waitForOn();
 else if(mode==='--verify-on')await verifyOn();
 else throw Error('Explicit --wait-on or --verify-on required');
}
