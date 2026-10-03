import {cancelAffected} from './store.mjs';
export function deleteItem(state,id){
 if(!state.facts.some(f=>f.id===id)&&!state.reviews.some(f=>f.id===id))throw Object.assign(Error('item_not_found'),{status:404});
 cancelAffected(state,[id]);
 state.facts=state.facts.filter(f=>f.id!==id);state.reviews=state.reviews.filter(f=>f.id!==id);
 const removed=state.outcomes.filter(o=>o.dataUsed.includes(id));
 const routines=(state.workingRoutines||[]).filter(r=>removed.some(o=>o.id===r.outcomeId)||r.fit?.weekId===id||r.fit?.challengeId===id);
 cancelAffected(state,routines.map(r=>r.id));state.workingRoutines=(state.workingRoutines||[]).filter(r=>!routines.includes(r));
 state.outcomes=state.outcomes.filter(o=>!o.dataUsed.includes(id)&&!o.dataUsed.some(x=>routines.some(r=>r.id===x)));
 state.audit=state.audit.map(a=>({...a,dataUsed:a.dataUsed.filter(x=>x!==id)}));
 state.nightRuns=[];return {dataUsed:[]};
}
