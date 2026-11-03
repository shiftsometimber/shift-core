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
const phase=process.argv[2]||'qualify',file='performance-precompiled-documents-scoped-release-20261103.json',account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
const manifest=JSON.parse(readFileSync('performance-precompiled-documents.json')),runtime=readFileSync('performance-precompiled-documents-runtime.mjs','utf8'),proof=JSON.parse(readFileSync('performance-precompiled-documents-qualification.json'));
const hash=b=>createHash('sha256').update(b).digest('hex'),hashes=ms=>Object.fromEntries(ms.map(m=>[m.name,hash(Buffer.from(m.content_base64,'base64'))]).sort(([a],[b])=>a.localeCompare(b)));
for(const f of ['performance-precompiled-documents-runtime.mjs','performance-precompiled-documents-prepare.mjs','performance-precompiled-documents.json'])assert.equal(hash(readFileSync(f)),proof.sourceHashes[f],'Tested source changed: '+f);
assert(proof.verified&&proof.testsPassed===6&&proof.currentLiveDocumentsMatched===3);
const source=JSON.parse(readFileSync('performance-precompiled-deployment-source-20261103.json')).commit,names=['shift-programme-member-20261023','shift-hq-member-comms-20261023'];
const shared=JSON.parse(readFileSync('performance-release-state.json'));
assert(!shared.activeOperation||shared.activeOperation.state==='finished','Another coordinated operation is active');
let token=process.env.CLOUDFLARE_API_TOKEN||readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8').match(/^oauth_token\s*=\s*"([^"\n]+)"/m)?.[1],refreshed=false;
async function cf(p,method='GET',body){
 for(let n=0;n<2;n++){
  const multi=body instanceof FormData,r=await fetch('https://api.cloudflare.com/client/v4'+p,{method,headers:{Authorization:'Bearer '+token,...(body&&!multi?{'Content-Type':'application/json'}:{})},body:multi?body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(55000)}),j=await r.json();
  if(r.status===401&&!refreshed&&!process.env.CLOUDFLARE_API_TOKEN){refreshed=true;const x=spawnSync(process.execPath,['/Users/shiftsometimberltd/.npm/_npx/095711ed2bffd7f3/node_modules/wrangler/bin/wrangler.js','deployments','list','--name','shift-core'],{encoding:'utf8',timeout:60000});assert.equal(x.status,0,'Read-only credential refresh failed');token=readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8').match(/^oauth_token\s*=\s*"([^"\n]+)"/m)?.[1];continue;}
  assert(r.ok&&j.success,method+' '+p+' '+JSON.stringify(j.errors));return j.result;
 }throw Error('Provider credential unavailable');
}
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
 const v=await cf('/accounts/'+account+'/workers/workers/'+name+'/versions/'+id+'?include=modules');
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
async function sample(path,cohort,n){
 const headers={'Accept-Encoding':'gzip'};if(cohort==='candidate')headers['Cloudflare-Workers-Version-Overrides']=state.owners.map(o=>o.name+'="'+o.candidateVersion+'"').join(', ');
 const start=performance.now();
 return new Promise((resolve,reject)=>{
  const req=https.get('https://shiftsometimber.co.uk'+path,{headers,agent:false},res=>{
   const headerTime=performance.now()-start,chunks=[];res.on('data',b=>chunks.push(b));res.on('error',reject);res.on('end',()=>{
    try{
     const complete=performance.now()-start;assert.equal(res.statusCode,200);let decoded=Buffer.concat(chunks);
     for(let i=0;i<2&&decoded[0]===31&&decoded[1]===139;i++)decoded=gunzipSync(decoded);
     assert.equal(hash(decoded),manifest.documents[path].sha256,'Live document/source mismatch '+path+' '+cohort);
     assert.match(res.headers['cache-control']||'',/no-store/);assert.match(res.headers['cache-control']||'',/private/);
     assert(!/\bpublic\b|\bs-maxage\b|\bimmutable\b/.test(res.headers['cache-control']||''));
     if(cohort==='candidate')assert.equal(res.headers['x-my-timber-document-delivery'],'precompiled-20261102','Candidate override did not select compiled delivery');
     resolve({path,cohort,sample:n,status:200,finalHeadersMs:Math.round(headerTime),completeMs:Math.round(complete),wireBytes:Buffer.concat(chunks).length,htmlSHA256:hash(decoded),delivery:res.headers['x-my-timber-document-delivery']||null});
    }catch(e){reject(e);}
   });
  });req.on('error',reject);req.setTimeout(20000,()=>req.destroy(Error('Finite document delivery sample timeout')));
 });
}
let successful=false,claimed=false;
try{
 assert.equal(phase,'qualify','This finite controller cannot promote normal traffic');
 assert.equal(state.source,source);assert(!state.finishedAt,'Completed qualification must not be rerun unchanged');
 shared.activeOperation={kind:'precompiled-document-qualification',owner:'current explicitly delegated Deploy operation',pid:process.pid,state:'running',source,at:new Date().toISOString()};sharedSave();claimed=true;
 if(!state.capturedAt){
  const anchors=manifest.sourceOwners;
  state.routes=await cf('/zones/'+zone+'/workers/routes');
  for(const a of anchors){
   const d=await active(a.name),normal=d.versions.filter(x=>x.percentage>0);assert.equal(normal.length,1);assert.equal(normal[0].percentage,100);if(names.includes(a.name))assert.equal(normal[0].version_id,a.version,'App source advanced: '+a.name);else if(normal[0].version_id!==a.version)await equivalentDependency(a.name,normal[0].version_id);
   const item={name:a.name,sourceVersion:normal[0].version_id,currentDeployment:d.id,originalDistribution:d.versions};
   if(names.includes(a.name)){
    const raw=JSON.parse(gunzipSync(readFileSync('performance-static-text-current-'+a.name+'.json.gz')));assert.equal(raw.id,a.version);
    item.settings=await cf(ep(a.name)+'/settings');item.schedules=await cf(ep(a.name)+'/schedules');state.owners.push(item);
   }else state.dependencies.push(item);
  }
  state.capturedAt=new Date().toISOString();save();
 }
 await guard();
 for(const o of state.owners){
  if(o.candidateVersion){assert(o.verifiedAt);continue;}
  assert(!o.uploadIntent,'Unknown upload outcome; inspect provider');
  const v=JSON.parse(gunzipSync(readFileSync('performance-static-text-current-'+o.name+'.json.gz'))),candidate=preparePrecompiledMemberCandidate(v,manifest,o.name,{runtime});
  const operating={};for(const k of operatingKeys){const x=v[k]??v.resources?.script_runtime?.[k]??o.settings[k];if(x!==undefined)operating[k]=x;}
  const meta={main_module:candidate.main_module,compatibility_date:v.compatibility_date,compatibility_flags:v.compatibility_flags||[],bindings:v.bindings.map(b=>({type:'inherit',name:b.name})),keep_assets:true,...operating,annotations:{'workers/message':'Approved byte-identical member documents '+source}};
  o.expectedHashes=hashes(candidate.modules);o.expectedMain=candidate.main_module;
  const form=new FormData();form.set('metadata',new Blob([JSON.stringify(meta)],{type:'application/json'}),'metadata.json');
  for(const m of candidate.modules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type||'application/javascript+module'}),m.name);
  await guard();o.uploadIntent={at:new Date().toISOString(),source};save();const up=await cf(ep(o.name)+'/versions?bindings_inheritance=strict','POST',form);
  o.candidateVersion=up.id;save();await verify(o);await guard();console.log('DOCUMENT_DELIVERY_VERSION_VERIFIED',o.name,o.candidateVersion);
 }
 for(const o of state.owners){await publish(o,[{version_id:o.sourceVersion,percentage:100},{version_id:o.candidateVersion,percentage:0}],'zero');o.zeroAt=new Date().toISOString();save();}
 for(const path of Object.keys(manifest.documents)){const row=await sample(path,'candidate',-1);state.routeProof??=[];state.routeProof.push(row);save();console.log('DOCUMENT_DELIVERY_ROUTE_PROVED',path,row.finalHeadersMs);}
 for(let n=0;n<20;n++)for(const cohort of n%2?['candidate','control']:['control','candidate']){
  const row=await sample('/member/dashboard?view=app',cohort,n);state.rows.push(row);save();console.log('DOCUMENT_DELIVERY_SAMPLE',cohort,n,row.finalHeadersMs);
 }
 const percentile=(xs,p)=>xs.sort((a,b)=>a-b)[Math.ceil(xs.length*p)-1];state.summary={};
 for(const cohort of ['control','candidate']){const rows=state.rows.filter(r=>r.cohort===cohort);assert.equal(rows.length,20);state.summary[cohort]={n:20,medianMs:percentile(rows.map(r=>r.finalHeadersMs),.5),p95Ms:percentile(rows.map(r=>r.finalHeadersMs),.95)};}
 state.retainedP95LimitMs=1755;state.httpGatePassed=state.summary.candidate.p95Ms<=1755;state.qualifiedAt=new Date().toISOString();save();
 console.log('DOCUMENT_DELIVERY_N20_RESULT',JSON.stringify({summary:state.summary,limit:1755,passed:state.httpGatePassed}));
 successful=state.httpGatePassed;
}catch(e){state.failure={at:new Date().toISOString(),message:e.message};save();console.error('DOCUMENT_DELIVERY_STOPPED',e.message);process.exitCode=1;}
finally{
 for(const o of [...state.owners].reverse()){
  if(!o.zeroDeployment||o.restoredAt)continue;
  try{await publish(o,o.originalDistribution,'restore');o.restoredAt=new Date().toISOString();save();}
  catch(e){state.restoreFailure={owner:o.name,at:new Date().toISOString(),message:e.message};save();console.error('DOCUMENT_DELIVERY_RESTORE_BLOCKED',o.name,e.message);process.exitCode=1;}
 }
 state.finishedAt=new Date().toISOString();state.remaining='No promotion. Original distributions restored. Passing candidate requires remaining browser/privacy/expiry qualification before live release.';save();
 if(claimed){shared.activeOperation={...shared.activeOperation,state:'finished',finishedAt:state.finishedAt,receipt:file,passed:successful};sharedSave();}
 console.log('DOCUMENT_DELIVERY_FINITE_OPERATION_FINISHED',successful?'HTTP_GATE_PASSED_REMAINING_GATES_REQUIRED':'NOT_QUALIFIED_NO_PROMOTION');
}
