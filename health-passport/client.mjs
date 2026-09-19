// All durable health records stay on the authenticated API. The only browser
// draft is the explicitly requested, 30-minute Start Here preference handoff.
function passportBrowser(){
 'use strict';
 const KEY='sst_start_here_handoff_v1',TTL=1800000;
 const options={why:['Lose weight','Feel more energy','Health worries','Confidence','Feel like myself again'],med:['Jabs','Tablets','Either','No medication'],access:['NHS','Private','Both'],budget:['£0 / NHS','Under £100','£100–£150','£150–£200','£200+']};
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const labels={why:'What matters to you',med:'Medication preference',access:'Access preference',budget:'Monthly budget'};
 const priorityNames={'health-mot':'Health MOT','testosterone-energy':'Testosterone and energy','blood-pressure-monitor':'Blood pressure','digital-scales':'Weight tracking','resistance-bands':'Strength and movement','shift-measure':'Waist tracking','erectile-dysfunction':'Erection and confidence','hair-loss':'Hair loss','stop-smoking':'Stopping smoking','sleep-apnoea':'Sleep and apnoea'};
 let draftTimer;const clearDraft=()=>{clearTimeout(draftTimer);try{sessionStorage.removeItem(KEY)}catch{}};
 function expireDraftAt(at){clearTimeout(draftTimer);draftTimer=setTimeout(()=>{clearDraft();if(host?.isConnected&&passport&&account){render();message('The temporary Start Here answers expired and were removed. Nothing was saved.');}},Math.max(0,at-Date.now()));}
 function validAnswers(a){return a&&Object.entries(options).every(([k,values])=>Array.isArray(a[k])&&a[k].length>0&&a[k].length<=(k==='why'?5:1)&&a[k].every(v=>values.includes(v))&&new Set(a[k]).size===a[k].length)}
 function draft(){try{const raw=sessionStorage.getItem(KEY);if(!raw)return null;if(raw.length>4096)throw Error();const value=JSON.parse(raw),d=value.draft,now=Date.now(),created=Date.parse(d?.createdAt),expires=Date.parse(d?.expiresAt);if(d?.version!==1||typeof d.id!=='string'||!Number.isFinite(created)||!Number.isFinite(expires)||created>now+60000||created<now-TTL||expires<=now||expires>created+TTL||expires<=created||!validAnswers(d.answers))throw Error();expireDraftAt(expires);return value}catch{clearDraft();return null}}
 function shortDate(v){if(!v)return 'Date not recorded';const d=new Date(v);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(d):'Date not recorded'}
 const value=(n,unit)=>n===null||n===undefined||n===''?'Not recorded':esc(n)+' '+unit;
 const pairs=items=>'<dl class="hp-pairs">'+items.map(([k,v])=>'<div><dt>'+esc(k)+'</dt><dd>'+v+'</dd></div>').join('')+'</dl>';
 const answerView=a=>pairs(Object.entries(labels).map(([k,v])=>[v,esc((a[k]||[]).join(', '))]));
 async function api(path='',method='GET',body){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{const r=await fetch(String(window.SST_API_BASE||location.origin).replace(/\/$/,'')+'/v1/health-passport'+path,{method,credentials:'include',cache:'no-store',signal:controller.signal,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});const data=await r.json();if(!r.ok)throw Object.assign(Error(data.message||'Your record could not be loaded.'),{status:r.status,code:data.error});return data}
  catch(e){if(e.name==='AbortError')throw Error('The request timed out. Reload to check your record before trying again.');throw e}finally{clearTimeout(timer)}
 }
 function startHere(){
  const last=$('[data-quick-step="2"]');if(!last||$('[data-hp-remember]',last))return;
  const box=document.createElement('div');box.className='hp-draft-choice';box.innerHTML='<label><input type="checkbox" data-hp-remember> Keep these answers for My Timber in this tab for 30 minutes.</label><p>Optional. This keeps your goals, format, access and budget choices temporarily in this tab. You will review them and choose whether to save them to your account after signing in. It does not save a clinical assessment.</p><p data-hp-draft-status role="status" aria-live="polite"></p>';last.append(box);
  clearDraft(); // Starting again never silently reuses someone else's old choices.
  box.querySelector('input').addEventListener('change',()=>{if(!box.querySelector('input').checked)clearDraft()});
  document.addEventListener('click',e=>{
   if(!e.target.closest('[data-quick-next]')||last.hidden)return;
   const answers={};for(const k of Object.keys(options)){const group=$('[data-multi="'+k+'"], [data-one="'+k+'"]');answers[k]=$$('button[aria-pressed="true"]',group||document).map(b=>(b.querySelector('strong')||b.querySelector('span')||b).textContent.trim())}
   if(!validAnswers(answers))return;
   if(!$('[data-hp-remember]',last).checked){clearDraft();return}
   const now=Date.now(),d={version:1,id:crypto.randomUUID(),createdAt:new Date(now).toISOString(),expiresAt:new Date(now+TTL).toISOString(),answers};
   try{sessionStorage.setItem(KEY,JSON.stringify({draft:d,accountId:null}));expireDraftAt(now+TTL);$('[data-hp-draft-status]').textContent='Kept for this tab. Review and save them in My Timber after signing in.'}
   catch{$('[data-hp-draft-status]').textContent='This browser could not keep the answers. Nothing has been saved to My Timber.'}
  },true);
 }
 let host=null,account=null,passport=null,inFlight=false;
 function message(text,error=false){const status=$('[data-hp-status]',host);if(status){status.textContent=text;status.setAttribute('role',error?'alert':'status')}}
 async function permission(){if(!window.SST_HEALTH_CONSENT?.ensure)throw Error('Open Settings to review optional health tracking before saving.');if(!await SST_HEALTH_CONSENT.ensure())throw Error('Nothing was saved because optional health tracking was not agreed.');}
 function render(){
  const p=passport,b=p.baseline,d=draft();
  if(d&&d.accountId!==null&&d.accountId!==account.id){clearDraft();}
  const kept=draft();if(kept&&kept.accountId===null){kept.accountId=account.id;try{sessionStorage.setItem(KEY,JSON.stringify(kept))}catch{}}
  const starts=p.records.filter(r=>r.record_type==='start_here'),treatments=p.records.filter(r=>r.record_type==='treatment');
  const open=$('details',host)?.open||!!kept||new URLSearchParams(location.search).get('passport')==='1';
  host.innerHTML='<details class="hp-card" '+(open?'open':'')+'><summary><span>MY TIMBER · HEALTH PASSPORT</span><strong>Your story, without starting again.</strong><small>Starting point, saved choices, results and treatment history.</small></summary><div class="hp-content">'+
   '<p class="hp-limits">Your private personal record. Self-reported information and provider records are labelled separately. This is not a prescription, clinical approval or a monitored medical record.</p>'+
   '<p data-hp-status role="status" aria-live="polite"></p>'+
   (kept?'<section class="hp-section hp-handoff"><h3>Bring your Start Here answers with you.</h3><p>From '+shortDate(kept.draft.createdAt)+'. Review these before saving to <strong>'+esc(account.email||account.firstName||'your signed-in account')+'</strong>.</p>'+answerView(kept.draft.answers)+'<label class="hp-confirm"><input type="checkbox" data-hp-confirm> Save these answers to this My Timber account for progress tracking and personalisation.</label><div class="hp-actions"><button type="button" data-hp-save-start disabled>Save my Start Here answers</button><button type="button" data-hp-discard>Do not keep these answers</button></div></section>':'')+
   '<section class="hp-section"><h3>Your starting point.</h3><p>From the same My Journey record you already use. Missing numbers stay missing; nothing is guessed.</p>'+pairs([['Journey started',esc(shortDate(b.recordedOn))],['Height',value(b.heightCm,'cm')],['Starting weight',value(b.startWeightKg,'kg')],['Current weight',value(b.currentWeightKg,'kg')],['Starting waist',value(b.startWaistCm,'cm')],['Current waist',value(b.currentWaistCm,'cm')]])+'<p>'+esc(b.reason||'Your personal reason has not been recorded yet.')+'</p><button type="button" data-hp-baseline>Update my Journey starting point</button></section>'+
   '<section class="hp-section"><h3>What you came here for.</h3>'+(starts.length?'<p class="hp-source">Start Here · member-selected preferences · '+shortDate(starts[0].created_at)+'</p>'+answerView(starts[0].payload.answers)+'<p>These are preferences, not confirmation that any medicine is suitable or available.</p>':'<p>No Start Here answers saved yet. The rest of your record works without them.</p>')+
   '<p><strong>Saved SHIFT Health priorities:</strong> '+esc(p.priorities.map(x=>priorityNames[x]||x).join(', ')||'None saved yet.')+'</p></section>'+
   '<section class="hp-section"><h3>Health MOT and results.</h3><p>Original sources and review status are retained. SHIFT does not turn a result into a diagnosis.</p>'+motView(p)+'</section>'+
   '<section class="hp-section"><h3>Your treatment and provider history.</h3><p>Record what you were prescribed elsewhere, a provider change or a pause. Editing this history does not change any treatment, prescription, order or reminder.</p>'+
   (p.currentTreatment?'<article class="hp-record"><p class="hp-source">Current My Timber treatment context · member reported</p><h4>'+esc(p.currentTreatment.medicine)+'</h4><p>'+esc(p.currentTreatment.dose)+' · '+esc(p.currentTreatment.status)+'</p><p>Recorded '+shortDate(p.currentTreatment.updated_at)+'. Provider not recorded in this source.</p></article>':'')+
   treatments.map(r=>'<article class="hp-record"><p class="hp-source">Personal history · member reported · revision '+r.revision+'</p><h4>'+esc(r.payload.medicine)+'</h4><p>'+esc(r.payload.dose||'Dose not recorded')+' · '+esc(r.payload.status)+'</p><p><strong>Provider:</strong> '+esc(r.payload.provider||'Not recorded')+'</p><p>'+shortDate(r.payload.startedOn)+' → '+(r.payload.endedOn?shortDate(r.payload.endedOn):'End date not recorded')+'</p><p>'+esc(r.payload.note)+'</p><div class="hp-actions"><button type="button" data-hp-edit="'+r.id+'">Edit entry</button><button type="button" data-hp-delete="'+r.id+'">Remove entry</button></div></article>').join('')+
   (!treatments.length?'<p>No personal treatment history saved yet.</p>':'')+'<button type="button" data-hp-add>Add a personal treatment entry</button><div data-hp-form-host></div>'+orderView(p)+'</section>'+
   '<section class="hp-section"><h3>Your dated measurements.</h3>'+measureView(p)+'</section>'+
   '<section class="hp-section"><h3>Your record. Your control.</h3><p>'+ (p.trackingConsent?'Optional health tracking is on.':'Optional health tracking is off. Existing records remain visible; new personal records cannot be saved until you opt in.')+' You can withdraw consent, export your data or erase optional tracking in Settings. Clinical and order records have separate retention rules.</p><p>This view shows up to 100 measurements and 50 records from each existing results or order source. The account export includes all saved Passport entries and available source results and orders.</p><div class="hp-actions"><a href="/member/settings">Privacy and export controls</a><button type="button" data-hp-reload>Reload my record</button></div></section></div></details>';
  const old=$('[data-hp-arrival]');if(kept&&!old){const arrival=document.createElement('aside');arrival.dataset.hpArrival='';arrival.className='hp-arrival';arrival.innerHTML='<strong>Your Start Here answers are ready to review.</strong> <button type="button">Open My Journey to save them</button>';$('.mp-tabs')?.after(arrival);$('button',arrival).onclick=()=>{$('[data-panel="journey"]')?.click();$('details',host).open=true;host.scrollIntoView({block:'start',behavior:'smooth'})}}else if(!kept)old?.remove();
  bind();
 }
 function motView(p){
  const questionnaires=p.mots.map(r=>'<article class="hp-record"><p class="hp-source">Member questionnaire · '+shortDate(r.createdAt)+'</p><h4>Health MOT</h4><p>Status: '+esc(r.status||'Not recorded')+'. Clinical approval is not asserted by this questionnaire.</p><details><summary>View saved questionnaire record</summary>'+Object.entries(r.answers||{}).map(([k,v])=>'<p><strong>'+esc(k)+':</strong> '+esc(typeof v==='string'?v:JSON.stringify(v))+'</p>').join('')+(r.outcome!==null?'<p><strong>Stored summary:</strong> '+esc(typeof r.outcome==='string'?r.outcome:JSON.stringify(r.outcome))+'</p>':'')+'</details></article>').join('');
  const results=p.results.map(r=>'<article class="hp-record"><p class="hp-source">Provider result · '+esc(r.provider||'Provider not recorded')+'</p><h4>Collected '+shortDate(r.collectedAt)+'</h4><p>Review status: <strong>'+esc(r.clinicalReview)+'</strong>. Saved '+shortDate(r.storedAt)+'.</p>'+((r.payload?.results||[]).map(x=>'<p><strong>'+esc(x.label||x.code)+':</strong> '+value(x.value,esc(x.unit||''))+' <small>Source status: '+esc(x.status||'unknown')+'</small></p>').join('')||'<p>No result values were supplied by this source.</p>')+'</article>').join('');
  return questionnaires+results||'<p>No Health MOT or provider results are recorded here yet. There are no sample results in your account.</p>';
 }
 function orderView(p){return '<h4>Orders recorded by SHIFT</h4><p>Order status is not proof that you started or took a medicine. An unrecorded provider is never guessed from today’s catalogue.</p>'+ (p.orders.length?p.orders.map(r=>'<article class="hp-record"><p class="hp-source">SHIFT order system · '+shortDate(r.created_at)+'</p><h4>'+esc(r.medicine_name)+' · '+esc(r.strength_label)+'</h4><p>Order '+esc(r.order_number)+': '+esc(r.status)+'. Clinical status: '+esc(r.clinical_status)+'.</p><p>Provider not recorded in this order snapshot.</p></article>').join(''):'<p>No SHIFT medicine orders recorded.</p>');}
 function measureView(p){if(!p.measurements.length)return '<p>No dated measurements saved yet. Your starting point above remains separate.</p>';return '<div class="hp-table"><table><caption>Saved measurements, newest first</caption><thead><tr><th>Date</th><th>Weight</th><th>Waist</th><th>Blood pressure</th><th>Source</th></tr></thead><tbody>'+p.measurements.map(r=>'<tr><td>'+shortDate(r.recorded_on)+'</td><td>'+value(r.weight_kg,'kg')+'</td><td>'+value(r.waist_cm,'cm')+'</td><td>'+(r.systolic!=null&&r.diastolic!=null?esc(r.systolic)+' / '+esc(r.diastolic):'Not recorded')+'</td><td>'+esc(r.source||'Not recorded')+'</td></tr>').join('')+'</tbody></table></div>';}
 function bind(){
  $('[data-hp-confirm]',host)?.addEventListener('change',e=>$('[data-hp-save-start]',host).disabled=!e.target.checked);
  $('[data-hp-save-start]',host)?.addEventListener('click',async e=>{e.target.disabled=true;try{const kept=draft();if(!kept||kept.accountId!==account.id)throw Error('These answers expired or the account changed. Nothing was saved.');await permission();await api('/records','POST',{expectedAccountId:account.id,type:'start_here',requestKey:kept.draft.id,payload:kept.draft});clearDraft();await load();message('Your Start Here answers are now saved to this My Timber account.')}catch(error){message(error.message,true);if(e.target.isConnected)e.target.disabled=!$('[data-hp-confirm]',host)?.checked;}});
  $('[data-hp-discard]',host)?.addEventListener('click',()=>{clearDraft();render();message('The temporary Start Here answers were removed. Nothing was saved.');});
  $('[data-hp-baseline]',host).onclick=()=>{const edit=$('[data-mj-edit]');if(edit){edit.click();$('[data-mj-form]')?.scrollIntoView({block:'start',behavior:'smooth'})}else{message('Use the My Journey setup above to add your starting point.');$('[data-mj-form]')?.scrollIntoView({block:'start',behavior:'smooth'})}};
  $('[data-hp-reload]',host).onclick=()=>load();$('[data-hp-add]',host).onclick=()=>editForm();
  $$('[data-hp-edit]',host).forEach(b=>b.onclick=()=>editForm(passport.records.find(r=>r.id===b.dataset.hpEdit)));
  $$('[data-hp-delete]',host).forEach(b=>b.onclick=async()=>{if(!confirm('Remove this personal entry? This does not cancel or change treatment.'))return;const r=passport.records.find(x=>x.id===b.dataset.hpDelete);b.disabled=true;try{await api('/records/'+r.id,'DELETE',{expectedAccountId:account.id,revision:r.revision});await load();message('Personal entry removed. Treatment and order records were not changed.')}catch(e){message(e.message,true);b.disabled=false}});
 }
 function editForm(record){
  const target=$('[data-hp-form-host]',host),p=record?.payload||{},requestKey=crypto.randomUUID();
  const field=(name,title,max)=>'<label>'+title+'<input name="'+name+'" maxlength="'+max+'" value="'+esc(p[name]||'')+'" '+(name==='medicine'?'required':'')+'></label>';
  target.innerHTML='<form class="hp-form"><h4>'+(record?'Correct your personal entry':'Add your own treatment history')+'</h4><p>Copy the medicine and dose from your own record. This form does not recommend a dose or change your prescription. Dates and provider are optional.</p><div class="hp-form-grid">'+field('medicine','Medicine name',100)+field('dose','Dose as recorded',80)+field('provider','Prescribing service or provider',120)+'<label>Status<select name="status">'+['current','paused','stopped','previous'].map(v=>'<option value="'+v+'" '+(p.status===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label><label>Started on<input type="date" name="startedOn" value="'+esc(p.startedOn||'')+'"></label><label>Ended on<input type="date" name="endedOn" value="'+esc(p.endedOn||'')+'"></label></div><label>Your note<textarea name="note" maxlength="600">'+esc(p.note||'')+'</textarea></label><p data-hp-form-status role="status" aria-live="polite"></p><div class="hp-actions"><button type="submit">Save personal entry</button><button type="button" data-hp-cancel>Cancel</button></div></form>';
  const f=$('form',target);$('[data-hp-cancel]',target).onclick=()=>target.replaceChildren();
  f.onsubmit=async e=>{e.preventDefault();const buttons=$$('button',f);buttons.forEach(b=>b.disabled=true);const payload=Object.fromEntries(new FormData(f));try{await permission();if(record)await api('/records/'+record.id,'PATCH',{expectedAccountId:account.id,payload,revision:record.revision});else await api('/records','POST',{expectedAccountId:account.id,type:'treatment',payload,requestKey});await load();message('Your personal treatment history was saved. No clinical or order details were changed.')}catch(error){$('[data-hp-form-status]',f).textContent=error.message;buttons.forEach(b=>b.disabled=false)}};
  f.querySelector('input').focus();
 }
 async function load(){
  if(inFlight||!host)return;inFlight=true;host.setAttribute('aria-busy','true');
  try{const data=await api();account=data.member;passport=data.passport;render()}
  catch(e){host.innerHTML='<section class="hp-card"><h3>Health Passport is unavailable.</h3><p role="alert">'+esc(e.status===401?'Please sign in to see your private record.':e.message)+'</p><p>Your existing Journey is not replaced.</p><button type="button" data-hp-retry>Retry</button></section>'; $('[data-hp-retry]',host).onclick=()=>load()}
  finally{inFlight=false;host.setAttribute('aria-busy','false')}
 }
 function mount(){
  const panel=$('#panel-journey');if(!panel||panel.getAttribute('aria-busy')==='true')return;
  if(host?.isConnected)return;
  host=document.createElement('section');host.className='hp-v1';host.dataset.healthPassport='v1';panel.append(host);load();
 }
 function boot(){
  if(/^\/start-here(?:\.html)?$/.test(location.pathname)){startHere();return;}
  if(!/^\/member\/dashboard(?:\.html)?$/.test(location.pathname))return;
  mount();new MutationObserver(mount).observe($('#panel-journey')||document.body,{childList:true,subtree:false,attributes:true,attributeFilter:['aria-busy']});
  document.addEventListener('sst:journey-rendered',mount);
  document.addEventListener('sst:health-interest-saved',()=>{if(host?.isConnected)load()});
  if(window.SST_API?.logout){const logout=SST_API.logout;SST_API.logout=async(...args)=>{const result=await logout(...args);clearDraft();host?.replaceChildren();account=null;passport=null;return result;};}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
export const passportClient='('+passportBrowser.toString()+')();';
