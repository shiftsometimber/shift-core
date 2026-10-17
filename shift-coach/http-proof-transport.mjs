import {responseBodyMode} from './http-proof-runtime.mjs';
import {gzipSync,gunzipSync,brotliCompressSync,brotliDecompressSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const sha=body=>createHash('sha256').update(body).digest('hex');
export async function proofHTTPBody({response,transport='gzip',acceptEncoding='gzip'}){
 const bodyMode=responseBodyMode(response),raw=Buffer.from(await response.arrayBuffer()),headers=Object.fromEntries(response.headers);
 let decoded=raw,wire=raw,mode='identity';
 const encoding=(headers['content-encoding']||'').trim().toLowerCase();
 if(encoding&&!['gzip','br','identity'].includes(encoding))throw Error('Unexpected proof transport encoding: '+encoding);
 if(encoding==='gzip'||encoding==='br'){
  if(bodyMode==='automatic'){wire=encoding==='gzip'?gzipSync(raw):brotliCompressSync(raw);mode='worker-automatic-'+encoding}
  else{decoded=encoding==='gzip'?gunzipSync(raw):brotliDecompressSync(raw);mode='worker-manual-'+encoding}
 }else if(transport==='gzip'&&acceptEncoding.includes('gzip')&&/text\/|application\/(?:json|javascript)/.test(headers['content-type']||'')){
  wire=gzipSync(raw);headers['content-encoding']='gzip';mode='proof-gzip';
 }
 headers['content-length']=String(wire.length);
 return {body:wire,headers,evidence:{mode,workerBodyMode:bodyMode,decodedBytes:decoded.length,wireBytes:wire.length,decodedSha256:sha(decoded),wireSha256:sha(wire)}};
}
