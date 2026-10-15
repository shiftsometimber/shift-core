// My Timber member presentation, authorised by Matt on 15 October 2026.
// Existing account runtimes remain responsible for every saved action.
const scope='html body[data-member-design="20261001"]:is(#approved-member-design,[data-member-design]):is(#approved-member-palette,[data-member-design]):is(#approved-member-layout,[data-member-design])[data-member-experience-ui="20261015"]';
const rule=(selector,body)=>selector.split('|').map(s=>scope+' '+s).join(',')+'{'+body.split(';').filter(Boolean).map(s=>s+'!important').join(';')+'}\n';
export const appExperienceStyles=scope+'{background:#f5f2eb!important;color:#050505!important;margin:0!important;padding-bottom:calc(94px + env(safe-area-inset-bottom))!important}\n'+
scope+'[data-app-panel="1"]{padding:0!important;margin:0!important}\n'+
scope+'[data-app-panel="1"] main{padding:0!important;margin:0!important}\n'+
rule('main','background:#f5f2eb;color:#050505;max-width:1040px;padding:24px 20px 40px')+
rule('#todayBrand','position:sticky;top:0;z-index:44;min-height:64px;padding-top:max(8px,env(safe-area-inset-top));padding-bottom:8px;box-sizing:border-box')+
rule('#todayBrand .member-design-mark','width:34px;height:34px')+
rule('.member-section-name','display:block;font-size:12px;line-height:1.3;letter-spacing:.02em;color:#e7e3da;-webkit-text-fill-color:#e7e3da;font-weight:400;margin-top:4px')+
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
rule('.sf-session.active [data-sf-start]|.sf-session:not(.active) .member-session-pause','display:none')+
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
rule('main :is(button,a,summary,select,input,textarea)','scroll-margin-top:90px')+
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
 const link=(label,href)=>{const a=node('a','',label);a.href=href;return a};
 let queued=false,more,returnFocus;
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
  const builder=$('.sf-builder');if(builder&&!builder.dataset.experienceReady){builder.dataset.experienceReady='true';const detail=builder.closest('details');if(detail)detail.open=true}
  all('#fitOutput .sf-session').forEach(session=>{
   const cards=[...session.querySelectorAll('.sf-exercise')];if(!cards.length)return;
   const done=cards.filter(c=>c.dataset.completion==='done').length,skipped=cards.filter(c=>c.dataset.completion==='skipped').length,first=cards.find(c=>!['done','skipped'].includes(c.dataset.completion));
   let box=session.querySelector('.member-session-progress');if(!box){box=node('div','member-session-progress');const p=node('p'),progress=node('progress'),overview=node('button','','View exercise list'),pause=node('button','member-session-pause','Pause session');pause.type='button';pause.dataset.pauseSession='true';progress.setAttribute('aria-label','Saved session progress');overview.type='button';overview.dataset.exerciseOverview='toggle';overview.setAttribute('aria-expanded','false');box.append(p,progress,overview,pause);session.querySelector('.sf-session-head')?.after(box)}
   text(box.querySelector('p'),done+' completed'+(skipped?' · '+skipped+' skipped':'')+' · '+cards.length+' exercises');const progress=box.querySelector('progress');if(progress.max!==cards.length)progress.max=cards.length;if(progress.value!==done+skipped)progress.value=done+skipped;
   cards.forEach(card=>{const current=card===first;if(card.dataset.currentExercise!==String(current))card.dataset.currentExercise=String(current);const h=card.querySelector('h4');if(h&&!h.dataset.originalTitle){h.dataset.originalTitle=h.textContent;text(h,h.textContent.replace(/\s+[—–]\s+.+$/,''))}
    const rest=Number(card.querySelector('[data-sf-metrics]')?.textContent.match(/(\d+)\s*SEC REST/i)?.[1]||card.dataset.baseRest||0);
    if(!card.querySelector('.member-rest-control')&&rest){const control=node('div','member-rest-control'),b=node('button','','Start rest · '+rest+' sec'),out=node('output');b.type='button';b.dataset.restSeconds=String(rest);control.append(b,out);card.querySelector('.sf-exercise-main')?.append(control)}
    const restButton=card.querySelector('[data-rest-seconds]');if(restButton&&!restButton.dataset.restUntil&&restButton.dataset.restSeconds!==String(rest)){restButton.dataset.restSeconds=String(rest);text(restButton,'Start rest · '+rest+' sec')}
   });
   const start=session.querySelector('[data-sf-start]');if(start&&!start.disabled&&!session.classList.contains('active'))text(start,done+skipped?'Resume session →':'Start session →');
  });
 }
 function refresh(){
  mountMore();today();fit();
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
 document.addEventListener('click',e=>{
  const trigger=e.target.closest?.('#appMore');if(trigger&&more){e.preventDefault();returnFocus=trigger;more.showModal();trigger.setAttribute('aria-expanded','true')}
  const toggle=e.target.closest?.('button[data-exercise-overview="toggle"]');if(toggle){const s=toggle.closest('.sf-session'),open=s.dataset.exerciseOverview!=='true';s.dataset.exerciseOverview=String(open);toggle.setAttribute('aria-expanded',String(open));text(toggle,open?'Return to current exercise':'View exercise list')}
  const pause=e.target.closest?.('[data-pause-session]');if(pause){const session=pause.closest('.sf-session');session.classList.remove('active');session.dataset.exerciseOverview='false';const overview=session.querySelector('[data-exercise-overview]');overview.setAttribute('aria-expanded','false');text(overview,'View exercise list');session.querySelector('[data-sf-start]')?.focus({preventScroll:true})}
  const rest=e.target.closest?.('[data-rest-seconds]');if(rest){const output=rest.nextElementSibling,seconds=Number(rest.dataset.restSeconds);if(rest.dataset.restUntil){delete rest.dataset.restUntil;text(rest,'Start rest · '+seconds+' sec');text(output,'');return}rest.dataset.restUntil=String(Date.now()+seconds*1000);text(rest,'Cancel rest');const tick=()=>{if(!rest.isConnected||!rest.dataset.restUntil)return false;const remaining=Math.max(0,Math.ceil((Number(rest.dataset.restUntil)-Date.now())/1000));text(output,remaining?Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'):'Rest finished');if(!remaining){delete rest.dataset.restUntil;text(rest,'Start rest · '+seconds+' sec');output.setAttribute('role','status');return false}return true};tick();const timer=setInterval(()=>{if(!tick())clearInterval(timer)},250)}
 });
 function boot(){refresh();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-completion','data-app-tool','class']})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 document.addEventListener('sst:today-rendered',schedule);addEventListener('hashchange',schedule);addEventListener('popstate',schedule);
})();`;
