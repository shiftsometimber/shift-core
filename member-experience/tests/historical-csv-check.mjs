import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
// These two assertions concern the original CSV change's historical boundary.
// Execute their complete original bodies at the immutable receipt, rather than
// asserting that every later authorised commit is still part of that change.
const receipt='ac372ffe2c8017efc48d517f5cbf4cd2a9012d01';
let checked=false;
export function assertHistoricalCsvBoundary(){
  for(const file of ['frontend/member/member-progress-v1.js','member-experience/weight-import-mapping.mjs']){
    const original=execFileSync('git',['show',receipt+':'+file],{maxBuffer:8e6});
    assert.deepEqual(readFileSync(file),original,'Current CSV component changed since its exact historical qualification: '+file);
  }
  if(checked)return;
  execFileSync('git',['merge-base','--is-ancestor',receipt,'HEAD']);
  const dir=mkdtempSync(join(tmpdir(),'shift-csv-historical-'));let attached=false;
  try{
    execFileSync('git',['worktree','add','--detach',dir,receipt],{stdio:'pipe'});attached=true;
    execFileSync(process.execPath,['--test','--test-name-pattern=CSV UI changes only|no native widget','member-experience/tests/weight-import-mapping-ui.test.mjs'],{cwd:dir,timeout:180000,maxBuffer:8e6,stdio:'pipe'});
    checked=true;
  }finally{
    if(attached)execFileSync('git',['worktree','remove','--force',dir],{stdio:'pipe'});
    rmSync(dir,{recursive:true,force:true});
  }
}
