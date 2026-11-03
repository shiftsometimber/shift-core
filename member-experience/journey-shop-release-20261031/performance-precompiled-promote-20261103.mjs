// Single finite continuation of the existing release lane. No new watcher or normal-traffic promotion.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import https from 'node:https';
import {provePrivatePassThrough} from './performance-precompiled-dependency-equivalence-20261103.mjs';
import {gzipSync} from 'node:zlib';
import {preparePrecompiledMemberCandidate} from './performance-precompiled-documents-prepare.mjs';
const phase=process.argv[2]||'qualify',file='performance-precompiled-documents-v2-release-20261103.json',account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
const manifest=JSON.parse(readFileSync('performance-precompiled-documents.json')),runtime=readFileSync('performance-precompiled-documents-runtime.mjs','utf8'),proof=JSON.parse(readFileSync('performance-precompiled-documents-qualification.json'));
const hash=b=>createHash('sha256').update(b).digest('hex'),hashes=ms=>Object.fromEntries(ms.map(m=>[m.name,hash(Buffer.from(m.content_base64,'base64'))]).sort(([a],[b])=>a.localeCompare(b)));
for(const f of ['performance-precompiled-documents-runtime.mjs','performance-precompiled-documents-prepare.mjs','performance-precompiled-documents.json'])assert.equal(hash(readFileSync(f)),proof.sourceHashes[f],'Tested source changed: '+f);
assert(proof.verified&&proof.testsPassed===8&&proof.currentLiveDocumentsMatched===6);
const source=JSON.parse(readFileSync('performance-precompiled-deployment-source-20261103.json')).commit,names=['shift-programme-member-20261023','shift-hq-member-comms-20261023'];
const shared=JSON.parse(readFileSync('performance-release-state.json'));
assert(!shared.activeOperation||shared.activeOperation.state==='finished'||shared.activeOperation.source===source,'Another coordinated operation is active');
import {cloudflareRequest as cf} from './performance-precompiled-cloudflare-client-20261103.mjs';
import {provePrivateSettings} from './performance-precompiled-private-settings-20261103.mjs';
const ep=n=>'/accounts/'+account+'/workers/scripts/'+n;
const active=async n=>[...(await cf(ep(n)+'/deployments')).deployments].sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];
const operatingKeys=['usage_model','limits','placement','cache_options','observability','tail_consumers','logpush'];
let state=existsSync(file)?JSON.parse(readFileSync(file)):{kind:'PRECOMPILED_MEMBER_DOCUMENT_GUARDED_RELEASE',source,createdAt:new Date().toISOString(),owners:[],dependencies:[],rows:[],normalTrafficPercent:0};
const save=()=>writeFileSync(file,JSON.stringify(state,null,2)+'\n');
const sharedSave=()=>writeFileSync('performance-release-state.json',JSON.stringify(shared,null,2)+'\n');
async function equivalentDependency(name,id){
 const anchor=manifest.sourceOwners.find(a=>a.name===name);assert(anchor&&!names.includes(name));
 state.dependencyProofs??=[];if(state.dependencyProofs.some(p=>p.name===name&&p.version===id&&p.verified))return;
 assert(state.dependencyProofs.length<4,'Public release activity exceeds this finite operation; preserve active work');
 const cached='performance-precompiled-dependency-'+name+'-'+id+'.json.gz';const v=existsSync(cached)?JSON.parse(gunzipSync(readFileSync(cached))):await cf('/accounts/'+account+'/workers/workers/'+name+'/versions/'+id+'?include=modules');assert.equal(v.id,id);
 const evidence=await provePrivatePassThrough(v,anchor);
 writeFileSync('performance-precompiled-dependency-'+name+'-'+id+'.json.gz',gzipSync(JSON.stringify(v)));
 state.dependencyProofs.push({name,...evidence});save();
 console.log('PRIVATE_DEPENDENCY_EQUIVALENCE_PROVED',name,id,'private modules',evidence.privateModuleCount,'pass-through checks',evidence.rows.length);
}
async function guard(){
 const reads=await Promise.allSettled(state.owners.map(async o=>assert.equal((await active(o.name)).id,o.currentDeployment,'Concurrent app deployment: '+o.name)));
 for(const r of reads)if(r.status==='rejected')throw r.reason;
 for(const o of state.dependencies){
  const d=await active(o.name);if(d.id===o.currentDeployment)continue;
  const live=d.versions.filter(v=>v.percentage>0);assert.equal(live.length,1);assert.equal(live[0].percentage,100);
  if(live[0].version_id!==o.sourceVersion){await equivalentDependency(o.name,live[0].version_id);o.sourceVersion=live[0].version_id;}
  o.currentDeployment=d.id;state.equivalentDependencyUpdates??=[];state.equivalentDependencyUpdates.push({name:o.name,version:o.sourceVersion,deployment:d.id,at:new Date().toISOString()});save();
 }
 for(const o of state.dependencies){
  state.privateSettingsProofs??={};if(state.privateSettingsProofs[o.name]?.version===o.sourceVersion&&state.privateSettingsProofs[o.name]?.privateSettingsMatched)continue;
  const anchor=manifest.sourceOwners.find(a=>a.name===o.name),index=JSON.parse(readFileSync('performance-precompiled-current-source-20261103.json')),reference=index.owners.find(a=>a.name===o.name&&a.version===anchor.version);
  const path='performance-precompiled-dependency-'+o.name+'-'+o.sourceVersion+'.json.gz';
  const bytes=readFileSync(existsSync(path)?path:reference.sourceFile),parsed=JSON.parse((existsSync(path)||reference.sourceFile.endsWith('.gz'))?gunzipSync(bytes):bytes),v=parsed.version||parsed;assert.equal(v.id,o.sourceVersion);
  state.privateSettingsProofs[o.name]=provePrivateSettings(o.name,v,anchor);save();console.log('PRIVATE_DEPENDENCY_SETTINGS_PROVED',o.name,o.sourceVersion);
 }
 assert.deepEqual(await cf('/zones/'+zone+'/workers/routes'),state.routes,'Routes changed');
 for(const o of state.owners){
  assert.deepEqual(await cf(ep(o.name)+'/schedules'),o.schedules,'Schedules changed '+o.name);
  const settings=await cf(ep(o.name)+'/settings');
  for(const k of operatingKeys)assert.deepEqual(settings[k],o.settings[k],'Operating setting changed '+o.name+' '+k);
 }
}
async function verify(o){
 const v=await cf('/accounts/'+account+'/workers/workers/'+o.name+'/versions/'+o.candidateVersion+'?include=modules');
 assert.equal(v.main_module,o.expectedMain);assert.deepEqual(hashes(v.modules),o.expectedHashes);
 const original=JSON.parse(gunzipSync(readFileSync('performance-static-text-current-'+o.name+'.json.gz')));
 assert.deepEqual(v.bindings,original.bindings);assert.equal(v.compatibility_date,original.compatibility_date);assert.deepEqual(v.compatibility_flags||[],original.compatibility_flags||[]);
 assert.deepEqual(v.assets??v.resources?.script_runtime?.assets,original.assets??original.resources?.script_runtime?.assets);
 o.verifiedAt=new Date().toISOString();save();
}
async function publish(o,versions,mode){
 await guard();assert(!o.publicationIntent||o.publicationIntent.completed,'Unknown publication outcome: inspect provider before retry');
 o.publicationIntent={at:new Date().toISOString(),mode,versions,completed:false};save();
 const d=await cf(ep(o.name)+'/deployments','POST',{strategy:'percentage',versions,annotations:{'workers/message':'Approved member document delivery '+source+' '+mode}});
 o.currentDeployment=d.id;save();const a=await active(o.name);assert.equal(a.id,d.id);assert.deepEqual(a.versions,versions);
 o.publicationIntent.completed=true;o[mode+'Deployment']=d.id;save();
 const so=shared.owners.find(x=>x.name===o.name);if(so){so.currentDeployment=d.id;sharedSave();}
 console.log('DOCUMENT_DELIVERY_DISTRIBUTION',mode,o.name,d.id);
}
async function sample(path,cohort,n,appView=false){
 const headers={'Accept-Encoding':'gzip',...(appView?{Cookie:'shift_app_view=1'}:{})};if(cohort==='candidate')headers['Cloudflare-Workers-Version-Overrides']=state.owners.map(o=>o.name+'="'+o.candidateVersion+'"').join(', ');
 const start=performance.now();
 return new Promise((resolve,reject)=>{
  const req=https.get('https://shiftsometimber.co.uk'+path,{headers,agent:false},res=>{
   const headerTime=performance.now()-start,chunks=[];res.on('data',b=>chunks.push(b));res.on('error',reject);res.on('end',()=>{
    try{
     const complete=performance.now()-start;assert.equal(res.statusCode,200);let decoded=Buffer.concat(chunks);
     for(let i=0;i<2&&decoded[0]===31&&decoded[1]===139;i++)decoded=gunzipSync(decoded);
     const expected=appView&&manifest.documents[path].appView?manifest.documents[path].appView:manifest.documents[path];assert.equal(hash(decoded),expected.sha256,'Live document/source mismatch '+path+' '+cohort);
     assert.match(res.headers['cache-control']||'',/no-store/);assert.match(res.headers['cache-control']||'',/private/);
     assert(!/\bpublic\b|\bs-maxage\b|\bimmutable\b/.test(res.headers['cache-control']||''));
     if(['candidate','live'].includes(cohort))assert.equal(res.headers['x-my-timber-document-delivery'],'precompiled-20261103','Candidate override did not select compiled delivery');
     resolve({path,appView,cohort,sample:n,status:200,finalHeadersMs:Math.round(headerTime),completeMs:Math.round(complete),wireBytes:Buffer.concat(chunks).length,htmlSHA256:hash(decoded),delivery:res.headers['x-my-timber-document-delivery']||null});
    }catch(e){reject(e);}
   });
  });req.on('error',reject);req.setTimeout(20000,()=>req.destroy(Error('Finite document delivery sample timeout')));
 });
}

import {readdirSync} from 'node:fs';
function requiredEvidence(){
 assert.equal(state.source,source);assert(state.httpGatePassed&&state.summary.candidate.n===20&&state.summary.candidate.p95Ms<=1755);
 const qa=JSON.parse(readFileSync('performance-precompiled-v2-browser-qualification-20261103.json'));assert(qa.verified&&qa.source===source&&qa.productionWrites===0);
 for(const engine of ['chromium','webkit']){
  const f=JSON.parse(readFileSync('performance-precompiled-candidate-20261103-'+engine+'.json'));assert(f.verified&&f.source===source&&f.productionWrites===0&&f.errors.length===0,'Functional/privacy '+engine);
  const e=JSON.parse(readFileSync('performance-precompiled-expiry-20261103-diagnostic-'+engine+'.json'));assert(e.verified&&e.source===source&&!e.privateVisible&&e.authVisible&&e.reauthenticationRecovered,'Expiry/fresh re-entry '+engine);
 }
 const privacy=JSON.parse(readFileSync('performance-precompiled-http-privacy-20261103.json'));assert(privacy.verified&&privacy.source===source&&privacy.revision===2&&privacy.productionWrites===0);
 const rows=readdirSync('.').filter(n=>n.startsWith('performance-precompiled-distribution-v2-20261103-')&&n.endsWith('.json')).map(n=>JSON.parse(readFileSync(n))).filter(d=>d.verified&&d.source===source&&d.fixtureRevision===2&&d.phase==='candidate'&&d.variant==='cache'&&d.productionWrites===0&&d.productionApiRequests===0).flatMap(d=>d.rows);
 const baseline=readdirSync('.').filter(n=>n.startsWith('performance-distribution-baseline-')&&n.endsWith('.json')).map(n=>JSON.parse(readFileSync(n))).filter(d=>d.verified&&d.fixtureRevision===2&&d.variant==='cache').flatMap(d=>d.rows);
 const p=(xs,q)=>xs.sort((a,b)=>a-b)[Math.ceil(xs.length*q)-1],comparisons=[],flags=[];
 for(const profile of ['good','slow4g'])for(const screen of ['today','journey','shop','grub','fit','support','more'])for(const visit of ['fresh','warm']){
  const a=rows.filter(r=>r.engine==='chromium'&&r.profile===profile&&r.screen===screen&&r.visit===visit),b=baseline.filter(r=>r.engine==='chromium'&&r.profile===profile&&r.screen===screen&&r.visit===visit);
  assert.equal(a.length,20,'Missing/duplicate n20 '+profile+'/'+screen+'/'+visit);assert(b.length>=20,'Missing retained baseline');
  const before=p(b.map(r=>r.usableMs),.95),after=p(a.map(r=>r.usableMs),.95),median=p(a.map(r=>r.usableMs),.5),ack=p(a.map(r=>r.ackMs??Infinity),.95);assert(after<=before,'P95 regression '+profile+'/'+screen+'/'+visit+' '+before+' -> '+after);
  comparisons.push({profile,screen,visit,n:20,beforeP95Ms:before,candidateP95Ms:after,medianMs:median,ackP95Ms:ack});
  if(median>(visit==='fresh'?2000:500))flags.push({profile,screen,visit,reason:'Engineering median target exceeded',medianMs:median});if(ack>100)flags.push({profile,screen,visit,reason:'Tap feedback p95 exceeds100ms',ackP95Ms:ack});
 }
 return {source,at:new Date().toISOString(),verified:true,comparisons,flags,groups:comparisons.length,samples:rows.length,realIPhoneVerified:false,SafariVerified:false};
}
async function restoreOwned(){
 for(const o of [...state.owners].reverse()){
  if(o.restoredAt)continue;const current=await active(o.name);assert.equal(current.id,o.currentDeployment,'Concurrent app release: do not overwrite');
  const d=await cf(ep(o.name)+'/deployments','POST',{strategy:'percentage',versions:o.originalDistribution,annotations:{'workers/message':'Automatic rollback of approved member document repair '+source}});
  o.currentDeployment=d.id;const actual=await active(o.name);assert.equal(actual.id,d.id);assert.deepEqual(actual.versions,o.originalDistribution);o.rollbackDeployment=d.id;o.restoredAt=new Date().toISOString();save();
  const so=shared.owners.find(x=>x.name===o.name);if(so)so.currentDeployment=d.id;sharedSave();console.log('LIVE_DOCUMENT_REPAIR_ROLLED_BACK',o.name,d.id);
 }
}
try{
 assert.equal(phase,'promote');const acceptance=requiredEvidence();writeFileSync('performance-precompiled-v2-acceptance-20261103.json',JSON.stringify(acceptance,null,2)+'\n');
 assert(!state.promotedAt,'Unknown or completed promotion: inspect receipts rather than replaying');
 await guard();state.acceptedAt=new Date().toISOString();state.acceptance=acceptance;save();shared.activeOperation={kind:'approved-member-document-production-release',source,state:'running',pid:process.pid,at:new Date().toISOString()};sharedSave();
 for(const o of state.owners){assert(o.zeroDeployment&&o.verifiedAt&&!o.restoredAt);await publish(o,[{version_id:o.sourceVersion,percentage:0},{version_id:o.candidateVersion,percentage:100}],'live');o.liveAt=new Date().toISOString();save();}
 state.promotedAt=new Date().toISOString();state.normalTrafficPercent=100;save();await new Promise(r=>setTimeout(r,5000));
 state.liveRouteProof=[];for(const path of Object.keys(manifest.documents))for(const app of [false,true]){const r=await sample(path,'live',-1,app);state.liveRouteProof.push(r);save();}
 state.liveSamples=[];for(let n=0;n<20;n++){const r=await sample('/member/dashboard','live',n);state.liveSamples.push(r);save();}
 const p=(xs,q)=>xs.sort((a,b)=>a-b)[Math.ceil(xs.length*q)-1];state.liveHTTP={n:20,medianMs:p(state.liveSamples.map(r=>r.finalHeadersMs),.5),p95Ms:p(state.liveSamples.map(r=>r.finalHeadersMs),.95),limitMs:1755};assert(state.liveHTTP.p95Ms<=1755,'Live final-header p95 failed');
 for(const path of ['/cart','/checkout']){const r=await fetch('https://shiftsometimber.co.uk'+path,{redirect:'manual',signal:AbortSignal.timeout(20000)});assert.equal(r.status,404,'Purchasing hold changed');}
 await guard();state.liveVerifiedAt=new Date().toISOString();state.deploymentVerified=true;save();
 shared.activeOperation={...shared.activeOperation,state:'finished',at:state.liveVerifiedAt,verified:true,receipt:file};sharedSave();
 console.log('PRODUCTION_MEMBER_DOCUMENT_REPAIR_VERIFIED',JSON.stringify({source,deployments:state.owners.map(o=>({name:o.name,version:o.candidateVersion,deployment:o.liveDeployment})),liveHTTP:state.liveHTTP,routeVariants:state.liveRouteProof.length,groups:acceptance.groups,samples:acceptance.samples,flags:acceptance.flags}));
}catch(e){state.liveFailure={at:new Date().toISOString(),message:e.message};save();console.error('PRODUCTION_MEMBER_DOCUMENT_REPAIR_STOPPED',e.message);try{await restoreOwned();}catch(r){state.rollbackFailure={at:new Date().toISOString(),message:r.message};save();console.error('ROLLBACK_BLOCKED',r.message);}shared.activeOperation={...shared.activeOperation,state:'finished',failed:true,at:new Date().toISOString()};sharedSave();process.exitCode=1;}