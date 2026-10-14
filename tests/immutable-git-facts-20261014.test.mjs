import test from 'node:test';
import assert from 'node:assert/strict';
import cp from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,chmodSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {withImmutableHistoryVerification as scope,immutableHistoryExecFileSync as read} from '../release/immutable-git-facts.mjs';
const native=cp.execFileSync;
const git=(...args)=>native('git',args,{encoding:'utf8',stdio:'pipe'}).trim();
const binary=Buffer.from([0xef,0xbb,0xbf,0x41,0,0xff,0xfe,10]);
function fixture(callback){
 const cwd=process.cwd(),dir=mkdtempSync(join(tmpdir(),'immutable-facts-real-git-'));
 try{
  process.chdir(dir);git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
  mkdirSync('dir');writeFileSync('same.bin',binary);writeFileSync('executable.bin',binary);chmodSync('executable.bin',0o755);symlinkSync('same.bin','link');
  writeFileSync('changed.txt','first\n');writeFileSync('dir/nested.txt','nested\n');writeFileSync('large.bin',Buffer.alloc(70000,0xa5));
  for(const path of ['space name','tab\tname','line\nname','colon:name','unicode-£'])writeFileSync(path,'path '+path+'\n');
  git('add','.');git('commit','-qm','first');const first=git('rev-parse','HEAD');
  writeFileSync('changed.txt','second\n');writeFileSync('alias.bin',binary);mkdirSync('vendor');mkdirSync('vendor/known');mkdirSync('vendor/missing');
  git('add','.');git('update-index','--add','--cacheinfo','160000',first,'vendor/known');git('update-index','--add','--cacheinfo','160000','b'.repeat(40),'vendor/missing');git('commit','-qm','second');
  const second=git('rev-parse','HEAD');git('branch','moving',first);callback({dir,first,second});
 }finally{process.chdir(cwd);rmSync(dir,{recursive:true,force:true});}
}
const value=x=>Buffer.isBuffer(x)?{buffer:x.toString('hex')}:x;
function outcome(fn){try{return{ok:true,result:value(fn())};}catch(e){return{ok:false,name:e.name,message:e.message,code:e.code??null,status:e.status,signal:e.signal,stdout:value(e.stdout),stderr:value(e.stderr),output:e.output?.map(value),spawnargs:e.spawnargs};}}
function same(args,options){
 const expected=outcome(()=>native('git',args,options));
 if(expected.code==='ENOBUFS'){
  // Native ENOBUFS partial output and kill timing vary between OS processes.
  // Prove the exact original invocation/error object passes through unchanged.
  const previous=cp.execFileSync;let originalError,actualError;
  cp.execFileSync=(bin,argv,opts)=>{try{return previous(bin,argv,opts);}catch(error){if(bin==='git'&&JSON.stringify(argv)===JSON.stringify(args))originalError=error;throw error;}};syncBuiltinESMExports();
  try{try{read('git',args,options);}catch(error){actualError=error;}assert(originalError);assert.equal(actualError,originalError);assert.equal(actualError.code,'ENOBUFS');assert.deepEqual(actualError.spawnargs,args);return outcome(()=>{throw actualError;});}
  finally{cp.execFileSync=previous;syncBuiltinESMExports();}
 }
 const actual=outcome(()=>read('git',args,options));assert.deepEqual(actual,expected,args.join(' '));return actual;
}
function count(callback){const calls=[];cp.execFileSync=(...args)=>{calls.push(args);return native(...args);};syncBuiltinESMExports();try{return{value:callback(),calls};}finally{cp.execFileSync=native;syncBuiltinESMExports();}}
test('native Git output stays exact for changed/unchanged paths, modes, trees, gitlinks, unusual filenames, BOM and encodings',()=>fixture(({first,second})=>scope(()=>{
 for(const ref of [first,second])for(const path of ['same.bin','executable.bin','link','changed.txt','dir','dir/nested.txt','space name','tab\tname','line\nname','colon:name','unicode-£']){
  for(const encoding of [undefined,'utf8','hex','base64','latin1','utf16le'])for(const command of ['show','rev-parse'])same([command,ref+':'+path],encoding?{encoding}:undefined);
 }
 for(const path of ['vendor/known','vendor/missing'])for(const command of ['show','rev-parse'])same([command,second+':'+path],{encoding:'utf8'});
 const firstBytes=read('git',['show',first+':same.bin']);firstBytes[0]=0;assert.deepEqual(read('git',['show',first+':same.bin']),binary);
})))
test('unknown objects/paths, path aliases and caller buffer errors retain original command diagnostics',()=>fixture(({first,second})=>scope(()=>{
 for(const command of ['show','rev-parse'])for(const expression of ['0'.repeat(40)+':same.bin',first+':missing',first+':',first+':./same.bin',first+':dir/../same.bin',first+':dir/',first+':/same.bin',first+':dir//nested.txt'])same([command,expression],{encoding:'utf8'});
 for(const command of ['show','rev-parse'])for(const maxBuffer of [0,1,7,8,9,40,41,42,69999,70000,70001])same([command,second+':'+(command==='show'?'large.bin':'same.bin')],{maxBuffer});
 for(const maxBuffer of [7,8,9])same(['show',second+':same.bin'],{maxBuffer,encoding:'utf8'});
})))
test('unsupported options and literal HEAD/branch references always execute native commands freshly',()=>fixture(({first,second,dir})=>{
 scope(()=>{
  for(const options of [{encoding:'utf8',stdio:'pipe'},{encoding:'utf8',timeout:10000},{encoding:'utf8',env:{...process.env}},{encoding:'utf8',input:''},{encoding:'utf8',shell:false},{encoding:'utf8',cwd:dir},{encoding:'utf8',cwd:''},{encoding:'utf8',cwd:0},{encoding:'utf8',cwd:null},{encoding:'utf8',maxBuffer:2.5},{encoding:'buffer'},{encoding:'not-an-encoding'}])same(['show',first+':same.bin'],options);
  const measured=count(()=>{same(['show','HEAD:changed.txt'],{encoding:'utf8'});same(['show','moving:changed.txt'],{encoding:'utf8'});git('update-ref','refs/heads/moving',second);same(['show','moving:changed.txt'],{encoding:'utf8'});same(['rev-parse','HEAD'],{encoding:'utf8'});same(['status','--porcelain'],{encoding:'utf8'});});
  assert(measured.calls.some(([,args])=>args[0]==='show'&&args[1]==='HEAD:changed.txt'));assert(measured.calls.some(([,args])=>args[0]==='show'&&args[1]==='moving:changed.txt'));
 });
 process.chdir(join(dir,'dir'));try{scope(()=>{same(['show',first+':./nested.txt'],{encoding:'utf8'});same(['show',first+':../same.bin'],{encoding:'utf8'});});}finally{process.chdir(dir);}
}))
test('replacement-enabled reads keep native semantics; replacement and mode changes cannot escape the scope',()=>fixture(({first,second})=>{
 const originalMode=process.env.GIT_NO_REPLACE_OBJECTS,originalBase=process.env.GIT_REPLACE_REF_BASE;
 try{
  delete process.env.GIT_NO_REPLACE_OBJECTS;git('replace',first,second);
  scope(()=>{same(['show',first+':changed.txt'],{encoding:'utf8'});same(['rev-parse',first+':changed.txt'],{encoding:'utf8'});});
  process.env.GIT_NO_REPLACE_OBJECTS='1';scope(()=>{same(['show',first+':changed.txt'],{encoding:'utf8'});same(['rev-parse',first+':changed.txt'],{encoding:'utf8'});});
  git('replace','-d',first);delete process.env.GIT_NO_REPLACE_OBJECTS;
  const blob=git('rev-parse',first+':same.bin'),replacement=git('rev-parse',first+':changed.txt');git('replace',blob,replacement);
  scope(()=>{same(['show',first+':same.bin']);});git('replace','-d',blob);
  git('update-ref','refs/custom-replace/'+first,second);process.env.GIT_REPLACE_REF_BASE='refs/custom-replace/';
  scope(()=>{same(['show',first+':changed.txt'],{encoding:'utf8'});});git('update-ref','-d','refs/custom-replace/'+first);delete process.env.GIT_REPLACE_REF_BASE;
  assert.throws(()=>scope(()=>{read('git',['show',first+':changed.txt']);git('replace',first,second);read('git',['show',first+':changed.txt']);}),/replacement state changed/);git('replace','-d',first);
  assert.throws(()=>scope(()=>{read('git',['show',first+':changed.txt']);process.env.GIT_NO_REPLACE_OBJECTS='1';}),/replacement state changed/);delete process.env.GIT_NO_REPLACE_OBJECTS;
  assert.throws(()=>scope(()=>{process.env.GIT_REPLACE_REF_BASE='refs/custom-replace/';}),/replacement state changed/);delete process.env.GIT_REPLACE_REF_BASE;
 }finally{if(originalMode===undefined)delete process.env.GIT_NO_REPLACE_OBJECTS;else process.env.GIT_NO_REPLACE_OBJECTS=originalMode;if(originalBase===undefined)delete process.env.GIT_REPLACE_REF_BASE;else process.env.GIT_REPLACE_REF_BASE=originalBase;}
}))
test('original staged/unstaged/HEAD entry and exit guards still reject source changes after cache hits',()=>fixture(({first,second})=>{
 writeFileSync('changed.txt','working drift\n');assert.throws(()=>scope(()=>{}),/clean tracked/);git('checkout','--','changed.txt');
 writeFileSync('changed.txt','staged drift\n');git('add','changed.txt');assert.throws(()=>scope(()=>{}),/clean tracked/);git('reset','--hard',second);
 assert.throws(()=>scope(()=>{read('git',['show',first+':same.bin']);writeFileSync('changed.txt','drift\n');git('add','changed.txt');read('git',['show',first+':same.bin']);}),/Working source changed/);git('reset','--hard',second);
 assert.throws(()=>scope(()=>{read('git',['show',first+':same.bin']);git('update-ref','HEAD',first);}),/Source HEAD changed/);git('reset','--hard',second);
}))
test('native blob output with a mismatched object digest rejects before admission',()=>fixture(({first})=>{
 const exec=cp.execFileSync;cp.execFileSync=(bin,args,options)=>{const result=native(bin,args,options);if(bin==='git'&&args[0]==='cat-file'&&args[1]==='blob'){const corrupted=Buffer.from(result);corrupted[0]^=1;return corrupted;}return result;};syncBuiltinESMExports();
 try{assert.throws(()=>scope(()=>read('git',['show',first+':same.bin'])),/blob bytes do not match/);}finally{cp.execFileSync=exec;syncBuiltinESMExports();}
}))
test('cached native blob bytes are hash-checked again before reuse',()=>fixture(({first})=>{
 const exec=cp.execFileSync;let captured;
 cp.execFileSync=(bin,args,options)=>{const result=native(bin,args,options);if(bin==='git'&&args[0]==='cat-file'&&args[1]==='blob')captured=result;return result;};syncBuiltinESMExports();
 try{scope(()=>{assert.deepEqual(read('git',['show',first+':same.bin']),binary);assert(captured);captured[0]^=1;assert.throws(()=>read('git',['show',first+':same.bin']),/Cached immutable blob bytes do not match/);});}
 finally{cp.execFileSync=exec;syncBuiltinESMExports();}
}))
test('real Git fixture reduces native subprocesses and elapsed time across shared immutable blobs',()=>{
 const cwd=process.cwd(),dir=mkdtempSync(join(tmpdir(),'immutable-facts-benchmark-'));
 try{
  process.chdir(dir);git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
  for(let i=0;i<50;i++)writeFileSync('file-'+i+'.txt','content-'+i+'\n');writeFileSync('counter','0');git('add','.');git('commit','-qm','base');const refs=[git('rev-parse','HEAD')];
  for(let i=1;i<8;i++){writeFileSync('counter',String(i));git('add','counter');git('commit','-qm','change-'+i);refs.push(git('rev-parse','HEAD'));}
  const requests=refs.flatMap(ref=>Array.from({length:50},(_,i)=>['rev-parse',ref+':file-'+i+'.txt']).concat(Array.from({length:50},(_,i)=>['show',ref+':file-'+i+'.txt'])));
  const start=performance.now(),expected=requests.map(args=>native('git',args));const originalMs=performance.now()-start;
  const measured=count(()=>{const start=performance.now();const actual=scope(()=>requests.map(args=>read('git',args)));return{actual,ms:performance.now()-start};});
  assert.deepEqual(measured.value.actual,expected);assert.equal(measured.calls.filter(([,args])=>args[0]==='ls-tree').length,refs.length);assert.equal(measured.calls.filter(([,args])=>args[0]==='cat-file'&&args[1]==='blob').length,50);
  assert(measured.calls.length<requests.length/5);assert(measured.value.ms<originalMs/2);
  console.log(JSON.stringify({kind:'real_git_immutable_fact_benchmark',requests:requests.length,originalSubprocesses:requests.length,optimisedSubprocesses:measured.calls.length,originalMs,optimisedMs:measured.value.ms,outputByteEquality:true}));
 }finally{process.chdir(cwd);rmSync(dir,{recursive:true,force:true});}
});

test('a temporary switch to another repository cannot reuse the first repository immutable fact',()=>fixture(({first})=>{
 const initial=process.cwd(),other=mkdtempSync(join(tmpdir(),'immutable-facts-other-repo-'));
 try{
  process.chdir(other);git('init','-q');process.chdir(initial);
  scope(()=>{
   read('git',['show',first+':same.bin'],{encoding:'utf8'});
   process.chdir(other);try{same(['show',first+':same.bin'],{encoding:'utf8'});same(['rev-parse',first+':same.bin'],{encoding:'utf8'});}finally{process.chdir(initial);}
  });
 }finally{process.chdir(initial);rmSync(other,{recursive:true,force:true});}
}));

test('temporary Git namespace and executable environment changes cannot reuse generic cached facts',()=>fixture(({first,second})=>{
 const initial=process.cwd(),other=mkdtempSync(join(tmpdir(),'immutable-facts-env-repo-'));
 const original=Object.fromEntries(['GIT_DIR','GIT_WORK_TREE','PATH'].map(key=>[key,process.env[key]]));
 const restore=()=>{for(const[key,value]of Object.entries(original))if(value===undefined)delete process.env[key];else process.env[key]=value;};
 try{
  process.chdir(other);git('init','-q');process.chdir(initial);
  scope(()=>{
   const args=['diff','--name-only',first,second];read('git',args,{encoding:'utf8'});
   process.env.GIT_DIR=join(other,'.git');process.env.GIT_WORK_TREE=other;
   try{same(args,{encoding:'utf8'});}finally{restore();}
   process.env.PATH=join(other,'missing-executables');try{same(args,{encoding:'utf8'});}finally{restore();}
  });
 }finally{restore();process.chdir(initial);rmSync(other,{recursive:true,force:true});}
}));

test('separate scopes cannot share generic facts across changed native Git configuration',()=>fixture(({first})=>{
 const keys=['GIT_CONFIG_COUNT','GIT_CONFIG_KEY_0','GIT_CONFIG_VALUE_0'];
 const original=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 try{
  writeFileSync('unicode-£','changed\n');git('add','.');git('commit','-qm','unicode');
  const args=['diff','--name-only',first,git('rev-parse','HEAD')];
  process.env.GIT_CONFIG_COUNT='1';process.env.GIT_CONFIG_KEY_0='core.quotePath';process.env.GIT_CONFIG_VALUE_0='true';
  const quoted=scope(()=>{same(args,{encoding:'utf8'});return read('git',args,{encoding:'utf8'});});
  process.env.GIT_CONFIG_VALUE_0='false';
  const literal=scope(()=>{same(args,{encoding:'utf8'});return read('git',args,{encoding:'utf8'});});
  assert.notEqual(quoted,literal);assert(literal.includes('unicode-£'));
 }finally{for(const[key,value]of Object.entries(original))if(value===undefined)delete process.env[key];else process.env[key]=value;}
}));
