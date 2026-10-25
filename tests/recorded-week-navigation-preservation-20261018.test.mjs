import {spawn as spawnNavigationChild} from 'node:child_process';
// Keep the original child deadline/output bounds while allowing the test
// runner to drain its own streams and IPC during native child verification.
function runNavigationChild(args,{cwd,timeout,maxBuffer}){
 return new Promise(resolve=>{
  const child=spawnNavigationChild(process.execPath,args,{cwd,stdio:['ignore','pipe','pipe']});
  const chunks={stdout:[],stderr:[]},sizes={stdout:0,stderr:0};let error=null,killTimer;
  const stop=code=>{if(error)return;error=Object.assign(new Error(code),{code});child.kill('SIGTERM');killTimer=setTimeout(()=>child.kill('SIGKILL'),250);};
  const timer=setTimeout(()=>stop('ETIMEDOUT'),timeout);
  for(const name of ['stdout','stderr'])child[name].on('data',bytes=>{sizes[name]+=bytes.length;if(sizes[name]>maxBuffer)stop('ENOBUFS');else chunks[name].push(bytes);});
  child.once('error',e=>{error=e;});
  child.once('close',code=>{clearTimeout(timer);clearTimeout(killTimer);resolve({status:error?null:code,error,stdout:Buffer.concat(chunks.stdout).toString('utf8'),stderr:Buffer.concat(chunks.stderr).toString('utf8')});});
 });
}
import {qualifyJoinedSuccessor} from '../release/my-timber-joined-look-scope-20261024.mjs';
import {websiteEditorialCompletionHistoricalView,websiteEditorialCompletionOriginalSource} from '../release/website-editorial-scope-20261018.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {assertExactNavigationPayload,assertActualNavigationFrame,ACTUAL_NAVIGATION_PATHS,ACTUAL_NAVIGATION_MAINTENANCE} from '../release/recorded-week-navigation-outer-frame-20261018.mjs';
const policy=JSON.parse(readFileSync(new URL('../release/recorded-week-navigation-outer-policy-20261018.json',import.meta.url)));
const git=(...a)=>execFileSync('/usr/bin/git',['--no-replace-objects',...a],{maxBuffer:64e6});
test('the original two-file navigation payload is literal and restores the accepted source',()=>{
 assert.deepEqual(ACTUAL_NAVIGATION_PATHS,['frontend/member/member-progress-v1.js','member-experience/staging/verify-treatment-week-navigation.mjs']);
 for(const p of ACTUAL_NAVIGATION_PATHS){const actual=git('show','HEAD:'+p),value=qualifyJoinedSuccessor().comparisonValue(p,actual),restored=assertExactNavigationPayload(p,value);if(restored===null)assert.equal(git('ls-tree',policy.record.base,'--',p).length,0);else assert(restored.equals(git('show',policy.record.base+':'+p)));}
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
  let value=git('show','HEAD:'+e.path);const editorialFixture=websiteEditorialCompletionHistoricalView();if(editorialFixture)value=Buffer.from(websiteEditorialCompletionOriginalSource(e.path,value.toString('utf8'),editorialFixture));
  for(const h of [...e.hunks].reverse()){const a=Buffer.from(h.after,'base64'),b=Buffer.from(h.before,'base64'),i=value.indexOf(a);assert(i>=0&&value.indexOf(a,i+1)<0);value=Buffer.concat([value.subarray(0,i),b,value.subarray(i+a.length)]);}
  assert(value.equals(git('show',policy.record.base+':'+e.path)),e.path);
 }
 assert.equal(ACTUAL_NAVIGATION_MAINTENANCE.length,10);
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

test('a supplied navigation reader cannot hide changed working source inside a closed proof',async()=>{
 const {mkdtempSync,rmSync}=await import('node:fs');
 const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const {execFileSync,spawnSync}=await import('node:child_process');
 const directory=mkdtempSync(join(tmpdir(),'navigation-live-callback-'));
 try{
  execFileSync('git',['clone','--no-hardlinks','--no-checkout',process.cwd(),directory],{stdio:'pipe'});
  execFileSync('git',['checkout','--detach','HEAD'],{cwd:directory,stdio:'pipe'});
  const script="import assert from 'node:assert/strict';import {readFileSync,writeFileSync,appendFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {withImmutableHistoryVerification} from './release/immutable-git-facts.mjs';import {actualNavigationOuterFrame} from './release/recorded-week-navigation-outer-frame-20261018.mjs';withImmutableHistoryVerification(()=>{const frame=actualNavigationOuterFrame();assert(frame);const p='scheduled-knowledge-v1.js',before=readFileSync(p);try{assert.throws(()=>frame.projectRead((r,path)=>{appendFileSync(p,'\\n// transient supplied-reader working change\\n');return execFileSync('git',['rev-parse',(r==='HEAD'?frame.rawHead:r)+':'+path],{encoding:'utf8'}).trim();})('HEAD','wrangler.jsonc'),/working|source drift|clean|tracked/i);}finally{writeFileSync(p,before);}assert.equal(execFileSync('git',['diff','--no-renames','--name-only','HEAD','--'],{encoding:'utf8'}).trim(),'');});console.log('transient-callback-drift-rejected');";
  const result=await runNavigationChild(['--input-type=module','-e',script],{cwd:directory,timeout:45000,maxBuffer:64e6});
  assert.equal(result.status,0,result.stderr||String(result.error));assert.match(result.stdout,/transient-callback-drift-rejected/);
 }finally{rmSync(directory,{recursive:true,force:true});}
});

test('parallel stat-only index refresh can finish, while sustained writers and changed source still fail',async()=>{
 const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {execFileSync,spawnSync}=await import('node:child_process');
 const directory=mkdtempSync(join(tmpdir(),'navigation-index-reader-'));
 try{
  execFileSync('git',['clone','--no-hardlinks','--no-checkout',process.cwd(),directory],{stdio:'pipe'});execFileSync('git',['checkout','--detach','HEAD'],{cwd:directory,stdio:'pipe'});
  const script="import assert from 'node:assert/strict';import {existsSync,readFileSync,writeFileSync,rmSync} from 'node:fs';import {spawn} from 'node:child_process';import {actualNavigationOuterFrame} from './release/recorded-week-navigation-outer-frame-20261018.mjs';\nconst lock='.git/index.lock',pause=new Int32Array(new SharedArrayBuffer(4));\nasync function transient(change,body){\n const workerCode=\"import{writeFileSync,rmSync}from'node:fs';writeFileSync('.git/index.lock','controlled native stat-refresh fixture');\"+(change?\"writeFileSync('scheduled-knowledge-v1.js','changed while an index writer is active\\\\n');\":\"\")+\"setTimeout(()=>{rmSync('.git/index.lock');},150);\";\n const worker=spawn(process.execPath,['--input-type=module','-e',workerCode],{stdio:'pipe'}),deadline=Date.now()+1500;\n while(!existsSync(lock)&&Date.now()<deadline)Atomics.wait(pause,0,0,10);\n assert(existsSync(lock),'The concurrent writer fixture must actually hold the index lock');\n try{body();}finally{await new Promise(resolve=>worker.once('close',resolve));}\n}\nawait transient(false,()=>{const frame=actualNavigationOuterFrame();assert(frame);frame.assertCurrent();frame.finish();});\nconst file='scheduled-knowledge-v1.js',before=readFileSync(file);try{await transient(true,()=>assert.throws(()=>actualNavigationOuterFrame(),error=>error instanceof assert.AssertionError&&String(error.actual).includes(file)));}finally{writeFileSync(file,before);}\nwriteFileSync(lock,'controlled sustained writer');try{assert.throws(()=>actualNavigationOuterFrame(),/source-index writer is active/);}finally{rmSync(lock);}\nconsole.log('transient-stat-reader-completed-real-source-drift-and-sustained-writer-rejected');\n";
  const result=await runNavigationChild(['--input-type=module','-e',script],{cwd:directory,timeout:45000,maxBuffer:64e6});
  assert.equal(result.status,0,result.stderr||String(result.error));assert.match(result.stdout,/transient-stat-reader-completed-real-source-drift-and-sustained-writer-rejected/);
 }finally{rmSync(directory,{recursive:true,force:true});}
});

test('recreated native checkers reject working-byte and hidden-index mutation after warm reuse',()=>nativeSourceFixture(({root,run,head})=>{
 nativeNavigationFreshSourceChecker(head)();
 nativeNavigationFreshSourceChecker(head)();
 writeFileSync(join(root,'source.txt'),'unreviewed\n');
 assert.throws(()=>nativeNavigationFreshSourceChecker(head)());
 writeFileSync(join(root,'source.txt'),'approved\n');
 run('update-index','--skip-worktree','source.txt');
 assert.throws(()=>nativeNavigationFreshSourceChecker(head)());
}));
test('a new legitimate metadata context never rebases an existing native checker',()=>nativeSourceFixture(({run,head})=>{
 const original=nativeNavigationFreshSourceChecker(head);original();
 run('config','core.logAllRefUpdates','false');
 const fresh=nativeNavigationFreshSourceChecker(head);fresh();
 assert.throws(original,/metadata changed/);
}));
test('recreated native checkers cannot accept a new HEAD under a stale expected source',()=>nativeSourceFixture(({root,run,head})=>{
 nativeNavigationFreshSourceChecker(head)();
 writeFileSync(join(root,'source.txt'),'new committed source\n');run('add','source.txt');
 run('-c','user.name=SHIFT finite source check','-c','user.email=source-check@invalid.example','commit','-m','New source');
 assert.throws(()=>nativeNavigationFreshSourceChecker(head)());
 nativeNavigationFreshSourceChecker(run('rev-parse','HEAD'))();
}));
