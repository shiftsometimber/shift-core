
(function(){
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let context=null,today=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function status(id,msg,error=false){const e=$(id);if(!e)return;e.className='mp-status'+(error?' error':'');e.textContent=msg}
function pretty(x){return JSON.stringify(x,null,2)}
function guidanceText(value){if(value==null)return'';if(typeof value==='string')return value;if(Array.isArray(value))return value.map(guidanceText).filter(Boolean).join(' · ');return guidanceText(value.instruction||value.name||value.title||value.note||value.description)}
function guidanceList(values){const rows=(Array.isArray(values)?values:[values]).map(guidanceText).filter(Boolean);return rows.length?`<ul>${rows.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}



function recipeBlock(m){
 const ing=m.recipe?.ingredients||m.ingredients||[],method=m.recipe?.method||m.method||[];
 const meta=[];
 if(m.recipe?.servings)meta.push(`${esc(m.recipe.servings)} serving${Number(m.recipe.servings)===1?'':'s'}`);
 if(m.recipe?.minutes)meta.push(`about ${esc(m.recipe.minutes)} minutes`);
 if((m.recipe?.equipment||[]).length)meta.push(`equipment: ${esc(m.recipe.equipment.join(', '))}`);
 return `<details class="mp-recipe"><summary>Full recipe & cooking method</summary>
 ${meta.length?`<div class="mp-mini mp-recipe-meta">${meta.map(x=>`<span>${x}</span>`).join('')}</div>`:''}
 <div class="mp-recipe-grid"><div><strong>You'll need</strong><ul>${ing.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
 <div><strong>How to make it</strong><ol>${method.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div></div>
 ${m.recipe?.storage?`<p class="mp-recipe-note"><strong>Leftovers:</strong> ${esc(m.recipe.storage)}</p>`:''}
 ${(m.recipe?.substitutions||[]).length?`<div class="mp-recipe-note"><strong>Easy swaps</strong>${guidanceList(m.recipe.substitutions)}</div>`:''}
 ${(m.recipe?.food_safety||[]).length?`<div class="mp-recipe-note mp-food-safe"><strong>Cook it safely</strong>${guidanceList(m.recipe.food_safety)}</div>`:''}
 ${m.recipe?.nutrition_basis?`<p class="mp-recipe-note mp-muted"><strong>Nutrition:</strong> ${esc(m.recipe.nutrition_basis)}</p>`:''}
 </details>`;
}
function mealCard(m,dayIndex=0){
 return `<div class="mp-plan mp-meal" data-meal-id="${esc(m.id||'')}" data-meal-type="${esc(m.type||'meal')}" data-day="${dayIndex}">
 <div class="mp-card-top"><span class="mp-badge">${esc(m.type||'meal')}</span><span class="mp-time">${m.recipe?.minutes?esc(m.recipe.minutes)+' min':''}</span></div>
 <h3>${esc(m.name||'Meal')}</h3>
 <div class="mp-mini">${m.kcal!=null?`<span>${esc(m.kcal)} kcal</span>`:''}${m.protein!=null?`<span>${esc(m.protein)}g protein</span>`:''}${m.fibre!=null?`<span>${esc(m.fibre)}g fibre</span>`:''}</div>
 ${recipeBlock(m)}
 <div class="mp-vote"><button class="mp-yay" data-vote="yay">👍 Yay — keep it</button><button class="mp-nay" data-vote="nay">👎 Nay — swap it</button></div></div>`;
}
function renderGrub(r){
 const p=r?.plan||r||{};
 if(Array.isArray(p.days)){
   return `<div class="mp-summary-card mp-feature"><div><span class="eyebrow">SHIFT GRUB</span><h3>${esc(p.days_requested)}-day menu</h3><p>Built around your calorie/protein guide. Don't fancy something? Hit Nay and Shift swaps that meal, not the whole plan.</p></div>
   <div class="mp-mini"><span>${esc(p.targets?.calories)} kcal guide</span><span>${esc(p.targets?.protein_g)}g protein guide</span></div></div>`+
   p.days.map((d,di)=>`<section class="mp-day"><div class="mp-day-head"><strong>Day ${esc(d.day)}</strong><span>${esc(d.date)}</span><span>${esc(d.totals?.kcal)} kcal · ${esc(d.totals?.protein_g)}g protein</span></div><div class="mp-card-grid">${(d.meals||[]).map(m=>mealCard(m,di)).join('')}</div></section>`).join('');
 }
 return '<p class="mp-muted">No menu returned.</p>';
}

const approvedFitVisuals=Object.freeze(Object.fromEntries([
 'chair-balance-reach','row','reverse-lunge','sit-to-stand','plank','calf-raise','stationary-bike','triceps-extension','dead-bug','lat-pulldown','shadow-boxing','walk','hamstring-mobility','chest-press','thoracic-rotation','overhead-press','hip-hinge','rowing-erg','squat','loaded-carry','hip-flexor-mobility','wall-slides','glute-bridge','low-impact-march','push-up','step-up'
].map(id=>[id,`/assets/fit/premium/${id}.svg`])));
function exerciseVisual(x){
 const mapped=approvedFitVisuals[String(x.id||x.slug||'')];
 const governed=x.visual?.asset_ref?'/'+String(x.visual.asset_ref).replace(/^\/+/, ''):'';
 const candidate=x.visual_url||x.visualUrl||x.approved_visual_url||governed||mapped;
 if(!candidate)return '';
 try{const url=new URL(candidate,location.origin);if(url.protocol!=='https:'&&url.origin!==location.origin)return '';return `<div class="mp-exercise-figure"><img src="${esc(url.href)}" alt="${esc(x.visual_alt||`${x.name||'Exercise'} demonstration`)}" loading="lazy" decoding="async"></div>`;}catch{return ''}
}
function exerciseCard(x){
 const bits=[];if(x.sets)bits.push(`${esc(x.sets)} sets`);if(x.reps)bits.push(`${esc(x.reps)} reps`);if(x.minutes)bits.push(`${esc(x.minutes)} min`);if(x.rest_seconds)bits.push(`${esc(x.rest_seconds)} sec rest`);
 return `<div class="mp-exercise" data-exercise-id="${esc(x.id||'')}" data-exercise-group="${esc(x.group||'')}" data-exercise-minutes="${esc(x.minutes||'')}">
 ${exerciseVisual(x)}
 <div class="mp-exercise-copy"><h3>${esc(x.name)}</h3>${bits.length?`<div class="mp-mini">${bits.map(v=>`<span>${v}</span>`).join('')}</div>`:''}
 ${x.notes?`<p>${esc(x.notes)}</p>`:''}
 ${(x.how||[]).length?`<details class="mp-how"><summary>Show me how</summary><ol>${x.how.map(y=>`<li>${esc(y)}</li>`).join('')}</ol>${(x.form_cues||[]).length?`<strong>What good form feels like</strong>${guidanceList(x.form_cues)}`:''}${(x.safety_cues||[]).length?`<strong>Watch out for</strong>${guidanceList(x.safety_cues)}`:''}</details>`:''}
 ${(x.regressions||[]).length||(x.progressions||[]).length||(x.substitutions||[]).length?`<details class="mp-how mp-options"><summary>Make it easier, harder or swap it</summary>${(x.regressions||[]).length?`<strong>Easier</strong>${guidanceList(x.regressions)}`:''}${(x.progressions||[]).length?`<strong>Harder</strong>${guidanceList(x.progressions)}`:''}${(x.substitutions||[]).length?`<strong>Alternative</strong>${guidanceList(x.substitutions)}`:''}</details>`:''}
 <div class="mp-vote mp-fit-vote"><button class="mp-yay" data-fit-vote="yay">👍 Yay — keep it</button><button class="mp-nay" data-fit-vote="nay">👎 Nay — swap it</button></div></div></div>`;
}
function renderFit(r){
 const p=r?.plan||r||{},sessions=p.sessions||[];
 return `<div class="mp-summary-card mp-feature"><div><span class="eyebrow">SHIFT FIT</span><h3>${esc(p.days_requested||sessions.length)} sessions · ${esc(p.minutes_per_day||sessions[0]?.requested_minutes||sessions[0]?.estimated_minutes||'—')} mins each</h3><p>Built to the time you've actually got, where you are and what you have available — not padded with more of the same exercise.</p></div><div class="mp-mini">${p.location?`<span>${esc(p.location)}</span>`:''}${(p.equipment||[]).length?`<span>${esc(p.equipment.join(', '))}</span>`:''}</div></div>`+
 sessions.map(x=>`<section class="mp-day"><div class="mp-day-head"><strong>Day ${esc(x.day)} · ${esc(x.title)}</strong><span>${esc(x.estimated_minutes)} mins planned${x.requested_minutes&&Number(x.requested_minutes)!==Number(x.estimated_minutes)?` · ${esc(x.requested_minutes)} available`:''}</span></div><div class="mp-exercises">${(x.exercises||[]).map(exerciseCard).join('')}</div><p class="mp-progress-tip"><strong>Next time:</strong> ${esc(x.progression||'Build gradually.')}</p></section>`).join('')+
 `<p class="mp-safety">${esc(p.rule||'')}</p>`;
}
function renderHydration(r){
 const p=r?.plan||r||{},schedule=p.schedule||[],drinks=p.drinks||[];
 return `<div class="mp-water-hero"><div><span class="eyebrow">YOUR DAILY GUIDE</span><div class="metric">${p.guide_litres??(p.guide_ml?(p.guide_ml/1000).toFixed(1):'—')}L</div><p>It doesn't all have to be plain water.</p></div></div>
 <div class="mp-hydration-grid">${schedule.map(x=>`<div class="mp-hydration-step"><strong>${esc(x.when)}</strong><span>${esc(x.ml)} ml</span></div>`).join('')}</div>
 ${drinks.length?`<h3 class="mp-subhead">What counts?</h3><div class="mp-drink-grid">${drinks.map(d=>`<div class="mp-drink ${d.counts?'yes':'no'}"><strong>${d.counts?'✓':'×'} ${esc(d.drink)}</strong><p>${esc(d.note)}</p></div>`).join('')}</div>`:''}
 <p class="mp-muted">${esc(p.note||'')}</p>`;
}
function renderConundrum(r){
 const ideas=r?.top||r?.ideas||r?.suggestions||r?.recipes||[];
 if(!ideas.length){
   return `<div class="mp-summary-card"><strong>No invented ingredients.</strong><p>Shift could not find a strong recipe match from that exact list. Add a few basics you genuinely have — for example bread, rice, pasta, potatoes, yoghurt, tomatoes or chicken — and try again.</p></div>`;
 }
 return `<div class="mp-summary-card"><strong>Based on what you actually listed</strong><p>${esc(r?.message||'')}</p></div>
 <div class="mp-card-grid">${ideas.map((m,i)=>`<div class="mp-plan"><span class="mp-badge">Idea ${i+1}</span><h3>${esc(m.name||m.title||'Meal idea')}</h3>
 ${m.kcal!=null||m.protein!=null?`<div class="mp-mini">${m.kcal!=null?`<span>${esc(m.kcal)} kcal</span>`:''}${m.protein!=null?`<span>${esc(m.protein)}g protein</span>`:''}</div>`:''}
 ${(m.matched||m.uses)?.length?`<p><strong>Uses:</strong> ${esc((m.matched||m.uses).join(', '))}</p>`:''}
 ${m.missing_note||m.missing?.length?`<p class="mp-muted">${esc(m.missing_note||('You would still need: '+m.missing.join(', ')))}</p>`:''}${recipeBlock(m)}</div>`).join('')}</div>`;
}
function renderObject(obj){
 if(!obj)return '<p class="mp-muted">Nothing active yet.</p>';
 const p=obj.plan||obj;
 if(p.kind==='shift_grub_plan'||p.kind==='shift_grub_day'||Array.isArray(p.days)&&p.targets?.calories!=null)return renderGrub(obj);
 if(p.kind==='shift_fit_plan'||p.kind==='shift_fit_plan_v4'||p.kind==='shift_fit_week'||Array.isArray(p.sessions))return renderFit(obj);
 if(p.kind==='shift_hydration_plan'||p.guide_ml!=null)return renderHydration(obj);
 if(obj.mode==='fridge_freezer_cupboard'||obj.mode==='use_what_you_have')return renderConundrum(obj);
 if(Array.isArray(obj))return obj.length?obj.map(x=>`<div class="mp-plan">${typeof x==='object'?renderObject(x):esc(x)}</div>`).join(''):'<p class="mp-muted">Nothing active yet.</p>';
 if(typeof obj!=='object')return `<p>${esc(obj)}</p>`;
 return `<details><summary>Technical details</summary><pre>${esc(pretty(obj))}</pre></details>`;
}
function kgFromInputs(){
 const unit=$('#photoWeightUnit')?.value||'stone';
 if(unit==='kg')return Number($('#photoWeightKg')?.value)||null;
 if(unit==='lb')return (Number($('#photoWeightLbOnly')?.value)||0)*0.45359237||null;
 const st=Number($('#photoWeightStone')?.value)||0,lb=Number($('#photoWeightPounds')?.value)||0;
 return (st*14+lb)*0.45359237||null;
}
function formatWeightKg(kg){
 if(!kg)return '';
 const unit=localStorage.getItem('shiftWeightUnit')||'stone';
 if(unit==='kg')return `${Number(kg).toFixed(1)} kg`;
 const pounds=Number(kg)/0.45359237;
 if(unit==='lb')return `${Math.round(pounds)} lb`;
 const rounded=Math.round(pounds),st=Math.floor(rounded/14),lb=rounded%14; return `${st} st ${lb} lb`;
}
function syncWeightInputs(){
 const unit=$('#photoWeightUnit')?.value||'stone';localStorage.setItem('shiftWeightUnit',unit);
 ['photoWeightStoneWrap','photoWeightKgWrap','photoWeightLbWrap'].forEach(id=>{const e=$('#'+id);if(e)e.style.display='none'});
 const target=unit==='kg'?'#photoWeightKgWrap':unit==='lb'?'#photoWeightLbWrap':'#photoWeightStoneWrap';if($(target))$(target).style.display='grid';
}
function activate(name){$$('.mp-tab').forEach(x=>x.classList.toggle('active',x.dataset.panel===name));$$('.mp-panel').forEach(x=>x.classList.toggle('active',x.id==='panel-'+name));history.replaceState(null,'','#'+name)}
async function load(){
 try{
  await SST_API.getMe();
  [context,today]=await Promise.all([SST_API.getShiftContext(),SST_API.getShiftToday()]);
  const c=context.context||context; const t=today.today||today;
  $('#mpName').textContent=c?.profile?.identity?.first_name||'mate';
  const todayPanel=$('#panel-today');
  const todayHeadline=todayPanel?.querySelector(':scope > h2');
  const todaySubhead=todayPanel?.querySelector(':scope > .mp-muted');
  if(todayHeadline&&t?.headline)todayHeadline.textContent=t.headline;
  if(todaySubhead&&t?.subhead)todaySubhead.textContent=t.subhead;
  $('#metricCalories').textContent=t?.summary?.calories_left??'—';
  $('#metricProtein').textContent=(t?.summary?.protein_left??'—')+(t?.summary?.protein_left!=null?'g':'');
  $('#metricSteps').textContent=t?.summary?.step_gap??'—';
  $('#metricWater').textContent=t?.summary?.water_guide_ml?Math.round(t.summary.water_guide_ml/100)/10+'L':'—';
  $('#todayActions').innerHTML=(t?.actions||[]).map(a=>`<div class="mp-plan"><span class="mp-badge">${esc(a.domain)}</span><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></div>`).join('')||'<p>No actions yet.</p>';
  renderPlans(c?.plans||{});
 }catch(e){if(e.status===401){location.replace('/member-login.html');return}status('#globalStatus',e.message||'Could not load My Shift.',true)}
}
async function renderPlans(plans){
 try{const r=await SST_API.getPlanList();const groups=r.plans||r;const current=groups.current||[];const replaced=groups.replaced||[];let html=current.map(x=>`<div class="mp-plan"><span class="mp-badge">CURRENT · ${esc(x.type)}</span><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p><small>Started ${esc(x.starts_on||'')}</small></div>`).join('');if(replaced.length)html+=`<details class="mp-recipe"><summary>${replaced.length} replaced plan${replaced.length===1?'':'s'}</summary>${replaced.slice(0,8).map(x=>`<div class="mp-plan"><span class="mp-badge">REPLACED · ${esc(x.type)}</span><strong>${esc(x.title)}</strong><p>${esc(x.summary)}</p></div>`).join('')}</details>`;$('#activePlans').innerHTML=html||'<p class="mp-muted">Generate a Grub, Fit or hydration plan and it will appear here.</p>';}catch(e){const entries=Object.entries(plans||{});$('#activePlans').innerHTML=entries.length?entries.map(([k,v])=>`<div class="mp-plan"><span class="mp-badge">${esc(k)}</span>${renderObject(v)}</div>`).join(''):'<p class="mp-muted">No active plans yet.</p>';}
}
async function run(btn,fn,statusId,outId,label){
 btn.disabled=true;status(statusId,label+'…');
 try{const r=await fn();status(statusId,label+' complete.');if(outId)$(outId).innerHTML=renderObject(r);await refreshContext()}
 catch(e){status(statusId,e.message||'Something went wrong.',true)}
 finally{btn.disabled=false}
}
async function refreshContext(){context=await SST_API.getShiftContext();await renderPlans((context.context||context)?.plans||{})}


function renderHydrationToday(r){const d=r||{};const target=Number((today?.today||today)?.summary?.water_guide_ml||0);const contribution=Number(d.hydration_contribution_ml||0);$('#hydrationCards').innerHTML=`<div class="mp-card"><small>Logged today</small><span class="metric">${Math.round(Number(d.logged_ml||0)/100)/10}L</span></div><div class="mp-card"><small>Counts toward hydration</small><span class="metric">${Math.round(contribution/100)/10}L</span></div><div class="mp-card"><small>Current guide</small><span class="metric">${target?Math.round(target/100)/10+'L':'—'}</span></div>`;$('#drinkHistory').innerHTML=(d.drinks||[]).length?(d.drinks||[]).slice().reverse().map(x=>`<div class="mp-plan"><strong>${esc(x.label||x.drink_type)}</strong> · ${esc(x.volume_ml)} ml${x.contribution_ml!==x.volume_ml?` · ${esc(x.contribution_ml)} ml toward target`:''}<p class="mp-muted">${esc(x.note||'')}</p></div>`).join(''):'<p class="mp-muted">No drinks logged today yet.</p>';}
async function loadHydration(){try{const r=await SST_API.getHydrationToday();renderHydrationToday(r);}catch(e){status('#waterStatus',e.message||'Could not load today’s drinks.',true)}}
async function logDrink(){const btn=$('#drinkLog');btn.disabled=true;status('#waterStatus','Logging drink…');try{const type=$('#drinkType').value,ml=Number($('#drinkMl').value);await SST_API.logHydration({type,ml});status('#waterStatus','Logged. No hydration theatre required.');await loadHydration();}catch(e){status('#waterStatus',e.message||'Could not log that drink.',true)}finally{btn.disabled=false}}


async function resizedPhoto(file){
 const bitmap=await createImageBitmap(file);const max=700;const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
 const w=Math.max(256,Math.round(bitmap.width*scale)),h=Math.max(256,Math.round(bitmap.height*scale));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 canvas.getContext('2d').drawImage(bitmap,0,0,w,h);bitmap.close?.();
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.9));
 return new File([blob],'shift-progress.jpg',{type:'image/jpeg'});
}
const visualMap={'+10':'visualPlus10','-5':'visualMinus5','-10':'visualMinus10','-15':'visualMinus15','-20':'visualMinus20','-25':'visualMinus25'};
async function generateVisual(direction){
 const input=$('#photoInput'),file=input.files?.[0];if(!file)return status('#visualStatus','Choose a photo first.',true);
 if(!$('#visualConsent').checked)return status('#visualStatus','Please confirm the illustration consent first.',true);
 const btn=$(`[data-visual="${direction}"]`); if(btn)btn.disabled=true;
 status('#visualStatus','Creating '+direction+'% illustrative view…');
 try{
  const resized=await resizedPhoto(file);const r=await SST_API.visualise(resized,direction);
  const src='data:'+((r.visualisation&&r.visualisation.mime)||'image/png')+';base64,'+r.visualisation.imageBase64;
  const img=$('#'+visualMap[direction]);img.src=src;img.style.display='block';
  status('#visualStatus',r.disclaimer||'Visualisation ready. This is illustrative, not a prediction.');
 }catch(e){status('#visualStatus',e.message||'We could not create the visualisation.',true)}
 finally{if(btn)btn.disabled=!$('#visualConsent').checked}
}
async function saveOriginal(){
 const file=$('#photoInput').files?.[0];if(!file)return status('#visualStatus','Choose a photo first.',true);
 if(!$('#savePhotoConsent').checked)return status('#visualStatus','Please confirm that you want this real photo stored in My Shift.',true);
 const btn=$('#saveOriginal');btn.disabled=true;status('#visualStatus','Saving your real progress photo…');
 try{
  const resized=await resizedPhoto(file);
  const weightKg=kgFromInputs();let waistCm=Number($('#photoWaist').value)||null;
 if(waistCm&&$('#photoWaistUnit')?.value==='in')waistCm=waistCm*2.54;
  await SST_API.saveProgressPhoto(resized,{weightKg,waistCm,source:'upload'});
  status('#visualStatus','Original progress photo saved to My Shift.',false);
  await loadSavedPhotos();
 }catch(e){status('#visualStatus',e.message||'We could not save the progress photo.',true)}
 finally{btn.disabled=false}
}
async function loadSavedPhotos(){
 const box=$('#savedPhotos'); if(!box)return;
 try{
  const r=await SST_API.listProgressPhotos();
  const photos=r.photos||[];
  box.innerHTML=photos.length?photos.map(x=>`<div class="mp-plan" data-photo-id="${esc(x.id)}"><strong>${esc((x.captured_at||x.created_at||'').slice(0,10))}</strong>${x.weight_kg?` · ${esc(formatWeightKg(x.weight_kg))}`:''}${x.waist_cm?` · ${esc((localStorage.getItem('shiftWaistUnit')==='in'?(Number(x.waist_cm)/2.54).toFixed(1)+' in':Number(x.waist_cm).toFixed(1)+' cm'))} waist`:''}<div><img src="${SST_API.progressPhotoUrl(x.id)}" alt="Saved real progress photo" style="max-width:180px;max-height:260px;margin-top:8px"></div><button class="mp-btn ghost photo-delete" data-photo-delete="${esc(x.id)}" type="button">Delete photo</button></div>`).join(''):'<p class="mp-muted">No saved progress photos yet.</p>';
 }catch(e){box.innerHTML='<p class="mp-muted">Saved photos could not be loaded.</p>'}
}

function fillSelect(el,values,label=v=>v){if(!el)return;el.innerHTML=values.map(v=>`<option value="${v}">${label(v)}</option>`).join('')}
function setupMeasurementDropdowns(){
 fillSelect($('#photoWeightStone'),Array.from({length:33},(_,i)=>i+5),v=>v+' st');
 fillSelect($('#photoWeightPounds'),Array.from({length:28},(_,i)=>(i/2).toFixed(1)),v=>v+' lb');
 fillSelect($('#photoWeightKg'),Array.from({length:441},(_,i)=>(30+i*.5).toFixed(1)),v=>v+' kg');
 fillSelect($('#photoWeightLbOnly'),Array.from({length:485},(_,i)=>66+i),v=>v+' lb');
 fillSelect($('#photoWaist'),Array.from({length:301},(_,i)=>(50+i*.5).toFixed(1)),v=>v);
 $('#photoWeightStone').value='15';$('#photoWeightPounds').value='4.0';$('#photoWeightKg').value='96.2';$('#photoWeightLbOnly').value='212';$('#photoWaist').value='81.0';
}

async function handleFitVote(btn){
 const card=btn.closest('.mp-exercise');if(!card)return;
 if(btn.dataset.fitVote==='yay'){await SST_API.fitFeedback({entity_id:card.dataset.exerciseId,sentiment:'yay',context:{surface:'member_dashboard'}});card.classList.add('liked');btn.textContent='✓ Kept';const nay=card.querySelector('.mp-nay');if(nay)nay.disabled=true;return}
 btn.disabled=true;btn.textContent='Swapping…';
 try{
  const exclude=[...document.querySelectorAll('.mp-exercise')].map(x=>x.dataset.exerciseId).filter(Boolean);
  const r=await SST_API.replaceFitExercise({current_id:card.dataset.exerciseId,group:card.dataset.exerciseGroup,exclude,preferences:$('#fitPrefs').value||undefined,limitations:$('#fitPrefs').value||undefined,location:$('#fitLocation').value,equipment:$('#fitEquipment').value});
  const holder=document.createElement('div');holder.innerHTML=exerciseCard(r.exercise);card.replaceWith(holder.firstElementChild);
 }catch(e){btn.disabled=false;btn.textContent='👎 Nay — swap it';status('#fitStatus',e.message||'Could not swap that exercise.',true)}
}
async function handleMealVote(btn){
 const card=btn.closest('.mp-meal');if(!card)return;
 if(btn.dataset.vote==='yay'){await SST_API.grubFeedback({entity_id:card.dataset.mealId,sentiment:'yay',context:{surface:'member_dashboard'}});card.classList.add('liked');btn.textContent='✓ Kept';card.querySelector('.mp-nay').disabled=true;return}
 btn.disabled=true;btn.textContent='Swapping…';
 try{
  const exclude=[...document.querySelectorAll('.mp-meal')].map(x=>x.dataset.mealId).filter(Boolean);
  const r=await SST_API.replaceGrubMeal({current_id:card.dataset.mealId,type:card.dataset.mealType,exclude,preferences:$('#grubPrefs').value||undefined});
  const holder=document.createElement('div');holder.innerHTML=mealCard(r.meal,Number(card.dataset.day)||0);card.replaceWith(holder.firstElementChild);
 }catch(e){btn.disabled=false;btn.textContent='👎 Nay — swap it';status('#grubStatus',e.message||'Could not swap that meal.',true)}
}
window.addEventListener('DOMContentLoaded',()=>{
 document.addEventListener('click',async e=>{const b=e.target.closest('[data-vote]');if(b)handleMealVote(b);const f=e.target.closest('[data-fit-vote]');if(f)handleFitVote(f);const d=e.target.closest('[data-photo-delete]');if(d){d.disabled=true;try{await SST_API.deleteProgressPhoto(d.dataset.photoDelete);await loadSavedPhotos();status('#visualStatus','Photo deleted.');}catch(err){d.disabled=false;status('#visualStatus',err.message||'Could not delete that photo.',true)}}});
 setupMeasurementDropdowns();
 $$('.mp-tab').forEach(b=>b.onclick=()=>activate(b.dataset.panel));
 const hash=location.hash.slice(1);activate(['today','grub','fit','water','conundrum','plans','ai','visualise','shiftme','lifeback','medicines'].includes(hash)?hash:'today');
 $('#grubGenerate').onclick=e=>run(e.currentTarget,()=>SST_API.generateGrub({days:Number($('#grubDays').value)||7,preferences:$('#grubPrefs').value||undefined}),'#grubStatus','#grubOutput','Building your Grub plan');
 $('#fitGenerate').onclick=e=>run(e.currentTarget,()=>SST_API.generateFit({days:Number($('#fitDays').value)||3,minutes_per_day:Number($('#fitMinutes').value)||30,location:$('#fitLocation').value,equipment:$('#fitEquipment').value,preferences:$('#fitPrefs').value||undefined,limitations:$('#fitPrefs').value||undefined}),'#fitStatus','#fitOutput','Building your Fit plan');
 $('#waterGenerate').onclick=e=>run(e.currentTarget,()=>SST_API.generateHydration({}),'#waterStatus','#waterOutput','Refreshing your hydration guide'); $('#drinkLog').onclick=logDrink; loadHydration();
 $('#conundrumGo').onclick=e=>{const items=$('#conundrumItems').value.split(/[\n,]+/).map(x=>x.trim()).filter(Boolean);run(e.currentTarget,()=>SST_API.conundrum({items}),'#conundrumStatus','#conundrumOutput','Checking what you’ve got')};
 const aiForm=$('#shiftAiForm'),aiInput=$('#shiftAiInput'),aiThread=$('#shiftAiThread'),aiSend=$('#shiftAiSend');
 function aiMessage(role,text){const row=document.createElement('div');row.className='mp-ai-message '+role;row.innerHTML=`<strong>${role==='user'?'You':'Shift'}</strong><p>${esc(text)}</p>`;aiThread.appendChild(row);row.scrollIntoView({block:'nearest',behavior:'smooth'})}
 if(aiForm)aiForm.onsubmit=async e=>{e.preventDefault();const message=aiInput.value.trim();if(!message)return;aiMessage('user',message);aiInput.value='';aiSend.disabled=true;status('#shiftAiStatus','Shift is thinking…');try{const r=await SST_API.askShiftAI({message});aiMessage('assistant',r.answer||r.message||'I could not form a useful answer just then.');status('#shiftAiStatus',r.sources?.length?`Answered using ${r.sources.length} reviewed Shift source${r.sources.length===1?'':'s'}.`:'Answered from your current Shift context.')}catch(err){if(err.status===401){location.replace('/member-login?next='+encodeURIComponent('/member/dashboard#ai'));return}aiMessage('assistant',err.message||'I could not answer just then. Please try again.');status('#shiftAiStatus','Shift AI is unavailable just now.',true)}finally{aiSend.disabled=false;aiInput.focus()}};
 $('#shiftAiClear')?.addEventListener('click',()=>{aiThread.innerHTML='<div class="mp-ai-message assistant"><strong>Shift</strong><p>What would be useful right now?</p></div>';status('#shiftAiStatus','Cleared from this screen. Your saved Shift context is unchanged.')});
 $('#photoInput').onchange=e=>{const f=e.target.files?.[0];if(!f)return;const img=$('#photoPreview');img.src=URL.createObjectURL(f);img.style.display='block';$('#visualConsentWrap').style.display='block'};
 $$('.visual-gen').forEach(b=>b.onclick=()=>generateVisual(b.dataset.visual));
 $('#saveOriginal').onclick=saveOriginal;
 $('#photoWeightUnit').onchange=syncWeightInputs; syncWeightInputs(); $('#photoWaistUnit').onchange=e=>localStorage.setItem('shiftWaistUnit',e.target.value);
 loadSavedPhotos();

 $('#visualConsent').onchange=e=>$$('.visual-gen').forEach(b=>b.disabled=!e.target.checked);
 load();
});
})();
