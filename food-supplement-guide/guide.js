(() => {
  'use strict';
  const D=window.SHIFT_DATA;
  const initial=()=>({goal:'basics',diet:'mixed',appetite:'usual',budget:false,training:false,meal:'lunch',mealProtein:'',mealStarch:'',mealColour:'',shortlist:[],compare:[],action:'food',mealPicked:false,search:'',filter:'all'});
  let state=initial();
  const $=id=>document.getElementById(id);
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={consider:'Worth considering',food:'Food first / optional',ask:'Ask a professional',skip:'Not a priority'};
  const item=id=>D.supplements.find(s=>s.id===id);
  const sourceLink=id=>{const s=D.sources[id];return `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} ↗</a>`;};
  function relevance(s,ctx=state){
    let level=s.base,reason=s.summary;
    if(s.id==='b12'&&ctx.diet==='vegan'){level='consider';reason='Your vegan choice makes reliable B12 sources a priority to check.';}
    if(s.id==='protein'&&ctx.appetite!=='usual'){level='food';reason='Smaller meals make protein foods worth planning; powder is an optional convenience.';}
    if(s.id==='creatine'){level=ctx.training?'consider':'food';reason=ctx.training?'You do strength training: read about its specific role and limitations.':'No regular strength training selected: food and a training routine come first.';}
    if(s.id==='multivitamin'&&ctx.appetite!=='usual'){level='ask';reason='Ongoing low intake needs a diet or prescriber review, not a guessed nutrient stack.';}
    if(s.id==='magnesium'&&ctx.goal==='sleep'){level='skip';reason='For better sleep, current evidence is too limited to make this a priority.';}
    if(s.id==='probiotics'&&ctx.goal==='gut'){level='food';reason='A possible specific use, not a general fix. Persistent symptoms need assessment.';}
    return {level,reason};
  }
  function filtered(ctx=state){
    const query=ctx.search.trim().toLowerCase();
    return D.supplements.filter(s=>(!query||(s.name+' '+s.keywords).toLowerCase().includes(query))&&(ctx.filter==='all'||relevance(s,ctx).level===ctx.filter))
      .sort((a,b)=>{const focus=D.goals[ctx.goal].focus;return (focus.includes(a.id)?focus.indexOf(a.id):99)-(focus.includes(b.id)?focus.indexOf(b.id):99);});
  }
  function cost(price,servings,daily){
    if([price,servings,daily].some(v=>v===''||v===null||v===undefined))return {empty:true};
    const [p,s,d]=[Number(price),Number(servings),Number(daily)];
    if(![p,s,d].every(Number.isFinite)||p<0||p>10000||!Number.isInteger(s)||s<1||s>100000||d<=0||d>100)return {error:true};
    return {perDay:p/s*d,monthly:p/s*d*30,lasts:s/d};
  }
  function announce(text){$('announcer').textContent=text;}
  function renderStart(){
    const g=D.goals[state.goal];
    let context='';
    if(state.diet==='vegan')context+='For a vegan diet, check reliable B12 sources and the fortification of dairy alternatives. Other nutrients may need attention too. '+sourceLink('vegan')+' ';
    if(state.diet==='vegetarian')context+='Keep variety across protein foods and check fortified alternatives when avoiding dairy. '+sourceLink('balanced')+' ';
    if(state.appetite==='glp1')context+='On a GLP-1: keep smaller meals regular, include protein and seek prescriber help if you feel unwell or cannot eat properly. '+sourceLink('glp1')+' ';
    else if(state.appetite==='smaller')context+='If low appetite persists or weight loss is unexplained, speak to your GP. This choice does not show that you have a deficiency. '+sourceLink('fatigue')+' ';
    if(state.budget)context+='Cupboard-friendly meal options are selected below: beans or lentils, wholegrains and frozen or tinned produce.';
    const caution=(state.goal==='energy')?`<p><strong>Tired for weeks, or it affects daily life?</strong> Book a GP assessment. Supplements should not delay it. ${sourceLink('fatigue')}</p>`:(state.goal==='sleep'?`<p>Look at a regular sleep time and caffeine near bedtime. ${sourceLink('fatigue')}</p>`:'');
    $('starting-result').innerHTML=`<div><p class="eyebrow">YOUR FOOD-FIRST START</p><h3>${esc(g.title)}</h3><p>${esc(g.body)}</p>${caution}</div><div><p class="eyebrow">TRY THIS BEFORE A TUB</p><ul>${g.food.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><p class="small">A guide to what to explore, not a calculation of your nutritional needs.</p><a class="text-link" href="#food">Build one useful meal →</a></div>${context?`<p class="context-message">${context}</p>`:''}`;
  }
  function renderShelf(){
    const list=filtered();
    $('result-count').textContent=`${list.length} of ${D.supplements.length} options · relevance reflects your selections above.`;
    $('supplement-grid').innerHTML=list.length?list.map(s=>{
      const r=relevance(s);
      return `<article class="supp-card"><div class="supp-top"><span class="status-badge status-${r.level}">${labels[r.level]}</span><span class="supp-symbol" aria-hidden="true">${esc(s.symbol)}</span></div><h3>${esc(s.name)}</h3><p class="supp-reason">${esc(r.reason)}</p><p class="evidence-label">${esc(s.evidence)}</p><button class="read-button" data-detail="${s.id}" aria-haspopup="dialog">Read the straight answer <span aria-hidden="true">↗</span><span class="sr-only"> about ${esc(s.name)}</span></button><div class="card-actions"><button data-shortlist="${s.id}" aria-pressed="${state.shortlist.includes(s.id)}" aria-label="${state.shortlist.includes(s.id)?'Remove':'Add'} ${esc(s.name)} ${state.shortlist.includes(s.id)?'from':'to'} reading shortlist">${state.shortlist.includes(s.id)?'Shortlisted ✓':'+ Shortlist'}</button><button data-compare="${s.id}" aria-pressed="${state.compare.includes(s.id)}" aria-label="${state.compare.includes(s.id)?'Remove':'Add'} ${esc(s.name)} ${state.compare.includes(s.id)?'from':'to'} comparison" ${state.compare.length===2&&!state.compare.includes(s.id)?'disabled':''}>${state.compare.includes(s.id)?'Comparing ✓':'Compare'}</button></div></article>`;
    }).join(''):`<div class="empty-state"><h3>No matches this time.</h3><p>Try another name or usefulness level.</p><button class="button secondary" data-clear-filter>Clear search and filter</button></div>`;
    renderCompare();
  }
  function renderCompare(){
    $('comparison-panel').hidden=state.compare.length===0;
    $('comparison-content').innerHTML=state.compare.length===1?'<p class="small">Choose one more “Compare” button to see two options together.</p>':state.compare.map(id=>{const s=item(id),r=relevance(s);return `<article><h3>${esc(s.name)}</h3><div class="compare-cell"><strong>USEFULNESS IN YOUR CONTEXT</strong>${labels[r.level]}<p>${esc(r.reason)}</p></div><div class="compare-cell"><strong>EVIDENCE</strong>${esc(s.evidence)}<p>${esc(s.limit)}</p></div><div class="compare-cell"><strong>FOOD & PRACTICAL CHOICE</strong>${esc(s.food)}<p>${esc(s.choice)}</p></div><div class="compare-cell"><strong>CAUTIONS</strong>${esc(s.caution)}</div><div class="compare-cell">${s.sources.map(sourceLink).join(' · ')}</div></article>`;}).join('');
    $('comparison-content').className=state.compare.length===2?'compare-grid':'';
  }
  function mealChoices(){
    const m=D.meals[state.meal];
    return {protein:m.protein.filter(p=>p.diets.includes(state.diet)).map(p=>p.name),starch:m.starch,colour:m.colour};
  }
  function renderMealOptions(reset=false){
    const choices=mealChoices();
    for(const [key,list] of Object.entries(choices)){
      const prop='meal'+key[0].toUpperCase()+key.slice(1);
      if(reset||!list.includes(state[prop])){
        state[prop]=list[0];
        if(state.budget&&key==='protein')state[prop]=list.find(v=>/Tinned|Peanut/.test(v))||list[0];
      }
      $('meal-'+key).innerHTML=list.map(v=>`<option value="${esc(v)}" ${state[prop]===v?'selected':''}>${esc(v)}</option>`).join('');
    }
    renderMeal();
  }
  function mealName(){return `${state.mealProtein} + ${state.mealStarch.toLowerCase()} + ${state.mealColour.toLowerCase()}`;}
  function renderMeal(){
    $('meal-title').textContent=mealName();
    $('meal-instructions').textContent=D.meals[state.meal].instructions;
    $('meal-tags').innerHTML=`<span class="tag">${state.meal.toUpperCase()}</span><span class="tag">${state.diet==='vegan'?'VEGAN':state.diet==='vegetarian'?'VEGETARIAN':'YOUR FOOD CHOICE'}</span>${state.budget?'<span class="tag">CUPBOARD FRIENDLY</span>':''}`;
    $('shopping-list').innerHTML=[state.mealProtein,state.mealStarch,state.mealColour].map(v=>`<label class="shopping-item"><input type="checkbox"><span>${esc(v)}</span></label>`).join('');
    $('meal-status').textContent=state.mealPicked?'This meal is in your takeaway.':'';
    if(state.mealPicked)renderPlan();
  }
  const actions={food:{title:'Make one useful meal.',body:'Use the meal idea as a starting point for this week. Adjust it to your appetite, dietary needs and what you have in.'},read:{title:'Read before you buy.',body:'Use the straight answers and source links to check whether there is a specific purpose for any supplement you are considering.'},check:{title:'Ask the right person.',body:'Take your questions and any supplement labels to a pharmacist, GP or registered dietitian. If symptoms are persistent, ask for assessment rather than guessing the cause.'},nothing:{title:'Buy nothing for now.',body:'That is a valid decision. Keep the food basics in place and revisit a supplement only when there is a clear job for it.'}};
  function renderActions(){
    $('action-options').innerHTML='<legend>Choose your next step</legend>'+Object.entries(actions).map(([id,a])=>`<label class="action-choice"><input type="radio" name="action" value="${id}" ${state.action===id?'checked':''}><span>${esc(a.title)}<small>${id==='food'?'Try the meal you built.':id==='read'?'Check purpose and evidence.':id==='check'?'Get suitability or symptoms checked.':'Keep it simple. Spend nothing on supplements today.'}</small></span></label>`).join('');
  }
  function renderPlan(){
    const a=actions[state.action];
    $('plan-title').textContent=a.title;
    $('plan-body').textContent=a.body+(state.action==='food'?' Your meal idea: '+mealName()+'.':'');
    $('shortlist').innerHTML=state.shortlist.length?state.shortlist.map(id=>{const s=item(id);return `<div class="shortlist-item"><span>${esc(s.name)} <small>· ${labels[relevance(s).level]}</small></span><button class="text-button" data-remove="${id}" aria-label="Remove ${esc(s.name)} from reading shortlist">Remove</button></div>`;}).join(''):'<p class="small">Nothing shortlisted. You do not need to add anything.</p>';
    $('download-status').textContent='';
  }
  function updateContext(resetMeal=false){renderStart();renderMealOptions(resetMeal);renderShelf();renderActions();renderPlan();}
  let lastDialogId=null;
  function showDetail(id){
    const s=item(id);if(!s)return;
    lastDialogId=id;const r=relevance(s);
    $('detail-content').innerHTML=`<span class="status-badge status-${r.level}">${labels[r.level]}</span><h2 id="detail-title" class="dialog-title">${esc(s.name)}</h2><p class="detail-context">${esc(r.reason)}</p><p class="detail-evidence">${esc(s.evidence)}</p><div class="detail-grid"><div><h3>What it may do</h3><p>${esc(s.purpose)}</p></div><div><h3>Start with food</h3><p>${esc(s.food)}</p></div><div><h3>If you are considering it</h3><p>${esc(s.choice)}</p></div><div><h3>What the evidence doesn’t say</h3><p>${esc(s.limit)}</p></div></div><div class="detail-caution"><strong>Before you take it</strong><p>${esc(s.caution)}</p><p>Follow your clinician’s advice and any prescribed treatment.</p></div><div class="detail-sources"><strong>Read the evidence · checked 12 October 2026</strong>${s.sources.map(sourceLink).join('')}</div><div class="detail-footer"><button class="button primary" data-detail-shortlist="${s.id}">${state.shortlist.includes(s.id)?'Remove from reading shortlist':'+ Add to reading shortlist'}</button><button class="button secondary" data-close-detail>Back to the guide</button></div>`;
    if(!$('detail-dialog').open)$('detail-dialog').showModal();
  }
  function toggleShortlist(id){
    if(!item(id))return;
    state.shortlist=state.shortlist.includes(id)?state.shortlist.filter(x=>x!==id):[...state.shortlist,id];
    renderShelf();renderPlan();announce(item(id).name+(state.shortlist.includes(id)?' added to':' removed from')+' reading shortlist.');
  }
  function takeaway(ctx=state){
    const a=actions[ctx.action],meal=`${ctx.mealProtein} + ${ctx.mealStarch.toLowerCase()} + ${ctx.mealColour.toLowerCase()}`;
    const ids=new Set(['balanced','supplements',...(ctx.appetite==='glp1'?['glp1']:[])]);
    const lines=ctx.shortlist.map(id=>{const s=item(id);s.sources.forEach(k=>ids.add(k));const r=relevance(s,ctx);return `- ${s.name}: ${labels[r.level]}\n  ${r.reason}\n  Evidence: ${s.evidence}. ${s.limit}\n  Caution: ${s.caution}`;});
    return `SHIFT SOME TIMBER — MY TAKEAWAY\nContent checked: 12 October 2026\n\nFocus: ${D.goals[ctx.goal].title}\nDiet context: ${ctx.diet}; appetite: ${ctx.appetite==='glp1'?'smaller while using a GLP-1':ctx.appetite==='smaller'?'smaller / eating less':'about usual'}\n\nMY NEXT STEP\n${a.title}\n${a.body}\n\nMEAL IDEA (${ctx.meal})\n${meal}\nShopping list: ${ctx.mealProtein}, ${ctx.mealStarch}, ${ctx.mealColour}.\nAdjust portions to your needs; check allergens and cooking/storage instructions.\n\nREADING SHORTLIST — NOT AN INSTRUCTION TO TAKE\n${lines.length?lines.join('\n\n'):'Nothing shortlisted. Buying nothing is a valid choice.'}\n\nBEFORE BUYING\nGeneral adult information, not diagnosis or a prescription. Check purpose, dose, duplicated ingredients, allergens and medicine interactions. If you take medicines, have a condition or need a special diet, ask your pharmacist, GP or dietitian. Keep following prescribed treatment. Persistent symptoms need assessment; contact your prescriber promptly if unwell on a GLP-1.\n\nSOURCES\n${[...ids].map(id=>`${D.sources[id].name}\n${D.sources[id].url}\n${D.sources[id].date}`).join('\n\n')}\n\nYour choices were used in this tab only. This takeaway was not sent to SHIFT or saved to My Timber.\n`;
  }
  function renderCost(){
    const c=cost($('price').value,$('servings').value,$('daily').value),out=$('cost-result');out.classList.toggle('error',!!c.error);
    out.textContent=c.empty?'Enter the three figures to compare cost.':c.error?'Use a price of £0–£10,000, a whole number of servings (1–100,000), and daily servings above 0 and up to 100.':`£${c.perDay.toFixed(2)} per day · £${c.monthly.toFixed(2)} per 30 days · pack lasts about ${c.lasts.toFixed(1)} days`;
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.sfgGoal){state.goal=b.dataset.sfgGoal;state.action=D.goals[state.goal].action;state.mealPicked=false;document.querySelectorAll('[data-sfg-goal]').forEach(x=>{const yes=x.dataset.sfgGoal===state.goal;x.classList.toggle('active',yes);x.setAttribute('aria-pressed',String(yes));});updateContext();}
    if(b.dataset.sfgMeal){state.meal=b.dataset.sfgMeal;document.querySelectorAll('[data-sfg-meal]').forEach(x=>{const yes=x.dataset.sfgMeal===state.meal;x.classList.toggle('active',yes);x.setAttribute('aria-pressed',String(yes));});renderMealOptions(true);renderPlan();}
    if(b.dataset.detail)showDetail(b.dataset.detail);
    if(b.dataset.shortlist){const id=b.dataset.shortlist;toggleShortlist(id);document.querySelector(`[data-shortlist="${id}"]`)?.focus();}
    if(b.dataset.detailShortlist){toggleShortlist(b.dataset.detailShortlist);showDetail(b.dataset.detailShortlist);document.querySelector('[data-detail-shortlist]')?.focus();}
    if(b.dataset.remove){toggleShortlist(b.dataset.remove);$('plan-title').setAttribute('tabindex','-1');$('plan-title').focus();}
    if(b.dataset.compare){const id=b.dataset.compare;if(state.compare.includes(id))state.compare=state.compare.filter(x=>x!==id);else if(state.compare.length<2)state.compare.push(id);renderShelf();document.querySelector(`[data-compare="${id}"]`)?.focus();announce(`${state.compare.length} of 2 comparison options selected.`);}
    if(b.hasAttribute('data-clear-filter')){state.search='';state.filter='all';$('search').value='';$('filter').value='all';renderShelf();$('search').focus();}
    if(b.hasAttribute('data-close-detail'))$('detail-dialog').close();
  });
  for(const id of ['diet','appetite','budget','training'])$(id).addEventListener('change',()=>{state[id]=['budget','training'].includes(id)?$(id).checked:$(id).value;updateContext(id==='diet'||id==='budget');});
  $('search').addEventListener('input',()=>{state.search=$('search').value;renderShelf();});
  $('filter').addEventListener('change',()=>{state.filter=$('filter').value;renderShelf();});
  for(const key of ['protein','starch','colour'])$('meal-'+key).addEventListener('change',()=>{state['meal'+key[0].toUpperCase()+key.slice(1)]=$('meal-'+key).value;renderMeal();renderPlan();});
  $('action-options').addEventListener('change',e=>{if(actions[e.target.value]){state.action=e.target.value;state.mealPicked=e.target.value==='food';renderPlan();}});
  $('use-meal').addEventListener('click',()=>{state.action='food';state.mealPicked=true;renderActions();renderPlan();$('meal-status').textContent='This meal is in your takeaway.';document.querySelector('#next').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});$('plan-title').setAttribute('tabindex','-1');$('plan-title').focus({preventScroll:true});});
  $('clear-compare').addEventListener('click',()=>{state.compare=[];renderShelf();$('supplements').setAttribute('tabindex','-1');$('supplements').focus();announce('Comparison cleared.');});
  $('close-dialog').addEventListener('click',()=>$('detail-dialog').close());
  $('detail-dialog').addEventListener('click',e=>{if(e.target===$('detail-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  $('detail-dialog').addEventListener('close',()=>document.querySelector(`[data-detail="${lastDialogId}"]`)?.focus());
  for(const id of ['price','servings','daily'])$(id).addEventListener('input',renderCost);
  $('cost-form').addEventListener('submit',e=>e.preventDefault());
  $('cost-example').addEventListener('click',()=>{$('price').value='18';$('servings').value='60';$('daily').value='1';renderCost();});
  $('download').addEventListener('click',()=>{const blob=new Blob([takeaway()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='SHIFT-my-food-and-supplements-takeaway.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('download-status').textContent='Takeaway prepared. Your browser handles the download.';});
  $('print').addEventListener('click',()=>window.print());
  $('reset').addEventListener('click',()=>{state=initial();for(const id of ['diet','appetite','filter'])$(id).value=state[id];$('search').value='';for(const id of ['budget','training'])$(id).checked=false;for(const id of ['price','servings','daily'])$(id).value='';document.querySelectorAll('[data-sfg-goal]').forEach(x=>{const yes=x.dataset.sfgGoal===state.goal;x.classList.toggle('active',yes);x.setAttribute('aria-pressed',String(yes));});document.querySelectorAll('[data-sfg-meal]').forEach(x=>{const yes=x.dataset.sfgMeal===state.meal;x.classList.toggle('active',yes);x.setAttribute('aria-pressed',String(yes));});updateContext(true);renderCost();announce('All choices reset.');$('start').setAttribute('tabindex','-1');$('start').focus();});
  $('sources').innerHTML=Object.values(D.sources).map(s=>`<div class="source-item"><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} ↗</a><span>${esc(s.date)}</span><span>${esc(s.scope)}</span></div>`).join('');
  updateContext(true);
  // Pure functions exposed for finite logic QA; no user records or network calls.
  window.SHIFT_GUIDE={relevance,filtered,cost,takeaway,initial};
})();
