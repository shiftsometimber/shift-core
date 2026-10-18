import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,mkdirSync,symlinkSync,renameSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {makeFreshCleanHeadHint} from '../release/fresh-food-source-head-20261016.mjs';
const makeFreshCleanHint=()=>{const hint=makeFreshCleanHeadHint();return()=>{const head=hint();if(head===null)return false;assert.match(head,/^[a-f0-9]{40}$/);assert.equal(head,git('rev-parse','HEAD').trim(),'Positive head must match actual current native Git');return true;};};
import childProcess from 'node:child_process';
import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',stdio:'pipe'});
function fixture(run){
 const cwd=process.cwd(),dir=mkdtempSync(join(tmpdir(),'shift-fresh-clean-'));
 try{
  process.chdir(dir);git('init','-q');git('config','user.name','Synthetic source verifier');git('config','user.email','source-verifier@example.invalid');
  writeFileSync('tracked.txt','original\n');writeFileSync('second.txt','other\n');git('add','.');git('commit','-qm','Synthetic source fixture');git('checkout','--detach','-q');
  return run({dir,hint:makeFreshCleanHint(),head:git('rev-parse','HEAD').trim()});
 }finally{process.chdir(cwd);rmSync(dir,{recursive:true,force:true});}
}
test('fresh HEAD: unchanged ordinary detached source returns a fresh positive hint repeatedly',()=>fixture(({hint})=>{
 assert.equal(hint(),true);for(let i=0;i<12;i++)assert.equal(hint(),true);
}));
const changes={
 'unstaged tracked write':()=>writeFileSync('tracked.txt','changed\n'),
 'staged tracked write':()=>{writeFileSync('tracked.txt','changed\n');git('add','tracked.txt');},
 'staged new file':()=>{writeFileSync('new.txt','new');git('add','new.txt');},
 'tracked deletion':()=>rmSync('tracked.txt'),
 'staged deletion':()=>git('rm','-q','tracked.txt'),
 'assume unchanged flag':()=>git('update-index','--assume-unchanged','tracked.txt'),
 'skip worktree flag':()=>git('update-index','--skip-worktree','tracked.txt'),
 'new replacement directory':()=>mkdirSync('.git/refs/replace'),
 'new graft file':()=>writeFileSync('.git/info/grafts',''),
 'new dangling graft link':()=>symlinkSync('/missing-shift-synthetic-target','.git/info/grafts'),
 'new common directory file':()=>writeFileSync('.git/commondir','other\n'),
 'new dangling common directory link':()=>symlinkSync('/missing-shift-synthetic-target','.git/commondir'),
 'local config change':()=>git('config','core.filemode','false'),
 'config include change':()=>git('config','include.path','/missing-shift-synthetic-config'),
 'new empty commit':()=>git('commit','--allow-empty','-qm','Changed synthetic HEAD'),
 'switch to symbolic HEAD':()=>git('switch','-qc','synthetic-branch'),
 'packed refs change':()=>git('pack-refs','--all'),
 'index removed':()=>rmSync('.git/index'),
 'split index selected':()=>git('update-index','--split-index'),
 'same bytes from replaced index inode':()=>{const b=readFileSync('.git/index');writeFileSync('.git/newindex',b);renameSync('.git/newindex','.git/index');},
};
for(const[name,change]of Object.entries(changes))test('fresh HEAD: warm hint rejects '+name,()=>fixture(({hint})=>{
 assert.equal(hint(),true);change();assert.equal(hint(),false);
}));
for(const name of ['GIT_DIR','GIT_WORK_TREE','GIT_INDEX_FILE','GIT_REPLACE_REF_BASE','GIT_CONFIG_COUNT','GIT_GRAFT_FILE','GIT_NO_REPLACE_OBJECTS'])test('fresh HEAD: defined '+name+' including empty values takes original native fallback',()=>fixture(({hint})=>{
 assert.equal(hint(),true);const prior=process.env[name];
 try{for(const value of ['', 'synthetic-selector']){process.env[name]=value;assert.equal(hint(),false);}}
 finally{if(prior===undefined)delete process.env[name];else process.env[name]=prior;}
}));
test('fresh HEAD: non Git environment change invalidates a warm hint',()=>fixture(({hint})=>{
 assert.equal(hint(),true);const name='SHIFT_SYNTHETIC_GUARD_FIXTURE',previous=process.env[name];
 try{process.env[name]='changed';assert.equal(hint(),false);}
 finally{if(previous===undefined)delete process.env[name];else process.env[name]=previous;}
}));
test('fresh HEAD: nested directory and symbolic head use original native fallback',()=>fixture(({hint,dir})=>{
 mkdirSync('nested');process.chdir('nested');assert.equal(hint(),false);process.chdir(dir);git('switch','-qc','symbolic');assert.equal(hint(),false);
}));
test('fresh HEAD: restored tracked bytes are revalidated by new native status',()=>fixture(({hint})=>{
 assert.equal(hint(),true);writeFileSync('tracked.txt','changed\n');assert.equal(hint(),false);
 writeFileSync('tracked.txt','original\n');assert.equal(hint(),true);writeFileSync('tracked.txt','changed again\n');assert.equal(hint(),false);
}));
test('fresh HEAD: gitfile and bare layouts always use original native fallback',()=>fixture(({dir})=>{
 git('worktree','add','--detach','-q',join(dir,'linked'));process.chdir(join(dir,'linked'));assert.equal(makeFreshCleanHint()(),false);
 process.chdir(dir);git('init','--bare','-q','bare');process.chdir(join(dir,'bare'));assert.equal(makeFreshCleanHint()(),false);
}));
test('fresh HEAD: a hint from another directory cannot credit current source',()=>fixture(({hint})=>{
 assert.equal(hint(),true);fixture(()=>assert.equal(hint(),false));
}));
test('fresh HEAD: cold capture rejects preexisting hidden flags and included configuration',()=>fixture(()=>{
 git('update-index','--assume-unchanged','tracked.txt');assert.equal(makeFreshCleanHint()(),false);
 git('update-index','--no-assume-unchanged','tracked.txt');git('config','include.path','/missing-shift-synthetic-config');assert.equal(makeFreshCleanHint()(),false);
}));
for(const [module,key]of[[childProcess,'execFileSync'],[fs,'readFileSync'],[fs,'lstatSync'],[fs,'realpathSync']])test('fresh HEAD: substituted '+key+' takes unchanged native fallback',()=>fixture(({hint})=>{
 assert.equal(hint(),true);const original=module[key];
 try{module[key]=function(...args){return original.apply(this,args);};syncBuiltinESMExports();assert.equal(hint(),false);}
 finally{module[key]=original;syncBuiltinESMExports();}
 assert.equal(hint(),true);
}));
test('fresh HEAD: substituted current-directory function takes unchanged native fallback',()=>fixture(({hint})=>{
 assert.equal(hint(),true);const original=process.cwd;
 try{process.cwd=function(){return original.call(process);};assert.equal(hint(),false);}
 finally{process.cwd=original;}
 assert.equal(hint(),true);
}));

// Raw HEAD reads carry no saved source verdict and retain the original clean guard.
import {freshDetachedSourceHead} from '../release/fresh-food-source-head-20261016.mjs';
test('raw detached HEAD reads actual changed bytes on every call without an old head verdict',()=>fixture(({head})=>{
 assert.equal(freshDetachedSourceHead(),head);assert.equal(freshDetachedSourceHead(),git('rev-parse','HEAD').trim());
 git('commit','--allow-empty','-qm','Fresh detached synthetic head');const next=git('rev-parse','HEAD').trim();assert.notEqual(next,head);assert.equal(freshDetachedSourceHead(),next);
 git('checkout','--detach','-q',head);assert.equal(freshDetachedSourceHead(),head);
}));
test('a raw detached HEAD read cannot grant clean source credit for dirty staged or hidden bytes',()=>fixture(({head,hint})=>{
 assert.equal(hint(),true);writeFileSync('tracked.txt','unapproved\n');assert.equal(freshDetachedSourceHead(),head);assert.equal(hint(),false);
 git('add','tracked.txt');assert.equal(freshDetachedSourceHead(),head);assert.equal(hint(),false);git('reset','--hard','-q',head);
 git('update-index','--assume-unchanged','tracked.txt');writeFileSync('tracked.txt','hidden\n');assert.equal(freshDetachedSourceHead(),head);assert.equal(hint(),false);
}));
test('raw detached HEAD uses the original Git fallback for selectors symbolic nested and worktree layouts',()=>fixture(({dir})=>{
 for(const name of ['GIT_DIR','GIT_WORK_TREE','GIT_INDEX_FILE','GIT_CONFIG_COUNT','GIT_NO_REPLACE_OBJECTS']){const old=process.env[name];try{for(const value of ['','synthetic']){process.env[name]=value;assert.equal(freshDetachedSourceHead(),null);}}finally{if(old===undefined)delete process.env[name];else process.env[name]=old;}}
 mkdirSync('nested');process.chdir('nested');assert.equal(freshDetachedSourceHead(),null);process.chdir(dir);git('switch','-qc','synthetic-symbolic');assert.equal(freshDetachedSourceHead(),null);
 git('worktree','add','--detach','-q',join(dir,'linked'));process.chdir(join(dir,'linked'));assert.equal(freshDetachedSourceHead(),null);
}));
test('raw detached HEAD rejects malformed linked and ambiguous history files',()=>fixture(({head})=>{
 for(const value of [head,'0'.repeat(40)+'\n','f'.repeat(39)+'\n',head.toUpperCase()+'\n',head+'\nextra']){writeFileSync('.git/HEAD',value);assert.equal(freshDetachedSourceHead(),null);}
 writeFileSync('.git/HEAD',head+'\n');renameSync('.git/HEAD','.git/saved-head');symlinkSync('saved-head','.git/HEAD');assert.equal(freshDetachedSourceHead(),null);rmSync('.git/HEAD');renameSync('.git/saved-head','.git/HEAD');
 for(const path of ['.git/commondir','.git/gitdir','.git/info/grafts']){writeFileSync(path,'');assert.equal(freshDetachedSourceHead(),null);rmSync(path);}
 mkdirSync('.git/refs/replace');assert.equal(freshDetachedSourceHead(),null);
}));
test('raw detached HEAD does not bypass replaced read or current-directory builtins',()=>fixture(({head})=>{
 for(const [module,key]of[[childProcess,'execFileSync'],[fs,'readFileSync'],[fs,'lstatSync'],[fs,'realpathSync'],[process,'cwd']]){const original=module[key];try{module[key]=function(...args){return original.apply(this,args);};syncBuiltinESMExports();assert.equal(freshDetachedSourceHead(),null);}finally{module[key]=original;syncBuiltinESMExports();}assert.equal(freshDetachedSourceHead(),head);}
}));
