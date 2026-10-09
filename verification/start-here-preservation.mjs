import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const dir='start-here-diagnostic';mkdirSync(dir,{recursive:true});const h=s=>createHash('sha256').update(s).digest('hex');
const path='/start-here-v72.js?v=direct-detail-20260912',rows=[];
for(const [name,root] of [['baseline','/tmp/start-here-baseline'],['candidate',process.cwd()]]){
 const text=readFileSync(root+'/wrangler.jsonc','utf8'),env=Object.fromEntries([...text.slice(text.indexOf('"vars"')).matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)].map(m=>[m[1],m[2]]));
 const worker=(await import(pathToFileURL(root+'/shift-coach/worker.mjs'))).default;
 const r=await worker.fetch(new Request('https://shiftsometimber.co.uk'+path),env,{waitUntil(){throw Error('unexpected background write')}});
 const body=await r.text();writeFileSync(dir+'/'+name+'.js',body);rows.push({name,status:r.status,sha256:h(body),bytes:Buffer.byteLength(body)});
}
for(const [name,url] of [['live','https://shiftsometimber.co.uk'+path],['upstream','https://projectshift.pages.dev'+path]]){
 const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(30000)}),body=await r.text();writeFileSync(dir+'/'+name+'.js',body);rows.push({name,status:r.status,sha256:h(body),bytes:Buffer.byteLength(body)});
}
console.log(JSON.stringify(rows));writeFileSync(dir+'/report.json',JSON.stringify(rows,null,2));
