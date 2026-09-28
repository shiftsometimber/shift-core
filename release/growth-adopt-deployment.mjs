// Verify the original release; restore only its exact version after the evidenced harness-only rollback.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {writeFileSync,appendFileSync,mkdirSync} from 'node:fs';
const RELEASE='2ac10333105ae3836d135ce188d6b82f3f463ac2',VERSION='1663cf19-757f-4b67-b3ca-4fdd1fe9ba53';
const metadata=new Set(['.github/workflows/cloudflare-production-promote.yml','.github/workflows/my-timber-pwa-production-release.yml','release/growth-adopt-deployment.mjs','release/growth-preflight.mjs','release/growth-public-baseline.json','release/growth-scope.mjs','docs/growth-review/live-release-checkpoint-20260928.md']);
const changed=execFileSync('git',['diff','--name-only',RELEASE,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
assert(changed.every(p=>metadata.has(p)),'Already-deployed verification must not include application changes');
const get=async path=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core'+path,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Deployment receipt HTTP '+r.status);return r};
const run=await (await get('/actions/runs/36409933320')).json();assert.equal(run.head_sha,RELEASE);assert.equal(run.conclusion,'success');
const wrangler=(...args)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config','wrangler.jsonc'],{encoding:'utf8',maxBuffer:4*1024*1024});
const current=()=>JSON.parse(wrangler('deployments','list','--json')).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
const active=current();
assert.equal(active.versions.length,1);assert.equal(active.versions[0].percentage,100);
const needsRestore=active.versions[0].version_id!==VERSION;
if(needsRestore){
 assert.equal(active.versions[0].version_id,'a202deda-a0fa-42bb-bd56-db805696665b','Unknown runtime: refuse restoration');
 const failed=await(await get('/actions/runs/36412818115')).json();assert.equal(failed.head_sha,'3fbec17950e54a4644d71e5680bcfe0ad60b702c');assert.equal(failed.conclusion,'failure');
 const jobs=await(await get('/actions/runs/36412818115/jobs')).json();const job=jobs.jobs.find(j=>j.id===108896797462);assert(job);
 assert.deepEqual(job.steps.filter(s=>s.conclusion==='failure').map(s=>s.name),['Verify live AI knowledge, response timing and exact reviewed chat assets']);
 assert(job.steps.some(s=>s.name==='Restore the captured runtime if a post-deployment gate failed'&&s.conclusion==='success'));
 const log=await(await get('/actions/jobs/108896797462/logs')).text();assert(log.includes("ENOENT: no such file or directory, open 'b1-runtime-release/shift-ai-public-index.json'"),'Failure was not the evidenced missing index receipt');
}
mkdirSync('b1-runtime-release',{recursive:true});
const archive=Buffer.from(await (await get('/actions/artifacts/10964210984/zip')).arrayBuffer());
assert.equal(createHash('sha256').update(archive).digest('hex'),'75962c74fdcb3e1a53a5edf4c63c27fdb62cbebbd7c7ed6c4dadcd5995fc70b1');
writeFileSync('b1-runtime-release/original-pwa-receipt.zip',archive);
const rollback=execFileSync('unzip',['-p','b1-runtime-release/original-pwa-receipt.zip','pwa-deployment-before.json']);
const previous=JSON.parse(rollback);assert(Array.isArray(previous)&&previous.length);writeFileSync('deployment-before.json',rollback);
// Capture actual existing published knowledge with aggregate SELECTs; do not rebuild or write the index.
const sql="SELECT COUNT(*) AS [indexed],(SELECT COUNT(*) FROM ai_knowledge_chunks c JOIN ai_knowledge_documents d ON d.id=c.document_id WHERE d.category='shift_public_site' AND d.status='published_site') chunks FROM ai_knowledge_documents WHERE category='shift_public_site' AND status='published_site'";
const result=JSON.parse(wrangler('d1','execute','DB','--remote','--json','--command',sql));assert(result.every(r=>r.success));const index=result.flatMap(r=>r.results||[])[0];assert(index.indexed>=50);assert(index.chunks>=index.indexed);
writeFileSync('b1-runtime-release/shift-ai-public-index.json',JSON.stringify({at:new Date().toISOString(),source:process.env.GITHUB_SHA,...index,method:'Read-only aggregate of existing published-site index',customerRecordsRead:0,databaseWrites:0},null,2));
if(process.argv[2]==='restore'){
 assert(needsRestore,'Exact approved release is already active; refuse another deployment');
 wrangler('versions','deploy',VERSION+'@100%','--yes','--message','Restore exact approved growth version after correcting missing verification evidence');
 const restored=current();assert.equal(restored.versions.length,1);assert.equal(restored.versions[0].percentage,100);assert.equal(restored.versions[0].version_id,VERSION);
 writeFileSync('b1-runtime-release/growth-restoration.json',JSON.stringify({at:new Date().toISOString(),version:VERSION,deployment:restored.id,sourceRun:run.id,restoredExistingVersion:true,newVersionUploaded:false,customerDataRestored:false},null,2));
 console.log('PASS restored the exact previously approved version; no build, new version or data restoration');
 process.exit(0);
}
writeFileSync('b1-runtime-release/existing-growth-deployment.json',JSON.stringify({release:RELEASE,version:VERSION,sourceRun:run.id,activeDeployment:active.id,verificationCommit:process.env.GITHUB_SHA,at:new Date().toISOString(),deploymentPerformedByThisRun:false,rollbackSource:'Original PWA deployment-before artifact'},null,2));
appendFileSync(process.env.GITHUB_OUTPUT,'already_deployed=true\n');
appendFileSync(process.env.GITHUB_OUTPUT,'restore_needed='+needsRestore+'\n');
console.log('PASS authenticated release and rollback receipt, known active runtime and existing public index; restoration needed: '+needsRestore);
