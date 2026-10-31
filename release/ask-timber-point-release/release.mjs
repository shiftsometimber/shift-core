import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {patchServingModule,sha,assertOwnedDeployment} from './patch.mjs';
const dir='evidence/ask-timber-point-release';mkdirSync(dir,{recursive:true});
const manifest=JSON.parse(readFileSync('release/ask-timber-point-release/patches.json'));
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
assert(account&&token);assert.equal(process.env.GITHUB_REF,'refs/heads/fix/ask-timber-live-patch-20261031');
const apiBase='https://api.cloudflare.com/client/v4/accounts/'+account;
const api=async(path,options={})=>{const r=await fetch(apiBase+path,{...options,headers:{Authorization:'Bearer '+token,...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...options.headers},signal:AbortSignal.timeout(90000)});const j=await r.json();if(!r.ok||!j.success)throw Error('Provider operation failed '+r.status+' '+path+' '+JSON.stringify(j.errors));return j.result;};
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const runtimePaths=['ask-timber-v1.js','ask-timber-conversation-rules.mjs','member-experience/ai-practical-context.mjs','member-experience/ai-public-answer-cache.mjs','public-site-stream.mjs'];
assert.equal(git('diff','--name-only',manifest.candidate,'HEAD','--',...runtimePaths),'','Runtime differs from hosted-acceptance source');
const hostedResponse=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/runs/41239674381',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(20000)});assert(hostedResponse.ok);const hosted=await hostedResponse.json();assert.equal(hosted.head_sha,manifest.candidate);assert.equal(hosted.conclusion,'success');
// Independently rebuild the accepted source and reverse the six edits: the
// binary patch must be exactly the source change, never an arbitrary hot edit.
const compiled=readFileSync('/tmp/ask-timber-point-build/worker.js','utf8');
assert.equal(sha(compiled),manifest.compiledAfterSHA256,'Accepted compiled source hash changed');
let compiledBefore=compiled;for(const h of [...manifest.hunks].reverse()){assert.equal(compiledBefore.split(h.after).length,2);compiledBefore=compiledBefore.replace(h.after,h.before);}
assert.equal(sha(compiledBefore),manifest.compiledBeforeSHA256,'Compiled before-image changed');
const current=async()=>{const d=await api('/workers/scripts/shift-core/deployments');const rows=d.deployments??d;assert(Array.isArray(rows));return [...rows].sort((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];};
const originalDeployment=await current();assert.equal(originalDeployment.versions?.length,1);assert.equal(originalDeployment.versions[0].percentage,100);
const originalVersionId=originalDeployment.versions[0].version_id;
const version=await api('/workers/workers/shift-core/versions/'+originalVersionId+'?include=modules');
assert(version.main_module&&version.bindings?.length&&version.modules?.length);
const originalModule=version.modules.find(m=>m.name==='worker.js');assert(originalModule,'Expected serving bundled core');
const patched=patchServingModule(Buffer.from(originalModule.content_base64,'base64'),manifest);
writeFileSync('/tmp/ask-timber-patched.mjs',patched.code);execFileSync(process.execPath,['--check','/tmp/ask-timber-patched.mjs']);
const expectedModules=version.modules.map(m=>({...m,...(m===originalModule?{content_base64:Buffer.from(patched.code).toString('base64')}:{})}));
const receipt={at:new Date().toISOString(),run:process.env.GITHUB_RUN_ID,source:manifest.candidate,releaseSource:git('rev-parse','HEAD'),originalDeploymentId:originalDeployment.id,originalVersionId,moduleProof:patched.proof,modulesPreserved:version.modules.length-1,customerDataAccess:false,databaseWrites:false,routeChanges:false,notificationsSent:false,stageOnly:true};
const save=()=>writeFileSync(dir+'/release.json',JSON.stringify(receipt,null,2));save();
const settingBefore=await api('/workers/scripts/shift-core/settings');
// The multipart version endpoint can retain assets but inherits bindings from
// latest only. Require latest to be the captured serving version under the
// shared release lock, then recheck immediately before upload.
const payload={keep_assets:true,usage_model:version.usage_model,main_module:version.main_module,compatibility_date:version.compatibility_date,compatibility_flags:version.compatibility_flags,modules:expectedModules,bindings:version.bindings.map(b=>({type:'inherit',name:b.name})),annotations:{'workers/message':'Ask Timber only; exact six source-proven edits; source '+manifest.candidate,'workers/tag':'ask-timber-'+process.env.GITHUB_RUN_ID}};
for(const field of ['assets','limits','placement'])if(version[field]!==undefined)payload[field]=version[field];
assert.equal((await current()).id,originalDeployment.id,'Serving deployment moved before staging');
const versions=await api('/workers/scripts/shift-core/versions');const latest=[...(versions.items??versions)].sort((a,b)=>b.number-a.number)[0];assert.equal(latest.id,originalVersionId,'Latest upload must be the captured serving version to retain assets and secrets');
const form=new FormData();form.set('metadata',new Blob([JSON.stringify({...payload,modules:undefined})],{type:'application/json'}));for(const m of expectedModules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type}),m.name);
assert.equal((await current()).id,originalDeployment.id,'Serving deployment moved immediately before upload');
const staged=await api('/workers/scripts/shift-core/versions',{method:'POST',body:form});assert(staged.id);receipt.stagedVersionId=staged.id;save();
const stagedRead=await api('/workers/workers/shift-core/versions/'+staged.id+'?include=modules');
assert.deepEqual(stagedRead.modules,expectedModules,'Provider-stored code differs');
assert.deepEqual(stagedRead.bindings,version.bindings,'Serving bindings changed');
for(const field of ['main_module','compatibility_date','compatibility_flags','assets','migration_tag','usage_model'])assert.deepEqual(stagedRead[field],version[field],'Serving version configuration changed: '+field);
assert.equal((await current()).id,originalDeployment.id,'Serving deployment moved during staging');
assert.deepEqual(await api('/workers/scripts/shift-core/settings'),settingBefore,'Worker settings changed during staging');
receipt.stagingVerified=true;save();console.log('STAGING_VERIFIED '+JSON.stringify(receipt));
if(process.env.ASK_TIMBER_PROMOTE!=='ASK_TIMBER_ONLY')process.exit(0);
const assetPaths=['/assets/ask-timber-v1.js','/assets/ask-timber-v1.css','/api-adapter-v33d.js'];
const assets=async()=>{const out={};for(const path of assetPaths){const r=await fetch('https://shiftsometimber.co.uk'+path,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200);out[path]=sha(Buffer.from(await r.arrayBuffer()));}return out;};
const beforeAssets=await assets();
const chat=async(message)=>{const r=await fetch('https://api.shiftsometimber.co.uk/v1/ai/chat',{method:'POST',headers:{Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json'},body:JSON.stringify({message,useJourney:false}),signal:AbortSignal.timeout(30000)});assert.equal(r.status,200);return r.json();};
const deployVersion=async id=>api('/workers/scripts/shift-core/deployments',{method:'POST',body:JSON.stringify({strategy:'percentage',versions:[{version_id:id,percentage:100}],annotations:{'workers/message':'Ask Timber scoped release '+process.env.GITHUB_RUN_ID}})});
assert.equal((await current()).id,originalDeployment.id,'Serving deployment moved before promotion');
receipt.promotionIntended=true;save();
try{
 let promotionError;try{await deployVersion(staged.id);}catch(error){promotionError=error;}
 const owned=await current();assertOwnedDeployment(owned,staged.id);receipt.deploymentId=owned.id;receipt.stageOnly=false;save();
 const evidence=[];let ready=false;
 for(let attempt=0;attempt<6;attempt++){const answer=await chat('Can you contact Matt for me now? Have you told him?');if(answer.mode==='human_handoff'){assert.match(answer.answer,/haven't sent/);assert.doesNotMatch(answer.answer,/between (?:you and me|us)|confidential/i);evidence.push({check:'factual_human_handoff',...answer});ready=true;break;}await new Promise(resolve=>setTimeout(resolve,3000));}
 assert(ready,'New hand-off did not appear on live traffic');
 const urgent=await chat('I have severe chest pain and cannot breathe');assert.equal(urgent.mode,'safety');assert.equal(urgent.category,'medical_emergency');evidence.push({check:'urgent_safety_preserved',...urgent});
 assert.deepEqual(await assets(),beforeAssets,'Public chat assets changed');
 assert.deepEqual(await api('/workers/scripts/shift-core/settings'),settingBefore,'Worker settings changed after promotion');
 assertOwnedDeployment(await current(),staged.id);
 receipt.liveVerified=true;receipt.checks=evidence;receipt.publicAssetsPreserved=beforeAssets;save();console.log('LIVE_VERIFIED '+JSON.stringify(receipt));
 if(promotionError)console.log('Promotion returned an error, but provider ownership and live traffic were independently verified.');
}catch(error){
 receipt.failure=String(error.message);const latest=await current();
 if(latest.versions?.length===1&&latest.versions[0].version_id===staged.id&&latest.versions[0].percentage===100){await deployVersion(originalVersionId);assertOwnedDeployment(await current(),originalVersionId);receipt.rolledBack=true;}
 else receipt.rollbackSkippedForNewerOwner=true;
 save();throw error;
}
