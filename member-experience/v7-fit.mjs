import {journeyDay} from './journey-records.mjs';
import {savedFitIssues} from './fit-saved-review.mjs';
export const fitTimes=[10,20,40],fitKits=['none','dumbbells','gym'];
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const choices=fit=>[fit?.selected,...(fit?.alternatives||[]),...(fit?.choices||[])].filter(Boolean);
export function applyV7Fit(progress,input,at,context,completeDaily){
 const on=journeyDay(at),s=progress.v7||(progress.v7={version:1,preferences:{showWeight:true,lead:'weight'},days:{},milestones:{},activityReadings:[]});
 const fit=s.fit||(s.fit={days:{},healthTags:[],feedback:{}});fit.days||={};fit.feedback||={};fit.healthTags||=[];
 if(input.action==='v7-fit-move'){
  const selected=fit.selected,exercise=selected?.id===input.sessionId&&selected.session?.exercises?.find(e=>(e.publication_id||e.id)===input.exerciseId);
  if(!exercise)fail('This exercise changed. Reopen your saved session.',409);
  if(!['done','skip','undo'].includes(input.state))fail('Choose what happened.');
  if(input.state==='skip'&&(typeof input.reason!=='string'||!input.reason.trim()||input.reason.length>200))fail('Add a short reason for skipping this movement.');
  fit.moves||={};const key=on+':'+selected.id;fit.moves[key]||={};
  if(input.state==='undo')delete fit.moves[key][input.exerciseId];else fit.moves[key][input.exerciseId]={state:input.state,at,...(input.state==='skip'?{reason:input.reason.trim()}:{})};return true;
 }
 if(input.action==='v7-fit-select'){
  const selected=choices(fit).find(c=>c.id===input.sessionId);
  if(!selected||savedFitIssues({minutes_per_day:selected.minutes,location:selected.location,sessions:[selected.session]}).length)fail('This prepared session is unavailable. Keep your current plan.',409);
  if(input.revision!==progress.revision)fail('Your session changed. Reload before choosing.',409);
  fit.selected=structuredClone(selected);
  if(context.action?.kind==='fit'&&!s.days?.[on]?.log){s.days[on]||={on};s.days[on].selected={...selected,kind:'fit',name:selected.name,completedLabel:'Session done.'};}
  return true;
 }
 if(input.action==='v7-fit-complete'){
  const selected=choices(fit).find(c=>c.id===input.sessionId);
  if(!selected||fit.selected?.id!==selected.id)fail('Your session changed. Reopen it before saving.',409);
  const key=on+':'+selected.id;if(fit.days[key])return false;
  fit.days[key]={on,sessionId:selected.id,at,kind:'session',operationId:input.operationId};
  // Only this session's Done, when it is also Today's selected daily action,
  // enters the same account/day ledger used by Today and Grub.
  if(context.action?.kind==='fit'&&context.action.id===selected.id)completeDaily();
  return true;
 }
 if(input.action==='v7-fit-feedback'){
  const key=input.on+':'+input.sessionId;if(!fit.days[key])fail('Record this session before rating it.',409);
  if(input.outcome!==undefined&&!['helped','not-helped','later'].includes(input.outcome))fail('Choose an available answer.');
  if(input.effort!==undefined&&!['easy','right','hard'].includes(input.effort))fail('Choose an available effort.');
  if(input.outcome===undefined&&input.effort===undefined)return false;
  fit.feedback[key]={...(fit.feedback[key]||{}),...(input.outcome===undefined?{}:{outcome:input.outcome}),...(input.effort===undefined?{}:{effort:input.effort}),at};return true;
 }
 if(input.action==='v7-fit-walk'){
  if(typeof input.minutes!=='number'||!Number.isFinite(input.minutes)||input.minutes<=0||input.minutes>1440)fail('Enter the minutes you walked.');
  const key='walk:'+input.operationId;if(fit.days[key])return false;
  fit.days[key]={on,at,kind:'walk',minutes:input.minutes,operationId:input.operationId};return true;
 }
 if(input.action==='v7-fit-health-delete'){
  const before=fit.healthTags.length;fit.healthTags=fit.healthTags.filter(t=>t.id!==input.id);return fit.healthTags.length!==before;
 }
 if(input.action==='v7-fit-health'){
  if(input.consented!==true||typeof input.text!=='string'||!input.text.trim()||input.text.length>80)fail('Confirm that Timber may use this private detail to adapt your sessions.');
  if(fit.healthTags.length>=10)fail('Remove an old detail before adding another.');
  fit.healthTags.push({id:input.operationId,text:input.text.trim(),consentedAt:at});return true;
 }
 return null;
}
// Called by the overnight preparer only. Existing approved generation is injected
// by the serving core; it retains fixed doses, restrictions, equipment and checks.
export async function prepareV7Fit(prefs,approvedGenerate,at){
 const previous=prefs.lifeBack?.progress?.v7?.fit||{},feedback=Object.entries(previous.feedback||{}).filter(([key])=>key.slice(0,10)<journeyDay(at)).sort(([a],[b])=>b.localeCompare(a))[0]?.[1]||null;
 const plans=[],settings=[];
 for(const minutes of fitTimes)for(const kit of fitKits)settings.push({minutes,kit,preferences:prefs.movement||{},healthTags:(previous.healthTags||[]).filter(t=>t.consentedAt),feedback});
 const wantedMinutes=previous.selected?.minutes||Number(prefs.movement?.minutes_per_day)||20,wantedKit=previous.selected?.kit||(String(prefs.movement?.equipment).includes('gym')?'gym':String(prefs.movement?.equipment).includes('dumbbell')?'dumbbells':'none');
 settings.push({minutes:wantedMinutes,kit:wantedKit,lowImpact:true,healthTags:(previous.healthTags||[]).filter(t=>t.consentedAt),feedback});
 const results=approvedGenerate.batch?await approvedGenerate.batch(settings):await Promise.all(settings.map(async setting=>{try{return {settings:setting,plan:await approvedGenerate(setting)}}catch(e){return {settings:setting,error:e.message}}}));
 for(const {settings:setting,plan}of results){
  const {minutes,kit,lowImpact=false}=setting;
  if(!plan?.sessions?.length||savedFitIssues(plan).length)continue;
  const session=plan.sessions[0];if(Number(session.requested_minutes||plan.minutes_per_day)!==minutes)continue;
  plans.push({id:'fit:'+journeyDay(at)+':'+minutes+':'+kit+(lowImpact?':low-impact':''),minutes,kit,name:session.name||session.title||plan.name||minutes+'-minute session',location:session.location||plan.location,session,reason:plan.adaptation_reason||null,lowImpact});
 }
 const selected=plans.find(p=>p.minutes===wantedMinutes&&p.kit===wantedKit&&!p.lowImpact)||plans.find(p=>!p.lowImpact)||null;
 const shorter=plans.filter(p=>p.minutes<(selected?.minutes||0)&&p.kit===selected.kit&&!p.lowImpact).at(-1),noKit=plans.find(p=>p.kit==='none'&&p.minutes===selected?.minutes&&!p.lowImpact&&p.id!==selected?.id)||plans.find(p=>p.kit==='none'&&p.id!==selected?.id&&!p.lowImpact),lowImpact=plans.find(p=>p.lowImpact&&p.id!==selected?.id);
 if(!selected)throw Error('No session passed the existing Fit review gates');
 return {...previous,generatedOn:journeyDay(at),selected,choices:plans,alternatives:[shorter&&{...shorter,swapLabel:'Shorter'},noKit&&{...noKit,swapLabel:'No kit'},lowImpact&&{...lowImpact,swapLabel:'Low impact'}].filter(Boolean),preparationErrors:results.filter(r=>r.error).map(r=>({minutes:r.settings.minutes,kit:r.settings.kit,lowImpact:!!r.settings.lowImpact,error:r.error}))};
}
