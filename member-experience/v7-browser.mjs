// Runs inside the retained account-aware Today client. It receives the same
// Life Back response; mounting V7 does not fetch another page-load endpoint.
export function v7Browser(services){
 'use strict';
 const {esc}=services;let view=null,modal=null,busy=false,pending=null,source=null;
 const bound=new WeakSet();
 const text=s=>esc(s??'');
 const ready=()=>services.ready()&&!document.hidden;
 const status=s=>{const n=(modal||document).querySelector('[data-v7-status]');if(n)n.textContent=s;};
 const button=(label,action,extra='')=>'<button type="button" data-v7="'+action+'" '+extra+'>'+label+'</button>';
 function accept(v){view=v||null;document.documentElement.dataset.mtShowWeight=view?.preferences?.showWeight===false?'off':'on';}
 function clear(){view=null;pending=null;busy=false;if(modal){modal.remove();modal=null;}delete document.documentElement.dataset.mtShowWeight;}
 async function save(action,extra={}){
  if(busy||!ready()||!view)return null;
  const owner=String(services.account()),generation=services.generation(),intent=JSON.stringify({owner,action,extra});
  if(!pending||pending.intent!==intent)pending={intent,id:crypto.randomUUID()};
  busy=true;status('Saving…');
  try{
   if(action!=='v7-preferences'&&!await window.SST_HEALTH_CONSENT?.ensure())throw Error('Nothing saved. Review optional health tracking in Account & settings.');
   if(!ready()||generation!==services.generation())return null;
   const d=await services.request({action,...extra,expectedAccount:owner,revision:services.progress().revision,operationId:pending.id});
   if(!ready()||generation!==services.generation())return null;
   if(String(d.accountId)!==owner)throw Error('Your account changed. Reload before saving.');
   pending=null;accept(d.v7);services.saved(d);status('Saved.');return d;
  }catch(e){if(generation===services.generation())status(e.message||'That save could not be confirmed. Your pile has not been guessed.');return null;}
  finally{busy=false;}
 }
 function title(a){return a.kind==='food'&&!a.pending?'Make tonight’s dinner: '+a.name:a.name;}
 function todayMarkup(){
  if(!view)return '<p role="status">Opening your saved action…</p>';
  const a=view.action,p=view.proteinG,target=view.proteinTarget;
  return '<section class="mt-v7-card mt-v7-cream" data-v7-action-card><p class="mt-v7-eyebrow">TODAY’S ONE THING</p><h2>'+text(title(a))+'</h2>'+
   (target?'<p><strong>Your protein target: '+text(target)+'g</strong> · <a href="/member/settings#food">Change</a></p>':'')+
   (a.kind==='food'?'<p>Logged today: '+(p===null?'no amounts recorded':text(Math.round(p*10)/10)+'g')+'. '+(Number.isFinite(a.proteinG)?'This dinner contains about '+text(a.proteinG)+'g per serving.':'Amounts stay unknown until you record them.')+'</p>':'')+
   (a.reason?'<p class="mt-v7-reason">'+text(a.reason)+'</p>':'')+
   (a.items?.length||a.steps?.length?'<details><summary>'+text(a.time||'Instructions')+' · '+text(a.label||'Recipe')+'</summary><ul>'+a.items.map(i=>'<li>'+text(i)+'</li>').join('')+'</ul><ol>'+a.steps.map(i=>'<li>'+text(i)+'</li>').join('')+'</ol>'+(a.allergenNote?'<p>'+text(a.allergenNote)+'</p>':'')+'</details>':'<p><a href="'+text(a.href)+'">'+text(a.label||'Open this step')+'</a></p>')+
   (a.kind==='food'?'<p><a href="/member/grub#record-eaten">Record what you ate</a></p>':'')+
   '<div class="mt-v7-actions">'+button(view.completedToday?'✓ SAVED TODAY':'✓ DONE','done',view.completedToday||a.pending?'disabled':'')+button('⇄ SWAP IT','swap',view.completedToday?'disabled':'')+'</div>'+
   '<p class="mt-v7-small"><a href="/member/ask-timber#about='+encodeURIComponent(title(a))+'">Ask Timber about this ›</a></p>'+
   '<div class="mt-v7-saved"><p class="mt-v7-eyebrow">MY NEXT STEP · SAVED</p><strong>'+text(a.name)+'</strong><p><a href="/member/life-back/support">Open my saved step and reminders</a></p><p class="mt-v7-small">Private and optional. This is not clinical monitoring.</p></div><p role="status" data-v7-status></p></section>'+
   (view.goal?'<section class="mt-v7-card mt-v7-why"><p class="mt-v7-eyebrow">DOING THIS FOR:</p><strong>'+text(view.goal)+'</strong> <a href="/member/life-back">Change</a></section>':'')+
   '<nav class="mt-v7-quick" aria-label="Quick records">'+button('Pint','food','data-food="Pint"')+button('Takeaway','food','data-food="Takeaway"')+
   '<a href="/member/fit">Gym done</a>'+button('Rough night','quick','data-quick-note="Rough night"')+
   (view.preferences.showWeight?button('Weigh in','quick'):'')+'</nav>';
 }
 function stackMarkup(){
  if(!view)return '';
  let dots='',remaining=Math.max(0,30-view.count),n=0;
  // Thirty fixed slots; outlines mean future logs, never missed days.
  for(const count of [8,7,6,5,4]){let row='';for(let j=0;j<count;j++,n++)row+='<span class="mt-v7-log '+(n<Math.min(view.count,30)?'is-filled':'')+'"></span>';dots='<div class="mt-v7-log-row">'+row+'</div>'+dots;}
  return '<section class="mt-v7-card" data-v7-stack><p class="mt-v7-eyebrow">TIMBER STACK</p><h2>'+text(view.count)+' OF 30 LOGS</h2><p>Your target pile. Outlines are logs to come.</p><div class="mt-v7-pile" aria-hidden="true">'+dots+'</div><p><strong>'+text(remaining)+'</strong> to go.</p><p>Earn a log: complete your one thing. One log a day max. Feedback is optional.</p>'+
   (view.milestone?button('View your 30-log milestone','preview'):'')+
   (view.insights?.recap?button('Your week','recap'):'')+'</section>';
 }
 function close(){const old=modal;modal=null;old?.close();old?.remove();if(source?.isConnected)source.focus();}
 function sheet(label,html){
  close();source=document.activeElement;modal=document.createElement('dialog');modal.className='mt-v7-sheet';modal.setAttribute('aria-label',label);
  modal.innerHTML='<button type="button" data-v7="close" class="mt-v7-close" aria-label="Close">×</button>'+html+'<p data-v7-status role="status"></p>';document.body.append(modal);bind(modal);
  modal.addEventListener('cancel',e=>{e.preventDefault();close();});modal.addEventListener('click',e=>{if(e.target===modal)close();});modal.showModal();modal.querySelector('button')?.focus();
 }
 function swap(){
  if(!view||view.completedToday)return;
  sheet('Swap your action','<p class="mt-v7-eyebrow">SWAP IT</p><h2>SAME GOAL, ANOTHER WAY</h2><p>Choose what fits today. Choosing dinner does not record it as eaten.</p>'+
   view.alternatives.map(a=>'<article class="mt-v7-choice"><div><strong>'+text(a.name)+'</strong><p>'+text(a.time)+(Number.isFinite(a.proteinG)?' · about '+text(a.proteinG)+'g protein per serving':'')+'</p></div>'+button('Pick','pick','data-choice="'+text(a.id)+'"')+'</article>').join('')+
   (!view.alternatives.length?'<p>No other prepared dinners are saved for today yet.</p>'+button('Prepare my alternatives','refresh')+'':'')+
   '<div class="mt-v7-actions">'+button('Not for me','decline','data-outcome="not-fit"')+button('Didn’t get round to it today','decline','data-outcome="not-tried"')+'</div><p><a href="/member/life-back/support">None of these? Tell Timber what’s difficult</a></p>'+button('Keep the original','close'));
 }
 async function done(){
  if(!view||view.completedToday)return;
  const count=view.count,d=await save('v7-complete',{actionId:view.action.id});if(!d)return;
  const day=d.progress.v7.days[view.today],awarded=view.count>count;
  sheet('Your action is saved','<p class="mt-v7-eyebrow">DONE</p><h2>'+(awarded?'+1 log':'Saved today')+'</h2><p><strong>'+text(day.log.action.completedLabel||'Your action is saved.')+'</strong></p><p>'+text(view.count)+' of 30 logs on your pile.</p><h3>HOW DID IT GO? <small>OPTIONAL</small></h3><div class="mt-v7-feedback">'+
   [['helped','Helped'],['not-helped','Tried it, didn’t help'],['later','Ask me later']].map(([key,label])=>button(label,'feedback','data-outcome="'+key+'" data-log="'+text(day.log.id)+'" data-day="'+text(day.on)+'"')).join('')+
   '</div><p>Your log is safe either way. This shapes tomorrow’s suggestion.</p>'+
   (day.log.action.kind==='food'?'<p>Logged today: '+text(view.proteinG??0)+'g. Done doesn’t add food. Record it when you’ve eaten.</p><a href="/member/grub#record-eaten">Record what you ate</a>':'')+
   (view.count===30?'<p>Your first pile is complete.</p>'+button('Preview your milestone','preview'):''));
 }
 function preview(){
  if(!view)return;const s=view.share;
  sheet('Share preview','<p class="mt-v7-eyebrow">SHARE PREVIEW</p><div class="mt-v7-share"><p>MY TIMBER</p><h2>'+text(s.logs)+' LOGS.<br>STILL STACKING.</h2><p>'+text(s.weekCount)+' logs this week.</p></div><p>This shares your effort only. Check the preview before sharing.</p>'+button('Share this card','share'));
 }
 async function share(){
  if(!ready()||!modal||!view)return;const s=view.share;
  const data={title:'My Timber',text:s.logs+' logs. Still stacking. '+s.weekCount+' logs this week.'};
  try{if(navigator.share)await navigator.share(data);else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(data.text);status('Copied. Choose where to share it.');}else status('Sharing is unavailable in this browser. Your preview is still here.');}
  catch(e){if(e.name!=='AbortError')status('Sharing did not finish. Your pile is safe.');}
 }
 function recap(){
  const r=view?.insights?.recap;if(!r)return;
  sheet('Your week','<p class="mt-v7-eyebrow">'+text(r.from)+' TO '+text(r.to)+'</p><h2>YOUR WEEK</h2><p>'+text(r.summary)+'</p><ul>'+(r.items||[]).map(i=>'<li>'+text(i.text)+'</li>').join('')+'</ul>'+(r.suggestion?'<p>'+text(r.suggestion)+'</p>':'')+button('Preview a share card','preview'));
 }
 function foodForm(name){
  sheet('Record what you ate','<h2>Record what you ate</h2><p>Only save this after you’ve had it. No protein amount will be guessed.</p><form data-v7-food><label>Food or drink<input name="food" maxlength="500" required value="'+text(name)+'"></label><button>Record what I had</button></form>');
  modal.querySelector('form').onsubmit=async e=>{e.preventDefault();if(busy||!ready())return;busy=true;const token=pending?.foodId||crypto.randomUUID();pending={foodId:token};try{
   if(!await window.SST_HEALTH_CONSENT?.ensure())throw Error('Review optional health tracking before saving.');
   const r=await fetch('/v1/grub/eaten',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({on:view.today,food:new FormData(e.target).get('food'),operationId:token})}),d=await r.json();if(!r.ok)throw Error(d.message||'That food record could not be confirmed.');
   pending=null;close();document.dispatchEvent(new CustomEvent('sst:today-rendered'));
  }catch(e){status(e.message);}finally{busy=false;}};
 }
 function bind(root){
  if(bound.has(root))return;bound.add(root);
  root.addEventListener('click',async e=>{
   const b=e.target.closest('[data-v7]');if(!b||b.disabled||!ready())return;
   const key=b.dataset.v7;if(busy)return;e.preventDefault();
   if(key==='done')await done();else if(key==='swap')swap();else if(key==='refresh'){if(await save('v7-refresh'))swap();}else if(key==='close')close();
   else if(key==='pick'){if(await save('v7-select',{actionId:b.dataset.choice}))close();}
   else if(key==='decline'){if(await save('v7-decline',{actionId:view.action.id,outcome:b.dataset.outcome}))close();}
   else if(key==='feedback'){if(await save('v7-feedback',{on:b.dataset.day,logId:b.dataset.log,outcome:b.dataset.outcome}))close();}
   else if(key==='preview')preview();else if(key==='share')await share();else if(key==='recap')recap();
   else if(key==='food')foodForm(b.dataset.food);
   else if(key==='quick')await window.SST_QUICK_LOG?.open(b);
  });
 }
 return {accept,clear,todayMarkup,stackMarkup,bind};
}
export const v7Styles=String.raw`
.mt-v7-card{border:1px solid #707762;border-radius:20px;background:#10120f;color:#E7E3DA;padding:18px;margin:14px 0;line-height:1.45}.mt-v7-card h2,.mt-v7-sheet h2{font-size:clamp(26px,6vw,36px);line-height:1.1;margin:12px 0;text-transform:uppercase}.mt-v7-eyebrow{font-size:12px!important;letter-spacing:.12em;font-weight:700}.mt-v7-cream{background:#E7E3DA;color:#050505}.mt-v7-cream :is(a,summary){color:#414733!important}.mt-v7-cream h2{color:#050505!important}.mt-v7-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}.mt-v7-actions button,.mt-v7-sheet button{font:700 16px/1.25 inherit;min-height:44px;border:1px solid #707762;border-radius:12px;padding:12px;background:#151713;color:#E7E3DA}.mt-v7-cream .mt-v7-actions button{background:#050505;color:#E7E3DA}.mt-v7-cream .mt-v7-actions button+button{background:transparent;color:#050505;border:2px solid #050505}.mt-v7-card [disabled]{opacity:.65;cursor:default}.mt-v7-saved{border-top:1px solid #bcb9ad;padding-top:12px}.mt-v7-small{font-size:13px}.mt-v7-reason{color:#414733;font-weight:600}.mt-v7-why{background:#050505}.mt-v7-why a{float:right}.mt-v7-quick{display:flex;gap:6px;flex-wrap:wrap}.mt-v7-quick :is(a,button){flex:1;min-width:55px;min-height:44px;background:#151713!important;color:#E7E3DA!important;border:1px solid #414733;border-radius:12px;padding:10px 6px!important;text-align:center;font:600 13px/1.3 Arial,sans-serif;text-decoration:none}.mt-v7-pile{max-width:320px;margin:20px auto}.mt-v7-log-row{display:flex;justify-content:center;margin-top:-2px;gap:3px}.mt-v7-log{width:29px;height:29px;border:2px dashed #707762;border-radius:50%;box-sizing:border-box;display:block}.mt-v7-log.is-filled{background:#E7E3DA;border:5px solid #707762;box-shadow:6px -3px 0 #414733}.mt-v7-sheet{box-sizing:border-box;position:fixed;inset:auto 0 0;width:100%;max-width:636px;margin:auto;max-height:90dvh;overflow:auto;background:#10120f;color:#E7E3DA;border:1px solid #707762;border-radius:24px 24px 0 0;padding:24px 18px calc(24px + env(safe-area-inset-bottom));font:16px/1.45 Arial,sans-serif}.mt-v7-sheet::backdrop{background:#050505b8}.mt-v7-sheet a{color:#E7E3DA}.mt-v7-close{float:right}.mt-v7-choice{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #414733;border-radius:16px;padding:14px;margin:12px 0}.mt-v7-choice p{font-size:14px;margin:6px 0}.mt-v7-feedback{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.mt-v7-sheet input{display:block;width:100%;box-sizing:border-box;min-height:44px;font:inherit;background:#050505;color:#E7E3DA;border:1px solid #707762;padding:10px}.mt-v7-sheet label{display:block;margin:14px 0}.mt-v7-share{background:#050505;color:#E7E3DA;border:1px solid #707762;padding:24px}.mt-v7-sheet small{font-size:12px}.mt-support.mt-v7-host{border:0;padding:0}.mt-v7-host>details{border:1px solid #707762;border-radius:16px;padding:12px;margin:16px 0}
`;
