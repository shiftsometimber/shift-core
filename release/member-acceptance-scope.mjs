import {COACH_BASE,COACH_BACKEND_PATHS,verifyCoachingRelease} from '../shift-coach/release-contract.mjs';
// Acceptance only. Bind the exact reviewed scripts to independent live evidence.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const MEMBER_ACCEPTANCE_BASE='dc02728aaa6637e1e2570f66af83d594a4176f54';
export const MEMBER_ACCEPTANCE_CANDIDATE='20d385d03b9339411992d5608cb9870294fe6414';
export const MEMBER_ACCEPTANCE_PATHS=["rendered-member-acceptance-support.mjs","tests/rendered-member-acceptance-support.test.mjs","health-passport/production-browser.mjs","my-timber-final-production.mjs",".github/workflows/rendered-member-production-acceptance.yml",".github/workflows/my-timber-final-production.yml","g2-014-progress-picture-premium-production.mjs","my-timber-final-source-gate.mjs","release/app-member-live.mjs"];
export const MEMBER_DIAGNOSTICS_BASE='48cd6ed15ff0e40ad46b22a3a419bb13c5edab2d';
export const MEMBER_DIAGNOSTICS_SOURCE='0aafaefb5398fdda7ea87a73fe78592cd4f5f86b';
export const MEMBER_DIAGNOSTICS_PATHS=['health-passport/acceptance-diagnostics.mjs','tests/acceptance-diagnostics.test.mjs','health-passport/production-browser.mjs','my-timber-final-production.mjs'];
export const MEMBER_DIAGNOSTICS_WORKFLOW='.github/workflows/my-timber-final-production.yml';
export function validateMemberDiagnosticsSource(read,changedPaths){
 assert.deepEqual([...changedPaths].sort(),[...MEMBER_DIAGNOSTICS_PATHS,MEMBER_DIAGNOSTICS_WORKFLOW].sort(),'Diagnostics must retain the exact five-file test-only proof');
 for(const p of MEMBER_DIAGNOSTICS_PATHS)assert.equal(read('HEAD',p),read(MEMBER_DIAGNOSTICS_SOURCE,p),'Proven bounded acceptance source drift: '+p);
 // The one-off branch has completed its proof. Keep the deployed workflow and
 // its exact original branch/identity/source gates rather than adding a bypass.
 assert.equal(read('HEAD',MEMBER_DIAGNOSTICS_WORKFLOW),read(MEMBER_DIAGNOSTICS_BASE,MEMBER_DIAGNOSTICS_WORKFLOW),'Temporary diagnostic workflow must not enter production');
}
export function assertMemberDiagnosticsReceipt(receipt){
 assert.equal(receipt.id,37216938436);assert.equal(receipt.head_sha,MEMBER_DIAGNOSTICS_SOURCE);
 assert.equal(receipt.path,MEMBER_DIAGNOSTICS_WORKFLOW);assert.equal(receipt.head_branch,'codex/member-acceptance-diagnostics-20261004');
 assert.equal(receipt.event,'push');assert.equal(receipt.status,'completed');assert.equal(receipt.conclusion,'success','Exact bounded member acceptance must pass');
}
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
export function validateMemberAcceptanceSource(){
 verifyCoachingRelease();
 git('merge-base','--is-ancestor',MEMBER_ACCEPTANCE_CANDIDATE,'HEAD');
 assert.deepEqual(git('diff','--name-only',MEMBER_ACCEPTANCE_BASE,MEMBER_ACCEPTANCE_CANDIDATE).split('\n').filter(Boolean).sort(),[...MEMBER_ACCEPTANCE_PATHS].sort(),'Acceptance changed outside its exact nine scripts/workflows');
 for(const p of MEMBER_ACCEPTANCE_PATHS)assert.equal(git('rev-parse',(COACH_BACKEND_PATHS.has(p)?COACH_BASE:'HEAD')+':'+p),git('rev-parse',MEMBER_ACCEPTANCE_CANDIDATE+':'+p),'Verified acceptance source drift: '+p);
 git('merge-base','--is-ancestor',MEMBER_DIAGNOSTICS_SOURCE,'HEAD');
 validateMemberDiagnosticsSource((ref,p)=>git('rev-parse',ref+':'+p),git('diff','--name-only',MEMBER_DIAGNOSTICS_BASE,MEMBER_DIAGNOSTICS_SOURCE).split('\n').filter(Boolean));
}
export async function verifyMemberAcceptanceProof(get){
 validateMemberAcceptanceSource();
 const receipts=[];
 const proofs=[[36950058320,'9d0d217b935413458b06958a5f12d736b3d6f370','.github/workflows/rendered-member-production-acceptance.yml',["rendered-member-acceptance-support.mjs","tests/rendered-member-acceptance-support.test.mjs",".github/workflows/rendered-member-production-acceptance.yml","g2-014-progress-picture-premium-production.mjs"]],[36955565435,'20d385d03b9339411992d5608cb9870294fe6414','.github/workflows/my-timber-final-production.yml',["rendered-member-acceptance-support.mjs","health-passport/production-browser.mjs","my-timber-final-production.mjs",".github/workflows/my-timber-final-production.yml","release/app-member-live.mjs"]]];
 for(const [id,head,path,checked]of proofs){
  let r;for(let attempt=0;attempt<40;attempt++){r=await get('/actions/runs/'+id);assert.equal(r.head_sha,head);assert.equal(r.path,path);if(r.status==='completed')break;await new Promise(resolve=>setTimeout(resolve,15000));}assert.equal(r.conclusion,'success','Independent live acceptance must pass: '+path);
  for(const p of checked)assert.equal(git('rev-parse',(COACH_BACKEND_PATHS.has(p)?COACH_BASE:'HEAD')+':'+p),git('rev-parse',head+':'+p),'Exact proven harness changed: '+p);
  receipts.push({id:r.id,sha:r.head_sha,path:r.path,conclusion:r.conclusion});
 }
 const diagnostics=await get('/actions/runs/37216938436');assertMemberDiagnosticsReceipt(diagnostics);
 const production=await get('/actions/runs/37213204839');assert.equal(production.head_sha,MEMBER_DIAGNOSTICS_BASE);assert.equal(production.path,'.github/workflows/cloudflare-production-promote.yml');assert.equal(production.conclusion,'success');
 receipts.push({id:diagnostics.id,sha:diagnostics.head_sha,path:diagnostics.path,conclusion:diagnostics.conclusion,unchangedServingSource:production.head_sha});
 return receipts;
}
