import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fetchPublicProof as fetch} from './public-proof-fetch.mjs';
import {compiledTreatmentAssets,TREATMENT_ASSETS,assertTreatmentAsset} from './my-treatment-compiled-control.mjs';
const origin='https://shiftsometimber.co.uk',checks=[];mkdirSync('b1-runtime-release',{recursive:true});
async function check(path,run){const r=await fetch(origin+path,{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(30000)});await run(r);checks.push({path,status:r.status,pass:true});}
let compiled;
try{
 compiled=await compiledTreatmentAssets();assert.equal(compiled.source,process.env.GITHUB_SHA,'Compiled control belongs to a different release');
 for(const {path}of TREATMENT_ASSETS)await check(path,async r=>{const proof=assertTreatmentAsset(path,{status:r.status,contentType:r.headers.get('content-type')||'',cacheControl:r.headers.get('cache-control')||'',body:await r.text()},compiled.assets[path]);writeFileSync('b1-runtime-release/treatment-'+path.split('/').at(-1)+'.proof.json',JSON.stringify(proof,null,2));});
 await check('/member/treatment',async r=>{assert.equal(r.status,200);const html=await r.text();assert.match(html,/My Treatment/i);assert.match(html,/treatment\.mjs/);assert(!html.includes('Isolated preview'));assert.match(r.headers.get('cache-control')||'',/no-store/);});
 await check('/member/saved',async r=>{assert.equal(r.status,200);assert.match(await r.text(),/href="\/member\/treatment"/);});
 for(const path of ['/v1/member/treatment','/v1/member/treatment/native-reminders','/v1/member/treatment/summary.pdf'])await check(path,async r=>{assert.equal(r.status,401);assert.match(r.headers.get('cache-control')||'',/no-store/);assert(!r.headers.get('content-type')?.includes('application/pdf'));});
}catch(error){checks.push({pass:false,error:error.message});process.exitCode=1;}
mkdirSync('b1-runtime-release',{recursive:true});writeFileSync('b1-runtime-release/my-treatment-live.json',JSON.stringify({release:process.env.GITHUB_SHA,at:new Date().toISOString(),pass:checks.length===8&&checks.every(x=>x.pass),scope:'Exact compiled Worker live delivery and unauthenticated protection; signed-in and physical-device acceptance tracked separately',compiledControl:compiled?{source:compiled.source,bundleSha256:compiled.bundleSha256,productionResources:compiled.productionResources}:null,checks},null,2));console.log(JSON.stringify(checks));

