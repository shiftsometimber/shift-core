import test from'node:test';import assert from'node:assert/strict';import{readFileSync,mkdtempSync,rmSync}from'node:fs';import{tmpdir}from'node:os';import path from'node:path';import{execFileSync}from'node:child_process';import{qualifyJoinedSuccessor,withJoinedSuccessorQualification}from'../release/my-timber-joined-look-scope-20261024.mjs';
const root=process.cwd(),git=(...a)=>execFileSync('git',['--no-optional-locks',...a],{encoding:'utf8',maxBuffer:64*1024*1024}).trim();
test('v6 authenticates the actual current native source and both unchanged earlier receipts',()=>withJoinedSuccessorQualification(p=>{
 assert.equal(p.actualHead,git('rev-parse','HEAD'));assert.equal(p.supportPredecessor,'75165fcc83836be66af0848c82dc97543d5a6f39');assert(p.currentFactsAuthenticated);assert.equal(p.currentReaderAuthenticated,false);assert.equal(p.productionDeployed,false);
 for(const f of ['member-experience/support-plan.mjs','member-experience/member-support-contact.mjs','member-experience/shed-support-loop.mjs','frontend/member/my-timber-preview.html','release/canonical-runtime-build.mjs'])assert(p.paths.includes(f),f);
 for(const[file,ref]of[['release/my-timber-loop-20261026.json',p.supportPredecessor],['release/my-timber-joined-look-20261024.json',p.retainedPredecessor]])assert(readFileSync(file).equals(execFileSync('git',['show',ref+':'+file])),file+' remains byte identical');p.assertOwnedBytes();
}));
test('each new support boundary rejects altered physical bytes, including restored timestamps',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'shift-support-qualification-'));let added=false;
 try{
  execFileSync('git',['worktree','add','--quiet','--detach',dir,'HEAD'],{cwd:root,stdio:'pipe'});added=true;
  const body="import assert from'node:assert/strict';import{readFileSync,writeFileSync,statSync,utimesSync}from'node:fs';import{withJoinedSuccessorQualification}from'./release/my-timber-joined-look-scope-20261024.mjs';withJoinedSuccessorQualification(p=>{for(const f of ['member-experience/support-plan.mjs','member-experience/member-support-contact.mjs','member-experience/shed-support-loop.mjs','member-experience/support-release-gate.mjs','member-experience/prescriber-note.mjs','frontend/member/my-timber-preview.html','release/canonical-runtime-build.mjs']){const b=readFileSync(f),s=statSync(f),bad=Buffer.from(b);bad[0]^=1;try{writeFileSync(f,bad);utimesSync(f,s.atime,s.mtime);assert.throws(()=>p.assertOwnedBytes(),/source.*changed|changed.*source|authentication/i);}finally{writeFileSync(f,b);utimesSync(f,s.atime,s.mtime);}p.assertOwnedBytes();}});";
  execFileSync(process.execPath,['--input-type=module','-e',body],{cwd:dir,stdio:'pipe',timeout:120000});
 }finally{if(added)execFileSync('git',['worktree','remove','--force',dir],{cwd:root,stdio:'pipe'});else rmSync(dir,{recursive:true,force:true});}
});
