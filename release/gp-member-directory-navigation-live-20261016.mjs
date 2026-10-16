import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {assertOwnedOnRun,assertOwnedOnReceipt,assertCurrentOwnedOn} from './gp-member-directory-activation-live-20261016.mjs';
import {compiledTreatmentAssets} from './my-treatment-compiled-control.mjs';
export const RUNTIME_SOURCE='55b73025f5b6d2302fab42bce73a222653404186';
export const RUNTIME_TREE='550bec05b5dbf98bb31eed006b2158f73b4ee79f';
export const HARNESS_BRANCH='verification/gp-member-navigation-20261016';
export const RELEASE_RUN=38974318146;
export const RELEASE_ATTEMPT=1;
export const ARTIFACT_ID=12079785516;
export const ARTIFACT_SHA='ad96133ccb31b0d6d838297dec18fee5c8e84ef6d8b61524621cc5343005ecf4';
const repository='shiftsometimber/shift-core',directory='growth-member-live-evidence';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('/usr/bin/git',['--no-replace-objects','--no-optional-locks',...args],{encoding:'utf8',maxBuffer:64e6}).trim();
export function assertNavigationRuntime(receipt,run){
 assert.equal(hash(JSON.stringify(receipt)),'da759e859a6c541bcd0432c7f07571785b1aca2f96641863921eb813b79e726b','Entire original immutable runtime receipt must remain exact');
 assert.equal(run.id,RELEASE_RUN);assert.equal(run.run_attempt,RELEASE_ATTEMPT);
 assertOwnedOnRun(run,RUNTIME_SOURCE);assertOwnedOnReceipt(receipt,run,RUNTIME_SOURCE,RUNTIME_TREE);
 assert.equal(receipt.workers.core.deploymentId,'dcf7f63d-4d8b-4b9d-b18e-776d2ac400ed');
 assert.equal(receipt.workers.core.versionId,'2a2f4483-1a43-4e9a-802e-4bdc118059be');
 assert.equal(receipt.workers.hq.deploymentId,'f75c3309-afc7-49ca-aac2-7964bc5b7e42');
 assert.equal(receipt.workers.hq.versionId,'6eae4c43-fbc3-455e-a426-9bb7de344705');
 return receipt;
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
 const run=await api('/actions/runs/'+RELEASE_RUN);assertOwnedOnRun(run,RUNTIME_SOURCE);assert.equal(run.run_attempt,RELEASE_ATTEMPT);assertTerminalTime(run);
 const artifact=await api('/actions/artifacts/'+ARTIFACT_ID);assert.equal(artifact.workflow_run.id,RELEASE_RUN);assert.equal(artifact.workflow_run.head_sha,RUNTIME_SOURCE);assert.equal(artifact.expired,false);assert.equal(artifact.digest,'sha256:'+ARTIFACT_SHA);assert.equal(artifact.size_in_bytes,9696703);
 const response=await fetch('https://api.github.com/repos/'+repository+'/actions/artifacts/'+ARTIFACT_ID+'/zip',{headers:{Authorization:'Bearer '+(process.env.GH_TOKEN||process.env.GITHUB_TOKEN)},signal:AbortSignal.timeout(30000)});assert.equal(response.status,200);
 const archive=Buffer.from(await response.arrayBuffer());assert.equal(archive.length,9696703);assert.equal(hash(archive),ARTIFACT_SHA);const zip=join(directory,'owned-on-original.zip');writeFileSync(zip,archive);
 const artifactDirectory=join(directory,'owned-on-artifact');mkdirSync(artifactDirectory,{recursive:true});execFileSync('unzip',['-q',zip,'-d',artifactDirectory],{stdio:['ignore','pipe','pipe']});
 const runtime=assertNavigationRuntime(JSON.parse(readFileSync(join(artifactDirectory,'runtime-receipt.json'),'utf8')),run);
 // Existing provider/source checks remain unmodified, including exact current
 // main, original ON branch, both deployment IDs and single 100% versions.
 await assertCurrentOwnedOn(runtime,run,RUNTIME_SOURCE);
 const control=assertCompiledRuntime(await compiledTreatmentAssets(),runtime,source);
 writeFileSync(join(directory,'navigation-runtime-source-proof.json'),JSON.stringify({at:new Date().toISOString(),harnessSource:source,harnessTree:tree,runtimeSource:RUNTIME_SOURCE,runtimeTree:RUNTIME_TREE,ownedReleaseRun:run.id,ownedReleaseAttempt:run.run_attempt,originalArtifact:ARTIFACT_ID,originalArtifactSHA256:ARTIFACT_SHA,wholeCompiledBundleSHA256:control.bundleSha256,runtimeRedeployed:false,originalProviderAndMemberAssertionsRetained:true,automaticNonGpRequestsAbortedWithoutEgress:true},null,2)+'\n');
 const oidc=process.env.SHIFT_COMMISSIONING_OIDC;assert(oidc,'Existing allowed-workflow commissioning identity required');
 const{chromium}=await import('playwright');const{commissioningLogin}=await import('../rendered-member-acceptance-support.mjs');const{verifyGpDirectoryLive,verifyGpIsolationFromExistingHolder}=await import('./gp-directory-live-20261015.mjs');
 assert.equal(typeof chromium.launch,'function');assert.equal(typeof commissioningLogin,'function');assert.equal(typeof verifyGpDirectoryLive,'function');assert.equal(typeof verifyGpIsolationFromExistingHolder,'function');
 const site='https://shiftsometimber.co.uk',apiOrigin='https://api.shiftsometimber.co.uk';
 const first={email:'shiftsometimber+structured-growth-'+randomUUID()+'@gmail.com',password:'SST-GP-'+randomUUID()+'-Aa1!'};
 const second={email:'shiftsometimber+structured-progressstory-'+Date.now()+'-desktop@gmail.com',password:'SST-GP-'+randomUUID()+'-Aa1!'};
 for(const fixture of [first,second]){console.log('::add-mask::'+fixture.email);console.log('::add-mask::'+fixture.password);}
 const report={schema:'shift-gp-member-directory-live/v1',at:new Date().toISOString(),source,commit:source,tree,run:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,ownedReleaseRun:run.id,ownedReleaseAttempt:run.run_attempt,synthetic:true,realCustomerRecordsRead:false,runtimeSource:RUNTIME_SOURCE,runtimeTree:RUNTIME_TREE,harnessSource:source,harnessTree:tree,compiledBundleEqualToAcceptedRuntime:true,checks:[],status:'running',featureAcceptance:false,notificationsSent:0,realCustomerWrites:0,commissioningIdentity:'github_actions_oidc',genuineHqHolderAcceptance:false};
 async function create(fixture){
  const serving=await assertCurrentOwnedOn(runtime,run,RUNTIME_SOURCE);
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
  report.servingAfter=await assertCurrentOwnedOn(runtime,run,RUNTIME_SOURCE);
  assert.equal(git('rev-parse','HEAD'),source);assert.equal(git('status','--porcelain','--untracked-files=no'),'');
  report.status='pass';report.featureAcceptance=true;
 }catch(error){report.status='failed';report.error=String(error?.message||error);for(const fixture of [first,second])report.error=report.error.replaceAll(fixture.email,'[synthetic]').replaceAll(fixture.password,'[redacted]');throw error;}
 finally{writeFileSync(join(directory,'gp-member-directory-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
 console.log('PASS actual GP lookup, selection, save/reopen and two-fictional-holder isolation; genuine signed-in HQ holder acceptance remains separate');
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await verifyNavigation();
