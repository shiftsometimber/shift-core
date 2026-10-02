import {plansView} from './planning.mjs';
import {uid,cancelAffected,fact} from './store.mjs';import {stages,challengeLabels,library} from './voice.mjs';import {boundary} from './safety.mjs';
const requiredKeys=['goal','week','focus'];
const keys=[...requiredKeys,'challenge'];
export function saveFact(state,key,value,now=Date.now(),confirmed=true){
 if(!keys.includes(key)||typeof value!=='string'||!value.trim()||value.length>240||typeof confirmed!=='boolean')throw Object.assign(Error('invalid_fact'),{status:400});
 if(!boundary(value).coaching)throw Object.assign(Error('health_concern_use_help'),{status:422});
 if(key==='focus'&&!['food','movement','reflection'].includes(value))throw Object.assign(Error('invalid_focus'),{status:400});
 if(key==='challenge'&&!Object.hasOwn(challengeLabels,value))throw Object.assign(Error('invalid_challenge'),{status:400});
 const old=state.facts.find(f=>f.key===key);
 if(old)cancelAffected(state,[old.id]);
 state.facts=state.facts.filter(f=>f.key!==key);
 const f={id:uid(),key,value:value.trim(),at:now,source:'member',confirmed,inferred:!confirmed};state.facts.push(f);state.lastActivity=now;
 return{dataUsed:confirmed?[f.id]:[],fact:f};
}
export function setup(state,input,now=Date.now()){
 if(!input||typeof input!=='object'||!requiredKeys.every(k=>typeof input[k]==='string')||!stages.includes(input.stage))throw Object.assign(Error('invalid_setup'),{status:400});
 for(const k of requiredKeys)saveFact(state,k,input[k],now);
 if(input.challenge!==undefined)saveFact(state,'challenge',input.challenge,now);
 state.stage=input.stage;return{dataUsed:state.facts.filter(f=>f.confirmed).map(f=>f.id)};
}
export function memoryView(state){return{constraints:state.constraints?.value||{time:'flexible',budget:'regular',kitchen:'cook'},pendingBlocker:state.pendingBlocker||null,blocker:state.blocker||null,facts:state.facts,derivedPlans:plansView(state),preparedActions:state.actions.filter(a=>['prepared','accepted'].includes(a.status)),settings:state.settings,permissions:state.permissions,mode:state.mode,stage:state.stage,components:state.components,rejections:state.rejected,outcomes:state.outcomes.map(o=>({...o,title:o.title||'Earlier '+(library.find(a=>a.type===o.type)?.focus||'coaching')+' step'})),readings:state.readings,doses:state.doses,reviews:state.reviews,calendar:state.calendar,pendingWant:state.pendingWant,pausedTypes:state.pausedTypes,pauseRequests:state.pauseRequests||[]};}
export const chosenGoal=s=>fact(s,'goal');
