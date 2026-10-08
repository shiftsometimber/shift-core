import {repairCentreGuidance,repairOrderGuidance,repairOrderControllerGuidance,repairIntegratedGuidance,repairSideEffectGuidance} from './public-treatment-guidance.mjs';
// Bounded repairs against current Pages source; amounts, stock and release closure are retained.
export function repairTreatmentCentre(html){
 return html.replace('Retatrutide, CagriSema, Orforglipron, Amycretin, MariTide and the next generation of weight-management treatments.','Retatrutide, CagriSema, Amycretin, MariTide and the next generation of weight-management treatments.')
 .replace('Use the free Health MOT to organise your current picture and identify sensible priorities.','Explore the SHIFT Health MOT home blood test and what it covers.')
 .replace('>Take the Health MOT</a>','>Explore the Health MOT</a>');
}
export function repairTreatmentOrderController(source){
 const anchor='    const {label,price}=selection();';
 const marker='    // Selected pack and receipt share the current selection (WR07).';
 if(source.includes(marker))return source;
 const repair=`${marker}
    const lead=$('.op-lead');if(lead?.textContent==='This option was carried across from your preference filters. You can compare it with every other treatment route below.')lead.textContent='This is an option to compare. It may not match every format, access or budget preference you chose. Check the displayed price and compare the other treatment routes below.';
    const filterTitle=$('.op-recommendation strong');if(filterTitle?.textContent==='YOUR SELECTED FILTERS')filterTitle.textContent='THIS OPTION';
    const priceHeading=$('.op-price small');if(priceHeading)priceHeading.textContent=item.fixedDose?'PACK PRICE':'MONTHLY PRICE';
    const receipt=$('[data-receipt-list]');
    if(item.fixedDose&&receipt){
      receipt.replaceChildren();
      for(const text of [item.form+' is the format of this option. Compare it with your preferences.',label+' is your selected pack size.','The inclusive pack price is visible before clinical assessment.']){const li=document.createElement('li');li.textContent=text;receipt.appendChild(li)}
    }`;
 return source.replace(anchor,anchor+'\n'+repair).replace('matches the format selected for comparison.','is the format of this option. Compare it with your preferences.').replace('<dt>Live monthly price</dt>',"<dt>${other.fixedDose?'Live pack price':'Live monthly price'}</dt>");
}
export function repairStartHereBudget(source){
 const old="    location.href=\`/treatment-order?medicine=\${encodeURIComponent(recommended)}&view=spec&from=start-here\`;\n    return;";
 if(!source.includes(old))return source;
 const replacement=`    const budgetMax=budget.includes('£0')?0:budget.includes('Under')?99:budget.includes('100–150')?150:budget.includes('150–200')?200:budget.includes('200+')?Infinity:null;
    const priceOf=card=>{const values=[...card.textContent.matchAll(/£(\\d+(?:\\.\\d{1,2})?)/g)].map(m=>Number(m[1])).filter(Number.isFinite);return values.length?Math.min(...values):null};
    const within=[],over=[];
    cards.forEach(card=>{card.querySelector('.sh-budget-note-v1')?.remove();const price=priceOf(card),key=card.dataset.medicineKey;if(price==null||budgetMax==null)return;const note=document.createElement('p');note.className='sh-budget-note-v1';if(budgetMax===0){note.textContent='Private option — outside the £0 / NHS budget you selected.';over.push({card,price,key,delta:price});}else if(price<=budgetMax){note.textContent='Within the budget you selected, based on the displayed starting price.';within.push({card,price,key,delta:0});}else{const delta=Math.round((price-budgetMax)*100)/100;note.textContent=new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(delta)+' above the top of the budget you selected — still shown so you can compare it.';over.push({card,price,key,delta});}card.append(note)});
    within.sort((a,b)=>a.price-b.price);over.sort((a,b)=>a.delta-b.delta);
    [...within,...over].forEach(x=>grid.appendChild(x.card));
    const tabletWithin=within.find(x=>['wegovy-tablets','orlistat'].includes(x.key)),jabWithin=within.find(x=>['mounjaro','wegovy-injection'].includes(x.key)),nearest=over[0];
    if(within.length){$('[data-result-title]').textContent='Options that fit your budget — with the others kept visible.';$('[data-result-copy]').textContent=(jabWithin?'An injection option fits the budget you selected. ':'')+(tabletWithin?'A tablet option also fits, so you can compare the formats and costs. ':'')+(nearest?'The nearest option above your budget is clearly marked rather than hidden. ':'')+'These are price and preference comparisons, not clinical recommendations. Suitability is decided through clinical assessment.';}else{$('[data-result-title]').textContent='Your selected budget is below the displayed private options.';$('[data-result-copy]').textContent='We will not pretend an option fits when it does not. You can still compare the prices and formats, use free My Timber support, and keep NHS or no-medication routes in view. This is not a clinical recommendation.';}
    const first=within[0]?.card||over[0]?.card;if(first)grid.prepend(first);
    result.scrollIntoView({behavior:'smooth',block:'start'});result.querySelector('h2')?.setAttribute('tabindex','-1');result.querySelector('h2')?.focus({preventScroll:true});
    return;`;
 return source.replace(old,replacement);
}

export async function repairPromiseResponse(response,request){
 const path=new URL(request.url).pathname;
 if(request.method!=='GET'||!response.ok)return response;
 const html=['/treatment-centre','/treatment-centre.html'].includes(path);
 const script=path==='/treatment-order-prototype-v1.js';
 const startHereScript=path==='/start-here-v72.js';
 const order=['/treatment-order','/treatment-order.html'].includes(path),integrated=path==='/medicine-front-door-integrated-v1.js',sideEffects=['/articles/glp1-side-effects','/articles/glp1-side-effects.html'].includes(path);
 if(!html&&!script&&!startHereScript&&!order&&!integrated&&!sideEffects)return response;
 const source=await response.text(),body=html?repairCentreGuidance(repairTreatmentCentre(source)):script?repairOrderControllerGuidance(repairTreatmentOrderController(source)):startHereScript?repairStartHereBudget(source):order?repairOrderGuidance(source):integrated?repairIntegratedGuidance(source):repairSideEffectGuidance(source);
 const headers=new Headers(response.headers);for(const name of ['Content-Length','ETag','Last-Modified'])headers.delete(name);
 headers.set('Cache-Control','no-store');headers.set('X-Shift-Accuracy-Repair','v1');
 return new Response(body,{status:response.status,headers});
}
