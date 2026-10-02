import {uid} from './store.mjs';import {readToday} from './today.mjs';
// A plan belongs to the prepared action, not just to unchanged memory IDs.
// Older saved plans lack actionId: accept them only if their whole snapshot
// still matches. GETs remain read-only and existing history is retained.
export function currentPlan(state,plan){
 const a=readToday(state);
 if(!a||a.type==='member-choice'||a.awaitingWant||plan.status==='superseded'||plan.retired)return false;
 if(plan.actionId)return plan.actionId===a.id;
 return plan.title===a.title&&plan.reason===a.reason&&plan.component===a.component
  &&plan.steps?.length===1&&plan.steps[0].title===a.title&&plan.steps[0].minutes===a.minutes
  &&JSON.stringify(plan.dataUsed)===JSON.stringify(a.dataUsed)
  &&JSON.stringify(plan.sources)===JSON.stringify(a.sources);
}
export function plansView(state){return state.weeklyPlans.map(p=>({...p,status:currentPlan(state,p)?'current':'superseded'}));}
export function weeklyPlan(state,week,now=Date.now()){
 const a=readToday(state);if(!a||a.type==='member-choice'||a.awaitingWant)return null;
 const existing=state.weeklyPlans.find(p=>p.week===week&&currentPlan(state,p));if(existing)return existing;
 const p={id:uid(),actionId:a.id,week,at:now,title:a.title,reason:a.reason,dataUsed:a.dataUsed,sources:a.sources,accepted:false,steps:[{title:a.title,minutes:a.minutes}],component:a.component};state.weeklyPlans.push(p);return p;
}
export function acceptPlan(state,id){const p=state.weeklyPlans.find(p=>p.id===id);if(!p)throw Object.assign(Error('plan_missing'),{status:404});if(!currentPlan(state,p))throw Object.assign(Error('state_changed_retry'),{status:409});p.accepted=true;for(const t of state.touches)if(t.planId===id)t.answered=true;return{dataUsed:p.dataUsed};}
