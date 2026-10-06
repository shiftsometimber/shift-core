import test from 'node:test';
import assert from 'node:assert/strict';
import {fitDoseFields,restoreSavedFitTiming} from '../fit-timed-dose.mjs';
import {savedFitIssues} from '../fit-saved-review.mjs';
const item={id:'industrial-v3-fit-low-impact-march-home-beginner',name:'Low-Impact March — Home Beginner',canonical_movement:'low-impact-march',movement_group:'cardio',sets:1,reps:300,minutes:5,rest_seconds:75,structured:{published:true,version:3}};
const data={canonical_movement:item.canonical_movement,dosage:{sets:1,time_seconds:300,rest_seconds:75}};
const plan=()=>({minutes_per_day:20,sessions:[{exercises:[structuredClone(item)]}]});
const row=(patch={})=>({title:item.name,version:3,data_json:JSON.stringify(data),...patch});
const db=(record)=>({prepare(sql){assert.match(sql,/^SELECT /);return{bind(id){assert.equal(id,item.id);return this},async first(){return record}}}});
test('timed catalogue dose stays seconds; strength stays repetitions',()=>{
 assert.deepEqual(fitDoseFields(data),{reps:null,time_seconds:300});
 assert.deepEqual(fitDoseFields({dosage:{sets:2,reps:8}}),{reps:8,time_seconds:null});
});
test('legacy saved march restores exact authored unit without changing stored plan or dose',async()=>{
 const before=plan(),original=structuredClone(before),result=await restoreSavedFitTiming(db(row()),before),fixed=result.sessions[0].exercises[0];
 assert.equal(fixed.time_seconds,300);assert.equal(fixed.reps,null);assert.equal(fixed.minutes,5);assert.equal(fixed.rest_seconds,75);
 assert.deepEqual(before,original);assert.deepEqual(savedFitIssues(result),[]);
});
test('changed catalogue or unprovable legacy units are held instead of guessed',async()=>{
 for(const r of [null,row({version:4}),row({title:'Different movement'}),row({data_json:JSON.stringify({...data,dosage:{...data.dosage,time_seconds:600}})}),row({data_json:'invalid'})]){
 const result=await restoreSavedFitTiming(db(r),plan());assert.equal(result.sessions[0].exercises[0].reps,300);
 assert.equal(savedFitIssues(result)[0].reason,'timing');
 }
 const result=await restoreSavedFitTiming({prepare(){throw Error('unavailable')}},plan());assert.equal(savedFitIssues(result)[0].reason,'timing');
});
test('fixed doses, explicit timed fields and valid repetition-based mobility remain intact',async()=>{
 for(const patch of [{dose_locked:true},{time_seconds:300,reps:null},{movement_group:'strength'}]){
 const input=plan();Object.assign(input.sessions[0].exercises[0],patch);
 assert.equal(await restoreSavedFitTiming({prepare(){throw Error('must not query')}},input),input);
 }
 const input=plan();input.sessions[0].exercises[0].movement_group='mobility';input.sessions[0].exercises[0].reps=8;
 const r=row({data_json:JSON.stringify({...data,dosage:{sets:1,reps:8,rest_seconds:75}})});
 assert.deepEqual(await restoreSavedFitTiming(db(r),input),input);
});
