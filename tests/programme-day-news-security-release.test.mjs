import test from 'node:test';import assert from 'node:assert/strict';
import {NEWS_SECURITY_BASE,NEWS_SECURITY_SOURCE,NEWS_SECURITY_PATHS,NEWS_SECURITY_MAINTENANCE,RECONCILIATION_MANIFEST,withoutNewsSecurityPolicy,verifyNewsSecurity} from '../release/approved-runtime-composition.mjs';
const old='return new Response(body,{status,headers});';
const current="import {withArticleResponsePolicy} from './babylove/response-policy.mjs';\nreturn withArticleResponsePolicy(new Response(body,{status,headers}));";
function fixture(){const c={proof:'EXACT_NEWS_SECURITY_POLICY_V1',base:NEWS_SECURITY_BASE,source:NEWS_SECURITY_SOURCE,maintenanceSource:'a'.repeat(40),paths:NEWS_SECURITY_PATHS,maintenancePaths:NEWS_SECURITY_MAINTENANCE,runtimeChanged:true,existingSecurityPolicyApplied:true,rollbackReceiptRun:37857802619,publicCopyChanged:false,clinicalAvailabilityChanged:false,customerDataChanged:false,stockChanged:false,memberBehaviourChanged:false,privacyAssertionsWeakened:false};
 return{c,o:{head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},diff:(a,b)=>a===c.base?c.paths:a===c.source?c.maintenancePaths:[RECONCILIATION_MANIFEST],content:(ref,path)=>path==='radar-news-pages-v1.js'?(ref===c.source?current:old):'unchanged workflow'}};
}
test('news policy is finite and allows only existing policy application with unchanged body, routes and production gates',()=>{const {c,o}=fixture();assert.equal(verifyNewsSecurity(c,o),c);assert.equal(withoutNewsSecurityPolicy(current),old);});
test('every raw payload and maintenance blob is checked before any historical mapping',()=>{for(const path of [...NEWS_SECURITY_PATHS,...NEWS_SECURITY_MAINTENANCE]){const {c,o}=fixture();o.read=(ref,p)=>ref==='HEAD'&&p===path?'changed':'same';assert.throws(()=>verifyNewsSecurity(c,o),/drift/);}});
test('unrelated content, source, workflow, privacy changes and missing ancestry fail closed',()=>{
 for(const flag of ['publicCopyChanged','clinicalAvailabilityChanged','customerDataChanged','stockChanged','memberBehaviourChanged','privacyAssertionsWeakened']){const {c,o}=fixture();c[flag]=true;assert.throws(()=>verifyNewsSecurity(c,o));}
 for(const key of ['proof','base','source','rollbackReceiptRun']){const {c,o}=fixture();c[key]='unknown';assert.throws(()=>verifyNewsSecurity(c,o));}
 {const {c,o}=fixture();o.diff=()=>[...c.paths,'member-state-fast-v1.js'];assert.throws(()=>verifyNewsSecurity(c,o));}
 {const {c,o}=fixture();o.ancestor=()=>{throw Error('missing ancestry')};assert.throws(()=>verifyNewsSecurity(c,o));}
 {const {c,o}=fixture();o.content=(ref,path)=>path==='radar-news-pages-v1.js'?(ref===c.source?current+'changed copy':old):'unchanged workflow';assert.throws(()=>verifyNewsSecurity(c,o),/Only the existing/);}
 {const {c,o}=fixture();o.content=(ref,path)=>path==='radar-news-pages-v1.js'?(ref===c.source?current:old):(ref===c.source?'weakened gate':'unchanged workflow');assert.throws(()=>verifyNewsSecurity(c,o),/Production gates/);}
});
