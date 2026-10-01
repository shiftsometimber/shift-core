import {mutate,uid} from './store.mjs';import {readToday,prepareToday} from './today.mjs';import {weeklyPlan} from './planning.mjs';import {localClock} from './push.mjs';import {returning} from './continue.mjs';
export async function nightJob(DB,now=Date.now()){
 // Full test-member enumeration, not the production latest-500 query.
 const members=(await DB.prepare('SELECT member_id FROM coaching_test_memory ORDER BY member_id').all()).results;
 const runs=[];
 for(const {member_id:member} of members){
  const r=await mutate(DB,member,'night_review',s=>{
   const clock=localClock(now,s.settings.timezone),previous=s.nightRuns.find(r=>r.date===clock.date);
   if(previous)return{...previous,duplicate:true,dataUsed:[]};
   const isReturning=returning(s,now)&&s.returnPreparedFor!==s.lastActivity;
   if(isReturning)s.returnPreparedFor=s.lastActivity;
   if(isReturning)s.queue=[];
   for(const type of new Set(s.touches.filter(t=>!t.answered&&t.at<now-86400000).map(t=>t.type))){
    if(s.touches.filter(t=>t.type===type&&!t.answered&&t.at<now-86400000).length>=2&&!s.pausedTypes.includes(type)){
     s.pausedTypes.push(type);s.pauseRequests=s.pauseRequests||[];
     if(!s.pauseRequests.some(r=>r.type===type)){const id=uid();s.pauseRequests.push({id,type,status:'queued',shown:false});const a=readToday(s)||prepareToday(s,now);if(s.settings.proactive)s.queue.push({id:uid(),requestId:id,pausedType:type,actionId:a.id,type:'keep-'+type,kind:'keep-type',sources:[],dataUsed:[],dueAt:now,createdAt:now,status:'queued'});}
    }
   }
   let a=readToday(s),outcome='no_action';
   if(isReturning||!a){a=prepareToday(s,now,isReturning?{welcome:true}:null);outcome='prepared_action';}
   const weekdayMatches=s.settings.weeklyDay===clock.weekday;
   if(weekdayMatches&&s.settings.proactive){const plan=weeklyPlan(s,clock.date,now);if(plan){outcome='weekly_plan';if(!s.queue.some(q=>q.planId===plan.id))s.queue.push({id:uid(),planId:plan.id,actionId:a.id,type:'weekly',kind:'weekly',sources:a.sources,dataUsed:a.dataUsed,dueAt:now,createdAt:now,status:'queued'});}}
   const run={date:clock.date,at:now,outcome,reason:isReturning?'return_after_absence':weekdayMatches?'chosen_weekly_day':outcome==='no_action'?'existing_action_still_available':'action_needed',ruleFirst:true,modelCalls:0,patternsEnabled:false};s.nightRuns.push(run);return{...run,dataUsed:a?.dataUsed||[]};
  },now);runs.push({member,...r.result});
 }
 return runs;
}
