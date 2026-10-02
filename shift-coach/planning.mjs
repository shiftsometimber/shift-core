import {uid} from './store.mjs';import {readToday} from './today.mjs';
export function weeklyPlan(state,week,now=Date.now()){
 const a=readToday(state);if(!a)return null;
 const existing=state.weeklyPlans.find(p=>p.week===week&&p.dataUsed.join()===a.dataUsed.join());if(existing)return existing;
 const p={id:uid(),week,at:now,title:a.title,reason:a.reason,dataUsed:a.dataUsed,sources:a.sources,accepted:false,steps:[{title:a.title,minutes:a.minutes}],component:a.component};state.weeklyPlans.push(p);return p;
}
export function acceptPlan(state,id){const p=state.weeklyPlans.find(p=>p.id===id);if(!p)throw Object.assign(Error('plan_missing'),{status:404});p.accepted=true;for(const t of state.touches)if(t.planId===id)t.answered=true;return{dataUsed:p.dataUsed};}
