// Matt's locked 1 October design and request to finish My Timber across web/PWA/app.
// Bind the six-file presentation delta to its isolated account-backed browser proof.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const MEMBER_DESIGN_BASE='e8cbe2238687bd9b9da8a5d694b5b7a73976c1d7';
export const MEMBER_DESIGN_CANDIDATE='622ab0e45b164de91523d06a9e4b060c54d37453';
export const MEMBER_DESIGN_RUN=36946742864;
export const MEMBER_DESIGN_PATHS=['member-design.mjs','app-layout-live.mjs','tests/app-layout-live.test.mjs','preview/member-design/verify.cjs','preview/member-design/member-feedback-proof.cjs','.github/workflows/member-design-preview.yml'];
// 2 October screenshot repair. Preserve the original design proof and require
// the exact additional returning-member layout/scroll payload and browser receipt.
export const MEMBER_LAYOUT_BASE='c389564d68cbcfe88af03d01d90898688e076fcc';
export const MEMBER_LAYOUT_CANDIDATE='72f0796f7de9ccfc42f46ec203a6c00b04d17aba';
export const MEMBER_LAYOUT_RUN=36987513488;
export const MEMBER_LAYOUT_PATHS=['member-design.mjs','preview/member-panel-layout/verify.cjs','.github/workflows/member-panel-layout-preview.yml'];
export function validateMemberLayoutPayload(read,changed){
 assert.deepEqual([...changed].sort(),[...MEMBER_LAYOUT_PATHS].sort(),'Member layout changed outside the exact screenshot repair');
 for(const path of MEMBER_LAYOUT_PATHS)assert.equal(read('HEAD',path),read(MEMBER_LAYOUT_CANDIDATE,path),'Verified member layout drift: '+path);
}
export function validateMemberDesignPayload(read,changed){
 assert.deepEqual([...changed].sort(),[...MEMBER_DESIGN_PATHS].sort(),'Member design changed outside the reviewed presentation delta');
 for(const path of MEMBER_DESIGN_PATHS)assert.equal(read('HEAD',path),read(MEMBER_DESIGN_CANDIDATE,path),'Approved member design drift: '+path);
}
export function validateMemberDesignSource(){
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 git('merge-base','--is-ancestor',MEMBER_DESIGN_BASE,MEMBER_DESIGN_CANDIDATE);
 git('merge-base','--is-ancestor',MEMBER_DESIGN_CANDIDATE,'HEAD');
 validateMemberDesignPayload((ref,path)=>git('rev-parse',(ref==='HEAD'&&path==='member-design.mjs'?MEMBER_LAYOUT_BASE:ref)+':'+path),git('diff','--name-only',MEMBER_DESIGN_BASE,MEMBER_DESIGN_CANDIDATE).split('\n').filter(Boolean));
 git('merge-base','--is-ancestor',MEMBER_LAYOUT_BASE,MEMBER_LAYOUT_CANDIDATE);
 git('merge-base','--is-ancestor',MEMBER_LAYOUT_CANDIDATE,'HEAD');
 validateMemberLayoutPayload((ref,path)=>git('rev-parse',ref+':'+path),git('diff','--name-only',MEMBER_LAYOUT_BASE,MEMBER_LAYOUT_CANDIDATE).split('\n').filter(Boolean));
 const p='.github/workflows/continuity-live-acceptance.yml';
 const original=execFileSync('git',['show',MEMBER_DESIGN_BASE+':'+p],{encoding:'utf8'});
 const expected=original.replaceAll("frontend/member/ member-experience/ my-journey-v1.js public-shell-contract.mjs worker-entry-v6.js scripts/","frontend/member/ member-experience/ my-journey-v1.js public-shell-contract.mjs worker-entry-v6.js scripts/ app-layout-live.mjs member-design.mjs growth-member-public.mjs preview/app-layout/");
 assert.equal(execFileSync('git',['show','HEAD:'+p],{encoding:'utf8'}),expected,'Live acceptance may only classify the new presentation modules as application source');
}
export async function verifyMemberDesignProof(get){
 const run=await get('/actions/runs/'+MEMBER_DESIGN_RUN);
 assert.equal(run.head_sha,MEMBER_DESIGN_CANDIDATE);
 assert.equal(run.path,'.github/workflows/member-design-preview.yml');
 assert.equal(run.conclusion,'success','Approved member design must pass account-backed Chromium/WebKit proof');
 const layout=await get('/actions/runs/'+MEMBER_LAYOUT_RUN);
 assert.equal(layout.head_sha,MEMBER_LAYOUT_CANDIDATE);
 assert.equal(layout.path,'.github/workflows/member-panel-layout-preview.yml');
 assert.equal(layout.conclusion,'success','Returning-member layout, embedded scroll and draft preservation proof must pass');
 return run;
}
