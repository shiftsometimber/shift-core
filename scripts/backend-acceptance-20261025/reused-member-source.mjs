throw new Error('RETIRED: the earlier unversioned download was latest upload, not serving code. Full new-version acceptance is required; use exact version-bound readers.');
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root='/Users/shiftsometimberltd/SST/release-recovery-evidence-20261024';
const run=40156799256,source='9540d180ca4fbed47d96fd9279d901facba77fb5';
const reference=JSON.parse(fs.readFileSync(root+'/unchanged-member-route-release-coupling-check.json','utf8'));
const accepted=JSON.parse(fs.readFileSync(root+'/unchanged-member-live-acceptance-20261025.json','utf8'));
assert(accepted.ok&&accepted.ownedBaselineUnchangedAfter&&accepted.memberDetailsRestored&&accepted.originalTrackingChoiceRestored);
assert.equal(accepted.cases.length,4);
assert(reference.comparisons.length===9&&reference.comparisons.every(x=>x.exactCompiledModuleMatch));
const watch=JSON.parse(fs.readFileSync(root+'/guarded-release-watch.json','utf8'));
assert.equal(watch.verified,true);assert.equal(watch.source,source);assert.equal(String(watch.run),String(run));
const owned=JSON.parse(fs.readFileSync(root+'/my-timber-owned-runtime-'+run+'.json','utf8'));
assert.equal(owned.kind,'owned_runtime_deployment');assert.equal(owned.source,source);assert.equal(String(owned.run),String(run));
const base='https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/shift-core';
async function read(suffix=''){
 const cfg=fs.readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8');
 const token=cfg.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];assert(token);
 const r=await fetch(base+suffix,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(60000)});assert(r.ok,'Owned runtime read failed '+r.status);return r;
}
async function checkOwned(){
 const r=await read('/deployments'),d=await r.json();assert(d.success);
 const live=d.result.deployments.sort((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
 assert.equal(live.id,owned.deploymentId);assert.deepEqual(live.versions,[{version_id:owned.versionId,percentage:100}]);
}
const hash=x=>createHash('sha256').update(x).digest('hex');
function chunk(t,path){
 const marker='// '+path+'\n',start=t.indexOf(marker);assert(start>=0,'Compiled module missing '+path);
 const rest=t.slice(start+marker.length),next=/^\/\/ [^\n]+\.(?:m?js)\r?$/m.exec(rest);return rest.slice(0,next?next.index:rest.length);
}
function fn(t,name){const i=t.indexOf('async function '+name+'(');assert(i>=0);const end=t.indexOf('\n}',i);assert(end>i);return t.slice(i,end+2);}
const result={at:new Date().toISOString(),run,source,versionId:owned.versionId,referenceReceipt:'unchanged-member-live-acceptance-20261025.json',newMemberMutations:0,messagesSent:0};
try{
 await checkOwned();const r=await read();let code='';
 if((r.headers.get('Content-Type')||'').includes('multipart/form-data')){for(const[n,v]of await r.formData()){const name=typeof v==='string'?n:v.name;if(/\.(?:js|mjs)$/.test(name))code+=typeof v==='string'?v:await v.text();}}
 else code=await r.text();
 const expected=fs.readFileSync('/Users/shiftsometimberltd/SST/backend-consolidated-build-20261024/bundle-current/worker.js','utf8');
 assert.equal(hash(expected),reference.approvedCandidateRuntimeSHA256,'Approved runtime candidate changed');
 result.modules=reference.comparisons.map(x=>{const a=hash(chunk(code,x.path));assert.equal(a,x.servingSHA256,'Do not reuse changed live module '+x.path);assert.equal(a,x.candidateSHA256);return{path:x.path,sha256:a,unchanged:true};});
 const consent=JSON.parse(fs.readFileSync(root+'/unchanged-member-consent-function-comparison.json','utf8'));
 assert.equal(hash(fn(code,'saveConsent')),consent.servingSHA256,'Consent implementation changed');
 result.liveRuntimeSHA256=hash(code);result.exactApprovedRuntimeMatch=code===expected;result.originalConsentFunctionUnchanged=true;
 await checkOwned();result.verified=true;
 fs.writeFileSync(root+'/owned-backend-core-worker-'+run+'.js',code);
}catch(e){result.verified=false;result.error=e.message;throw e}
finally{fs.writeFileSync(root+'/owned-production-member-evidence-reuse-20261025.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({verified:result.verified,versionId:result.versionId,modules:result.modules?.length,exactApprovedRuntimeMatch:result.exactApprovedRuntimeMatch,error:result.error}));}
