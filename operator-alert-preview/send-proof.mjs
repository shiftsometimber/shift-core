import fs from 'node:fs';
import assert from 'node:assert/strict';
const config=JSON.parse(fs.readFileSync('operator-alert-preview/generated/wrangler.json'));
const url='https://shift-operator-alert-preview.matobrien.workers.dev';
const meta=await(await fetch(url,{signal:AbortSignal.timeout(20000)})).json();assert.equal(meta.source,config.vars.PROOF_SOURCE);
const anonymous=await fetch(url+'/__send-proof',{method:'POST'});assert.equal(anonymous.status,401);
const reports=[];
for(let i=0;i<2;i++){
 const response=await fetch(url+'/__send-proof',{method:'POST',headers:{Authorization:'Bearer '+config.vars.PROOF_TOKEN},signal:AbortSignal.timeout(30000)});assert.equal(response.status,200);reports.push(await response.json());
 fs.writeFileSync('operator-alert-evidence/provider-proof.json',JSON.stringify({reports,anonymousStatus:anonymous.status,providerAcceptanceOnly:true},null,2));
 assert.equal(reports[i].source,config.vars.PROOF_SOURCE);assert(reports[i].results.every(r=>r.state==='accepted'),'Provider acceptance failed or uncertain: inspect before any resend');
 if(i===1)assert(reports[i].results.every(r=>r.duplicate===true),'Second request must not send another email');
}
console.log(JSON.stringify({recipients:reports[0].results,secondRequestSentNothing:true,inboxReceiptNotClaimed:true}));
