import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';
const config=JSON.parse(readFileSync('work/staging/generated/config.json')),origin=process.env.PREVIEW_URL;
assert.equal(process.env.GITHUB_ACTIONS,'true');assert.equal(config.name,'shift-stabilisation-preview');assert(/^https:\/\/shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(origin));
const report={source:process.env.GITHUB_SHA,at:new Date().toISOString(),cases:[],providerSandboxTested:false,productionWrites:0};
for(let at=0;at<8;at++){
 const r=await fetch(origin+'/__preview/launch/payment-proof',{method:'POST',headers:{'Content-Type':'application/json','X-Preview-Proof':config.vars.LAUNCH_PROOF_KEY},body:JSON.stringify({at}),signal:AbortSignal.timeout(60000)});
 const body=await r.json().catch(()=>({error:'non_json',status:r.status}));report.cases.push({status:r.status,...body});writeFileSync('work/staging/generated/five-points-evidence/launch/payment-report.json',JSON.stringify(report,null,2));assert.equal(r.status,200,JSON.stringify(body));assert.equal(body.ok,true);
}
