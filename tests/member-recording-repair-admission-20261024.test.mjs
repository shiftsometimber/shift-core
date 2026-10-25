import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {verifyMemberRecordingRepair,validateRecordingRepairReceipt,RECORDING_REPAIR_RECEIPT,RECORDING_REPAIR_BLOBS,originalRecordingMaintenance,withMemberRecordingQualification,memberRecordingComparisonValue} from '../release/member-recording-repair-20261024.mjs';
const receipt=()=>JSON.parse(readFileSync(RECORDING_REPAIR_RECEIPT,'utf8'));
test('exact native repair and its registration have no unrelated source tail',()=>{const proof=verifyMemberRecordingRepair();assert.equal(proof.paths.length,41);assert.deepEqual(proof.receipt.payloadBlobs,RECORDING_REPAIR_BLOBS);});
test('authority cannot be expanded to messages, real deletion, Health reads or a new Apple submission',()=>{for(const key of ['messaging','realAccountDeletionTest','personalHealthRead','newAppleSubmission','homepage','clinicalActivation','realCharge','stockCommitment']){const r=receipt();r.authority[key]=true;assert.throws(()=>validateRecordingRepairReceipt(r));}});
test('all runtime and acceptance-test pins reject drift',()=>{for(const key of Object.keys(RECORDING_REPAIR_BLOBS)){const r=receipt();r.payloadBlobs[key]='0'.repeat(40);assert.throws(()=>validateRecordingRepairReceipt(r));}});
test('forged source, provenance and extra receipt fields are rejected',()=>{for(const patch of [{base:'0'.repeat(40)},{payload:'0'.repeat(40)},{registrationSource:'unverified'},{ignoreOldGuards:true}])assert.throws(()=>validateRecordingRepairReceipt({...receipt(),...patch}));const r=receipt();r.registrationSource='a'.repeat(40);assert.throws(()=>verifyMemberRecordingRepair(r),/Native repair receipt/);});

test('qualified maintenance restores every original guard byte and rejects edited adapters',()=>{for(const path of ['release/my-shift-release-scope-20261024.mjs','release/approved-source-comparison-20261024.mjs','release/member-design-scope.mjs','release/app-scope.mjs','.github/workflows/seo-discovery-proof.yml','release/app-preflight.mjs','tests/approved-ranking-release.test.mjs','tests/seo-discovery-release.test.mjs','release/recorded-week-navigation-outer-frame-20261018.mjs','tests/recorded-week-navigation-preservation-20261018.test.mjs','release/immutable-git-facts.mjs','release/seo-audit-scope-20261016.mjs','release/food-diary-london-date-scope-20261015.mjs','release/ci-execution-scope-20261014.mjs','release/release-machinery-repair-scope-20261014.mjs','release/metrics-connection-scope.mjs','release/book-voice-scope.mjs','release/device-health-scope.mjs','release/finite-growth-scope.mjs','release/footer-scope.mjs','release/member-acceptance-scope.mjs','release/member-consent-repair-scope.mjs','release/my-timber-progress-journey-scope.mjs','release/my-timber-week-scope.mjs','release/organic-followthrough-scope.mjs','release/photo-acceptance-maintenance-scope.mjs','release/photo-calendar-scope.mjs','release/public-wording-scope.mjs','release/recipe-image-scope.mjs','release/root-share-completion-scope.mjs','release/root-share-preview-scope.mjs','release/seo-context-scope.mjs','release/seo-discovery-scope.mjs','release/seo-link-repairs-scope.mjs','release/seo-technical-scope.mjs','release/six-topic-seo-scope.mjs','shift-coach/release-contract.mjs']){const value=readFileSync(path,'utf8');assert.equal(typeof originalRecordingMaintenance(path,value),'string');assert.throws(()=>originalRecordingMaintenance(path,value+'unreviewed'));}});

test('closed native qualification reuse rejects changed current bytes in an isolated checkout',()=>{
 const fixture=mkdtempSync(tmpdir()+'/recording-qualification-tamper-');
 try{
  execFileSync('git',['clone','--quiet','--no-local','--single-branch','--no-tags',process.cwd(),fixture],{encoding:'utf8',maxBuffer:64e6});
  const code=String.raw`import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {verifyMemberRecordingRepair,withMemberRecordingQualification} from './release/member-recording-repair-20261024.mjs';
withMemberRecordingQualification(()=>{verifyMemberRecordingRepair();const path='docs/privacy-account-deletion.md',before=readFileSync(path);try{writeFileSync(path,Buffer.concat([before,Buffer.from('\nUnreviewed source change\n')]));assert.throws(()=>verifyMemberRecordingRepair(),/Actual repair bytes changed/);}finally{writeFileSync(path,before);}assert.equal(verifyMemberRecordingRepair().paths.length,41);});`;
  execFileSync(process.execPath,['--input-type=module','-e',code],{cwd:fixture,encoding:'utf8',maxBuffer:64e6});
 }finally{rmSync(fixture,{recursive:true,force:true});}
});

test('exact repair comparison composes with the original CLI admission instead of masking it',async()=>{const {approvedSourceComparison}=await import('../release/approved-source-comparison-20261024.mjs');const path='release/app-preflight.mjs',current=readFileSync(path,'utf8'),original=execFileSync('git',['show','2ac8456e8394c1508b13481fad1f68520926f10b:'+path],{encoding:'utf8'});const blob=value=>createHash('sha1').update('blob '+Buffer.byteLength(value)+'\0').update(value).digest('hex');assert.equal(approvedSourceComparison(path,current),original);assert.equal(approvedSourceComparison(path,blob(current)),blob(original));assert.equal(approvedSourceComparison(path,current+'unreviewed'),current+'unreviewed');assert.equal(approvedSourceComparison(path,original,'2ac8456e8394c1508b13481fad1f68520926f10b'),original);});

// Exercise the original caller that the full preflight reached after its expensive prefix.
test('actual current-main safety assertions compose only the qualified native repair pin',async()=>{
 const {verifyCurrentMainSafetyChecks}=await import('../release/app-scope.mjs');
 const {myShiftSafetyComparison}=await import('../release/my-shift-release-scope-20261024.mjs');
 const path='release/approved-source-comparison-20261024.mjs',expected='6af31f06d5667c037f65cae202af1b478813dbaa';
 const read=p=>execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}).trim();
 withMemberRecordingQualification(()=>{
  const current=read(path);assert.notEqual(current,expected);
  assert.equal(myShiftSafetyComparison(path,current),expected);
  assert(verifyCurrentMainSafetyChecks().includes(path));
  const qualifiedRead=p=>memberRecordingComparisonValue(p,read(p));
  const forged=current+'unreviewed';assert.equal(myShiftSafetyComparison(path,forged),forged);
  assert.throws(()=>verifyCurrentMainSafetyChecks(p=>p===path?forged:qualifiedRead(p)),/Merged safety-check source drift: release\/approved-source-comparison/);
  assert.throws(()=>verifyCurrentMainSafetyChecks(p=>p==='worker-entry-v6.js'?'0'.repeat(40):qualifiedRead(p)),/Merged safety-check source drift: worker-entry-v6.js/);
 });
});

test('combined backend preserves every original native payload except exact separately approved account/privacy successors',()=>{const original={"acquisition-activation/server.mjs": "496da813a348869725fbc32615e1809162e00bd3", "auth-email-verification-v1.js": "dee72f89ad1ea23772aba8aebe68d4f082b670ee", "auth-recovery-v1.js": "03c57def8eafd6fe2d53421b0da91ee2db6f6dd0", "docs/privacy-account-deletion.md": "163ffe7225e533d0f169121bcf259715772aeb1d", "frontend/member/api-adapter-v33d.js": "92bdcbc244fffceb2b92d18c4d8209c44d1befba", "gate1-email-verification-e2e.mjs": "bd22012c84235ffb27d929854311f47f23b2bd26", "gate1-release-security-privacy-gate.mjs": "f32693d7be84a163d17a4c56f311514d6fa1b0df", "gate1-release-security-privacy-production.mjs": "abeefc32792af600f29bb943a36117a13da717eb", "member-design.mjs": "93537c05aabbd0acdbaf235ff54c79cf7eda4506", "member-experience/account-deletion.mjs": "a017e825cd74bb0f44c5c5db50e74070855e7575", "my-timber-app/tests/source.test.mjs": "b2497585d11415650e1be54c76845bf83ff03844", "my-timber-pwa/ui.mjs": "697c5d1d519b2b0579d733691de3265beece2a22", "preview/app-layout/refinement.mjs": "fd26a0d0564e7cadc17018f6668b25b0244546c0", "privacy-account-request-v1.js": "ff83bbdb3f0dcb531e3d794c58db1e164223f85a", "scripts/verify-my-timber-recording-fixes.mjs": "ca70453b0b13145950e6ce38a0bdcc945b7c1f20", "site/api-adapter-v32b.js": "5809f4bfc815d41ffc8102630654f7913abd0013", "tests/account-deletion-immediate.test.mjs": "51f92e591cc42225ad1a666de28212faa369cda3", "tests/auth-mail-delivery-reliability.test.mjs": "24daf6bb687c25810ccdcc1ceade38aecd877e37", "tests/discovery-repairs.test.mjs": "3a83e1f1ca779fac2e091abbc33c28beec0de22f", "worker.js": "d583d819dddc4f47fa2cff554c2e98141f4fa673"};const approved={"acquisition-activation/server.mjs": "496da813a348869725fbc32615e1809162e00bd3", "auth-delivery-v1.js": "f1b13f11a706d7ff289bd920595fe17cd5d46ecc", "auth-email-verification-v1.js": "dee72f89ad1ea23772aba8aebe68d4f082b670ee", "auth-recovery-page-v1.mjs": "858f3ae697518b81c01b5699d17b4c166880ddb9", "auth-recovery-v1.js": "ab2cfb7242c6ca6d14c0e0f3e82d91deacd32a3e", "docs/privacy-account-deletion.md": "163ffe7225e533d0f169121bcf259715772aeb1d", "frontend/member/api-adapter-v33d.js": "92bdcbc244fffceb2b92d18c4d8209c44d1befba", "frontend/member/my-timber-preview.html": "847a51d2a279ebcab320684453464d99d5892bcb", "gate1-auth-security-source-gate.mjs": "d568224598bf51b9a769f67962fa453f2aa379c2", "gate1-email-verification-e2e.mjs": "bd22012c84235ffb27d929854311f47f23b2bd26", "gate1-release-security-privacy-gate.mjs": "1392ce345207e2c832d29e9110c7d7d083f01079", "gate1-release-security-privacy-production.mjs": "abeefc32792af600f29bb943a36117a13da717eb", "hq-commerce-delivery.mjs": "be4cff15c3c2ed2f5d8eb6505c707f9bba62c2ef", "hq-commerce-delivery.test.mjs": "b50c73f9d13b3bd480d475a7cf2c22ede6b20af2", "hq-medicine-delivery-link.test.mjs": "0d087b7bb3256f9b6d44cd66f037f360f55ce126", "hq-mfa-readiness.mjs": "b5645ac97a175dc73f22552024f96aa0aca1a24b", "hq-mfa-readiness.test.mjs": "3036557571e2851e24bd5fa15395606accebdea0", "hq-service-job-runs.mjs": "f549d403276f2274fd0fd4ddfe24b23c14d4dc81", "hq-service-job-runs.test.mjs": "e8000dc2c49ba532fedec6f17ec82cc2ffa05a2f", "medicine-commerce-v1.js": "c284ebd7651c5a1cc2dc241f0c86321f5a1dd58d", "member-design.mjs": "93537c05aabbd0acdbaf235ff54c79cf7eda4506", "member-experience/account-deletion.mjs": "a017e825cd74bb0f44c5c5db50e74070855e7575", "member-register-fastpath-v2.js": "f762903ddbe63d77fc35b03f407569ecff537e78", "my-timber-app/tests/source.test.mjs": "b2497585d11415650e1be54c76845bf83ff03844", "my-timber-pwa/ui.mjs": "697c5d1d519b2b0579d733691de3265beece2a22", "password-policy-v1.js": "f50db0bb251a0291b5156bf8be59e4d6a08d0589", "preview/app-layout/refinement.mjs": "fd26a0d0564e7cadc17018f6668b25b0244546c0", "privacy-account-request-v1.js": "3504b2d9de64a5eb5cb3255f8aacbc66e4c25d54", "scripts/verify-my-timber-recording-fixes.mjs": "ca70453b0b13145950e6ce38a0bdcc945b7c1f20", "shift-coach/worker.mjs": "cac47f53852e2275e4996d11d719b2518ee055ad", "site/api-adapter-v32b.js": "5809f4bfc815d41ffc8102630654f7913abd0013", "tests/account-deletion-immediate.test.mjs": "8f41cc95eedd4c0acb3002964e913a032a055864", "tests/auth-mail-delivery-reliability.test.mjs": "24daf6bb687c25810ccdcc1ceade38aecd877e37", "tests/b1-reset-page.test.mjs": "c84d224e5be5663812e7cd79b9300c9e4eb58f84", "tests/discovery-repairs.test.mjs": "3a83e1f1ca779fac2e091abbc33c28beec0de22f", "tests/member-auth-ui-v2.test.mjs": "9eada61169fe8d2ac036ba7daf53ea122a239cfe", "tests/password-policy-v1.test.mjs": "d77b3ba9705cb7a650e2432be6c630602f048fb8", "tests/refund-email.test.mjs": "8b6d73df9450ea9a662b45d6cb7222ed54098e5a", "transactional-email-v1.js": "3c1df48fb0fcdfbf3a1f122c9c3c41e2adf7c17c", "worker-entry-v6.js": "cc2d7dd76a495c88c2a42575a61dc62a7e9babed", "worker.js": "c0b99177a62e8cf4c9a7e0fa92c962f2614152db"};for(const [path,pin]of Object.entries(original)){assert(Object.hasOwn(approved,path));assert.equal(RECORDING_REPAIR_BLOBS[path],approved[path]);if(!['auth-recovery-v1.js','privacy-account-request-v1.js','tests/account-deletion-immediate.test.mjs','gate1-release-security-privacy-gate.mjs','worker.js'].includes(path))assert.equal(approved[path],pin);}});

test('original comparison qualifier accepts only exact native-qualified reader wiring at the actual current head',async()=>{
 const {approvedSourceComparison,originalApprovedComparisonSource}=await import('../release/approved-source-comparison-20261024.mjs');
 const {deltas}=await import('../release/approved-source-comparison-data-20261024.mjs');
 const path='release/root-share-preview-scope.mjs',head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const current=readFileSync(path,'utf8'),pin=execFileSync('git',['rev-parse',head+':'+path],{encoding:'utf8'}).trim(),d=deltas[path];
 const original=execFileSync('git',['cat-file','blob',d.original],{encoding:'utf8'});
 withMemberRecordingQualification(()=>{
  assert.notEqual(pin,d.current);assert.throws(()=>originalApprovedComparisonSource(path,current),/Approved comparison current bytes changed/);
  assert.equal(approvedSourceComparison(path,pin,head),d.original);
  assert.equal(approvedSourceComparison(path,current,head),original);
  const forged=pin+'unreviewed';assert.equal(approvedSourceComparison(path,forged,head),forged);
  assert.equal(approvedSourceComparison(path,pin,'200ff3dd4c4e01505f418e31149389da0f81fe80'),pin);
 });
});

test('retained real native frames recheck supplied callbacks and changed working source',()=>{
 const fixture=mkdtempSync(tmpdir()+'/native-frame-retained-');
 try{
  execFileSync('git',['clone','--quiet','--no-hardlinks',process.cwd(),fixture],{encoding:'utf8',maxBuffer:64e6});
  const code=String.raw`import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {withMemberRecordingQualification} from './release/member-recording-repair-20261024.mjs';
import {actualNavigationOuterFrame,assertActualNavigationFrame} from './release/recorded-week-navigation-outer-frame-20261018.mjs';
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
withMemberRecordingQualification(()=>{
 const frames=[];for(let i=0;i<3;i++){const f=actualNavigationOuterFrame();assertActualNavigationFrame(f);f.finish();frames.push(f);}
 assert.equal(frames[1],frames[2]);assert(Object.isFrozen(frames[2].record));
 let calls=0,corrupt=false;
 const source=(r,p)=>{calls++;return corrupt?'0'.repeat(40):execFileSync('git',['rev-parse',(r==='HEAD'?head:r)+':'+p],{encoding:'utf8'}).trim();};
 const projected=frames[2].projectRead(source),path='wrangler.jsonc';
 assert.equal(projected('HEAD',path),frames[2].blob('HEAD',path));const beforeCalls=calls;
 assert.equal(projected('HEAD',path),frames[2].blob('HEAD',path));assert(calls>beforeCalls,'Supplied readers must run on every access');
 corrupt=true;assert.throws(()=>projected('HEAD',path),/source|supplied|changed|drift/i);
 const working='docs/privacy-account-deletion.md',before=readFileSync(working);
 try{writeFileSync(working,Buffer.concat([before,Buffer.from('\nIsolated native frame source mutation\n')]));assert.throws(()=>frames[2].finish(),/source|working|changed/i);}finally{writeFileSync(working,before);}
});`;
  execFileSync(process.execPath,['--input-type=module','-e',code],{cwd:fixture,encoding:'utf8',maxBuffer:64e6});
 }finally{rmSync(fixture,{recursive:true,force:true});}
});
