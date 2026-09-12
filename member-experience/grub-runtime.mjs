import {recipeSource} from './grub-client.mjs';
export const grubRuntime=String.raw`(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let workspace=null,busy=false,activeFilter='',sequence=0,ingredients=[],pending=null;
const known=new Map(),notice=$('#grubAccountStatus');
const remember=list=>(list||[]).forEach(r=>known.set(r.id,r));
async function api(path,body){const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),20000);try{
 const r=await fetch('/v1/grub/'+path,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:ctrl.signal});
 const data=await r.json();if(r.ok&&(!data||typeof data!=='object'||(path==='workspace'&&(!Number.isInteger(data.revision)||!Array.isArray(data.saved)||!Array.isArray(data.week)||!Array.isArray(data.shopping)))))throw Error('Your account response was incomplete. Reload before making changes.');if(!r.ok){const e=new Error(r.status===401?'Your session has ended. Sign in to open your saved food.':data.error||'Could not complete this request.');e.status=r.status;throw e}return data;
}catch(e){if(e.name==='AbortError')throw new Error('The request timed out. Reload to check whether it saved before trying again.');throw e}finally{clearTimeout(timeout)}}
function message(text,error=false){notice.textContent=text;notice.dataset.error=String(error);$$('dialog[open] .food-dialog-status').forEach(p=>p.textContent=text)}
function lock(){ $$('[data-food-write]').forEach(b=>b.disabled=busy||!workspace);$('#grubReload').disabled=busy; }
function open(name){$$('[data-grub-panel]').forEach(x=>{const on=x.dataset.grubPanel===name;x.classList.toggle('active',on);x.hidden=!on});$$('[data-grub-tab]').forEach(x=>{const on=x.dataset.grubTab===name;x.classList.toggle('active',on);x.setAttribute('aria-selected',String(on));x.tabIndex=on?0:-1})}
$$('[data-grub-tab]').forEach(b=>b.onclick=()=>open(b.dataset.grubTab));$$('[data-open-grub]').forEach(b=>b.onclick=()=>open(b.dataset.openGrub));
`+recipeSource+String.raw`
function card(r,entry){
 const saved=workspace?.saved.includes(r.id),controls='<div class="grub-actions"><button data-food-write data-food-save="'+esc(r.id)+'" aria-pressed="'+!!saved+'">'+(saved?'Remove saved recipe':'Save recipe')+'</button><button data-food-write data-food-add="'+esc(r.id)+'">Choose day &amp; add</button></div>';
 let html=recipe(r).replace(/<div class="grub-actions">[\s\S]*?<\/div>/,()=>controls);
 if(entry)html=html.replace('<small>', '<small>Day '+entry.day+' · '+esc(entry.slot)+' · '+entry.servings+' serving'+(entry.servings===1?'':'s')+' · ').replace('</article>','<p>Recipe quantities above serve '+r.servings+'. The shopping list is scaled to your '+entry.servings+' serving'+(entry.servings===1?'':'s')+'.</p><div class="grub-actions"><button data-food-write data-food-swap="'+esc(entry.key)+'">Swap this meal</button><button data-food-write data-food-remove="'+esc(entry.key)+'">Remove meal</button></div></article>');
 return html;
}
function renderResults(host,result){remember(result.top);host.innerHTML='<p class="grub-result-message" role="status">'+esc(result.message)+'</p>'+(result.top?.length?result.top.map(r=>card(r)).join(''):'<div class="grub-empty">Try one ingredient or clear the filter.</div>');lock()}
function draw(){
 if(!workspace)return;remember(workspace.recipes);
 $('#grubSaved').innerHTML=workspace.saved.length?workspace.saved.map(id=>known.has(id)?card(known.get(id)):'<p>This saved recipe is no longer published.</p>').join(''):'<div class="grub-empty">Nothing saved yet. Open Discover and save a recipe you like.</div>';
 $('#grubWeekOutput').innerHTML=workspace.week.length?workspace.week.map(entry=>known.has(entry.recipeId)?card(known.get(entry.recipeId),entry):'<p>A planned recipe is no longer available. Replace your plan to update it.</p>').join(''):'<div class="grub-empty">Your week is clear. Build a plan or choose a day from any recipe.</div>';
 $('#shoppingList').innerHTML=workspace.shopping.length?workspace.shopping.map(x=>'<div class="shopping-item '+(x.done?'done':'')+'"><label><input data-food-write type="checkbox" data-food-check="'+esc(x.key)+'" '+(x.done?'checked':'')+'><span>'+esc(x.text)+'</span></label><button data-food-write data-food-delete="'+esc(x.key)+'" aria-label="Remove '+esc(x.text)+'">Remove</button></div>').join(''):'<div class="grub-empty">Your list is clear. Ingredients appear when you add meals to your week.</div>';
 $$('[data-food-save]').forEach(b=>{const on=workspace.saved.includes(b.dataset.foodSave);b.textContent=on?'Remove saved recipe':'Save recipe';b.setAttribute('aria-pressed',String(on))});lock();
}
async function load(){if(busy)return;busy=true;lock();message('Loading your saved food…');try{workspace=await api('workspace');pending=null;draw();message('Your food is up to date. Changes save to your private account.')}catch(e){workspace=null;$('#grubSaved').textContent='Sign in or retry loading your saved recipes.';$('#grubWeekOutput').textContent='Your saved week is unavailable until your account loads.';$('#shoppingList').textContent='Your shopping list is unavailable until your account loads.';message(e.message,true)}finally{busy=false;lock()}}
async function mutate(action,success){
 if(busy||!workspace)return false;const focus=document.activeElement,focusData=focus?.dataset?{...focus.dataset}:null;busy=true;lock();message('Saving to your account…');
 const signature=JSON.stringify(action);if(!pending||pending.signature!==signature)pending={signature,body:{...action,revision:workspace.revision,operationId:crypto.randomUUID()}};
 try{workspace=await api('workspace',pending.body);pending=null;draw();message(success);if(focusData&&!focus.isConnected){const target=$$('[data-food-write]').find(b=>b.getClientRects().length&&Object.entries(focusData).every(([k,v])=>b.dataset[k]===v));target?.focus({preventScroll:true})}return true}
 catch(e){message(e.message+' Your screen has not been marked as saved.',true);if(e.status===401){workspace=null;known.clear();$('#grubSaved').textContent='Sign in to view saved recipes.';$('#grubWeekOutput').textContent='Sign in to view your week.';$('#shoppingList').textContent='Sign in to view your shopping list.'}if(e.status===409)pending=null;return false}
 finally{busy=false;lock()}
}
$('#grubReload').onclick=load;
async function discover(){const n=++sequence;$('#grubDiscoverResults').textContent='Finding recipes…';try{const r=await api('search',{mode:'discover',query:$('#grubSearch').value.trim(),filter:activeFilter});if(n===sequence)renderResults($('#grubDiscoverResults'),r)}catch(e){if(n===sequence)$('#grubDiscoverResults').textContent=e.message}}
$('#grubSearchGo').onclick=discover;$('#grubSearch').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();discover()}};
$('#grubSearch').addEventListener('input',()=>{activeFilter='';++sequence;$$('[data-filter]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')})});
$$('[data-filter]').forEach(b=>b.onclick=()=>{activeFilter=activeFilter===b.dataset.filter?'':b.dataset.filter;$$('[data-filter]').forEach(x=>{const on=x.dataset.filter===activeFilter;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on))});discover()});
function drawChips(){$('#sgIngredientChips').innerHTML=ingredients.map((x,i)=>'<button data-remove="'+i+'">'+esc(x)+' ×</button>').join('')}
$('#sgAddIngredient').onclick=()=>{const field=$('#sgIngredientInput');for(const x of field.value.split(/[,;]+/).map(x=>x.trim()).filter(Boolean))if(!ingredients.includes(x)&&ingredients.length<40)ingredients.push(x);field.value='';drawChips()};
$('#sgIngredientInput').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('#sgAddIngredient').click()}};
$('#sgIngredientChips').onclick=e=>{const b=e.target.closest('[data-remove]');if(b){ingredients.splice(+b.dataset.remove,1);drawChips()}};
$('#grubGenerate').onclick=async()=>{if($('#sgIngredientInput').value.trim())$('#sgAddIngredient').click();$('#grubStatus').textContent='Finding matches…';try{const r=await api('search',{mode:'fridge',items:ingredients});renderResults($('#grubOutput'),r);$('#grubStatus').textContent=r.message}catch(e){$('#grubStatus').textContent=e.message}};
$('#grubWeekGenerate').onclick=async()=>{const action={action:'plan',options:{days:+$('#grubDays').value,style:$('#grubStyle').value,servings:+$('#grubServings').value,exclude:$('#grubPrefs').value}};if(workspace?.week.length){$('#grubReplaceDialog').showModal();$('#grubConfirmReplace').onclick=async()=>{if(await mutate(action,'Your week and its ingredient list are saved.')){$('#grubReplaceDialog').close();$('#grubWeekStatus').textContent='Breakfast, lunch and dinner saved. Swap any meal below.'}}}else if(await mutate(action,'Your week and its ingredient list are saved.'))$('#grubWeekStatus').textContent='Breakfast, lunch and dinner saved. Swap any meal below.'};
const dialog=$('#grubAddDialog');let chosen='';
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-food-save],[data-food-add],[data-food-swap],[data-food-remove],[data-food-delete]');if(!b||b.disabled)return;
 if(b.hasAttribute('data-food-save'))await mutate({action:'save',recipeId:b.dataset.foodSave,saved:!workspace.saved.includes(b.dataset.foodSave)},'Your saved recipes are up to date.');
 if(b.hasAttribute('data-food-add')){chosen=b.dataset.foodAdd;$('#grubAddTitle').textContent='Plan '+known.get(chosen).name;dialog.showModal()}
 if(b.hasAttribute('data-food-swap'))await mutate({action:'swap',key:b.dataset.foodSwap},'Meal swapped. Your shopping list has been updated.');
 if(b.hasAttribute('data-food-remove'))await mutate({action:'remove-meal',key:b.dataset.foodRemove},'Meal removed. Your shopping list has been updated.');
 if(b.hasAttribute('data-food-delete'))await mutate({action:'shopping-remove',key:b.dataset.foodDelete},'Shopping item removed. It will return if you update a meal that needs it.');
});
$('#grubAddForm').onsubmit=async e=>{e.preventDefault();if(await mutate({action:'add',recipeId:chosen,day:+$('#grubAddDay').value,slot:$('#grubAddSlot').value,servings:+$('#grubAddServings').value},'Meal and ingredients saved to your week.')){dialog.close();open('week')}};
$$('[data-close-food]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$('#shoppingForm').onsubmit=async e=>{e.preventDefault();const field=$('#shoppingInput');if(await mutate({action:'shopping-add',text:field.value},'Shopping item saved.'))field.value=''};
$('#shoppingList').addEventListener('change',async e=>{const c=e.target.closest('[data-food-check]');if(!c)return;const done=c.checked;c.checked=!done;if(!await mutate({action:'shopping-check',key:c.dataset.foodCheck,done},done?'Marked as bought.':'Marked as needed.'))draw()});
$('#grubPrint').onclick=()=>window.print();
$('#grubSignOut').onclick=async()=>{if(busy)return;busy=true;lock();message('Signing out…');try{const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);let r;try{r=await fetch('/v1/auth/logout',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}',signal:ctrl.signal})}finally{clearTimeout(timer)}if(!r.ok)throw Error('Sign-out failed. Try again.');location.assign(document.body.dataset.foodStaging?' /staging/sign-in'.trim():'/member/dashboard')}catch(e){message(e.message,true);busy=false;lock()}};
open(location.hash==='#saved'?'saved':'discover');load();
})();`;

export function upgradeGrubHTML(html,{staging=false}={}){
 html=html.replace(/<script\b[^>]*src="[^"]*(?:member-grub-v8|member-grub-persistence-v1)[^"]*"[^>]*>[\s\S]*?<\/script>/g,'');
 html=html.replace('</body>','<script defer src="/assets/member-experience/grub.mjs"></script></body>');
 const status='<div class="grub-account"><p id="grubAccountStatus" role="status" aria-live="polite">Loading your saved food…</p><div class="grub-actions"><button id="grubReload">Reload saved food</button><a href="'+(staging?'/staging/sign-in':'/member/dashboard')+'">Sign in</a><button id="grubSignOut">Sign out</button>'+'</div></div>';
 html=html.replace('<nav class="grub-v8-tabs"',status+'<nav class="grub-v8-tabs"');
 html=html.replace(/<label>Anything to work around\?[\s\S]*?<\/label>/,'<label>Servings per meal<select id="grubServings">'+Array.from({length:8},(_,i)=>'<option>'+(i+1)+'</option>').join('')+'</select></label><label>Ingredients to leave out (comma-separated)<input id="grubPrefs" placeholder="Fish, mushrooms"></label><p>Breakfast, lunch and dinner from the reviewed recipe library. This is not an allergy checker: check every recipe and product label. Shopping quantities scale to the servings you choose. Fast plans use quick wraps, sandwiches and other lunch recipes for dinner too.</p>');
 html=html.replace('value="simple high-protein everyday food"','value="protein"').replace('value="budget family meals"','value="budget"').replace('value="fast meals under 25 minutes"','value="fast"').replace('value="vegetarian high-protein meals"','value="vegetarian"');
 html=html.replace('id="grubWeekGenerate"','id="grubWeekGenerate" data-food-write').replace('id="shoppingInput"','id="shoppingInput" maxlength="160"').replace('<button>+</button></form><div id="shoppingList"','<button data-food-write>+</button></form><button id="grubPrint">Print shopping list</button><p>Updating a meal rebuilds its ingredients. Items with changed quantities return to needed.</p><div id="shoppingList"');
 html=html.replace('Recipes you explicitly save and meals you add to your week stay in your My Timber account. Generated previews are not saved automatically.','Saved recipes, your confirmed week and shopping list stay in your private My Timber account. Building a week saves it and creates the ingredient list.');
 html=html.replace('</main>','<dialog id="grubAddDialog"><h2 id="grubAddTitle">Add to your week</h2><p>This replaces the meal already in the selected slot.</p><p class="food-dialog-status" role="status"></p><form id="grubAddForm"><label>Day<select id="grubAddDay">'+Array.from({length:7},(_,i)=>'<option value="'+(i+1)+'">Day '+(i+1)+'</option>').join('')+'</select></label><label>Meal<select id="grubAddSlot"><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner" selected>Dinner</option></select></label><label>Servings<select id="grubAddServings">'+Array.from({length:8},(_,i)=>'<option>'+(i+1)+'</option>').join('')+'</select></label><button data-food-write type="submit">Save meal to week</button><button type="button" data-close-food>Cancel</button></form></dialog><dialog id="grubReplaceDialog"><h2>Replace your saved week?</h2><p>Your current meals and their shopping ingredients will be replaced. Manually added shopping items stay.</p><p class="food-dialog-status" role="status"></p><button id="grubConfirmReplace" data-food-write>Replace and save week</button><button data-close-food>Keep current week</button></dialog></main>');
 return html;
}
