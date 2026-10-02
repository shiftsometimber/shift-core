import {library,tone,knowledgePolicy,everydayTask,treatmentSupport,challengeLabels,availableActions} from './voice.mjs';import {fact,uid} from './store.mjs';import {canExecute} from './permissions.mjs';import {boundary} from './safety.mjs';
export function prepareToday(state,now=Date.now(),variation=null){
 for(const a of state.actions)if(['prepared','accepted'].includes(a.status))a.status='superseded';
 const goal=fact(state,'goal'),week=fact(state,'week'),focus=fact(state,'focus'),challenge=fact(state,'challenge');
 if([goal,week].some(f=>f&&!boundary(f.value).coaching))return null;
 const candidates=availableActions(state);
 const currentIds=new Set([...state.facts.filter(f=>f.confirmed).map(f=>f.id),...state.readings.map(r=>r.id)]);
 const feedback=state.outcomes.filter(o=>(o.dataUsed||[]).every(id=>currentIds.has(id))).at(-1);
 const previous=library.find(a=>a.type===variation?.previousType);
 const pool=candidates.filter(a=>(!focus||a.focus===focus.value)&&(!variation?.different||a.approach!==previous?.approach));
 const ranked=[...pool].sort((a,b)=>Number(b.challenges.includes(challenge?.value||'everyday'))-Number(a.challenges.includes(challenge?.value||'everyday')));
 const helpful=feedback?.value==='helped'&&ranked.find(a=>a.type===feedback.type&&(!challenge||a.challenges.includes(challenge.value)));
 const keepSmall=!!variation?.smaller||feedback?.value==='didnt-fit'&&!variation?.different;
 const card=keepSmall?candidates.find(a=>a.type===(variation?.previousType||feedback?.type))||ranked[0]:helpful||ranked[0];
 const calendarFact=state.permissions.calendar?state.readings.filter(r=>r.source==='calendar'&&!r.conflict).at(-1):null;
 const dataUsed=[goal?.id,week?.id,focus?.id,challenge?.id,calendarFact?.id].filter(Boolean);
 const smaller=keepSmall||state.stage==='Hit a wall'||/late|busy|shift|no free/i.test(week?.value||'');
 const task=everydayTask(card?.type,keepSmall,state.mode,week?.value||'');
 const title=variation?.welcome?'Pick one thing to restart your week':state.pendingWant?'Do you still want this action?':card?(keepSmall?task?.title:state.mode==='stopped'&&card.type==='food-plan'?task.title:smaller?card.small:variation?.different?card.alternative:card.title):'Choose what you want help with next';
 const remembered=feedback?(feedback.value==='didnt-help'&&card&&card.approach!==(feedback.approach||library.find(a=>a.type===feedback.type)?.approach)?` You said “${feedback.title||'your earlier step'}” didn’t help. This tries a different approach.`:feedback.value==='didnt-fit'?` Your last step didn’t fit. This keeps the aim and makes the first step smaller.`:feedback.value==='helped'?` You said your last step helped.${helpful?' Keep that useful bit.':''}`:feedback.value==='didnt-try'?` You haven’t tried the last step; you can keep it or choose something else.`:''):'';
 const reason=(goal&&week?`You chose “${goal.value}” and saved “${week.value}”.${calendarFact?' Your calendar has changed; this plan leaves room for it.':''}`:goal?`You chose “${goal.value}”.`:'General starter: choose something manageable for this week.')+(challenge?` You chose “${challengeLabels[challenge.value]}” as what is hardest right now.`:'')+remembered+' '+treatmentSupport(state.mode).title+'.';
 const action={id:uid(),type:card?.type||'member-choice',approach:card?.approach||null,challenge:challenge?.value||'everyday',component:state.components.includes(card?.component)?card.component:state.components[0],title,reason,general:!goal,tone:variation?.welcome?'Good to have you back. Start with today.':state.mode==='stopped'?'Your support carries on after treatment. Keep the routine useful and the next step manageable.':tone(state.stage),minutes:keepSmall?1:smaller?2:state.stage==='Just starting'?Math.min(3,card?.minutes||2):card?.minutes||2,dataUsed,sources:calendarFact?['calendar']:[],status:'prepared',preparedAt:now,knowledge:knowledgePolicy,awaitingWant:!!state.pendingWant};
 action.task=task;state.actions.push(action);return action;
}
// Read-only path: never calls a model and never regenerates an invalid action.
export function readToday(state){const action=[...state.actions].reverse().find(a=>['prepared','accepted'].includes(a.status)&&canExecute(state,a));return action?{...action,task:everydayTask(action.type,action.minutes===1,state.mode,fact(state,'week')?.value||'')}:null;}
