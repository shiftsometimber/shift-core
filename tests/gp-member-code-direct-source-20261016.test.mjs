import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyGpMemberCodeDirect} from '../release/gp-member-code-direct-scope-20261016.mjs';
const git=(...a)=>execFileSync('/usr/bin/git',['--no-replace-objects',...a],{encoding:'utf8'});
const head=()=>git('rev-parse','HEAD').trim();
const blob=(r,p)=>git('rev-parse',(r==='HEAD'?head():r)+':'+p).trim();
const content=(r,p)=>git('show',(r==='HEAD'?head():r)+':'+p);
const diff=(a,b)=>git('diff','--no-renames','--name-only',a,b).trim().split('\n').filter(Boolean);
const ancestor=(a,b)=>git('merge-base','--is-ancestor',a,b);
const record=()=>JSON.parse(content(head(),'release/approved-runtime-composition.json')).gpMemberCode20261014;
test('direct GP code actual native source retains serving-base source outside the eighteen approved GP source paths',()=>{
 const c=record();assert.equal(verifyGpMemberCodeDirect(c),c);
 assert.equal(c.fullGp11Complete,true);assert.equal(c.foundationClosureComplete,true);assert.equal(c.flagsEnabled,false);assert.equal(c.actualDeploymentPerformed,false);
});
test('direct GP code rejects supplied false current-HEAD source facts',()=>{
 const c=record();let called=0;
 assert.throws(()=>verifyGpMemberCodeDirect(c,{read:(r,p)=>{called++;return r==='HEAD'?'0'.repeat(40):blob(r,p);}}));
 assert(called>0);
});
test('direct GP code rejects changed supplied contents, differences and ancestry',()=>{
 const c=record();let contents=0,differences=0,ancestry=0;
 assert.throws(()=>verifyGpMemberCodeDirect(c,{readContent:(r,p)=>{contents++;return content(r,p)+'changed';}}));
 assert.throws(()=>verifyGpMemberCodeDirect(c,{readDiff:(a,b)=>{differences++;return [...diff(a,b),'unapproved'];}}));
 assert.throws(()=>verifyGpMemberCodeDirect(c,{isAncestor:(a,b)=>{ancestry++;ancestor(a,b);return false;}}));
 assert(contents>0&&differences>0&&ancestry>0);
});
test('direct GP code defaults only undefined and rejects explicit null API values',()=>{
 const c=record();assert.equal(verifyGpMemberCodeDirect(c,{head:undefined,read:undefined,readContent:undefined,readDiff:undefined,isAncestor:undefined}),c);
 for(const key of ['head','read','readContent','readDiff','isAncestor'])assert.throws(()=>verifyGpMemberCodeDirect(c,{[key]:null}),key);
 assert.throws(()=>verifyGpMemberCodeDirect(c,null));
});
test('direct GP code source record cannot alter completeness, deployment, activation or authority',()=>{
 const c=record();assert.throws(()=>verifyGpMemberCodeDirect({...c,fullGp11Complete:false}));for(const key of ['flagsEnabled','actualDeploymentPerformed'])assert.throws(()=>verifyGpMemberCodeDirect({...c,[key]:true}));
 assert.throws(()=>verifyGpMemberCodeDirect({...c,authority:{...c.authority,emailAuthority:true}}));
});
test('direct GP code rechecks actual raw HEAD after supplied callbacks and retains the private source',()=>{
 const original=head(),c=record();let moved=false;
 try{
  assert.throws(()=>verifyGpMemberCodeDirect(c,{read:(r,p)=>{const value=blob(r,p);if(!moved){moved=true;git('update-ref','--no-deref','HEAD',c.base);}return value;}}));
  assert.equal(moved,true);
 }finally{git('update-ref','--no-deref','HEAD',original);}
 assert.equal(head(),original);
 assert.equal(git('status','--porcelain','--untracked-files=no').trim(),'');
});
