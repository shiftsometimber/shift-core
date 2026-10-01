import {canExecute} from './permissions.mjs';import {mutate} from './store.mjs';
export function localClock(now,timezone){const p=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);const v=Object.fromEntries(p.map(p=>[p.type,p.value]));return{date:`${v.year}-${v.month}-${v.day}`,minutes:Number(v.hour)*60+Number(v.minute),weekday:new Date(`${v.year}-${v.month}-${v.day}T12:00:00Z`).getUTCDay()};}
export function inQuietHours(state,now){const m=x=>Number(x.slice(0,2))*60+Number(x.slice(3));const start=m(state.settings.quietStart),end=m(state.settings.quietEnd),t=localClock(now,state.settings.timezone).minutes;if(start===end)return true;return start<end?t>=start&&t<end:t>=start||t<end;}
export async function setGlobalEnabled(DB,value){if(typeof value!=='boolean')throw Error('boolean_required');await DB.prepare('UPDATE coaching_test_control SET proactive_enabled=? WHERE id=1').bind(value?1:0).run();if(!value){const rows=(await DB.prepare('SELECT member_id FROM coaching_test_memory').all()).results;for(const row of rows)await mutate(DB,row.member_id,'global_off',s=>{s.queue=[];return{dataUsed:[]};});}}
export async function dispatchSimulated(DB,member,now=Date.now()){
 const control=await DB.prepare('SELECT proactive_enabled FROM coaching_test_control WHERE id=1').first();if(!control?.proactive_enabled)return{sent:0,reason:'global_off'};
 const result=await mutate(DB,member,'dispatch_simulated',s=>{
  let sent=0;if(!s.settings.proactive||inQuietHours(s,now))return{sent,dataUsed:[]};
  const day=localClock(now,s.settings.timezone).date;
  for(const q of s.queue){
   if(q.status!=='queued'||q.dueAt>now)continue;
   const a=s.actions.find(a=>a.id===q.actionId&&['prepared','accepted'].includes(a.status));
   if(!a||!canExecute(s,a)||s.pausedTypes.includes(q.type)||q.kind==='followup'&&!s.settings.followup){q.status='cancelled';continue;}
   if(s.touches.filter(t=>t.at>now-7*86400000).length>=3)break;
   if(s.touches.some(t=>t.day===day&&t.type===q.type)){q.status='cancelled';continue;}
   q.status='simulated';q.sentAt=now;s.touches.push({id:q.id,actionId:q.actionId,planId:q.planId||null,type:q.type,kind:q.kind,at:now,day,answered:false});sent++;
   if(q.requestId){const r=s.pauseRequests?.find(r=>r.id===q.requestId);if(r)r.status='sent';}
  }
  return{sent,dataUsed:s.queue.filter(q=>q.sentAt===now).flatMap(q=>q.dataUsed),outcome:sent?'simulated':'held',reason:sent?'permitted_within_budget':'no_permitted_dispatch',channel:'fake_push'};
 },now,true);
 return{sent:result.result.sent,transport:'simulated_only',externalNotifications:0};
}
