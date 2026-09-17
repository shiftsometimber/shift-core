import {areas,hasPersonalGoal,goalPresentation,goalChoices,summary,score,lifeBackState,dailyTrend} from '/assets/member-experience/life-back/model.mjs';
import icons from '/assets/member-experience/life-back/icons.mjs';
let state=lifeBackState(),draft=null,loaded=false,busy=false,pending=null,legacyEntries=[];
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=t=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/London'}).format(new Date(t));
const label=a=>a.id==='personal'?(hasPersonalGoal(state.goal)?state.goal:'What do you want to get back?'):a.label;
const areaIcon=a=>a.id==='personal'?goalPresentation(state.goal).icon:a.icon;
const prompt=a=>a.id==='personal'?goalPresentation(state.goal).prompt:a.prompt;
const change=n=>n===null?'STARTING POINT':n>0?'↑ UP '+n:n<0?'↓ DOWN '+Math.abs(n):'NO CHANGE';
const status=t=>$('#liveStatus').textContent=t;
function render(){
 const s=summary(state),last=state.entries.filter(e=>e.goalId===state.goalId).at(-1),prior=state.entries.filter(e=>e.goalId===state.goalId).at(-2);
 $('#overallScore').textContent=s.score??'—';$('#overallChange').textContent=s.score===null?'ADD A CHECK-IN':change(s.change);$('#ringValue').style.strokeDasharray=(s.score??0)+' 100';
 $('#scoreCaption').textContent=s.score===null?'A new goal. A fresh starting point.':'Latest check-in · six personal ratings, averaged.';
 $('#comparison').textContent=prior?'Compared with '+date(prior.at):'Your first complete check-in sets the baseline.';
 $('#currentDate').textContent=last?date(last.at):'Ready for your first entry';
 const art=goalPresentation(state.goal);$('.win-art').classList.toggle('family-goal',art.family);$('.win-art').innerHTML=art.family?'':icons[art.icon];
 $('#monthlyWin').textContent=state.win;

 $('#areaGrid').innerHTML=areas.map(a=>{const v=state.ratings[a.id],p=state.previous[a.id],diff=v===null||p===null?null:Math.round(v-p);return '<button class="area-card" data-area="'+a.id+'" aria-label="'+esc(label(a))+' — '+(v??'not rated')+' — view details"><div class="area-top"><span class="area-icon">'+icons[areaIcon(a)]+'</span><div><p class="area-name">'+esc(label(a))+'</p><div class="area-number">'+(v??'—')+'<small>/100</small></div><span class="change-pill">'+change(diff)+'</span></div></div><p class="area-description">'+esc(a.id==='personal'?'More of what matters to you.':a.description)+'</p></button>'}).join('');
 $('#scoreFormula').textContent=s.score===null?'Complete all six ratings to see your average.':'('+areas.map(a=>state.ratings[a.id]).join(' + ')+') ÷ 6 = '+s.score+' (rounded)';
 const trend=dailyTrend(state.entries,state.goalId).slice(-7);$('#trendChart').innerHTML=trend.length?trend.slice(-7).map(d=>'<div class="trend-day"><div style="--bar:'+d.value+'"><strong>'+Math.round(d.value)+'</strong></div><span>'+esc(d.label)+'</span><span>'+d.count+' '+(d.count===1?'entry':'entries')+'</span></div>').join(''):'<p class="empty-chart">Your first complete check-in starts your graph.</p>';
 $('#trendFeedback').textContent=trend.length<2?'A little history will help you spot your own patterns.':(()=>{const diff=Math.round(trend.at(-1).value-trend[0].value);return 'Your daily average is '+Math.abs(diff)+' points '+(diff>=0?'higher':'lower')+' than '+trend[0].label+'. This describes the moments you logged; it does not explain what caused the change.'})();
 $('#historyList').innerHTML=[...state.entries].reverse().map(e=>'<article class="history-entry"><time>'+esc(date(e.at))+'</time><strong>'+Math.round(score(e.ratings))+'/100 · '+esc(e.goal)+'</strong>'+(e.win?'<p>'+esc(e.win)+'</p>':'')+(e.shiftFeedback?'<p class="hint">Previous Shift: '+esc({'helped':'helped','not-fit':'did not fit','not-tried':'not tried yet','skip':'follow-up skipped'}[e.shiftFeedback.outcome]||'reviewed')+'</p>':'')+'</article>').join('');
 if(legacyEntries?.length)$('#historyList').insertAdjacentHTML('beforeend','<h3>Earlier Life Back entries</h3>'+legacyEntries.map(e=>'<article class="history-entry"><time>'+esc(e.date||e.updatedAt||'Earlier entry')+'</time><p>'+esc(e.note||'Earlier six-area check-in')+'</p><p class="hint">Recorded using the previous progress areas; kept outside your new score.</p></article>').join(''));
 $('#nextShiftLink').hidden=!state.nextShift;
 $('#draftNotice').hidden=!draft;$('#draftNotice').textContent=draft?'You have a draft. Open the check-in to continue.':'';
}
function renderFollowup(){
 const a=state.nextShift,box=$('#shiftFollowup');box.hidden=!a;
 if(!a){box.innerHTML='';return}
 box.innerHTML='<h3>Did your last Shift help?</h3><p><strong>'+esc(a.title)+'</strong></p><p>'+esc(a.detail)+'</p><p class="hint">'+(a.status==='done'?'You marked this done. ':a.status==='attempted'?'You marked this tried. ':'')+'No guilt for a messy week.</p><fieldset><legend>What happened?</legend>'+[['helped','It helped'],['not-fit','It did not fit my week'],['not-tried','I have not tried it yet'],['skip','Skip this question']].map(([v,t])=>'<label><input type="radio" name="shiftFeedback" value="'+v+'"'+((draft?.feedback||'skip')===v?' checked':'')+'> '+t+'</label>').join('')+'</fieldset>';
}
function readFollowup(){const a=state.nextShift;return a?{shiftFeedback:{shiftId:a.id,outcome:document.querySelector('input[name=shiftFeedback]:checked')?.value||'skip'}}:{}}
function readRatings(){return Object.fromEntries(areas.map(a=>{const raw=$('#rating-'+a.id).value.trim();return[a.id,raw===''?null:Number(raw)]}))}
function open(id){
 if(id==='checkinDialog'&&!hasPersonalGoal(state.goal))id='goalDialog';
 if(id==='checkinDialog'){
  const ratings=draft?.ratings||Object.fromEntries(areas.map(a=>[a.id,null]));
  $('#ratingInputs').innerHTML=areas.map(a=>'<div class="rating-row"><label for="rating-'+a.id+'">'+esc(label(a))+'</label><p>'+esc(prompt(a))+'</p><input id="rating-'+a.id+'" name="'+a.id+'" type="number" inputmode="numeric" min="0" max="100" step="1" value="'+(ratings[a.id]??'')+'" aria-label="'+esc(label(a))+' rating from 0 to 100"></div>').join('');
  $('#winInput').value=draft?.win||'';$('#checkinError').textContent='';
  renderFollowup();$('#supportNeed').value=draft?.supportNeed||state.supportNeed||'auto';
 }
 if(id==='goalDialog'){
  $('#goalChoices').innerHTML=goalChoices.map(g=>'<label><input type="radio" name="goal" value="'+esc(g)+'"'+(g===state.goal?' checked':'')+'>'+esc(g)+'</label>').join('');
  $('#customGoal').value=!hasPersonalGoal(state.goal)||goalChoices.includes(state.goal)?'':state.goal;$('#goalError').textContent='';
 }
 $('#'+id).showModal();
}
document.addEventListener('click',e=>{
 const d=e.target.closest('[data-dialog]');if(d)open(d.dataset.dialog);
 const c=e.target.closest('[data-close]');if(c)c.closest('dialog').close();

 const card=e.target.closest('[data-area]');if(card){if(card.dataset.area==='personal'&&!hasPersonalGoal(state.goal)){open('goalDialog');return}const a=areas.find(a=>a.id===card.dataset.area),v=state.ratings[a.id];$('#areaDetail').innerHTML='<span class="area-icon">'+icons[areaIcon(a)]+'</span><h2 id="areaTitle">'+esc(label(a))+'</h2><p class="measurement">'+(v??'Not rated')+(v===null?'':' <span>/100</span>')+'</p><p>'+esc(prompt(a))+'</p><p>'+esc(a.id==='personal'?'You chose this goal because it matters to you.':a.description)+'</p><p class="hint">Your own reflection. Each of the six areas has the same weight in your score.</p>';open('areaDialog')}
});
$('#rateArea').addEventListener('click',()=>{$('#areaDialog').close();open('checkinDialog')});
$('#checkinForm').addEventListener('submit',async e=>{e.preventDefault();if(busy||!loaded)return;const ratings=readRatings();if(score(ratings)===null||Object.values(ratings).some(v=>!Number.isInteger(v))){$('#checkinError').textContent='Rate all six areas from 0 to 100, or keep this as a draft.';return}try{await save({action:'checkin',goalId:state.goalId,ratings,win:$('#winInput').value,supportNeed:$('#supportNeed').value,...readFollowup()});draft=null;render();$('#checkinDialog').close();status('Check-in saved. Your next step is in My Next Shift on Today.');$('#nextShiftLink').hidden=false}catch(err){$('#checkinError').textContent=err.message}});
$('#saveDraft').addEventListener('click',()=>{draft={ratings:readRatings(),win:$('#winInput').value,supportNeed:$('#supportNeed').value,feedback:document.querySelector('input[name=shiftFeedback]:checked')?.value||'skip'};render();$('#checkinDialog').close();status('Draft kept on this page. Your saved score and history have not changed.')});
$('#goalForm').addEventListener('submit',async e=>{e.preventDefault();if(busy||!loaded)return;try{const goal=$('#customGoal').value.trim()||document.querySelector('input[name=goal]:checked')?.value||'';if(!goal)throw Error('Choose or write a goal.');await save({action:'goal',revision:state.revision,goal});draft=null;render();$('#goalDialog').close();status('Personal goal saved. Your previous history stays in your account.')}catch(err){$('#goalError').textContent=err.message}});
$('#customGoal').addEventListener('input',()=>{if($('#customGoal').value.trim())document.querySelectorAll('input[name=goal]').forEach(i=>i.checked=false)});
$('#goalChoices').addEventListener('change',()=>$('#customGoal').value='');
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icons[el.dataset.icon]);
async function request(path,body){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),20000);try{const r=await fetch(path,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:ctrl.signal});const data=await r.json();if(!r.ok)throw Object.assign(Error(r.status===401?'Sign in to open your private Life Back history.':data.error||data.message||'Could not save. Please retry.'),{status:r.status,code:data.code});return data}catch(e){if(e.name==='AbortError')throw Error('The request timed out. Retry the same check-in to check its saved result.');throw e}finally{clearTimeout(timer)}}
window.SST_API=window.SST_API||{};
SST_API.getConsents=()=>request('/v1/consents');SST_API.saveConsent=b=>request('/v1/consents',b);
function lock(){document.querySelectorAll('[data-dialog],form button,form input,form textarea,form select').forEach(el=>el.disabled=busy||!loaded)}
async function save(body){busy=true;lock();try{if(!window.SST_HEALTH_CONSENT)throw Error('Health-data controls are loading. Please try again.');if(!await SST_HEALTH_CONSENT.ensure())throw Error('Your check-in was not saved because optional tracking is off.');const sig=JSON.stringify(body);if(!pending||pending.sig!==sig)pending={sig,body:{...body,operationId:crypto.randomUUID()}};const r=await request('/v1/life-back',pending.body);state=lifeBackState(r.progress);pending=null;}catch(e){if(e.status===409)pending=null;throw e}finally{busy=false;lock()}}
function measurements(j){const w=j.weight||{},wa=j.waist||{};for(const [id,current,start,unit]of [['weight',w.currentKg,w.startKg,'kg'],['waist',wa.currentCm,wa.startCm,'cm']]){const value=typeof current==='number'?current:null;$('#'+id+'Value').textContent=value===null?'Not recorded':value+' '+unit;$('#'+id+'Change').textContent=value!==null&&typeof start==='number'?(value-start).toFixed(1)+' '+unit+' from your starting point':'Add measurements in Journey';}$('#measurementWin').textContent=j.clothes?.milestone||'Your own milestones will appear here.'}
async function load(){busy=true;loaded=false;lock();status('Loading your private history…');try{const r=await request('/v1/life-back');state=lifeBackState(r.progress);legacyEntries=Array.isArray(r.legacyEntries)?r.legacyEntries:[];loaded=true;render();measurements(r.journey||{});$('#journeyView').hidden=false;$('#accountError').hidden=true;status('');if(location.hash==='#check-in')open('checkinDialog');}catch(e){$('#journeyView').hidden=true;$('#accountError').hidden=false;$('#accountErrorText').textContent=e.message;status('')}finally{busy=false;lock()}}
$('#reloadHistory').addEventListener('click',load);load();
