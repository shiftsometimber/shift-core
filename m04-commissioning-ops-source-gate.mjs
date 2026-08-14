import fs from 'node:fs';
const ops=fs.readFileSync('commissioning-ops-v1.js','utf8');
const entry=fs.readFileSync('worker-entry-v6.js','utf8');
const fail=[];const need=(ok,msg)=>{if(!ok)fail.push(msg)};
need(ops.includes("COMMISSIONING_OPS_VERSION='m04-product-events-v2-20260814'"),'commissioning ops fingerprint missing');
need(ops.includes("p==='/v1/commissioning/product-events'&&request.method==='GET'"),'product-events route missing');
need(ops.includes("'x-shift-commissioning-ops':COMMISSIONING_OPS_VERSION"),'production fingerprint header missing');
need(ops.includes('commissioningOpsVersion:COMMISSIONING_OPS_VERSION'),'fingerprint not retained in response body');
need(entry.includes("import {commissioningOpsRoutes} from './commissioning-ops-v1.js'"),'canonical entry does not import commissioning ops');
need(entry.includes('await commissioningOpsRoutes(request,env)'),'canonical entry does not dispatch commissioning ops');
if(fail.length){console.error(JSON.stringify({proof:'M04_COMMISSIONING_OPS_SOURCE',fail},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'M04_COMMISSIONING_OPS_SOURCE',status:'PASS',version:'m04-product-events-v2-20260814'},null,2));
