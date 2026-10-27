import test from 'node:test';
import assert from 'node:assert/strict';
import {memberSupportPolicy,validReturnDate} from '../support-policy.mjs';
test('approved away wording requires a real date and suspends the usual response promise',()=>{
 const p=memberSupportPolicy({MEMBER_SUPPORT_AWAY:'true',MEMBER_SUPPORT_AWAY_RETURN_ON:'2026-11-04',MEMBER_SUPPORT_COVER_ACTIVE:'true'});
 assert.match(p.awayMessage,/Matt's away until 4 November 2026/);
 assert.match(p.awayMessage,/Messages are saved and he'll reply when he's back/);
 assert.equal(p.replyTarget,null);assert.equal(p.coverOwner,'Linda');assert.equal(p.coverActive,true);
 assert.doesNotMatch(p.awayMessage,/\[date\]|within one working day|24\/7|instant/i);
});
test('unfilled date and impossible calendar dates never reach a member',()=>{
 for(const value of ['[date]','2026-02-30','2026-11-31','2026-1-1',''])assert.equal(validReturnDate(value),null);
 const p=memberSupportPolicy({MEMBER_SUPPORT_AWAY:'true',MEMBER_SUPPORT_AWAY_MESSAGE:"Matt's away until [date]."});
 assert.equal(p.awayMessageConfigured,false);assert.doesNotMatch(p.awayMessage,/\[date\]/);assert.equal(p.replyTarget,null);
 assert.equal(memberSupportPolicy({}).away,false);assert.equal(memberSupportPolicy({}).coverActive,false);
 assert.equal(memberSupportPolicy({}).replyTarget,'Within one working day');
});
