const myTimberFirstWeekView=function firstWeekView({ connected = {}, workspace = null, feedback = null } = {}) {
  const chosen = !!workspace?.today?.recipeId && workspace.today.date === connected.date;
  const previous = !!workspace?.today?.recipeId;
  const returning2 = previous || !!connected.mood || Number(connected.lifeBack?.entries) > 0;
  if (feedback?.feedback) return { state: "reviewed", intro: "Keep what helps. Change what doesn\u2019t.", title: "You\u2019ve told us how it went.", detail: feedback.feedback === "not-fit" ? "That step did not fit your week. Your next step below is the place to pick up." : feedback.feedback === "helped" ? "You said it helped. Your next step below keeps that feedback in view." : "Your answer is saved. You can come back to the step when it suits you.", label: "See my next step", target: "next" };
  if (feedback && feedback.active !== false) return { state: "review", intro: "Pick up from your saved step.", title: "Did it make your day any easier?", detail: "After trying your saved step, tell us whether it helped or did not fit. Haven\u2019t tried it? You can say that too.", label: "Review my step", target: "feedback" };
  if (chosen) return { state: "chosen", intro: "One meal chosen. That\u2019s a useful start.", title: "Try it. Then come back to Today.", detail: "Your recipe is saved in Grub. Next time, check in with how you feel and get one manageable next step. Choosing a meal does not log it as eaten.", label: "Optional check-in", target: "checkin" };
  return { state: returning2 ? "returning" : "start", intro: returning2 ? "Pick up from here. No need to start again." : "Start with one meal. No need to overhaul your week.", title: returning2 ? "Make today a little easier." : "One useful thing, straight away.", detail: returning2 ? "Choose what fits today. Your saved records are still yours, even if you missed a few days." : "Take a look at a recipe, check what you need and choose it for today. You can use Grub before filling in a check-in.", label: returning2 ? "Choose today\u2019s meal" : "Find one meal", target: "meal" };
};(()=>{
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
})();(()=>{
 let generation=0;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n};
 async function request(body){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const response=await fetch('/v1/life-back',{credentials:'same-origin',cache:'no-store',signal:controller.signal,...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const data=await response.json();if(!response.ok)throw Object.assign(Error(data.error||'Could not load your saved goal.'),{status:response.status});return data}finally{clearTimeout(timer)}}
 function mount(event){
  const root=document.querySelector('#todayActions.app-today-v3'),nav=root?.querySelector('.app-today-shortcuts');if(!nav||root.querySelector('.today-focus'))return;
  const token=++generation,c=event.detail?.connected||{},box=el('section');box.className='today-focus';box.setAttribute('aria-label','Your goal and what would help');
  const goal=c.lifeBack?.goal,personal=goal&&goal!=='Your personal goal';
  const heading=el('h3',personal?goal:'What would you like to get back?');box.append(el('p',personal?'WHAT MATTERS TO YOU':'MAKE THIS YOURS · OPTIONAL'),heading);
  if(personal)box.append(el('p','Your goal stays in view. Choose the everyday support that would help you take a step towards it.'));
  else box.append(el('p','More energy for your day? Keeping up with the kids? Tell us what matters, or go straight to Grub or Fit.'));
  if(c.lifeBack?.recordedWin)box.append(el('p','You recorded: “'+c.lifeBack.recordedWin+'”'));
  const details=el('details'),summary=el('summary',personal?'Change what would help today':'Choose your goal and a first step');details.append(summary);
  const form=el('form'),goalLabel=el('label','What do you want to get back? Optional.'),input=el('input');input.id='todayFocusGoal';input.maxLength=70;input.placeholder='For example: keep up with the kids';input.value=personal?goal:'';goalLabel.htmlFor=input.id;
  const needLabel=el('label','What’s getting in the way?'),select=el('select');select.id='todayFocusNeed';select.required=true;needLabel.htmlFor=select.id;
  for(const [value,label]of [['','Choose what fits today'],['food','Food needs to be easier'],['movement','I need manageable movement'],['routine','My evening routine has gone out of the window'],['confidence','I’ve lost momentum'],['steady','I want to keep a useful habit going']]){const option=el('option',label);option.value=value;select.append(option)}
  const save=el('button','Save and show my next step');save.type='submit';save.disabled=true;
  const status=el('p','Loading your saved choices…');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  form.append(goalLabel,input,needLabel,select,el('p','This saves to your existing Life Back record. Changing your goal starts a new set of ratings; your old entries stay in your history.'),save,status);details.append(form);box.append(details);nav.after(box);
  const next=root.querySelector('.mtm-next');if(c.next?.loopId&&next){box.after(next);const action=next.querySelector('.mt-now-action[href]');if(action){const key=new URL(action.href).pathname.split('/').pop();if(['grub','fit','life-back'].includes(key)&&!action.hasAttribute('data-fit-today-handoff'))action.dataset.appOpen=key}}
  let progress=null,busy=false,operation=null;
  const alternative=el('button','Try a different approach');alternative.type='button';alternative.dataset.focusAlternative='';alternative.hidden=true;details.append(alternative);
  async function load(){try{const data=await request();if(token!==generation||!box.isConnected)return;progress=data.progress;select.value=['food','movement','routine','confidence','steady'].includes(progress.supportNeed)?progress.supportNeed:'';save.disabled=false;status.textContent='';box.dataset.focusReady='true';alternative.hidden=!progress.nextShift||!['food','movement','routine','confidence','steady'].includes(progress.nextShift.kind)}catch(error){if(box.isConnected){status.textContent='Your saved choices could not load. You can still use Grub and Fit.';const retry=el('button','Retry');retry.type='button';retry.addEventListener('click',()=>{retry.remove();load()});status.append(retry)}}}
  async function submit(different=false){
   if(busy||!progress)return;const payload=different?{action:'focus',revision:progress.revision,supportNeed:progress.nextShift.kind,approach:'different'}:{action:'focus',revision:progress.revision,supportNeed:select.value,...(input.value.trim()?{goal:input.value.trim()}:{})};
   const signature=JSON.stringify(payload);if(operation?.signature!==signature)operation={signature,id:crypto.randomUUID()};payload.operationId=operation.id;busy=true;save.disabled=true;alternative.disabled=true;input.disabled=true;select.disabled=true;status.textContent='Saving your choice…';
   try{
    if(!window.SST_HEALTH_CONSENT||!await window.SST_HEALTH_CONSENT.ensure()){status.textContent='Nothing saved. You can still use Grub and Fit.';return}
    await request(payload);status.textContent='Saved. Updating your next step…';document.dispatchEvent(new CustomEvent('sst:refresh-today'));document.dispatchEvent(new CustomEvent('sst:focus-saved'));
   }catch(error){status.textContent=error.status===409?'Your saved choices changed. Reload them before trying again.':error.name==='AbortError'?'The save timed out. Reload your saved choices before trying again.':error.message;const retry=el('button','Reload saved choices');retry.type='button';retry.addEventListener('click',()=>{operation=null;retry.remove();load()});status.append(retry)}finally{busy=false;save.disabled=false;alternative.disabled=false;input.disabled=false;select.disabled=false}
  }
  form.addEventListener('submit',event=>{event.preventDefault();submit()});alternative.addEventListener('click',()=>submit(true));load();
 }
 document.addEventListener('sst:today-rendered',mount);
})();
(()=>{
 const wrap=(node,title)=>{if(!node||node.closest('.app-screen-details'))return;const active=title==='Adjust your session'&&node.contains(document.activeElement)?document.activeElement:null;const d=document.createElement('details'),s=document.createElement('summary');d.className='app-screen-details';s.textContent=title;if(active)d.open=true;node.before(d);d.append(s,node);if(active)active.focus({preventScroll:true});return d};
 function compose(){
  const page=document.body.dataset.memberPage;
  if(page==='grub'){
   const tabs=document.querySelector('.grub-v8-tabs'),hero=document.querySelector('main [data-member-hero]');
   if(tabs&&hero&&!tabs.dataset.appPlaced){tabs.dataset.appPlaced='true';hero.after(tabs)}
   wrap(document.querySelector('.grub-account'),'Account & saved food');
   wrap(document.querySelector('.grub-pick-why'),'Why this meal fits');
   wrap(document.querySelector('.grub-pick-feedback'),'Help Shift learn what you like');
   wrap(document.querySelector('.grub-pick-fit'),'How this fits your movement plan');
   const adjustments=document.querySelector('.grub-pick-adjust');
   if(adjustments&&!adjustments.closest('.app-screen-details')){const title=adjustments.previousElementSibling,d=wrap(adjustments,'Adjust this meal');if(title?.textContent.trim()==='Change what matters')d.append(title)}
  }
  if(page==='settings'){
   const panel=document.getElementById('memberDetailsPanel');
   const details=wrap(panel,'Personal & delivery details');if(details)details.classList.add('app-account-details');
   const hero=document.querySelector('main [data-member-hero]'),main=document.querySelector('main');
   if(hero&&main&&!hero.dataset.appPlaced){hero.dataset.appPlaced='true';main.prepend(hero)}
  }
  if(page==='fit'){document.querySelectorAll('.sf-exercise-purpose').forEach(n=>wrap(n,'Why this exercise'));if(document.querySelector('.sf-session')){const d=wrap(document.querySelector('.sf-builder'),'Adjust your session');if(d)d.dataset.appFitSetup='true'}}
  if(page==='life-back'){
   const hero=document.querySelector('#journeyView>[data-member-hero]'),copy=document.querySelector('#journeyView>.hero .hero-copy');if(hero&&copy)copy.prepend(hero);
  }
  document.querySelectorAll('footer').forEach(n=>{if(n.id==='sst-footer-c'||n.closest('main,details'))return;const d=wrap(n,'Help & legal');if(d)d.classList.add('app-footer-details')});
 }
 function boot(){compose();const main=document.querySelector('main');if(main)new MutationObserver(()=>{compose()}).observe(main,{childList:true,subtree:true})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();(()=>{
 function current(){document.querySelectorAll('#appBottomNav a').forEach(a=>{const u=new URL(a.href),match=u.pathname.replace('/staging/member-connected/','/member/')===location.pathname.replace('/staging/member-connected/','/member/')&&(u.hash?u.hash===(location.hash||'#today'):true);if(match){if(a.getAttribute('aria-current')!=='page')a.setAttribute('aria-current','page')}else a.removeAttribute('aria-current')})}
 document.addEventListener('click',e=>{if(document.body.dataset.memberExperienceUi==='20261015')return;const more=e.target.closest?.('#appMore');if(!more)return;const open=document.body.dataset.appMore!=='open';document.body.dataset.appMore=open?'open':'closed';more.setAttribute('aria-expanded',String(open));if(open){const nav=document.querySelector('.sst-member-tabs');nav?.scrollIntoView({block:'start'});nav?.querySelector('a')?.focus()}},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.dataset.appMore==='open'){document.body.dataset.appMore='closed';const more=document.getElementById('appMore');more?.setAttribute('aria-expanded','false');more?.focus()}});

 function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n}

 function boot(){current();if(document.body.dataset.memberPage==='dashboard')document.querySelectorAll('footer').forEach(footer=>{if(footer.id==='sst-footer-c'||footer.closest('main,details'))return;const details=el('details','app-footer-details');details.append(el('summary','','Help & legal'));footer.before(details);details.append(footer)});const account=document.getElementById('connected-account')?.closest('aside');if(account&&!account.closest('details')){const details=el('details','app-review-account');details.append(el('summary','','Fictional review account'));account.before(details);details.append(account)}const bar=document.getElementById('appBottomNav');if(bar)new MutationObserver(current).observe(bar,{subtree:true,attributes:true,attributeFilter:['href']})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();addEventListener('hashchange',current);
})();
(()=>{
 const toolKeys=['today','fit','grub','life-back'];
 if(document.body.dataset.appPanel==='1'){
  function trim(){const main=document.querySelector('main');if(!main)return;let n=main;while(n&&n!==document.body){for(const sibling of n.parentElement.children){if(sibling===n||sibling.matches('script,style,link,dialog,[role="dialog"],#memberSessionStatus'))continue;if(!sibling.hasAttribute('data-app-panel-chrome'))sibling.setAttribute('data-app-panel-chrome','')}n=n.parentElement}}
  trim();new MutationObserver(trim).observe(document.body,{childList:true,subtree:true});return;
 }
 if(document.body.dataset.memberPage!=='dashboard')return;
 const panels=new Map();let chosen='today',host;
 function queryTool(){const v=new URL(location.href).searchParams.get('tool');return toolKeys.includes(v)?v:'today'}
 function syncTabs(){const nav=document.querySelector('.app-today-shortcuts');if(!nav)return;nav.setAttribute('role','tablist');nav.setAttribute('aria-label','My Timber tools');nav.querySelectorAll('a').forEach((a,i)=>{const key=toolKeys[i];a.dataset.appTab=key;a.id='appTab-'+key;a.setAttribute('role','tab');a.setAttribute('aria-selected',String(chosen===key));a.setAttribute('tabindex',chosen===key?'0':'-1');if(key!=='today')a.setAttribute('aria-controls','appTool-'+key)});document.body.dataset.appTool=chosen}
 function measure(frame){try{const d=frame.contentDocument,main=d?.querySelector('main');if(!main)return;const footer=d.getElementById('sst-footer-c');const h=Math.ceil(Math.max(main.getBoundingClientRect().height+main.offsetTop+40,footer?footer.getBoundingClientRect().bottom+frame.contentWindow.scrollY+40:0));if(Math.abs(parseFloat(frame.style.height||'400')-h)>2)frame.style.height=Math.max(360,h)+'px';const top=Math.max(16,-frame.getBoundingClientRect().top+16);d.documentElement.style.setProperty('--app-dialog-top',top+'px');d.documentElement.style.setProperty('--app-dialog-height',Math.max(220,innerHeight-120)+'px')}catch{}}
 function createPanel(key,hash=''){const panel=document.createElement('section');panel.id='appTool-'+key;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','appTab-'+key);const loading=document.createElement('p');loading.className='app-tool-loading';loading.setAttribute('role','status');loading.textContent='Loading '+({'fit':'Shift Fit','grub':'Shift Grub','life-back':'Life Back'}[key])+'…';const frame=document.createElement('iframe');frame.className='app-tool-frame';frame.title={'fit':'Shift Fit','grub':'Shift Grub','life-back':'Life Back'}[key];frame.src='/member/'+key+'?view=app&app_panel=1'+hash;panel.append(loading,frame);host.append(panel);panels.set(key,{panel,frame});
 frame.addEventListener('load',()=>{try{const d=frame.contentDocument;if(!d?.querySelector('main')){loading.textContent='This tool could not load. ';const a=document.createElement('a');a.href='/member/'+key+'?view=app';a.textContent='Open '+frame.title;a.target='_top';loading.append(a);return}loading.hidden=true;const ro=new ResizeObserver(()=>measure(frame));ro.observe(d.querySelector('main'));const footer=d.getElementById('sst-footer-c');if(footer)ro.observe(footer);measure(frame);d.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const u=new URL(a.href),path=u.pathname.replace('/staging/member-connected/','/member/');if(u.origin===location.origin){const next=toolKeys.find(k=>k!=='today'&&path==='/member/'+k);if(next){e.preventDefault();select(next,true);return}if(path==='/member/dashboard'&&(!u.hash||u.hash==='#today')){e.preventDefault();select('today',true);return}if(u.pathname===new URL(frame.src).pathname&&u.hash)return}if(!a.target)a.target='_top'},true)}catch{loading.textContent='Unable to load this tool.'}});
 }
 function select(key,push=false,hash=''){if(!toolKeys.includes(key))key='today';chosen=key;syncTabs();if(!host)return;if(push){const u=new URL(location.href);if(key==='today')u.searchParams.delete('tool');else u.searchParams.set('tool',key);u.hash='today';history.pushState(null,'',u)}host.hidden=key==='today';if(key!=='today'&&!panels.has(key))createPanel(key,hash);else if(key!=='today'&&hash){const frame=panels.get(key).frame;try{frame.contentWindow.location.hash=hash;frame.contentWindow.dispatchEvent(new Event('hashchange'))}catch{}}panels.forEach((v,k)=>{v.panel.hidden=k!==key;if(k===key)requestAnimationFrame(()=>measure(v.frame))}); }
 function mount(){const root=document.getElementById('todayActions');if(!root?.querySelector('.app-today-shortcuts'))return;if(!host){host=document.createElement('div');host.id='appToolPanels';host.hidden=true;root.after(host)}select(queryTool())}
 document.addEventListener('click',e=>{const tab=e.target.closest?.('[data-app-tab],[data-app-open]');if(!tab||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();select(tab.dataset.appTab||tab.dataset.appOpen,true,tab.dataset.appOpen?new URL(tab.href).hash:'')},true);
 document.addEventListener('keydown',e=>{const tab=e.target.closest?.('[data-app-tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=toolKeys.indexOf(tab.dataset.appTab),next=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4;document.querySelector('[data-app-tab="'+toolKeys[next]+'"]').focus();select(toolKeys[next],true)});
 addEventListener('popstate',()=>select(queryTool()));addEventListener('resize',()=>panels.forEach(v=>measure(v.frame)));addEventListener('scroll',()=>{const v=panels.get(chosen);if(v)measure(v.frame)},{passive:true});
 document.addEventListener('sst:focus-saved',()=>{try{panels.get('life-back')?.frame.contentDocument?.dispatchEvent(new Event('sst:account-focus-changed'))}catch{}});
 document.addEventListener('sst:today-rendered',()=>queueMicrotask(mount));if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
(()=>{
 function group(nodes,title,cls=''){nodes=nodes.filter(Boolean);if(!nodes.length||nodes[0].closest('.app-refine-detail'))return;const d=document.createElement('details'),s=document.createElement('summary');d.className='app-refine-detail '+cls;s.textContent=title;nodes[0].before(d);d.append(s,...nodes);return d}
 function refine(){
  const page=document.body.dataset.memberPage;
  if(page==='dashboard')return;
  if(page==='fit'){
   document.querySelectorAll('.sf-session').forEach(session=>{const start=session.querySelector('[data-sf-start]'),head=session.querySelector('.sf-session-head');if(start&&head&&!start.dataset.appPlaced){start.dataset.appPlaced='true';head.after(start)}});
   document.querySelectorAll('.sf-current-step').forEach(n=>group([...n.children].filter(c=>c.tagName==='P'),'Movement guidance & timing'));
   document.querySelectorAll('.sf-exercise-main').forEach(n=>{
    const card=n.closest('.sf-exercise'),completion=n.querySelector('.sf-completion'),swap=card?.querySelector('.sf-exercise-actions button');if(completion&&swap)completion.append(swap);
    if(n.querySelector('.app-refine-exercise'))return;
    const how=[...n.children].find(c=>c.tagName==='DETAILS'&&c.querySelector(':scope>ol'));
    const notes=[...n.children].filter(c=>c!==how&&c.matches('.app-screen-details,p:not(.sf-position)'));
    if(how){how.classList.add('app-refine-detail','app-refine-exercise');how.querySelector('summary').textContent='Show me how & why';how.append(...notes);}
    else group(notes,'Movement guidance','app-refine-exercise');
   });
   document.querySelectorAll('.sf-difficulty').forEach(n=>group([...n.children].filter(c=>c.tagName==='P'),'About session effort'));
  }
  if(page==='settings'){
   document.querySelectorAll('#memberDetailsPanel .md-section').forEach(n=>group([n],n.querySelector('h3')?.textContent.trim()||'Details'));
   document.querySelectorAll('main .tracker-card').forEach(n=>{if(n.matches('[data-account-deletion]')||n.closest('.app-refine-detail,#memberDetailsPanel'))return;const title=n.querySelector('h2,h3');if(title)group([n],title.textContent.trim(),'app-settings-section')});
  }
  if(page==='grub'){
   const recipe=document.querySelector('#grubRecommendation .grub-recipe');
   if(recipe&&!recipe.querySelector('.app-refine-recipe')){
    const details=[...recipe.children].filter(n=>n.matches('.app-screen-details,.grub-recipe-detail'));
    group(details,'Recipe details & adjustments','app-refine-recipe');
   }
   const search=document.querySelector('.grub-search'),hero=document.querySelector('main [data-member-hero]');
   if(search&&hero&&!search.dataset.refinePlaced){search.dataset.refinePlaced='true';const tabs=document.querySelector('.grub-v8-tabs');(tabs||hero).after(search);const results=document.querySelector('#grubDiscoverResults');if(results)search.after(results)}
  }
  if(page==='life-back')document.querySelectorAll('.trend-panel').forEach(n=>group([n],'See your progress over time'));
 }
 let pending=false;function schedule(){if(pending)return;pending=true;queueMicrotask(()=>{pending=false;refine()})}
 function boot(){refine();const main=document.querySelector('main');if(main)new MutationObserver(schedule).observe(main,{childList:true,subtree:true});document.addEventListener('sst:today-rendered',schedule);document.addEventListener('invalid',e=>{let n=e.target.parentElement;while(n){if(n.tagName==='DETAILS')n.open=true;n=n.parentElement}},true)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();(()=>{
 if(document.body.dataset.memberDesign!=='20261001')return;
 let queued=false,activeTool=null;
 const scrollingFrames=new WeakSet();
 function outerScroll(frame){
  try{
   const win=frame.contentWindow;if(!win||!frame.contentDocument?.querySelector('main'))return;
   const reset=()=>{if(win.scrollY||win.scrollX)win.scrollTo({top:0,left:0,behavior:'instant'})};
   if(!scrollingFrames.has(frame)){frame.setAttribute('scrolling','no');win.addEventListener('scroll',reset,{passive:true});scrollingFrames.add(frame)}
   reset();
  }catch{}
 }
 function compose(){
  if(document.body.dataset.accountDeleted==='1')return;
  if(document.body.dataset.appMore==='open'){const more=document.querySelector('nav.sst-member-tabs .member-nav-more');if(more&&!more.open)more.open=true;}
  if(document.body.dataset.memberPage!=='dashboard'){const main=document.querySelector('main'),follow=document.getElementById('dailyCheckinFollowup');if(main&&follow){const card=follow.closest('details')||follow;if(main.contains(card)&&main.lastElementChild!==card)main.append(card);}}
  const root=document.getElementById('todayActions');
  if(root?.classList.contains('app-today-v3')){
   const nav=root.querySelector('.app-today-shortcuts'),layout=root.querySelector('.today-layout'),next=root.querySelector('.mtm-next'),focus=root.querySelector('.today-focus');
   if(document.body.dataset.memberExperienceUi!=='20261015'&&nav&&next&&nav.nextElementSibling!==next)nav.after(next);
   if(layout&&focus&&focus.previousElementSibling!==layout)layout.after(focus);
  }
  const tool=document.body.dataset.appTool,hash=location.hash||'#today';
  if(tool&&tool!==activeTool){const previous=activeTool;activeTool=tool;if(previous!==null)window.scrollTo({top:0,left:0,behavior:'instant'});}
  if(tool&&tool!=='today')outerScroll(document.querySelector('#appTool-'+tool+' iframe'));
  document.querySelectorAll('#appBottomNav a').forEach(a=>{
   const u=new URL(a.href),name=u.pathname.split('/').pop();
   if(['grub','fit'].includes(name)){const inline=document.body.dataset.memberPage==='dashboard'&&document.getElementById('appToolPanels');if(inline&&a.getAttribute('data-app-open')!==name)a.setAttribute('data-app-open',name);else if(!inline&&a.hasAttribute('data-app-open'))a.removeAttribute('data-app-open');}
   const selected=document.body.dataset.memberPage==='dashboard'?(tool&&tool!=='today'?name===tool:name==='dashboard'&&u.hash===hash):name===document.body.dataset.memberPage;
   if(selected&&a.getAttribute('aria-current')!=='page')a.setAttribute('aria-current','page');else if(!selected&&a.hasAttribute('aria-current'))a.removeAttribute('aria-current');
  });
 }
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;compose()})};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{compose();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-app-tool','data-app-more','style']})},{once:true});else{compose();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-app-tool','data-app-more','style']})}
 document.addEventListener('load',event=>{if(event.target.matches?.('.app-tool-frame'))schedule()},true);
 document.addEventListener('sst:today-rendered',schedule);addEventListener('hashchange',schedule);addEventListener('popstate',schedule);
})();(()=>{
 'use strict';
 if(document.body.dataset.memberDesign!=='20261001')return;
 const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 const text=(n,v)=>{if(n&&n.textContent!==v)n.textContent=v};
 const link=(label,href)=>{const a=node('a','',label);a.href=href;const tool=/^\/member\/(grub|fit|life-back)(?:[?#]|$)/.exec(href);if(tool)a.dataset.appOpen=tool[1];return a};
 let queued=false,more,returnFocus,weekLoadVersion=0;
 const utilityHomes=new Map();
 const memberReady=()=>{
  const session=document.body.dataset.memberSession;
  if(session!==undefined)return session==='ready'&&(document.body.dataset.memberPage!=='dashboard'||!!$('#previewMember.is-ready:not([hidden])'));
  if(document.body.dataset.memberPage==='life-back'){const view=$('#journeyView'),main=$('#main'),error=$('#accountError');return !!view&&!view.hidden&&main?.getAttribute('aria-busy')==='false'&&!!error&&error.hidden;}
  return false;
 };
 function moveUtility(n,host){if(!n||!host||n.parentElement===host)return;if(!utilityHomes.has(n)){const home=document.createComment('My Timber utility origin');n.before(home);utilityHomes.set(n,home);}host.append(n);}
 function suspend(){
  clearWeek();returnFocus=null;if(more?.open)more.close();
  for(const [n,home]of utilityHomes){if(home.isConnected)home.replaceWith(n);}utilityHomes.clear();
  more?.remove();more=undefined;delete document.body.dataset.memberExperienceUi;delete document.body.dataset.memberJourneyView;delete document.body.dataset.appMore;
 }

 async function recordedWeek(host){
  const version=++weekLoadVersion,status=node('p','','Loading your recorded week…');status.setAttribute('role','status');host.append(status);
  const valid=()=>version===weekLoadVersion&&memberReady()&&document.body.dataset.memberExperienceUi==='20261015'&&host.isConnected&&!document.hidden&&document.body.dataset.memberJourneyView==='week';
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
  if(document.body.dataset.appPanel==='1')return;if($('#memberMoreDialog')){more=$('#memberMoreDialog');return;}
  more=node('dialog');more.id='memberMoreDialog';more.setAttribute('aria-labelledby','memberMoreTitle');
  const header=node('header'),title=node('h2','','More');title.id='memberMoreTitle';const close=node('button','','Close');close.type='button';close.onclick=()=>more.close();header.append(title,close);more.append(header);
  const sections=[['Your account',[['Account & settings','/member/settings'],['Connected health','/member/settings#deviceHealth'],['My Orders','/member/orders'],['Saved & records','/member/saved']]],['Your journey',[['Life Back · goals & wins','/member/life-back'],['Measurements & weekly records','/member/dashboard#journey'],['Progress photos','/member/dashboard#visualise'],['My Plans','/member/dashboard#plans']]],['Help',[['Ask Timber','/member/ask-timber'],['Help using My Timber','/help'],['Contact SHIFT','/contact'],['Privacy information','/privacy']]]];
  for(const [heading,items]of sections){more.append(node('h3','',heading));const nav=node('nav');nav.setAttribute('aria-label',heading);items.forEach(([label,href])=>nav.append(link(label,href)));more.append(nav)}
  const existing=all('.sst-member-tabs a').find(a=>new URL(a.href).pathname==='/member/treatment');if(existing)more.querySelector('nav').append(link('My Treatment',existing.getAttribute('href')));
  const logout=$('.member-nav-logout-form');if(logout)moveUtility(logout,more);
  more.append(node('h3','','Privacy choices'));const utilities=node('div');utilities.id='memberMoreUtilities';more.append(utilities);more.append(node('h3','','Accessibility'));const accessibility=node('div');accessibility.id='memberAccessibility';more.append(accessibility);document.body.append(more);
  all('#appMore,[data-mt-more]').forEach(trigger=>trigger.setAttribute('aria-controls',more.id));
  more.addEventListener('close',()=>{all('#appMore,[data-mt-more]').forEach(trigger=>trigger.setAttribute('aria-expanded','false'));delete document.body.dataset.appMore;returnFocus?.focus({preventScroll:true})});
  more.addEventListener('click',e=>{const a=e.target.closest('a');if(a)more.close();if(e.target.closest('#sstCookieSettings')){returnFocus=null;more.close();requestAnimationFrame(()=>document.querySelector('.cookie-banner-v3a button')?.focus())}if(e.target===more){const r=more.getBoundingClientRect();if(e.clientY<r.top||e.clientY>r.bottom)more.close()}});
 }
 function dailyActions(owner,anchor){
  if(!owner||!anchor)return null;
  let row=owner.querySelector(':scope>.member-daily-actions');
  if(!row){row=node('nav','member-daily-actions');row.setAttribute('aria-label','Your day and support');const log=node('button','','Log your day');log.type='button';log.dataset.mtQuickLog='true';log.setAttribute('aria-haspopup','dialog');const ask=link('Ask Timber','/member/ask-timber');row.append(log,ask,node('p','','Log what matters today. As much or as little as you like.'));}
  if(anchor.nextElementSibling!==row)anchor.after(row);return row;
 }
 function today(){
  const root=$('#todayActions.app-today-v3');if(!root)return;
  if(!root.querySelector('.member-today-intro')){const intro=node('section','member-today-intro'),copy=node('div');copy.append(node('p','member-today-date',new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',weekday:'long',day:'numeric',month:'long'}).format(new Date())),node('h1','','Your day. Your pace.'));intro.append(copy);root.prepend(intro)}
  const intro=root.querySelector('.member-today-intro');text(intro.querySelector('h1'),'Your day. Your pace.');if(!intro.querySelector('.member-today-prompt'))intro.querySelector('div')?.append(node('p','member-today-prompt','One useful thing is enough.'));
  // Move the canonical, already-bound controls. Do not translate a feeling into
  // a numeric mood value or replace the actual check-in/help event handlers.
  const care=root.querySelector('.mtm-care');
  if(care){const disclosure=care.closest('details#optional-checkin');if(intro.nextElementSibling!==care)intro.after(care);if(disclosure){disclosure.removeAttribute('id');care.id='optional-checkin';if(disclosure.children.length===1)disclosure.remove();}}
  const knownWrap=root.querySelector('.today-meal[data-recipe-id="industrial-v3-wrap-classic-chicken"] .today-meal-meta');if(knownWrap)text(knownWrap,knownWrap.textContent.replace(/\b8 min\b(?! prep)/,'8 min prep'));
  const actions=dailyActions(root,care||intro),next=root.querySelector('.mtm-next');
  if(next&&actions&&actions.nextElementSibling!==next)actions.after(next);
  const support=root.querySelector('.today-support');if(!support)return;
  const coach=$('#shiftCoach');if(coach&&!coach.closest('.member-coaching-details')){const d=node('details','member-coaching-details');d.append(node('summary','','Coaching & support'));support.before(d);d.append(coach)}
  if(coach){const details=coach.closest('.member-coaching-details'),enabled=$('#panel-today')?.hasAttribute('data-shift-coach-enabled');if(details){if(details.classList.contains('member-coaching-primary')!==enabled)details.classList.toggle('member-coaching-primary',enabled);if(enabled){if(!details.open)details.open=true;if(next&&next.nextElementSibling!==details)next.after(details)}else if(details.nextElementSibling!==support)support.before(details)}if(next&&next.classList.contains('member-next-secondary')!==enabled)next.classList.toggle('member-next-secondary',enabled)}
  for(const selector of ['#sstTodayContext','#sstTreatmentJourney','#sstFiveLoops','#myHealthPlanV2','#wholeManNextShift']){const n=$(selector);if(n&&!support.contains(n))support.append(n)}
 }
 function pageActions(){
  const page=document.body.dataset.memberPage;if(page==='dashboard')return;
  const main=$('main'),heading=main?.querySelector('h1');
  if(!main||!heading)return;
  const hero=heading.closest('.member-tool-hero,[data-member-hero]')||heading.closest('.member-fit-intro,.sf-hero')||heading.parentElement;
  dailyActions(hero.parentElement,hero);
 }
 function grub(){
  if(document.body.dataset.memberPage!=='grub')return;
  const heading=$('main h1');if(heading){text(heading,'Tonight, sorted.');const p=heading.nextElementSibling;if(p?.tagName==='P')text(p,'Good food. Less thinking.');}
  $('#grubSearch')?.setAttribute('aria-label','Find a recipe');
  const nav=$('.grub-v8-tabs');if(nav&&!nav.dataset.approvedOrder){nav.dataset.approvedOrder='true';for(const key of ['discover','saved','week','shoplist','fridge']){const b=nav.querySelector('[data-grub-tab="'+key+'"]');if(b)nav.append(b);}}
  const categories=all('[data-filter]');if(categories.length&&categories.every(b=>b.parentElement===categories[0].parentElement)&&!categories[0].parentElement.classList.contains('member-grub-categories'))categories[0].parentElement.classList.add('member-grub-categories');
  const recommendation=$('#grubRecommendation');
  // A genuine, account-backed suggestion is the first food action. Keep the
  // recommendation's handlers and eligibility/ingredient information intact.
  if(recommendation?.closest('.member-meal-suggestion')){const old=recommendation.closest('.member-meal-suggestion');old.before(recommendation);old.remove();}
  if(recommendation&&nav&&recommendation.nextElementSibling!==nav)nav.before(recommendation);
  const recipe=recommendation?.querySelector('article'),image=recipe?.querySelector('.grub-food-image'),detail=recipe?.querySelector('.grub-recipe-detail');
  const knownWrap=recipe?.querySelector('[data-food-pick="industrial-v3-wrap-classic-chicken"],[data-recipe-id="industrial-v3-wrap-classic-chicken"]');if(knownWrap){for(const chip of recipe.querySelectorAll('.grub-meta span'))if(chip.textContent.trim()==='8 min')text(chip,'8 min prep');for(const p of recipe.querySelectorAll('.grub-recipe-detail>p'))if(/^Preparation: 8 min .*Total ready-to-eat time: 8 min\.$/.test(p.textContent))text(p,'8 min prep; allow extra time if warming. Use cooked chicken and follow the method.');}
  if(recipe&&image&&recipe.firstElementChild!==image)recipe.prepend(image);
  if(recipe&&detail&&!recipe.querySelector('.member-meal-view')){const button=node('button','member-meal-view','Show me this meal');button.type='button';button.dataset.memberRecipeOpen='true';button.setAttribute('aria-expanded',String(detail.open));if(!detail.id)detail.id='memberSuggestedMealDetails';button.setAttribute('aria-controls',detail.id);button.onclick=()=>{detail.open=!detail.open;button.setAttribute('aria-expanded',String(detail.open));if(detail.open){for(let parent=detail.parentElement;parent&&parent!==recipe;parent=parent.parentElement)if(parent.tagName==='DETAILS'&&!parent.open)parent.open=true;const summary=detail.querySelector('summary');summary?.focus({preventScroll:true});summary?.scrollIntoView({block:'nearest',behavior:'instant'});}};const primary=recipe.querySelector('.grub-pick-ingredients')||recipe.querySelector('.grub-pick-primary');if(primary)primary.before(button);else recipe.append(button);detail.addEventListener('toggle',()=>{const expanded=String(detail.open);if(button.getAttribute('aria-expanded')!==expanded)button.setAttribute('aria-expanded',expanded);text(button,detail.open?'Hide meal details':'Show me this meal');});}
  const effort=recommendation?.querySelector(':scope>.grub-effort-picker');if(recipe&&effort&&recipe.nextElementSibling!==effort)recipe.after(effort);const view=recipe?.querySelector('.member-meal-view'),ingredients=recipe?.querySelector('.grub-pick-ingredients');if(view&&ingredients&&view.nextElementSibling!==ingredients)ingredients.before(view);
  const search=$('.grub-search'),results=$('#grubDiscoverResults');
  if(search&&results&&!search.closest('.member-grub-browse')){const parent=search.parentElement,panel=search.closest('[data-grub-panel]');if(panel&&panel===results.closest('[data-grub-panel]')&&parent&&parent.contains(results)){const browse=node('details','member-grub-browse');browse.append(node('summary','','Browse all recipes'));search.before(browse);browse.append(search);const resultsOwner=results.closest('[data-grub-panel]')===parent?results:results.closest('.grub-results')||results;if(!browse.contains(resultsOwner))browse.append(resultsOwner);}}
 }
 function fit(){
  const heading=document.body.dataset.memberPage==='fit'?$('main h1'):null;if(heading){text(heading,'A little movement.');const intro=heading.closest('.member-tool-hero,[data-member-hero]')||heading.parentElement;if(!intro.classList.contains('member-fit-intro'))intro.classList.add('member-fit-intro');const p=heading.nextElementSibling;if(p?.tagName==='P')text(p,'At your pace. On your terms.');}
  const main=document.body.dataset.memberPage==='fit'?$('main'):null;
  if(main){
   const session=main.querySelector('#fitOutput .sf-session'),source=session?.querySelector('.sf-exercise-art img');let suggestion=main.querySelector('.member-fit-suggestion');
   if(!session||session.classList.contains('active')||!source?.getAttribute('src')?.startsWith('/')){if(suggestion)suggestion.remove();}
   else if(!suggestion||suggestion._memberSource!==session){
    suggestion?.remove();suggestion=node('section','member-fit-suggestion');suggestion._memberSource=session;suggestion.setAttribute('aria-label','Your saved movement suggestion');
    const visual=node('figure'),img=source.cloneNode();img.loading='eager';img.decoding='async';visual.append(img);const caption=source.closest('figure')?.querySelector('figcaption');if(caption)visual.append(caption.cloneNode(true));
    const title=node('h2','',session.querySelector('.sf-session-head h3')?.textContent||'Your saved session'),copy=node('p','','Your saved session. Review it before you start.'),review=node('button','','See this session');review.type='button';
    review.onclick=()=>{const overview=session.querySelector('[data-exercise-overview]');if(session.dataset.exerciseOverview!=='true')overview?.click();session.scrollIntoView({block:'start',behavior:'instant'});const heading=session.querySelector('h3');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}};
    suggestion.append(visual,title,copy,review);const hero=main.querySelector('.member-fit-intro')?.closest('.member-tool-hero,[data-member-hero]')||main.querySelector('.member-fit-intro'),actions=hero?.nextElementSibling?.classList.contains('member-daily-actions')?hero.nextElementSibling:null;(actions||hero||main.firstElementChild)?.after(suggestion);
   }
  }

  if(document.body.dataset.memberPage==='fit'){const active=!!$('.sf-session.active:not([data-session-finished="true"])');if(document.body.dataset.memberFitActive!==String(active))document.body.dataset.memberFitActive=String(active);}
  const builder=$('.sf-builder');if(builder){builder.dataset.experienceReady='true';const detail=builder.closest('details');if(detail&&!detail.dataset.memberExperienceSetup)detail.dataset.memberExperienceSetup='true'}
  const limits=builder?.querySelector('.sf-limitations');if(limits&&!limits.closest('.member-fit-preferences')){const details=node('details','member-fit-preferences');details.append(node('summary','','Movement preferences & notes'));limits.before(details);details.append(limits);const notes=builder.querySelector('.sf-pref');if(notes)details.append(notes);}
  all('#fitOutput .sf-session').forEach(session=>{
   let guidance=session.querySelector('.member-session-guidance');if(!guidance){guidance=node('details','member-session-guidance');guidance.append(node('summary','','Session options & guidance'));session.append(guidance);for(const selector of ['.sf-coach','.sf-difficulty']){const section=session.querySelector(selector);if(section)guidance.append(section);}}
   const active=session.classList.contains('active');if(guidance.dataset.active!==String(active)){guidance.dataset.active=String(active);guidance.open=!active;}
   const cards=[...session.querySelectorAll('.sf-exercise')];if(!cards.length)return;
   const done=cards.filter(c=>c.dataset.completion==='done').length,skipped=cards.filter(c=>c.dataset.completion==='skipped').length,first=cards.find(c=>!['done','skipped'].includes(c.dataset.completion));
   let box=session.querySelector('.member-session-progress');if(!box){box=node('div','member-session-progress');const p=node('p'),progress=node('progress'),overview=node('button','','View exercise list'),pause=node('button','member-session-pause','Pause session');pause.type='button';pause.dataset.pauseSession='true';progress.setAttribute('aria-label','Saved session progress');overview.type='button';overview.dataset.exerciseOverview='toggle';overview.setAttribute('aria-expanded','false');box.append(p,progress,overview,pause);session.querySelector('.sf-session-head')?.after(box)}
   if(session.dataset.sessionFinished!==String(!first))session.dataset.sessionFinished=String(!first);box.querySelector('p').setAttribute('role','status');
   text(box.querySelector('p'),(first?'Exercise '+(cards.indexOf(first)+1)+' of '+cards.length:'Session finished')+' · '+done+' completed'+(skipped?' · '+skipped+' skipped':''));const progress=box.querySelector('progress');if(progress.max!==cards.length)progress.max=cards.length;if(progress.value!==done+skipped)progress.value=done+skipped;
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
  let chrome=$('#memberJourneyChrome');
  if(!chrome){chrome=node('div');chrome.id='memberJourneyChrome';const band=node('header');band.id='memberJourneyHeader';band.append(node('h1','','Your progress. In your hands.'),node('p','','Your readings. Your everyday wins.'));chrome.append(band);dailyActions(chrome,band);panels.parentElement.insertBefore(chrome,panels);}
  if(chrome.hidden===active)chrome.hidden=!active;
  let nav=$('#memberJourneyTabs');
  if(!nav){
   nav=node('nav');nav.id='memberJourneyTabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Your Journey');
   for(const [key,label]of [['journey','Progress'],['week','Week'],['log','Readings'],['felt','How I felt']]){
    const button=node('button','',label);button.type='button';button.dataset.journeyView=key;button.setAttribute('role','tab');button.setAttribute('aria-controls',key==='log'?'panel-journey':'panel-visualise');
    button.onclick=()=>{const oldURL=location.href,next=new URL(location.href);next.searchParams.set('journeyView',key);const panel=key==='log'?'journey':'visualise';$('.mp-tab[data-panel="'+panel+'"]')?.click();next.hash=panel;history.pushState(null,'',next.pathname+next.search+next.hash);dispatchEvent(new HashChangeEvent('hashchange',{oldURL,newURL:location.href}));journey();};nav.append(button);
   }
   panels.parentElement.insertBefore(nav,panels);
  }
  nav.hidden=!active;if(!active){delete document.body.dataset.memberJourneyView;all('.mp-panel').forEach(panel=>{const hidden=!panel.classList.contains('active');if(panel.hidden!==hidden)panel.hidden=hidden;});return;}
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
  if(!memberReady()){suspend();return;}if(document.body.dataset.memberExperienceUi!=='20261015')document.body.dataset.memberExperienceUi='20261015';
  if(document.body.dataset.accountDeleted==='1'){if(more?.open)more.close();return;}
  mountMore();today();grub();pageActions();fit();journey();
  all('a').filter(a=>/^Skip to (main )?content$/i.test(a.textContent.trim())).forEach((a,i)=>{if(!a.classList.contains('member-skip-link'))a.classList.add('member-skip-link');if(i>0&&!a.hidden)a.hidden=true});
  const guide=$('aside[aria-label="Food guide"]');if(guide&&!guide.closest('.member-food-guide')){const detail=node('details','member-food-guide');detail.append(node('summary','','Food guide & practical swaps'));$('main')?.append(detail);detail.append(guide)}

  const tool=document.body.dataset.appTool,hash=location.hash||'#today',page=document.body.dataset.memberPage;
  const name=page==='dashboard'?(tool&&tool!=='today'?({grub:'Grub',fit:'Fit','life-back':'Journey'}[tool]||'Today'):hash==='#today'?'Today':hash==='#journey'?'Journey':hash==='#visualise'?'Progress':hash==='#plans'?'My Plans':'Today'):({'life-back':'Journey','check-in':'Check-in',grub:'Grub',fit:'Fit',settings:'Settings',orders:'My Orders','ask-timber':'Ask Timber',saved:'Saved',plans:'My Plans'}[page]||'My Timber');
  const brand=$('#todayBrand>a>span');if(brand){let label=brand.querySelector('.member-section-name');if(!label){label=node('span','member-section-name');brand.append(label)}text(label,name)}
  if(more){const utilities=$('#memberMoreUtilities');all('#sstCookieSettings,#askTimberLaunch').forEach(n=>{moveUtility(n,utilities)});const accessibility=$('#a11yControls'),host=$('#memberAccessibility');moveUtility(accessibility,host)}
  all('#appBottomNav a').forEach(a=>{const u=new URL(a.href),key=u.pathname.split('/').pop(),selected=key==='dashboard'?(['#journey','#visualise'].includes(u.hash)?['Journey','Progress','My Plans'].includes(name):name==='Today'):key===name.toLowerCase();if(selected){if(a.getAttribute('aria-current')!=='page')a.setAttribute('aria-current','page')}else if(a.hasAttribute('aria-current'))a.removeAttribute('aria-current')});
  const target=location.hash&&document.getElementById(location.hash.slice(1));if(target){for(let p=target.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open)p.open=true}
 }
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;refresh()})}};
 function revealEditingControl(){
  if(!memberReady())return;
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
  if(!memberReady())return;
  const navToday=e.target.closest?.('#appBottomNav a');if(navToday&&document.body.dataset.memberPage==='dashboard'){const target=new URL(navToday.href);if(target.pathname==='/member/dashboard'&&target.hash==='#today'&&!target.searchParams.get('tool')){$('.mp-tab[data-panel="today"]')?.click();schedule();}}
  const trigger=e.target.closest?.('#appMore,[data-mt-more]');if(trigger&&more){e.preventDefault();returnFocus=trigger;if(!more.open)more.showModal();all('#appMore,[data-mt-more]').forEach(t=>t.setAttribute('aria-expanded','true'))}
  const toggle=e.target.closest?.('button[data-exercise-overview="toggle"]');if(toggle){const s=toggle.closest('.sf-session'),open=s.dataset.exerciseOverview!=='true';s.dataset.exerciseOverview=String(open);toggle.setAttribute('aria-expanded',String(open));text(toggle,open?'Return to current exercise':'View exercise list')}
  const pause=e.target.closest?.('[data-pause-session]');if(pause){const session=pause.closest('.sf-session');session.classList.remove('active');session.dataset.exerciseOverview='false';const overview=session.querySelector('[data-exercise-overview]');overview.setAttribute('aria-expanded','false');text(overview,'View exercise list');session.querySelector('[data-sf-start]')?.focus({preventScroll:true})}
  const rest=e.target.closest?.('[data-rest-seconds]');if(rest){const output=rest.nextElementSibling,seconds=Number(rest.dataset.restSeconds);if(rest.dataset.restUntil){delete rest.dataset.restUntil;text(rest,'Start rest · '+seconds+' sec');text(output,'');return}rest.dataset.restUntil=String(Date.now()+seconds*1000);text(rest,'Cancel rest');const tick=()=>{if(!rest.isConnected||!rest.dataset.restUntil)return false;const remaining=Math.max(0,Math.ceil((Number(rest.dataset.restUntil)-Date.now())/1000));text(output,remaining?Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'):'Rest finished');if(!remaining){delete rest.dataset.restUntil;text(rest,'Start rest · '+seconds+' sec');output.setAttribute('role','status');return false}return true};tick();const timer=setInterval(()=>{if(!tick())clearInterval(timer)},250)}
 });
 function boot(){refresh();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-completion','data-app-tool','data-member-session','class','hidden','aria-busy']})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 document.addEventListener('sst:today-rendered',schedule);addEventListener('hashchange',schedule);addEventListener('popstate',schedule);
 function clearWeek(){++weekLoadVersion;const entry=$('#memberJourneyEntry');if(entry?.dataset.view==='week'){entry.replaceChildren();delete entry.dataset.view;}}addEventListener('pagehide',clearWeek);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearWeek();else schedule();});
})();(function quickLogBrowser(makePayload, makeFlow) {
  "use strict";
  if (document.body.dataset.memberDesign !== "20261001" || window.SST_QUICK_LOG) return;
  const today5 = /* @__PURE__ */ __name(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date()), "today");
  let dialog, form, message, save, retry, returnLink, trigger, draft = null, openVersion = 0, restoring = false, previousWeightUnit = "", opening = false;
  const api = /* @__PURE__ */ __name((name) => {
    const fn = window.SST_API?.[name];
    if (typeof fn !== "function") throw new Error("My Timber is still loading. Please try again shortly.");
    return fn.bind(window.SST_API);
  }, "api");
  const flow = makeFlow({
    getMe: /* @__PURE__ */ __name(() => api("getMe")(), "getMe"),
    getConsents: /* @__PURE__ */ __name(() => api("getConsents")(), "getConsents"),
    getJourney: /* @__PURE__ */ __name(() => api("getMyJourney")(), "getJourney"),
    saveProgress: /* @__PURE__ */ __name((payload) => api("saveProgress")(payload), "saveProgress"),
    getSummary: /* @__PURE__ */ __name(() => api("getProgressSummary")(), "getSummary"),
    canPresent: /* @__PURE__ */ __name(() => !document.hidden, "canPresent"),
    ensureConsent: /* @__PURE__ */ __name(() => {
      if (typeof window.SST_HEALTH_CONSENT?.ensure !== "function") throw new Error("Health-tracking choices are still loading. Please try again shortly.");
      return window.SST_HEALTH_CONSENT.ensure();
    }, "ensureConsent"),
    getUnits: /* @__PURE__ */ __name(async () => {
      const response = await fetch("/v1/settings/units", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error("Saved units could not load.");
      return response.json();
    }, "getUnits"),
    onClear: /* @__PURE__ */ __name(() => {
      draft = null;
      document.getElementById("mtQuickLogSavedStatus")?.remove();
      if (form) form.reset();
      if (dialog?.open) dialog.close();
    }, "onClear")
  });
  const values = /* @__PURE__ */ __name(() => Object.fromEntries(new FormData(form)), "values");
  const capture = /* @__PURE__ */ __name(() => {
    if (form && flow.owner && !restoring && !flow.saved) draft = { owner: flow.owner, values: values() };
  }, "capture");
  const announce = /* @__PURE__ */ __name((value) => {
    message.textContent = value;
  }, "announce");
  const recovery = /* @__PURE__ */ __name((error2, opener = trigger) => {
    document.getElementById("mtQuickLogRecovery")?.remove();
    const notice = document.createElement("section");
    notice.id = "mtQuickLogRecovery";
    notice.setAttribute("role", "alert");
    const text10 = document.createElement("p");
    const signIn = error2.status === 401 || error2.code === "session_required";
    text10.textContent = signIn ? "Please sign in again before adding to your private log." : error2.message || "Log your day could not open. Please try again.";
    notice.append(text10);
    if (signIn) {
      const link2 = document.createElement("a");
      link2.href = "/member-login?returnTo=%2Fmember%2Fdashboard";
      link2.textContent = "Sign in to My Timber";
      notice.append(link2);
    } else {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Reopen Log your day";
      button.onclick = () => open(opener);
      notice.append(button);
    }
    const brand = document.getElementById("todayBrand");
    if (brand) brand.after(notice);
    else document.body.prepend(notice);
  }, "recovery");
  const savedStatus = /* @__PURE__ */ __name(() => {
    document.getElementById("mtQuickLogSavedStatus")?.remove();
    const todayPanel = document.getElementById("panel-today");
    if (!todayPanel) return;
    const notice = document.createElement("section");
    notice.id = "mtQuickLogSavedStatus";
    notice.setAttribute("role", "status");
    const text10 = document.createElement("p");
    text10.textContent = "Your log is saved.";
    const link2 = document.createElement("a");
    link2.href = "/member/dashboard#visualise";
    link2.textContent = "View Journey";
    link2.addEventListener("click", (event3) => {
      const tab = document.querySelector('.mp-tab[data-panel="visualise"]');
      if (tab) {
        event3.preventDefault();
        tab.click();
        if (location.hash !== "#visualise") location.hash = "#visualise";
      }
    });
    notice.append(text10, link2);
    todayPanel.prepend(notice);
  }, "savedStatus");
  const showWeight = /* @__PURE__ */ __name(() => {
    form.querySelector("[data-mtql-stone]").hidden = form.elements.weightUnit.value !== "stone_lb";
    form.querySelector("[data-mtql-single]").hidden = form.elements.weightUnit.value === "stone_lb";
    form.querySelector("[data-mtql-weight-label]").textContent = form.elements.weightUnit.value === "lb" ? "Weight (lb)" : form.elements.weightUnit.value === "kg" ? "Weight (kg)" : "Weight";
  }, "showWeight");
  const setBusy = /* @__PURE__ */ __name((busy2) => {
    form.setAttribute("aria-busy", String(busy2));
    for (const control of form.querySelectorAll("input,select,textarea,button")) control.disabled = busy2;
    dialog.querySelector("[data-mtql-close]").disabled = busy2;
    if (!busy2 && (flow.saved || flow.unconfirmed)) {
      save.disabled = flow.unconfirmed;
      form.querySelectorAll("input,select,textarea").forEach((control) => {
        control.disabled = true;
      });
    }
  }, "setBusy");
  const returnToday = /* @__PURE__ */ __name(() => {
    if (flow.busy) return;
    if (flow.saved) {
      draft = null;
      flow.startAnother();
      form.reset();
    } else capture();
    dialog.close();
    if (/^\/member\/dashboard(?:\.html)?\/?$/.test(location.pathname)) {
      document.querySelector('.mp-tab[data-panel="today"]')?.click();
      if (location.hash !== "#today") location.hash = "#today";
    } else location.assign("/member/dashboard#today");
  }, "returnToday");
  const build = /* @__PURE__ */ __name(() => {
    if (dialog) return;
    dialog = document.createElement("dialog");
    dialog.id = "mtQuickLog";
    dialog.setAttribute("aria-labelledby", "mtQuickLogTitle");
    dialog.innerHTML = '<div class="mtql-top"><strong>MY TIMBER</strong><button type="button" data-mtql-close>Back</button></div><header class="mtql-heading"><h2 id="mtQuickLogTitle">Log your day.</h2><p>As much or as little as you like.<br>One reading or a note is enough.</p></header><form novalidate autocomplete="off"><label>Date<input name="recordedOn" type="date" required></label><section class="mtql-weight" aria-label="Optional weight"><div class="mtql-weight-top"><strong>Weight <span class="mtql-optional">(optional)</span></strong><label>Units<select name="weightUnit"><option value="">Choose units</option><option value="kg">kg</option><option value="stone_lb">st / lb</option><option value="lb">lb</option></select></label></div><label data-mtql-single><span data-mtql-weight-label>Weight (kg)</span><input name="weight" type="number" inputmode="decimal" step="any" min="0" autocomplete="off"></label><div class="mtql-pair" data-mtql-stone hidden><label>Stone<input name="weightStone" type="number" inputmode="numeric" step="1" min="0" autocomplete="off"></label><label>Pounds<input name="weightPounds" type="number" inputmode="decimal" step="any" min="0" max="13.999999" autocomplete="off"></label></div></section><details><summary>Add another reading</summary><div class="mtql-metrics">' + [["waistCm", "Waist (cm)", "any"], ["systolic", "Blood pressure \u2014 top", "1"], ["diastolic", "Blood pressure \u2014 bottom", "1"], ["restingHr", "Resting pulse (bpm)", "1"], ["steps", "Steps", "1"], ["proteinG", "Protein (g)", "any"], ["sleepHours", "Sleep (hours)", "any"]].map(([name, label2, step]) => "<label>" + label2 + '<input name="' + name + '" type="number" inputmode="' + (step === "1" ? "numeric" : "decimal") + '" min="0" step="' + step + '"' + (name === "sleepHours" ? ' max="24"' : "") + ' autocomplete="off"></label>').join("") + '</div></details><details><summary>Add a note</summary><label>Anything you want to remember<textarea name="notes" maxlength="4000" rows="3" autocomplete="off"></textarea></label></details><p class="mtql-status" role="status" aria-live="polite" tabindex="-1"></p><div class="mtql-actions"><button class="mtql-primary" type="submit">Save &amp; back to My Timber</button><button type="button" class="mtql-secondary" data-mtql-cancel>Back without saving</button><button type="button" data-mtql-checked hidden>I checked \u2014 allow another save</button><a class="mtql-link" href="/member/dashboard#visualise" data-mtql-records hidden>Check saved records</a></div><p class="mtql-privacy">Private to your signed-in account. This is not clinical monitoring.</p></form>';
    document.body.append(dialog);
    form = dialog.querySelector("form");
    message = dialog.querySelector(".mtql-status");
    save = form.querySelector('[type="submit"]');
    retry = form.querySelector("[data-mtql-checked]");
    returnLink = form.querySelector("[data-mtql-records]");
    dialog.querySelector("[data-mtql-close]").onclick = () => {
      if (!flow.busy) {
        capture();
        dialog.close();
      }
    };
    form.querySelector("[data-mtql-cancel]").onclick = () => {
      if (flow.saved) returnToday();
      else {
        capture();
        dialog.close();
      }
    };
    dialog.addEventListener("cancel", (event3) => {
      if (flow.busy) event3.preventDefault();
      else capture();
    });
    dialog.addEventListener("keydown", (event3) => {
      if (event3.key !== "Tab") return;
      const controls = [...dialog.querySelectorAll('a[href],button,input:not([type="hidden"]),select,textarea,summary,[tabindex]:not([tabindex="-1"])')].filter((control) => {
        if (control.disabled || !control.getClientRects().length || getComputedStyle(control).visibility === "hidden") return false;
        const closed = control.closest("details:not([open])");
        return !closed || control.tagName === "SUMMARY" && control.parentElement === closed;
      });
      event3.preventDefault();
      if (!controls.length) {
        dialog.focus();
        return;
      }
      const index = controls.indexOf(document.activeElement), step = event3.shiftKey ? -1 : 1;
      controls[index < 0 ? event3.shiftKey ? controls.length - 1 : 0 : (index + step + controls.length) % controls.length].focus();
    });
    dialog.addEventListener("close", () => {
      if (!document.hidden && trigger?.isConnected) trigger.focus({ preventScroll: true });
    });
    form.addEventListener("input", capture);
    form.addEventListener("change", capture);
    form.elements.weightUnit.addEventListener("change", () => {
      const next = form.elements.weightUnit.value, prior = previousWeightUnit;
      if (!next && prior) {
        form.elements.weightUnit.value = prior;
        announce("Choose kg, stone and pounds, or pounds.");
        return;
      }
      if (prior && next && next !== prior) {
        const sample = { recordedOn: today5(), weightUnit: prior, weight: form.elements.weight.value, weightStone: form.elements.weightStone.value, weightPounds: form.elements.weightPounds.value };
        const hasWeight = prior === "stone_lb" ? sample.weightStone !== "" || sample.weightPounds !== "" : sample.weight !== "";
        if (hasWeight) {
          try {
            const kg = makePayload(sample, today5()).weightKg;
            form.elements.weight.value = form.elements.weightStone.value = form.elements.weightPounds.value = "";
            if (next === "stone_lb") {
              const total = kg / 0.45359237;
              let stone = Math.floor(total / 14), pounds = Math.round((total - stone * 14) * 1e3) / 1e3;
              if (pounds >= 14) {
                ++stone;
                pounds = 0;
              }
              form.elements.weightStone.value = String(stone);
              form.elements.weightPounds.value = String(pounds);
            } else form.elements.weight.value = String(Math.round((next === "lb" ? kg / 0.45359237 : kg) * 1e3) / 1e3);
          } catch (error2) {
            form.elements.weightUnit.value = prior;
            announce("Check your existing weight before changing its units. " + error2.message);
            showWeight();
            return;
          }
        } else form.elements.weight.value = form.elements.weightStone.value = form.elements.weightPounds.value = "";
      }
      previousWeightUnit = next;
      showWeight();
      capture();
    });
    retry.onclick = () => {
      flow.allowCheckedRetry();
      retry.hidden = returnLink.hidden = true;
      setBusy(false);
      announce("Your draft is ready. Save only if you have checked that this entry is missing.");
    };
    form.addEventListener("submit", async (event3) => {
      event3.preventDefault();
      if (flow.busy || flow.unconfirmed) return;
      let payload;
      try {
        if (!flow.saved) payload = makePayload(values(), today5());
      } catch (error2) {
        announce(error2.message);
        message.focus();
        return;
      }
      capture();
      setBusy(true);
      announce(flow.saved ? "Refreshing your saved summary\u2026" : "Saving your private log\u2026");
      try {
        const result2 = await flow.save(payload);
        if (document.hidden) return;
        if (!dialog.open) return;
        if (!result2.refreshed) {
          announce(result2.message);
          save.textContent = "Retry summary";
          form.querySelector("[data-mtql-cancel]").textContent = "Back to My Timber";
          return;
        }
        document.dispatchEvent(new CustomEvent("sst:progress-saved", { detail: { recordedOn: result2.recordedOn, summaryRefreshed: true, progress: result2.progress } }));
        document.dispatchEvent(new CustomEvent("sst:treatment-refresh"));
        document.dispatchEvent(new CustomEvent("sst:refresh-today"));
        announce("Your log is saved.");
        savedStatus();
        draft = null;
        setBusy(false);
        returnToday();
      } catch (error2) {
        if (document.hidden) return;
        if (!dialog.open) {
          recovery(error2);
          return;
        }
        if (flow.unconfirmed) {
          announce("We could not confirm whether that saved. Check your saved records before saving it again. Your draft is kept here.");
          retry.hidden = returnLink.hidden = false;
        } else announce(error2.status === 401 || error2.code === "session_required" ? "Your sign-in expired. Sign in again before saving." : error2.message || "Your log could not save. Your draft is still here.");
        message.focus();
      } finally {
        if (dialog.open) setBusy(false);
      }
    });
  }, "build");
  async function open(opener) {
    try {
      if (window.parent !== window && parent.location.origin === location.origin && parent.SST_QUICK_LOG) {
        parent.SST_QUICK_LOG.open(parent.document.activeElement);
        return;
      }
    } catch {
    }
    if (flow.busy || opening) return;
    if (dialog?.open) {
      dialog.focus();
      return;
    }
    opening = true;
    build();
    document.getElementById("mtQuickLogSavedStatus")?.remove();
    trigger = opener || document.activeElement;
    const version = ++openVersion;
    try {
      const result2 = await flow.open();
      if (version !== openVersion || document.hidden) return;
      restoring = true;
      form.reset();
      form.elements.recordedOn.value = today5();
      form.elements.recordedOn.max = today5();
      if (draft?.owner === result2.owner) {
        for (const [name, value] of Object.entries(draft.values)) if (form.elements[name]) form.elements[name].value = value;
      } else form.elements.weightUnit.value = result2.units || "";
      previousWeightUnit = form.elements.weightUnit.value;
      restoring = false;
      showWeight();
      retry.hidden = returnLink.hidden = !flow.unconfirmed;
      save.textContent = flow.saved ? "Retry summary" : "Save & back to My Timber";
      form.querySelector("[data-mtql-cancel]").textContent = flow.saved ? "Back to My Timber" : "Back without saving";
      announce(flow.saved ? "Your log is already saved. Retry only the summary." : flow.unconfirmed ? "The last save could not be confirmed. Check your saved records before trying again." : result2.units ? "" : "Saved units could not load. Choose units if adding weight; you can still add another reading or a note.");
      document.getElementById("mtQuickLogRecovery")?.remove();
      setBusy(false);
      dialog.showModal();
      form.elements.recordedOn.focus();
    } catch (error2) {
      restoring = false;
      if (version === openVersion && !document.hidden) recovery(error2, opener);
    } finally {
      opening = false;
    }
  }
  __name(open, "open");
  window.SST_QUICK_LOG = { open, clear: /* @__PURE__ */ __name(() => {
    ++openVersion;
    flow.clear();
  }, "clear") };
  document.addEventListener("click", (event3) => {
    const opener = event3.target.closest?.("[data-mt-quick-log]");
    if (opener) {
      event3.preventDefault();
      open(opener);
    }
    if (event3.target.closest?.("[data-member-logout],.member-nav-logout")) window.SST_QUICK_LOG.clear();
  });
  document.addEventListener("sst:quick-log-open", () => open(document.activeElement));
  addEventListener("pagehide", () => {
    ++openVersion;
    flow.clear();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      ++openVersion;
      document.getElementById("mtQuickLogSavedStatus")?.remove();
      capture();
      if (dialog?.open) dialog.close();
      if (form) form.reset();
    }
  });
  new MutationObserver(() => {
    if (document.body.dataset.accountDeleted === "1" || ["signed-out", "error", "pending"].includes(document.body.dataset.memberSession)) window.SST_QUICK_LOG.clear();
  }).observe(document.body, { attributes: true, attributeFilter: ["data-member-session", "data-account-deleted"] });
})(function quickLogPayload(values, today5) {
  const fail11 = /* @__PURE__ */ __name((message) => {
    throw new Error(message);
  }, "fail");
  const date10 = String(values.recordedOn || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date10) || !Number.isFinite(Date.parse(date10 + "T12:00:00Z")) || (/* @__PURE__ */ new Date(date10 + "T12:00:00Z")).toISOString().slice(0, 10) !== date10 || date10 > today5) fail11("Choose today or a valid earlier date.");
  const body2 = { recordedOn: date10, source: "my_timber_quick_log" };
  const optional = /* @__PURE__ */ __name((name, label2, { integer: integer3 = false, positive = false, max = Infinity } = {}) => {
    const raw = String(values[name] ?? "").trim();
    if (!raw) return void 0;
    if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw)) fail11("Check " + label2 + ". Use a number.");
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || positive && value === 0 || value > max || integer3 && !Number.isInteger(value)) fail11("Check " + label2 + (integer3 ? ". Use a whole number." : "."));
    return value;
  }, "optional");
  let weight2;
  if (values.weightUnit === "stone_lb") {
    const stone = optional("weightStone", "stone", { integer: true });
    const pounds = optional("weightPounds", "pounds", { max: 13.999999 });
    if (stone !== void 0 || pounds !== void 0) weight2 = ((stone ?? 0) * 14 + (pounds ?? 0)) * 0.45359237;
  } else {
    const value = optional("weight", "weight", { positive: true });
    if (value !== void 0) {
      if (!["kg", "lb"].includes(values.weightUnit)) fail11("Choose the units for this weight.");
      weight2 = values.weightUnit === "lb" ? value * 0.45359237 : value;
    }
  }
  if (weight2 !== void 0) {
    weight2 = Math.round(weight2 * 1e3) / 1e3;
    if (weight2 < 20 || weight2 > 400) fail11("Check the weight and units. Supported weights are 20\u2013400 kg or the equivalent.");
    body2.weightKg = weight2;
  }
  for (const [name, label2, options] of [
    ["waistCm", "waist measurement", { positive: true }],
    ["systolic", "top blood-pressure number", { integer: true, positive: true }],
    ["diastolic", "bottom blood-pressure number", { integer: true, positive: true }],
    ["restingHr", "resting pulse", { integer: true, positive: true }],
    ["steps", "steps", { integer: true }],
    ["proteinG", "protein", {}],
    ["sleepHours", "sleep hours", { max: 24 }]
  ]) {
    const value = optional(name, label2, options);
    if (value !== void 0) body2[name] = value;
  }
  const notes = String(values.notes ?? "").trim();
  if (notes.length > 4e3) fail11("Keep your note to 4,000 characters or fewer.");
  if (notes) body2.notes = notes;
  if (Object.keys(body2).length === 2) fail11("Add one reading or a note. Everything else can stay blank.");
  return body2;
},function createQuickLogFlow(services) {
  let owner = null, generation = 0, busy2 = false, receipt = null, uncertain = false, opening = null;
  const error2 = /* @__PURE__ */ __name((code, message) => Object.assign(new Error(message), { code }), "error");
  const currentContext = /* @__PURE__ */ __name((expected, version) => owner === expected && generation === version, "currentContext");
  const staleOutcome = /* @__PURE__ */ __name(() => error2("stale_operation", "This save belongs to an earlier page or account. Its outcome cannot be confirmed here. Check the original account before retrying."), "staleOutcome");
  const requireContext = /* @__PURE__ */ __name((expected, version) => {
    if (!currentContext(expected, version)) throw staleOutcome();
  }, "requireContext");
  const identity3 = /* @__PURE__ */ __name(async () => {
    const me = await services.getMe();
    const id = me?.user?.id ?? me?.id;
    if (id === void 0 || id === null || String(id) === "") throw error2("session_required", "Sign in again before saving your private log.");
    return String(id);
  }, "identity");
  const clear = /* @__PURE__ */ __name(() => {
    owner = null;
    ++generation;
    receipt = null;
    uncertain = false;
    services.onClear?.();
  }, "clear");
  const sameOwner = /* @__PURE__ */ __name(async (expected, version) => {
    if (version !== generation) throw error2("stale_operation", "Reopen Log your day to check your current account.");
    const current2 = await identity3();
    if (version !== generation) throw error2("stale_operation", "Reopen Log your day to check your current account.");
    if (current2 !== expected || owner !== expected) {
      clear();
      throw error2("account_changed", "Your account changed. Reopen Log your day before adding anything.");
    }
  }, "sameOwner");
  const checkTracking = /* @__PURE__ */ __name(async () => {
    const result2 = await services.getConsents();
    if (!Array.isArray(result2?.consents)) throw error2("health_consent_unavailable", "Your tracking choice could not be checked. Nothing was saved.");
    const choices2 = result2.consents.filter((row) => row?.consent_type === "my_shift_health_tracking");
    if (choices2.some((row) => !Number.isSafeInteger(Number(row.id)) || Number(row.id) < 1)) throw error2("health_consent_unavailable", "Your tracking choice could not be checked. Nothing was saved.");
    const latest = choices2.sort((a, b) => Number(b.id) - Number(a.id))[0];
    if (Number(latest?.granted) !== 1) throw error2("health_consent_required", "Nothing saved. Review your current health-tracking choice in Settings.");
    const resultJourney = await services.getJourney();
    if (!resultJourney?.journey || typeof resultJourney.journey !== "object") throw error2("health_consent_unavailable", "Your tracking settings could not be checked. Nothing was saved.");
    if (resultJourney.journey.setup?.paused === true) throw error2("health_tracking_paused", "Nothing saved. Health tracking is paused. You can review this in Settings.");
  }, "checkTracking");
  const requireTracking = /* @__PURE__ */ __name(async () => {
    if (typeof services.ensureConsent !== "function" || !await services.ensureConsent()) throw error2("health_consent_required", "Nothing saved. Optional health tracking is your choice.");
    await checkTracking();
  }, "requireTracking");
  const refresh = /* @__PURE__ */ __name(async () => {
    if (!receipt) throw error2("no_save_receipt", "There is no confirmed save to refresh.");
    const expected = owner, version = generation, savedReceipt = receipt;
    try {
      if (services.canPresent?.() === false) throw error2("summary_deferred", "Your log is saved. Reopen My Timber to refresh it.");
      await sameOwner(expected, version);
      await checkTracking();
      requireContext(expected, version);
      const summary2 = await services.getSummary();
      requireContext(expected, version);
      if (services.canPresent?.() === false) throw error2("summary_deferred", "Your log is saved. Reopen My Timber to refresh it.");
      await checkTracking();
      await sameOwner(expected, version);
      const progress = summary2?.progress ?? summary2;
      if (!progress || !["empty", "ready"].includes(progress.state) || !Array.isArray(progress.metrics)) throw error2("summary_unavailable", "The updated summary could not be checked.");
      return { saved: true, refreshed: true, owner: expected, recordedOn: savedReceipt.recordedOn, progress };
    } catch (cause) {
      if (!currentContext(expected, version)) {
        if (cause.code === "account_changed") throw cause;
        throw staleOutcome();
      }
      if (cause.code === "stale_operation") throw cause;
      if (cause.code === "account_changed" || cause.status === 401 || cause.code === "session_required") {
        clear();
        throw cause;
      }
      return { saved: true, refreshed: false, recordedOn: savedReceipt.recordedOn, message: "Your log is saved. The updated summary could not load. Retry the summary or return to My Timber; this will not save the log again." };
    }
  }, "refresh");
  return {
    get owner() {
      return owner;
    },
    get busy() {
      return busy2;
    },
    get saved() {
      return !!receipt;
    },
    get unconfirmed() {
      return uncertain;
    },
    clear,
    open() {
      if (opening) return opening;
      const version = ++generation;
      const pending = (async () => {
        const id = await identity3();
        if (version !== generation) throw error2("stale_operation", "Reopen Log your day to check your current account.");
        if (owner && owner !== id) {
          receipt = null;
          uncertain = false;
          services.onClear?.();
        }
        owner = id;
        let units = null;
        try {
          const result2 = await services.getUnits();
          if (["kg", "stone_lb", "lb"].includes(result2?.units?.weight)) units = result2.units.weight;
        } catch {
        }
        await sameOwner(id, version);
        return { owner: id, units };
      })();
      opening = pending;
      pending.finally(() => {
        if (opening === pending) opening = null;
      }).catch(() => {
      });
      return pending;
    },
    async save(payload) {
      if (busy2) throw error2("save_in_progress", "Your save is already in progress.");
      if (!owner) throw error2("session_required", "Reopen Log your day to check your sign-in.");
      if (receipt) {
        busy2 = true;
        try {
          return await refresh();
        } finally {
          busy2 = false;
        }
      }
      if (uncertain) throw error2("save_unconfirmed", "Check your saved records before trying the save again.");
      busy2 = true;
      const expected = owner, version = generation;
      let started = false;
      try {
        await sameOwner(expected, version);
        await requireTracking();
        await sameOwner(expected, version);
        started = true;
        const result2 = await services.saveProgress(payload);
        requireContext(expected, version);
        if (result2?.ok !== true) throw error2("save_unconfirmed", "The server did not confirm whether your log saved.");
        receipt = { recordedOn: payload.recordedOn };
        return await refresh();
      } catch (cause) {
        if (!currentContext(expected, version)) {
          if (cause.code === "account_changed") throw cause;
          throw staleOutcome();
        }
        if (cause.code === "account_changed" || cause.status === 401 || cause.code === "session_required") {
          clear();
          throw cause;
        }
        if (started && !receipt && ![400, 403, 409, 422, 429].includes(cause.status)) uncertain = true;
        throw cause;
      } finally {
        busy2 = false;
      }
    },
    allowCheckedRetry() {
      if (!busy2 && uncertain) uncertain = false;
    },
    startAnother() {
      if (!busy2) {
        receipt = null;
        uncertain = false;
      }
    }
  };
});;(function installMemberImageViewer() {
  if (window.__sstMemberImageViewer) return;
  window.__sstMemberImageViewer = true;
  const selector = 'img.sf-approved-exercise-image,.grub-food-image img,img[src^="/assets/member-experience/food/"]';
  const style = document.createElement('style');
  style.textContent = `
button.sst-image-open{display:block!important;position:relative!important;width:100%!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:inherit!important;background:transparent!important;cursor:zoom-in!important;line-height:normal!important;box-shadow:none!important}
button.sst-image-open:focus-visible{outline:3px solid #707762!important;outline-offset:3px!important}
.sst-image-hint{position:absolute;bottom:2px;right:2px;background:#050505;color:#E7E3DA;border-radius:4px;padding:2px 4px;font:10px/1.2 system-ui;pointer-events:none}
dialog.sst-image-viewer{box-sizing:border-box!important;position:fixed!important;inset:0!important;margin:auto!important;padding:16px!important;width:calc(100vw - 16px)!important;max-width:1024px!important;height:min(88dvh,900px)!important;max-height:calc(100dvh - 32px)!important;border:1px solid #707762!important;border-radius:16px!important;background:#E7E3DA!important;color:#050505!important;overflow:hidden!important;box-shadow:0 12px 60px #0008!important}
dialog.sst-image-viewer[open]{display:flex!important;flex-direction:column!important;gap:12px!important}
dialog.sst-image-viewer::backdrop{background:#000c}
.sst-image-viewer header{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;flex:none!important}
.sst-image-viewer h2{margin:0!important;font:700 18px/1.3 system-ui!important;overflow-wrap:anywhere!important}
.sst-image-viewer button:not(.sst-image-open){font:600 16px/1.2 system-ui!important;background:#050505!important;color:#E7E3DA!important;border:0!important;border-radius:8px!important;padding:12px 16px!important;min-height:44px!important;cursor:pointer!important;flex:none!important}
.sst-image-stage{flex:1!important;min-height:0!important;overflow:auto!important;overscroll-behavior:contain;touch-action:pan-x pan-y pinch-zoom;background:#fff;border-radius:8px}
.sst-image-stage img{display:block!important;max-width:none!important;max-height:none!important;height:auto!important;object-fit:contain!important;margin:0!important;cursor:zoom-in}
.sst-image-viewer .sst-image-tools{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:12px!important;flex:none!important;margin:0!important;padding:0!important;background:transparent!important}
.sst-image-viewer p{margin:0!important;font:14px/1.4 system-ui!important}
`;
  document.head.append(style);
  let viewer, image, zoomButton, opener, zoom = 1, fit = false;
  function sizeImage() {
    if (!viewer?.open) return;
    image.style.width = image.parentElement.clientWidth * zoom + 'px';
    zoomButton.textContent = zoom === 1 ? 'Zoom in' : 'Zoom out';
    image.style.cursor = zoom === 1 ? 'zoom-in' : 'zoom-out';
  }
  function close() { if (viewer?.open) viewer.close(); }
  function makeViewer() {
    viewer = document.createElement('dialog');
    viewer.className = 'sst-image-viewer';
    viewer.setAttribute('aria-labelledby', 'sst-image-viewer-title');
    viewer.innerHTML = '<header><h2 id="sst-image-viewer-title"></h2><button type="button" data-image-close aria-label="Close enlarged image">Close</button></header><div class="sst-image-stage"><img alt=""></div><div class="sst-image-tools"><button type="button" data-image-zoom>Zoom in</button><p>Zoom in, then swipe across to see the detail.</p></div>';
    document.body.append(viewer);
    image = viewer.querySelector('img');
    zoomButton = viewer.querySelector('[data-image-zoom]');
    viewer.querySelector('[data-image-close]').onclick = close;
    zoomButton.onclick = image.onclick = () => { zoom = zoom === 1 ? (fit ? 3 : 2) : 1; sizeImage(); };
    viewer.addEventListener('click', event => {
      if (event.target !== viewer) return;
      const r = viewer.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
    });
    viewer.addEventListener('close', () => { if (opener?.isConnected) opener.focus({preventScroll:true}); });
    image.addEventListener('error', () => { viewer.querySelector('.sst-image-tools p').textContent = 'Image could not load. Close and try again.'; });
    window.addEventListener('resize', sizeImage);
    window.addEventListener('hashchange', close);
  }
  function open(button) {
    const thumbnail = button.querySelector('img');
    if (!thumbnail) return;
    if (!viewer) makeViewer();
    opener = button; zoom = 1; fit = thumbnail.matches('.sf-approved-exercise-image');
    const card = button.closest('.sf-exercise,.mp-meal,.grub-recipe,.grub-meal-card,article');
    viewer.querySelector('h2').textContent = card?.querySelector('h4,h3,h2')?.textContent || thumbnail.alt || (fit ? 'Movement illustration' : 'Recipe illustration');
    viewer.querySelector('.sst-image-tools p').textContent = fit ? 'Zoom in, then swipe across the movement sequence.' : 'Zoom in, then swipe to see the detail. Portions are illustrative.';
    const sources = (thumbnail.getAttribute('srcset') || '').split(',').map(part => part.trim().split(/\s+/)).filter(part => part[0] && /^\d+w$/.test(part[1] || '')).sort((a,b) => parseInt(b[1]) - parseInt(a[1]));
    image.src = sources[0]?.[0] || thumbnail.src;
    image.alt = thumbnail.alt;
    viewer.showModal(); sizeImage();
    viewer.querySelector('[data-image-close]').focus();
  }
  function enhance(root) {
    const images = root.matches?.(selector) ? [root] : [...(root.querySelectorAll?.(selector) || [])];
    for (const img of images) {
      if (img.closest('.sst-image-open,.sst-image-viewer,a,button')) continue;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'sst-image-open';
      button.setAttribute('aria-label', 'Enlarge ' + (img.alt || 'illustration'));
      button.title = 'Tap to enlarge';
      img.before(button); button.append(img);
      const hint = document.createElement('span'); hint.className = 'sst-image-hint'; hint.textContent = 'Enlarge'; hint.setAttribute('aria-hidden','true'); button.append(hint);
    }
  }
  enhance(document);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') enhance(record.target);
      else for (const node of record.addedNodes) if (node.nodeType === 1) enhance(node);
    }
  }).observe(document.body, {childList:true,subtree:true,attributes:true,attributeFilter:['src','class']});
  document.addEventListener('click', event => {
    const button = event.target.closest?.('button.sst-image-open');
    if (!button) return;
    event.preventDefault(); event.stopImmediatePropagation(); open(button);
  }, true);
})();
