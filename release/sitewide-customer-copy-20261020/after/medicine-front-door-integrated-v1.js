(()=>{
  'use strict';
  const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>[...r.querySelectorAll(q)];
  const catalogue=window.SHIFT_TREATMENT_CATALOGUE||{},medicineSelect=$('[data-medication-select]'),doseSelect=$('[data-dose-select]');
  if(!medicineSelect||!doseSelect||!$('[data-medicine-switcher]'))return;
  $$('.op-progress b span').forEach((node,index)=>{node.textContent=['Choose','Verify','Pay','Review'][index]||node.textContent});
  const verifyHeading=$('.op-step[data-op-step="1"] h1');if(verifyHeading)verifyHeading.textContent='Verify first. Pay only when accepted.';
  const detail={
    mounjaro:{context:'TIRZEPATIDE · WEEKLY · FOUR-DOSE PEN',howTitle:'Two appetite pathways. One weekly routine.',howCopy:'Tirzepatide acts on GIP and GLP-1 receptors. It can reduce appetite and food intake; response and side effects vary.',doses:['2.5 mg weekly for the first four weeks','5 mg weekly from week five','If needed, increases of 2.5 mg after at least four weeks','Usual maintenance: 5 mg, 10 mg or 15 mg; maximum 15 mg'],trial:[['Tirzepatide 5 mg',16],['Tirzepatide 10 mg',21.4],['Tirzepatide 15 mg',22.5],['Placebo',2.4]],theory:true,evidenceTitle:'Average change at 72 weeks in SURMOUNT-1',evidenceCopy:'Trial averages alongside diet and activity support—not a promise of your result. The 2.5 mg, 7.5 mg and 12.5 mg steps do not receive invented estimates because SURMOUNT-1 did not report separate averages for them.',practical:['One injection on the same day each week.','Each KwikPen contains four weekly doses.','A new pen is needed for each four-dose course.','The clinician may hold a dose rather than increase it.'],negatives:['Nausea, diarrhoea, vomiting and constipation are common.','It is an injection and correct pen technique matters.','Dose increases are not automatic or a race.','Treatment may be unsuitable with some medical histories, medicines or pregnancy plans.'],cautions:'Read the patient leaflet. Severe, persistent abdominal pain, serious dehydration, allergic symptoms or other urgent concerns need clinical help. Tell the prescriber about every medicine and relevant condition.',hero:'/assets/medicine/mounjaro-pen-studio-v1.png',heroAlt:'Representative studio photograph of a weekly multi-dose injection pen and carton',visual:'/assets/medicine/weekly-pen-guide.svg'},
    'wegovy-injection':{context:'SEMAGLUTIDE · WEEKLY PEN',howTitle:'An established weekly appetite-support route.',howCopy:'Semaglutide is a GLP-1 receptor agonist. It supports fullness and reduced food intake alongside diet and activity changes.',doses:['0.25 mg weekly for four weeks','0.5 mg, then 1 mg, then 1.7 mg in four-week stages','2.4 mg is the usual maintenance route','Escalation can be delayed when tolerability requires it'],trial:[['Wegovy 2.4 mg',14.9],['Placebo',2.4]],evidenceTitle:'Average change at 68 weeks in STEP 1',evidenceCopy:'A group average from a longer-term trial—not an individual forecast.',practical:['One injection on the same day each week.','Gradual dose escalation is part of the standard route.','Keep the pen routine and storage instructions.','Response, tolerability and value are reviewed over time.'],negatives:['Gut side effects are common, especially around dose changes.','It still requires an injection.','Not everyone responds enough to justify continuing.','Long-term affordability and a stopping plan matter.'],cautions:'Read the current patient leaflet and discuss medical history, current medicines, pregnancy plans, previous GLP-1 treatment and any severe or persistent symptoms with the clinical team.',hero:'/assets/medicine/wegovy-pen-studio-v1.png',heroAlt:'Representative studio photograph of a weekly injection pen and carton',visual:'/assets/medicine/weekly-injection-route.svg',visualAlt:'Four-week illustration of a once-weekly injection routine'},
    'wegovy-tablets':{context:'NEW UK ROUTE · APPROVED 11 JUNE 2026',howTitle:'No needle—but a more exact daily routine.',howCopy:'The first GLP-1 tablet approved in the UK for weight management uses oral semaglutide. Daily fasting and administration instructions matter to absorption.',doses:['1.5 mg once daily for 30 days','4 mg once daily for 30 days','9 mg once daily for 30 days','25 mg once daily maintenance route'],trial:[['Oral semaglutide',13.6],['Placebo',2.4]],evidenceTitle:'Average change at 64 weeks in OASIS 4',evidenceCopy:'Treatment-policy trial average. UK approval is new; availability and the exact route remain clinically and formulary controlled.',practical:['Taken every day rather than once a week.','Specific fasting, water and waiting instructions apply.','Routine consistency is important.','Needle-free does not mean side-effect-free.'],negatives:['Daily administration rules may be less convenient than a weekly pen.','Gut side effects can occur.','Missed routines can make the route impractical.','New approval means customers need especially clear current information.'],cautions:'Use the current approved UK instructions. The clinical review covers medicines, relevant conditions, pregnancy plans, previous GLP-1 treatment and ability to follow the administration routine.',hero:'/assets/medicine/wegovy-tablets-studio-v1.png',heroAlt:'Representative studio photograph of a tablet blister and carton',visual:'/assets/medicine/daily-tablet-route.svg',visualAlt:'Illustration of the daily morning tablet routine'},
    foundayo:{context:'ORFORGLIPRON · DAILY TABLET · OPTION READY',howTitle:'A new daily tablet without fasting rules.',howCopy:'Orforglipron is a daily GLP-1 tablet. Suitability and response require clinical review.',doses:['0.8 mg once daily to start','2.5 mg, 5.5 mg and 9 mg staged increases','14.5 mg and 17.2 mg higher routes','At least four weeks at each dose before any increase'],trial:[['Foundayo trial average',12.4],['Placebo',0.9]],evidenceTitle:'Average change at 72 weeks in ATTAIN-1',evidenceCopy:'A trial average at the highest studied dose—not a personal forecast or a direct comparison.',practical:['Taken once daily.','No fasting or water restriction.','Dose increases are gradual.','The full option is ready; checkout opens only when the pharmacy confirms supply.'],negatives:['Gut side effects can occur.','Real-world experience is more limited.','Daily treatment needs a reliable routine.','Availability can change and authorisation does not guarantee supply.'],cautions:'An appropriately qualified prescriber reviews medical history, medicines and relevant risks.',hero:'/assets/medicine/foundayo-option-status.svg',heroAlt:'Foundayo daily-tablet option showing that pharmacy supply confirmation is pending',visual:'/assets/medicine/daily-tablet-route.svg',visualAlt:'Illustration of a daily tablet routine'},
    liraglutide:{context:'LIRAGLUTIDE · DAILY INJECTION',howTitle:'A familiar incretin route with daily dosing.',howCopy:'Liraglutide acts on the GLP-1 pathway and has a longer history in weight management than newer weekly options.',doses:['0.6 mg once daily to start','Increase by 0.6 mg at intervals of at least one week','3.0 mg once daily is the usual maintenance dose','Pack quantity changes as daily dose rises'],trial:[['Liraglutide 3 mg',8],['Placebo',2.6]],evidenceTitle:'Average change at 56 weeks in a pivotal trial',evidenceCopy:'A group average alongside lifestyle support—not a personal prediction.',practical:['One injection every day.','Starter and maintenance pack needs differ.','The dose rises gradually.','Response is checked rather than treatment rolling on automatically.'],negatives:['Daily injections create more routine than weekly options.','Gut side effects can occur.','Average loss was more modest than in newer incretin trials.','Brand, pack quantity and supply need confirmation.'],cautions:'The clinical team reviews medicines, pregnancy plans, pancreatitis risk, tolerability and other relevant medical history. Read the current patient leaflet.',hero:'/assets/medicine/liraglutide-pen-studio-v1.png',heroAlt:'Representative studio photograph of a daily injection pen',visual:'/assets/medicine/daily-injection-route.svg',visualAlt:'Seven-day illustration of a daily injection routine'},
    orlistat:{context:'ORLISTAT · NON-GLP-1 · CAPSULES WITH MEALS',howTitle:'Works in the gut—not on appetite.',howCopy:'Orlistat reduces absorption of some dietary fat. The benefit and digestive downsides are closely linked to what you eat.',doses:['120 mg is the prescription strength','Taken as directed with suitable fat-containing meals','Skip a dose when a meal is missed or contains no fat, as instructed','Choose a pack size—not a higher dose'],trial:[['Lost at least 10%',20],['Placebo',8]],evidenceTitle:'Share reaching 10% loss in one-year studies',evidenceCopy:'This is a responder measure, so it should not be compared directly with mean-loss percentages for GLP-1 medicines.',practical:['Needle-free and non-incretin.','Dosing follows meals.','Lower-fat eating helps limit digestive effects.','An early response checkpoint shows whether continuing is worthwhile.'],negatives:['Oily stools, urgency and wind can occur.','It does not suppress appetite.','Meal-linked dosing can be inconvenient.','Vitamin and medicine interactions need clinical review.'],cautions:'Digestive conditions and medicines including anticoagulants or ciclosporin need careful review. Follow nutritional advice and read the current leaflet.',hero:'/assets/medicine/orlistat-capsules-studio-v1.png',heroAlt:'Representative studio photograph of a capsule blister and carton',visual:'/assets/medicine/meal-capsule-route.svg',visualAlt:'Illustration of a capsule linked to suitable meals'}
  };
  const money=p=>p!==null&&p!==''&&Number.isFinite(Number(p))?'£'+(Number(p)/100).toFixed(2):'Price unavailable';
  let liveByKey={},priceCheckedAt=null;
  // Supply periods are independent of a calendar-month household budget.
  function supplyPeriod(key,variant){
    if(['mounjaro','wegovy-injection'].includes(key))return 'per 4 weeks';
    const capsules=String(variant?.strengthLabel||'').match(/(\d+)\s*capsules?/i);
    return capsules?'per '+capsules[1]+'-capsule pack':'per pack';
  }
  function lowestPricedVariant(key){
    return (liveByKey[key]?.variants||[]).filter(v=>v.pricePence!==null&&v.pricePence!==''&&Number.isFinite(Number(v.pricePence))).sort((a,b)=>Number(a.pricePence)-Number(b.pricePence))[0];
  }
  function supplyPrice(key){
    const variant=lowestPricedVariant(key);
    return variant?'From '+money(variant.pricePence)+' '+supplyPeriod(key,variant):'Live price unavailable';
  }
  function syncSupplyPeriod(){
    const key=medicineSelect.value,item=catalogue[key],weekly=['mounjaro','wegovy-injection'].includes(key);
    const option=doseSelect.selectedOptions[0],variant=(liveByKey[key]?.variants||[]).find(v=>String(v.id)===option?.dataset.variantId);
    const heading=$('.op-price small');if(heading)heading.textContent=weekly?'PRICE PER 4 WEEKS':'PACK PRICE';
    const period=$('.op-price>span');if(period)period.textContent=weekly?'Four weekly doses · 13 supplies over 52 weeks if continued':item.fixedDose?supplyPeriod(key,variant)+' · duration depends on prescribed use':'Per pack · quantity and duration unavailable';
    let checked=$('[data-price-checked]');
    if(!checked){checked=document.createElement('span');checked.dataset.priceChecked='';$('.op-price')?.append(checked)}
    if(checked)checked.textContent=priceCheckedAt?'HQ price checked '+new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/London'}).format(priceCheckedAt)+' (UK time)':'HQ price unavailable';
    const receipt=$('[data-receipt-list] li:last-child');if(receipt)receipt.textContent=weekly?'The displayed HQ price covers four weekly doses (4 weeks), not a calendar month.':'The displayed HQ price is for the selected pack. Its duration depends on the supplied quantity and prescribed use.';
    for(const card of $$('[data-browser-card]')){
      const row=$$('dl>div',card).find(node=>$('dt',node)?.textContent.toLowerCase().includes('price'));
      if(row){$('dt',row).textContent='Live price & supply';const key=card.dataset.browserCard,v=lowestPricedVariant(key);$('dd',row).textContent=supplyPrice(key)+(v?' · '+((liveByKey[key]?.variants||[]).some(x=>x.status==='available')?'supply available':'out of stock'):'')}
    }
  }
  function keyForProduct(product){const name=String(product.name||'').toLowerCase();return name.includes('mounjaro')?'mounjaro':name.includes('wegovy')&&name.includes('tablet')?'wegovy-tablets':name.includes('wegovy')?'wegovy-injection':name.includes('foundayo')?'foundayo':name.includes('liraglutide')?'liraglutide':name.includes('orlistat')?'orlistat':''}
  function live(){return liveByKey[medicineSelect.value]}
  function orderedVariants(item,variants){
    const route=item.options.map(option=>String(option[0]).trim().toLowerCase());
    const rank=variant=>{const label=String(variant.strengthLabel||'').trim().toLowerCase(),number=(label.match(/\d+(?:\.\d+)?/)||[])[0];const index=route.findIndex(value=>value===number||label.startsWith(`${value} `)||label===value);return index<0?Number.MAX_SAFE_INTEGER:index};
    return [...variants].sort((a,b)=>rank(a)-rank(b)||String(a.strengthLabel||'').localeCompare(String(b.strengthLabel||''),undefined,{numeric:true}));
  }
  function syncLiveSelection(){
    const item=catalogue[medicineSelect.value],product=live(),stage=$('input[name="treatment-stage"]:checked')?.value||'new';
    if(!item)return;
    const variants=orderedVariants(item,product?.variants||[]);
    // Keep the prototype's clinical dose keys; enrich them with HQ prices instead of replacing them with variant IDs.
    for(const option of doseSelect.options){
      const variant=variants.find(v=>{
        const label=String(v.strengthLabel||'');
        const amount=item.fixedDose?(label.match(/(\d+)\s*capsules?/i)||[])[1]:(label.match(/\d+(?:\.\d+)?/)||[])[0];
        return amount!==undefined&&Number(amount)===Number(option.value);
      });
      const priced=variant&&variant.pricePence!==null&&variant.pricePence!==''&&Number.isFinite(Number(variant.pricePence));
      option.dataset.price=priced?String(Number(variant.pricePence)/100):'null';
      option.dataset.status=variant?.status||'out_of_stock';
      option.dataset.variantId=variant?String(variant.id):'';
      option.textContent=`${option.dataset.label} — ${priced?money(variant.pricePence):'Price unavailable'}`;
    }
    const option=doseSelect.selectedOptions[0],available=product?.status==='available'&&option?.dataset.status==='available';
    const price=option?.dataset.price;
    $('[data-op-price]').textContent=price&&price!=='null'?money(Number(price)*100):'Price unavailable';
    $('[data-summary-price]').textContent=$('[data-op-price]').textContent;$('[data-summary-total]').textContent=$('[data-op-price]').textContent;
    const status=$('[data-stock-status]');if(status)status.textContent=available?'Stock listed · ordering unavailable':'No stock available today';
    const pay=$('[data-op-pay]');if(pay){
      // Stock alone cannot reopen this release or its unfinished verification route.
      const orderingOpen=false;
      if(!orderingOpen){pay.disabled=true;pay.textContent='Ordering unavailable';pay.onclick=()=>{};}else{let verification=null;try{verification=JSON.parse(sessionStorage.getItem(`sst-medicine-verification:${option?.value}`)||'null')}catch{}const verified=verification?.token&&Date.parse(verification.expiresAt)>Date.now();pay.disabled=!available;pay.textContent=!available?'Currently out of stock':verified?'Continue to secure payment':'Continue to verification';pay.onclick=async()=>{if(!available)return;const terms=$('[data-order-confirm]'),message=$('.op-step[data-op-step="2"] .op-validation');if(terms&&!terms.checked){if(message)message.textContent='Please confirm the Terms of Sale before continuing.';return}if(!verified){const returnTo=location.pathname+location.search;location.assign(`/treatment-assessment?variant=${encodeURIComponent(option.value)}&returnTo=${encodeURIComponent(returnTo)}`);return}pay.disabled=true;if(message)message.textContent='Verification accepted. Opening secure payment against live stock…';try{const response=await fetch('https://api.shiftsometimber.co.uk/v1/commerce/medicine-checkout',{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify({variantId:Number(option.value),verificationToken:verification.token})}),result=await response.json();if(response.status===401){location.href=`/member/dashboard?returnTo=${encodeURIComponent(location.pathname+location.search)}`;return}if(!response.ok||!result.checkoutUrl){if(['invalid_or_expired_verification','verification_already_used'].includes(result.error))sessionStorage.removeItem(`sst-medicine-verification:${option.value}`);throw Error(result.message||result.error||'Checkout could not be opened')}location.assign(result.checkoutUrl)}catch(error){if(message)message.textContent=error.message;pay.disabled=false}}}}
    syncSupplyPeriod();
    doseSelect.disabled=stage==='new'&&!item.fixedDose;
    const stageContext=$('[data-stage-context]');if(stageContext)stageContext.textContent=stage==='new'?`New to ${item.name}: we show the usual starting route. The prescriber confirms whether it is appropriate.`:`Already taking ${item.name}: choose the strength you currently use. Treatment history and evidence are verified before payment.`;
  }
  const heroEntries=()=>Object.entries(catalogue).filter(([,item])=>item.hero!==false);
  function syncMedicineUrl(mode='replaceState'){
    const url=new URL(location.href);url.searchParams.set('medicine',medicineSelect.value);url.searchParams.set('view','spec');history[mode]({},'',url);
  }
  function renderSwitcher(){
    const root=$('[data-medicine-switcher]');root.innerHTML=heroEntries().map(([key,item])=>`<button type="button" data-switch-medicine="${key}" aria-pressed="${key===medicineSelect.value}"><small>${item.form}</small><strong>${item.name}</strong></button>`).join('')+`<a href="/start-here#quickStart">← Change my answers</a>`;
  }
  function syncBrowserLive(){syncSupplyPeriod()}

  const theoryWeight=$('[data-theory-weight]'),theoryUnit=$('[data-theory-unit]'),theoryBox=$('[data-trial-calculator]');
  let syncingWeight=false;
  function stoneAndPounds(totalLb){const rounded=Math.round(totalLb),stone=Math.floor(rounded/14),pounds=rounded%14;return `${stone} st${pounds?` ${pounds} lb`:''}`}
  function theoryKg(){const value=Number(theoryWeight?.value);if(!Number.isFinite(value)||value<=0)return null;if(theoryUnit.value==='stone')return value*6.35029318;if(theoryUnit.value==='lb')return value*0.45359237;return value}
  function carryTheoryToBmi(){
    if(syncingWeight)return;const kg=theoryKg();if(!kg||kg<35||kg>320)return;syncingWeight=true;
    const totalLb=Math.round(kg/0.45359237),stone=Math.floor(totalLb/14),lb=totalLb%14;
    const kgInput=$('[data-bmi-kg]'),stoneInput=$('[data-bmi-st]'),lbInput=$('[data-bmi-lb]');
    if(kgInput)kgInput.value=kg.toFixed(1);if(stoneInput)stoneInput.value=String(stone);if(lbInput)lbInput.value=String(lb);
    (document.querySelector('[data-bmi-fields="metric"]:not([hidden])')?kgInput:stoneInput)?.dispatchEvent(new Event('input',{bubbles:true}));syncingWeight=false;
  }
  function carryBmiToTheory(event){
    if(syncingWeight||!theoryWeight||!theoryUnit)return;syncingWeight=true;
    if(event.target.matches('[data-bmi-kg]')){const kg=Number(event.target.value);if(kg){theoryUnit.value='kg';theoryWeight.value=String(kg)}}
    else{const stone=Number($('[data-bmi-st]')?.value),lb=Number($('[data-bmi-lb]')?.value||0);if(stone){theoryUnit.value='stone';theoryWeight.value=String(Number((stone+lb/14).toFixed(2)))}}
    syncingWeight=false;renderTheory();
  }
  function renderTheory(){
    const d=detail[medicineSelect.value],kg=theoryKg();
    if(theoryBox)theoryBox.hidden=!d?.theory;
    for(const output of $$('[data-theory-output]')){
      if(!d?.theory||!kg||kg<35||kg>320){output.textContent='Add your current weight above to see the maths.';continue}
      const percentage=Number(output.dataset.theoryOutput),lossKg=kg*percentage/100,endKg=kg-lossKg;
      output.textContent=`At this group average: about ${stoneAndPounds(lossKg/0.45359237)} (${lossKg.toFixed(1)} kg) lower, leaving around ${stoneAndPounds(endKg/0.45359237)} (${endKg.toFixed(1)} kg).`;
    }
  }
  function renderSpec(){
    const d=detail[medicineSelect.value],item=catalogue[medicineSelect.value];if(!d||!item)return;
    $('[data-spec-context]').textContent=d.context;$('[data-spec-how-title]').textContent=d.howTitle;$('[data-spec-how-copy]').textContent=d.howCopy;$('[data-spec-visual]').src=d.visual;$('[data-spec-visual]').alt=d.visualAlt||'Illustration of a four-dose weekly injection pen routine';
    const liveProduct=live()||{},approvedHero=liveProduct.imageUrl||liveProduct.primaryImageUrl||liveProduct.heroImageUrl;
    $('[data-product-visual]').src=approvedHero||d.hero;$('[data-product-visual]').alt=approvedHero?`${item.name} product image`:d.heroAlt;
    $('[data-spec-facts]').innerHTML=`<div><small>FORMAT</small><strong>${item.form}</strong></div><div><small>STARTING ROUTE</small><strong>${d.doses[0]}</strong></div><div><small>COURSE</small><strong>${item.course}</strong></div><div><small>USUAL BMI ROUTE</small><strong>${item.bmi}</strong></div>`;
    $('[data-spec-doses]').innerHTML=d.doses.map((x,i)=>`<p><b>${String(i+1).padStart(2,'0')}</b><span>${x}</span></p>`).join('');
    const max=Math.max(...d.trial.map(x=>x[1]));$('[data-spec-evidence]').innerHTML=d.trial.map(([label,value])=>`<div><span>${label}</span><i><b style="width:${Math.max(4,value/max*100)}%"></b></i><strong>${value}%</strong>${d.theory&&!/^placebo$/i.test(label)?`<output data-theory-output="${value}">Add your current weight above to see the maths.</output>`:''}</div>`).join('');
    $('[data-spec-evidence-title]').textContent=d.evidenceTitle;$('[data-spec-evidence-copy]').textContent=d.evidenceCopy;
    $('[data-spec-practical]').innerHTML=d.practical.map(x=>`<li>${x}</li>`).join('');$('[data-spec-negatives]').innerHTML=d.negatives.map(x=>`<li>${x}</li>`).join('');
    $('[data-spec-eligibility]').innerHTML=`<strong>${item.eligibility}</strong><br>${item.bmi}`;$('[data-spec-review]').textContent=item.review;$('[data-spec-cautions]').innerHTML=`<p>${d.cautions}</p><p><a href="${item.source}" rel="noopener" target="_blank">Current UK product information ↗</a></p>`;renderTheory();
  }
  function compareCell(item,key,field){const d=detail[key],product=liveByKey[key],variants=product?.variants||[];if(field==='price')return lowestPricedVariant(key)?supplyPrice(key)+' · '+(variants.some(v=>v.status==='available')?'supply available':'currently out of stock'):'No live supply listing';if(field==='evidence')return d.evidenceTitle;if(field==='dose')return d.doses[0];if(field==='downside')return d.negatives[0];return item[field]||''}
  function renderCompare(){
    const a=$('[data-compare-a]').value,b=$('[data-compare-b]').value,ia=catalogue[a],ib=catalogue[b];if(!ia||!ib)return;
    const rows=[['Format','form'],['Starting route','dose'],['BMI route','bmi'],['Evidence lens','evidence'],['First compromise','downside'],['Live price & supply','price']];
    $('[data-compare-output]').innerHTML=`<div class="op-compare-table"><div class="head"><span>COMPARE</span><strong>${ia.name}</strong><strong>${ib.name}</strong></div>${rows.map(([label,field])=>`<div><b>${label}</b><span>${compareCell(ia,a,field)}</span><span>${compareCell(ib,b,field)}</span></div>`).join('')}</div>`;
  }
  function setupCompare(){const options=heroEntries().map(([key,item])=>`<option value="${key}">${item.name}</option>`).join(''),a=$('[data-compare-a]'),b=$('[data-compare-b]');a.innerHTML=options;b.innerHTML=options;a.value=medicineSelect.value;b.value=medicineSelect.value==='mounjaro'?'wegovy-injection':'mounjaro';a.onchange=renderCompare;b.onchange=renderCompare;renderCompare()}
  function refresh(){renderSwitcher();renderSpec();syncLiveSelection();syncBrowserLive();setupCompare()}
  let restoringHistory=false;
  medicineSelect.addEventListener('change',()=>{if(!restoringHistory)syncMedicineUrl('pushState');refresh()});
  $('[data-medicine-switcher]').addEventListener('click',event=>{const button=event.target.closest('[data-switch-medicine]');if(!button)return;medicineSelect.value=button.dataset.switchMedicine;medicineSelect.dispatchEvent(new Event('change',{bubbles:true}));$('.op-product').scrollIntoView({behavior:'smooth',block:'start'})});
  addEventListener('popstate',()=>{const requested=new URL(location.href).searchParams.get('medicine');if(requested&&catalogue[requested]&&requested!==medicineSelect.value){restoringHistory=true;medicineSelect.value=requested;medicineSelect.dispatchEvent(new Event('change',{bubbles:true}));restoringHistory=false}});
  doseSelect.addEventListener('change',()=>{syncLiveSelection();syncBrowserLive()});$$('input[name="treatment-stage"]').forEach(x=>x.addEventListener('change',()=>{syncLiveSelection();syncBrowserLive()}));
  theoryWeight?.addEventListener('input',()=>{renderTheory();carryTheoryToBmi()});theoryUnit?.addEventListener('change',()=>{renderTheory();carryTheoryToBmi()});
  $$('[data-bmi-st],[data-bmi-lb],[data-bmi-kg]').forEach(input=>input.addEventListener('input',carryBmiToTheory));
  const journey=$('[data-post-approval-journey]'),approved=$('[data-approved-system]');if(journey&&approved)approved.querySelector('.op-system-hero')?.insertAdjacentElement('afterend',journey);
  const payStep=$('.op-step[data-op-step="2"] .op-single-confirm');if(payStep&&!$('[data-prepay-explainer]')){const explainer=document.createElement('aside');explainer.dataset.prepayExplainer='v1';explainer.className='op-prepay-explainer';explainer.innerHTML='<p class="op-eyebrow">CHOOSE → VERIFY → PAY → REVIEW</p><h2>Clinical evidence first. Payment second.</h2><ol><li><strong>Verify against real stock</strong><span>Health details, GP consent, photo ID and clothed front and side images go securely to the pharmacy partner.</span></li><li><strong>Pay only after verification</strong><span>Zero stock or incomplete verification never reaches Stripe.</span></li><li><strong>The prescriber reviews suitability</strong><span>Payment never guarantees prescribing.</span></li><li><strong>Track everything in My Timber</strong><span>Approval, dispensing, dispatch and any refund action stay visible.</span></li></ol><p>If treatment is not approved, the refund route is shown in your tracker.</p>';payStep.insertAdjacentElement('beforebegin',explainer)}
  async function boot(){try{const response=await fetch('/v1/catalogue/medicines',{credentials:'omit',cache:'no-store'}),body=await response.json();if(!response.ok)throw Error('catalogue');priceCheckedAt=new Date();for(const product of body.products||[]){const key=keyForProduct(product);if(key)liveByKey[key]=product}}catch(_error){liveByKey={}}refresh();const existingKg=Number($('[data-bmi-kg]')?.value),existingStone=Number($('[data-bmi-st]')?.value),existingLb=Number($('[data-bmi-lb]')?.value||0);if(existingKg){theoryUnit.value='kg';theoryWeight.value=String(existingKg)}else if(existingStone){theoryUnit.value='stone';theoryWeight.value=String(Number((existingStone+existingLb/14).toFixed(2)))}renderTheory()}
  refresh();
  boot();
})();
