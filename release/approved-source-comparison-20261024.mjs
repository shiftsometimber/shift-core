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
 const d=deltas[path];if(!d||value!==d.current)return value;
 qualify(head??git('rev-parse','HEAD'),path);return d.original;
}
export function approvedSourceComparisonFrame(frame){
 if(!frame)return frame;
 try{git('merge-base','--is-ancestor','e01a9a16e7794bcac69acf84dee7a3a50816cd52',frame.rawHead);}catch(error){if(error.status===1)return frame;throw error;}
 for(const path of Object.keys(deltas))qualify(frame.rawHead,path);
 const normalize=(path,value)=>{const d=deltas[path];if(!d)return value;if(value===d.current){qualify(frame.rawHead,path);return d.original;}if(typeof value==='string'&&oid(value)===d.current)return originalApprovedComparisonSource(path,value);return value;};
 const unary=fn=>(ref,path)=>normalize(path,fn(ref,path));
 const result={...frame,read:unary(frame.read),blob:unary(frame.blob),content:unary(frame.content),
  // Supplied readers retain every existing fresh native authentication call.
  // Only the authenticated result is projected into the original comparison.
  projectRead:reader=>unary(frame.projectRead(reader)),projectContent:reader=>unary(frame.projectContent(reader)),
  finish:()=>{frame.finish();for(const path of Object.keys(deltas))qualify(frame.rawHead,path);}
 };return Object.freeze(result);
}
