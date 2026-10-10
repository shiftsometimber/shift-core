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

if(process.argv[2]==='before'){for(const investigation of [{label:'original-deadline',from:'2026-10-09T21:10:10Z',to:'2026-10-09T21:11:05Z',needle:'/v1/grub/workspace'},{label:'new-reset',from:'2026-10-09T22:00:16Z',to:'2026-10-09T22:00:24Z',needle:'/v1/grub/workspace'},{label:'original-request-logs',from:'2026-10-09T21:10:10Z',to:'2026-10-09T21:11:10Z',needle:'6705ae19238d01e065f4242b7ef48d83'}]){
 const query={queryId:'premortem-garage-historic-readonly',dry:true,view:'events',limit:100,timeframe:{from:Date.parse(investigation.from),to:Date.parse(investigation.to)},parameters:{filterCombination:'and',filters:[{key:'$metadata.service',operation:'eq',type:'string',value:'shift-core'}],needle:{value:investigation.needle,isRegex:false,matchCase:true}}};
 const response=await fetch('https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/observability/telemetry/query',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(query),signal:AbortSignal.timeout(30000)});
 const data=await response.json();
 const rawEvents=data.result?.events?.events||[];
 const fieldNames=[...new Set(rawEvents.flatMap(e=>{const found=[];function visit(v,p=''){if(!v||typeof v!=='object')return;for(const [k,x]of Object.entries(v)){const n=p?p+'.'+k:k;if(/span|trace|timing|duration|database|d1|catalogue|member.state|auth/i.test(k)&&!p.includes('headers'))found.push(n);if(typeof x==='object'&&!/headers|cookie/i.test(k))visit(x,n)}}visit(e);return found}))];
 console.log('HISTORIC_TIMING_FIELDS '+JSON.stringify({label:investigation.label,fieldNames}));
 if(investigation.label==='original-request-logs'){
 const original=rawEvents.find(e=>e.$workers?.requestId==='6705ae19238d01e065f4242b7ef48d83');
 const traceId=original?.$metadata?.traceId||original?.$workers?.traceId;
 console.log('ORIGINAL_TRACE_LINK '+JSON.stringify({requestId:'6705ae19238d01e065f4242b7ef48d83',traceId:traceId||null,traceIdType:typeof traceId}));
 const traceQuery={...query,view:'traces'};
 const tr=await fetch('https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/observability/telemetry/query',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(traceQuery),signal:AbortSignal.timeout(30000)});
 const tj=await tr.json();
 console.log('ORIGINAL_TRACE_SEARCH '+JSON.stringify({httpStatus:tr.status,success:tj.success,errors:(tj.errors||[]).map(e=>({code:e.code,message:String(e.message).slice(0,180)})),traces:(tj.result?.traces||[]).map(t=>({traceId:t.traceId,spans:t.spans,traceDurationMs:t.traceDurationMs,traceStartMs:t.traceStartMs,traceEndMs:t.traceEndMs,services:t.service})),resultKeys:Object.keys(tj.result||{})}));
 if(typeof traceId==='string'&&traceId){
 const linked={...query,parameters:{filterCombination:'and',filters:[{key:'$metadata.traceId',operation:'eq',type:'string',value:traceId}]}};
 const lr=await fetch('https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/observability/telemetry/query',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(linked),signal:AbortSignal.timeout(30000)});const lj=await lr.json();
 console.log('ORIGINAL_LINKED_SPANS '+JSON.stringify({httpStatus:lr.status,success:lj.success,errors:(lj.errors||[]).map(e=>({code:e.code,message:String(e.message).slice(0,180)})),count:lj.result?.events?.count,events:(lj.result?.events?.events||[]).map(e=>{const m=e.$metadata||{},w=e.$workers||{};return {timestamp:e.timestamp,requestId:w.requestId||m.requestId,service:m.service,type:m.type,spanId:m.spanId,parentSpanId:m.parentSpanId,spanName:m.spanName,startTime:m.startTime,endTime:m.endTime,duration:m.duration,traceDuration:m.traceDuration,outcome:w.outcome,cpuTimeMs:w.cpuTimeMs,wallTimeMs:w.wallTimeMs}})}));
 }
}
 const events=rawEvents.map(e=>{const w=e.$workers||{},m=e.$metadata||{},req=w.event?.request||{},res=w.event?.response||{};return {timestamp:e.timestamp,metadataStart:m.startTime,metadataEnd:m.endTime,method:req.method,transportProtocol:req.cf?.httpProtocol,edgeColo:req.cf?.colo,headless:typeof req.headers?.['user-agent']==='string'?req.headers['user-agent'].includes('HeadlessChrome'):undefined,requestId:w.requestId||m.requestId,versionId:w.scriptVersion?.id,outcome:w.outcome,cpuTimeMs:w.cpuTimeMs,wallTimeMs:w.wallTimeMs,status:res.status||m.statusCode,path:req.url?new URL(req.url).pathname:undefined,rayId:m.rayId,errorCategories:['D1','timeout','cancel','exception'].filter(k=>String(m.error||e.source?.error||e.source?.message||'').toLowerCase().includes(k.toLowerCase()))}});
 const historic={label:investigation.label,at:new Date().toISOString(),request:'POST ad-hoc telemetry query, dry=true; no saved query or runtime/data mutation',timeframe:query.timeframe,httpStatus:response.status,success:data.success,errors:(data.errors||[]).map(e=>({code:e.code,message:String(e.message).slice(0,180)})),statistics:data.result?.statistics,eventCount:events.length,matchedCount:data.result?.events?.count,events};
 mkdirSync('runtime-acceptance-evidence',{recursive:true});writeFileSync('runtime-acceptance-evidence/garage-'+investigation.label+'-telemetry.json',JSON.stringify(historic,null,2));console.log('GARAGE_HISTORIC_TELEMETRY '+JSON.stringify(historic));
 if(response.status===401||response.status===403){console.log('BLOCKED existing configured credential has no telemetry authority; no escalation attempted');process.exitCode=1;break;}
}

}
const active=j.result.deployments[0];console.log(JSON.stringify({providerObservationAt:new Date().toISOString(),activeDeploymentId:active.id,activeVersions:active.versions}));assert.equal(active.versions.length,1);assert.equal(active.versions[0].version_id,receipt.versionId);assert.equal(active.versions[0].percentage,100);
mkdirSync('runtime-acceptance-evidence',{recursive:true});
const report={at:new Date().toISOString(),source:receipt.source,run:receipt.run,originalOwnedDeploymentId:receipt.deploymentId,deploymentId:active.id,versionId:receipt.versionId,percentage:100,providerRequests:'GET only',pass:true};
writeFileSync('runtime-acceptance-evidence/'+(process.argv[2]||'before')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));

if(process.argv[2]==='after'){
 const query={queryId:'commissioning-live-ray-readonly',dry:true,view:'events',limit:20,timeframe:{from:1791612511112,to:1791612700920},parameters:{needle:{value:'a483767e78c95113',isRegex:false,matchCase:true}}};
 const response=await fetch('https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/observability/telemetry/query',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(query),signal:AbortSignal.timeout(30000)});const data=await response.json();
 const evidence={at:new Date().toISOString(),httpStatus:response.status,success:data.success,count:data.result?.events?.count,events:(data.result?.events?.events||[]).map(e=>{const w=e.$workers||{},m=e.$metadata||{};return{timestamp:e.timestamp,requestId:w.requestId||m.requestId,rayId:m.rayId,spanId:m.spanId,traceId:m.traceId,startTime:m.startTime,endTime:m.endTime,version:w.scriptVersion?.id,outcome:w.outcome,cpuTimeMs:w.cpuTimeMs,wallTimeMs:w.wallTimeMs,status:w.event?.response?.status,protocol:w.event?.request?.cf?.httpProtocol,colo:w.event?.request?.cf?.colo}})};
 console.log('LIVE_RAY_TELEMETRY '+JSON.stringify(evidence));
 const traceId=data.result?.events?.events?.find(e=>e.$metadata?.rayId==='a483767e78c95113')?.$metadata?.traceId;
 if(traceId){for(const view of ['events','traces']){
  const linked={...query,view,parameters:{filterCombination:'and',filters:[{key:'$metadata.traceId',operation:'eq',type:'string',value:traceId}]}};
  const lr=await fetch('https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/observability/telemetry/query',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(linked),signal:AbortSignal.timeout(30000)});const lj=await lr.json();
  console.log('LIVE_TRACE_SEARCH '+JSON.stringify({view,httpStatus:lr.status,success:lj.success,traceId,count:lj.result?.events?.count,events:(lj.result?.events?.events||[]).map(e=>{const m=e.$metadata||{},w=e.$workers||{};return{timestamp:e.timestamp,service:m.service,type:m.type,requestId:w.requestId||m.requestId,spanId:m.spanId,spanName:m.spanName,parentSpanId:m.parentSpanId,startTime:m.startTime,endTime:m.endTime,duration:m.duration,outcome:w.outcome,cpuTimeMs:w.cpuTimeMs,wallTimeMs:w.wallTimeMs}}),traces:(lj.result?.traces||[]).map(t=>({traceId:t.traceId,spans:t.spans,durationMs:t.traceDurationMs}))}));
 }}
writeFileSync('runtime-acceptance-evidence/live-client-ray.json',JSON.stringify(evidence,null,2));
}
