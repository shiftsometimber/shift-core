import {uid} from './store.mjs';import {adapt} from './adapt.mjs';import {prepareToday} from './today.mjs';import {canExecute} from './permissions.mjs';
export function accept(state,id,now=Date.now()){
 const a=state.actions.find(a=>a.id===id&&a.status==='prepared');
 if(!a||!canExecute(state,a)||a.awaitingWant)throw Object.assign(Error('action_unavailable'),{status:409});
 a.status='accepted';state.lastActivity=now;
 if(state.settings.followup&&state.settings.proactive&&!state.pausedTypes.includes('followup'))state.queue.push({id:uid(),actionId:a.id,type:'followup',kind:'followup',sources:a.sources,dataUsed:a.dataUsed,dueAt:now+86400000,status:'queued',createdAt:now});
 return{dataUsed:a.dataUsed};
}
export function reject(state,id,now=Date.now()){
 const a=state.actions.find(a=>a.id===id&&['accepted','prepared'].includes(a.status));
 if(!a)throw Object.assign(Error('action_unavailable'),{status:409});
 state.rejected=[...new Set([...state.rejected,a.type])];a.status='rejected';state.queue=state.queue.filter(q=>q.actionId!==id);state.lastActivity=now;state.pendingWant=null;
 const next=prepareToday(state,now,{different:true,previousType:a.type});return{dataUsed:next.dataUsed,action:next};
}
export function outcome(state,id,value,now=Date.now()){
 if(!['helped','didnt-help','didnt-fit','didnt-try'].includes(value))throw Object.assign(Error('invalid_outcome'),{status:400});
 const a=state.actions.find(a=>a.id===id&&a.status==='accepted');
 if(!a||!canExecute(state,a))throw Object.assign(Error('accepted_action_required'),{status:409});
 a.status='completed';state.outcomes.push({id:uid(),actionId:id,type:a.type,value,at:now,dataUsed:a.dataUsed});state.queue=state.queue.filter(q=>q.actionId!==id);for(const t of state.touches)if(t.actionId===id)t.answered=true;state.lastActivity=now;
 const next=adapt(state,a,value,now);return{dataUsed:next.dataUsed,action:next};
}
export function wanted(state,yes,now=Date.now()){
 if(!state.pendingWant||typeof yes!=='boolean')throw Object.assign(Error('confirmation_required'),{status:409});
 const previous=state.pendingWant;state.pendingWant=null;
 if(!yes)state.rejected=[...new Set([...state.rejected,previous.type])];
 const next=prepareToday(state,now,yes?null:{different:true,previousType:previous.type});return{dataUsed:next.dataUsed};
}
