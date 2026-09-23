import fs from 'node:fs';
import assert from 'node:assert/strict';
const config=JSON.parse(fs.readFileSync('operator-alert-preview/generated/wrangler.json'));
const url='https://shift-operator-alert-preview.matobrien.workers.dev';
let ready=false;const readiness=[];
for(let attempt=0;attempt<10;attempt++){
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(10000)}),text=await response.text();
  let meta;try{meta=JSON.parse(text)}catch{}
  readiness.push({status:response.status,type:response.headers.get('content-type'),source:meta?.source||null,...(!meta?{bodyStart:text.slice(0,160)}:{})});
  if(response.status===200&&meta?.source===config.vars.PROOF_SOURCE){ready=true;break;}
 }catch(e){readiness.push({error:e.name});}
 await new Promise(resolve=>setTimeout(resolve,3000));
}
fs.writeFileSync('operator-alert-evidence/readiness.json',JSON.stringify(readiness,null,2));
assert(ready,'Preview did not become ready: '+JSON.stringify(readiness));
const anonymous=await fetch(url+'/__send-proof',{method:'POST'});assert.equal(anonymous.status,401);
const reports=[];
for(let i=0;i<2;i++){
 const response=await fetch(url+'/__send-proof',{method:'POST',headers:{Authorization:'Bearer '+config.vars.PROOF_TOKEN},signal:AbortSignal.timeout(30000)});assert.equal(response.status,200);reports.push(await response.json());
 fs.writeFileSync('operator-alert-evidence/provider-proof.json',JSON.stringify({reports,anonymousStatus:anonymous.status,providerAcceptanceOnly:true},null,2));
 assert.equal(reports[i].source,config.vars.PROOF_SOURCE);assert(reports[i].results.every(r=>r.state==='accepted'),'Provider acceptance failed or uncertain: inspect before any resend');
 if(i===1)assert(reports[i].results.every(r=>r.duplicate===true),'Second request must not send another email');
}
console.log(JSON.stringify({recipients:reports[0].results,secondRequestSentNothing:true,inboxReceiptNotClaimed:true}));
