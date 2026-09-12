import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const [output,before]=process.argv.slice(2);
if(!output)throw Error('An evidence output path is required');
const paths=['/','/start-here','/programme','/shift-health','/treatment-centre','/about','/explore-knowledge','/shop','/work-with-us','/member-login','/turnstile-auth-v1.js?v=timeout-20260912'];
const pages=[];
for(const path of paths){
 const r=await fetch('https://shiftsometimber.co.uk'+path,{signal:AbortSignal.timeout(30000)});
 assert.equal(r.status,200,path+' must return HTTP 200');
 const body=Buffer.from(await r.arrayBuffer());
 pages.push({path,status:r.status,sha256:createHash('sha256').update(body).digest('hex'),bytes:body.length});
}
if(before){const baseline=JSON.parse(readFileSync(before));assert.deepEqual(pages,baseline.pages,'Public pages or the login asset changed during this member-only release');}
writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),pages,comparison:before?'identical':'baseline'},null,2));
console.log(before?'PASS: all 11 public/login responses are byte-identical after promotion.':'Captured all 11 current public/login response hashes.');
