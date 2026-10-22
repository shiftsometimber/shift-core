(()=>{'use strict';
const root=document.querySelector('[data-start-welcome-version]');if(!root)return;
const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)],welcome=$('#sw-welcome'),questions=$('#sw-questions'),result=$('#sw-result');
const answers={why:['Lose weight'],med:[],access:[],budget:[]};let step=0;
const arrow='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';
const motion=()=>matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth';
const routes=$('#sw-routes');
$('a[href="#sw-routes"]').addEventListener('click',e=>{
 e.preventDefault();e.stopPropagation();
 history.pushState({},'',location.pathname+location.search+'#sw-routes');
 routes.setAttribute('tabindex','-1');routes.focus({preventScroll:true});
 routes.scrollIntoView({behavior:motion(),block:'start'});
});
function view(which,focus=true){welcome.hidden=which!=='welcome';questions.hidden=which!=='questions';result.hidden=which!=='result';document.title=which==='result'?'Your weight-loss starting point | SHIFT Some Timber':'Start Here | SHIFT Some Timber';if(focus){const el=which==='welcome'?$('#sw-title'):which==='questions'?$('[data-quick-step="'+step+'"] h2'):$('#sw-result-title');el.setAttribute('tabindex','-1');el.focus({preventScroll:true});scrollTo({top:0,behavior:'auto'});}}
function sync(){ $$('[data-quick-step]').forEach((el,i)=>el.hidden=i!==step);$('[data-quick-count]').textContent='Question '+(step+1)+' of 3';$('[role=progressbar]').setAttribute('aria-valuenow',step+1);$('[data-quick-bar]').style.width=((step+1)/3*100)+'%';$('[data-quick-back]').hidden=step===0;$('[data-quick-next]').innerHTML=(step===2?'Show my options':'Continue')+' '+arrow;$('[data-quick-validation]').textContent='';}
function openQuestions(){step=0;sync();view('questions');}
$$('[data-weight-start]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();history.pushState({route:'weight-loss'},'',a.getAttribute('href'));openQuestions();}));
$$('[data-welcome-back]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();history.pushState({},'','/start-here');view('welcome');}));
$$('[data-multi],[data-one]').forEach(group=>{const key=group.dataset.multi||group.dataset.one;group.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{if(button.getAttribute('aria-disabled')==='true')return;if(group.dataset.one){group.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}else button.setAttribute('aria-pressed',String(button.getAttribute('aria-pressed')!=='true'));answers[key]=[...group.querySelectorAll('[aria-pressed=true]')].map(b=>b.dataset.choice);$('[data-quick-validation]').textContent='';}));});
$('[data-quick-back]').addEventListener('click',()=>{step--;sync();view('questions');});
$('[data-quick-next]').addEventListener('click',()=>{if(step===1&&(!answers.med.length||!answers.access.length)){$('[data-quick-validation]').textContent='Choose a support preference and an access route to continue.';return;}if(step===2&&!answers.budget.length){$('[data-quick-validation]').textContent='Choose a budget range to see your next steps.';return;}if(step<2){step++;sync();view('questions');}else render();});
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

function render(){
const med=answers.med[0],access=answers.access[0],budget=answers.budget[0],noMed=med==='No medication',free=budget==='£0 / NHS'||access==='NHS';
$('#sw-summary').replaceChildren(pair('Your priorities',answers.why.join(', ')),pair('Your preference',med),pair('Access',access),pair('Budget',budget+' per calendar month'));
$('#sw-result-reason').textContent='You chose the weight-loss route'+(answers.why.length>1?' and told us that '+answers.why.slice(1).join(', ').toLowerCase()+' matters too.':'.')+' Here is why these starting points fit your choices.';
$('#sw-support-reason').textContent='You want support with weight loss. My Timber brings together food, movement, check-ins and progress tools, so you can begin without buying medicine.';
const title=$('#sw-route-title'),reason=$('#sw-route-reason'),link=$('#sw-route-link'),money=$('#sw-route-budget');
link.hidden=false;
if(noMed){title.textContent='Build a routine without medication.';reason.textContent='You selected no medication. The Programme explains practical food, movement and ongoing support, with free My Timber tools to help you put it into practice.';link.href='/programme';link.innerHTML='Explore the Programme '+arrow;money.textContent='You do not need to spend your '+budget+' budget to begin with free My Timber.';}
else if(free){title.textContent='Explore free support and NHS routes first.';reason.textContent='You selected '+(access==='NHS'?'NHS access':'the £0 / NHS budget')+'. Read about NHS weight-management support, eligibility and local availability. Your interest in '+({Jabs:'injections',Tablets:'oral options',Either:'both oral and injection options'})[med]+' can be part of a clinical conversation; it does not establish eligibility.';link.href='/guides/nhs-weight-management-uk-guide';link.innerHTML='Understand NHS routes '+arrow;money.textContent='Free My Timber is available alongside this route. NHS eligibility and treatment availability depend on the service.';}
else{title.textContent='Compare your treatment options.';reason.textContent='Your '+med.toLowerCase()+' preference and '+budget+' budget are shown against the options below. Open the details here, then choose a treatment to see its strengths and pack sizes.';link.hidden=true;money.textContent='Prices and stock come from our live catalogue. A prescriber confirms whether any treatment and dose are appropriate.';}
renderMedicines({med,access,budget,noMed,free});
const extra=answers.why.filter(x=>x!=='Lose weight');$('.sw-result-health').hidden=!extra.length;$('#sw-health-reason').textContent='You also selected '+extra.join(', ').toLowerCase()+'. SHIFT Health provides another starting point for understanding your wider health, alongside weight-loss support.';
view('result');
}
addEventListener('popstate',()=>{if(new URLSearchParams(location.search).get('route')==='weight-loss'){sync();view('questions');}else view('welcome');});
sync();view(new URLSearchParams(location.search).get('route')==='weight-loss'?'questions':'welcome',false);
})();
