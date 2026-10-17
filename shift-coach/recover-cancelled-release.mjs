import {verifiedSourceScopeAtPointUse} from '../release/verified-source-evidence-20261016.mjs';
import {PRESERVED_CURRENT_RUNTIME as ACCEPTED_CURRENT_RUNTIME,verifyCurrentRecordedWeekRuntimeWindow as verifyCurrentAcceptedRuntimeWindow,assertRecordedWeekPreservedRuntimeLineage as assertPreservedRuntimeLineage} from '../release/accepted-current-runtime-starting-point-20261017.mjs';
import {verifyCurrentOwnedRollbackReleaseWindow} from '../release/owned-rollback-release-window-20261016.mjs';
import {OWNED_ROLLBACK_DEPLOYMENT,verifyCurrentOwnedRollback,readLegacyRecoveryProof} from '../release/verified-owned-rollback-current.mjs';
import {createGithubProofReader} from '../release/github-proof-get.mjs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PHOTO_CANCELLED,completeExactPhotoCancelledStock} from '../release/photo-cancelled-stock-completion-20261014.mjs';
import {ROOT_SHARE_PRESERVATION_ROLLBACK,verifyRootSharePreservationRollback} from '../release/root-share-preservation-rollback.mjs';
import {ROOT_SHARE_SPEED_ROLLBACK,verifyRootShareSpeedRollback} from '../release/root-share-speed-rollback.mjs';
import {ROOT_SHARE_TRANSPORT_ROLLBACK,verifyRootShareTransportRollback} from '../release/root-share-transport-rollback.mjs';
import {TREATMENT_ROLLBACK,verifyMyTreatmentRollback} from '../release/my-treatment-rollback-runtime.mjs';
import {CONTACT_ROLLBACK,verifyContactRollback} from '../release/contact-rollback-runtime.mjs';
import {SUPPORT_RUNTIME,verifySupportRuntime} from '../release/live-support-runtime.mjs';
import {OWNER_RUNTIME,verifyOwnerRuntime} from '../release/owner-captured-runtime.mjs';
import {SITEWIDE_VERSION,verifySitewideRuntime} from '../release/sitewide-seo-scope.mjs';
import {ROOT_SHARE_ROLLBACK,verifyRootShareRollback} from '../release/root-share-preview-rollback.mjs';
import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {restoredWaistReadingStripRuntime,restoredMaleObesityHubV2TransportRuntime,restoredMaleObesityHubV2Runtime,restoredMaleObesitySupportRuntime,restoredMaleObesityRuntime,verifyMaleObesityRollback,restoredContinuityRuntime,verifyContinuityRollback,restoredPassportRuntime,verifyPassportRollback,restoredToolRuntime,verifyToolRollback,restoredLaterRuntime,verifyRestoredLaterRuntime,tabletRuntime,TABLET_RUNTIME_RECEIPT,verifyTabletRuntime,technicalRecovery,verifyTechnicalCancelledRuntime,unattributedRuntimeRecovery,verifyUnattributedRuntime,laterUnattributedRuntimeRecovery,verifyLaterUnattributedRuntime,catalogueRuntime,verifyCatalogueBaseline,articleRuntime,recovery,recoveryDecision,verifiedArticleRuntime,verifiedOwnedRuntime,recentSuccessfulPromotions} from './cancelled-release-recovery.mjs';import {verifyCoachingRelease} from './release-contract.mjs';
assert.equal(process.env.GITHUB_REF,'refs/heads/main');
const completedOriginalSource=await verifiedSourceScopeAtPointUse();
if(!completedOriginalSource)verifyCoachingRelease({requireLaunch:true});
// Archive pins come only from the accepted exact rollback/source modules above.
// Metadata stays fresh. Only hash-verified immutable archive bytes may be reused.
const historicalProof=createGithubProofReader({cacheDirectory:join(process.env.RUNNER_TEMP||tmpdir(),'shift-core-github-proof-v1')});
const artifactPins=new Map();
for(const p of [PHOTO_CANCELLED,ROOT_SHARE_ROLLBACK,ROOT_SHARE_TRANSPORT_ROLLBACK,ROOT_SHARE_SPEED_ROLLBACK,ROOT_SHARE_PRESERVATION_ROLLBACK]){
 artifactPins.set(p.artifact,{id:p.artifact,run:p.run,source:p.source,bytes:p.artifactBytes,sha256:p.artifactSha256??p.artifactSHA256});
 for(const name of ['speed','preservation'])if(p[name+'Artifact'])artifactPins.set(p[name+'Artifact'],{id:p[name+'Artifact'],run:p.run,source:p.source,bytes:p[name+'Bytes'],sha256:p[name+'Sha256']});
}
const get=historicalProof.get;
const getHistoricalArtifact=id=>{const pin=artifactPins.get(id);assert(pin,'Unknown original GitHub archive');return historicalProof.artifact(pin);};
const main=await get('/git/refs/heads/main');assert.equal(main.object.sha,process.env.GITHUB_SHA,'Do not recover from a stale release');
const wrangler=(...args)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config','wrangler.jsonc'],{encoding:'utf8',maxBuffer:4*1024*1024});
const active=()=>JSON.parse(wrangler('deployments','list','--json')).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
const before=active();let verified,failed;
const activeVersion=before.versions?.[0]?.version_id;
const version=JSON.parse(wrangler('versions','view',activeVersion,'--json'));
const versionObservation={kind:'runtime_recovery_version_observation',id:version.id,createdOn:version.metadata?.created_on,source:version.metadata?.source,triggeredBy:version.annotations?.['workers/triggered_by']||null,tag:version.annotations?.['workers/tag']||null,message:version.annotations?.['workers/message']||null};
console.log(JSON.stringify({kind:'runtime_recovery_observation',deploymentId:before.id,activeVersion,release:process.env.GITHUB_SHA,version:versionObservation}));
async function findVerifiedOwnedPromotion(){
 let ownedProof;
 const runs=ownedProof?[]:await recentSuccessfulPromotions(get,before);
 for(const run of runs){
  if(ownedProof)break;
  const jobs=await get('/actions/runs/'+run.id+'/jobs');
  for(const job of (jobs.jobs||[]).filter(j=>j.name==='promote'&&j.conclusion==='success')){
   const logs=await historicalProof.logs(job.id);
   for(const line of logs.split('\n')){
    const start=line.indexOf('{"kind":"owned_runtime_deployment"');if(start<0)continue;
    let receipt;try{receipt=JSON.parse(line.slice(start))}catch{continue}
    if(verifiedOwnedRuntime(before,run,job,receipt)){ownedProof={run:run.id,source:run.head_sha,version:receipt.versionId};break;}
   }
  }
 }
 return ownedProof;
}
const preserveCurrentRuntime=Boolean(JSON.parse(readFileSync('release/approved-runtime-composition.json','utf8')).currentRuntimePreservation20261016);
let acceptedCurrentServingProof;
let verifiedOwnedRollbackProof,restoredMaleObesityRuntimeProof,decision,ownedProof,technicalProof,unattributedProof,laterUnattributedProof,ownerCapturedProof,restoredLaterRuntimeProof,restoredToolRuntimeProof,restoredPassportRuntimeProof,restoredContinuityRuntimeProof;
if(preserveCurrentRuntime){
 if(before.id===ACCEPTED_CURRENT_RUNTIME.deployment){
  acceptedCurrentServingProof=await verifyCurrentAcceptedRuntimeWindow({proof:historicalProof,wrangler,stage:'recovery'});
  ownedProof={run:acceptedCurrentServingProof.run,source:acceptedCurrentServingProof.source,version:acceptedCurrentServingProof.version};
 }else{
  ownedProof=await findVerifiedOwnedPromotion();
  assert(ownedProof,'Unknown runtime has no exact successful owned-deployment proof; stop without rollback');
  assertPreservedRuntimeLineage(ownedProof);
 }
 const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during accepted-current baseline verification');decision='retain';
}else if(before.id===OWNED_ROLLBACK_DEPLOYMENT){
 verifiedOwnedRollbackProof=await verifyCurrentOwnedRollbackReleaseWindow({proof:historicalProof,wrangler,stage:'recovery'});decision='retain';
}else if(before.id===PHOTO_CANCELLED.deployment){
 const getLogs=historicalProof.logs;
 const getArtifact=getHistoricalArtifact;
 const freshSnapshot=async()=>{
  const tables={};for(const table of ['medicine_products','medicine_variants','medicine_inventory']){
   const sql='SELECT * FROM '+table+' ORDER BY '+(table==='medicine_inventory'?'variant_id':'id');
   const raw=JSON.parse(wrangler('d1','execute','DB','--remote','--json','--command',sql));assert(raw.length&&raw.every(r=>r.success),'Original public stock snapshot query required');
   const rows=raw.flatMap(r=>r.results||[]);tables[table]={rows:rows.length,sha256:createHash('sha256').update(JSON.stringify(rows)).digest('hex')};
  }
  return{phase:'after',checkedAt:new Date().toISOString(),release:process.env.GITHUB_SHA,tables,configurationSha256:createHash('sha256').update(readFileSync('wrangler.jsonc')).digest('hex'),customerRecordsRead:false,productionWrites:0};
 };
 ownedProof=await completeExactPhotoCancelledStock(before,version,get,getLogs,getArtifact,async()=>[active()],freshSnapshot);const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved after one exact cancelled photo baseline completion');decision='retain';
}else if(before.id===ROOT_SHARE_PRESERVATION_ROLLBACK.deployment){
 const getLogs=historicalProof.logs;
 const getArtifact=getHistoricalArtifact;
 ownedProof=await verifyRootSharePreservationRollback(before,version,get,getLogs,getArtifact,async()=>[active()]);
 const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during exact preservation rollback and fresh public verification');decision='retain';
}else if(before.id===ROOT_SHARE_SPEED_ROLLBACK.deployment){
 const getLogs=historicalProof.logs;
 const getArtifact=getHistoricalArtifact;
 ownedProof=await verifyRootShareSpeedRollback(before,version,get,getLogs,getArtifact,async()=>[active()]);
 const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during exact speed rollback and fresh public verification');decision='retain';
}else if(before.id===ROOT_SHARE_TRANSPORT_ROLLBACK.deployment){
 const getLogs=historicalProof.logs;
 const getArtifact=getHistoricalArtifact;
 ownedProof=await verifyRootShareTransportRollback(before,version,get,getLogs,getArtifact,async()=>[active()]);
 const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during exact transport rollback and fresh public verification');decision='retain';
}else if(before.id===ROOT_SHARE_ROLLBACK.deployment){
 const getLogs=historicalProof.logs;
 const getArtifact=getHistoricalArtifact;
 ownedProof=await verifyRootShareRollback(before,version,get,getLogs,getArtifact);
 const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during exact sharing rollback verification');decision='retain';
}
else if([restoredWaistReadingStripRuntime.deployment,restoredMaleObesityRuntime.deployment,restoredMaleObesitySupportRuntime.deployment,restoredMaleObesityHubV2Runtime.deployment,restoredMaleObesityHubV2TransportRuntime.deployment].includes(before.id)){
 const getLogs=historicalProof.logs;
 restoredMaleObesityRuntimeProof=await verifyMaleObesityRollback(before,version,get,getLogs);const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during exact owned rollback verification');decision='retain';
}
else if(before.id===restoredContinuityRuntime.deployment){
 const getLogs=historicalProof.logs;
 restoredContinuityRuntimeProof=await verifyContinuityRollback(before,version,get,getLogs);const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during exact owned rollback verification');decision='retain';
}
else if(before.id===restoredPassportRuntime.deployment){
 const getLogs=historicalProof.logs;
 restoredPassportRuntimeProof=await verifyPassportRollback(before,version,get,getLogs);const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during exact owned rollback verification');decision='retain';
}
else if(before.id===restoredToolRuntime.deployment){
 const getLogs=historicalProof.logs;
 restoredToolRuntimeProof=await verifyToolRollback(before,version,get,getLogs);const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during exact owned rollback verification');decision='retain';
}
else if(before.id===restoredLaterRuntime.deployment){
 const getLogs=historicalProof.logs;
 restoredLaterRuntimeProof=await verifyRestoredLaterRuntime(before,version,get,getLogs);
 const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during restoration ownership verification');
 decision='retain';
}
else if(before.id===TREATMENT_ROLLBACK.deployment){
 const getLogs=historicalProof.logs;
 const priorActive=JSON.parse(wrangler('deployments','list','--json')).find(d=>d.id===TREATMENT_ROLLBACK.previousDeployment);assert(priorActive,'Exact previous contact rollback metadata unavailable');
 ownedProof=await verifyMyTreatmentRollback(before,version,priorActive,get,getLogs);
 const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during exact My Treatment rollback verification');decision='retain';
}
else if(before.id===CONTACT_ROLLBACK.deployment){
 const getLogs=historicalProof.logs;
 ownedProof=await verifyContactRollback(before,version,get,getLogs);
 const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during exact contact rollback verification');decision='retain';
}
else if(activeVersion===technicalRecovery.version){
 const getLogs=historicalProof.logs;
 technicalProof=await verifyTechnicalCancelledRuntime(before,get,getLogs);decision='restore';
}
else if([unattributedRuntimeRecovery.version,laterUnattributedRuntimeRecovery.version].includes(activeVersion)){
 const accountApi='https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID;
 const providerGet=async url=>{const r=await fetch(url,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Provider read failed '+new URL(url).pathname+' HTTP '+r.status);return r;};
 const providerVersion=(await (await providerGet(accountApi+'/workers/scripts/shift-core/versions/'+activeVersion)).json()).result;
 const exact=(await (await providerGet(accountApi+'/workers/workers/shift-core/versions/'+activeVersion+'?include=modules')).json()).result;
 assert.equal(exact.id,activeVersion,'Specific-version API returned the wrong runtime');assert(Array.isArray(exact.modules)&&exact.modules.length>0,'Specific-version API returned no modules');
 const modules=exact.modules.map(file=>{assert.equal(typeof file.name,'string');assert.equal(typeof file.content_base64,'string');const bytes=Buffer.from(file.content_base64,'base64');return{module:file.name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}});
 const getLogs=historicalProof.logs;
 if(activeVersion===laterUnattributedRuntimeRecovery.version)laterUnattributedProof=await verifyLaterUnattributedRuntime(before,version,providerVersion,modules,get,getLogs);
 else unattributedProof=await verifyUnattributedRuntime(before,version,providerVersion,modules,get,getLogs);
 decision='restore';
}
else if(activeVersion===SUPPORT_RUNTIME.version){
 ownerCapturedProof=await verifySupportRuntime(before,version);
 const unchanged=active();assert.deepEqual({id:unchanged.id,versions:unchanged.versions},{id:before.id,versions:before.versions},'Serving support runtime moved during read-only reconstruction');
 decision='retain';
}
else if(activeVersion===OWNER_RUNTIME.version){
 ownerCapturedProof=await verifyOwnerRuntime(before,version);
 const unchanged=active();assert.deepEqual({id:unchanged.id,versions:unchanged.versions},{id:before.id,versions:before.versions},'Owner runtime moved during read-only reconstruction');
 decision='retain';
}
else if([recovery.verified,recovery.unverified].includes(before.versions?.[0]?.version_id)){
 ({verified,failed}=await readLegacyRecoveryProof(before,recovery,get));decision=recoveryDecision(before,failed,verified);
}
else{
 if(activeVersion===tabletRuntime.version){
  const getLogs=historicalProof.logs;
  ownedProof=await verifyTabletRuntime(before,version,readFileSync(TABLET_RUNTIME_RECEIPT,'utf8'),get,getLogs);
 }
 if(activeVersion===SITEWIDE_VERSION){
  const c=JSON.parse(readFileSync('shift-coach/release-manifest.json','utf8')).sitewideSeoComposition;
  const receiptText=readFileSync('docs/seo-sitewide-live-receipt-20261006.json','utf8');
  const getLogs=historicalProof.logs;
  ownedProof=await verifySitewideRuntime(before,c,receiptText,get,getLogs);
 }
 if(activeVersion===catalogueRuntime.version){
  const receipt=JSON.parse(readFileSync('docs/catalogue-benefits-live-receipt-20261006.json','utf8'));
  const getLogs=historicalProof.logs;
  if(await verifyCatalogueBaseline(before,get,getLogs,receipt,JSON.parse(readFileSync('docs/catalogue-runtime-rollback-37462426049.json','utf8'))))ownedProof={run:catalogueRuntime.run,source:catalogueRuntime.source,version:catalogueRuntime.version,deployment:before.id,evidenceKind:'original-hosted-proof-plus-independent-live-receipt-and-exact-rollback'};
 }
 if(before.versions?.[0]?.version_id===articleRuntime.version){
  const run=await get('/actions/runs/'+articleRuntime.run),jobs=await get('/actions/runs/'+articleRuntime.run+'/jobs');
  const job=(jobs.jobs||[]).find(j=>j.name==='release'&&j.conclusion==='success');
  if(verifiedArticleRuntime(before,run,job))ownedProof={run:run.id,source:run.head_sha,version:articleRuntime.version};
 }
 ownedProof=ownedProof||await findVerifiedOwnedPromotion();
 assert(ownedProof,'Unknown runtime has no exact successful owned-deployment proof; stop without rollback');
 decision='retain';
}

if(decision==='restore'){
 if(laterUnattributedProof||unattributedProof){
  const p=laterUnattributedProof?laterUnattributedRuntimeRecovery:unattributedRuntimeRecovery;
  const unchanged=active();assert.deepEqual({id:unchanged.id,versions:unchanged.versions},{id:before.id,versions:before.versions},'Runtime moved before exact unattributed-runtime recovery');
  console.log(wrangler('rollback',p.verifiedVersion,'--message','Restore exact successful predecessor of unattributed runtime observed by read-only run '+p.run+'; no data rollback'));
  const after=active();assert.equal(after.versions?.length,1);assert.equal(after.versions[0].percentage,100);assert.equal(after.versions[0].version_id,p.verifiedVersion,'Unattributed-runtime recovery did not restore the exact successful predecessor');
 }else if(technicalProof){
  const unchanged=active();assert.deepEqual({id:unchanged.id,versions:unchanged.versions},{id:before.id,versions:before.versions},'Runtime moved before exact SEO recovery');
  console.log(wrangler('rollback',technicalRecovery.verifiedVersion,'--message','Restore exact successful predecessor of cancelled SEO run 37512509413; no data rollback'));
  const after=active();assert.equal(after.versions?.length,1);assert.equal(after.versions[0].percentage,100);assert.equal(after.versions[0].version_id,technicalRecovery.verifiedVersion,'SEO recovery did not restore the exact successful predecessor');
 }else{
 console.log(wrangler('rollback',recovery.verified,'--message','Restore verified runtime after evidenced cancelled production run '+recovery.run));
 assert.equal(recoveryDecision(active(),failed,verified),'retain','Recovery did not restore the verified runtime');
 }
}
mkdirSync('b1-runtime-release',{recursive:true});writeFileSync('b1-runtime-release/cancelled-release-recovery.json',JSON.stringify({at:new Date().toISOString(),decision,run:acceptedCurrentServingProof?acceptedCurrentServingProof.run:verifiedOwnedRollbackProof?verifiedOwnedRollbackProof.failedRun:restoredMaleObesityRuntimeProof?restoredMaleObesityRuntimeProof.run:restoredContinuityRuntimeProof?restoredContinuityRuntime.run:restoredPassportRuntimeProof?restoredPassportRuntime.run:restoredToolRuntimeProof?restoredToolRuntime.run:restoredLaterRuntimeProof?restoredLaterRuntime.run:ownerCapturedProof?null:laterUnattributedProof?laterUnattributedRuntimeRecovery.run:unattributedProof?unattributedRuntimeRecovery.run:technicalProof?technicalRecovery.run:recovery.run,from:before.versions[0].version_id,to:verifiedOwnedRollbackProof?verifiedOwnedRollbackProof.version:restoredMaleObesityRuntimeProof?restoredMaleObesityRuntimeProof.version:restoredContinuityRuntimeProof?restoredContinuityRuntimeProof.version:restoredPassportRuntimeProof?restoredPassportRuntimeProof.version:restoredToolRuntimeProof?restoredToolRuntimeProof.version:restoredLaterRuntimeProof?restoredLaterRuntimeProof.verifiedVersion:ownerCapturedProof?ownerCapturedProof.version:laterUnattributedProof?laterUnattributedRuntimeRecovery.verifiedVersion:unattributedProof?unattributedRuntimeRecovery.verifiedVersion:technicalProof?technicalRecovery.verifiedVersion:ownedProof?.version||recovery.verified,verifiedRun:verifiedOwnedRollbackProof?verifiedOwnedRollbackProof.predecessorRun:restoredMaleObesityRuntimeProof?restoredMaleObesityRuntimeProof.verifiedRun:restoredContinuityRuntimeProof?restoredContinuityRuntimeProof.verifiedRun:restoredPassportRuntimeProof?restoredPassportRuntimeProof.verifiedRun:restoredToolRuntimeProof?restoredToolRuntimeProof.verifiedRun:restoredLaterRuntimeProof?restoredLaterRuntimeProof.verifiedRun:ownerCapturedProof?null:laterUnattributedProof?laterUnattributedRuntimeRecovery.verifiedRun:unattributedProof?unattributedRuntimeRecovery.verifiedRun:technicalProof?technicalRecovery.verifiedRun:ownedProof?.run||recovery.verifiedRun,ownedProof:ownedProof||null,...(acceptedCurrentServingProof?{acceptedCurrentServingProof}:{}),...(restoredMaleObesityRuntimeProof?{restoredMaleObesityRuntimeProof}:{}),...(ownerCapturedProof?{ownerCapturedProof}:{}),...(restoredLaterRuntimeProof?{restoredLaterRuntimeProof}:{}),...(restoredToolRuntimeProof?{restoredToolRuntimeProof}:{}),...(restoredPassportRuntimeProof?{restoredPassportRuntimeProof}:{}),...(restoredContinuityRuntimeProof?{restoredContinuityRuntimeProof}:{}),...(technicalProof?{technicalRecovery:technicalProof}:{}),...(unattributedProof?{unattributedRuntimeRecovery:unattributedProof}:{}),...(laterUnattributedProof?{laterUnattributedRuntimeRecovery:laterUnattributedProof}:{}),...(verifiedOwnedRollbackProof?{verifiedOwnedRollbackProof}:{}),customerRecordsRead:0,dataChanged:false},null,2));
console.log('PASS exact cancelled-release recovery: '+decision+' verified runtime; no data rollback');

