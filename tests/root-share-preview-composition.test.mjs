import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {verifyRootShareSource as verify,requireRootShareAuthority as authority,rootShareHistoricalView,rootShareHistoricalFile,ROOT_SHARE_BASE as base,ROOT_SHARE_SOURCE as source,ROOT_SHARE_PATHS as paths,ROOT_SHARE_BLOBS as blobs,ROOT_SHARE_MAINTENANCE as maintenance,ROOT_SHARE_FLAGS as flags,ROOT_SHARE_APPROVAL as approval} from '../release/root-share-preview-scope.mjs';
import {jpegDimensions,verifyRootPreservation,verifyRootHeadPreservation} from '../release/root-share-preview-live.mjs';
import {replaceRootShareImage} from '../share-preview/metadata.mjs';
import {sharePreviewBytes} from '../share-preview/asset.mjs';
const manifest='release/approved-runtime-composition.json';
const fixture=()=>({proof:'EXACT_APPROVED_ROOT_SHARE_PREVIEW_20261013',base,source,paths,maintenancePaths:maintenance,maintenanceSource:'a'.repeat(40),integrationIssue:1065,releaseApproval:approval,...Object.fromEntries(flags.map(f=>[f,false]))});
const options=()=>({head:'b'.repeat(40),read:(r,p)=>blobs[p]||'maintenance',blob:(r,p)=>blobs[p]||'maintenance',ancestor:()=>{},diff:a=>a===base?paths:a===source?maintenance:[manifest],content:r=>JSON.stringify(r===base?{previous:true}:{previous:true,rootSharePreview:{}})});
test('exact prepared7-path artwork and20-path bounded maintenance are required',()=>{verify(fixture(),options());assert.equal(paths.length,7);assert.equal(maintenance.length,20);});
test('all immutable identities, scope boundaries and exact approval are mandatory',()=>{
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{paths:paths.slice(1)},{maintenancePaths:maintenance.slice(1)},{integrationIssue:1},...flags.map(f=>({[f]:true}))])assert.throws(()=>verify({...fixture(),...patch},options()));
 assert.throws(()=>authority({...fixture(),releaseApproval:null}));for(const patch of [{owner:'assumed'},{source:'f'.repeat(40)},{recordedAt:null},{scope:'all homepage changes'},{emailAuthority:true},{rollbackAuthorityBroadened:true}])assert.throws(()=>authority({...fixture(),releaseApproval:{...approval,...patch}}));
});
test('current payload and maintenance drift, absent ancestry, extra paths and altered prior receipts all fail',()=>{
 for(const p of [...paths,...maintenance])for(const field of ['read','blob']){const o=options(),prior=o[field];o[field]=(r,q)=>r==='HEAD'&&q===p?'tampered':prior(r,q);assert.throws(()=>verify(fixture(),o),/drift/);}
 for(const r of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=a=>a===r?[...diff(a),'unapproved']:diff(a);assert.throws(()=>verify(fixture(),o));}
 const o=options();o.ancestor=()=>{throw Error('missing ancestry')};assert.throws(()=>verify(fixture(),o));const c=options();c.content=r=>JSON.stringify({previous:r===base,rootSharePreview:{}});assert.throws(()=>verify(fixture(),c),/prior/);
});
test('actual registered source is verified before exposing unchanged historical member/growth guards',()=>{
 const view=rootShareHistoricalView();assert.equal(view.head,base);assert.deepEqual(view.record,JSON.parse(execFileSync('git',['show',base+':'+manifest],{encoding:'utf8'})));
 for(const p of maintenance.filter(x=>!['release/root-share-preview-scope.mjs','tests/root-share-preview-composition.test.mjs','release/root-share-preview-live.mjs','release/root-share-preview-rollback.mjs','tests/root-share-preview-rollback.test.mjs','docs/root-share-owned-rollback-20261013.json','release/root-share-preview-transport.cjs','tests/root-share-preview-transport.test.mjs','release/root-share-transport-rollback.mjs','tests/root-share-transport-rollback.test.mjs','docs/root-share-transport-rollback-20261013.json'].includes(x)))assert.equal(rootShareHistoricalFile(p,readFileSync(p,'utf8')),execFileSync('git',['show',base+':'+p],{encoding:'utf8'}));
 for(const p of [...paths,...maintenance])assert.throws(()=>rootShareHistoricalView((r,q)=>r==='HEAD'&&q===p?'tampered':execFileSync('git',['rev-parse',r+':'+q],{encoding:'utf8'}).trim()),/drift/);
});
test('original workflow gates and permission bytes survive only the three additive sharing hooks',()=>{
 const hooks={'.github/workflows/shift-coach-integration.yml':['      - name: Verify exact approved homepage sharing repair\n        run: node --test tests/root-share-preview.test.mjs tests/root-share-preview-composition.test.mjs tests/root-share-preview-rollback.test.mjs tests/root-share-preview-transport.test.mjs tests/root-share-transport-rollback.test.mjs\n'],'.github/workflows/cloudflare-production-promote.yml':['      - name: Require exact approved homepage sharing repair and retain baseline\n        run: |\n          node release/root-share-preview-scope.mjs --require-release-authority\n          node release/root-share-preview-live.mjs before\n','      - name: Verify corrected homepage sharing image and exact page preservation live\n        run: node release/root-share-preview-live.mjs after\n']};
 for(const [p,list]of Object.entries(hooks)){let current=readFileSync(p,'utf8');for(const h of list){assert.equal(current.split(h).length,2);current=current.replace(h,'');}assert.equal(current,execFileSync('git',['show',base+':'+p],{encoding:'utf8'}));}
});
test('live inverse accepts exactly the new two image links and rejects unrelated copy or image drift',()=>{
 const html='<meta property="og:image" content="https://shiftsometimber.co.uk/assets/og-default.jpg"><meta name="twitter:image" content="https://shiftsometimber.co.uk/assets/og-default.jpg"><main>Original approved copy</main>',bytes=Buffer.from(html),live=Buffer.from(replaceRootShareImage(html));assert(verifyRootPreservation(bytes,live));assert.throws(()=>verifyRootPreservation(bytes,Buffer.from(live.toString().replace('Original','Changed'))));assert.throws(()=>verifyRootPreservation(bytes,bytes));assert.deepEqual(jpegDimensions(sharePreviewBytes()),{width:1200,height:630});assert.throws(()=>jpegDimensions(Buffer.from('not an image')));
});
test('HEAD retains its own actual policy when the existing GET policy differs',()=>{
 const getHeaders={'content-type':'text/html; charset=utf-8','cache-control':'no-store'},headHeaders={...getHeaders,'cache-control':'public, max-age=0, must-revalidate'},before={path:'/',headers:headHeaders};
 assert(verifyRootHeadPreservation(before,{path:'/',headers:{...headHeaders},body:new Uint8Array()}));
 assert.throws(()=>verifyRootHeadPreservation(before,{path:'/',headers:getHeaders,body:new Uint8Array()}),/own pre-release HEAD baseline/);
});
test('HEAD acceptance rejects absent baseline, changed policy, wrong path and a response body',()=>{
 const headers={'cache-control':'public, max-age=0, must-revalidate','content-type':'text/html; charset=utf-8','content-security-policy':"default-src 'self'",'strict-transport-security':'max-age=31536000; includeSubDomains','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','permissions-policy':'camera=()','x-frame-options':'SAMEORIGIN'},before={path:'/',headers},head={path:'/',headers:{...headers},body:new Uint8Array()};
 assert.throws(()=>verifyRootHeadPreservation(null,head),/baseline/);
 assert.throws(()=>verifyRootHeadPreservation({...before,path:'/programme'},head));assert.throws(()=>verifyRootHeadPreservation(before,{...head,path:'/programme'}));assert.throws(()=>verifyRootHeadPreservation(before,{...head,body:new Uint8Array([1])}),/bodyless/);
 for(const key of Object.keys(headers))assert.throws(()=>verifyRootHeadPreservation(before,{...head,headers:{...headers,[key]:'changed'}}),/own pre-release HEAD baseline/);
});

test('original response-policy assertions and tests remain byte-identical after a verified source adapter',()=>{let s=readFileSync('tests/growth-finite-response-policy.test.mjs','utf8');const line="import {rootShareHistoricalFile} from '../release/root-share-preview-scope.mjs';\n";assert.equal(s.split(line).length,2);s=s.replace(line,'').replace(" const source=rootShareHistoricalFile('shift-coach/worker.mjs',readFileSync('shift-coach/worker.mjs','utf8'));"," const source=readFileSync('shift-coach/worker.mjs','utf8');");assert.equal(s,execFileSync('git',['show',base+':tests/growth-finite-response-policy.test.mjs'],{encoding:'utf8'}));});
