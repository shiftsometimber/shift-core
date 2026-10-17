import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

// Verbatim transplant target: tests/runtime-cancel-rollback-20261016.test.mjs.
// Outside a repository, CORE_CANCEL_REPO selects the unchanged guard checkout;
// CORE_CANCEL_WORKFLOW can select a prepared workflow copy without editing it.
// always()/cancelled() allow cleanup to be scheduled on cancellable gate failure.
// A hard job or runner timeout can terminate execution before any cleanup runs;
// this condition and its tests do not guarantee cleanup after a hard timeout.
const root=process.env.CORE_CANCEL_REPO?resolve(process.env.CORE_CANCEL_REPO):null;
const workflowUrl=process.env.CORE_CANCEL_WORKFLOW
 ?pathToFileURL(resolve(process.env.CORE_CANCEL_WORKFLOW))
 :root?pathToFileURL(resolve(root,'.github/workflows/cloudflare-production-promote.yml'))
 :new URL('../.github/workflows/cloudflare-production-promote.yml',import.meta.url);
const guardUrl=root?pathToFileURL(resolve(root,'release/runtime-rollback-guard.mjs'))
 :new URL('../release/runtime-rollback-guard.mjs',import.meta.url);
const workflow=readFileSync(workflowUrl,'utf8');
const {runtimeRollbackDecision}=await import(guardUrl.href);
const expectedCondition="always() && (failure() || cancelled()) && (steps.runtime_deploy.outcome == 'success' || (steps.growth_deployed.outputs.already_deployed == 'true' && steps.growth_live_started.outcome == 'success'))";
const matches=[...workflow.matchAll(/^        id: runtime_rollback\r?\n        if: \$\{\{ (.*?) \}\}\r?\n        run: (.*?)\r?$/gm)];
assert.equal(matches.length,1,'The production workflow must have exactly one runtime_rollback step');
const [,condition,command]=matches[0];
// Evaluate the exact checked-in GitHub condition with only its documented inputs.
// Equality below prevents evaluating arbitrary content from a changed workflow.
assert.equal(condition,expectedCondition,'Cancellation must reach the existing ownership-guarded rollback');
const evaluate=new Function('always','failure','cancelled','steps','return ('+condition+');');
function eligible({failed=false,cancelled=false,deployed='skipped',already='false',started='skipped'}={}){
 let alwaysCalls=0;
 const result=evaluate(()=>{alwaysCalls++;return true;},()=>failed,()=>cancelled,{
  runtime_deploy:{outcome:deployed},
  growth_deployed:{outputs:{already_deployed:already}},
  growth_live_started:{outcome:started}
 });
 assert.equal(alwaysCalls,1,'always() must be evaluated so job cancellation does not imply the default success() guard');
 return result;
}

test('the production rollback retains its pure guarded command and always-run post-rollback checks',()=>{
 assert.equal(command,'node release/member-details-rollback.mjs');
 assert.match(workflow,/id: runtime_rollback[\s\S]*?\n      - name: Verify protected catalogue and stock after owned rollback\n        if: \$\{\{ always\(\) && steps\.runtime_rollback\.outcome == 'success' && steps\.protected_stock_before\.outcome == 'success' \}\}\n        run: node scripts\/b1-release-scope\.mjs --snapshot after/);
 assert.match(workflow,/name: Verify nine public tool pages after owned rollback\n        if: \$\{\{ always\(\) && steps\.runtime_rollback\.outcome == 'success' \}\}\n        run: node release\/tool-schema-gate\.mjs rollback/);
});

const cases=[
 ['successful owned deployment has no failed gate',{deployed:'success'},false],
 ['failure before any deployment',{failed:true},false],
 ['cancellation before any deployment',{cancelled:true},false],
 ['failure with failed deployment',{failed:true,deployed:'failure'},false],
 ['cancellation with cancelled deployment',{cancelled:true,deployed:'cancelled'},false],
 ['failure after successful owned deployment',{failed:true,deployed:'success'},true],
 ['cancellation after successful owned deployment',{cancelled:true,deployed:'success'},true],
 ['both failure and cancellation after successful owned deployment',{failed:true,cancelled:true,deployed:'success'},true],
 ['already-deployed growth before any live gate fails',{failed:true,already:'true'},false],
 ['already-deployed growth before any live gate is cancelled',{cancelled:true,already:'true'},false],
 ['already-deployed growth live gate never started successfully',{cancelled:true,already:'true',started:'cancelled'},false],
 ['already-deployed growth live gate start failed',{failed:true,already:'true',started:'failure'},false],
 ['growth live gate started but deployment is not confirmed',{cancelled:true,started:'success'},false],
 ['growth live gate started with boolean-like nonreceipt output',{cancelled:true,already:'1',started:'success'},false],
 ['growth already deployed and live gate started before failure',{failed:true,already:'true',started:'success'},true],
 ['growth already deployed and live gate started before cancellation',{cancelled:true,already:'true',started:'success'},true],
 ['successful growth verification has no failed gate',{already:'true',started:'success'},false],
 ['owned deployment does not need growth outputs',{cancelled:true,deployed:'success',already:'false',started:'failure'},true]
];
test('actual condition admits only failed or cancelled post-deployment paths',()=>{
 for(const [label,inputs,expected] of cases)assert.equal(eligible(inputs),expected,label);
});

const id=n=>String(n).padStart(8,'0')+'-0000-4000-8000-000000000000';
const deployment=(n,v)=>({id:id(n),versions:[{version_id:id(v),percentage:100}]});
const source='a'.repeat(40),run='123';
const before=deployment(1,11),owned=deployment(2,12),foreign=deployment(3,13);
const receipt={kind:'owned_runtime_deployment',source,run,deploymentId:owned.id,versionId:id(12)};
function cancelledDecision(overrides={}){
 assert.equal(eligible({cancelled:true,deployed:'success'}),true);
 return runtimeRollbackDecision({before,active:owned,receipt,source,run,...overrides});
}
test('cancellation restores only the exact owned deployment to its captured predecessor',()=>{
 assert.deepEqual(cancelledDecision(),{action:'restore',versionId:id(11)});
});
test('cancellation preserves an intervening deployment even if it reused the failed version',()=>{
 assert.throws(()=>cancelledDecision({active:foreign}),/Newer deployment exists/);
 assert.throws(()=>cancelledDecision({active:{...foreign,versions:owned.versions}}),/Newer deployment exists/);
});
test('cancellation cannot use another source, run, missing receipt or mismatched active version',()=>{
 for(const [label,replacement] of [
  ['missing',null],['different source',{...receipt,source:'b'.repeat(40)}],
  ['different run',{...receipt,run:'456'}],['different version',{...receipt,versionId:id(13)}],
  ['different receipt kind',{...receipt,kind:'unowned_runtime_deployment'}]
 ])assert.throws(()=>cancelledDecision({receipt:replacement}),undefined,label);
});
test('cancellation cannot bypass the exact release source and run requirements',()=>{
 for(const source of ['',undefined,'main','a'.repeat(39)])assert.throws(()=>cancelledDecision({source}));
 for(const run of ['',undefined,'latest','1x'])assert.throws(()=>cancelledDecision({run}));
});
test('an already restored captured predecessor is retained without another mutation',()=>{
 assert.deepEqual(cancelledDecision({active:{...foreign,versions:before.versions}}),{action:'retain',reason:'Captured previous version is already active'});
});
