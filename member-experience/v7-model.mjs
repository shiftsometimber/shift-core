import {applyV7Fit} from './v7-fit.mjs';
import {journeyDay} from './journey-records.mjs';

const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const states=new Set(['helped','not-helped','later']);
export const v7Preferences=progress=>{
 const p=progress?.v7?.preferences||{},showWeight=p.showWeight!==false;
 return {showWeight,lead:showWeight&&['weight','strength','energy'].includes(p.lead)?p.lead:!showWeight&&['strength','energy'].includes(p.lead)?p.lead:showWeight?'weight':'strength',activity:p.activity||null};
};
export function v7Week(day){
 const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);
}
export function v7Logs(progress){return Object.values(progress?.v7?.days||{}).filter(d=>d.log).sort((a,b)=>a.on.localeCompare(b.on));}
export function v7State(progress,at=new Date().toISOString()){
 const today=journeyDay(at),logs=v7Logs(progress),week=v7Week(today),last=logs.at(-1),prefs=v7Preferences(progress);
 return {today,preferences:prefs,count:Math.min(30,logs.length),lifetimeCount:logs.length,target:30,weeklyCount:logs.filter(d=>d.on>=week&&d.on<=today).length,week,
  completedToday:!!progress?.v7?.days?.[today]?.log,milestone:progress?.v7?.milestones?.['30']||null,
  returning:!!last&&Date.parse(today)-Date.parse(last.on)>=7*86400000,
  // Read prepared insights only. Never calculate stalls or recaps while opening a screen.
  fit:publicFit(progress?.v7?.fit),insights:publicInsights(progress?.v7?.insights,prefs.showWeight),activityReadings:progress?.v7?.activityReadings||[],energyReadings:progress?.v7?.energyReadings||[]};
}
function publicFit(fit){if(!fit)return null;return {selected:fit.selected||null,alternatives:fit.alternatives||[],choices:(fit.choices||[]).map(({id,minutes,kit,name})=>({id,minutes,kit,name})),healthTags:fit.healthTags||[],moves:fit.moves||{},days:fit.days||{}};}
function publicInsights(insights,showWeight){
 if(!insights)return null;
 return {...insights,stall:showWeight?insights.stall:null,recap:insights.recap?{...insights.recap,items:(insights.recap.items||[]).filter(x=>showWeight||x.topic!=='weight'),weight:showWeight?insights.recap.weight:null}:null};
}
const state=progress=>progress.v7||(progress.v7={version:1,preferences:{showWeight:true,lead:'weight'},days:{},milestones:{},activityReadings:[]});
const plainAction=a=>{
 if(!a||typeof a.id!=='string'||!a.id||typeof a.name!=='string'||!a.name.trim())fail('Your action could not be confirmed. Reload Today.',409);
 // Store only server-prepared action fields. Client-supplied food amounts are never accepted.
 return structuredClone(a);
};
function offered(progress,on,context){
 const current=progress.v7?.days?.[on]?.selected;
 const options=[context?.action,...(context?.alternatives||[])].filter(Boolean);
 return {current,options};
}
export function applyV7Operation(progress,input,at=new Date().toISOString(),context={}){
 if(!String(input.action||'').startsWith('v7-'))return null;
 const on=journeyDay(at),previous=progress.v7,existing=previous?.days?.[on],prefs=v7Preferences(progress);
 if(input.action.startsWith('v7-fit-'))return applyV7Fit(progress,input,at,context,()=>applyV7Operation(progress,{...input,action:'v7-complete',actionId:input.sessionId},at,context));
 if(input.action==='v7-quick'){
  if(!['pint','takeaway','gym','sleep'].includes(input.kind))fail('Choose an available quick log.');
  const s=state(progress);s.quick=s.quick||[];s.quick.push({id:input.operationId,on,at,kind:input.kind});s.quick=s.quick.slice(-365);return true;
 }
 if(input.action==='v7-refresh'){
  if(input.revision!==progress.revision)fail('Your choices changed. Reload before preparing alternatives.',409);
  if(!context.preparedOffers?.action)fail('No reviewed alternatives could be confirmed. Your current action is safe.',503);
  state(progress).offers=structuredClone(context.preparedOffers);return true;
 }
 if(input.action==='v7-preferences'){
  if(input.revision!==progress.revision)fail('Your preferences changed. Reload before saving.',409);
  if(input.showWeight!==undefined&&typeof input.showWeight!=='boolean')fail('Choose whether to show weight.');
  const showWeight=input.showWeight??prefs.showWeight;
  let lead=input.lead??prefs.lead;
  if(input.showWeight===false&&lead==='weight')lead='strength';
  if(!['weight','strength','energy'].includes(lead)||!showWeight&&lead==='weight')fail('Choose an available Journey view.');
  if(input.showWeight===true&&prefs.showWeight===false)lead='weight';
  const next={...prefs,showWeight,lead};
  if(input.activity!==undefined){
   const a=input.activity;
   if(!a||Object.keys(a).some(k=>!['name','unit'].includes(k))||typeof a.name!=='string'||!a.name.trim()||a.name.length>80||!['reps','sprints','minutes','metres','kg'].includes(a.unit))fail('Name your activity and choose its unit.');
   next.activity={name:a.name.trim(),unit:a.unit};
  }
  if(JSON.stringify(next)===JSON.stringify(prefs))return false;
  state(progress).preferences=next;return true;
 }
 if(input.action==='v7-energy-reading'){
  if(typeof input.value!=='number'||!Number.isInteger(input.value)||input.value<1||input.value>10)fail('Choose the energy score you recorded, from 1 to 10.');
  const s=state(progress);s.energyReadings=s.energyReadings||[];s.energyReadings.push({id:input.operationId,on,at,value:input.value});return true;
 }
 if(input.action==='v7-activity-reading'){
  if(input.revision!==progress.revision)fail('Your activity changed. Reload before saving.',409);
  if(!prefs.activity||typeof input.value!=='number'||!Number.isFinite(input.value)||input.value<0||input.value>100000)fail('Choose an activity and enter the amount you recorded.');
  const s=state(progress);s.activityReadings.push({id:input.operationId,on,at,activity:structuredClone(prefs.activity),value:input.value});return true;
 }
 if(input.action==='v7-feedback'){
  if(!states.has(input.outcome))fail('Choose an available answer.');
  const s=state(progress),day=s.days[input.on];
  if(!day?.log||day.log.id!==input.logId)fail('This completed action could not be confirmed.',409);
  if(day.feedback?.outcome===input.outcome)return false;
  day.feedback={outcome:input.outcome,at};return true;
 }
 if(input.action==='v7-decline'){
  if(!['not-fit','not-tried'].includes(input.outcome))fail('Choose what happened.');
  if(existing?.log)fail('Your action is already complete. Use the optional feedback instead.',409);
  const {current,options}=offered(progress,on,context),selected=current||options[0];
  if(!selected||selected.id!==input.actionId)fail('Your action changed. Reload Today.',409);
  const s=state(progress),day=s.days[on]||(s.days[on]={on});
  day.selected=plainAction(selected);day.before={outcome:input.outcome,at};return true;
 }
 if(input.action==='v7-select'){
  if(existing?.log)fail('You have already earned today’s log. Another choice will not add a log.',409);
  if(input.revision!==progress.revision)fail('Your action changed. Reload Today before swapping.',409);
  const {options}=offered(progress,on,context),a=options.find(a=>a.id===input.actionId);
  if(!a)fail('Choose one of your available actions.',409);
  const s=state(progress),day=s.days[on]||(s.days[on]={on});
  if(day.selected?.id===a.id&&!day.before)return false;
  day.selected=plainAction(a);delete day.before;return true;
 }
 if(input.action==='v7-complete'){
  // The account/day ledger is inside the same revision-guarded SQL write as the action.
  // A second device retries against the winning revision and reaches this no-op.
  if(existing?.log)return false;
  const {current,options}=offered(progress,on,context),a=current||options[0];
  if(!a||a.pending||a.id!==input.actionId)fail('Your action changed. Reload Today before completing it.',409);
  const s=state(progress),day=s.days[on]||(s.days[on]={on});day.selected=plainAction(a);
  day.log={id:input.operationId,at,action:plainAction(a)};delete day.before;
  const count=v7Logs(progress).length;
  if(count===30&&!s.milestones['30'])s.milestones['30']={id:input.operationId+'-30',at,count:30};
  return true;
 }
 fail('Unknown Timber action.');
}
export function v7Share(progress,at=new Date().toISOString()){
 const logs=v7Logs(progress),today=journeyDay(at),week=v7Week(today);
 // Deliberate allowlist: never include goals, memories, readings, symptoms, treatment or weight.
 return {brand:'MY TIMBER',title:'STILL STACKING.',logs:Math.min(30,logs.length),target:30,
  weekCount:logs.filter(d=>d.on>=week&&d.on<=today).length,milestone:progress?.v7?.milestones?.['30']?30:null};
}
export function v7NextReason(progress,today){
 const days=Object.values(progress?.v7?.days||{}).filter(d=>d.on<today).sort((a,b)=>b.on.localeCompare(a.on));
 const prior=days.find(d=>d.feedback&&d.feedback.outcome!=='later'||d.before);
 if(!prior)return {outcome:null,actionId:null,text:null};
 const outcome=prior.feedback?.outcome==='later'?null:prior.feedback?.outcome||prior.before?.outcome;
 return {outcome,actionId:prior.selected?.id,previousName:prior.selected?.name,text:outcome==='not-helped'?'You tried the last idea and said it did not help, so today uses a different approach.':outcome==='not-fit'?'You said the last idea did not fit, so here is a different option.':outcome==='not-tried'?'The last step did not fit your day. Here is something smaller.':outcome==='helped'?'You said the last approach helped. Keep the useful part if it fits today.':null};
}
