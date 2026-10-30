import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {routeOwner,metadataFor} from '../../knowledge-health/release-helpers.mjs';
import css from './styles.mjs';
import {transformHTML,mainHTML,assetBase,topics,release,clientURL} from './layout.mjs';
import {promptClient} from './prompts.mjs';
import {check} from './check.mjs';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
const prefix='release/ask-timber-a4-20261030/',dir='ask-a4-evidence';fs.mkdirSync(dir,{recursive:true});
const save=(n,v)=>fs.writeFileSync(dir+'/'+n+'.json',JSON.stringify(v,null,2));
const hash=v=>createHash('sha256').update(v).digest('hex');
async function cf(p,method='GET',body){const response=await fetch('https://api.cloudflare.com/client/v4'+p,{method,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});const j=await response.json();assert(response.ok&&j.success,'Provider request failed '+method+' '+p+' '+JSON.stringify(j.errors));return j.result;}
const routes=()=>cf('/zones/'+zone+'/workers/routes');
async function active(worker){const r=await cf('/accounts/'+account+'/workers/scripts/'+worker+'/deployments');const d=r.deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];assert.equal(d.versions.length,1);assert.equal(d.versions[0].percentage,100);return d;}
async function get(p){const response=await fetch('https://shiftsometimber.co.uk'+p,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(45000)});assert.equal(response.status,200,'Current page unavailable '+p);return {html:await response.text(),headers:response.headers};}
const promote=(worker,id,message)=>cf('/accounts/'+account+'/workers/scripts/'+worker+'/deployments','POST',{strategy:'percentage',versions:[{version_id:id,percentage:100}],annotations:{'workers/message':message}});
let worker,before,versionId,promoted=false;
try{
 const beforeRoutes=await routes();worker=routeOwner(beforeRoutes,'https://shiftsometimber.co.uk/ask-timber')?.script;
 assert.equal(worker,'shift-ask-guided-presentation-20261021','Unexpected current Ask owner; inspect instead of overwriting');
 for(const k of topics)assert.equal(routeOwner(beforeRoutes,'https://shiftsometimber.co.uk'+assetBase+k+'.webp')?.script,worker,'Existing route must own A4 assets');
 before=await active(worker);const previousVersion=before.versions[0].version_id;
 const current=await cf('/accounts/'+account+'/workers/workers/'+worker+'/versions/'+previousVersion+'?include=modules'),settings=await cf('/accounts/'+account+'/workers/scripts/'+worker+'/settings');
 assert(current.modules?.length,'Provider module capture missing');
 assert(!current.assets&&!settings.assets,'Unexpected static assets; preserve with an explicit asset transfer before deployment');
 const js=current.modules.filter(m=>/\.(mjs|js)$/.test(m.name));const referenced=new Set();
 for(const m of js){const code=Buffer.from(m.content_base64,'base64').toString('utf8');for(const match of code.matchAll(/\b(?:from\s*|import\s*)["']([^"']+)["']/g)){const spec=match[1];if(spec.startsWith('.'))referenced.add(path.posix.normalize(path.posix.join(path.posix.dirname(m.name),spec)));}}
 const roots=js.filter(m=>!referenced.has(m.name));
 const explicit=current.main_module||current.metadata?.main_module||current.resources?.script?.main_module||settings.main_module;
 if(!explicit)assert.equal(roots.length,1,'Current entry point is ambiguous');
 const providerMain=explicit||roots[0].name;let oldMain=providerMain,entryMain='ask-a4/overlay.mjs',baseModules=current.modules;
 const owned=current.modules.find(m=>m.name==='ask-a4/overlay.mjs');
 if(owned){const code=Buffer.from(owned.content_base64,'base64').toString('utf8');assert(code.includes("headers.set('X-Shift-Ask-Design',release)"),'Unexpected owned layer');const predecessor=code.match(/^import original from ['"]\.\.\/([^'"]+)['"]/m)?.[1];assert(predecessor&&!predecessor.includes('..'),'Original Ask predecessor missing');oldMain=predecessor;baseModules=current.modules.filter(m=>!m.name.startsWith('ask-a4/'));if(providerMain!=='ask-a4/overlay.mjs')entryMain=providerMain;}
 assert(baseModules.some(m=>m.name===oldMain));
 const baseline=await get('/ask-timber'),candidate=transformHTML(baseline.html,css),checks=check(baseline.html,candidate);
 assert(!/Georgia|Times New Roman/.test(css),'Restore the established Arial font throughout A4');
 if(baseline.html.includes('data-ask-a4="'+release+'"'))assert.equal(mainHTML(candidate),mainHTML(baseline.html),'Font restoration must preserve the entire A4 main markup');
 const clientBefore=await get('/ask-timber/client.js');
 assert(clientBefore.html.includes('timberQuestion')&&clientBefore.html.includes('data-topic'),'Existing guided question client missing');
 const homeBefore=mainHTML((await get('/')).html),healthBefore=mainHTML((await get('/shift-health')).html);assert(homeBefore&&healthBefore);
 const originalHashes=baseModules.map(m=>({name:m.name,sha256:hash(Buffer.from(m.content_base64,'base64'))}));
 save('before',{source:process.env.GITHUB_SHA,worker,previousVersion,oldMain,routeCount:beforeRoutes.length,moduleHashes:originalHashes,checks,clientSHA256:hash(clientBefore.html),homepageMainSHA256:hash(homeBefore),healthMainSHA256:hash(healthBefore)});
 fs.writeFileSync(dir+'/before.html',baseline.html);fs.writeFileSync(dir+'/candidate.html',candidate);
 const overlay=fs.readFileSync(prefix+'overlay.mjs','utf8').replaceAll('./original.mjs','../'+oldMain);
 const additions=['layout.mjs','styles.mjs','prompts.mjs'].map(n=>({name:'ask-a4/'+n,content_type:'application/javascript+module',content_base64:fs.readFileSync(prefix+n).toString('base64')}));
 additions.push({name:'ask-a4/overlay.mjs',content_type:'application/javascript+module',content_base64:Buffer.from(overlay).toString('base64')});
 for(const k of topics)additions.push({name:'ask-a4/assets/'+k+'.webp',content_type:'application/octet-stream',content_base64:fs.readFileSync(prefix+'assets/'+k+'.webp').toString('base64')});
 const modules=[...baseModules,...additions];assert.equal(new Set(modules.map(m=>m.name)).size,modules.length);
 const metadata=metadataFor(current,settings,entryMain,process.env.GITHUB_SHA,previousVersion);
 metadata.annotations={'workers/message':'Matt selected A4: question first, compact photographic topic controls; preserve current Ask answers, all modules and routes.','workers/tag':'ask-a4-'+process.env.GITHUB_SHA.slice(0,12)};
 assert.equal((await active(worker)).id,before.id,'Current serving version changed before staging');
 const uploaded=await cf('/accounts/'+account+'/workers/workers/'+worker+'/versions?deploy=false','POST',{...metadata,modules});versionId=uploaded.id;assert(versionId);
 const staged=await cf('/accounts/'+account+'/workers/workers/'+worker+'/versions/'+versionId+'?include=modules');
 assert.equal(staged.modules.length,modules.length);for(const m of modules){const found=staged.modules.find(x=>x.name===m.name);assert(found,'Missing staged '+m.name);assert.equal(hash(Buffer.from(found.content_base64,'base64')),hash(Buffer.from(m.content_base64,'base64')),'Staged bytes differ '+m.name);}
 const sort=bs=>[...(bs||[])].sort((a,b)=>a.name.localeCompare(b.name));assert.deepEqual(sort(staged.bindings),sort(current.bindings),'Current bindings must be identical');
 assert.deepEqual(await routes(),beforeRoutes,'This release changes no routes');assert.equal((await active(worker)).id,before.id,'Owner changed during staging');
 assert.equal((await get('/ask-timber')).html,baseline.html,'Ask page changed during preparation');
 save('staged',{versionId,previousVersion,moduleCount:modules.length,retainedModules:originalHashes.length});
 await promote(worker,versionId,'Deploy Matt’s selected A4 Ask Timber layout');promoted=true;
 let live;for(let n=0;n<10;n++){live=await get('/ask-timber');if(live.headers.get('x-shift-ask-design')===release&&live.html===candidate)break;await new Promise(r=>setTimeout(r,1500));}
 fs.writeFileSync(dir+'/observed.html',live.html);
 if(live.html!==candidate){let at=0;while(at<Math.min(live.html.length,candidate.length)&&live.html[at]===candidate[at])at++;save('candidate-mismatch',{at,beforeSHA256:hash(baseline.html),actualSHA256:hash(live.html),expectedSHA256:hash(candidate),actualLength:live.html.length,expectedLength:candidate.length,actual:live.html.slice(Math.max(0,at-100),at+400),expected:candidate.slice(Math.max(0,at-100),at+400)});}
 assert.equal(live.headers.get('x-shift-ask-design'),release);assert.equal(hash(live.html),hash(candidate),'Actual delivered HTML must equal exact tested candidate');
 check(baseline.html,live.html);
 const assets=[];for(const k of topics){const r=await fetch('https://shiftsometimber.co.uk'+assetBase+k+'.webp');assert.equal(r.status,200);assert.equal(hash(Buffer.from(await r.arrayBuffer())),hash(fs.readFileSync(prefix+'assets/'+k+'.webp')));assets.push(k);}
 const guideAssets=[...candidate.matchAll(/<img[^>]*src="(\/shift-health\/assets\/cards-20261029\/[^"?]+)"/g)].map(m=>m[1]);assert.equal(guideAssets.length,6);
 for(const asset of guideAssets){const r=await fetch('https://shiftsometimber.co.uk'+asset,{method:'HEAD'});assert.equal(r.status,200,'Existing guide image unavailable '+asset);}
 assert.equal((await get('/ask-timber/client.js')).html,clientBefore.html,'Keep original guided question client byte for byte');
 assert.equal((await get(clientURL)).html,promptClient,'Deliver the exact bounded wider-health prompt connector');
 assert.equal(mainHTML((await get('/')).html),homeBefore,'Homepage untouched');assert.equal(mainHTML((await get('/shift-health')).html),healthBefore,'Health hub untouched');
 assert.deepEqual(await routes(),beforeRoutes,'No route changes');assert.equal((await active(worker)).versions[0].version_id,versionId);
 fs.writeFileSync(dir+'/live.html',live.html);
 const receipt={verified:true,design:'A4',source:process.env.GITHUB_SHA,worker,versionId,previousVersion,retainedModules:originalHashes.length,routeCount:beforeRoutes.length,routesChanged:0,checks,photoAssetsVerified:assets.length,widerPhotoAssetsVerified:guideAssets.length,questionClientUnchanged:true,homepageUnchanged:true,healthHubUnchanged:true,verifiedAt:new Date().toISOString()};save('receipt',receipt);console.log('ASK_A4_RELEASE '+JSON.stringify(receipt));
}catch(error){save('failure',{message:error.message,stack:error.stack,worker,versionId,promoted});if(promoted&&(await active(worker)).versions[0].version_id===versionId){await promote(worker,before.versions[0].version_id,'Restore only A4 predecessor after verification failure');console.log('Restored this release predecessor only.');}throw error;}
