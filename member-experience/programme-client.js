'use strict';
(()=>{
 const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const reasons={energy:['Energy for the family',['Running on empty','Often tired','Up and down','Mostly good','Plenty left']],clothes:['Comfort in my clothes',['Really uncomfortable','Often uncomfortable','It varies','Mostly comfortable','Comfortable as I am']],move:['Moving comfortably',['Very difficult','Often difficult','It varies','Mostly manageable','Comfortable for me']],confidence:['My confidence',['Very low','Lower than I’d like','Up and down','Mostly good','Feeling confident']],self:['Feeling like myself',['Not much at all','A little','It comes and goes','Mostly myself','Feeling like me']],own:['My own reason',['A long way off','A little way there','Somewhere in the middle','Getting closer','In a good place']]};
 let data=null,busy=false,loading=false,pending=null,weeklyDraft=null,reflectionDraft=null,focusDraft=null,returnFocus=null;
 // The shared shell normalises the Today hash while loading. Retain only
 // this non-personal navigation intent until the feedback control exists.
 if(location.hash==='#dailyCheckinFollowup'){
  const observer=new MutationObserver(()=>{const details=$('#dailyCheckinFollowup details');if(details){observer.disconnect();details.open=true;details.scrollIntoView({block:'start',behavior:'instant'});}});
  observer.observe(document.body,{childList:true,subtree:true});
 }
 const host=document.createElement('section');host.id='programmeJourney';host.hidden=true;host.className='pg-panel';
 const dialog=document.createElement('dialog');dialog.className='pg-dialog';dialog.setAttribute('aria-labelledby','pg-dialog-title');
 const fmt=s=>new Date(s).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
 const status=t=>{const e=$('#pg-status');if(e)e.textContent=t};
 async function request(body,query=''){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),20000);
  try{const r=await fetch('/v1/life-back'+query,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:ctrl.signal});const d=await r.json();if(!r.ok)throw Object.assign(Error(r.status===401?'Sign in again to open your private journey.':d.error||'Your journey could not load or save.'),{status:r.status});return d}
  catch(e){if(e.name==='AbortError')throw Error('The request timed out. Retry to check the same saved result.');throw e}finally{clearTimeout(timer)}
 }
 function mount(){
  const life=location.pathname.includes('/life-back'),tool=/\/(?:grub|fit)(?:\.html)?$/.test(location.pathname);
  const anchor=life?$('#journeyView'):tool?$('main'):$('#panel-today');if(!anchor)return false;
  if(host.parentElement!==anchor)anchor.prepend(host);if(!dialog.isConnected)document.body.append(dialog);return true;
 }
 function render(){
  if(!data||!mount())return;document.body.toggleAttribute('data-programme-ready',!!data.progress.programme);host.hidden=false;const p=data.progress.programme,s=data.programme,tool=/\/(?:grub|fit)(?:\.html)?$/.test(location.pathname),life=location.pathname.includes('/life-back');
  if(!p){host.innerHTML=tool?'':`<div class="pg-start"><div><span class="pg-kicker">MAKE THIS YOURS</span><h2>What do you want your life back for?</h2><p>Keep a starting point. Choose a small win. Come back and see what changes.</p></div><a class="pg-button" href="/member/get-started">Make this mine →</a></div>`;host.hidden=tool;return}
  if(tool){const next=data.progress.nextShift,relevant=next?.kind===(location.pathname.includes('/grub')?'food':'movement');host.innerHTML=`<div class="pg-from-week"><div><span class="pg-kicker">FROM YOUR WEEK</span><p>${esc(relevant?next.title:s.reason)}</p></div><a href="/member/dashboard#today">Back to my week →</a></div>`;if(location.pathname.includes('/grub')&&(new URLSearchParams(location.search).get('approach')==='meal-guide'||(next?.kind==='food'&&next.approach==='meal-guide')))host.insertAdjacentHTML('beforeend','<div class="pg-meal-guide"><span class="pg-kicker">A DIFFERENT APPROACH</span><h2>Build an easy meal.</h2><p>Start with food you enjoy and what you already have.</p><ol><li>Choose a familiar starting point.</li><li>Add a suitable protein source and some vegetables or fruit.</li><li>Include a suitable starchy side, and make the portions work for you.</li></ol><p>Your dietary needs and any professional advice take priority.</p><a href="/member/dashboard#dailyCheckinFollowup" target="_top">After trying it: did it help? →</a> · <a href="/member/grub">Browse meal ideas</a></div>');return}
  host.innerHTML=`<div class="pg-reason"><div><span class="pg-kicker">MY REASON</span><h2>${esc(s.reason)}</h2></div><a href="/member/get-started">Change my reason</a></div><div class="pg-progress" aria-label="Your first four weeks">${[1,2,3,4].map(n=>`<span class="${n<=s.week?'pg-on':''}">Week ${n}</span>`).join('')}</div><div class="pg-recap"><p>My small win: <strong>${esc(s.smallWin)}</strong></p><div>${s.reviewDue?'<button type="button" data-pg="weekly">Review my week →</button>':'<a href="/member/life-back#programmeJourney">My reflections →</a>'}${s.reflectionDue?'<button type="button" data-pg="reflection">My four-week reflection →</button>':''}</div></div>${life?history(p,s):''}<p id="pg-status" role="status" aria-live="polite"></p>`;
 }
 function history(p,s){
  const original=p.baseline,id=original.selected[0],label=reasons[id],latest=s.latestReflection;
  return `<div class="pg-history"><div><span class="pg-kicker">MY ORIGINAL STARTING POINT · ${fmt(original.at)}</span><h3>${esc(id==='own'?original.custom:label[0])}</h3><p>${esc(label[1][original.ratings[id]-1])}</p>${original.note?`<p>“${esc(original.note)}”</p>`:''}<p>My small win: ${esc(original.win)}</p></div><div><span class="pg-kicker">MY LATEST REFLECTION</span>${latest?`<h3>${esc(reasons[latest.reason][1][latest.rating-1])}</h3><p>${fmt(latest.at)} · ${esc(latest.reasonText)}</p>${latest.note?`<p>“${esc(latest.note)}”</p>`:''}`:'<h3>Something to look back on.</h3><p>Your four-week reflection becomes available 28 days after your starting point.</p>'}</div></div><details class="pg-older"><summary>My weekly reviews and earlier reflections</summary>${[...p.weeklyReviews].reverse().map(r=>`<article><strong>${fmt(r.at)}</strong><p>Next focus: ${esc({food:'Food',movement:'Movement',structure:'A little structure'}[r.focus])}</p>${r.note?`<p>${esc(r.note)}</p>`:''}</article>`).join('')}${[...p.reflections].reverse().map(r=>`<article><strong>${fmt(r.at)} · ${esc(r.reasonText)}</strong><p>${esc(reasons[r.reason][1][r.baselineRating-1])} → ${esc(reasons[r.reason][1][r.rating-1])}</p>${r.note?`<p>${esc(r.note)}</p>`:''}</article>`).join('')}${!p.weeklyReviews.length&&!p.reflections.length?'<p>Your saved reviews will stay together here.</p>':''}</details>`;
 }
 function show(title,body){returnFocus=document.activeElement;dialog.innerHTML=`<div class="pg-dialog-head"><span class="pg-kicker">MY TIMBER</span><button type="button" data-pg="close" aria-label="Close">×</button></div><h2 id="pg-dialog-title">${title}</h2>${body}<p class="pg-message" role="status" aria-live="polite"></p>`;if(!dialog.open)dialog.showModal()}
 function close(){if(busy)return;dialog.close();returnFocus?.focus?.({preventScroll:true})}
 function weekly(){weeklyDraft=null;show('How did your week feel?',`<p>Keep what helped. Make room for what would help next.</p><form id="pg-week-form"><fieldset><legend>What did you manage?</legend>${[['food','Food that worked for my week'],['movement','Some suitable movement'],['checkin','A moment to check in']].map(([v,t])=>`<label><input type="checkbox" name="managed" value="${v}">${t}</label>`).join('')}</fieldset><label for="pg-barrier">What got in the way?</label><select id="pg-barrier" name="barrier" required><option value="">Choose one</option>${[['nothing','Nothing in particular'],['time','Time'],['energy','Energy'],['cost','Cost'],['confidence','Confidence'],['other','Something else']].map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select><label for="pg-focus">What would help next?</label><select id="pg-focus" name="focus" required><option value="food">Make food easier</option><option value="movement">Find manageable movement</option><option value="structure">A little structure</option></select><label for="pg-week-note">Anything to keep? Optional</label><textarea id="pg-week-note" name="note" maxlength="240"></textarea><button class="pg-button" type="submit">See my next step →</button></form>`)}
 function reflection(){const p=data.progress.programme,s=data.programme,reason=p.focus.selected[0],r=reasons[reason];reflectionDraft={action:'programme-reflection',revision:data.progress.revision,baselineId:s.baselineId};show('How does that feel now?',`<p>Thinking about ${esc(r[0].toLowerCase())}. Better, harder or much the same — your honest answer matters.</p><div class="pg-before"><span class="pg-kicker">WHEN YOU STARTED · ${fmt(s.baselineAt)}</span><p>${esc(s.baselineLabel)}</p><p>My small win: ${esc(s.smallWin)}</p></div><form id="pg-reflection-form"><fieldset><legend>How does this feel now?</legend>${r[1].map((t,i)=>`<label><input type="radio" name="rating" value="${i+1}" required><span>${i+1} · ${esc(t)}</span></label>`).join('')}</fieldset><label for="pg-reflection-note">What have you noticed? Optional</label><textarea id="pg-reflection-note" name="note" maxlength="240"></textarea><button class="pg-button" type="submit">Keep my reflection →</button></form>`)}
 async function save(body){
  if(!window.SST_HEALTH_CONSENT||!await SST_HEALTH_CONSENT.ensure())throw Error('Your answers have not been saved because optional tracking is off.');
  const signature=JSON.stringify(body);if(pending?.signature!==signature)pending={signature,body:{...body,operationId:crypto.randomUUID()}};
  const r=await request(pending.body);pending=null;data={...data,progress:r.progress};await load(true);document.dispatchEvent(new CustomEvent('sst:focus-saved'));document.dispatchEvent(new CustomEvent('sst:refresh-today'));document.dispatchEvent(new CustomEvent('sst:account-focus-changed'));return r;
 }
 async function load(force=false){if(loading||(!force&&(busy||dialog.open)))return;loading=true;try{const before=data?.progress?.revision;data=await request();render();if(before!==data.progress.revision)refreshPanels()}catch(e){if(e.status===401){data=null;document.body.removeAttribute('data-programme-ready');host.replaceChildren();host.hidden=true;if(dialog.open)dialog.close()}else if(data)status(e.message)}finally{loading=false}}
 document.addEventListener('click',async event=>{const b=event.target.closest('[data-pg]');if(!b||busy)return;const action=b.dataset.pg;if(action==='close')return close();if(action==='weekly')return weekly();if(action==='reflection')return reflection();if(action==='edit-week')return weekly();if(action==='smaller'){
  busy=true;try{const proposed=await request(null,'?focusApproach=smaller');focusDraft={action:'focus',revision:proposed.revision,supportNeed:proposed.proposal.kind,approach:'smaller'};show('A smaller step, proposed.',`<div class="pg-before"><h3>${esc(proposed.proposal.title)}</h3><p>${esc(proposed.proposal.detail)}</p></div><button class="pg-button" type="button" data-pg="accept-focus">Use this smaller step →</button>`)}catch(e){dialog.querySelector('.pg-message').textContent=e.message}finally{busy=false}return;
 }if(action==='accept-week'||action==='accept-focus'){
  busy=true;b.disabled=true;const out=dialog.querySelector('.pg-message');out.textContent='Saving your review and next step…';
  try{await save(action==='accept-focus'?focusDraft:weeklyDraft);busy=false;close();status(action==='accept-focus'?'Your smaller next step is saved.':'Your review and chosen next step are saved. Keep it manageable.')}
  catch(e){out.textContent=e.message;if(e.status===409){pending=null;await load(true);out.textContent+=' Close this review and reopen it to use the latest saved state.'}}
  finally{busy=false;b.disabled=false}
 }});
 document.addEventListener('submit',async event=>{const form=event.target;if(!['pg-week-form','pg-reflection-form'].includes(form.id))return;event.preventDefault();if(busy)return;const fields=new FormData(form),out=dialog.querySelector('.pg-message'),button=form.querySelector('button[type=submit]');busy=true;button.disabled=true;
  try{if(form.id==='pg-week-form'){
   weeklyDraft={action:'programme-week',revision:data.progress.revision,managed:fields.getAll('managed'),barrier:fields.get('barrier'),focus:fields.get('focus'),note:String(fields.get('note')).trim()};
   const proposed=await request(null,'?weekFocus='+encodeURIComponent(weeklyDraft.focus));
   if(proposed.revision!==weeklyDraft.revision)throw Object.assign(Error('Your step changed. Close the review and reload before choosing your next step.'),{status:409});
   show('Your next week, proposed.',`<p>You chose ${esc({food:'making food easier',movement:'manageable movement',structure:'a little structure'}[weeklyDraft.focus])}.</p><div class="pg-before"><span class="pg-kicker">MY NEXT SHIFT</span><h3>${esc(proposed.proposal.title)}</h3><p>${esc(proposed.proposal.detail)}</p></div><div class="pg-actions"><button class="pg-button" type="button" data-pg="accept-week">Keep this next step →</button><button type="button" data-pg="edit-week">Change my answers</button></div>`);
  }else{
   const rating=Number(fields.get('rating')),before=data.programme.baselineValue;await save({...reflectionDraft,rating,note:String(fields.get('note')).trim()});
   show(rating>before?'Something worth noticing.':rating<before?'Let’s find what would help.':'A useful moment to pause.',`<p>${rating>before?'You’ve described a change in how everyday life feels. Keep what’s been useful.':rating<before?'Things feel harder right now. You can change the focus or make the next step smaller.':'Things feel much the same. You can keep going, change the approach or simplify.'}</p><p>Your reflection is saved. Your original starting point stays in your history.</p><div class="pg-actions"><a class="pg-button" href="/member/dashboard#today">Keep what’s useful →</a><button type="button" data-pg="smaller">Make my next step smaller</button><a href="/member/get-started">Change my reason</a></div>`);
  }}catch(e){out.textContent=e.message;if(e.status===409){pending=null;await load(true)}}finally{busy=false;button.disabled=false}
 });
 dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault()});dialog.addEventListener('click',event=>{if(event.target===dialog)close()});
 // Tool panels are retained by the shared shell. Ask them to reread their own
 // account state after a saved change; no answers cross the frame boundary.
 function refreshPanels(){if(window.parent!==window)return;for(const frame of document.querySelectorAll('#appToolPanels iframe'))frame.contentWindow?.postMessage({type:'sst:programme-refresh'},location.origin)}
 window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===window.parent&&event.data?.type==='sst:programme-refresh')load(true)});
 // Capture before the shell's document handler, which drops query parameters.
 // The canonical next step also restores the guide after a normal tab/reload.
 window.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href]');if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const url=new URL(link.href,location.href),tab=$('#appTab-grub');
  if(!tab||url.origin!==location.origin||url.pathname!=='/member/grub'||url.searchParams.get('approach')!=='meal-guide')return;
  event.preventDefault();event.stopImmediatePropagation();tab.click();
  const frame=$('#appTool-grub iframe');if(frame){url.searchParams.set('view','app');url.searchParams.set('app_panel','1');frame.src=url.pathname+url.search+url.hash;}
 },true);
 document.addEventListener('sst:today-rendered',()=>{mount();load()});document.addEventListener('sst:focus-saved',()=>load());document.addEventListener('sst:action-reviewed',()=>load());
 window.addEventListener('pageshow',()=>load());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load()});
 mount();load();
})();
