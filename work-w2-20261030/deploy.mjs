import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {routeOwner} from '../hero-set-20261030/route-owner.mjs';
import {transform,version,assetPath,mainHTML} from './runtime.mjs';
import {media} from './media.mjs';
import {check} from './check.mjs';
import {browserCheck} from './browser.mjs';
import {waitForDeployment} from './release-state.mjs';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed',prefix='work-w2-20261030/',dir='work-w2-evidence',name='shift-seo-followup-v3-20261024';
fs.mkdirSync(dir,{recursive:true});
const save=(n,v)=>fs.writeFileSync(dir+'/'+n+'.json',JSON.stringify(v,null,2)),hash=v=>createHash('sha256').update(v).digest('hex');
async function cf(p,method='GET',body){const r=await fetch('https://api.cloudflare.com/client/v4'+p,{method,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});const j=await r.json();assert(r.ok&&j.success,'Provider request failed '+method+' '+p+' '+JSON.stringify(j.errors));return j.result;}
const routes=()=>cf('/zones/'+zone+'/workers/routes');
async function active(){const r=await cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments');const d=r.deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];assert.equal(d.versions.filter(v=>v.percentage===100).length,1);assert(d.versions.every(v=>v.percentage===0||v.percentage===100));return d;}
const serving=d=>d.versions.find(v=>v.percentage===100).version_id;
const promote=(id,message)=>cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments','POST',{strategy:'percentage',versions:[{version_id:id,percentage:100}],annotations:{'workers/message':message}});
async function get(p,overrides){const r=await fetch('https://shiftsometimber.co.uk'+p,{redirect:'manual',headers:{'Cache-Control':'no-cache',...(overrides?{'Cloudflare-Workers-Version-Overrides':overrides}:{})},signal:AbortSignal.timeout(45000)});return {html:await r.text(),status:r.status,location:r.headers.get('Location'),headers:r.headers};}
const snapshots=ms=>ms.map(m=>({name:m.name,sha256:hash(Buffer.from(m.content_base64,'base64'))})).sort((a,b)=>a.name.localeCompare(b.name));
const sorted=bs=>[...(bs||[])].sort((a,b)=>a.name.localeCompare(b.name));
let state,promoted=false;
try{
 const beforeRoutes=await routes(),preflight=JSON.parse(fs.readFileSync(prefix+'preflight.json','utf8'));
 for(const owner of preflight.owners)assert.deepEqual(routeOwner(beforeRoutes,'https://shiftsometimber.co.uk'+owner.path),owner.route,'Owner changed '+owner.path);
 assert(preflight.owners.every(x=>x.route.script===name),'W2 must use only the existing Work owner');
 const paths=preflight.owners.map(x=>x.path).filter(x=>!x.includes('/assets/')&&!x.endsWith('client.js'));
 const baselines={},candidates={},checks=[];
 for(const p of paths){const b=await get(p);assert([200,301,302,307,308].includes(b.status),'Unexpected baseline '+p);baselines[p]=b;candidates[p]=b.status===200?transform(b.html):b.html;if(b.status===200)checks.push({path:p,...check(b.html,candidates[p])});}
 assert.equal(baselines['/shift-for-work'].status,200);
 fs.writeFileSync(dir+'/work-before.html',baselines['/shift-for-work'].html);fs.writeFileSync(dir+'/work-candidate.html',candidates['/shift-for-work']);
 const protectedPaths=['/','/programme','/start-here','/shift-health','/ask-timber','/knowledge','/explore-knowledge','/treatment-centre','/member/dashboard','/mens-mental-health','/shift-health/stop-smoking'];
 const protectedPages={};for(let i=0;i<protectedPaths.length;i+=6)await Promise.all(protectedPaths.slice(i,i+6).map(async p=>{const b=await get(p);assert([200,301,302,307,308].includes(b.status),'Protected page unavailable '+p);if(b.status===200)assert(mainHTML(b.html),'No protected main '+p);protectedPages[p]=b;}));
 const codePaths=new Set(['/shift-for-work/client.js']);
 for(const b of [...Object.values(baselines),...Object.values(protectedPages)])for(const m of b.html.matchAll(/(?:src|href)=["'](\/[^"']+\.(?:js|mjs|css)(?:\?[^"']*)?)["']/g))codePaths.add(m[1]);
 const preservedAssets=[],unavailableBefore=[];
 for(let i=0,all=[...codePaths];i<all.length;i+=8)await Promise.all(all.slice(i,i+8).map(async p=>{const r=await fetch('https://shiftsometimber.co.uk'+p,{signal:AbortSignal.timeout(45000)});if(r.status!==200||r.headers.get('Content-Type')?.includes('text/html')){unavailableBefore.push({path:p,status:r.status});return;}preservedAssets.push({path:p,sha256:hash(Buffer.from(await r.arrayBuffer()))});}));
 const deployment=await active(),previousVersion=serving(deployment);assert.equal(deployment.versions.length,1,'Another staged release exists');
 const current=await cf('/accounts/'+account+'/workers/workers/'+name+'/versions/'+previousVersion+'?include=modules'),settings=await cf('/accounts/'+account+'/workers/scripts/'+name+'/settings');
 assert(current.modules?.length);assert(!current.modules.some(m=>m.name.startsWith(prefix)),'W2 already installed; reconcile before retry');
 const js=current.modules.filter(m=>/\.(mjs|js)$/.test(m.name)),referenced=new Set();
 for(const m of js)for(const x of Buffer.from(m.content_base64,'base64').toString().matchAll(/\b(?:from\s*|import\s*)["']([^"']+)["']/g))if(x[1].startsWith('.'))referenced.add(path.posix.normalize(path.posix.join(path.posix.dirname(m.name),x[1])));
 const roots=js.filter(m=>!referenced.has(m.name)),explicit=current.main_module||current.metadata?.main_module||current.resources?.script?.main_module||settings.main_module;
 if(!explicit)assert.equal(roots.length,1);const oldMain=explicit||roots[0].name;assert(current.modules.some(m=>m.name===oldMain));assert(!oldMain.includes('..')&&!oldMain.startsWith('/'));
 const entry='import original from "../'+oldMain+'";\nexport * from "../'+oldMain+'";\nimport {wrap} from "./runtime.mjs";\nimport {media} from "./media.mjs";\nexport default wrap(original,media);\n';
 const additions=['runtime.mjs','presentation.mjs','media.mjs'].map(n=>({name:prefix+n,content_type:'application/javascript+module',content_base64:fs.readFileSync(prefix+n).toString('base64')}));
 additions.push({name:prefix+'entry.mjs',content_type:'application/javascript+module',content_base64:Buffer.from(entry).toString('base64')});
 const modules=[...current.modules,...additions];assert.equal(new Set(modules.map(m=>m.name)).size,modules.length);
 const resources=current.resources?.script_runtime||{},bindings=current.bindings||settings.bindings;
 const metadata={main_module:prefix+'entry.mjs',compatibility_date:current.compatibility_date||resources.compatibility_date||settings.compatibility_date,compatibility_flags:current.compatibility_flags||resources.compatibility_flags||settings.compatibility_flags||[],bindings:bindings.map(b=>({type:'inherit',name:b.name,version_id:previousVersion})),annotations:{'workers/message':'Matt selected W2 black: only SHIFT for Work presentation; preserve enquiry and shared shell.','workers/tag':'work-w2-'+process.env.GITHUB_SHA.slice(0,12)}};
 for(const k of ['usage_model','limits','placement','cache_options','observability','tail_consumers','logpush'])if(current[k]!==undefined||resources[k]!==undefined||settings[k]!==undefined)metadata[k]=current[k]??resources[k]??settings[k];
 assert(!(current.assets||resources.assets||settings.assets),'Unexpected asset storage; preserve before staging');
 state={deployment,previousVersion};
 save('before',{source:process.env.GITHUB_SHA,name,previousVersion,oldMain,checks,routeCount:beforeRoutes.length,retainedModules:snapshots(current.modules),bindingTypes:bindings.map(b=>({name:b.name,type:b.type})),protectedPaths,preservedAssets,unavailableBefore});
 assert.equal((await active()).id,deployment.id,'Owner changed before staging');
 const uploaded=await cf('/accounts/'+account+'/workers/workers/'+name+'/versions?deploy=false','POST',{...metadata,modules});state.versionId=uploaded.id;assert(state.versionId);
 const staged=await cf('/accounts/'+account+'/workers/workers/'+name+'/versions/'+state.versionId+'?include=modules');
 assert.deepEqual(snapshots(staged.modules),snapshots(modules),'Module bytes changed');assert.deepEqual(sorted(staged.bindings),sorted(bindings),'Bindings changed');assert.equal(staged.assets,current.assets,'Asset configuration changed');
 assert.equal((await active()).id,deployment.id,'Staging changed ordinary traffic');assert.deepEqual(await routes(),beforeRoutes,'Routes changed during preparation');
 for(const p of paths)assert.equal((await get(p)).html,baselines[p].html,'Work changed during preparation '+p);
 save('staged',{source:process.env.GITHUB_SHA,name,previousVersion,versionId:state.versionId,retainedModules:current.modules.length});
 const zeroVersions=[{version_id:previousVersion,percentage:100},{version_id:state.versionId,percentage:0}];
 const zeroCreated=await cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments','POST',{strategy:'percentage',versions:zeroVersions,annotations:{'workers/message':'Verify selected Work W2 at zero ordinary traffic'}});
 assert(zeroCreated.id,'Zero-traffic creation receipt missing');state.zeroDeployment=zeroCreated.id;
 await waitForDeployment(active,{id:zeroCreated.id,versions:zeroVersions},{previousIds:[deployment.id]});
 const override=name+'="'+state.versionId+'"';
 async function verify(overrides){
  for(const p of paths){let b;for(let attempt=1;attempt<=30;attempt++){b=await get(p,overrides);if(b.status!==200||b.headers.get('X-Shift-Work-W2')===version)break;if(attempt<30)await new Promise(r=>setTimeout(r,1500));}assert.equal(b.status,baselines[p].status,'Status changed '+p);assert.equal(b.location,baselines[p].location,'Redirect changed '+p);if(b.status===200){assert.equal(b.headers.get('X-Shift-Work-W2'),version,'W2 marker missing '+p);check(baselines[p].html,b.html);}assert.equal(hash(b.html),hash(candidates[p]),'Exact candidate mismatch '+p);}
  for(let i=0;i<protectedPaths.length;i+=6)await Promise.all(protectedPaths.slice(i,i+6).map(async p=>{const b=await get(p,overrides),old=protectedPages[p];assert.equal(b.status,old.status,'Protected status '+p);assert.equal(b.location,old.location,'Protected redirect '+p);if(b.status===200)assert.equal(mainHTML(b.html),mainHTML(old.html),'Protected page changed '+p);}));
  const all=[{path:assetPath,sha256:hash(media())},...preservedAssets];for(let i=0;i<all.length;i+=8)await Promise.all(all.slice(i,i+8).map(async a=>{const r=await fetch('https://shiftsometimber.co.uk'+a.path,{headers:overrides?{'Cloudflare-Workers-Version-Overrides':overrides}:{},signal:AbortSignal.timeout(45000)});assert.equal(r.status,200,'Asset unavailable '+a.path);assert.equal(hash(Buffer.from(await r.arrayBuffer())),a.sha256,'Asset changed '+a.path);}));
 }
 await verify(override);
 const browser=await browserCheck({headers:{'Cloudflare-Workers-Version-Overrides':override},label:'zero-traffic'});
 save('zero-traffic',{verified:true,checks,protectedPages:protectedPaths.length,existingCodeAssets:preservedAssets.length,browser});
 if(process.env.WORK_W2_PREVIEW_ONLY==='1'){
  assert.equal((await active()).id,state.zeroDeployment,'Owner changed during preview');
  const restored=await promote(previousVersion,'Finish W2 visual preview with ordinary traffic unchanged');
  await waitForDeployment(active,{id:restored.id,versions:[{version_id:previousVersion,percentage:100}]},{previousIds:[state.zeroDeployment]});
  save('preview',{verified:true,productionPublished:false,source:process.env.GITHUB_SHA,versionId:state.versionId,previousVersion,checks,browser});
  console.log('WORK_W2_PREVIEW '+JSON.stringify({verified:true,productionPublished:false,source:process.env.GITHUB_SHA,versionId:state.versionId,previousVersion}));process.exit(0);
 }
 assert.equal((await active()).id,state.zeroDeployment,'Owner changed before promotion');assert.deepEqual(await routes(),beforeRoutes);
 try{
  const published=await promote(state.versionId,'Deploy Matt’s selected SHIFT for Work W2 black');state.productionDeployment=published.id;
  await waitForDeployment(active,{id:published.id,versions:[{version_id:state.versionId,percentage:100}]},{previousIds:[state.zeroDeployment]});promoted=true;
 }catch(error){promoted=serving(await active())===state.versionId;throw error;}
 assert(promoted);await verify();
 const liveBrowser=await browserCheck({label:'live'});
 assert.deepEqual(await routes(),beforeRoutes);assert.equal(serving(await active()),state.versionId);
 const receipt={verified:true,source:process.env.GITHUB_SHA,release:version,page:'/shift-for-work',selected:'W2 black',name,versionId:state.versionId,previousVersion,retainedModules:current.modules.length,bindingsPreserved:bindings.length,routeCount:beforeRoutes.length,routesChanged:0,checks,protectedPages:protectedPaths,existingCodeAssetsPreserved:preservedAssets.length,photographSHA256:hash(media()),browser:liveBrowser,verifiedAt:new Date().toISOString()};save('receipt',receipt);console.log('WORK_W2_RELEASE '+JSON.stringify(receipt));
}catch(error){save('failure',{message:error.message,stack:error.stack,state,promoted});if(state){const d=await active();if((promoted&&serving(d)===state.versionId)||(state.zeroDeployment&&d.id===state.zeroDeployment)){await promote(state.previousVersion,'Restore only this W2 predecessor after verification failure');console.log('Restored W2 predecessor');}}throw error;}
