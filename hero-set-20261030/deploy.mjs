import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {routeOwner} from './route-owner.mjs';
import {uploadPreservedAssets} from '../knowledge-health/release-assets.mjs';
import {pages} from './payload.mjs';
import {transform,version,assetPrefix} from './runtime.mjs';
import {media} from './media.mjs';
import {mainHTML,check,waitForHero} from './check.mjs';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed',prefix='hero-set-20261030/',dir='hero-set-evidence';
fs.mkdirSync(dir,{recursive:true});
const save=(n,v)=>fs.writeFileSync(dir+'/'+n+'.json',JSON.stringify(v,null,2)),hash=v=>createHash('sha256').update(v).digest('hex');
async function cf(p,method='GET',body,bearer=process.env.CLOUDFLARE_API_TOKEN){const form=body instanceof FormData;const r=await fetch('https://api.cloudflare.com/client/v4'+p,{method,headers:{Authorization:'Bearer '+bearer,...(body&&!form?{'Content-Type':'application/json'}:{})},body:form?body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});const j=await r.json();assert(r.ok&&j.success,'Provider request failed '+method+' '+p+' '+JSON.stringify(j.errors));return j.result;}
const routes=()=>cf('/zones/'+zone+'/workers/routes');
async function active(name){const r=await cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments');const d=r.deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];assert.equal(d.versions.filter(v=>v.percentage===100).length,1);assert(d.versions.every(v=>v.percentage===0||v.percentage===100));return d;}
const serving=d=>d.versions.find(v=>v.percentage===100).version_id;
const promote=(name,id,message)=>cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments','POST',{strategy:'percentage',versions:[{version_id:id,percentage:100}],annotations:{'workers/message':message}});
async function get(p,overrides){const r=await fetch('https://shiftsometimber.co.uk'+p,{headers:{'Cache-Control':'no-cache',...(overrides?{'Cloudflare-Workers-Version-Overrides':overrides}:{})},signal:AbortSignal.timeout(45000)});assert.equal(r.status,200,'Page unavailable '+p);return {html:await r.text(),headers:r.headers,url:r.url};}
const snapshots=ms=>ms.map(m=>({name:m.name,sha256:hash(Buffer.from(m.content_base64,'base64'))})).sort((a,b)=>a.name.localeCompare(b.name));
const sort=bs=>[...(bs||[])].sort((a,b)=>a.name.localeCompare(b.name));
const states=[],promoted=[];let beforeRoutes;
if(process.env.HERO_ROUTE_AUDIT==='1'){
 const currentRoutes=await routes();
 const candidates=pages.map(p=>({path:p.path,routes:currentRoutes.filter(r=>{
  const pattern=r.pattern.replace(/^https?:\/\//,'').split('*').map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*');
  return new RegExp('^'+pattern+'$').test('shiftsometimber.co.uk'+p.path);
 })}));
 save('route-audit',{readOnly:true,source:process.env.GITHUB_SHA,routeCount:currentRoutes.length,candidates});
 console.log('HERO_ROUTE_AUDIT '+JSON.stringify({readOnly:true,routeCount:currentRoutes.length,candidates}));process.exit(0);
}
try{
 assert.equal(pages.length,27);assert(!pages.some(p=>['/knowledge','/explore-knowledge','/ask-timber','/shift-health'].includes(p.path)),'Later approved designs must be protected');
 beforeRoutes=await routes();
 const servingOwners=pages.map(p=>({path:p.path,route:routeOwner(beforeRoutes,'https://shiftsometimber.co.uk'+p.path)}));
 const assetOwner=routeOwner(beforeRoutes,'https://shiftsometimber.co.uk'+assetPrefix+'smoking.webp');
 assert.equal(assetOwner?.script,'shift-health-nutrition-20261027','Asset owner changed; inspect before continuing');
 const previous=JSON.parse(fs.readFileSync(prefix+'current-preflight.json','utf8'));
 for(const owner of servingOwners)assert.deepEqual(owner.route,previous.serving.find(s=>s.path===owner.path)?.owner,'Page owner changed '+owner.path);
 for(const owner of previous.additionalOwners||[])assert.deepEqual(beforeRoutes.find(r=>r.id===owner.id),owner,'Alias owner changed '+owner.pattern);
 const ownerNames=new Set([...servingOwners.map(s=>s.route.script),...(previous.additionalOwners||[]).map(s=>s.script),assetOwner.script]);
 const scopes=new Map([...ownerNames].map(name=>[name,new Set()]));
 for(const page of pages)for(const pathname of [page.path,page.path+'/',page.path+'.html'])for(const query of [false,true]){
  const owner=routeOwner(beforeRoutes,'https://shiftsometimber.co.uk'+pathname+(query?'?hero-scope=1':''));
  assert(scopes.has(owner?.script),'Uncaptured alias owner '+pathname+' '+owner?.script);
  scopes.get(owner.script).add(pathname+(query?'?':''));
 }
 const baselines={},candidates={},checks=[];
 for(let i=0;i<pages.length;i+=6)await Promise.all(pages.slice(i,i+6).map(async p=>{const b=await get(p.path);baselines[p.path]=b;const c=transform(b.html,p).html;candidates[p.path]=c;checks.push(check(b.html,c,p));fs.writeFileSync(dir+'/'+p.id+'-before.html',b.html);fs.writeFileSync(dir+'/'+p.id+'-candidate.html',c);}));
 const protectedPaths=['/','/shift-health','/ask-timber','/knowledge','/explore-knowledge','/programme','/start-here','/member-login','/member/dashboard','/shift-health/testing','/shift-health/blood-tests'];
 // Include every existing testing product; protect its actual serving HTML.
 const catalogue=await get('/shift-health/testing');
 for(const m of catalogue.html.matchAll(/href=["'](\/shift-health\/testing\/[^"'#?]+)["']/g))if(!protectedPaths.includes(m[1]))protectedPaths.push(m[1]);
 const protectedPages={};for(let i=0;i<protectedPaths.length;i+=6)await Promise.all(protectedPaths.slice(i,i+6).map(async p=>{const b=await get(p);assert(mainHTML(b.html),'Protected page missing main '+p);protectedPages[p]=b;}));
 assert(protectedPages['/knowledge'].html.includes('knowledge-k3'),'Current K3 design must remain live');
 const assets=[...new Set(pages.map(p=>p.asset).filter(Boolean))].map(k=>({path:assetPrefix+k+'.webp',sha256:hash(media(k+'.webp'))}));
 const codePaths=new Set(['/assets/shift-health-knowledge-20261029.js']);
 for(const b of [...Object.values(baselines),...Object.values(protectedPages)])for(const m of b.html.matchAll(/(?:src|href)=["'](\/[^"']+\.(?:js|mjs|css)(?:\?[^"']*)?)["']/g))codePaths.add(m[1]);
 const preservedAssets=[],unavailableBefore=[];
 const capturePaths=[...codePaths];for(let i=0;i<capturePaths.length;i+=8)await Promise.all(capturePaths.slice(i,i+8).map(async p=>{const r=await fetch('https://shiftsometimber.co.uk'+p,{signal:AbortSignal.timeout(45000)});if(r.status!==200||r.headers.get('Content-Type')?.includes('text/html')){unavailableBefore.push({path:p,status:r.status});return;}preservedAssets.push({path:p,sha256:hash(Buffer.from(await r.arrayBuffer()))});}));
 for(const name of ownerNames){
  const deployment=await active(name),previousVersion=serving(deployment);assert.equal(deployment.versions.length,1,'Another traffic split exists '+name);
  const current=await cf('/accounts/'+account+'/workers/workers/'+name+'/versions/'+previousVersion+'?include=modules'),settings=await cf('/accounts/'+account+'/workers/scripts/'+name+'/settings');
  assert(current.modules?.length);assert(!current.modules.some(m=>m.name.startsWith(prefix)),'Hero release already exists; reconcile before retry');
  const js=current.modules.filter(m=>/\.(mjs|js)$/.test(m.name)),referenced=new Set();
  for(const m of js)for(const x of Buffer.from(m.content_base64,'base64').toString().matchAll(/\b(?:from\s*|import\s*)["']([^"']+)["']/g))if(x[1].startsWith('.'))referenced.add(path.posix.normalize(path.posix.join(path.posix.dirname(m.name),x[1])));
  const roots=js.filter(m=>!referenced.has(m.name)),explicit=current.main_module||current.metadata?.main_module||current.resources?.script?.main_module||settings.main_module;
  if(!explicit)assert.equal(roots.length,1,'Ambiguous existing entry '+name);const oldMain=explicit||roots[0].name;
  assert(current.modules.some(m=>m.name===oldMain));assert(!oldMain.includes('..')&&!oldMain.startsWith('/'));
  const assetHost=name===assetOwner.script;
  const ownedPaths=[...scopes.get(name)].sort();
  const entry='import original from "../'+oldMain+'";\nexport * from "../'+oldMain+'";\nimport {wrap} from "./runtime.mjs";\n'+(assetHost?'import {media} from "./media.mjs";\n':'')+'export default wrap(original,'+(assetHost?'media':'null')+','+JSON.stringify(ownedPaths)+');\n';
  const additions=['runtime.mjs','payload.mjs',...(assetHost?['media.mjs']:[])].map(n=>({name:prefix+n,content_type:'application/javascript+module',content_base64:fs.readFileSync(prefix+n).toString('base64')}));
  additions.push({name:prefix+'entry.mjs',content_type:'application/javascript+module',content_base64:Buffer.from(entry).toString('base64')});
  const modules=[...current.modules,...additions];assert.equal(new Set(modules.map(m=>m.name)).size,modules.length);
  const resources=current.resources?.script_runtime||{},bindings=current.bindings||settings.bindings;
  const metadata={main_module:prefix+'entry.mjs',compatibility_date:current.compatibility_date||resources.compatibility_date||settings.compatibility_date,compatibility_flags:current.compatibility_flags||resources.compatibility_flags||settings.compatibility_flags||[],bindings:bindings.map(b=>({type:'inherit',name:b.name,version_id:previousVersion})),annotations:{'workers/message':'Matt approved hero set: preserve current modules, content, assets and routes; retain later K3.','workers/tag':'hero-set-'+process.env.GITHUB_SHA.slice(0,12)}};
  for(const k of ['usage_model','limits','placement','cache_options','observability','tail_consumers','logpush'])if(current[k]!==undefined||resources[k]!==undefined||settings[k]!==undefined)metadata[k]=current[k]??resources[k]??settings[k];
  const existingAssets=current.assets||resources.assets||settings.assets;if(existingAssets)metadata.assets=existingAssets;
  states.push({name,deployment,previousVersion,current,settings,modules,metadata,assets:existingAssets,bindings,oldMain,ownedPaths});
 }
 save('before',{source:process.env.GITHUB_SHA,servingOwners,routeCount:beforeRoutes.length,checks,workers:states.map(s=>({name:s.name,previousVersion:s.previousVersion,oldMain:s.oldMain,moduleHashes:snapshots(s.current.modules),bindingTypes:s.bindings.map(b=>({name:b.name,type:b.type}))})),protectedPaths,preservedAssets,unavailableBefore,assetChecks:assets});
 for(const state of states){
  assert.equal((await active(state.name)).id,state.deployment.id,'Serving version changed before staging '+state.name);
  if(state.assets){assert.equal(state.name,'shift-core');const a=await uploadPreservedAssets({cf,account,name:state.name,save});state.metadata.assets={...state.assets,jwt:a.jwt};for(const c of a.checks)if(!preservedAssets.some(x=>x.path===c.path))preservedAssets.push(c);}
  const uploaded=await cf('/accounts/'+account+'/workers/workers/'+state.name+'/versions?deploy=false','POST',{...state.metadata,modules:state.modules});state.versionId=uploaded.id;assert(state.versionId);
  const staged=await cf('/accounts/'+account+'/workers/workers/'+state.name+'/versions/'+state.versionId+'?include=modules');
  assert.deepEqual(snapshots(staged.modules),snapshots(state.modules),'Module bytes changed '+state.name);assert.deepEqual(sort(staged.bindings),sort(state.bindings),'Bindings changed '+state.name);assert.deepEqual(staged.assets,state.assets,'Asset configuration changed '+state.name);assert.equal((await active(state.name)).id,state.deployment.id,'Staging changed ordinary traffic');
 }
 assert.deepEqual(await routes(),beforeRoutes,'Routes changed during preparation');
 for(const p of pages)assert.equal((await get(p.path)).html,baselines[p.path].html,'Page changed during preparation '+p.path);
 save('staged',{source:process.env.GITHUB_SHA,workers:states.map(s=>({name:s.name,previousVersion:s.previousVersion,versionId:s.versionId,retainedModules:s.current.modules.length}))});
 for(const state of states){assert.equal((await active(state.name)).id,state.deployment.id,'Owner changed before zero-traffic check');await cf('/accounts/'+account+'/workers/scripts/'+state.name+'/deployments','POST',{strategy:'percentage',versions:[{version_id:state.previousVersion,percentage:100},{version_id:state.versionId,percentage:0}],annotations:{'workers/message':'Verify approved hero set at zero ordinary traffic'}});state.zeroDeployment=(await active(state.name)).id;assert.equal(serving(await active(state.name)),state.previousVersion);}
 const override=states.map(s=>s.name+'="'+s.versionId+'"').join(', ');
 async function verify(overrides){
  for(let i=0;i<pages.length;i+=6)await Promise.all(pages.slice(i,i+6).map(async p=>{const {response:b,attempts}=await waitForHero(()=>get(p.path,overrides),version,p.path);if(attempts>1)console.log('Hero propagation ready '+p.path+' after '+attempts+' reads');fs.writeFileSync(dir+'/'+p.id+(overrides?'-zero-observed.html':'-observed.html'),b.html);assert.equal(b.headers.get('X-Shift-Hero-Set'),version,'Hero marker missing '+p.path);check(baselines[p.path].html,b.html,p);assert.equal(hash(b.html),hash(candidates[p.path]),'Candidate differs '+p.path);}));
  for(let i=0;i<protectedPaths.length;i+=6)await Promise.all(protectedPaths.slice(i,i+6).map(async p=>assert.equal(mainHTML((await get(p,overrides)).html),mainHTML(protectedPages[p].html),'Protected content changed '+p)));
  const all=[...assets,...preservedAssets];for(let i=0;i<all.length;i+=8)await Promise.all(all.slice(i,i+8).map(async a=>{const r=await fetch('https://shiftsometimber.co.uk'+a.path,{headers:overrides?{'Cloudflare-Workers-Version-Overrides':overrides}:{},signal:AbortSignal.timeout(45000)});assert.equal(r.status,200,'Asset unavailable '+a.path);assert.equal(hash(Buffer.from(await r.arrayBuffer())),a.sha256,'Asset bytes changed '+a.path);}));
  const alias=await fetch('https://shiftsometimber.co.uk/explore-knowledge?topic=sleep',{redirect:'manual',headers:overrides?{'Cloudflare-Workers-Version-Overrides':overrides}:{}});assert.equal(alias.status,308);assert.equal(alias.headers.get('Location'),'/knowledge?topic=sleep');
 }
 await verify(override);save('zero-traffic',{verified:true,pages:pages.length,protectedPages:protectedPaths.length,assets:assets.length,existingCodeAssets:preservedAssets.length});
 // One coordinated batch. Existing resource owners and every route stay put.
 for(const state of states){assert.equal((await active(state.name)).id,state.zeroDeployment,'Owner changed during verification');try{await promote(state.name,state.versionId,'Deploy Matt’s approved hero set with cavapoo revision');}finally{if(serving(await active(state.name))===state.versionId)promoted.push(state);}assert(promoted.includes(state));}
 await verify();assert.deepEqual(await routes(),beforeRoutes);for(const s of states)assert.equal(serving(await active(s.name)),s.versionId);
 const receipt={verified:true,source:process.env.GITHUB_SHA,release:version,workers:states.map(s=>({name:s.name,versionId:s.versionId,previousVersion:s.previousVersion,retainedModules:s.current.modules.length})),pages:pages.map(p=>({id:p.id,path:p.path,asset:p.asset})),superseded:['/knowledge','/explore-knowledge'],routeCount:beforeRoutes.length,routesChanged:0,checks,protectedPages:protectedPaths,photographsVerified:assets.length,existingCodeAssetsPreserved:preservedAssets.length,verifiedAt:new Date().toISOString()};save('receipt',receipt);console.log('HERO_SET_RELEASE '+JSON.stringify(receipt));
}catch(error){save('failure',{message:error.message,stack:error.stack,promoted:promoted.map(s=>({name:s.name,versionId:s.versionId,previousVersion:s.previousVersion}))});for(const state of [...states].reverse()){const d=await active(state.name);if((promoted.includes(state)&&serving(d)===state.versionId)||(state.zeroDeployment&&d.id===state.zeroDeployment)){await promote(state.name,state.previousVersion,'Restore this hero release predecessor after verification failure');console.log('Restored hero predecessor '+state.name);}}throw error;}
