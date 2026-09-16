import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {publicPageEvidence,assertPublicPagesPreserved} from '../medicines-watch/preservation.mjs';
const [output,before]=process.argv.slice(2);
if(!output)throw Error('An evidence output path is required');
const paths=['/','/start-here','/programme','/shift-health','/treatment-centre','/about','/explore-knowledge','/shop','/work-with-us','/member-login','/turnstile-auth-v1.js?v=timeout-20260912'];
const pages=[];
const hash=body=>createHash('sha256').update(body).digest('hex');
for(const path of paths){
 const r=await fetch('https://shiftsometimber.co.uk'+path,{signal:AbortSignal.timeout(30000)});
 assert.equal(r.status,200,path+' must return HTTP 200');
 const body=Buffer.from(await r.arrayBuffer());
 pages.push(publicPageEvidence(path,r.status,body,{requireTreatmentsEntry:Boolean(before),hash}));
}
let comparison='baseline';
try{if(before)comparison=assertPublicPagesPreserved(pages,JSON.parse(readFileSync(before)).pages);}
catch(error){writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),pages,comparison:'failed',error:error.message},null,2));throw error;}
writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),pages,comparison},null,2));
console.log(before?(comparison==='identical'?'PASS: all 11 public/login responses are byte-identical after promotion.':'PASS: all 11 public/login responses are preserved; only the exact approved Treatments entry was added.'):'Captured all 11 current public/login response hashes.');
