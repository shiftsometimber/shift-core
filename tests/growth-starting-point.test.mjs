import test from 'node:test';import assert from 'node:assert/strict';
import {OWNER_RUNTIME} from '../release/owner-captured-runtime.mjs';
import {SUPPORT_RUNTIME} from '../release/live-support-runtime.mjs';
import {verifyCapturedStartingPoint} from '../release/growth-starting-point.mjs';

const active={id:'deployment'},version={id:'version'},proof={kind:'proof'};
const check=kind=>verifyCapturedStartingPoint({kind,run:null},{ownerCapturedProof:proof},active,version,{
 verifyOwner:async(a,v)=>{assert.equal(kind,OWNER_RUNTIME.kind);assert.equal(a,active);assert.equal(v,version);return proof;},
 verifySupport:async(a,v)=>{assert.equal(kind,SUPPORT_RUNTIME.kind);assert.equal(a,active);assert.equal(v,version);return proof;}
});

test('captured owner and provider-matched runtimes are reverified without a fabricated hosted run',async()=>{
 assert.equal(await check(OWNER_RUNTIME.kind),proof);assert.equal(await check(SUPPORT_RUNTIME.kind),proof);
});
test('hosted, unknown and changed captured proofs fail closed',async()=>{
 await assert.rejects(()=>verifyCapturedStartingPoint({kind:SUPPORT_RUNTIME.kind,run:123},{ownerCapturedProof:proof},active,version,{verifySupport:async()=>proof}));
 await assert.rejects(()=>verifyCapturedStartingPoint({kind:'unknown',run:null},{ownerCapturedProof:proof},active,version,{verifyOwner:async()=>proof}));
 await assert.rejects(()=>verifyCapturedStartingPoint({kind:OWNER_RUNTIME.kind,run:null},{ownerCapturedProof:{kind:'other'}},active,version,{verifyOwner:async()=>proof}));
});
