import {websiteEditorialCompletionHistoricalView,assertWebsiteEditorialCompletionView} from './website-editorial-scope-20261018.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,lstatSync,readlinkSync,readdirSync,realpathSync,existsSync} from 'node:fs';
import {resolve,isAbsolute,dirname} from 'node:path';
import {homedir} from 'node:os';
import {createHash} from 'node:crypto';
import {decodeSeoBlobBatch} from './seo-native-immutable-facts-20261016.mjs';
import {verifiedOwnedRuntime} from '../shift-coach/cancelled-release-recovery.mjs';

const policy=JSON.parse(readFileSync(new URL('./recorded-week-navigation-outer-policy-20261018.json',import.meta.url),'utf8'));
const LEDGER='release/approved-runtime-composition.json',KEY='recordedWeekNavigation20261018';
const BASE='0e4a765e7a360d705e2424264e0bcfcc1d6652be',PAYLOAD='0d0a1c80a6e461dd641b7a95d3c46e8758d0ebeb';
const fixedPaths=Object.freeze(['frontend/member/member-progress-v1.js','member-experience/staging/verify-treatment-week-navigation.mjs']);
const fixedMaintenance=Object.freeze(['release/accepted-uk-grub-preservation-20261017.mjs','release/approved-runtime-composition.mjs','release/combined-finite-scope-20261014.mjs','release/current-runtime-preservation-20261016.mjs','release/recorded-week-navigation-outer-frame-20261018.mjs','release/recorded-week-navigation-outer-policy-20261018.json','tests/recorded-week-navigation-preservation-20261018.test.mjs','member-experience/tests/weight-import-mapping-ui.test.mjs','public-https-redirect.mjs','public-https-redirect.test.mjs']);
const MAINTENANCE_DECLARATION_SHA256='be5c1409d39f6feee5809087be94e7ba94a2217d6c4b4f765d62571b484ee58b';
const native=[execFileSync,readFileSync,lstatSync,readlinkSync,readdirSync,realpathSync,createHash,process.cwd];
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
 assert.deepEqual([execFileSync,readFileSync,lstatSync,readlinkSync,readdirSync,realpathSync,createHash,process.cwd],native,'Native navigation source functions changed');
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

export function nativeNavigationFreshSourceChecker(expected){
 clean(expected);
 const cwd=process.cwd(),environment=JSON.stringify(Object.keys(process.env).sort().map(k=>[k,process.env[k]]));
 let context;try{context=freshSourceContext();}catch{context=null;}
 return()=>{
  assert.deepEqual([execFileSync,readFileSync,lstatSync,readlinkSync,readdirSync,realpathSync,createHash,process.cwd],native,'Native navigation source functions changed');
  assert.equal(process.cwd(),cwd,'Navigation source working directory moved');
  assert.equal(JSON.stringify(Object.keys(process.env).sort().map(k=>[k,process.env[k]])),environment,'Navigation source execution environment changed');
  if(!context){clean(expected);return;}
  // Exact current HEAD/ref/index/config/replacement bytes retain all entry
  // topology, staged-source and index-visibility assertions. Working source
  // still receives a fresh native Git diff before and after caller reads.
  assert.equal(context.snapshot(),context.entry,'Native navigation source metadata changed');
  assert.equal(git('diff-files','--patch','--binary','--no-ext-diff','--no-textconv','--no-renames','--').length,0,'Fresh navigation working source changed');
  assert.equal(context.snapshot(),context.entry,'Native navigation source metadata changed during current-source check');
 };
}

function object(ref,p){assert(oid.test(ref));path(p);const id=text('rev-parse',ref+':'+p);assert(oid.test(id));return id;}
function bytes(ref,p){
 assert(oid.test(ref));path(p);
 const batch=execFileSync('/usr/bin/git',['--no-optional-locks','--no-replace-objects','cat-file','--batch'],{input:ref+':'+p+'\n',maxBuffer:64e6});
 const lf=batch.indexOf(10);assert(lf>0,'Native navigation content batch header required');
 const row=/^([a-f0-9]{40}) (blob|tree) ([0-9]+)$/.exec(batch.subarray(0,lf).toString('ascii'));assert(row,'Exact native navigation blob or tree required');
 const [,id,kind,length]=row,size=Number(length);assert(Number.isSafeInteger(size)&&size>=0);assert.equal(batch.length,lf+size+2);assert.equal(batch[batch.length-1],10);
 if(kind==='blob')return decodeSeoBlobBatch(batch,[id]).get(id);
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
