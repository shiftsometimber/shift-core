import {library,tone,knowledgePolicy,everydayTask,treatmentSupport,challengeLabels,availableActions} from './voice.mjs';import {fact,uid} from './store.mjs';import {canExecute} from './permissions.mjs';import {boundary} from './safety.mjs';
export function prepareToday(state,now=Date.now(),variation=null){
 const current=readToday(state);
 if(current?.status==='accepted'&&!variation)return current;
 const replaced=state.actions.filter(a=>['prepared','accepted'].includes(a.status));
 const replacedIds=new Set(replaced.map(a=>a.id));
 for(const a of replaced)a.status='superseded';
 state.queue=state.queue.filter(q=>!replacedIds.has(q.actionId));
 for(const p of state.weeklyPlans)if(replacedIds.has(p.actionId)||!p.actionId&&replaced.some(a=>a.title===p.title))p.retired=true;
 const goal=fact(state,'goal'),week=fact(state,'week'),focus=fact(state,'focus'),challenge=fact(state,'challenge');
 if([goal,week].some(f=>f&&!boundary(f.value).coaching))return null;
 const c=state.constraints?.value||{};
 let candidates=availableActions(state);
 if(c.kitchen==='no-cook')candidates=candidates.filter(a=>!['food-plan','food-prepare'].includes(a.type));
 const priority=c.kitchen==='no-cook'?['food-assemble','food-backup','food-cupboard']:c.budget==='tight'?['food-cupboard','food-backup']:c.time==='short'?['food-backup','movement-anchor']:[];
 candidates.sort((a,b)=>Number(b.challenges.includes(challenge?.value||'everyday'))-Number(a.challenges.includes(challenge?.value||'everyday')));
 candidates.sort((a,b)=>(priority.includes(a.type)?priority.indexOf(a.type):-1)<0?(priority.includes(b.type)?1:0):(priority.includes(b.type)?priority.indexOf(a.type)-priority.indexOf(b.type):-1));
 let card=variation?.different?candidates.find(a=>a.focus===focus?.value&&a.approach!==library.find(p=>p.type===variation.previousType)?.approach):candidates.find(a=>a.focus===focus?.value);
 if(!focus)card=card||candidates.find(a=>a.type!==variation?.previousType)||candidates[0];
 if(variation?.repeat){const repeat=candidates.find(a=>a.type===variation.repeat);if(repeat)card=repeat;}
 if(state.pendingBlocker)card=null;
 const calendarFact=state.permissions.calendar?state.readings.filter(r=>r.source==='calendar'&&!r.conflict).at(-1):null;
 const dataUsed=[goal?.id,week?.id,focus?.id,state.constraints?.id,challenge?.id,calendarFact?.id].filter(Boolean);
 const smaller=variation?.smaller||c.time==='short'||state.stage==='Hit a wall'||/late|busy|shift|no free/i.test(week?.value||'');
 let task=everydayTask(card?.type,!!variation?.smaller,state.mode,week?.value||'');
 if(task&&c.kitchen==='no-cook'&&card.type.startsWith('food-')&&card.type!=='food-assemble')task={...task,steps:[...task.steps,'Keep this a no-cook choice: use ready-to-eat foods and follow their label and storage instructions.']};
 const title=variation?.welcome?'Pick one thing to restart your week':state.pendingWant?'Do you still want this action?':card?(variation?.smaller?task.title:state.mode==='stopped'&&card.type==='food-plan'?task.title:smaller?card.small:variation?.different?card.alternative:card.title):state.pendingBlocker?'What got in the way?':'Choose what you want help with next';
  const currentIds=new Set([...state.facts.filter(f=>f.confirmed).map(f=>f.id),...state.readings.map(r=>r.id),state.constraints?.id].filter(Boolean));
 const feedback=state.outcomes.filter(o=>(o.dataUsed||[]).every(id=>currentIds.has(id))).at(-1);
 const remembered=feedback?(feedback.value==='didnt-help'&&card&&card.approach!==(feedback.approach||library.find(a=>a.type===feedback.type)?.approach)?` You said “${feedback.title||'your earlier step'}” didn’t help. This tries a different approach.`:feedback.value==='didnt-fit'?` Your last step didn’t fit. This keeps the aim and makes the first step smaller.`:feedback.value==='helped'?` You said your last step helped. Keep that useful bit.`:feedback.value==='didnt-try'?` You haven’t tried the last step; you can keep it or choose something else.`:''):'';
 const reason=(goal&&week?`You chose “${goal.value}” and saved “${week.value}”.${calendarFact?' Your calendar has changed; this plan leaves room for it.':''}`:goal?`You chose “${goal.value}”.`:'General starter: choose something manageable for this week.')+(challenge?` You chose “${challengeLabels[challenge.value]}” as what is hardest right now.`:'')+remembered+' '+treatmentSupport(state.mode).title+'.';
 const action={id:uid(),type:card?.type||'member-choice',approach:card?.approach||null,challenge:challenge?.value||'everyday',component:state.components.includes(card?.component)?card.component:state.components[0],title,reason,general:!goal,tone:variation?.welcome?'Good to have you back. Start with today.':state.mode==='stopped'?'Your support carries on after treatment. Keep the routine useful and the next step manageable.':tone(state.stage),minutes:variation?.smaller?1:smaller?2:state.stage==='Just starting'?Math.min(3,card?.minutes||2):card?.minutes||2,dataUsed,sources:calendarFact?['calendar']:[],status:'prepared',preparedAt:now,knowledge:knowledgePolicy,awaitingWant:!!state.pendingWant};
 action.task=task;action.repeatOf=variation?.repeatOf||null;action.keepSuccessful=!!variation?.repeat;state.startedAt=state.startedAt||now;state.actions.push(action);return action;
}
// Read-only path: never calls a model and never regenerates an invalid action.
export function readToday(state){const action=[...state.actions].reverse().find(a=>['prepared','accepted'].includes(a.status)&&canExecute(state,a));return action?{...action,task:action.task||everydayTask(action.type,action.minutes===1,state.mode,fact(state,'week')?.value||'')}:null;}
