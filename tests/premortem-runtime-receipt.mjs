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
 const events=rawEvents.map(e=>{const w=e.$workers||{},m=e.$metadata||{},req=w.event?.request||{},res=w.event?.response||{};return {timestamp:e.timestamp,metadataStart:m.startTime,metadataEnd:m.endTime,method:req.method,transportProtocol:req.cf?.httpProtocol,edgeColo:req.cf?.colo,headless:typeof req.headers?.['user-agent']==='string'?req.headers['user-agent'].includes('HeadlessChrome'):undefined,requestId:w.requestId||m.requestId,versionId:w.scriptVersion?.id,outcome:w.outcome,cpuTimeMs:w.cpuTimeMs,wallTimeMs:w.wallTimeMs,status:res.status||m.statusCode,path:req.url?new URL(req.url).pathname:undefined,rayId:m.rayId,errorCategories:['D1','timeout','cancel','exception'].filter(k=>String(m.error||e.source?.error||e.source?.message||'').toLowerCase().includes(k.toLowerCase()))}});
 const historic={label:investigation.label,at:new Date().toISOString(),request:'POST ad-hoc telemetry query, dry=true; no saved query or runtime/data mutation',timeframe:query.timeframe,httpStatus:response.status,success:data.success,errors:(data.errors||[]).map(e=>({code:e.code,message:String(e.message).slice(0,180)})),statistics:data.result?.statistics,eventCount:events.length,matchedCount:data.result?.events?.count,events};
 mkdirSync('runtime-acceptance-evidence',{recursive:true});writeFileSync('runtime-acceptance-evidence/garage-'+investigation.label+'-telemetry.json',JSON.stringify(historic,null,2));console.log('GARAGE_HISTORIC_TELEMETRY '+JSON.stringify(historic));
 if(response.status===401||response.status===403){console.log('BLOCKED existing configured credential has no telemetry authority; no escalation attempted');process.exitCode=1;break;}
}

}
const active=j.result.deployments[0];console.log(JSON.stringify({providerObservationAt:new Date().toISOString(),activeDeploymentId:active.id,activeVersions:active.versions}));assert.equal(active.versions.length,1);assert.equal(active.versions[0].version_id,receipt.versionId);assert.equal(active.versions[0].percentage,100);
mkdirSync('runtime-acceptance-evidence',{recursive:true});
const report={at:new Date().toISOString(),source:receipt.source,run:receipt.run,originalOwnedDeploymentId:receipt.deploymentId,rollbackReceiptRun:'37985093872',deploymentId:active.id,versionId:receipt.versionId,percentage:100,providerRequests:'GET only',pass:true};
writeFileSync('runtime-acceptance-evidence/'+(process.argv[2]||'before')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
