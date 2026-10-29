import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {productEditorial} from '../../health-nutrition/editorial.mjs';
import {publicProducts} from '../../health-nutrition/catalogue.mjs';
import {supplementSitemapPath} from '../../health-nutrition/seo.mjs';

const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed',database='88f40aed-cb23-4372-8c94-8a73f48bc847';
const script='shift-health-nutrition-20261027',dir='health-editorial-release',config='health-nutrition/wrangler.jsonc';
const branch='release/olivit-editorial-approved-20261028',reviewBranch='work/olivit-product-detail-20261028';
const reviewed='84cc457ec98bc94fc504023e8bc6f6a9abede094',main='afa38107c8d663dc233114982039a8814ca64229';
const predecessor='109fc39a-57f4-4662-85b8-65180f6ba30d',predecessorBytes='09d6ed280227a434b55902ad99f9e009b562fedc3d495471ecc6ab6be1fd3252';
const replacedModule='retained-health-nutrition.mjs';
const expectedTrees=['ef09cbb58bdfad6aa5936a63c4c8d8d3d7cda2bf','c0c39e4c4f489b3d7b62860f312a823e6d67dfa5','139a8e03733dffaa36e518bdcc57fc66ab9eee16'];
mkdirSync(dir,{recursive:true});
const save=(name,data)=>writeFileSync(dir+'/'+name+'.json',JSON.stringify(data,null,2)+'\n');
const load=name=>JSON.parse(readFileSync(dir+'/'+name+'.json','utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');
const cli=(...args)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config',config],{encoding:'utf8',maxBuffer:6e6,timeout:120000});
async function cf(path,method='GET',body){
 const response=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(45000)});
 const result=await response.json();assert(response.ok&&result.success,'Cloudflare '+method+' failed ('+response.status+'): '+JSON.stringify(result.errors?.map(e=>({code:e.code,message:e.message}))));return result.result;
}
async function sourceCurrent(){
 assert.equal(process.env.GITHUB_REF,'refs/heads/'+branch);
 assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);
 const trees=execFileSync('git',['rev-parse','HEAD:health-nutrition','HEAD:checkout-extras','HEAD:public-purchase-basket.mjs'],{encoding:'utf8',timeout:10000}).trim().split('\n');
 assert.deepEqual(trees,expectedTrees,'Reviewed runtime changed; reuse of the successful 72-check/browser receipt is no longer valid');
 for(const [name,sha] of [['main',main],[reviewBranch,reviewed],[branch,process.env.GITHUB_SHA]]){
  const response=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/git/ref/heads/'+name,{headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});
  assert(response.ok,'Cannot verify source ref');assert.equal((await response.json()).object.sha,sha,'Source ref changed: '+name);
 }
 const response=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/runs/40789307809',{headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});
 assert(response.ok,'Cannot verify exact-source CI receipt');const run=await response.json();
 assert.equal(run.head_sha,'5e2462443bd4a32c5ec7ec52c1c6e9cb6b396915');assert.equal(run.conclusion,'success');
}
async function deployment(name){
 const result=await cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments');
 const current=result.deployments.toSorted((a,b)=>b.created_on.localeCompare(a.created_on))[0];
 assert(current?.versions?.length===1&&current.versions[0].percentage===100,'Expected one active version: '+name);return current;
}
const routes=()=>cf('/zones/'+zone+'/workers/routes');
async function retained(){
 const result={};
 for(const name of ['shift-core','shift-blog-publisher','shift-hq-member-comms-20261023','shift-programme-member-20261023','shift-treatment-options-presentation-20261022']){
  const current=await deployment(name);result[name]={deploymentId:current.id,versionId:current.versions[0].version_id};
 }
 return result;
}
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const fingerprint=value=>hash(JSON.stringify(stable(value)));
const manifest=current=>current.modules.map(m=>[m.name,hash(Buffer.from(m.content_base64,'base64'))]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
const versionConfig=current=>Object.fromEntries(['main_module','compatibility_date','usage_model','assets','cache_options','containers','exports','limits','package_dependencies','placement'].filter(key=>current[key]!==undefined).map(key=>[key,current[key]]).concat([['compatibility_flags',current.compatibility_flags||[]],['bindings',(current.bindings||[]).toSorted((a,b)=>a.name.localeCompare(b.name))]]));
const functionalSettings=settings=>Object.fromEntries(Object.entries(settings).filter(([key])=>key!=='annotations'));
const scriptState=async()=>({settings:fingerprint(functionalSettings(await cf('/accounts/'+account+'/workers/scripts/'+script+'/settings'))),schedules:fingerprint(await cf('/accounts/'+account+'/workers/scripts/'+script+'/schedules'))});
async function version(id,expectedHash){
 const current=await cf('/accounts/'+account+'/workers/workers/'+script+'/versions/'+id+'?include=modules');
 assert.equal(current.id,id);const before=load('before'),expected=before.moduleManifest.map(([name,sha])=>[name,name===replacedModule?expectedHash:sha]);
 assert.deepEqual(manifest(current),expected,'An unowned module changed, or prepared supplement bytes differ');
 assert.equal(fingerprint(versionConfig(current)),before.versionConfiguration,'Current version configuration/bindings changed');
 return current;
}
async function db(sql,params=[]){
 assert(/^SELECT\b/i.test(sql.trim()),'This release may only read catalogue data');
 const rows=await cf('/accounts/'+account+'/d1/database/'+database+'/query','POST',{sql,params});assert(rows.every(r=>r.success),'Catalogue read failed');return rows[0].results;
}
const DB={prepare(sql){return {async all(){return {results:await db(sql)}}}}};
async function catalogueState(){
 const rows=await db('SELECT * FROM supplement_products ORDER BY id');assert.equal(rows.length,8);
 for(const row of rows){assert.equal(row.status,'draft');assert.equal(row.sale_enabled,0);assert.equal(row.visibility,'proposed');assert(productEditorial(row),'Current item differs from its reviewed identity: '+row.id);}
 const sku=await db("SELECT source_table,source_id,sku FROM catalogue_skus WHERE source_table='supplement_products' ORDER BY source_id");assert.equal(sku.length,8);
 const active=await db('SELECT COUNT(*) n FROM supplement_checkout_offers WHERE active=1');assert.equal(active[0].n,0,'Supplement offers must remain inactive');
 return {count:rows.length,recordHash:hash(JSON.stringify(rows)),skuHash:hash(JSON.stringify(sku)),purchasingEnabled:false};
}
async function publicState(){
 const result={};
 for(const path of ['/assets/shift-purchase-basket-v1.js','/shift-health/assets/checkout-recommendations.json','/shift-health/testing','/shift-health/testing/diabetes','/shift-health/testing/sitemap.xml','/shift-health/assets/hq-testing-fulfilment.js']){
  const response=await fetch('https://shiftsometimber.co.uk'+path,{signal:AbortSignal.timeout(25000),cache:'no-store'});assert.equal(response.status,200);
  const body=await response.text();if(path.endsWith('checkout-recommendations.json')){const data=JSON.parse(body);assert.equal(data.salesEnabled,false);assert.equal(data.items.length,2);assert(data.items.every(p=>p.available===false&&!Object.hasOwn(p,'unitPence')));}
  result[path]=hash(body);
 }
 return result;
}
function assertOwned(rows){
 const patterns=['api.shiftsometimber.co.uk/v1/hq/supplements*','api.shiftsometimber.co.uk/v1/commerce/basket-quote','api.shiftsometimber.co.uk/v1/hq/testing*'];
 for(const host of ['shiftsometimber.co.uk','www.shiftsometimber.co.uk']){
  patterns.push(host+'/assets/shift-purchase-basket-v1.js');for(const suffix of ['*','','/','.html'])patterns.push(host+'/shift-health'+suffix);
 }
 for(const path of ['/','/index.html'])patterns.push('hq.shiftsometimber.co.uk'+path);
 for(const pattern of patterns)assert.equal(rows.find(r=>r.pattern===pattern)?.script,script,'Route ownership changed: '+pattern);
 assert.equal(rows.filter(r=>r.script===script).length,15,'Component acquired an unreviewed route');
}
async function unchanged(before,expectedDeployment){
 const now=await routes();assertOwned(now);assert.deepEqual(now,before.routes,'A route changed during this release');
 assert.deepEqual(await retained(),before.retained,'A retained service changed');assert.deepEqual(await catalogueState(),before.catalogue,'Live catalogue changed');
 assert.deepEqual(await publicState(),before.public,'Basket or recommendations changed');
 assert.deepEqual(await scriptState(),before.scriptState,'Worker settings or fulfilment schedules changed');
 assert.equal((await deployment(script)).id,expectedDeployment,'Component ownership changed');
}
async function rollback(){
 if(!existsSync(dir+'/intent.json')){console.log('No promotion intent; no traffic to restore.');return;}
 const intent=load('intent'),current=await deployment(script);
 if(current.versions[0].version_id!==intent.versionId){save('rollback',{restored:false,reason:'Current version is not owned by this release'});console.log('Retained another owner\'s active version.');return;}
 writeFileSync(dir+'/rollback.log',cli('versions','deploy',intent.previousVersion+'@100%','--yes'));
 assert.equal((await deployment(script)).versions[0].version_id,intent.previousVersion);
 save('rollback',{restored:true,versionId:intent.previousVersion,routesChanged:false,dataChanged:false});
 console.log('Restored only this component to its captured previous version.');
}
const action=process.argv[2];
if(action==='settings'){
 const settings=await cf('/accounts/'+account+'/workers/scripts/'+script+'/settings');
 const safe=Object.fromEntries(Object.entries(settings).filter(([key])=>!['bindings','env'].includes(key)));
 save('settings-structure',{keys:Object.keys(settings),nonBindingSettings:safe,bindingNames:(settings.bindings||[]).map(b=>({name:b.name,type:b.type}))});
 console.log(JSON.stringify({keys:Object.keys(settings),nonBindingSettings:safe}));
}else if(action==='resume'){
 await sourceCurrent();const before=load('before'),stage=load('staged');
 assert.equal(before.source,'fc2e26180587bd8b1c008d7346e4195e186ad7dd');assert.equal(stage.source,before.source);
 assert.equal(stage.versionId,'f8977f16-49a8-4f72-bef1-314e0a6d845b');assert.equal(stage.buildSHA256,'2c00b58193a7feba510ed17e9fc76d7760b992a71e189400302d0d647f3c9314');
 assert.equal(hash(readFileSync(resolve(dir,'build/worker.js'))),stage.buildSHA256);
 assert.equal(hash(JSON.stringify(before.moduleManifest)),'286c0d11214cbc74b1e743cbd47b5f6049b1afca8c048e57f5b19f52044e8e0c');
 const active=await deployment(script);assert.equal(active.id,before.previous.id);assert.equal(active.versions[0].version_id,predecessor);
 const current=await version(predecessor,predecessorBytes);await version(stage.versionId,stage.buildSHA256);
 const settings=await cf('/accounts/'+account+'/workers/scripts/'+script+'/settings');
 // Prove the original full settings fingerprint is reproduced by restoring
 // only the captured predecessor's version annotations. Keep every functional
 // setting and the complete bindings in the comparison.
 const originalSettings={...settings,annotations:current.annotations||{}};
 assert.equal(fingerprint(originalSettings),before.scriptState.settings,'Settings difference is not solely version annotation metadata');
 save('annotation-only-reconciliation',{verified:true,previousFullSettingsHash:before.scriptState.settings,reconstructedOriginalHash:fingerprint(originalSettings),ignoredField:'annotations',reason:'Version creation changes its message/tag/trigger metadata; functional settings and exact bindings match the prior full fingerprint.'});
 before.scriptState.settings=fingerprint(functionalSettings(settings));save('before',before);
 await unchanged(before,active.id);
 save('resumed',{source:process.env.GITHUB_SHA,reusedStageSource:stage.source,reusedRun:40791403427,versionId:stage.versionId,buildSHA256:stage.buildSHA256,preservedModules:27,noRepeatedCompileOrUpload:true});
 console.log('PASS reused exact staged composition; settings difference proven annotation-only; all functional settings, schedules and live ownership preserved.');
}else if(action==='prepare'){
 await sourceCurrent();
 const active=await deployment(script);assert.equal(active.versions[0].version_id,predecessor,'Serving composition changed again; preserve newer work before release');
 const current=await cf('/accounts/'+account+'/workers/workers/'+script+'/versions/'+predecessor+'?include=modules');
 assert.equal(hash(JSON.stringify(manifest(current))),'286c0d11214cbc74b1e743cbd47b5f6049b1afca8c048e57f5b19f52044e8e0c','Captured serving module manifest changed');
 assert.equal(current.main_module,'testing-production-entry.mjs');
 const before={source:process.env.GITHUB_SHA,approvedReview:reviewed,previous:active,moduleManifest:manifest(current),versionConfiguration:fingerprint(versionConfig(current)),scriptState:await scriptState(),routes:await routes(),retained:await retained(),catalogue:await catalogueState(),public:await publicState()};assertOwned(before.routes);save('before',before);
 await version(predecessor,predecessorBytes);
 const buildDir=resolve(dir,'build');cli('deploy','--dry-run','--outdir',buildDir);
 const candidate=[buildDir+'/worker.js',buildDir+'/worker.mjs'].find(existsSync);assert(candidate,'Prepared bundle missing');
 const compositionDir=resolve(dir,'composition');mkdirSync(compositionDir,{recursive:true});
 for(const module of current.modules){assert(!module.name.startsWith('/')&&!module.name.split('/').includes('..'),'Unsafe provider module path');const target=resolve(compositionDir,module.name);mkdirSync(resolve(target,'..'),{recursive:true});writeFileSync(target,module.name===replacedModule?readFileSync(candidate):Buffer.from(module.content_base64,'base64'));}
 const {default:compiled}=await import(pathToFileURL(resolve(compositionDir,current.main_module)));
 const shell=await fetch('https://shiftsometimber.co.uk/shift-health',{signal:AbortSignal.timeout(25000)});assert.equal(shell.status,200);const html=await shell.text();
 const env={DB,BLOG:{fetch:async()=>new Response(html,{headers:{'Content-Type':'text/html'}})}};
 const products=await publicProducts(DB);assert.equal(products.length,8);
 for(const product of products){
  const response=await compiled.fetch(new Request('https://shiftsometimber.co.uk/shift-health/supplements-nutrition?product='+product.id),env);assert.equal(response.status,200);
  const content=await response.text();assert(content.includes('supplement-questions'));assert(content.includes('supplement-sources'));assert(content.includes('Not yet available to order'));assert(!content.includes('data-add='));
 }
 const response=await compiled.fetch(new Request('https://shiftsometimber.co.uk'+supplementSitemapPath),env);assert.equal(response.status,200);assert.equal(((await response.text()).match(/<loc>/g)||[]).length,9);
 const buildSHA256=hash(readFileSync(candidate));save('build',{source:process.env.GITHUB_SHA,buildSHA256,candidate,realCatalogueReadOnlySmoke:true,reviewedRuntimeTrees:expectedTrees});
 await unchanged(before,active.id);
 const payload={};for(const key of ['main_module','compatibility_date','compatibility_flags','usage_model','assets','cache_options','containers','exports','limits','package_dependencies','placement'])if(current[key]!==undefined)payload[key]=current[key];
 payload.bindings=(current.bindings||[]).map(binding=>({name:binding.name,type:'inherit',version_id:predecessor}));
 payload.modules=current.modules.map(module=>module.name===replacedModule?{...module,content_base64:readFileSync(candidate).toString('base64')}:module);
 payload.annotations={'workers/message':'Approved Olivit guide/SEO/sitemap update; preserve Testing & Wellbeing, fulfilment, settings, schedules and purchasing holds.','workers/tag':'olivit-editorial-20261028'};
 const uploaded=await cf('/accounts/'+account+'/workers/workers/'+script+'/versions?deploy=false','POST',payload);
 const versionId=uploaded.id;assert.match(versionId||'',/^[a-f0-9-]{36}$/);save('staged',{versionId,buildSHA256,source:process.env.GITHUB_SHA,preservedModules:current.modules.length-1,replacedModule});
 await version(versionId,buildSHA256);await unchanged(before,active.id);
 console.log('PASS exact approved runtime staged; live traffic, all routes, catalogue, checkout recommendations and retained services unchanged.');
}else if(action==='promote'){
 await sourceCurrent();const before=load('before'),stage=load('staged');await unchanged(before,before.previous.id);await version(stage.versionId,stage.buildSHA256);
 save('intent',{versionId:stage.versionId,previousVersion:before.previous.versions[0].version_id,source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,approved:'Matt: Yes please, scoped supplement editorial/SEO/sitemap release, 28 October 2026'});
 writeFileSync(dir+'/promotion.log',cli('versions','deploy',stage.versionId+'@100%','--yes'));
 const active=await deployment(script);assert.equal(active.versions[0].version_id,stage.versionId);save('promoted',{source:process.env.GITHUB_SHA,versionId:stage.versionId,deploymentId:active.id,buildSHA256:stage.buildSHA256,at:new Date().toISOString()});
 await unchanged(before,active.id);
 console.log('PASS exact staged Health version promoted; no routes, database records, purchasing gates or other services changed.');
}else if(action==='verify'){
 await sourceCurrent();const before=load('before'),stage=load('staged'),promoted=load('promoted');await version(stage.versionId,stage.buildSHA256);await unchanged(before,promoted.deploymentId);
 const response=await fetch('https://shiftsometimber.co.uk'+supplementSitemapPath,{signal:AbortSignal.timeout(25000),cache:'no-store'});assert.equal(response.status,200);assert.match(response.headers.get('Content-Type'),/^application\/xml/);assert.equal(((await response.text()).match(/<loc>/g)||[]).length,9);
 save('verified',{ok:true,at:new Date().toISOString(),source:process.env.GITHUB_SHA,versionId:stage.versionId,buildSHA256:stage.buildSHA256,routesUnchanged:true,catalogueUnchanged:true,testingAndFulfilmentModulesUnchanged:true,settingsAndSchedulesUnchanged:true,skuUnchanged:true,purchasingEnabled:false,recommendationsUnchanged:true,retainedServices:before.retained,sitemapLocations:9,liveBrowserEvidence:dir+'/browser-live/results.json'});
 console.log('PASS exact provider bytes, current ownership, live sitemap, retained services, unchanged catalogue/SKUs and held sales.');
}else if(action==='rollback')await rollback();else throw Error('Expected prepare, promote, verify or rollback');
