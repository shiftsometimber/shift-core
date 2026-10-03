import {prepareToday} from './today.mjs';
import {saveFact} from './memory.mjs';
import {saveConstraints} from './progression.mjs';
import {setSettings} from './permissions.mjs';
export function mode(state,value,now=Date.now()){
 if(!['none','shift','elsewhere','planning-stop','stopped'].includes(value))throw Object.assign(Error('invalid_mode'),{status:400});
 state.mode=value;
 if(value==='stopped')state.queue=state.queue.filter(q=>q.sources.every(s=>s!=='dose'));
 const a=prepareToday(state,now,{replace:true});return{dataUsed:a?.dataUsed||[]};
}
export function circumstances(state,input,now=Date.now()){
 if(!['stopped','cost','provider','appetite','routine'].includes(input.change)||typeof input.followup!=='boolean'||typeof input.week!=='string'||input.week.length>240)throw Object.assign(Error('invalid_circumstances'),{status:400});
 if(input.change==='routine'&&!input.week.trim())throw Object.assign(Error('describe_changed_routine'),{status:400});
 if(input.week.trim())saveFact(state,'week',input.week,now);
 if(input.change==='stopped')state.mode='stopped';
 if(input.change==='provider'){
  if(!['none','shift','elsewhere','planning-stop','stopped'].includes(input.mode))throw Object.assign(Error('invalid_mode'),{status:400});
  state.mode=input.mode;
 }
 if(input.change==='cost')saveConstraints(state,{budget:'tight'});
 if(input.change==='appetite'){
  if(!['low-appetite','returning-food-noise'].includes(input.challenge))throw Object.assign(Error('invalid_appetite_choice'),{status:400});
  saveFact(state,'challenge',input.challenge,now);
  saveFact(state,'focus','food',now);
 }
 // Keep unsuccessful approaches excluded and all reported outcomes.
 // A changed week clears a pending blocker so the member can choose a fresh step.
 state.pendingWant=null;state.pendingBlocker=null;
 const action=prepareToday(state,now,{replace:true,...(input.change==='routine'?{smaller:true}:{})});
 setSettings(state,{...(input.followup?{proactive:true}:{}),followup:input.followup});
 state.lastActivity=now;
 return {dataUsed:action?.dataUsed||[],outcome:input.change};
}
export function returning(state,now=Date.now()){return state.lastActivity!==null&&now-state.lastActivity>=14*86400000;}
