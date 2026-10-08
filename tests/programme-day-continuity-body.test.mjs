import test from 'node:test';import assert from 'node:assert/strict';
import {approvedContinuityBody,assertApprovedContinuityBody,approvedContinuityMinimumWords} from '../release/public-continuity-body-proof.mjs';
import {continuityPages} from '../public-continuity.mjs';
test('husband-help proof uses the same approved book voice as the actual response',()=>{
 const body=approvedContinuityBody('/husband-help');
 assert(body.includes('It gives him some control without pretending you have the answer.'));
 assert(!body.includes('Let his answer guide what you do next.'));
 assert.doesNotThrow(()=>assertApprovedContinuityBody('/husband-help','<main>'+body+'</main>'));
});
test('every approved continuity body remains exact and rejects deleted copy or a changed destination',()=>{
 for(const path of Object.keys(continuityPages)){
  const body=approvedContinuityBody(path);assert.doesNotThrow(()=>assertApprovedContinuityBody(path,'<main>'+body+'</main>'));
  assert.throws(()=>assertApprovedContinuityBody(path,body.slice(0,-20)));
  assert.throws(()=>assertApprovedContinuityBody(path,body.replace(/href="[^"]+"/,'href="/unapproved"')));
 }
 assert.throws(()=>approvedContinuityBody('/unapproved'));
});

test('approved 332-word provider body passes its exact-copy gate without a contradictory 400-word requirement',()=>{
 assert.equal(approvedContinuityMinimumWords('/my-timber-for-providers'),332);assert.equal(approvedContinuityMinimumWords('/life-back'),400);assert.equal(approvedContinuityMinimumWords('/husband-help'),180);
 const body=approvedContinuityBody('/my-timber-for-providers');assert.doesNotThrow(()=>assertApprovedContinuityBody('/my-timber-for-providers',body));assert.throws(()=>assertApprovedContinuityBody('/my-timber-for-providers',body.slice(0,-100)));
});