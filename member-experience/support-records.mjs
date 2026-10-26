// Views and edits of the existing member-owned record, not another data store.
export const allOffers=s=>[...(s.shiftHistory||[]),...(s.nextShift?[s.nextShift]:[])];
export const feedbackLabels={helped:'Helped','not-fit':'Not for me','not-helped':'Tried it, didn’t help','not-tried':'Didn’t get round to it',skip:'Skipped'};
const fail=(text,status=400)=>{throw Object.assign(Error(text),{status});};
const words=(s,max=1000)=>typeof s==='string'&&s.trim().length<=max?s.trim():fail('Keep your correction within '+max+' characters.');
export function feedbackRecords(s){return allOffers(s).flatMap(a=>(a.reviews||[]).map((r,i)=>({...r,id:r.operationId||a.id+':'+i,offerId:a.id,title:a.practical?.name||a.title})));}
export function reportedHelpful(s){
 const groups=new Map();
 for(const a of allOffers(s)){
  if(a.goalId!==s.goalId)continue;
  const reviews=(a.reviews||[]).filter(r=>r.outcome==='helped');if(!reviews.length)continue;
  const key=a.practical?.key||a.title,g=groups.get(key)||{title:a.practical?.name||a.title,href:a.href,dates:[],offerIds:[],feedbackIds:[]};
  for(const r of reviews){g.dates.push(r.at);g.feedbackIds.push(r.operationId||a.id+':'+a.reviews.indexOf(r));}g.offerIds.push(a.id);groups.set(key,g);
 }
 return [...groups.values()].map(g=>({...g,count:g.dates.length,at:g.dates.at(-1)}));
}
export function memberRecordView(s){
 return {goal:s.goal&&s.goal!=='Your personal goal'?{id:s.goalId,text:s.goal,at:s.goalChangedAt||null,correctedAt:s.goalCorrectedAt||null}:null,difficulties:s.memberSupport?.memories||[],offered:allOffers(s).map(a=>({id:a.id,title:a.practical?.name||a.title,reason:a.reason,at:a.createdAt,correction:a.memberCorrection||null})),feedback:feedbackRecords(s),helpful:reportedHelpful(s),plan:s.memberSupport?.agreedPlan||null,reviewPreference:s.memberSupport?.cadence||'fortnightly'};
}
export function applyRecordOperation(s,input,at){
 if(input.action!=='support-record')return false;
 const support=s.memberSupport||(s.memberSupport={memories:[],cadence:'fortnightly'}),remove=input.remove===true;
 if(!['goal','offer','feedback','plan'].includes(input.entity)||typeof input.id!=='string')fail('Choose one of your own saved records.');
 if(input.entity==='goal'){
  if(input.id!==s.goalId||s.goal==='Your personal goal')fail('This goal is no longer available.',404);
  const text=remove?'Your personal goal':words(input.text,70);if(!text)fail('Write your goal or choose Delete.');
  for(const e of s.entries||[])if(e.goalId===s.goalId)e.goal=remove?null:text;
  for(const a of allOffers(s))if(a.goalId===s.goalId)a.goal=remove?null:text;
  s.goal=text;s.goalCorrectedAt=at;
 }else if(input.entity==='offer'){
  const a=allOffers(s).find(a=>a.id===input.id);if(!a)fail('This offer is no longer available.',404);
  if(remove){s.shiftHistory=(s.shiftHistory||[]).filter(a=>a.id!==input.id);if(s.nextShift?.id===input.id)s.nextShift=null;}
  else{a.memberCorrection={text:words(input.text),at};if(s.nextShift?.id===a.id)support.response='Your correction is saved. Choose a different option if this step is no longer right.';}
 }else if(input.entity==='feedback'){
  let found=false;
  for(const a of allOffers(s)){
   const i=(a.reviews||[]).findIndex((r,i)=>(r.operationId||a.id+':'+i)===input.id);if(i<0)continue;found=true;
   if(remove)a.reviews.splice(i,1);
   else{if(!Object.hasOwn(feedbackLabels,input.outcome))fail('Choose an available feedback answer.');a.reviews[i]={...a.reviews[i],outcome:input.outcome,correctedAt:at};}
   // The helpful history is always derived again from these actual answers.
   if(!a.reviews.some(r=>['helped','not-helped'].includes(r.outcome))&&!['done','attempted'].includes(a.status))delete a.attemptedAt;
  }
  if(!found)fail('This answer is no longer available.',404);
  support.lastFeedback=null;support.response='Your earlier answer is updated. Your next review will use the corrected record.';
  const current=s.nextShift,bad=allOffers(s).filter(a=>(a.reviews||[]).some(r=>['not-fit','not-helped'].includes(r.outcome)));
  const matches=(a,b)=>a?.recipeId&&a.recipeId===b?.recipeId||a?.sessionKey&&a.sessionKey===b?.sessionKey;
  if(current?.practical&&bad.some(a=>matches(a.practical,current.practical))){
   s.shiftHistory=[...(s.shiftHistory||[]),{...current,closedAt:at,closedReason:'feedback-corrected'}];
   s.nextShift={...structuredClone(current),id:input.operationId+'-next',createdAt:at,reviews:[],status:'planned',awaitingChoice:true};
   delete s.nextShift.acceptedAt;
  }

  if(s.nextShift)s.nextShift.reason='You changed an earlier answer. Check whether this step still fits before keeping it.';
 }else{
  if(support.agreedPlan?.id!==input.id)fail('This plan is no longer available.',404);
  if(remove)delete support.agreedPlan;else support.agreedPlan={...support.agreedPlan,text:words(input.text),correctedAt:at};
 }
 if(['offer','feedback'].includes(input.entity)&&support.finished)support.finished.routines=reportedHelpful(s);
 return true;
}
