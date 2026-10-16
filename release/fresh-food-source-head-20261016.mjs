import {execFileSync} from 'node:child_process';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';

// Instrumented or substituted builtins must use the original native guard.
const trustedBuiltins=Object.freeze([execFileSync,readFileSync,lstatSync,realpathSync,createHash,process.cwd]);

// A positive hint is limited to an ordinary, detached, files-format checkout.
// It reuses only the bytes of an index already checked by native ls-files.
// Every invocation reads the index, HEAD and configuration again and runs a
// fresh native status. Any ambiguity falls back to the original source guard.
export function makeFreshCleanHeadHint(){
 let prior=null;
 const env=()=>JSON.stringify(Object.keys(process.env).sort().map(k=>[k,process.env[k]]));
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024,stdio:'pipe'});
 function file(path){
  const s=lstatSync(path,{throwIfNoEntry:false});if(!s)return null;
  if(!s.isFile()||s.isSymbolicLink()||s.size>32*1024*1024)throw Error('unsupported file');
  const b=readFileSync(path);return [realpathSync(path),s.dev,s.ino,s.mode,createHash('sha256').update(b).digest('hex')];
 }
 function root(){
  const cwd=process.cwd(),p=resolve(cwd,'.git'),s=lstatSync(p,{throwIfNoEntry:false});
  if(!s?.isDirectory()||s.isSymbolicLink()||realpathSync(cwd)!==cwd||realpathSync(p)!==p)throw Error('ordinary root required');
  for(const n of ['commondir','gitdir','info/grafts','refs/replace'])if(lstatSync(resolve(p,n),{throwIfNoEntry:false}))throw Error('unsupported history layout');
  return [cwd,p,s.dev,s.ino,s.mode];
 }
 function signature(paths){return JSON.stringify([root(),paths.map(p=>[p,file(p)]),env()]);}
 function status(){
  const b=execFileSync('git',['--no-optional-locks','status','--porcelain=v2','-z','--branch','--untracked-files=no','--ignore-submodules=none'],{maxBuffer:32*1024*1024,stdio:'pipe'});
  const m=/^# branch\.oid ([a-f0-9]{40})\0# branch\.head \(detached\)\0$/.exec(b.toString('utf8'));
  return m&&!/^0+$/.test(m[1])&&b.equals(Buffer.from(m[0]))?m[1]:null;
 }
 return function freshCleanHeadHint(){
  try{
   if([execFileSync,readFileSync,lstatSync,realpathSync,createHash,process.cwd].some((fn,i)=>fn!==trustedBuiltins[i]))return null;
   // Defined selectors, even empty ones, are deliberately unsupported.
   if(Object.keys(process.env).some(k=>/^GIT_/.test(k)&&k!=='GIT_PAGER'))return null;
   if(prior){
    const before=signature(prior.paths);if(before!==prior.signature){prior=null;return null;}
    const head=status();return head===prior.head&&signature(prior.paths)===before?head:null;
   }
   const [cwd,dir]=root();
   if(git('rev-parse','--show-toplevel').trim()!==cwd||git('rev-parse','--show-ref-format').trim()!=='files'||git('rev-parse','--shared-index-path').trim())return null;
   const paths=new Set(['index','HEAD','config','config.worktree','packed-refs','shallow','info/grafts'].map(p=>resolve(dir,p)));
   for(const key of ['GIT_CONFIG_SYSTEM','GIT_CONFIG_GLOBAL'])for(const p of git('var',key).trimEnd().split('\n')){if(!p)continue;if(!isAbsolute(p))return null;paths.add(p);}
   const fields=git('config','--null','--show-origin','--includes','--list').split('\0');if(fields.pop()!=='')return null;if(fields.length%2)return null;
   for(let i=0;i<fields.length;i+=2){
    const origin=fields[i],entry=fields[i+1],at=entry.indexOf('\n'),key=(at<0?entry:entry.slice(0,at)).toLowerCase();
    // Includes/command configuration cannot introduce an unobserved source.
    if(!origin.startsWith('file:')||/^include(?:if\..*)?\.path$/.test(key))return null;
    const p=origin.slice(5);if(!p||p.includes('\n'))return null;paths.add(resolve(cwd,p));
   }
   const list=[...paths].sort(),before=signature(list),head=status();if(!head)return null;
   if(readFileSync(resolve(dir,'HEAD'),'utf8')!==head+'\n')return null;
   const flags=execFileSync('git',['ls-files','-v','-z'],{maxBuffer:32*1024*1024,stdio:'pipe'});
   let start=0;while(start<flags.length){const end=flags.indexOf(0,start);if(end<=start)return null;const flag=flags[start];if(flag===83||flag>=97&&flag<=122)return null;start=end+1;}
   if(git('for-each-ref','--format=%(refname)','refs/replace').trim())return null;
   if(git('rev-parse','HEAD').trim()!==head||signature(list)!==before)return null;
   prior={paths:list,signature:before,head};return head;
  }catch{prior=null;return null;}
 };
}

// This returns only the actual raw detached HEAD bytes. It gives no source,
// cleanliness, ancestry or approval credit. Every call reads the file again.
// Unsupported layouts and substituted builtins take the original Git path.
export function freshDetachedSourceHead(){
 try{
  if([execFileSync,readFileSync,lstatSync,realpathSync,createHash,process.cwd].some((fn,i)=>fn!==trustedBuiltins[i]))return null;
  if(Object.keys(process.env).some(k=>/^GIT_/.test(k)&&k!=='GIT_PAGER'))return null;
  const cwd=process.cwd(),dir=resolve(cwd,'.git');
  if(realpathSync(cwd)!==cwd||realpathSync(dir)!==dir)return null;
  const directory=lstatSync(dir);if(!directory.isDirectory()||directory.isSymbolicLink())return null;
  for(const name of ['commondir','gitdir','info/grafts','refs/replace'])if(lstatSync(resolve(dir,name),{throwIfNoEntry:false}))return null;
  const path=resolve(dir,'HEAD'),before=lstatSync(path,{bigint:true});
  if(!before.isFile()||before.isSymbolicLink()||before.size!==41n)return null;
  const bytes=readFileSync(path),after=lstatSync(path,{bigint:true});
  for(const key of ['dev','ino','mode','size','mtimeNs','ctimeNs'])if(before[key]!==after[key])return null;
  const value=bytes.toString('ascii');
  if(!/^[a-f0-9]{40}\n$/.test(value)||!bytes.equals(Buffer.from(value))||/^0{40}\n$/.test(value))return null;
  return value.slice(0,-1);
 }catch{return null;}
}
