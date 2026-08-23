import test from 'node:test';
import assert from 'node:assert/strict';
import {canTransitionTreatmentJourney,neutralTreatmentJourneyEvent,treatmentOperationsRoutes,TREATMENT_JOURNEY_TRANSITIONS} from '../treatment-operations-v1.js';

test('responsible happy path is explicit and ordered',()=>{
  const path=['route_started','options_shown','account_created','selection_saved','terms_accepted','payment_pending','payment_authorised','assessment_in_progress','assessment_submitted','under_clinical_review','prescribed','dispensing','dispatched','delivered','maintenance_review'];
  for(let i=0;i<path.length-1;i++)assert.equal(canTransitionTreatmentJourney(path[i],path[i+1]),true,`${path[i]} -> ${path[i+1]}`);
});
test('unsafe skips and terminal replays are rejected',()=>{
  assert.equal(canTransitionTreatmentJourney('route_started','payment_authorised'),false);
  assert.equal(canTransitionTreatmentJourney('refunded','dispensing'),false);
  assert.equal(canTransitionTreatmentJourney('cancelled','payment_pending'),false);
  assert.deepEqual(TREATMENT_JOURNEY_TRANSITIONS.refunded,[]);
});
test('failure and recovery routes are explicit',()=>{
  assert.equal(canTransitionTreatmentJourney('payment_pending','payment_failed'),true);
  assert.equal(canTransitionTreatmentJourney('payment_failed','payment_pending'),true);
  assert.equal(canTransitionTreatmentJourney('under_clinical_review','not_prescribed'),true);
  assert.equal(canTransitionTreatmentJourney('not_prescribed','refund_pending'),true);
  assert.equal(canTransitionTreatmentJourney('pharmacy_unable_to_fulfil','refund_pending'),true);
  assert.equal(canTransitionTreatmentJourney('delivery_exception','dispatched'),true);
});
test('operational events stay neutral',()=>{
  const event=neutralTreatmentJourneyEvent({journeyId:7,fromStatus:'payment_pending',toStatus:'payment_failed',source:'payments',reasonCode:'AUTH_FAILED',idempotencyKey:'evt-1'});
  assert.deepEqual(event,{journeyId:7,fromStatus:'payment_pending',toStatus:'payment_failed',source:'payments',reasonCode:'AUTH_FAILED',idempotencyKey:'evt-1'});
  assert.equal(JSON.stringify(event).match(/medicine|dose|bmi|condition|side.effect/ig),null);
});
test('HQ operations reject non-HQ origin before storage',async()=>{
  const response=await treatmentOperationsRoutes(new Request('https://api.example/v1/hq/treatment-operations',{headers:{Origin:'https://evil.example','X-Shift-Admin-Key':'secret'}}),{ADMIN_API_KEY:'secret'});
  assert.equal(response.status,403);assert.equal((await response.json()).error,'origin_not_allowed');
});
test('unrelated paths are ignored',async()=>assert.equal(await treatmentOperationsRoutes(new Request('https://api.example/v1/other'),{}),null));
