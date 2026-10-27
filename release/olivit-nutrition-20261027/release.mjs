import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed',database='88f40aed-cb23-4372-8c94-8a73f48bc847',script='shift-health-nutrition-20261027';
const dir='health-nutrition-release',config='health-nutrition/wrangler.jsonc',base='afa38107c8d663dc233114982039a8814ca64229';
mkdirSync(dir,{recursive:true});
const save=(name,value)=>writeFileSync(dir+'/'+name+'.json',JSON.stringify(value,null,2)+'\n');
const hash=v=>createHash('sha256').update(v).digest('hex');
const cli=(...args)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config',config],{encoding:'utf8',maxBuffer:6e6});
async function cf(path,method='GET',body,missing=false){const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(45000)});if(missing&&r.status===404)return null;const j=await r.json();assert(r.ok&&j.success,'Cloudflare '+method+' failed ('+r.status+'): '+JSON.stringify(j.errors?.map(x=>({code:x.code,message:x.message}))));return j.result;}
const routes=()=>cf('/zones/'+zone+'/workers/routes');
const deployments=async(name,missing=false)=>{const j=await cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments','GET',undefined,missing);if(!j)return null;return j.deployments.toSorted((a,b)=>b.created_on.localeCompare(a.created_on))[0]||null;};
async function retained(){const result={};for(const name of ['shift-core','shift-blog-publisher','shift-hq-member-comms-20261023','shift-programme-member-20261023']){const d=await deployments(name);assert(d?.versions?.length===1&&d.versions[0].percentage===100,'Retained service is not a single active version');result[name]={deploymentId:d.id,versionId:d.versions[0].version_id};}return result;}
async function sourceCurrent(){assert.equal(process.env.GITHUB_REF,'refs/heads/release/olivit-health-approved-20261027');assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);for(const [ref,sha]of [['main',base],['release/olivit-health-approved-20261027',process.env.GITHUB_SHA]]){const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/git/ref/heads/'+ref,{headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Cannot verify source branch');assert.equal((await r.json()).object.sha,sha,'Source changed during release: '+ref);}}
function plan(existing){const rows=[];const add=(pattern,owner)=>{const row=existing.find(x=>x.pattern===pattern);if(owner)assert(row&&[owner,script].includes(row.script),'Unexpected route owner: '+pattern);else assert(!row||row.script===script,'API route already belongs to another service');rows.push({pattern,before:row||null,owner:script});};
 add('api.shiftsometimber.co.uk/v1/hq/supplements*',null);
 for(const host of ['shiftsometimber.co.uk','www.shiftsometimber.co.uk']){
  for(const suffix of ['*','','/','.html'])add(host+'/shift-health'+suffix,'shift-blog-publisher');
 }
 for(const path of ['/','/index.html'])add('hq.shiftsometimber.co.uk'+path,'shift-hq-member-comms-20261023');
 const additions=rows.filter(x=>!x.before).length;assert(existing.length+additions<=1000,'Cloudflare route capacity exceeded');
 return {current:existing.length,newRules:additions,projected:existing.length+additions,limit:1000,changes:rows};
}
async function db(sql,params=[]){const rows=await cf('/accounts/'+account+'/d1/database/'+database+'/query','POST',{sql,params});assert(rows.every(x=>x.success),'D1 statement failed');return rows;}
const quote=value=>value===null?'NULL':typeof value==='number'?String(value):"'"+String(value).replaceAll("'","''")+"'";
async function seedDrafts(){const seed=JSON.parse(readFileSync('health-nutrition/seed.json'));let sql=readFileSync('health-nutrition/schema.sql','utf8');for(const row of seed){const keys=Object.keys(row);sql+='\nINSERT INTO supplement_products('+keys.join(',')+') VALUES('+keys.map(k=>quote(row[k])).join(',')+') ON CONFLICT(id) DO NOTHING;';}sql+="\nINSERT OR IGNORE INTO supplement_product_history(product_id,revision,changed_by,record_json) SELECT id,revision,updated_by,json_object('name',name,'shift_says',shift_says,'status',status,'visibility',visibility,'sale_enabled',sale_enabled) FROM supplement_products;";await db(sql);const rows=(await db('SELECT id,status,visibility,sale_enabled,revision,source_url,trade_price_pence,retail_price_pence,stock_quantity FROM supplement_products ORDER BY sort_order,id'))[0].results;for(const p of seed){const actual=rows.find(x=>x.id===p.id);assert(actual,'Missing saved product '+p.id);assert.equal(actual.status,'draft');assert.equal(actual.sale_enabled,0);}save('hq-saved-drafts',{verified:true,ids:rows.map(x=>x.id),count:rows.length,apiConnected:false,purchasingEnabled:false});}
async function verifyBytes(versionId,expected){const v=await cf('/accounts/'+account+'/workers/workers/'+script+'/versions/'+versionId+'?include=modules');assert.equal(v.id,versionId);const modules=v.modules.filter(x=>/\.(mjs|js)$/.test(x.name));assert.equal(modules.length,1,'Expected a single bundled module');assert.equal(hash(Buffer.from(modules[0].content_base64,'base64')),expected,'Uploaded bytes differ from prepared build');}
async function rollback(){if(!existsSync(dir+'/intent.json')){console.log('No route promotion intent; no traffic to restore.');return}const intent=JSON.parse(readFileSync(dir+'/intent.json'));const current=await routes(),restored=[];for(const change of [...intent.plan.changes].reverse()){const row=current.find(x=>x.pattern===change.pattern);if(!row||row.script!==script){restored.push({pattern:change.pattern,action:'not-owned-or-unchanged'});continue;}if(change.before){await cf('/zones/'+zone+'/workers/routes/'+row.id,'PUT',{pattern:change.pattern,script:change.before.script});restored.push({pattern:change.pattern,action:'restored',owner:change.before.script});}else{await cf('/zones/'+zone+'/workers/routes/'+row.id,'DELETE');restored.push({pattern:change.pattern,action:'removed-new-route'});}}
 const active=await deployments(script,true);if(intent.previous?.versions?.[0]?.version_id&&active?.versions?.[0]?.version_id===intent.versionId)cli('versions','deploy',intent.previous.versions[0].version_id+'@100%','--yes');
 save('rollback',{restored,draftRecordsRetained:true});console.log('Restored only owned route assignments. Saved draft records retained.');}
const action=process.argv[2];
if(action==='prepare'){
 await sourceCurrent();const before=await routes(),retainedBefore=await retained(),routePlan=plan(before),previous=await deployments(script,true);
 save('route-plan',routePlan);save('routes-before',before);save('retained-before',retainedBefore);save('worker-before',previous);
 const buildDir=resolve(dir,'build');cli('deploy','--dry-run','--outdir',buildDir);
 const candidate=[buildDir+'/worker.js',buildDir+'/worker.mjs'].find(existsSync);assert(candidate,'Prepared bundle missing');
 const {default:compiled}=await import(pathToFileURL(candidate));
 const nativeClient=await compiled.fetch(new Request('https://shiftsometimber.co.uk/shift-health/assets/hq-nutrition.js'),{});
 assert.equal(await nativeClient.text(),readFileSync('health-nutrition/hq-client.js','utf8'),'Compilation altered the HQ browser client');
 const buildSHA256=hash(readFileSync(candidate));save('build',{candidate,buildSHA256,source:process.env.GITHUB_SHA});
 await seedDrafts();
 const output=cli('deploy',candidate,'--no-bundle','--keep-vars');writeFileSync(dir+'/worker-upload.log',output);
 const ids=[...output.matchAll(/(?:Current |Worker )?Version ID:\s*([a-f0-9-]{36})/g)];assert.equal(ids.length,1,'Cannot identify uploaded Worker version');const versionId=ids[0][1];save('staged',{versionId,buildSHA256,previous});
 await verifyBytes(versionId,buildSHA256);assert.deepEqual(await retained(),retainedBefore,'An existing service changed');
 console.log('Prepared exact isolated Worker and verified eight saved HQ drafts. No routes changed.');
}else if(action==='promote'){
 await sourceCurrent();const stage=JSON.parse(readFileSync(dir+'/staged.json')),before=JSON.parse(readFileSync(dir+'/routes-before.json')),routePlan=JSON.parse(readFileSync(dir+'/route-plan.json'));
 const now=await routes();for(const change of routePlan.changes)assert.deepEqual(now.find(x=>x.pattern===change.pattern)||null,change.before,'Route moved before promotion');
 assert.deepEqual(await retained(),JSON.parse(readFileSync(dir+'/retained-before.json')),'Retained service moved before promotion');assert.equal((await deployments(script)).versions[0].version_id,stage.versionId);
 save('intent',{...stage,source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,plan:routePlan});
 for(const change of routePlan.changes){if(change.before)await cf('/zones/'+zone+'/workers/routes/'+change.before.id,'PUT',{pattern:change.pattern,script});else await cf('/zones/'+zone+'/workers/routes','POST',{pattern:change.pattern,script});}
 const after=await routes();for(const change of routePlan.changes)assert.equal(after.find(x=>x.pattern===change.pattern)?.script,script);
 const scope=new Set(routePlan.changes.map(x=>x.pattern));for(const row of before.filter(x=>!scope.has(x.pattern)))assert.deepEqual(after.find(x=>x.id===row.id),row,'Unrelated route changed');
 save('promoted',{source:process.env.GITHUB_SHA,versionId:stage.versionId,buildSHA256:stage.buildSHA256,routeCount:after.length});
 console.log('Promoted only Health presentation and HQ catalogue routes. Existing Core and clinical Workers retained.');
}else if(action==='verify'){
 const stage=JSON.parse(readFileSync(dir+'/staged.json'));await verifyBytes(stage.versionId,stage.buildSHA256);assert.equal((await deployments(script)).versions[0].version_id,stage.versionId);assert.deepEqual(await retained(),JSON.parse(readFileSync(dir+'/retained-before.json')));await seedDrafts();
 const expected=JSON.parse(readFileSync(dir+'/route-plan.json'));const current=await routes();for(const change of expected.changes)assert.equal(current.find(x=>x.pattern===change.pattern)?.script,script);
 save('provider-verification',{ok:true,source:process.env.GITHUB_SHA,versionId:stage.versionId,retainedServices:await retained(),routesVerified:expected.changes.length,hqDraftsVerified:8});
 console.log('PASS exact provider bytes, route ownership, eight saved draft records and unchanged underlying services.');
}else if(action==='rollback')await rollback();else throw Error('Expected prepare, promote, verify or rollback');
