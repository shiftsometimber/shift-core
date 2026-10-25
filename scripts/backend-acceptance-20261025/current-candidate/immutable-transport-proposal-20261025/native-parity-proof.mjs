import assert from 'node:assert/strict';
import cp from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {immutableHistoryExecFileSync as read} from '../release/immutable-git-facts.mjs';
const native=cp.execFileSync,cwd=process.cwd(),dir=mkdtempSync(join(tmpdir(),'shift-flags-native-proof-'));
const flags=['--no-optional-locks','--no-replace-objects'];
const git=(...args)=>native('git',args,{encoding:'utf8',stdio:'pipe'}).trim();
const outcome=fn=>{try{const v=fn();return {ok:true,value:Buffer.isBuffer(v)?v.toString('hex'):v};}catch(e){return {ok:false,name:e.name,message:e.message,code:e.code??null,status:e.status,signal:e.signal,stdout:Buffer.isBuffer(e.stdout)?e.stdout.toString('hex'):e.stdout,stderr:Buffer.isBuffer(e.stderr)?e.stderr.toString('hex'):e.stderr,spawnargs:e.spawnargs};}};
let assertions=0;
const same=(args,options)=>{assert.deepEqual(outcome(()=>read('git',flags.concat(args),options)),outcome(()=>native('git',flags.concat(args),options)));assertions++;};
try{
 process.chdir(dir);git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
 writeFileSync('file.bin',Buffer.from([0,255,239,187,191,10]));git('add','.');git('commit','-qm','first');const first=git('rev-parse','HEAD');
 writeFileSync('file.bin','second\n');git('add','.');git('commit','-qm','second');const second=git('rev-parse','HEAD');
 for(const command of ['show','rev-parse'])for(const encoding of [undefined,'utf8','hex','base64','latin1'])same([command,first+':file.bin'],encoding?{encoding}:undefined);
 for(const expression of [first+':missing','0'.repeat(40)+':file.bin','HEAD:file.bin'])same(['show',expression],{encoding:'utf8'});
 for(const options of [{encoding:'utf8',stdio:'pipe'},{encoding:'utf8',env:{...process.env}},{encoding:'utf8',timeout:1000}])same(['show',first+':file.bin'],options);
 // Warm facts, then measure only the transport. Metadata/storage/hash assertions
 // still execute on each read; the exact immutable value needs no extra Git child.
 same(['show',first+':file.bin']);let spawns=0;cp.execFileSync=(...args)=>{spawns++;return native(...args);};syncBuiltinESMExports();
 try{for(let i=0;i<100;i++)assert.equal(read('git',flags.concat(['show',first+':file.bin'])).toString('hex'),'00ffefbbbf0a');}finally{cp.execFileSync=native;syncBuiltinESMExports();}
 assert.equal(spawns,0);assertions+=101;
 git('replace',first,second);try{same(['show',first+':file.bin']);same(['rev-parse',first+':file.bin']);assert.equal(read('git',flags.concat(['show',first+':file.bin'])).toString('hex'),'00ffefbbbf0a');assertions++;}finally{git('replace','-d',first);}
 same(['show',first+':file.bin']);
 console.log(JSON.stringify({assertions,cacheWarmReads:100,gitSubprocessesForWarmReads:spawns,explicitNoReplaceSemanticsPreserved:true,diagnosticOnly:true}));
}finally{cp.execFileSync=native;syncBuiltinESMExports();process.chdir(cwd);rmSync(dir,{recursive:true,force:true});}
