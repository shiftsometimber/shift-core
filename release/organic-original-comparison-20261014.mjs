import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {combinedFiniteHistoricalView,COMBINED_FINITE_BASE} from './combined-finite-scope-20261014.mjs';
import {verifyMaleObesityPillar} from './approved-runtime-composition.mjs';
const manifest='release/approved-runtime-composition.json';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6}).trim();
const content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:64e6});
export const ORGANIC_ORIGINAL_MALE_REGISTRATION='b31e1c63cede1cde2be975c4b4cc609ef1a11630';
// An abstract comparison adapter only. It does not authenticate the callback,
// admit source, grant an approval, or replace any current owning comparison.
export function organicOriginalMaleComparisonRead(read,actualHead,registrationHead){
 assert.equal(typeof read,'function');assert.match(actualHead,/^[a-f0-9]{40}$/);assert.match(registrationHead,/^[a-f0-9]{40}$/);
 return(ref,path)=>{
  if(ref!=='HEAD')return read(ref,path);
  const current=read('HEAD',path),resolved=read(actualHead,path);
  return current===resolved?read(registrationHead,path):current;
 };
}
export function verifyOrganicOriginalMaleComparison(read){
 // Source admission uses the independent strict default view, never read.
 const actual=combinedFiniteHistoricalView(),current=actual.record;
 assert(actual.head===COMBINED_FINITE_BASE&&actual.rawHead!==actual.head,'Actual admitted combined source required');
 assert.equal(git('diff','--name-only'),'','Tracked source changed before Organic legacy comparison');assert.equal(git('diff','--cached','--name-only'),'','Staged source changed before Organic legacy comparison');
 const head=current.watchBacklogUpdate?.base,record=current.maleObesityPillar;
 assert.equal(head,ORGANIC_ORIGINAL_MALE_REGISTRATION,'Exact original Male registration required');assert(record);
 const immutableRecord=JSON.parse(content(head,manifest)).maleObesityPillar;
 assert.deepEqual(record,immutableRecord,'Authenticated current and original Male records must agree');
 verifyMaleObesityPillar(record,{head,read:organicOriginalMaleComparisonRead(read,actual.rawHead,head),content,diff:(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>git('merge-base','--is-ancestor',a,b)});
 assert.equal(git('rev-parse','HEAD'),actual.rawHead,'Source HEAD moved during Organic legacy comparison');assert.equal(git('diff','--name-only'),'','Tracked source changed during Organic legacy comparison');assert.equal(git('diff','--cached','--name-only'),'','Staged source changed during Organic legacy comparison');
 return {originalMaleComparatorChecked:true,currentReaderAuthenticated:false,legacyComparisonOnly:true,sourceAdmission:'independent actual Git',readerUnchanged:true};
}
