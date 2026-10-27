import {applyRecordOperation,memberRecordView,reportedHelpful} from './support-records.mjs';
import {applyReviewOperation,personalReview,reviewPreferences,reviewPreference} from './support-review.mjs';
// Member-owned everyday support. Uses the existing consented Life Back record.
// No inference about treatment, clinical readings, notifications or human availability.
export const supportChoices = Object.freeze({
  late:{label:'Late finishes make dinner difficult',action:'beans'},
  budget:{label:'Food shopping needs to cost less',action:'shop'},
  energy:{label:'I have little energy left for organising things',action:'breakfast'},
  routine:{label:'My routine keeps changing',action:'flexible'},
  movement:{label:'I want some manageable movement',action:'mobility'}
});
export const practicalActions = Object.freeze({
  beans:{kind:'food',title:'Tonight, one decision is sorted.',name:'Beans and cheese on toast',time:'About 8 minutes',items:['Baked beans','Bread','A little cheese, if wanted'],steps:['Heat the beans using the instructions on the tin.','Toast the bread, add the beans and cheese if wanted.'],fallback:'Eggs on toast is another familiar option.',href:'/member/grub',label:'Show me this meal'},
  eggs:{kind:'food',title:'A different dinner to try.',name:'Eggs on toast',time:'About 8 minutes',items:['Eggs','Bread','A little butter or oil'],steps:['Toast the bread.','Cook the eggs in your usual way until cooked through.','Serve together, using portions that suit you.'],fallback:'Use a familiar sandwich if cooking does not fit.',href:'/member/grub',label:'Show me this meal'},
  assembly:{kind:'food',title:'Take the cooking out of tonight.',name:'Hummus, bread and ready-to-eat vegetables',time:'About 3 minutes',items:['Hummus','Bread or pitta','Ready-to-eat vegetables you enjoy'],steps:['Check the ingredients suit your preferences and allergies.','Put the food together using portions that suit you.'],fallback:'A familiar sandwich works as a fallback.',href:'/member/grub',label:'Show me this meal'},
  shop:{kind:'food',title:'Check once. Buy only what is missing.',name:'One short list for three familiar dinners',time:'A cupboard check and a short list',items:['Bread','Eggs','Baked beans','Baking potatoes','Frozen vegetables'],steps:['Check what you already have.','Use eggs on toast for one dinner.','Use beans with a jacket potato for another.','Use your usual vegetable omelette for a third.'],fallback:'Only need one dinner? Keep just the ingredients for that meal.',href:'/member/grub',label:'See my short shopping list'},
  breakfast:{kind:'routine',title:'Give tomorrow one less decision.',name:'Set up your usual breakfast',time:'About 2 minutes',items:['Your usual breakfast food'],steps:['Choose what you already like to eat.','Put out the non-perishable items; keep chilled food in the fridge.'],fallback:'Just deciding what to have is enough today.',href:'/member/dashboard#today',label:'Keep this small plan'},
  flexible:{kind:'routine',title:'A fallback for both kinds of day.',name:'A normal-day dinner and a late-day dinner',time:'One small decision',items:['A familiar meal','An easier fallback'],steps:['Choose an option you already know for an ordinary finish.','Choose the easier option for a late finish.','Decide which fits when the day happens.'],fallback:'Start with the late-finish option alone.',href:'/member/dashboard#today',label:'Keep my flexible plan'},
  earlier:{kind:'routine',title:'Move the decision to a better moment.',name:'Choose your fallback before the late finish',time:'Morning or lunchtime, when it suits you',items:['One meal you already like'],steps:['Choose an easier time to decide dinner.','Check its ingredients are available.','Keep the choice where you will find it.'],fallback:'Use a meal already in your usual rotation.',href:'/member/dashboard#today',label:'Keep this better-timed plan'},
  mobility:{kind:'movement',title:'A little movement, laid out.',name:'A short seated movement break',time:'Up to 5 minutes, at your pace',items:['A sturdy chair without wheels','Clear space'],steps:['Sit comfortably and gently roll your shoulders.','Move your ankles up and down comfortably.','If comfortable, gently straighten and lower one knee, then the other.','Pause or finish whenever you want.'],fallback:'Choose one comfortable movement. Stop if it hurts or makes you feel unwell. Follow your existing advice for any limitations.',href:'/member/fit',label:'See this movement break'},
  differentMovement:{kind:'movement',title:'Choose a different kind of movement.',name:'Use your saved Fit options',time:'Choose a suitable strength, mobility or other activity',items:['Your saved time, equipment and limitations'],steps:['Open your existing Fit options.','Choose a different suitable activity or an easier alternative.','Keep the instructions and limitations already saved there.'],fallback:'Leave the session for today and choose a better moment.',href:'/member/fit',label:'Open my Fit options'},
  pause:{kind:'confidence',title:'One less thing to carry today.',name:'Let one ordinary job wait',time:'A moment, with no catch-up task',items:[],steps:['Choose one non-urgent job you can leave for later.','Keep only the next manageable thing in view.'],fallback:'If you need help beyond a practical step, open Support.',href:'/member/dashboard?timber=support#today',label:'Open Support'}
});
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const stateOf=s=>s.memberSupport||(s.memberSupport={memories:[],stage:'keeping-going',cadence:'fortnightly'});
const clean=(value,max=180)=>typeof value==='string'&&value.trim().length<=max?value.trim():fail('Keep your words within '+max+' characters.');
const needRevision=(s,i)=>{if(i.revision!==s.revision)fail('Your support changed in another tab. Reload before saving.',409);};
const shifts=s=>[...(s.shiftHistory||[]),...(s.nextShift?[s.nextShift]:[])];
export const helpfulRoutines=reportedHelpful;
export function rememberedSupport(s,at=new Date().toISOString()){
  const m=(s.memberSupport?.memories||[]).findLast(m=>!m.retiredAt&&m.id===s.nextShift?.practical?.memoryId);
  return m&&Date.parse(at)-Date.parse(m.at)<=7*86400000?{id:m.id,text:m.text,at:m.at,correctedAt:m.correctedAt||null}:null;
}
function archive(s,at,reason){if(s.nextShift)s.shiftHistory=[...(s.shiftHistory||[]),{...s.nextShift,closedAt:at,closedReason:reason}];}
function offer(s,key,op,at,memoryId,reason){const a=practicalActions[key];s.nextShift={kind:a.kind,title:a.title,detail:a.name,href:a.href,label:a.label,id:op+'-next',goalId:s.goalId,goal:s.goal,createdAt:at,checkinId:null,status:'planned',reviews:[],reason,practical:{...a,key,memoryId}};}
function rejected(s){return new Set(shifts(s).filter(a=>(a.reviews||[]).some(r=>['not-fit','not-helped'].includes(r.outcome))).map(a=>a.practical?.key).filter(Boolean));}
export function reviewPracticalSupport(s,input,at){
  const a=s.nextShift;if(!a?.practical)return false;
  if(a.id!==input.shiftId)fail('Your step changed. Reload before answering.',409);
  if(input.revision!==undefined)needRevision(s,input);
  const outcome=input.outcome,reason=input.reason||null;
  if(!['helped','not-fit','not-helped','not-tried','skip'].includes(outcome))fail('Choose an available answer.');
  if(reason&&!['timing','effort','idea'].includes(reason))fail('Choose what did not fit.');
  const support=stateOf(s);
  a.reviews.push({operationId:input.operationId,at,outcome,reason});
  if(['helped','not-helped'].includes(outcome))a.attemptedAt=a.attemptedAt||at;
  support.lastFeedback={at,outcome,reason,title:a.practical.name};
  if(outcome==='skip')return true;
  if(outcome==='not-tried'){support.response='No problem. Keep it, change it or leave it for now.';support.pendingObstacle=a.id;return true;}
  archive(s,at,'reviewed');
  if(outcome==='helped'){
    const m=support.memories.find(m=>m.id===a.practical.memoryId);if(m)m.retiredAt=at;
    support.response='You said '+a.practical.name+' helped. It is here to use again if it still fits.';
    offer(s,a.practical.key,input.operationId,at,null,'You marked this helpful on '+at.slice(0,10)+'.');return true;
  }
  const movement=a.kind==='movement'||a.practical.preparedKind==='movement';
  const candidates=outcome==='not-helped'?(movement?['differentMovement','pause']:['earlier','flexible','shop','breakfast','pause']):reason==='timing'?['earlier','flexible','breakfast']:reason==='effort'?(movement?['pause','differentMovement']:['assembly','breakfast','pause']):(movement?['differentMovement','pause']:['eggs','shop','flexible','pause']);
  const bad=rejected(s),key=candidates.find(k=>k!==a.practical.key&&!bad.has(k));
  support.response=outcome==='not-helped'?'You tried it and said it did not help. I have changed the approach.':reason==='timing'?'You said the timing was wrong. I have moved the job to an earlier moment.':reason==='effort'?'You said it took too much effort. I have taken work out of the next option.':reason==='idea'?'You did not like the idea. Here is a different option.':'That did not fit. Here is another option; you can tell me why if you want.';
  if(key)offer(s,key,input.operationId,at,a.practical.memoryId,support.response);
  else{s.nextShift=null;support.response='The ideas offered so far did not help. Choose what matters now; there is nothing to catch up.';}
  return true;
}
export function applySupportOperation(s,input,at){
  if(!['support-start','support-accept-step','support-memory','entry-delete','support-circumstance','support-finish','support-resume','support-note','support-obstacle','support-record','support-review-preference','support-review-request','support-review-accept'].includes(input.action))return false;
  needRevision(s,input);const support=stateOf(s);
  if(applyRecordOperation(s,input,at)||applyReviewOperation(s,input,at)){
    // Existing authenticated revision and consent controls guard these edits too.
  }else if(input.action==='support-start'){
    const choice=supportChoices[input.choice];if(!choice)fail('Choose a starting point.');
    if(support.memories.length>=10000)fail('Your saved history is full. Contact support before adding another entry.',409);
    const text=input.words===undefined?choice.label:clean(input.words);if(!text)fail('Choose or tell Timber one difficulty.');
    const memory={id:input.operationId,at,text,choice:input.choice,source:input.words===undefined?'Your selected answer':'Your own words'};
    support.memories.push(memory);support.pendingObstacle=null;support.reviewAnchorAt=support.reviewAnchorAt||at;archive(s,at,'member-changed-starting-point');
    offer(s,choice.action,input.operationId,at,memory.id,'Prepared around the difficulty you chose.');
    support.response='You told me what is difficult. Here is one thing ready to use.';
  }else if(input.action==='support-accept-step'){
    if(s.nextShift?.id!==input.shiftId)fail('Your step changed. Reload before keeping it.',409);
    s.nextShift.acceptedAt=at;
    support.agreedPlan={id:input.operationId,text:s.nextShift.practical?.name||s.nextShift.title,at,sourceOfferIds:[s.nextShift.id]};
    support.response='Your plan is saved. You can say later whether you tried it and whether it helped.';
  }else if(input.action==='support-memory'){
    const m=support.memories.find(m=>m.id===input.memoryId);if(!m)fail('This entry is no longer available.',404);
    if(input.remove===true){support.memories=support.memories.filter(m=>m.id!==input.memoryId);for(const a of shifts(s))if(a.practical?.memoryId===input.memoryId)a.practical.memoryId=null;support.response='Your private entry is removed. A post you chose to share in the Shed is separate.';}
    else{m.text=clean(input.words);m.correctedAt=at;if(!m.text)fail('Write your correction or choose Delete.');m.retiredAt=at;if(s.nextShift?.practical?.memoryId===m.id)s.nextShift.practical.memoryId=null;support.response='Your correction is saved. Choose a new starting point if the help you need has changed.';}
  }else if(input.action==='entry-delete'){
    const e=s.entries.find(e=>e.id===input.entryId);if(!e)fail('This entry is no longer available.',404);
    s.entries=s.entries.filter(e=>e.id!==input.entryId);
    for(const a of shifts(s))if(a.checkinId===input.entryId){a.checkinId=null;a.reason='The source entry was removed. Choose what would help now.';}
  }else if(input.action==='support-circumstance'){
    if(input.confirmed!==true||!['starting','continuing','changing','stopped','returning'].includes(input.stage))fail('Confirm the situation that applies to you.');
    if(!reviewPreferences.includes(input.cadence))fail('Choose a review rhythm.');
    support.stage=input.stage;support.cadence=input.cadence;support.confirmedAt=at;
    support.response='Your history and useful routines stay with you. Continuing treatment is equally welcome.';
  }else if(input.action==='support-finish'){
    if(input.confirmed!==true)fail('Choose whether you have finished this stage.');
    if(input.cadence!==undefined&&!reviewPreferences.includes(input.cadence))fail('Choose an available review rhythm.');
    support.finished={at,goalId:s.goalId,words:clean(input.words||''),plan:clean(input.plan||'',1000),routines:helpfulRoutines(s)};
    if(input.cadence!==undefined)support.cadence=input.cadence;
    support.stage='finished';support.response='You chose to finish this stage. Keep what worked, and come back whenever it helps.';
  }else if(input.action==='support-resume'){
    support.stage='returning';support.returnedAt=at;support.response='Good to see you. Your history is here. Choose what would help now.';
  }else if(input.action==='support-note'){
    support.note={text:clean(input.text,5000),editedAt:at};
  }else if(input.action==='support-obstacle'){
    if(support.pendingObstacle!==s.nextShift?.id)fail('Your step changed. Reload before changing it.',409);
    if(!['timing','effort','idea','keep','leave'].includes(input.reason))fail('Choose what would help.');
    if(['keep','leave'].includes(input.reason)){support.response=input.reason==='keep'?'Your step is here for a better moment.':'Leave it for now. There is no catch-up task.';support.pendingObstacle=null;}
    else{
      const previous=s.nextShift.reviews.findLast(r=>r.outcome==='not-tried');
      // Keep the actual outcome honest; clarification is not another failed attempt.
      const id=s.nextShift.id;reviewPracticalSupport(s,{...input,shiftId:id,outcome:'not-fit'},at);
      const archived=s.shiftHistory.at(-1);archived.reviews=archived.reviews.filter(r=>r.operationId!==input.operationId);
      if(previous)previous.reason=input.reason;
      support.lastFeedback={at,outcome:'not-tried',reason:input.reason,title:archived.practical.name};support.pendingObstacle=null;
    }
  }
  support.updatedAt=at;
  return true;
}
export function supportSummary(s,at=new Date().toISOString()){
 const support=s.memberSupport||{},review=personalReview(s,at);
 return {memory:rememberedSupport(s,at),records:memberRecordView(s),helpful:helpfulRoutines(s),response:support.response||null,stage:support.stage||'keeping-going',cadence:reviewPreference(s),reviewDue:!!review,personalReview:review,finished:support.finished||null};
}
