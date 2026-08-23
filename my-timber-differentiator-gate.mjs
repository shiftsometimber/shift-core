import fs from 'node:fs';
import {buildDailyLearning,composeDailyOutput} from './member-product-v8.js';

const need=(ok,message)=>{if(!ok)throw new Error(message)};
const source=fs.readFileSync('member-product-v8.js','utf8');
const ui=fs.readFileSync('frontend/member/member-my-timber-problem-v1.js','utf8');
const history=[
  {local_date:'2026-08-16',domain:'day_change',choice_key:'working_late'},
  {local_date:'2026-08-09',domain:'day_change',choice_key:'no_time'}
];
const feedback=[{feedback:'effort',context_json:'{}'},{feedback:'love',context_json:'{"meal_id":"quick"}'}];
const recent=[{properties_json:'{"minutes":10}'},{properties_json:'{"minutes":8}'}];
const learning=buildDailyLearning({date:'2026-08-23',choiceHistory:history,feedbackHistory:feedback,checkinHistory:[],rejectedMeals:[{meal_id:'never'}],recent,hydrationMl:500});
need(learning.prediction?.key==='busy_weekday','repeated weekday friction must produce a useful prediction');
need(learning.prediction.prepared.includes('quickest dinner')&&learning.prediction.prepared.includes('ten-minute movement'),'prediction must say what Shift prepared');
need(learning.proof.signals_used.day_changes===2&&learning.proof.signals_used.feedback===2,'learning must expose retained evidence counts');
need(learning.proof.applied_to_today.includes('easier food wins')&&learning.proof.applied_to_today.includes('rejected meals removed'),'learning must change today rather than merely describe history');
need(/Next week:/.test(learning.weekly.next),'weekly insight must make a concrete next-week decision');

const fixture={date:'2026-08-23',hour:18,grubStartsOn:'2026-08-23',grubPlan:{days:[{meals:[{id:'slow',type:'Dinner',name:'Slow dinner',minutes:35,protein:30},{id:'quick',type:'Dinner',name:'Quick dinner',minutes:10,protein:40}]}]},fitPlan:{sessions:[{title:'Full session',estimated_minutes:30,exercises:[{name:'Chair squat'}]}]},hydrationMl:500,mode:'train',minutesCap:60,reasons:[],completedToday:false,learning};
const rebuilt=composeDailyOutput({...fixture,dayChange:'working_late'});
need(rebuilt.rebuild?.contract==='remaining-day/v1','changed day must return the rebuild proof contract');
need(rebuilt.meal.name==='Quick dinner'&&rebuilt.workout.minutes===10,'one action must materially rebuild food and movement');
need(rebuilt.rebuild.food===rebuilt.meal.name&&/10 minutes/.test(rebuilt.rebuild.movement),'rebuild summary must evidence the new plan');
need(!/setTimeout\(\(\)=>\{sheet\.remove/.test(ui),'consumer rebuild must not contain an artificial delay');
for(const marker of ['SHIFT LEARNED · AND USED','Changed today:','Open on tomorrow’s first useful action','rebuildComplete','under a second'])need(ui.includes(marker),`consumer evidence missing: ${marker}`);
for(const marker of ["contract:'remaining-day/v1'",'learning_proof','signals_used','applied_to_today'])need(source.includes(marker),`backend contract missing: ${marker}`);
console.log('My Timber differentiator gate: PASS');
