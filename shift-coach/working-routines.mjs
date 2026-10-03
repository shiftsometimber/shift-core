import {uid, cancelAffected, fact} from './store.mjs';
import {library, availableActions} from './voice.mjs';
import {boundary} from './safety.mjs';
export const safeWorkingDetail=text=>typeof text==='string'&&boundary(text).coaching&&!/\b(?:skip(?:ping|ped)?\s+(?:all\s+)?(?:meals?|breakfast|lunch|dinner)|(?:no|without)\s+food|fast(?:ed|ing)|laxatives?|detox|punish\w*|push\s+through\s+(?:the\s+)?pain)\b/i.test(text);
export function routineContext(state){return{weekId:fact(state,'week')?.id||null,challengeId:fact(state,'challenge')?.id||null,mode:state.mode,constraints:{...(state.constraints?.value||{})}};}
export function routineNeedsReview(state,routine){return !routine.fit||JSON.stringify(routine.fit)!==JSON.stringify(routineContext(state));}

// Member reports, not inferred habits or clinical recommendations. Stored in
// the existing consent-bound coaching snapshot and removable independently.
export function saveWorkingRoutine(state, outcomeId, text, now=Date.now()) {
  if(typeof text!=='string'||!text.trim()||text.length>400)throw Object.assign(Error('invalid_working_detail'),{status:400});
  if(!safeWorkingDetail(text))throw Object.assign(Error('health_concern_use_help'),{status:422});
  const outcome=state.outcomes.find(o=>o.id===outcomeId&&o.value==='helped');
  if(!outcome)throw Object.assign(Error('helpful_outcome_required'),{status:409});
  const previous=(state.workingRoutines||[]).find(r=>r.outcomeId===outcomeId);
  if(previous)forgetWorkingRoutine(state,previous.id);
  else if((state.workingRoutines||[]).length>=20)throw Object.assign(Error('working_routine_limit'),{status:409});
  const action=state.actions.find(a=>a.id===outcome.actionId);
  const routine={id:uid(),outcomeId,actionId:outcome.actionId,type:outcome.type,focus:library.find(a=>a.type===outcome.type)?.focus||'reflection',text:text.trim(),at:now,confirmed:true,source:'member',status:'active',fit:outcome.routineContext||action?.routineContext||null,constraints:{...(outcome.practicalContext||action?.practicalContext||{})}};
  state.workingRoutines=[...(state.workingRoutines||[]),routine];state.lastActivity=now;
  return {dataUsed:[routine.id]};
}

export function forgetWorkingRoutine(state,id) {
  if(!(state.workingRoutines||[]).some(r=>r.id===id))throw Object.assign(Error('working_routine_missing'),{status:404});
  cancelAffected(state,[id]);
  state.workingRoutines=state.workingRoutines.filter(r=>r.id!==id);
  state.outcomes=state.outcomes.filter(o=>!(o.dataUsed||[]).includes(id));
  state.audit=state.audit.map(a=>({...a,dataUsed:a.dataUsed.filter(x=>x!==id)}));
  state.nightRuns=[];
  return {dataUsed:[]};
}

export function pauseWorkingRoutine(state,id){
  const routine=(state.workingRoutines||[]).find(r=>r.id===id);
  if(!routine)throw Object.assign(Error('working_routine_missing'),{status:404});
  const wanted=state.pendingWant,affectedCurrent=state.actions.some(a=>['accepted','prepared'].includes(a.status)&&(a.dataUsed||[]).includes(id));
  routine.status='needs-change';cancelAffected(state,[id]);if(!affectedCurrent)state.pendingWant=wanted;state.nightRuns=[];
  return{dataUsed:[id],previousType:routine.type};
}

export function workingRoutineOptions(state) {
  const focus=fact(state,'focus')?.value,challenge=fact(state,'challenge')?.value,c=state.constraints?.value||{};
  const types=new Set(availableActions(state).map(a=>a.type));
  return (state.workingRoutines||[]).filter(r=>{
    if(!r.confirmed||r.status==='needs-change'||!types.has(r.type)||r.focus!==focus||!safeWorkingDetail(r.text))return false;
    if(challenge==='sore-knees'&&focus==='movement'&&!library.find(a=>a.type===r.type)?.challenges.includes('sore-knees'))return false;
    if(c.kitchen==='no-cook'&&['food-plan','food-prepare'].includes(r.type))return false;
    return true;
  }).sort((a,b)=>b.at-a.at).map(r=>({...r,needsFitReview:routineNeedsReview(state,r)}));
}
export const eligibleWorkingRoutines=state=>workingRoutineOptions(state).filter(r=>!r.needsFitReview);

export function workingRoutineTask(routine,smaller=false) {
  if(smaller)return {title:'One part of your own routine',steps:['Choose one manageable part of your saved routine: “'+routine.text+'”.']};
  return {title:'Your own '+(routine.focus==='food'?'food':routine.focus==='movement'?'movement':'everyday')+' routine',steps:[
    'You said this helped: “'+routine.text+'”.',
    smaller?'Choose one manageable part of that routine for today.':'Choose one occasion when this still fits your day. You can leave it out or change approach.',
    'This is your saved everyday experience. Treatment questions and anything you are unsure is suitable belong with a healthcare professional.'
  ]};
}
