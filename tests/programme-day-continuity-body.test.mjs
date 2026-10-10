import {amendSupportingDocument} from '../obesity-awareness/candidate.mjs';
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
import {ANSWER_DEPTH_ADDITIONS,improveAnswerDepth} from '../public-seo-answer-depth.mjs';
import {renderContinuityDocument} from '../public-continuity.mjs';
test('support proof requires complete approved body with exact informational and answer-depth amendments',()=>{
 const path='/weight-loss-support-for-men',addition=ANSWER_DEPTH_ADDITIONS.find(x=>x.path===path),body=approvedContinuityBody(path);
 const response=amendSupportingDocument(path,improveAnswerDepth(renderContinuityDocument('<head></head><main>shell</main>',path),path));
 const qualifiedAddition=response.match(/<section\b[^>]*id="shift-depth-free-my-timber"[\s\S]*?<\/section>/)[0];
 assert(response.includes(body));assert(body.includes(qualifiedAddition));assert.equal(body.split(qualifiedAddition).length,2);
 assert.doesNotThrow(()=>assertApprovedContinuityBody(path,response));assert.doesNotMatch(body,/Look in Fit|12-week|Grub \+ Fit/);assert(body.includes('My meal is'));
 for(const changed of [body.replace(qualifiedAddition,''),body.replace(qualifiedAddition,qualifiedAddition.replace('Tuesday','Wednesday')),body.replace('href="/member/dashboard"','href="/unapproved"'),body.slice(0,-20)])assert.throws(()=>assertApprovedContinuityBody(path,changed));
 const historical=continuityPages[path].body;assert.throws(()=>assertApprovedContinuityBody(path,historical));
});
