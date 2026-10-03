import {uid} from './store.mjs';
export const constraintOptions={time:['flexible','short'],budget:['regular','tight'],kitchen:['cook','no-cook']};
export const blockerOptions={time:'Time or a busy day',cost:'Cost',equipment:'Cooking facilities',enjoyment:'That approach does not suit me',unsure:'I need help choosing'};
export function saveConstraints(state,input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!Object.hasOwn(constraintOptions,k)))throw Object.assign(Error('invalid_constraints'),{status:400});
 const next={time:'flexible',budget:'regular',kitchen:'cook',...state.constraints?.value,...input};
 for(const [key,values]of Object.entries(constraintOptions))if(!values.includes(next[key]))throw Object.assign(Error('invalid_constraints'),{status:400});
 for(const a of state.actions)if(['accepted','prepared'].includes(a.status))a.status='superseded';
 state.queue=[];state.weeklyPlans=state.weeklyPlans.map(p=>({...p,retired:true}));
 state.constraints={id:uid(),value:next};state.pendingBlocker=null;return {dataUsed:[state.constraints.id]};
}
export function chooseBlocker(state,key){
 if(!Object.hasOwn(blockerOptions,key))throw Object.assign(Error('invalid_blocker'),{status:400});
 state.blocker=key;state.pendingBlocker=null;
 const patch=key==='time'?{time:'short'}:key==='cost'?{budget:'tight'}:key==='equipment'?{kitchen:'no-cook'}:null;
 if(patch)saveConstraints(state,patch);return{dataUsed:state.constraints?[state.constraints.id]:[]};
}
export function journeyView(state,now=Date.now()){
 const started=state.startedAt||state.actions[0]?.preparedAt||now;
 const day=Math.max(1,Math.floor((now-started)/86400000)+1),outcomes=state.outcomes,helpful=outcomes.filter(o=>o.value==='helped');
 const accepted=state.actions.some(a=>a.status==='accepted');
 let title='One useful step to start',text='Choose a step that fits your day. You can make it smaller or change it.';
 if(accepted){title='Pick up your saved step';text='Your action stays here. After you try it, tell us whether it helped. A weekly review will not replace it.';}
 else if(state.pendingBlocker){title='Let’s change what is getting in the way';text=state.pendingBlocker.reason==='routine-fit'?'Your routine did not fit twice, even as a smaller step. Choose what is getting in the way before we suggest another.':'Two approaches did not help. Choose the obstacle before we suggest another.';}
 else if(helpful.length){title='Keep what worked, then choose the next step';text='Your feedback matters more than the date. Repeat the useful version or choose a different step when you are ready.';}
 else if(outcomes.length){title='Use what you learnt';text='A step that did not fit is useful feedback. Change the approach or choose a smaller commitment.';}
 if(day>=7&&!accepted&&!state.pendingBlocker)text+=' Use your weekly review to record how the week felt. Missing days are not failed days.';
 if(state.mode==='planning-stop')text+=' Before treatment ends, choose a useful routine and a fallback. Discuss medication changes with your prescriber.';
 if(state.mode==='stopped')text+=' After treatment, review returning hunger or food noise in Your week; keep a helpful routine or tell us when it stops fitting.';
 return{day,firstWeek:day<=7,title,text,reported:outcomes.length,helpful:helpful.length,completionInferred:false};
}
