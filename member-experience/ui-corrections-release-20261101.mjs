// Scoped correction: replace only the owned programme factory; preserve all other
// serving modules, configuration and dashboard. Persist intent before mutations.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const phase=process.argv[2],file='ui-corrections-release-20261101.json';
const name='shift-programme-member-20261023',documents='shift-hq-member-comms-20261023',owned='journey-shop-release-20261031/programme.mjs';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
const base='/accounts/'+account+'/workers/',endpoint=n=>base+'scripts/'+n;
const auth=readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8');
const token=process.env.CLOUDFLARE_API_TOKEN||auth.match(/^oauth_token\s*=\s*"([^"\n]+)"/m)?.[1];assert(token);
const digest=b=>createHash('sha256').update(b).digest('hex');
const hashes=ms=>Object.fromEntries(ms.map(m=>[m.name,digest(Buffer.from(m.content_base64,'base64'))]).sort(([a],[b])=>a.localeCompare(b)));
const sorted=bs=>[...bs].sort((a,b)=>a.name.localeCompare(b.name));
let state=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{kind:'MY_TIMBER_SCOPED_UI_CORRECTIONS',createdAt:new Date().toISOString(),worker:name,ownedModule:owned};
const save=()=>writeFileSync(file,JSON.stringify(state,null,2)+'\n');
async function cf(path,method='GET',body){
 const multi=body instanceof FormData,r=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers:{Authorization:'Bearer '+token,...(body&&!multi?{'Content-Type':'application/json'}:{})},body:multi?body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(55000)});
 const j=await r.json();assert(r.ok&&j.success,'Provider '+method+' '+path+': '+JSON.stringify(j.errors));return j.result;
}
const active=async n=>[...(await cf(endpoint(n)+'/deployments')).deployments].sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];
const version=(n,id)=>cf(base+'workers/'+n+'/versions/'+id+'?include=modules');
const routes=()=>cf('/zones/'+zone+'/workers/routes');
const serving=a=>{const vs=a.versions.filter(v=>v.percentage===100);assert.equal(vs.length,1);return vs[0].version_id;};
async function preserved(v){
 assert.equal(v.main_module,state.mainModule);assert.deepEqual(sorted(v.bindings),sorted(state.bindings));
 assert.equal(v.compatibility_date,state.compatibilityDate);assert.deepEqual(v.compatibility_flags||[],state.compatibilityFlags);
 assert.deepEqual(v.assets??v.resources?.script_runtime?.assets,state.assets);
 for(const [k,x]of Object.entries(state.operatingConfiguration))assert.deepEqual(v[k]??v.resources?.script_runtime?.[k]??(await cf(endpoint(name)+'/settings'))[k],x,k+' changed');
}
async function guard(){
 const a=await active(name);assert.equal(a.id,state.currentDeployment,'Concurrent programme deployment; reconcile before continuing');
 assert.equal((await active(documents)).id,state.documentsDeployment,'Concurrent dashboard deployment; reconcile before continuing');
 assert.deepEqual(await routes(),state.routes,'Routes changed');assert.deepEqual(await cf(endpoint(name)+'/schedules'),state.schedules,'Schedules changed');return a;
}
async function verifiedCandidate(){
 const v=await version(name,state.versionId);await preserved(v);assert.deepEqual(hashes(v.modules),state.moduleHashes);return v;
}
async function baseline(){
 if(state.baselineVerifiedAt){await guard();console.log('BASELINE_REUSED',state.previousVersion);return;}
 const a=await active(name);assert.equal(a.id,'9199c398-896d-4606-a1b6-b2e08f3b5088');assert.equal(serving(a),'d908e3e1-58e3-4c8f-b639-6fb8a852f6b2');
 const doc=await active(documents);assert.equal(serving(doc),'22502fcc-9844-49ee-aae4-ecac00842d3a');
 const v=await version(name,serving(a)),settings=await cf(endpoint(name)+'/settings'),runtime=v.resources?.script_runtime||{};
 assert.equal(v.main_module,'journey-shop-release-20261031/entry.mjs');assert.equal(v.modules.length,15);assert.equal(v.bindings.length,7);
 const beforeHashes=hashes(v.modules);assert.equal(beforeHashes[owned],'0f14b6f81b2949e07a94db9ad5644992bbc8350a423d96b9490c4d0e602254ce');
 state={...state,previousVersion:serving(a),baselineDeployment:a.id,currentDeployment:a.id,documentsVersion:serving(doc),documentsDeployment:doc.id,mainModule:v.main_module,bindings:v.bindings,baselineModuleHashes:beforeHashes,compatibilityDate:v.compatibility_date,compatibilityFlags:v.compatibility_flags||[],assets:v.assets??runtime.assets,operatingConfiguration:{},schedules:await cf(endpoint(name)+'/schedules'),routes:await routes()};
 for(const key of ['usage_model','limits','placement','cache_options','observability','tail_consumers','logpush']){const x=v[key]??runtime[key]??settings[key];if(x!==undefined)state.operatingConfiguration[key]=x;}
 state.baselineVerifiedAt=new Date().toISOString();save();await guard();console.log('CURRENT_BASELINE_VERIFIED',state.previousVersion,state.documentsVersion,'modules',v.modules.length);
}
async function stage(){
 assert(state.baselineVerifiedAt);await guard();
 if(state.versionId){await verifiedCandidate();console.log('UPLOAD_REUSED',state.versionId);return;}
 assert(!state.uploadIntent,'Unknown previous upload; inspect provider before retrying');
 const source=JSON.parse(readFileSync('ui-corrections-source.json','utf8'));assert.match(source.commit,/^[a-f0-9]{40}$/);
 const v=await version(name,state.previousVersion);await preserved(v);assert.deepEqual(hashes(v.modules),state.baselineModuleHashes);
 const bundle=readFileSync('bundle-programme.mjs');assert.equal(digest(bundle),'f7db9ebdf589239c9f8490a187d9d21e64efa85007e4c4eb03bbb4cfa03fc0cd');
 const m=v.modules.find(m=>m.name===owned);assert(m);m.content_base64=bundle.toString('base64');
 state.source=source.commit;state.moduleHashes=hashes(v.modules);state.bundleSHA256=digest(bundle);
 assert.deepEqual(Object.keys(state.moduleHashes).filter(k=>state.moduleHashes[k]!==state.baselineModuleHashes[k]),[owned]);
 const metadata={main_module:state.mainModule,compatibility_date:state.compatibilityDate,compatibility_flags:state.compatibilityFlags,bindings:state.bindings.map(b=>({type:'inherit',name:b.name})),keep_assets:true,annotations:{'workers/message':'Matt-approved Shop arrows and Journey guide correction '+source.commit,'workers/tag':'ui-corrections-'+source.commit.slice(0,12)},...state.operatingConfiguration};
 const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');
 for(const m of v.modules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type||'application/javascript+module'}),m.name);
 state.uploadIntent={at:new Date().toISOString(),source:source.commit,baseline:state.currentDeployment};save();await guard();
 const uploaded=await cf(endpoint(name)+'/versions?bindings_inheritance=strict','POST',form);state.versionId=uploaded.id;save();
 await verifiedCandidate();await guard();state.stagedVerifiedAt=new Date().toISOString();save();console.log('SCOPED_UPLOAD_VERIFIED',name,state.versionId,state.source);
 const prior=JSON.parse(readFileSync('journey-shop-publication-state.json','utf8'));
 writeFileSync('ui-corrections-production-state.json',JSON.stringify({source:state.source,owners:prior.owners.map(s=>s.name===name?{...s,versionId:state.versionId}:s)},null,2)+'\n');
}
async function deploy(mode){
 assert(state.stagedVerifiedAt);await verifiedCandidate();
 const desired=mode==='zero'?[{version_id:state.previousVersion,percentage:100},{version_id:state.versionId,percentage:0}]:[{version_id:state.versionId,percentage:100}];
 const message='My Timber UI corrections '+state.source+' '+mode;
 let before=await active(name);
 if(before.annotations?.['workers/message']===message&&JSON.stringify(before.versions)===JSON.stringify(desired)){
  state.currentDeployment=before.id;state[mode+'VerifiedAt']=new Date().toISOString();save();await guard();console.log('DEPLOYMENT_RECONCILED',mode,before.id);return;
 }
 await guard();if(mode==='live'){assert(state.zeroVerifiedAt);assert(state.candidateAcceptanceAt,'Actual served candidate must pass before promotion');}
 assert(!state.deploymentIntent||state.deploymentIntent.finished,'Unknown deployment outcome; inspect provider before retrying');
 state.deploymentIntent={mode,message,previousDeployment:before.id,attemptedAt:new Date().toISOString(),finished:false};save();
 const published=await cf(endpoint(name)+'/deployments','POST',{strategy:'percentage',versions:desired,annotations:{'workers/message':message}});
 state.currentDeployment=published.id;save();const observed=await active(name);assert.equal(observed.id,published.id);assert.deepEqual(observed.versions,desired);
 state[mode+'VerifiedAt']=new Date().toISOString();state.deploymentIntent.finished=true;save();await guard();console.log('PUBLICATION_VERIFIED',mode,name,state.versionId,published.id);
}
async function accept(){
 assert(state.zeroVerifiedAt);await guard();
 const receipts=['ui-corrections-production-candidate.json','shop-browser-proof/served-candidate-chromium-20261101/receipt.json','shop-browser-proof/served-candidate-webkit-20261101/receipt.json'];
 state.candidateAcceptance=[];
 for(const path of receipts){const bytes=readFileSync(path),r=JSON.parse(bytes);if(r.phase){assert(r.verified);assert.equal(r.source,state.source);}else{assert.equal(r.checks,34);assert.equal(r.productionWrites,0);assert.equal(r.checkoutPosts,0);}state.candidateAcceptance.push({path,sha256:digest(bytes)});}
 state.candidateAcceptanceAt=new Date().toISOString();save();console.log('SERVED_CANDIDATE_ACCEPTED',state.versionId);
}
try{
 if(phase==='baseline')await baseline();else if(phase==='stage')await stage();else if(phase==='zero'||phase==='live')await deploy(phase);else if(phase==='accept')await accept();else if(phase==='status'){for(const n of[name,documents]){const a=await active(n);console.log('CURRENT_PROVIDER_STATE',JSON.stringify({name:n,id:a.id,versions:a.versions,message:a.annotations?.['workers/message']}));}}else throw Error('Use baseline, stage, zero, accept, live or status');
 state.lastSuccessfulPhase=phase;state.updatedAt=new Date().toISOString();delete state.failure;save();
}catch(e){state.failure={phase,message:e.message,at:new Date().toISOString()};save();console.error('SCOPED_CORRECTION_STOPPED',e.message);process.exitCode=1;}
