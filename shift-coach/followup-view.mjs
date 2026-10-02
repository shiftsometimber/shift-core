import {canExecute} from './permissions.mjs';
import {inQuietHours,localClock} from './clock.mjs';
export function pendingFollowup(state,now=Date.now(),off=false){
 if(off||!state.settings.proactive||!state.settings.followup||state.pausedTypes.includes('followup')||inQuietHours(state,now))return null;
 const day=localClock(now,state.settings.timezone).date;
 if(state.touches.some(t=>t.day===day&&t.type==='followup')||state.touches.filter(t=>t.at>now-7*86400000).length>=3)return null;
 const q=state.queue.find(q=>q.kind==='followup'&&q.status==='queued'&&q.dueAt<=now);
 const action=q&&state.actions.find(a=>a.id===q.actionId&&a.status==='accepted'&&canExecute(state,a));
 return action?{id:q.id,actionId:action.id,title:action.title}:null;
}
export function acknowledgeFollowup(state,id,now=Date.now(),off=false){
 const current=pendingFollowup(state,now,off);
 if(!current||current.id!==id)throw Object.assign(Error('followup_no_longer_available'),{status:409});
 const q=state.queue.find(q=>q.id===id);q.status='shown';q.shownAt=now;
 state.touches.push({id:q.id,actionId:q.actionId,type:'followup',kind:'followup',at:now,day:localClock(now,state.settings.timezone).date,answered:false});
 return {dataUsed:q.dataUsed,outcome:'shown',reason:'consented_due_followup'};
}
