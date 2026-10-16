import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {LANE,PREDECESSORS,latestDeployment,assertOwned} from './gp-priority-direct-owned-release-20261016.mjs';

export const GP_OFF_BRANCH='release/gp-priority-direct-20261016';
export const GP_OFF_WORKFLOW='.github/workflows/gp-priority-direct-release-20261016.yml';
const repository='shiftsometimber/shift-core';
const directory='gp-member-code-off-live-evidence';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('/usr/bin/git',['--no-replace-objects','--no-optional-locks',...args],{encoding:'utf8'}).trim();
const sha40=value=>assert.match(value||'',/^[a-f0-9]{40}$/);
const sha64=value=>assert.match(value||'',/^[a-f0-9]{64}$/);
const uuid=value=>assert.match(value||'',/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i);
function actualSource(){
 assert.equal(process.env.GITHUB_REPOSITORY,repository);
 assert.equal(process.env.GITHUB_REF,'refs/heads/'+GP_OFF_BRANCH);
 const source=process.env.GITHUB_SHA;sha40(source);assert.equal(git('rev-parse','HEAD'),source);
 return source;
}
export function assertOwnedOffRun(run,source,{terminal=true}={}){
 sha40(source);assert.equal(run.head_sha,source);assert.equal(run.head_branch,GP_OFF_BRANCH);
 assert.equal(run.path,GP_OFF_WORKFLOW);assert.equal(run.name,'GP Priority Direct Runtime Release');
 assert.equal(run.event,'push');assert.equal(run.head_repository?.full_name,repository);
 assert(Number.isSafeInteger(run.id)&&run.id>0);assert(Number.isSafeInteger(run.run_attempt)&&run.run_attempt>0);
 assert.equal(run.html_url,'https://github.com/'+repository+'/actions/runs/'+run.id);
 if(terminal){assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');}
 return run;
}
export function assertOwnedOffReceipt(receipt,run,source,tree){
 assertOwnedOffRun(run,source);sha40(tree);
 assert.equal(receipt.schema,'shift-gp-direct-runtime-receipt/v1');
 assert.equal(receipt.source,source);assert.equal(receipt.tree,tree);
 assert.equal(String(receipt.run),String(run.id));assert.equal(String(receipt.attempt),String(run.run_attempt));
 assert.equal(receipt.releaseBranch,GP_OFF_BRANCH);assert.equal(receipt.releaseWorkflow,GP_OFF_WORKFLOW);assert.equal(String(receipt.releaseRun),String(run.id));
 sha40(receipt.main);assert.equal(receipt.ownership.mainBefore,receipt.main);assert.equal(receipt.ownership.mainAfter,receipt.main);
 assert.equal(receipt.status,'code_only_verified');assert.equal(receipt.dataWrites,0);assert.equal(receipt.externalMessages,0);assert.equal(receipt.featureAcceptance,false);
 for(const name of ['core','hq']){
  const row=receipt.workers[name];assert.equal(row.source,source);assert.equal(String(row.run),String(run.id));assert.equal(String(row.attempt),String(run.run_attempt));
  uuid(row.deploymentId);uuid(row.versionId);assert.equal(row.percentage,100);assert.equal(row.gpEnabled,false);
  sha64(row.bundleSha256);assert(Number.isSafeInteger(row.bundleBytes)&&row.bundleBytes>0);sha64(row.allBindingsSha256);sha64(row.otherBindingsSha256);
 }
 assert.equal(receipt.workers.hq.partnersEnabled,true);
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
export async function assertCurrentOwnedOff(receipt,run,source,{readProvider=providerDeployments,readGithub=api}={}){
 assert.equal(receipt.main,LANE.main,'Original coordinating main identity changed');
 assert.equal((await readGithub('/git/ref/heads/main')).object.sha,receipt.main,'Current main moved before member proof');
 assert.equal((await readGithub('/git/ref/heads/'+GP_OFF_BRANCH)).object.sha,source,'Owned GP branch moved before member proof');
 const actual={};
 for(const name of ['core','hq']){
  const active=latestDeployment(await readProvider(PREDECESSORS[name].script));
  assertOwned(active,receipt.workers[name],source,run.id,run.run_attempt);
  actual[name]={deploymentId:active.id,versionId:active.versions[0].version_id,percentage:active.versions[0].percentage};
 }
 return{at:new Date().toISOString(),source,main:receipt.main,workers:actual};
}
function jsonFiles(root){return readdirSync(root,{withFileTypes:true}).flatMap(row=>row.isDirectory()?jsonFiles(join(root,row.name)):row.isFile()&&row.name.endsWith('.json')?[join(root,row.name)]:[]);}
async function waitForOff(){
 const source=actualSource(),tree=git('rev-parse','HEAD^{tree}'),started=Date.now();mkdirSync(directory,{recursive:true});
 let run;
 while(Date.now()-started<1200000){
  const result=await api('/actions/workflows/'+GP_OFF_WORKFLOW.split('/').at(-1)+'/runs?branch='+encodeURIComponent(GP_OFF_BRANCH)+'&event=push&per_page=20');
  const matches=result.workflow_runs.filter(row=>row.head_sha===source).sort((a,b)=>b.id-a.id);
  if(matches.length){run=assertOwnedOffRun(matches[0],source,{terminal:false});if(run.status==='completed'){assertOwnedOffRun(run,source);break;}}
  await new Promise(resolve=>setTimeout(resolve,10000));
 }
 assert(run?.status==='completed'&&run.conclusion==='success','Actual same-source OFF release did not succeed inside finite 20-minute wait');
 const artifacts=(await api('/actions/runs/'+run.id+'/artifacts')).artifacts.filter(row=>row.name==='gp-direct-runtime-release-'+run.id&&!row.expired);
 assert.equal(artifacts.length,1,'One actual owned OFF artifact required');assert(artifacts[0].size_in_bytes>0);
 const artifactDirectory=join(directory,'owned-off-artifact');mkdirSync(artifactDirectory,{recursive:true});
 execFileSync('gh',['run','download',String(run.id),'--repo',repository,'--name',artifacts[0].name,'--dir',artifactDirectory],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
 const receipts=jsonFiles(artifactDirectory).map(path=>({path,bytes:readFileSync(path,'utf8')})).map(row=>({...row,value:JSON.parse(row.bytes)})).filter(row=>row.value.schema==='shift-gp-direct-runtime-receipt/v1');
 assert.equal(receipts.length,1,'One actual runtime receipt in owned artifact required');
 assertOwnedOffReceipt(receipts[0].value,run,source,tree);
 run=assertOwnedOffRun(await api('/actions/runs/'+run.id),source);
 assert.equal(String(receipts[0].value.attempt),String(run.run_attempt),'Owned release attempt moved during artifact read');
 writeFileSync(join(directory,'owned-off-run.json'),JSON.stringify(run,null,2)+'\n');
 writeFileSync(join(directory,'owned-off-proof.json'),JSON.stringify({source,tree,run:run.id,attempt:run.run_attempt,artifact:artifacts[0].id,receiptPath:receipts[0].path,receiptSHA256:hash(receipts[0].bytes)},null,2)+'\n');
 console.log('PASS actual same-source owned GP OFF release and artifact; authenticated member proof has not run yet');
}
async function verifyOff(){
 const source=actualSource(),tree=git('rev-parse','HEAD^{tree}');
 const proof=JSON.parse(readFileSync(join(directory,'owned-off-proof.json'),'utf8'));
 const run=JSON.parse(readFileSync(join(directory,'owned-off-run.json'),'utf8'));
 const bytes=readFileSync(proof.receiptPath,'utf8');assert.equal(hash(bytes),proof.receiptSHA256);
 const runtime=assertOwnedOffReceipt(JSON.parse(bytes),run,source,tree);
 const current=assertOwnedOffRun(await api('/actions/runs/'+run.id),source);assert.equal(current.run_attempt,run.run_attempt);
 const finished=Date.parse(current.updated_at);assert(Number.isFinite(finished)&&finished<=Date.now()&&Date.now()-finished<=900000,'Fresh actual OFF terminal within 15 minutes required before fixture creation');
 const oidc=process.env.SHIFT_COMMISSIONING_OIDC;assert(oidc,'Existing allowed-workflow commissioning identity required');
 const email='shiftsometimber+structured-growth-'+randomUUID()+'@gmail.com',password='SST-GP-'+randomUUID()+'-Aa1!';
 console.log('::add-mask::'+email);console.log('::add-mask::'+password);
 const site='https://shiftsometimber.co.uk',apiOrigin='https://api.shiftsometimber.co.uk';
 // Resolve the complete original helper closure before creating a fixture.
 const{chromium}=await import('playwright');const{commissioningLogin}=await import('../rendered-member-acceptance-support.mjs');const{verifyGpDirectoryLive}=await import('./gp-directory-live-20261015.mjs');
 assert.equal(typeof chromium.launch,'function');assert.equal(typeof commissioningLogin,'function');assert.equal(typeof verifyGpDirectoryLive,'function');
 const servingBefore=await assertCurrentOwnedOff(runtime,run,source);
 writeFileSync(join(directory,'current-serving-before-fixture.json'),JSON.stringify(servingBefore,null,2)+'\n');
 const registered=await fetch(apiOrigin+'/v1/auth/register',{method:'POST',headers:{Origin:site,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':oidc},body:JSON.stringify({email,password,firstName:'SyntheticGp',source:'commissioning-growth-20260928'}),signal:AbortSignal.timeout(30000)});
 assert.equal(registered.status,201,'Original authorised fictional registration must succeed without fallback');
 const identity=await registered.json();assert.equal(identity.commissioningIdentity,'github_actions_oidc','Only the original validated no-email commissioning path is allowed');
 const browser=await chromium.launch({headless:true});
 const report={schema:'shift-gp-member-code-off-live/v1',at:new Date().toISOString(),source,tree,run:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,ownedReleaseRun:run.id,ownedReleaseAttempt:run.run_attempt,synthetic:true,realCustomerRecordsRead:false,checks:[],status:'running',featureAcceptance:false,notificationsSent:0,realCustomerWrites:0,commissioningIdentity:'github_actions_oidc',genuineHqHolderAcceptance:false};
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
  await commissioningLogin(page,{site,api:apiOrigin,oidc,email,password});
  const readOnly=route=>{const request=route.request(),url=new URL(request.url());return['GET','HEAD'].includes(request.method())&&[site,apiOrigin].includes(url.origin)?route.continue():route.abort();};
  await context.route('**/*',readOnly);
  // Page routes keep priority over any original helper context route, so an
  // unexpected flag change cannot enable a browser PATCH in this OFF job.
  await page.route('**/*',readOnly);
  const before=await context.request.get(site+'/v1/member/details',{headers:{Origin:site,'Cache-Control':'no-cache'}});assert.equal(before.status(),200);assert.equal((await before.json()).gpDirectoryV2,false,'This job must remain code-OFF and may make no GP edits');
  await verifyGpDirectoryLive({page,site,api:apiOrigin,email,dir:directory,report,freshSession:async()=>{throw Error('OFF verification must not request a feature-flow fresh session');}});
  const row=report.checks.find(row=>row.requirement==='GP directory member flow');
  assert.equal(row.status,'code_only_verified');assert.equal(row.flagsOff,true);assert.equal(row.featureAcceptance,false);assert.deepEqual(row.assetsAfter,row.assetsBefore);assert.equal(row.assetsBefore.length,3);
  const after=await context.request.get(site+'/v1/member/details',{headers:{Origin:site,'Cache-Control':'no-cache'}});assert.equal(after.status(),200);assert.equal((await after.json()).gpDirectoryV2,false);
  assert.equal(runtime.workers.core.gpEnabled,false);assert.equal(git('rev-parse','HEAD'),source);assert.equal(git('status','--porcelain','--untracked-files=no'),'');
  const servingAfter=await assertCurrentOwnedOff(runtime,run,source);
  writeFileSync(join(directory,'current-serving-after-proof.json'),JSON.stringify(servingAfter,null,2)+'\n');
  report.servingBefore=servingBefore;report.servingAfter=servingAfter;report.status='code_only_verified';
 }catch(error){report.status='failed';report.error=String(error?.message||error).replaceAll(email,'[synthetic]').replaceAll(password,'[redacted]');throw error;}
 finally{writeFileSync(join(directory,'member-code-off-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
 console.log('PASS genuine fictional member sign-in, exact compiled/served three assets and GP-OFF profile; feature and genuine HQ holder acceptance remain separate');
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const mode=process.argv[2];
 if(mode==='--wait-off')await waitForOff();
 else if(mode==='--verify-off')await verifyOff();
 else throw Error('Explicit --wait-off or --verify-off required');
}
