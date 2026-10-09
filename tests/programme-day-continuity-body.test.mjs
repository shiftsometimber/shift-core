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
import {restoreBookVoiceCopy} from '../book-voice.mjs';
test('support body includes the exact approved outer Worker addition in its actual position',()=>{
 const path='/weight-loss-support-for-men',addition=ANSWER_DEPTH_ADDITIONS.find(d=>d.path===path),base=continuityPages[path].body;
 const actual=restoreBookVoiceCopy(path,improveAnswerDepth('<html><head></head><main>'+base+'</main></html>',path)).match(/<main>([\s\S]*?)<\/main>/)[1];
 assert.equal(approvedContinuityBody(path),actual);assert.doesNotThrow(()=>assertApprovedContinuityBody(path,actual));assert.throws(()=>assertApprovedContinuityBody(path,base));
 for(const changed of [actual.replace(addition.id,'unapproved'),actual.replace('Examples of how the different parts fit together','Unapproved substitution'),actual.replace(/href="[^"]+"/,'href="/unapproved"'),actual+restoreBookVoiceCopy(path,addition.html)])assert.throws(()=>assertApprovedContinuityBody(path,changed));
});
