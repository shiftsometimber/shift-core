import test from 'node:test';
import assert from 'node:assert/strict';
import {assertRecordedWeekHolder,assertRecordedWeekRequest,assertRecordedWeekFacts,assertRecordedWeekIsolationMarker} from '../release/recorded-week-live-20261014.mjs';
import {buildRecordedWeek} from '../member-experience/treatment-week.mjs';
const site='https://shiftsometimber.co.uk',api='https://api.shiftsometimber.co.uk',email='shiftsometimber+structured-growth-11111111-2222-4333-8444-555555555555@gmail.com',source='a'.repeat(40),report={synthetic:true,realCustomerRecordsRead:false};
test('only the existing labelled growth holder and literal production source are admitted',()=>{
 assertRecordedWeekHolder({site,api,email,source,report});
 for(const change of [{email:'matt@example.com'},{email:'shiftsometimber+ordinary-acceptance-1791612417910@gmail.com'},{site:'http://localhost:3000'},{api:'https://fake.example'},{source:'HEAD'},{report:{...report,synthetic:false}},{report:{...report,realCustomerRecordsRead:true}}])assert.throws(()=>assertRecordedWeekHolder({site,api,email,source,report,...change}));
});
const root='/v1/member/treatment',ownedTreatmentId='owned-synthetic-record';
const note={treatmentId:ownedTreatmentId,note:'Fictional private release note example',operationId:'op',occurredAt:'2026-10-14T12:00:00Z'};
test('write guard admits only owned fictional records and explicit factual events',()=>{
 assertRecordedWeekRequest({url:api+root+'/week-note',method:'POST',body:note,ownedTreatmentId});
 assertRecordedWeekRequest({url:api+root+'/records',method:'POST',body:{medicine:'Mounjaro',nextAt:null,prescriptionDetails:'Fictional release acceptance only; no treatment or prescription. fixture',supply:0}});
 assertRecordedWeekRequest({url:api+root+'/events',method:'POST',ownedTreatmentId,body:{treatmentId:ownedTreatmentId,note:'Fictional release acceptance',kind:'checkin'}});
 for(const change of [{url:api+'/v1/auth/register'},{url:api+'/v1/auth/recovery'},{url:api+'/v1/contact'},{url:api+'/v1/hq/users'},{url:'https://external.example'+root+'/week-note'},{method:'DELETE'},{body:{...note,treatmentId:'real-other-member'}},{body:{...note,note:'Real clinical instruction'}}])assert.throws(()=>assertRecordedWeekRequest({url:api+root+'/week-note',method:'POST',body:note,ownedTreatmentId,...change}));
 for(const kind of ['repeat_order','supply_updated','schedule_updated','reminder_updated','paused','finished','resumed'])assert.throws(()=>assertRecordedWeekRequest({url:api+root+'/events',method:'POST',ownedTreatmentId,body:{treatmentId:ownedTreatmentId,note:'Fictional release acceptance',kind}}));
});
test('foreign denial is bounded to nonexistent labelled IDs, never another member',()=>{
 const foreign={...note,treatmentId:'unowned-release-denial-11111111-2222-4333-8444-555555555555'};
 assert.throws(()=>assertRecordedWeekRequest({url:api+root+'/week-note',method:'POST',body:foreign,ownedTreatmentId}));
 assertRecordedWeekRequest({url:api+root+'/week-note',method:'POST',body:foreign,ownedTreatmentId,allowForeignDenial:true});
 assert.throws(()=>assertRecordedWeekRequest({url:api+root+'/week-note',method:'POST',body:{...foreign,treatmentId:'real-member-id'},ownedTreatmentId,allowForeignDenial:true}));
});
function fixture(){
 const now=Date.parse('2026-10-14T12:00:00Z'),DAY=86400000,iso=n=>new Date(n).toISOString(),events=[],seed={treatmentId:ownedTreatmentId,doseIds:[]};
 for(const days of [42,28,21,14,2]){const id='dose-'+days,t=now-days*DAY;seed.doseIds.push(id);if(days===42)seed.unknownDose=id;if(days===2)seed.currentDose=id;events.push({id,treatment_id:ownedTreatmentId,kind:'dose_taken',occurred_at:iso(t),details:days===42?{}:{doseStrength:'7.5 mg'}});if([28,21,14].includes(days))events.push({id:'check-'+days,treatment_id:ownedTreatmentId,kind:'checkin',occurred_at:iso(t+2*DAY+7200000),details:{checkin:{sideEffects:'Fictional nausea',symptomType:'Nausea',symptomStartedAt:iso(t+2*DAY+3600000)}}});}
 const week=buildRecordedWeek({records:[{id:ownedTreatmentId,medicine:'Mounjaro'}],events,now});week.curve={status:'not_included',scope:'recorded_facts_only'};week.context={sources:['treatment'],food:[],progress:[],exercises:[]};return{week,seed};
}
test('factual oracle preserves sparse/unknown data and excludes medication estimates',()=>{const{week,seed}=fixture();assertRecordedWeekFacts(week,seed);for(const mutate of [w=>w.curve={status:'reviewed_estimate'},w=>w.cycles.find(c=>c.id===seed.unknownDose).strengthMg=7.5,w=>w.cycles[0].treatmentId='different-holder',w=>w.context.food=[{food:'unselected'}],w=>w.observations[0].evidence.completedCycles=4,w=>w.cycles.find(c=>c.id===seed.currentDose).state='complete']){const bad=structuredClone(week);mutate(bad);assert.throws(()=>assertRecordedWeekFacts(bad,seed));}});
test('isolation handoff admits only same-source distinct actual synthetic holders and hashes',()=>{const marker={schema:'recorded-week-existing-holder-isolation/v1',source,synthetic:true,holderId:'101',treatmentId:'11111111-2222-4333-8444-555555555555',noteHashes:['1'.repeat(64),'2'.repeat(64)],at:'2026-10-14T23:00:00Z'};assertRecordedWeekIsolationMarker(marker,{source,holderId:'102'});for(const change of [{source:'b'.repeat(40)},{synthetic:false},{holderId:'102'},{noteHashes:['plaintext note','2'.repeat(64)]},{noteHashes:['1'.repeat(64),'1'.repeat(64)]},{password:'never permitted'},{cookies:'never permitted'}])assert.throws(()=>assertRecordedWeekIsolationMarker({...marker,...change},{source,holderId:'102'}));});
