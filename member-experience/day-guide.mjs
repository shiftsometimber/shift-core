export const dayGuideMarkup='<section id="memberDayGuide" aria-label="Start here today"><h2>Start here today</h2><p>Check in, choose food, review movement, then say what helped. You can skip a step or take a quieter day.</p></section>';
export const dayGuideStyles=String.raw`
#memberDayGuide{margin:0 0 24px;padding:22px;background:#e7e3da;color:#050505;border:1px solid #707762;border-radius:16px;text-align:left}
#memberDayGuide :is(h2,p,strong,a,summary,li){color:#050505!important}
#memberDayGuide ol{display:grid;grid-template-columns:1fr;gap:20px;padding-left:24px}
#memberDayGuide li{padding:6px}#memberDayGuide li a{display:block;font-weight:800;padding:10px 0;min-height:44px;box-sizing:border-box}
#memberDayGuide li span{display:block;font-size:14px}#memberDayGuide summary{cursor:pointer;font-weight:800;min-height:44px}
#memberDayGuide [aria-current="step"]{border-bottom:3px solid #707762}
.member-progress-map{padding:20px;margin:0 0 24px;border:1px solid #707762;border-radius:12px;background:#e7e3da;color:#050505}.member-progress-map :is(h2,h3,p,a){color:#050505!important}
@media(max-width:650px){#memberDayGuide ol{grid-template-columns:1fr;gap:0}}
`;
// Uses the existing authenticated Today and follow-up responses; never infers completion from clicks.
export const dayGuideRuntime=String.raw`(()=>{
 'use strict';let day=null,followup=null;const host=document.getElementById('memberDayGuide');if(!host)return;
 const date=value=>{try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value))}catch{return ''}};
 function render(){
  if(!day)return;const expanded=host.querySelector('details')?.open===true,c=day.connected||{},today=c.date||date(Date.now());
  const checked=!!c.mood?.at&&date(c.mood.at)===today,chosen=!!c.meal,done=(c.movement?.done||0)>0,skipped=(c.movement?.skipped||0)>0,reviewed=!!followup?.feedback&&date(followup.createdAt)===today;
  const steps=[['Check in','/member/check-in',checked?'Check-in saved today':'Start with how you feel',checked],['Choose food in Grub','/member/grub',chosen?'Meal chosen for today — not marked eaten':'Pick one meal that fits today',chosen],['Review movement in Fit','/member/fit',done?c.movement.done+' movements recorded':skipped?'Skipped movement recorded':'Choose a manageable session, or rest',done||skipped],['Say whether it helped',followup?'#dailyCheckinFollowup':'/member/check-in',reviewed?'Feedback saved':followup?'After trying your offered step, tell us how it went':'Save a check-in to get your next step',reviewed]];
  host.replaceChildren();const kicker=document.createElement('p');kicker.textContent='MY TIMBER · TODAY';const details=document.createElement('details');details.open=expanded;const title=document.createElement('summary');title.textContent='Start here today — a guide, at your pace';details.append(title);const intro=document.createElement('p');intro.textContent='One useful thing is enough. This order can help: check in, choose food, review movement, then say what helped. You can go straight to the part you need.';details.append(intro);const portable=document.createElement('p');portable.textContent='Your pen can come from elsewhere. Grub, Fit and Life Back are here before, during and after treatment.';details.append(portable);const list=document.createElement('ol');const current=steps.findIndex(s=>!s[3]);
  steps.forEach(([label,href,state],index)=>{const item=document.createElement('li'),link=document.createElement('a'),text=document.createElement('span');link.href=href;link.textContent=label;text.textContent=state;if(index===current)link.setAttribute('aria-current','step');item.append(link,text);list.append(item)});details.append(list);host.append(kicker,details);
  const recap=document.createElement('details'),label=document.createElement('summary');label.textContent='Your week and latest feedback';recap.append(label);
  const facts=[c.lifeBack?.recordedWin?'Your latest Life Back win: '+c.lifeBack.recordedWin:'No small win recorded yet. What would you like to get back?',String(c.weekMeals||0)+' meals in your saved plan (planned, not logged as eaten).',String(c.weekMovement?.done||0)+' movements marked done this calendar week; '+String(c.weekMovement?.skipped||0)+' marked skipped.',c.mood?'Latest daily check-in: '+c.mood.label+' · '+date(c.mood.at)+'.':'No daily check-in saved yet.',followup?.feedback?'Latest next-step feedback: '+({'helped':'It helped','not-fit':'It did not fit','not-tried':'Not tried yet','skip':'Question skipped'}[followup.feedback]||'saved')+'.':'No next-step feedback saved yet.'];
  facts.forEach(text=>{const p=document.createElement('p');p.textContent=text;recap.append(p)});const links=document.createElement('p');for(const [label,href]of [['Record a Life Back win','/member/life-back#check-in'],['Clinic gone quiet?','/clinic-gone-quiet'],['Coming off treatment','/coming-off'],['Help for a partner','/husband-help']]){const a=document.createElement('a');a.textContent=label+' →';a.href=href;links.append(a,document.createTextNode(' '))}recap.append(links);host.append(recap);
 }
 document.addEventListener('sst:today-rendered',event=>{day=event.detail;render()});
 document.addEventListener('sst:daily-feedback',event=>{followup=event.detail;render()});
})();`;
