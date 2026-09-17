// Read-only capture for factual review. Successful retrieval never approves a baseline.
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sources} from '../medicines-watch/data.mjs';
import {fingerprintSource} from '../medicines-watch/monitor.mjs';

const directory=process.argv[2]||'watch-source-capture';
mkdirSync(directory,{recursive:true});
const targets=[
  {...sources.find(s=>s.id==='mounjaro-nhs'),url:'https://www.nhs.uk/medicines/tirzepatide/',checkUrl:'https://www.nhs.uk/medicines/tirzepatide/',requiredTerms:['tirzepatide','prescription','specialist weight management']},
  sources.find(s=>s.id==='wegovy-tablet-private')
];
for(const source of targets){
  const record={id:source.id,url:source.url,retrievedAt:new Date().toISOString(),approved:false};
  try{
    const response=await fetch(source.checkUrl,{redirect:'manual',signal:AbortSignal.timeout(8000),headers:{Accept:'text/html','User-Agent':'ShiftMedicinesWatch/1.0 (source availability and change checks)'}});
    record.httpStatus=response.status;
    if(response.status!==200)throw Error('http_'+response.status);
    const body=await response.text();
    if(Buffer.byteLength(body)>2*1024*1024)throw Error('response_too_large');
    record.bytes=Buffer.byteLength(body);
    record.responseSha256=createHash('sha256').update(body).digest('hex');
    Object.assign(record,await fingerprintSource(source,body,response.headers.get('content-type')));
    writeFileSync(`${directory}/${source.id}.html`,body);
    const main=body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||body;
    const text=main.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    record.title=body.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    record.reviewExtracts=[...text.matchAll(/.{0,80}(?:only available with a prescription|criteria depend|Where can I buy the Wegovy pill|Can I get the Wegovy pill on the NHS|Are Wegovy pills available in the UK right now).{0,500}/gi)].map(m=>m[0]);
  }catch(error){record.error=error.message;process.exitCode=1;}
  writeFileSync(`${directory}/${source.id}.json`,JSON.stringify(record,null,2)+'\n');
  console.log(JSON.stringify(record,null,2));
}
