import {prepareToday} from './today.mjs';
import {pauseWorkingRoutine,routineContext} from './working-routines.mjs';
export function adapt(state,action,outcome,now=Date.now()){
 if(outcome==='didnt-fit'&&action.workingRoutineId&&state.outcomes.slice(-2).length===2&&state.outcomes.slice(-2).every(o=>o.value==='didnt-fit'&&(o.workingRoutineId===action.workingRoutineId||(o.dataUsed||[]).includes(action.workingRoutineId)))){
  pauseWorkingRoutine(state,action.workingRoutineId);state.pendingBlocker={focus:action.type.split('-')[0],reason:'routine-fit',at:now};return prepareToday(state,now);
 }
 if(outcome==='didnt-fit')return prepareToday(state,now,{smaller:true,repeat:action.type,routineId:action.workingRoutineId});
 if(outcome==='helped'){if(action.workingRoutineId){const r=state.workingRoutines.find(r=>r.id===action.workingRoutineId);if(r)r.fit=routineContext(state);}state.pendingBlocker=null;state.blocker=null;return prepareToday(state,now,{repeat:action.type,repeatOf:action.id,smaller:action.minutes===1,routineId:action.workingRoutineId});}
 if(outcome==='didnt-help'){if(action.workingRoutineId)pauseWorkingRoutine(state,action.workingRoutineId);for(const p of state.weeklyPlans)if(p.actionId===action.id||!p.actionId&&p.title===action.title)p.retired=true;
 const recent=state.outcomes.slice(-2);if(recent.length===2&&recent.every(o=>o.value==='didnt-help'))state.pendingBlocker={focus:action.type.split('-')[0],at:now};state.rejected=[...new Set([...state.rejected,action.type])];return prepareToday(state,now,{different:true,previousType:action.type});}
 if(outcome==='didnt-try'){state.pendingWant={type:action.type,at:now};return prepareToday(state,now);}
 return prepareToday(state,now);
}
