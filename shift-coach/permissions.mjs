import {sources,cancelAffected,uid} from './store.mjs';
import {boundary} from './safety.mjs';
export function setPermission(state,source,enabled){
 if(!sources.includes(source)||typeof enabled!=='boolean')throw Object.assign(Error('invalid_permission'),{status:400});
 state.permissions[source]=enabled;
 if(!enabled)cancelAffected(state,[],source);
 return{dataUsed:[]};
}
export function canExecute(state,item){return !state.facts.some(f=>f.confirmed&&['goal','week'].includes(f.key)&&!boundary(f.value).coaching)&&item.sources.every(s=>state.permissions[s])&&item.dataUsed.every(id=>state.constraints?.id===id||state.facts.some(f=>f.id===id&&f.confirmed)||state.readings.some(r=>r.id===id&&!r.conflict)||state.doses.some(d=>d.id===id))&&!state.rejected.includes(item.type);}
export function setSettings(state,input){
 const keys=['proactive','followup','quietStart','quietEnd','timezone','weeklyDay'];
 for(const k of Object.keys(input))if(!keys.includes(k))throw Object.assign(Error('invalid_setting'),{status:400});
 const next={...state.settings,...input};
 if(typeof next.proactive!=='boolean'||typeof next.followup!=='boolean'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(next.quietStart)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(next.quietEnd)||!(next.weeklyDay===null||Number.isInteger(next.weeklyDay)&&next.weeklyDay>=0&&next.weeklyDay<=6))throw Object.assign(Error('invalid_setting'),{status:400});
 try{new Intl.DateTimeFormat('en-GB',{timeZone:next.timezone}).format()}catch{throw Object.assign(Error('invalid_timezone'),{status:400});}
 state.settings=next;
 if(!next.proactive)state.queue=[];
 if(!next.followup)state.queue=state.queue.filter(q=>q.kind!=='followup');
 const active=[...state.actions].reverse().find(a=>a.status==='accepted'&&canExecute(state,a));
 if(next.proactive&&next.followup&&active&&!state.queue.some(q=>q.actionId===active.id)&&!state.touches.some(t=>t.actionId===active.id))state.queue.push({id:uid(),actionId:active.id,type:'followup',kind:'followup',sources:active.sources,dataUsed:active.dataUsed,dueAt:(active.acceptedAt||Date.now())+86400000,status:'queued',createdAt:Date.now()});
 return{dataUsed:[]};
}
