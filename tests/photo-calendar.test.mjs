import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('frontend/member/member-progress-v1.js','utf8');
const helper=source.slice(source.indexOf('  function photoCalendarTimestamp(on){'),source.indexOf('  const photoDate=on=>'));
const timestamp=Function(helper+'return photoCalendarTimestamp;')();
test('the actual BST midnight failure preserves the selected London date and original future cutoff',()=>{
 const now=Date.parse('2026-10-13T23:36:01Z'),on='2026-10-14',before=on+'T00:00:00Z',after=timestamp(on);
 assert(Date.parse(before)>now+60000);assert.equal(after,'2026-10-14T00:00:00+01:00');assert(Date.parse(after)<=now+60000);assert.equal(after.slice(0,10),on);
});
test('London midnight is correct across GMT, BST, both DST transition dates, leap dates and year rollover',()=>{
 for(const [on,expected] of [['2026-01-01','Z'],['2026-03-29','Z'],['2026-03-30','+01:00'],['2026-07-01','+01:00'],['2026-10-25','+01:00'],['2026-10-26','Z'],['2026-12-31','Z'],['2027-01-01','Z'],['2028-02-29','Z']]){
  const actual=timestamp(on);assert.equal(actual,on+'T00:00:00'+expected);const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(actual)),get=k=>parts.find(p=>p.type===k).value;
  assert.equal(get('year')+'-'+get('month')+'-'+get('day'),on);assert.equal(get('hour')+':'+get('minute'),'00:00');
 }
});
test('future dates remain future and malformed or impossible dates are refused',()=>{
 const now=Date.parse('2026-10-13T23:36:01Z');assert(Date.parse(timestamp('2026-10-15'))>now+60000);
 for(const on of ['',null,'2026-2-01','2026-02-30','2026-13-01','2026-10-14T00:00:00Z','unknown'])assert.throws(()=>timestamp(on));
});
test('the browser caller uses the corrected timestamp while the existing date label and max remain London based',()=>{
 assert(source.includes('capturedAt:photoCalendarTimestamp(form.elements.on.value)'));
 assert(source.includes("const today=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'});form.elements.on.value=today;form.elements.on.max=today;"));
 assert(source.includes("captured_at.slice(0,10)===on"));
});
