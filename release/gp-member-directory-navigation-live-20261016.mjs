import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {latestDeployment,assertOwned,digest} from './gp-priority-direct-owned-release-20261016.mjs';
import {assertActivated} from './gp-priority-direct-activation-owned-20261016.mjs';
import {compiledTreatmentAssets} from './my-treatment-compiled-control.mjs';
export const RUNTIME_SOURCE='e9491c2686105afc465d1c94e37e5cef63240e11';
export const RUNTIME_TREE='c3db6341f2b6c20dcda0eede3eb5fa3dc91a8611';
export const HARNESS_BRANCH='verification/gp-member-navigation-20261016';
export const RELEASE_RUN=38980756381;
export const RELEASE_ATTEMPT=1;
export const ARTIFACT_ID=12080573216;
export const ARTIFACT_SHA='55d230a531bb7b73d0b1f46957ddfe3a31ee828249123fe35cbec798d606062e';
const repository='shiftsometimber/shift-core',directory='growth-member-live-evidence';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('/usr/bin/git',['--no-replace-objects','--no-optional-locks',...args],{encoding:'utf8',maxBuffer:64e6}).trim();
const PRESERVED_GP={"schema":"shift-gp-direct-activation-receipt/v1","source":"55b73025f5b6d2302fab42bce73a222653404186","tree":"550bec05b5dbf98bb31eed006b2158f73b4ee79f","run":"38974318146","attempt":"1","branch":"release/gp-priority-direct-activation-20261016","workflow":".github/workflows/gp-priority-direct-activation-20261016.yml","main":"3ab4dc5f8f47e44108f3f6d5503ffbac90b6adef","releaseBranch":"release/gp-priority-direct-activation-20261016","releaseWorkflow":".github/workflows/gp-priority-direct-activation-20261016.yml","releaseRun":38974318146,"ownership":{"mainBefore":"3ab4dc5f8f47e44108f3f6d5503ffbac90b6adef","mainAfter":"3ab4dc5f8f47e44108f3f6d5503ffbac90b6adef"},"at":"2026-10-16T22:41:15.740Z","gpEnabled":true,"workers":{"core":{"source":"55b73025f5b6d2302fab42bce73a222653404186","run":38974318146,"attempt":1,"deploymentId":"dcf7f63d-4d8b-4b9d-b18e-776d2ac400ed","versionId":"2a2f4483-1a43-4e9a-802e-4bdc118059be","percentage":100,"bundleSha256":"ae87bf8b39b394e4514529bcfb2a61e945c4fc588cea459fb8fcd0385f0b76a0","bundleBytes":14752486,"allBindingsSha256":"7bdb4b151b1f11fb23d9cdea06c0436c3b7f3246585c1212a8a75f9c6379c401","otherBindingsSha256":"f167ad0c4b62b5616bdc272e5c9af441c7d2193c915ab4b9ff099c8d126f4857","gpEnabled":true},"hq":{"source":"55b73025f5b6d2302fab42bce73a222653404186","run":38974318146,"attempt":1,"deploymentId":"f75c3309-afc7-49ca-aac2-7964bc5b7e42","versionId":"6eae4c43-fbc3-455e-a426-9bb7de344705","percentage":100,"bundleSha256":"bfadbda83e5b8dcb944b92cea15a13320b7a139c7be9afab98833ba04534e5e7","bundleBytes":1838527,"allBindingsSha256":"3b6704c920ad27ad9b9a16d1af27e9f382db7e9daa2fbc46e93d801492fb2f74","otherBindingsSha256":"e1479acdea3dac4d1faddb2ec5b99239f2ada00c70ba56fd497d99c687e3e261","gpEnabled":true,"partnersEnabled":true}},"dataWrites":0,"externalMessages":0,"featureAcceptance":false,"directory":{"version":"672021e21d318162d9aa550f","complete":1,"checkedAt":"2026-10-16T22:41:26.382Z","productionWrites":0},"anonymousBoundary":[{"path":"/v1/member/details/gp-search?q=London","status":401},{"path":"/v1/hq/management/gp-directory","status":401},{"path":"/v1/hq/management/people/1/gp-details","status":401}],"status":"directory_activated_provider_verified","authenticatedMemberAndHqAcceptance":"separate original GP ON fictional-holder gate; not claimed here"};
export function preservedGpReceipt(){return structuredClone(PRESERVED_GP);}
export function assertPreservedGpReceipt(value){assert.equal(hash(JSON.stringify(value)),'da759e859a6c541bcd0432c7f07571785b1aca2f96641863921eb813b79e726b','Original preserved HQ/GP receipt must remain exact');return value;}
function assertQuestionnaireRun(run,source){assert.equal(source,RUNTIME_SOURCE);assert.equal(run.id,RELEASE_RUN);assert.equal(run.run_attempt,RELEASE_ATTEMPT);assert.equal(run.head_sha,source);assert.equal(run.head_branch,'fix/questionnaire-handover-20261016');assert.equal(run.path,'.github/workflows/questionnaire-handover-release-20261016.yml');assert.equal(run.event,'push');assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');assert.equal(run.repository.full_name,repository);return run;}
export function assertNavigationRuntime(receipt,run){
 assert.equal(hash(JSON.stringify(receipt)),'17bd50cf787fce19fac56316f50742fcbf5b492614e54d43807182da8d0a0ae7','Entire current accepted questionnaire/GP runtime receipt must remain exact');assertQuestionnaireRun(run,RUNTIME_SOURCE);
 assert.equal(receipt.schema,'shift-questionnaire-runtime-receipt/v1');assert.equal(receipt.source,RUNTIME_SOURCE);assert.equal(receipt.tree,RUNTIME_TREE);assert.equal(receipt.status,'code_only_verified');assert.equal(receipt.partnerContractActivated,false);assert.equal(receipt.gpEnabled,true);assert.equal(receipt.dataWrites,0);assert.equal(receipt.externalMessages,0);assert.equal(receipt.featureAcceptance,false);assert.equal(receipt.workers.core.percentage,100);assert.equal(receipt.workers.core.gpEnabled,true);assertPreservedGpReceipt(PRESERVED_GP);return receipt;
}
async function readProvider(script,path){const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;assert.match(account||'',/^[a-f0-9]{32}$/);assert(token);const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+'/workers/scripts/'+script+path,{method:'GET',headers:{Authorization:'Bearer '+token,'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});assert.equal(r.status,200);const j=await r.json();assert.equal(j.success,true);return j.result;}
async function assertCurrentQuestionnaireGp(receipt,run,source){
 assertNavigationRuntime(receipt,run);assert.equal(source,RUNTIME_SOURCE);assert.equal((await api('/git/ref/heads/main')).object.sha,receipt.main);assert.equal((await api('/git/ref/heads/fix/questionnaire-handover-20261016')).object.sha,RUNTIME_SOURCE);assert.equal((await api('/git/ref/heads/release/gp-priority-direct-activation-20261016')).object.sha,PRESERVED_GP.source);
 const workers={};for(const[key,script,expected]of[['core','shift-core',receipt.workers.core],['hq','shift-hq-management',PRESERVED_GP.workers.hq]]){
  const before=latestDeployment((await readProvider(script,'/deployments')).deployments),version=await readProvider(script,'/versions/'+before.versions[0].version_id);assertActivated({deployment:before,version},{deployment:expected.deploymentId,version:expected.versionId},{hq:key==='hq'});assertOwned(before,expected,expected.source,expected.run,expected.attempt);assert.equal(digest(version.resources.bindings.slice().sort((a,b)=>a.name.localeCompare(b.name))),expected.allBindingsSha256);assert.equal((await readProvider(script,'/script-settings')).observability?.redact_query_string,true);assert.deepEqual(latestDeployment((await readProvider(script,'/deployments')).deployments),before,'Actual provider moved during acceptance admission');workers[key]={source:expected.source,deploymentId:expected.deploymentId,versionId:expected.versionId,percentage:100};
 }return{at:new Date().toISOString(),source,main:receipt.main,workers};
}
export function assertTerminalTime(run,now=Date.now()){
 const finished=Date.parse(run.updated_at);assert(Number.isFinite(finished)&&finished<=now,'Genuine completed release timestamp required');
 // A terminal source receipt is immutable historical evidence. Freshness is
 // established by the unchanged live provider/source guard before EACH fixture
 // and after acceptance, rather than increasing its former elapsed-time limit.
 return finished;
}
export function assertCompiledRuntime(control,runtime,harnessSource){
 assert.equal(control.source,harnessSource,'Actual compiler source must be the actual harness checkout');
 assert.equal(control.bundleSha256,runtime.workers.core.bundleSha256,'Whole compiled worker must equal the exact accepted serving runtime');
 return control;
}
function assertSource(){
 const source=process.env.GITHUB_SHA;assert.match(source||'',/^[a-f0-9]{40}$/);assert.equal(process.env.GITHUB_REPOSITORY,repository);
 assert.equal(process.env.GITHUB_REF,'refs/heads/'+HARNESS_BRANCH);assert.equal(process.env.GITHUB_EVENT_NAME,'push');assert.equal(git('rev-parse','HEAD'),source);
 assert.equal(git('status','--porcelain','--untracked-files=no'),'');git('merge-base','--is-ancestor',RUNTIME_SOURCE,'HEAD');
 const allowed=['.github/workflows/rendered-member-production-acceptance.yml','release/gp-directory-live-20261015.mjs','release/gp-member-directory-navigation-live-20261016.mjs','tests/gp-member-directory-navigation-live-20261016.test.mjs','tests/gp-member-directory-navigation-browser-20261016.mjs'];
 assert.deepEqual(git('diff','--no-ext-diff','--no-textconv','--no-renames','--name-only',RUNTIME_SOURCE,'HEAD').split('\n').sort(),allowed.sort(),'Only admitted acceptance-harness paths may differ from the serving source');
 assert.equal(hash(readFileSync('release/gp-directory-live-20261015.mjs')),'fe7a34f1d3947a3981d4fda51267f3fb014e9e7fb154b8b19e610a599191872f','Exact reviewed navigation and non-egress changes required');
 return source;
}
async function api(path){
 const token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN;assert(token,'Existing Actions read credential required');
 const r=await fetch('https://api.github.com/repos/'+repository+path,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});
 assert.equal(r.status,200,'Actual GitHub receipt unavailable');return r.json();
}
export async function verifyNavigation(){
 const source=assertSource(),tree=git('rev-parse','HEAD^{tree}');mkdirSync(directory,{recursive:true});
 const actual=await api('/actions/runs/'+process.env.GITHUB_RUN_ID);assert.equal(actual.head_sha,source);assert.equal(actual.head_branch,HARNESS_BRANCH);assert.equal(actual.event,'push');assert.equal(actual.path,'.github/workflows/rendered-member-production-acceptance.yml');assert.equal(actual.repository.full_name,repository);assert.equal((await api('/git/ref/heads/'+HARNESS_BRANCH)).object.sha,source);
 const run=await api('/actions/runs/'+RELEASE_RUN);assertQuestionnaireRun(run,RUNTIME_SOURCE);assert.equal(run.run_attempt,RELEASE_ATTEMPT);assertTerminalTime(run);
 const artifact=await api('/actions/artifacts/'+ARTIFACT_ID);assert.equal(artifact.workflow_run.id,RELEASE_RUN);assert.equal(artifact.workflow_run.head_sha,RUNTIME_SOURCE);assert.equal(artifact.expired,false);assert.equal(artifact.digest,'sha256:'+ARTIFACT_SHA);assert.equal(artifact.size_in_bytes,9770924);
 const response=await fetch('https://api.github.com/repos/'+repository+'/actions/artifacts/'+ARTIFACT_ID+'/zip',{headers:{Authorization:'Bearer '+(process.env.GH_TOKEN||process.env.GITHUB_TOKEN)},signal:AbortSignal.timeout(30000)});assert.equal(response.status,200);
 const archive=Buffer.from(await response.arrayBuffer());assert.equal(archive.length,9770924);assert.equal(hash(archive),ARTIFACT_SHA);const zip=join(directory,'owned-on-original.zip');writeFileSync(zip,archive);
 const artifactDirectory=join(directory,'owned-on-artifact');mkdirSync(artifactDirectory,{recursive:true});execFileSync('unzip',['-q',zip,'-d',artifactDirectory],{stdio:['ignore','pipe','pipe']});
 const runtime=assertNavigationRuntime(JSON.parse(readFileSync(join(artifactDirectory,'runtime-receipt.json'),'utf8')),run);
 // Existing provider/source checks remain unmodified, including exact current
 // main, original ON branch, both deployment IDs and single 100% versions.
 await assertCurrentQuestionnaireGp(runtime,run,RUNTIME_SOURCE);
 const control=assertCompiledRuntime(await compiledTreatmentAssets(),runtime,source);
 writeFileSync(join(directory,'navigation-runtime-source-proof.json'),JSON.stringify({at:new Date().toISOString(),harnessSource:source,harnessTree:tree,runtimeSource:RUNTIME_SOURCE,runtimeTree:RUNTIME_TREE,ownedReleaseRun:run.id,ownedReleaseAttempt:run.run_attempt,originalArtifact:ARTIFACT_ID,originalArtifactSHA256:ARTIFACT_SHA,wholeCompiledBundleSHA256:control.bundleSha256,runtimeRedeployed:false,originalProviderAndMemberAssertionsRetained:true,automaticNonGpRequestsAbortedWithoutEgress:true},null,2)+'\n');
 const oidc=process.env.SHIFT_COMMISSIONING_OIDC;assert(oidc,'Existing allowed-workflow commissioning identity required');
 const{chromium}=await import('playwright');const{commissioningLogin}=await import('../rendered-member-acceptance-support.mjs');const{verifyGpDirectoryLive,verifyGpIsolationFromExistingHolder}=await import('./gp-directory-live-20261015.mjs');
 assert.equal(typeof chromium.launch,'function');assert.equal(typeof commissioningLogin,'function');assert.equal(typeof verifyGpDirectoryLive,'function');assert.equal(typeof verifyGpIsolationFromExistingHolder,'function');
 const site='https://shiftsometimber.co.uk',apiOrigin='https://api.shiftsometimber.co.uk';
 const first={email:'shiftsometimber+structured-growth-'+randomUUID()+'@gmail.com',password:'SST-GP-'+randomUUID()+'-Aa1!'};
 const second={email:'shiftsometimber+structured-progressstory-'+Date.now()+'-desktop@gmail.com',password:'SST-GP-'+randomUUID()+'-Aa1!'};
 for(const fixture of [first,second]){console.log('::add-mask::'+fixture.email);console.log('::add-mask::'+fixture.password);}
 const report={schema:'shift-gp-member-directory-live/v1',at:new Date().toISOString(),source,commit:source,tree,run:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,ownedReleaseRun:run.id,ownedReleaseAttempt:run.run_attempt,synthetic:true,realCustomerRecordsRead:false,runtimeSource:RUNTIME_SOURCE,runtimeTree:RUNTIME_TREE,preservedHqSource:PRESERVED_GP.source,partnerContractActivated:false,harnessSource:source,harnessTree:tree,compiledBundleEqualToAcceptedRuntime:true,checks:[],status:'running',featureAcceptance:false,notificationsSent:0,realCustomerWrites:0,commissioningIdentity:'github_actions_oidc',genuineHqHolderAcceptance:false};
 async function create(fixture){
  const serving=await assertCurrentQuestionnaireGp(runtime,run,RUNTIME_SOURCE);
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
  page=await verifyGpDirectoryLive({page,site,api:apiOrigin,email:first.email,dir:directory,report,freshSession:async()=>{
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
  const isolation=await verifyGpIsolationFromExistingHolder({page:otherPage,site,api:apiOrigin,email:second.email});
  assert.equal(isolation.status,'pass');assert.equal(isolation.source,source);assert.equal(isolation.actualDistinctAccounts,true);assert.equal(isolation.ownGpUnchanged,true);assert.equal(isolation.firstHolderMarkerAbsent,true);assert.equal(isolation.hqSignedInAcceptance,false);
  report.checks.push({requirement:'Actual second fictional holder isolation',...isolation});
  report.servingAfter=await assertCurrentQuestionnaireGp(runtime,run,RUNTIME_SOURCE);
  assert.equal(git('rev-parse','HEAD'),source);assert.equal(git('status','--porcelain','--untracked-files=no'),'');
  report.status='pass';report.featureAcceptance=true;
 }catch(error){report.status='failed';report.error=String(error?.message||error);for(const fixture of [first,second])report.error=report.error.replaceAll(fixture.email,'[synthetic]').replaceAll(fixture.password,'[redacted]');throw error;}
 finally{writeFileSync(join(directory,'gp-member-directory-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
 console.log('PASS actual GP lookup, selection, save/reopen and two-fictional-holder isolation; genuine signed-in HQ holder acceptance remains separate');
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await verifyNavigation();
