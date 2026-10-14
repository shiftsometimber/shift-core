import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync as native} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {withImmutableHistoryVerification as scope,immutableHistoryExecFileSync as read,immutableHistorySourceHead} from '../release/immutable-git-facts.mjs';
const git=(...args)=>native('git',args,{encoding:'utf8',stdio:'pipe'}).trim();
function fixture(callback){
 const cwd=process.cwd(),dir=mkdtempSync(join(tmpdir(),'immutable-current-state-'));
 try{
  process.chdir(dir);git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
  writeFileSync('file.txt','first\n');writeFileSync('unicode-£','first\n');git('add','.');git('commit','-qm','first');const first=git('rev-parse','HEAD');
  writeFileSync('file.txt','second\n');writeFileSync('unicode-£','second\n');git('add','.');git('commit','-qm','second');const second=git('rev-parse','HEAD');
  callback({dir,first,second});
 }finally{process.chdir(cwd);rmSync(dir,{recursive:true,force:true});}
}
function same(args){assert.deepEqual(read('git',args,{encoding:'utf8'}),native('git',args,{encoding:'utf8'}));}
test('temporary replacement installation and restoration cannot conceal native show or rev-parse output',()=>fixture(({first,second})=>{
 const oldMode=process.env.GIT_NO_REPLACE_OBJECTS;delete process.env.GIT_NO_REPLACE_OBJECTS;
 try{scope(()=>{
  same(['show',first+':file.txt']);same(['rev-parse',first+':file.txt']);
  git('replace',first,second);
  try{same(['show',first+':file.txt']);same(['rev-parse',first+':file.txt']);assert.equal(read('git',['show',first+':file.txt'],{encoding:'utf8'}),'second\n');}
  finally{git('replace','-d',first);}
  same(['show',first+':file.txt']);same(['rev-parse',first+':file.txt']);
 });}finally{if(oldMode===undefined)delete process.env.GIT_NO_REPLACE_OBJECTS;else process.env.GIT_NO_REPLACE_OBJECTS=oldMode;}
}));
test('same-scope native configuration changes remain visible to diff and immutable source readers',()=>fixture(({first,second})=>scope(()=>{
 const args=['diff','--name-only',first,second];git('config','core.quotePath','true');same(args);const quoted=read('git',args,{encoding:'utf8'});
 same(['show',first+':file.txt']);git('config','core.quotePath','false');same(args);const literal=read('git',args,{encoding:'utf8'});
 assert.notEqual(quoted,literal);assert(literal.includes('unicode-£'));same(['show',first+':file.txt']);same(['rev-parse',first+':file.txt']);
})));
test('index drift rejects even when tracked working bytes are restored to HEAD at entry or exit',()=>fixture(({first,second})=>{
 writeFileSync('file.txt','staged only\n');git('add','file.txt');writeFileSync('file.txt','second\n');
 assert.equal(git('diff','--name-only','HEAD','--'),'');assert.throws(()=>scope(()=>{}),/staged source drift/);git('reset','--hard',second);
 assert.throws(()=>scope(()=>{same(['show',first+':file.txt']);writeFileSync('file.txt','staged only\n');git('add','file.txt');writeFileSync('file.txt','second\n');assert.equal(git('diff','--name-only','HEAD','--'),'');}),/staged source drift/);git('reset','--hard',second);
}));
test('show and rev-parse cannot reuse cached facts across temporary Git namespace or PATH changes',()=>fixture(({first,second})=>{
 const initial=process.cwd(),other=mkdtempSync(join(tmpdir(),'immutable-current-other-'));
 const original=Object.fromEntries(['GIT_DIR','GIT_WORK_TREE','PATH'].map(key=>[key,process.env[key]]));
 const restore=()=>{for(const [key,value]of Object.entries(original))if(value===undefined)delete process.env[key];else process.env[key]=value;};
 try{
  process.chdir(other);git('init','-q');process.chdir(initial);
  scope(()=>{
   assert.equal(immutableHistorySourceHead(),second);scope(()=>assert.equal(immutableHistorySourceHead(),second));
   for(const command of ['show','rev-parse']){
    const args=[command,first+':file.txt'];same(args);process.env.GIT_DIR=join(other,'.git');process.env.GIT_WORK_TREE=other;
    try{assert.throws(()=>native('git',args,{encoding:'utf8',stdio:'pipe'}));assert.throws(()=>read('git',args,{encoding:'utf8'}));}finally{restore();}
    process.env.PATH=join(other,'missing');try{assert.throws(()=>read('git',args,{encoding:'utf8'}),error=>error.code==='ENOENT');}finally{restore();}
   }
  });assert.equal(immutableHistorySourceHead(),null);
 }finally{restore();process.chdir(initial);rmSync(other,{recursive:true,force:true});}
}));
