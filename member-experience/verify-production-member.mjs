import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {healthRuntime} from './health-runtime.mjs';
import {fitRuntime} from './fit-approved-runtime.mjs';
import {grubRuntime} from './grub-runtime.mjs';
import {grubImages} from './grub-image-map.mjs';
const origin='https://shiftsometimber.co.uk';
const evidence={checkedAt:new Date().toISOString(),assets:[],auth:[]};
for(const [name,expected] of [['health',healthRuntime],['fit',fitRuntime],['grub',grubRuntime]]){
 const path='/assets/member-experience/'+name+'.mjs';
 const r=await fetch(origin+path,{signal:AbortSignal.timeout(30000)});
 assert.equal(r.status,200,path);
 assert.match(r.headers.get('content-type')||'',/javascript/);
 const actual=await r.text();
 assert.equal(actual,expected,path+' must match the deployed source exactly');
 evidence.assets.push({path,status:r.status,sha256:createHash('sha256').update(actual).digest('hex'),matchesSource:true});
}
for(const asset of grubImages){
 const r=await fetch(origin+asset.src,{signal:AbortSignal.timeout(30000)});
 assert.equal(r.status,200,asset.src);
 assert.match(r.headers.get('content-type')||'',/image\/webp/);
 const sha256=createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex');
 assert.equal(sha256,asset.sha256,asset.src+' must match the approved image');
 evidence.assets.push({path:asset.src,status:r.status,sha256,matchesSource:true});
}
for(const path of ['/v1/check-ins','/v1/fit/activity','/v1/grub/workspace']){
 const r=await fetch(origin+path,{signal:AbortSignal.timeout(30000),redirect:'manual'});
 assert.equal(r.status,401,path+' must reject an unauthenticated request');
 evidence.auth.push({path,status:r.status});
}
writeFileSync('member-live-proof.json',JSON.stringify(evidence,null,2));
console.log('PASS: live health, Fit and Grub scripts exactly match release source; new account routes reject unauthenticated requests.');
