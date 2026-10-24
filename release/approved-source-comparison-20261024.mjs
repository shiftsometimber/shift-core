import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {immutableHistoryExecFileSync as exec} from './immutable-git-facts.mjs';
import {deltas} from './approved-source-comparison-data-20261024.mjs';
const git=(...args)=>exec('git',args,{encoding:'utf8',maxBuffer:64e6}).trimEnd();
const oid=value=>createHash('sha1').update('blob '+Buffer.byteLength(value)+'\0').update(value).digest('hex');
export function originalApprovedComparisonSource(path,value){
 const d=deltas[path];if(!d)return value;
 assert.equal(oid(value),d.current,'Approved comparison current bytes changed: '+path);
 for(const edit of [...d.edits].reverse()){assert.equal(value.slice(edit.start,edit.start+edit.after.length),edit.after,'Approved comparison inverse changed: '+path);value=value.slice(0,edit.start)+edit.before+value.slice(edit.start+edit.after.length);}
 assert.equal(oid(value),d.original,'Every original comparison byte must be restored: '+path);return value;
}
function qualify(head,path){
 const d=deltas[path];assert(d);assert.equal(git('rev-parse',head+':'+path),d.current,'Approved comparison current source drift: '+path);
 const actual=exec('git',['show',head+':'+path],{encoding:'utf8',maxBuffer:64e6});
 const original=originalApprovedComparisonSource(path,actual);assert.equal(original,exec('git',['cat-file','blob',d.original],{encoding:'utf8',maxBuffer:64e6}),'Original immutable comparison source changed: '+path);return{d,actual,original};
}
export function approvedSourceComparison(path,value,head){
 const d=deltas[path];if(!d)return value;
 const identifier=value===d.current,bytes=typeof value==='string'&&oid(value)===d.current;
 if(!identifier&&!bytes)return value;
 const proof=qualify(head??git('rev-parse','HEAD'),path);return identifier?d.original:proof.original;
}
// Pure comparison projection only. This never authenticates supplied readers.
// The owning factory independently verifies current native source first.
export function approvedLegacyComparisonValue(ref,path,value,head){
 return ref==='HEAD'||ref===head?approvedSourceComparison(path,value,head):value;
}
