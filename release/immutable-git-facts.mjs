import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {homedir} from 'node:os';

// Synchronous test verification can reuse only actual immutable Git history.
// Current HEAD and tracked working bytes are checked at both scope boundaries.
// This never caches caller-supplied source readers or validation outcomes.
let immutableHistoryScope=null;
// Keep the complete execution environment private and isolate every cached native fact.
const immutableEnvironmentSignature=()=>JSON.stringify(Object.keys(process.env).sort().map(key=>[key,process.env[key]]));
export function withImmutableHistoryVerification(callback){
 if(immutableHistoryScope){assert.equal(process.cwd(),immutableHistoryScope.cwd,'Verification working directory changed');assert.equal(immutableEnvironmentSignature(),immutableHistoryScope.environment,'Verification execution environment changed');return callback();}
 immutableTrees.clear();immutableBlobBytes.clear();
 const cwd=process.cwd(),head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 assert.equal(execFileSync('git',['diff','--name-only','HEAD','--'],{encoding:'utf8'}).trim(),'','Immutable history verification requires clean tracked source');
 assert.equal(execFileSync('git',['diff','--cached','--name-only','--'],{encoding:'utf8'}).trim(),'','Immutable history verification requires clean tracked source: staged source drift');
 const scopeReplacements=replacementState();
 const repository=repositoryContext();
 immutableHistoryScope={cwd,head,environment:immutableEnvironmentSignature(),replacements:scopeReplacements,repository,marker:repositoryMarker(repository),factsFresh:true};
 try{const value=callback();assert(!value||typeof value.then!=='function','Immutable history verification must be synchronous');return value;}
 finally{
  immutableHistoryScope=null;
  assert.equal(process.cwd(),cwd,'Verification working directory changed');
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),head,'Source HEAD changed during immutable history verification');
  assert.equal(execFileSync('git',['diff','--name-only','HEAD','--'],{encoding:'utf8'}).trim(),'','Working source changed during immutable history verification');
  assert.equal(execFileSync('git',['diff','--cached','--name-only','--'],{encoding:'utf8'}).trim(),'','Working source changed during immutable history verification: staged source drift');
  assert.deepEqual(replacementState(),scopeReplacements,'Git replacement state changed during immutable history verification');
 }
}
function replacementState(){
 const mode=process.env.GIT_NO_REPLACE_OBJECTS??null,base=process.env.GIT_REPLACE_REF_BASE??null;
 return {mode,base,refs:execFileSync('git',['for-each-ref','--format=%(refname) %(objectname)',base??'refs/replace/'],{encoding:'utf8'})};
}
// Native diff/ancestry/object-presence commands are never cached. Mutable
// replacement references and repository configuration invalidate facts at use.
function repositoryContext(){
 try{
  const dirs=execFileSync('git',['rev-parse','--path-format=absolute','--git-common-dir','--git-dir'],{encoding:'utf8'}).trim().split('\n');
  if(dirs.length!==2)return null;
  const storage=execFileSync('git',['config','--get','extensions.refStorage'],{encoding:'utf8',stdio:'pipe'});
  if(storage.trim()&&storage.trim()!=='files')return null;
  return {common:dirs[0],git:dirs[1],base:process.env.GIT_REPLACE_REF_BASE??'refs/replace/'};
 }catch(error){
  if(error.status!==1)return null;
  try{const dirs=execFileSync('git',['rev-parse','--path-format=absolute','--git-common-dir','--git-dir'],{encoding:'utf8'}).trim().split('\n');return dirs.length===2?{common:dirs[0],git:dirs[1],base:process.env.GIT_REPLACE_REF_BASE??'refs/replace/'}:null;}catch{return null;}
 }
}
function repositoryMarker(repository){
 if(!repository||!/^refs\/(?:[^./][^/]*\/)*[^./][^/]*\/?$/.test(repository.base)||repository.base.includes('..'))return null;
 try{
  const hash=createHash('sha256');
  const add=path=>{
   hash.update(path+'\0');
   try{
    const stat=lstatSync(path);
    if(stat.isDirectory()){hash.update('directory\0');for(const child of readdirSync(path).sort())add(resolve(path,child));}
    else if(stat.isFile()){const bytes=readFileSync(path);hash.update('file '+bytes.length+'\0').update(bytes);}
    else throw new Error('Unsupported native Git context path');
   }catch(error){if(error.code==='ENOENT')hash.update('absent\0');else throw error;}
  };
  for(const path of new Set([resolve(repository.common,repository.base),resolve(repository.git,repository.base),resolve(repository.common,'packed-refs'),resolve(repository.common,'config'),resolve(repository.git,'config.worktree'),resolve(repository.common,'shallow'),resolve(repository.common,'info/grafts'),'/etc/gitconfig',resolve(homedir(),'.gitconfig'),resolve(process.env.XDG_CONFIG_HOME||resolve(homedir(),'.config'),'git/config')]))add(path);
  return hash.digest('hex');
 }catch{return null;}
}
export const immutableHistorySourceHead=()=>immutableHistoryScope?.head??null;

const immutableTrees=new Map(),immutableBlobBytes=new Map();
function trustedFactOptions(options){
 if(options===undefined)return true;
 if(!options||Object.getPrototypeOf(options)!==Object.prototype)return false;
 const descriptors=Object.getOwnPropertyDescriptors(options);
 if(Reflect.ownKeys(descriptors).some(k=>typeof k!=='string'||!['encoding','maxBuffer','cwd'].includes(k)||!('value'in descriptors[k])))return false;
 if(options.cwd!==undefined&&(typeof options.cwd!=='string'||!options.cwd))return false;
 if(options.encoding!==undefined&&options.encoding!==null&&options.encoding!=='buffer'&&!Buffer.isEncoding(options.encoding))return false;
 return options.maxBuffer===undefined||Number.isSafeInteger(options.maxBuffer)&&options.maxBuffer>=0;
}
function immutableFact(scope,args,options){
 if(args.length!==2||!['show','rev-parse'].includes(args[0]))return null;
 const match=/^([a-f0-9]{40}):([^\0]+)$/.exec(args[1]);if(!match)return null;
 const [,ref,path]=match;if(path.startsWith('/')||path.split('/').some(p=>!p||p==='.'||p==='..'))return null;
 const namespace=JSON.stringify([scope.cwd,scope.environment]);
 const treeKey=namespace+' '+ref;
 if(!immutableTrees.has(treeKey)){
  let raw;try{raw=execFileSync('git',['ls-tree','-r','-t','-z','--full-tree',ref],{maxBuffer:32*1024*1024,stdio:'pipe'});}catch{return null;}
  const entries=new Map();let start=0;
  for(let end=raw.indexOf(0,start);end!==-1;end=raw.indexOf(0,start)){
   const line=raw.subarray(start,end),tab=line.indexOf(9);if(tab<0)return null;
   const metadata=/^([0-7]{6}) (blob|tree|commit) ([a-f0-9]{40})$/.exec(line.subarray(0,tab).toString('ascii'));if(!metadata)return null;
   const nameBytes=line.subarray(tab+1),name=nameBytes.toString('utf8');
   if(Buffer.from(name,'utf8').equals(nameBytes)){if(entries.has(name))return null;entries.set(name,{type:metadata[2],oid:metadata[3]});}
   start=end+1;
  }
  if(start!==raw.length)return null;immutableTrees.set(treeKey,entries);
 }
 const entry=immutableTrees.get(treeKey).get(path);if(!entry)return null;
 const limit=options?.maxBuffer??1024*1024;
 if(args[0]==='rev-parse'){
  const bytes=Buffer.from(entry.oid+'\n');return bytes.length>limit?null:{bytes};
 }
 if(entry.type!=='blob')return null;
 const blobKey=namespace+' '+entry.oid;
 if(!immutableBlobBytes.has(blobKey)){
  let bytes;try{bytes=execFileSync('git',['cat-file','blob',entry.oid],{maxBuffer:limit,stdio:'pipe'});}catch{return null;}
  assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),entry.oid,'Native immutable blob bytes do not match their Git object ID');
  immutableBlobBytes.set(blobKey,bytes);
 }
 const bytes=immutableBlobBytes.get(blobKey);
 assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),entry.oid,'Cached immutable blob bytes do not match their Git object ID');
 return bytes.length>limit?null:{bytes};
}
export function immutableHistoryExecFileSync(bin,args,options){
 const scope=immutableHistoryScope;
 if(!scope||process.cwd()!==scope.cwd||immutableEnvironmentSignature()!==scope.environment||bin!=='git'||!Array.isArray(args)||args.some(x=>typeof x!=='string')||!trustedFactOptions(options)||options?.cwd&&options.cwd!==scope.cwd)return execFileSync(bin,args,options);
 // HEAD, symbolic aliases, mutable state and replacement-enabled objects are
 // always native reads. Only explicit immutable object identities are reused.
 if(scope.replacements.mode!=='1'&&scope.replacements.refs.trim()||Object.keys(process.env).some(key=>key.startsWith('GIT_TRACE')))return execFileSync(bin,args,options);
 const blob=x=>/^[a-f0-9]{40}:[^\0]+$/.test(x);
 const immutable=args.length===2&&['show','rev-parse'].includes(args[0])&&blob(args[1]);
 if(!immutable)return execFileSync(bin,args,options);
 if(!scope.factsFresh||scope.marker===null||repositoryMarker(scope.repository)!==scope.marker){scope.factsFresh=false;return execFileSync(bin,args,options);}
 const fact=immutableFact(scope,args,options);
 if(fact)return options?.encoding&&options.encoding!=='buffer'?fact.bytes.toString(options.encoding):Buffer.from(fact.bytes);
 // Unknown paths/objects, aliases, tree/commit show and unsupported queries
 // retain Git's original command, diagnostics and child-process error shape.
 if(args.length===2&&['show','rev-parse'].includes(args[0]))return execFileSync(bin,args,options);
 return execFileSync(bin,args,options);
}

