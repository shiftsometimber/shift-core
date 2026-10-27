import {migrateCheckoutExtras} from '../../checkout-extras/migrate.mjs';
import {registerCatalogueSkus} from '../../checkout-extras/skus.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed',database='88f40aed-cb23-4372-8c94-8a73f48bc847',script='shift-health-nutrition-20261027';
const dir='checkout-release',config='health-nutrition/wrangler.jsonc',base='afa38107c8d663dc233114982039a8814ca64229';
mkdirSync(dir,{recursive:true});
const save=(name,value)=>writeFileSync(dir+'/'+name+'.json',JSON.stringify(value,null,2)+'\n');
const hash=v=>createHash('sha256').update(v).digest('hex');
const cli=(...args)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config',config],{encoding:'utf8',maxBuffer:6e6});
async function cf(path,method='GET',body,missing=false){const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(45000)});if(missing&&r.status===404)return null;const j=await r.json();assert(r.ok&&j.success,'Cloudflare '+method+' failed ('+r.status+'): '+JSON.stringify(j.errors?.map(x=>({code:x.code,message:x.message}))));return j.result;}
const routes=()=>cf('/zones/'+zone+'/workers/routes');
const deployments=async(name,missing=false)=>{const j=await cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments','GET',undefined,missing);if(!j)return null;return j.deployments.toSorted((a,b)=>b.created_on.localeCompare(a.created_on))[0]||null;};
async function retained(){const result={};for(const name of ['shift-core','shift-blog-publisher','shift-hq-member-comms-20261023','shift-programme-member-20261023','shift-treatment-options-presentation-20261022']){const d=await deployments(name);assert(d?.versions?.length===1&&d.versions[0].percentage===100,'Retained service is not a single active version');result[name]={deploymentId:d.id,versionId:d.versions[0].version_id};}return result;}
async function sourceCurrent(){assert.equal(process.env.GITHUB_REF,'refs/heads/release/checkout-recommendations-20261027');assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);for(const [ref,sha]of [['main',base],['release/checkout-recommendations-20261027',process.env.GITHUB_SHA]]){const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/git/ref/heads/'+ref,{headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Cannot verify source branch');assert.equal((await r.json()).object.sha,sha,'Source changed during release: '+ref);}}
function plan(existing){const rows=[];const add=(pattern,owner)=>{const row=existing.find(x=>x.pattern===pattern);if(owner)assert(row&&[owner,script].includes(row.script),'Unexpected route owner: '+pattern);else assert(!row||row.script===script,'API route already belongs to another service');rows.push({pattern,before:row||null,owner:script});};
 add('api.shiftsometimber.co.uk/v1/hq/supplements*',null);
 add('api.shiftsometimber.co.uk/v1/commerce/basket-quote',null);
 for(const host of ['shiftsometimber.co.uk','www.shiftsometimber.co.uk'])add(host+'/assets/shift-purchase-basket-v1.js',null);
 for(const host of ['shiftsometimber.co.uk','www.shiftsometimber.co.uk']){
  for(const suffix of ['*','','/','.html'])add(host+'/shift-health'+suffix,'shift-blog-publisher');
 }
 for(const path of ['/','/index.html'])add('hq.shiftsometimber.co.uk'+path,'shift-hq-member-comms-20261023');
 const additions=rows.filter(x=>!x.before).length;assert(existing.length+additions<=1000,'Cloudflare route capacity exceeded');
 return {current:existing.length,newRules:additions,projected:existing.length+additions,limit:1000,changes:rows};
}
async function db(sql,params=[]){const rows=await cf('/accounts/'+account+'/d1/database/'+database+'/query','POST',{sql,params});assert(rows.every(x=>x.success),'D1 statement failed');return rows;}
const quote=value=>value===null?'NULL':typeof value==='number'?String(value):"'"+String(value).replaceAll("'","''")+"'";
function statement(sql,args=[]){return {sql,args,bind(...values){return statement(sql,values)},async all(){return {results:(await db(sql,args))[0].results||[]}},async first(){return (await db(sql,args))[0].results?.[0]||null},async run(){const r=(await db(sql,args))[0];return {meta:r.meta||{}}}};}
const DB={prepare:statement,exec:sql=>db(sql),async batch(rows){const sql=rows.map(row=>{let index=0;const text=row.sql.replace(/\?/g,()=>quote(row.args[index++]));assert.equal(index,row.args.length);return text;}).join(';\n');return (await db(sql)).map(r=>({meta:r.meta||{}}));}};
async function seedDrafts(){
 await migrateCheckoutExtras(DB);const counts=await registerCatalogueSkus(DB);
 const rows=(await db("SELECT p.id,p.status,p.sale_enabled,p.revision,s.sku FROM supplement_products p JOIN catalogue_skus s ON s.source_table='supplement_products' AND s.source_id=p.id ORDER BY p.id"))[0].results;
 assert.equal(rows.length,8);assert.equal(new Set(rows.map(p=>p.sku)).size,8);for(const p of rows){assert.equal(p.status,'draft');assert.equal(p.sale_enabled,0);assert(p.sku);}
 const offers=(await db('SELECT COUNT(*) n FROM supplement_checkout_offers WHERE active=1'))[0].results[0].n;assert.equal(offers,0,'Unconfirmed offers must remain inactive');
 save('hq-saved-drafts',{verified:true,count:rows.length,ids:rows.map(p=>p.id),products:rows,skuCounts:counts,apiConnected:false,purchasingEnabled:false});
}
async function verifyBytes(versionId,expected){const v=await cf('/accounts/'+account+'/workers/workers/'+script+'/versions/'+versionId+'?include=modules');assert.equal(v.id,versionId);const modules=v.modules.filter(x=>/\.(mjs|js)$/.test(x.name));assert.equal(modules.length,1,'Expected a single bundled module');assert.equal(hash(Buffer.from(modules[0].content_base64,'base64')),expected,'Uploaded bytes differ from prepared build');}
async function rollback(){if(!existsSync(dir+'/intent.json')){console.log('No route promotion intent; no traffic to restore.');return}const intent=JSON.parse(readFileSync(dir+'/intent.json'));const current=await routes(),restored=[];for(const change of [...intent.plan.changes].reverse()){const row=current.find(x=>x.pattern===change.pattern);if(!row||row.script!==script){restored.push({pattern:change.pattern,action:'not-owned-or-unchanged'});continue;}if(change.before){await cf('/zones/'+zone+'/workers/routes/'+row.id,'PUT',{pattern:change.pattern,script:change.before.script});restored.push({pattern:change.pattern,action:'restored',owner:change.before.script});}else{await cf('/zones/'+zone+'/workers/routes/'+row.id,'DELETE');restored.push({pattern:change.pattern,action:'removed-new-route'});}}
 const active=await deployments(script,true);if(intent.previous?.versions?.[0]?.version_id&&active?.versions?.[0]?.version_id===intent.versionId)cli('versions','deploy',intent.previous.versions[0].version_id+'@100%','--yes');
 save('rollback',{restored,draftRecordsRetained:true});console.log('Restored only owned route assignments. Saved draft records retained.');}
const action=process.argv[2];
if(action==='sku-hooks'){
 await sourceCurrent();const routesBefore=await routes(),versionsBefore=await retained(),componentBefore=await deployments(script);
 const mappingsBefore=(await db('SELECT source_table,source_id,sku FROM catalogue_skus ORDER BY source_table,source_id'))[0].results;
 const counts=await registerCatalogueSkus(DB);
 const mappingsAfter=(await db('SELECT source_table,source_id,sku FROM catalogue_skus ORDER BY source_table,source_id'))[0].results;
 for(const before of mappingsBefore)assert.deepEqual(mappingsAfter.find(p=>p.source_table===before.source_table&&p.source_id===before.source_id),before,'Existing SKU changed');
 const triggers=(await db("SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'catalogue_sku_insert_%' ORDER BY name"))[0].results;
 for(const table of ['products','medicine_products','medicine_variants','supplement_products'])assert(triggers.some(t=>t.name==='catalogue_sku_insert_'+table),'Missing automatic SKU hook for '+table);
 assert.deepEqual(await routes(),routesBefore);assert.deepEqual(await retained(),versionsBefore);assert.deepEqual(await deployments(script),componentBefore);
 save('sku-automatic-creation',{verifiedAt:new Date().toISOString(),source:process.env.GITHUB_SHA,automaticHooks:triggers.map(p=>p.name),skuCounts:counts,existingMappingsPreserved:true,runtimeUnchanged:true,routesUnchanged:true,purchasingEnabled:false,liveComponent:componentBefore});
 console.log('PASS automatic SKU allocation on all four catalogue types; all existing codes, live versions and routes retained.');
}else if(action==='prepare'){
 await sourceCurrent();const before=await routes(),retainedBefore=await retained(),routePlan=plan(before),previous=await deployments(script,true);
 save('route-plan',routePlan);save('routes-before',before);save('retained-before',retainedBefore);save('worker-before',previous);
 const buildDir=resolve(dir,'build');cli('deploy','--dry-run','--outdir',buildDir);
 const candidate=[buildDir+'/worker.js',buildDir+'/worker.mjs'].find(existsSync);assert(candidate,'Prepared bundle missing');
 const {default:compiled}=await import(pathToFileURL(candidate));
 const nativeClient=await compiled.fetch(new Request('https://shiftsometimber.co.uk/shift-health/assets/hq-nutrition.js'),{});
 assert.equal(await nativeClient.text(),readFileSync('health-nutrition/hq-client.js','utf8'),'Compilation altered the HQ browser client');
 const buildSHA256=hash(readFileSync(candidate));save('build',{candidate,buildSHA256,source:process.env.GITHUB_SHA});
 await seedDrafts();
 // Existing installations already carry traffic: upload without promoting.
 // A first installation has no routes until the promote step below.
 if(!previous)assert(!before.some(r=>r.script===script),'A new Worker cannot already own live routes');
 const output=previous?cli('versions','upload',candidate,'--no-bundle'):cli('deploy',candidate,'--no-bundle','--keep-vars');writeFileSync(dir+'/worker-upload.log',output);
 const ids=[...output.matchAll(/(?:Current |Worker )?Version ID:\s*([a-f0-9-]{36})/g)];assert.equal(ids.length,1,'Cannot identify uploaded Worker version');const versionId=ids[0][1];save('staged',{versionId,buildSHA256,previous});
 await verifyBytes(versionId,buildSHA256);assert.deepEqual(await retained(),retainedBefore,'An existing service changed');
 if(previous)assert.equal((await deployments(script)).id,previous.id,'Preparing an update must not change live traffic');
 console.log('Prepared exact isolated Worker and verified eight saved HQ drafts. No routes changed. Supplement purchasing stays disabled.');
}else if(action==='promote'){
 await sourceCurrent();const stage=JSON.parse(readFileSync(dir+'/staged.json')),before=JSON.parse(readFileSync(dir+'/routes-before.json')),routePlan=JSON.parse(readFileSync(dir+'/route-plan.json'));
 const now=await routes();for(const change of routePlan.changes)assert.deepEqual(now.find(x=>x.pattern===change.pattern)||null,change.before,'Route moved before promotion');
 assert.deepEqual(await retained(),JSON.parse(readFileSync(dir+'/retained-before.json')),'Retained service moved before promotion');
 const active=await deployments(script);if(stage.previous)assert.equal(active.id,stage.previous.id,'Component moved before promotion');else assert.equal(active.versions[0].version_id,stage.versionId);
 save('intent',{...stage,source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,plan:routePlan});
 if(stage.previous)writeFileSync(dir+'/version-promotion.log',cli('versions','deploy',stage.versionId+'@100%','--yes'));
 assert.equal((await deployments(script)).versions[0].version_id,stage.versionId,'Prepared version must own the component before route promotion');
 for(const change of routePlan.changes){if(change.before?.script===script)continue;if(change.before)await cf('/zones/'+zone+'/workers/routes/'+change.before.id,'PUT',{pattern:change.pattern,script});else await cf('/zones/'+zone+'/workers/routes','POST',{pattern:change.pattern,script});}
 const after=await routes();for(const change of routePlan.changes)assert.equal(after.find(x=>x.pattern===change.pattern)?.script,script);
 const scope=new Set(routePlan.changes.map(x=>x.pattern));for(const row of before.filter(x=>!scope.has(x.pattern)))assert.deepEqual(after.find(x=>x.id===row.id),row,'Unrelated route changed');
 save('promoted',{source:process.env.GITHUB_SHA,versionId:stage.versionId,buildSHA256:stage.buildSHA256,routeCount:after.length});
 console.log('Promoted only Health presentation and HQ catalogue routes. Existing Core, clinical and treatment-option Workers retained; recommendation and basket presentation only.');
}else if(action==='verify'){
 const stage=JSON.parse(readFileSync(dir+'/staged.json'));await verifyBytes(stage.versionId,stage.buildSHA256);assert.equal((await deployments(script)).versions[0].version_id,stage.versionId);assert.deepEqual(await retained(),JSON.parse(readFileSync(dir+'/retained-before.json')));await seedDrafts();
 const expected=JSON.parse(readFileSync(dir+'/route-plan.json'));const current=await routes();for(const change of expected.changes)assert.equal(current.find(x=>x.pattern===change.pattern)?.script,script);
 save('provider-verification',{ok:true,source:process.env.GITHUB_SHA,versionId:stage.versionId,retainedServices:await retained(),routesVerified:expected.changes.length,hqDraftsVerified:8,purchasingEnabled:false,skuRegistryVerified:true});
 console.log('PASS exact provider bytes, route ownership, eight saved draft records and unchanged underlying services.');
}else if(action==='rollback')await rollback();else throw Error('Expected prepare, promote, verify or rollback');
