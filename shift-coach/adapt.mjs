import {prepareToday} from './today.mjs';
export function adapt(state,action,outcome,now=Date.now()){
 if(outcome==='didnt-fit')return prepareToday(state,now,{smaller:true});
 if(outcome==='didnt-help'){state.rejected=[...new Set([...state.rejected,action.type])];return prepareToday(state,now,{different:true,previousType:action.type});}
 if(outcome==='didnt-try'){state.pendingWant={type:action.type,at:now};return prepareToday(state,now);}
 return prepareToday(state,now);
}
