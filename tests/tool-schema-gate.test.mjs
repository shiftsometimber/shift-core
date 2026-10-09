import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {verifyToolRelease,releaseVerification} from '../release/tool-schema-gate.mjs';

const source='a'.repeat(40),run='123456';
const uid=n=>`${String(n).padStart(8,'0')}-1111-4111-8111-111111111111`;
const deployment=(n,v)=>({id:uid(n),created_on:`2026-10-09T09:0${n}:00Z`,versions:[{version_id:uid(v),percentage:100}]});
const previous=deployment(1,11),owned=deployment(2,22),restored=deployment(3,11);
const owner={kind:'owned_runtime_deployment',source,run,deploymentId:owned.id,versionId:uid(22),previousDeploymentId:previous.id,previousVersionId:uid(11)};
const page=url=>`<script type="application/ld+json">${JSON.stringify({'@type':'WebPage','@id':url+'#webpage',url,isAccessibleForFree:true})}</script>`;
const passing=async url=>new Response(page(url));
const fixture=(extra={})=>({stage:'deploy',source,run,inventory:async()=>[owned],fetchImpl:passing,readJson:path=>path==='deployment-before.json'?[previous]:path.endsWith('/rollback.json')?{restoredVersion:uid(11),deployment:restored.id}:owner,...extra});
test('passing gate records all nine checks and the exact deployment',async()=>{const r=await verifyToolRelease(fixture());assert.equal(r.status,'passed');assert.equal(r.checks.length,9);assert.equal(r.deployed.versionId,uid(22));assert.deepEqual(r.afterChecks,r.deployed);});
test('deliberate page regression is failed while other pages are checked',async()=>{const r=await verifyToolRelease(fixture({fetchImpl:async url=>url.endsWith('/tools/bmi')?new Response('<script type="application/ld+json">{"@type":"SoftwareApplication"}</script>'):passing(url)}));assert.equal(r.status,'failed');assert.equal(r.toolChecksVerified,false);assert.equal(r.checks.filter(x=>x.passed).length,8);assert.match(r.errors.join(' '),/Application markup returned/);});
test('failed transport is retained as an explicit failed check',async()=>{const r=await verifyToolRelease(fixture({fetchImpl:async()=>{throw Error('network unavailable')}}));assert.equal(r.checks.length,9);assert.equal(r.status,'failed');});
test('a newer release cannot be verified using this owner receipt',async()=>{const r=await verifyToolRelease(fixture({inventory:async()=>[deployment(4,44)]}));assert.equal(r.status,'failed');assert.equal(r.checks.length,0);});
test('deployment racing with the checks fails verification',async()=>{let n=0;const r=await verifyToolRelease(fixture({inventory:async()=>[n++?deployment(4,44):owned]}));assert.equal(r.checks.length,9);assert.equal(r.status,'failed');assert.match(r.errors.join(' '),/changed while/);});
test('source and run ownership remain mandatory',async()=>{for(const delta of [{source:'b'.repeat(40)},{run:'999'}])assert.equal((await verifyToolRelease(fixture(delta))).status,'failed');});
test('rollback checks verify captured runtime without restoring any data',async()=>{const r=await verifyToolRelease(fixture({stage:'rollback',inventory:async()=>[restored]}));assert.equal(r.status,'passed');assert.equal(r.deployed.versionId,uid(11));assert.equal(r.expected.versionId,uid(11));});
test('rollback checks fail if captured runtime is wrong, superseded, or pages fail',async()=>{for(const delta of [{inventory:async()=>[owned]},{inventory:async()=>[deployment(4,11)]},{fetchImpl:async()=>new Response('unavailable',{status:503})}])assert.equal((await verifyToolRelease(fixture({stage:'rollback',inventory:async()=>[restored],...delta}))).status,'failed');});
test('successful rollback never changes a failed release into a verified release',async()=>{const deploy=await verifyToolRelease(fixture()),rollback=await verifyToolRelease(fixture({stage:'rollback',inventory:async()=>[restored]}));assert.equal(releaseVerification({workflowStatus:'failure',source,run,deploy,rollback}).releaseVerified,false);assert.equal(releaseVerification({workflowStatus:'success',source,run,deploy,rollback}).releaseVerified,false);});
test('missing, skipped, incomplete or mismatched checks are never verified',async()=>{const deploy=await verifyToolRelease(fixture());assert.equal(releaseVerification({workflowStatus:'success',source,run,deploy}).releaseVerified,true);for(const delta of [{workflowStatus:'cancelled'},{deploy:null},{deploy:{...deploy,checks:deploy.checks.slice(1)}},{source:'b'.repeat(40)}])assert.equal(releaseVerification({workflowStatus:'success',source,run,deploy,...delta}).releaseVerified,false);});

test('actual workflow commands pass, fail, run guarded rollback and retain failed release using an isolated CLI double',()=>{
 const root=resolve('.'),dir=mkdtempSync(join(tmpdir(),'sst-tool-release-proof-'));
 mkdirSync(join(dir,'node_modules/wrangler/bin'),{recursive:true});mkdirSync(join(dir,'b1-runtime-release'));
 writeFileSync(join(dir,'deployment-before.json'),JSON.stringify([previous]));writeFileSync(join(dir,'b1-runtime-release/owned-runtime-deployment.json'),JSON.stringify(owner));
 writeFileSync(join(dir,'inventory.json'),JSON.stringify([owned]));
 writeFileSync(join(dir,'node_modules/wrangler/bin/wrangler.js'),`const fs=require('node:fs');const args=process.argv.slice(2);fs.appendFileSync('operations.jsonl',JSON.stringify(args)+'\\n');if(args[0]==='deployments'&&args[1]==='list')console.log(fs.readFileSync('inventory.json','utf8'));else if(args[0]==='rollback'&&args[1]===${JSON.stringify(uid(11))}){fs.writeFileSync('inventory.json',${JSON.stringify(JSON.stringify([restored]))});}else{throw Error('Forbidden command in safe proof: '+args.join(' '));}`);
 writeFileSync(join(dir,'fetch-fixture.mjs'),`globalThis.fetch=async url=>{if(!String(url).startsWith('https://shiftsometimber.co.uk/'))throw Error('Unexpected origin');if(process.env.DELIBERATE_FAILURE==='yes'&&String(url).endsWith('/tools/bmi'))return new Response('fixture failure',{status:503});return new Response('<script type="application/ld+json">'+JSON.stringify({'@type':'WebPage','@id':url+'#webpage',url,isAccessibleForFree:true})+'</script>')};`);
 const env={...process.env,GITHUB_REF:'refs/heads/main',GITHUB_SHA:source,GITHUB_RUN_ID:run,GITHUB_STEP_SUMMARY:join(dir,'summary.md'),CLOUDFLARE_API_TOKEN:'',CLOUDFLARE_ACCOUNT_ID:''};
 const command=(file,args=[],delta={})=>spawnSync(process.execPath,['--import',join(dir,'fetch-fixture.mjs'),join(root,file),...args],{cwd:dir,env:{...env,...delta},encoding:'utf8'});
 const passingRun=command('release/tool-schema-gate.mjs',['deploy']);assert.equal(passingRun.status,0,passingRun.stderr);
 assert.equal(JSON.parse(readFileSync(join(dir,'b1-runtime-release/tool-schema-deploy.json'))).deployed.versionId,uid(22));
 const failure=command('release/tool-schema-gate.mjs',['deploy'],{DELIBERATE_FAILURE:'yes'});assert.equal(failure.status,1);assert.match(failure.stderr,/::error::.*FAILED/);
 const rollbackRun=command('release/member-details-rollback.mjs');assert.equal(rollbackRun.status,0,rollbackRun.stderr);
 const rollbackCheck=command('release/tool-schema-gate.mjs',['rollback']);assert.equal(rollbackCheck.status,0,rollbackCheck.stderr);
 const failedReport=command('release/tool-schema-gate.mjs',['report','--workflow-status','failure']);assert.equal(failedReport.status,1);
 const report=JSON.parse(readFileSync(join(dir,'b1-runtime-release/tool-schema-release-report.json')));assert.equal(report.releaseVerified,false);assert.equal(report.rollbackChecks.status,'passed');assert.match(readFileSync(join(dir,'summary.md'),'utf8'),/FAILED/);
 const operations=readFileSync(join(dir,'operations.jsonl'),'utf8').trim().split('\n').map(JSON.parse);assert.equal(operations.filter(x=>x[0]==='rollback').length,1);assert(operations.every(x=>x[0]==='rollback'||x[0]==='deployments'));assert(!existsSync(join(dir,'wrangler.jsonc')));
 // Run the real rollback script with a newer owner's deployment: refusal, no rollback write.
 writeFileSync(join(dir,'inventory.json'),JSON.stringify([deployment(4,44)]));const refused=command('release/member-details-rollback.mjs');assert.notEqual(refused.status,0);assert.match(refused.stderr,/Newer deployment exists/);
 const after=readFileSync(join(dir,'operations.jsonl'),'utf8').trim().split('\n').map(JSON.parse);assert.equal(after.filter(x=>x[0]==='rollback').length,1);
 const evidence={safeEnvironment:true,realCloudflareCalls:0,passingExit:passingRun.status,failingExit:failure.status,rollbackExit:rollbackRun.status,rollbackCheckExit:rollbackCheck.status,failedReleaseVerified:report.releaseVerified,newerOwnerRollbackExit:refused.status,deployChecks:report.deployChecks,rollbackChecks:report.rollbackChecks,operations};
 if(process.env.TOOL_RELEASE_PROOF_DIR){mkdirSync(process.env.TOOL_RELEASE_PROOF_DIR,{recursive:true});writeFileSync(join(process.env.TOOL_RELEASE_PROOF_DIR,'automation-proof.json'),JSON.stringify(evidence,null,2));}
});
