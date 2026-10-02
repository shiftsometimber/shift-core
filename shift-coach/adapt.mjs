import {prepareToday} from './today.mjs';
export function adapt(state,action,outcome,now=Date.now()){
 if(outcome==='didnt-fit')return prepareToday(state,now,{smaller:true,repeat:action.type});
 if(outcome==='helped'){state.pendingBlocker=null;state.blocker=null;return prepareToday(state,now,{repeat:action.type,repeatOf:action.id,smaller:action.minutes===1});}
 if(outcome==='didnt-help'){for(const p of state.weeklyPlans)if(p.actionId===action.id||!p.actionId&&p.title===action.title)p.retired=true;
 const recent=state.outcomes.slice(-2);if(recent.length===2&&recent.every(o=>o.value==='didnt-help'))state.pendingBlocker={focus:action.type.split('-')[0],at:now};state.rejected=[...new Set([...state.rejected,action.type])];return prepareToday(state,now,{different:true,previousType:action.type});}
 if(outcome==='didnt-try'){state.pendingWant={type:action.type,at:now};return prepareToday(state,now);}
 return prepareToday(state,now);
}
