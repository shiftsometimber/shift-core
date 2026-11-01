import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {plannedPackage,verifyPackage,hash,MODULES,providerOperationAllowed} from './package.mjs';
import {VERSION} from './pages.mjs';
import {runtimeRollbackDecision,latestDeployment} from '../release/runtime-rollback-guard.mjs';
import {captureIndependentPresentation} from '../release/independent-presentation-preservation.mjs';
import receipt from './source-receipt.json' with {type:'json'};

// This release adds an outer public-page wrapper to the current provider package.
// It never rebuilds main, adds routes, runs migrations or changes an email handler.
const mode=process.argv[2]||'capture',directory='referral-programme-proof',script='shift-core';
assert(['capture','stage','release','rollback'].includes(mode));mkdirSync(directory,{recursive:true});
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
assert.equal(account,'9e5386dcf455be34c582d93f8bfc79e6');assert(token,'Existing deployment credential required');
const save=(name,data)=>writeFileSync(directory+'/'+name,JSON.stringify(data,null,2));
const copySHA=hash(MODULES.map(name=>name+'\n'+readFileSync(new URL(name,import.meta.url),'utf8')).join('\n'));
save('source.json',{source:process.env.GITHUB_SHA,copySHA256:copySHA,mode});
async function api(path,init={}){
 assert(providerOperationAllowed(mode,path,init.method||'GET'),'Provider operation outside this mode’s exact scope');
 const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{...init,headers:{Authorization:'Bearer '+token,...init.headers},signal:AbortSignal.timeout(60000)});
 const data=await response.json();assert(response.ok&&data.success,'Provider request failed; no credentials are included in the receipt');return data.result;
}
const latest=async()=>latestDeployment((await api('/workers/scripts/'+script+'/deployments')).deployments);
const version=id=>api('/workers/workers/'+script+'/versions/'+id+'?include=modules');
const settings=()=>api('/workers/scripts/'+script+'/settings');
function requireCurrentSource(){
 assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);assert.match(process.env.GITHUB_REF_NAME||'',/^[a-zA-Z0-9_./-]+$/);
 const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim();
 assert.equal(git(['rev-parse','HEAD']),process.env.GITHUB_SHA);
 execFileSync('git',['fetch','--no-tags','origin',process.env.GITHUB_REF_NAME],{stdio:'pipe'});
 assert.equal(git(['rev-parse','FETCH_HEAD']),process.env.GITHUB_SHA,'Release source moved');
 const changed=git(['diff','--name-only','abc093c61ad4cdd832dc62bbffa25de668d58661','HEAD']).split('\n').filter(Boolean);
 assert(changed.length&&changed.every(path=>path.startsWith('referral-programme/')||path==='.github/workflows/referral-programme.yml'),'Unexpected source scope');
}
const protectedPaths=['/','/about','/member-login','/contact','/shift-health','/member/dashboard','/member/life-back/journey?view=first-six-weeks','/member/life-back/journey?view=first-six-weeks&sample=1','/assets/member-experience/programme-first-six-weeks.mjs','/assets/member-experience/programme-first-six-weeks.css','/assets/member-experience/programme-first-six-weeks.webp'];
const clean=text=>text.replace(/<script\b[^>]*\bsrc=["']https:\/\/static.cloudflareinsights.com[^"']*["'][\s\S]*?<\/script>/gi,'').replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi,'');
async function publicSnapshot(paths){const result={};for(const path of paths){const r=await fetch('https://shiftsometimber.co.uk'+path,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,'Public page unavailable: '+path);const type=r.headers.get('content-type')||'',bytes=Buffer.from(await r.arrayBuffer()),value=type.includes('html')?Buffer.from(clean(bytes.toString('utf8'))):bytes;result[path]={sha256:hash(value),contentType:type,security:Object.fromEntries(['content-security-policy','strict-transport-security','x-frame-options'].map(k=>[k,r.headers.get(k)]))};}return result;}
const stableSettings=s=>JSON.stringify(Object.fromEntries(['compatibility_date','compatibility_flags','bindings','placement','limits','observability','logpush','tail_consumers','tags'].filter(k=>s[k]!==undefined).map(k=>[k,s[k]])));

if(mode==='rollback'){
 assert(existsSync(directory+'/deployed.json'),'No owned deployment receipt; do not roll back another release');
 const before=JSON.parse(readFileSync(directory+'/before.json')).deployment,owned=JSON.parse(readFileSync(directory+'/deployed.json')),active=await latest();
 const decision=runtimeRollbackDecision({before,active,receipt:owned,source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID});
 if(decision.action==='restore'){
  await api('/workers/scripts/'+script+'/deployments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy:'percentage',versions:[{version_id:decision.versionId,percentage:100}]})});
  assert.equal((await latest()).versions[0].version_id,decision.versionId);save('rollback.json',{restored:decision.versionId});
 }else save('rollback.json',decision);
}else{
 requireCurrentSource();
 if(mode==='release')assert.equal(process.env.APPROVED_COPY_SHA256,copySHA,'Final public version requires its exact approval fingerprint');
 const before=await latest(),original=await version(before.versions[0].version_id),config=await settings();
 save('before.json',{deployment:before,main:original.main_module,modules:original.modules.map(m=>({name:m.name,sha256:hash(Buffer.from(m.content_base64,'base64'))})),settingsSHA256:hash(stableSettings(config))});
 const documents=await publicSnapshot(protectedPaths);save('documents-before.json',documents);
 assert.equal(documents['/assets/member-experience/programme-first-six-weeks.mjs'].sha256,receipt.sourceSHA256,'Existing six-week source changed; reconcile content before publication');
 const independent=await captureIndependentPresentation({accountId:account,token});save('independent-before.json',independent);
 const repair=Boolean(process.env.EXPECTED_REPAIR_VERSION||process.env.EXPECTED_INSTALLED_COPY_SHA256);
 if(process.env.EXPECTED_INSTALLED_COPY_SHA256){const installed=hash(MODULES.map(name=>{const m=original.modules.find(m=>m.name==='referral-programme/'+name);assert(m,'Installed referral module missing');return name+'\n'+Buffer.from(m.content_base64,'base64').toString('utf8');}).join('\n'));assert.equal(installed,process.env.EXPECTED_INSTALLED_COPY_SHA256,'Installed referral version changed');}
 if(process.env.EXPECTED_REPAIR_VERSION)assert.equal(before.versions[0].version_id,process.env.EXPECTED_REPAIR_VERSION,'Repair predecessor moved');
 const planned=plannedPackage(original,{replaceOwned:repair});
 assert.equal((await latest()).id,before.id,'Serving source moved during capture');
 save('plan.json',{source:process.env.GITHUB_SHA,copySHA256:copySHA,preservedModules:original.modules.length,addedModules:planned.modules.length-original.modules.length,entry:planned.main_module,productionMutations:mode==='capture'?0:'pending'});
 if(mode==='capture')console.log(JSON.stringify({ready:true,readOnly:true,copySHA256:copySHA,preservedModules:original.modules.length}));
 else{
  const metadata={main_module:planned.main_module,compatibility_date:config.compatibility_date,compatibility_flags:config.compatibility_flags||[],bindings:original.bindings.map(b=>({type:'inherit',name:b.name})),keep_assets:true,annotations:{'workers/message':'Approved referral enquiry and public six-week sample; preserve every serving module'}};
  for(const key of ['placement','limits','observability','logpush','tail_consumers','tags'])if(config[key]!==undefined)metadata[key]=config[key];
  const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');
  for(const m of planned.modules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type||'application/javascript+module'}),m.name);
  requireCurrentSource();assert.equal((await latest()).id,before.id);
  const uploaded=await api('/workers/scripts/'+script+'/versions?bindings_inheritance=strict',{method:'POST',body:form});
  const staged=await version(uploaded.id);verifyPackage(original,staged,planned);
  assert(stableSettings(await settings())===stableSettings(config),'Settings changed during staging');
  save('staged.json',{version:uploaded.id,source:process.env.GITHUB_SHA,providerBytesVerified:true});
  requireCurrentSource();assert.equal((await latest()).id,before.id);
  assert.deepEqual(await captureIndependentPresentation({accountId:account,token}),independent,'Independent presentation moved');
  if(mode==='stage'){
   save('ready.json',{source:process.env.GITHUB_SHA,version:uploaded.id,copySHA256:copySHA,providerBytesVerified:true,preservedModules:original.modules.length,liveDeploymentUnchanged:before.id,trafficChanged:false,realEmailTests:0,memberWrites:0});
   console.log(JSON.stringify({ready:true,staged:true,version:uploaded.id,copySHA256:copySHA,preservedModules:original.modules.length,trafficChanged:false}));
  }else{
  save('promotion-intent.json',{source:process.env.GITHUB_SHA,previous:before.versions[0].version_id,owned:uploaded.id});
  const deployed=await api('/workers/scripts/'+script+'/deployments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy:'percentage',versions:[{version_id:uploaded.id,percentage:100}]})});
  save('deployed.json',{kind:'owned_runtime_deployment',source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,versionId:uploaded.id,deploymentId:deployed.id});
  assert.equal((await latest()).id,deployed.id);
  assert.deepEqual(await publicSnapshot(protectedPaths),documents,'Protected public or member response changed');
  assert.deepEqual(await captureIndependentPresentation({accountId:account,token}),independent);
  assert(stableSettings(await settings())===stableSettings(config),'Serving settings changed');
  for(const path of ['/refer-to-shift','/programme/sample','/programme','/partner-with-us','/refer-to-shift/resources']){
   const r=await fetch('https://shiftsometimber.co.uk'+path,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200);assert.equal(r.headers.get('X-Shift-Referral-Programme'),VERSION);const text=await r.text();assert(text.includes(path==='/programme'||path==='/partner-with-us'?'data-shift-referral-entry=':'data-shift-referral-programme='));
   const head=await fetch('https://shiftsometimber.co.uk'+path,{method:'HEAD',signal:AbortSignal.timeout(30000)});assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);
  }
  for(const name of ['styles.css','referrer-client.mjs','sample-client.mjs','resources.html','resources.css','resources-client.mjs']){const r=await fetch('https://shiftsometimber.co.uk/assets/referral-programme/'+name);assert.equal(r.status,200);assert.equal(hash(Buffer.from(await r.arrayBuffer())),hash(readFileSync(new URL(name,import.meta.url))));}
  save('verified.json',{source:process.env.GITHUB_SHA,version:uploaded.id,copySHA256:copySHA,pages:5,protectedResponses:protectedPaths.length,realEmailTests:0,memberWrites:0,newRoutes:0,independentPresentationPreserved:true});
  console.log(JSON.stringify({deployed:true,verified:true,version:uploaded.id,copySHA256:copySHA}));
  }
 }
}
