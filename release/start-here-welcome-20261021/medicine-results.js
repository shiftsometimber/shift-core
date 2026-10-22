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
 const cap=({'Under £100':9999,'£100–£150':15000,'£150–£200':20000,'£200+':Infinity,'£0 / NHS':0})[choice.budget];
 const rows=Object.entries(medicineInfo).map(([key,info])=>{
  const product=products.find(p=>medicineKey(p)===key),variants=(product?.variants||[]).filter(v=>Number.isFinite(v.pricePence)&&v.pricePence>0).sort((a,b)=>parseFloat(a.strengthLabel)-parseFloat(b.strengthLabel)||a.pricePence-b.pricePence);
  const start=variants.find(v=>info.fixedDose?String(v.strengthLabel).includes(info.start+' capsules'):parseFloat(v.strengthLabel)===Number(info.start));
  const low=variants.length?Math.min(...variants.map(v=>v.pricePence)):null,high=variants.length?Math.max(...variants.map(v=>v.pricePence)):null,weekly=['mounjaro','wegovy-injection'].includes(key),oral=!info.form.toLowerCase().includes('injection');
  const formatMatch=choice.med==='Either'||(choice.med==='Tablets'&&oral)||(choice.med==='Jabs'&&!oral),compareCost=start?(weekly?Math.ceil(start.pricePence*13/12):start.pricePence):Infinity;
  return{key,info,product,variants,start,low,high,weekly,oral,formatMatch,compareCost,within:compareCost<=cap};
 });
 const matches=rows.filter(r=>r.formatMatch&&r.start&&r.within).sort((a,b)=>a.compareCost-b.compareCost);
 const nearest=rows.filter(r=>r.formatMatch&&r.start).sort((a,b)=>a.compareCost-b.compareCost)[0];
 const best=!choice.free&&!failed?matches[0]:null;
 const featured=best||(!choice.free&&!failed?nearest:null);
 rows.sort((a,b)=>(b===featured)-(a===featured)||Number(b.formatMatch)-Number(a.formatMatch)||a.compareCost-b.compareCost);
 $('#sw-medicines-title').textContent=choice.free?'Private options, for comparison':'Your match and the other options';
 status.textContent=failed?'Live prices and stock could not be checked. Medicine information is still available below; no budget match or availability is assumed.':choice.free?'Your NHS/free route remains above. These private options are shown for comparison; none is presented as an NHS or £0 match.':best?(best.weekly?best.info.name+' is the lowest-priced starting option matching your format and budget, using the current four-week price averaged over a year. Higher doses can cost more.':best.info.name+' is the lowest-priced starting pack matching your oral preference and spending limit. Pack duration is unconfirmed, so this is not a confirmed monthly-budget match.'):'No confirmed option fits both your format and budget. '+(nearest?nearest.info.name+' is the nearest priced option in your chosen format; the difference is shown below. ':'')+'The alternatives remain available to compare.';
 retry.hidden=!failed;
 for(const row of rows){
  const {key,info,variants,start,weekly,low,high}=row,card=document.createElement('article');card.className='sw-medicine-card';card.dataset.medicine=key;if(row===featured)card.dataset.featured='true';grid.append(card);
  appendText(card,'p',row===best?(weekly?'Closest match to your choices':'Closest oral-format match'):row===featured?'Nearest option · above budget':row.formatMatch?'Also matches your format':'Another format to compare','sw-eyebrow');
  appendText(card,'h3',info.name);appendText(card,'p',info.form+' · '+info.active,'sw-medicine-format');
  appendText(card,'p',low===null?'Live price unavailable':(low===high?money(low):money(low)+'–'+money(high))+(weekly?' per 4 weeks':' per listed pack'),'sw-medicine-price');
  appendText(card,'p',failed?'Stock status unavailable':variants.some(v=>v.status==='available')?'Stock listed · ordering remains closed':'No stock available today.','sw-medicine-stock');
  let note=weekly&&start?'Starting supply: '+money(start.pricePence)+' for 4 weeks; about '+money(Math.ceil(start.pricePence*13/12))+' per calendar month averaged over 52 weeks at the same strength.':start?'Starting '+(info.fixedDose?'comparison pack':'strength')+': '+start.strengthLabel+' · '+money(start.pricePence)+'. Pack duration must be confirmed; this is not a monthly price.':'Starting-supply price is not confirmed.';
  if(!choice.free&&start&&Number.isFinite(cap)&&row.compareCost>cap)note+=' '+money(row.compareCost-cap)+' above your stated upper limit'+(weekly?' on that monthly average.':' for this pack alone.');
  appendText(card,'p',note,'sw-medicine-budget');
  const details=document.createElement('details');details.className='sw-inline-details';card.append(details);appendText(details,'summary','What to know about '+info.name);const body=document.createElement('div');details.append(body);
  appendText(body,'h4','Routine and trade-offs');appendText(body,'p',info.course+'. '+info.tradeoff);
  appendText(body,'h4','Starting or continuing');appendText(body,'p',info.newGuidance);appendText(body,'p',info.continuingGuidance);
  appendText(body,'h4','Clinical checks');appendText(body,'p',info.review);
  appendText(body,'h4',info.fixedDose?'Current pack prices':'Current strength prices');
  if(variants.length){const list=document.createElement('ul');body.append(list);for(const v of variants)appendText(list,'li',v.strengthLabel+' · '+money(v.pricePence)+' · '+(v.status==='available'?'stock listed':'out of stock'));}else appendText(body,'p','Prices unavailable. Check the treatment page or retry above.');
  const source=appendText(body,'a','Official medicine information','sw-text-link');source.href=info.source;source.target='_blank';source.rel='noopener noreferrer';
  const choose=appendText(card,'a','Choose '+info.name+' · strengths & packs →','sw-button sw-cream');choose.href='/treatment-order?medicine='+encodeURIComponent(key)+'&view=spec&from=start-here';choose.dataset.chooseMedicine=key;
 }
 appendText(section,'p','This comparison uses your format and spending preferences, not your medical history. A prescriber confirms suitability and dose. Four-week supplies repeat 13 times over 52 weeks; tablet and capsule pack durations must be confirmed. No order or payment is taken here.','sw-comparison-note').dataset.generatedNote='true';
 for(const old of [...section.querySelectorAll('[data-generated-note]')].slice(0,-1))old.remove();
}
