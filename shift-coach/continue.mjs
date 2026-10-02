import {prepareToday} from './today.mjs';
export function mode(state,value,now=Date.now()){
 if(!['shift','elsewhere','stopped'].includes(value))throw Object.assign(Error('invalid_mode'),{status:400});
 state.mode=value;
 if(value==='stopped')state.queue=state.queue.filter(q=>q.sources.every(s=>s!=='dose'));
 const a=prepareToday(state,now);return{dataUsed:a.dataUsed};
}
export function returning(state,now=Date.now()){return state.lastActivity!==null&&now-state.lastActivity>=14*86400000;}
