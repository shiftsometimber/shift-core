import {firstWeekFunction} from './first-week.mjs';
// Today is a view over the existing account. Original controls keep their handlers.
const scope='html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]):is(#today-design-scope,[data-app-layout])';
const rule=(selector,css)=>scope+' '+selector+'{'+css.split(';').filter(Boolean).map(s=>s.replace(/!important/g,'')+'!important').join(';')+'}\n';
export const todayStyles=
scope+':has(#todayActions.app-today-v3)>header.site-header{display:none!important}'+
rule('#todayBrand','display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 0 0;color:#e7e3da')+
rule('#todayBrand>a','display:flex;align-items:center;gap:10px;font:700 18px/1 Arial,sans-serif;text-decoration:none;color:#e7e3da')+
rule('#todayBrand .today-logo','display:grid;place-items:center;width:34px;height:34px;border:2px solid currentColor;border-radius:50%;font-size:26px')+
rule('#todayBrand button','background:transparent;color:#e7e3da;border:1px solid #707762;border-radius:8px;min-height:44px;padding:10px 14px;font-size:14px')+
rule('main:has(#todayActions.app-today-v3)','max-width:980px;padding:0 20px')+
rule('#todayActions.app-today-v3','display:block;color:#e7e3da')+
rule('#todayActions.app-today-v3 .mtm-hero','display:block;min-height:0;padding:24px 0 20px;margin:0;background:transparent;border:0')+
rule('#todayActions.app-today-v3 .mtm-hero>div','max-width:100%')+
rule('#todayActions.app-today-v3 .mtm-hero h2','font-size:clamp(30px,5vw,44px);line-height:1.12;letter-spacing:-1px;font-weight:700;margin:0 0 10px;color:#e7e3da')+
rule('#todayActions.app-today-v3 .mtm-hero p:last-child','font-size:16px;line-height:1.5;margin:0;color:#bdc2b4')+
rule('#todayActions.app-today-v3 .mtm-hero .mtm-kicker','display:none')+
rule('#todayActions.app-today-v3 .app-today-shortcuts','display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding:6px;margin:0 0 20px;border:1px solid #42493b;border-radius:16px;background:#11160f')+
rule('#todayActions.app-today-v3 .app-today-shortcuts a','min-width:0;min-height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:8px 2px;border-radius:11px;color:#c7ccbc;font-size:13px;font-weight:400;text-decoration:none')+
rule('#todayActions.app-today-v3 .app-today-shortcuts a[aria-selected="true"]','background:#39432e;color:#f4f1e9')+
rule('#todayActions.app-today-v3 .app-line-icon','width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0')+
rule('#todayActions.app-today-v3 .today-layout','display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:20px;align-items:start')+
rule('#todayActions.app-today-v3 .today-meal','grid-column:1;grid-row:1/4;padding:0;margin:0;border:0;box-shadow:none;overflow:hidden;border-radius:20px;background:#e7e3da;color:#050505;min-width:0')+
rule('#todayActions.app-today-v3 .today-meal-visual','margin:0;position:relative;background:#303a27;aspect-ratio:1.6;display:grid;place-items:center;overflow:hidden')+
rule('#todayActions.app-today-v3 .today-meal-visual img','display:block;width:100%;height:100%;object-fit:cover;position:absolute;inset:0')+
rule('#todayActions.app-today-v3 .today-meal-visual .app-line-icon','width:72px;height:72px;color:#b7c59c')+
rule('#todayActions.app-today-v3 .today-meal-visual figcaption','position:absolute;bottom:10px;left:12px;padding:4px 8px;background:#050505c9;color:#eeeae2;border-radius:5px;font-size:10px')+
rule('#todayActions.app-today-v3 .today-meal-copy','padding:22px')+
rule('#todayActions.app-today-v3 .today-meal:not([data-has-image]) .today-meal-visual','aspect-ratio:auto;width:48px;height:48px;margin:20px 20px 0;border-radius:12px')+
rule('#todayActions.app-today-v3 .today-meal:not([data-has-image]) .today-meal-visual .app-line-icon','width:28px;height:28px')+
rule('#todayActions.app-today-v3 .today-meal:not([data-has-image]) .today-meal-copy','padding-top:14px')+
rule('#todayActions.app-today-v3 .today-eyebrow','font-size:11px;letter-spacing:1.5px;font-weight:700;margin:0 0 10px;color:inherit')+
rule('#todayActions.app-today-v3 :is(.today-meal,.today-life) .today-eyebrow','color:#566044;-webkit-text-fill-color:#566044')+
rule('#todayActions.app-today-v3 .today-meal h3','font-size:34px;font-weight:700;letter-spacing:-1px;line-height:1.1;margin:0 0 12px;color:#050505')+
rule('#todayActions.app-today-v3 .today-meal-meta','font-size:15px;line-height:1.5;margin:0 0 18px;color:#343a2e')+
rule('#todayActions.app-today-v3 .today-meal-action','display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;padding:12px 16px;box-sizing:border-box;border:0;border-radius:10px;background:#050505;color:#fffdf5;-webkit-text-fill-color:#fffdf5;text-decoration:none;font-size:15px;font-weight:700')+
rule('#todayActions.app-today-v3 .today-swap','display:block;text-align:center;font-size:13px;line-height:1.5;min-height:44px;padding:14px 0 0;color:#343a2e;text-decoration:underline;text-underline-offset:3px')+
rule('#todayActions.app-today-v3 .mtm-week','grid-column:2;padding:20px;background:transparent;border:0;border-radius:0;margin:0')+
rule('#todayActions.app-today-v3 .mtm-week .mtm-section-head','display:block;margin:0 0 10px')+
rule('#todayActions.app-today-v3 .mtm-week h2','font-size:19px;line-height:1.3;font-weight:700;letter-spacing:0;margin:0;color:#e7e3da')+
rule('#todayActions.app-today-v3 .mtm-week p','font-size:13px;line-height:1.5;color:#bdc2b4;margin:8px 0 0')+
rule('#todayActions.app-today-v3 .today-week-start','margin:0 0 20px;padding:0 0 18px;border-bottom:1px solid #42493b')+
rule('#todayActions.app-today-v3 .today-week-start h3','font-size:21px;line-height:1.2;margin:0 0 10px;color:#e7e3da')+
rule('#todayActions.app-today-v3 .today-week-start a','display:inline-flex;align-items:center;min-height:44px;color:#d4dfbd;font-size:14px;font-weight:700;text-decoration:underline;text-underline-offset:3px')+
rule('#todayActions.app-today-v3 .today-week-start summary','min-height:44px;display:flex;align-items:center;cursor:pointer;font-size:13px;color:#bdc2b4')+
rule('#todayActions.app-today-v3 .today-week-start ol','padding-left:20px;font-size:13px;line-height:1.5;color:#bdc2b4')+
rule('#todayActions.app-today-v3 .today-week-start li','margin:10px 0')+
rule('#todayActions.app-today-v3 .mtm-days','display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin:16px 0')+
rule('#todayActions.app-today-v3 .mtm-days span','display:grid;justify-items:center;gap:7px;font-size:11px;color:#bdc2b4')+
rule('#todayActions.app-today-v3 .mtm-days b','width:28px;height:28px;display:grid;place-items:center;border:1px solid #667254;border-radius:50%;background:transparent;color:#aebd94;font-size:17px')+
rule('#todayActions.app-today-v3 .mtm-days b.is-logged','background:#aebd94;color:#050505;border-color:#aebd94')+
rule('#todayActions.app-today-v3 .today-life','grid-column:2;display:flex;align-items:center;gap:16px;padding:22px;border-radius:16px;background:#e7e3da;color:#050505;text-decoration:none')+
rule('#todayActions.app-today-v3 .today-life .app-line-icon','width:36px;height:36px;color:#566044')+
rule('#todayActions.app-today-v3 .today-life strong','display:block;font-size:21px;line-height:1.2;margin:0 0 6px;color:#050505')+
rule('#todayActions.app-today-v3 .today-life p','font-size:13px;line-height:1.5;margin:0;color:#414839')+
rule('#todayActions.app-today-v3 .today-life .today-arrow','margin-left:auto;font-size:25px')+
rule('#todayActions.app-today-v3 .today-movement','grid-column:2;padding:18px 20px;border:1px solid #42493b;border-radius:16px;background:#10150e;margin:0')+
rule('#todayActions.app-today-v3 .today-movement h3','font-size:20px;line-height:1.3;margin:8px 0;color:#e7e3da')+
rule('#todayActions.app-today-v3 .today-movement p','font-size:14px;line-height:1.5;margin:8px 0;color:#bdc2b4')+
rule('#todayActions.app-today-v3 .today-movement a','display:block;padding:12px 0;min-height:44px;box-sizing:border-box;font-size:14px;color:#d4dfbd;text-decoration:underline')+
rule('#todayActions.app-today-v3 .today-followthrough','margin-top:24px;display:grid;gap:18px')+
rule('#todayActions.app-today-v3 .mtm-next','background:#e7e3da;color:#050505;padding:22px;border-radius:16px;margin:0')+
rule('#todayActions.app-today-v3 .mtm-next :is(h3,p,small,a,button)','color:#050505;-webkit-text-fill-color:#050505')+
rule('#todayActions.app-today-v3 .mtm-next .mt-now-action','background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da')+
rule('#todayActions.app-today-v3 .mtm-next h3','font-size:23px;line-height:1.2;margin:8px 0')+
rule('#todayActions.app-today-v3 .mtm-next :is(p,button,a)','font-size:14px;line-height:1.5')+
rule('#todayActions.app-today-v3 .mtm-next button','background:transparent;border:1px solid #707762;border-radius:8px;min-height:44px;padding:10px;margin:4px')+
rule('#todayActions.app-today-v3 .today-support','padding:18px 0;border-top:1px solid #42493b;margin-top:20px')+
rule('#todayActions.app-today-v3 .today-support>summary','cursor:pointer;min-height:44px;font-size:15px;color:#d0d6c4')+
rule('#todayActions.app-today-v3 .today-support :is(.mtm-panel,.mtm-care)','background:#10150e;padding:18px;border:1px solid #42493b;border-radius:12px;margin:16px 0')+
rule('#todayActions.app-today-v3 .today-support :is(p,a,button,summary)','font-size:14px;line-height:1.5')+
rule('#todayActions.app-today-v3 :is(a,button,summary):focus-visible','outline:3px solid #aebd94;outline-offset:4px')+
rule('#moodRow','display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px')+
rule('#moodRow>*','min-width:0;word-break:normal;overflow-wrap:normal;white-space:normal;font-size:13px;padding:10px 4px')+
'@media(max-width:640px){'+
rule('main:has(#todayActions.app-today-v3)','padding:0 14px')+
rule('#todayActions.app-today-v3 .today-layout','display:flex;flex-direction:column;gap:16px')+
rule('#todayActions.app-today-v3 .today-layout>*','width:100%;box-sizing:border-box')+
rule('#todayActions.app-today-v3 .today-meal-visual','aspect-ratio:1.7')+
rule('#todayActions.app-today-v3 .today-meal-copy','padding:20px')+
rule('#todayActions.app-today-v3 .today-meal h3','font-size:32px')+
rule('#todayActions.app-today-v3 .mtm-hero','padding:20px 0')+
'}@media(max-width:380px){'+rule('#moodRow','grid-template-columns:repeat(2,minmax(0,1fr))')+'}'+scope+'[data-app-tool]:not([data-app-tool="today"]) #todayActions.app-today-v3>:not(.mtm-hero):not(.app-today-shortcuts){display:none!important}'+
'@media(prefers-reduced-motion:no-preference){'+rule('#todayActions.app-today-v3 .today-meal-action','transition:background .15s ease')+'}';

export const todayClient='const myTimberFirstWeekView='+firstWeekFunction+';'+String.raw`(()=>{
let generation=0,latestFeedback=null;
const paths={sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',fit:'M4 8v8m3-11v14m10-14v14m3-11v8M7 12h10',food:'M5 3v7m3-7v7M3 3v6a3 3 0 0 0 6 0M6 12v9M18 3v18m0-18c-5 3-5 10 0 10',life:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z'};
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n}
function icon(name){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('class','app-line-icon');s.setAttribute('aria-hidden','true');const p=document.createElementNS(s.namespaceURI,'path');p.setAttribute('d',paths[name]);s.append(p);return s}
function link(label,key,hash=''){const a=el('a','',label);a.href='/member/'+key+hash;a.dataset.appOpen=key;return a}
function build(event){
 const connected=event?.detail?.connected||{};let workspaceData=null;
 const root=document.getElementById('todayActions'),hero=root?.querySelector('.mtm-hero'),grid=root?.querySelector('.mtm-dashboard');if(!hero||!grid||root.querySelector('.today-layout'))return;
 const day=grid.querySelector('.mtm-panel'),week=grid.querySelector('.mtm-week'),plan=root.querySelector('.mtm-plan'),life=week?.querySelector('.mt-connected-life');if(!day||!week||!plan||!life)return;
 root.classList.remove('app-today-v2');root.classList.add('app-today-v3');const token=++generation;
 if(!document.getElementById('todayBrand')){const brand=el('div');brand.id='todayBrand';const home=el('a','','MY TIMBER');home.href='/member/dashboard?view=app#today';home.prepend(el('span','today-logo','S'));const menu=el('button','','Menu');menu.type='button';menu.addEventListener('click',()=>document.getElementById('appMore')?.click());brand.append(home,menu);(root.closest('main')||root.parentElement).prepend(brand)}
 hero.querySelector('p:last-child').textContent='A little better starts here.';
 const nav=el('nav','app-today-shortcuts');nav.setAttribute('aria-label','Today tools');for(const [name,key,path]of [['Today','sun','dashboard#today'],['Fit','fit','fit'],['Grub','food','grub'],['Life Back','life','life-back']]){const a=el('a','',name);a.href='/member/'+path;a.prepend(icon(key));nav.append(a)}hero.after(nav);
 const layout=el('div','today-layout'),mealCard=el('article','today-meal');mealCard.setAttribute('aria-label','Your food today');
 const visual=el('figure','today-meal-visual');visual.append(icon('food'));
 const copy=el('div','today-meal-copy'),eyebrow=el('p','today-eyebrow','SHIFT GRUB'),heading=el('h3','','Something good to eat.'),meta=el('p','today-meal-meta','Choose a meal that fits your day.'),action=link('Find my next meal →','grub','#discover'),swap=link('Fancy something else? Swap meal','grub','#discover');action.className='today-meal-action';swap.className='today-swap';copy.append(eyebrow,heading,meta,action);mealCard.append(visual,copy);layout.append(mealCard);
 const originalMeal=plan.querySelector('.mt-meal');if(originalMeal?.querySelector('.mt-plan-done')){heading.textContent='Today’s meal, sorted.';meta.textContent=originalMeal.querySelector('h3')?.textContent||'Your chosen meal';action.textContent='See today’s meal →';action.href='/member/grub#today';copy.append(swap)}
 const support=el('details','today-support');support.id='more-for-today';support.append(el('summary','','Adjust today, water & saved records'));
 const oldMore=root.querySelector('#more-for-today');if(oldMore)oldMore.id='';
 const next=root.querySelector('.mtm-next'),follow=el('div','today-followthrough');if(next){next.querySelector('.mtm-change-step')?.addEventListener('click',()=>{support.open=true});follow.append(next)}
 week.querySelector('.mtm-kicker').textContent='Your week, your pace';week.querySelector('.mtm-section-head a')?.remove();week.querySelectorAll('hr,:scope>.mtm-kicker').forEach(n=>n.remove());for(const n of [...week.querySelectorAll('.mtm-utility,.mt-weekly')])support.append(n);
 const lifeLink=link('','life-back');lifeLink.className='today-life';const lifeCopy=el('div');lifeCopy.append(el('p','today-eyebrow','LIFE BACK'),el('strong','','More than a number.'),el('p','','Notice what’s getting easier.'));lifeLink.append(icon('sun'),lifeCopy,el('span','today-arrow','→'));support.append(life);layout.append(week,lifeLink);
 const movement=plan.querySelector('.mt-workout');if(movement){movement.className='today-movement';movement.querySelector('small').textContent='SHIFT FIT';const a=movement.querySelector('a');if(a&&!a.hasAttribute('data-fit-today-handoff'))a.dataset.appOpen='fit';layout.append(movement)}
 for(const node of [...day.children])if(!node.classList.contains('mtm-section-head')&&node!==plan)support.append(node);
 if(originalMeal&&originalMeal.querySelector('[data-meal]'))support.append(originalMeal);plan.remove();grid.replaceWith(layout);nav.after(layout);layout.after(follow);
 const checkin=root.querySelector('#optional-checkin');if(checkin)follow.append(checkin);const feedback=document.getElementById('dailyCheckinFollowup');if(feedback)follow.append(feedback);
 for(const n of [...root.querySelectorAll(':scope>.mtm-daily,:scope>.mtm-records,:scope>.mtm-ask,:scope>.mt-treatment-aware')])support.append(n);
 if(oldMore){for(const n of [...oldMore.children])if(n.tagName!=='SUMMARY')support.append(n);oldMore.remove()}
 const start=el('section','today-week-start');start.setAttribute('aria-label','Your first week and next visit');const startTitle=el('h3'),startCopy=el('p'),startLink=el('a'),roadmap=el('details');roadmap.append(el('summary','','A good first week — at your pace'));const stages=el('ol');for(const text of ['Start: choose one meal or a manageable bit of movement. You don’t need a whole new routine.','Next visit: pick up your saved step. After trying it, say whether it helped or didn’t fit.','Later this week: use Life Back to notice one thing that felt easier — or what still needs work.'])stages.append(el('li','',text));const review=link('Notice what’s changing →','life-back');roadmap.append(stages,review,el('p','','Miss a day? Carry on from where you are. There’s no catch-up list.'));start.append(startTitle,startCopy,startLink,roadmap);week.prepend(start);
 function updateStart(){const view=myTimberFirstWeekView({connected,workspace:workspaceData,feedback:latestFeedback});start.dataset.weekState=view.state;hero.querySelector('p:last-child').textContent=view.intro;startTitle.textContent=view.title;startCopy.textContent=view.detail;startLink.textContent=view.label+' →';startLink.href={'meal':'#today-meal','checkin':'#optional-checkin','feedback':'#dailyCheckinFollowup','next':'#today-next-step'}[view.target];startLink.dataset.target=view.target;}
 mealCard.id='today-meal';if(next)next.id='today-next-step';startLink.addEventListener('click',e=>{const target=document.querySelector(startLink.getAttribute('href'));if(!target)return;e.preventDefault();if(target.tagName==='DETAILS')target.open=true;const details=target.querySelector('details');if(details)details.open=true;target.scrollIntoView({block:'start',behavior:'auto'});target.setAttribute('tabindex','-1');target.focus({preventScroll:true})});updateStart();
 const feedbackChanged=()=>{if(!start.isConnected){document.removeEventListener('sst:daily-feedback',feedbackChanged);return}updateStart()};document.addEventListener('sst:daily-feedback',feedbackChanged);
 root.append(support);const guide=document.getElementById('memberDayGuide');if(guide&&!guide.closest('[data-app-guide]')){const help=el('details','app-footer-details');help.dataset.appGuide='true';help.append(el('summary','','Help using My Timber'),guide);root.after(help)}
 // The workspace supplies the currently published recipe and its exact approved
 // illustration. No name matching, invented meals or writes from this view.
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 fetch('/v1/grub/workspace',{credentials:'same-origin',cache:'no-store',signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Food unavailable');return r.json()}).then(workspace=>{
  if(token!==generation||!mealCard.isConnected)return;workspaceData=workspace;updateStart();
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),chosen=workspace.today?.date===date?workspace.today:null,recipe=chosen?(workspace.recipes||[]).find(r=>r.id===chosen.recipeId):workspace.recommendation?.recipe;
  const selected=!!chosen;mealCard.dataset.mealState=selected?'chosen':recipe?'suggested':'empty';
  heading.textContent=selected?(recipe?.meal_type==='dinner'?'Tonight, sorted.':'Your meal, sorted.'):'Something good to eat.';eyebrow.textContent=selected?'SHIFT GRUB · CHOSEN BY YOU':'SHIFT GRUB · YOUR NEXT MEAL';
  meta.textContent=recipe?[recipe.name,recipe.minutes&&recipe.minutes+' min'].filter(Boolean).join(' · '):selected?chosen.name:'Find something you’ll look forward to. Choose it in Grub and it’ll be here when you come back.';
  if(recipe)mealCard.dataset.recipeId=recipe.id;
  action.textContent=selected?(recipe?.meal_type==='dinner'?'See tonight’s meal →':'See today’s meal →'):recipe?'Take a look in Grub →':'Find my next meal →';action.href='/member/grub'+(selected?'#today':'#discover');if(selected)copy.append(swap);
  if(recipe?.image?.src?.startsWith('/assets/member-experience/food/')){const img=el('img');img.src=recipe.image.src;img.alt=recipe.image.alt||recipe.name;img.width=1448;img.height=1086;img.decoding='async';img.addEventListener('load',()=>{mealCard.dataset.hasImage='true'},{once:true});img.addEventListener('error',()=>{delete mealCard.dataset.hasImage;visual.replaceChildren(icon('food'))},{once:true});visual.replaceChildren(img,el('figcaption','','Recipe illustration · portions illustrative'))}
 }).catch(()=>{if(token===generation&&mealCard.isConnected){mealCard.dataset.mealState='unavailable';meta.append(document.createTextNode(' Open Grub to check the latest saved choice.'))}}).finally(()=>clearTimeout(timer));
}
document.addEventListener('sst:focus-saved',()=>{latestFeedback=null});document.addEventListener('sst:daily-feedback',event=>{latestFeedback=event.detail});document.addEventListener('sst:today-rendered',build);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();`;
