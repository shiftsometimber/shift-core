import {websiteEditorialCompletionHistoricalView,assertWebsiteEditorialCompletionView} from './website-editorial-scope-20261018.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,lstatSync,readlinkSync,readdirSync,realpathSync,existsSync,mkdtempSync,chmodSync,writeFileSync} from 'node:fs';
import {resolve,isAbsolute,dirname} from 'node:path';
import {homedir,tmpdir} from 'node:os';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {decodeSeoBlobBatch} from './seo-native-immutable-facts-20261016.mjs';
import {immutableHistoryExecFileSync as immutableNavigationFact} from './immutable-git-facts.mjs';
import {verifiedOwnedRuntime} from '../shift-coach/cancelled-release-recovery.mjs';

const policy=JSON.parse(readFileSync(new URL('./recorded-week-navigation-outer-policy-20261018.json',import.meta.url),'utf8'));
const LEDGER='release/approved-runtime-composition.json',KEY='recordedWeekNavigation20261018';
const BASE='0e4a765e7a360d705e2424264e0bcfcc1d6652be',PAYLOAD='0d0a1c80a6e461dd641b7a95d3c46e8758d0ebeb';
const fixedPaths=Object.freeze(['frontend/member/member-progress-v1.js','member-experience/staging/verify-treatment-week-navigation.mjs']);
const fixedMaintenance=Object.freeze(['release/accepted-uk-grub-preservation-20261017.mjs','release/approved-runtime-composition.mjs','release/combined-finite-scope-20261014.mjs','release/current-runtime-preservation-20261016.mjs','release/recorded-week-navigation-outer-frame-20261018.mjs','release/recorded-week-navigation-outer-policy-20261018.json','tests/recorded-week-navigation-preservation-20261018.test.mjs','member-experience/tests/weight-import-mapping-ui.test.mjs','public-https-redirect.mjs','public-https-redirect.test.mjs']);
const MAINTENANCE_DECLARATION_SHA256='be5c1409d39f6feee5809087be94e7ba94a2217d6c4b4f765d62571b484ee58b';
const native=[execFileSync,readFileSync,lstatSync,readlinkSync,readdirSync,realpathSync,createHash,process.cwd,mkdtempSync,chmodSync,writeFileSync,tmpdir,createRequire];
const frames=new WeakSet(),oid=/^[a-f0-9]{40}$/,sorted=a=>[...a].sort(),sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('/usr/bin/git',['--no-optional-locks','--no-replace-objects',...args],{maxBuffer:64e6});
const text=(...args)=>git(...args).toString('utf8').trimEnd();
const head=()=>text('rev-parse','HEAD');
const path=p=>{assert(typeof p==='string'&&/^[A-Za-z0-9_.\/-]+$/.test(p)&&!p.startsWith('/')&&!p.split('/').some(s=>!s||s==='.'||s==='..'),'Exact recorded-week navigation path required');return p;};
function data(v,seen=new Set()){
 if(v===null||['string','boolean','number'].includes(typeof v))return v;
 assert(v&&typeof v==='object'&&!seen.has(v));assert([Object.prototype,Array.prototype,null].includes(Object.getPrototypeOf(v)));
 seen.add(v);const out=Array.isArray(v)?[]:{};
 for(const[k,d]of Object.entries(Object.getOwnPropertyDescriptors(v))){if(Array.isArray(v)&&k==='length')continue;assert(Object.hasOwn(d,'value')&&!d.get&&!d.set);out[k]=data(d.value,seen);}
 seen.delete(v);return out;
}
function clean(expected){
 assert.deepEqual([execFileSync,readFileSync,lstatSync,readlinkSync,readdirSync,realpathSync,createHash,process.cwd,mkdtempSync,chmodSync,writeFileSync,tmpdir,createRequire],native,'Native navigation source functions changed');
 assert(!Object.keys(process.env).some(k=>/^GIT_/.test(k)&&k!=='GIT_PAGER'),'Git source selectors are forbidden');
 const root=process.cwd(),dir=resolve(root,'.git');assert.equal(realpathSync(root),root);assert.equal(realpathSync(dir),dir);assert(lstatSync(dir).isDirectory()&&!lstatSync(dir).isSymbolicLink());
 for(const p of ['commondir','gitdir','info/grafts','objects/info/alternates','shallow'])assert(!existsSync(resolve(dir,p)),'Ordinary complete native source required: '+p);
 assert.equal(text('rev-parse','--show-toplevel'),root);assert.equal(text('rev-parse','--git-common-dir'),'.git');assert.equal(text('for-each-ref','--format=%(refname)','refs/replace'),'');
 assert.equal(text('diff','--no-renames','--name-only','HEAD','--'),'','Native navigation working source changed');assert.equal(text('diff','--no-renames','--cached','--name-only','--'),'','Native navigation staged source changed');
 for(const row of git('ls-files','-v','-z').toString('utf8').split('\0').filter(Boolean))assert(row.startsWith('H '),'Hidden/sparse/assume-unchanged source is forbidden');
 const h=head();assert(oid.test(h));if(expected)assert.equal(h,expected,'Actual navigation HEAD moved');return h;
}
// This set deduplicates stat-cache preparation only. Every source guard below
// still executes; no caller output, source admission or approval is cached.
const preparedNavigationIndexStats=new Set();
function waitForNativeIndexWriter(lock,deadline){
 const clock=()=>process.hrtime.bigint(),pause=new Int32Array(new SharedArrayBuffer(4));
 while(existsSync(lock)&&clock()<deadline)Atomics.wait(pause,0,0,20);
 assert(!existsSync(lock),'An actual source-index writer is active');
}
function prepareNativeNavigationIndexStats(){
 const root=process.cwd(),index=resolve(root,'.git/index'),lock=resolve(root,'.git/index.lock');
 const entry=lstatSync(index);assert(entry.isFile()&&!entry.isSymbolicLink(),'Ordinary native index required before stat-cache refresh');
 if(existsSync(lock)){
  // A parallel native reader may be refreshing stat bytes. Admit nothing while
  // its lock exists, and compare the actual logical source again after it ends.
  const lockedHead=head(),lockedStage=git('ls-files','--stage','-z'),lockedVisible=git('ls-files','-v','-z');
  waitForNativeIndexWriter(lock,process.hrtime.bigint()+1100000000n);
  assert.equal(head(),lockedHead,'Actual HEAD moved while waiting for the index writer');
  assert(git('ls-files','--stage','-z').equals(lockedStage),'Logical staged source changed while waiting for the index writer');
  assert(git('ls-files','-v','-z').equals(lockedVisible),'Source visibility changed while waiting for the index writer');
 }
 const rawHead=clean(),identity=()=>JSON.stringify([root,rawHead,sha(readFileSync(index))]);
 const beforeIdentity=identity();if(preparedNavigationIndexStats.has(beforeIdentity))return;
 const staged=git('ls-files','--stage','-z'),visible=git('ls-files','-v','-z');
 // Fresh checkouts can put files and index in the same timestamp second.
 // A bounded one-second boundary avoids endlessly rehashing an unchanged tree.
 const wait=Math.floor(lstatSync(index).mtimeMs/1000)*1000+1001-Date.now();
 if(wait>0&&wait<=1100)Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,wait);
 const deadline=process.hrtime.bigint()+1100000000n;
 for(;;){
  try{git('update-index','--refresh');break;}
  catch(error){
   const stderr=String(error.stderr??'');
   if(!/Unable to create[^\n]*index\.lock[^\n]*File exists/.test(stderr)||process.hrtime.bigint()>=deadline)throw error;
   waitForNativeIndexWriter(lock,deadline);
   assert.equal(head(),rawHead,'Actual HEAD moved during a competing stat refresh');
   assert(git('ls-files','--stage','-z').equals(staged),'Logical staged source changed during a competing stat refresh');
   assert(git('ls-files','-v','-z').equals(visible),'Source visibility changed during a competing stat refresh');
   clean(rawHead);
  }
 }
 assert.equal(head(),rawHead,'Actual HEAD moved during stat-cache preparation');
 assert(git('ls-files','--stage','-z').equals(staged),'Logical staged source changed during stat-cache preparation');
 assert(git('ls-files','-v','-z').equals(visible),'Source visibility changed during stat-cache preparation');
 clean(rawHead);
 preparedNavigationIndexStats.add(identity());
}

// Recheck current source inputs at every use. No approval, reader or verdict is cached.
function sourceFileState(filename){
 const s=lstatSync(filename,{throwIfNoEntry:false});if(!s)return null;
 assert(s.isFile()||s.isSymbolicLink(),'Ordinary native source metadata required');
 const value=readFileSync(filename);assert(value.length<=32e6,'Bounded native source metadata required');
 return[s.mode,s.isSymbolicLink()?readlinkSync(filename):null,realpathSync(filename),sha(value)];
}
function sourceReplacementState(filename,budget={left:1024}){
 const s=lstatSync(filename,{throwIfNoEntry:false});if(!s)return null;
 assert(!s.isSymbolicLink(),'Native replacement metadata cannot be redirected');
 if(!s.isDirectory())return sourceFileState(filename);
 return readdirSync(filename).sort().map(name=>{assert(--budget.left>=0);return[name,sourceReplacementState(resolve(filename,name),budget)];});
}
function freshSourceContext(){
 const files=new Set(),add=filename=>{assert(filename&&!filename.includes('\n')&&!filename.includes('\0'));files.add(resolve(filename));};
 const root=process.cwd(),dir=resolve(root,'.git');
 for(const p of ['HEAD','index','config','config.worktree','packed-refs'])add(resolve(dir,p));
 for(const variable of ['GIT_CONFIG_SYSTEM','GIT_CONFIG_GLOBAL'])for(const p of text('var',variable).split('\n'))if(p){assert(isAbsolute(p));add(p);}
 const fields=git('config','--null','--show-origin','--includes','--list').toString('utf8').split('\0');assert.equal(fields.pop(),'');assert.equal(fields.length%2,0);
 for(let i=0;i<fields.length;i+=2){
  const origin=fields[i],entry=fields[i+1],nl=entry.indexOf('\n'),key=(nl<0?entry:entry.slice(0,nl)).toLowerCase(),value=nl<0?'':entry.slice(nl+1),file=origin.startsWith('file:')?resolve(origin.slice(5)):null;
  if(file)add(file);
  if(/^include(?:if\..*)?\.path$/.test(key)){
   assert(file&&value&&!value.includes('%('));let filename=value;
   if(filename.startsWith('~/'))filename=resolve(homedir(),filename.slice(2));else{assert(!filename.startsWith('~'));if(!isAbsolute(filename))filename=resolve(dirname(file),filename);}add(filename);
  }
 }
 let ref='HEAD';for(let i=0;i<8;i++){
  const filename=resolve(dir,ref),s=lstatSync(filename,{throwIfNoEntry:false});if(!s)break;
  add(filename);const value=readFileSync(filename,'utf8').trim();if(!value.startsWith('ref: '))break;
  ref=value.slice(5);assert(/^refs\/[A-Za-z0-9_./-]+$/.test(ref)&&!ref.split('/').some(p=>!p||p==='.'||p==='..'));add(resolve(dir,ref));assert(i<7);
 }
 const snapshot=()=>{
  assert.equal(process.cwd(),root,'Navigation source working directory moved');
  assert.equal(realpathSync(root),root);assert.equal(realpathSync(dir),dir);
  const s=lstatSync(dir);assert(s.isDirectory()&&!s.isSymbolicLink());
  for(const p of ['commondir','gitdir','info/grafts','objects/info/alternates','shallow'])assert(!existsSync(resolve(dir,p)),'Ordinary complete native source required: '+p);
  return JSON.stringify([s.dev,s.ino,[...files].sort().map(p=>[p,sourceFileState(p)]),sourceReplacementState(resolve(dir,'refs/replace'))]);
 };
 return{snapshot,entry:snapshot()};
}
// Availability only for the exact retained original HQ history. The unchanged
// finite/HQ verifiers still own every source, ancestry, blob and approval check.
function ensureOriginalNavigationHqObjects(){
 const original=JSON.parse(content(head(),'release/combined-hq-partner-preservation-20261014.json'));
 assert.equal(original.originalSource,'f3acbfdc2f0fbe8c14d5940dee9136377f257cc8');
 assert.equal(original.originalTree,'f5e4d55cba045b4017bdaa7991f74c80227f0f9d');
 const required=new Map([[original.originalSource,'commit'],[original.originalTree,'tree'],...Object.values(original.partnerBlobs).map(id=>[id,'blob']),[original.originalEntryBlob,'blob']]);
 for(const id of required.keys())assert(oid.test(id),'Exact original HQ object required');
 const available=()=>{
  const input=[...required.keys()].join('\n')+'\n';
  const output=execFileSync('/usr/bin/git',['--no-optional-locks','--no-replace-objects','cat-file','--batch-check'],{input,maxBuffer:64e6});
  const rows=output.toString('ascii').split('\n');assert.equal(rows.pop(),'');assert.equal(rows.length,required.size);let complete=true,i=0;
  for(const[id,kind]of required){const row=rows[i++];if(row===id+' missing'){complete=false;continue;}const m=/^([a-f0-9]{40}) (commit|tree|blob) (0|[1-9][0-9]*)$/.exec(row);assert(m,'Exact native original HQ object metadata required');assert.equal(m[1],id);assert.equal(m[2],kind);assert(Number.isSafeInteger(Number(m[3])));}
  return complete;
 };
 if(!available()){
  const rawHead=clean(),context=freshSourceContext(),dir=resolve(process.cwd(),'.git');
  const refs=()=>JSON.stringify(sourceReplacementState(resolve(dir,'refs'))),fetchHead=()=>JSON.stringify(sourceFileState(resolve(dir,'FETCH_HEAD')));
  const beforeRefs=refs(),beforeFetchHead=fetchHead(),origin=text('remote','get-url','origin');
  assert(['https://github.com/shiftsometimber/shift-core','https://github.com/shiftsometimber/shift-core.git','git@github.com:shiftsometimber/shift-core.git'].includes(origin),'Only the established shift-core origin can supply exact original HQ objects');
  git('fetch','--no-tags','--no-write-fetch-head','origin',original.originalSource);
  assert.equal(context.snapshot(),context.entry,'Original HQ object transport changed native source metadata');assert.equal(refs(),beforeRefs,'Original HQ object transport changed refs');assert.equal(fetchHead(),beforeFetchHead,'Original HQ object transport changed FETCH_HEAD');clean(rawHead);assert.equal(context.snapshot(),context.entry,'Original HQ object transport changed source context');
 }
 assert(available(),'Exact original HQ objects must be present after transport');
 assert.equal(text('rev-parse',original.originalSource+'^{tree}'),original.originalTree,'Exact original HQ tree required');
 for(const[p,id]of Object.entries(original.partnerBlobs))assert.equal(object(original.originalSource,p),id,'Exact original HQ path/blob required: '+p);
 assert.equal(object(original.originalSource,'hq-management-entry.mjs'),original.originalEntryBlob,'Exact original HQ entry blob required');
}

// Availability only for the exact retained original photo terminal evidence.
// The unchanged photo/root/member verifiers still perform every original check.
function ensureOriginalNavigationPhotoEvidenceObjects(){
 const original={source:'2477783ae8dac9c055a620958d1112611296b57a',tree:'cfa7f0c86192e921a215b00a01cacfa79b579c71',blobs:{'g2-013-progress-picture-rendered-production.mjs':'8051ff5034726726197b82dca7a4c7addcac2d87','rendered-member-acceptance-support.mjs':'6ba6f6f336a8658b40b5a1c0e16e43e1e3bbc12d','tests/rendered-member-acceptance-support.test.mjs':'4dd2eca6cdbc3977c56d0f2f8be8b776bc1b9f1f'}};
 const required=new Map([[original.source,'commit'],[original.tree,'tree'],...Object.values(original.blobs).map(id=>[id,'blob'])]);
 for(const id of required.keys())assert(oid.test(id),'Exact original photo evidence object required');
 const available=()=>{
  const input=[...required.keys()].join('\n')+'\n';
  const output=execFileSync('/usr/bin/git',['--no-optional-locks','--no-replace-objects','cat-file','--batch-check'],{input,maxBuffer:64e6});
  const rows=output.toString('ascii').split('\n');assert.equal(rows.pop(),'');assert.equal(rows.length,required.size);let complete=true,i=0;
  for(const[id,kind]of required){const row=rows[i++];if(row===id+' missing'){complete=false;continue;}const m=/^([a-f0-9]{40}) (commit|tree|blob) (0|[1-9][0-9]*)$/.exec(row);assert(m,'Exact native original photo evidence object metadata required');assert.equal(m[1],id);assert.equal(m[2],kind);assert(Number.isSafeInteger(Number(m[3])));}
  return complete;
 };
 if(!available()){
  const rawHead=clean(),context=freshSourceContext(),dir=resolve(process.cwd(),'.git');
  const refs=()=>JSON.stringify(sourceReplacementState(resolve(dir,'refs'))),fetchHead=()=>JSON.stringify(sourceFileState(resolve(dir,'FETCH_HEAD')));
  const beforeRefs=refs(),beforeFetchHead=fetchHead(),origin=text('remote','get-url','origin');
  assert(['https://github.com/shiftsometimber/shift-core','https://github.com/shiftsometimber/shift-core.git','git@github.com:shiftsometimber/shift-core.git'].includes(origin),'Only the established shift-core origin can supply exact original photo evidence objects');
  git('fetch','--no-tags','--no-write-fetch-head','origin',original.source);
  assert.equal(context.snapshot(),context.entry,'Original photo evidence transport changed native source metadata');assert.equal(refs(),beforeRefs,'Original photo evidence transport changed refs');assert.equal(fetchHead(),beforeFetchHead,'Original photo evidence transport changed FETCH_HEAD');clean(rawHead);assert.equal(context.snapshot(),context.entry,'Original photo evidence transport changed source context');
 }
 assert(available(),'Exact original photo evidence objects must be present after transport');
 assert.equal(text('rev-parse',original.source+'^{tree}'),original.tree,'Exact original photo evidence tree required');
 for(const[p,id]of Object.entries(original.blobs))assert.equal(object(original.source,p),id,'Exact original photo evidence path/blob required: '+p);
}


// Reuse immutable native code/index facts and context-bound descriptors only.
// Every use freshly reads ALL indexed file metadata and parent path bindings.
// Any unsupported, racy, changed or untrusted state runs the original Git diff.
const navigationTrackedStatNativeSource="#include <sys/stat.h>\n#include <stdint.h>\n#include <stddef.h>\n#include <thread>\n#include <vector>\n#include <atomic>\n#ifdef __linux__\n#include <sched.h>\n#endif\nextern \"C\" {\ntypedef struct napi_env__* napi_env;\ntypedef struct napi_value__* napi_value;\ntypedef struct napi_callback_info__* napi_callback_info;\ntypedef napi_value (*napi_callback)(napi_env,napi_callback_info);\nint napi_get_cb_info(napi_env,napi_callback_info,size_t*,napi_value*,napi_value*,void**);\nint napi_get_buffer_info(napi_env,napi_value,void**,size_t*);\nint napi_create_int32(napi_env,int32_t,napi_value*);\nint napi_create_function(napi_env,const char*,size_t,napi_callback,void*,napi_value*);\nint napi_set_named_property(napi_env,napi_value,const char*,napi_value);\n}\nstatic uint32_t u32(const unsigned char* p){return uint32_t(p[0])|(uint32_t(p[1])<<8)|(uint32_t(p[2])<<16)|(uint32_t(p[3])<<24);}\n\nstatic size_t scanWidth(){\n unsigned int cpus=std::thread::hardware_concurrency();\n#ifdef __linux__\n cpu_set_t available;\n CPU_ZERO(&available);\n if(sched_getaffinity(0,sizeof(available),&available)==0)cpus=unsigned(CPU_COUNT(&available));\n#endif\n // Keep the original eight-thread ceiling; small hosts run the same full\n // scan inline to avoid contending with the other original source-proof slot.\n return cpus>4?4:1;\n}\n\n#ifdef __linux__\n#include <fcntl.h>\n#include <unistd.h>\n#include <sys/resource.h>\n#include <sys/vfs.h>\n#include <time.h>\n#include <cstring>\n#include <mutex>\n#include <string>\n// Reuse descriptors, never metadata or a working-source verdict. Parent path\n// bindings are freshly authenticated on both sides of every full fstat scan.\nstruct HeldSourceFiles {\n std::vector<unsigned char> facts;\n std::vector<int> files;\n std::vector<struct stat> directories;\n int64_t boundSecond=0;\n std::string mounts;\n ~HeldSourceFiles(){clear();}\n void clear(){for(int fd:files)if(fd>=0)close(fd);files.clear();directories.clear();facts.clear();mounts.clear();boundSecond=0;}\n};\nstatic HeldSourceFiles held;\nstatic std::mutex heldMutex;\nstatic bool sameDirectory(const struct stat& a,const struct stat& b){\n return S_ISDIR(a.st_mode)&&S_ISDIR(b.st_mode)&&a.st_dev==b.st_dev&&a.st_ino==b.st_ino&&a.st_mode==b.st_mode&&a.st_uid==b.st_uid&&a.st_gid==b.st_gid&&a.st_size==b.st_size&&a.st_ctim.tv_sec==b.st_ctim.tv_sec&&a.st_ctim.tv_nsec==b.st_ctim.tv_nsec&&a.st_mtim.tv_sec==b.st_mtim.tv_sec&&a.st_mtim.tv_nsec==b.st_mtim.tv_nsec;\n}\nstatic bool clockSecond(int64_t& second){struct timespec now;if(clock_gettime(CLOCK_REALTIME,&now)!=0||now.tv_sec<0)return false;second=now.tv_sec;return true;}\nstatic bool knownLocalFilesystem(const struct statfs& filesystem){\n const unsigned long kind=static_cast<unsigned long>(filesystem.f_type);\n return kind==0xef53UL||kind==0x58465342UL||kind==0x9123683eUL||kind==0x01021994UL||kind==0x794c7630UL;\n}\nstatic bool mountContext(std::string& value){\n struct ScopedFd {int fd;~ScopedFd(){if(fd>=0)close(fd);}};\n char before[128],after[128];\n ssize_t first=readlink(\"/proc/thread-self/ns/mnt\",before,sizeof(before));\n if(first<=0||size_t(first)>=sizeof(before))return false;\n ScopedFd descriptor{open(\"/proc/thread-self/mountinfo\",O_RDONLY|O_NOFOLLOW|O_CLOEXEC)};\n if(descriptor.fd<0)return false;\n struct statfs filesystem;\n if(fstatfs(descriptor.fd,&filesystem)!=0||static_cast<unsigned long>(filesystem.f_type)!=0x9fa0UL)return false;\n std::string content;char buffer[8192];ssize_t received;\n while((received=read(descriptor.fd,buffer,sizeof(buffer)))>0){\n  if(content.size()+size_t(received)>4*1024*1024)return false;\n  content.append(buffer,size_t(received));\n }\n if(received<0||content.empty())return false;\n ssize_t last=readlink(\"/proc/thread-self/ns/mnt\",after,sizeof(after));\n if(last!=first||memcmp(before,after,size_t(first))!=0)return false;\n value.assign(before,size_t(first));value.push_back('\\0');value+=content;return true;\n}\nstatic bool matureDirectory(const char* path,const struct stat& s,int64_t second){\n // Descriptor path binding is unavailable on unknown/coarse filesystems or\n // within a directory timestamp tick. The original full-path scan remains.\n if(s.st_ctim.tv_nsec<=0||s.st_ctim.tv_nsec>=1000000000||s.st_ctim.tv_sec<0||s.st_mtim.tv_sec<0||s.st_ctim.tv_sec>=second||s.st_mtim.tv_sec>=second)return false;\n struct statfs filesystem;if(statfs(path,&filesystem)!=0)return false;\n return knownLocalFilesystem(filesystem);\n}\nstatic bool prepareHeld(const unsigned char* b,size_t n,const std::vector<const unsigned char*>& rows,const std::string& mounts){\n if(held.facts.size()==n&&memcmp(held.facts.data(),b,n)==0&&held.mounts==mounts)return true;\n held.clear();\n int64_t second;if(!clockSecond(second))return false;\n struct rlimit limit;if(getrlimit(RLIMIT_NOFILE,&limit)!=0||limit.rlim_cur<rows.size()+1024)return false;\n held.files.assign(rows.size(),-1);held.directories.resize(rows.size());\n for(size_t i=0;i<rows.size();i++)if((u32(rows[i])&0170000)==0040000){\n  const char* p=reinterpret_cast<const char*>(rows[i]+44);\n  if(lstat(p,&held.directories[i])!=0||!S_ISDIR(held.directories[i].st_mode)||!matureDirectory(p,held.directories[i],second)){held.clear();return false;}\n }\n for(size_t i=0;i<rows.size();i++)if((u32(rows[i])&0170000)!=0040000){\n  int fd=open(reinterpret_cast<const char*>(rows[i]+44),O_PATH|O_NOFOLLOW|O_CLOEXEC);\n  if(fd<0){held.clear();return false;}held.files[i]=fd;\n  struct statfs filesystem;if(fstatfs(fd,&filesystem)!=0||!knownLocalFilesystem(filesystem)){held.clear();return false;}\n }\n for(size_t i=0;i<rows.size();i++)if((u32(rows[i])&0170000)==0040000){\n  struct stat current;if(lstat(reinterpret_cast<const char*>(rows[i]+44),&current)!=0||!sameDirectory(current,held.directories[i])){held.clear();return false;}\n }\n std::string after;if(!mountContext(after)||after!=mounts){held.clear();return false;}\n held.facts.assign(b,b+n);held.mounts=mounts;held.boundSecond=second;return true;\n}\nstatic bool freshDirectories(const std::vector<const unsigned char*>& rows){\n int64_t second;if(!clockSecond(second)||second<held.boundSecond)return false;\n for(size_t i=0;i<rows.size();i++)if((u32(rows[i])&0170000)==0040000){\n  struct stat current;if(lstat(reinterpret_cast<const char*>(rows[i]+44),&current)!=0||!sameDirectory(current,held.directories[i]))return false;\n }return true;\n}\n#endif\n\nstatic int scan(const unsigned char* b,size_t n){\n if(n<12||u32(b)!=0x3156414e)return 2;\n uint32_t count=u32(b+4),indexSec=u32(b+8);if(!count||count>100000||!indexSec)return 2;\n size_t pos=12;std::vector<const unsigned char*> rows;\n for(uint32_t i=0;i<count;i++){\n  if(n-pos<45)return 2;\n  const unsigned char* r=b+pos;uint32_t plen=u32(r+40);\n  if(!plen||plen>32768||n-pos<45+size_t(plen)||r[44+plen]!=0)return 2;\n  rows.push_back(r);\n  pos+=45+size_t(plen);\n }\n if(pos!=n)return 2;\n#ifdef __linux__\n std::lock_guard<std::mutex> protect(heldMutex);\n std::string mounts;const bool haveMounts=mountContext(mounts);\n bool useHeld=haveMounts&&prepareHeld(b,n,rows,mounts);\n if(useHeld&&!freshDirectories(rows)){held.clear();useHeld=prepareHeld(b,n,rows,mounts);}\n#endif\n std::atomic<int> failed{0};std::vector<std::thread> workers;\n const size_t width=scanWidth();\n const auto scanRows=[&](size_t t){for(size_t i=t;i<rows.size();i+=width){const unsigned char* r=rows[i];uint32_t plen=u32(r+40);\n  const char* p=reinterpret_cast<const char*>(r+44);\n  for(uint32_t k=0;k<plen;k++)if(p[k]==0){failed.store(2);return;}\n  struct stat s;int readStatus;\n#ifdef __linux__\n  if(useHeld&&held.files[i]>=0)readStatus=fstat(held.files[i],&s);else readStatus=lstat(p,&s);\n#else\n  readStatus=lstat(p,&s);\n#endif\n  if(readStatus!=0){failed.store(1);return;}\n  uint32_t mode=u32(r),type=mode&0170000;\n  if(type==0040000){if(!S_ISDIR(s.st_mode)){failed.store(1);return;}continue;}\n  if(type!=0100000&&type!=0120000){failed.store(2);return;}\n  if(uint32_t(s.st_mode&S_IFMT)!=type){failed.store(1);return;}\n  if(type==0100000&&uint32_t(s.st_mode&0777)!=(mode&0777)){failed.store(1);return;}\n#ifdef __APPLE__\n  int64_t cs=s.st_ctimespec.tv_sec,cn=s.st_ctimespec.tv_nsec,ms=s.st_mtimespec.tv_sec,mn=s.st_mtimespec.tv_nsec;\n#else\n  int64_t cs=s.st_ctim.tv_sec,cn=s.st_ctim.tv_nsec,ms=s.st_mtim.tv_sec,mn=s.st_mtim.tv_nsec;\n#endif\n  if(cs<0||ms<0||cs>=indexSec||ms>=indexSec||s.st_size<0||uint64_t(s.st_size)>UINT32_MAX){failed.store(1);return;}\n  if(uint32_t(s.st_dev)!=u32(r+4)||uint32_t(s.st_ino)!=u32(r+8)||uint32_t(s.st_uid)!=u32(r+12)||uint32_t(s.st_gid)!=u32(r+16)||uint32_t(s.st_size)!=u32(r+20)||uint32_t(cs)!=u32(r+24)||uint32_t(cn)!=u32(r+28)||uint32_t(ms)!=u32(r+32)||uint32_t(mn)!=u32(r+36)){failed.store(1);return;}\n\n }};\n try{if(width==1)scanRows(0);else for(size_t t=0;t<width;t++)workers.emplace_back([&,t](){scanRows(t);});}catch(...){failed.store(2);}\n for(auto& t:workers)t.join();\n#ifdef __linux__\n if(useHeld){std::string after;if(!freshDirectories(rows)||!mountContext(after)||after!=mounts)return 1;}\n#endif\n return failed.load();\n}\nstatic napi_value check(napi_env env,napi_callback_info info){\n size_t argc=1;napi_value arg[1],out;void* bytes=nullptr;size_t len=0;int result=2;\n if(napi_get_cb_info(env,info,&argc,arg,nullptr,nullptr)==0&&argc==1&&napi_get_buffer_info(env,arg[0],&bytes,&len)==0&&len<=64000000){try{result=scan(static_cast<const unsigned char*>(bytes),len);}catch(...){result=2;}}\n napi_create_int32(env,result,&out);return out;\n}\nextern \"C\" uint32_t node_api_module_get_api_version_v1(void){return 8;}\nextern \"C\" napi_value napi_register_module_v1(napi_env env,napi_value exports){\n napi_value fn;if(napi_create_function(env,\"check\",5,check,nullptr,&fn)!=0)return nullptr;\n if(napi_set_named_property(env,exports,\"check\",fn)!=0)return nullptr;return exports;\n}\n";
let navigationTrackedStatAddon;
function navigationTrackedStatKernel(){
 if(navigationTrackedStatAddon!==undefined)return navigationTrackedStatAddon;
 navigationTrackedStatAddon=null;
 try{
  if(!['darwin','linux'].includes(process.platform))return null;
  const compiler=process.platform==='darwin'?'/usr/bin/clang++':'/usr/bin/c++';
  if(!existsSync(compiler))return null;
  const directory=realpathSync(mkdtempSync(resolve(tmpdir(),'shift-native-tracked-stats-')));
  chmodSync(directory,0o700);
  const source=resolve(directory,'native.cc'),binary=resolve(directory,'native.node');
  writeFileSync(source,navigationTrackedStatNativeSource,{mode:0o400,flag:'wx'});
  const flags=['-std=c++17','-O2','-shared','-fPIC'];
  if(process.platform==='darwin')flags.push('-undefined','dynamic_lookup');else flags.push('-pthread');
  execFileSync(compiler,[...flags,source,'-o',binary],{timeout:30000,maxBuffer:1e6,stdio:'pipe'});
  chmodSync(binary,0o400);
  const s=lstatSync(binary,{bigint:true});assert(s.isFile()&&!s.isSymbolicLink()&&realpathSync(binary)===binary&&s.size>0n&&s.size<1000000n);
  const expected=sha(readFileSync(binary)),nativeModule=createRequire(import.meta.url)(binary);
  assert.equal(typeof nativeModule.check,'function');Object.freeze(nativeModule);
  const nativeCheck=nativeModule.check;
  const intact=()=>{const d=lstatSync(directory),b=lstatSync(binary,{bigint:true});return d.isDirectory()&&!d.isSymbolicLink()&&realpathSync(directory)===directory&&b.isFile()&&!b.isSymbolicLink()&&realpathSync(binary)===binary&&b.dev===s.dev&&b.ino===s.ino&&b.mode===s.mode&&b.size===s.size&&b.ctimeNs===s.ctimeNs&&b.mtimeNs===s.mtimeNs&&sha(readFileSync(binary))===expected;};
  navigationTrackedStatAddon=Object.freeze({check:nativeCheck,intact});
 }catch{navigationTrackedStatAddon=null;}
 return navigationTrackedStatAddon;
}
function makeNativeNavigationFreshTrackedStats(){
 try{
  const kernel=navigationTrackedStatKernel();if(!kernel||!kernel.intact())return null;
  const root=process.cwd(),index=resolve(root,'.git/index'),before=readFileSync(index),indexState=lstatSync(index,{bigint:true});
  assert(indexState.isFile()&&!indexState.isSymbolicLink()&&before.length<=32e6);
  const raw=git('ls-files','--stage','--debug','-z');assert(raw.length<=32e6);
  const records=[],seen=new Set(),directories=new Set([root]);let at=0;
  const row=(mode,filename,fields=[])=>{
   const name=Buffer.from(filename);assert(name.length>0&&name.length<=32768);
   const r=Buffer.alloc(45+name.length),numbers=[mode,...fields];while(numbers.length<10)numbers.push(0);numbers.push(name.length);
   numbers.forEach((n,i)=>{assert(Number.isSafeInteger(n)&&n>=0&&n<=0xffffffff);r.writeUInt32LE(n,i*4);});name.copy(r,44);records.push(r);
  };
  while(at<raw.length){
   const end=raw.indexOf(0,at);assert(end>at);
   const encoded=raw.subarray(at,end),h=/^([0-7]{6}) ([a-f0-9]{40}) 0\t([\s\S]+)$/.exec(encoded.toString('utf8'));assert(h&&Buffer.from(h[0]).equals(encoded));
   const p=h[3];assert(!isAbsolute(p)&&!p.split('/').some(s=>!s||s==='.'||s==='..')&&!p.includes('\\')&&!seen.has(p));seen.add(p);assert(seen.size<=100000);
   const m=/^  ctime: (\d+):(\d+)\n  mtime: (\d+):(\d+)\n  dev: (\d+)\tino: (\d+)\n  uid: (\d+)\tgid: (\d+)\n  size: (\d+)\tflags: ([0-9a-f]+)\n/.exec(raw.subarray(end+1,end+301).toString('utf8'));assert(m&&m[10]==='0');
   const mode=parseInt(h[1],8);assert([0o100644,0o100755,0o120000].includes(mode));
   const full=resolve(root,p);assert(full.startsWith(root+'/'));
   row(mode,full,[Number(m[5]),Number(m[6]),Number(m[7]),Number(m[8]),Number(m[9]),Number(m[1]),Number(m[2]),Number(m[3]),Number(m[4])]);
   let d=dirname(full);while(d!==root){assert(d.startsWith(root+'/'));directories.add(d);d=dirname(d);}
   at=end+1+Buffer.byteLength(m[0]);
  }
  assert(seen.size>0&&seen.size<=100000&&directories.size<=100000);
  for(const d of directories)row(0o040000,d);
  const header=Buffer.alloc(12);header.writeUInt32LE(0x3156414e);header.writeUInt32LE(records.length,4);
  const seconds=Number(indexState.mtimeNs/1000000000n);assert(Number.isSafeInteger(seconds)&&seconds>0&&seconds<=0xffffffff);header.writeUInt32LE(seconds,8);
  const facts=Buffer.concat([header,...records]);assert(facts.length<=32e6);
  const sameIndex=()=>{const s=lstatSync(index,{bigint:true});return s.isFile()&&!s.isSymbolicLink()&&s.dev===indexState.dev&&s.ino===indexState.ino&&s.mode===indexState.mode&&s.size===indexState.size&&s.ctimeNs===indexState.ctimeNs&&s.mtimeNs===indexState.mtimeNs&&readFileSync(index).equals(before);};
  assert(sameIndex());
  return()=>{try{return process.cwd()===root&&sameIndex()&&kernel.intact()&&kernel.check(facts)===0&&sameIndex()&&kernel.intact();}catch{return false;}};
 }catch{return null;}
}

export function nativeNavigationFreshSourceChecker(expected){
 clean(expected);
 prepareNativeNavigationIndexStats();
 const cwd=process.cwd(),environment=JSON.stringify(Object.keys(process.env).sort().map(k=>[k,process.env[k]]));
 let context;try{context=freshSourceContext();}catch{context=null;}
 const freshTrackedStats=context?makeNativeNavigationFreshTrackedStats():null;
 return()=>{
  assert.deepEqual([execFileSync,readFileSync,lstatSync,readlinkSync,readdirSync,realpathSync,createHash,process.cwd,mkdtempSync,chmodSync,writeFileSync,tmpdir,createRequire],native,'Native navigation source functions changed');
  assert.equal(process.cwd(),cwd,'Navigation source working directory moved');
  assert.equal(JSON.stringify(Object.keys(process.env).sort().map(k=>[k,process.env[k]])),environment,'Navigation source execution environment changed');
  if(!context){clean(expected);return;}
  // Exact current HEAD/ref/index/config/replacement bytes retain all entry
  // topology, staged-source and index-visibility assertions. Working source
  // receives a fresh native scan of every indexed path and parent before and
  // after caller reads; any uncertainty retains the exact original Git diff.
  assert.equal(context.snapshot(),context.entry,'Native navigation source metadata changed');
  assert.equal(freshTrackedStats?.()===true?0:git('diff-files','--patch','--binary','--no-ext-diff','--no-textconv','--no-renames','--').length,0,'Fresh navigation working source changed');
  assert.equal(context.snapshot(),context.entry,'Native navigation source metadata changed during current-source check');
 };
}

function object(ref,p){assert(oid.test(ref));path(p);const id=immutableNavigationFact('git',['rev-parse',ref+':'+p],{maxBuffer:64e6}).toString('utf8').trimEnd();assert(oid.test(id));return id;}
// Reuse only actual native blob batches whose current object-storage
// provenance is unchanged. No working-source check, callback or verdict is cached.
const nativeNavigationBlobBatches=new Map();let nativeNavigationBlobBatchBytes=0;
function navigationBlobStorageState(id){
 try{
  assert(oid.test(id));const root=resolve(process.cwd(),'.git/objects');
  const stamp=s=>[s.dev,s.ino,s.mode,s.size,s.mtimeNs,s.ctimeNs].map(String);
  const directory=lstatSync(root,{bigint:true,throwIfNoEntry:false});
  if(!directory||!directory.isDirectory()||directory.isSymbolicLink()||realpathSync(root)!==root)return null;
  if(lstatSync(resolve(root,'info/alternates'),{throwIfNoEntry:false}))return null;
  const packRoot=resolve(root,'pack'),packDirectory=lstatSync(packRoot,{bigint:true,throwIfNoEntry:false}),packs=[];
  if(packDirectory){
   if(!packDirectory.isDirectory()||packDirectory.isSymbolicLink())return null;
   const names=readdirSync(packRoot).sort();if(names.length>1024)return null;
   for(const name of names){const s=lstatSync(resolve(packRoot,name),{bigint:true});if(!s.isFile()||s.isSymbolicLink())return null;packs.push([name,stamp(s)]);}
  }
  const prefix=resolve(root,id.slice(0,2)),prefixStat=lstatSync(prefix,{bigint:true,throwIfNoEntry:false});
  if(prefixStat&&(!prefixStat.isDirectory()||prefixStat.isSymbolicLink()))return null;
  const file=resolve(prefix,id.slice(2)),s=lstatSync(file,{bigint:true,throwIfNoEntry:false});let loose='absent';
  if(s){if(!s.isFile()||s.isSymbolicLink()||s.size>64000000n)return null;const raw=readFileSync(file);if(raw.length>64e6)return null;loose=[stamp(s),sha(raw)];}
  return JSON.stringify([root,stamp(directory),packDirectory?stamp(packDirectory):'absent',packs,prefixStat?stamp(prefixStat):'absent',loose]);
 }catch{return null;}
}
function bytes(ref,p){
 assert(oid.test(ref));path(p);
 const expected=object(ref,p),provenance=navigationBlobStorageState(expected),retained=provenance===null?null:nativeNavigationBlobBatches.get(expected);
 const reusable=retained&&retained.provenance===provenance;
 const batch=reusable?Buffer.from(retained.bytes):execFileSync('/usr/bin/git',['--no-optional-locks','--no-replace-objects','cat-file','--batch'],{input:ref+':'+p+'\n',maxBuffer:64e6});
 const lf=batch.indexOf(10);assert(lf>0,'Native navigation content batch header required');
 const row=/^([a-f0-9]{40}) (blob|tree) ([0-9]+)$/.exec(batch.subarray(0,lf).toString('ascii'));assert(row,'Exact native navigation blob or tree required');
 assert.equal(row[1],expected,'Fresh authenticated native navigation object required');
 const [,id,kind,length]=row,size=Number(length);assert(Number.isSafeInteger(size)&&size>=0);assert.equal(batch.length,lf+size+2);assert.equal(batch[batch.length-1],10);
 if(kind==='blob'){
  const value=decodeSeoBlobBatch(batch,[id]).get(id),after=navigationBlobStorageState(id);
  if(reusable)assert.equal(after,provenance,'Native navigation object storage changed during immutable batch use');
  if(provenance!==null&&after===provenance&&batch.length<=32e6){
   const previous=nativeNavigationBlobBatches.get(id);if(previous){nativeNavigationBlobBatchBytes-=previous.bytes.length;nativeNavigationBlobBatches.delete(id);}
   while(nativeNavigationBlobBatchBytes+batch.length>32e6){const oldest=nativeNavigationBlobBatches.keys().next().value;nativeNavigationBlobBatchBytes-=nativeNavigationBlobBatches.get(oldest).bytes.length;nativeNavigationBlobBatches.delete(oldest);}
   nativeNavigationBlobBatches.set(id,{bytes:Buffer.from(batch),provenance});nativeNavigationBlobBatchBytes+=batch.length;
  }
  return value;
 }
 const value=batch.subarray(lf+1,lf+1+size);assert.equal(createHash('sha1').update('tree '+size+'\0').update(value).digest('hex'),id);return git('show',ref+':'+p);
}
const content=(r,p)=>bytes(r,p).toString('utf8');
const diff=(a,b)=>text('diff','--no-renames','--name-only',a,b).split('\n').filter(Boolean);
const ancestor=(a,b)=>{git('merge-base','--is-ancestor',a,b);return true;};
function mode(ref,p){const row=text('ls-tree',ref,'--',path(p));const m=/^(100644|100755) blob ([a-f0-9]{40})\t/.exec(row);assert(m,'Exact regular-file source required: '+p);return m[1];}
function inverse(p,value,entry){
 if(entry.kind==='maintenance-add')return null;
 if(entry.kind==='add'){assert(value.equals(Buffer.from(entry.after,'base64')));assert.equal(sha(value),entry.afterSha256);return null;}
 let out=value;
 for(const h of [...entry.hunks].reverse()){
  const before=Buffer.from(h.before,'base64'),after=Buffer.from(h.after,'base64');assert(before.length&&after.length);
  const s=out.indexOf(after);assert(s>=0&&out.indexOf(after,s+1)<0,'Unique whole navigation inverse required: '+p);
  out=Buffer.concat([out.subarray(0,s),before,out.subarray(s+after.length)]);
 }
 return out;
}
export function assertExactNavigationPayload(p,value,fileMode='100644'){
 assert(fixedPaths.includes(p),'Only the original two navigation paths are admitted');assert.equal(fileMode,'100644');
 assert(Buffer.isBuffer(value));const e=policy.payloadEntries.find(x=>x.path===p);assert(e);assert.equal(sha(value),e.afterSha256,'Exact frozen navigation payload required');
 return inverse(p,value,e);
}
function receipt(){
 const a=data(policy.acceptedProduction);assert.equal(a.source,BASE);assert.equal(a.tree,policy.record.baseTree);
 const decoded=Object.fromEntries(['run','job','active','receipt','logs'].map(k=>[k,Buffer.from(a[k],'base64')]));
 for(const[k,v]of Object.entries(decoded))assert.equal(sha(v),a.sha256[k],'Original normal production evidence changed: '+k);
 const run=JSON.parse(decoded.run),job=JSON.parse(decoded.job),active=JSON.parse(decoded.active),owned=JSON.parse(decoded.receipt);
 assert.equal(run.head_sha,BASE);assert.equal(run.head_branch,'main');assert.equal(run.path,'.github/workflows/cloudflare-production-promote.yml');assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');assert.equal(job.status,'completed');assert.equal(job.conclusion,'success');assert.equal(job.name,'promote');
 const ownedLines=decoded.logs.toString('utf8').split('\n').flatMap(line=>{const i=line.indexOf('{"kind":"owned_runtime_deployment"');if(i<0)return[];try{return[JSON.parse(line.slice(i))]}catch{return[]}});
 assert.equal(ownedLines.filter(x=>JSON.stringify(x)===JSON.stringify(owned)).length,1);assert.equal(verifiedOwnedRuntime(active,run,job,owned),true);return owned;
}
function prove(rawHead,editorialOuter=null){
 const {clean:proofClean,readFileSync:proofRead}=editorialOuter?navigationEditorialProofFacts(editorialOuter):{clean,readFileSync};
 const record=JSON.parse(content(rawHead,LEDGER)),c=record[KEY];if(!c)return null;
 const{maintenanceSource,...fixed}=data(c);assert.deepEqual(fixed,policy.record);assert.equal(c.base,BASE);assert.equal(c.payload,PAYLOAD);assert.deepEqual(c.paths,fixedPaths);
 assert.deepEqual(c.maintenancePaths,fixedMaintenance);assert.equal(sha(Buffer.from(JSON.stringify(policy.maintenanceEntries))),MAINTENANCE_DECLARATION_SHA256,'Only the exact original guard hooks are admitted');
 for(const r of[c.base,c.payload,maintenanceSource]){assert(oid.test(r));ancestor(r,rawHead);}assert.equal(text('rev-parse',c.base+'^{tree}'),c.baseTree);assert.equal(text('rev-parse',c.payload+'^{tree}'),c.payloadTree);receipt();
 for(const[a,b,paths]of[[c.base,c.payload,c.paths],[c.payload,maintenanceSource,c.maintenancePaths],[maintenanceSource,rawHead,[LEDGER]]]){ancestor(a,b);assert.deepEqual(sorted(diff(a,b)),sorted(paths),'Exact two-path navigation/maintenance/ledger boundary required');}
 assert.deepEqual(sorted(diff(c.base,rawHead)),sorted([...new Set([...c.paths,...c.maintenancePaths,LEDGER])]),'Every unrelated source path must remain exact');
 for(const p of c.paths){
  assert.equal(mode(rawHead,p),'100644');assert.equal(object(rawHead,p),object(c.payload,p));const value=bytes(rawHead,p),restored=assertExactNavigationPayload(p,value);
  assert(proofRead(resolve(process.cwd(),p)).equals(value),'Fresh navigation working bytes changed');
  if(restored===null)assert.equal(text('ls-tree',c.base,'--',p),'');else assert(restored.equals(bytes(c.base,p)),'Whole original navigation source must restore');
 }
 for(const p of c.maintenancePaths){
  assert.equal(mode(rawHead,p),'100644');assert.equal(object(rawHead,p),object(maintenanceSource,p));const value=bytes(rawHead,p);assert(proofRead(resolve(process.cwd(),p)).equals(value),'Fresh maintenance working bytes changed');
  const entry=policy.maintenanceEntries.find(x=>x.path===p);assert(entry);const restored=inverse(p,value,entry);
  if(restored===null)assert.equal(text('ls-tree',c.base,'--',p),'');else assert(restored.equals(bytes(c.base,p)),'Every original Core assertion must restore byte for byte: '+p);
 }
 delete record[KEY];assert.deepEqual(record,JSON.parse(content(c.base,LEDGER)),'Every prior approval, failure, receipt and record must remain exact');
 for(const p of ['wrangler.jsonc','wrangler.coaching.jsonc','wrangler.hq-management.jsonc','package.json','package-lock.json','.github/workflows/cloudflare-production-promote.yml','worker-entry-v6.js','shift-coach/worker.mjs','member-experience/treatment-week-client.mjs','my-timber-app','public'])assert.equal(object(rawHead,p),object(c.base,p),'Protected navigation boundary changed: '+p);
 proofClean(rawHead);return c;
}
function actualNavigationOuterFrameBeforeEditorial(editorialOuter=null){
 const {clean}=editorialOuter?navigationEditorialProofFacts(editorialOuter):{clean:navigationNativeCleanBeforeEditorial};
 const rawHead=clean(),env=JSON.stringify(Object.keys(process.env).sort().map(k=>[k,process.env[k]])),cwd=process.cwd(),c=prove(rawHead,editorialOuter);if(!c)return null;
 const freshCurrent=editorialOuter?clean:nativeNavigationFreshSourceChecker(rawHead);
 const assertCurrent=()=>{assert.equal(process.cwd(),cwd,'Navigation source working directory moved');assert.equal(JSON.stringify(Object.keys(process.env).sort().map(k=>[k,process.env[k]])),env,'Navigation source execution environment changed');freshCurrent(rawHead);};
 const finish=()=>{assertCurrent();assert.deepEqual(prove(rawHead,editorialOuter),c);};
 const map=r=>r==='HEAD'||r===rawHead?c.base:r,current=r=>r==='HEAD'||r===rawHead||r===c.base;
 const native=(kind,r,p)=>kind==='read'?object(r==='HEAD'?rawHead:r,p):content(r==='HEAD'?rawHead:r,p);
 const auth=(value,r,p,kind='read')=>{const ref=r==='HEAD'?rawHead:r,expected=native(kind,r,p);if(value===expected||kind==='read'&&value===native('content',r,p))return true;const prefix='tree '+ref+':'+p+'\n',shown=kind==='content'?expected:native('content',r,p);return shown.startsWith(prefix)&&value===shown.replace(prefix,'tree '+r+':'+p+'\n');};
 function projected(kind,source){return(r,p)=>{assertCurrent();try{if(source){const obtain=ref=>{const v=source(ref,p);assert(auth(v,ref,p,kind),'Supplied navigation source changed');return v;};if(current(r)){obtain('HEAD');obtain(rawHead);return obtain(c.base);}return obtain(r);}return kind==='read'?object(map(r),p):content(map(r),p);}finally{assertCurrent();}};}
 function binary(kind,source){return(a,b)=>{assertCurrent();try{const obtain=(x,y)=>{const v=kind==='diff'?diff(x==='HEAD'?rawHead:x,y==='HEAD'?rawHead:y):ancestor(x==='HEAD'?rawHead:x,y==='HEAD'?rawHead:y);if(source){const supplied=data(source(x,y));if(kind==='diff')assert.deepEqual(sorted(supplied),sorted(v));else assert.notEqual(supplied,false);}return v;};if(source&&current(b)){obtain(a,'HEAD');obtain(a,rawHead);}return obtain(map(a),map(b));}finally{assertCurrent();}};}
 const frame={rawHead,head:c.base,record:JSON.parse(content(c.base,LEDGER)),assertCurrent,assertCurrentHead:assertCurrent,finish,affected:p=>[...c.paths,...c.maintenancePaths,LEDGER].some(q=>q===p||q.startsWith(p+'/')),currentContent:(r,p)=>content(r==='HEAD'?rawHead:r,p),nativeAuthentic:(v,r,p)=>auth(v,r,p,'read')||auth(v,r,p,'content'),nativeContentAuthentic:(v,r,p)=>auth(v,r,p,'content'),authentic:(v,r,p)=>auth(v,r,p,'read')||auth(v,r,p,'content'),read:projected('read',null),blob:projected('read',null),content:projected('content',null),diff:binary('diff',null),ancestor:binary('ancestor',null),projectRead:r=>{assert.equal(typeof r,'function','Supplied navigation source read callback required');return projected('read',r);},projectContent:r=>{assert.equal(typeof r,'function','Supplied navigation source content callback required');return projected('content',r);},projectDiff:r=>{assert.equal(typeof r,'function','Supplied navigation source diff callback required');return binary('diff',r);},projectAncestor:r=>{assert.equal(typeof r,'function','Supplied navigation source ancestor callback required');return binary('ancestor',r);}};
 frames.add(frame);assertCurrent();return Object.freeze(frame);
}
export function assertActualNavigationFrame(frame){assert(frames.has(frame));frame.assertCurrent();return frame;}
export const ACTUAL_NAVIGATION_PATHS=Object.freeze(policy.record.paths);
export const ACTUAL_NAVIGATION_MAINTENANCE=Object.freeze(policy.record.maintenancePaths);
export function assertNavigationOuterChainContext(repair){const navigation=actualNavigationOuterFrame();if(!navigation)return;try{assert.equal(repair.rawHead,navigation.rawHead);assert(repair.ciExecutionContext);assert.equal(repair.ciExecutionContext.rawHead,navigation.rawHead);}finally{navigation.finish();}}
export function actualNavigationChangedPath(status,p){const navigation=actualNavigationOuterFrame();assert(navigation);try{assert([...ACTUAL_NAVIGATION_PATHS,...ACTUAL_NAVIGATION_MAINTENANCE].includes(p));const row=text('ls-tree',navigation.head,'--',path(p));if(row)assert(/^100644 blob [a-f0-9]{40}\t/.test(row));assert.equal(status,row?'M':'A');return true;}finally{navigation.finish();}}

const navigationNativeCleanBeforeEditorial=clean;

function navigationEditorialProofFacts(outer){
 assertWebsiteEditorialCompletionView(outer);
 const nativeCurrent=nativeNavigationFreshSourceChecker(outer.rawHead);
 return Object.freeze({
  // The outer view is privately admitted and frozen above. The native checker
  // rechecks its exact raw HEAD/ref/index/config/environment and working bytes
  // at every use; repeating the outer working-tree scan here adds no boundary.
  clean:(expected)=>{nativeCurrent();if(expected!==undefined)assert.equal(expected,outer.head,'Exact admitted navigation predecessor required');return outer.head;},
  readFileSync:filename=>{
   outer.assertCurrent();const full=resolve(filename),prefix=process.cwd()+'/';assert(full.startsWith(prefix),'Only native tracked navigation files may be projected');
   const p=full.slice(prefix.length);assert([...fixedPaths,...fixedMaintenance].includes(p),'Exact navigation source path required');
   const actual=readFileSync(full);assert(actual.equals(bytes(outer.rawHead,p)),'Actual current navigation working source changed');
   return bytes(outer.head,p);
  }
 });
}
export function actualNavigationOuterFrame(){
 prepareNativeNavigationIndexStats();
 ensureOriginalNavigationHqObjects();
 ensureOriginalNavigationPhotoEvidenceObjects();
 const outer=websiteEditorialCompletionHistoricalView();if(!outer)return actualNavigationOuterFrameBeforeEditorial();
 assertWebsiteEditorialCompletionView(outer);const inner=actualNavigationOuterFrameBeforeEditorial(outer);assert(inner,'The admitted predecessor must retain its navigation frame');
 const ref=r=>r==='HEAD'||r===outer.rawHead?'HEAD':r,unary=fn=>(r,p)=>fn(ref(r),p),binary=fn=>(a,b)=>fn(ref(a),ref(b));
 const authentic=(v,r,p)=>outer.nativeAuthentic(v,r,p)||outer.nativeContentAuthentic(v,r,p);
 const frame={...inner,rawHead:outer.rawHead,
  assertCurrent:inner.assertCurrent,
  assertCurrentHead:inner.assertCurrentHead,
  finish:()=>{inner.finish();outer.assertCurrent();},
  affected:p=>outer.affected(p)||inner.affected(p),
  currentContent:outer.currentContent,authentic,nativeAuthentic:authentic,nativeContentAuthentic:outer.nativeContentAuthentic,
  read:unary(inner.read),blob:unary(inner.blob),content:unary(inner.content),diff:binary(inner.diff),ancestor:binary(inner.ancestor),
  projectRead:r=>{assert.equal(typeof r,'function','Supplied navigation source read callback required');return unary(inner.projectRead(outer.projectRead(r)));},
  projectContent:r=>{assert.equal(typeof r,'function','Supplied navigation source content callback required');return unary(inner.projectContent(outer.projectContent(r)));},
  projectDiff:r=>{assert.equal(typeof r,'function','Supplied navigation source diff callback required');return binary(inner.projectDiff(outer.projectDiff(r)));},
  projectAncestor:r=>{assert.equal(typeof r,'function','Supplied navigation source ancestor callback required');return binary(inner.projectAncestor(outer.projectAncestor(r)));}
 };
 frames.add(frame);frame.assertCurrent();return Object.freeze(frame);
}
