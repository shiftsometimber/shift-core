import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const PREDECESSOR='149f02a8-0b45-4e36-a6f9-425330476d36';
export const ORIGINAL_MODULES=Object.freeze({
  'canonical-worker.js':'e14b8c9c522433ebc7e97db4b07ca7be1bd816f9684d207b21e5b0098a763877',
  'my-timber-login-pattern-fix-20261027.mjs':'c53288bec7e351f489dfa00b4a215edda48ddfdd4533b90d708e01d62abe40bd'
});
export const digest=b=>createHash('sha256').update(b).digest('hex');
const canonical=o=>Array.isArray(o)?o.map(canonical):o&&typeof o==='object'?Object.fromEntries(Object.keys(o).sort().map(k=>[k,canonical(o[k])])):o;
const same=(a,b,label)=>assert.equal(JSON.stringify(canonical(a)),JSON.stringify(canonical(b)),label);
export function assertPredecessor(snapshot){
  assert.equal(snapshot.version.id,PREDECESSOR,'Serving runtime changed; reconcile before release');
  assert.deepEqual(snapshot.deployment.versions,[{version_id:PREDECESSOR,percentage:100}]);
  assert.equal(snapshot.entry,'my-timber-login-pattern-fix-20261027.mjs');
  assert.deepEqual(Object.fromEntries(snapshot.modules.map(m=>[m.name,m.sha256])),ORIGINAL_MODULES,'Original runtime modules changed');
}
export function assertPreservedVersion(before,after){
  const bindings=x=>x.resources.bindings.slice().sort((a,b)=>a.name.localeCompare(b.name));
  same(bindings(before),bindings(after),'Every live binding must remain identical');
  same(before.resources.script_runtime,after.resources.script_runtime,'Every runtime setting must remain identical');
}
export function wrapperSource(entry,source,tracker){
  assert.equal(entry,'my-timber-login-pattern-fix-20261027.mjs');assert.match(source,/^[a-f0-9]{40}$/);
  return `import original from './${entry}';
export * from './${entry}';
import {medicineCommerceRoutes} from './shift-prescription-lifecycle.mjs';
const tracker=${JSON.stringify(tracker)},source=${JSON.stringify(source)};
const routes=new Set(['POST /v1/commerce/medicine-checkout','OPTIONS /v1/commerce/medicine-checkout','POST /v1/integrations/pharmacy/treatment-status','GET /v1/treatment/orders']);
export default {...original,async fetch(request,env,ctx){
 const url=new URL(request.url),path=url.pathname.replace(/\\/+$/,'')||'/';
 if(['api.shiftsometimber.co.uk','shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(url.hostname)){
  if(['GET','HEAD'].includes(request.method)&&path==='/member-treatment-journey-v1.js')return new Response(request.method==='HEAD'?null:tracker,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Shift-Prescription-Workflow':'v1','X-Shift-Prescription-Source':source}});
  if(routes.has(request.method+' '+path)){
   const response=await medicineCommerceRoutes(request,env,ctx);
   if(response){const headers=new Headers(response.headers);headers.set('X-Shift-Prescription-Workflow','v1');headers.set('X-Shift-Prescription-Source',source);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
  }
 }
 return original.fetch.call(original,request,env,ctx);
}};
`;
}

export async function execute(){
  const out='prescription-release-evidence';mkdirSync(out,{recursive:true});
  const snapshot=JSON.parse(readFileSync(out+'/snapshot.json'));assertPredecessor(snapshot);
  const source=process.env.GITHUB_SHA;assert.match(source,/^[a-f0-9]{40}$/);
  assert.equal(snapshot.source,source);
  const account='https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6',legacy=account+'/workers/scripts/shift-core',beta=account+'/workers/workers/shift-core';
  const headers={Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN};
  const api=async(url,method='GET',body)=>{
    const r=await fetch(url,{method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});
    const j=await r.json();assert(r.ok&&j.success,'Cloudflare '+method+' failed HTTP '+r.status+': '+JSON.stringify(j.errors));return j.result;
  };
  const active=async()=>{const d=(await api(legacy+'/deployments')).deployments[0];assert.equal(d.versions.length,1);assert.equal(d.versions[0].percentage,100);return d;};
  const gh=async path=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core'+path,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,'User-Agent':'SHIFT-prescription-release'},signal:AbortSignal.timeout(30000)});assert(r.ok);return r.json();};
  // Do not race a newer branch/main state or publish a candidate with failed checks.
  const main=await gh('/branches/main');assert.equal(main.commit.sha,'2260675faf5ae8c3adbf52ff2a4f1a8427a91884','Main moved; reconcile first');
  const pr=await gh('/pulls/1450');assert.equal(pr.head.sha,source);assert.equal(pr.state,'open');
  const original=await active();assert.equal(original.id,snapshot.deployment.id);
  const originalVersion=await api(legacy+'/versions/'+PREDECESSOR);assertPreservedVersion(snapshot.version,originalVersion);
  const settings=await api(legacy+'/script-settings');same(settings,snapshot.settings,'Worker settings changed');
  const modules=snapshot.modules.map(m=>{const b=readFileSync(out+'/'+m.filename);assert.equal(digest(b),m.sha256);return{name:m.name,content_type:m.type,content_base64:b.toString('base64')};});
  const {build}=await import('esbuild');
  const compiled=await build({entryPoints:['medicine-commerce-v1.js'],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:false});
  const bundle=compiled.outputFiles[0].contents;
  const tracker=readFileSync('frontend/member/member-treatment-journey-v1.js','utf8');
  const wrapper=wrapperSource(snapshot.entry,source,tracker);
  modules.push({name:'shift-prescription-lifecycle.mjs',content_type:'application/javascript+module',content_base64:Buffer.from(bundle).toString('base64')},{name:'shift-prescription-entry.mjs',content_type:'application/javascript+module',content_base64:Buffer.from(wrapper).toString('base64')});
  assert.equal(new Set(modules.map(m=>m.name)).size,modules.length);
  const manifest=modules.map(m=>({name:m.name,sha256:digest(Buffer.from(m.content_base64,'base64'))}));writeFileSync(out+'/candidate-modules.json',JSON.stringify(manifest,null,2));
  for(const m of modules)writeFileSync(out+'/'+m.name,Buffer.from(m.content_base64,'base64'));

  // Execute the actual candidate modules in isolated workerd. No production
  // database, email, payment or provider binding enters this control.
  const {Miniflare,convertV4MiniflareOptions}=await import(pathToFileURL(process.env.RX_MINIFLARE+'/dist/src/index.js'));
  const options={modules:true,modulesRoot:resolve(out),scriptPath:resolve(out+'/shift-prescription-entry.mjs'),compatibilityDate:snapshot.immutable.compatibility_date,compatibilityFlags:snapshot.immutable.compatibility_flags,d1Databases:['DB'],durableObjects:{SITE_CONTENT_STATE:{className:'SiteContentState',useSQLite:true}},bindings:{PHARMACY_INTEGRATION_SECRET:'synthetic-release-secret'},outboundService:()=>{throw Error('Network is forbidden in compiled prescription control');}};
  const mf=new Miniflare(convertV4MiniflareOptions(options));
  try{
    const db=typeof mf.getD1Database==='function'?await mf.getD1Database('DB'):(await mf.getBindings()).DB;
    const callback=body=>mf.dispatchFetch('https://api.shiftsometimber.co.uk/v1/integrations/pharmacy/treatment-status',{method:'POST',headers:{Authorization:'Bearer synthetic-release-secret','Content-Type':'application/json'},body:JSON.stringify(body)});
    assert.equal((await callback({orderNumber:'SYNTHETIC-MISSING',status:'approved'})).status,404);
    await db.prepare("INSERT INTO medicine_orders(order_number,user_id,email,medicine_id,variant_id,medicine_name,strength_label,unit_price_pence,total_pence,status,clinical_status,prescription_workflow_version) VALUES('SYNTHETIC-RX',42,'nobody@example.test',1,11,'Synthetic medicine','Test strength',100,100,'paid','approved',1)").run();
    const event=status=>({orderNumber:'SYNTHETIC-RX',status,eventReference:'synthetic-'+status,prescriptionReference:'SYNTHETIC-SIGNED-RX',occurredAt:'2026-10-29T12:00:00Z',...(status==='prescription_signed'?{signedRecordReference:'synthetic-document',prescriberReference:'synthetic-prescriber',prescription:{medicineName:'Synthetic medicine',strengthLabel:'Test strength',formulation:'Synthetic',directions:'Synthetic only',quantity:'One synthetic pack'}}:{}),...(status==='pharmacy_received'?{pharmacyReceiptReference:'SYNTHETIC-RECEIPT'}:{})});
    assert.equal((await callback(event('dispensing'))).status,409);
    for(const stage of ['prescription_signed','sent_to_pharmacy','pharmacy_received','dispensing','dispatched','fulfilled'])assert.equal((await callback(event(stage))).status,200,stage);
    assert.equal((await (await callback(event('fulfilled'))).json()).duplicate,true);
    const result=await db.prepare("SELECT clinical_status,pharmacy_receipt_reference FROM medicine_orders WHERE order_number='SYNTHETIC-RX'").first();assert.equal(result.clinical_status,'fulfilled');assert.equal(result.pharmacy_receipt_reference,'SYNTHETIC-RECEIPT');
    const js=await mf.dispatchFetch('https://shiftsometimber.co.uk/member-treatment-journey-v1.js');assert.equal(await js.text(),tracker);
    const denied=await mf.dispatchFetch('https://api.shiftsometimber.co.uk/v1/treatment/orders');assert.equal(denied.status,401);assert.equal(denied.headers.get('X-Shift-Prescription-Source'),source);
    writeFileSync(out+'/compiled-control.json',JSON.stringify({source,modules:manifest,syntheticLifecycle:'passed',skippedStageBlocked:true,receiptStored:true,replayIdempotent:true,anonymousDenied:true,externalCalls:0}));
  }finally{await mf.dispose();}

  const required=['Shift Member Frontend Source Gate','Shift Master Integration Gate','Readiness repair and preservation','Shift Conversion Closure Gate','Shift Whole-Estate Route Sweep','Native health bridge — account and privacy proof'];
  const deadline=Date.now()+600000;
  while(true){
    const runs=(await gh('/actions/runs?head_sha='+source+'&per_page=100')).workflow_runs;
    const chosen=required.map(name=>runs.filter(r=>r.name===name&&r.event==='pull_request').sort((a,b)=>b.id-a.id)[0]);
    const failed=chosen.find(r=>r?.status==='completed'&&!['success','skipped'].includes(r.conclusion));
    assert(!failed,'Required release check failed: '+failed?.name+' '+failed?.html_url);
    if(chosen.every(r=>r?.status==='completed'&&r.conclusion==='success')){writeFileSync(out+'/required-checks.json',JSON.stringify(chosen.map(r=>({id:r.id,name:r.name,head:r.head_sha,conclusion:r.conclusion})),null,2));break;}
    assert(Date.now()<deadline,'Required checks did not finish within the release budget');
    console.log('Waiting for current checks: '+chosen.filter(r=>r?.status!=='completed').map(r=>r?.name||'not started').join(', '));await new Promise(r=>setTimeout(r,10000));
  }

  const publicPaths=['/','/member-login','/member/dashboard','/treatment-assessment','/terms'];
  const publicSnapshots=[];
  for(const path of publicPaths){const r=await fetch('https://shiftsometimber.co.uk'+path,{redirect:'manual',signal:AbortSignal.timeout(30000)});const b=Buffer.from(await r.arrayBuffer());publicSnapshots.push({path,status:r.status,sha256:digest(b)});}
  const beforeCatalog=await fetch('https://api.shiftsometimber.co.uk/v1/catalogue/medicines',{signal:AbortSignal.timeout(30000)});const catalogStatus=beforeCatalog.status,catalog=await beforeCatalog.text();
  assert.equal((await active()).id,original.id,'Deployment moved before staging');
  // All existing resources, including secrets and assets, inherit from the
  // immutable serving version rather than an un-deployed latest upload.
  const body={main_module:'shift-prescription-entry.mjs',modules,bindings:snapshot.version.resources.bindings.map(b=>({name:b.name,type:'inherit',version_id:PREDECESSOR})),compatibility_date:snapshot.immutable.compatibility_date,compatibility_flags:snapshot.immutable.compatibility_flags,assets:snapshot.immutable.assets,usage_model:snapshot.immutable.usage_model,annotations:{'workers/message':'Matt-approved prescription lifecycle '+source,'workers/tag':'prescription-'+process.env.GITHUB_RUN_ID}};
  const uploaded=await api(beta+'/versions?deploy=false','POST',body);writeFileSync(out+'/uploaded.json',JSON.stringify({source,version:uploaded.id,manifest}));
  const version=await api(legacy+'/versions/'+uploaded.id);assertPreservedVersion(originalVersion,version);
  const saved=await api(beta+'/versions/'+uploaded.id+'?include=modules');
  same(saved.modules.map(m=>({name:m.name,sha256:digest(Buffer.from(m.content_base64,'base64'))})).sort((a,b)=>a.name.localeCompare(b.name)),manifest.slice().sort((a,b)=>a.name.localeCompare(b.name)),'Uploaded complete modules differ');
  assert.equal((await active()).id,original.id,'Deployment moved while staging');same(await api(legacy+'/script-settings'),settings,'Worker settings changed while staging');
  assert.equal((await gh('/pulls/1450')).head.sha,source,'Candidate branch moved');
  let owned=null;
  try{
    writeFileSync(out+'/promotion-intent.json',JSON.stringify({source,previousDeployment:original.id,previousVersion:PREDECESSOR,version:uploaded.id}));
    assert.equal((await gh('/branches/main')).commit.sha,main.commit.sha,'Main moved before promotion');
    const d=await api(legacy+'/deployments','POST',{strategy:'percentage',versions:[{version_id:uploaded.id,percentage:100}],annotations:{'workers/message':'Matt-approved prescription lifecycle '+source}});
    owned=d.id;writeFileSync(out+'/owned-deployment.json',JSON.stringify({source,deployment:owned,version:uploaded.id,previousVersion:PREDECESSOR}));
    const checks=[];
    for(const host of ['shiftsometimber.co.uk','www.shiftsometimber.co.uk']){
      const r=await fetch('https://'+host+'/member-treatment-journey-v1.js?release='+source,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200);assert.equal(await r.text(),tracker);assert.equal(r.headers.get('X-Shift-Prescription-Source'),source);checks.push({host,trackerExact:true});
    }
    const denied=await fetch('https://api.shiftsometimber.co.uk/v1/treatment/orders',{signal:AbortSignal.timeout(30000)});assert.equal(denied.status,401);assert.equal(denied.headers.get('X-Shift-Prescription-Source'),source);
    for(const before of publicSnapshots){const r=await fetch('https://shiftsometimber.co.uk'+before.path,{redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(r.status,before.status,before.path);assert.equal(digest(Buffer.from(await r.arrayBuffer())),before.sha256,'Unrelated public response changed: '+before.path);}
    const afterCatalog=await fetch('https://api.shiftsometimber.co.uk/v1/catalogue/medicines',{signal:AbortSignal.timeout(30000)});assert.equal(afterCatalog.status,catalogStatus);assert.equal(await afterCatalog.text(),catalog,'Catalogue changed');
    assert.equal((await active()).id,owned);assertPreservedVersion(originalVersion,await api(legacy+'/versions/'+uploaded.id));same(await api(legacy+'/script-settings'),settings,'Worker settings changed');
    writeFileSync(out+'/verified-live.json',JSON.stringify({source,deployment:owned,version:uploaded.id,previousVersion:PREDECESSOR,checks,anonymousDenied:true,publicResponsesExact:publicSnapshots,cataloguePreserved:true,bindingsPreserved:true,originalModulesPreserved:true,partnerActivated:false,verifiedAt:new Date().toISOString()},null,2));
    console.log('VERIFIED prescription lifecycle '+source+' deployment '+owned);
  }catch(error){
    const current=await active();
    if(current.versions[0].version_id===uploaded.id&&(owned===null||current.id===owned)){
      const rollback=await api(legacy+'/deployments','POST',{strategy:'percentage',versions:[{version_id:PREDECESSOR,percentage:100}],annotations:{'workers/message':'Prescription verification failed; restore owned predecessor without data restoration'}});
      assert.equal((await active()).versions[0].version_id,PREDECESSOR);writeFileSync(out+'/rollback.json',JSON.stringify({source,deployment:rollback.id,restoredVersion:PREDECESSOR,error:error.message}));
    }
    throw error;
  }
}
async function rollbackInterrupted(){
  const out='prescription-release-evidence',file=out+'/promotion-intent.json';if(!existsSync(file))return;
  const intent=JSON.parse(readFileSync(file));assert.equal(intent.source,process.env.GITHUB_SHA);assert.equal(intent.previousVersion,PREDECESSOR);
  const base='https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/shift-core/deployments';
  const headers={Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'};
  const response=await fetch(base,{headers});assert(response.ok);const current=(await response.json()).result.deployments[0];
  if(current.versions.length!==1||current.versions[0].version_id!==intent.version)return;
  if(existsSync(out+'/owned-deployment.json'))assert.equal(current.id,JSON.parse(readFileSync(out+'/owned-deployment.json')).deployment,'A newer deployment owns traffic; refuse rollback');
  const restored=await fetch(base,{method:'POST',headers,body:JSON.stringify({strategy:'percentage',versions:[{version_id:PREDECESSOR,percentage:100}],annotations:{'workers/message':'Restore only interrupted owned prescription promotion'}})});assert(restored.ok);
  writeFileSync(out+'/interrupted-rollback.json',JSON.stringify({source:intent.source,restoredVersion:PREDECESSOR}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){if(process.argv[2]==='rollback')await rollbackInterrupted();else await execute();}
