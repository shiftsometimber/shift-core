import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {lstatSync,mkdirSync,readFileSync,renameSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
const repo='https://api.github.com/repos/shiftsometimber/shift-core';
const transient=new Set(['UND_ERR_SOCKET','ECONNRESET','EPIPE','ETIMEDOUT','UND_ERR_CONNECT_TIMEOUT']);
const flights=new WeakMap();
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
function proofUrl(path){
 assert.equal(typeof path,'string');
 assert(path.startsWith('/')&&!path.startsWith('//')&&!path.includes('\\'),'Repository-relative GitHub proof path required');
 const url=new URL(repo+path);assert(url.href.startsWith(repo+'/'),'Exact GitHub repository required');return url.href;
}
function sameRead(fetcher,token,key,read){
 let scopes=flights.get(fetcher);if(!scopes){scopes=new Map();flights.set(fetcher,scopes);}
 let scope=scopes.get(token);if(!scope){scope=new Map();scopes.set(token,scope);}
 if(!scope.has(key)){
  const pending=read();scope.set(key,pending);
  // Reuse only an active authenticated request. Mutable runs, refs, jobs and
  // check-runs are always read again after completion; failures never persist.
  pending.finally(()=>{if(scope.get(key)===pending)scope.delete(key);if(!scope.size)scopes.delete(token);}).catch(()=>{});
 }
 return scope.get(key);
}
function createRead({fetcher=fetch,token=process.env.GITHUB_TOKEN,wait=delay}={}){
 return async function read(path,format){
  const url=proofUrl(path);
  const value=await sameRead(fetcher,token,format+' '+url,async()=>{
   for(let attempt=0;attempt<3;attempt++){
    try{
     const r=await fetcher(url,{method:'GET',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
     assert(r.ok,'GitHub verification '+r.status);
     // Consume the complete body within the same bounded transport retry. A
     // socket can close after headers; partial bodies must never become proof.
     return format==='json'?await r.json():format==='text'?await r.text():Buffer.from(await r.arrayBuffer());
    }catch(error){
     if(attempt===2||!transient.has(error?.cause?.code??error?.code))throw error;
     await wait(1000*(attempt+1));
    }
   }
  });
  // No caller can alter evidence concurrently consumed by another assertion.
  return format==='bytes'?Buffer.from(value):format==='json'?structuredClone(value):value;
 };
}
// Existing approval callers retain the same JSON GET interface and all their
// original exact-source, workflow, attempt, status and approval assertions.
export function createGithubProofGet(options={}){const read=createRead(options);return path=>read(path,'json');}

function verifyBytes(bytes,pin){
 assert.equal(bytes.length,pin.bytes,'Exact GitHub proof archive size required');
 assert.equal(sha256(bytes),pin.sha256,'Exact GitHub proof archive hash required');return bytes;
}
function readPinnedCache(directory,key,pin){
 let parent;try{parent=lstatSync(directory);}catch(error){if(error.code==='ENOENT')return null;throw error;}
 assert(parent.isDirectory()&&!parent.isSymbolicLink(),'GitHub proof cache must be a real directory');
 const path=join(directory,key+'.zip');let stat;
 try{stat=lstatSync(path);}catch(error){if(error.code==='ENOENT')return null;throw error;}
 assert(stat.isFile()&&!stat.isSymbolicLink(),'GitHub proof cache must be a regular file');
 return verifyBytes(readFileSync(path),pin);
}
function writePinnedCache(directory,key,bytes){
 mkdirSync(directory,{recursive:true,mode:0o700});
 const stat=lstatSync(directory);assert(stat.isDirectory()&&!stat.isSymbolicLink(),'GitHub proof cache must be a real directory');
 const path=join(directory,key+'.zip'),temporary=path+'.'+process.pid+'.'+randomUUID()+'.tmp';
 try{writeFileSync(temporary,bytes,{mode:0o600,flag:'wx'});renameSync(temporary,path);}finally{rmSync(temporary,{force:true});}
}
// Disk reuse is opt-in, byte-addressed and available only for archives whose
// digest/size/run/source came from the accepted source, never an on-disk receipt.
// Fresh provider metadata is required on every read, including a cache hit.
export function createGithubProofReader({cacheDirectory,...options}={}){
 const read=createRead(options),get=path=>read(path,'json');
 return Object.freeze({get,logs:id=>{assert(Number.isSafeInteger(id)&&id>0);return read('/actions/jobs/'+id+'/logs','text');},logBytes:id=>{assert(Number.isSafeInteger(id)&&id>0);return read('/actions/jobs/'+id+'/logs','bytes');},
  async artifact(pin){
   assert(Number.isSafeInteger(pin?.id)&&pin.id>0);assert(Number.isSafeInteger(pin.run)&&pin.run>0);
   assert.match(pin.source,/^[a-f0-9]{40}$/);assert(Number.isSafeInteger(pin.bytes)&&pin.bytes>0);assert.match(pin.sha256,/^[a-f0-9]{64}$/);
   const path='/actions/artifacts/'+pin.id+'/zip',url=proofUrl(path);
   const metadata=await get('/actions/artifacts/'+pin.id);
   assert.equal(metadata.id,pin.id);assert.equal(metadata.size_in_bytes,pin.bytes);assert.equal(metadata.expired,false);
   assert.equal(metadata.workflow_run?.id,pin.run);assert.equal(metadata.workflow_run?.head_sha,pin.source);
   if(metadata.digest!==undefined&&metadata.digest!==null)assert.equal(metadata.digest,'sha256:'+pin.sha256);
   const key=sha256(url+'\0'+pin.sha256);
   if(cacheDirectory){const cached=readPinnedCache(cacheDirectory,key,pin);if(cached)return Buffer.from(cached);}
   const bytes=verifyBytes(await read(path,'bytes'),pin);
   if(cacheDirectory)writePinnedCache(cacheDirectory,key,bytes);
   return Buffer.from(bytes);
  }
 });
}
