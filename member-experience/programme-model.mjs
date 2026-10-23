import {focusNextShift,resetNextShift} from './life-back/next-shift.mjs';

// Personal reflections belong to the existing account-owned Life Back history.
// They are not converted into its six-area score or clinical measurements.
export const programmeReasons={
 energy:{title:'More energy for the family',label:'Energy for the family',levels:['Running on empty','Often tired','Up and down','Mostly good','Plenty left']},
 clothes:{title:'Feel comfortable in my clothes',label:'Comfort in my clothes',levels:['Really uncomfortable','Often uncomfortable','It varies','Mostly comfortable','Comfortable as I am']},
 move:{title:'Move more comfortably',label:'Moving comfortably',levels:['Very difficult','Often difficult','It varies','Mostly manageable','Comfortable for me']},
 confidence:{title:'Get my confidence back',label:'My confidence',levels:['Very low','Lower than I’d like','Up and down','Mostly good','Feeling confident']},
 self:{title:'Feel more like myself',label:'Feeling like myself',levels:['Not much at all','A little','It comes and goes','Mostly myself','Feeling like me']},
 own:{title:'My own reason',label:'My own reason',levels:['A long way off','A little way there','Somewhere in the middle','Getting closer','In a good place']}
};
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status})};
const text=(value,max)=>{if(value!=null&&typeof value!=='string')fail('Use words for your reason, note and small win.');const s=(value||'').trim();if(s.length>max)fail('Your answer is too long. Please shorten it.');return s};
const sameFocus=(a,b)=>a?.selected?.[0]===b?.selected?.[0]&&(a?.selected?.[0]!=='own'||a.custom===b.custom);
const topic=focus=>focus==='food'?'food':focus==='movement'?'movement':'routine';
export const programmeReasonText=focus=>focus?.selected?.map(id=>id==='own'?focus.custom:programmeReasons[id]?.title).filter(Boolean).join('. ')||'';
export function programmeBaseline(p){return p?[p.baseline,...(p.focusHistory||[]),p.focus].find(f=>sameFocus(f,p.focus)):null}
export function programmeSummary(p,at=new Date().toISOString()){
 if(!p)return null;
 const days=Math.max(0,Math.floor((Date.parse(at)-Date.parse(p.baseline.at))/86400000)),baseline=programmeBaseline(p);
 const reason=p.focus.selected[0],value=baseline?.ratings[reason]??null;
 return {week:Math.min(4,Math.floor(days/7)+1),days,reflectionDue:Math.max(0,Math.floor((Date.parse(at)-Date.parse(baseline.at))/86400000))>=28,reviewDue:days>=7&&!p.weeklyReviews.some(r=>r.period===Math.floor(days/7)),reason:programmeReasonText(p.focus),smallWin:p.focus.win,baselineId:baseline?.id||null,baselineValue:value,baselineLabel:value?programmeReasons[reason].levels[value-1]:null,baselineAt:baseline?.at||null,originalBaseline:p.baseline,latestReflection:p.reflections.at(-1)||null};
}
export function applyProgrammeOperation(state,input,at){
 if(input.revision!==state.revision)fail('Your reason or step changed in another tab. Reload before saving.',409);
 if(!Number.isFinite(Date.parse(at)))fail('A valid date is required.');
 const old=state.programme;
 if(input.action==='programme-start'){
  const f=input.focus;
  if(!f||!Array.isArray(f.selected)||f.selected.length<1||f.selected.length>2||new Set(f.selected).size!==f.selected.length||f.selected.some(id=>!Object.hasOwn(programmeReasons,id)))fail('Choose one or two reasons that matter to you.');
  const custom=text(f.custom,160),note=text(f.note,240),win=text(f.win,200);
  if(f.selected.includes('own')&&!custom)fail('Put your own reason into words.');
  if(!win)fail('Choose a small win to work towards.');
  if(!f.ratings||f.selected.some(id=>!Number.isInteger(f.ratings[id])||f.ratings[id]<1||f.ratings[id]>5))fail('Choose a starting point for each reason.');
  const focus={id:input.operationId,at,selected:[...f.selected],custom:f.selected.includes('own')?custom:'',note,win,ratings:Object.fromEntries(f.selected.map(id=>[id,f.ratings[id]]))};
  if((old?.focusHistory.length||0)>=1000)fail('Your history is full. Contact support before changing your reason.',409);
  state.programme=old?{...old,focus,focusHistory:[...old.focusHistory,old.focus]}:{version:1,baseline:structuredClone(focus),focus,focusHistory:[],weeklyReviews:[],reflections:[]};
  const goal=(focus.selected[0]==='own'?custom:programmeReasons[focus.selected[0]].title).slice(0,70);
  if(state.goal!==goal){resetNextShift(state,at);state.goal=goal;state.goalId=input.operationId}
  if(!state.nextShift)focusNextShift(state,{operationId:input.operationId,supportNeed:'food'},at);
  return;
 }
 if(!old)fail('Keep your starting point before adding a review.',409);
 if(input.action==='programme-week'){
  const days=Math.floor((Date.parse(at)-Date.parse(old.baseline.at))/86400000),period=Math.floor(days/7);
  if(period<1)fail('Your first weekly review is available seven days after your starting point.',409);
  if(old.weeklyReviews.some(r=>r.period===period))fail('You have already saved this week’s review.',409);
  if(!Array.isArray(input.managed)||input.managed.length>3||input.managed.some(v=>!['food','movement','checkin'].includes(v)))fail('Choose the parts you managed this week.');
  if(!['time','energy','cost','confidence','nothing','other'].includes(input.barrier)||!['food','movement','structure'].includes(input.focus))fail('Choose a barrier and next focus.');
  const note=text(input.note,240);
  if(old.weeklyReviews.length>=1000)fail('Your review history is full. Contact support before adding another review.',409);
  const review={id:input.operationId,at,period,managed:[...new Set(input.managed)],barrier:input.barrier,focus:input.focus,note};
  // Choosing the proposed focus is explicit; Grub and Fit plans are untouched.
  if(state.nextShift?.kind!==topic(input.focus))focusNextShift(state,{operationId:input.operationId,supportNeed:topic(input.focus)},at);
  old.weeklyReviews.push({...review,nextShiftId:state.nextShift?.id||null});
  return;
 }
 if(input.action==='programme-reflection'){
  const summary=programmeSummary(old,at),baseline=programmeBaseline(old),reason=old.focus.selected[0];
  if(!summary.reflectionDue)fail('Your four-week reflection is available 28 days after your starting point.',409);
  if(input.baselineId!==baseline?.id)fail('Your reason changed. Reload before reflecting on your starting point.',409);
  if(!Number.isInteger(input.rating)||input.rating<1||input.rating>5)fail('Choose how this feels now.');
  if(old.reflections.length>=1000)fail('Your reflection history is full. Contact support before adding another reflection.',409);
  old.reflections.push({id:input.operationId,at,baselineId:baseline.id,reason,reasonText:programmeReasonText(old.focus),rating:input.rating,baselineRating:baseline.ratings[reason],note:text(input.note,240),smallWin:old.focus.win});
  return;
 }
 fail('Unknown programme action.');
}
