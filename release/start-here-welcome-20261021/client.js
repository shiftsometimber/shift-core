(()=>{'use strict';
const root=document.querySelector('[data-start-welcome-version]');if(!root)return;
const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)],welcome=$('#sw-welcome'),questions=$('#sw-questions'),result=$('#sw-result');
const answers={why:['Lose weight'],med:[],access:[],bmi:[],condition:[],stage:[]};let step=0;
const arrow='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';
const motion=()=>matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth';
const routes=$('#sw-routes');
$('a[href="#sw-routes"]').addEventListener('click',e=>{
 e.preventDefault();e.stopPropagation();
 history.pushState({},'',location.pathname+location.search+'#sw-routes');
 routes.setAttribute('tabindex','-1');routes.focus({preventScroll:true});
 routes.scrollIntoView({behavior:motion(),block:'start'});
});
function view(which,focus=true){welcome.hidden=which!=='welcome';questions.hidden=which!=='questions';result.hidden=which!=='result';document.title=which==='result'?'Your treatment options | SHIFT Some Timber':'Start Here | SHIFT Some Timber';if(focus){const el=which==='welcome'?$('#sw-title'):which==='questions'?$('[data-quick-step="'+step+'"] h2'):$('#sw-result-title');el.setAttribute('tabindex','-1');el.focus({preventScroll:true});scrollTo({top:0,behavior:'auto'});}}
function sync(){ $$('[data-quick-step]').forEach((el,i)=>el.hidden=i!==step);$('[data-quick-count]').textContent='Question '+(step+1)+' of 3';$('[role=progressbar]').setAttribute('aria-valuenow',step+1);$('[data-quick-bar]').style.width=((step+1)/3*100)+'%';$('[data-quick-back]').hidden=step===0;$('[data-quick-next]').innerHTML=(step===2?'Show my options':'Continue')+' '+arrow;$('[data-quick-validation]').textContent='';}
function openQuestions(){step=0;sync();view('questions');}
$$('[data-weight-start]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();history.pushState({route:'weight-loss'},'',a.getAttribute('href'));openQuestions();}));
$$('[data-welcome-back]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();history.pushState({},'','/start-here');view('welcome');}));
$$('[data-multi],[data-one]').forEach(group=>{const key=group.dataset.multi||group.dataset.one;group.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{if(button.getAttribute('aria-disabled')==='true')return;if(group.dataset.one){group.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}else button.setAttribute('aria-pressed',String(button.getAttribute('aria-pressed')!=='true'));answers[key]=[...group.querySelectorAll('[aria-pressed=true]')].map(b=>b.dataset.choice);if(key==='bmi')$('#sw-condition').hidden=!['27','28'].includes(answers.bmi[0]);$('[data-quick-validation]').textContent='';}));});
$('[data-quick-back]').addEventListener('click',()=>{step--;sync();view('questions');});
$('[data-quick-next]').addEventListener('click',()=>{if(step===1&&(!answers.med.length||!answers.access.length)){$('[data-quick-validation]').textContent='Choose a support preference and an access route to continue.';return;}if(step===2&&answers.med[0]!=='No medication'&&(!answers.stage.length||!answers.bmi.length||(['27','28'].includes(answers.bmi[0])&&!answers.condition.length))){$('[data-quick-validation]').textContent='Choose your treatment stage, BMI range and, if shown, whether you have a diagnosed condition.';return;}if(step===1&&answers.med[0]==='No medication'){render();return;}if(step<2){step++;sync();view('questions');}else render();});
$('#sw-calculate').addEventListener('click',()=>{const h=Number($('#sw-height').value),w=Number($('#sw-weight-kg').value);if(h<120||h>230||w<35||w>320){$('#sw-bmi-calculated').textContent='Enter a height from 120–230 cm and weight from 35–320 kg, or ask a clinician to help check your BMI.';return;}const bmi=w/((h/100)**2),band=bmi>=30?'30':bmi>=28?'28':bmi>=27?'27':'below';$('[data-one="bmi"] [data-choice="'+band+'"]').click();$('#sw-bmi-calculated').textContent='Your BMI is approximately '+bmi.toFixed(2)+'. Your range is selected above using the unrounded result.';});
function bmiRoute(key,choice){if(choice.stage==='continuing')return 'review';if(choice.bmi==='unknown')return 'unknown';if(choice.bmi==='30')return 'possible';if(choice.bmi==='below'||(key==='orlistat'&&choice.bmi==='27'))return 'outside';if(choice.condition==='yes')return 'possible';return choice.condition==='no'?'outside':'unknown';}
$('#sw-edit').addEventListener('click',()=>{step=0;sync();view('questions');});
function pair(label,value){const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;div.append(dt,dd);return div;}

const medicineInfo={
  "mounjaro": {
    "name": "Mounjaro",
    "active": "tirzepatide",
    "form": "Once-weekly injection",
    "course": "4 weeks · four weekly doses",
    "start": "2.5",
    "review": "Medical history, medicines, pregnancy plans, pancreatitis risk, gastrointestinal disease and other factors require individual assessment.",
    "newGuidance": "New patients normally begin at 2.5 mg once weekly. The prescriber confirms the medicine and dose after assessment.",
    "continuingGuidance": "Select the Mounjaro strength you currently use. Evidence may be requested and the prescriber must confirm whether it is appropriate to continue.",
    "tradeoff": "An injection with gastrointestinal side effects and a gradual, clinician-led dose pathway.",
    "source": "https://www.medicines.org.uk/emc/product/15481/smpc"
  },
  "wegovy-injection": {
    "name": "Wegovy injection",
    "active": "semaglutide",
    "form": "Once-weekly injection",
    "course": "4 weeks · four weekly doses",
    "start": "0.25",
    "review": "Medical history, current medicines, pregnancy plans, previous GLP-1 treatment and tolerability require individual assessment.",
    "newGuidance": "New patients normally begin at 0.25 mg once weekly. Dose escalation is gradual and must be confirmed by the prescriber.",
    "continuingGuidance": "Select the Wegovy injection strength you currently use. Higher strengths are not automatic and remain subject to clinical confirmation.",
    "tradeoff": "Still an injection, with gradual titration and response that varies considerably.",
    "source": "https://www.medicines.org.uk/emc/product/13799/smpc"
  },
  "wegovy-tablets": {
    "name": "Wegovy tablet",
    "active": "semaglutide",
    "form": "Once-daily tablet",
    "course": "Once-daily tablets · pack duration to be confirmed",
    "start": "1.5",
    "review": "Medical history, current medicines, pregnancy plans and ability to follow the tablet fasting instructions require individual assessment.",
    "newGuidance": "New patients normally begin at 1.5 mg once daily. Tablets have specific fasting and administration instructions supplied by your prescribing service.",
    "continuingGuidance": "Select the Wegovy tablet strength you currently use. The prescriber confirms continuation or escalation after clinical review.",
    "tradeoff": "Daily dosing and specific fasting/administration instructions demand a consistent routine.",
    "source": "https://www.gov.uk/government/news/first-glp-1-tablet-for-weight-loss-approved-in-the-uk"
  },
  "liraglutide": {
    "name": "Liraglutide",
    "active": "Saxenda or licensed equivalent",
    "form": "Once-daily injection",
    "course": "Multi-dose pens · quantity varies by stage",
    "start": "0.6",
    "review": "Medical history, current medicines, pregnancy plans, pancreatitis risk and tolerability require individual assessment.",
    "newGuidance": "Liraglutide normally starts at 0.6 mg daily and increases gradually. A starter pen lasts longer than a pen used at the 3 mg maintenance dose.",
    "continuingGuidance": "Select your current daily dose and the corresponding pack. An appropriately regulated prescribing service confirms brand, quantity and continuation.",
    "tradeoff": "Daily injections and generally more modest average loss than newer weekly incretin options.",
    "source": "https://www.medicines.org.uk/emc/product/2313/smpc"
  },
  "foundayo": {
    "name": "Foundayo",
    "active": "orforglipron",
    "form": "Once-daily tablet",
    "course": "Once-daily tablets · pack duration to be confirmed",
    "start": "0.8",
    "review": "Medical history, current medicines, pregnancy plans and individual risks require assessment by the prescriber.",
    "newGuidance": "New patients use a staged route beginning at 0.8 mg once daily. The prescriber confirms suitability and each change.",
    "continuingGuidance": "Select the Foundayo strength you currently use. Treatment history and evidence must be verified before continuation.",
    "tradeoff": "A daily routine, familiar gastrointestinal GLP-1 effects and less real-world experience than established options.",
    "source": "https://www.gov.uk/government/news/uk-first-in-europe-to-authorise-orforglipron-for-weight-management-and-type-2-diabetes"
  },
  "orlistat": {
    "name": "Orlistat",
    "active": "orlistat",
    "form": "Capsule with meals",
    "course": "120 mg capsules · pack-size selection",
    "start": "84",
    "fixedDose": true,
    "review": "Digestive conditions, medicines including anticoagulants or ciclosporin, nutritional considerations and other factors require individual assessment.",
    "newGuidance": "Prescription orlistat is supplied as 120 mg capsules. Pack size—not a higher dose—is the purchasing choice. It is taken only as directed with appropriate meals.",
    "continuingGuidance": "Select the pack size required. The 120 mg strength does not increase with treatment stage; the prescriber confirms suitability and quantity.",
    "tradeoff": "Meal-linked dosing, gastrointestinal effects and more modest average weight loss than incretin treatments.",
    "source": "https://www.medicines.org.uk/emc/product/2592/smpc"
  }
};
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

function render(){
const med=answers.med[0],access=answers.access[0],bmi=answers.bmi[0],condition=answers.condition[0],stage=answers.stage[0],noMed=med==='No medication',free=access==='NHS';
$('#sw-result-title').textContent=noMed?'Your weight-loss support':'Your treatment options';
$('#sw-result-lead').textContent=noMed?'Practical support for the route you chose.':'Compare treatments, explore doses and see clear prices.';
$('#sw-answer-summary').textContent=[med,stage==='continuing'?'Continuing / switching':noMed?'Practical support':'Starting treatment',noMed?access:({'30':'BMI 30+','28':'BMI 28 to below 30','27':'BMI 27 to below 28',below:'BMI below 27',unknown:'BMI not sure'})[bmi]].filter(Boolean).join(' · ');
$('#sw-why-route').open=noMed||free;
const alert=$('#sw-result-alert');alert.replaceChildren();const outside=!noMed&&stage==='new'&&(bmi==='below'||(['27','28'].includes(bmi)&&condition==='no'));alert.hidden=!outside;if(outside){appendText(alert,'span','Your answers fall outside the initial BMI criteria for a new treatment. ');const health=appendText(alert,'a','Explore SHIFT Health →');health.href='/shift-health';}
$('#sw-summary').replaceChildren(pair('Your priorities',answers.why.join(', ')),pair('Your preference',med),pair('Access',access),...(noMed?[]:[pair('BMI',({'30':'30 or above','28':'28 to below 30','27':'27 to below 28',below:'Below 27',unknown:'Not sure'})[bmi]),pair('Treatment',stage==='continuing'?'Already on treatment':'Starting treatment')]));
$('#sw-result-reason').textContent='You chose the weight-loss route'+(answers.why.length>1?' and told us that '+answers.why.slice(1).join(', ').toLowerCase()+' matters too.':'.')+' Here is why these starting points fit your choices.';
$('#sw-support-reason').textContent='Food, movement and check-ins with free My Timber.';
const title=$('#sw-route-title'),reason=$('#sw-route-reason'),link=$('#sw-route-link'),money=$('#sw-route-budget');
link.hidden=false;
if(noMed){title.textContent='Build a routine without medication.';reason.textContent='You selected no medication. The Programme explains practical food, movement and ongoing support, with free My Timber tools to help you put it into practice.';link.href='/programme';link.innerHTML='Explore the Programme '+arrow;money.textContent='You can begin with free My Timber.';}
else if(free){title.textContent='Explore free support and NHS routes first.';reason.textContent='You selected '+'NHS access'+'. Read about NHS weight-management support, eligibility and local availability. Your interest in '+({Jabs:'injections',Tablets:'oral options',Either:'both oral and injection options'})[med]+' can be part of a clinical conversation; it does not establish eligibility.';link.href='/guides/nhs-weight-management-uk-guide';link.innerHTML='Understand NHS routes '+arrow;money.textContent='Free My Timber is available alongside this route. NHS eligibility and treatment availability depend on the service.';}
else{title.textContent='Compare your treatment options.';reason.textContent='See the options in your preferred format, compare the alternatives and open the information below. Your BMI answers are checked against each treatment’s initial criteria.';link.hidden=true;money.textContent='Prices and stock come from our live catalogue. A prescriber confirms whether any treatment and dose are appropriate.';}
renderMedicines({med,access,bmi,condition,stage,noMed,free});
const extra=answers.why.filter(x=>x!=='Lose weight');$('.sw-result-health').hidden=!extra.length;$('#sw-health-reason').textContent='You also selected '+extra.join(', ').toLowerCase()+'. SHIFT Health provides another starting point for understanding your wider health, alongside weight-loss support.';
view('result');
}
addEventListener('popstate',()=>{if(new URLSearchParams(location.search).get('route')==='weight-loss'){sync();view('questions');}else view('welcome');});
sync();view(new URLSearchParams(location.search).get('route')==='weight-loss'?'questions':'welcome',false);
})();
