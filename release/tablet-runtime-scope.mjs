import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const TABLET_RUNTIME_BASE='24b7ed9ce1064c4d60fbd41ab0173bfe4f4d607c';
export const TABLET_RUNTIME_PATHS=["docs/tablet-guidance-runtime-receipt-20261006.json","my-timber-pwa/service-worker.mjs","release/app-scope.mjs","release/book-voice-scope.mjs","release/fit-300-scope.mjs","release/footer-scope.mjs","release/seo-follow-through-scope.mjs","release/tablet-runtime-scope.mjs","shift-coach/recover-cancelled-release.mjs","shift-coach/release-contract.mjs","tests/inline-tool-service-worker.test.mjs","tests/tablet-runtime-release.test.mjs","tests/watch-ownership-release.test.mjs"];
export const tabletRuntime=Object.freeze({source:'25ead1b54126e5596db11845efbcf3b888fc5a31',deployment:'b6fa58e8-4953-46ca-8983-06dff8a53fd2',version:'2dd57a8f-8597-4f5c-ab5b-86d6e037a8f7',run:37531509514,job:112501762193,proofSource:'a9707c463f7681d49068fa0319418e5630510ba9',artifact:11444592383,digest:'sha256:04faf329155c27330b6410588fa672e7bfe7340dcaea470f567f9f90e0f1453b'});
const hash=s=>createHash('sha256').update(s).digest('hex');
export function validateTabletRuntimeComposition(c,read=(ref,p)=>execFileSync('git',['rev-parse',ref+':'+p],{encoding:'utf8'}).trim()){
 if(!c)return;
 assert.equal(c.proof,'EXACT_TABLET_RUNTIME_RETAIN_AND_PHOTO_GATES_V1');assert.equal(c.base,TABLET_RUNTIME_BASE);assert.deepEqual(c.paths,TABLET_RUNTIME_PATHS);assert.match(c.source,/^[a-f0-9]{40}$/);
 execFileSync('git',['merge-base','--is-ancestor',c.base,c.source]);execFileSync('git',['merge-base','--is-ancestor',c.source,'HEAD']);
 assert.deepEqual(execFileSync('git',['diff','--name-only',c.base,c.source],{encoding:'utf8'}).trim().split('\n').filter(Boolean).sort(),TABLET_RUNTIME_PATHS,'Exact runtime retain/source comparison repair required');
 for(const p of c.paths)assert.equal(read('HEAD',p),read(c.source,p),'Coaching release source drift (exact tablet runtime retain): '+p);
}
export function tabletRuntimeIdentity(active,version,run,job,artifact,receipt){
 const p=tabletRuntime;
 assert.equal(hash(JSON.stringify(receipt)),"766ecbfcf930112b5b67e3c418a50020aeec4c5854864d25d860a694cc5067ee",'Exact hosted artifact receipt changed');
 assert.equal(active?.id,p.deployment);assert.deepEqual(active.versions,[{version_id:p.version,percentage:100}]);
 assert.equal(version?.id,p.version);assert.equal(version.metadata?.created_on,receipt.createdOn);assert.equal(version.metadata?.source,'wrangler');assert.equal(version.annotations?.['workers/triggered_by'],'version_upload');
 assert.equal(version.annotations?.['workers/message'],'Tablet guidance source '+p.source+'; hosted proof '+p.run);
 assert.equal(run?.id,p.run);assert.equal(run.head_sha,p.proofSource);assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');assert.equal(run.head_branch,'codex/tablet-guidance-20261006');assert.equal(run.event,'push');assert.equal(run.path,'.github/workflows/practical-guides-proof.yml');
 assert.equal(job?.id,p.job);assert.equal(job.run_id,p.run);assert.equal(job.name,'verify');assert.equal(job.status,'completed');assert.equal(job.conclusion,'success');
 assert.equal(artifact?.id,p.artifact);assert.equal(artifact.digest,p.digest);assert.equal(artifact.expired,false);assert.equal(artifact.workflow_run?.id,p.run);assert.equal(artifact.workflow_run?.head_sha,p.proofSource);
 return true;
}
export function tabletRuntimeBody(row,input){
 let body=String(input);if(!row.normalization)return body;
 assert.equal(row.normalization.kind,'exact_practical_style_order_v1');assert(['/foundayo','/comparisons/medications/wegovy-injection-vs-tablets'].includes(row.path));assert.equal(row.protected,false);
 const styles=[...body.matchAll(/<style data-practical-guide-style>[\s\S]*?<\/style>/g)];assert.equal(styles.length,1);assert.equal(hash(styles[0][0]),row.normalization.styleSha256,'Reviewed practical style changed');assert.equal(body.split('</head>').length,2);
 return body.replace(styles[0][0],'').replace('</head>',styles[0][0]+'</head>');
}
export async function verifyTabletGuidanceRuntime(active,version,get,readLive,receipt){
 const p=tabletRuntime,run=await get('/actions/runs/'+p.run),jobs=await get('/actions/runs/'+p.run+'/jobs'),artifact=await get('/actions/artifacts/'+p.artifact);
 tabletRuntimeIdentity(active,version,run,jobs.jobs?.find(j=>j.id===p.job),artifact,receipt);
 execFileSync('git',['merge-base','--is-ancestor',p.proofSource,p.source]);assert.deepEqual(execFileSync('git',['diff','--name-only',p.proofSource,p.source],{encoding:'utf8'}).trim().split('\n'),['shift-coach/release-manifest.json'],'Hosted source and isolated runtime differ outside metadata');
 for(const row of receipt.responses){const response=await readLive(row.path);assert.equal(response.status,200);assert.equal(hash(tabletRuntimeBody(row,response.body)),row.sha256,'Complete hosted candidate/public runtime drift: '+row.path);}
 return {run:p.run,source:p.source,version:p.version,deployment:p.deployment,evidenceKind:'exact-isolated-runtime-successful-hosted-artifact-and-16-live-bodies'};
}
