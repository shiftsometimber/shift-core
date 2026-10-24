import test from 'node:test';
import assert from 'node:assert/strict';
import {myShiftHTML,myShiftStyles,myShiftRuntime,myShiftSections} from '../my-shift.mjs';
import {memberExperienceRoutes} from '../entry.mjs';
test('My Shift has all nine sections, authenticated profile controls and no sample records',()=>{
 const html=myShiftHTML({});assert.equal(myShiftSections.length,9);
 for(const [id]of myShiftSections){assert(html.includes('data-view="'+id+'"'));assert(html.includes('data-panel="'+id+'"'));}
 assert.match(html,/id="memberSessionStatus"/);assert.match(html,/id="memberDetailsForm"/);assert.match(html,/id="memberDetailsFields" disabled/);
 assert.doesNotMatch(html,/Alex Example|DEMO-1042|Simulate|26 October 2026|£169/);
});
test('routes are additive and private; writes and flag-off requests pass through',async()=>{
 for(const path of ['/member/my-shift','/member/my-shift.html','/my-shift','/assets/member-experience/my-shift.mjs','/assets/member-experience/my-shift.css']){
  const r=memberExperienceRoutes(new Request('https://shiftsometimber.co.uk'+path),{MEMBER_EXPERIENCE_V1_ENABLED:'true'});assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/no-store/);assert.match(r.headers.get('X-Robots-Tag'),/noindex/);assert.equal(r.headers.get('Vary'),'Cookie');
  assert.equal(await memberExperienceRoutes(new Request('https://shiftsometimber.co.uk'+path,{method:'HEAD'}),{MEMBER_EXPERIENCE_V1_ENABLED:'true'}).text(),'');
 }
 assert.equal(memberExperienceRoutes(new Request('https://shiftsometimber.co.uk/member/my-shift'),{}),null);
 assert.equal(memberExperienceRoutes(new Request('https://shiftsometimber.co.uk/member/my-shift',{method:'POST'}),{MEMBER_EXPERIENCE_V1_ENABLED:'true'}),null);
});
test('real data runtime is read-only, safe DOM, expiry clearing, no invented prescription',()=>{
 new Function(myShiftRuntime);assert.match(myShiftRuntime,/credentials:'include'/);assert.match(myShiftRuntime,/cache:'no-store'/);assert.match(myShiftRuntime,/r\.status===401/);assert.match(myShiftRuntime,/pagehide/);assert.match(myShiftRuntime,/pageshow/);assert.match(myShiftRuntime,/DateTimeFormat.*timeZone:'Europe\/London'/);
 assert.doesNotMatch(myShiftRuntime,/innerHTML|localStorage|sessionStorage|method:'POST'|method:'PATCH'/);
 assert.match(myShiftRuntime,/Prescription documents are not connected here/);assert.match(myShiftRuntime,/An unavailable service does not mean there is nothing to action/);
});
test('approved cream inset and continuous flush green pulse retain pause/reduced-motion',()=>{
 assert.match(myShiftStyles,/\.ms-panel\{[^}]*padding:28px/);assert.match(myShiftStyles,/\.ms-panel\{padding:22px/);assert.match(myShiftStyles,/3s ease-in-out infinite/);assert.match(myShiftStyles,/box-shadow:inset/);assert.match(myShiftStyles,/prefers-reduced-motion:reduce/);assert.match(myShiftStyles,/data-motion=paused/);
 assert.doesNotMatch(myShiftStyles,/yellow|#f7edda|#f6e4bd/i);
});
