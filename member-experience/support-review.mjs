import {allOffers,feedbackRecords,reportedHelpful} from './support-records.mjs';
export const reviewPreferences=['fortnightly','weekly','monthly','on-request','never'];
export const reviewPreferenceLabels={fortnightly:'Fortnightly',weekly:'Weekly',monthly:'Monthly','on-request':'Only when I ask',never:'Never'};
export const reviewPreference=s=>reviewPreferences.includes(s.memberSupport?.cadence)?s.memberSupport.cadence:s.memberSupport?.cadence==='when-i-open'?'on-request':'fortnightly';
const day=at=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
export function reviewIsDue(s,at){
 const p=reviewPreference(s),support=s.memberSupport||{};
 if(p==='never'||p==='on-request')return false;
 const anchor=support.reviewedAt||support.reviewAnchorAt||(s.entries||[]).find(e=>Number.isFinite(Date.parse(e.at)))?.at;
 if(!anchor||!Number.isFinite(Date.parse(anchor))||!Number.isFinite(Date.parse(at)))return false;
 const from=day(anchor),now=day(at),[y,m,d]=from.split('-').map(Number);
 if(p==='monthly'){
  const month=new Date(Date.UTC(y,m,1)),last=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate();
  const due=month.getUTCFullYear()+'-'+String(month.getUTCMonth()+1).padStart(2,'0')+'-'+String(Math.min(d,last)).padStart(2,'0');return now>=due;
 }
 return new Date(now+'T12:00:00Z')-new Date(from+'T12:00:00Z')>=(p==='weekly'?7:14)*86400000;
}
export function personalReview(s,at=new Date().toISOString(),requested=false){
 const support=s.memberSupport||{},preference=reviewPreference(s);
 if(preference==='never')return null;
 const pending=Number.isFinite(Date.parse(support.reviewRequestedAt))&&(!support.reviewedAt||support.reviewRequestedAt>support.reviewedAt);
 if(!requested&&!pending&&!reviewIsDue(s,at))return null;
 const quotes=[...(s.entries||[]).filter(e=>e.win&&Number.isFinite(Date.parse(e.at))).slice(-3).map(e=>({id:e.id,text:e.win,at:e.at,source:'Your reported win'})),...(support.memories||[]).filter(m=>!m.retiredAt&&Number.isFinite(Date.parse(m.at))).slice(-1).map(m=>({id:m.id,text:m.text,at:m.at,source:'Your own answer'}))];
 const helpful=reportedHelpful(s),feedback=feedbackRecords(s),latest=feedback.filter(r=>Number.isFinite(Date.parse(r.at))).at(-1),current=s.nextShift;
 let kind='revisit-difficulty';
 if(support.stage==='returning')kind='recover-routine';
 else if(['clinic-quiet','coming-off'].includes(current?.kind)||support.stage==='changing')kind='prepare-questions';
 else if(quotes.some(q=>q.source==='Your reported win'))kind='recognise-win';
 else if(helpful.length)kind='keep-helpful';
 else if(!quotes.length&&!feedback.length)kind='starting';
 const observations=helpful.map(h=>'You marked '+h.title+' helpful '+h.count+' '+(h.count===1?'time':'times')+'.');
 if(latest)observations.push('Your answer about '+latest.title+' on '+day(latest.at)+' was “'+({helped:'helped','not-fit':'not for me','not-helped':'tried it, didn’t help','not-tried':'didn’t get round to it',skip:'skip'}[latest.outcome]||'recorded')+'”.');
 const introduction={
  'recognise-win':'You reported something worth recognising. Your own words are here to check.',
  'recover-routine':'You chose to return. Your useful routines are still here; choose what fits now.',
  'prepare-questions':'Use your own notes to prepare questions for your prescriber or pharmacist. Timber does not make treatment decisions.',
  'keep-helpful':'Keep the part you said helped, if it still fits.',
  'revisit-difficulty':'Check whether the difficulty you told Timber about still matters.',
  starting:'There is not a reported history to review yet. Choose one thing that would help now.'
 }[kind];
 const fallback=current?.practical?.fallback||'Return to one familiar meal or manageable routine when the week gets difficult.';
 const proposedPlan=kind==='prepare-questions'?'Prepare the questions I want to ask my own prescriber or pharmacist.':helpful.length?'Keep '+helpful[0].title+' available for a moment I choose.':current?.practical?'Try '+current.practical.name+' when it fits, then say whether it helped.':'Choose one practical difficulty I would like support with.';
 return {id:'review-'+s.revision+'-'+day(at),at,kind,introduction,quotes,observations,proposedPlan,fallback,sourceOfferIds:allOffers(s).map(a=>a.id),sourceFeedbackIds:feedback.map(r=>r.id)};
}
export function applyReviewOperation(s,input,at){
 if(!['support-review-preference','support-review-request','support-review-accept'].includes(input.action))return false;
 const support=s.memberSupport||(s.memberSupport={memories:[],cadence:'fortnightly'});
 const fail=(text,status=400)=>{throw Object.assign(Error(text),{status});};
 if(input.action==='support-review-preference'){
  if(!reviewPreferences.includes(input.preference))fail('Choose an available review interval.');
  support.cadence=input.preference;support.preferenceChangedAt=at;support.reviewRequestedAt=null;
 }else if(input.action==='support-review-request'){
  if(reviewPreference(s)==='never')fail('Change your review preference before requesting a review.',409);
  support.reviewRequestedAt=at;
 }else{
  const review=personalReview(s,at);
  if(!review||input.reviewId!==review.id)fail('Your review changed. Reload before accepting a plan.',409);
  if(input.confirmed!==true||typeof input.text!=='string'||!input.text.trim()||input.text.trim().length>1000)fail('Check and accept your plan in 1000 characters or fewer.');
  support.agreedPlan={id:input.operationId,text:input.text.trim(),at,reviewId:review.id,sourceOfferIds:review.sourceOfferIds};
  support.reviewedAt=at;support.reviewRequestedAt=null;
  support.response='You checked and accepted your plan. It is saved; nothing has been marked tried or helpful.';
 }
 return true;
}
