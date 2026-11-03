// One command restores the exact pre-release serving versions and only V7's
// route changes. Additive member records are retained. Default is read-only.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {cloudflareRequest as cf} from '/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/journey-shop-release-20261031/performance-precompiled-cloudflare-client-20261103.mjs';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
const file='member-experience/v7-release-evidence/production-release.json';
const baseline={
 'shift-programme-member-20261023':'8500f880-3e8a-49ff-b74e-c2cd83c36f27',
 'shift-hq-member-comms-20261023':'67958f58-8712-49ec-bcf0-2e513c1fd5d2',
 'shift-core':'e21cdda6-22e1-4c82-b4db-acaccfdc4f8f',
 'shift-mytimber-support-20261023':'1ff41acd-546e-431a-ab7f-fbc1f6f65b68'
};
const active=async name=>[...(await cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments')).deployments].sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];
const state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):null,execute=process.argv.includes('--execute');
if(execute)assert(state?.deployedAt&&state.owners?.length,'No V7 member release has been recorded; nothing may be rolled back.');
const owners=state?.owners||Object.entries(baseline).map(([name,originalVersion])=>({name,originalVersion})),verified=[];
for(const owner of owners){
 assert(baseline[owner.name], 'Unapproved worker in rollback receipt');const current=await active(owner.name),live=current.versions.filter(v=>v.percentage>0);assert.equal(live.length,1,'Unexpected traffic distribution');
 const version=live[0].version_id;assert([owner.originalVersion,owner.candidateVersion].filter(Boolean).includes(version),'Another release changed '+owner.name+'; preserve its work.');
 if(execute&&version!==owner.originalVersion){await cf('/accounts/'+account+'/workers/scripts/'+owner.name+'/deployments','POST',{strategy:'percentage',versions:[{version_id:owner.originalVersion,percentage:100}],annotations:{'workers/message':'My Timber V7 one-step rollback'}});}
 verified.push({worker:owner.name,before:version,restored:execute?owner.originalVersion:null});
}
if(execute){
 for(const change of state.scheduleChanges||[]){await cf('/accounts/'+account+'/workers/scripts/'+change.name+'/schedules','PUT',change.before);}
 const routes=await cf('/zones/'+zone+'/workers/routes');
 for(const change of state.routeChanges||[]){
  const current=routes.find(r=>r.pattern===change.pattern);if(current?.script===change.before?.script)continue;
  assert.equal(current?.script,change.after.script,'Another release changed route '+change.pattern);
  if(change.before)await cf('/zones/'+zone+'/workers/routes/'+current.id,'PUT',{pattern:change.before.pattern,script:change.before.script});
  else if(current)await cf('/zones/'+zone+'/workers/routes/'+current.id,'DELETE');
 }
 for(const owner of owners){const live=(await active(owner.name)).versions.filter(v=>v.percentage>0);assert.equal(live.length,1);assert.equal(live[0].version_id,owner.originalVersion);assert.equal(live[0].percentage,100);}
 state.rolledBackAt=new Date().toISOString();state.rollbackVerification=verified;fs.writeFileSync(file,JSON.stringify(state,null,2)+'\n');
}
const report={at:new Date().toISOString(),mode:execute?'RESTORED_AND_VERSION_VERIFIED':'READ_ONLY_BASELINE_CHECK',verified,memberRecordsDeleted:false,serviceWorkerRecovery:'Cached shell detects the restored /v1/my-timber/boot 404, purges its encrypted snapshot and reloads the old app through ?mt-rollback=1. Physical-device recovery remains a required proof.'};
fs.writeFileSync('member-experience/v7-release-evidence/rollback-check.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
