// V2.11A Knowledge Experience
(function(){
 const cards=[...document.querySelectorAll('#knowledgeResults .knowledge-card')];
 const topicFor=(path,text)=> /blood|metabolic|testosterone/.test(path)?'health':/workout|exercise|walking|fitness|muscle/.test(path)?'fitness':/breakfast|meal|diet|protein|nutrition/.test(path)?'nutrition':/emotional|binge|antidepressant|mental/.test(path)?'mind':/glp|ozempic|wegovy|semaglutide|mounjaro|medication/.test(path)?'GLP-1':'weight';
 cards.forEach((card,index)=>{const path=new URL(card.querySelector('a')?.href||location.href).pathname;card.dataset.resourcePath=path;card.dataset.title=card.dataset.title||card.querySelector('h3')?.textContent.trim()||card.textContent.trim();card.dataset.search=(card.dataset.search||card.textContent).toLowerCase();card.dataset.type=card.dataset.type||(/\/faq\//.test(path)?'FAQ':/\/guides\//.test(path)?'Ultimate Guide':/\/tools\//.test(path)?'Calculator':'Article');card.dataset.topic=card.dataset.topic||topicFor(path,card.textContent);card.dataset.order=String(index);});
 let orderData={items:{}},dateLoads=new Map();
 const dateValue=card=>{const raw=orderData.items[card.dataset.resourcePath]?.published||card.dataset.published;const n=Date.parse(raw||'');return Number.isFinite(n)?n:null;};
 const dateCompare=(a,b,dir)=>{const x=dateValue(a),y=dateValue(b);return x===null?(y===null?0:1):y===null?-1:dir*(x-y);};
 const tie=(a,b)=>a.dataset.title.localeCompare(b.dataset.title,'en-GB')||Number(a.dataset.order)-Number(b.dataset.order);
 if(!cards.length) return;
 const search=document.getElementById('knowledgeSearch');
 const type=document.getElementById('knowledgeType');
 const sort=document.getElementById('knowledgeSort');
 const count=document.getElementById('resultCount');
 const note=document.createElement('p');note.id='knowledgeSortNote';note.setAttribute('aria-live','polite');count?.before(note);
 const view=document.createElement('div');view.className='knowledge-view';view.setAttribute('role','group');view.setAttribute('aria-label','Results layout');view.innerHTML='<button type="button" data-layout="grid" aria-pressed="true">Grid</button> <button type="button" data-layout="list" aria-pressed="false">List</button>';count?.before(view);
 view.addEventListener('click',e=>{const b=e.target.closest('[data-layout]');if(!b)return;document.getElementById('knowledgeResults').classList.toggle('knowledge-list',b.dataset.layout==='list');view.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
 document.getElementById('knowledgeShowMore')?.setAttribute('hidden','');
 if(count)count.setAttribute('aria-live','polite');
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
   cards.forEach(c=>{c.style.display='none';c.hidden=true;});
   const mode=sort?.value||'default';
   shown.sort((a,b)=>{
     if(mode==='az') return a.dataset.title.localeCompare(b.dataset.title);
     if(mode==='za') return b.dataset.title.localeCompare(a.dataset.title);
     if(mode==='newest'||mode==='oldest')return dateCompare(a,b,mode==='newest'?-1:1)||tie(a,b);
     if(mode==='popular')return (orderData.items[b.dataset.resourcePath]?.popularity||0)-(orderData.items[a.dataset.resourcePath]?.popularity||0)||dateCompare(a,b,-1)||tie(a,b);
     return Number(a.dataset.order)-Number(b.dataset.order);
   });
   const grid=document.getElementById('knowledgeResults');
   shown.forEach(c=>{c.style.display='block';c.hidden=false;grid.appendChild(c)});
   const pop=orderData.popularity;note.textContent=mode==='popular'?(pop?'Based on recorded page views, '+new Date(pop.start+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short'})+'–'+new Date(pop.end+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})+'. Equal counts are ordered newest first.':'Popularity data is unavailable. Showing newest first.'):(mode==='newest'||mode==='oldest')?'Sorted by original publication date. Undated resources appear last.':'';
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
 function showDates(){cards.forEach(card=>{let label=card.querySelector('[data-knowledge-date]');if(!label){label=document.createElement('p');label.dataset.knowledgeDate='';label.className='knowledge-date';card.append(label);}const n=dateValue(card);label.textContent=n===null?'Publication date unavailable':'Published '+new Date(n).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});});}
 async function loadOrder(){try{const response=await fetch('/assets/knowledge-order-data-v1.json',{cache:'no-cache'});if(!response.ok)throw Error('unavailable');const data=await response.json();if(data.version!==1||!data.items)throw Error('invalid');orderData=data;}catch{}showDates();apply();
 // Newly published cards can appear between catalogue refreshes. Recover only
 // their actual published dates from same-origin Article schema, never modified dates.
 const missing=cards.filter(card=>!Object.hasOwn(orderData.items,card.dataset.resourcePath));let next=0;await Promise.all(Array.from({length:Math.min(3,missing.length)},async()=>{while(next<missing.length){const card=missing[next++],path=card.dataset.resourcePath;try{let task=dateLoads.get(path);if(!task){task=fetch(path,{signal:AbortSignal.timeout(10000)}).then(r=>r.ok?r.text():'');dateLoads.set(path,task);}const html=await task,doc=new DOMParser().parseFromString(html,'text/html');let published=null;for(const script of doc.querySelectorAll('script[type="application/ld+json"]')){try{const walk=x=>{if(!x||typeof x!=='object')return;if(/Article|BlogPosting/.test(String(x['@type']))&&typeof x.datePublished==='string')published=x.datePublished;Object.values(x).forEach(v=>{if(v&&typeof v==='object')Array.isArray(v)?v.forEach(walk):walk(v);});};walk(JSON.parse(script.textContent));}catch{}}orderData.items[path]={published,popularity:0};}catch{}}}));showDates();apply();}
 apply();loadOrder();
})();

