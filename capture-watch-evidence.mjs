import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {industrySources} from './medicines-watch/industry.mjs';
import {fingerprintSource} from './medicines-watch/monitor.mjs';
mkdirSync('watch-evidence',{recursive:true});
const result=[];
for(const s of industrySources){
 const row={id:s.id,url:s.checkUrl,attemptedAt:new Date().toISOString()};
 try{
  const r=await fetch(s.checkUrl,{signal:AbortSignal.timeout(20000),headers:{Accept:'text/html'}});
  row.status=r.status;row.finalUrl=r.url;row.contentType=r.headers.get('content-type');
  if(r.ok){const bytes=new Uint8Array(await r.arrayBuffer());if(bytes.length>2097152)throw Error('response_too_large');row.bytes=bytes.length;row.sha256=createHash('sha256').update(bytes).digest('hex');writeFileSync('watch-evidence/'+s.id+'.html',bytes);row.fingerprint=await fingerprintSource(s,new TextDecoder().decode(bytes));}
 }catch(e){row.error=e.message;}
 result.push(row);
}
writeFileSync('watch-evidence/retrievals.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result.map(({id,status,error})=>({id,status,error}))));
