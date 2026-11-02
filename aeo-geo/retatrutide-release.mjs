import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {prepareRetatrutidePackage,verifyPackage,prepareRetatrutidePagePackage,verifyRetatrutidePagePackage,hash} from './package.mjs';
import {activeDeployment,replaceActiveTraffic} from './deployment.mjs';
import {runtimeRollbackDecision} from '../release/runtime-rollback-guard.mjs';
import {verifyRetatrutideScope} from './retatrutide-scope.mjs';
import {evidence} from './retatrutide-evidence.mjs';
import {RETA_PATH,COMPARISON_PATH,RETA_IMAGE_PATH,RETA_RELEASE} from './retatrutide.mjs';
import targets from './targets.json' with {type:'json'};
const directory='retatrutide-evidence-proof';mkdirSync(directory,{recursive:true});
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
assert.equal(account,'9e5386dcf455be34c582d93f8bfc79e6');assert(token,'Existing deployment credential required');
const save=(name,value)=>writeFileSync(directory+'/'+name,JSON.stringify(value,null,2));
async function provider(path,init={}){
 const r=await fetch('https://api.cloudflare.com/client/v4'+path,{...init,headers:{Authorization:'Bearer '+token,...init.headers},signal:AbortSignal.timeout(60000)});
 const data=await r.json();assert(r.ok&&data.success,'Provider request failed: '+JSON.stringify(data.errors));return data.result;
}
const api=(path,init)=>provider('/accounts/'+account+path,init);
const latest=async script=>activeDeployment((await api('/workers/scripts/'+script+'/deployments')).deployments.toSorted((a,b)=>b.created_on.localeCompare(a.created_on))[0]);
const version=(script,id)=>api('/workers/workers/'+script+'/versions/'+id+'?include=modules');
function currentMain(){
 assert.equal(process.env.GITHUB_REF,'refs/heads/main');assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);
 execFileSync('git',['fetch','--no-tags','origin','main'],{stdio:'pipe'});
 assert.equal(execFileSync('git',['rev-parse','origin/main'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA,'Main changed; retain the newer release');
}
const clean=html=>html.replace(/<script\b[^>]*\bsrc=["']https:\/\/static.cloudflareinsights.com[^"']*["'][\s\S]*?<\/script>/gi,'').replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi,'');
async function document(path){const started=performance.now();const response=await fetch('https://shiftsometimber.co.uk'+path,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(45000)});const text=await response.text();return {response,text,milliseconds:performance.now()-started};}
async function protectedDocuments(){
 const documents={};for(const path of ['/','/member-login','/member/dashboard','/v1/member-state','/recipes','/exercises']){
  const {response,text}=await document(path);documents[path]={status:response.status,sha256:hash(clean(text)),cache:response.headers.get('Cache-Control')};
 }return documents;
}
function routeOwner(routes,path){
 const url='shiftsometimber.co.uk'+path;
 const matched=routes.filter(r=>r.script).filter(r=>{const pattern=r.pattern.replace(/^https?:\/\//,'');return new RegExp('^'+pattern.split('*').map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*')+'$').test(url)}).sort((a,b)=>b.pattern.replaceAll('*','').length-a.pattern.replaceAll('*','').length);
 assert(matched.length,'No owner for '+path);return matched[0].script;
}
const receiptsPath=directory+'/deployments.json';
const pageOwner='shift-public-presentation-batch-20261022';
const inspectedPageDeployment='6687992b-a3bb-49e8-a278-5550d1da1c5d';
if(process.argv[2]==='rollback'){
 if(!existsSync(receiptsPath)){console.log('No owned production deployment to restore');process.exit(0)}
 const receipts=JSON.parse(readFileSync(receiptsPath)),results=[];
 for(const receipt of receipts.toReversed()){
  const active=await latest(receipt.script),decision=runtimeRollbackDecision({before:receipt.before,active,receipt,source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID});
  if(decision.action==='restore'){
   const restored=await api('/workers/scripts/'+receipt.script+'/deployments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy:'percentage',versions:receipt.before.providerVersions||[{version_id:decision.versionId,percentage:100}]})});
   assert.equal((await latest(receipt.script)).id,restored.id);
  }results.push({script:receipt.script,...decision});
 }save('rollback.json',results);console.log(JSON.stringify(results));
}else{
 currentMain();save('scope.json',verifyRetatrutideScope());
 const zones=await provider('/zones?name=shiftsometimber.co.uk');assert.equal(zones.length,1);
 const routes=await provider('/zones/'+zones[0].id+'/workers/routes');
 const paths=[RETA_PATH,COMPARISON_PATH,'/sitemap.xml',RETA_IMAGE_PATH],ownership=Object.fromEntries(paths.map(path=>[path,routeOwner(routes,path)]));
 const selected=[...new Set(Object.values(ownership))];
 save('route-owners.json',{ownership,routeWrites:0});console.log(JSON.stringify({routeOwnership:ownership}));
 const unexpected=selected.filter(s=>s!==pageOwner&&!targets.some(t=>t.script===s));
 for(const script of unexpected){const active=await latest(script),source=await version(script,active.versions[0].version_id);const inspection={script,deploymentId:active.id,main:source.main_module,ownedModules:source.modules.filter(m=>m.name.startsWith('aeo-geo/')).map(m=>({name:m.name,sha256:hash(Buffer.from(m.content_base64,'base64'))}))};save('owner-inspection-'+script+'.json',inspection);console.log(JSON.stringify({ownerInspection:inspection}));}
 assert.equal(unexpected.length,0,'An unknown serving owner needs inspection before staging: '+JSON.stringify(unexpected));
 const privateBefore=await protectedDocuments();save('protected-before.json',privateBefore);
 const beforeGuide=await document(RETA_PATH),beforeComparison=await document(COMPARISON_PATH);assert.equal(beforeGuide.response.status,200);assert.equal(beforeComparison.response.status,200);
 writeFileSync(directory+'/guide-before.html',beforeGuide.text);writeFileSync(directory+'/comparison-before.html',beforeComparison.text);
 const planned=[];
 for(const script of selected){
  const before=await latest(script),original=await version(script,before.versions[0].version_id),settings=await api('/workers/scripts/'+script+'/settings');
  const isPageOwner=script===pageOwner;
  if(isPageOwner){assert.equal(before.id,inspectedPageDeployment,'The inspected public page owner moved; stop before staging');assert.equal(original.main_module,'sitewide-seo-20261101/entry.mjs');}
  else {const oldDelivery=original.modules.find(m=>m.name==='aeo-geo/delivery.mjs');assert(oldDelivery,'Published AEO wrapper required');assert.equal(hash(Buffer.from(oldDelivery.content_base64,'base64')),evidence.approval.baselineDeliverySha256,'Inspected public wrapper changed; stop before staging');}
  const candidate=isPageOwner?prepareRetatrutidePagePackage(original):prepareRetatrutidePackage(original);
  const metadata={main_module:candidate.main_module,compatibility_date:original.compatibility_date,compatibility_flags:original.compatibility_flags||[],bindings:original.bindings.map(b=>({type:'inherit',name:b.name})),keep_assets:true,annotations:{'workers/message':'Owner-approved retatrutide evidence guide; retain all existing source, data, settings and routes'}};
  if(original.usage_model)metadata.usage_model=original.usage_model;
  for(const key of ['placement','limits','observability','logpush'])if(settings[key]!==undefined)metadata[key]=settings[key];
  const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');
  for(const m of candidate.modules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type}),m.name);
  currentMain();assert.equal((await latest(script)).id,before.id,'Serving lease changed before staging');
  const staged=await api('/workers/scripts/'+script+'/versions?bindings_inherit=strict',{method:'POST',body:form});
  const proof=(isPageOwner?verifyRetatrutidePagePackage:verifyPackage)(original,await version(script,staged.id),candidate);
  planned.push({script,before,versionId:staged.id,...proof});save('staged.json',planned);
 }
 currentMain();for(const p of planned)assert.equal((await latest(p.script)).id,p.before.id,'Serving lease changed');
 const receipts=[];
 for(const p of planned){
  assert.equal((await latest(p.script)).id,p.before.id,'Serving lease changed immediately before promotion');
  const promoted=await api('/workers/scripts/'+p.script+'/deployments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy:'percentage',versions:replaceActiveTraffic(p.before,p.versionId)})});
  const receipt={kind:'owned_runtime_deployment',source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,script:p.script,versionId:p.versionId,deploymentId:promoted.id,before:p.before};receipts.push(receipt);save('deployments.json',receipts);
  assert.equal((await latest(p.script)).id,promoted.id);
 }
 const guide=await document(RETA_PATH),comparison=await document(COMPARISON_PATH);assert.equal(guide.response.status,200);assert.equal(comparison.response.status,200);
 assert.equal(guide.response.headers.get('X-Shift-Retatrutide-Evidence'),RETA_RELEASE);assert(guide.text.includes('data-reta-evidence="20261102"'));assert(comparison.text.includes('authorised and investigational medicines'));
 assert.equal((guide.text.match(/<h1\b/gi)||[]).length,1);assert(guide.text.includes('25.0%')&&guide.text.includes('3.9%')&&guide.text.includes('28.3%'));assert(!guide.text.includes('PRIVATE REVIEW DRAFT'));
 const element=(s,tag)=>s.match(new RegExp('<'+tag+'\\b[\\s\\S]*?</'+tag+'>','i'))?.[0];
 for(const tag of ['header','footer'])assert.equal(element(guide.text,tag),element(beforeGuide.text,tag),'Public '+tag+' changed');
 const image=await fetch('https://shiftsometimber.co.uk'+RETA_IMAGE_PATH,{signal:AbortSignal.timeout(30000)});assert.equal(image.status,200);assert.equal(image.headers.get('Content-Type'),'image/png');
 const imageBytes=new Uint8Array(await image.arrayBuffer());assert.deepEqual([...imageBytes.slice(0,8)],[137,80,78,71,13,10,26,10]);
 const sitemap=await document('/sitemap.xml');assert.equal(sitemap.response.status,200);assert(new RegExp('<loc>https://shiftsometimber\\.co\\.uk'+RETA_PATH+'</loc>[\\s\\S]*?<lastmod>2026-11-02</lastmod>').test(sitemap.text));
 const privateAfter=await protectedDocuments();save('protected-after.json',privateAfter);assert.deepEqual(privateAfter,privateBefore,'Unrelated public or private document changed');
 writeFileSync(directory+'/guide-after.html',guide.text);writeFileSync(directory+'/comparison-after.html',comparison.text);
 const result={verified:true,source:process.env.GITHUB_SHA,guide:RETA_PATH,htmlBytesBefore:Buffer.byteLength(beforeGuide.text),htmlBytesAfter:Buffer.byteLength(guide.text),headerFooterUnchanged:true,protectedDocumentsUnchanged:true,catalogueDataChanged:false,routeWrites:0,databaseWrites:0,independentClinicalReviewClaimed:false,releases:receipts.map(r=>({script:r.script,versionId:r.versionId,deploymentId:r.deploymentId}))};
 save('live-verification.json',result);console.log(JSON.stringify(result));
}
