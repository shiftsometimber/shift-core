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
// Append this fragment after current_state_tests.mjs; it uses its native Git fixture.
import performanceChildProcess from 'node:child_process';
import {syncBuiltinESMExports as performanceSyncBuiltinESMExports} from 'node:module';
import {mkdirSync as performanceMkdir,renameSync as performanceRename,readFileSync as performanceReadFile} from 'node:fs';
const performanceNative=performanceChildProcess.execFileSync;
const performanceGit=(...args)=>performanceNative('git',args,{encoding:'utf8',stdio:'pipe'}).trim();
function performanceOutcome(callback){
 try{const result=callback();return{ok:true,result:Buffer.isBuffer(result)?{hex:result.toString('hex')}:result};}
 catch(error){const value=x=>Buffer.isBuffer(x)?{hex:x.toString('hex')}:x;return{ok:false,name:error.name,message:error.message,code:error.code??null,status:error.status,signal:error.signal,stdout:value(error.stdout),stderr:value(error.stderr),output:error.output?.map(value),spawnargs:error.spawnargs};}
}
function performanceSame(args,options={encoding:'utf8'}){
 const expected=performanceOutcome(()=>performanceNative('git',args,options));
 const actual=performanceOutcome(()=>read('git',args,options));assert.deepEqual(actual,expected,args.join(' '));return actual;
}
function performanceCount(callback){
 const previous=performanceChildProcess.execFileSync,calls=[];
 performanceChildProcess.execFileSync=(...args)=>{calls.push(args);return performanceNative(...args);};performanceSyncBuiltinESMExports();
 try{return{value:callback(),calls};}
 finally{performanceChildProcess.execFileSync=previous;performanceSyncBuiltinESMExports();}
}
function performanceDirectoryFixture(callback){
 return fixture(({dir})=>{
  performanceMkdir('directory');writeFileSync('directory/unicode-£','same directory bytes\n');writeFileSync('directory/space name','same directory bytes\n');
  for(let i=0;i<30;i++)writeFileSync('directory/file-'+i+'.txt','directory payload '+i+'\n');
  performanceGit('add','.');performanceGit('commit','-qm','directory source');const firstDirectory=performanceGit('rev-parse','HEAD');
  writeFileSync('counter','unrelated commit\n');performanceGit('add','counter');performanceGit('commit','-qm','same directory in later commit');const secondDirectory=performanceGit('rev-parse','HEAD');
  assert.equal(performanceGit('rev-parse',firstDirectory+':directory'),performanceGit('rev-parse',secondDirectory+':directory'),'Fixture requires one identical directory object under two literal expressions');
  callback({dir,firstDirectory,secondDirectory});
 });
}
function performanceSupportedNativeContext(){
 try{return performanceGit('rev-parse','--show-ref-format')==='files'&&performanceOutcome(()=>performanceNative('git',['var','GIT_CONFIG_SYSTEM'],{encoding:'utf8',stdio:'pipe'})).ok&&performanceOutcome(()=>performanceNative('git',['var','GIT_CONFIG_GLOBAL'],{encoding:'utf8',stdio:'pipe'})).ok;}
 catch{return false;}
}
test('literal directory native outputs retain each expression header and are reusable unscoped and across guarded scopes',()=>performanceDirectoryFixture(({firstDirectory,secondDirectory})=>{
 const requests=[firstDirectory,secondDirectory].map(ref=>['show',ref+':directory']);
 const expected=requests.map(args=>performanceNative('git',args));
 for(let i=0;i<requests.length;i++)assert(expected[i].toString('utf8').startsWith('tree '+requests[i][1]+'\n'),'Native directory header must retain the complete literal expression');
 assert.notDeepEqual(expected[0],expected[1],'Different literal expression headers must not collapse through a shared tree OID');
 const supported=performanceSupportedNativeContext();
 const measured=performanceCount(()=>{
  const pass=()=>{for(let round=0;round<8;round++)for(let i=0;i<requests.length;i++){
   assert.deepEqual(read('git',requests[i]),expected[i]);assert.equal(read('git',requests[i],{encoding:'utf8'}),expected[i].toString('utf8'));assert.equal(read('git',requests[i],{encoding:'hex'}),expected[i].toString('hex'));
  }};
  pass();scope(pass);scope(pass);pass();
  const mutable=read('git',requests[0]);mutable[0]^=1;assert.deepEqual(read('git',requests[0]),expected[0],'Returned Buffer mutation cannot poison native directory output');
 });
 const showCalls=measured.calls.filter(([bin,args])=>bin==='git'&&args?.length===2&&args[0]==='show'&&requests.some(request=>request[1]===args[1])).length;
 if(supported)assert(showCalls<8,'A supported native file-ref context must reuse directory output outside and across scopes');
 console.log(JSON.stringify({kind:'native_directory_reuse_parity',supportedNativeContext:supported,literalExpressions:requests.length,requestedReads:194,nativeDirectoryShows:showCalls,outputByteEquality:true}));
}));
test('mutating an included configuration file refreshes warmed directory output without changing its parent config',()=>performanceDirectoryFixture(({dir,firstDirectory})=>{
 const included=join(dir,'.git','immutable-facts-included-config');writeFileSync(included,'[core]\n\tquotePath = true\n');performanceGit('config','include.path',included);
 const parentConfig=performanceReadFile(join(dir,'.git','config')),args=['show',firstDirectory+':directory'];
 performanceSame(args);const quoted=read('git',args,{encoding:'utf8'});assert.equal(performanceGit('config','core.quotePath'),'true');
 writeFileSync(included,'[core]\n\tquotePath = false\n');assert.deepEqual(performanceReadFile(join(dir,'.git','config')),parentConfig,'Parent config must remain unchanged while the include changes');assert.equal(performanceGit('config','core.quotePath'),'false');
 const refreshed=performanceCount(()=>read('git',args,{encoding:'utf8'}));assert(refreshed.calls.some(([bin,argv])=>bin==='git'&&JSON.stringify(argv)===JSON.stringify(args)),'Changed included configuration must invalidate the warmed native directory display even when its bytes happen to remain equal');
 performanceSame(args);const literal=refreshed.value;assert.equal(literal,performanceNative('git',args,{encoding:'utf8'}));assert(literal.includes('unicode-£'));
 scope(()=>performanceSame(args));writeFileSync(included,'[core]\n\tquotePath = true\n');performanceSame(args);assert.equal(read('git',args,{encoding:'utf8'}),quoted);
}));
test('warmed unscoped commit and blob reads retain native semantics through temporary loose and packed replacements',()=>fixture(({first,second})=>{
 const oldMode=process.env.GIT_NO_REPLACE_OBJECTS;delete process.env.GIT_NO_REPLACE_OBJECTS;
 const args=['show',first+':file.txt'],blob=performanceGit('rev-parse',first+':file.txt'),otherBlob=performanceGit('rev-parse',second+':file.txt');
 try{
  performanceSame(args);performanceSame(['rev-parse',first+':file.txt']);
  for(const [original,replacement]of [[first,second],[blob,otherBlob]]){
   performanceGit('replace',original,replacement);
   try{
    performanceSame(args);performanceSame(['rev-parse',first+':file.txt']);assert.equal(read('git',args,{encoding:'utf8'}),'second\n');
    performanceGit('pack-refs','--all');performanceSame(args);scope(()=>performanceSame(args));
   }finally{performanceGit('replace','-d',original);}
   performanceSame(args);assert.equal(read('git',args,{encoding:'utf8'}),'first\n');scope(()=>performanceSame(args));
  }
 }finally{if(oldMode===undefined)delete process.env.GIT_NO_REPLACE_OBJECTS;else process.env.GIT_NO_REPLACE_OBJECTS=oldMode;}
}));
test('a warmed literal blob cannot remain successful after its actual loose Git object disappears',()=>fixture(({dir,first})=>{
 const args=['show',first+':file.txt'],oid=performanceGit('rev-parse',first+':file.txt'),object=join(dir,'.git','objects',oid.slice(0,2),oid.slice(2)),saved=join(dir,'.git','saved-immutable-loose-object');
 performanceSame(args);performanceRename(object,saved);
 try{assert.equal(performanceSame(args).ok,false,'Missing actual blob must retain native Git failure');}
 finally{performanceRename(saved,object);}
 performanceSame(args);assert.equal(read('git',args,{encoding:'utf8'}),'first\n');
}));
test('replacing a warmed repository objects root with an empty root retains native missing-object errors',()=>fixture(({dir,first})=>{
 const args=['show',first+':file.txt'],objects=join(dir,'.git','objects'),saved=join(dir,'.git','saved-immutable-objects');
 performanceSame(args);performanceSame(['rev-parse',first+':file.txt']);performanceRename(objects,saved);performanceMkdir(objects);
 try{assert.equal(performanceSame(args).ok,false);assert.equal(performanceSame(['rev-parse',first+':file.txt']).ok,false);}
 finally{rmSync(objects,{recursive:true,force:true});performanceRename(saved,objects);}
 performanceSame(args);performanceSame(['rev-parse',first+':file.txt']);
}));
test('alternate-backed warmed reads retain native failures after alternate objects vanish or the alternate path becomes unknown',()=>fixture(({dir,first})=>{
 const borrower=mkdtempSync(join(tmpdir(),'immutable-performance-alternate-')),args=['show',first+':file.txt'];
 const oid=performanceGit('rev-parse',first+':file.txt'),object=join(dir,'.git','objects',oid.slice(0,2),oid.slice(2)),saved=join(dir,'.git','saved-alternate-immutable-object');
 try{
  performanceNative('git',['init','-q',borrower],{encoding:'utf8',stdio:'pipe'});process.chdir(borrower);
  performanceGit('config','user.name','Alternate fixture');performanceGit('config','user.email','alternate@example.invalid');writeFileSync('borrower-only.txt','independent local borrower history\n');performanceGit('add','.');performanceGit('commit','-qm','local borrower source');
  const alternate=join(borrower,'.git','objects','info','alternates');writeFileSync(alternate,join(dir,'.git','objects')+'\n');
  performanceSame(args);performanceSame(['rev-parse',first+':file.txt']);performanceRename(object,saved);
  try{assert.equal(performanceSame(args).ok,false,'Vanished object in an unchanged alternate directory must be a native failure');}
  finally{performanceRename(saved,object);}
  performanceSame(args);rmSync(alternate);assert.equal(performanceSame(args).ok,false,'Removing the alternate connection must invalidate warmed object facts');
  writeFileSync(alternate,join(borrower,'missing-object-store')+'\n');assert.equal(performanceSame(args).ok,false,'Unknown alternate storage must retain native error diagnostics');
  writeFileSync(alternate,join(dir,'.git','objects')+'\n');performanceSame(args);
 }finally{process.chdir(dir);rmSync(borrower,{recursive:true,force:true});}
}));
test('warmed directory maxBuffer errors preserve the exact native error and unsupported options retain their native semantics',()=>performanceDirectoryFixture(({firstDirectory})=>{
 const args=['show',firstDirectory+':directory'];performanceSame(args);performanceSame(args,undefined);
 const previous=performanceChildProcess.execFileSync;let originalError;
 performanceChildProcess.execFileSync=(bin,argv,options)=>{
  try{return performanceNative(bin,argv,options);}
  catch(error){if(bin==='git'&&JSON.stringify(argv)===JSON.stringify(args)&&options?.maxBuffer===1)originalError=error;throw error;}
 };performanceSyncBuiltinESMExports();
 try{assert.throws(()=>read('git',args,{encoding:'utf8',maxBuffer:1}),error=>{assert(originalError,'The exact original native directory command must execute on caller buffer failure');assert.equal(error,originalError);assert.equal(error.code,'ENOBUFS');return true;});}
 finally{performanceChildProcess.execFileSync=previous;performanceSyncBuiltinESMExports();}
 for(const options of [{encoding:'utf8',stdio:'pipe'},{encoding:'utf8',timeout:30000},{encoding:'utf8',input:''},{encoding:'utf8',shell:false},{encoding:'utf8',env:{...process.env,GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'core.quotePath',GIT_CONFIG_VALUE_0:'false'}}])performanceSame(args,options);
 assert(read('git',args,{encoding:'utf8',env:{...process.env,GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'core.quotePath',GIT_CONFIG_VALUE_0:'false'}}).includes('unicode-£'),'An unsupported env option must reach native Git with the supplied quoting configuration');
 performanceSame(args);
}));

test('native entry guard rejects assume-unchanged and skip-worktree files whose modified working bytes are hidden from diff',()=>fixture(({second})=>{
 for(const [set,clear]of [['--assume-unchanged','--no-assume-unchanged'],['--skip-worktree','--no-skip-worktree']]){
  git('update-index',set,'file.txt');writeFileSync('file.txt','hidden changed source\n');assert.equal(git('diff','--name-only','HEAD','--'),'');
  try{assert.throws(()=>scope(()=>{}),/hidden assume-unchanged\/skip-worktree index flags at entry/);}
  finally{git('update-index',clear,'file.txt');git('reset','--hard',second);}
 }
}));
test('native exit guard rejects newly hidden index inputs after authenticated immutable fact reuse',()=>fixture(({first,second})=>{
 for(const [set,clear]of [['--assume-unchanged','--no-assume-unchanged'],['--skip-worktree','--no-skip-worktree']]){
  try{assert.throws(()=>scope(()=>{same(['show',first+':file.txt']);git('update-index',set,'file.txt');writeFileSync('file.txt','hidden changed source\n');assert.equal(git('diff','--name-only','HEAD','--'),'');}),/hidden assume-unchanged\/skip-worktree index flags at exit/);}
  finally{git('update-index',clear,'file.txt');git('reset','--hard',second);}
 }
}));

test('native source difference exposes an unrelated deletion hidden by rename detection into an allowed destination',async()=>{
 const {nativeGitSourceDifference}=await import('../release/immutable-git-facts.mjs');
 fixture(()=>{
  writeFileSync('unrelated-original.txt','unchanged rename payload\n');git('add','.');git('commit','-qm','original unrelated input');const before=git('rev-parse','HEAD');
  git('mv','unrelated-original.txt','allowed-destination.txt');git('commit','-qm','hidden unrelated deletion');const after=git('rev-parse','HEAD');git('config','diff.renames','true');
  assert.equal(git('diff','--name-only',before,after),'allowed-destination.txt');
  assert.deepEqual(nativeGitSourceDifference(before,after),['allowed-destination.txt','unrelated-original.txt']);
  assert.equal(nativeGitSourceDifference(before,after).every(path=>path==='allowed-destination.txt'),false,'The bounded source guard must reject the otherwise concealed unrelated deletion');
 });
});


test('scoped alternate-backed warmed reads retain native failure after a donor object vanishes',()=>fixture(({dir,first})=>{
 const initial=process.cwd(),borrower=mkdtempSync(join(tmpdir(),'immutable-scoped-alternate-'));
 const oid=performanceGit('rev-parse',first+':file.txt'),object=join(dir,'.git','objects',oid.slice(0,2),oid.slice(2)),saved=join(dir,'.git','saved-scoped-alternate-object');
 let hidden=false;
 try{
  process.chdir(borrower);performanceGit('init','-q');performanceGit('config','user.name','Alternate fixture');performanceGit('config','user.email','alternate@example.invalid');
  writeFileSync('borrower-only.txt','independent local borrower history\n');performanceGit('add','.');performanceGit('commit','-qm','local borrower source');
  writeFileSync('.git/objects/info/alternates',join(dir,'.git','objects')+'\n');
  scope(()=>{
   const args=['show',first+':file.txt'];performanceSame(args);
   performanceRename(object,saved);hidden=true;
   try{assert.equal(performanceSame(args).ok,false,'An unchanged borrower scope must retain the vanished donor-object error');}
   finally{performanceRename(saved,object);hidden=false;}
   performanceSame(args);
  });
 }finally{if(hidden)performanceRename(saved,object);process.chdir(initial);rmSync(borrower,{recursive:true,force:true});}
}));
