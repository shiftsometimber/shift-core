// One account-backed, non-clinical action. No AI inference, treatment changes or analytics payloads.
export const supportNeeds=['auto','food','movement','routine','confidence','clinic-quiet','coming-off','steady'];
export const feedbackOutcomes=['helped','not-fit','not-tried','skip'];
const actions={
 food:{kind:'food',title:'Choose one straightforward meal',detail:'Open Grub, choose one reviewed recipe you can manage and keep it for today. One meal is enough.',href:'/member/grub#today',label:'Choose my meal in Grub'},
 movement:{kind:'movement',title:'Make a small movement plan',detail:'Open your existing Fit plan and choose one manageable activity. Keep your saved limitations in place; this does not change your programme.',href:'/member/fit',label:'Review my activity in Fit'},
 routine:{kind:'routine',title:'Choose one wind-down cue',detail:'Pick one ordinary cue for winding down this evening, such as putting your phone aside. Try it once, then tell SHIFT whether it fitted your week.',href:'/member/dashboard#journey',label:'Keep my goal in view'},
 confidence:{kind:'confidence',title:'Make room for your own goal',detail:'Choose one small, practical step towards the goal you saved. Put it into your week; it does not need to be impressive.',href:'/member/dashboard#journey',label:'Open my Journey'},
 'clinic-quiet':{kind:'clinic-quiet',title:'Prepare one question for your prescriber',detail:'Write down what you need clarified and contact your prescriber or pharmacist. A quiet clinic does not mean you should stop or change treatment. SHIFT can help with finding its tools, not clinical decisions.',href:'/clinic-gone-quiet',label:'Prepare with the clinic-quiet guide'},
 'coming-off':{kind:'coming-off',title:'Prepare your next support conversation',detail:'Read the coming-off guide and note one question for your prescriber. Do not change, restart or improvise a taper from a check-in.',href:'/articles/stopping-glp1',label:'Read the coming-off guide'},
 steady:{kind:'steady',title:'Repeat one thing that fitted your week',detail:'Choose one practical thing you already found manageable and make room for it again. A steady week counts too.',href:'/member/dashboard#journey',label:'Open my Journey'}
};
const simpler={
 food:{...actions.food,title:'Start with a familiar meal',detail:'Rather than planning a week, open Grub and look for one familiar meal. Save one option; you do not have to change dinner today.',href:'/member/grub#saved',label:'Find one meal in Grub'},
 movement:{...actions.movement,title:'Review one activity, without committing',detail:'Open Fit and review one option against your saved time, equipment and limitations. You do not need to complete a session today.'},
 routine:{...actions.routine,title:'Make the evening task smaller',detail:'Choose just one moment to pause this evening. No new routine to perfect; tell SHIFT later whether that was useful.'},
 confidence:{...actions.confidence,title:'Choose the smallest step',detail:'Look at your personal goal and choose the smallest part that feels manageable. Planning it is enough for this step.'},
 'clinic-quiet':actions['clinic-quiet'],'coming-off':actions['coming-off'],steady:actions.steady
};
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status})};
export function chooseSupport(ratings,requested='auto'){
 if(requested!=='auto')return requested;
 // Ratings only select everyday planning topics. Never diagnose, infer treatment or triage urgency.
 const lowest=['energy','sleep','confidence','movement','clothes','personal'].reduce((a,b)=>ratings[b]<ratings[a]?b:a,'energy');
 return {energy:'food',sleep:'routine',confidence:'confidence',movement:'movement',clothes:'confidence',personal:'confidence'}[lowest];
}
function archive(state,action,at,reason){state.shiftHistory=[...(state.shiftHistory||[]),{...action,closedAt:at,closedReason:reason}];}
export function resetNextShift(state,at){if(state.nextShift){archive(state,state.nextShift,at,'goal-changed');state.nextShift=null;}}
export function advanceNextShift(state,input,entry,at){
 const requested=input.supportNeed??state.supportNeed??'auto';
 if(!supportNeeds.includes(requested))fail('Choose an available support topic.');
 const active=state.nextShift,feedback=input.shiftFeedback;
 if(feedback!==undefined&&(!feedback||typeof feedback!=='object'||!feedbackOutcomes.includes(feedback.outcome)||typeof feedback.shiftId!=='string'))fail('Choose an available follow-up answer.');
 if(feedback&&(!active||feedback.shiftId!==active.id))fail('Your next Shift changed in another tab. Reload before reviewing it.',409);
 const changed=requested!==(state.supportNeed??'auto');
 state.supportNeed=requested;
 if(active){
  if(feedback){
   const review={operationId:input.operationId,checkinId:entry.id,at,outcome:feedback.outcome};
   active.reviews=[...(active.reviews||[]),review];
   entry.shiftFeedback={shiftId:active.id,outcome:feedback.outcome};
   if(feedback.outcome==='helped')active.attemptedAt=active.attemptedAt||at;
  }
  if(!changed&&(!feedback||['not-tried','skip'].includes(feedback.outcome)))return;
  archive(state,active,at,changed?'support-changed':'reviewed');
 }
 const outcome=feedback?.outcome;
 const kind=!changed&&active&&['helped','not-fit'].includes(outcome)?active.kind:chooseSupport(entry.ratings,requested);
 const action=(outcome==='not-fit'?simpler:actions)[kind];
 state.nextShift={...action,id:input.operationId+'-next',goalId:state.goalId,goal:state.goal,createdAt:at,checkinId:entry.id,status:'planned',reviews:[],reason:changed?'Chosen from the support topic you selected.':outcome==='helped'?'You said this helped. Keep the useful part.':outcome==='not-fit'?'You said it did not fit. This step is smaller.':requested==='auto'?'Chosen from your own check-in, not a medical assessment.':'Chosen from the support topic you selected.'};
}
export function startNextShift(state,input,at){
 if(!['food','movement'].includes(input.kind))fail('Choose food or movement.');
 if(state.nextShift)fail('You already have a saved step. Reload before choosing another.',409);
 state.supportNeed=input.kind;
 state.nextShift={...actions[input.kind],id:input.operationId+'-next',goalId:state.goalId,goal:state.goal,createdAt:at,checkinId:null,status:'planned',reviews:[],reason:'You chose this step. No check-in is needed to get started.'};
}
export function reviewNextShift(state,input,at){
 const active=state.nextShift;
 if(!active||active.id!==input.shiftId||!feedbackOutcomes.includes(input.outcome))fail('Your next Shift changed. Reload before answering.',409);
 const entry={id:null,ratings:state.entries.findLast(e=>e.goalId===state.goalId)?.ratings||{}};
 advanceNextShift(state,{operationId:input.operationId,shiftFeedback:{shiftId:input.shiftId,outcome:input.outcome}},entry,at);
}
export function markNextShift(state,input,at){
 if(!['attempted','done'].includes(input.status))fail('Choose tried or done.');
 const active=state.nextShift;
 if(!active||input.shiftId!==active.id||active.goalId!==state.goalId)fail('Your next Shift changed. Reload before updating it.',409);
 active.attemptedAt=active.attemptedAt||at;
 if(input.status==='done'){active.completedAt=active.completedAt||at;active.status='done'}else if(active.status!=='done')active.status='attempted';
}
export function nextShiftCard(progress){
 const a=progress?.nextShift;
 if(!a||a.goalId!==progress.goalId)return null;
 return {title:a.title,detail:a.detail,href:a.kind==='clinic-quiet'?actions['clinic-quiet'].href:a.href,label:a.kind==='clinic-quiet'?actions['clinic-quiet'].label:a.label,loopId:a.id,loopStatus:a.status,reason:a.reason,goal:a.goal};
}
export function lifeBackUsage(progress){
 const entries=progress?.entries||[],shifts=[...(progress?.shiftHistory||[]),...(progress?.nextShift?[progress.nextShift]:[])];
 const feedback=shifts.flatMap(s=>s.reviews||[]);
 return {checkins:entries.length,repeatCheckin:entries.length>1,actionsOffered:shifts.length,actionsAttempted:shifts.filter(s=>s.attemptedAt).length,actionsCompleted:shifts.filter(s=>s.completedAt).length,helpfulAnswers:feedback.filter(f=>f.outcome==='helped').length,notFitAnswers:feedback.filter(f=>f.outcome==='not-fit').length,notTriedAnswers:feedback.filter(f=>f.outcome==='not-tried').length};
}
