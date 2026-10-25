import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// One-shot additive setup after the existing sole verifier has accepted the owned
// release. This is not a publisher, scheduler, retry API or delivery backfill.
const [runText,source,mode]=process.argv.slice(2);
assert(/^\d+$/.test(runText||''),'Exact successful run ID required');
assert(/^[a-f0-9]{40}$/.test(source||''),'Exact successful source required');
assert(['--prepare','--apply'].includes(mode),'Use --prepare or --apply');
const run=Number(runText),root='/Users/shiftsometimberltd/SST';
const evidence=root+'/release-recovery-evidence-20261024';
const approved='80a44f8658d42b99cb79a8d2231bc26d34448d01';
const repo=root+'/backend-consolidated-build-20261024';
const specs=[
 ['hq-commerce-delivery.mjs','commerce_service_delivery',/commerceDeliveryDDL=\x60([^\x60]+)\x60/],
 ['commerce-stripe-v1.js','commerce_receipt_delivery',/env\.DB\.exec\(\x60(CREATE TABLE IF NOT EXISTS commerce_receipt_delivery[\s\S]+?)\x60\.replace/],
 ['auth-delivery-v1.js','auth_delivery_event_links',/DB\.prepare\(\x60(CREATE TABLE IF NOT EXISTS auth_delivery_event_links[^\x60]+)\x60/]
];
const expectedFields={commerce_service_delivery:['event_key','order_id','event_type','recipient_hash','template_version','payload_hash','status','provider_id','error_code','created_at','updated_at'],commerce_receipt_delivery:['order_id','recipient_role','state','provider_id','last_error','updated_at'],auth_delivery_event_links:['delivery_event_id','event_reference','template_version','recipient_role','recorded_at']};
const expectedPrimary={commerce_service_delivery:[['event_key',1]],commerce_receipt_delivery:[['order_id',1],['recipient_role',2]],auth_delivery_event_links:[['delivery_event_id',1]]};
const rows=specs.map(([path,table,pattern])=>{
 const bytes=execFileSync('git',['show',approved+':'+path],{cwd:repo});
 const adopted=execFileSync('git',['show','HEAD:'+path],{cwd:repo});
 assert(bytes.equals(adopted),'The prepared approved schema source changed: '+path);
 const sql=pattern.exec(bytes.toString('utf8'))?.[1].replace(/\s+/g,' ').trim();
 assert(sql&&sql.startsWith('CREATE TABLE IF NOT EXISTS '+table+'(')||sql&&sql.startsWith('CREATE TABLE IF NOT EXISTS '+table+' ('),'Exact named additive table required');
 const statementOnly=sql.replace('REFERENCES auth_delivery_events(id) ON DELETE CASCADE','REFERENCES auth_delivery_events(id)');
 assert(!/;|\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRIGGER)\b/i.test(statementOnly),'No other data operation permitted');
 return{path,table,sql,sourceBlob:execFileSync('git',['rev-parse',approved+':'+path],{cwd:repo,encoding:'utf8'}).trim(),sqlSHA256:createHash('sha256').update(sql).digest('hex')};
});
const out={at:new Date().toISOString(),run,source,mode,approvedSchemaSource:approved,
 sources:rows.map(({sql,...r})=>r),messagesSent:0,eventsReplayed:0,historicalRowsBackfilled:0,
 financialOrMemberRowsChanged:0,rollbackPolicy:'Additive tables are retained. Do not drop a table that a newer release or event may have used.'};
const file=evidence+'/owned-delivery-schema-'+(mode==='--apply'?'application':'preparation')+'-20261025.json';
async function cf(path,body){
 const cfg=fs.readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8');
 const token=cfg.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];assert(token,'Existing authorised provider session required');
 const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000)});
 const d=await r.json();assert(r.ok&&d.success,'Provider operation failed '+r.status+' '+(d.errors?.[0]?.code||''));return d.result;
}
const query=async(sql,params=[])=>{return(await cf('/accounts/9e5386dcf455be34c582d93f8bfc79e6/d1/database/88f40aed-cb23-4372-8c94-8a73f48bc847/query',{sql,params}))[0].results};
async function checkOwned(){
 const watch=JSON.parse(fs.readFileSync(evidence+'/guarded-release-watch.json','utf8'));
 assert.equal(watch.verified,true,'Existing sole production verifier must finish successfully');
 assert.equal(watch.source,source);assert.equal(String(watch.run),runText);
 const o=JSON.parse(fs.readFileSync(evidence+'/my-timber-owned-runtime-'+run+'.json','utf8'));
 assert.equal(o.kind,'owned_runtime_deployment');assert.equal(o.source,source);assert.equal(String(o.run),runText);
 const r=await cf('/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/shift-core/deployments');
 const live=r.deployments.sort((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
 assert.equal(live.id,o.deploymentId,'A different release owns the deployment');
 assert.deepEqual(live.versions,[{version_id:o.versionId,percentage:100}],'Preserve another release traffic');
 return{deploymentId:o.deploymentId,versionId:o.versionId};
}
try{
 if(mode==='--prepare'){
  out.prepared=true;out.schemaStatements=rows.map(r=>({table:r.table,sql:r.sql}));
  out.productionMutations=0;out.executed=false;
 }else{
  out.owned=await checkOwned();
  out.before=await query("SELECT name,sql FROM sqlite_master WHERE type='table' AND name IN (?,?,?)",rows.map(r=>r.table));
  out.applied=[];
  for(const row of rows){
   await checkOwned();
   await query(row.sql);
   const current=(await query("SELECT name,sql FROM sqlite_master WHERE type='table' AND name=?",[row.table]))[0];
   assert(current&&current.sql,'Approved ledger table was not retained: '+row.table);
   const fields=await query('PRAGMA table_info('+row.table+')');
   assert.deepEqual(fields.map(x=>x.name),expectedFields[row.table],'Existing ledger schema differs; preserve it and investigate');
   assert.deepEqual(fields.filter(x=>x.pk).map(x=>[x.name,x.pk]),expectedPrimary[row.table],'Ledger uniqueness differs');
   if(row.table==='auth_delivery_event_links'){const keys=await query('PRAGMA foreign_key_list(auth_delivery_event_links)');assert(keys.some(x=>x.table==='auth_delivery_events'&&x.from==='delivery_event_id'&&x.to==='id'&&x.on_delete==='CASCADE'),'Preserve linked auth erasure semantics');}
   out.applied.push({table:row.table,sourceBlob:row.sourceBlob,sqlSHA256:row.sqlSHA256,fields:fields.map(x=>({name:x.name,type:x.type,notnull:x.notnull,pk:x.pk})),retainedDefinition:current.sql,previouslyInstalled:out.before.some(x=>x.name===row.table)});
  }
  await checkOwned();out.verified=true;out.executed=true;
  out.historicalCoverage='Only future real events use these ledgers. Missing historical delivery links remain unavailable and were not invented.';
 }
}catch(e){out.verified=false;out.error=e.message;throw e}
finally{fs.writeFileSync(file,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({mode,prepared:out.prepared,verified:out.verified,tables:rows.map(x=>x.table),error:out.error}));}
