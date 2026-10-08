import test from 'node:test';import assert from 'node:assert/strict';
import {MEMBER_PROOF_RETRY_BASE,MEMBER_PROOF_RETRY_SOURCE,MEMBER_PROOF_RETRY_PATHS,MEMBER_PROOF_RETRY_MAINTENANCE,RECONCILIATION_MANIFEST,withoutMemberProofTransport,verifyMemberProofRetry} from '../release/approved-runtime-composition.mjs';
const line="import {fetchPublicProof as fetch} from '../release/public-proof-fetch.mjs';\n";
function fixture(){const c={proof:'EXACT_MEMBER_PROOF_TRANSPORT_RETRY_V1',base:MEMBER_PROOF_RETRY_BASE,source:MEMBER_PROOF_RETRY_SOURCE,maintenanceSource:'a'.repeat(40),paths:MEMBER_PROOF_RETRY_PATHS,maintenancePaths:MEMBER_PROOF_RETRY_MAINTENANCE,runtimeChanged:false,readOnlyTransportRetryAdded:true,rollbackReceiptRun:37860725562,publicCopyChanged:false,clinicalAvailabilityChanged:false,customerDataChanged:false,stockChanged:false,memberBehaviourChanged:false,privacyAssertionsWeakened:false};
 return{c,o:{head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},diff:(a,b)=>a===c.base?c.paths:a===c.source?c.maintenancePaths:[RECONCILIATION_MANIFEST],content:(ref,path)=>path==='member-experience/verify-production-member.mjs'?(ref===c.source?line+'existing assertions':'existing assertions'):'unchanged runtime and gates'}};
}
test('finite member transport amendment leaves every verifier assertion and runtime byte intact',()=>{const {c,o}=fixture();assert.equal(verifyMemberProofRetry(c,o),c);assert.equal(withoutMemberProofTransport(line+'assertions'),'assertions');});
test('every raw payload and maintenance blob is checked before historical mapping',()=>{for(const path of [...MEMBER_PROOF_RETRY_PATHS,...MEMBER_PROOF_RETRY_MAINTENANCE]){const {c,o}=fixture();o.read=(ref,p)=>ref==='HEAD'&&p===path?'changed':'same';assert.throws(()=>verifyMemberProofRetry(c,o),/drift/);}});
test('changed assertions, runtime, workflow, unrelated sources and privacy weakening fail closed',()=>{
 for(const flag of ['runtimeChanged','publicCopyChanged','clinicalAvailabilityChanged','customerDataChanged','stockChanged','memberBehaviourChanged','privacyAssertionsWeakened']){const {c,o}=fixture();c[flag]=true;assert.throws(()=>verifyMemberProofRetry(c,o));}
 for(const key of ['proof','base','source','rollbackReceiptRun']){const {c,o}=fixture();c[key]='unknown';assert.throws(()=>verifyMemberProofRetry(c,o));}
 {const {c,o}=fixture();o.diff=()=>[...c.paths,'private-data.mjs'];assert.throws(()=>verifyMemberProofRetry(c,o));}
 {const {c,o}=fixture();o.ancestor=()=>{throw Error('missing')};assert.throws(()=>verifyMemberProofRetry(c,o));}
 {const {c,o}=fixture();o.content=(ref,path)=>path==='member-experience/verify-production-member.mjs'?(ref===c.source?line+'weakened assertions':'existing assertions'):'unchanged';assert.throws(()=>verifyMemberProofRetry(c,o),/assertion/);}
 for(const changed of ['.github/workflows/cloudflare-production-promote.yml','radar-news-pages-v1.js','worker-entry-v6.js']){const {c,o}=fixture();const original=o.content;o.content=(ref,path)=>ref===c.source&&path===changed?'changed':original(ref,path);assert.throws(()=>verifyMemberProofRetry(c,o),/remain unchanged/);}
});
