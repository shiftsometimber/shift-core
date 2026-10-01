import {cancelAffected} from './store.mjs';
import {scrubAudit} from './audit.mjs';
export function deleteItem(state,id){
 const item=state.facts.find(f=>f.id===id)||state.readings.find(f=>f.id===id)||state.doses.find(f=>f.id===id)||state.reviews.find(f=>f.id===id);
 if(!item)throw Object.assign(Error('item_not_found'),{status:404});
 cancelAffected(state,[id]);
 state.facts=state.facts.filter(f=>f.id!==id);state.readings=state.readings.filter(f=>f.id!==id);state.doses=state.doses.filter(f=>f.id!==id);state.reviews=state.reviews.filter(f=>f.id!==id);
 state.outcomes=state.outcomes.filter(o=>!o.dataUsed.includes(id));
 state.actions=state.actions.filter(a=>a.status!=='cancelled');
 state.nightRuns=[];state.calendar=state.calendar.filter(c=>!c.dataUsed.includes(id));
 return{dataUsed:[]};
}
export async function finishDeletion(DB,member,id){await scrubAudit(DB,member,id);}
