import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {routeOwner} from '../../knowledge-health/release-helpers.mjs';
import {uploadPreservedAssets} from '../../knowledge-health/release-assets.mjs';
import css from './styles.mjs';
import {release,assetBase,ownAssets,mainHTML,transformHTML} from './layout.mjs';
import {check} from './check.mjs';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed',prefix='release/knowledge-k3-20261030/',dir='knowledge-k3-evidence';fs.mkdirSync(dir,{recursive:true});
const save=(n,v)=>fs.writeFileSync(dir+'/'+n+'.json',JSON.stringify(v,null,2)),hash=v=>createHash('sha256').update(v).digest('hex');
async function cf(p,method='GET',body,bearer=process.env.CLOUDFLARE_API_TOKEN){const isForm=body instanceof FormData;const r=await fetch('https://api.cloudflare.com/client/v4'+p,{method,headers:{Authorization:'Bearer '+bearer,...(body&&!isForm?{'Content-Type':'application/json'}:{})},body:isForm?body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});const j=await r.json();assert(r.ok&&j.success,'Provider request failed '+method+' '+p+' '+JSON.stringify(j.errors));return j.result;}
const routes=()=>cf('/zones/'+zone+'/workers/routes');
async function active(name){const r=await cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments');const d=r.deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];assert.equal(d.versions.filter(v=>v.percentage===100).length,1);assert(d.versions.every(v=>v.percentage===0||v.percentage===100));return d;}
const servingVersion=d=>d.versions.find(v=>v.percentage===100).version_id;
const promote=(name,id,message)=>cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments','POST',{strategy:'percentage',versions:[{version_id:id,percentage:100}],annotations:{'workers/message':message}});
async function get(p){const r=await fetch('https://shiftsometimber.co.uk'+p,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(45000)});assert.equal(r.status,200,'Public page unavailable '+p);return{html:await r.text(),headers:r.headers,url:r.url};}
const snapshots=ms=>ms.map(m=>({name:m.name,sha256:hash(Buffer.from(m.content_base64,'base64'))})).sort((a,b)=>a.name.localeCompare(b.name));
const sort=bs=>[...(bs||[])].sort((a,b)=>a.name.localeCompare(b.name));
const states=[],promoted=[];let beforeRoutes;
try{
 beforeRoutes=await routes();
 const serving=['/knowledge','/explore-knowledge',assetBase+'hero.webp'].map(p=>({path:p,route:routeOwner(beforeRoutes,'https://shiftsometimber.co.uk'+p)}));
 assert.deepEqual(serving.map(s=>s.route?.script),['shift-core','shift-blog-publisher','shift-core'],'Serving owners changed; inspect current owner instead of overriding it');
 const baseline=await get('/knowledge'),aliasBefore=await get('/explore-knowledge'),candidate=transformHTML(baseline.html,css),checks=check(baseline.html,candidate);
 fs.writeFileSync(dir+'/before.html',baseline.html);fs.writeFileSync(dir+'/candidate.html',candidate);
 const protectedPages={};for(const p of ['/','/shift-health','/ask-timber','/programme','/start-here','/member-login','/member/dashboard']){const page=await get(p);assert(mainHTML(page.html),'Protected main missing '+p);protectedPages[p]=page;}
 const codeAssets=new Set(['/assets/shift-health-knowledge-20261029.js']);
 for(const page of [baseline,...Object.values(protectedPages)])for(const m of page.html.matchAll(/(?:src|href)=["'](\/[^"']+\.(?:js|mjs|css)(?:\?[^"']*)?)["']/g))codeAssets.add(m[1]);
 const preservedAssets=[],preExistingUnavailableAssets=[];const assetPaths=[...codeAssets];
 for(let i=0;i<assetPaths.length;i+=8)await Promise.all(assetPaths.slice(i,i+8).map(async p=>{const r=await fetch('https://shiftsometimber.co.uk'+p,{signal:AbortSignal.timeout(45000)});if(r.status!==200||r.headers.get('Content-Type')?.includes('text/html')){assert.notEqual(p,'/assets/shift-health-knowledge-20261029.js','Existing Knowledge filter script must be available');preExistingUnavailableAssets.push({path:p,status:r.status});return;}preservedAssets.push({path:p,sha256:hash(Buffer.from(await r.arrayBuffer()))});}));
 for(const name of ['shift-core','shift-blog-publisher']){
  const deployment=await active(name),previousVersion=servingVersion(deployment);assert.equal(deployment.versions.length,1,'Another staged traffic split already exists '+name);
  const current=await cf('/accounts/'+account+'/workers/workers/'+name+'/versions/'+previousVersion+'?include=modules'),settings=await cf('/accounts/'+account+'/workers/scripts/'+name+'/settings');
  assert(current.modules?.length,'Current modules missing '+name);
  const js=current.modules.filter(m=>/\.(mjs|js)$/.test(m.name)),referenced=new Set();
  for(const m of js){const code=Buffer.from(m.content_base64,'base64').toString('utf8');for(const match of code.matchAll(/\b(?:from\s*|import\s*)["']([^"']+)["']/g)){const spec=match[1];if(spec.startsWith('.'))referenced.add(path.posix.normalize(path.posix.join(path.posix.dirname(m.name),spec)));}}
  const roots=js.filter(m=>!referenced.has(m.name)),explicit=current.main_module||current.metadata?.main_module||current.resources?.script?.main_module||settings.main_module;if(!explicit)assert.equal(roots.length,1,'Ambiguous existing entry '+name);const providerMain=explicit||roots[0].name;let oldMain=providerMain,entryMain='knowledge-k3/overlay.mjs',baseModules=current.modules;
  const owned=current.modules.find(m=>m.name==='knowledge-k3/overlay.mjs');
  if(owned){const code=Buffer.from(owned.content_base64,'base64').toString('utf8');assert(code.includes("headers.set('X-Shift-Knowledge-Design',release)"),'Unexpected K3 layer');const predecessor=code.match(/^import original from ['"]\.\.\/([^'"]+)['"]/m)?.[1];assert(predecessor&&!predecessor.includes('..'),'Original K3 predecessor missing');oldMain=predecessor;baseModules=current.modules.filter(m=>!m.name.startsWith('knowledge-k3/'));if(providerMain!=='knowledge-k3/overlay.mjs')entryMain=providerMain;}
  assert(baseModules.some(m=>m.name===oldMain));assert(!oldMain.includes('..')&&!oldMain.startsWith('/'));
  const runtime=fs.readFileSync(prefix+'overlay.mjs','utf8').replaceAll('./original.mjs','../'+oldMain);
  const additions=['layout.mjs','styles.mjs'].map(n=>({name:'knowledge-k3/'+n,content_type:'application/javascript+module',content_base64:fs.readFileSync(prefix+n).toString('base64')}));
  additions.push({name:'knowledge-k3/overlay.mjs',content_type:'application/javascript+module',content_base64:Buffer.from(runtime).toString('base64')});
  for(const key of ownAssets)additions.push({name:'knowledge-k3/assets/'+key+'.webp',content_type:'application/octet-stream',content_base64:fs.readFileSync(prefix+'assets/'+key+'.webp').toString('base64')});
  const modules=[...baseModules,...additions];assert.equal(new Set(modules.map(m=>m.name)).size,modules.length);
  const resources=current.resources?.script_runtime||{},bindings=current.bindings||settings.bindings;
  const metadata={main_module:entryMain,compatibility_date:current.compatibility_date||resources.compatibility_date||settings.compatibility_date,compatibility_flags:current.compatibility_flags||resources.compatibility_flags||settings.compatibility_flags||[],bindings:bindings.map(b=>({type:'inherit',name:b.name,version_id:previousVersion})),annotations:{'workers/message':'Matt approved K3 with correctly oriented iPad; preserve current runtime, assets, bindings and routes.','workers/tag':'knowledge-k3-'+process.env.GITHUB_SHA.slice(0,12)}};
  for(const k of ['usage_model','limits','placement','cache_options','observability','tail_consumers','logpush'])if(current[k]!==undefined||resources[k]!==undefined||settings[k]!==undefined)metadata[k]=current[k]??resources[k]??settings[k];
  const assets=current.assets||resources.assets||settings.assets;
  // Pin every resource binding to the actual serving version through the
  // version-addressed API. Never inherit from an unrelated latest upload.
  if(assets)metadata.assets=assets;
  states.push({name,deployment,previousVersion,current,settings,modules,metadata,assets,bindings,oldMain,retainedModules:baseModules.length});
 }
 save('before',{source:process.env.GITHUB_SHA,serving,routeCount:beforeRoutes.length,checks,workers:states.map(s=>({name:s.name,previousVersion:s.previousVersion,oldMain:s.oldMain,assetConfig:s.assets,moduleHashes:snapshots(s.current.modules),bindings:s.bindings.map(b=>({name:b.name,type:b.type}))})),protectedPages:Object.entries(protectedPages).map(([p,b])=>({path:p,mainSHA256:hash(mainHTML(b.html))})),preservedAssets,preExistingUnavailableAssets});
 for(const state of states){
  assert.equal((await active(state.name)).id,state.deployment.id,'Serving version changed before staging '+state.name);
  if(state.assets){assert.equal(state.name,'shift-core');const assets=await uploadPreservedAssets({cf,account,name:state.name,save});state.metadata.assets={...state.assets,jwt:assets.jwt};state.assetChecks=assets.checks;for(const a of assets.checks)if(!preservedAssets.some(x=>x.path===a.path))preservedAssets.push(a);}
  const uploaded=await cf('/accounts/'+account+'/workers/workers/'+state.name+'/versions?deploy=false','POST',{...state.metadata,modules:state.modules});state.versionId=uploaded.id;assert(state.versionId);
  const staged=await cf('/accounts/'+account+'/workers/workers/'+state.name+'/versions/'+state.versionId+'?include=modules');
  assert.deepEqual(snapshots(staged.modules),snapshots(state.modules),'Every uploaded module byte must match '+state.name);
  assert.deepEqual(sort(staged.bindings),sort(state.bindings),'All bindings retained exactly '+state.name);
  assert.deepEqual(staged.assets,state.assets,'Existing asset configuration retained exactly '+state.name);
  assert.equal((await active(state.name)).id,state.deployment.id,'Staging changed live traffic '+state.name);
 }
 assert.deepEqual(await routes(),beforeRoutes,'No route changes during staging');
 assert.equal((await get('/knowledge')).html,baseline.html,'Knowledge changed during preparation');assert.equal((await get('/explore-knowledge')).html,aliasBefore.html,'Legacy entry changed during preparation');
 for(const state of states)assert.equal((await active(state.name)).id,state.deployment.id,'Owner changed during staging '+state.name);
 save('staged',{source:process.env.GITHUB_SHA,workers:states.map(s=>({name:s.name,previousVersion:s.previousVersion,versionId:s.versionId,moduleCount:s.modules.length,retainedModules:s.current.modules.length}))});
 // Admit each staged version at 0% and verify it using documented version
 // overrides before any ordinary request can receive the new implementation.
 for(const state of states){assert.equal((await active(state.name)).id,state.deployment.id,'Owner changed before zero-traffic check');await cf('/accounts/'+account+'/workers/scripts/'+state.name+'/deployments','POST',{strategy:'percentage',versions:[{version_id:state.previousVersion,percentage:100},{version_id:state.versionId,percentage:0}],annotations:{'workers/message':'Verify approved K3 at zero ordinary traffic'}});state.zeroDeployment=(await active(state.name)).id;assert.equal(servingVersion(await active(state.name)),state.previousVersion);}
 const override=states.map(s=>s.name+'="'+s.versionId+'"').join(', ');
 async function smoke(p,manual=false){return fetch('https://shiftsometimber.co.uk'+p,{redirect:manual?'manual':'follow',headers:{'Cache-Control':'no-cache','Cloudflare-Workers-Version-Overrides':override},signal:AbortSignal.timeout(45000)});}
 let smokePage;for(let i=0;i<12;i++){const r=await smoke('/knowledge');smokePage={status:r.status,marker:r.headers.get('X-Shift-Knowledge-Design'),html:await r.text()};if(smokePage.marker===release&&smokePage.html===candidate)break;await new Promise(r=>setTimeout(r,1500));}
 assert.equal(smokePage.status,200);assert.equal(smokePage.marker,release,'Staged version override was not applied');assert.equal(hash(smokePage.html),hash(candidate),'Zero-traffic Knowledge output differs');
 for(let i=0;i<preservedAssets.length;i+=8)await Promise.all(preservedAssets.slice(i,i+8).map(async a=>{const r=await smoke(a.path);assert.equal(r.status,200);assert.equal(hash(Buffer.from(await r.arrayBuffer())),a.sha256,'Zero-traffic version changed existing static asset '+a.path);}));
 for(const [p,before]of Object.entries(protectedPages)){const r=await smoke(p);assert.equal(r.status,200);assert.equal(mainHTML(await r.text()),mainHTML(before.html),'Zero-traffic protected page changed '+p);}
 for(const key of ownAssets){const r=await smoke(assetBase+key+'.webp');assert.equal(r.status,200);assert.equal(hash(Buffer.from(await r.arrayBuffer())),hash(fs.readFileSync(prefix+'assets/'+key+'.webp')));}
 const aliasSmoke=await smoke('/explore-knowledge?topic=sleep',true);assert.equal(aliasSmoke.status,308);assert.equal(aliasSmoke.headers.get('Location'),'/knowledge?topic=sleep');
 for(const state of states){assert.equal((await active(state.name)).id,state.zeroDeployment,'Owner changed during zero-traffic verification');try{await promote(state.name,state.versionId,'Deploy Matt’s approved Knowledge K3 iPad design');}finally{if(servingVersion(await active(state.name))===state.versionId)promoted.push(state);}assert(promoted.includes(state),'Promotion not observed');}
 let live;for(let n=0;n<12;n++){live=await get('/knowledge');if(live.headers.get('X-Shift-Knowledge-Design')===release&&live.html===candidate)break;await new Promise(r=>setTimeout(r,1500));}
 fs.writeFileSync(dir+'/observed.html',live.html);assert.equal(live.headers.get('X-Shift-Knowledge-Design'),release);assert.equal(hash(live.html),hash(candidate),'Delivered Knowledge HTML differs from exact tested candidate');check(baseline.html,live.html);
 const assetChecks=[];for(const key of ownAssets){const r=await fetch('https://shiftsometimber.co.uk'+assetBase+key+'.webp');assert.equal(r.status,200);assert.equal(hash(Buffer.from(await r.arrayBuffer())),hash(fs.readFileSync(prefix+'assets/'+key+'.webp')));assetChecks.push(key);}
 const reused=[...new Set([...candidate.matchAll(/<img[^>]*src="((?:\/shift-health\/assets\/cards-20261029|\/ask-timber\/assets\/a4-20261030)\/[^"?]+)"/g)].map(m=>m[1]))];
 for(const p of reused){const r=await fetch('https://shiftsometimber.co.uk'+p,{method:'HEAD'});assert.equal(r.status,200,'Existing thumbnail unavailable '+p);}
 for(const [p,before]of Object.entries(protectedPages))assert.equal(mainHTML((await get(p)).html),mainHTML(before.html),'Protected page changed '+p);
 for(let i=0;i<preservedAssets.length;i+=8)await Promise.all(preservedAssets.slice(i,i+8).map(async a=>{const r=await fetch('https://shiftsometimber.co.uk'+a.path,{signal:AbortSignal.timeout(45000)});assert.equal(r.status,200);assert.equal(hash(Buffer.from(await r.arrayBuffer())),a.sha256,'Retained code asset changed '+a.path);}));
 const redirected=await fetch('https://shiftsometimber.co.uk/explore-knowledge?topic=sleep',{redirect:'manual'});assert.equal(redirected.status,308);assert.equal(redirected.headers.get('Location'),'/knowledge?topic=sleep');
 const alias=await get('/explore-knowledge');assert.equal(new URL(alias.url).pathname,'/knowledge');assert.equal(alias.html,live.html,'Both Knowledge entry points must reach the same collection');
 assert.deepEqual(await routes(),beforeRoutes,'No route changes');for(const state of states)assert.equal(servingVersion(await active(state.name)),state.versionId);
 const receipt={verified:true,design:'K3',source:process.env.GITHUB_SHA,workers:states.map(s=>({name:s.name,versionId:s.versionId,previousVersion:s.previousVersion,retainedModules:s.current.modules.length})),routeCount:beforeRoutes.length,routesChanged:0,checks,newPhotographsVerified:assetChecks.length,reusedPhotographsVerified:reused.length,protectedPagesPreserved:Object.keys(protectedPages),existingCodeAssetsPreserved:preservedAssets.length,legacyKnowledgeEntryUsesCanonical:true,verifiedAt:new Date().toISOString()};save('receipt',receipt);console.log('KNOWLEDGE_K3_RELEASE '+JSON.stringify(receipt));
}catch(error){save('failure',{message:error.message,stack:error.stack,promoted:promoted.map(s=>({name:s.name,versionId:s.versionId,previousVersion:s.previousVersion}))});for(const state of [...states].reverse()){const d=await active(state.name);if((promoted.includes(state)&&servingVersion(d)===state.versionId)||(state.zeroDeployment&&d.id===state.zeroDeployment)){await promote(state.name,state.previousVersion,'Restore only this K3 release predecessor after verification failure');console.log('Restored K3 predecessor '+state.name);}}throw error;}
