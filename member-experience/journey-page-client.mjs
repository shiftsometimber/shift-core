import {journeyPresentation} from './journey-presentation.mjs';

// This client is served only on the real, session-gated Journey page. Private
// records and drafts stay in memory and are cleared on account/visibility loss.
export function journeyPageClient(makeView) {
  'use strict';
  const V=makeView(),{esc,date,add,distance}=V,root=document.getElementById('timberJourney');if(!root)return;
  let data=null,account=null,generation=0,loading=false,saving=false,controller=null,pendingSave=null;
  let page='main',selected='',guideReturnDate='',medicineEnd='',showMedicine=false,recordKind='',editingId=null,snapshotDraft='',snapshotAccepted=false,guidePlaying=null,drag=null;
  const query=new URLSearchParams(location.search);
  let measure=['weightKg','waistCm','clothes'].includes(query.get('measure'))?query.get('measure'):'weightKg',range=['7','28','all','custom'].includes(query.get('range'))?query.get('range'):'7',customFrom=query.get('from')||'',customTo=query.get('to')||'';
  const ready=()=>document.body.dataset.memberSession==='ready'&&document.body.dataset.accountDeleted!=='1'&&!document.hidden;
  const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
  const uuid=()=>crypto.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
  const status=text=>{const box=$('[data-tj-status]');if(box)box.textContent=text;};
  const stop=()=>{clearInterval(guidePlaying);guidePlaying=null;};
  function clear() {
    ++generation;controller?.abort();controller=null;stop();drag=null;pendingSave=null;data=null;account=null;loading=false;saving=false;page='main';selected='';guideReturnDate='';medicineEnd='';snapshotDraft='';snapshotAccepted=false;recordKind='';editingId=null;showMedicine=false;root.replaceChildren();document.body.removeAttribute('data-tj-print');
  }
  async function identity(signal) {
    const response=await fetch('/v1/me',{credentials:'same-origin',cache:'no-store',signal});
    if(!response.ok)throw Object.assign(Error('Sign in again to open your Journey.'),{status:response.status});
    const own=await response.json(),id=own.user?.id;
    if(id===undefined||id===null)throw Error('Your account could not be checked.');return String(id);
  }
  async function request(path,body,signal) {
    const response=await fetch(path,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',signal,headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{})});
    const result=await response.json();
    if(!response.ok)throw Object.assign(Error(result.message||result.error||'Your Journey could not be checked.'),{status:response.status});return result;
  }
  async function load() {
    if(!ready()||loading)return;loading=true;const g=generation;const currentController=new AbortController();controller=currentController;const timer=setTimeout(()=>currentController.abort(),15000);
    if(!data)root.innerHTML='<p role="status">Opening your private Journey…</p>';
    try {
      const owner=await identity(currentController.signal),fresh=await request('/v1/life-back/journey',null,currentController.signal),verified=await identity(currentController.signal);
      if(g!==generation||!ready())return;
      if(owner!==verified||String(fresh.accountId)!==owner||(account!==null&&account!==owner)){clear();window.SST_MEMBER_SESSION?.check();return;}
      account=owner;data=fresh;showMedicine=fresh.showMedicine;medicineEnd=medicineEnd&&medicineEnd<=fresh.today?medicineEnd:fresh.today;
      selected=selected&&selected<=medicineEnd&&selected>=add(medicineEnd,-27)?selected:medicineEnd;
      if(!customFrom)customFrom=add(data.today,-27);if(!customTo)customTo=data.today;
      snapshotAccepted=false;if(location.hash==='#snapshot'&&page==='main'){snapshotDraft=V.snapshotText(data);page='snapshot';}
      render();
    } catch(error) {
      if(g!==generation||!ready())return;
      if(error.status===401){clear();window.SST_MEMBER_SESSION?.check();return;}
      if(!data)root.innerHTML='<section class="tj-card"><h1>Your Journey is still saved.</h1><p>'+esc(error.message)+'</p><button type="button" data-tj-retry>Try again</button></section>';
      else status(error.message);
    } finally {clearTimeout(timer);if(g===generation)loading=false;}
  }
  async function save(input) {
    if(saving||!ready()||!data)return false;
    const g=generation,owner=account;saving=true;status('Saving your private record…');$$('form button').forEach(b=>b.disabled=true);
    try {
      if(!['journey-delete','journey-view'].includes(input.action)){
        if(!window.SST_HEALTH_CONSENT?.ensure||!await window.SST_HEALTH_CONSENT.ensure())throw Error('Nothing saved. Review optional health tracking in Account & settings.');
      }
      if(g!==generation||!ready())return false;
      if(await identity()!==owner){clear();window.SST_MEMBER_SESSION?.check();return false;}
      const intent=JSON.stringify({input,owner});
      if(!pendingSave||pendingSave.intent!==intent)pendingSave={intent,id:uuid(),revision:data.revision};
      const result=await request('/v1/life-back',{...input,operationId:pendingSave.id,revision:pendingSave.revision,expectedAccount:owner});
      if(g!==generation||!ready())return false;
      if(String(result.accountId)!==owner||await identity()!==owner){clear();window.SST_MEMBER_SESSION?.check();return false;}
      if(g!==generation||!ready())return false;
      pendingSave=null;snapshotAccepted=false;snapshotDraft='';await load();
      document.dispatchEvent(new CustomEvent('sst:progress-saved'));return true;
    } catch(error) {
      if(g!==generation||!ready())return false;
      if(error.status===401){clear();window.SST_MEMBER_SESSION?.check();return false;}
      status(error.status===409?error.message+' Your form has been kept. Use Reload Journey before trying again.':error.message);return false;
    } finally {if(g===generation){saving=false;$$('form button').forEach(b=>b.disabled=false);}}
  }
  function bounds() {
    const first=data.records.filter(r=>r.kind==='measurement'||r.kind==='clothes').at(0)?.on||data.today;
    if(range==='all')return {from:first,to:data.today};
    if(range==='custom')return {from:customFrom,to:customTo};
    return {from:range==='7'&&first>add(data.today,-6)?first:add(data.today,-(Number(range)-1)),to:data.today};
  }
  function keepRange() {
    const url=new URL(location.href);url.searchParams.set('measure',measure);url.searchParams.set('range',range);
    for(const [k,v]of [['from',customFrom],['to',customTo]]){if(range==='custom')url.searchParams.set(k,v);else url.searchParams.delete(k);}
    history.replaceState(null,'',url.pathname+url.search+url.hash);
  }
  const action=(text,kind,cls='')=>'<button type="button" class="'+cls+'" data-tj-add="'+kind+'">'+text+'</button>';
  function ownLogs(on) {
    const logs=data.records.filter(r=>r.on===on&&['feeling','checkin','win'].includes(r.kind));
    return '<div class="tj-own-log"><p class="tj-eyebrow">FROM MY OWN LOG · '+esc(date(on,true))+'</p>'+(logs.length?logs.map(r=>'<p><strong>'+esc(V.recordText(r,data.units))+'</strong>'+(r.note?'<br>'+esc(r.note):'')+'</p>').join(''):'<p>No feeling or win was logged on this date. It stays blank.</p>')+'<div class="tj-row">'+action('Add how I felt','feeling')+'<a href="/member/dashboard?timber=support#today">Find some support</a></div></div>';
  }
  function progressMarkup() {
    let b;try{b=bounds();if([b.from,b.to].some(d=>!/^\d{4}-\d{2}-\d{2}$/.test(d)||d<'1900-01-01'||!Number.isFinite(Date.parse(d))||new Date(d+'T12:00:00Z').toISOString().slice(0,10)!==d)||b.from>b.to||b.to>data.today)throw Error();}catch{range='7';b=bounds();}
    const values=V.series(data.records,measure,b.from,b.to),latest=values.at(-1),first=data.records.filter(r=>r.kind==='measurement').at(0)?.on;
    const sizes=data.records.filter(r=>r.kind==='clothes'&&r.on>=b.from&&r.on<=b.to);
    return '<section class="tj-card" aria-label="Your progress"><div class="tj-row"><h2>Your progress.</h2>'+action('Add a reading',measure==='clothes'?'clothes':'measurement')+'</div><div class="tj-tabs" role="group" aria-label="Progress measure">'+[['weightKg','Weight'],['waistCm','Waist'],['clothes','Clothes size']].map(([key,label])=>'<button type="button" data-tj-measure="'+key+'" aria-pressed="'+(measure===key)+'">'+label+'</button>').join('')+'</div><div class="tj-row tj-range"><label>Dates<select data-tj-range>'+[['7',first&&first>add(data.today,-7)?'Since you started':'Last 7 days'],['28','Last 4 weeks'],['all','All records'],['custom','Choose dates']].map(([v,label])=>'<option value="'+v+'"'+(range===v?' selected':'')+'>'+label+'</option>').join('')+'</select></label>'+(range==='custom'?'<form data-tj-dates><label>From<input type="date" name="from" value="'+esc(customFrom)+'" max="'+data.today+'" required></label><label>To<input type="date" name="to" value="'+esc(customTo)+'" max="'+data.today+'" required></label><button>Show dates</button><p role="alert" data-tj-date-error></p></form>':'')+'</div>'+(measure==='clothes'?(sizes.length?'<table><caption>Your recorded label sizes</caption><thead><tr><th scope="col">Date</th><th scope="col">Top</th><th scope="col">Trousers</th></tr></thead><tbody>'+sizes.map(r=>'<tr><td>'+esc(date(r.on,true))+(r.dateBasis?'<small>'+esc(r.dateBasis)+'</small>':'')+'</td><td>'+esc(r.top||'—')+'</td><td>'+esc(r.trousers||'—')+'</td></tr>').join('')+'</tbody></table>':'<p class="tj-empty">No clothes sizes logged in these dates. Add the label size from a top or pair of trousers.</p>')+'<p class="tj-small">Sizes vary by brand. This keeps the labels you actually recorded.</p>':(latest?'<div class="tj-latest"><strong>'+esc(V.value(latest.value,measure,data.units))+'</strong><span>Recorded '+esc(date(latest.on,true))+'</span></div>':'')+V.progressGraph(data.records,measure,b.from,b.to,data.units))+'</section>';
  }
  function mainMarkup() {
    const wins=data.records.filter(r=>r.kind==='win'),latest=wins.at(-1),timeline=data.records.filter(r=>['win','treatment'].includes(r.kind)).slice(-30).reverse();
    return '<header class="tj-hero"><p class="tj-eyebrow">JOURNEY</p><h1>Your Journey.</h1><p>The changes you notice. The things you get back.</p></header><section class="tj-card tj-cream"><div class="tj-row"><h2>What I notice.</h2>'+action('Add a win','win')+'</div>'+(latest?'<blockquote>“'+esc(latest.text)+'”</blockquote><p class="tj-small">Your words · '+esc(date(latest.on,true))+'</p>':'<p>Something felt easier? A favourite shirt fitted? Keep it here, in your own words.</p>')+'</section>'+progressMarkup()+'<section class="tj-card"><div class="tj-row"><h2>Medicine over time.</h2><label class="tj-switch"><input type="checkbox" data-tj-show '+(showMedicine?'checked':'')+'> Show</label></div><p class="tj-small">Optional. A general illustration beside your own dated log.</p>'+(showMedicine?medicineMarkup():'<p>The illustration is hidden. Your records are still here.</p><button type="button" class="tj-guide-link" data-tj-guide><strong>Want to understand how it works?</strong><span>Open the illustrated day-by-day guide</span></button>')+'</section><section class="tj-card"><div class="tj-row"><h2>Your timeline.</h2>'+action('Add a change','treatment')+'</div><p class="tj-small">Your own treatment changes and everyday wins.</p>'+(timeline.length?'<ol class="tj-timeline">'+timeline.map(r=>'<li><time datetime="'+r.on+'">'+esc(date(r.on,true))+'</time><p>'+esc(V.recordText(r,data.units))+'</p>'+(r.note?'<p>'+esc(r.note)+'</p>':'')+(r.editable?'<button type="button" data-tj-edit="'+esc(r.id)+'">Edit record</button>':'')+'</li>').join('')+'</ol>':'<p>No timeline entries yet. Start wherever you are.</p>')+action('Record an injection','injection')+' <button type="button" data-tj-records>View or edit my records</button></section><button type="button" class="tj-snapshot-link" data-tj-snapshot><span><strong>Your snapshot.</strong><small>Your words and dates, ready for an appointment.</small></span><span aria-hidden="true">›</span></button><details class="tj-card"><summary>Your existing Journey tools</summary><p>Your setup, weekly check-in, private photos, import and full data controls stay available.</p><p><a href="/member/dashboard#journey">Setup and weekly check-in</a></p><p><a href="/member/dashboard#visualise">Photos, imports and other progress records</a></p><p><a href="/member/settings">Account, units and privacy</a></p></details>';
  }
  function medicineMarkup() {
    const from=add(medicineEnd,-27),index=distance(from,selected),day=index%7+1;
    return '<span class="tj-badge">Illustration · not your actual levels</span><div data-tj-medicine-plot class="tj-scrub" aria-label="Explore dates">'+V.medicineGraph(data.records,from,medicineEnd,selected,false,data.today)+'</div><div class="tj-row tj-small"><span>'+esc(date(from,true))+'</span><span>Drag or swipe to explore</span><span>'+esc(date(medicineEnd,true))+'</span></div><label class="tj-slider">Selected date: <strong data-tj-selected-date>'+esc(date(selected,true))+'</strong><input type="range" min="0" max="27" step="1" value="'+index+'" data-tj-date aria-label="Explore medicine illustration and my logs by date" aria-valuetext="'+esc(date(selected,true))+'"></label><div class="tj-row"><button type="button" data-tj-window="older">Earlier dates</button><button type="button" data-tj-window="newer" '+(medicineEnd===data.today?'disabled':'')+'>Recent dates</button></div><button type="button" class="tj-guide-link" data-tj-guide><strong>Want to understand how it works?</strong><span>Open the illustrated day-by-day guide</span></button>'+ownLogs(selected)+'<details><summary>How to read this</summary><p>The line repeats a made-up example week. It is not a measurement or a prediction of your medicine levels. The calendar dates belong to your logs; the example cycle is not matched to your prescription.</p><p>Dots below it are the feelings you chose to record. Seeing things on the same date does not tell us what caused them. Treatment markers do not change the example line.</p></details><div class="tj-change-buttons">'+[['started','Started'],['changed','Changed'],['paused','Paused'],['finished','Finished']].map(([v,label])=>'<button type="button" data-tj-change="'+v+'">'+label+'</button>').join('')+'</div><p class="tj-small">Add a dated treatment change. This records your words; it does not change your prescription.</p>';
  }
  const guideCopy=[
    ['Absorption begins.','After a weekly injection, medicine is absorbed into the bloodstream over time. Absorption and removal overlap. The filled area follows the amount on this example line.'],
    ['The example rises.','Medicine may still be being absorbed. The timing of the highest blood level depends on the medicine and the person. This example does not tell you when yours peaks.'],
    ['The example reaches its high point.','Weekly GLP-1 medicines can reduce appetite and help you feel fuller. A higher point on this drawing does not tell us how you will feel. Feeling sick is a possible side effect, not a milestone to aim for.'],
    ['Medicine is gradually removed.','The example slopes down. Your body breaks down and removes medicine over time. It does not suddenly stop working at this point on the drawing.'],
    ['The example continues to fall.','Some medicine can remain in the body between weekly injections. Your actual level and how you feel may differ from this picture.'],
    ['Keep your own experience beside it.','Appetite and symptoms can vary. Your dated notes help you describe what happened; they cannot establish that medicine caused it.'],
    ['The week ends; medicine can remain.','Day 7 does not mean you are now full of medicine, or that it has all gone. With repeated weekly treatment, absorption and removal can overlap across weeks. Follow your own prescribed schedule.']
  ];
  function guideMarkup() {
    const from=add(medicineEnd,-27),index=distance(from,selected),day=index%7+1,copy=guideCopy[day-1],level=V.exampleLevel(index);
    const shape='M55 10a21 21 0 1 1 0 42a21 21 0 1 1 0-42M35 60Q55 51 75 60Q83 64 88 78L104 119Q109 136 96 139Q87 141 82 128L76 111L78 187Q79 207 65 207Q54 207 55 189L55 153L54 189Q55 207 42 207Q29 207 30 187L33 111L27 128Q22 142 13 139Q0 136 6 119L22 78Q27 64 35 60Z',height=197*level;
    const figure='<svg class="tj-figure" viewBox="0 0 110 220" role="img" aria-label="Body-shaped illustration: the filled area follows the example amount, not measured medicine levels"><defs><clipPath id="tj-guide-body-fill" clipPathUnits="userSpaceOnUse"><rect data-tj-example-fill x="0" y="'+(207-height)+'" width="110" height="'+height+'"/></clipPath></defs><path d="'+shape+'" fill="#707762" fill-opacity=".28" stroke="#E7E3DA" stroke-width="1.2"/><path data-tj-example-body d="'+shape+'" fill="#E7E3DA" clip-path="url(#tj-guide-body-fill)"/></svg>';
    return '<button type="button" class="tj-back" data-tj-back>Back to Journey</button><header class="tj-compact"><p class="tj-eyebrow">MEDICINE OVER TIME</p><h1>How the example works.</h1><p>Weekly injections · general information</p></header><span class="tj-badge">Illustration · not your actual levels</span><div class="tj-guide-visual">'+figure+'<div data-tj-medicine-plot class="tj-scrub">'+V.medicineGraph([],from,medicineEnd,selected,true,data.today)+'</div></div><p class="tj-small">The filled area rises as medicine is absorbed and falls as the body removes it in this example. The fill is symbolic: not medicine moving up your body, a measured level or a guide to when to inject.</p><div class="tj-days" role="group" aria-label="Example day">'+Array.from({length:7},(_,i)=>'<button type="button" data-tj-day="'+(i+1)+'" aria-pressed="'+(day===i+1)+'">Day '+(i+1)+'</button>').join('')+'</div><div class="tj-row"><label class="tj-slider">Explore the dates<input type="range" min="0" max="27" value="'+index+'" data-tj-date aria-label="Explore guide date" aria-valuetext="'+esc(date(selected,true))+'"></label><button type="button" data-tj-play>'+(guidePlaying?'Pause':'Play')+'</button></div><section class="tj-card tj-cream" aria-live="polite"><p class="tj-eyebrow">EXAMPLE DAY <span data-tj-day-label>'+day+'</span> · SELECTED DATE <span data-tj-selected-date>'+esc(date(selected,true))+'</span></p><h2 data-tj-guide-title>'+copy[0]+'</h2><p data-tj-guide-copy>'+copy[1]+'</p>'+ownLogs(selected)+'</section><details class="tj-card"><summary>Over several weeks</summary><p>Repeated weekly doses can build towards a steadier pattern over several weeks. The time varies by medicine. This simplified repeating line does not model that build-up, a dose change or your personal levels.</p></details><details class="tj-card"><summary>Information and sources</summary><p>This guide illustrates absorption and removal. It cannot explain symptoms, measure treatment effect or tell you when to inject. Tablets and daily injections have different schedules.</p><p><a href="https://www.nhs.uk/medicines/semaglutide/" target="_blank" rel="noopener noreferrer">NHS: semaglutide</a></p><p><a href="https://www.medicines.org.uk/emc/product/15484/smpc" target="_blank" rel="noopener noreferrer">Manufacturer information: tirzepatide, section 5.2</a></p><p>Information checked 1 November 2026. The shape is illustrative, not a graph from these sources.</p></details><p>For symptoms that bother you or do not go away, contact your own prescriber or pharmacist. You do not need to wait for a pattern.</p><a href="/help/urgent">Get urgent help</a>';
  }
  function formMarkup() {
    const old=data.records.find(r=>r.id===editingId),kind=recordKind,labels={win:'A win or something I noticed',measurement:'Weight or waist reading',clothes:'Clothes label sizes',feeling:'How I felt',treatment:'Treatment change',injection:'Where I injected'},r=old||{on:selected||data.today};
    let fields='';
    if(kind==='win')fields='<label>My own words<textarea name="text" maxlength="180" required>'+esc(r.text||'')+'</textarea></label>';
    if(kind==='measurement')fields='<label>Weight ('+(data.units==='stone_lb'?'stones and pounds':data.units)+')</label>'+(data.units==='stone_lb'?'<div class="tj-two"><label>Stones<input type="number" name="stones" min="0" max="62" step="1" value="'+(r.weightKg!=null?Math.floor(r.weightKg*2.2046226218/14):'')+'"></label><label>Pounds<input type="number" name="pounds" min="0" max="13.9" step="0.1" value="'+(r.weightKg!=null?(r.weightKg*2.2046226218%14).toFixed(1):'')+'"></label></div>':'<input type="number" name="weight" min="'+(data.units==='kg'?20:44)+'" max="'+(data.units==='kg'?400:882)+'" step="0.1" aria-label="Weight" value="'+(r.weightKg!=null?(data.units==='kg'?r.weightKg:r.weightKg*2.2046226218).toFixed(1):'')+'">')+'<label>Waist (cm)<input type="number" name="waistCm" min="40" max="250" step="0.1" value="'+esc(r.waistCm??'')+'"></label><p class="tj-small">Either reading is enough. Leave anything you have not measured blank.</p>';
    if(kind==='clothes')fields='<label>Top label size<input name="top" maxlength="30" placeholder="e.g. XL" value="'+esc(r.top||'')+'"></label><label>Trousers label size<input name="trousers" maxlength="30" placeholder="e.g. 36 inch waist" value="'+esc(r.trousers||'')+'"></label><p class="tj-small">Record the label you actually wore. Sizes vary by brand.</p>';
    if(kind==='feeling')fields='<fieldset><legend>What did I notice?</legend>'+[['okay','Felt okay'],['sick','Felt sick'],['hungry','Hungry again'],['tired','Tired']].map(([key,label])=>'<label class="tj-check"><input type="checkbox" name="feelings" value="'+key+'" '+(r.feelings?.includes(key)?'checked':'')+'>'+label+'</label>').join('')+'</fieldset><p><a href="/member/dashboard?timber=support#today">Find some support</a> · <a href="/help/urgent">Get urgent help</a></p>';
    if(kind==='treatment')fields='<label>What changed?<select name="change">'+Object.entries({started:'Started',changed:'Changed',paused:'Paused',finished:'Finished'}).map(([key,label])=>'<option value="'+key+'"'+((r.change||root.dataset.change)===key?' selected':'')+'>'+label+'</option>').join('')+'</select></label><p class="tj-small">This records a change you made or were prescribed. It does not recommend or carry out a treatment change.</p>';
    if(kind==='injection')fields='<label>Where did I inject?<input name="site" maxlength="80" required placeholder="Use your own description" value="'+esc(r.site||'')+'"></label><label>Time, if I know it<input type="time" name="time" value="'+esc(r.time||'')+'"></label><p class="tj-small">A record of a past injection. For where and when to inject, follow your prescription and patient leaflet.</p>';
    if(['treatment','injection'].includes(kind))fields+='<details><summary>Medicine details (optional and private)</summary><label>Medicine name<input name="medicine" maxlength="80" value="'+esc(r.medicine||'')+'"></label><label>Dose, as I recorded it<input name="dose" maxlength="80" value="'+esc(r.dose||'')+'"></label></details>';
    return '<button type="button" class="tj-back" data-tj-back>Back to Journey</button><header class="tj-compact"><p class="tj-eyebrow">MY PRIVATE RECORD</p><h1>'+labels[kind]+'.</h1></header><form class="tj-card" data-tj-record-form><label>Date<input type="date" name="on" min="1900-01-01" max="'+data.today+'" value="'+esc(r.on)+'" required></label>'+fields+'<label>My note (optional)<textarea name="note" maxlength="500">'+esc(r.note||'')+'</textarea></label><button class="tj-primary">'+(old?'Save correction':'Save my record')+'</button>'+(old?'<button type="button" data-tj-delete="'+esc(old.id)+'">Delete this record</button>':'')+'</form><button type="button" data-tj-reload>Reload Journey</button><p class="tj-small">Your current form stays open until you save or go back.</p>';
  }
  function recordsMarkup() {
    const records=data.records.slice().reverse();
    return '<button type="button" class="tj-back" data-tj-back>Back to Journey</button><header class="tj-compact"><h1>Your records.</h1><p>Keep them accurate. You can correct or delete your new Journey records here.</p></header><div class="tj-card">'+(records.length?records.map(r=>'<article class="tj-record"><p class="tj-eyebrow">'+esc(date(r.on,true))+' · '+esc(r.kind)+'</p><h2>'+esc(V.recordText(r,data.units))+'</h2>'+(r.note?'<p>'+esc(r.note)+'</p>':'')+(['injection','treatment'].includes(r.kind)?'<p>'+esc([r.medicine,r.dose].filter(Boolean).join(' · '))+'</p>':'')+(r.editable?'<button type="button" data-tj-edit="'+esc(r.id)+'">Edit or delete</button>':'<p class="tj-small">Recorded in '+esc(r.source)+'. <a href="/member/dashboard#journey">Open the original Journey tools</a></p>')+'</article>').join(''):'<p>No records added yet.</p>')+'</div>';
  }
  function snapshotMarkup() {
    return '<button type="button" class="tj-back" data-tj-back>Back to Journey</button><header class="tj-compact"><p class="tj-eyebrow">YOUR SNAPSHOT</p><h1>Take this to your appointment.</h1><p>Your words, with dates. Check it, then share it.</p></header><p>Only your saved words and readings are included. Edit anything that is not right. Nothing is sent automatically.</p><section class="tj-card tj-cream tj-snapshot"><h2>My notes for my appointment.</h2><label class="tj-no-print">Check or edit my snapshot<textarea data-tj-snapshot-text rows="18" maxlength="24000">'+esc(snapshotDraft)+'</textarea></label><div class="tj-print-copy" data-tj-print-copy>'+esc(snapshotDraft)+'</div></section><label class="tj-check tj-accept"><input type="checkbox" data-tj-accept '+(snapshotAccepted?'checked':'')+'>I’ve read this. It says what I want it to say.</label><div class="tj-two"><button type="button" data-tj-share '+(!snapshotAccepted?'disabled':'')+'>Share</button><button type="button" data-tj-pdf '+(!snapshotAccepted?'disabled':'')+'>Save as PDF</button></div><p class="tj-small">Save as PDF opens your browser’s print options. These edits stay on this screen until you leave or the account is hidden.</p><button type="button" data-tj-rebuild>Rebuild from my latest records</button><p class="tj-small">Medicine questions go to your own prescriber or pharmacist.</p>';
  }
  function render() {
    if(!ready()||!data)return;
    root.innerHTML=(page==='guide'?guideMarkup():page==='form'?formMarkup():page==='records'?recordsMarkup():page==='snapshot'?snapshotMarkup():mainMarkup())+'<p class="tj-status" data-tj-status role="status"></p>'+(data.historyMayBeLimited?'<p class="tj-small">Up to 1,000 entries from each older log are shown. Your full export stays available in Journey tools.</p>':'')+'<p class="tj-small">'+(data.paused?'Journey tracking is paused. Your retained records are still available.':!data.trackingEnabled?'Optional tracking is off. Your retained records are still available.':'Your private record. Add only what helps you.')+'</p>';
    bindContinuous();
  }
  function go(next) {stop();if(next==='guide'){guideReturnDate=selected;selected=add(medicineEnd,-27);}else if(next==='main'&&guideReturnDate){selected=guideReturnDate;guideReturnDate='';}page=next;snapshotAccepted=false;render();root.querySelector('h1')?.setAttribute('tabindex','-1');root.querySelector('h1')?.focus();window.scrollTo({top:0,behavior:'instant'});}
  function openForm(kind,id=null) {recordKind=kind;editingId=id;go('form');}
  // Keep the native range input and plot container connected during a drag.
  function refreshSelection() {
    const from=add(medicineEnd,-27),index=distance(from,selected),day=index%7+1,plot=$('[data-tj-medicine-plot]'),range=$('[data-tj-date]');
    if(!plot||!range){render();return;}
    const chart=document.createElement('template');chart.innerHTML=V.medicineGraph(page==='guide'?[]:data.records,from,medicineEnd,selected,page==='guide',data.today);
    plot.replaceChildren(chart.content);range.value=String(index);range.setAttribute('aria-valuetext',date(selected,true));
    $$('[data-tj-selected-date]').forEach(el=>el.textContent=date(selected,true));
    const oldLog=$('.tj-own-log');if(oldLog){const next=document.createElement('template');next.innerHTML=ownLogs(selected);oldLog.replaceWith(next.content);}
    if(page==='guide'){
      const fill=$('[data-tj-example-fill]');if(fill){const height=197*V.exampleLevel(index);fill.setAttribute('height',String(height));fill.setAttribute('y',String(207-height));}
      const title=$('[data-tj-guide-title]'),copy=$('[data-tj-guide-copy]'),label=$('[data-tj-day-label]');
      if(title)title.textContent=guideCopy[day-1][0];if(copy)copy.textContent=guideCopy[day-1][1];if(label)label.textContent=String(day);
      $$('[data-tj-day]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.tjDay)===day)));
      const play=$('[data-tj-play]');if(play)play.textContent=guidePlaying?'Pause':'Play';
    }
  }
  function setDate(index) {
    if(!data||!ready()||!['main','guide'].includes(page)||!Number.isFinite(index))return;
    const safe=Math.max(0,Math.min(27,Math.round(index)));selected=add(add(medicineEnd,-27),safe);refreshSelection();
  }
  function bindContinuous() {
    const range=$('[data-tj-date]');if(range)range.oninput=e=>{stop();setDate(Number(e.target.value));};
    const plot=$('[data-tj-medicine-plot]');if(plot){
      // Pointer state belongs to the stable root, so redraws do not end a drag.
      plot.onpointerdown=e=>{if(e.button>0)return;stop();drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};root.setPointerCapture?.(e.pointerId);};
      plot.onwheel=e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const delta=Math.abs(e.deltaX)>=Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(Math.abs(delta)>2){e.preventDefault();stop();setDate(distance(add(medicineEnd,-27),selected)+(delta>0?1:-1));}};
    }
    const text=$('[data-tj-snapshot-text]');if(text)text.oninput=()=>{snapshotDraft=text.value;snapshotAccepted=false;const box=$('[data-tj-accept]');if(box)box.checked=false;$$('[data-tj-share],[data-tj-pdf]').forEach(b=>b.disabled=true);$('[data-tj-print-copy]').textContent=snapshotDraft;};
  }
  async function shareSnapshot(pdf=false) {
    if(!snapshotAccepted||!ready()||!data)return;
    const g=generation,revision=data.revision,text=snapshotDraft,owner=account;
    try {
      const fresh=await request('/v1/life-back/journey'),verified=await identity();
      if(g!==generation||!ready())return;
      if(String(fresh.accountId)!==owner||verified!==owner){clear();window.SST_MEMBER_SESSION?.check();return;}
      if(fresh.revision!==revision||JSON.stringify(fresh.records)!==JSON.stringify(data.records)){snapshotAccepted=false;data=fresh;render();status('Your records changed. Rebuild the snapshot, then read and accept it again.');return;}
      if(!snapshotAccepted||snapshotDraft!==text)return;
      if(pdf){document.body.dataset.tjPrint='snapshot';window.print();document.body.removeAttribute('data-tj-print');}
      else if(navigator.share){await navigator.share({title:'My own appointment snapshot',text});}
      else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);if(g===generation)status('Copied. Paste it into the app you choose to share with.');}
      else status('Select the text above to copy it, or use Save as PDF.');
    }catch(error){if(g===generation&&error.name!=='AbortError')status('Sharing could not finish. Your snapshot is still here. Try Save as PDF.');}
  }
  root.addEventListener('click',async e=>{
    const reading=e.target.closest('[data-tj-reading]');if(reading&&$('[data-tj-reading-result]'))$('[data-tj-reading-result]').textContent=reading.dataset.tjReading;
    const button=e.target.closest('button');if(!button||button.disabled)return;
    if(button.hasAttribute('data-tj-retry')){await load();return;}
    if(!data||!ready())return;
    if(button.dataset.tjAdd){delete root.dataset.change;openForm(button.dataset.tjAdd);}
    else if(button.dataset.tjChange){root.dataset.change=button.dataset.tjChange;openForm('treatment');}
    else if(button.dataset.tjEdit){const r=data.records.find(r=>r.id===button.dataset.tjEdit);if(r?.editable)openForm(r.kind,r.id);}
    else if(button.dataset.tjDelete){if(confirm('Delete this private record? This cannot be undone.'))if(await save({action:'journey-delete',recordId:button.dataset.tjDelete}))go('records');}
    else if(button.hasAttribute('data-tj-reload')){const values=new FormData($('[data-tj-record-form]'));await load();pendingSave=null;const form=$('[data-tj-record-form]');if(form)for(const element of form.elements){if(!element.name)continue;if(element.type==='checkbox')element.checked=values.getAll(element.name).includes(element.value);else element.value=values.get(element.name)||'';}status('Journey reloaded. Check your form before saving.');}
    else if(button.dataset.tjMeasure){measure=button.dataset.tjMeasure;keepRange();render();$('[data-tj-measure="'+measure+'"]').focus({preventScroll:true});}
    else if(button.hasAttribute('data-tj-guide'))go('guide');
    else if(button.hasAttribute('data-tj-back')){go('main');$('[data-tj-guide]')?.focus({preventScroll:true});}
    else if(button.hasAttribute('data-tj-records'))go('records');
    else if(button.hasAttribute('data-tj-snapshot')){snapshotDraft=V.snapshotText(data);go('snapshot');}
    else if(button.hasAttribute('data-tj-rebuild')){snapshotDraft=V.snapshotText(data);snapshotAccepted=false;render();status('Rebuilt from your current records. Please check it again.');}
    else if(button.hasAttribute('data-tj-share'))await shareSnapshot();
    else if(button.hasAttribute('data-tj-pdf'))await shareSnapshot(true);
    else if(button.dataset.tjWindow){stop();medicineEnd=button.dataset.tjWindow==='older'?add(medicineEnd,-28):[add(medicineEnd,28),data.today].sort()[0];selected=medicineEnd;render();}
    else if(button.dataset.tjDay){stop();const from=add(medicineEnd,-27),index=distance(from,selected),week=Math.floor(index/7);setDate(week*7+Number(button.dataset.tjDay)-1);}
    else if(button.hasAttribute('data-tj-play')){if(guidePlaying){stop();render();}else{if(distance(add(medicineEnd,-27),selected)>=27)selected=add(medicineEnd,-27);guidePlaying=setInterval(()=>{if(!ready()||page!=='guide'){stop();return;}const i=distance(add(medicineEnd,-27),selected);if(i>=27){stop();render();return;}setDate(i+1);},1600);render();}}
  });
  const pointerChoose=e=>{const plot=$('[data-tj-medicine-plot]');if(!plot)return;const rect=(plot.querySelector('.tj-medicine-graph')||plot).getBoundingClientRect();if(!rect.width)return;setDate(((e.clientX-rect.left)/rect.width*600-112)/458*27);};
  root.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;if(!drag.moved&&Math.abs(e.clientY-drag.y)>Math.abs(e.clientX-drag.x)+5){drag=null;return;}if(Math.abs(e.clientX-drag.x)>5)drag.moved=true;if(drag.moved)pointerChoose(e);});
  root.addEventListener('pointerup',e=>{if(drag?.id===e.pointerId){pointerChoose(e);root.releasePointerCapture?.(e.pointerId);drag=null;}});
  root.addEventListener('pointercancel',()=>{drag=null;});
  root.addEventListener('focusin',e=>{const r=e.target.closest('[data-tj-reading]');if(r)$('[data-tj-reading-result]').textContent=r.dataset.tjReading;});
  root.addEventListener('keydown',e=>{const r=e.target.closest('[data-tj-reading]');if(r&&['Enter',' '].includes(e.key)){e.preventDefault();$('[data-tj-reading-result]').textContent=r.dataset.tjReading;}});
  root.addEventListener('change',async e=>{
    if(e.target.hasAttribute('data-tj-range')){range=e.target.value;keepRange();render();}
    if(e.target.hasAttribute('data-tj-accept')){snapshotAccepted=e.target.checked;$$('[data-tj-share],[data-tj-pdf]').forEach(b=>b.disabled=!snapshotAccepted);}
    if(e.target.hasAttribute('data-tj-show')){const choice=e.target.checked,old=showMedicine;showMedicine=choice;render();if(!await save({action:'journey-view',showMedicine:choice})){showMedicine=old;const message=$('[data-tj-status]')?.textContent;render();status(message||'The setting could not be saved.');}}
  });
  root.addEventListener('submit',async e=>{
    e.preventDefault();const f=e.target,form=new FormData(f);
    if(f.hasAttribute('data-tj-dates')){const from=String(form.get('from')),to=String(form.get('to'));if(from>to||to>data.today||!from||!to){$('[data-tj-date-error]').textContent='Choose a valid start and end, up to today.';return;}customFrom=from;customTo=to;keepRange();render();return;}
    if(!f.hasAttribute('data-tj-record-form')||!f.reportValidity())return;
    const record={kind:recordKind,on:String(form.get('on')),note:String(form.get('note')||'')};
    for(const key of ['text','top','trousers','change','site','time','medicine','dose'])if(form.has(key))record[key]=String(form.get(key)||'');
    if(recordKind==='feeling')record.feelings=form.getAll('feelings');
    if(recordKind==='measurement'){
      if(data.units==='stone_lb'){
        const stone=form.get('stones'),pound=form.get('pounds');if(stone!==''||pound!=='')record.weightKg=(Number(stone||0)*14+Number(pound||0))/2.2046226218;
      }else if(form.get('weight')!=='')record.weightKg=Number(form.get('weight'))/(data.units==='lb'?2.2046226218:1);
      if(form.get('waistCm')!=='')record.waistCm=Number(form.get('waistCm'));
    }
    if(await save({action:'journey-record',record,...(editingId?{recordId:editingId}:{})})){go('main');status('Your record is saved.');}
  });
  new MutationObserver(()=>{clear();if(ready())load();}).observe(document.body,{attributes:true,attributeFilter:['data-member-session','data-account-deleted']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();else if(ready())load();});
  addEventListener('pagehide',clear);addEventListener('pageshow',e=>{if(e.persisted){clear();window.SST_MEMBER_SESSION?.check();}});
  addEventListener('hashchange',()=>{if(location.hash==='#snapshot'&&data&&ready()){snapshotDraft=V.snapshotText(data);go('snapshot');}});
  if(ready())load();
}
export const journeyPageRuntime='('+journeyPageClient.toString()+')('+journeyPresentation.toString()+');';
