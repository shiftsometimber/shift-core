import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tabletRuntime,tabletRuntimeIdentity,tabletRuntimeBody,validateTabletRuntimeComposition} from '../release/tablet-runtime-scope.mjs';
const receipt=JSON.parse(readFileSync('docs/tablet-guidance-runtime-receipt-20261006.json'));
const p=tabletRuntime;
const fixtures=()=>[
 {id:p.deployment,versions:[{version_id:p.version,percentage:100}]},
 {id:p.version,metadata:{created_on:receipt.createdOn,source:'wrangler'},annotations:{'workers/triggered_by':'version_upload','workers/message':'Tablet guidance source '+p.source+'; hosted proof '+p.run}},
 {id:p.run,head_sha:p.proofSource,status:'completed',conclusion:'success',head_branch:'codex/tablet-guidance-20261006',event:'push',path:'.github/workflows/practical-guides-proof.yml'},
 {id:p.job,run_id:p.run,name:'verify',status:'completed',conclusion:'success'},
 {id:p.artifact,digest:p.digest,expired:false,workflow_run:{id:p.run,head_sha:p.proofSource}},structuredClone(receipt)
];
test('retain only the exact isolated runtime backed by its successful hosted candidate and artifact',()=>{
 assert.equal(tabletRuntimeIdentity(...fixtures()),true);
 for(const mutate of [
  a=>a[0].id='unknown',a=>a[0].versions[0].version_id='unknown',a=>a[0].versions[0].percentage=99,a=>a[0].versions.push({version_id:'unknown',percentage:1}),
  a=>a[1].annotations['workers/message']='unverified',a=>a[1].metadata.created_on='different',
  a=>a[2].conclusion='failure',a=>a[2].head_sha='f'.repeat(40),a=>a[2].head_branch='main',a=>a[2].path='.github/workflows/unknown.yml',
  a=>a[3].conclusion='failure',a=>a[3].id=1,a=>a[4].digest='changed',a=>a[4].expired=true,
  a=>a[5].responses[0].sha256='changed',a=>a[5].responses.pop(),a=>a[5].source='f'.repeat(40)
 ]){const a=fixtures();mutate(a);assert.throws(()=>tabletRuntimeIdentity(...a));}
});
test('normalise only the exact practical style position and keep every other body byte',()=>{
 const style='<style data-practical-guide-style>.approved{color:black}</style>',hash=s=>createHash('sha256').update(s).digest('hex');
 const row={path:'/foundayo',protected:false,normalization:{kind:'exact_practical_style_order_v1',styleSha256:hash(style)}};
 const original='<html><head>'+style+'<meta name="test"></head><body>Original</body></html>';
 const canonical='<html><head><meta name="test">'+style+'</head><body>Original</body></html>';
 assert.equal(tabletRuntimeBody(row,original),canonical);
 assert.equal(tabletRuntimeBody({path:'/',protected:true},original),original);
 assert.throws(()=>tabletRuntimeBody(row,original.replace('black','red')));
 assert.throws(()=>tabletRuntimeBody(row,original.replace(style,style+style)));
 assert.throws(()=>tabletRuntimeBody({...row,path:'/member-login'},original));
 assert.throws(()=>tabletRuntimeBody({...row,protected:true},original));
 assert.notEqual(tabletRuntimeBody(row,original.replace('Original','Different')),canonical);
});
test('the complete finite release payload remains pinned and unknown metadata fails closed',()=>{
 const c=JSON.parse(readFileSync('shift-coach/release-manifest.json')).tabletRuntimeComposition;
 assert(c);validateTabletRuntimeComposition(c);
 for(const patch of [{proof:'unknown'},{base:'f'.repeat(40)},{paths:[...c.paths,'wrangler.jsonc']}])assert.throws(()=>validateTabletRuntimeComposition({...c,...patch}));
 for(const changed of c.paths)assert.throws(()=>validateTabletRuntimeComposition(c,(ref,path)=>ref==='HEAD'&&path===changed?'drift':path),/Coaching release source drift/);
});
