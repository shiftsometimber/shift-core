import {mutate,load,usable,activeConsent} from './store.mjs';
import {prepareToday,readToday} from './today.mjs';
import {weeklyPlan} from './planning.mjs';
import {localClock} from './clock.mjs';
import {returning} from './continue.mjs';
export function prepareNight(state,now=Date.now()){
 const clock=localClock(now,state.settings.timezone);
 const previous=state.nightRuns.find(r=>r.date===clock.date);
 if(previous)return {...previous,duplicate:true};
 const welcome=returning(state,now)&&state.returnPreparedFor!==state.lastActivity;
 if(welcome){state.returnPreparedFor=state.lastActivity;state.queue=[];}
 for(const type of new Set(state.touches.filter(t=>!t.answered&&t.at<now-86400000).map(t=>t.type))){
  if(state.touches.filter(t=>t.type===type&&!t.answered&&t.at<now-86400000).length>=2&&!state.pausedTypes.includes(type)){
   state.pausedTypes.push(type);state.queue=state.queue.filter(q=>q.type!==type);
   state.pauseRequests=state.pauseRequests||[];
   if(!state.pauseRequests.some(r=>r.type===type))state.pauseRequests.push({id:crypto.randomUUID(),type,status:'queued',shown:false});
  }
 }
 let action=readToday(state),outcome='no_action';
 if(!action||welcome){action=prepareToday(state,now,welcome?{welcome:true}:null);outcome='prepared_action';}
 if(state.settings.proactive&&state.settings.weeklyDay===clock.weekday){weeklyPlan(state,clock.date,now);outcome='weekly_plan';}
 if(!action){outcome='support_required';state.queue=[];}
 const run={date:clock.date,at:now,outcome,reason:outcome==='support_required'?'everyday_boundary':welcome?'return_after_absence':outcome==='weekly_plan'?'chosen_weekly_day':outcome==='no_action'?'existing_action_still_available':'action_needed',modelCalls:0,patternsEnabled:false,dataUsed:action?.dataUsed||[]};
 state.nightRuns.push(run);return run;
}
// Keyset paging includes every opted-in account; health values never enter logs.
export async function runCoachingNight(env,now=Date.now()){
 if(env.SHIFT_COACH_OFF==='true')return {disabled:true};
 let after=0,checked=0,prepared=0,conflicts=0;
 while(true){
  const rows=(await env.DB.prepare("SELECT user_id FROM member_state WHERE user_id>? AND json_extract(preferences,'$.lifeBack.progress.shiftAI.settings.proactive')=1 ORDER BY user_id LIMIT 50").bind(after).all()).results||[];
  if(!rows.length)break;
  for(const {user_id:userId} of rows){after=userId;checked++;
   const {state}=await load(env.DB,userId),consent=await activeConsent(env.DB,userId);
   if(!usable(state,consent)||state.nightRuns.some(r=>r.date===localClock(now,state.settings.timezone).date))continue;
   try{await mutate(env.DB,userId,'night_review',s=>prepareNight(s,now),now,{consentId:state.consentId});prepared++;}
   catch(error){if(error.status===409){conflicts++;continue;}throw error;}
  }
 }
 return {checked,prepared,conflicts,modelCalls:0,externalNotifications:0};
}
