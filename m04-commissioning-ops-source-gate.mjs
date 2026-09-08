import fs from 'node:fs';
const ops=fs.readFileSync('commissioning-ops-v1.js','utf8');
const entry=fs.readFileSync('worker-entry-v6.js','utf8');
const fail=[];const need=(ok,msg)=>{if(!ok)fail.push(msg)};
need(ops.includes("COMMISSIONING_OPS_VERSION='final-v1-worker-publication-v1-20260815'"),'commissioning ops fingerprint missing');
need(ops.includes("p==='/v1/commissioning/product-events'&&request.method==='GET'"),'product-events route missing');
need(ops.includes("p==='/v1/commissioning/final-v1-publication'&&request.method==='POST'"),'final V1 publication route missing');
need(ops.includes("'x-shift-commissioning-ops':COMMISSIONING_OPS_VERSION"),'production fingerprint header missing');
need(ops.includes('commissioningOpsVersion:COMMISSIONING_OPS_VERSION'),'fingerprint not retained in response body');
need(/import\s*\{\s*commissioningOpsRoutes\s*\}\s*from\s*["']\.\/commissioning-ops-v1\.js["']/.test(entry),'canonical entry does not import commissioning ops');
need(/await\s+commissioningOpsRoutes\(request\s*,\s*env\)/.test(entry),'canonical entry does not dispatch commissioning ops');
if(fail.length){console.error(JSON.stringify({proof:'M04_COMMISSIONING_OPS_SOURCE',fail},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'M04_COMMISSIONING_OPS_SOURCE',status:'PASS',version:'final-v1-worker-publication-v1-20260815'},null,2));
