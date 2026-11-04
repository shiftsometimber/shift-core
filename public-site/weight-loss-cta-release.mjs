import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {relabelWeightLossCtas,WEIGHT_LOSS_CTA_RELEASE} from './weight-loss-cta.mjs';
const phase=process.argv[2],account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
const dir='/private/tmp/explore-weight-loss-cta-evidence-20261104',statePath=dir+'/state.json',prefix='explore-weight-loss-20261104/';
mkdirSync(dir,{recursive:true,mode:0o700});
const hash=b=>createHash('sha256').update(b).digest('hex');
const hashes=ms=>Object.fromEntries(ms.map(m=>[m.name,hash(Buffer.from(m.content_base64,'base64'))]).sort(([a],[b])=>a.localeCompare(b)));
const sorted=bs=>[...bs].sort((a,b)=>a.name.localeCompare(b.name));
const auth=readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8');
const token=process.env.CLOUDFLARE_API_TOKEN||auth.match(/^oauth_token\s*=\s*"([^"\n]+)"/m)?.[1];assert(token);
const source=()=>execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
let state=existsSync(statePath)?JSON.parse(readFileSync(statePath)):{kind:'OWNER_APPROVED_EXPLORE_WEIGHT_LOSS_20261104',createdAt:new Date().toISOString(),owners:[],skipped:[]};
const save=()=>writeFileSync(statePath,JSON.stringify(state,null,2)+'\n',{mode:0o600});
const ep=name=>'/accounts/'+account+'/workers/scripts/'+name;
async function cf(path,method='GET',body){
 const multi=body instanceof FormData;
 const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers:{Authorization:'Bearer '+token,...(body&&!multi?{'Content-Type':'application/json'}:{})},body:multi?body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(55000)});
 const j=await r.json();assert(r.ok&&j.success,method+' '+path+': '+JSON.stringify(j.errors));return j.result;
}
const routes=()=>cf('/zones/'+zone+'/workers/routes');
const active=async name=>[...(await cf(ep(name)+'/deployments')).deployments].sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];
const version=(name,id)=>cf('/accounts/'+account+'/workers/workers/'+name+'/versions/'+id+'?include=modules');
const versionId=a=>{assert.equal(a.versions.length,1,'No split baseline');assert.equal(a.versions[0].percentage,100);return a.versions[0].version_id;};
function routePath(pattern){
 const clean=pattern.replace(/^https?:\/\//,'');
 if(!/^(?:www\.)?shiftsometimber\.co\.uk\//.test(clean))return null;
 const path=clean.slice(clean.indexOf('/')).replace(/\*.*$/,'')||'/';
 if(/^\/(?:member(?:[-/]|$)|v1(?:\/|$)|hq(?:\/|$)|admin(?:\/|$)|api(?:\/|$)|assets(?:\/|$)|clinical-review(?:\/|$)|communications(?:\/|$)|timber-shed(?:\/|$))/.test(path))return null;
 if(/\.(?:m?js|css|json|xml|txt|webp|png|jpg|ico|woff2?|pdf)$/i.test(path))return null;
 return path;
}
async function page(path,overrides){
 const r=await fetch('https://shiftsometimber.co.uk'+path,{redirect:'follow',headers:overrides?{'Cloudflare-Workers-Version-Overrides':overrides,'CF-Workers-Version-Overrides':overrides}:{},signal:AbortSignal.timeout(45000)});
 return {status:r.status,type:r.headers.get('Content-Type')||'',label:r.headers.get('X-Shift-Weight-Loss-CTA'),url:r.url,body:await r.text()};
}
async function guard(o){
 assert.equal((await active(o.name)).id,o.currentDeployment,'Concurrent release for '+o.name+'; retain the newer version');
 assert.deepEqual(await routes(),state.routes,'Route configuration changed');
 assert.deepEqual(await cf(ep(o.name)+'/schedules'),o.schedules,'Schedules changed for '+o.name);
}
function versionPreserved(v,o){
 assert.deepEqual(sorted(v.bindings),sorted(o.bindings),o.name+' bindings');
 assert.equal(v.compatibility_date,o.compatibilityDate);assert.deepEqual(v.compatibility_flags||[],o.compatibilityFlags);
 assert.deepEqual(v.assets??v.resources?.script_runtime?.assets,o.assets,'Static assets');
}
async function captureOwner(name,paths){
 if(state.owners.some(o=>o.name===name)||state.skipped.some(o=>o.name===name))return;
 let selected;
 for(const path of [...new Set(paths)].sort((a,b)=>a.length-b.length).slice(0,6)){
  const p=await page(path);
  if(p.status===200&&/text\/html/i.test(p.type)&&relabelWeightLossCtas(p.body)!==p.body){selected={path,page:p};break;}
 }
 if(!selected){state.skipped.push({name,reason:'No old generic weight-loss entry label on public sample'});save();console.log('NO_LABEL_CHANGE',name);return;}
 const a=await active(name),id=versionId(a),v=await version(name,id),settings=await cf(ep(name)+'/settings');
 assert(v.main_module&&v.modules.some(m=>m.name===v.main_module),'ES module entry required: '+name);
 assert(!v.modules.some(m=>m.name.startsWith(prefix)),'Label rule already installed; reconcile '+name);
 const runtime=v.resources?.script_runtime||{},o={name,path:selected.path,baselineDeployment:a.id,currentDeployment:a.id,previousVersion:id,oldMain:v.main_module,baselineHashes:hashes(v.modules),bindings:v.bindings,compatibilityDate:v.compatibility_date,compatibilityFlags:v.compatibility_flags||[],assets:v.assets??runtime.assets,operating:{},schedules:await cf(ep(name)+'/schedules')};
 for(const k of ['usage_model','limits','placement','cache_options','observability','tail_consumers','logpush']){
  const x=v[k]??runtime[k]??settings[k];if(x!==undefined)o.operating[k]=x;
 }
 writeFileSync(dir+'/'+name+'-baseline.json',JSON.stringify(v),{mode:0o600});
 writeFileSync(dir+'/'+name+'-before.html',selected.page.body);
 state.owners.push(o);save();await guard(o);console.log('BASELINE_CAPTURED',name,o.path,'modules',v.modules.length);
}
async function baseline(){
 const r=await routes();if(state.routes)assert.deepEqual(r,state.routes);else{state.routes=r;save();}
 const owners=new Map();
 for(const r of state.routes){const path=routePath(r.pattern);if(path&&r.script){if(!owners.has(r.script))owners.set(r.script,[]);owners.get(r.script).push(path);}}
 // Read-only independent captures may run together; mutations remain sequential.
 const entries=[...owners];for(let at=0;at<entries.length;at+=3){
  const results=await Promise.allSettled(entries.slice(at,at+3).map(([name,paths])=>captureOwner(name,paths)));
  const failed=results.filter(r=>r.status==='rejected');for(const r of failed)console.error('CAPTURE_FAILED',r.reason.message);assert.equal(failed.length,0);
 }
 state.baselineAt=new Date().toISOString();save();console.log('BASELINE_COMPLETE',state.owners.length,'owners',state.skipped.length,'not applicable');
}
async function verifyUpload(o){
 const v=await version(o.name,o.newVersion);versionPreserved(v,o);assert.equal(v.main_module,prefix+'entry.mjs');
 assert.deepEqual(hashes(v.modules),o.newHashes);return v;
}
async function stage(){
 assert(state.baselineAt);state.source=source();state.labelSHA256=hash(readFileSync('public-site/weight-loss-cta.mjs'));save();
 for(const o of state.owners){
  await guard(o);if(o.newVersion){await verifyUpload(o);continue;}assert(!o.uploadIntent,'Inspect unknown upload for '+o.name);
  const v=JSON.parse(readFileSync(dir+'/'+o.name+'-baseline.json'));versionPreserved(v,o);assert.deepEqual(hashes(v.modules),o.baselineHashes);
  const entry='import original from "../'+o.oldMain+'";\nexport * from "../'+o.oldMain+'";\nimport {wrapWeightLossCta} from "./labels.mjs";\nexport default wrapWeightLossCta(original);\n';
  const modules=[...v.modules,{name:prefix+'entry.mjs',content_type:'application/javascript+module',content_base64:Buffer.from(entry).toString('base64')},{name:prefix+'labels.mjs',content_type:'application/javascript+module',content_base64:readFileSync('public-site/weight-loss-cta.mjs').toString('base64')}];
  o.newHashes=hashes(modules);for(const [name,h]of Object.entries(o.baselineHashes))assert.equal(o.newHashes[name],h,'Existing module must stay byte-identical');
  const metadata={main_module:prefix+'entry.mjs',compatibility_date:o.compatibilityDate,compatibility_flags:o.compatibilityFlags,bindings:o.bindings.map(b=>({type:'inherit',name:b.name})),keep_assets:true,...o.operating,annotations:{'workers/message':'Matt-approved Explore Weight Loss CTA '+state.source,'workers/tag':'weight-loss-cta-'+state.source.slice(0,12)}};
  const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');
  for(const m of modules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type||'application/javascript+module'}),m.name);
  o.uploadIntent={at:new Date().toISOString(),baseline:o.currentDeployment};save();await guard(o);
  const uploaded=await cf(ep(o.name)+'/versions?bindings_inheritance=strict','POST',form);o.newVersion=uploaded.id;save();
  await verifyUpload(o);o.stagedAt=new Date().toISOString();save();console.log('STAGED_VERIFIED',o.name,o.newVersion);
 }
}
async function deploy(o,mode){
 await guard(o);assert(o.stagedAt);if(mode==='live')assert(state.candidateAcceptedAt);
 const versions=mode==='zero'?[{version_id:o.previousVersion,percentage:100},{version_id:o.newVersion,percentage:0}]:[{version_id:o.newVersion,percentage:100}];
 const prior=o[mode+'Deployment'];if(prior){assert.equal(prior,o.currentDeployment);return;}
 assert(!o.deploymentIntent||o.deploymentIntent.finished,'Inspect unknown deployment for '+o.name);
 o.deploymentIntent={at:new Date().toISOString(),mode,finished:false};save();
 const deployed=await cf(ep(o.name)+'/deployments','POST',{strategy:'percentage',versions,annotations:{'workers/message':'Explore Weight Loss wording '+state.source+' '+mode}});
 o.currentDeployment=deployed.id;o[mode+'Deployment']=deployed.id;save();
 const observed=await active(o.name);assert.equal(observed.id,deployed.id);assert.deepEqual(observed.versions,versions);
 o.deploymentIntent.finished=true;save();console.log('DEPLOYMENT_VERIFIED',mode,o.name,deployed.id);
}
async function candidate(){
 for(const o of state.owners)if(!o.zeroDeployment)await deploy(o,'zero');
 const overrides=state.owners.map(o=>o.name+'="'+o.newVersion+'"').join(',');
 state.candidateChecks=[];
 for(const o of state.owners){
  await guard(o);const before=await page(o.path),after=await page(o.path,overrides);
  assert.equal(after.status,before.status,o.name+' status');assert.equal(after.type,before.type,o.name+' type');
  const expected=relabelWeightLossCtas(before.body);assert.equal(hash(after.body),hash(expected),o.name+' changed content beyond approved labels or version override did not apply');
  assert.equal(after.label,WEIGHT_LOSS_CTA_RELEASE,o.name+' candidate label marker');
  writeFileSync(dir+'/'+o.name+'-candidate.html',after.body);
  state.candidateChecks.push({name:o.name,path:o.path,beforeSHA256:hash(before.body),candidateSHA256:hash(after.body),exactExpected:true});save();
  console.log('CANDIDATE_EXACT',o.name,o.path);
 }
 state.candidateAcceptedAt=new Date().toISOString();save();
}
async function live(){
 assert(state.candidateAcceptedAt);for(const o of state.owners)if(!o.liveDeployment)await deploy(o,'live');
 state.liveChecks=[];
 for(const o of state.owners){
  await guard(o);const p=await page(o.path);assert.equal(p.status,200);assert.equal(p.label,WEIGHT_LOSS_CTA_RELEASE,o.name+' live marker');assert.equal(relabelWeightLossCtas(p.body),p.body,o.name+' old label remains');
  state.liveChecks.push({name:o.name,path:o.path,status:p.status,version:o.newVersion,deployment:o.liveDeployment,bodySHA256:hash(p.body)});save();console.log('LIVE_VERIFIED',o.name,o.path);
 }
 state.verifiedAt=new Date().toISOString();save();
 const receipt={kind:state.kind,source:state.source,verifiedAt:state.verifiedAt,wording:'Explore Weight Loss',owners:state.liveChecks,candidateChecks:state.candidateChecks,unchangedOriginalModuleCount:state.owners.reduce((n,o)=>n+Object.keys(o.baselineHashes).length,0),routesUnchanged:true,settingsUnchanged:true,customerRecordsRead:0,customerDataWrites:0,emailsSent:0};
 writeFileSync('public-site/weight-loss-cta-live-receipt.json',JSON.stringify(receipt,null,2)+'\n');console.log('COMPLETE',JSON.stringify({owners:receipt.owners.length,modulesPreserved:receipt.unchangedOriginalModuleCount,source:receipt.source}));
}
try{
 if(phase==='baseline')await baseline();else if(phase==='stage')await stage();else if(phase==='candidate')await candidate();else if(phase==='live')await live();else if(phase==='status')console.log(JSON.stringify({owners:state.owners.map(o=>({name:o.name,path:o.path,previous:o.previousVersion,candidate:o.newVersion,live:o.liveDeployment})),candidateAcceptedAt:state.candidateAcceptedAt,verifiedAt:state.verifiedAt},null,2));else throw Error('Use baseline, stage, candidate, live or status');
}catch(e){state.failure={phase,message:e.message,at:new Date().toISOString()};save();console.error('LABEL_RELEASE_STOPPED',e.message);process.exitCode=1;}
