import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {prepareMedicationPackage,verifyMedicationPackage,requirePublicationApproval,reviewDigest,hash} from './package.mjs';
import {UPDATED_PATHS,MEDICATION_RELEASE} from './transform.mjs';
import {recipes} from './recipes.mjs';
import {images} from './images.mjs';
import {activeDeployment,replaceActiveTraffic} from '../aeo-geo/deployment.mjs';
import {runtimeRollbackDecision} from '../release/runtime-rollback-guard.mjs';
const directory='medication-evidence-proof';mkdirSync(directory,{recursive:true});
const approval=JSON.parse(readFileSync(new URL('./approval.json',import.meta.url)));requirePublicationApproval(approval);
const captured=JSON.parse(readFileSync(new URL('./serving-baseline.json',import.meta.url)));
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
assert.equal(account,'9e5386dcf455be34c582d93f8bfc79e6');assert(token,'Existing deployment credential required');
const save=(name,value)=>writeFileSync(directory+'/'+name,JSON.stringify(value,null,2));
const mainOf=s=>s.match(/<main\b[\s\S]*?<\/main>/i)?.[0];
const element=(s,tag)=>s.match(new RegExp('<'+tag+'\\b[\\s\\S]*?</'+tag+'>','i'))?.[0];
const clean=s=>s.replace(/<script\b[^>]*\bsrc=["']https:\/\/static.cloudflareinsights.com[^"']*["'][\s\S]*?<\/script>/gi,'').replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi,'');
async function provider(path,init={}){
 const r=await fetch('https://api.cloudflare.com/client/v4'+path,{...init,headers:{Authorization:'Bearer '+token,...init.headers},signal:AbortSignal.timeout(60000)});
 const data=await r.json();assert(r.ok&&data.success,'Provider operation failed: '+JSON.stringify(data.errors));return data.result;
}
const api=(path,init)=>provider('/accounts/'+account+path,init);
const latest=async script=>activeDeployment((await api('/workers/scripts/'+script+'/deployments')).deployments.toSorted((a,b)=>b.created_on.localeCompare(a.created_on))[0]);
const version=(script,id)=>api('/workers/workers/'+script+'/versions/'+id+'?include=modules');
function currentMain(){
 assert.equal(process.env.GITHUB_REF,'refs/heads/main');assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);
 execFileSync('git',['fetch','--no-tags','origin','main'],{stdio:'pipe'});
 assert.equal(execFileSync('git',['rev-parse','origin/main'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA,'A newer source exists; preserve it');
}
async function document(path){const response=await fetch('https://shiftsometimber.co.uk'+path,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(45000)});return {status:response.status,headers:Object.fromEntries(response.headers),html:await response.text()};}
async function mapLimit(items,fn,limit=4){const results=new Array(items.length);let index=0;await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(index<items.length){const i=index++;results[i]=await fn(items[i],i);}}));return results;}
async function protectedDocuments(){return Object.fromEntries(await mapLimit(['/','/member-login','/member/dashboard','/v1/member-state','/checkout','/recipes','/exercises'],async path=>{const p=await document(path);return [path,{status:p.status,sha256:hash(clean(p.html)),cache:p.headers['cache-control']}]}));}
function owner(routes,path){const url='https://shiftsometimber.co.uk'+path;const matches=routes.filter(r=>{const pattern=r.pattern.includes('://')?r.pattern:'*://'+r.pattern;return new RegExp('^'+pattern.split('*').map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*')+'$').test(url)}).sort((a,b)=>b.pattern.replaceAll('*','').length-a.pattern.replaceAll('*','').length);return matches[0]?.script||null;}
const receiptsPath=directory+'/deployments.json';
if(process.argv[2]==='rollback'){
 if(!existsSync(receiptsPath)){console.log('No owned production deployment to restore');process.exit(0);}
 const results=[];for(const receipt of JSON.parse(readFileSync(receiptsPath)).toReversed()){
  const active=await latest(receipt.script),decision=runtimeRollbackDecision({before:receipt.before,active,receipt,source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID});
  if(decision.action==='restore'){const restored=await api('/workers/scripts/'+receipt.script+'/deployments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy:'percentage',versions:receipt.before.providerVersions})});assert.equal((await latest(receipt.script)).id,restored.id);}
  results.push({script:receipt.script,...decision});
 }save('rollback.json',results);console.log(JSON.stringify({rollback:results}));process.exit(0);
}
currentMain();save('approval.json',approval);assert.equal(reviewDigest(),approval.reviewDigest);
const zones=await provider('/zones?name=shiftsometimber.co.uk');assert.equal(zones.length,1);const zone=zones[0];assert.equal(zone.account.id,account);
const routes=await provider('/zones/'+zone.id+'/workers/routes');
const ownership=Object.fromEntries(Object.keys(captured.ownership).map(path=>[path,{canonical:owner(routes,path),query:owner(routes,path+'?inventory=1')}]));
assert.deepEqual(ownership,captured.ownership,'Serving ownership moved; reconcile before any production write');save('route-owners.json',{ownership,routeWrites:0});
const beforeDocs={};await mapLimit(Object.keys(recipes),async path=>{
 const d=await document(path);assert.equal(d.status,200,path);assert.equal(hash(mainOf(d.html)||''),recipes[path].baselineMainSha256,'Clinical baseline changed: '+path);beforeDocs[path]=d;writeFileSync(directory+'/'+path.slice(1).replaceAll('/','--')+'-before.html',d.html);
});
const privateBefore=await protectedDocuments();save('protected-before.json',privateBefore);
const originalSitemap=await document('/sitemap.xml');assert.equal(originalSitemap.status,200);writeFileSync(directory+'/sitemap-before.xml',originalSitemap.html);
const planned=[],inspection=[];
for(const w of captured.workers){
 const before=await latest(w.script),original=await version(w.script,before.versions[0].version_id),settings=await api('/workers/scripts/'+w.script+'/settings');
 // Reconcile newer non-medical releases by retaining their complete immutable
 // source. Every clinical baseline and route owner has already matched above.
 assert(original.modules.some(m=>m.name===original.main_module));
 assert(!original.modules.some(m=>m.name.startsWith('medicine-evidence-20261103/')),'Release already present; inspect receipts instead of replaying');
 const candidate=prepareMedicationPackage(original);
 inspection.push({script:w.script,capturedVersion:w.versionId,versionId:before.versions[0].version_id,deploymentId:before.id,main:original.main_module,existingModules:original.modules.length,modules:original.modules.map(m=>({name:m.name,type:m.content_type,sha256:hash(Buffer.from(m.content_base64,'base64'))}))});
 planned.push({script:w.script,before,original,settings,candidate});
}
save('fresh-inspection.json',{readOnly:true,inspection,clinicalBaselinesMatched:30,routeWrites:0,databaseWrites:0});
console.log(JSON.stringify({preflight:'passed',pages:30,workers:planned.length,reviewDigest:reviewDigest()}));
currentMain();for(const p of planned)assert.equal((await latest(p.script)).id,p.before.id,'Serving lease changed before staging');
const staged=[];
for(const p of planned){
 const {original,settings,candidate}=p;
 const metadata={main_module:candidate.main_module,compatibility_date:original.compatibility_date,compatibility_flags:original.compatibility_flags||[],bindings:original.bindings.map(b=>({type:'inherit',name:b.name})),keep_assets:true,annotations:{'workers/message':MEDICATION_RELEASE+'; owner-approved exact copy; source '+process.env.GITHUB_SHA+'; run '+process.env.GITHUB_RUN_ID}};
 if(original.usage_model)metadata.usage_model=original.usage_model;
 for(const field of ['placement','limits','observability','logpush'])if(settings[field]!==undefined)metadata[field]=settings[field];
 const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');for(const m of candidate.modules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type}),m.name);
 currentMain();assert.equal((await latest(p.script)).id,p.before.id,'Serving lease changed');
 const result=await api('/workers/scripts/'+p.script+'/versions?bindings_inherit=strict',{method:'POST',body:form});
 const proof=verifyMedicationPackage(original,await version(p.script,result.id),candidate);
 staged.push({script:p.script,before:p.before,versionId:result.id,...proof});save('staged.json',staged);console.log(JSON.stringify({staged:p.script,versionId:result.id,...proof}));
}
currentMain();for(const p of staged)assert.equal((await latest(p.script)).id,p.before.id,'Serving lease changed before promotion');
const receipts=[];
for(const p of staged){
 currentMain();assert.equal((await latest(p.script)).id,p.before.id,'Serving lease changed immediately before promotion');
 let promoted;
 try{promoted=await api('/workers/scripts/'+p.script+'/deployments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy:'percentage',versions:replaceActiveTraffic(p.before,p.versionId)})});}
 catch(error){const active=await latest(p.script);if(active.versions[0].version_id!==p.versionId)throw error;promoted=active;}
 const receipt={kind:'owned_runtime_deployment',source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,script:p.script,versionId:p.versionId,deploymentId:promoted.id,before:p.before};receipts.push(receipt);save('deployments.json',receipts);assert.equal((await latest(p.script)).id,promoted.id);console.log(JSON.stringify({deployed:p.script,versionId:p.versionId,deploymentId:promoted.id}));
}
try{await provider('/zones/'+zone.id+'/purge_cache',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({files:[...UPDATED_PATHS,'/sitemap.xml'].map(p=>'https://shiftsometimber.co.uk'+p)})});save('cache-refresh.json',{purged:true,files:30});}catch(error){save('cache-refresh.json',{purged:false,error:error.message});}
const verification=[];
async function verifyPage(path){
 const before=beforeDocs[path],r=recipes[path];let d;
 for(let attempt=0;attempt<5;attempt++){d=await document(path);if(d.status===200&&hash(mainOf(d.html)||'')===r.mainAfterSha256)break;if(attempt<4)await new Promise(resolve=>setTimeout(resolve,5000));}
 assert.equal(d.status,200,path);assert.equal(hash(mainOf(d.html)||''),r.mainAfterSha256,'Live approved main mismatch: '+path);
 for(const tag of ['header','footer'])assert.equal(element(d.html,tag),element(before.html,tag),'Preserve '+path+' '+tag);
 assert.equal((d.html.match(/<h1\b/gi)||[]).length,1,path);assert.equal((d.html.match(/<main\b/gi)||[]).length,1,path);
 if(r.kind==='benchmark'){assert.equal(d.headers['x-shift-retatrutide-evidence'],before.headers['x-shift-retatrutide-evidence']);assert(d.html.includes('note.textContent=d.note;'));}
 else{
  assert.equal(d.headers['x-shift-medicine-evidence'],MEDICATION_RELEASE,path);assert(d.html.includes('data-mm-controller-script'));
  assert(d.html.includes('<link rel="canonical" href="https://shiftsometimber.co.uk'+path+'"')||new RegExp('<link\\b(?=[^>]*rel=["\']canonical["\'])(?=[^>]*href=["\']https://shiftsometimber\\.co\\.uk'+path+'["\'])').test(d.html));
  for(const url of r.sourceUrls)assert(d.html.includes(url),path+' citation');
  const query=await document(path+'?medication_release='+process.env.GITHUB_RUN_ID);assert.equal(query.status,200);assert.equal(hash(mainOf(query.html)||''),r.mainAfterSha256,'Query owner mismatch: '+path);
 }
 writeFileSync(directory+'/'+path.slice(1).replaceAll('/','--')+'-after.html',d.html);
 const result={path,status:d.status,mainSha256:r.mainAfterSha256,headerFooterUnchanged:true,queryOwnerVerified:r.kind!=='benchmark',bytesBefore:Buffer.byteLength(before.html),bytesAfter:Buffer.byteLength(d.html)};verification.push(result);save('pages.json',verification);return result;
}
await mapLimit(Object.keys(recipes),verifyPage);
const imageChecks=await mapLimit(Object.entries(images),async([path,image])=>{const r=await fetch('https://shiftsometimber.co.uk'+path,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);assert.equal(r.headers.get('Content-Type'),'image/png');const bytes=Buffer.from(await r.arrayBuffer());assert.equal(hash(bytes),image.sha256,path);assert.equal(bytes.readUInt32BE(16),1200);assert.equal(bytes.readUInt32BE(20),630);return {path,sha256:image.sha256,status:200};});save('images.json',imageChecks);
const sitemap=await document('/sitemap.xml');assert.equal(sitemap.status,200);for(const path of UPDATED_PATHS){const node=[...sitemap.html.matchAll(/<url\b[^>]*>[\s\S]*?<\/url>/g)].find(m=>m[0].includes('<loc>https://shiftsometimber.co.uk'+path+'</loc>'))?.[0];assert(node?.includes('<lastmod>2026-11-03</lastmod>'),'Sitemap date: '+path);}writeFileSync(directory+'/sitemap-after.xml',sitemap.html);
const dates=s=>[...s.matchAll(/<url\b[^>]*>[\s\S]*?<\/url>/g)].map(m=>m[0]).filter(s=>!UPDATED_PATHS.some(p=>s.includes('<loc>https://shiftsometimber.co.uk'+p+'</loc>')));assert.deepEqual(dates(sitemap.html),dates(originalSitemap.html),'Unrelated sitemap entries unchanged');
const privateAfter=await protectedDocuments();save('protected-after.json',privateAfter);assert.deepEqual(privateAfter,privateBefore,'Protected anonymous responses changed');
const finalRoutes=await provider('/zones/'+zone.id+'/workers/routes');assert.deepEqual(finalRoutes,routes,'No route changes during release');
for(const p of receipts)assert.equal((await latest(p.script)).id,p.deploymentId,'A newer deployment appeared during verification');
const result={verified:true,release:MEDICATION_RELEASE,source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,reviewDigest:reviewDigest(),pages:30,upgrades:29,queryOwners:29,images:29,retatrutideUnchanged:true,headerFooterUnchanged:true,protectedDocumentsUnchanged:true,routeWrites:0,databaseWrites:0,deployed:receipts.map(({script,versionId,deploymentId})=>({script,versionId,deploymentId}))};save('live-verification.json',result);console.log(JSON.stringify(result));
