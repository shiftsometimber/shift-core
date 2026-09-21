export const grubIntelligenceClient=String.raw`
let recommendationServings=null;
const foodNumber=value=>value===null||value===undefined?'—':Number(value).toLocaleString('en-GB',{maximumFractionDigits:1});
function scaledRecommendation(r,servings){
 const factor=servings/r.servings;
 return {...r,servings,ingredients:r.ingredients.map(i=>{const text=String(i.amount),m=text.match(/^(\d+(?:\.\d+)?)\s*(g|kg|ml|l)?$/i);return {...i,amount:m?foodNumber(Number(m[1])*factor)+(m[2]||''):factor===1?text:foodNumber(factor)+' × ('+text+')'}})};
}
function drawRecommendation(){
 const host=$('#grubRecommendation');if(!host)return;
 const pick=workspace?.recommendation,r=pick?.recipe;
 if(!r){host.innerHTML='<p class="grub-result-message">'+esc(pick?.message||'Loading your recommendation…')+'</p>';return}
 remember([r]);recommendationServings??=pick.servings||1;
 const rationale='<section class="grub-pick-why"><small>WHY SHIFT PICKED THIS</small><ul>'+pick.reasons.map(reason=>'<li>'+esc(reason)+'</li>').join('')+'</ul><p>'+esc(pick.benefit)+'</p></section>';
 const controls='<p><strong>Change what matters</strong></p><div class="grub-pick-adjust" role="group" aria-label="Adjust this meal">'+[['lighter','Make it lighter'],['fuller','More filling'],['protein','Higher protein'],['quicker','Make it quicker'],['budget','Make it cheaper']].map(([mode,label])=>'<button type="button" data-food-write data-grub-adjust="'+mode+'" aria-pressed="'+(pick.mode===mode)+'">'+label+'</button>').join('')+'</div><p class="grub-pick-change" role="status">'+esc(pick.message||pick.delta)+'</p><label class="grub-pick-servings">People eating<select id="grubPickServings">'+Array.from({length:8},(_,i)=>'<option value="'+(i+1)+'" '+(recommendationServings===i+1?'selected':'')+'>'+(i+1)+'</option>').join('')+'</select></label><p>Ingredients shown for '+recommendationServings+'. Nutrition is per person.</p>';
 const feedback='<section class="grub-pick-feedback"><strong>Should Shift keep this sort of meal?</strong><div class="grub-actions"><button data-food-write data-grub-feedback="yay" data-recipe-id="'+esc(r.id)+'">Yay — keep this sort</button><button data-food-write data-grub-feedback="nay" data-recipe-id="'+esc(r.id)+'">Nay — not again</button></div><p>'+pick.learned.yay+' liked · '+pick.learned.nay+' excluded by your feedback. Your choices are remembered.</p></section>';
 host.innerHTML='<p class="eyebrow">SHIFT GRUB · YOUR NEXT MEAL</p>'+card(scaledRecommendation(r,recommendationServings)).replace('<details class="grub-recipe-detail">',rationale+controls+'<details class="grub-recipe-detail">')+feedback+'<div class="grub-pick-fit"><strong>Fit + Grub, together</strong><p>'+esc(pick.fit)+'</p></div>';
 $('#grubPickServings').onchange=e=>{recommendationServings=Number(e.target.value);drawRecommendation();lock()};
}
function nutritionContextMarkup(){
 const info=workspace?.nutritionContext;if(!info?.days.length)return '';
 const line=d=>'<span>'+foodNumber(d.kcal)+' kcal</span><span>'+foodNumber(d.protein)+'g protein</span><span>'+foodNumber(d.fibre)+'g fibre</span>';
 return '<section class="grub-nutrition-context"><h3>How your plan adds up</h3><p>Per person, from the meals saved below. Snacks, drinks and unlogged food are not included. These are planned meals, not a record of what you ate.</p>'+info.days.map(d=>'<div class="grub-nutrition-row"><strong>Day '+d.day+' · '+d.meals+' meals</strong>'+line(d)+'</div>').join('')+'<div class="grub-nutrition-row"><strong>Whole saved plan</strong>'+line(info.totals)+'</div></section>';
}
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-grub-adjust],[data-grub-feedback]');if(!button||button.disabled)return;
 const action=button.hasAttribute('data-grub-adjust')?{action:'recommendation-adjust',mode:button.dataset.grubAdjust}:{action:'recommendation-feedback',recipeId:button.dataset.recipeId,sentiment:button.dataset.grubFeedback};
 await mutate(action,action.action==='recommendation-adjust'?'Recommendation updated. Review it, then choose a day to add it to your week.':'Your preference is saved and will shape future recommendations.');
});
`;

export const grubIntelligenceCSS=`

/* Legacy member button rules use important cream text. Set the complete colour
   pair on these controls, including Safari's painted text colour. */
html body.sst-member-experience #grubRecommendation .grub-pick-adjust button,
html body.sst-member-experience #grubRecommendation #grubPickServings,
html body.sst-member-experience #grubRecommendation #grubPickServings option{
 background:#e7e3da!important;color:#707762!important;-webkit-text-fill-color:#707762!important;
}
html body.sst-member-experience #grubRecommendation .grub-pick-adjust button[aria-pressed="true"]{
 background:#050505!important;color:#e7e3da!important;-webkit-text-fill-color:#e7e3da!important;
}
.sst-member-experience #grubRecommendation{margin:22px 0 28px;max-width:1080px}.sst-member-experience #grubRecommendation[hidden]{display:none}.sst-member-experience .grub-food-image{margin:16px 0}.sst-member-experience .grub-food-image img{display:block;width:100%;height:auto;max-height:460px;object-fit:cover;border-radius:12px}.sst-member-experience .grub-food-image figcaption{font-size:13px;margin-top:7px}.sst-member-experience #grubRecommendation>.grub-recipe{background:#e7e3da;color:#050505;border-color:#707762;padding:24px;border-radius:16px}.sst-member-experience #grubRecommendation .grub-recipe :is(h3,h4,p,span,small,strong,summary,li,label){color:#050505}.sst-member-experience #grubRecommendation button,.sst-member-experience #grubRecommendation select{background:#e7e3da;color:#050505;border:1px solid #707762;min-height:44px;font:inherit}.sst-member-experience #grubRecommendation button[aria-pressed="true"]{background:#050505;color:#e7e3da}.sst-member-experience .grub-pick-why{margin:20px 0;padding:18px 0;border-top:1px solid #707762;border-bottom:1px solid #707762}.sst-member-experience .grub-pick-why ul{padding-left:20px}.sst-member-experience .grub-pick-adjust{display:flex;flex-wrap:wrap;gap:8px}.sst-member-experience .grub-pick-adjust button{border-radius:10px;padding:10px 14px}.sst-member-experience .grub-pick-change{padding:12px;border-left:4px solid #707762}.sst-member-experience .grub-pick-servings{display:flex;gap:16px;align-items:center}.sst-member-experience .grub-pick-servings select{padding:10px;min-width:80px}.sst-member-experience .grub-pick-feedback,.sst-member-experience .grub-pick-fit{margin-top:18px;padding:20px;border:1px solid #707762;border-radius:12px}.sst-member-experience .grub-nutrition-context{grid-column:1/-1;padding:20px;border:1px solid #707762;border-radius:12px;margin-bottom:20px}.sst-member-experience .grub-nutrition-row{display:flex;gap:15px;flex-wrap:wrap;padding:12px 0;border-top:1px solid #707762}.sst-member-experience .grub-nutrition-row strong{min-width:160px}@media(max-width:600px){.sst-member-experience #grubRecommendation>.grub-recipe{padding:16px}.sst-member-experience .grub-pick-adjust button{flex:1 1 45%;min-width:0}.sst-member-experience #grubRecommendation .grub-actions{flex-wrap:wrap}.sst-member-experience .grub-pick-feedback button{flex:1 1 130px}.sst-member-experience .grub-nutrition-row{gap:8px 14px}.sst-member-experience .grub-nutrition-row strong{width:100%}}
`;
