import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const SITEWIDE_BASE='cd2f16af13097f6987087d1cf16b007f7114f017';
export const SITEWIDE_PAYLOAD='26e9a5c004d5f580b5c4587035cd39117d966c6b';
export const SITEWIDE_BRANCH='seo/full-programme-review-20261006';
export const SITEWIDE_WORKFLOW='.github/workflows/sitewide-seo-proof.yml';
export const SITEWIDE_VERSION='d6a715ef-1940-4236-91fc-c25b064ca6f1';
export const SITEWIDE_DEPLOYMENT='181d1800-a5aa-44bd-8eed-36fa549c641b';
export const SITEWIDE_PAYLOAD_PATHS=["public-seo-programme.mjs","shift-coach/worker.mjs","tests/fixtures/public-seo-programme/anger-pause-and-support.html","tests/fixtures/public-seo-programme/food-noise-worked-situations.html","tests/fixtures/public-seo-programme/food-that-fits-your-week.html","tests/fixtures/public-seo-programme/loneliness-small-reconnection.html","tests/fixtures/public-seo-programme/low-mood-first-conversation.html","tests/fixtures/public-seo-programme/maintenance-conversation-plan.html","tests/fixtures/public-seo-programme/plateau-review-example.html","tests/fixtures/public-seo-programme/stress-pressure-example.html","tests/public-seo-programme.test.mjs"];
export const SITEWIDE_MAINTENANCE_PATHS=['.github/workflows/sitewide-seo-proof.yml','docs/seo-sitewide-live-receipt-20261006.json','release/fit-300-scope.mjs','release/growth-adopt-deployment.mjs','release/sitewide-seo-scope.mjs','scripts/verify-sitewide-seo.mjs','shift-coach/recover-cancelled-release.mjs','shift-coach/release-contract.mjs','tests/sitewide-seo-release.test.mjs'];
export function validateSitewideComposition(c){
 assert(c,'Exact site-wide SEO composition required');
 assert.equal(c.proof,'SITEWIDE_SEO_OWNER_APPROVED_V2');
 assert.equal(c.base,SITEWIDE_BASE);assert.equal(c.payloadSource,SITEWIDE_PAYLOAD);
 assert.deepEqual(c.payloadPaths,SITEWIDE_PAYLOAD_PATHS);
 assert.deepEqual(c.maintenancePaths,SITEWIDE_MAINTENANCE_PATHS);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 return c;
}
export function sitewidePinnedRef(c,path){
 if(!c)return null;validateSitewideComposition(c);
 return c.payloadPaths.includes(path)?c.payloadSource:c.maintenancePaths.includes(path)?c.maintenanceSource:null;
}
// Only the named maintenance files have historical HEAD comparisons. Their
// current bytes remain independently required by the exact immutable pin above.
export function sitewideHistoricalRead(read,c){
 if(!c)return read;validateSitewideComposition(c);
 return (ref,path)=>read(ref==='HEAD'&&(c.maintenancePaths.includes(path)||path==='shift-coach/worker.mjs')?SITEWIDE_BASE:ref,path);
}
export function verifySitewideHistory(c){
 if(!c)return;validateSitewideComposition(c);
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 git('merge-base','--is-ancestor',SITEWIDE_PAYLOAD,'HEAD');
 git('merge-base','--is-ancestor',c.maintenanceSource,'HEAD');
 assert.deepEqual(git('diff','--name-only',SITEWIDE_BASE,SITEWIDE_PAYLOAD).split('\n').filter(Boolean).sort(),SITEWIDE_PAYLOAD_PATHS);
 assert.deepEqual(git('diff','--name-only',SITEWIDE_PAYLOAD,c.maintenanceSource).split('\n').filter(Boolean).sort(),[...SITEWIDE_MAINTENANCE_PATHS,'shift-coach/release-manifest.json'].sort(),'Exact SEO maintenance source scope required');
}
export function assertSitewideLiveReceipt(r){
 assert.equal(r.status,'deployed_and_verified');assert.equal(r.source,SITEWIDE_PAYLOAD);
 assert.equal(r.baselineSource,SITEWIDE_BASE);assert.equal(r.version,SITEWIDE_VERSION);
 assert.equal(r.deployment,SITEWIDE_DEPLOYMENT);assert.equal(r.trafficPercentage,100);
 assert.deepEqual(r.bindingsChanged,[]);
 for(const key of ['sitemapChanged','homepageChanged','startHereChanged'])assert.equal(r[key],false);
 assert.equal(r.d1Writes,0);assert.equal(r.outgoingMessages,0);
 assert.equal(r.tests.pass,41);assert.equal(r.tests.fail,0);
 assert.equal(r.fullHandler.length,21);assert.equal(r.fullHandler.filter(x=>!x.protected).length,8);
 for(const x of r.fullHandler)assert.equal(x.exactTransform,true);
 assert.equal(r.liveProof.pass,true);assert.equal(r.liveProof.responses,21);
 assert.equal(r.liveProof.owned,8);assert.equal(r.liveProof.protected,13);
 assert.equal(r.liveProof.checks.length,21);
 assert.deepEqual(r.liveProof.checks.map(x=>x.path),r.fullHandler.map(x=>x.path));
 assert.equal(new Set(r.liveProof.checks.map(x=>x.path)).size,21);
 for(const x of r.liveProof.checks){assert.equal(x.exact,true);assert.equal(x.robotsUnchanged,true);assert.match(x.sha256,/^[a-f0-9]{64}$/);}
 assert.equal(r.liveLayouts.length,16);for(const x of r.liveLayouts)assert.equal(x.pass,true);
 return r;
}
export function sitewideProofMarker(receiptText){
 const r=assertSitewideLiveReceipt(JSON.parse(receiptText));
 return {kind:'sitewide_seo_proof',payloadSource:SITEWIDE_PAYLOAD,runtimeVersion:SITEWIDE_VERSION,deployment:SITEWIDE_DEPLOYMENT,receiptSha256:createHash('sha256').update(receiptText).digest('hex'),fullHandlerResponses:21,liveResponses:21,databaseWrites:0};
}
export const SITEWIDE_ROLLBACK=Object.freeze({deployment:'6c2945ce-f9bd-4d80-84b1-f5f5a841c4ec',createdOn:'2026-10-06T13:28:49.849245Z',run:37469812171,job:112290194252,source:'34e74fdf590930504af55a6483d5bb72cf042dda',failedDeployment:'aaac9c6c-5275-476d-b87b-3f3fde25ab52',failedVersion:'00467e5c-09d1-4244-91da-b56198e7b262'});
export const SITEWIDE_SECOND_ROLLBACK=Object.freeze({deployment:'c2f4c5da-d3a1-4b4e-b8d2-08eb426f7a05',createdOn:'2026-10-06T14:50:30.100744Z',run:37481087125,job:112329266723,source:'890458eb37caf13c13173f6bd94c3f3c25714fec',failedDeployment:'6fe4e99c-ec66-40b7-9371-7d1bf6b3375f',failedVersion:'e4d59c68-5502-4d09-aec6-02747f73968f'});
export const SITEWIDE_THIRD_ROLLBACK=Object.freeze({deployment:'bc9db724-07f6-49e8-b467-87a0a71900c8',createdOn:'2026-10-06T15:09:32.899289Z',run:37484046906,job:112339578967,source:'df16996db4a079e58616785cef4535f91cde3c6c',failedDeployment:'571f1c98-0631-4097-987e-7110b22e5bff',failedVersion:'e0f676b4-2227-4769-9522-87b6dcc064ba'});
export const SITEWIDE_FOURTH_ROLLBACK=Object.freeze({deployment:'0f6c07d9-b110-4057-a3c0-38c91d740014',createdOn:'2026-10-06T15:26:12.845759Z',run:37486314695,job:112347317570,source:'f30d9111387fd8fa438d8ece9417336ec7d3e297',failedDeployment:'f450c539-4792-4fa6-8df5-8375d8950a26',failedVersion:'26bb8fff-bba4-4d8a-9630-da5d5b433e92'});
export const SITEWIDE_FIFTH_ROLLBACK=Object.freeze({deployment:'5b3c9c89-f3ea-4ac0-8a2e-9365f03ddfe6',createdOn:'2026-10-06T16:26:34.975028Z',run:37494291979,job:112374848119,source:'f1402540ba6dbc61a6bb1145ef763d564d82873c',failedDeployment:'2a40818f-9ab4-4cae-a2bc-27e2d7620aa9',failedVersion:'936ec8ca-be37-4ab3-a41e-9264f3b632f5'});
export const SITEWIDE_SIXTH_ROLLBACK=Object.freeze({deployment:'1e5809cf-e2a3-45e4-a516-5bdb0a4605ed',createdOn:'2026-10-06T17:01:09.632022Z',run:37498308871,runAttempt:2,job:112389303071,jobAttempt:1,source:'21c16b597eead3c26fdf1c0efb2a6bb886ca9601',failedDeployment:'9e0f0764-76e2-422f-8fbb-78aa0b0007cb',failedVersion:'c36e71f3-8173-4153-b2fc-3fd96180710b',failureStep:'Verify exact PWA assets, full-account entry and device privacy on live traffic',failureEvidence:["my-timber-pwa/verify-live.mjs:14:10","code: 'ECONNRESET'"]});
export async function verifySitewideRollback(active,get,getLogs){
 const p=[SITEWIDE_ROLLBACK,SITEWIDE_SECOND_ROLLBACK,SITEWIDE_THIRD_ROLLBACK,SITEWIDE_FOURTH_ROLLBACK,SITEWIDE_FIFTH_ROLLBACK,SITEWIDE_SIXTH_ROLLBACK].find(x=>x.deployment===active.id)||SITEWIDE_ROLLBACK;
 if(p===SITEWIDE_SIXTH_ROLLBACK)await verifySitewideRollback({id:SITEWIDE_FIFTH_ROLLBACK.deployment,created_on:SITEWIDE_FIFTH_ROLLBACK.createdOn,versions:[{version_id:SITEWIDE_VERSION,percentage:100}]},get,getLogs);
 if(p===SITEWIDE_FIFTH_ROLLBACK)await verifySitewideRollback({id:SITEWIDE_FOURTH_ROLLBACK.deployment,created_on:SITEWIDE_FOURTH_ROLLBACK.createdOn,versions:[{version_id:SITEWIDE_VERSION,percentage:100}]},get,getLogs);
 if(p===SITEWIDE_FOURTH_ROLLBACK)await verifySitewideRollback({id:SITEWIDE_THIRD_ROLLBACK.deployment,created_on:SITEWIDE_THIRD_ROLLBACK.createdOn,versions:[{version_id:SITEWIDE_VERSION,percentage:100}]},get,getLogs);
 if(p===SITEWIDE_THIRD_ROLLBACK)await verifySitewideRollback({id:SITEWIDE_SECOND_ROLLBACK.deployment,created_on:SITEWIDE_SECOND_ROLLBACK.createdOn,versions:[{version_id:SITEWIDE_VERSION,percentage:100}]},get,getLogs);
 if(p===SITEWIDE_SECOND_ROLLBACK)await verifySitewideRollback({id:SITEWIDE_ROLLBACK.deployment,created_on:SITEWIDE_ROLLBACK.createdOn,versions:[{version_id:SITEWIDE_VERSION,percentage:100}]},get,getLogs);
 const previous=p===SITEWIDE_SIXTH_ROLLBACK?SITEWIDE_FIFTH_ROLLBACK.deployment:p===SITEWIDE_FIFTH_ROLLBACK?SITEWIDE_FOURTH_ROLLBACK.deployment:p===SITEWIDE_FOURTH_ROLLBACK?SITEWIDE_THIRD_ROLLBACK.deployment:p===SITEWIDE_THIRD_ROLLBACK?SITEWIDE_SECOND_ROLLBACK.deployment:p===SITEWIDE_SECOND_ROLLBACK?SITEWIDE_ROLLBACK.deployment:SITEWIDE_DEPLOYMENT;assert.equal(active.id,p.deployment,'Unknown SEO rollback deployment');assert.equal(active.created_on,p.createdOn,'Exact SEO rollback timestamp required');
 assert.equal(active.versions?.length,1);assert.equal(active.versions[0].version_id,SITEWIDE_VERSION);assert.equal(active.versions[0].percentage,100);
 const run=await get('/actions/runs/'+p.run),jobs=await get('/actions/runs/'+p.run+(p.jobAttempt?'/attempts/'+p.jobAttempt:'')+'/jobs');
 assert.equal(run.id,p.run);assert.equal(run.head_sha,p.source);assert.equal(run.path,'.github/workflows/cloudflare-production-promote.yml');assert.equal(run.head_branch,'main');assert.equal(run.event,'push');assert.equal(run.status,'completed');assert.equal(run.conclusion,'failure');
 const job=jobs.jobs.find(j=>j.id===p.job);assert(job);assert.equal(job.name,'promote');assert.equal(job.status,'completed');assert.equal(job.conclusion,'failure');assert.equal(job.run_id,p.run);
 if(p.runAttempt){assert.equal(run.run_attempt,p.runAttempt);assert.equal(job.run_attempt,p.jobAttempt);assert(job.steps?.some(step=>step.name===p.failureStep&&step.status==='completed'&&step.conclusion==='failure'),'Exact transient failure step absent');}
 const logs=await getLogs(p.job);
 const beforeLine=logs.split('\n').find(line=>line.includes('"kind":"runtime_recovery_observation"'));assert(beforeLine,'Exact pre-release SEO runtime observation absent');
 const beforeReceipt=JSON.parse(beforeLine.slice(beforeLine.indexOf('{')));assert.equal(beforeReceipt.deploymentId,previous);assert.equal(beforeReceipt.activeVersion,SITEWIDE_VERSION);assert.equal(beforeReceipt.release,p.source);
 const marker=logs.split('\n').find(line=>line.includes('"kind":"owned_runtime_deployment"'));assert(marker,'Owned deployment receipt absent');
 const receipt=JSON.parse(marker.slice(marker.indexOf('{')));
 assert.equal(receipt.source,p.source);assert.equal(String(receipt.run),String(p.run));assert.equal(receipt.deploymentId,p.failedDeployment);assert.equal(receipt.versionId,p.failedVersion);assert.equal(receipt.previousDeploymentId,previous);assert.equal(receipt.previousVersionId,SITEWIDE_VERSION);assert.equal(receipt.dataRestored,false);
 for(const evidence of p.failureEvidence||[])assert(logs.includes(evidence),'Exact transient failure evidence absent');
 assert(logs.includes('Worker Version '+SITEWIDE_VERSION+' has been deployed to 100% of traffic.'),'Successful exact rollback absent');
 assert(logs.includes('Current Version ID: '+SITEWIDE_VERSION),'Current rollback version absent');
 return {run:p.run,job:p.job,source:p.source,deployment:p.deployment,version:SITEWIDE_VERSION};
}

export async function verifySitewideRuntime(active,c,receiptText,get,getLogs){
 validateSitewideComposition(c);assertSitewideLiveReceipt(JSON.parse(receiptText));
 if(active.id!==SITEWIDE_DEPLOYMENT)await verifySitewideRollback(active,get,getLogs);assert.equal(active.versions?.length,1);
 assert.equal(active.versions[0].version_id,SITEWIDE_VERSION);assert.equal(active.versions[0].percentage,100);
 const p=c.hostedProof;assert(p,'Successful independent hosted SEO proof required');
 assert(Number.isSafeInteger(p.run)&&p.run>0);assert(Number.isSafeInteger(p.job)&&p.job>0);assert.match(p.source,/^[a-f0-9]{40}$/);
 const run=await get('/actions/runs/'+p.run),jobs=await get('/actions/runs/'+p.run+'/jobs');
 assert.equal(run.id,p.run);assert.equal(run.head_sha,p.source);assert.equal(run.path,SITEWIDE_WORKFLOW);
 assert.equal(run.head_branch,SITEWIDE_BRANCH);assert.equal(run.event,'push');assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');
 const job=jobs.jobs.find(j=>j.id===p.job);assert(job);assert.equal(job.name,'verify');assert.equal(job.status,'completed');assert.equal(job.conclusion,'success');
 const marker='SITEWIDE_SEO_PROOF '+JSON.stringify(sitewideProofMarker(receiptText));
 assert((await getLogs(p.job)).split('\n').some(line=>line.endsWith(marker)),'Exact hosted SEO proof marker absent');
 return {run:p.run,source:p.source,version:SITEWIDE_VERSION,deployment:active.id,evidenceKind:'owner-approved-manual-deployment-plus-independent-hosted-and-live-proof'};
}
