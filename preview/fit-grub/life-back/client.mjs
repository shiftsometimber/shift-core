import {areas,sample,goalChoices,summary,score,recordCheckin,setGoal,dailyTrend} from '/life-back-model.mjs';
import icons from '/life-back-icons.mjs';
let state=structuredClone(sample),draft=null;
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=t=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/London'}).format(new Date(t));
const label=a=>a.id==='personal'?state.goal:a.label;
const change=n=>n===null?'STARTING POINT':n>0?'↑ UP '+n:n<0?'↓ DOWN '+Math.abs(n):'NO CHANGE';
const status=t=>$('#liveStatus').textContent=t;
function render(){
 const s=summary(state),last=state.entries.filter(e=>e.goalId===state.goalId).at(-1),prior=state.entries.filter(e=>e.goalId===state.goalId).at(-2);
 $('#overallScore').textContent=s.score??'—';$('#overallChange').textContent=s.score===null?'ADD A CHECK-IN':change(s.change);$('#ringValue').style.strokeDasharray=(s.score??0)+' 100';
 $('#scoreCaption').textContent=s.score===null?'A new goal. A fresh starting point.':'Latest check-in · six personal ratings, averaged.';
 $('#comparison').textContent=prior?'Compared with '+date(prior.at):'Your first complete check-in sets the baseline.';
 $('#currentDate').textContent=last?date(last.at):'Ready for your first entry';
 $('#monthlyWin').textContent=state.win;$('#todayWin').textContent=state.win;$('#todayScore').innerHTML=(s.score??'—')+' <span>/100</span>';
 $('#todayChange').textContent=s.change===null?'Your starting point, at your own pace.':Math.abs(s.change)+' points '+(s.change>=0?'above':'below')+' your previous check-in.';
 $('#areaGrid').innerHTML=areas.map(a=>{const v=state.ratings[a.id],p=state.previous[a.id],diff=v===null||p===null?null:Math.round(v-p);return '<button class="area-card" data-area="'+a.id+'" aria-label="'+esc(label(a))+' — '+(v??'not rated')+' — view details"><div class="area-top"><span class="area-icon">'+icons[a.icon]+'</span><div><p class="area-name">'+esc(label(a))+'</p><div class="area-number">'+(v??'—')+'<small>/100</small></div><span class="change-pill">'+change(diff)+'</span></div></div><p class="area-description">'+esc(a.id==='personal'?'More of what matters to you.':a.description)+'</p></button>'}).join('');
 $('#scoreFormula').textContent=s.score===null?'Complete all six ratings to see your average.':'('+areas.map(a=>state.ratings[a.id]).join(' + ')+') ÷ 6 = '+s.score+' (rounded)';
 const trend=dailyTrend(state.entries,state.goalId).slice(-7);$('#trendChart').innerHTML=trend.length?trend.slice(-7).map(d=>'<div class="trend-day"><div style="--bar:'+d.value+'"><strong>'+Math.round(d.value)+'</strong></div><span>'+esc(d.label)+'</span><span>'+d.count+' '+(d.count===1?'entry':'entries')+'</span></div>').join(''):'<p class="empty-chart">Your first complete check-in starts your graph.</p>';
 $('#trendFeedback').textContent=trend.length<2?'A little history will help you spot your own patterns.':(()=>{const diff=Math.round(trend.at(-1).value-trend[0].value);return 'Your daily average is '+Math.abs(diff)+' points '+(diff>=0?'higher':'lower')+' than '+trend[0].label+'. This describes the moments you logged; it does not explain what caused the change.'})();
 $('#historyList').innerHTML=[...state.entries].reverse().map(e=>'<article class="history-entry"><time>'+esc(date(e.at))+'</time><strong>'+Math.round(score(e.ratings))+'/100 · '+esc(e.goal)+'</strong>'+(e.win?'<p>'+esc(e.win)+'</p>':'')+'</article>').join('');
 $('#draftNotice').hidden=!draft;$('#draftNotice').textContent=draft?'You have a sample draft. Open the check-in to continue.':'';
}
function readRatings(){return Object.fromEntries(areas.map(a=>{const raw=$('#rating-'+a.id).value.trim();return[a.id,raw===''?null:Number(raw)]}))}
function open(id){
 if(id==='checkinDialog'){
  const ratings=draft?.ratings||state.ratings;
  $('#ratingInputs').innerHTML=areas.map(a=>'<div class="rating-row"><label for="rating-'+a.id+'">'+esc(label(a))+'</label><p>'+esc(a.prompt)+'</p><input id="rating-'+a.id+'" name="'+a.id+'" type="number" inputmode="numeric" min="0" max="100" step="1" value="'+(ratings[a.id]??'')+'" aria-label="'+esc(label(a))+' rating from 0 to 100"></div>').join('');
  $('#winInput').value=draft?.win||'';$('#checkinError').textContent='';
 }
 if(id==='goalDialog'){
  $('#goalChoices').innerHTML=goalChoices.map(g=>'<label><input type="radio" name="goal" value="'+esc(g)+'"'+(g===state.goal?' checked':'')+'>'+esc(g)+'</label>').join('');
  $('#customGoal').value=goalChoices.includes(state.goal)?'':state.goal;$('#goalError').textContent='';
 }
 $('#'+id).showModal();
}
document.addEventListener('click',e=>{
 const d=e.target.closest('[data-dialog]');if(d)open(d.dataset.dialog);
 const c=e.target.closest('[data-close]');if(c)c.closest('dialog').close();
 const v=e.target.closest('[data-view]');if(v){const today=v.dataset.view==='today';$('#todayView').hidden=!today;$('#journeyView').hidden=today;document.querySelectorAll('.member-nav [data-view]').forEach(b=>{const active=b.dataset.view===v.dataset.view;b.classList.toggle('active',active);active?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current')});window.scrollTo({top:0,behavior:'auto'})}
 const card=e.target.closest('[data-area]');if(card){const a=areas.find(a=>a.id===card.dataset.area),v=state.ratings[a.id];$('#areaDetail').innerHTML='<span class="area-icon">'+icons[a.icon]+'</span><h2 id="areaTitle">'+esc(label(a))+'</h2><p class="measurement">'+(v??'Not rated')+(v===null?'':' <span>/100</span>')+'</p><p>'+esc(a.prompt)+'</p><p>'+esc(a.id==='personal'?'You chose this goal because it matters to you.':a.description)+'</p><p class="hint">Your own reflection. Each of the six areas has the same weight in your score.</p>';open('areaDialog')}
});
$('#rateArea').addEventListener('click',()=>{$('#areaDialog').close();open('checkinDialog')});
$('#checkinForm').addEventListener('submit',e=>{e.preventDefault();if(!$('#checkinDialog').open)return;try{state=recordCheckin(state,readRatings(),$('#winInput').value);draft=null;render();$('#checkinDialog').close();status('Sample check-in added to your history and daily graph. No account changed.')}catch(err){$('#checkinError').textContent=err.message}});
$('#saveDraft').addEventListener('click',()=>{draft={ratings:readRatings(),win:$('#winInput').value};render();$('#checkinDialog').close();status('Draft kept on this page. Your score and history have not changed.')});
$('#goalForm').addEventListener('submit',e=>{e.preventDefault();try{state=setGoal(state,$('#customGoal').value.trim()||document.querySelector('input[name=goal]:checked')?.value||'');draft=null;render();$('#goalDialog').close();status('Personal goal updated. Add a complete check-in to start its baseline.')}catch(err){$('#goalError').textContent=err.message}});
$('#customGoal').addEventListener('input',()=>{if($('#customGoal').value.trim())document.querySelectorAll('input[name=goal]').forEach(i=>i.checked=false)});
$('#goalChoices').addEventListener('change',()=>$('#customGoal').value='');
$('#resetSample').addEventListener('click',()=>{state=structuredClone(sample);draft=null;render();status('Original sample restored.')});
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icons[el.dataset.icon]);
render();
