// Scoped Journey/Shop publication using the existing version/upload/deployment
// mechanism. Retains every current module and inherits every runtime binding.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
const root=resolve(process.env.MY_TIMBER_RELEASE_DIR||'.'),phase=process.argv[2];
assert(root.endsWith('/journey-shop-release-20261031'),'Use the existing release directory');
const names=['shift-programme-member-20261023','shift-hq-member-comms-20261023'];
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
const prefix='journey-shop-release-20261031/';
const file=join(root,'journey-shop-publication-state.json');
const source=JSON.parse(readFileSync(join(root,'source-release.json'),'utf8'));
assert.match(source.commit,/^[a-f0-9]{40}$/);
const auth=readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8');
const token=process.env.CLOUDFLARE_API_TOKEN||auth.match(/^oauth_token\s*=\s*"([^"\n]+)"/m)?.[1];
assert(token,'Normal authorised Wrangler authentication is required');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const hashes=modules=>Object.fromEntries(modules.map(m=>[m.name,digest(Buffer.from(m.content_base64,'base64'))]).sort(([a],[b])=>a.localeCompare(b)));
const sorted=bindings=>[...bindings].sort((a,b)=>a.name.localeCompare(b.name));
let state=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{source:source.commit,createdAt:new Date().toISOString(),owners:[]};
assert.equal(state.source,source.commit,'Reconcile the saved publication before changing its source');
const save=()=>writeFileSync(file,JSON.stringify(state,null,2)+'\n');
async function cf(endpoint,method='GET',body){
 const multipart=body instanceof FormData,r=await fetch('https://api.cloudflare.com/client/v4'+endpoint,{method,headers:{Authorization:'Bearer '+token,...(body&&!multipart?{'Content-Type':'application/json'}:{})},body:multipart?body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(55000)});
 const j=await r.json();assert(r.ok&&j.success,'Provider '+method+' '+endpoint+' failed: '+JSON.stringify(j.errors));return j.result;
}
const endpoint=name=>'/accounts/'+account+'/workers/scripts/'+name;
async function active(name){const j=await cf(endpoint(name)+'/deployments'),a=[...j.deployments].sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];assert(a);return a;}
const serving=a=>{const v=a.versions.filter(v=>v.percentage===100);assert.equal(v.length,1);assert(a.versions.every(v=>[0,100].includes(v.percentage)));return v[0].version_id;};
const version=(name,id)=>cf('/accounts/'+account+'/workers/workers/'+name+'/versions/'+id+'?include=modules');
const routes=()=>cf('/zones/'+zone+'/workers/routes');
async function verifyVersion(s){
 const v=await version(s.name,s.versionId);
 assert.equal(v.main_module,s.mainModule);assert.deepEqual(hashes(v.modules),s.moduleHashes);
 assert.deepEqual(sorted(v.bindings),sorted(s.bindings));assert.deepEqual(v.compatibility_flags||[],s.compatibilityFlags);
 assert.equal(v.compatibility_date,s.compatibilityDate);
 assert.deepEqual(v.assets??v.resources?.script_runtime?.assets,s.assets);
 return v;
}
async function stage(){
 if(!state.routes){state.routes=await routes();save();}
 assert.deepEqual(await routes(),state.routes,'Concurrent route changes require reconciliation');
 const routeOwner=path=>{const target='shiftsometimber.co.uk'+path;const matches=state.routes.filter(r=>new RegExp('^'+r.pattern.replace(/^https?:\/\//,'').split('*').map(part=>part.replace(/[{}.*+?^$()|[\]\\]/g,'\\$&')).join('.*')+'$').test(target)).sort((a,b)=>b.pattern.replace(/^https?:\/\//,'').replaceAll('*','').length-a.pattern.replace(/^https?:\/\//,'').replaceAll('*','').length);return matches[0]?.script;};
 for(const [path,owner]of [['/shift-health/testing','shift-health-nutrition-20261027'],['/shift-health/testing/vitamin-d','shift-health-nutrition-20261027'],['/assets/shift-purchase-basket-v1.js','shift-health-nutrition-20261027'],['/shift-health/supplements-nutrition','shift-health-heroes-20261029'],['/shop','shift-timber-mill-presentation-20261021']])assert.equal(routeOwner(path),owner,'Current catalogue owner changed: '+path);

 for(let i=0;i<names.length;i++){
  const name=names[i];let s=state.owners.find(s=>s.name===name);
  if(s?.versionId){await verifyVersion(s);console.log('STAGED_VERSION_REUSED',name,s.versionId);continue;}
  assert(!s?.uploadAttempted,'Inspect the provider outcome of the previous upload before retrying');
  const deployment=await active(name);assert.equal(deployment.versions.length,1,'Another zero-traffic candidate is present');
  const previousVersion=serving(deployment),current=await version(name,previousVersion),settings=await cf(endpoint(name)+'/settings');
  const captured=JSON.parse(readFileSync(join(root,name+'-baseline-hashes.json'),'utf8'));
  assert.deepEqual(hashes(current.modules),Object.fromEntries(Object.entries(captured).sort(([a],[b])=>a.localeCompare(b))),'Current serving modules differ from the captured baseline');
  const config=JSON.parse(readFileSync(join(root,name,'wrangler.jsonc'),'utf8')),oldMain=current.main_module||settings.main_module||config.main.replace(/^src\//,'');
  assert.equal(oldMain,config.main.replace(/^src\//,''),'Current entry changed');
  assert(!current.modules.some(m=>m.name.startsWith(prefix)),'Release modules already exist; reconcile first');
  const kind=i===0?'programme':'documents',factory=i===0?'wrapJourneyShopService':'wrapJourneyShopDocuments';
  const bundle=readFileSync(join(root,'bundle-'+kind+'.mjs'));
  const entry='import original from "../'+oldMain+'";\nexport * from "../'+oldMain+'";\nimport {'+factory+'} from "./'+kind+'.mjs";\nexport default '+factory+'(original);\n';
  const additions=[{name:prefix+kind+'.mjs',content_type:'application/javascript+module',content_base64:bundle.toString('base64')},{name:prefix+'entry.mjs',content_type:'application/javascript+module',content_base64:Buffer.from(entry).toString('base64')}];
  const modules=[...current.modules,...additions];assert.equal(new Set(modules.map(m=>m.name)).size,modules.length);
  const runtime=current.resources?.script_runtime||{},priorBindings=current.bindings||settings.bindings;
  const additionsBindings=i===0?[{name:'MY_TIMBER_PUBLIC_TESTING',type:'service',service:'shift-health-nutrition-20261027',environment:'production'},{name:'MY_TIMBER_PUBLIC_NUTRITION',type:'service',service:'shift-health-heroes-20261029',environment:'production'},{name:'MY_TIMBER_PUBLIC_KIT',type:'service',service:'shift-timber-mill-presentation-20261021',environment:'production'}]:[];
  assert(additionsBindings.every(b=>!priorBindings.some(old=>old.name===b.name)),'Catalogue binding collision');const bindings=[...priorBindings,...additionsBindings];
  const metadata={main_module:prefix+'entry.mjs',compatibility_date:current.compatibility_date||runtime.compatibility_date||settings.compatibility_date,compatibility_flags:current.compatibility_flags||runtime.compatibility_flags||settings.compatibility_flags||[],bindings:[...priorBindings.map(b=>({type:'inherit',name:b.name})),...additionsBindings],keep_assets:true,annotations:{'workers/message':'Matt-approved Journey/Shop '+source.commit+'; current baseline retained','workers/tag':'journey-shop-'+source.commit.slice(0,12)}};
  for(const key of ['usage_model','limits','placement','cache_options','observability','tail_consumers','logpush']){const v=current[key]??runtime[key]??settings[key];if(v!==undefined)metadata[key]=v;}
  s={name,previousVersion,baselineDeployment:deployment.id,currentDeployment:deployment.id,oldMain,mainModule:metadata.main_module,bindings,moduleHashes:hashes(modules),retainedModules:current.modules.length,bundleSHA256:digest(bundle),compatibilityDate:metadata.compatibility_date,compatibilityFlags:metadata.compatibility_flags,assets:current.assets??runtime.assets??settings.assets,schedules:await cf(endpoint(name)+'/schedules'),uploadAttempted:true,uploadAt:new Date().toISOString()};
  state.owners.push(s);save();assert.equal((await active(name)).id,deployment.id,'Serving baseline advanced before upload');
  const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');
  for(const m of modules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type||'application/javascript+module'}),m.name);
  const uploaded=await cf(endpoint(name)+'/versions?bindings_inheritance=strict','POST',form);s.versionId=uploaded.id;save();
  await verifyVersion(s);assert.equal((await active(name)).id,deployment.id,'Upload changed serving traffic');s.stagedVerifiedAt=new Date().toISOString();save();console.log('STAGED_VERIFIED',name,s.versionId,'retained modules',s.retainedModules);
 }
}
async function deploy(index,mode){
 const s=state.owners.find(s=>s.name===names[index]);assert(s?.stagedVerifiedAt);await verifyVersion(s);
 assert.deepEqual(await routes(),state.routes,'Concurrent routes changed');
 assert.deepEqual(await cf(endpoint(s.name)+'/schedules'),s.schedules,'Schedules changed');
 const message='My Timber Journey/Shop '+source.commit+' '+s.name+' '+mode;
 let before=await active(s.name);
 const desired=mode==='zero'?[{version_id:s.previousVersion,percentage:100},{version_id:s.versionId,percentage:0}]:[{version_id:s.versionId,percentage:100}];
 if(before.annotations?.['workers/message']===message&&JSON.stringify(before.versions)===JSON.stringify(desired)){s.currentDeployment=before.id;s[mode+'VerifiedAt']=new Date().toISOString();save();console.log('DEPLOYMENT_RECONCILED',s.name,before.id);return;}
 assert.equal(before.id,s.currentDeployment,'A subsequent owner deployment must be preserved');
 s.intent={mode,message,previousDeployment:before.id,attemptedAt:new Date().toISOString()};save();
 const published=await cf(endpoint(s.name)+'/deployments','POST',{strategy:'percentage',versions:desired,annotations:{'workers/message':message}});
 s.currentDeployment=published.id;save();const observed=await active(s.name);assert.equal(observed.id,published.id);assert.deepEqual(observed.versions,desired);s[mode+'VerifiedAt']=new Date().toISOString();save();console.log('DEPLOYMENT_VERIFIED',mode,s.name,s.versionId,published.id);
}
try{
 if(phase==='stage')await stage();
 else if(phase==='zero-programme')await deploy(0,'zero');
 else if(phase==='zero-documents')await deploy(1,'zero');
 else if(phase==='live-programme')await deploy(0,'live');
 else if(phase==='live-documents')await deploy(1,'live');
 else if(phase==='status'){for(const name of names){const a=await active(name);console.log('CURRENT_PROVIDER_STATE',JSON.stringify({name,id:a.id,versions:a.versions,message:a.annotations?.['workers/message']}));}}
 else throw Error('Use stage, zero-programme, zero-documents, live-programme, live-documents or status');
 state.lastSuccessfulPhase=phase;state.updatedAt=new Date().toISOString();delete state.failure;save();
}catch(e){state.failure={phase,message:e.message,at:new Date().toISOString()};save();console.error('SCOPED_RELEASE_STOPPED',e.message);process.exitCode=1;}
