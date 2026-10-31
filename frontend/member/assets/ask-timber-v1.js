(function(){
 'use strict';
 const form=document.getElementById('timberForm'),input=document.getElementById('timberQuestion');
 const output=document.getElementById('timberResponse'),submit=document.getElementById('timberSubmit'),count=document.getElementById('timberCount');
 if(!form||!input||!output||!submit)return;
 form.insertAdjacentHTML?.('beforeend','<div class="at-research-choice"><label><input type="checkbox" data-timber-research> Find research and sources</label><label>Research type <select data-timber-research-type><option value="all">All research</option><option value="review">Evidence reviews</option><option value="trial">Randomised trials</option></select></label><p>Search general topics without sending your question or private records to the research index.</p></div>');
 const researchChoice=form.querySelector?.('[data-timber-research]'),researchType=form.querySelector?.('[data-timber-research-type]');
 let history=[];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const paragraphs=v=>esc(v).split(/\n{2,}/).map(x=>'<p>'+x.replace(/\n/g,'<br>')+'</p>').join('');
 const setPrompt=q=>{input.value=q;count.textContent=input.value.length+' / 900';input.focus();window.scrollTo({top:form.getBoundingClientRect().top+scrollY-110,behavior:'smooth'})};
 input.addEventListener('input',()=>count.textContent=input.value.length+' / 900');
 document.querySelectorAll('[data-timber-prompt]').forEach(b=>b.addEventListener('click',()=>setPrompt(b.dataset.timberPrompt)));
 function loading(research){output.hidden=false;output.innerHTML='<div class="at-loading">'+(research?'Timber is finding research references':'Timber is checking the reviewed sources')+' <i></i><i></i><i></i></div>';output.scrollIntoView({behavior:'smooth',block:'nearest'})}
 function list(items){return items?.length?'<ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p>Nothing extra to add.</p>'}
 function render(data){
  if(!data?.ok)throw new Error(data?.message||'Ask Timber is unavailable.');
  const research=data.mode==='research';
  const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}};
  const sources=(data.sources||[]).map(s=>{
    const label=research?(s.evidenceType||'Source reference'):(({verified:'Verified source',approved:'Reviewed source',source_checked:'Source checked',published_site:'Published SHIFT page',external_unreviewed:'External NHS information'})[s.reviewState]||'Source information');
    const inside='<strong>['+esc(s.id)+'] '+esc(s.title)+'</strong><span>'+esc(label)+(s.publishedAt?' · '+esc(s.publishedAt):'')+'</span>'+(research?'<span>'+esc(s.publisher||'')+(s.pmid?' · PMID '+esc(s.pmid):'')+'</span><small>'+(s.checkedAt?(s.pmid?'Index checked ':'Source checked ')+esc(s.checkedAt.slice(0,10))+'. ':'')+'Not clinically appraised by Shift.</small>':'');
    const url=safeUrl(s.url);
    const classes='at-source'+(research?' at-research-source':'');
    return url?'<a class="'+classes+'" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+inside+'</a>':'<div class="'+classes+'">'+inside+'</div>';
  }).join('');
  output.innerHTML='<div class="at-answer-head"><h2>'+(research?'Research and sources.':'Here’s the straight answer.')+'</h2><span class="at-confidence">'+(research?'Source index':esc(data.confidence||'reviewed')+' confidence')+'</span></div>'+
   '<div class="at-copy">'+paragraphs(data.answer)+'</div>'+
   ((data.keyPoints?.length||data.nextSteps?.length)?'<div class="at-panels">'+(data.keyPoints?.length?'<section class="at-panel"><h3>What matters</h3>'+list(data.keyPoints)+'</section>':'')+(data.nextSteps?.length?'<section class="at-panel"><h3>What you can do next</h3>'+list(data.nextSteps)+'</section>':'')+'</div>':'')+
   (sources?'<section class="at-sources"><h3>'+(research?'Open the original sources':'What Timber used')+'</h3>'+sources+'</section>':'')+
   (research&&safeUrl(data.research?.searchUrl)?'<p><a href="'+esc(safeUrl(data.research.searchUrl))+'" target="_blank" rel="noopener noreferrer">Open this general topic in PubMed →</a></p>':'')+
   '<p class="at-limit">'+esc(data.limitations||'General information—not individual medical advice.')+'</p>'+
   (research&&safeUrl(data.attribution?.url)?'<p class="at-limit"><a href="'+esc(safeUrl(data.attribution.url))+'" target="_blank" rel="noopener noreferrer">PubMed / NCBI policies and disclaimer</a></p>':'')+
   (data.followUps?.length?'<div class="at-follow" aria-label="Useful follow-up questions">'+data.followUps.map(x=>'<button type="button" data-follow="'+esc(x)+'">'+esc(x)+'</button>').join('')+'</div>':'');
  output.querySelectorAll('[data-follow]').forEach(b=>b.addEventListener('click',()=>setPrompt(b.dataset.follow)));
 }
 function failure(error){
  const message=error?.code==='timeout'?'The answer is taking longer than expected. Your question is still here—please try again.':error?.code==='network_error'?'We could not connect to the answer service. Check your connection and try again.':'The answer service is temporarily unavailable. Your question is still here—please try again shortly.';
  output.hidden=false;output.innerHTML='<div class="at-error"><h2>Timber cannot give you a proper answer just now.</h2><p>'+esc(message||'Please try again shortly. I would rather pause than give you something unreliable.')+'</p><p><a href="/explore-knowledge">Browse reviewed knowledge →</a> &nbsp; <a href="/contact">Contact Shift →</a></p></div>';
 }
 form.addEventListener('submit',async e=>{
  e.preventDefault();const message=input.value.trim();if(message.length<3)return;
  const research=researchChoice?.checked===true;
  submit.disabled=true;loading(research);
  try{
    if(!window.SST_API?.askShiftAI)throw new Error('The answer service has not loaded.');
    const detectedIntents=window.AskTimberIntent?.detect(message)||[];
    let data=await window.SST_API.askShiftAI({message,history:research?[]:history,detectedIntents,requireIntentCoverage:true,useJourney:false,...(research?{research:true,researchType:researchType?.value||'all',personalisation:false}:{})},(answer,meta)=>{render({ok:true,...meta,answer});});
    // Render the service answer unchanged. Client-side intent helpers are diagnostics only.
    render(data);if(!research)history=[...history,{role:'user',content:message},{role:'assistant',content:data.answer||''}].slice(-6);
  }catch(err){failure(err)}
  finally{submit.disabled=false}
 });
})();
