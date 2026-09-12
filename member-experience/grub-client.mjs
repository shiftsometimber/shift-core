// Extend the existing Grub client without replacing its tabs, account persistence
// hooks or the shared member presentation layer.
export const recipeSource="function recipe(m){\n const name=m.name||m.title||'Recipe',ingredients=m.ingredients||[],method=m.method||[],missing=m.missing||[],matched=m.matched||[];\n const has=n=>n!==null&&n!==undefined&&n!==''&&Number.isFinite(Number(n));\n const details=ingredients.length&&method.length?`<details class=\"grub-recipe-detail\"><summary>Ingredients &amp; cooking instructions</summary><h4>Ingredients \u00b7 serves ${esc(m.servings||1)}</h4><ul>${ingredients.map(i=>`<li>${esc(i.amount)} ${esc(i.unit||'')} ${esc(i.item)}</li>`).join('')}</ul><h4>Method</h4><ol>${method.map(s=>`<li>${esc(typeof s==='string'?s:s.text||s.instruction||'')}</li>`).join('')}</ol>${m.allergens?.length?`<p><strong>Allergens:</strong> ${esc(m.allergens.join(', '))}. Check product labels.</p>`:''}${m.food_safety?.length?`<h4>Cooking safely</h4><ul>${m.food_safety.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:''}${m.storage&&typeof m.storage==='object'?Object.entries(m.storage).map(([k,v])=>`<p><strong>${esc(k.replaceAll('_',' '))}:</strong> ${esc(v)}</p>`).join(''):''}<p>Nutrition is calculated per serving; ingredients and brands can vary.</p></details>`:'';\n return `<article class=\"grub-recipe\"><small>${matched.length?(missing.length?'CLOSEST MATCH':'ALL INGREDIENTS LISTED'):'RECIPE'}</small><h3>${esc(name)}</h3>${matched.length?`<p><strong>You have:</strong> ${esc(matched.join(', '))}.</p>${missing.length?`<p><strong>Still needed:</strong> ${esc(missing.join(', '))}.</p>`:''}`:''}<div class=\"grub-meta\">${has(m.minutes)?`<span>${esc(m.minutes)} min</span>`:''}${has(m.protein_g)?`<span>${esc(m.protein_g)}g protein</span>`:''}${has(m.kcal)?`<span>${esc(m.kcal)} kcal</span>`:''}</div>${details}<div class=\"grub-actions\"><button data-save=\"${esc(name)}\">Save</button><button data-add=\"${esc(name)}\">Add to week</button></div></article>`;\n}";
const renderSource="function render(host,r){const list=ideas(r);host.innerHTML=`<p style=\"grid-column:1/-1\" role=\"status\">${esc(r?.message||'')}</p>`+(list.length?list.slice(0,12).map(recipe).join(''):'<div class=\"grub-empty\"><strong>No matching recipe.</strong><span>Try one ingredient or clear the filter.</span></div>')}";
const discover=String.raw`let activeFilter='',searchSequence=0;
async function discover(){
 const q=$('#grubSearch').value.trim(),sequence=++searchSequence;
 $('#grubDiscoverResults').innerHTML='<div class="grub-empty">Finding recipes…</div>';
 try{const result=await SST_API.conundrum({mode:'discover',query:q,filter:activeFilter});if(sequence===searchSequence)render($('#grubDiscoverResults'),result)}
 catch(e){if(sequence===searchSequence)$('#grubDiscoverResults').innerHTML='<div class="grub-empty">'+esc(e.message||'Could not search just now.')+'</div>'}
}
$('#grubSearch').addEventListener('input',()=>{activeFilter='';++searchSequence;$$('[data-filter]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')})});`;
export function improveGrubClient(original){
 let s=original;
 function section(start,end,replacement){const a=s.indexOf(start),b=s.indexOf(end,a);if(a<0||b<0)throw Error('Pinned Grub client changed: '+start);s=s.slice(0,a)+replacement+s.slice(b)}
 function exact(from,to){if(!s.includes(from))throw Error('Pinned Grub client changed: '+from);s=s.replace(from,to)}
 section('function recipe(m){','function ideas(r){',recipeSource);
 section('function render(host,r){','function drawChips(){',renderSource);
 section('async function discover(){',"$('#grubSearchGo').onclick",discover);
 exact("if(v&&!ingredients.includes(v))ingredients.push(v)","v.split(/[,;]+/).map(x=>x.trim()).filter(Boolean).forEach(x=>{if(!ingredients.includes(x))ingredients.push(x)})");
 exact('SST_API.conundrum({items:ingredients})',"SST_API.conundrum({mode:'fridge',items:ingredients})");
 exact("$('#grubStatus').textContent='Best matches first. Save, swap or open the recipe.'","$('#grubStatus').textContent=r.message||'Open a recipe for its quantities and method.'");
 exact("$$('[data-filter]').forEach(b=>b.onclick=()=>{$$('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#grubSearch').value=b.dataset.filter;discover()})","$$('[data-filter]').forEach(b=>b.onclick=()=>{activeFilter=activeFilter===b.dataset.filter?'':b.dataset.filter;$$('[data-filter]').forEach(x=>{x.classList.toggle('active',x.dataset.filter===activeFilter);x.setAttribute('aria-pressed',String(x.dataset.filter===activeFilter))});discover()})");
 return s;
}
