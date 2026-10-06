import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const baseline=(await import(pathToFileURL(process.env.BASELINE_WORKER || '/private/tmp/sst-seo-batch2-20261006/shift-coach/worker.mjs'))).default;
import candidate from '../shift-coach/worker.mjs';
import {BENEFIT_PATHS,catalogueBenefitsHtml,removeCatalogueBenefits} from '../catalogue-benefits.mjs';
const nativeFetch=globalThis.fetch,cache=new Map();
globalThis.fetch=async(input,init)=>{const req=new Request(input,init),key=req.method+' '+req.url;if(!cache.has(key))cache.set(key,nativeFetch(req));return(await cache.get(key)).clone();};
const ctx={waitUntil(){}},results=[];
fs.mkdirSync('work/catalogue-proof',{recursive:true});
for(const path of ['/',...BENEFIT_PATHS,'/start-here','/mounjaro','/wegovy','/articles/nhs-weight-loss-drugs','/member-fit-programme-v1.js','/member-grub-programme-v1.js','/member-my-timber-problem-v1.js','/member/dashboard','/member/grub','/member/fit']){
const req=new Request('https://shiftsometimber.co.uk'+path),a=await baseline.fetch(req,{},ctx),b=await candidate.fetch(req,{},ctx);
assert.equal(b.status,a.status,path);const before=await a.text(),after=await b.text();
assert.equal(after,a.status===200&&a.headers.get('content-type')?.includes('text/html')?catalogueBenefitsHtml(before,path):before,path);
assert.equal(removeCatalogueBenefits(after,path),before,path);
fs.writeFileSync('work/catalogue-proof/'+path.replaceAll('/','_')+'.html',after);
results.push({path,status:b.status,changed:after!==before,exactTransform:true});
}
fs.writeFileSync('work/catalogue-proof/full-handler.json',JSON.stringify(results,null,2));
console.log(JSON.stringify({pass:true,checked:results.length,changed:results.filter(x=>x.changed).map(x=>x.path)}));
