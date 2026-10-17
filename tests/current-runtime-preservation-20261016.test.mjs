import test from 'node:test';import assert from 'node:assert/strict';import{execFileSync}from'node:child_process';
import{verifyCurrentRuntimePreservation,currentRuntimePreservationHistoricalView,currentRuntimePreservationAuthenticatedRead,currentRuntimePreservationAuthenticatedContent,currentRuntimePreservationAuthenticatedDiff,currentRuntimePreservationAuthenticatedAncestor,currentRuntimePreservationReaderProvenance}from'../release/current-runtime-preservation-20261016.mjs';
import{verifyReconciledRelease}from'../release/approved-runtime-composition.mjs';
import{mkdtempSync,writeFileSync,chmodSync,symlinkSync,rmSync}from'node:fs';
import{tmpdir}from'node:os';import{join}from'node:path';
const g=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:64e6}),head=g('rev-parse','HEAD').trim(),manifest='release/approved-runtime-composition.json',record=JSON.parse(g('show',head+':'+manifest)),c=record.currentRuntimePreservation20261016;
const blob=(r,p)=>g('rev-parse',(r==='HEAD'?head:r)+':'+p).trim(),content=(r,p)=>g('show',(r==='HEAD'?head:r)+':'+p),diff=(a,b)=>g('diff','--no-renames','--name-only',a,b).trim().split('\n').filter(Boolean),ancestor=(a,b)=>g('merge-base','--is-ancestor',a,b);
test('current preservation source validates actual delivered bytes without certifying clinical/HQ acceptance',()=>{assert.equal(verifyCurrentRuntimePreservation(c),c);assert.equal(c.wholeFeatureAcceptance,false);assert.equal(c.runtimeRun,38990992637);assert.equal(c.questionnaireRuntimeRun,38980756381);assert.equal(c.recordedWeekMemberFeatureAcceptance,false);});
for(const[label,mutate]of[['wrong base',x=>x.base='a'.repeat(40)],['wrong runtime',x=>x.runtimeSource='a'.repeat(40)],['invented feature pass',x=>x.wholeFeatureAcceptance=true],['clinical activation',x=>x.clinicalContractActivated=true],['stock change',x=>x.stockChanged=true],['email permission',x=>x.externalCommunications=true],['unknown version approval',x=>x.unknownVersionsAccepted=true],['removed assertions',x=>x.sourceAssertionsRemoved=true],['replacement gate',x=>x.requiredGatesReplaced=true],['raised timeout',x=>x.originalTimeoutsRaised=true],['expanded path set',x=>x.paths.push('unapproved.txt')],['changed source tree',x=>x.sourceTree='a'.repeat(40)]])test('preservation rejects '+label,()=>{const value=structuredClone(c);mutate(value);assert.throws(()=>verifyCurrentRuntimePreservation(value));});
test('actual current source identity cannot be substituted by an old base',()=>assert.throws(()=>verifyCurrentRuntimePreservation(c,{head:c.base})));
for(const option of ['read','readContent','readDiff','isAncestor'])test('explicit null '+option+' rejects rather than selecting a native fallback',()=>assert.throws(()=>verifyCurrentRuntimePreservation(c,{[option]:null})));
test('changed supplied current blob and directory readers reject',()=>{for(const path of ['member-experience/member-details-lookups.mjs','frontend','release',manifest,'.github/workflows/cloudflare-production-promote.yml'])assert.throws(()=>verifyCurrentRuntimePreservation(c,{read:(r,p)=>p===path&&r==='HEAD'?'a'.repeat(40):blob(r,p)}),/source drift/);});
test('changed supplied current content, boundary and ancestry reject',()=>{assert.throws(()=>verifyCurrentRuntimePreservation(c,{readContent:(r,p)=>r==='HEAD'&&p===manifest?'{}':content(r,p)}));assert.throws(()=>verifyCurrentRuntimePreservation(c,{readDiff:()=>[]}));assert.throws(()=>verifyCurrentRuntimePreservation(c,{isAncestor:()=>false}));});
test('reader exceptions retain their actual identity',()=>{const error=new Error('retained source reader failure');assert.throws(()=>verifyCurrentRuntimePreservation(c,{read(){throw error}}),value=>value===error);});
test('closed view preserves raw and historical identities and authenticates supplied callbacks again',()=>{const v=currentRuntimePreservationHistoricalView();assert.equal(v.rawHead,head);assert.equal(v.head,c.base);assert.equal(v.content('HEAD',manifest),content(c.base,manifest));assert.equal(v.currentContent(head,manifest),content(head,manifest));assert.equal(currentRuntimePreservationReaderProvenance(v.blob).view,v);let reads=[];const r=currentRuntimePreservationAuthenticatedRead((ref,p)=>{reads.push(ref);return blob(ref,p)},v);assert.equal(r('HEAD','wrangler.jsonc'),blob(c.base,'wrangler.jsonc'));assert.deepEqual(reads,['HEAD',head,c.base]);assert.throws(()=>currentRuntimePreservationAuthenticatedRead(()=> 'a'.repeat(40),v)('HEAD','wrangler.jsonc'));});
test('forged private views and changed content/diff/ancestry callbacks reject',()=>{const v=currentRuntimePreservationHistoricalView();assert.throws(()=>currentRuntimePreservationAuthenticatedRead(blob,{...v})('HEAD','wrangler.jsonc'));assert.throws(()=>currentRuntimePreservationAuthenticatedContent(()=> 'foreign',v)('HEAD',manifest));assert.throws(()=>currentRuntimePreservationAuthenticatedDiff(()=>[],v)(c.base,'HEAD'));assert.throws(()=>currentRuntimePreservationAuthenticatedAncestor(()=>false,v)(c.base,'HEAD'));});
test('all original Core composition assertions still execute on the authenticated historical frame',()=>{assert(verifyReconciledRelease());});
test('native mode facts retain real Git modes and reject executable or symbolic source files',()=>{
 const directory=mkdtempSync(join(tmpdir(),'current-native-mode-'));
 try{
  const run=(...args)=>execFileSync('git',args,{cwd:directory,encoding:'utf8',stdio:'pipe'});
  run('init','--quiet');run('config','user.name','Owned source fixture');run('config','user.email','source-fixture@example.invalid');
  writeFileSync(join(directory,'source.mjs'),'export const regular=true;\n');writeFileSync(join(directory,'ledger.json'),'{}\n');writeFileSync(join(directory,'executable.mjs'),'export const executable=true;\n');chmodSync(join(directory,'executable.mjs'),0o755);symlinkSync('source.mjs',join(directory,'symbolic.mjs'));run('add','.');run('commit','--quiet','-m','Owned native source modes');
  const modulePath=new URL('../release/seo-native-immutable-facts-20261016.mjs',import.meta.url).href;
  const script=`import assert from 'node:assert/strict';import{execFileSync}from'node:child_process';import{readSeoNativeImmutableFacts}from${JSON.stringify(modulePath)};const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();const options={head,base:head,payload:head,maintenanceSource:head,paths:['source.mjs'],maintenancePaths:[],inversePaths:[],ledger:'ledger.json'};assert.deepEqual(Object.keys(readSeoNativeImmutableFacts(options)),['blob','content']);const facts=readSeoNativeImmutableFacts({...options,includeModes:true});assert.equal(facts.mode(head,'source.mjs'),'100644');assert.equal(facts.mode('HEAD','source.mjs'),'100644');assert.throws(()=>facts.mode(head,'unrequested.mjs'));for(const path of ['executable.mjs','symbolic.mjs'])assert.throws(()=>readSeoNativeImmutableFacts({...options,paths:[path],includeModes:true}),/Only original regular source files/);`;
  execFileSync(process.execPath,['--input-type=module','-e',script],{cwd:directory,stdio:'pipe',timeout:30000});
 }finally{rmSync(directory,{recursive:true,force:true});}
});

function withOwnedPreservationClone(script){
 const directory=mkdtempSync(join(tmpdir(),'current-proof-scope-'));
 try{
  g('clone','--no-hardlinks','--quiet','--no-checkout',process.cwd(),directory);execFileSync('git',['checkout','--detach','--quiet',head],{cwd:directory,stdio:'pipe'});
  const header="import assert from 'node:assert/strict';import{execFileSync}from'node:child_process';import{readFileSync,writeFileSync}from'node:fs';import{pathToFileURL}from'node:url';const module=path=>import(pathToFileURL(process.cwd()+'/'+path));const g=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:64e6,stdio:'pipe'}).trim(),head=g('rev-parse','HEAD'),record=JSON.parse(g('show',head+':release/approved-runtime-composition.json'));const{withImmutableHistoryVerification}=await module('release/immutable-git-facts.mjs');const{currentRuntimePreservationHistoricalView,currentRuntimePreservationAuthenticatedRead}=await module('release/current-runtime-preservation-20261016.mjs');";
  execFileSync(process.execPath,['--input-type=module','-e',header+script],{cwd:directory,stdio:'pipe',maxBuffer:64e6,timeout:180000});
 }finally{rmSync(directory,{recursive:true,force:true});}
}
test('outside a closed proof an admitted source reader still rejects changed working bytes',()=>withOwnedPreservationClone(`
 const view=currentRuntimePreservationHistoricalView(),path='worker-entry-v6.js',before=readFileSync(path);
 try{writeFileSync(path,Buffer.concat([before,Buffer.from(String.fromCharCode(10)+'// owned negative fixture'+String.fromCharCode(10))]));assert.throws(()=>view.read('HEAD',path),/source|tracked|working/i);}finally{writeFileSync(path,before);}
 assert.equal(view.read('HEAD',path),g('rev-parse',view.head+':'+path));
`));
test('a public source admission rejects a callback that changes working bytes inside a warmed proof',()=>withOwnedPreservationClone(`
 const{verifyFoodDiaryLondonDateRepair}=await module('release/food-diary-london-date-scope-20261015.mjs');const c=record.foodDiaryLondonDateRepair20261015,path=c.paths[0],before=readFileSync(path);let visits=0;
 withImmutableHistoryVerification(()=>{
  const read=(ref,p)=>{const value=g('rev-parse',ref+':'+p);if(!visits&&p===path&&(ref==='HEAD'||ref===head)){visits++;writeFileSync(path,Buffer.concat([before,Buffer.from(String.fromCharCode(10)+'// owned callback drift'+String.fromCharCode(10))]));}return value;};
  try{assert.throws(()=>verifyFoodDiaryLondonDateRepair(c,{head,read}),/source|tracked|working/i);}finally{writeFileSync(path,before);}
  assert.equal(visits,1);assert(verifyFoodDiaryLondonDateRepair(c,{head}));
 });
`));
test('closed projection reads retain context fences and every supplied callback despite a native flag',()=>withOwnedPreservationClone(`
 withImmutableHistoryVerification(()=>{
  const view=currentRuntimePreservationHistoricalView(),path='wrangler.jsonc',visits=[];
  const read=currentRuntimePreservationAuthenticatedRead((ref,p)=>{visits.push(ref);return g('rev-parse',ref+':'+p);},view,{defaultReader:true});
  assert.equal(read('HEAD',path),g('rev-parse',view.head+':'+path));assert.deepEqual(visits,['HEAD',head,view.head]);
  assert.throws(()=>currentRuntimePreservationAuthenticatedRead(()=> 'a'.repeat(40),view,{defaultReader:true})('HEAD',path),/source drift/);
  const prior=process.env.SHIFT_CURRENT_PROOF_NEGATIVE_CONTEXT;
  try{process.env.SHIFT_CURRENT_PROOF_NEGATIVE_CONTEXT='owned-negative-fixture';assert.throws(()=>view.read('HEAD',path),/execution environment changed/);}finally{if(prior===undefined)delete process.env.SHIFT_CURRENT_PROOF_NEGATIVE_CONTEXT;else process.env.SHIFT_CURRENT_PROOF_NEGATIVE_CONTEXT=prior;}
  try{g('update-ref','HEAD',record.currentRuntimePreservation20261016.base);assert.throws(()=>view.read('HEAD',path),/HEAD|head|source drift/);}finally{g('update-ref','HEAD',head);}
  assert.equal(view.read('HEAD',path),g('rev-parse',view.head+':'+path));
 });
`));

test('the original CSV gate cannot hide unauthorised current configuration or model working bytes',()=>withOwnedPreservationClone(`
 const run=()=>execFileSync(process.execPath,['--test','--test-reporter=tap','member-experience/tests/weight-import-mapping-ui.test.mjs'],{cwd:process.cwd(),env:{...process.env,NODE_TEST_CONTEXT:undefined},stdio:'pipe',timeout:180000,maxBuffer:64e6});
 for(const path of ['wrangler.jsonc','shift-coach/worker.mjs']){
  const before=readFileSync(path);
  try{writeFileSync(path,Buffer.concat([before,Buffer.from(String.fromCharCode(10)+'// owned CSV boundary negative'+String.fromCharCode(10))]));assert.throws(run,error=>error.status===1&&/source drift|clean tracked source|Working source changed/i.test(String(error.stdout)+String(error.stderr)));}
  finally{writeFileSync(path,before);}
 }
 const output=String(run());assert.match(output,/^# tests 4$/m);assert.match(output,/^# pass 4$/m);assert.match(output,/^# fail 0$/m);
`));
test('the historical HQ comparator still rejects a changed current GP API before projection',()=>withOwnedPreservationClone(`
 const{proveCombinedHqCurrent}=await module('release/combined-hq-preservation-20261014.mjs');const path='hq-management-api.mjs',before=readFileSync(path);
 try{writeFileSync(path,Buffer.concat([before,Buffer.from(String.fromCharCode(10)+'// owned HQ source negative'+String.fromCharCode(10))]));assert.throws(()=>proveCombinedHqCurrent(),/source drift|clean tracked source|Working source changed/i);}
 finally{writeFileSync(path,before);}
 const proof=proveCombinedHqCurrent();assert.equal(proof.head,head);assert.equal(proof.currentRuntimePreserved,true);assert.notEqual(proof.historicalHead,head);
`));

// Programme setup repair must retain the literal original Watch workflow hash.
import{SEO_AUDIT_MAINTENANCE,seoAuditOriginalSource}from'../release/seo-audit-scope-20261016.mjs';
const programmeFixturePath='.github/workflows/programme-day-preview.yml',programmeOriginalBlob='54827864ebfed96670c67809030e6ad772731b73';
test('Programme fixture projects only after actual current bytes authenticate and retains original Watch hash',()=>{
 const raw=content(head,programmeFixturePath),historical=seoAuditOriginalSource(programmeFixturePath,raw);
 assert.notEqual(blob(head,programmeFixturePath),programmeOriginalBlob);assert.equal(historical,content(c.base,programmeFixturePath));
 assert.equal(execFileSync('git',['hash-object','--stdin'],{input:historical,encoding:'utf8'}).trim(),programmeOriginalBlob);
 assert(raw.includes('npm ci --ignore-scripts --no-audit --no-fund'));assert(!historical.includes('Install the locked dependencies required by the original source tests'));
});
test('Programme fixture adds only the one bounded current-runtime path to the exported fixture set',()=>{
 const original=content(c.base,'release/seo-audit-scope-20261016.mjs').match(/^const policy=(\{[^\n]+\});$/m);assert(original);
 assert.deepEqual([...SEO_AUDIT_MAINTENANCE].sort(),[...JSON.parse(original[1]).maintenancePaths,programmeFixturePath].sort());
});
test('Programme fixture refuses changed supplied current workflow bytes',()=>assert.throws(()=>seoAuditOriginalSource(programmeFixturePath,content(head,programmeFixturePath)+'\nforeign'),/Exact current SEO fixture/));
test('Programme fixture does not admit an unknown historical source path',()=>assert.throws(()=>seoAuditOriginalSource('package-lock.json',content(head,'package-lock.json')),/Unknown SEO historical fixture/));
test('Programme fixture cannot hide an unauthorised working workflow edit',()=>withOwnedPreservationClone(`
 const{seoAuditOriginalSource}=await module('release/seo-audit-scope-20261016.mjs'),path='.github/workflows/programme-day-preview.yml',before=readFileSync(path),raw=g('show',head+':'+path);
 try{writeFileSync(path,Buffer.concat([before,Buffer.from(String.fromCharCode(10)+'# unauthorised workflow'+String.fromCharCode(10))]));assert.throws(()=>seoAuditOriginalSource(path,raw),/source|tracked|working/i);}finally{writeFileSync(path,before);}
 assert.equal(execFileSync('git',['hash-object','--stdin'],{input:seoAuditOriginalSource(path,raw),encoding:'utf8'}).trim(),'54827864ebfed96670c67809030e6ad772731b73');
`));

// Matching aliases are not authority: the original verifier must still reject forged bytes.
import{verifyCombinedFinite as verifyBoundedFiniteReaderPerformance}from'../release/combined-finite-scope-20261014.mjs';
test('matching forged current aliases still reach and fail the original finite source authenticator',()=>{
 const finite=record.combinedFinite20261014,path='release/combined-finite-scope-20261014.mjs';
 const forged=(ref,p)=>p===path&&(ref==='HEAD'||ref===head)?'matching-forged-source':blob(ref,p);
 assert.throws(()=>verifyBoundedFiniteReaderPerformance(finite,{head,read:forged,blob,content,diff,ancestor}),/source drift/);
});
