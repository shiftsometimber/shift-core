import {qualifyJoinedSuccessor,withJoinedSuccessorQualification} from './my-timber-joined-look-scope-20261024.mjs';
import assert from 'node:assert/strict';
import {readFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {immutableHistorySourceHead,withImmutableHistoryVerification,immutableHistoryExecFileSync} from './immutable-git-facts.mjs';
import inverses from './member-recording-repair-inverses-20261024.json' with {type:'json'};
export const RECORDING_REPAIR_BASE="200ff3dd4c4e01505f418e31149389da0f81fe80";
export const RECORDING_REPAIR_PAYLOAD="ba413c12716fffd050f71039a9ded68f6ae96ee2";
export const RECORDING_REPAIR_BLOBS=Object.freeze({
  "acquisition-activation/server.mjs": "496da813a348869725fbc32615e1809162e00bd3",
  "auth-delivery-v1.js": "f1b13f11a706d7ff289bd920595fe17cd5d46ecc",
  "auth-email-verification-v1.js": "dee72f89ad1ea23772aba8aebe68d4f082b670ee",
  "auth-recovery-page-v1.mjs": "858f3ae697518b81c01b5699d17b4c166880ddb9",
  "auth-recovery-v1.js": "ab2cfb7242c6ca6d14c0e0f3e82d91deacd32a3e",
  "docs/privacy-account-deletion.md": "163ffe7225e533d0f169121bcf259715772aeb1d",
  "frontend/member/api-adapter-v33d.js": "92bdcbc244fffceb2b92d18c4d8209c44d1befba",
  "frontend/member/my-timber-preview.html": "847a51d2a279ebcab320684453464d99d5892bcb",
  "gate1-auth-security-source-gate.mjs": "d568224598bf51b9a769f67962fa453f2aa379c2",
  "gate1-email-verification-e2e.mjs": "bd22012c84235ffb27d929854311f47f23b2bd26",
  "gate1-release-security-privacy-gate.mjs": "1392ce345207e2c832d29e9110c7d7d083f01079",
  "gate1-release-security-privacy-production.mjs": "abeefc32792af600f29bb943a36117a13da717eb",
  "hq-commerce-delivery.mjs": "be4cff15c3c2ed2f5d8eb6505c707f9bba62c2ef",
  "hq-commerce-delivery.test.mjs": "b50c73f9d13b3bd480d475a7cf2c22ede6b20af2",
  "hq-medicine-delivery-link.test.mjs": "0d087b7bb3256f9b6d44cd66f037f360f55ce126",
  "hq-mfa-readiness.mjs": "b5645ac97a175dc73f22552024f96aa0aca1a24b",
  "hq-mfa-readiness.test.mjs": "3036557571e2851e24bd5fa15395606accebdea0",
  "hq-service-job-runs.mjs": "f549d403276f2274fd0fd4ddfe24b23c14d4dc81",
  "hq-service-job-runs.test.mjs": "e8000dc2c49ba532fedec6f17ec82cc2ffa05a2f",
  "medicine-commerce-v1.js": "c284ebd7651c5a1cc2dc241f0c86321f5a1dd58d",
  "member-design.mjs": "93537c05aabbd0acdbaf235ff54c79cf7eda4506",
  "member-experience/account-deletion.mjs": "a017e825cd74bb0f44c5c5db50e74070855e7575",
  "member-register-fastpath-v2.js": "f762903ddbe63d77fc35b03f407569ecff537e78",
  "my-timber-app/tests/source.test.mjs": "b2497585d11415650e1be54c76845bf83ff03844",
  "my-timber-pwa/ui.mjs": "697c5d1d519b2b0579d733691de3265beece2a22",
  "password-policy-v1.js": "f50db0bb251a0291b5156bf8be59e4d6a08d0589",
  "preview/app-layout/refinement.mjs": "fd26a0d0564e7cadc17018f6668b25b0244546c0",
  "privacy-account-request-v1.js": "3504b2d9de64a5eb5cb3255f8aacbc66e4c25d54",
  "scripts/verify-my-timber-recording-fixes.mjs": "ca70453b0b13145950e6ce38a0bdcc945b7c1f20",
  "shift-coach/worker.mjs": "cac47f53852e2275e4996d11d719b2518ee055ad",
  "site/api-adapter-v32b.js": "5809f4bfc815d41ffc8102630654f7913abd0013",
  "tests/account-deletion-immediate.test.mjs": "8f41cc95eedd4c0acb3002964e913a032a055864",
  "tests/auth-mail-delivery-reliability.test.mjs": "24daf6bb687c25810ccdcc1ceade38aecd877e37",
  "tests/b1-reset-page.test.mjs": "c84d224e5be5663812e7cd79b9300c9e4eb58f84",
  "tests/discovery-repairs.test.mjs": "3a83e1f1ca779fac2e091abbc33c28beec0de22f",
  "tests/member-auth-ui-v2.test.mjs": "9eada61169fe8d2ac036ba7daf53ea122a239cfe",
  "tests/password-policy-v1.test.mjs": "d77b3ba9705cb7a650e2432be6c630602f048fb8",
  "tests/refund-email.test.mjs": "8b6d73df9450ea9a662b45d6cb7222ed54098e5a",
  "transactional-email-v1.js": "3c1df48fb0fcdfbf3a1f122c9c3c41e2adf7c17c",
  "worker-entry-v6.js": "cc2d7dd76a495c88c2a42575a61dc62a7e9babed",
  "worker.js": "c0b99177a62e8cf4c9a7e0fa92c962f2614152db"
});
export const RECORDING_REPAIR_PATHS=Object.freeze(Object.keys(RECORDING_REPAIR_BLOBS));
export const RECORDING_REPAIR_REGISTRATION=Object.freeze(["release/member-recording-repair-20261024.mjs", "tests/member-recording-repair-admission-20261024.test.mjs", "release/member-recording-repair-inverses-20261024.json", "release/my-shift-release-scope-20261024.mjs", "release/approved-source-comparison-20261024.mjs", "release/member-design-scope.mjs", "release/app-scope.mjs", ".github/workflows/seo-discovery-proof.yml", "release/app-preflight.mjs", "tests/approved-ranking-release.test.mjs", "tests/seo-discovery-release.test.mjs", "release/recorded-week-navigation-outer-frame-20261018.mjs", "tests/recorded-week-navigation-preservation-20261018.test.mjs", "release/immutable-git-facts.mjs", "release/seo-audit-scope-20261016.mjs", "release/scoped-native-projection-evidence.mjs", "tests/scoped-native-projection-evidence.test.mjs", "release/food-diary-london-date-scope-20261015.mjs", "release/ci-execution-scope-20261014.mjs", "release/release-machinery-repair-scope-20261014.mjs", "release/metrics-connection-scope.mjs", "release/book-voice-scope.mjs", "release/device-health-scope.mjs", "release/finite-growth-scope.mjs", "release/footer-scope.mjs", "release/member-acceptance-scope.mjs", "release/member-consent-repair-scope.mjs", "release/my-timber-progress-journey-scope.mjs", "release/my-timber-week-scope.mjs", "release/organic-followthrough-scope.mjs", "release/photo-acceptance-maintenance-scope.mjs", "release/photo-calendar-scope.mjs", "release/public-wording-scope.mjs", "release/recipe-image-scope.mjs", "release/root-share-completion-scope.mjs", "release/root-share-preview-scope.mjs", "release/seo-context-scope.mjs", "release/seo-discovery-scope.mjs", "release/seo-link-repairs-scope.mjs", "release/seo-technical-scope.mjs", "release/six-topic-seo-scope.mjs", "shift-coach/release-contract.mjs", "medicines-watch/scheduler.test.mjs"]);
export const RECORDING_REPAIR_RECEIPT='release/member-recording-repair-20261024.json';
export const RECORDING_REPAIR_AUTHORITY=Object.freeze({"owner": "Matt", "instruction": "Arh ok….. sort then please; SHIFT — BREAK THE BOTTLENECK AND FINISH THE APPROVED WORK: eliminate repeated Git subprocesses and duplicate full-file scans while retaining underlying safety assertions, mutation checks and current-source protection.", "accountDeletion": "Deletion / cancel my account needs to be an immediate thing. Not send it off", "homepage": false, "newAppleSubmission": false, "messaging": false, "realAccountDeletionTest": false, "personalHealthRead": false, "backendCompletion": "Matt: SHIFT — CONSOLIDATE RELEASE OWNERSHIP AND FINISH THE BACKEND", "passwordPolicy": "Owner-approved PR1415 ten characters with capital and special character", "clinicalActivation": false, "realCharge": false, "stockCommitment": false});
const actualReadFileSync=readFileSync,actualLstatSync=lstatSync;
const git=(...args)=>immutableHistoryExecFileSync('git',args,{encoding:'utf8',maxBuffer:64e6}).trimEnd();
const bytes=(ref,path)=>immutableHistoryExecFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:64e6});
const sorted=values=>[...values].sort();
const changed=(a,b)=>git('diff','--no-renames','--name-only',a,b).split('\n').filter(Boolean);
const oid=value=>createHash('sha1').update('blob '+Buffer.byteLength(value)+'\0').update(value).digest('hex');
export function validateRecordingRepairReceipt(receipt){
 assert.deepEqual(Object.keys(receipt).sort(),['authority','base','kind','payload','payloadBlobs','registrationSource'].sort(),'Only the finite repair receipt fields are allowed');
 assert.equal(receipt.kind,'EXACT_MEMBER_RECORDING_REPAIR_20261024');
 assert.equal(receipt.base,RECORDING_REPAIR_BASE);assert.equal(receipt.payload,RECORDING_REPAIR_PAYLOAD);
 assert.deepEqual(receipt.payloadBlobs,RECORDING_REPAIR_BLOBS);assert.deepEqual(receipt.authority,RECORDING_REPAIR_AUTHORITY);
 assert.match(receipt.registrationSource,/^[a-f0-9]{40}$/);return receipt;
}
let cached=null,qualificationDepth=0;
export function verifyMemberRecordingRepair(suppliedReceipt){
 if(!qualificationDepth)return withMemberRecordingQualification(()=>verifyMemberRecordingRepair(suppliedReceipt));
 const frozen=immutableHistorySourceHead(),head=frozen??git('rev-parse','HEAD');
 const successor=qualifyJoinedSuccessor(head),legacyHead=successor.legacyHead;
 successor.assertBinding(head);
 if(frozen&&qualificationDepth&&cached?.head===head){for(const [path,pin]of cached.filePins){const stat=actualLstatSync(path);assert(stat.isFile()&&!stat.isSymbolicLink(),'Regular repair file required: '+path);assert.equal(oid(actualReadFileSync(path)),pin,'Actual repair bytes changed: '+path);}if(suppliedReceipt)assert.deepEqual(suppliedReceipt,cached.receipt,'Native repair receipt must not be substituted');return cached;}
 assert.equal(git('diff','--name-only','HEAD','--'),'','Repair worktree must be clean');
 assert.equal(git('diff','--cached','--name-only','--'),'','Repair index must be clean');
 // Only old finite comparisons use the independently qualified predecessor.
 // immutableHistorySourceHead and every proof returned to callers stay actual.
 const receipt=validateRecordingRepairReceipt(JSON.parse(bytes(legacyHead,RECORDING_REPAIR_RECEIPT)));
 if(suppliedReceipt)assert.deepEqual(suppliedReceipt,receipt,'Native repair receipt must not be substituted');
 for(const [a,b]of [[receipt.base,receipt.payload],[receipt.payload,receipt.registrationSource],[receipt.registrationSource,legacyHead]])git('merge-base','--is-ancestor',a,b);
 assert.deepEqual(changed(receipt.base,receipt.payload),sorted(RECORDING_REPAIR_PATHS),'Only the exact tested member repair payload is allowed');
 assert.deepEqual(changed(receipt.payload,receipt.registrationSource).filter(path=>path!==RECORDING_REPAIR_RECEIPT),sorted(RECORDING_REPAIR_REGISTRATION),'Only the bounded registration module and tests may be added');
 assert.deepEqual(changed(receipt.registrationSource,legacyHead),[RECORDING_REPAIR_RECEIPT],'No unreviewed registration tail');
 for(const [path,pin]of Object.entries(RECORDING_REPAIR_BLOBS)){
  assert.equal(git('rev-parse',receipt.payload+':'+path),pin,'Immutable repair payload changed: '+path);
  assert.equal(git('rev-parse',legacyHead+':'+path),pin,'Current repair payload changed: '+path);
 }
 for(const path of RECORDING_REPAIR_REGISTRATION)assert.equal(bytes(legacyHead,path),bytes(receipt.registrationSource,path),'Registration source changed: '+path);
 for(const path of [...RECORDING_REPAIR_PATHS,...RECORDING_REPAIR_REGISTRATION,RECORDING_REPAIR_RECEIPT]){
  assert(git('ls-tree',legacyHead,'--',path).startsWith('100644 blob '),'Regular repair file required: '+path);
  const stat=actualLstatSync(path);assert(stat.isFile()&&!stat.isSymbolicLink(),'Regular worktree file required: '+path);
  const actual=actualReadFileSync(path),comparison=Object.hasOwn(successor.predecessorPins,path)?successor.restoreFile(path,actual):actual;
  assert.equal(oid(comparison),git('rev-parse',legacyHead+':'+path),'Actual repair bytes changed: '+path);
 }
 for(const [path,data]of Object.entries(inverses))assert.equal(originalRecordingMaintenance(path,bytes(legacyHead,path)),bytes(RECORDING_REPAIR_BASE,path),'Every original source assertion must remain: '+path);
 const paths=[...RECORDING_REPAIR_PATHS,...RECORDING_REPAIR_REGISTRATION,RECORDING_REPAIR_RECEIPT],filePins=Object.freeze(paths.map(path=>Object.freeze([path,oid(actualReadFileSync(path))])));
 const proof=Object.freeze({head,legacyHead,receipt,paths:RECORDING_REPAIR_PATHS,filePins});if(frozen&&qualificationDepth)cached=proof;return proof;
}
// This qualifies a finite successor; it does not replace or bypass the existing
// production admission, current-main guard, rollback or live acceptance gates.
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const proof=verifyMemberRecordingRepair();console.log(JSON.stringify({source:proof.head,paths:proof.paths.length,state:'finite_payload_qualified_not_deployed'}));}

export function originalRecordingMaintenance(path,value){
 const delta=inverses[path];assert(delta,'Finite repair maintenance path required');assert.equal(oid(value),delta.current,'Exact repair maintenance source required');
 for(const edit of [...delta.edits].reverse()){assert.equal(value.slice(edit.start,edit.start+edit.after.length),edit.after,'Exact repair maintenance inverse changed');value=value.slice(0,edit.start)+edit.before+value.slice(edit.start+edit.after.length);}
 assert.equal(oid(value),delta.original,'Every original maintenance byte must remain');return value;
}
export function memberRecordingComparisonValue(path,value,requestedHead){
 if(!qualificationDepth)return withMemberRecordingQualification(()=>memberRecordingComparisonValue(path,value,requestedHead));
 const head=immutableHistorySourceHead()??git('rev-parse','HEAD');
 if(requestedHead&&requestedHead!==head)return value;
 const successor=qualifyJoinedSuccessor(head);successor.assertBinding(head);
 value=successor.comparisonValue(path,value);
 const allowed=[...RECORDING_REPAIR_PATHS,...RECORDING_REPAIR_REGISTRATION];if(!allowed.includes(path))return value;
 let pin;try{pin=git('rev-parse',successor.legacyHead+':'+path);}catch{return value;}
 const identifier=value===pin,content=(typeof value==='string'||Buffer.isBuffer(value))&&oid(value)===pin;if(!identifier&&!content)return value;
 const proof=verifyMemberRecordingRepair();assert.equal(proof.head,head);
 let old;try{old=git('rev-parse',RECORDING_REPAIR_BASE+':'+path);}catch{return value;}
 return identifier?old:Buffer.isBuffer(value)?Buffer.from(bytes(RECORDING_REPAIR_BASE,path)):bytes(RECORDING_REPAIR_BASE,path);
}
export function recordingRepairLegacyPaths(){const proof=verifyMemberRecordingRepair();const successor=qualifyJoinedSuccessor(proof.head);return [...new Set([...RECORDING_REPAIR_PATHS,...RECORDING_REPAIR_REGISTRATION,RECORDING_REPAIR_RECEIPT,...successor.paths])];}

export function withMemberRecordingQualification(callback){
 if(qualificationDepth){qualificationDepth++;try{return callback();}finally{qualificationDepth--;}}
 return withJoinedSuccessorQualification(()=>{cached=null;qualificationDepth=1;try{return withImmutableHistoryVerification(callback);}finally{qualificationDepth=0;cached=null;}});
}
