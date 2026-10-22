let catalogueRun=0;
function medicineKey(product){const n=String(product.name||'').toLowerCase();return n.includes('mounjaro')?'mounjaro':n.includes('wegovy')?(n.includes('tablet')?'wegovy-tablets':'wegovy-injection'):n.includes('foundayo')?'foundayo':n.includes('orlistat')?'orlistat':n.includes('liraglutide')?'liraglutide':'';}
function money(p){return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:2}).format(p/100);}
function appendText(parent,tag,text,cls){const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;parent.append(el);return el;}
async function renderMedicines(choice){
 const run=++catalogueRun,section=$('#sw-medicines'),grid=$('#sw-medicine-grid'),status=$('#sw-match-explanation'),retry=$('#sw-retry-catalogue');
 section.hidden=choice.noMed;grid.replaceChildren();retry.hidden=true;if(choice.noMed)return;
 status.textContent='Checking current prices and stock…';retry.onclick=()=>renderMedicines(choice);
 let products=[],failed=false;
 try{const response=await fetch('https://api.shiftsometimber.co.uk/v1/catalogue/medicines',{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('catalogue');const data=await response.json();if(!data.ok||!Array.isArray(data.products))throw Error('catalogue');products=data.products;}catch{failed=true;}
 if(run!==catalogueRun)return;

 const rows=Object.entries(medicineInfo).map(([key,info])=>{
  const product=products.find(p=>medicineKey(p)===key),variants=(product?.variants||[]).filter(v=>Number.isFinite(v.pricePence)&&v.pricePence>0).sort((a,b)=>parseFloat(a.strengthLabel)-parseFloat(b.strengthLabel)||a.pricePence-b.pricePence);
  const start=variants.find(v=>info.fixedDose?String(v.strengthLabel).includes(info.start+' capsules'):parseFloat(v.strengthLabel)===Number(info.start));
  const low=variants.length?Math.min(...variants.map(v=>v.pricePence)):null,high=variants.length?Math.max(...variants.map(v=>v.pricePence)):null,weekly=['mounjaro','wegovy-injection'].includes(key),oral=!info.form.toLowerCase().includes('injection');
  const formatMatch=choice.med==='Either'||(choice.med==='Tablets'&&oral)||(choice.med==='Jabs'&&!oral),compareCost=start?(weekly?Math.ceil(start.pricePence*13/12):start.pricePence):Infinity;
  return{key,info,product,variants,start,low,high,weekly,oral,formatMatch,compareCost,eligibility:bmiRoute(key,choice)};
 });
 const matches=rows.filter(r=>r.formatMatch&&r.start&&r.eligibility==='possible').sort((a,b)=>a.compareCost-b.compareCost);
 const best=!choice.free&&!failed?matches[0]:null,featured=best;
 rows.sort((a,b)=>(b===featured)-(a===featured)||Number(b.eligibility==='possible')-Number(a.eligibility==='possible')||Number(b.formatMatch)-Number(a.formatMatch)||a.compareCost-b.compareCost);
 $('#sw-medicines-title').textContent=choice.free?'Private options, for comparison':'Your treatment options';
 status.textContent=choice.stage==='continuing'?'Compare the options below. Your prescriber needs to review your starting BMI, treatment history and current dose; this quick check cannot confirm continuation or switching.':choice.free?'Your NHS route is above. Private treatment criteria and NHS funding criteria are different.':best?best.info.name+' is the lowest-priced starting option in your preferred format among those whose initial BMI criteria you may meet. This is a comparison starting point, not a prescription. All alternatives are below.':'Your options are shown below with their BMI criteria. Where information is missing or criteria are not met, no treatment match is assumed.';
 if(failed)status.textContent+=' Live prices and stock could not be checked. Retry below.';
 retry.hidden=!failed;
 for(const row of rows){
  const {key,info,variants,start,weekly,low,high}=row,card=document.createElement('article');card.className='sw-medicine-card';card.dataset.medicine=key;if(row===featured)card.dataset.featured='true';grid.append(card);
  appendText(card,'p',row===best?'Starting option to compare':row.formatMatch?'Matches your preferred format':'Another format to compare','sw-eyebrow');
  appendText(card,'h3',info.name);appendText(card,'p',info.form+' · '+info.active,'sw-medicine-format');
  appendText(card,'p',low===null?'Live price unavailable':(low===high?money(low):money(low)+'–'+money(high))+(weekly?' per 4 weeks':' per listed pack'),'sw-medicine-price');
  appendText(card,'p',failed?'Stock status unavailable':variants.some(v=>v.status==='available')?'Stock listed · ordering remains closed':'No stock available today.','sw-medicine-stock');
  let note=weekly&&start?'Starting supply: '+money(start.pricePence)+' for 4 weeks; about '+money(Math.ceil(start.pricePence*13/12))+' per calendar month averaged over 52 weeks at the same strength.':start?'Starting '+(info.fixedDose?'comparison pack':'strength')+': '+start.strengthLabel+' · '+money(start.pricePence)+'. Pack duration must be confirmed; this is not a monthly price.':'Starting-supply price is not confirmed.';
  appendText(card,'p',note,'sw-medicine-budget');
  const criteria=key==='orlistat'?'BMI 30+, or 28 to below 30 with associated risk factors.':'BMI 30+, or 27 to below 30 with a qualifying weight-related condition.';
  appendText(card,'p',(row.eligibility==='possible'?'You may meet the initial BMI criteria. ':row.eligibility==='outside'?'Your answers do not meet the initial BMI criteria. ':row.eligibility==='review'?'Continuing treatment needs prescriber review. ':'BMI eligibility needs checking. ')+criteria,'sw-medicine-eligibility');
  const details=document.createElement('details');details.className='sw-inline-details';card.append(details);appendText(details,'summary','What to know about '+info.name);const body=document.createElement('div');details.append(body);
  appendText(body,'h4','Routine and trade-offs');appendText(body,'p',info.course+'. '+info.tradeoff);
  appendText(body,'h4','Starting or continuing');appendText(body,'p',info.newGuidance);appendText(body,'p',info.continuingGuidance);
  appendText(body,'h4','Clinical checks');appendText(body,'p',info.review);
  appendText(body,'h4',info.fixedDose?'Current pack prices':'Current strength prices');
  if(variants.length){const list=document.createElement('ul');body.append(list);for(const v of variants)appendText(list,'li',v.strengthLabel+' · '+money(v.pricePence)+' · '+(v.status==='available'?'stock listed':'out of stock'));}else appendText(body,'p','Prices unavailable. Check the treatment page or retry above.');
  const source=appendText(body,'a','Official medicine information','sw-text-link');source.href=info.source;source.target='_blank';source.rel='noopener noreferrer';
  if(row.eligibility!=='outside'){const choose=appendText(card,'a',(row.eligibility==='possible'?'Choose ':'Review ')+info.name+' · strengths & packs →','sw-button sw-cream');choose.href='/treatment-order?medicine='+encodeURIComponent(key)+'&view=spec&from=start-here';choose.dataset.chooseMedicine=key;}else appendText(card,'p','Speak to your clinician about appropriate support. You can still read the treatment information above.','sw-medicine-stock');
 }
 appendText(section,'p','This initial check uses your format preference and BMI answers. It does not assess your full medical history. A prescriber confirms suitability and dose. Four-week supplies repeat 13 times over 52 weeks; tablet and capsule pack durations must be confirmed. No order or payment is taken here.','sw-comparison-note').dataset.generatedNote='true';
 for(const old of [...section.querySelectorAll('[data-generated-note]')].slice(0,-1))old.remove();
}
