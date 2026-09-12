import assert from 'node:assert/strict';

// The caller supplies only an isolated test account and its authenticated
// transport. This probe never sends email or orders treatment.
export async function probeMemberHealth(call){
 const checks=[];
 const data=async(path,method='GET',body,status=200)=>{const r=await call(path,method,body);assert.equal(r.status,status,path+': '+(await r.clone().text()).slice(0,200));return r.json()};
 await data('/v1/consents','POST',{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted:true},201);
 await data('/v1/check-ins','POST',{mood:'Good',note:'Fictional release check'},201);
 assert.equal((await data('/v1/check-ins')).checkIns[0].mood,'Good');
 const date=new Date().toISOString().slice(0,10);
 await data('/v1/journey','PATCH',{journey:{setup:{startDate:date,units:'kg',route:'lifestyle',focus:'energy',why:'Fictional release goal'},weight:{startKg:100,currentKg:99,targetKg:90}}});
 assert.equal((await data('/v1/journey')).journey.setup.why,'Fictional release goal');
 checks.push('Daily check-in and Journey saved and reloaded from isolated D1');
 const generated=await data('/v1/fit/plan','POST',{days:1,minutes_per_day:20,location:'home',equipment:'none',limitations:{selected:[],notes:null}});
 assert(generated.plan?.sessions?.length,'Real Fit plan must contain sessions');
 const initial=await data('/v1/fit/activity');
 assert.deepEqual(initial.plan.sessions,generated.plan.sessions);
 const exercise=initial.plan.sessions[0].exercises[0];
 const swapped=await data('/v1/fit/replace','POST',{current_id:exercise.id,group:exercise.group,exclude:initial.plan.sessions.flatMap(s=>s.exercises.map(e=>e.id)),location:'home',equipment:'none',limitations:{selected:[],notes:null},persist:true,session_index:0,exercise_index:0});
 assert.equal(swapped.saved,true);
 const returned=await data('/v1/fit/activity');assert.equal(returned.plan.sessions[0].exercises[0].id,swapped.exercise.id);
 assert.deepEqual(returned.plan.sessions[0].exercises.slice(1),initial.plan.sessions[0].exercises.slice(1));
 checks.push('Approved Fit generation and exercise swap survive a fresh read; other exercises remain unchanged');
 const fitJourney={entries:{['release-'+date]:{status:'done',exerciseId:swapped.exercise.id,sessionDay:1,recordedOn:date}},sessionReviews:{}};
 await data('/v1/fit/activity','POST',{fitJourney});
 await data('/v1/member-state','PATCH',{preferences:{releaseProbe:true}});
 assert.equal((await data('/v1/journey')).journey.setup.why,'Fictional release goal');
 assert.equal(Object.keys((await data('/v1/fit/activity')).fitJourney.entries).length,1);
 const weekly=await data('/v1/journey/weekly-check-in');assert.equal(weekly.prefill.movement.exercisesCompleted,1);
 await data('/v1/journey/weekly-check-in','POST',{weekEnding:weekly.week.ending,overallFeeling:'80',clothesFit:'same',weightKg:99,sleep:'80',movement:weekly.prefill.movement},201);
 assert.equal((await data('/v1/journey/trends')).confirmed_weeks,1);
 const exported=await data('/v1/privacy/export','POST',{});assert(JSON.stringify(exported).includes('Fictional release goal'));assert.equal(exported.journeyWeeklyCheckIns.length,1);assert(exported.savedPlans.some(p=>p.plan_type==='fit'));
 checks.push('Fit activity reaches the confirmed weekly Journey; stale settings preserve saved records and account export includes them');
 await data('/v1/consents','POST',{type:'my_shift_health_tracking',granted:false},201);
 await data('/v1/check-ins','POST',{mood:'Good'},409);
 await data('/v1/fit/activity','POST',{fitJourney},409);
 await data('/v1/privacy/health-tracking','DELETE');
 assert.equal((await data('/v1/check-ins')).checkIns.length,0);
 assert.equal((await data('/v1/journey/trends')).confirmed_weeks,0);
 assert.equal((await data('/v1/journey')).journey.setup.complete,false);
 assert.equal(Object.keys((await data('/v1/fit/activity')).fitJourney.entries).length,0);
 await data('/v1/profile');
 checks.push('Consent withdrawal blocks tracking; optional erasure removes probe history and preserves the account');
 return checks;
}
