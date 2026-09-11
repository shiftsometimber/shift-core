import {emptyState} from '../service.mjs';
import {dateAdd} from '../engine.mjs';
export function fixture(name='Dave'){
 const s=emptyState('2026-09-13');s.name=name;s.goal='More energy for the kids, with less planning after work.';s.setup=name!=='New member';s.entitlement={active:true};s.cycle=2;s.anchor='2026-08-30';
 s.preferences={allergies:'none',diet:'any',equipment:['hob'],activityLimitations:'none',time:'20 minutes after work',household:'Two adults and two children',spending:'Keep waste down',workPattern:name==='Gaz'?'fixed':'alternating',firstShift:'early',shiftAnchor:'2026-08-31'};
 if(!s.setup)return s;
 for(let w=0;w<4;w++){
  const start=dateAdd('2026-08-31',7*w),shift=name==='Gaz'?'day':w%2?'late':'early';
  for(const [key,day,kind,recipeId,servings] of [['mon-dinner',0,'meal','chilli',8],['thu-dinner',3,'meal','ragu',4],['sun-dinner',6,'meal','chickpea',4],['tue-walk',1,'move',null,null],['thu-walk',3,'move',null,null],['sat-walk',5,'move',null,null]]){
   const date=dateAdd(start,day);s.slots.push({id:`${date}:${key}`,slotKey:key,date,kind,...(kind==='meal'?{recipeId,recipeVersion:1,servings,serveNow:4}:{label:'20-minute walk',minutes:20}),completed:false});
   if(w<2){const missed=name==='Dave'&&(key==='thu-dinner'||(w===1&&key==='sat-walk'));s.reports.push({slotKey:key,kind,date,period:start,shift,status:missed?'missed':'done',fit:missed?'unknown':'manageable',reason:key==='thu-dinner'&&missed?'no time':'',note:''})}
  }
  const date=dateAdd(start,1);s.slots.push({id:`${date}:tue-leftovers`,slotKey:'tue-leftovers',date,kind:'leftovers',servings:4,label:'Chilli portions from Monday',sourceId:`${start}:mon-dinner`,completed:false});
 }
 s.manualItems=[{id:'fictional-manual-coffee',name:'Coffee — my own addition',period:'2026-09-14..2026-09-20'}];
 s.acquired={'2026-09-14..2026-09-20':{'mince|g':{status:'bought',quantity:1000}}};
 if(name==='Constraint check'){s.preferences.allergies=['fish'];for(const slot of s.slots)if(slot.slotKey==='thu-dinner'&&slot.date>s.clock)slot.recipeId='tuna';s.requests=['mon-dinner','sun-dinner','sat-walk'].map(slotKey=>({slotKey,date:s.clock,reason:'Please revisit this saved item'}));s.freezes['thu-dinner']={throughCycle:99,evidenceAt:s.clock};}
 return s;
}
