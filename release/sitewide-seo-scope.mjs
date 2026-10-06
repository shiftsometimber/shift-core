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
export async function verifySitewideRuntime(active,c,receiptText,get,getLogs){
 validateSitewideComposition(c);assertSitewideLiveReceipt(JSON.parse(receiptText));
 assert.equal(active.id,SITEWIDE_DEPLOYMENT);assert.equal(active.versions?.length,1);
 assert.equal(active.versions[0].version_id,SITEWIDE_VERSION);assert.equal(active.versions[0].percentage,100);
 const p=c.hostedProof;assert(p,'Successful independent hosted SEO proof required');
 assert(Number.isSafeInteger(p.run)&&p.run>0);assert(Number.isSafeInteger(p.job)&&p.job>0);assert.match(p.source,/^[a-f0-9]{40}$/);
 const run=await get('/actions/runs/'+p.run),jobs=await get('/actions/runs/'+p.run+'/jobs');
 assert.equal(run.id,p.run);assert.equal(run.head_sha,p.source);assert.equal(run.path,SITEWIDE_WORKFLOW);
 assert.equal(run.head_branch,SITEWIDE_BRANCH);assert.equal(run.event,'push');assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');
 const job=jobs.jobs.find(j=>j.id===p.job);assert(job);assert.equal(job.name,'verify');assert.equal(job.status,'completed');assert.equal(job.conclusion,'success');
 const marker='SITEWIDE_SEO_PROOF '+JSON.stringify(sitewideProofMarker(receiptText));
 assert((await getLogs(p.job)).split('\n').some(line=>line.endsWith(marker)),'Exact hosted SEO proof marker absent');
 return {run:p.run,source:p.source,version:SITEWIDE_VERSION,deployment:SITEWIDE_DEPLOYMENT,evidenceKind:'owner-approved-manual-deployment-plus-independent-hosted-and-live-proof'};
}
