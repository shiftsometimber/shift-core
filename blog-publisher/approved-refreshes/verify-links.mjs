import fs from 'node:fs';
import {REFRESHES,BACKLINKS} from './refreshes.mjs';
const urls=[...new Set([...REFRESHES.flatMap(p=>[...p.html.matchAll(/href="([^"]+)"/g)].map(x=>x[1]).concat(p.sources)),...Object.values(BACKLINKS).flat().map(x=>x[1])])];
const findings=[];
for(let i=0;i<urls.length;i+=4)await Promise.all(urls.slice(i,i+4).map(async path=>{
 const url=new URL(path,'https://shiftsometimber.co.uk');
 try{
  const r=await fetch(url,{signal:AbortSignal.timeout(30000)});const text=await r.text();
  findings.push({url:url.href,status:r.status,finalURL:r.url,HTML:text.includes('<'),pass:r.status===200});
 }catch(e){findings.push({url:url.href,error:e.message,pass:false})}
}));
const result={checkedAt:new Date().toISOString(),findings};
fs.writeFileSync('/Users/shiftsometimberltd/SST/blog-contributor-policy-20261021/reconciliation-20261021/refresh-20261022/links.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
