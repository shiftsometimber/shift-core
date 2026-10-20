import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,readdirSync,readlinkSync,realpathSync} from 'node:fs';
import {resolve,isAbsolute,dirname} from 'node:path';
import {homedir} from 'node:os';

// Actual immutable Git facts only; caller callbacks and assertion results are never cached.
const unsupportedContext=Symbol('unsupported immutable Git context');
function fileContext(path){
 try{const stat=lstatSync(path,{throwIfNoEntry:false});if(!stat)return null;if(!stat.isFile()&&!stat.isSymbolicLink())return unsupportedContext;const bytes=readFileSync(path);if(bytes.length>8*1024*1024)return unsupportedContext;return[stat.mode,stat.isSymbolicLink()?readlinkSync(path):null,realpathSync(path),createHash('sha256').update(bytes).digest('hex')];}
 catch(error){return error.code==='ENOENT'?null:unsupportedContext;}
}
function replacementContext(path,budget={left:1024}){
 try{const stat=lstatSync(path,{throwIfNoEntry:false});if(!stat)return null;if(stat.isSymbolicLink())return unsupportedContext;if(!stat.isDirectory())return fileContext(path);const rows=[];for(const name of readdirSync(path).sort()){if(--budget.left<0)return unsupportedContext;const value=replacementContext(resolve(path,name),budget);if(value===unsupportedContext)return value;rows.push([name,value]);}return rows;}
 catch(error){return error.code==='ENOENT'?null:unsupportedContext;}
}
function immutableContextSnapshot(context){
 const files=[];for(const path of context.files){const value=fileContext(path);if(value===unsupportedContext)return null;files.push([path,value]);}
 const replacements=replacementContext(context.replacements);return replacements===unsupportedContext?null:JSON.stringify([files,replacements]);
}
function captureImmutableContext(){
 try{
  if(process.env.GIT_NAMESPACE||process.env.GIT_REPLACE_REF_BASE||process.env.GIT_GRAFT_FILE||process.env.GIT_SHALLOW_FILE)return null;
  const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:8*1024*1024,stdio:'pipe'}).trimEnd();
  if(git('rev-parse','--show-ref-format')!=='files')return null;
  const files=new Set(),add=path=>{if(!path||path.includes('\n')||path.includes('\0'))throw Error('Unsupported Git context path');files.add(resolve(path));};
  const gitPath=name=>git('rev-parse','--path-format=absolute','--git-path',name);
  for(const name of ['config','config.worktree','packed-refs','info/grafts','shallow','HEAD'])add(gitPath(name));
  for(const variable of ['GIT_CONFIG_SYSTEM','GIT_CONFIG_GLOBAL'])for(const path of git('var',variable).split('\n'))if(path){if(!isAbsolute(path))return null;add(path);}
  const fields=execFileSync('git',['config','--null','--show-origin','--includes','--list'],{encoding:'utf8',maxBuffer:8*1024*1024,stdio:'pipe'}).split('\0');
  if(fields.at(-1)!=='')return null;fields.pop();if(fields.length%2)return null;
  for(let i=0;i<fields.length;i+=2){
   const origin=fields[i],entry=fields[i+1],newline=entry.indexOf('\n'),key=(newline<0?entry:entry.slice(0,newline)).toLowerCase(),value=newline<0?'':entry.slice(newline+1);
   const file=origin.startsWith('file:')?resolve(origin.slice(5)):null;if(file)add(file);
   if(/^include(?:if\..*)?\.path$/.test(key)){
    if(!file||!value||value.includes('%('))return null;
    let path=value;if(path.startsWith('~/'))path=resolve(homedir(),path.slice(2));else if(path.startsWith('~'))return null;else if(!isAbsolute(path))path=resolve(dirname(file),path);add(path);
   }
  }
  let ref='HEAD';for(let i=0;i<8;i++){
   let target;try{target=git('symbolic-ref','--quiet','--no-recurse',ref);}catch(error){if(error.status===1)break;throw error;}
   if(!target.startsWith('refs/'))return null;add(gitPath(target));ref=target;if(i===7)return null;
  }
  const context={files:[...files].sort(),replacements:gitPath('refs/replace')};context.signature=immutableContextSnapshot(context);return context.signature===null?null:context;
 }catch{return null;}
}

// Synchronous test verification can reuse only actual immutable Git history.
// Current HEAD and tracked working bytes are checked at both scope boundaries.
// This never caches caller-supplied source readers or validation outcomes.
let immutableHistoryScope=null;
// Keep the complete execution environment private and isolate every cached native fact.
const immutableEnvironmentSignature=()=>JSON.stringify(Object.keys(process.env).sort().map(key=>[key,process.env[key]]));
export function assertGitTrackedSourceVisible(stage='verification'){
 const bytes=execFileSync('git',['ls-files','-v','-z'],{maxBuffer:32*1024*1024});let start=0;
 while(start<bytes.length){const end=bytes.indexOf(0,start);assert(end>start,'Tracked source index format changed');const flag=bytes[start];assert(!(flag===83||flag>=97&&flag<=122),'Source drift: hidden assume-unchanged/skip-worktree index flags at '+stage);start=end+1;}
}
export function nativeGitSourceDifference(base,head){
 return execFileSync('git',['diff','--no-renames','--name-only',base,head],{encoding:'utf8',maxBuffer:64*1024*1024}).trim().split('\n').filter(Boolean);
}
export function withImmutableHistoryVerification(callback){
 if(immutableHistoryScope){assert.equal(process.cwd(),immutableHistoryScope.cwd,'Verification working directory changed');assert.equal(immutableEnvironmentSignature(),immutableHistoryScope.environment,'Verification execution environment changed');return callback();}
 // Scoped facts are reset; authenticated native facts retain every existing point-of-use storage/context/hash check.
 for(const key of immutableTrees.keys())if(!key.startsWith('native-context-'))immutableTrees.delete(key);
 for(const key of immutableBlobBytes.keys())if(!key.startsWith('native-context-'))immutableBlobBytes.delete(key);
 const cwd=process.cwd(),head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 assertGitTrackedSourceVisible('entry');
 assert.equal(execFileSync('git',['diff','--name-only','HEAD','--'],{encoding:'utf8'}).trim(),'','Immutable history verification requires clean tracked source');
 assert.equal(execFileSync('git',['diff','--cached','--name-only','--'],{encoding:'utf8'}).trim(),'','Immutable history verification requires clean tracked source: staged source drift');
 const scopeReplacements=replacementState();
 const repository=repositoryContext();
 immutableHistoryScope={cwd,head,environment:immutableEnvironmentSignature(),replacements:scopeReplacements,repository,marker:repositoryMarker(repository),factsFresh:true};
 try{const value=callback();assert(!value||typeof value.then!=='function','Immutable history verification must be synchronous');return value;}
 finally{
  immutableHistoryScope=null;
  assert.equal(process.cwd(),cwd,'Verification working directory changed');
  assertGitTrackedSourceVisible('exit');
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
    const stat=lstatSync(path,{throwIfNoEntry:false});if(!stat){hash.update('absent\0');return;}
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
// Bound retained immutable data; eviction only discards an optimisation.
// Every surviving fact keeps the original fresh context/storage/hash checks.
function retainBoundedImmutableFact(cache,key,value,limit){
 cache.delete(key);cache.set(key,value);
 while(cache.size>limit)cache.delete(cache.keys().next().value);
}
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
 const namespace=scope.factNamespace??JSON.stringify([scope.cwd,scope.environment,scope.contextSignature??null]);
 const context=scope.nativeContext;
 const treeKey=namespace+' '+ref;
 if(!immutableTrees.has(treeKey)){
  try{const type=execFileSync('git',['cat-file','-t',ref],{encoding:'utf8',maxBuffer:1024,stdio:'pipe'}).trim();if(type!=='commit'&&type!=='tree')return null;}catch{return null;}
  let raw;try{raw=execFileSync('git',['ls-tree','-r','-t','-z','--full-tree',ref],{maxBuffer:32*1024*1024,stdio:'pipe'});}catch{return null;}
  const entries=new Map();let start=0;
  for(let end=raw.indexOf(0,start);end!==-1;end=raw.indexOf(0,start)){
   const line=raw.subarray(start,end),tab=line.indexOf(9);if(tab<0)return null;
   const metadata=/^([0-7]{6}) (blob|tree|commit) ([a-f0-9]{40})$/.exec(line.subarray(0,tab).toString('ascii'));if(!metadata)return null;
   const nameBytes=line.subarray(tab+1),name=nameBytes.toString('utf8');
   if(Buffer.from(name,'utf8').equals(nameBytes)){if(entries.has(name))return null;entries.set(name,{type:metadata[2],oid:metadata[3]});}
   start=end+1;
  }
  if(start!==raw.length)return null;
  try{entries.rootTree=execFileSync('git',['rev-parse',ref+'^{tree}'],{encoding:'utf8'}).trim();}catch{return null;}
  if(!/^[a-f0-9]{40}$/.test(entries.rootTree))return null;
  if(context){
   const oids=[...new Set([ref,entries.rootTree,...[...entries.values()].filter(entry=>entry.type==='tree').map(entry=>entry.oid)])];
   const provenance=new Map();for(const oid of oids){const value=looseObjectState(context,oid);if(value===null)return null;provenance.set(oid,value);}
   entries.provenance={base:context.useStorage,objects:provenance};
  }
  retainBoundedImmutableFact(immutableTrees,treeKey,entries,8);
 }
 const tree=immutableTrees.get(treeKey),entry=tree.get(path);if(!entry)return null;
 if(context){
  const needed=[ref,tree.rootTree];let prefix='';for(const segment of path.split('/').slice(0,-1)){prefix=prefix?prefix+'/'+segment:segment;const parent=tree.get(prefix);if(parent?.type==='tree')needed.push(parent.oid);}
  const proof=tree.provenance;if(!proof||proof.base!==context.useStorage||needed.some(oid=>!proof.objects.has(oid)||looseObjectState(context,oid)!==proof.objects.get(oid))){immutableTrees.delete(treeKey);return null;}
 }
 retainBoundedImmutableFact(immutableTrees,treeKey,tree,8);
 const limit=options?.maxBuffer??1024*1024;
 if(args[0]==='rev-parse'){
  const bytes=Buffer.from(entry.oid+'\n');return bytes.length>limit?null:{bytes,oid:entry.oid,type:entry.type};
 }
 if(entry.type!=='blob')return null;
 const blobKey=namespace+' '+entry.oid;
 if(context&&immutableBlobBytes.has(blobKey)){const previous=immutableBlobBytes.get(blobKey);const current=storageState(context,[entry.oid],context.useStorage);if(current===null||previous.storage!==current)immutableBlobBytes.delete(blobKey);}
 if(!immutableBlobBytes.has(blobKey)){
  const before=context?storageState(context,[entry.oid],context.useStorage):null;if(context&&before===null)return null;
  let bytes;try{bytes=execFileSync('git',['cat-file','blob',entry.oid],{maxBuffer:limit,stdio:'pipe'});}catch{return null;}
  assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),entry.oid,'Native immutable blob bytes do not match their Git object ID');
  const storage=context?storageState(context,[entry.oid],context.useStorage):null;if(context&&(storage===null||storage!==before))return null;
  retainBoundedImmutableFact(immutableBlobBytes,blobKey,{bytes,storage},64);
 }
 const bytes=immutableBlobBytes.get(blobKey).bytes;
 assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),entry.oid,'Cached immutable blob bytes do not match their Git object ID');
 retainBoundedImmutableFact(immutableBlobBytes,blobKey,immutableBlobBytes.get(blobKey),64);
 return bytes.length>limit?null:{bytes,oid:entry.oid,type:entry.type};
}
// Shared native facts retain full point-of-use repository/environment identity.
// This does not reuse callback outputs, admission results, HEAD, diff or ancestry.
const nativeFactContexts=new Map(),nativeFactOutputs=new Map();let nextNativeFactNamespace=0;
function looseObjectState(context,oid){
 if(!/^[a-f0-9]{40}$/.test(oid))return null;
 try{const s=lstatSync(resolve(context.objectDirectory,oid.slice(0,2),oid.slice(2)),{bigint:true,throwIfNoEntry:false});if(!s)return'absent';if(s.isSymbolicLink()||!s.isFile())return null;return JSON.stringify([s.dev.toString(),s.ino.toString(),s.mode.toString(),s.size.toString(),s.mtimeNs.toString(),s.ctimeNs.toString()]);}catch{return null;}
}
function storageState(context,objects=[],baseStorage=undefined){
 try{
  const stat=path=>{try{const s=lstatSync(path,{bigint:true,throwIfNoEntry:false});if(!s)return'absent';if(s.isSymbolicLink())return null;return[s.dev.toString(),s.ino.toString(),s.mode.toString(),s.size.toString(),s.mtimeNs.toString(),s.ctimeNs.toString()];}catch(error){if(error.code==='ENOENT')return'absent';throw error;}};
  if(baseStorage===undefined){
   const directory=stat(context.objectDirectory);if(!Array.isArray(directory))return null;
  const alternates=resolve(context.objectDirectory,'info/alternates');
  try{if(readFileSync(alternates,'utf8').trim())return null;}catch(error){if(error.code!=='ENOENT')return null;}
  const pack=resolve(context.objectDirectory,'pack'),packs=[];
  try{for(const name of readdirSync(pack).sort()){const s=stat(resolve(pack,name));if(!Array.isArray(s))return null;packs.push([name,s]);}}catch(error){if(error.code!=='ENOENT')return null;}
   baseStorage=JSON.stringify([directory,stat(alternates),packs]);
  }
  const loose=[];for(const oid of [...new Set(objects)]){
   if(!/^[a-f0-9]{40}$/.test(oid))return null;
   const path=resolve(context.objectDirectory,oid.slice(0,2),oid.slice(2)),s=stat(path);if(s===null)return null;loose.push([oid,s]);
  }
  return objects.length?JSON.stringify([baseStorage,loose]):baseStorage;
 }catch{return null;}
}
function nativeFactContext(){
 if(process.env.GIT_ALTERNATE_OBJECT_DIRECTORIES||Object.keys(process.env).some(key=>key.startsWith('GIT_TRACE')))return null;
 const cwd=process.cwd(),environment=immutableEnvironmentSignature(),key=cwd+'\0'+environment;
 let context=nativeFactContexts.get(key);if(context===unsupportedContext)return null;
 if(context&&immutableContextSnapshot(context)===context.signature){const storage=storageState(context);if(storage===context.storage){context.useStorage=storage;return context;}}
 context=captureImmutableContext();if(!context){nativeFactContexts.set(key,unsupportedContext);return null;}
 try{
  context.cwd=cwd;context.environment=environment;
  context.objectDirectory=execFileSync('git',['rev-parse','--path-format=absolute','--git-path','objects'],{encoding:'utf8'}).trim();
  if(!isAbsolute(context.objectDirectory))return null;
  context.replacementsState=replacementState();context.storage=storageState(context);if(context.storage===null)return null;context.useStorage=context.storage;
  // Each freshly authenticated exact context owns a unique private namespace.
  // Current cwd/environment/config/refs/storage are still compared at every use.
  context.cacheNamespace='native-context-'+(++nextNativeFactNamespace);
  nativeFactContexts.set(key,context);return context;
 }catch{return null;}
}
function nativeLiteralFact(args,options,context){
 const match=/^([a-f0-9]{40}):([^\0]+)$/.exec(args[1]);if(!match)return null;
 const [,ref,path]=match;if(path.startsWith('/')||path.split('/').some(part=>!part||part==='.'||part==='..'))return null;
 if(!context||context.replacementsState.mode!=='1'&&context.replacementsState.refs.trim())return null;
 const key=JSON.stringify([context.cacheNamespace,args]);
 let cached=nativeFactOutputs.get(key);
 if(cached&&storageState(context,cached.objects,context.useStorage)!==cached.storage){nativeFactOutputs.delete(key);immutableTrees.clear();immutableBlobBytes.clear();cached=null;}
 if(cached){
  if(cached.type==='blob')assert.equal(createHash('sha1').update('blob '+cached.bytes.length+'\0').update(cached.bytes).digest('hex'),cached.oid,'Cached immutable blob bytes do not match their Git object ID');
  assert.equal(createHash('sha256').update(cached.bytes).digest('hex'),cached.digest,'Cached immutable native output bytes do not match their digest');
  return cached;
 }
 const frame={cwd:context.cwd,environment:context.environment,contextSignature:context.cacheNamespace,factNamespace:context.cacheNamespace,nativeContext:context};
 const fact=immutableFact(frame,args,options),namespace=frame.factNamespace;
 const tree=immutableTrees.get(namespace+' '+ref),entry=tree?.get(path);if(!entry||!fact&&entry.type!=='tree')return null;
 let bytes=fact?.bytes,type=entry.type,oid=entry.oid;
 if(!bytes){
  if(args[0]!=='show'||type!=='tree')return null;
  // Git's complete native directory display includes the requested expression.
  // Do not reconstruct its header, quoting, modes, diagnostics or presentation.
  try{bytes=execFileSync('git',args,{...options,encoding:null});}catch{return null;}
 }
 const objects=[ref,tree.rootTree,oid];let prefix='';
 for(const segment of path.split('/').slice(0,-1)){prefix=prefix?prefix+'/'+segment:segment;const parent=tree.get(prefix);if(parent?.type==='tree')objects.push(parent.oid);}
 const storage=storageState(context,objects,context.useStorage);if(storage===null)return null;
 cached={bytes,oid,type:args[0]==='show'?type:'identifier',objects,storage,digest:createHash('sha256').update(bytes).digest('hex')};
 nativeFactOutputs.set(key,cached);return cached;
}
export function immutableHistoryExecFileSync(bin,args,options){
 if(bin!=='git'||!Array.isArray(args)||args.length!==2||!['show','rev-parse'].includes(args[0])||args.some(value=>typeof value!=='string')||!trustedFactOptions(options)||options?.cwd&&options.cwd!==process.cwd())return execFileSync(bin,args,options);
 if(!/^[a-f0-9]{40}:/.test(args[1]))return execFileSync(bin,args,options);
 const context=nativeFactContext(),fact=context?nativeLiteralFact(args,options,context):null;
 if(fact){
  const limit=options?.maxBuffer??1024*1024;
  if(fact.bytes.length<=limit)return options?.encoding&&options.encoding!=='buffer'?fact.bytes.toString(options.encoding):Buffer.from(fact.bytes);
  return execFileSync(bin,args,options);
 }
 // Unsupported native contexts, including alternate object storage, execute
 // freshly: a scoped blob cache cannot authenticate mutable donor objects.
 return execFileSync(bin,args,options);
}
