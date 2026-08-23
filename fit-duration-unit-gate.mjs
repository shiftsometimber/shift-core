import {ensureFitDurationUtilisation} from './fit-duration-v1.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const baseExercises=()=>[
  {id:'march',name:'March on the spot',group:'warmup',minutes:3,how:['Stand tall.','March steadily.']},
  {id:'chair-squat',name:'Chair squat',group:'legs',minutes:5,how:['Stand at a chair.','Sit back and stand.']},
  {id:'wall-push',name:'Wall press-up',group:'push',minutes:4,how:['Hands on wall.','Lower and press.']},
  {id:'dead-bug',name:'Dead bug',group:'core',minutes:4,how:['Lie on back.','Alternate limbs slowly.']},
  {id:'brisk-walk',name:'Brisk walk',group:'cardio',minutes:8,how:['Start easy.','Build a purposeful pace.']}
];

for(const requested of [10,15,20,30,45,60]){
  const exercises=baseExercises().map(x=>({...x}));
  let remaining=requested;
  for(const ex of exercises){
    if(remaining<=0){ex.minutes=0;continue;}
    ex.minutes=Math.min(ex.minutes,remaining);remaining-=ex.minutes;
  }
  const served=exercises.filter(x=>x.minutes>0);
  const plan={minutes_per_day:requested,sessions:[{requested_minutes:requested,exercises:served,estimated_minutes:served.reduce((a,x)=>a+x.minutes,0)}]};
  const report=ensureFitDurationUtilisation(plan,{minimumUtilisation:0.8});
  const session=plan.sessions[0];
  const sum=session.exercises.reduce((a,x)=>a+Number(x.minutes||0),0);
  assert(sum<=requested,`${requested}m helper overran request (${sum})`);
  assert(sum/requested>=0.8,`${requested}m helper underfilled request (${sum})`);
  assert(new Set(session.exercises.map(x=>x.id)).size===session.exercises.length,`${requested}m helper duplicated an exercise`);
  assert(session.estimated_minutes===sum,`${requested}m estimated duration not reconciled`);
  if(requested>=45)assert(report.changed===true,`${requested}m long session should require a continuous-block extension in this fixture`);
}

const impossible={minutes_per_day:60,sessions:[{requested_minutes:60,exercises:[{id:'squat',name:'Squat',group:'legs',minutes:5,how:['a','b']}],estimated_minutes:5}]};
const impossibleReport=ensureFitDurationUtilisation(impossible,{minimumUtilisation:0.8});
assert(impossibleReport.changed===false,'helper must not invent duration when no safe continuous movement exists');
assert(impossible.sessions[0].estimated_minutes===5,'helper must leave impossible composition unchanged for fail-closed upstream handling');

console.log('PASS Fit duration helper: 10/15/20/30/45/60 minute sessions stay unique, non-overrunning and >=80% utilised; impossible compositions fail closed without invented padding.');
