import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {verifyMemberConsentSource as verify,requireMemberConsentReleaseAuthority as authority,memberConsentHistoricalView,MEMBER_CONSENT_BASE as base,MEMBER_CONSENT_SOURCE as source,MEMBER_CONSENT_BLOBS as blobs,MEMBER_CONSENT_PATHS as paths,MEMBER_CONSENT_MAINTENANCE as maintenance,MEMBER_CONSENT_FLAGS as flags} from '../release/member-consent-repair-scope.mjs';
const manifest='release/approved-runtime-composition.json';
const fixture=()=>({proof:'EXACT_MEMBER_CONSENT_REPAIR_SOURCE_20261013',base,source,integrationIssue:1065,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),releaseApproval:null,...Object.fromEntries(flags.map(f=>[f,false]))});
const options=()=>({head:'b'.repeat(40),read:(ref,path)=>blobs[path]||'maintenance',blob:(ref,path)=>blobs[path]||'maintenance',ancestor:()=>{},diff:a=>a===base?[...paths]:a===source?[...maintenance]:[manifest],content:ref=>JSON.stringify(ref===base?{retained:true}:{retained:true,memberConsentRepair:{}})});
test('source review admits only eleven immutable repair paths and seven bounded maintenance paths',()=>{
  assert.doesNotThrow(()=>verify(fixture(),options()));
  assert.equal(paths.length,11);assert.equal(maintenance.length,7);
  assert(!paths.includes('obesity-awareness/rendered-live-proof.cjs'));
  assert(!paths.includes('member-experience/grub-routes.mjs'));
});
test('every source identity and scope boundary is mandatory',()=>{
  for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{integrationIssue:1},{paths:paths.slice(1)},{maintenancePaths:maintenance.slice(1)},...flags.map(f=>({[f]:true}))])assert.throws(()=>verify({...fixture(),...patch},options()));
});
test('fresh current readers and independently pinned blobs reject drift on every payload or maintenance path',()=>{
  for(const path of [...paths,...maintenance]){
    const a=options(),read=a.read;a.read=(ref,p)=>ref==='HEAD'&&p===path?'changed':read(ref,p);assert.throws(()=>verify(fixture(),a),/drift/);
    const b=options(),blob=b.blob;b.blob=(ref,p)=>ref==='HEAD'&&p===path?'changed':blob(ref,p);assert.throws(()=>verify(fixture(),b),/drift/);
  }
});
test('missing, additional, destructive and later unrelated paths or absent ancestry remain failures',()=>{
  for(const ref of [base,source,'a'.repeat(40)])for(const extra of [true,false]){
    const o=options(),diff=o.diff;o.diff=a=>a===ref?extra?[...diff(a),'unreviewed']:diff(a).slice(1):diff(a);assert.throws(()=>verify(fixture(),o));
  }
  const o=options();o.ancestor=()=>{throw Error('not an ancestor')};assert.throws(()=>verify(fixture(),o),/ancestor/);
});
test('old approval, release and failure records cannot be rewritten by the new source registration',()=>{
  const o=options();o.content=ref=>JSON.stringify(ref===base?{retained:true}:{retained:false,memberConsentRepair:{}});assert.throws(()=>verify(fixture(),o),/prior approval/);
});
test('passing source review never supplies missing publication or production approval',()=>{
  const c=fixture();verify(c,options());assert.throws(()=>authority(c),/approval is missing/);
  const approval={owner:'Matt',instruction:'Publish and guarded deploy this exact member repair',source,maintenanceSource:c.maintenanceSource,recordedAt:'2026-10-13T12:00:00+01:00',integrationIssue:1065,emailAuthority:false,rollbackAuthorityBroadened:false};
  // This is only a synthetic negative/positive authority fixture, not a real approval.
  assert.deepEqual(authority({...c,releaseApproval:approval}),approval);
  for(const patch of [{owner:'assumed'},{instruction:'Go'},{source:'f'.repeat(40)},{maintenanceSource:'f'.repeat(40)},{recordedAt:null},{integrationIssue:1},{emailAuthority:true},{rollbackAuthorityBroadened:true}])assert.throws(()=>authority({...c,releaseApproval:{...approval,...patch}}));
});
test('actual current source validates before exposing the unchanged earlier record to historical guards',()=>{
  const current=JSON.parse(readFileSync(manifest,'utf8'));assert(current.memberConsentRepair);
  const view=memberConsentHistoricalView();assert.equal(view.head,base);
  assert.deepEqual(view.record,JSON.parse(execFileSync('git',['show',base+':'+manifest],{encoding:'utf8'})));
  for(const path of paths){let earlier;try{earlier=execFileSync('git',['rev-parse',base+':'+path],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{assert.throws(()=>view.read('HEAD',path));continue;}assert.equal(view.read('HEAD',path),earlier);}
  for(const path of ['worker-entry-v6.js',...paths])assert.throws(()=>memberConsentHistoricalView((ref,p)=>ref==='HEAD'&&p===path?'drift':execFileSync('git',['rev-parse',ref+':'+p],{encoding:'utf8'}).trim()).read('HEAD',path),/drift/);
});
test('both workflow hooks are exactly additive, with every earlier production/integration permission and gate byte preserved',()=>{
  const hooks={'.github/workflows/shift-coach-integration.yml':'      - name: Verify bounded member consent source and request-evidence privacy\n        run: node --test tests/member-consent-repair-composition.test.mjs tests/photo-tracking-choice.test.mjs tests/request-evidence-privacy.test.mjs\n','.github/workflows/cloudflare-production-promote.yml':'      - name: Require exact member repair publication and production approval\n        run: node release/member-consent-repair-scope.mjs --require-release-authority\n'};
  for(const [path,hook]of Object.entries(hooks)){
    const current=readFileSync(path,'utf8');assert.equal(current.split(hook).length,2);assert.equal(current.replace(hook,''),execFileSync('git',['show',base+':'+path],{encoding:'utf8'}));
  }
});
