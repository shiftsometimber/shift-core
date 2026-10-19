// My Timber member presentation, authorised by Matt on 15 October 2026.
// Existing account runtimes remain responsible for every saved action.
const scope='html body[data-member-design="20261001"]:is(#approved-member-design,[data-member-design]):is(#approved-member-palette,[data-member-design]):is(#approved-member-layout,[data-member-design])[data-member-experience-ui="20261015"]';
const rule=(selector,body)=>selector.split('|').map(s=>scope+' '+s).join(',')+'{'+body.split(';').filter(Boolean).map(s=>s+'!important').join(';')+'}\n';
// The native host reserves the measured fixed bars. Match that model only when
// its trusted member-shell marker is present; the web and PWA keep sticky chrome.
const nativeScope=scope.replace(/^html /,'html[data-my-timber-native-shell] ');
export const appExperienceStyles=scope+'{background:#f5f2eb!important;color:#050505!important;margin:0!important;padding-bottom:calc(94px + env(safe-area-inset-bottom))!important}\n'+
scope+'[data-app-panel="1"]{padding:0!important;margin:0!important}\n'+
scope+'[data-app-panel="1"] main{padding:0!important;margin:0!important}\n'+
rule('main','background:#f5f2eb;color:#050505;max-width:1040px;padding:24px 20px 40px')+
rule('#todayBrand','position:sticky;top:0;z-index:44;min-height:64px;padding-top:max(8px,env(safe-area-inset-top));padding-bottom:8px;box-sizing:border-box')+
nativeScope+' #todayBrand[data-member-design-header]{position:fixed!important;inset:0 0 auto!important;z-index:1000!important;width:100%!important;transform:none!important}\n'+
nativeScope+' #appBottomNav{position:fixed!important;inset:auto 0 0!important;z-index:1000!important;width:100%!important;transform:none!important}\n'+
rule('#todayBrand .member-design-mark','width:34px;height:34px;border-radius:50%')+
rule('.mp-panel','border:0;padding:0;background:transparent')+
rule('.shift-progress-chart','border:0;padding:14px 0;background:transparent')+
rule('.shift-progress-score','display:none')+
rule('.member-section-name','display:none')+
rule('#todayBrand','background:#e7e3da;color:#050505')+
rule('#todayBrand>a','color:#050505;-webkit-text-fill-color:#050505')+
rule('#memberJourneyTabs','display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;max-width:760px;margin:0 auto 22px;border-bottom:1px solid #ccc9bf')+
rule('#memberJourneyTabs button','font:inherit;font-size:15px;min-height:48px;background:transparent;color:#54594d;-webkit-text-fill-color:#54594d;opacity:1;border:0;border-radius:0;padding:12px 8px')+
rule('#memberJourneyTabs button[aria-selected="true"]','border-bottom:3px solid #707762;color:#050505;-webkit-text-fill-color:#050505;font-weight:700')+
rule('#memberJourneyTabs[hidden]','display:none')+
rule('.member-journey-entry','padding:18px 0;border-bottom:1px solid #ccc9bf;margin-bottom:20px')+
rule('.member-journey-entry h2','font:500 28px/1.2 Georgia,serif;margin:0 0 14px')+
rule('.member-journey-entry table','width:100%;table-layout:fixed;border-collapse:collapse')+
rule('.member-journey-entry th|.member-journey-entry td','font-size:14px;padding:8px 6px;text-align:left;overflow-wrap:anywhere;border-bottom:1px solid #ccc9bf')+
rule('.member-journey-entry a','display:inline-flex;align-items:center;min-height:46px;margin:6px 8px 6px 0;padding:10px 14px;background:#e7e3da;border:1px solid #ccc9bf;border-radius:10px;color:#050505')+
rule('.shift-chart-custom-dates input','width:100%;min-width:0;box-sizing:border-box;min-height:46px;font:inherit;background:#f7f5ef;color:#050505;border:1px solid #a7a99f;padding:10px;border-radius:8px')+
rule('.shift-chart-custom-dates button','width:100%;min-height:46px;font:inherit;margin:12px 0;background:#e7e3da;color:#050505;-webkit-text-fill-color:#050505;border:1px solid #a7a99f;border-radius:8px;padding:10px')+
rule('.shift-pattern-sources label','display:flex;align-items:center;gap:10px;min-height:44px')+
rule('.shift-pattern-sources input[type="checkbox"]','width:22px;height:22px;min-height:22px;flex:none;margin:0')+
rule('#memberJourneyPhotos','border-top:1px solid #ccc9bf;padding:16px 0;margin-top:20px')+
rule('#memberJourneyPhotos>summary','min-height:44px;padding:10px 0;font-weight:700')+
scope+'[data-member-journey-view] #panel-visualise>.member-progress-map{display:none!important}\n'+
scope+'[data-member-journey-view="felt"] #shiftProgressStory>:not(.shift-pattern-panel),'+scope+'[data-member-journey-view="week"] #shiftProgressStory>:not(.shift-pattern-panel){display:none!important}\n'+
scope+'[data-member-journey-view="felt"] #memberJourneyPhotos,'+scope+'[data-member-journey-view="week"] #memberJourneyPhotos{display:none!important}\n'+
rule('#appBottomNav','z-index:60;box-shadow:0 -6px 24px #05050512')+
rule('#appBottomNav [aria-current="page"]|#appBottomNav button[aria-expanded="true"]','background:#e7e3da;color:#050505;-webkit-text-fill-color:#050505')+
rule('.app-today-shortcuts|nav.sst-member-tabs|#sst-footer-c|footer|.app-footer-details|#memberUtilities|#myTimberApp|#pwaInstallBanner','display:none')+
rule('#todayActions.app-today-v3 .mtm-hero|#todayActions .today-week-start','display:none')+
rule('#todayActions.app-today-v3 .member-today-intro','display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 24px;padding:0;background:transparent')+
rule('.member-today-intro h1','font-size:clamp(28px,5vw,40px);margin:4px 0 0;line-height:1.12')+
rule('.member-today-date','font-size:13px;color:#4d5545;-webkit-text-fill-color:#4d5545;margin:0')+
rule('.member-today-intro>a','display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:10px 18px;border-radius:12px;background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da;text-decoration:none;font-weight:700;flex-shrink:0')+
rule('#todayActions.app-today-v3 .today-layout','display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:18px')+
rule('#todayActions.app-today-v3 .today-layout>*','min-width:0;width:100%;box-sizing:border-box')+
rule('#todayActions.app-today-v3 .today-meal','grid-column:1;grid-row:1/3;background:#e7e3da;border:1px solid #d2cfc4;overflow:hidden;border-radius:18px')+
rule('#todayActions.app-today-v3 .today-meal-visual','aspect-ratio:1.8')+
rule('.today-meal-visual button.sst-image-open','position:absolute;inset:0;height:100%;width:100%;max-height:none')+
rule('.today-meal-visual button.sst-image-open img','position:static;width:100%;height:100%;max-height:none;object-fit:cover')+
rule('#todayActions.app-today-v3 .today-movement','grid-column:2;grid-row:1;background:#e7e3da;border:1px solid #d2cfc4;border-radius:18px;padding:20px;order:0')+
rule('#todayActions.app-today-v3 .today-life','grid-column:2;grid-row:2;border:1px solid #d2cfc4;border-radius:18px')+
rule('#todayActions.app-today-v3 .mtm-week','grid-column:1/-1;background:transparent;border-top:1px solid #d2cfc4;padding:18px 0;margin-top:2px')+
rule('#todayActions.app-today-v3 .mtm-next','border-radius:18px;padding:22px;margin-bottom:22px;background:#050505')+
rule('#todayActions.app-today-v3 .mtm-next h3','font-size:26px')+
rule('#todayActions.app-today-v3 .today-support|.member-coaching-details','background:#e7e3da;border:1px solid #d2cfc4;border-radius:14px;margin:18px 0;padding:14px 18px')+
rule('.member-coaching-details>summary|.today-support>summary','min-height:44px;cursor:pointer;font-weight:700;display:list-item;padding:10px 0;box-sizing:border-box')+
rule('.member-coaching-primary>summary|.member-next-secondary','display:none')+
rule('#shiftCoach','margin:0;background:transparent;border:0;padding:12px 0')+
rule('#appToolPanels','margin-top:0')+
rule('.app-tool-frame','background:#f5f2eb;color-scheme:light')+
rule('.app-tool-loading','color:#050505')+
rule('.grub-search','border:1px solid #d2cfc4;background:#e7e3da;padding:18px;border-radius:16px')+
rule('.grub-discovery-options','display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px')+
rule('.grub-discovery-options label','display:grid;gap:6px;min-width:0;font-size:13px;font-weight:700')+
rule('.grub-discovery-options select','width:100%;font-size:16px')+
rule('#grubDiscoverResults','display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px')+
rule('#grubDiscoverResults>.grub-result-message|#grubDiscoverResults>.grub-empty|#grubDiscoverResults>.grub-pagination','grid-column:1/-1')+
rule('#grubDiscoverResults>article','margin:0;background:#e7e3da;border:1px solid #d2cfc4;border-radius:16px;overflow:hidden;min-width:0')+
rule('#grubDiscoverResults h3','font-size:23px;line-height:1.2')+
rule('.grub-food-image button|.sf-exercise-art button','padding:0;border:0;background:transparent;border-radius:14px;overflow:hidden')+
rule('.grub-pagination','display:flex;gap:12px;justify-content:space-between;align-items:center')+
rule('.sf-builder-grid','display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px')+
rule('.sf-builder-grid>label','min-width:0')+
rule('.sf-ring|.sf-session .sf-current-step','display:none')+
rule('.sf-session.active [data-sf-start]|.sf-session:not(.active) .member-session-pause|.sf-session[data-session-finished="true"] .member-session-pause','display:none')+
rule('.member-session-progress','margin:12px 0 20px;padding:0;background:transparent')+
rule('.member-session-progress p','font-size:14px;margin:6px 0')+
rule('.member-session-progress progress','width:100%;height:8px;accent-color:#707762')+
rule('.sf-session:not(.active) .sf-exercises','display:none')+
rule('.sf-session[data-exercise-overview="true"] .sf-exercises','display:block')+
rule('.sf-session.active:not([data-exercise-overview="true"]) .sf-exercise:not([data-current-exercise="true"])','display:none')+
rule('.sf-session.active .sf-exercise[data-current-exercise="true"]','display:flex;flex-direction:column;align-items:stretch;border:0;padding:0;margin-top:16px')+
rule('.sf-exercise-art','width:100%;max-width:100%;height:auto;max-height:none;padding:0;background:transparent')+
rule('.sf-exercise-art img','width:100%;max-width:100%;height:auto;max-height:none;object-fit:contain;border-radius:14px')+
rule('.sf-exercise-art button.sst-image-open','height:auto;max-height:none;overflow:visible;aspect-ratio:auto')+
rule('.member-food-guide','margin:24px 0')+
rule('.member-food-guide>summary','min-height:44px;cursor:pointer;padding:10px 0;font-weight:700')+
rule('a.member-skip-link','position:fixed;left:-10000px;top:8px;z-index:100;padding:12px;background:#e7e3da;color:#050505')+
rule('a.member-skip-link:focus','left:8px')+
rule('.sf-exercise-main h4','font-size:26px;line-height:1.2;margin:16px 0 12px')+
rule('.sf-exercise-actions','display:flex;justify-content:flex-start')+
rule('.member-rest-control','display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:14px')+
rule('.member-rest-control output','font-size:20px;font-variant-numeric:tabular-nums;font-weight:700')+
rule('#deviceHealth','background:#e7e3da;color:#050505;border:1px solid #d2cfc4;scroll-margin-top:90px')+
rule('#deviceHealth button','background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da')+
rule('.device-connection-summary','display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0')+
rule('.device-connection-summary>div','padding:14px;border:1px solid #b7bcad;border-radius:12px')+
rule('.device-connection-summary strong|.device-connection-summary span','display:block')+
rule('main :is(button,a,summary,select,input,textarea)','scroll-margin-top:90px;scroll-margin-bottom:calc(94px + env(safe-area-inset-bottom))')+
rule('main :is(h1,h2,h3,h4,article,section[id])','scroll-margin-top:90px')+
rule('main :is(button,a,summary,select,input,textarea):focus-visible','outline:3px solid #050505;outline-offset:3px')+
`#memberMoreDialog{position:fixed;inset:auto 0 0;margin:0 auto;width:100%;max-width:640px;max-height:calc(100dvh - 40px);box-sizing:border-box;border:0;border-radius:22px 22px 0 0;padding:24px 24px max(24px,env(safe-area-inset-bottom));overflow:auto;background:#f5f2eb;color:#050505;font:16px/1.5 Arial,sans-serif}#memberMoreDialog::backdrop{background:#05050599}#memberMoreDialog header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:12px}#memberMoreDialog h2{margin:0;font-size:28px}#memberMoreDialog :is(a,button){min-height:48px;box-sizing:border-box;font:inherit;border:1px solid #d2cfc4;border-radius:10px;color:#050505;background:#e7e3da;text-align:left;padding:12px 14px;text-decoration:none}#memberMoreDialog nav{display:grid;gap:8px}#memberMoreDialog h3{font-size:13px;color:#4d5545;margin:18px 0 8px}#memberMoreDialog :is(a,button):focus-visible{outline:3px solid #050505;outline-offset:2px}#memberMoreUtilities{display:flex;flex-wrap:wrap;gap:8px}#memberMoreUtilities :is(#sstCookieSettings,#askTimberLaunch){position:static!important;inset:auto!important;transform:none!important;box-shadow:none!important;color:#050505!important;background:#e7e3da!important;max-width:100%!important}#memberMoreUtilities #askTimberLaunch{display:none!important}`+
'@media(max-width:640px){'+rule('main','padding:20px 16px 32px')+rule('#todayActions.app-today-v3 .today-layout','display:flex;flex-direction:column;gap:16px')+rule('#todayActions.app-today-v3 .today-meal h3','font-size:27px')+rule('#grubDiscoverResults','grid-template-columns:1fr')+rule('.grub-discovery-options','grid-template-columns:1fr 1fr')+rule('.grub-discovery-options label:last-child','grid-column:1/-1')+'}\n'+
'@media(prefers-reduced-motion:no-preference){'+rule('#appBottomNav :is(a,button)','transition:background .15s ease')+'}\n';

export const appExperienceClient=String.raw`(()=>{
 'use strict';
 if(document.body.dataset.memberDesign!=='20261001')return;
 document.body.dataset.memberExperienceUi='20261015';
 const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 const text=(n,v)=>{if(n&&n.textContent!==v)n.textContent=v};
 const link=(label,href)=>{const a=node('a','',label);a.href=href;const tool=/^\/member\/(grub|fit|life-back)(?:[?#]|$)/.exec(href);if(tool)a.dataset.appOpen=tool[1];return a};
 let queued=false,more,returnFocus,weekLoadVersion=0;
 async function recordedWeek(host){
  const version=++weekLoadVersion,status=node('p','','Loading your recorded week…');status.setAttribute('role','status');host.append(status);
  const valid=()=>version===weekLoadVersion&&host.isConnected&&!document.hidden&&document.body.dataset.memberJourneyView==='week';
  try{
   if(!window.SST_HEALTH_CONSENT?.status||!await window.SST_HEALTH_CONSENT.status())throw Error('Review optional health tracking in Settings before viewing your recorded week.');
   if(!valid())return;if(!window.SST_API?.getMe||!window.SST_API?.getProgressSummary)throw Error('Your records are still loading. Reopen My week to try again.');
   const before=await window.SST_API.getMe(),owner=before.user?.id??before.id;if(owner===undefined)throw Error('Please sign in again to view your private records.');
   if(!valid())return;const result=await window.SST_API.getProgressSummary();if(!valid())return;const after=await window.SST_API.getMe();if(!valid())return;
   if(String(after.user?.id??after.id)!==String(owner))throw Error('Your account changed. Reopen My week before viewing records.');
   const data=result.progress||result,to=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'}),from=new Date(Date.parse(to+'T12:00:00Z')-6*86400000).toISOString().slice(0,10),table=node('table'),head=node('thead'),tr=node('tr');
   for(const label of ['Measure','First recorded','Latest recorded'])tr.append(node('th','',label));head.append(tr);table.append(head);const rows=node('tbody');let count=0;const days=new Set();
   const value=(metric,n)=>metric.key==='weight'&&data.units==='stone_lb'?Math.floor(Math.round(n/.45359237)/14)+' st '+Math.round(n/.45359237)%14+' lb':Number(n.toFixed(1))+' '+(metric.unit||'');
   for(const metric of data.metrics||[]){if(!['weight','waist','systolic','diastolic'].includes(metric.key))continue;
    const entries=(metric.series||[]).filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.on||'')&&r.on>=from&&r.on<=to&&typeof r.value==='number'&&Number.isFinite(r.value)).sort((a,b)=>a.on.localeCompare(b.on));if(!entries.length)continue;
    entries.forEach(r=>days.add(r.on));count++;const row=node('tr');for(const text of [metric.label,value(metric,entries[0].value),value(metric,entries.at(-1).value)])row.append(node('td','',text));rows.append(row);
   }
   status.textContent=from+' to '+to+' · '+days.size+' of 7 days with measurements. Other days are unrecorded.';
   if(count){table.append(rows);host.append(table);}else host.append(node('p','','No measurements recorded in this week. Earlier records remain available in Journey.'));
   if(data.historyMayBeLimited)host.append(node('p','','The available-history limit was reached; some records may be omitted.'));
  }catch(error){if(valid())status.textContent=error.status===401?'Please sign in again to view your private records.':error.message||'Your week could not load. Saved records have not changed.';}
 }
 function mountMore(){
  if(document.body.dataset.appPanel==='1'||$('#memberMoreDialog'))return;
  more=node('dialog');more.id='memberMoreDialog';more.setAttribute('aria-labelledby','memberMoreTitle');
  const header=node('header'),title=node('h2','','More');title.id='memberMoreTitle';const close=node('button','','Close');close.type='button';close.onclick=()=>more.close();header.append(title,close);more.append(header);
  const sections=[['Your account',[['Account & settings','/member/settings'],['Connected health','/member/settings#deviceHealth'],['My Orders','/member/orders'],['Saved & records','/member/saved']]],['Your journey',[['Life Back · goals & wins','/member/life-back'],['Measurements & weekly records','/member/dashboard#journey'],['Progress photos','/member/dashboard#visualise'],['My Plans','/member/dashboard#plans']]],['Help',[['Ask Timber','/member/ask-timber'],['Help using My Timber','/help'],['Contact SHIFT','/contact'],['Privacy information','/privacy']]]];
  for(const [heading,items]of sections){more.append(node('h3','',heading));const nav=node('nav');nav.setAttribute('aria-label',heading);items.forEach(([label,href])=>nav.append(link(label,href)));more.append(nav)}
  const existing=all('.sst-member-tabs a').find(a=>new URL(a.href).pathname==='/member/treatment');if(existing)more.querySelector('nav').append(link('My Treatment',existing.getAttribute('href')));
  const logout=$('.member-nav-logout-form');if(logout)more.append(logout);
  more.append(node('h3','','Privacy choices'));const utilities=node('div');utilities.id='memberMoreUtilities';more.append(utilities);more.append(node('h3','','Accessibility'));const accessibility=node('div');accessibility.id='memberAccessibility';more.append(accessibility);document.body.append(more);
  const trigger=$('#appMore');trigger?.setAttribute('aria-controls',more.id);
  more.addEventListener('close',()=>{trigger?.setAttribute('aria-expanded','false');returnFocus?.focus({preventScroll:true})});
  more.addEventListener('click',e=>{const a=e.target.closest('a');if(a)more.close();if(e.target.closest('#sstCookieSettings')){returnFocus=null;more.close();requestAnimationFrame(()=>document.querySelector('.cookie-banner-v3a button')?.focus())}if(e.target===more){const r=more.getBoundingClientRect();if(e.clientY<r.top||e.clientY>r.bottom)more.close()}});
 }
 function today(){
  const root=$('#todayActions.app-today-v3');if(!root)return;
  if(!root.querySelector('.member-today-intro')){const intro=node('section','member-today-intro'),copy=node('div');copy.append(node('p','member-today-date',new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',weekday:'long',day:'numeric',month:'long'}).format(new Date())),node('h1','','Today'));intro.append(copy,link('Check in','/member/check-in'));root.prepend(intro)}
  const intro=root.querySelector('.member-today-intro'),next=root.querySelector('.mtm-next'),anchor=root.querySelector('.member-coaching-primary')||intro;if(next&&anchor.nextElementSibling!==next)anchor.after(next);
  const support=root.querySelector('.today-support');if(!support)return;
  const coach=$('#shiftCoach');if(coach&&!coach.closest('.member-coaching-details')){const d=node('details','member-coaching-details');d.append(node('summary','','Coaching & support'));support.before(d);d.append(coach)}
  if(coach){const details=coach.closest('.member-coaching-details'),enabled=$('#panel-today')?.hasAttribute('data-shift-coach-enabled');if(details){if(details.classList.contains('member-coaching-primary')!==enabled)details.classList.toggle('member-coaching-primary',enabled);if(enabled){details.open=true;if(intro.nextElementSibling!==details)intro.after(details)}else if(details.nextElementSibling!==support)support.before(details)}if(next&&next.classList.contains('member-next-secondary')!==enabled)next.classList.toggle('member-next-secondary',enabled)}
  for(const selector of ['#sstTodayContext','#sstTreatmentJourney','#sstFiveLoops','#myHealthPlanV2','#wholeManNextShift']){const n=$(selector);if(n&&!support.contains(n))support.append(n)}
 }
 function fit(){
  const builder=$('.sf-builder');if(builder){builder.dataset.experienceReady='true';const detail=builder.closest('details');if(detail&&!detail.dataset.memberExperienceSetup){detail.dataset.memberExperienceSetup='true';detail.open=true}}
  all('#fitOutput .sf-session').forEach(session=>{
   const cards=[...session.querySelectorAll('.sf-exercise')];if(!cards.length)return;
   const done=cards.filter(c=>c.dataset.completion==='done').length,skipped=cards.filter(c=>c.dataset.completion==='skipped').length,first=cards.find(c=>!['done','skipped'].includes(c.dataset.completion));
   let box=session.querySelector('.member-session-progress');if(!box){box=node('div','member-session-progress');const p=node('p'),progress=node('progress'),overview=node('button','','View exercise list'),pause=node('button','member-session-pause','Pause session');pause.type='button';pause.dataset.pauseSession='true';progress.setAttribute('aria-label','Saved session progress');overview.type='button';overview.dataset.exerciseOverview='toggle';overview.setAttribute('aria-expanded','false');box.append(p,progress,overview,pause);session.querySelector('.sf-session-head')?.after(box)}
   if(session.dataset.sessionFinished!==String(!first))session.dataset.sessionFinished=String(!first);box.querySelector('p').setAttribute('role','status');
   text(box.querySelector('p'),(!first?'Session finished · ':'')+done+' completed'+(skipped?' · '+skipped+' skipped':'')+' · '+cards.length+' exercises');const progress=box.querySelector('progress');if(progress.max!==cards.length)progress.max=cards.length;if(progress.value!==done+skipped)progress.value=done+skipped;
   cards.forEach(card=>{const current=card===first;if(card.dataset.currentExercise!==String(current))card.dataset.currentExercise=String(current);const h=card.querySelector('h4');if(h&&!h.dataset.originalTitle){h.dataset.originalTitle=h.textContent;text(h,h.textContent.replace(/\s+[—–]\s+.+$/,''))}
    const rest=Number(card.querySelector('[data-sf-metrics]')?.textContent.match(/(\d+)\s*SEC REST/i)?.[1]||card.dataset.baseRest||0);
    if(!card.querySelector('.member-rest-control')&&rest){const control=node('div','member-rest-control'),b=node('button','','Start rest · '+rest+' sec'),out=node('output');b.type='button';b.dataset.restSeconds=String(rest);control.append(b,out);card.querySelector('.sf-exercise-main')?.append(control)}
    const restButton=card.querySelector('[data-rest-seconds]');if(restButton&&!restButton.dataset.restUntil&&restButton.dataset.restSeconds!==String(rest)){restButton.dataset.restSeconds=String(rest);text(restButton,'Start rest · '+rest+' sec')}
   });
   const start=session.querySelector('[data-sf-start]');if(start&&!start.disabled&&!session.classList.contains('active'))text(start,done+skipped?'Resume session →':'Start session →');
  });
 }
 function journey(){
  if(document.hidden||document.body.dataset.memberPage!=='dashboard'||!$('#previewMember.is-ready'))return;
  const panels=$('#panel-journey'),progress=$('#panel-visualise');if(!panels||!progress)return;
  for(const a of all('#appBottomNav a'))if(a.textContent.trim()==='Journey'&&new URL(a.href).hash==='#journey')a.setAttribute('href','/member/dashboard#visualise');
  const url=new URL(location.href),active=['#journey','#visualise'].includes(url.hash);
  let nav=$('#memberJourneyTabs');
  if(!nav){
   nav=node('nav');nav.id='memberJourneyTabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Your Journey');
   for(const [key,label]of [['journey','Journey'],['week','My week'],['log','Log a reading'],['felt','How I felt']]){
    const button=node('button','',label);button.type='button';button.dataset.journeyView=key;button.setAttribute('role','tab');button.setAttribute('aria-controls',key==='log'?'panel-journey':'panel-visualise');
    button.onclick=()=>{const oldURL=location.href,next=new URL(location.href);next.searchParams.set('journeyView',key);const panel=key==='log'?'journey':'visualise';$('.mp-tab[data-panel="'+panel+'"]')?.click();next.hash=panel;history.pushState(null,'',next.pathname+next.search+next.hash);dispatchEvent(new HashChangeEvent('hashchange',{oldURL,newURL:location.href}));journey();};nav.append(button);
   }
   panels.parentElement.insertBefore(nav,panels);
  }
  nav.hidden=!active;if(!active){delete document.body.dataset.memberJourneyView;return;}
  const requested=url.searchParams.get('journeyView'),key=url.hash==='#journey'?'log':['journey','week','felt'].includes(requested)?requested:'journey';
  const selectedPanel=key==='log'?panels:progress;all('.mp-panel').forEach(panel=>{const selected=panel===selectedPanel;if(panel.classList.contains('active')!==selected)panel.classList.toggle('active',selected);if(panel.hidden===selected)panel.hidden=!selected;});
  if(document.body.dataset.memberJourneyView!==key)document.body.dataset.memberJourneyView=key;
  nav.querySelectorAll('button').forEach(b=>{const selected=b.dataset.journeyView===key;if(b.getAttribute('aria-selected')!==String(selected))b.setAttribute('aria-selected',String(selected));});
  let entry=$('#memberJourneyEntry');if(!entry){entry=node('section','member-journey-entry');entry.id='memberJourneyEntry';progress.prepend(entry);}
  let photos=$('#memberJourneyPhotos');if(!photos){photos=node('details');photos.id='memberJourneyPhotos';photos.append(node('summary','','Progress photos & other records'));progress.append(photos);}
  for(const child of [...progress.children])if(![entry,photos,$('#shiftProgressStory')].includes(child)&&child.tagName!=='STYLE'){if(child.classList.contains('member-progress-map')){child.hidden=true;continue;}photos.append(child);}
  if(progress.firstElementChild!==entry)progress.prepend(entry);
  if(entry.dataset.view!==key){entry.dataset.view=key;entry.replaceChildren();
   if(key==='felt'){entry.append(node('h2','','How I felt'),node('p','','Review symptoms and medication taken across the dates you choose.'),link('Log how I felt','/member/treatment?entry=symptoms'),link('Choose dates & see entries','/member/treatment?view=timeline'));}
   if(key==='week'){entry.append(node('h2','','My week'),node('p','','Review your saved check-ins and treatment weeks. Missing days remain unknown.'),link('Weekly check-in','/member/dashboard#journey'),link('Symptoms & medication timeline','/member/treatment?view=timeline'));recordedWeek(entry);}
  }
  let medication=$('#memberMedicationTaken');if(!medication){medication=node('section','member-journey-entry');medication.id='memberMedicationTaken';medication.append(node('h2','','Medication taken'),link('Record a jab','/member/treatment?entry=dose'),link('Record an oral tablet','/member/treatment?entry=tablet'),node('p','','Use your saved treatment record. Record only medication you actually took.'));panels.prepend(medication);}
  // Canonical readers/forms retain all writes. The weekly read uses fresh account
  // checks on both sides and never persists health information in browser storage.
 }
 function refresh(){
  mountMore();today();fit();journey();
  all('a').filter(a=>/^Skip to (main )?content$/i.test(a.textContent.trim())).forEach((a,i)=>{if(!a.classList.contains('member-skip-link'))a.classList.add('member-skip-link');if(i>0&&!a.hidden)a.hidden=true});
  const guide=$('aside[aria-label="Food guide"]');if(guide&&!guide.closest('.member-food-guide')){const detail=node('details','member-food-guide');detail.append(node('summary','','Food guide & practical swaps'));$('main')?.append(detail);detail.append(guide)}

  const tool=document.body.dataset.appTool,hash=location.hash||'#today',page=document.body.dataset.memberPage;
  const name=page==='dashboard'?(tool&&tool!=='today'?({grub:'Grub',fit:'Fit','life-back':'Journey'}[tool]||'Today'):hash==='#today'?'Today':hash==='#journey'?'Journey':hash==='#visualise'?'Progress':hash==='#plans'?'My Plans':'Today'):({'life-back':'Journey','check-in':'Check-in',grub:'Grub',fit:'Fit',settings:'Settings',orders:'My Orders','ask-timber':'Ask Timber',saved:'Saved',plans:'My Plans'}[page]||'My Timber');
  const brand=$('#todayBrand>a>span');if(brand){let label=brand.querySelector('.member-section-name');if(!label){label=node('span','member-section-name');brand.append(label)}text(label,name)}
  if(more){const utilities=$('#memberMoreUtilities');all('#sstCookieSettings,#askTimberLaunch').forEach(n=>{if(n.parentElement!==utilities)utilities.append(n)});const accessibility=$('#a11yControls'),host=$('#memberAccessibility');if(accessibility&&accessibility.parentElement!==host)host.append(accessibility)}
  all('#appBottomNav a').forEach(a=>{const u=new URL(a.href),key=u.pathname.split('/').pop(),selected=key==='dashboard'?(u.hash==='#journey'?['Journey','Progress','My Plans'].includes(name):name==='Today'):key===name.toLowerCase();if(selected){if(a.getAttribute('aria-current')!=='page')a.setAttribute('aria-current','page')}else if(a.hasAttribute('aria-current'))a.removeAttribute('aria-current')});
  const target=location.hash&&document.getElementById(location.hash.slice(1));if(target){for(let p=target.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open)p.open=true}
 }
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;refresh()})}};
 function revealEditingControl(){
  let owner=document,field=document.activeElement,offset=0;
  try{
   if(field?.tagName==='IFRAME'){const frame=field,inside=frame.contentDocument?.activeElement;if(inside){field=inside;offset=frame.getBoundingClientRect().top;}}
   else if(window.frameElement&&parent.document.body.dataset.memberExperienceUi==='20261015'){owner=parent.document;offset=window.frameElement.getBoundingClientRect().top;}
  }catch{}
  if(!field?.matches('input,textarea,select,[contenteditable="true"]')||field.matches('[type="hidden"],[type="checkbox"],[type="radio"],[type="range"],[type="file"],[type="button"],[type="submit"]')||field.closest('dialog[open]'))return;
  const win=owner.defaultView,viewport=win.visualViewport,header=owner.querySelector('#todayBrand'),nav=owner.querySelector('#appBottomNav'),r=field.getBoundingClientRect();
  const top=Math.max(header?.getBoundingClientRect().bottom||0,viewport?.offsetTop||0)+12;
  const bottom=Math.min(nav?.getBoundingClientRect().top||win.innerHeight,(viewport?.offsetTop||0)+(viewport?.height||win.innerHeight))-12;
  if(r.top+offset<top||r.bottom+offset>bottom)field.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
 }
 const scheduleEditingControl=()=>requestAnimationFrame(revealEditingControl);
 document.addEventListener('focusin',scheduleEditingControl);
 addEventListener('resize',scheduleEditingControl,{passive:true});
 window.visualViewport?.addEventListener('resize',scheduleEditingControl,{passive:true});
 document.addEventListener('click',e=>{
  const trigger=e.target.closest?.('#appMore');if(trigger&&more){e.preventDefault();returnFocus=trigger;more.showModal();trigger.setAttribute('aria-expanded','true')}
  const toggle=e.target.closest?.('button[data-exercise-overview="toggle"]');if(toggle){const s=toggle.closest('.sf-session'),open=s.dataset.exerciseOverview!=='true';s.dataset.exerciseOverview=String(open);toggle.setAttribute('aria-expanded',String(open));text(toggle,open?'Return to current exercise':'View exercise list')}
  const pause=e.target.closest?.('[data-pause-session]');if(pause){const session=pause.closest('.sf-session');session.classList.remove('active');session.dataset.exerciseOverview='false';const overview=session.querySelector('[data-exercise-overview]');overview.setAttribute('aria-expanded','false');text(overview,'View exercise list');session.querySelector('[data-sf-start]')?.focus({preventScroll:true})}
  const rest=e.target.closest?.('[data-rest-seconds]');if(rest){const output=rest.nextElementSibling,seconds=Number(rest.dataset.restSeconds);if(rest.dataset.restUntil){delete rest.dataset.restUntil;text(rest,'Start rest · '+seconds+' sec');text(output,'');return}rest.dataset.restUntil=String(Date.now()+seconds*1000);text(rest,'Cancel rest');const tick=()=>{if(!rest.isConnected||!rest.dataset.restUntil)return false;const remaining=Math.max(0,Math.ceil((Number(rest.dataset.restUntil)-Date.now())/1000));text(output,remaining?Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'):'Rest finished');if(!remaining){delete rest.dataset.restUntil;text(rest,'Start rest · '+seconds+' sec');output.setAttribute('role','status');return false}return true};tick();const timer=setInterval(()=>{if(!tick())clearInterval(timer)},250)}
 });
 function boot(){refresh();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-completion','data-app-tool','class']})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 document.addEventListener('sst:today-rendered',schedule);addEventListener('hashchange',schedule);addEventListener('popstate',schedule);
 const clearWeek=()=>{++weekLoadVersion;const entry=$('#memberJourneyEntry');if(entry?.dataset.view==='week'){entry.replaceChildren();delete entry.dataset.view;}};addEventListener('pagehide',clearWeek);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearWeek();else schedule();});
})();`;
