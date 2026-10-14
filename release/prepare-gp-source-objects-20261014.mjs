import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdtempSync,readFileSync,realpathSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

// Explicit source preparation only. Verifiers never call this bootstrap.
// Git unbundle imports objects and does not create or advance a reference.
const packet=value=>Object.freeze(value);
export const GP_SOURCE_PACKETS=Object.freeze({
 core:packet({file:'core-original.bundle',bytes:16796,sha256:'fe2498a5411dc7e20eef375f42be2b169e11fab8020ed32e943e64790e38808a',blob:'3264d76679e6087da4896d60bcb80a0429db12e2',base:'685ede249cd20c4801d0a25227fed16d46860618',baseTree:'95d207639954ca8acab04b5ccf165ee117b43049',head:'3655de34b128950553cda7f6a7b612adab338b5c',tree:'d895dc3ed7b86a468f27a171f5beb3824d09ef33'}),
 savedProfile:packet({file:'core-saved-profile.bundle',bytes:5117,sha256:'39256fa2119ea9d39c92c5eb82ceec2dff49fd36484a0c80161ba8654e6c10b6',blob:'a1c3e6b1aed1460220a7c6e42d7edd54893c51ce',base:'685ede249cd20c4801d0a25227fed16d46860618',baseTree:'95d207639954ca8acab04b5ccf165ee117b43049',head:'0ae606fe5fd254cf717c3a853d7829801aaa8934',tree:'b132bc8866b64c7e131cbcc5a1d7c9d5078e1462'}),
 hq:packet({file:'hq-original.bundle',bytes:5345,sha256:'670912620f436d7fe75e555e71c1fca4c85b3b5b5b3b74a88094f9e73fafac89',blob:'c9e6ed6198b197aef1e72be43d10f68d03edeca4',base:'d2df57b400bdb0072d10c1ef9c2cb0e938ef5f03',baseTree:'190eafcd5877a139dadc6170c16326b0f4f9dfe6',head:'3120bb939d7f08da7de9062989cfe1f13b92d5be',tree:'7343e9e0e3e7cfa61deafe0dcfc14ba99024a7cd'}),
 hqPackaging:packet({file:'hq-static-packaging.bundle',bytes:5313,sha256:'a2749398aa20f25789c89e79483b0aeb44df3fb79a634e4359f7cc8a23270ca7',blob:'c4e9019ba501aa64b7fcc700a5dcad3716706c22',base:'d2df57b400bdb0072d10c1ef9c2cb0e938ef5f03',baseTree:'190eafcd5877a139dadc6170c16326b0f4f9dfe6',head:'3a83af2fffce3343f1cccc4410dd2b3cec5ae6c1',tree:'bdf535142d3fe366f19ce9e2268c0aee4e9ac534'})
});
export const GP_SOURCE_BUNDLE_DIRECTORY=fileURLToPath(new URL('./source-objects/',import.meta.url));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const environment=()=>({...Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('GIT_'))),GIT_NO_LAZY_FETCH:'1'});
function git(repo,args,{allowAbsent=false}={}){
 const r=spawnSync('/usr/bin/git',['--no-replace-objects','-C',repo,...args],{env:environment(),maxBuffer:64e6});
 if(r.error)throw r.error;
 if(r.status!==0&&!(allowAbsent&&r.status===1))throw Error('GP source preparation Git failed: '+args[0]+' ('+r.status+'): '+r.stderr.toString().slice(0,1200));
 return r.stdout;
}
const text=(repo,args,options)=>git(repo,args,options).toString('utf8').trim();
const gitPath=(repo,path)=>resolve(repo,text(repo,['rev-parse','--git-path',path]));
function visibleHistory(repo){
 assert.equal(text(repo,['config','--get-regexp','^(extensions\\.partialclone|remote\\..*\\.promisor)$'],{allowAbsent:true}),'','GP source preparation requires a complete non-promisor repository; no lazy network fetch is permitted');
 assert.equal(text(repo,['rev-parse','--show-object-format']),'sha1','Exact SHA-1 GP object store required');
 assert.equal(text(repo,['for-each-ref','refs/replace/','--format=%(refname)']),'','GP replacement objects are forbidden');
 assert(!existsSync(gitPath(repo,'info/grafts')),'GP graft metadata is forbidden');
 assert.equal(text(repo,['rev-parse','--shared-index-path']),'','GP source preparation does not accept split indexes');
}
export function gpSourcePreparationState(repositoryPath){
 const repo=realpathSync(repositoryPath);visibleHistory(repo);
 const index=gitPath(repo,'index'),headFile=gitPath(repo,'HEAD');
 return {repo,head:text(repo,['rev-parse','--verify','--quiet','HEAD'],{allowAbsent:true})||null,
  symbolicHead:text(repo,['symbolic-ref','--quiet','HEAD'],{allowAbsent:true})||null,
  headFile:existsSync(headFile)?digest(readFileSync(headFile)):null,
  refs:text(repo,['for-each-ref','--format=%(refname)%00%(objectname)%00%(symref)']),
  index:{path:index,exists:existsSync(index),sha256:existsSync(index)?digest(readFileSync(index)):null}};
}
export function assertGpSourcePreparationState(before,after){assert.deepEqual(after,before,'GP source preparation changed HEAD, references or index');}
// Pure byte checker for deterministic malformed-packet tests. The runnable
// bootstrap below always selects the literal frozen specifications above.
export function verifyGpSourceBundleBytes(bytes,spec){
 assert(Buffer.isBuffer(bytes));assert.equal(bytes.length,spec.bytes,'Exact GP bundle length required');
 assert.equal(digest(bytes),spec.sha256,'Exact GP bundle SHA-256 required');
 assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),spec.blob,'Exact tracked GP bundle blob required');
 const end=bytes.indexOf('\n\n');assert(end>0,'Exact GP bundle header required');
 const lines=bytes.subarray(0,end).toString('utf8').split('\n');
 assert.equal(lines.shift(),'# v2 git bundle','Exact GP bundle format required');
 const prerequisites=lines.filter(line=>line.startsWith('-')).map(line=>line.slice(1).split(' ')[0]);
 const heads=lines.filter(line=>!line.startsWith('-'));
 assert.deepEqual(prerequisites,[spec.base],'Only the exact original GP base prerequisite is permitted');
 assert.deepEqual(heads,[spec.head+' HEAD'],'Only the exact original GP source head is permitted');
 return spec;
}
function object(repo,ref,tree){
 assert.equal(text(repo,['cat-file','-t',ref]),'commit','Exact GP commit object required');
 assert.equal(text(repo,['rev-parse',ref+'^{tree}']),tree,'Exact GP source tree required');
}
export function verifyGpSourceObjectPins(repositoryPath,spec){const repo=realpathSync(repositoryPath);visibleHistory(repo);object(repo,spec.base,spec.baseTree);object(repo,spec.head,spec.tree);return spec;}
export function prepareGpSourceObjects({coreRepository,hqRepository,includeHqPackaging=false,bundleDirectory=GP_SOURCE_BUNDLE_DIRECTORY}={}){
 assert(coreRepository!==undefined||hqRepository!==undefined,'An actual core or HQ repository is required');
 for(const repository of[coreRepository,hqRepository])if(repository!==undefined)assert.equal(typeof repository,'string');
 assert.equal(typeof includeHqPackaging,'boolean');assert(!includeHqPackaging||hqRepository!==undefined,'HQ packaging preparation requires an actual HQ repository');
 const core=coreRepository===undefined?null:realpathSync(coreRepository),hq=hqRepository===undefined?null:realpathSync(hqRepository);
 const plans=[...(core?[{kind:'core',repo:core,spec:GP_SOURCE_PACKETS.core},{kind:'savedProfile',repo:core,spec:GP_SOURCE_PACKETS.savedProfile}]:[]),...(hq?[{kind:'hq',repo:hq,spec:GP_SOURCE_PACKETS.hq}]:[]),...(includeHqPackaging?[{kind:'hqPackaging',repo:hq,spec:GP_SOURCE_PACKETS.hqPackaging}]:[])];
 const states=new Map([...new Set(plans.map(p=>p.repo))].map(repo=>[repo,gpSourcePreparationState(repo)]));
 const temporary=mkdtempSync(join(tmpdir(),'shift-gp-source-packets-'));
 try{
  // Complete all prerequisite and byte checks before importing any object.
  for(const plan of plans){
   const {spec,repo}=plan,bytes=readFileSync(join(bundleDirectory,spec.file));verifyGpSourceBundleBytes(bytes,spec);object(repo,spec.base,spec.baseTree);
   plan.file=join(temporary,spec.file);writeFileSync(plan.file,bytes,{flag:'wx',mode:0o600});
   git(repo,['bundle','verify',plan.file]);
   assert.equal(text(repo,['bundle','list-heads',plan.file]),spec.head+' HEAD','Exact advertised GP source required');
  }
  for(const {spec,repo,file}of plans){
   verifyGpSourceBundleBytes(readFileSync(file),spec);git(repo,['bundle','unbundle',file]);
   verifyGpSourceBundleBytes(readFileSync(file),spec);verifyGpSourceObjectPins(repo,spec);
  }
  return {preparationOnly:true,packets:plans.map(({kind,spec})=>({kind,...spec})),headChanged:false,refsChanged:false,indexChanged:false,productionChanged:false,flagsChanged:false};
 }finally{
  try{for(const[repo,before]of states)assertGpSourcePreparationState(before,gpSourcePreparationState(repo));}
  finally{rmSync(temporary,{recursive:true,force:true});}
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const options={};for(let i=2;i<process.argv.length;i++){const arg=process.argv[i];if(arg==='--core')options.coreRepository=process.argv[++i];else if(arg==='--hq')options.hqRepository=process.argv[++i];else if(arg==='--hq-packaging')options.includeHqPackaging=true;else throw Error('Unknown GP source preparation option: '+arg);}
 process.stdout.write(JSON.stringify(prepareGpSourceObjects(options))+'\n');
}
