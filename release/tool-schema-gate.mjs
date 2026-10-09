// Read-only release verification. Deployment/rollback authority stays in the existing guards.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,appendFileSync,existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {latestDeployment} from './runtime-rollback-guard.mjs';
import checker from '../scripts/verify-tool-page-schema.cjs';

const directory='b1-runtime-release';
function identity(deployment) { return {deploymentId:deployment.id,versionId:deployment.versions[0].version_id,percentage:100}; }
function validateOwner(owner,source,run) {
 assert.equal(owner?.kind,'owned_runtime_deployment','Owned deployment receipt required');
 assert.equal(owner.source,source,'Receipt belongs to a different source');
 assert.equal(String(owner.run),String(run),'Receipt belongs to a different run');
}
export async function verifyToolRelease({stage,source,run,inventory,readJson,fetchImpl=fetch,now=()=>new Date().toISOString()}) {
 const receipt={kind:'public_tool_release_check',stage,source,run:String(run),checkedAt:now(),
  scope:'Nine public pages: HTTP status, JSON parsing, canonical free WebPage identity and absence of application markup. Not a calculator interaction test or Semrush crawl.',
  status:'failed',toolChecksVerified:false,checks:[],errors:[]};
 try {
  assert(['deploy','rollback'].includes(stage),'Unknown verification stage');
  assert.match(source||'',/^[a-f0-9]{40}$/,'Exact check source required');
  assert.match(String(run||''),/^\d+$/,'Exact release run required');
  const owner=readJson(`${directory}/owned-runtime-deployment.json`);validateOwner(owner,source,run);
  const active=latestDeployment(await inventory());receipt.deployed=identity(active);
  if(stage==='deploy') {
   receipt.expected={deploymentId:owner.deploymentId,versionId:owner.versionId};
   assert.equal(active.id,owner.deploymentId,'Active deployment is not owned by this release');
   assert.equal(receipt.deployed.versionId,owner.versionId,'Active version is not owned by this release');
  } else {
   const before=latestDeployment(readJson('deployment-before.json'));
   receipt.expected=identity(before);receipt.expected.checkSource=source;
   assert.equal(owner.previousDeploymentId,before.id,'Captured previous deployment differs from owner receipt');
   assert.equal(owner.previousVersionId,receipt.expected.versionId,'Captured previous version differs from owner receipt');
   const rollback=readJson(`${directory}/rollback.json`,true);
   if(rollback) {
    assert.equal(rollback.restoredVersion,receipt.expected.versionId,'Rollback receipt restored a different version');
    assert.equal(rollback.deployment,active.id,'Rollback was superseded by another deployment');
   } else assert.equal(active.id,before.id,'No owned rollback receipt for this deployment');
   assert.equal(receipt.deployed.versionId,receipt.expected.versionId,'Captured version is not active after rollback');
   // The restored runtime belongs to the captured prior release, not this check source.
   receipt.deploymentSource='captured prior runtime; see deployment-before.json';
  }
  receipt.checks=await checker.verifyAll(fetchImpl);
  const after=identity(latestDeployment(await inventory()));receipt.afterChecks=after;
  assert.deepEqual(after,receipt.deployed,'Deployment changed while verification was running');
  for(const check of receipt.checks)if(!check.passed)receipt.errors.push(`${check.path}: ${check.error}`);
  assert.equal(receipt.checks.length,checker.paths.length,'Incomplete page verification');
  assert.equal(receipt.errors.length,0,'One or more public tool checks failed');
  receipt.status='passed';receipt.toolChecksVerified=true;
 } catch(error) { receipt.errors.push(error.message); }
 receipt.finishedAt=now();return receipt;
}
export function releaseVerification({workflowStatus,source,run,deploy,rollback}) {
 const complete=deploy?.checks?.length===checker.paths.length&&checker.paths.every(path=>deploy.checks.some(c=>c.path===path&&c.passed));
 const valid=deploy?.source===source&&String(deploy?.run)===String(run)&&deploy?.kind==='public_tool_release_check'&&deploy?.stage==='deploy';
 const verified=workflowStatus==='success'&&valid&&complete&&deploy?.status==='passed'&&deploy.toolChecksVerified===true&&!rollback;
 return {kind:'guarded_release_verification',source,run:String(run),workflowStatus,releaseVerified:Boolean(verified),
  status:verified?'verified':workflowStatus==='failure'||deploy?.status==='failed'||rollback?'failed':'unverified',
  deployedVersion:deploy?.deployed?.versionId||null,deployChecks:deploy||null,rollbackChecks:rollback||null,
  note:rollback?'Rollback checks do not turn the failed release into a verified release.':'Verification also requires every existing workflow gate to succeed.'};
}
export async function main(argv=process.argv.slice(2)) {
 mkdirSync(directory,{recursive:true});
 const source=process.env.GITHUB_SHA,run=process.env.GITHUB_RUN_ID;
 const readJson=(path,optional=false)=>optional&&!existsSync(path)?null:JSON.parse(readFileSync(path,'utf8'));
 if(argv[0]==='report') {
  const status=argv[argv.indexOf('--workflow-status')+1];
  const report=releaseVerification({workflowStatus:status,source,run,deploy:readJson(`${directory}/tool-schema-deploy.json`,true),rollback:readJson(`${directory}/tool-schema-rollback.json`,true)});
  writeFileSync(`${directory}/tool-schema-release-report.json`,JSON.stringify(report,null,2));
  const summary=`\n### Public tool release verification: ${report.status.toUpperCase()}\n\nRelease verified: **${report.releaseVerified}**.\n\nCheck source: ${source}. Run: ${run}. Deployed version: ${report.deployedVersion||'not recorded'}.\n\n${report.note}\n`;
  if(process.env.GITHUB_STEP_SUMMARY&&!argv.includes('--receipt-only'))appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
  console.log(JSON.stringify(report));
  if(!report.releaseVerified)process.exitCode=1;
  return report;
 }
 const stage=argv[0];
 const inventory=()=>JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','deployments','list','--config','wrangler.jsonc','--json'],{encoding:'utf8',maxBuffer:4e6}));
 const receipt=await verifyToolRelease({stage,source,run,inventory,readJson});
 writeFileSync(`${directory}/tool-schema-${stage}.json`,JSON.stringify(receipt,null,2));
 console.log(JSON.stringify(receipt));
 if(!receipt.toolChecksVerified) {console.error(`::error::Public tool ${stage} verification FAILED: ${receipt.errors.join('; ')}`);process.exitCode=1;}
 return receipt;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error(`::error::Public tool verification FAILED: ${error.message}`);process.exitCode=1;});
