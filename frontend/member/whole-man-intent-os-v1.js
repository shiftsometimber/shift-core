// SHIFT Whole-Man Intent OS v1 — Sort -> one My Next Shift. No product wall.
(function(){
  'use strict';
  if(!/^\/member\/dashboard(?:\.html)?$/.test(location.pathname))return;

  const SORTS=[
    ['weight','My weight'],
    ['energy','My energy'],
    ['health','My health'],
    ['sleep','My sleep'],
    ['sex_confidence','My sex life / confidence'],
    ['movement','My movement / fitness'],
    ['hair','My hair'],
    ['head_stress','My head / stress'],
    ['drinking_smoking','My drinking / smoking'],
    ['mot','Not sure — give me an MOT'],
    ['other','Something else'],
    ['doing_alright','I’m doing alright — just keep me on track']
  ];
  const HEALTH_INTERESTS={
    'health-mot':['SHIFT Health MOT','mot'],
    'testosterone-energy':['Testosterone & Energy','energy'],
    'blood-pressure-monitor':['Blood pressure','health'],
    'digital-scales':['Weight tracking','weight'],
    'resistance-bands':['Strength & movement','movement'],
    'shift-measure':['Waist tracking','health'],
    'erectile-dysfunction':['Erection & confidence','sex_confidence'],
    'hair-loss':['Hair health','hair'],
    'stop-smoking':['Stop smoking','drinking_smoking'],
    'sleep-apnoea':['Sleep & apnoea','sleep']
  };
  const DAY=86400000;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nowIso=()=>new Date().toISOString();
  const track=(eventName,properties={})=>window.SST_API?.trackEvent?.({event_name:eventName,surface:'my_timber_today',properties}).catch(()=>null);
  let cache=null;

  function styles(){
    if(document.querySelector('[data-whole-man-intent-css]'))return;
    const s=document.createElement('style');s.dataset.wholeManIntentCss='v1';s.textContent=`
      .wm-next{margin:0 0 18px;padding:20px;border:1px solid #707762;border-radius:20px;background:#e7e3da;color:#050505}.wm-next small,.wm-sort-dialog small{font-size:12px;font-weight:900;letter-spacing:.1em}.wm-next h2{margin:6px 0 8px;font-size:clamp(24px,4vw,34px);line-height:1.05}.wm-next p{margin:0 0 14px;line-height:1.45}.wm-health-plan{margin-top:16px;padding-top:16px;border-top:1px solid rgba(5,5,5,.25)}.wm-health-plan h3{margin:5px 0 10px;font-size:20px}.wm-plan-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.wm-plan-item{padding:11px;border:1px solid rgba(5,5,5,.22);border-radius:12px;background:rgba(255,255,255,.22)}.wm-plan-item strong{display:block;margin-bottom:4px}.wm-plan-item span{font-size:13px;line-height:1.35}.wm-plan-note{margin:10px 0 0!important;font-size:12px;color:#454b40}.wm-plan-route{display:inline-flex;align-items:center;gap:6px;margin-top:7px;padding:5px 8px;border:1px solid rgba(5,5,5,.24);border-radius:999px;font-size:11px;font-weight:900;letter-spacing:.04em}.wm-plan-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.wm-plan-history{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.wm-plan-history button{min-height:36px!important;padding:7px 10px!important;font-size:12px}.wm-plan-feedback{margin-top:10px;padding:10px 12px;border-left:3px solid #707762;background:rgba(255,255,255,.25);font-size:13px}.wm-plan-feedback[hidden]{display:none}.wm-plan-saved{margin-top:12px;padding:12px;border:1px solid rgba(5,5,5,.2);border-radius:12px}.wm-plan-saved strong{display:block;margin-bottom:7px}.wm-plan-saved-list{display:flex;gap:7px;flex-wrap:wrap}.wm-plan-saved a,.wm-plan-saved button{min-height:36px!important;padding:7px 10px!important;font-size:12px}.wm-next-actions{display:flex;gap:8px;flex-wrap:wrap}.wm-next a,.wm-next button,.wm-sort-dialog button{min-height:44px;padding:10px 14px;border:1px solid #050505;border-radius:999px;background:#050505;color:#e7e3da;font:inherit;font-weight:900;text-decoration:none}.wm-next .secondary,.wm-sort-dialog .secondary{background:transparent;color:#050505}.wm-checkin{margin-top:14px;padding-top:14px;border-top:1px solid rgba(5,5,5,.25);display:flex;justify-content:space-between;gap:10px;align-items:center}.wm-checkin span{font-size:13px}.wm-dialog-wrap{position:fixed;inset:0;z-index:9999;display:grid;place-items:end center}.wm-dialog-scrim{position:absolute;inset:0;border:0!important;border-radius:0!important;background:rgba(5,5,5,.78)!important}.wm-sort-dialog{position:relative;width:min(760px,100%);max-height:88vh;overflow:auto;padding:22px max(16px,4vw) calc(24px + env(safe-area-inset-bottom));border:1px solid #707762;border-radius:24px 24px 0 0;background:#e7e3da;color:#050505;box-shadow:0 -18px 50px rgba(0,0,0,.35)}.wm-sort-dialog header{display:flex;justify-content:space-between;gap:16px;align-items:start}.wm-sort-dialog h2{margin:5px 0 8px;font-size:clamp(28px,7vw,46px);line-height:1}.wm-sort-dialog header button{min-width:44px;padding:8px}.wm-sort-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:18px 0}.wm-sort-grid button{text-align:left;border-radius:14px;background:#151715;color:#e7e3da}.wm-sort-grid button[data-sort="doing_alright"]{grid-column:1/-1;background:#707762;color:#050505}.wm-other{display:grid;gap:8px;margin:12px 0}.wm-other textarea{min-height:88px;padding:12px;border:1px solid #707762;border-radius:12px;background:#fffdf7;color:#050505;font:inherit}.wm-status{min-height:22px;margin:8px 0 0}.wm-gate-note{margin-top:10px;font-size:13px;color:#454b40}@media(max-width:560px){.wm-sort-grid{grid-template-columns:1fr}.wm-sort-grid button[data-sort="doing_alright"]{grid-column:auto}.wm-next-actions{display:grid}.wm-next a,.wm-next button{width:100%;text-align:center}.wm-plan-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function unpack(result){
    const state=result?.state||result||{};
    const preferences=state.preferences&&typeof state.preferences==='object'?state.preferences:{};
    const wholeMan=preferences.wholeMan&&typeof preferences.wholeMan==='object'?preferences.wholeMan:{};
    return {state,preferences,wholeMan};
  }

  async function loadState(force=false){
    if(cache&&!force)return cache;
    const result=await SST_API.getMemberState();cache=unpack(result);return cache;
  }

  async function patchWholeMan(patch){
    const current=await loadState(true),wholeMan={...current.wholeMan,...patch},preferences={...current.preferences,wholeMan};
    const result=await SST_API.saveMemberState({preferences});
    cache=unpack(result?.state?result:{state:{...current.state,preferences}});
    return wholeMan;
  }

  function canonical(wholeMan={}){
    return {
      ...wholeMan,
      intentSortCurrent:wholeMan.intentSortCurrent||wholeMan.intent_sort_current||'',
      intentSortHistory:wholeMan.intentSortHistory||wholeMan.intent_sort_history||[],
      journeyMode:wholeMan.journeyMode||wholeMan.journey_mode||'',
      continuityState:wholeMan.continuityState||wholeMan.continuity_state||'',
      sortCheckinDueAt:wholeMan.sortCheckinDueAt||wholeMan.intent_sort_checkin_due_at||'',
      healthPlanStatus:wholeMan.healthPlanStatus||wholeMan.health_plan_status||{}
    };
  }

  function modeFor(sort){
    return ({weight:'lose',energy:'live_better',health:'mot',sleep:'live_better',sex_confidence:'mens',movement:'live_better',hair:'mens',head_stress:'live_better',drinking_smoking:'live_better',mot:'mot',doing_alright:'maintain'})[sort]||'live_better';
  }

  async function treatmentOrders(){
    try{return (await SST_API.getTreatmentOrders?.())?.orders||[]}catch{return []}
  }

  async function cardFor(sort,rawWholeMan={}){
    const wholeMan=canonical(rawWholeMan),orders=await treatmentOrders();
    const activeTreatment=sort==='weight'&&orders.some(o=>!['declined','refunded','cancelled'].includes(String(o.clinicalStatus||o.status||'').toLowerCase()));
    if(wholeMan.safety_flag)return {title:'Get the right help now',reason:'Safety beats every plan and every product. Use the urgent support route now.',label:'Open urgent support',href:'/mens-mental-health#urgent',gate:'none',priority:'safety'};
    if(['stopped','stranded','elsewhere'].includes(wholeMan.continuityState))return {title:'Keep SHIFT when treatment changes',reason:'Your Journey, Life Back and support stay open whether medicine stopped, moved elsewhere or the clinic went quiet.',label:'Open ContinuityStay',href:'#journey',gate:'none',priority:'continuity'};
    const setup=orders.find(o=>o.journeySetupRequired);if(setup)return {title:'Set up the Journey that stays with you',reason:'Your order is approved. Complete the required two-minute Journey setup, including what you want your Life Back for.',label:'Complete My Journey setup',href:'#journey',gate:'none',priority:'journey_setup'};
    const intake=orders.find(o=>o.clinicalIntakeRequired);if(intake)return {title:'Complete your clinical checks',reason:'Your required verification comes before payment or another recommendation.',label:'Complete required checks',href:`/treatment-assessment?order=${encodeURIComponent(intake.orderNumber||'')}&variant=${encodeURIComponent(intake.variantId||'')}`,gate:'none',priority:'clinical_checks'};
    const open=orders.find(o=>!['declined','refunded','cancelled','fulfilled'].includes(String(o.clinicalStatus||o.status||'').toLowerCase()));if(open)return {title:'Track the order already moving',reason:'One open order beats another sales route. Check its clinical, dispensing and dispatch status.',label:'Open order tracker',href:'#orders',gate:'none',priority:'open_order'};
    const routes={
      weight:activeTreatment?{title:'Keep this week moving',reason:'You’re already on a treatment journey. Your next useful step is the Journey — not another product shelf.',label:'Open My Journey',href:'#journey',gate:'none'}:{title:'Sort the weight first',reason:'Start with the responsible treatment route and see the real options. No email gate just to understand the route.',label:'Start my weight route',href:'/start-here',gate:'pharmacy'},
      energy:{title:'Find what is draining the tank',reason:'Energy often sits across sleep, food, movement and wider health. Start with guidance rather than guessing at a diagnosis.',label:'Open SHIFT Health',href:'/shift-health#energy-sleep',gate:'none'},
      health:{title:'How’s the engine?',reason:'Start your SHIFT MOT framing: waist, heart and circulation, blood-sugar picture, movement, sleep and men’s health — in plain English.',label:'Open SHIFT Health MOT',href:'/shift-health#health-mot',gate:'diagnostics',pathway:'mot'},
      sleep:{title:'Sort tonight before chasing tomorrow',reason:'Start with the sleep picture and the bits around it — routine, food, drink and how the week is actually going.',label:'Open SHIFT Health',href:'/shift-health#energy-sleep',gate:'none'},
      sex_confidence:{title:'Start privately. No sales pitch.',reason:'Sex drive, erections and confidence can have several explanations. Start with a normal-language check-in; do not jump straight to testosterone.',label:'Open the private pathway',href:'/shift-health#sexual-health',gate:'clinical',pathway:'mens'},
      movement:{title:'Protect strength while the timber shifts',reason:'Pick movement you can actually repeat. The promise is simple: lose timber, keep strength.',label:'Open Shift Fit',href:'/member/fit',gate:'none'},
      hair:{title:'Understand the hair route first',reason:'Start with what has changed and what legitimate options exist. Treatment only appears when a governed clinical pathway is live.',label:'Open SHIFT Health',href:'/shift-health#hair',gate:'clinical',pathway:'hair'},
      head_stress:{title:'Make today smaller',reason:'You do not need another lecture. Start with practical support; if it feels urgent, use the proper clinical or emergency doors.',label:'Good to Talk',href:'/mens-mental-health',gate:'none'},
      drinking_smoking:{title:'Pick one thing to make easier this week',reason:'No purity test. Notice the pattern, choose one realistic change, and keep the Journey moving.',label:'Open SHIFT Health',href:'/shift-health#drinking-smoking',gate:'none'},
      mot:{title:'How’s the engine?',reason:'If you’re not sure what needs sorting, start broad. SHIFT can frame the picture now; paid diagnostics stay gated until the partner and governance are real.',label:'Open my SHIFT MOT',href:'/shift-health#health-mot',gate:'diagnostics',pathway:'mot'},
      other:{title:'Tell SHIFT what is actually on your mind',reason:wholeMan.otherText?`You said: “${wholeMan.otherText}”`:'Use Ask Timber to route the question without squeezing it into the wrong box.',label:'Ask Timber',href:'/member/ask-timber.html',gate:'none'},
      doing_alright:{title:'Good. Let’s keep it that way.',reason:'No invented problem and no forced upsell. Keep your Journey and Life Back visible while things are going well.',label:'Keep me on track',href:'#journey',gate:'none'}
    };
    return routes[sort]||{title:'Your next useful shift',reason:'Pick what you would like to sort and SHIFT will give you one useful next action.',label:'What would you like to sort?',action:'sort',gate:'none'};
  }

  function healthPlanFor(sort,wholeMan={},healthInterests=[]){
    const labels=Object.fromEntries(SORTS),status=wholeMan.healthPlanStatus&&typeof wholeMan.healthPlanStatus==='object'?wholeMan.healthPlanStatus:{};
    const history=Array.isArray(wholeMan.intentSortHistory)?wholeMan.intentSortHistory:[];
    const previous=[...history].reverse().map(item=>item?.value).filter(value=>value&&value!==sort&&labels[value]&&status[value]?.state!=='parked').filter((value,index,array)=>array.indexOf(value)===index).slice(0,3);
    const keep=({
      weight:'Keep sleep, strength, blood pressure and the wider health picture in view while weight changes.',
      energy:'If low energy keeps hanging around, sleep, bloods and a proper clinical review may matter more than guessing at one cause.',
      health:'Build the baseline in plain English: blood pressure, weight/waist, metabolic health, sleep, movement and men’s health.',
      sleep:'If snoring, breathing pauses or daytime exhaustion are part of the picture, a proper sleep pathway beats another consumer sleep score.',
      sex_confidence:'Keep this clinical and private. Sex drive, erections and confidence can have several causes; testosterone is not the automatic answer.',
      movement:'If pain or injury is blocking movement, use a proper MSK/physio route rather than forcing through it.',
      hair:'Understand what changed first. Clinical treatment only belongs behind a governed pathway.',
      head_stress:'Keep the next step manageable. Human professional support should be easy to reach when practical support is not enough.',
      drinking_smoking:'Aim for one realistic change. Proper clinical support belongs in the route when it is needed.',
      mot:'Use the MOT to build a useful baseline, then act on the few things that actually need attention.',
      other:'Keep this in your own words. SHIFT should route the concern without squeezing it into the wrong product.',
      doing_alright:'Keep prevention current without inventing a problem: routine reviews, blood pressure and NHS screening when invited or eligible.'
    })[sort]||'Start with the thing that matters now. Add more only when it changes what you should do next.';
    const radar=previous.length?previous.map(value=>labels[value]).join(' · '):'Nothing else needs forcing onto the list today.';
    const saved=[...new Set(Array.isArray(healthInterests)?healthInterests:[])].filter(slug=>HEALTH_INTERESTS[slug]).map(slug=>({slug,label:HEALTH_INTERESTS[slug][0],sort:HEALTH_INTERESTS[slug][1]}));
    return {keep,radar,previous,labels,status,saved};
  }

  function routeLabel(card={}){
    if(card.priority==='safety')return 'Urgent / professional help';
    if(card.gate==='pharmacy')return 'Regulated pharmacy route';
    if(card.gate==='diagnostics')return 'Diagnostics — partner gated';
    if(card.gate==='clinical')return 'Clinical route — partner gated';
    if(card.href==='#journey')return 'My Timber · My Journey';
    if(String(card.href||'').includes('mens-mental-health'))return 'Support route';
    if(String(card.href||'').includes('ask-timber'))return 'Ask Timber';
    return 'SHIFT guidance';
  }

  async function parkCurrent(sort){
    if(!sort)return;
    const current=await loadState(true),wholeMan=canonical(current.wholeMan),at=nowIso(),status={...(wholeMan.healthPlanStatus||{}),[sort]:{state:'parked',at}};
    await patchWholeMan({healthPlanStatus:status,health_plan_status:status,intentSortCurrent:'',intent_sort_current:'',nextShiftIntent:'',next_shift_intent:'',nextShiftUpdatedAt:at,next_shift_updated_at:at});
    await track('health_plan_item_parked',{intent_sort:sort});cache=null;await render();openSort();
  }

  async function bringForward(sort){
    const current=await loadState(true),wholeMan=canonical(current.wholeMan),history=Array.isArray(wholeMan.intentSortHistory)?wholeMan.intentSortHistory.slice(-49):[],at=nowIso(),mode=modeFor(sort),nextDue=new Date(Date.now()+7*DAY).toISOString(),status={...(wholeMan.healthPlanStatus||{})};
    delete status[sort];const nextHistory=[...history,{value:sort,at,source:'health_plan'}];
    await patchWholeMan({healthPlanStatus:status,health_plan_status:status,intentSortCurrent:sort,intent_sort_current:sort,intentSortHistory:nextHistory,intent_sort_history:nextHistory,journeyMode:mode,journey_mode:mode,nextShiftIntent:sort,next_shift_intent:sort,nextShiftUpdatedAt:at,next_shift_updated_at:at,sortCheckinDueAt:nextDue,intent_sort_checkin_due_at:nextDue});
    await track('health_plan_item_brought_forward',{intent_sort:sort,journey_mode:mode});cache=null;await render();
  }

  function openChanged(){
    const panel=document.querySelector('[data-coach-change-panel]');
    if(panel){panel.open=true;panel.scrollIntoView({behavior:'smooth',block:'center'});panel.querySelector('select,button,input')?.focus();track('health_plan_something_changed',{destination:'coach'});return;}
    location.href='/member/ask-timber.html';
  }

  function openHumanHelp(){
    const panel=document.querySelector('[data-coach-support]');
    if(panel){panel.open=true;panel.scrollIntoView({behavior:'smooth',block:'center'});panel.querySelector('textarea,a,button')?.focus();track('health_plan_help_choose',{destination:'support'});return;}
    location.href='/contact?type=Support';
  }

  function due(wholeMan){
    if(!wholeMan.sortCheckinDueAt)return true;
    const t=Date.parse(wholeMan.sortCheckinDueAt);return !Number.isFinite(t)||t<=Date.now();
  }

  function insertHost(){
    const panel=document.getElementById('panel-today');if(!panel)return null;
    let host=document.getElementById('wholeManNextShift');if(host)return host;
    host=document.createElement('section');host.id='wholeManNextShift';host.className='wm-next';host.setAttribute('aria-label','My Next Shift');
    const anchor=document.getElementById('todayActions')||panel.firstElementChild;anchor?.parentNode?.insertBefore(host,anchor);return host;
  }

  async function render(){
    const host=insertHost();if(!host)return;
    const loaded=await loadState(true),wholeMan=canonical(loaded.wholeMan),healthInterests=loaded.preferences?.myJourney?.healthInterests||[],sort=wholeMan.intentSortCurrent||'',card=await cardFor(sort,wholeMan),isDue=due(wholeMan);
    const primary=card.action==='sort'?`<button data-next-primary data-next-action="sort" type="button">${esc(card.label)}</button>`:`<a data-next-primary href="${esc(card.href)}">${esc(card.label)}</a>`;
    const plan=healthPlanFor(sort,wholeMan,healthInterests),currentLabel=sort?(plan.labels[sort]||card.title):'Choose what matters first.',historyButtons=plan.previous.map(value=>`<button type="button" class="secondary" data-plan-bring="${esc(value)}">${esc(plan.labels[value])}</button>`).join(''),savedHealth=plan.saved.map(item=>`<span><a class="secondary" href="/shift-health/${esc(item.slug)}">${esc(item.label)}</a> <button type="button" class="secondary" data-health-bring="${esc(item.sort)}">Bring forward</button></span>`).join('');
    host.innerHTML=`<small>MY NEXT SHIFT</small><h2>${esc(card.title)}</h2><p>${esc(card.reason)}</p><div class="wm-next-actions">${primary}<button class="secondary" type="button" data-sort-open>${sort?'Sort something else':'What would you like to sort?'}</button></div>${card.gate!=='none'?`<p class="wm-gate-note">This pathway is useful now. Any regulated purchase stays behind partner, stock and governance gates.</p>`:''}<section class="wm-health-plan" aria-label="My Health Plan"><small>MY HEALTH PLAN</small><h3>Your health, joined up. One useful thing at a time.</h3><div class="wm-plan-grid"><div class="wm-plan-item"><strong>What matters now</strong><span>${esc(currentLabel)}</span><span class="wm-plan-route">${esc(routeLabel(card))}</span></div><div class="wm-plan-item"><strong>Why we’re keeping an eye on it</strong><span>${esc(plan.keep)}</span></div><div class="wm-plan-item"><strong>Previously raised</strong><span>${esc(plan.radar)}</span>${historyButtons?`<div class="wm-plan-history">${historyButtons}</div>`:''}</div></div>${savedHealth?`<div class="wm-plan-saved"><strong>Saved from SHIFT Health</strong><div class="wm-plan-saved-list">${savedHealth}</div><p class="wm-plan-note">You chose to save these routes. Saving one does not mean SHIFT thinks you have the condition, need treatment or should buy anything.</p></div>`:''}<div class="wm-plan-feedback" data-plan-feedback hidden></div><div class="wm-plan-actions">${sort?'<button type="button" class="secondary" data-plan-park>Park this for now</button>':''}<button type="button" class="secondary" data-plan-changed>Something’s changed</button><button type="button" class="secondary" data-plan-help>Ask SHIFT to help me choose</button></div><p class="wm-plan-note">This plan is based on what you have explicitly told SHIFT, not a diagnosis. We should use the NHS or your GP when that is the right door, and a governed specialist partner when specialist care is needed. No forced sale just to fill a slot.</p></section>${isDue?'<div class="wm-checkin"><span>Anything else you’d like to sort?</span><div><button type="button" data-sort-open>Choose</button> <button type="button" class="secondary" data-sort-skip>Not now</button></div></div>':''}`;
    host.querySelectorAll('[data-sort-open]').forEach(b=>b.addEventListener('click',openSort));
    host.querySelector('[data-sort-skip]')?.addEventListener('click',skipCheckin);
    host.querySelector('[data-plan-park]')?.addEventListener('click',()=>parkCurrent(sort));
    host.querySelectorAll('[data-plan-bring]').forEach(button=>button.addEventListener('click',()=>bringForward(button.dataset.planBring)));
    host.querySelectorAll('[data-health-bring]').forEach(button=>button.addEventListener('click',()=>bringForward(button.dataset.healthBring)));
    host.querySelector('[data-plan-changed]')?.addEventListener('click',openChanged);
    host.querySelector('[data-plan-help]')?.addEventListener('click',openHumanHelp);
    host.querySelector('[data-next-primary]')?.addEventListener('click',event=>{
      track('next_shift_completed',{intent_sort:sort||null,journey_mode:wholeMan.journeyMode||modeFor(sort),next_shift_priority:card.priority||'sort',partner_gate:card.gate||'none',href:event.currentTarget.getAttribute('href')||null});
      if(card.action==='sort'){event.preventDefault();openSort();return}
      if(card.href?.startsWith('#')){event.preventDefault();document.querySelector(`.mp-tab[data-panel="${card.href.slice(1)}"]`)?.click()}
    });
    track('next_shift_shown',{intent_sort:sort||null,journey_mode:wholeMan.journeyMode||modeFor(sort),next_shift_priority:card.priority||'sort',partner_gate:card.gate||'none'});
  }

  function openSort(){
    if(document.querySelector('.wm-dialog-wrap'))return;
    track('intent_sort_checkin_shown',{source:'today'});
    const wrap=document.createElement('div');wrap.className='wm-dialog-wrap';wrap.innerHTML=`<button class="wm-dialog-scrim" type="button" aria-label="Close"></button><section class="wm-sort-dialog" role="dialog" aria-modal="true" aria-labelledby="wmSortTitle"><header><div><small>ONE THING AT A TIME</small><h2 id="wmSortTitle">What would you like to sort?</h2><p>Pick the thing that matters now. SHIFT will give you one next step — not a wall of products.</p></div><button type="button" class="secondary" data-close aria-label="Close">×</button></header><div class="wm-sort-grid">${SORTS.map(([key,label])=>`<button type="button" data-sort="${key}">${esc(label)}</button>`).join('')}</div><div class="wm-other" hidden><label for="wmOtherText"><strong>In your own words</strong></label><textarea id="wmOtherText" maxlength="140" placeholder="What do you want to sort?"></textarea><button type="button" data-other-save>Use this</button></div><p class="wm-status" role="status" aria-live="polite"></p></section>`;document.body.appendChild(wrap);
    const close=()=>wrap.remove();wrap.querySelector('[data-close]').onclick=close;wrap.querySelector('.wm-dialog-scrim').onclick=close;
    wrap.querySelectorAll('[data-sort]').forEach(button=>button.onclick=()=>button.dataset.sort==='other'?showOther(wrap):selectSort(button.dataset.sort,'',wrap));
    wrap.querySelector('[data-other-save]').onclick=()=>{const text=wrap.querySelector('#wmOtherText').value.trim();if(!text){wrap.querySelector('#wmOtherText').focus();return}selectSort('other',text.slice(0,140),wrap)};
  }

  function showOther(wrap){const box=wrap.querySelector('.wm-other');box.hidden=false;box.querySelector('textarea').focus()}

  async function selectSort(sort,otherText,wrap){
    const status=wrap.querySelector('.wm-status');wrap.querySelectorAll('button').forEach(b=>b.disabled=true);status.textContent='Sorting one useful next step…';
    try{
      const current=await loadState(true),history=Array.isArray(current.wholeMan.intentSortHistory)?current.wholeMan.intentSortHistory.slice(-49):[],at=nowIso(),mode=modeFor(sort),nextDue=new Date(Date.now()+7*DAY).toISOString();
      const nextHistory=[...history,{value:sort,at,source:'checkin'}];
      await patchWholeMan({intentSortCurrent:sort,intent_sort_current:sort,intentSortHistory:nextHistory,intent_sort_history:nextHistory,otherText:sort==='other'?otherText:'',journeyMode:mode,journey_mode:mode,nextShiftIntent:sort,next_shift_intent:sort,nextShiftUpdatedAt:at,next_shift_updated_at:at,sortCheckinDueAt:nextDue,intent_sort_checkin_due_at:nextDue,sortCheckinSkippedAt:null,intent_sort_checkin_skipped_at:null});
      await track('intent_sort_selected',{intent_sort:sort,source:'checkin',journey_mode:mode});
      wrap.remove();await render();
    }catch(error){wrap.querySelectorAll('button').forEach(b=>b.disabled=false);status.textContent=error.message||'That did not save. Try once more.'}
  }

  async function skipCheckin(){
    const at=nowIso(),nextDue=new Date(Date.now()+7*DAY).toISOString();
    try{await patchWholeMan({sortCheckinSkippedAt:at,intent_sort_checkin_skipped_at:at,sortCheckinDueAt:nextDue,intent_sort_checkin_due_at:nextDue});await track('intent_sort_checkin_skipped',{source:'today'});await render()}catch{}
  }

  async function boot(){
    if(!window.SST_API?.getMemberState||!window.SST_API?.saveMemberState)return setTimeout(boot,120);
    if(!document.getElementById('panel-today'))return setTimeout(boot,120);
    styles();
    try{await render()}catch(error){console.warn('whole_man_intent_os_unavailable',error?.message)}
    document.addEventListener('sst:journey-updated',()=>{cache=null;render().catch(()=>null)});
    document.addEventListener('sst:treatment-refresh',()=>{cache=null;render().catch(()=>null)});
    document.addEventListener('sst:health-interest-saved',()=>{cache=null;render().catch(()=>null)});
    document.addEventListener('sst:daily-feedback',event=>{const box=document.querySelector('[data-plan-feedback]'),record=event.detail;if(!box||!record?.feedback)return;const labels={helped:'It helped','not-fit':'It did not fit','not-tried':'Not tried yet',skip:'Skipped for now'};box.hidden=false;box.textContent='Latest saved step: '+(labels[record.feedback]||record.feedback)+'. '+(record.feedback==='not-fit'?'Your next step should change rather than repeat the same approach.':'Your answer stays part of the loop.');});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
