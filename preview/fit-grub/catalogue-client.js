(()=>{
  const records=JSON.parse(document.querySelector('#catalogue-data').textContent);
  const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const list=(items,ordered=false)=>`<${ordered?'ol':'ul'}>${(items||[]).map(x=>`<li>${esc(typeof x==='string'?x:JSON.stringify(x))}</li>`).join('')}</${ordered?'ol':'ul'}>`;
  let kind='food',page=0,opener=null;const pageSize=12;
  const photo=(r,card=false)=>r.image?`<img class="${r.kind==='movement'?'sequence':'food-photo'}" src="${esc(r.image.url)}" alt="${esc(r.image.alt)}" loading="lazy" decoding="async" ${card?'width="1448" height="1086"':''}>`:'';
  function render(){
    const query=$('#search').value.trim().toLocaleLowerCase('en-GB').replaceAll('-',' '),meal=$('#meal').value,status=$('#status').value;
    const matches=records.filter(r=>r.kind===kind&&(!query||(r.title+' '+r.id+' '+JSON.stringify(r.source.ingredients||[])).toLowerCase().replaceAll('-',' ').includes(query))&&(kind!=='food'||!meal||r.meal===meal)&&(!status||(status==='with'?!!r.image:!r.image))).sort((a,b)=>Number(!!b.image)-Number(!!a.image)||a.title.localeCompare(b.title));
    const totalPages=Math.max(1,Math.ceil(matches.length/pageSize));page=Math.min(page,totalPages-1);
    $('#meal-label').hidden=kind!=='food';
    $('#results-count').textContent=`${matches.length} ${kind==='food'?'recipes':'movements'} found${kind==='movement'?' · Open a movement to inspect its 51 variants':''}`;
    $('#cards').innerHTML=matches.length?matches.slice(page*pageSize,(page+1)*pageSize).map(r=>`<article class="card ${r.image?'has-image':'pending'}">${photo(r,true)}<div class="card-copy"><p class="eyebrow">${esc(r.meal||'Movement guide')}</p><h2>${esc(r.title)}</h2><p>${r.kind==='food'?`${r.source.ingredients.length} ingredients · Serves ${esc(r.source.servings)}`:'51 variants · '+esc(r.source.member_equipment||'See equipment')}</p><p class="image-status">${r.image?(r.kind==='food'?'New preview photograph':'Draft example · technique review pending'):'Photography pending'}</p><button type="button" data-open="${esc(r.id)}">${r.kind==='food'?'View recipe':'View movement'} <span aria-hidden="true">↗</span></button></div></article>`).join(''):'<p>No items match those filters. Try another search or select all items.</p>';
    $('#page-number').textContent=`Page ${page+1} of ${totalPages}`;$('#previous').disabled=page===0;$('#next').disabled=page===totalPages-1;
  }
  function variant(r,index){
    const v=r.variants[index];
    $('#variant-content').innerHTML=`<h3>${esc(v.title)}</h3><p>Original protocol instructions</p>${list(v.instructions,true)}<dl>${Object.entries(v.dosage||{}).map(([k,v])=>`<dt>${esc(k.replaceAll('_',' '))}</dt><dd>${esc(v)}</dd>`).join('')}</dl><p>Equipment: ${esc([v.equipment].flat().join(', '))}</p><p class="notice">The image above illustrates the base movement only. This variant’s image match is pending; follow its specific instructions, equipment and dosage.</p>`;
  }
  function open(r,button){
    opener=button;const s=r.source;
    $('#detail-content').innerHTML=`<p class="eyebrow">${esc(r.meal||'SHIFT Fit')}</p><h2 id="detail-title">${esc(r.title)}</h2>${photo(r)}${r.image?`<p class="notice">${esc(r.image.note)}</p>`:'<p class="notice">A matching photograph has not yet been added.</p>'}${r.kind==='food'?`<p>Serves ${esc(s.servings)}</p><h3>Ingredients</h3>${list(s.ingredients.map(x=>x.amount+' '+x.item))}<h3>Method</h3>${list(s.method,true)}<h3>Equipment</h3>${list([s.equipment].flat().filter(Boolean))}<h3>Storage</h3><p>${esc(typeof s.storage==='string'?s.storage:JSON.stringify(s.storage||'No storage guidance supplied.'))}</p><h3>Food safety</h3>${list(s.food_safety)}<h3>Allergens</h3>${list(s.allergens)}`:`<h3>Base movement instructions</h3>${list(s.instructions,true)}<h3>Form and safety cues</h3>${list([...(s.form_cues||[]),...(s.safety_cues||[])])}<p><strong>${esc(s.regression?.label)}:</strong> ${esc(s.regression?.instruction)}</p><label class="variant-label">Inspect a variant<select id="variant">${r.variants.map((v,i)=>`<option value="${i}">${esc(v.title)}</option>`).join('')}</select></label><section id="variant-content"></section>`}`;
    if(r.kind==='movement'){variant(r,0);$('#variant').addEventListener('change',e=>variant(r,Number(e.target.value)));}
    $('#detail').showModal();$('#detail').scrollTop=0;
  }
  document.querySelectorAll('[data-kind]').forEach(button=>button.addEventListener('click',()=>{kind=button.dataset.kind;page=0;document.querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();}));
  ['search','meal','status'].forEach(id=>$('#'+id).addEventListener(id==='search'?'input':'change',()=>{page=0;render();}));
  $('#cards').addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(b){const r=records.find(r=>r.id===b.dataset.open);if(r)open(r,b);}});
  $('#close-detail').addEventListener('click',()=>$('#detail').close());$('#detail').addEventListener('close',()=>opener?.focus());
  $('#previous').addEventListener('click',()=>{page--;render();$('#results-count').scrollIntoView({block:'center'});});
  $('#next').addEventListener('click',()=>{page++;render();$('#results-count').scrollIntoView({block:'center'});});
  render();
})();
