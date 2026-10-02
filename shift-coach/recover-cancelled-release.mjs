import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {mkdirSync,writeFileSync} from 'node:fs';
import {recovery,recoveryDecision} from './cancelled-release-recovery.mjs';import {verifyCoachingRelease} from './release-contract.mjs';
assert.equal(process.env.GITHUB_REF,'refs/heads/main');verifyCoachingRelease({requireLaunch:true});
const get=async path=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core'+path,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok);return r.json();};
const main=await get('/git/refs/heads/main');assert.equal(main.object.sha,process.env.GITHUB_SHA,'Do not recover from a stale release');
const wrangler=(...args)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config','wrangler.jsonc'],{encoding:'utf8',maxBuffer:4*1024*1024});
const active=()=>JSON.parse(wrangler('deployments','list','--json')).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
const verified=await get('/actions/runs/'+recovery.verifiedRun),failed=await get('/actions/runs/'+recovery.run),before=active(),decision=recoveryDecision(before,failed,verified);
if(decision==='restore'){
 console.log(wrangler('rollback',recovery.verified,'--message','Restore verified runtime after run 37047576206 timed out during browser dependency installation'));
 assert.equal(recoveryDecision(active(),failed,verified),'retain','Recovery did not restore the verified runtime');
}
mkdirSync('b1-runtime-release',{recursive:true});writeFileSync('b1-runtime-release/cancelled-release-recovery.json',JSON.stringify({at:new Date().toISOString(),decision,run:recovery.run,from:before.versions[0].version_id,to:recovery.verified,verifiedRun:recovery.verifiedRun,customerRecordsRead:0,dataChanged:false},null,2));
console.log('PASS exact cancelled-release recovery: '+decision+' verified runtime; no data rollback');
