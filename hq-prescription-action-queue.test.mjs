import test from 'node:test';
import assert from 'node:assert/strict';
import {clinicalNotificationCandidate,intentContent} from './hq-event-notifications.mjs';
const record='11111111-1111-4111-8111-111111111111';
const row={id:'pharmacy:22222222-2222-4222-8222-222222222222:12',event_id:'22222222-2222-4222-8222-222222222222',recipient_user_id:12,recipient_kind:'hq',template:'dispensing_action_needed',link:'/clinical-portal/dispensing?order=TEST-RX-ORDER',created_at:'2026-10-24T20:00:00.000Z'};
test('assigned pharmacy handover becomes a review-only action with the exact dispensing link',()=>{
 const candidate=clinicalNotificationCandidate(row);assert.equal(candidate.kind,'hq_user');assert.equal(candidate.user,12);assert.equal(candidate.template,'dispensing_action_needed');assert.equal(candidate.link,row.link);assert.equal(candidate.source,'clinical_case_outbox');
 const content=intentContent({...candidate,recipient_kind:candidate.kind});assert.match(content.subject,/pharmacy review/);assert(content.body.includes('https://hq.shiftsometimber.co.uk'+row.link));assert(!content.body.includes('undefined'));assert(!content.body.includes('TEST MEDICINE'));
});
test('clinician and member action links retain their current destinations',()=>{
 const clinician=clinicalNotificationCandidate({...row,template:'reviewer_case_update',link:'/?view=clinical&record='+record});assert.equal(clinician.link,'/clinical-portal?record='+record);assert.equal(clinician.template,'reviewer_case_update');
 const member=clinicalNotificationCandidate({...row,recipient_kind:'member',recipient_user_id:44,template:'member_action_needed',link:'/member/treatment-records?record='+record});assert.equal(member.template,'member_action_needed');assert.equal(member.kind,'member');assert.equal(member.user,44);
});
test('unknown, foreign and mismatched clinical destinations cannot become review drafts',()=>{
 for(const change of [{recipient_kind:'unknown'},{link:'https://evil.invalid/order'},{link:'/?view=clinical&record='+record},{template:'reviewer_case_update'},{link:'/clinical-portal/dispensing?order=TEST&redirect=evil'}])assert.equal(clinicalNotificationCandidate({...row,...change}),null);
});
