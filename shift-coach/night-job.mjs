import {personalContextBoundary} from './safety.mjs';
import {mutate,load,usable,activeConsent} from './store.mjs';
import {prepareToday,readToday} from './today.mjs';
import {weeklyPlan} from './planning.mjs';
import {localClock} from './clock.mjs';
import {returning} from './continue.mjs';
export function prepareNight(state,now=Date.now()){
 const clock=localClock(now,state.settings.timezone);
 if(!personalContextBoundary(state).coaching){
  state.queue=[];
  const previous=state.nightRuns.find(r=>r.date===clock.date&&r.outcome==='support_required');
  if(previous)return{...previous,duplicate:true};
  const run={date:clock.date,at:now,outcome:'support_required',reason:'everyday_boundary',modelCalls:0,patternsEnabled:false,dataUsed:[]};
  state.nightRuns.push(run);return run;
 }
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
 if(!action||welcome&&action.status!=='accepted'){action=prepareToday(state,now,welcome?{welcome:true}:null);outcome='prepared_action';}
 if(state.settings.proactive&&state.settings.weeklyDay===clock.weekday){weeklyPlan(state,clock.date,now);outcome='weekly_plan';}
 if(!action){outcome='support_required';state.queue=[];}
 const run={date:clock.date,at:now,outcome,reason:outcome==='support_required'?'everyday_boundary':welcome?'return_after_absence':outcome==='weekly_plan'?'chosen_weekly_day':outcome==='no_action'?'existing_action_still_available':'action_needed',modelCalls:0,patternsEnabled:false,dataUsed:action?.dataUsed||[]};
 state.nightRuns.push(run);return run;
}
// Keyset paging includes every opted-in account; health values never enter logs.
export async function runCoachingNight(env,now=Date.now()){
 const stopped=()=>env.SHIFT_COACH_OFF==='true';
 if(stopped())return{disabled:true};
 let after=0,checked=0,prepared=0,conflicts=0;
 const report=disabled=>({checked,prepared,conflicts,modelCalls:0,externalNotifications:0,...(disabled?{disabled:true}:{})});
 const assertEnabled=()=>{if(stopped())throw Object.assign(Error('coaching_disabled'),{status:409});};
 while(true){
  if(stopped())return report(true);
  const rows=(await env.DB.prepare("SELECT user_id FROM member_state WHERE user_id>? AND json_extract(preferences,'$.lifeBack.progress.shiftAI.settings.proactive')=1 ORDER BY user_id LIMIT 50").bind(after).all()).results||[];
  if(stopped())return report(true);
  if(!rows.length)break;
  for(const {user_id:userId}of rows){
   if(stopped())return report(true);
   after=userId;checked++;
   const {state}=await load(env.DB,userId);
   if(stopped())return report(true);
   const consent=await activeConsent(env.DB,userId);
   if(stopped())return report(true);
   if(!usable(state,consent)||!personalContextBoundary(state).coaching||state.nightRuns.some(r=>r.date===localClock(now,state.settings.timezone).date))continue;
   try{
    assertEnabled();
    await mutate(env.DB,userId,'night_review',s=>{
     assertEnabled();
     if(!personalContextBoundary(s).coaching)throw Object.assign(Error('coaching_support_required'),{status:409});
     return prepareNight(s,now);
    },now,{consentId:state.consentId,beforeWrite:assertEnabled});
    prepared++;
   }catch(error){
    if(error.message==='coaching_disabled')return report(true);
    if(error.message==='coaching_support_required')continue;
    if(error.status===409){conflicts++;continue;}throw error;
   }
  }
 }
 return report(false);
}
