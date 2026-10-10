import assert from 'node:assert/strict';
import {readdirSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const root='https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/shift-core';
const token=process.env.CLOUDFLARE_API_TOKEN;assert(token);
const files=[];function walk(p){for(const d of readdirSync(p,{withFileTypes:true})){const n=p+'/'+d.name;if(d.isDirectory())walk(n);else if(n.endsWith('.json'))files.push(n)}}walk('owned-release');
const receipts=[];function scan(v){if(!v||typeof v!=='object')return;if(v.kind==='owned_runtime_deployment')receipts.push(v);for(const x of Object.values(v))if(typeof x==='object')scan(x)}
for(const f of files){try{scan(JSON.parse(readFileSync(f)))}catch{}}
const receipt=receipts.find(x=>String(x.run)===process.env.ACCEPTANCE_RUN&&x.source===process.env.ACCEPTANCE_SOURCE);
assert(receipt,'Exact owned deployment receipt missing');
const r=await fetch(root+'/deployments',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});const j=await r.json();assert(r.ok&&j.success,'Provider GET failed');

const active=j.result.deployments[0];console.log(JSON.stringify({providerObservationAt:new Date().toISOString(),activeDeploymentId:active.id,activeVersions:active.versions}));assert.equal(active.versions.length,1);assert.equal(active.versions[0].version_id,receipt.versionId);assert.equal(active.versions[0].percentage,100);
mkdirSync('runtime-acceptance-evidence',{recursive:true});
const report={at:new Date().toISOString(),source:receipt.source,run:receipt.run,originalOwnedDeploymentId:receipt.deploymentId,deploymentId:active.id,versionId:receipt.versionId,percentage:100,providerRequests:'GET only',pass:true};
writeFileSync('runtime-acceptance-evidence/'+(process.argv[2]||'before')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));

if(process.argv[2]==='after'){
const current=JSON.parse(readFileSync('reliability-evidence/current-live.json'));
for(const request of current.requests.filter(x=>x.ray)){
const ray=request.ray.split('-')[0],query={queryId:'current-reliability-readonly',dry:true,view:'events',limit:100,timeframe:{from:Date.parse(request.at)-30000,to:Date.parse(request.completedAt)+60000},parameters:{needle:{value:ray,isRegex:false,matchCase:true}}};
const endpoint='https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/observability/telemetry/query';
async function read(q){const r=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(q),signal:AbortSignal.timeout(30000)});assert(![401,403].includes(r.status),'STOP telemetry authority unavailable');const j=await r.json();assert(r.ok&&j.success);return j}
const raw=await read(query),events=(raw.result?.events?.events||[]).map(e=>{const w=e.$workers||{},m=e.$metadata||{};return{timestamp:e.timestamp,requestId:w.requestId||m.requestId,rayId:m.rayId,traceId:m.traceId,service:m.service,type:m.type,version:w.scriptVersion?.id,outcome:w.outcome,cpuMs:w.cpuTimeMs,wallMs:w.wallTimeMs,status:w.event?.response?.status,spanId:m.spanId,spanName:m.spanName,parentSpanId:m.parentSpanId,duration:m.duration}});
const evidence={at:new Date().toISOString(),path:request.path,ray,events,queries:[]};
const traceId=events.find(x=>x.rayId===ray)?.traceId;
if(traceId)for(const view of ['events','traces']){const d=await read({...query,view,parameters:{filterCombination:'and',filters:[{key:'$metadata.traceId',operation:'eq',type:'string',value:traceId}]}});evidence.queries.push({view,count:d.result?.events?.count,eventTypes:(d.result?.events?.events||[]).map(e=>({type:e.$metadata?.type,service:e.$metadata?.service,spanName:e.$metadata?.spanName,duration:e.$metadata?.duration})),traces:(d.result?.traces||[]).map(t=>({traceId:t.traceId,spans:t.spans,durationMs:t.traceDurationMs}))})}
writeFileSync('runtime-acceptance-evidence/current-ray-'+ray+'.json',JSON.stringify(evidence,null,2));console.log('CURRENT_RAY_EVIDENCE '+JSON.stringify(evidence));
}}
