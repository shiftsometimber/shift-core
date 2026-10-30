// Use Wrangler's content-addressing algorithm; keep completion tokens in memory.
import assert from 'node:assert/strict';
import {mkdirSync,readdirSync,readFileSync,statSync} from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {hash} from './release-helpers.mjs';
const require=createRequire(import.meta.url),blake3=require('blake3-wasm');
export const assetHash=(bytes,file)=>blake3.hash(bytes.toString('base64')+path.extname(file).slice(1)).toString('hex').slice(0,32);
const mime={'.js':'application/javascript','.mjs':'application/javascript','.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};
const code=/\.(?:js|mjs|css|svg|txt)$/;
export async function captureLiveAssetChecks(captures,fetcher=fetch){
 const checks=[];
 for(let i=0;i<captures.length;i+=8)await Promise.all(captures.slice(i,i+8).map(async pathname=>{
  const response=await fetcher('https://shiftsometimber.co.uk'+pathname,{redirect:'manual',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});
  const type=response.headers.get('content-type')||'';
  if(response.status!==200||type.includes('text/html'))return;
  const bytes=Buffer.from(await response.arrayBuffer());assert(bytes.length<=25*1024*1024);
  checks.push({path:pathname,sha256:hash(bytes),contentType:type});
 }));
 return checks;
}
export async function uploadPreservedAssets({cf,account,name,save}){
 const root='knowledge-health-evidence/current-assets';mkdirSync(root,{recursive:true});
 execFileSync('git',['fetch','--no-tags','origin','main'],{stdio:'inherit'});
 const assetSource=execFileSync('git',['rev-parse','FETCH_HEAD'],{encoding:'utf8'}).trim();
 const archive=execFileSync('git',['archive',assetSource,'frontend/member'],{maxBuffer:800*1024*1024});
 execFileSync('tar',['-x','--strip-components=2','-C',root],{input:archive});
 const files=readdirSync(root,{recursive:true}).filter(file=>statSync(path.join(root,file)).isFile());
 const captures=[...files.filter(file=>code.test(file)).map(file=>'/'+file),'/assets/my-timber-layout.mjs'];
 // The retained runtime transforms some raw assets when serving them. Capture
 // delivered bytes for verification; do not feed transformed bytes back into
 // the raw asset namespace and apply the same transformation a second time.
 const checks=await captureLiveAssetChecks(captures);
 const manifest={},byHash=new Map();
 for(const file of readdirSync(root,{recursive:true})){
  const absolute=path.join(root,file);if(!statSync(absolute).isFile())continue;
  const bytes=readFileSync(absolute),value=assetHash(bytes,file);
  manifest['/'+file.split(path.sep).join('/')]={hash:value,size:bytes.length};byHash.set(value,{file:absolute,bytes:bytes.length});
 }
 const session=await cf('/accounts/'+account+'/workers/scripts/'+name+'/assets-upload-session','POST',{manifest});
 assert(session.jwt);const buckets=session.buckets||[],missing=buckets.flat();
 // All photographs/move images already belong to the existing source asset
 // set. A new uncached binary is outside this text-content release.
 for(const value of missing){const file=byHash.get(value);assert(file,'Unknown requested asset');assert(code.test(file.file),'An uncached binary would expand this Knowledge release: '+file.file);}
 let completion=missing.length?null:session.jwt;
 for(const bucket of buckets){
  const form=new FormData();
  for(const value of bucket){const file=byHash.get(value);form.append(value,new File([readFileSync(file.file).toString('base64')],value,{type:mime[path.extname(file.file)]||'application/octet-stream'}),value);}
  const result=await cf('/accounts/'+account+'/workers/assets/upload?base64=true','POST',form,session.jwt);if(result.jwt)completion=result.jwt;
 }
 assert(completion,'Assets upload did not return a completion token');
 save('assets',{assetSource,fileCount:Object.keys(manifest).length,manifestSHA256:hash(JSON.stringify(manifest)),uploaded:missing.length,preservedLiveTextAssets:checks});
 console.log('KNOWLEDGE_ASSETS '+JSON.stringify({assetSource,files:Object.keys(manifest).length,uploaded:missing.length,preservedLiveTextAssets:checks.length}));
 return {jwt:completion,checks};
}
export async function verifyPreservedAssets(checks){
 for(let i=0;i<checks.length;i+=8)await Promise.all(checks.slice(i,i+8).map(async check=>{
  const response=await fetch('https://shiftsometimber.co.uk'+check.path,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,200,check.path);assert.equal(hash(Buffer.from(await response.arrayBuffer())),check.sha256,'Live asset changed '+check.path);
 }));
}
