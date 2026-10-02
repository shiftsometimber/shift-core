// Acceptance only. Bind the exact reviewed scripts to independent live evidence.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const MEMBER_ACCEPTANCE_BASE='dc02728aaa6637e1e2570f66af83d594a4176f54';
export const MEMBER_ACCEPTANCE_CANDIDATE='20d385d03b9339411992d5608cb9870294fe6414';
export const MEMBER_ACCEPTANCE_PATHS=["rendered-member-acceptance-support.mjs","tests/rendered-member-acceptance-support.test.mjs","health-passport/production-browser.mjs","my-timber-final-production.mjs",".github/workflows/rendered-member-production-acceptance.yml",".github/workflows/my-timber-final-production.yml","g2-014-progress-picture-premium-production.mjs","my-timber-final-source-gate.mjs","release/app-member-live.mjs"];
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
export function validateMemberAcceptanceSource(){
 git('merge-base','--is-ancestor',MEMBER_ACCEPTANCE_CANDIDATE,'HEAD');
 assert.deepEqual(git('diff','--name-only',MEMBER_ACCEPTANCE_BASE,MEMBER_ACCEPTANCE_CANDIDATE).split('\n').filter(Boolean).sort(),[...MEMBER_ACCEPTANCE_PATHS].sort(),'Acceptance changed outside its exact nine scripts/workflows');
 for(const p of MEMBER_ACCEPTANCE_PATHS)assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',MEMBER_ACCEPTANCE_CANDIDATE+':'+p),'Verified acceptance source drift: '+p);
}
export async function verifyMemberAcceptanceProof(get){
 validateMemberAcceptanceSource();
 const receipts=[];
 const proofs=[[36950058320,'9d0d217b935413458b06958a5f12d736b3d6f370','.github/workflows/rendered-member-production-acceptance.yml',["rendered-member-acceptance-support.mjs","tests/rendered-member-acceptance-support.test.mjs",".github/workflows/rendered-member-production-acceptance.yml","g2-014-progress-picture-premium-production.mjs"]],[36955565435,'20d385d03b9339411992d5608cb9870294fe6414','.github/workflows/my-timber-final-production.yml',["rendered-member-acceptance-support.mjs","health-passport/production-browser.mjs","my-timber-final-production.mjs",".github/workflows/my-timber-final-production.yml","release/app-member-live.mjs"]]];
 for(const [id,head,path,checked]of proofs){
  let r;for(let attempt=0;attempt<40;attempt++){r=await get('/actions/runs/'+id);assert.equal(r.head_sha,head);assert.equal(r.path,path);if(r.status==='completed')break;await new Promise(resolve=>setTimeout(resolve,15000));}assert.equal(r.conclusion,'success','Independent live acceptance must pass: '+path);
  for(const p of checked)assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',head+':'+p),'Exact proven harness changed: '+p);
  receipts.push({id:r.id,sha:r.head_sha,path:r.path,conclusion:r.conclusion});
 }
 return receipts;
}
