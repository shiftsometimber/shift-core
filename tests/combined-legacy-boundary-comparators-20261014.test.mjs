import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {combinedLegacyValidationRead} from '../release/combined-finite-scope-20261014.mjs';
import {verifyMyTimberWeekCloseout} from '../release/my-timber-week-closeout-scope.mjs';
import {verifyMyTimberWeekSource} from '../release/my-timber-week-scope.mjs';
import {verifyRootShareCompletionSource} from '../release/root-share-completion-scope.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim(), content=(r,p)=>execFileSync('git',['show',r+':'+p],{encoding:'utf8'}),manifest='release/approved-runtime-composition.json';
const cases=[
 ['closeout','5eba55df9065887562e94eb2ff35cb88bffc941b','myTimberWeekCloseout20261014',verifyMyTimberWeekCloseout,['frontend','public','member-experience','shift-coach/worker.mjs','wrangler.jsonc','wrangler.coaching.jsonc','package.json','package-lock.json','.github/workflows/cloudflare-production-promote.yml','release/photo-cancelled-stock-completion-20261014.mjs']],
 ['week','d8e18770f2cae616a5082d63af13f34dee1fa68e','myTimberWeekCode',verifyMyTimberWeekSource,['wrangler.jsonc','wrangler.coaching.jsonc','package.json','package-lock.json','.github/workflows/cloudflare-production-promote.yml','member-experience/treatment-patterns.mjs','member-experience/staging/verify-treatment-detail.mjs','share-preview/metadata.mjs','share-preview/asset.mjs','shift-coach/worker.mjs']],
 ['completion','77a1f511ee93243351b4b885fb604f33ac623d4d','rootShareCompletionRepair',verifyRootShareCompletionSource,['share-preview/metadata.mjs','share-preview/stream.mjs','share-preview/asset.mjs','share-preview/shift-share-20261013.jpg','share-preview/shift-share-20261013.svg','shift-coach/worker.mjs','frontend/member/member-progress-v1.js','shift-visualise-v1.js','.github/workflows/cloudflare-production-promote.yml','medicines-watch/preservation.mjs']]
];
for(const[name,head,key,verify,protectedPaths]of cases){
 const c=JSON.parse(content(head,manifest))[key],blob=(r,p)=>git('rev-parse',(r==='HEAD'?head:r)+':'+p),e={head,read:blob,blob,content:(r,p)=>content(r==='HEAD'?head:r,p),diff:(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>git('merge-base','--is-ancestor',a,b)};
 const altered=p=>(r,q)=>r==='HEAD'&&q===p?'tampered-supplied-comparison':blob(r,q),adapt=read=>combinedLegacyValidationRead(read,blob,{defaultReader:false,ownPaths:c.paths,maintenancePaths:c.maintenancePaths,protectedPaths});
 test(name+' direct original exported verifier rejects protected callback drift',()=>{assert.equal(verify(c,e),c);assert.throws(()=>verify(c,{...e,read:altered('shift-coach/worker.mjs')}),/drift|boundary/);});
 test(name+' validation-only call leaves supplied worker override for its original comparator',()=>{const original=altered('shift-coach/worker.mjs');assert.equal(verify(c,{...e,read:adapt(original)}),c);assert.equal(original('HEAD','shift-coach/worker.mjs'),'tampered-supplied-comparison');});
 test(name+' own payload and maintenance remain custom fresh',()=>{for(const p of[c.paths[0],c.maintenancePaths[0]])assert.throws(()=>verify(c,{...e,read:adapt(altered(p))}),/drift|boundary/);});
 if(name==='closeout')test('all three original fresh directory comparisons remain effective',()=>{for(const p of ['frontend','public','member-experience'])assert.throws(()=>verify(c,{...e,read:adapt(altered(p))}),/fresh reader/);});
}
test('adapter preserves default identity, own priority and unknown supplied comparison',()=>{
 const raw=(r,p)=>r+':custom:'+p,blob=(r,p)=>r+':real:'+p;
 assert.equal(combinedLegacyValidationRead(raw,blob,{defaultReader:true}),raw);
 const projected=combinedLegacyValidationRead(raw,blob,{defaultReader:false,ownPaths:['owned'],protectedPaths:['owned','worker','frontend','public','member-experience']});
 assert.equal(projected('HEAD','owned'),'HEAD:custom:owned');assert.equal(projected('HEAD','worker'),'HEAD:real:worker');assert.equal(projected('HEAD','unknown'),'HEAD:custom:unknown');
 for(const p of ['frontend','public','member-experience'])assert.equal(projected('HEAD',p),'HEAD:custom:'+p);
});
