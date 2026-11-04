import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {APPROVED_CANDIDATE,REVIEW_MODULE,hash,prepareGatePackage,verifyGatePackage} from './gate-package.mjs';
import {qualifyServingHandler,REVIEW_SHA256} from './qualify-serving.mjs';
import {latestDeployment,runtimeRollbackDecision} from '../runtime-rollback-guard.mjs';
const directory='article-gate-proof';mkdirSync(directory,{recursive:true});
const temporary='/tmp/approved-article-gate-provider.json';
const save=(n,v)=>writeFileSync(directory+'/'+n+'.json',JSON.stringify(v,null,2));
const load=n=>JSON.parse(readFileSync(directory+'/'+n+'.json'));
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
assert(account&&token);assert.equal(process.env.GITHUB_REF,'refs/heads/release/approved-article-safety-20261104');
const source=process.env.GITHUB_SHA,run=process.env.GITHUB_RUN_ID;
assert.match(source||'',/^[a-f0-9]{40}$/);assert.match(run||'',/^\d+$/);
const api=async(path,init={})=>{const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{...init,headers:{Authorization:'Bearer '+token,...init.headers},signal:AbortSignal.timeout(90000)});const j=await r.json();assert(r.ok&&j.success,'Provider operation failed: '+r.status+' '+JSON.stringify(j.errors));return j.result;};
const current=async()=>{const r=await api('/workers/scripts/shift-core/deployments');return latestDeployment(r.deployments??r);};
const version=id=>api('/workers/workers/shift-core/versions/'+id+'?include=modules');
const currentMain=()=>assert.equal(execFileSync('git',['ls-remote','origin','refs/heads/main'],{encoding:'utf8',timeout:30000}).trim().split(/\s+/)[0],process.env.APPROVED_BASE_SHA,'Current main moved; reconcile source');
const publicPaths=['/','/member-login','/member/dashboard','/v1/member-state','/checkout','/work-with-us','/shift-health/blood-tests','/articles/glp-1-nhs-eligibility','/articles/appetite-control-on-glp-1'];
const clean=s=>s.replace(/<script\b[^>]*\bsrc=["']https:\/\/static.cloudflareinsights.com[^"']*["'][\s\S]*?<\/script>/gi,'').replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi,'');
async function documents(){
 const pairs=await Promise.all(publicPaths.map(async path=>{const r=await fetch('https://shiftsometimber.co.uk'+path,{redirect:'manual',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(45000)});const body=await r.text();return [path,{status:r.status,sha256:hash(clean(body)),headers:Object.fromEntries(['content-type','location','cache-control','content-security-policy','strict-transport-security','x-frame-options','x-robots-tag','x-shift-article-source'].map(k=>[k,r.headers.get(k)]))}];}));
 return Object.fromEntries(pairs);
}
const probeUrls=['https://api.shiftsometimber.co.uk/v1/integrations/babylovegrowth','https://shiftsometimber.co.uk/v1/integrations/babylovegrowth'];
async function probes(){
 const out=[];for(const url of probeUrls)for(const method of ['GET','POST']){
  const r=await fetch(url,{method,redirect:'manual',headers:{'Content-Type':'application/json'},...(method==='POST'?{body:'{}'}:{}),signal:AbortSignal.timeout(30000)});
  const text=await r.text();assert([401,403,405,503].includes(r.status),'Unauthenticated publication must not succeed');out.push({url,method,status:r.status,sha256:hash(text),cache:r.headers.get('cache-control')});
 }return out;
}
function settingsPreserved(actual,before){
 const clean=v=>{const out=structuredClone(v);if(out.annotations){delete out.annotations['workers/message'];delete out.annotations['workers/tag'];if(!Object.keys(out.annotations).length)delete out.annotations;}return out;};
 assert.deepEqual(clean(actual),clean(before),'Unrelated runtime settings changed');
}
const mode=process.argv[2];assert(['capture','stage','promote','verify','rollback'].includes(mode));
if(mode==='capture'){
 currentMain();
 await Promise.all([41926653856,41926653973,41926653836].map(async id=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/runs/'+id,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(20000)});assert(r.ok);const j=await r.json();assert.equal(j.head_sha,APPROVED_CANDIDATE);assert.equal(j.conclusion,'success');}));
 const before=await current(),original=await version(before.versions[0].version_id),settings=await api('/workers/scripts/shift-core/settings');
 const review=readFileSync(new URL('./article-review.mjs',import.meta.url));assert.equal(hash(review),REVIEW_SHA256);
 const planned=prepareGatePackage(original,review);
 writeFileSync('/tmp/approved-article-gate-before.mjs',Buffer.from(original.modules.find(m=>m.name==='worker.js').content_base64,'base64'));
 writeFileSync('/tmp/approved-article-gate-worker.mjs',Buffer.from(planned.modules.find(m=>m.name==='worker.js').content_base64,'base64'));
 execFileSync(process.execPath,['--check','/tmp/approved-article-gate-worker.mjs'],{stdio:'pipe',timeout:60000});
 const qualification=qualifyServingHandler(planned.region,directory+'/qualification');
 const protectedBefore=await documents(),authBefore=await probes();
 for(const p of ['/work-with-us','/shift-health/blood-tests']){assert.equal(protectedBefore[p].status,200);for(const k of ['content-security-policy','strict-transport-security','x-frame-options'])assert(protectedBefore[p].headers[k]);}
 assert.equal(protectedBefore['/articles/glp-1-nhs-eligibility'].status,200);
 const inventory=original.modules.map(m=>({name:m.name,type:m.content_type,sha256:hash(Buffer.from(m.content_base64,'base64'))}));
 const record={source,run,approvedCandidate:APPROVED_CANDIDATE,capturedAt:new Date().toISOString(),before,mainEntry:original.main_module,inventory,proof:planned.proof,qualification,protectedBefore,authBefore,databaseWrites:false,routeWrites:false,notificationsSent:false};
 save('captured',record);writeFileSync(temporary,JSON.stringify({original,settings,planned}));
 console.log('GATE_CAPTURED '+JSON.stringify({source,run,beforeDeployment:before.id,beforeVersion:before.versions[0].version_id,moduleCount:original.modules.length,...planned.proof,qualification}));
}
if(mode==='stage'){
 currentMain();const record=load('captured'),{original,settings,planned}=JSON.parse(readFileSync(temporary));
 assert.equal((await current()).id,record.before.id,'Serving deployment moved before staging');
 const metadata={main_module:planned.main_module,compatibility_date:original.compatibility_date,compatibility_flags:original.compatibility_flags||[],bindings:original.bindings.map(b=>({type:'inherit',name:b.name})),keep_assets:true,annotations:{'workers/message':'Approved BabyLove import review safeguard; candidate '+APPROVED_CANDIDATE+'; source '+source+'; run '+run,'workers/tag':'article-gate-'+run}};
 if(original.usage_model)metadata.usage_model=original.usage_model;
 for(const field of ['placement','limits','observability','logpush'])if(settings[field]!==undefined)metadata[field]=settings[field];
 const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');
 for(const m of planned.modules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type}),m.name);
 const staged=await api('/workers/scripts/shift-core/versions?bindings_inherit=strict',{method:'POST',body:form});assert(staged.id);
 const proof=verifyGatePackage(original,await version(staged.id),planned);settingsPreserved(await api('/workers/scripts/shift-core/settings'),settings);
 assert.equal((await current()).id,record.before.id,'Serving deployment moved during staging');
 save('staged',{id:staged.id,source,run,at:new Date().toISOString(),proof});console.log('GATE_STAGED '+JSON.stringify({versionId:staged.id,...proof}));
}
if(mode==='promote'){
 currentMain();const record=load('captured'),staged=load('staged');assert.equal(staged.source,source);assert.equal(staged.run,run);
 assert.equal((await current()).id,record.before.id,'Serving deployment moved before promotion');
 const deployment=await api('/workers/scripts/shift-core/deployments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy:'percentage',versions:[{version_id:staged.id,percentage:100}],annotations:{'workers/message':'Approved import review safeguard; run '+run+'; source '+source}})});
 const receipt={kind:'owned_runtime_deployment',source,run,script:'shift-core',versionId:staged.id,deploymentId:deployment.id,before:record.before,promotedAt:new Date().toISOString()};save('deployment',receipt);
 const active=await current();assert.equal(active.id,receipt.deploymentId);assert.equal(active.versions[0].version_id,staged.id);
 console.log('GATE_DEPLOYED '+JSON.stringify(receipt));
}
if(mode==='verify'){
 const record=load('captured'),receipt=load('deployment'),{original,settings,planned}=JSON.parse(readFileSync(temporary));
 assert.equal(receipt.source,source);assert.equal(receipt.run,run);
 const active=await current();assert.equal(active.id,receipt.deploymentId);assert.equal(active.versions[0].version_id,receipt.versionId);
 const deployed=await version(receipt.versionId),proof=verifyGatePackage(original,deployed,planned);assert.equal(deployed.migration_tag,original.migration_tag);
 settingsPreserved(await api('/workers/scripts/shift-core/settings'),settings);
 const after=await documents(),auth=await probes();assert.deepEqual(after,record.protectedBefore,'Protected public/anonymous responses changed');assert.deepEqual(auth,record.authBefore,'Unauthenticated integration boundary changed');
 assert.equal((await current()).id,receipt.deploymentId,'Newer owner deployed during verification');
 const result={ok:true,verifiedAt:new Date().toISOString(),...receipt,proof,protectedPaths:publicPaths,protectedDocumentsUnchanged:true,authBoundariesUnchanged:true,compiledHandlerTests:13,realVendorDeliveryTested:false,databaseWrites:false,routeWrites:false,notificationsSent:false};
 save('live-verification',result);console.log('GATE_LIVE_VERIFIED '+JSON.stringify(result));
}
if(mode==='rollback'){
 if(!existsSync(directory+'/deployment.json')){console.log('No owned promotion receipt; preserve current serving deployment.');process.exit(0);}
 const receipt=load('deployment'),active=await current(),decision=runtimeRollbackDecision({before:receipt.before,active,receipt,source,run});
 if(decision.action==='restore'){
  const restored=await api('/workers/scripts/shift-core/deployments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy:'percentage',versions:[{version_id:decision.versionId,percentage:100}]})});
  const now=await current();assert.equal(now.id,restored.id);assert.equal(now.versions[0].version_id,decision.versionId);
 }
 save('rollback',{at:new Date().toISOString(),...decision});console.log('GATE_ROLLBACK '+JSON.stringify(decision));
}
