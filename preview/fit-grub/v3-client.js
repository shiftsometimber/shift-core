(()=>{
 const rows=JSON.parse(document.querySelector('#fit-data').textContent),$=s=>document.querySelector(s);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let page=0,opener=null;const pageSize=12;
 function render(){
  const query=$('#fit-search').value.trim().toLowerCase().replaceAll('-',' '),status=$('#fit-status').value;
  const found=rows.filter(r=>(status==='all'||r.status===status)&&(!query||(r.title+' '+r.id+' '+r.variants.map(v=>v.name).join(' ')).toLowerCase().replaceAll('-',' ').includes(query)));
  const pages=Math.max(1,Math.ceil(found.length/pageSize));page=Math.min(page,pages-1);
  $('#fit-count').textContent=`${found.length} movements · ${status==='held'?'Images withheld':status==='approved'?'Approved visuals':'All statuses'}`;
  $('#fit-cards').innerHTML=found.slice(page*pageSize,(page+1)*pageSize).map(r=>r.status==='approved'?`<article class="fit-card"><img src="${r.image}" width="1280" height="720" alt="${esc(r.title)} — three-panel illustration" loading="lazy" decoding="async"><div class="copy"><p class="eyebrow">Visual approved</p><h2>${esc(r.title)}</h2><p>${r.variants.length} mapped variant records</p><button type="button" data-open-fit="${r.id}">View ${esc(r.title)}</button></div></article>`:`<article class="fit-card held"><p class="eyebrow">Held · image excluded</p><h2>${esc(r.title)}</h2><p>${esc(r.reason)}</p></article>`).join('')||'<p>No movements found. Try another search.</p>';
  $('#fit-page').textContent=`${page+1} / ${pages}`;$('#fit-prev').disabled=page===0;$('#fit-next').disabled=page===pages-1;
 }
 $('#fit-search').addEventListener('input',()=>{page=0;render();});$('#fit-status').addEventListener('change',()=>{page=0;render();});
 $('#fit-prev').onclick=()=>{page--;render();$('#fit-count').scrollIntoView({block:'center'});};$('#fit-next').onclick=()=>{page++;render();$('#fit-count').scrollIntoView({block:'center'});};
 $('#fit-cards').addEventListener('click',e=>{
  const button=e.target.closest('[data-open-fit]');if(!button)return;
  const r=rows.find(r=>r.id===button.dataset.openFit&&r.status==='approved');if(!r)return;
  opener=button;$('#fit-detail').innerHTML=`<p class="eyebrow">SHIFT Fit · Visual approved</p><h2 id="fit-title">${esc(r.title)}</h2><img class="fit-large" src="${r.image}" width="1280" height="720" alt="${esc(r.title)} — all three panels"><div class="fit-panels">${[0,1,2].map(i=>`<figure><div class="fit-panel"><img src="${r.image}" style="left:-${i*100}%" alt="${esc(r.title)} — panel ${i+1}"></div><figcaption>Panel ${i+1} of 3</figcaption></figure>`).join('')}</div><p>Use alongside the written instructions for the exact exercise in your programme.</p><details><summary>${r.variants.length} mapped variant records</summary><ul>${r.variants.map(v=>`<li>${esc(v.name)}</li>`).join('')}</ul><p>These are source mappings. A shared image does not demonstrate every variation’s technique or equipment.</p></details>`;
  $('#fit-dialog').showModal();$('#fit-dialog').scrollTop=0;
 });
 $('#fit-close').onclick=()=>$('#fit-dialog').close();$('#fit-dialog').addEventListener('close',()=>opener?.focus());
 render();
})();
