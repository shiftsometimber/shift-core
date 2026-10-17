import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,readdirSync,readFileSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createGithubProofGet,createGithubProofReader} from '../release/github-proof-get.mjs';
const socket=()=>Object.assign(new TypeError('body socket closed'),{cause:{code:'UND_ERR_SOCKET'}});
const body=Buffer.from('accepted exact immutable archive');
const pin=Object.freeze({id:123,run:456,source:'a'.repeat(40),bytes:body.length,sha256:createHash('sha256').update(body).digest('hex')});
const metadata=()=>({id:pin.id,size_in_bytes:pin.bytes,expired:false,digest:'sha256:'+pin.sha256,workflow_run:{id:pin.run,head_sha:pin.source}});
const fixture=()=>{let jsonCalls=0,zipCalls=0;let change=()=>{};const fetcher=async url=>{
 if(url.endsWith('/zip')){zipCalls++;return{ok:true,arrayBuffer:async()=>body};}
 jsonCalls++;const value=metadata();change(value);return{ok:true,json:async()=>value};
 };return{fetcher,counts:()=>({jsonCalls,zipCalls}),change:fn=>{change=fn;}};};
test('a socket closed during JSON/log/archive body reading retries the complete same request',async()=>{
 for(const format of ['json','logs','archive']){
  let calls=0;const waits=[],fetcher=async url=>{
   if(url.endsWith('/artifacts/123'))return{ok:true,json:async()=>metadata()};
   calls++;const consume=async()=>{if(calls<3)throw socket();return format==='json'?{actual:'failure'}:format==='logs'?'actual failing log':body;};
   return{ok:true,json:consume,text:consume,arrayBuffer:consume};
  };
  const options={fetcher,wait:async ms=>waits.push(ms),token:'synthetic'};
  const actual=format==='json'?await createGithubProofGet(options)('/actions/runs/456'):format==='logs'?await createGithubProofReader(options).logs(789):await createGithubProofReader(options).artifact(pin);
  assert.deepEqual(actual,format==='json'?{actual:'failure'}:format==='logs'?'actual failing log':body);
  assert.equal(calls,3);assert.deepEqual(waits,[1000,2000]);
 }
});
test('duplicate concurrent reads coalesce across factories, return isolated evidence and refresh mutable paths afterwards',async()=>{
 let calls=0,release;const hold=new Promise(resolve=>{release=resolve;});
 const fetcher=async()=>{calls++;await hold;return{ok:true,json:async()=>({id:456,conclusion:calls===1?'success':'failure',steps:[]})};};
 const a=createGithubProofGet({fetcher,token:'same'}),b=createGithubProofGet({fetcher,token:'same'});
 const one=a('/actions/runs/456'),two=b('/actions/runs/456');assert.equal(calls,1);release();
 const [first,second]=await Promise.all([one,two]);assert.notEqual(first,second);first.steps.push('tampered');assert.deepEqual(second.steps,[]);
 assert.equal((await b('/actions/runs/456')).conclusion,'failure');assert.equal(calls,2);
});
test('different credentials and response formats never share an authenticated request',async()=>{
 let calls=0;const fetcher=async()=>{calls++;return{ok:true,json:async()=>({id:1}),text:async()=>'log'};};
 await Promise.all([createGithubProofGet({fetcher,token:'one'})('/actions/jobs/1/logs'),createGithubProofGet({fetcher,token:'two'})('/actions/jobs/1/logs'),createGithubProofReader({fetcher,token:'one'}).logs(1)]);
 assert.equal(calls,3);
});
test('failed reads are not retained for another attempt or caller',async()=>{
 let calls=0;const fetcher=async()=>{calls++;return calls===1?{ok:false,status:404}:{ok:true,json:async()=>({id:1})};};
 const get=createGithubProofGet({fetcher});await assert.rejects(()=>get('/actions/runs/1'));assert.deepEqual(await get('/actions/runs/1'),{id:1});assert.equal(calls,2);
});
test('only accepted digest-pinned bytes reuse disk; metadata, source and expiry are checked freshly on every read',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'github-proof-cache-test-')),f=fixture();
 try{
  const reader=createGithubProofReader({fetcher:f.fetcher,cacheDirectory:dir});
  const first=await reader.artifact(pin);first[0]=0;
  assert.deepEqual(await reader.artifact(pin),body);assert.deepEqual(f.counts(),{jsonCalls:2,zipCalls:1});
  for(const mutate of [m=>{m.expired=true;},m=>{m.workflow_run.head_sha='b'.repeat(40);},m=>{m.workflow_run.id++;},m=>{m.id++;},m=>{m.size_in_bytes++;},m=>{m.digest='sha256:'+'b'.repeat(64);}]){
   f.change(mutate);await assert.rejects(()=>reader.artifact(pin));
  }
  assert.equal(f.counts().zipCalls,1);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('changed cache bytes, missing pins, malformed pins and unknown metadata all reject without accepting fallback evidence',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'github-proof-corruption-test-')),f=fixture();
 try{
  const reader=createGithubProofReader({fetcher:f.fetcher,cacheDirectory:dir});await reader.artifact(pin);
  const file=join(dir,readdirSync(dir)[0]),bytes=readFileSync(file);bytes[0]^=1;writeFileSync(file,bytes);
  await assert.rejects(()=>reader.artifact(pin),/hash/);assert.equal(f.counts().zipCalls,1);
  for(const invalid of [undefined,{}, {...pin,id:0},{...pin,run:0},{...pin,source:'unknown'},{...pin,sha256:'unknown'},{...pin,bytes:0}])await assert.rejects(()=>reader.artifact(invalid));
  f.change(m=>{m.workflow_run=undefined;});await assert.rejects(()=>reader.artifact(pin));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('cache symlinks reject and complete digest-matched bytes are required before any write',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'github-proof-symlink-test-')),f=fixture();
 try{
  const reader=createGithubProofReader({fetcher:f.fetcher,cacheDirectory:dir});await reader.artifact(pin);
  const file=join(dir,readdirSync(dir)[0]),other=join(dir,'other');writeFileSync(other,body);rmSync(file);symlinkSync(other,file);
  await assert.rejects(()=>reader.artifact(pin),/regular file/);
  const link=dir+'-link';symlinkSync(dir,link);try{await assert.rejects(()=>createGithubProofReader({fetcher:f.fetcher,cacheDirectory:link}).artifact(pin),/real directory/);}finally{rmSync(link);}
  const empty=join(dir,'new');await assert.rejects(()=>createGithubProofReader({cacheDirectory:empty,fetcher:async url=>url.endsWith('/zip')?{ok:true,arrayBuffer:async()=>Buffer.alloc(pin.bytes)}:{ok:true,json:async()=>metadata()}}).artifact(pin),/hash/);
  assert.throws(()=>readdirSync(empty),{code:'ENOENT'});
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('cryptographic log verification retains original UTF-8 BOM bytes instead of text decoding them away',async()=>{
 const bytes=Buffer.concat([Buffer.from([0xef,0xbb,0xbf]),Buffer.from('original owned rollback proof\n')]);
 const reader=createGithubProofReader({fetcher:async()=>new Response(bytes)});
 assert.equal((await reader.logs(123)).length,bytes.length-3);
 const original=await reader.logBytes(123);assert.deepEqual(original,bytes);assert.equal(original.length,bytes.length);
});
