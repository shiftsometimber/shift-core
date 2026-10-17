import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {randomUUID,createHash} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {LANE,PREDECESSORS,latestDeployment,assertOwned,digest} from '../../runtime/release/gp-priority-direct-owned-release-20261016.mjs';

export const W_BRANCH='release/factual-recorded-week-direct-20261016';
export const W_WORKFLOW='.github/workflows/factual-recorded-week-direct-release-20261016.yml';
const repository='shiftsometimber/shift-core';
const directory='growth-member-live-evidence';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('/usr/bin/git',['--no-replace-objects','--no-optional-locks',...args],{encoding:'utf8'}).trim();
const sha40=value=>assert.match(value||'',/^[a-f0-9]{40}$/);
const sha64=value=>assert.match(value||'',/^[a-f0-9]{64}$/);
const uuid=value=>assert.match(value||'',/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i);

// Existing bounded verifier slot now targets the genuinely deployed W runtime.
// The verifier and runtime remain independent complete native Git checkouts.
export const QA_BRANCH='verification/gp-direct-h55-live-20261016';
export const QA_WORKFLOW='.github/workflows/rendered-member-production-acceptance.yml';
export const TARGET_RUNTIME_SOURCE='b6f9c0c36d4303e5d384fb2d62b58968b998aa64';
export const TARGET_RUNTIME_TREE='00781ce728ca816ddab27022c7bcf8f9e1f13b13';
const verifierRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const POLICY='release/gp-h55-live-qa-policy-20261016.json';
const QA_PATHS=['.github/workflows/rendered-member-production-acceptance.yml','release/gp-h55-live-qa-20261016.mjs','release/gp-directory-live-h55-qa-20261016.mjs','release/gp-h55-live-qa-policy-20261016.json','tests/gp-h55-live-qa-20261016.test.mjs'];
const native=(dir,...args)=>execFileSync('/usr/bin/git',['--no-replace-objects','--no-optional-locks','-C',dir,...args],{encoding:'utf8',env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0'},maxBuffer:64e6}).trim();
export function inverseLiteral(value,edits){
 for(const[before,after,count]of[...edits].reverse()){
  if(count==='suffix'){assert(value.endsWith(after));value=value.slice(0,-after.length);}
  else{assert.equal(value.split(after).length-1,count,'Complete exact inverse required');value=value.split(after).join(before);}
 }return value;
}
export function assertQaFileInverses(){
 const policy=JSON.parse(readFileSync(resolve(verifierRoot,POLICY),'utf8'));
 assert.equal(policy.runtimeSource,TARGET_RUNTIME_SOURCE);assert.equal(policy.runtimeTree,TARGET_RUNTIME_TREE);
 assert.equal(policy.schema,'shift-factual-week-independent-verifier/v1');
 for(const[name,path]of[['runner','release/recorded-week-member-live-20261016.mjs'],['helper','release/recorded-week-live-20261014.mjs']]){
  const row=policy[name],body=readFileSync(resolve(verifierRoot,row.path),'utf8');assert.equal(hash(body),row.sha256);
  const original=inverseLiteral(body,row.wholeInverse);assert.equal(hash(original),row.originalSha256);
  assert.equal(original,readFileSync(resolve(verifierRoot,'../runtime',path),'utf8'),'Every original W assertion and control retained');
 }
 assert.equal(inverseLiteral(readFileSync(resolve(verifierRoot,QA_WORKFLOW),'utf8'),policy.workflowInverse),readFileSync(resolve(verifierRoot,'../runtime',QA_WORKFLOW),'utf8'));
 return{originalAssertionsAndCommandsRetained:true,providerWrites:0};
}
export function assertQaIdentity(run,{source,runId,attempt}){
 sha40(source);assert.equal(run.head_sha,source);assert.equal(run.head_branch,QA_BRANCH);assert.equal(run.path,QA_WORKFLOW);assert.equal(run.event,'push');assert.equal(run.head_repository.full_name,repository);
 assert.equal(String(run.id),String(runId));assert.equal(String(run.run_attempt),String(attempt));assert(Number.isSafeInteger(run.id)&&run.id>0);assert(Number.isSafeInteger(run.run_attempt)&&run.run_attempt>0);return run;
}
export function assertFreshWindow(at,now=Date.now()){
 const finished=Date.parse(at);assert(Number.isFinite(finished)&&finished<=now&&now-finished<=900000,'Original fifteen-minute freshness limit retained for actual current ownership');return finished;
}
function actualVerifier(){
 assert.equal(process.env.GITHUB_REPOSITORY,repository);assert.equal(process.env.GITHUB_REF,'refs/heads/'+QA_BRANCH);assert.equal(process.env.GITHUB_EVENT_NAME,'push');
 const source=process.env.GITHUB_SHA;sha40(source);assert.equal(native(verifierRoot,'rev-parse','HEAD'),source);assert.equal(native(verifierRoot,'status','--porcelain','--untracked-files=no'),'');
 assertQaFileInverses();const policy=JSON.parse(readFileSync(resolve(verifierRoot,POLICY),'utf8'));
 assert.deepEqual([...policy.paths].sort(),QA_PATHS.slice().sort());
 assert.deepEqual(native(verifierRoot,'diff','--no-ext-diff','--no-textconv','--no-renames','--name-only',TARGET_RUNTIME_SOURCE,source,'--').split('\n').filter(Boolean).sort(),QA_PATHS.slice().sort());
 for(const path of QA_PATHS){const bytes=readFileSync(resolve(verifierRoot,path)),stored=execFileSync('/usr/bin/git',['--no-replace-objects','--no-optional-locks','-C',verifierRoot,'show',source+':'+path],{maxBuffer:64e6});assert.equal(hash(bytes),hash(stored));}
 assert.equal(resolve(process.cwd()),resolve(verifierRoot,'../runtime'));
 assert.equal(native(process.cwd(),'rev-parse','HEAD'),TARGET_RUNTIME_SOURCE);assert.equal(native(process.cwd(),'rev-parse','HEAD^{tree}'),TARGET_RUNTIME_TREE);assert.equal(native(process.cwd(),'status','--porcelain','--untracked-files=no'),'');
 for(const row of native(process.cwd(),'ls-files','-v','-z').split('\0').filter(Boolean))assert(row.startsWith('H '));
 return{source,tree:native(verifierRoot,'rev-parse','HEAD^{tree}'),run:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,runtimeSource:TARGET_RUNTIME_SOURCE};
}

function actualSource(){
 actualVerifier();
 execFileSync(process.execPath,['--input-type=module','-e',"import {readFileSync} from 'node:fs';import {verifyRecordedWeekDirect} from './release/recorded-week-direct-scope-20261016.mjs';verifyRecordedWeekDirect(JSON.parse(readFileSync('release/approved-runtime-composition.json','utf8')).myTimberRecordedWeekActivation20261014);"],{encoding:'utf8',maxBuffer:1e6});
 return TARGET_RUNTIME_SOURCE;
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
async function api(path){
 const token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN;assert(token,'Existing Actions read credential required');
 const response=await fetch('https://api.github.com/repos/'+repository+path,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(30000)});
 assert.equal(response.status,200,'Owned W release metadata unavailable');return response.json();
}
async function providerDeployments(script){
 const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
 assert.match(account||'',/^[a-f0-9]{32}$/);assert(token,'Existing read-only provider guard credential required');
 const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+'/workers/scripts/'+script+'/deployments',{method:'GET',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
 assert.equal(response.status,200,'Actual owned provider deployment unavailable');const body=await response.json();assert.equal(body.success,true);return body.result.deployments;
}
export function isPreventedWeekBackground(url,method,{site,api}){
 const u=new URL(url);if(method==='DELETE')return u.pathname==='/v1/acquisition-attribution'&&[site,api].includes(u.origin);if(method!=='POST')return false;
 return u.pathname==='/v1/my-timber-pwa/status'&&[site,api].includes(u.origin)||u.pathname==='/cdn-cgi/rum'&&[site,'https://cloudflareinsights.com'].includes(u.origin);
}
export async function assertCurrentOwnedWeek(receipt,run,source,baseline,{readProvider=providerDeployments,readGithub=api}={}){
 const started=Date.now(),verifier=actualVerifier();
 assert.equal(source,TARGET_RUNTIME_SOURCE);assert.equal(receipt.source,source);assert.equal(receipt.tree,TARGET_RUNTIME_TREE);
 assertQaIdentity(await readGithub('/actions/runs/'+process.env.GITHUB_RUN_ID),{source:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT});
 assert.equal((await readGithub('/git/ref/heads/'+QA_BRANCH)).object.sha,process.env.GITHUB_SHA,'Actual verifier moved');
 const terminal=assertOwnedWeekRun(await readGithub('/actions/runs/'+run.id),source);assert.equal(terminal.id,38990992637);assert.equal(terminal.run_attempt,run.run_attempt);
 assert.equal(receipt.main,LANE.main);assert.equal(receipt.main,baseline.coordinatingMainAtAcceptance);
 assert.equal((await readGithub('/git/ref/heads/main')).object.sha,receipt.main,'Current main moved before W member proof');
 assert.equal((await readGithub('/git/ref/heads/'+W_BRANCH)).object.sha,source,'Owned W branch moved before member proof');
 const actual={};
 for(const name of ['core','hq']){
  const active=latestDeployment(await readProvider(PREDECESSORS[name].script));
  const expected=receipt.workers[name],ownerSource=name==='core'?source:baseline.workers.hq.source,ownerRun=name==='core'?run.id:baseline.workers.hq.run,ownerAttempt=name==='core'?run.run_attempt:baseline.workers.hq.attempt;
  assertOwned(active,expected,ownerSource,ownerRun,ownerAttempt);
  actual[name]={source:ownerSource,run:canonicalId(ownerRun),attempt:canonicalId(ownerAttempt),deploymentId:active.id,versionId:active.versions[0].version_id,percentage:active.versions[0].percentage};
 }
 assert(Date.now()-started<=300000,'Fresh current provider/source evidence must complete inside five minutes');return{at:new Date().toISOString(),source,main:receipt.main,workers:actual,verifier};
}
function jsonFiles(root){return readdirSync(root,{withFileTypes:true}).flatMap(row=>row.isDirectory()?jsonFiles(join(root,row.name)):row.isFile()&&row.name.endsWith('.json')?[join(root,row.name)]:[]);}
async function waitForWeek(){
 const source=actualSource(),tree=git('rev-parse','HEAD^{tree}'),started=Date.now();mkdirSync(directory,{recursive:true});
 let run;
 while(Date.now()-started<1200000){
  const result=await api('/actions/workflows/'+W_WORKFLOW.split('/').at(-1)+'/runs?branch='+encodeURIComponent(W_BRANCH)+'&event=push&per_page=20');
  const matches=result.workflow_runs.filter(row=>row.head_sha===source).sort((a,b)=>b.id-a.id);
  if(matches.length){run=assertOwnedWeekRun(matches[0],source,{terminal:false});if(run.status==='completed'){assertOwnedWeekRun(run,source);break;}}
  await new Promise(resolve=>setTimeout(resolve,10000));
 }
 assert(run?.status==='completed'&&run.conclusion==='success','Actual same-source W release did not succeed inside finite 20-minute wait');
 const artifacts=(await api('/actions/runs/'+run.id+'/artifacts')).artifacts.filter(row=>row.name==='recorded-week-direct-runtime-release-'+run.id&&!row.expired);
 assert.equal(artifacts.length,1,'One actual owned W artifact required');assert(artifacts[0].size_in_bytes>0);
 const artifactDirectory=join(directory,'owned-week-artifact');mkdirSync(artifactDirectory,{recursive:true});
 execFileSync('gh',['run','download',String(run.id),'--repo',repository,'--name',artifacts[0].name,'--dir',artifactDirectory],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
 const receipts=jsonFiles(artifactDirectory).map(path=>({path,bytes:readFileSync(path,'utf8')})).map(row=>({...row,value:JSON.parse(row.bytes)})).filter(row=>row.value.schema==='shift-recorded-week-direct-runtime-receipt/v1');
 assert.equal(receipts.length,1,'One actual runtime receipt in owned artifact required');
 const journals=jsonFiles(artifactDirectory).map(path=>({path,bytes:readFileSync(path,'utf8')})).map(row=>({...row,value:JSON.parse(row.bytes)})).filter(row=>row.value.schema==='shift-recorded-week-direct-owned-release/v1');assert.equal(journals.length,1,'One genuine source-owned W journal required');assertOwnedWeekReceipt(receipts[0].value,run,source,tree,readBaseline(),journals[0].value);
 run=assertOwnedWeekRun(await api('/actions/runs/'+run.id),source);
 assert.equal(String(receipts[0].value.attempt),String(run.run_attempt),'Owned release attempt moved during artifact read');
 writeFileSync(join(directory,'owned-week-run.json'),JSON.stringify(run,null,2)+'\n');
 writeFileSync(join(directory,'owned-week-proof.json'),JSON.stringify({source,tree,run:run.id,attempt:run.run_attempt,artifact:artifacts[0].id,receiptPath:receipts[0].path,receiptSHA256:hash(receipts[0].bytes),journalPath:journals[0].path,journalSHA256:hash(journals[0].bytes)},null,2)+'\n');
 console.log('PASS actual same-source owned factual W release and artifact; authenticated member proof has not run yet');
}
async function verifyWeek(){
 const source=actualSource(),tree=git('rev-parse','HEAD^{tree}'),baseline=readBaseline();
 const proof=JSON.parse(readFileSync(join(directory,'owned-week-proof.json'),'utf8'));
 const run=JSON.parse(readFileSync(join(directory,'owned-week-run.json'),'utf8'));
 const bytes=readFileSync(proof.receiptPath,'utf8');assert.equal(hash(bytes),proof.receiptSHA256);assert.equal(proof.receiptSHA256,'3261fbd1a27a504746ff64f2003b8ff4922d23351c16ecd4c1f7a2d769067290','Exact genuine deployed W receipt required');
 const journalBytes=readFileSync(proof.journalPath,'utf8');assert.equal(hash(journalBytes),proof.journalSHA256);
 const runtime=assertOwnedWeekReceipt(JSON.parse(bytes),run,source,tree,baseline,JSON.parse(journalBytes));
 const current=assertOwnedWeekRun(await api('/actions/runs/'+run.id),source);assert.equal(current.run_attempt,run.run_attempt);
 assert(Number.isFinite(Date.parse(current.updated_at))&&Date.parse(current.updated_at)<=Date.now(),'Preserve actual original terminal time');const freshOwnership=await assertCurrentOwnedWeek(runtime,run,source,baseline);const finished=assertFreshWindow(freshOwnership.at);
 const oidc=process.env.SHIFT_COMMISSIONING_OIDC;assert(oidc,'Existing allowed-workflow commissioning identity required');
 const{chromium}=createRequire(resolve(process.cwd(),'package.json'))('playwright');
 const{commissioningLogin,chooseOptionalHealthTracking}=await import('../../runtime/rendered-member-acceptance-support.mjs');
 const{verifyRecordedWeekLive,verifyRecordedWeekIsolationFromExistingHolder}=await import('./gp-directory-live-h55-qa-20261016.mjs');
 const{compiledTreatmentAssets}=await import('../../runtime/release/my-treatment-compiled-control.mjs');
 for(const value of [chromium.launch,commissioningLogin,chooseOptionalHealthTracking,verifyRecordedWeekLive,verifyRecordedWeekIsolationFromExistingHolder,compiledTreatmentAssets])assert.equal(typeof value,'function');
 const compiled=await compiledTreatmentAssets();assert.equal(compiled.source,source);assert.equal(compiled.bundleSha256,runtime.workers.core.bundleSha256,'Actual W CI whole bundle must match the configured local compiler before any fixture');
 const site='https://shiftsometimber.co.uk',apiOrigin='https://api.shiftsometimber.co.uk';
 const first={email:'shiftsometimber+structured-growth-'+randomUUID()+'@gmail.com',password:'SST-W-'+randomUUID()+'-Aa1!'};
 const second={email:'shiftsometimber+structured-progressstory-'+Date.now()+'-desktop@gmail.com',password:'SST-W-'+randomUUID()+'-Aa1!'};
 for(const fixture of [first,second]){console.log('::add-mask::'+fixture.email);console.log('::add-mask::'+fixture.password);}
 const report={verifier:actualVerifier(),schema:'shift-recorded-week-member-live/v1',at:new Date().toISOString(),source,commit:source,tree,run:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,ownedReleaseRun:run.id,ownedReleaseAttempt:run.run_attempt,retainedHqSource:baseline.workers.hq.source,...(baseline.acceptanceMode==='qualified_core_code_with_retained_gp_hq'?{gpFeatureAcceptance:false,gpAssessmentReuse:{status:'blocked_contract_inactive'}}:{}),synthetic:true,realCustomerRecordsRead:false,checks:[],status:'running',featureAcceptance:false,notificationsSent:0,realCustomerWrites:0,commissioningIdentity:'github_actions_oidc',genuineHqHolderAcceptance:false,preventedBackgroundWrites:[],compiledBeforeFixture:{source:compiled.source,bundleSha256:compiled.bundleSha256,productionResources:0}};
 async function preparePage(page){await page.route('**/*',async route=>{const request=route.request();if(isPreventedWeekBackground(request.url(),request.method(),{site,api:apiOrigin})){const url=new URL(request.url());report.preventedBackgroundWrites.push({origin:url.origin,path:url.pathname,method:request.method(),disposition:'aborted_before_network',authority:'Unrelated analytics/PWA and cookie-attribution cleanup writes remain held'});await route.abort('blockedbyclient');return;}await route.fallback();});}
 async function create(fixture){
  const serving=await assertCurrentOwnedWeek(runtime,run,source,baseline);
  report.checks.push({requirement:'Actual owned W Core and retained H HQ before fictional fixture',...serving});
  const registered=await fetch(apiOrigin+'/v1/auth/register',{method:'POST',headers:{Origin:site,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':oidc},body:JSON.stringify({email:fixture.email,password:fixture.password,firstName:'SyntheticWeek',lastName:'Commissioning',phone:'07700 900123',dateOfBirth:'1980-01-01',postcode:'SW1A 1AA',source:'commissioning-growth-20260928'}),signal:AbortSignal.timeout(30000)});
  assert.equal(registered.status,201,'Original authorised fictional registration must succeed without fallback');
  assert.equal((await registered.json()).commissioningIdentity,'github_actions_oidc','Only the original validated no-email commissioning path is allowed');
 }
 async function chooseTracking(page){
  const blocked=[],context=page.context();
  const guard=async route=>{const request=route.request(),url=new URL(request.url());try{
   assert(!/\/(?:contact|support|send|email|mail|invite|checkout|payment|order|recruit|verification|verify|forgot|recovery|reset)(?:[/?-]|$)/i.test(url.pathname),'Held communication or commitment route');
   if(!['GET','HEAD','OPTIONS'].includes(request.method())){assert([site,apiOrigin].includes(url.origin));assert.equal(request.method(),'POST');assert.equal(url.pathname,'/v1/consents');const body=request.postDataJSON();assert.equal(body.type,'my_shift_health_tracking');assert.equal(body.granted,true);}
   await route.continue();
  }catch(error){blocked.push(String(error.message));await route.abort('blockedbyclient');}};
  await context.route('**/*',guard);try{await chooseOptionalHealthTracking(page,{site});assert.deepEqual(blocked,[]);}finally{await context.unroute('**/*',guard);}
 }
 const browser=await chromium.launch({headless:true});
 try{
  await create(first);
  let context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();await preparePage(page);
  await commissioningLogin(page,{site,api:apiOrigin,oidc,email:first.email,password:first.password});await chooseTracking(page);
  page=await verifyRecordedWeekLive({page,site,api:apiOrigin,email:first.email,dir:directory,report,freshSession:async()=>{
   await context.request.post(apiOrigin+'/v1/auth/logout',{headers:{Origin:site,'Content-Type':'application/json'},data:{}});
   await context.close();context=await browser.newContext({viewport:{width:390,height:844}});page=await context.newPage();await preparePage(page);
   await commissioningLogin(page,{site,api:apiOrigin,oidc,email:first.email,password:first.password});return page;
  }});
  const firstFlow=report.checks.find(row=>row.requirement==='factual recorded treatment weeks');assert.equal(firstFlow.status,'pass');assert.equal(firstFlow.source,source);
  writeFileSync(join(directory,'results.json'),JSON.stringify({...report,status:'pass',stage:'first_holder_recorded_week_passed_isolation_pending'},null,2)+'\n');
  await create(second);
  const other=await browser.newContext({viewport:{width:1440,height:1000}}),otherPage=await other.newPage();await preparePage(otherPage);
  await commissioningLogin(otherPage,{site,api:apiOrigin,oidc,email:second.email,password:second.password});await chooseTracking(otherPage);
  const isolation=await verifyRecordedWeekIsolationFromExistingHolder({page:otherPage,site,api:apiOrigin,email:second.email});
  assert.equal(isolation.source,source);for(const key of ['actualDistinctAccounts','firstHolderMarkersAbsent','noStore','secondHolderStateUnchanged'])assert.equal(isolation[key],true);assert.equal(isolation.actualForeignTreatmentNoteDenied,404);assert.equal(isolation.ordinaryAccountAcceptance,false);assert.equal(isolation.hqAcceptance,false);
  report.checks.push({requirement:'Actual second fictional recorded-week holder isolation',status:'pass',...isolation});
  report.servingAfter=await assertCurrentOwnedWeek(runtime,run,source,baseline);
  assert.equal(git('rev-parse','HEAD'),source);assert.equal(git('status','--porcelain','--untracked-files=no'),'');
  report.status='pass';report.featureAcceptance=true;
 }catch(error){report.status='failed';report.error=String(error?.message||error);for(const fixture of [first,second])report.error=report.error.replaceAll(fixture.email,'[synthetic]').replaceAll(fixture.password,'[redacted]');throw error;}
 finally{writeFileSync(join(directory,'recorded-week-member-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
 console.log('PASS original factual recorded-week consent/privacy/notes/export/fresh-login and two-holder isolation; genuine holder acceptance remains separate');
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const mode=process.argv[2];
 if(mode==='--wait-week')await waitForWeek();
 else if(mode==='--verify-week')await verifyWeek();
 else throw Error('Explicit --wait-week or --verify-week required');
}
