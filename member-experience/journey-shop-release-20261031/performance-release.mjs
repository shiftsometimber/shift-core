// Scoped continuation of the existing Journey/Shop release lane.
import{evaluateBudget}from'./performance-budget.mjs';
import assert from'node:assert/strict';import{readFileSync,writeFileSync,existsSync}from'node:fs';import{createHash}from'node:crypto';
const phase=process.argv[2],index=Number(process.argv[3]||0),path='performance-release-state.json',account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed',prefix='member-performance-20261101/',baseline=JSON.parse(readFileSync('performance-serving-baseline.json')),build=JSON.parse(readFileSync('performance-build.json')),auth=readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8'),token=process.env.CLOUDFLARE_API_TOKEN||auth.match(/^oauth_token\s*=\s*"([^"\n]+)"/m)?.[1],hash=b=>createHash('sha256').update(b).digest('hex'),hashes=ms=>Object.fromEntries(ms.map(m=>[m.name,hash(Buffer.from(m.content_base64,'base64'))]).sort(([a],[b])=>a.localeCompare(b))),sort=bs=>[...bs].sort((a,b)=>a.name.localeCompare(b.name));
const ep=n=>'/accounts/'+account+'/workers/scripts/'+n,version=(n,id)=>cf('/accounts/'+account+'/workers/workers/'+n+'/versions/'+id+'?include=modules');
let state=existsSync(path)?JSON.parse(readFileSync(path)):{kind:'MY_TIMBER_PERFORMANCE_REPAIR',createdAt:new Date().toISOString(),owners:baseline.owners.map(o=>({name:o.name,currentDeployment:o.deployment.id,previousVersion:o.deployment.versions[0].version_id,oldMain:o.version.main_module,baselineModuleHashes:hashes(o.version.modules)})),source:null};const save=()=>writeFileSync(path,JSON.stringify(state,null,2)+'\n');
let refreshedToken;
async function cf(p,method='GET',body){for(let attempt=0;attempt<2;attempt++){const multi=body instanceof FormData,r=await fetch('https://api.cloudflare.com/client/v4'+p,{method,headers:{Authorization:'Bearer '+(refreshedToken||token),...(body&&!multi?{'Content-Type':'application/json'}:{})},body:multi?body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(55000)}),j=await r.json();if([401,403].includes(r.status)&&attempt===0&&!process.env.CLOUDFLARE_API_TOKEN){const{spawnSync}=await import('node:child_process');const refresh=spawnSync(process.execPath,['/Users/shiftsometimberltd/.npm/_npx/095711ed2bffd7f3/node_modules/wrangler/bin/wrangler.js','deployments','list','--name','shift-core'],{encoding:'utf8',timeout:60000});assert.equal(refresh.status,0,'Read-only Cloudflare credential refresh failed');refreshedToken=readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8').match(/^oauth_token\s*=\s*"([^"\n]+)"/m)?.[1];assert(refreshedToken,'Cloudflare credential refresh absent');continue;}assert(r.ok&&j.success,method+' '+p+' '+JSON.stringify(j.errors));return j.result;}throw Error('Cloudflare request failed after credential refresh');}
const active=async n=>[...(await cf(ep(n)+'/deployments')).deployments].sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];
async function guard(){
 for(const o of state.owners)assert.equal((await active(o.name)).id,o.currentDeployment,'Serving baseline advanced: '+o.name);
 for(const o of baseline.dependencies)assert.equal((await active(o.name)).id,o.deployment.id,'Dependent serving baseline advanced: '+o.name);
 assert.deepEqual(await cf('/zones/'+zone+'/workers/routes'),baseline.routes,'Routes changed');
 for(const o of baseline.owners)assert.deepEqual(await cf(ep(o.name)+'/schedules'),o.schedules,'Schedules changed '+o.name);
}
async function preserve(o,v){const b=baseline.owners.find(x=>x.name===o.name),prior=b.version;
 assert.deepEqual(sort(v.bindings),sort(prior.bindings));assert.equal(v.compatibility_date,prior.compatibility_date);assert.deepEqual(v.compatibility_flags||[],prior.compatibility_flags||[]);assert.deepEqual(v.assets??v.resources?.script_runtime?.assets,prior.assets??prior.resources?.script_runtime?.assets);
 const settings=await cf(ep(o.name)+'/settings');
 for(const k of ['usage_model','limits','placement','cache_options','observability','tail_consumers','logpush']){const expected=prior[k]??prior.resources?.script_runtime?.[k]??b.settings[k],actual=v[k]??v.resources?.script_runtime?.[k]??settings[k];if(expected!==undefined)assert.deepEqual(actual,expected,k+' changed');}
}
async function verify(o){const v=await version(o.name,o.versionId);await preserve(o,v);assert.equal(v.main_module,prefix+'entry.mjs');assert.deepEqual(hashes(v.modules),o.moduleHashes);}
async function stage(o,i){
 await guard();if(o.versionId){await verify(o);return;}assert(!o.uploadIntent,'Unknown upload outcome; inspect provider');
 const source=JSON.parse(readFileSync('performance-source.json'));assert.match(source.commit,/^[a-f0-9]{40}$/);assert.equal(source.bundleSHA256,build.bundleSHA256);
 state.source??=source.commit;assert.equal(state.source,source.commit);
 const v=await version(o.name,o.previousVersion);await preserve(o,v);assert.deepEqual(hashes(v.modules),o.baselineModuleHashes);
 const modules=v.modules.map(m=>({...m})),kind=['core','programme','documents'][i];
 const add=(name,body)=>{assert(!modules.some(m=>m.name===prefix+name),'Do not layer another performance wrapper');modules.push({name:prefix+name,content_type:'application/javascript+module',content_base64:Buffer.from(body).toString('base64')});};
 const bundle=readFileSync('performance-delivery-bundle.mjs'),assets=readFileSync('performance-assets.mjs');
 assert.equal(hash(bundle),build.bundleSHA256);assert.equal(hash(assets),build.assetsSHA256);
 add('delivery.mjs',bundle);add('assets.mjs',assets);
 if(i===0){
  const data=readFileSync('performance-public-sources.mjs');assert.equal(hash(data),build.publicSourcesSHA256);add('public-screen-sources.mjs',data);
  const m=modules.find(m=>m.name==='worker.js'),text=Buffer.from(m.content_base64,'base64').toString(),needle='async function publicPagesAsset(request, targetPath) {';
  assert.equal(text.split(needle).length,2);
  const patch="\n  const __mtBaseURL=new URL(request.url);if(targetPath)__mtBaseURL.pathname=targetPath;const __mtBase=__mtPublicScreenSources[__mtBaseURL.pathname+__mtBaseURL.search];\n  if(__mtBase&&['GET','HEAD'].includes(request.method)&&request.headers.get('X-My-Timber-Profile-Original')!=='1'){const h=new Headers(__mtBase.headers);h.set('Cache-Control','no-store, must-revalidate');h.set('X-Shift-Frontend-Authority','pages:cos-live-recovery-20260909-r2');h.set('Server-Timing','mt-public-base;dur=0');return new Response(request.method==='HEAD'?null:__mtBase.html,{status:__mtBase.status,headers:h});}\n";
  m.content_base64=Buffer.from('import {publicSources as __mtPublicScreenSources} from "./'+prefix+'public-screen-sources.mjs";\n'+text.replace(needle,needle+patch)).toString('base64');
 }
 add('entry.mjs','import original from "../'+o.oldMain+'";\nexport * from "../'+o.oldMain+'";\nimport {wrapMemberPerformance} from "./delivery.mjs";\nimport {assets} from "./assets.mjs";\nexport default wrapMemberPerformance(original,{},assets,"'+kind+'");\n');
 o.moduleHashes=hashes(modules);o.changedOriginalModules=Object.keys(o.baselineModuleHashes).filter(k=>o.moduleHashes[k]!==o.baselineModuleHashes[k]);assert.deepEqual(o.changedOriginalModules,i===0?['worker.js']:[]);
 const b=baseline.owners[i],runtime=v.resources?.script_runtime||{},operating={};
 for(const k of ['usage_model','limits','placement','cache_options','observability','tail_consumers','logpush']){const x=v[k]??runtime[k]??b.settings[k];if(x!==undefined)operating[k]=x;}
 const metadata={main_module:prefix+'entry.mjs',compatibility_date:v.compatibility_date,compatibility_flags:v.compatibility_flags||[],bindings:v.bindings.map(b=>({type:'inherit',name:b.name})),keep_assets:true,...operating,annotations:{'workers/message':'Approved My Timber performance repair '+state.source,'workers/tag':'mt-perf-'+state.source.slice(0,12)}},form=new FormData();
 form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');for(const m of modules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type||'application/javascript+module'}),m.name);
 o.uploadIntent={at:new Date().toISOString(),source:state.source,baseline:o.currentDeployment};save();await guard();
 const u=await cf(ep(o.name)+'/versions?bindings_inheritance=strict','POST',form);o.versionId=u.id;save();await verify(o);await guard();o.stagedAt=new Date().toISOString();save();console.log('PERFORMANCE_VERSION_VERIFIED',o.name,o.versionId,o.changedOriginalModules);
}
async function deploy(o,mode){
 await guard();await verify(o);
 const versions=mode==='zero'?[{version_id:o.previousVersion,percentage:100},{version_id:o.versionId,percentage:0}]:mode==='rollback'?[{version_id:o.previousVersion,percentage:100}]:[{version_id:o.previousVersion,percentage:0},{version_id:o.versionId,percentage:100}];
 if(mode==='live'){assert(state.acceptedAt);assert(o.zeroAt);}
 assert(!o.deploymentIntent||o.deploymentIntent.finished,'Unknown publication outcome; inspect first');
 o.deploymentIntent={mode,at:new Date().toISOString(),versions,finished:false};save();
 const d=await cf(ep(o.name)+'/deployments','POST',{strategy:'percentage',versions,annotations:{'workers/message':'My Timber performance '+state.source+' '+mode}});
 o.currentDeployment=d.id;save();const a=await active(o.name);assert.equal(a.id,d.id);assert.deepEqual(a.versions,versions);o.deploymentIntent.finished=true;o[mode+'At']=new Date().toISOString();save();await guard();console.log('PERFORMANCE_PUBLICATION_VERIFIED',mode,o.name,o.versionId,d.id);
}
try{
 if(phase==='guard')await guard();
 else if(phase==='stage')await stage(state.owners[index],index);
 else if(['zero','live','rollback'].includes(phase))await deploy(state.owners[index],phase);
 else if(phase==='accept'){await guard();for(const engine of ['chromium','webkit']){const r=JSON.parse(readFileSync('performance-candidate-'+engine+'.json'));assert(r.verified&&r.source===state.source);}if(build.scope==='static'){const proof=JSON.parse(readFileSync('performance-safe-slice-source-proof.json')),security=JSON.parse(readFileSync('performance-candidate-privacy.json'));assert(proof.verified&&proof.transportEnabled===false&&proof.loginSessionIdentityChanges===0&&proof.resources.length===61);assert(security.verified&&security.source===state.source);if(build.staticMode==='public-resource-only'){assert(proof.privateDocumentPassThrough);state.performanceBudget={coverageComplete:false,flag:'LIVE_N20_REQUIRED',automaticRollbackRequired:true};}else assert(evaluateBudget('candidate').passed,'Static candidate p95, privacy or coverage failed');for(const engine of ['chromium','webkit']){const r=JSON.parse(readFileSync('performance-expiry-diagnostic-'+engine+'.json'));assert(r.verified&&r.source===state.source&&!r.privateVisible&&r.authVisible,'Sign-in recovery '+engine);}}else {for(const engine of ['chromium','webkit']){const r=JSON.parse(readFileSync('performance-expiry-diagnostic-'+engine+'.json'));assert(r.verified&&r.source===state.source&&r.reauthenticationRecovered,'Fresh sign-in recovery '+engine);}assert(evaluateBudget('candidate').passed,'Performance budget or privacy check failed');}state.acceptedAt=new Date().toISOString();save();console.log('PERFORMANCE_CANDIDATE_ACCEPTED');}
 else if(phase==='status'){for(const o of state.owners){const a=await active(o.name);console.log('SERVING',o.name,a.id,JSON.stringify(a.versions));}}
 else throw Error('Unknown phase');state.updatedAt=new Date().toISOString();delete state.failure;save();
}catch(e){state.failure={phase,index,at:new Date().toISOString(),message:e.message};save();console.error('PERFORMANCE_RELEASE_STOPPED',e.message);process.exitCode=1;}
