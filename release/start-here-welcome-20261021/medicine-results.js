let catalogueRun=0,medicineFilter='all';
function medicineKey(product){const n=String(product.name||'').toLowerCase();return n.includes('mounjaro')?'mounjaro':n.includes('wegovy')?(n.includes('tablet')?'wegovy-tablets':'wegovy-injection'):n.includes('foundayo')?'foundayo':n.includes('orlistat')?'orlistat':n.includes('liraglutide')?'liraglutide':'';}
function money(p){return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:p%100?2:0}).format(p/100);}
function appendText(parent,tag,text,cls){const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;parent.append(el);return el;}
function filterMedicines(filter){medicineFilter=filter;let count=0;$$('.sw-medicine-card').forEach(card=>{card.hidden=filter!=='all'&&card.dataset.format!==filter;if(!card.hidden)count++;});$$('[data-medicine-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.medicineFilter===filter)));$('#sw-option-count').textContent=count+' options';}
$$('[data-medicine-filter]').forEach(b=>b.addEventListener('click',()=>filterMedicines(b.dataset.medicineFilter)));
async function renderMedicines(choice){
 const run=++catalogueRun,section=$('#sw-medicines'),grid=$('#sw-medicine-grid'),status=$('#sw-catalogue-status'),retry=$('#sw-retry-catalogue');
 section.hidden=choice.noMed;grid.replaceChildren();retry.hidden=true;if(choice.noMed)return;
 status.hidden=false;status.textContent='Checking current prices and stock…';retry.onclick=()=>renderMedicines(choice);
 let products=[],failed=false;
 try{const response=await fetch('https://api.shiftsometimber.co.uk/v1/catalogue/medicines',{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('catalogue');const data=await response.json();if(!data.ok||!Array.isArray(data.products))throw Error('catalogue');products=data.products;}catch{failed=true;}
 if(run!==catalogueRun)return;
 const order=['wegovy-injection','mounjaro','liraglutide','wegovy-tablets','foundayo','orlistat'];
 const art={'wegovy-injection':[90,299],mounjaro:[440,299],liraglutide:[783,299],'wegovy-tablets':[90,574],foundayo:[440,574],orlistat:[783,574]};
 const rows=Object.entries(medicineInfo).map(([key,info])=>{
  const product=products.find(p=>medicineKey(p)===key),variants=(product?.variants||[]).filter(v=>Number.isFinite(v.pricePence)&&v.pricePence>0).sort((a,b)=>info.fixedDose?a.pricePence-b.pricePence:parseFloat(a.strengthLabel)-parseFloat(b.strengthLabel));
  const start=info.fixedDose?variants[0]:variants.find(v=>parseFloat(v.strengthLabel)===Number(info.start));
  const low=variants.length?Math.min(...variants.map(v=>v.pricePence)):null,weekly=['mounjaro','wegovy-injection'].includes(key),oral=!info.form.toLowerCase().includes('injection');
  const formatMatch=choice.med==='Either'||(choice.med==='Tablets'&&oral)||(choice.med==='Jabs'&&!oral);
  return{key,info,variants,start,low,weekly,oral,formatMatch,eligibility:bmiRoute(key,choice)};
 });
 rows.sort((a,b)=>Number(b.formatMatch)-Number(a.formatMatch)||order.indexOf(a.key)-order.indexOf(b.key));
 $('#sw-match-explanation').textContent=choice.stage==='continuing'?'Continuing treatment and switching require a review of your starting BMI, current dose and treatment history.':choice.free?'Private treatment criteria and NHS funding criteria differ. These private options are available for comparison.':'Your preferred format is shown first. The alternatives remain available. This ordering helps you compare options; a prescriber confirms suitability and dose.';
 status.hidden=!failed;status.textContent=failed?'Live prices and stock could not be checked. You can still read the treatment information or retry below.':'';retry.hidden=!failed;
 for(const row of rows){
  const {key,info,variants,start,weekly,low}=row,card=document.createElement('article');card.className='sw-medicine-card';card.dataset.medicine=key;card.dataset.format=row.oral?'oral':'injection';grid.append(card);
  const picture=document.createElement('div');picture.className='sw-product-art';picture.setAttribute('aria-hidden','true');const image=document.createElement('img');image.src='/start-here/assets/treatments.webp';image.alt='';image.style.setProperty('--art-x',art[key][0]/3);image.style.setProperty('--art-y',art[key][1]/.62);picture.append(image);card.append(picture);
  appendText(card,'h3',info.name);appendText(card,'p',key==='orlistat'?'Capsules with meals':weekly?'Weekly injection':row.oral?'Daily tablet':'Daily injection','sw-medicine-format');
  const price=appendText(card,'p',low===null?'Live price unavailable':'From '+money(low),'sw-medicine-price');if(low!==null)appendText(price,'span',weekly?' / 4 weeks':info.fixedDose?' / '+variants[0].strengthLabel.split('·').pop().trim():' / listed pack');
  appendText(card,'p',failed?'Stock status unavailable':variants.some(v=>v.status==='available')?'Stock listed · ordering unavailable':'No stock available today.','sw-medicine-stock');
  if(row.eligibility==='outside'){const outside=appendText(card,'p','Your answers do not meet the initial BMI criteria. ','sw-medicine-eligibility');const health=appendText(outside,'a','Explore SHIFT Health →');health.href='/shift-health';}
  const toggle=appendText(card,'button',row.eligibility==='outside'?'View prices & criteria':'View doses & prices','sw-dose-toggle');toggle.type='button';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','sw-dose-'+key);
  const panel=document.createElement('div');panel.className='sw-dose-panel';panel.id='sw-dose-'+key;panel.hidden=true;card.append(panel);
  if(variants.length&&start){
   const label=appendText(panel,'label',info.fixedDose?'Pack size':choice.stage==='new'?'Starting treatment':'Current dose for review');label.htmlFor='sw-select-'+key;
   const select=document.createElement('select');select.id='sw-select-'+key;select.dataset.medicineDose=key;panel.append(select);for(const v of variants){const option=document.createElement('option');option.value=String(v.id);option.textContent=v.strengthLabel;select.append(option);}select.value=String(start.id);select.disabled=choice.stage==='new'&&!info.fixedDose;
   appendText(panel,'p',info.fixedDose?'120 mg capsules. Choose the number of capsules required.':choice.stage==='new'?'Starting dose selected. The prescriber confirms the treatment and dose.':'Select the strength you currently use. Continuation and any changes need prescriber review.','sw-dose-hint');
   const selected=document.createElement('div');selected.className='sw-selected-price';panel.append(selected);appendText(selected,'span','Selected supply');const selectedPrice=appendText(selected,'strong',''),period=appendText(selected,'span','');
   const stock=appendText(panel,'p','','sw-dose-status'),unavailable=appendText(panel,'button','Currently unavailable','sw-order-unavailable');unavailable.type='button';unavailable.disabled=true;
   const update=()=>{const v=variants.find(v=>String(v.id)===select.value);selectedPrice.textContent=money(v.pricePence);period.textContent=weekly?'4-week supply':v.strengthLabel;stock.textContent=v.status==='available'?'Ordering currently unavailable.':'No stock available today.';};select.addEventListener('change',update);update();
   appendText(panel,'p',weekly?'Four weekly doses at the selected strength.':'Pack quantity and supply period must be confirmed before ordering.','sw-dose-hint');
  }else appendText(panel,'p','Live prices are unavailable. Retry above to check the current strength and pack listings.','sw-dose-hint');
  toggle.addEventListener('click',()=>{const open=panel.hidden;panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Close doses & prices':row.eligibility==='outside'?'View prices & criteria':'View doses & prices';});
  const details=document.createElement('details');details.className='sw-treatment-info';card.append(details);appendText(details,'summary','Treatment information');const body=document.createElement('div');details.append(body);
  appendText(body,'h4','Routine and trade-offs');appendText(body,'p',info.course+'. '+info.tradeoff);appendText(body,'h4','Starting or continuing');appendText(body,'p',info.newGuidance);appendText(body,'p',info.continuingGuidance);appendText(body,'h4','Clinical checks');appendText(body,'p',info.review);appendText(body,'p',key==='orlistat'?'Initial criteria: BMI 30+, or 28 to below 30 with associated risk factors.':'Initial criteria: BMI 30+, or 27 to below 30 with a qualifying weight-related condition.');
  appendText(body,'h4',info.fixedDose?'Current pack prices':'Current strength prices');if(variants.length){const list=document.createElement('ul');body.append(list);for(const v of variants)appendText(list,'li',v.strengthLabel+' · '+money(v.pricePence));}else appendText(body,'p','Live prices unavailable.');
  const source=appendText(body,'a','Official medicine information ↗');source.href=info.source;source.target='_blank';source.rel='noopener noreferrer';
  const full=appendText(body,'a','Full treatment information →');full.href='/treatment-order?medicine='+encodeURIComponent(key)+'&view=spec&from=start-here';full.dataset.chooseMedicine=key;
 }
 filterMedicines('all');
}
