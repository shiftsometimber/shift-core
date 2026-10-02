import {library,tone,knowledgePolicy} from './voice.mjs';import {fact,uid} from './store.mjs';import {canExecute} from './permissions.mjs';
export function prepareToday(state,now=Date.now(),variation=null){
 for(const a of state.actions)if(['prepared','accepted'].includes(a.status))a.status='superseded';
 const goal=fact(state,'goal'),week=fact(state,'week'),focus=fact(state,'focus');
 const candidates=library.filter(a=>!state.rejected.includes(a.type)&&!state.pausedTypes.includes(a.type));
 let card=variation?.different?candidates.find(a=>a.focus===focus?.value&&a.type!==variation.previousType):candidates.find(a=>a.focus===focus?.value);
 if(!focus)card=card||candidates.find(a=>a.type!==variation?.previousType)||candidates[0];
 const calendarFact=state.permissions.calendar?state.readings.filter(r=>r.source==='calendar'&&!r.conflict).at(-1):null;
 const dataUsed=[goal?.id,week?.id,focus?.id,calendarFact?.id].filter(Boolean);
 const smaller=variation?.smaller||state.stage==='Hit a wall'||/late|busy|shift|no free/i.test(week?.value||'');
 const title=variation?.welcome?'Pick one thing to restart your week':state.pendingWant?'Do you still want this action?':card?(smaller?card.small:variation?.different?card.alternative:card.title):'Choose what you want help with next';
 const reason=goal&&week?`You chose “${goal.value}” and saved “${week.value}”.${calendarFact?' Your calendar has changed; this plan leaves room for it.':''}`:goal?`You chose “${goal.value}”.`:'General starter: choose something manageable for this week.';
 const action={id:uid(),type:card?.type||'member-choice',component:state.components.includes(card?.component)?card.component:state.components[0],title,reason,general:!goal,tone:variation?.welcome?'Good to have you back. Start with today.':state.mode==='stopped'?'Your support carries on after treatment. Keep the routine useful and the next step manageable.':tone(state.stage),minutes:variation?.smaller?1:smaller?2:state.stage==='Just starting'?Math.min(3,card?.minutes||2):card?.minutes||2,dataUsed,sources:calendarFact?['calendar']:[],status:'prepared',preparedAt:now,knowledge:knowledgePolicy,awaitingWant:!!state.pendingWant};
 state.actions.push(action);return action;
}
// Read-only path: never calls a model and never regenerates an invalid action.
export function readToday(state){const action=[...state.actions].reverse().find(a=>['prepared','accepted'].includes(a.status)&&canExecute(state,a));return action||null;}
