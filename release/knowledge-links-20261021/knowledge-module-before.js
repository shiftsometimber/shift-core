// V2.11A Knowledge Experience
(function(){
 const cards=[...document.querySelectorAll('[data-kitem]')];
 if(!cards.length) return;
 const search=document.getElementById('knowledgeSearch');
 const type=document.getElementById('knowledgeType');
 const sort=document.getElementById('knowledgeSort');
 const count=document.getElementById('resultCount');
 let topic='All';

 function apply(){
   const q=(search?.value||'').toLowerCase().trim();
   const typ=type?.value||'All';
   let shown=cards.filter(c=>{
     const okQ=!q || c.dataset.search.includes(q);
     const okType=typ==='All'||c.dataset.type===typ;
     const okTopic=topic==='All'||c.dataset.topic===topic;
     return okQ&&okType&&okTopic;
   });
   cards.forEach(c=>c.style.display='none');
   const mode=sort?.value||'default';
   shown.sort((a,b)=>{
     if(mode==='az') return a.dataset.title.localeCompare(b.dataset.title);
     if(mode==='za') return b.dataset.title.localeCompare(a.dataset.title);
     return (+a.dataset.index)-(+b.dataset.index);
   });
   const grid=document.getElementById('knowledgeResults');
   shown.forEach(c=>{c.style.display='block';grid.appendChild(c)});
   if(count) count.textContent=`Showing ${shown.length} of ${cards.length} resources`;
 }
 search&&search.addEventListener('input',apply); type&&type.addEventListener('change',apply); sort&&sort.addEventListener('change',apply);
 document.querySelectorAll('[data-topic-filter]').forEach(b=>b.addEventListener('click',()=>{
   document.querySelectorAll('[data-topic-filter]').forEach(x=>x.classList.remove('active'));
   b.classList.add('active');topic=b.dataset.topicFilter;apply();
 }));
 const inspire=document.getElementById('inspireBtn');
 inspire&&inspire.addEventListener('click',()=>{
   const available=cards.filter(c=>c.style.display!=='none');
   const pick=(available.length?available:cards)[Math.floor(Math.random()*(available.length||cards.length))];
   document.getElementById('inspireResult').innerHTML=`<strong>${pick.dataset.title}</strong><br><a href="${pick.querySelector('a').getAttribute('href')}">Open this one →</a>`;
 });
 const aiBtn=document.getElementById('aiKnowledgeBtn'), aiQ=document.getElementById('aiKnowledgeQuery'), aiA=document.getElementById('aiKnowledgeAnswer');
 aiBtn&&aiBtn.addEventListener('click',()=>{
   const q=(aiQ.value||'').toLowerCase().trim();
   if(!q){aiA.textContent='Tell me roughly what is on your mind and I’ll point you somewhere useful.';aiA.classList.add('show');return}
   let terms=[];
   if(/mounjaro|wegovy|glp|ozempic|injection|side effect/.test(q)) terms=['glp','mounjaro','wegovy','protein'];
   else if(/knee|joint|walk|walking|football|fit|exercise/.test(q)) terms=['walking','knee','fitness'];
   else if(/blood pressure|heart|cholesterol|diabetes|health/.test(q)) terms=['blood','heart','health','waist'];
   else if(/belly|weight|lose|fat|bmi|stone/.test(q)) terms=['weight','belly','bmi'];
   else if(/stress|anxiety|confidence|motivation|fed up|feel/.test(q)) terms=['confidence','stress','motivation','feeling'];
   else if(/food|protein|meal|takeaway|calorie|nutrition/.test(q)) terms=['protein','calorie','nutrition','meal'];
   else terms=q.split(/\s+/).filter(x=>x.length>2);
   const scored=cards.map(c=>({c,score:terms.reduce((n,t)=>n+(c.dataset.search.includes(t)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,4);
   if(scored.length){
      aiA.innerHTML=`<strong>Based on what you typed, I'd start here:</strong><div class="nextlinks">${scored.map(x=>`<a href="${x.c.querySelector('a').getAttribute('href')}">${x.c.dataset.title} →</a>`).join('')}</div><p style="margin-top:12px;font-size:12px">This is a Knowledge Hub finder, not medical advice or a clinical AI assessment.</p>`;
   }else{
      aiA.innerHTML=`I couldn't find a strong match. Try the <a href="/health-mot"><strong>Health MOT</strong></a> or browse the Knowledge Hub below.`;
   }
   aiA.classList.add('show');
 });
 apply();
})();

