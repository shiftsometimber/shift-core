import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {LANE,PREDECESSORS,latestDeployment,assertOwned} from './gp-priority-direct-owned-release-20261016.mjs';

export const GP_ON_BRANCH='release/gp-priority-direct-activation-20261016';
export const GP_ON_WORKFLOW='.github/workflows/gp-priority-direct-activation-20261016.yml';
const repository='shiftsometimber/shift-core';
const directory='growth-member-live-evidence';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('/usr/bin/git',['--no-replace-objects','--no-optional-locks',...args],{encoding:'utf8'}).trim();
const sha40=value=>assert.match(value||'',/^[a-f0-9]{40}$/);
const sha64=value=>assert.match(value||'',/^[a-f0-9]{64}$/);
const uuid=value=>assert.match(value||'',/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i);
function actualSource(){
 assert.equal(process.env.GITHUB_REPOSITORY,repository);
 assert.equal(process.env.GITHUB_REF,'refs/heads/'+GP_ON_BRANCH);
 const source=process.env.GITHUB_SHA;sha40(source);assert.equal(git('rev-parse','HEAD'),source);
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
 assert.equal(receipt.main,LANE.main,'Original coordinating main identity changed');
 assert.equal((await readGithub('/git/ref/heads/main')).object.sha,receipt.main,'Current main moved before member proof');
 assert.equal((await readGithub('/git/ref/heads/'+GP_ON_BRANCH)).object.sha,source,'Owned GP branch moved before member proof');
 const actual={};
 for(const name of ['core','hq']){
  const active=latestDeployment(await readProvider(PREDECESSORS[name].script));
  assertOwned(active,receipt.workers[name],source,run.id,run.run_attempt);
  actual[name]={deploymentId:active.id,versionId:active.versions[0].version_id,percentage:active.versions[0].percentage};
 }
 return{at:new Date().toISOString(),source,main:receipt.main,workers:actual};
}
function jsonFiles(root){return readdirSync(root,{withFileTypes:true}).flatMap(row=>row.isDirectory()?jsonFiles(join(root,row.name)):row.isFile()&&row.name.endsWith('.json')?[join(root,row.name)]:[]);}
async function waitForOn(){
 const source=actualSource(),tree=git('rev-parse','HEAD^{tree}'),started=Date.now();mkdirSync(directory,{recursive:true});
 let run;
 while(Date.now()-started<1200000){
  const result=await api('/actions/workflows/'+GP_ON_WORKFLOW.split('/').at(-1)+'/runs?branch='+encodeURIComponent(GP_ON_BRANCH)+'&event=push&per_page=20');
  const matches=result.workflow_runs.filter(row=>row.head_sha===source).sort((a,b)=>b.id-a.id);
  if(matches.length){run=assertOwnedOnRun(matches[0],source,{terminal:false});if(run.status==='completed'){assertOwnedOnRun(run,source);break;}}
  await new Promise(resolve=>setTimeout(resolve,10000));
 }
 assert(run?.status==='completed'&&run.conclusion==='success','Actual same-source ON release did not succeed inside finite 20-minute wait');
 const artifacts=(await api('/actions/runs/'+run.id+'/artifacts')).artifacts.filter(row=>row.name==='gp-direct-directory-activation-'+run.id&&!row.expired);
 assert.equal(artifacts.length,1,'One actual owned ON artifact required');assert(artifacts[0].size_in_bytes>0);
 const artifactDirectory=join(directory,'owned-on-artifact');mkdirSync(artifactDirectory,{recursive:true});
 execFileSync('gh',['run','download',String(run.id),'--repo',repository,'--name',artifacts[0].name,'--dir',artifactDirectory],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
 const receipts=jsonFiles(artifactDirectory).map(path=>({path,bytes:readFileSync(path,'utf8')})).map(row=>({...row,value:JSON.parse(row.bytes)})).filter(row=>row.value.schema==='shift-gp-direct-activation-receipt/v1');
 assert.equal(receipts.length,1,'One actual runtime receipt in owned artifact required');
 assertOwnedOnReceipt(receipts[0].value,run,source,tree);
 run=assertOwnedOnRun(await api('/actions/runs/'+run.id),source);
 assert.equal(String(receipts[0].value.attempt),String(run.run_attempt),'Owned release attempt moved during artifact read');
 writeFileSync(join(directory,'owned-on-run.json'),JSON.stringify(run,null,2)+'\n');
 writeFileSync(join(directory,'owned-on-proof.json'),JSON.stringify({source,tree,run:run.id,attempt:run.run_attempt,artifact:artifacts[0].id,receiptPath:receipts[0].path,receiptSHA256:hash(receipts[0].bytes)},null,2)+'\n');
 console.log('PASS actual same-source owned GP ON release and artifact; authenticated member proof has not run yet');
}
async function verifyOn(){
 const source=actualSource(),tree=git('rev-parse','HEAD^{tree}');
 const proof=JSON.parse(readFileSync(join(directory,'owned-on-proof.json'),'utf8'));
 const run=JSON.parse(readFileSync(join(directory,'owned-on-run.json'),'utf8'));
 const bytes=readFileSync(proof.receiptPath,'utf8');assert.equal(hash(bytes),proof.receiptSHA256);
 const runtime=assertOwnedOnReceipt(JSON.parse(bytes),run,source,tree);
 const current=assertOwnedOnRun(await api('/actions/runs/'+run.id),source);assert.equal(current.run_attempt,run.run_attempt);
 const finished=Date.parse(current.updated_at);assert(Number.isFinite(finished)&&finished<=Date.now()&&Date.now()-finished<=900000,'Fresh actual ON terminal within 15 minutes required before fixture creation');
 const oidc=process.env.SHIFT_COMMISSIONING_OIDC;assert(oidc,'Existing allowed-workflow commissioning identity required');
 const{chromium}=await import('playwright');const{commissioningLogin}=await import('../rendered-member-acceptance-support.mjs');const{verifyGpDirectoryLive,verifyGpIsolationFromExistingHolder}=await import('./gp-directory-live-20261015.mjs');
 assert.equal(typeof chromium.launch,'function');assert.equal(typeof commissioningLogin,'function');assert.equal(typeof verifyGpDirectoryLive,'function');assert.equal(typeof verifyGpIsolationFromExistingHolder,'function');
 const site='https://shiftsometimber.co.uk',apiOrigin='https://api.shiftsometimber.co.uk';
 const first={email:'shiftsometimber+structured-growth-'+randomUUID()+'@gmail.com',password:'SST-GP-'+randomUUID()+'-Aa1!'};
 const second={email:'shiftsometimber+structured-progressstory-'+Date.now()+'-desktop@gmail.com',password:'SST-GP-'+randomUUID()+'-Aa1!'};
 for(const fixture of [first,second]){console.log('::add-mask::'+fixture.email);console.log('::add-mask::'+fixture.password);}
 const report={schema:'shift-gp-member-directory-live/v1',at:new Date().toISOString(),source,commit:source,tree,run:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,ownedReleaseRun:run.id,ownedReleaseAttempt:run.run_attempt,synthetic:true,realCustomerRecordsRead:false,checks:[],status:'running',featureAcceptance:false,notificationsSent:0,realCustomerWrites:0,commissioningIdentity:'github_actions_oidc',genuineHqHolderAcceptance:false};
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
  report.servingAfter=await assertCurrentOwnedOn(runtime,run,source);
  assert.equal(git('rev-parse','HEAD'),source);assert.equal(git('status','--porcelain','--untracked-files=no'),'');
  report.status='pass';report.featureAcceptance=true;
 }catch(error){report.status='failed';report.error=String(error?.message||error);for(const fixture of [first,second])report.error=report.error.replaceAll(fixture.email,'[synthetic]').replaceAll(fixture.password,'[redacted]');throw error;}
 finally{writeFileSync(join(directory,'gp-member-directory-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
 console.log('PASS actual GP lookup, selection, save/reopen and two-fictional-holder isolation; genuine signed-in HQ holder acceptance remains separate');
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const mode=process.argv[2];
 if(mode==='--wait-on')await waitForOn();
 else if(mode==='--verify-on')await verifyOn();
 else throw Error('Explicit --wait-on or --verify-on required');
}
