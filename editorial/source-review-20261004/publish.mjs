import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {correctionSql,sha,RELEASE} from './build.mjs';
const dir=new URL('.',import.meta.url),items=JSON.parse(readFileSync(new URL('corrections.json',dir),'utf8'));
const {sql,params,auditQueries,prepared}=correctionSql(items),source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const apply=process.argv.includes('--apply'),authFile=process.env.SHIFT_CF_AUTH_FILE;
assert(authFile,'Use the existing authorised Wrangler OAuth file on the owner device');
const token=readFileSync(authFile,'utf8').match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];assert(token,'Existing OAuth credential unavailable');
const endpoint='https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/d1/database/88f40aed-cb23-4372-8c94-8a73f48bc847/query';
async function query(body){
 const response=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)}),value=await response.json();
 assert(response.ok&&value.success&&value.result?.every(r=>r.success!==false),'D1 operation failed: '+JSON.stringify(value.errors||[]));return value.result;
}
const keys=Object.keys(prepared[0].before),ids=prepared.map(a=>a.id).join(',');
const readRows=async()=>{const r=await query({sql:'SELECT '+keys.join(',')+' FROM radar_events WHERE id IN ('+ids+') ORDER BY id'});return r[0].results;};
const assertRows=(rows,side)=>{assert.equal(rows.length,19);for(const a of prepared)assert.deepEqual(rows.find(r=>r.id===a.id),a[side],side+' drift '+a.id);};
const before=await readRows();assertRows(before,'before');
const firstPublishedSql="SELECT event_id,MIN(created_at) first_published_at FROM radar_audit WHERE action='published' AND event_id IN ("+ids+') GROUP BY event_id ORDER BY event_id';
const publishedBefore=(await query({sql:firstPublishedSql}))[0].results;
writeFileSync(new URL('publication-preflight.json',dir),JSON.stringify({source,at:new Date().toISOString(),rows:before,publishedBefore},null,2));
if(!apply){console.log(JSON.stringify({release:RELEASE,source,matched:19,productionWrites:0}));process.exit(0);}
assert(process.env.SHIFT_EDITORIAL_PROOF_RUN,'Exact successful hosted source proof required');
const proofResponse=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/runs/'+process.env.SHIFT_EDITORIAL_PROOF_RUN,{signal:AbortSignal.timeout(15000)});assert(proofResponse.ok);
const proof=await proofResponse.json();assert.equal(proof.head_sha,source);assert.equal(proof.conclusion,'success');assert.equal(proof.name,'Source editorial correction proof');
const receipt={release:RELEASE,source,proofRun:proof.id,startedAt:new Date().toISOString(),querySha256:sha(JSON.stringify({sql,params})),status:'pending'};
const save=()=>writeFileSync(new URL('publication-receipt.json',dir),JSON.stringify(receipt,null,2));save();
try{
 receipt.update=await query({sql,params});save();assert.equal(receipt.update[0].results.length,19);
 assertRows(await readRows(),'after');receipt.audits=await query({batch:auditQueries});save();
 const auditRows=(await query({sql:"SELECT event_id,detail_json FROM radar_audit WHERE action='source_limited_editorial_correction' AND json_extract(detail_json,'$.release_id')='"+RELEASE+"' ORDER BY event_id"}))[0].results;
 assert.equal(auditRows.length,19);for(const a of prepared)assert.deepEqual(JSON.parse(auditRows.find(r=>r.event_id===a.id).detail_json),a.audit);
 const publishedAfter=(await query({sql:firstPublishedSql}))[0].results;assert.deepEqual(publishedAfter,publishedBefore);assertRows(await readRows(),'after');
 receipt.status='verified';receipt.correctedIds=prepared.map(a=>a.id);receipt.publishedDatesPreserved=true;receipt.finishedAt=new Date().toISOString();save();
 console.log(JSON.stringify({release:RELEASE,source,corrected:19,audits:19,publishedDatesPreserved:true,status:receipt.status}));
}catch(error){receipt.status='needs reconciliation';receipt.error=error.message;save();throw error;}
