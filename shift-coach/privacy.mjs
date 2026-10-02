import {cancelAffected} from './store.mjs';
export function deleteItem(state,id){
 if(!state.facts.some(f=>f.id===id)&&!state.reviews.some(f=>f.id===id))throw Object.assign(Error('item_not_found'),{status:404});
 cancelAffected(state,[id]);
 state.facts=state.facts.filter(f=>f.id!==id);state.reviews=state.reviews.filter(f=>f.id!==id);
 state.outcomes=state.outcomes.filter(o=>!o.dataUsed.includes(id));
 state.audit=state.audit.map(a=>({...a,dataUsed:a.dataUsed.filter(x=>x!==id)}));
 state.nightRuns=[];return {dataUsed:[]};
}
