import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {assertExactNavigationPayload,assertActualNavigationFrame,ACTUAL_NAVIGATION_PATHS,ACTUAL_NAVIGATION_MAINTENANCE} from '../release/recorded-week-navigation-outer-frame-20261018.mjs';
const policy=JSON.parse(readFileSync(new URL('../release/recorded-week-navigation-outer-policy-20261018.json',import.meta.url)));
const git=(...a)=>execFileSync('/usr/bin/git',['--no-replace-objects',...a],{maxBuffer:64e6});
test('the original two-file navigation payload is literal and restores the accepted source',()=>{
 assert.deepEqual(ACTUAL_NAVIGATION_PATHS,['frontend/member/member-progress-v1.js','member-experience/staging/verify-treatment-week-navigation.mjs']);
 for(const p of ACTUAL_NAVIGATION_PATHS){const value=git('show','HEAD:'+p),restored=assertExactNavigationPayload(p,value);if(restored===null)assert.equal(git('ls-tree',policy.record.base,'--',p).length,0);else assert(restored.equals(git('show',policy.record.base+':'+p)));}
});
test('an extra path cannot acquire navigation authority',()=>assert.throws(()=>assertExactNavigationPayload('worker-entry-v6.js',Buffer.from('x'))));
test('changed payload bytes, a stale preimage and executable modes are rejected',()=>{
 const p=ACTUAL_NAVIGATION_PATHS[0],value=git('show','HEAD:'+p);
 assert.throws(()=>assertExactNavigationPayload(p,Buffer.concat([value,Buffer.from('\n')])));
 assert.throws(()=>assertExactNavigationPayload(p,git('show',policy.record.base+':'+p)));
 assert.throws(()=>assertExactNavigationPayload(p,value,'100755'));
});
test('callers cannot forge an admitted native source frame',()=>assert.throws(()=>assertActualNavigationFrame({assertCurrent(){}})));
test('all original native guard and CSV bodies restore exactly beneath their hooks',()=>{
 for(const e of policy.maintenanceEntries.filter(x=>x.kind==='maintenance')){
  let value=git('show','HEAD:'+e.path);
  for(const h of [...e.hunks].reverse()){const a=Buffer.from(h.after,'base64'),b=Buffer.from(h.before,'base64'),i=value.indexOf(a);assert(i>=0&&value.indexOf(a,i+1)<0);value=Buffer.concat([value.subarray(0,i),b,value.subarray(i+a.length)]);}
  assert(value.equals(git('show',policy.record.base+':'+e.path)),e.path);
 }
 assert.equal(ACTUAL_NAVIGATION_MAINTENANCE.length,8);
});

// These small ordinary repositories exercise mutable source guards without
// replacing the existing exact-payload, whole-inverse or runtime-authority tests.
import {nativeNavigationFreshSourceChecker} from '../release/recorded-week-navigation-outer-frame-20261018.mjs';
import {mkdtempSync,writeFileSync,mkdirSync,rmSync,realpathSync as nativeRealpathSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
function nativeSourceFixture(body){
 const cwd=process.cwd(),root=mkdtempSync(join(nativeRealpathSync(tmpdir()),'shift-navigation-native-'));
 const run=(...args)=>execFileSync('/usr/bin/git',args,{cwd:root,encoding:'utf8',stdio:'pipe'}).trim();
 try{
  run('init','--initial-branch=main');writeFileSync(join(root,'source.txt'),'approved\n');run('add','source.txt');
  run('-c','user.name=SHIFT finite source check','-c','user.email=source-check@invalid.example','commit','-m','Exact local source fixture');
  process.chdir(root);body({root,run,head:run('rev-parse','HEAD')});
 }finally{process.chdir(cwd);rmSync(root,{recursive:true,force:true});}
}
test('fresh native navigation checks repeatedly accept the same ordinary source',()=>nativeSourceFixture(({head})=>{
 const check=nativeNavigationFreshSourceChecker(head);for(let i=0;i<4;i++)check();
}));
test('fresh native navigation checks reject changed working bytes',()=>nativeSourceFixture(({root,head})=>{
 const check=nativeNavigationFreshSourceChecker(head);writeFileSync(join(root,'source.txt'),'changed\n');assert.throws(check);
}));
test('fresh native navigation checks reject staged changes',()=>nativeSourceFixture(({root,run,head})=>{
 const check=nativeNavigationFreshSourceChecker(head);writeFileSync(join(root,'source.txt'),'changed\n');run('add','source.txt');assert.throws(check);
}));
test('fresh native navigation checks reject hidden index flags',()=>nativeSourceFixture(({run,head})=>{
 const check=nativeNavigationFreshSourceChecker(head);run('update-index','--skip-worktree','source.txt');assert.throws(check);
}));
test('fresh native navigation checks reject moved symbolic HEAD targets',()=>nativeSourceFixture(({root,run,head})=>{
 const check=nativeNavigationFreshSourceChecker(head);writeFileSync(join(root,'source.txt'),'second\n');run('add','source.txt');
 run('-c','user.name=SHIFT finite source check','-c','user.email=source-check@invalid.example','commit','-m','Moved local source fixture');assert.throws(check);
}));
test('fresh native navigation checks reject changed repository configuration',()=>nativeSourceFixture(({run,head})=>{
 const check=nativeNavigationFreshSourceChecker(head);run('config','core.filemode','false');assert.throws(check);
}));
test('fresh native navigation checks reject changed included configuration',()=>nativeSourceFixture(({root,run,head})=>{
 const included=join(root,'private-config');writeFileSync(included,'[core]\n\tfilemode = true\n');run('config','include.path',included);
 const check=nativeNavigationFreshSourceChecker(head);writeFileSync(included,'[core]\n\tfilemode = false\n');assert.throws(check);
}));
test('fresh native navigation checks reject newly introduced replacement refs',()=>nativeSourceFixture(({root,head})=>{
 const check=nativeNavigationFreshSourceChecker(head),dir=join(root,'.git','refs','replace');mkdirSync(dir,{recursive:true});writeFileSync(join(dir,head),head+'\n');assert.throws(check);
}));
test('fresh native navigation checks reject packed-ref changes',()=>nativeSourceFixture(({run,head})=>{
 const check=nativeNavigationFreshSourceChecker(head);run('tag','local-fixture');run('pack-refs','--all');assert.throws(check);
}));
test('fresh native navigation checks reject redirected index metadata',()=>nativeSourceFixture(({root,head})=>{
 const check=nativeNavigationFreshSourceChecker(head),index=join(root,'.git','index'),bytes=readFileSync(index),copy=join(root,'private-index');writeFileSync(copy,bytes);rmSync(index);symlinkSync(copy,index);assert.throws(check);
}));
test('fresh native navigation checks reject changed execution environment',()=>nativeSourceFixture(({head})=>{
 const check=nativeNavigationFreshSourceChecker(head),key='SHIFT_NAVIGATION_NATIVE_FIXTURE',before=process.env[key];
 try{process.env[key]='changed';assert.throws(check);}finally{if(before===undefined)delete process.env[key];else process.env[key]=before;}
}));
