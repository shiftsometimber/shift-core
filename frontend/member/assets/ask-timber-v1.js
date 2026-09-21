(function(){
 'use strict';
 const form=document.getElementById('timberForm'),input=document.getElementById('timberQuestion');
 const output=document.getElementById('timberResponse'),submit=document.getElementById('timberSubmit'),count=document.getElementById('timberCount');
 if(!form||!input||!output||!submit)return;
 let history=[];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const paragraphs=v=>esc(v).split(/\n{2,}/).map(x=>'<p>'+x.replace(/\n/g,'<br>')+'</p>').join('');
 const setPrompt=q=>{input.value=q;count.textContent=input.value.length+' / 900';input.focus();window.scrollTo({top:form.getBoundingClientRect().top+scrollY-110,behavior:'smooth'})};
 input.addEventListener('input',()=>count.textContent=input.value.length+' / 900');
 document.querySelectorAll('[data-timber-prompt]').forEach(b=>b.addEventListener('click',()=>setPrompt(b.dataset.timberPrompt)));
 function loading(){output.hidden=false;output.innerHTML='<div class="at-loading">Timber is checking the reviewed sources <i></i><i></i><i></i></div>';output.scrollIntoView({behavior:'smooth',block:'nearest'})}
 function list(items){return items?.length?'<ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p>Nothing extra to add.</p>'}
 function render(data){
  if(!data?.ok)throw new Error(data?.message||'Ask Timber is unavailable.');
  const sources=(data.sources||[]).map(s=>{
    const inside='<strong>['+esc(s.id)+'] '+esc(s.title)+'</strong><span>'+esc(s.reviewState==='verified'?'Verified source':'Reviewed source')+'</span>';
    return s.url?'<a class="at-source" href="'+esc(s.url)+'" target="_blank" rel="noopener">'+inside+'</a>':'<div class="at-source">'+inside+'</div>';
  }).join('');
  output.innerHTML='<div class="at-answer-head"><h2>Here’s the straight answer.</h2><span class="at-confidence">'+esc(data.confidence||'reviewed')+' confidence</span></div>'+
   '<div class="at-copy">'+paragraphs(data.answer)+'</div>'+
   ((data.keyPoints?.length||data.nextSteps?.length)?'<div class="at-panels"><section class="at-panel"><h3>What matters</h3>'+list(data.keyPoints)+'</section><section class="at-panel"><h3>What you can do next</h3>'+list(data.nextSteps)+'</section></div>':'')+
   (sources?'<section class="at-sources"><h3>What Timber used</h3>'+sources+'</section>':'')+
   '<p class="at-limit">'+esc(data.limitations||'General information—not individual medical advice.')+'</p>'+
   (data.followUps?.length?'<div class="at-follow" aria-label="Useful follow-up questions">'+data.followUps.map(x=>'<button type="button" data-follow="'+esc(x)+'">'+esc(x)+'</button>').join('')+'</div>':'');
  output.querySelectorAll('[data-follow]').forEach(b=>b.addEventListener('click',()=>setPrompt(b.dataset.follow)));
 }
 function failure(error){
  const message=error?.code==='timeout'?'The answer is taking longer than expected. Your question is still here—please try again.':error?.code==='network_error'?'We could not connect to the answer service. Check your connection and try again.':'The answer service is temporarily unavailable. Your question is still here—please try again shortly.';
  output.hidden=false;output.innerHTML='<div class="at-error"><h2>Timber cannot give you a proper answer just now.</h2><p>'+esc(message||'Please try again shortly. I would rather pause than give you something unreliable.')+'</p><p><a href="/explore-knowledge">Browse reviewed knowledge →</a> &nbsp; <a href="/contact">Contact Shift →</a></p></div>';
 }
 form.addEventListener('submit',async e=>{
  e.preventDefault();const message=input.value.trim();if(message.length<3)return;
  submit.disabled=true;loading();
  try{
    if(!window.SST_API?.askShiftAI)throw new Error('The answer service has not loaded.');
    const detectedIntents=window.AskTimberIntent?.detect(message)||[];
    let data=await window.SST_API.askShiftAI({message,history,detectedIntents,requireIntentCoverage:true,useJourney:false});
    if(window.AskTimberIntent)data=window.AskTimberIntent.complete(message,data);
    render(data);history=[...history,{role:'user',content:message},{role:'assistant',content:data.answer||''}].slice(-6);
  }catch(err){failure(err)}
  finally{submit.disabled=false}
 });
})();
