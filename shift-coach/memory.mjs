import {uid,cancelAffected,fact} from './store.mjs';import {stages} from './voice.mjs';import {boundary} from './safety.mjs';
const keys=['goal','week','focus'];
export function saveFact(state,key,value,now=Date.now(),confirmed=true){
 if(!keys.includes(key)||typeof value!=='string'||!value.trim()||value.length>240||typeof confirmed!=='boolean')throw Object.assign(Error('invalid_fact'),{status:400});
 if(!boundary(value).coaching)throw Object.assign(Error('health_concern_use_help'),{status:422});
 if(key==='focus'&&!['food','movement','reflection'].includes(value))throw Object.assign(Error('invalid_focus'),{status:400});
 const old=state.facts.find(f=>f.key===key);
 if(old)cancelAffected(state,[old.id]);
 state.facts=state.facts.filter(f=>f.key!==key);
 const f={id:uid(),key,value:value.trim(),at:now,source:'member',confirmed,inferred:!confirmed};state.facts.push(f);state.lastActivity=now;
 return{dataUsed:confirmed?[f.id]:[],fact:f};
}
export function setup(state,input,now=Date.now()){
 if(!input||typeof input!=='object'||!keys.every(k=>typeof input[k]==='string')||!stages.includes(input.stage))throw Object.assign(Error('invalid_setup'),{status:400});
 for(const k of keys)saveFact(state,k,input[k],now);
 state.stage=input.stage;return{dataUsed:state.facts.filter(f=>f.confirmed).map(f=>f.id)};
}
export function memoryView(state){return{facts:state.facts,derivedPlans:state.weeklyPlans,preparedActions:state.actions.filter(a=>a.status!=='cancelled'),settings:state.settings,permissions:state.permissions,mode:state.mode,stage:state.stage,components:state.components,rejections:state.rejected,outcomes:state.outcomes,readings:state.readings,doses:state.doses,reviews:state.reviews,calendar:state.calendar,pendingWant:state.pendingWant,pausedTypes:state.pausedTypes,pauseRequests:state.pauseRequests||[]};}
export const chosenGoal=s=>fact(s,'goal');
