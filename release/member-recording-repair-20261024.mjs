import {qualifyJoinedSuccessor,withJoinedSuccessorQualification} from './my-timber-joined-look-scope-20261024.mjs';
import assert from 'node:assert/strict';
import {readFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {immutableHistorySourceHead,withImmutableHistoryVerification,immutableHistoryExecFileSync} from './immutable-git-facts.mjs';
import inverses from './member-recording-repair-inverses-20261024.json' with {type:'json'};
export const RECORDING_REPAIR_BASE="200ff3dd4c4e01505f418e31149389da0f81fe80";
export const RECORDING_REPAIR_PAYLOAD="8551b285de1b808c810d49163b5cea5a3b98e575";
export const RECORDING_REPAIR_BLOBS=Object.freeze({
  "acquisition-activation/server.mjs": "496da813a348869725fbc32615e1809162e00bd3",
  "auth-email-verification-v1.js": "dee72f89ad1ea23772aba8aebe68d4f082b670ee",
  "auth-recovery-v1.js": "03c57def8eafd6fe2d53421b0da91ee2db6f6dd0",
  "docs/privacy-account-deletion.md": "163ffe7225e533d0f169121bcf259715772aeb1d",
  "frontend/member/api-adapter-v33d.js": "92bdcbc244fffceb2b92d18c4d8209c44d1befba",
  "gate1-email-verification-e2e.mjs": "bd22012c84235ffb27d929854311f47f23b2bd26",
  "gate1-release-security-privacy-gate.mjs": "f32693d7be84a163d17a4c56f311514d6fa1b0df",
  "gate1-release-security-privacy-production.mjs": "abeefc32792af600f29bb943a36117a13da717eb",
  "member-design.mjs": "93537c05aabbd0acdbaf235ff54c79cf7eda4506",
  "member-experience/account-deletion.mjs": "a017e825cd74bb0f44c5c5db50e74070855e7575",
  "my-timber-app/tests/source.test.mjs": "b2497585d11415650e1be54c76845bf83ff03844",
  "my-timber-pwa/ui.mjs": "697c5d1d519b2b0579d733691de3265beece2a22",
  "preview/app-layout/refinement.mjs": "fd26a0d0564e7cadc17018f6668b25b0244546c0",
  "privacy-account-request-v1.js": "ff83bbdb3f0dcb531e3d794c58db1e164223f85a",
  "scripts/verify-my-timber-recording-fixes.mjs": "ca70453b0b13145950e6ce38a0bdcc945b7c1f20",
  "site/api-adapter-v32b.js": "5809f4bfc815d41ffc8102630654f7913abd0013",
  "tests/account-deletion-immediate.test.mjs": "51f92e591cc42225ad1a666de28212faa369cda3",
  "tests/auth-mail-delivery-reliability.test.mjs": "24daf6bb687c25810ccdcc1ceade38aecd877e37",
  "tests/discovery-repairs.test.mjs": "3a83e1f1ca779fac2e091abbc33c28beec0de22f",
  "worker.js": "d583d819dddc4f47fa2cff554c2e98141f4fa673"
});
export const RECORDING_REPAIR_PATHS=Object.freeze(Object.keys(RECORDING_REPAIR_BLOBS));
export const RECORDING_REPAIR_REGISTRATION=Object.freeze(['release/member-recording-repair-20261024.mjs','tests/member-recording-repair-admission-20261024.test.mjs','release/member-recording-repair-inverses-20261024.json','release/my-shift-release-scope-20261024.mjs','release/approved-source-comparison-20261024.mjs','release/member-design-scope.mjs','release/app-scope.mjs','.github/workflows/seo-discovery-proof.yml','release/app-preflight.mjs','tests/approved-ranking-release.test.mjs','tests/seo-discovery-release.test.mjs']);
export const RECORDING_REPAIR_RECEIPT='release/member-recording-repair-20261024.json';
export const RECORDING_REPAIR_AUTHORITY=Object.freeze({owner:'Matt',instruction:'Arh ok….. sort then please',accountDeletion:'Deletion / cancel my account needs to be an immediate thing. Not send it off',homepage:false,newAppleSubmission:false,messaging:false,realAccountDeletionTest:false,personalHealthRead:false});
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
