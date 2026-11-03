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
     if(cohort==='candidate')assert.equal(res.headers['x-my-timber-document-delivery'],'precompiled-20261103','Candidate override did not select compiled delivery');
     resolve({path,appView,cohort,sample:n,status:200,finalHeadersMs:Math.round(headerTime),completeMs:Math.round(complete),wireBytes:Buffer.concat(chunks).length,htmlSHA256:hash(decoded),delivery:res.headers['x-my-timber-document-delivery']||null});
    }catch(e){reject(e);}
   });
  });req.on('error',reject);req.setTimeout(20000,()=>req.destroy(Error('Finite document delivery sample timeout')));
 });
}
const note=(status)=>{shared.activeOperation={kind:'precompiled-document-browser-release',source,state:status,pid:process.pid,at:new Date().toISOString(),receipt:file};sharedSave();};
async function restoreOwned(){
 for(const o of [...state.owners].reverse()){
  if(!o.zeroDeployment||o.restoredAt)continue;
  const current=await active(o.name);assert.equal(current.id,o.currentDeployment,'Concurrent app operation; do not overwrite');
  const d=await cf(ep(o.name)+'/deployments','POST',{strategy:'percentage',versions:o.originalDistribution,annotations:{'workers/message':'Restore original member distribution after guarded qualification '+source}});
  o.currentDeployment=d.id;const a=await active(o.name);assert.equal(a.id,d.id);assert.deepEqual(a.versions,o.originalDistribution);
  o.restoredAt=new Date().toISOString();o.restoreDeployment=d.id;const so=shared.owners.find(x=>x.name===o.name);if(so)so.currentDeployment=d.id;save();sharedSave();console.log('DOCUMENT_DELIVERY_ORIGINAL_RESTORED',o.name,d.id);
 }
}
try{
 assert(state.httpGatePassed&&state.summary.candidate.n===20&&state.summary.candidate.p95Ms<=1755,'Initial n20 gate missing');
 if(phase==='open'){
  note('running');await guard();
  for(const o of state.owners){assert(o.verifiedAt);await publish(o,[{version_id:o.sourceVersion,percentage:100},{version_id:o.candidateVersion,percentage:0}],'zero');delete o.restoredAt;o.zeroAt=new Date().toISOString();save();}
  writeFileSync('performance-precompiled-browser-state-20261103.json',JSON.stringify({source,owners:state.owners.map(o=>({name:o.name,versionId:o.candidateVersion,previousVersion:o.sourceVersion})),sourceVersions:[...state.owners,...state.dependencies].map(o=>({name:o.name,version:o.sourceVersion}))},null,2)+'\n');
  state.browserQualificationOpenedAt=new Date().toISOString();save();note('zero-traffic-qualification');console.log('DOCUMENT_DELIVERY_BROWSER_QUALIFICATION_AT_ZERO');
 }else if(phase==='close'){
  await restoreOwned();state.browserQualificationClosedAt=new Date().toISOString();save();note('finished');console.log('DOCUMENT_DELIVERY_QUALIFICATION_CLOSED_NO_PROMOTION');
 }else throw Error('Only guarded open/close phases supported');
}catch(e){state.browserQualificationFailure={at:new Date().toISOString(),phase,message:e.message};save();try{await restoreOwned();}catch(r){state.restoreFailure={at:new Date().toISOString(),message:r.message};save();}note('finished');console.error('DOCUMENT_DELIVERY_BROWSER_PHASE_STOPPED',e.message);process.exitCode=1;}