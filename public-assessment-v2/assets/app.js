const catalogue={
  mounjaro:{
    name:'Mounjaro',route:'ONCE-WEEKLY INJECTION',intro:'Tirzepatide in a four-dose pen, with a staged dose route and clinical review.',
    doses:[['2.5 mg','16900','oos'],['5 mg','18900','oos'],['7.5 mg','22900','oos'],['10 mg','25900','oos'],['12.5 mg','28900','oos'],['15 mg','31900','oos']],
    doseStages:[['Weeks 1–4','2.5 mg','Starting dose'],['Week 5+','5 mg','First maintenance option'],['If needed','+2.5 mg','After at least 4 weeks'],['Maximum','15 mg','Once weekly']],
    doseNote:'The licensed route starts at 2.5 mg once weekly for four weeks, then 5 mg. Any later increase is by 2.5 mg after at least four weeks on the current dose. Maintenance doses are 5, 10 and 15 mg; the maximum is 15 mg weekly.',
    evidence:{context:'SURMOUNT-1 · adults without type 2 diabetes · 72 weeks',bars:[['5 mg','16.0'],['10 mg','21.4'],['15 mg','22.5'],['Placebo','2.4']],stat:'89–96%',label:'lost at least 5%',copy:'Across the three tirzepatide groups, compared with 28% on placebo.',caveat:'Mean percentage weight change at week 72. Participants also received reduced-calorie diet and physical-activity support. Trial averages are not personal forecasts; response, tolerability and the dose reached vary.'},
    pen:{title:'One pen. Four weekly doses.',number:'4',label:'doses in each Mounjaro KwikPen',copy:'Each selected strength delivers one 0.6 ml dose weekly. The pen is multi-dose; use a new compatible needle for every injection.',facts:[['Once weekly','Same day each week'],['3 sites','Abdomen, thigh or upper arm'],['Rotate','Use a different injection site'],['With or without food','Any time of day']]},
    negatives:[['Gut side effects','Nausea, diarrhoea, vomiting, constipation and abdominal pain are very common in weight-management trials.'],['It is an injection','Correct pen technique, fresh needles and a weekly routine matter.'],['Higher is not always better','Dose increases need clinical approval and should reflect response and tolerability.'],['Stopping needs a plan','Weight regain can happen after stopping. Cost and continuity deserve an honest conversation.']],
    details:{
      how:'<p>Tirzepatide acts at GIP and GLP-1 receptors. It can reduce appetite and energy intake and slow gastric emptying. It is prescribed alongside a reduced-calorie diet and increased physical activity—not as a replacement for them.</p>',
      common:'<p>Nausea, diarrhoea, vomiting, constipation and abdominal pain are among the most common effects. They are often most noticeable while the dose is increasing and may reduce over time. Hydration matters because vomiting or diarrhoea can lead to dehydration.</p>',
      cautions:'<p>Tell the prescriber about diabetes medicines, previous pancreatitis, severe digestive disease, eye disease, planned surgery or sedation, pregnancy plans and every medicine you take. Persistent severe abdominal pain needs urgent medical assessment. This summary does not replace the patient leaflet or clinical advice.</p>',
      practical:'<p>It is taken once weekly. A missed dose may be taken within four days; after that, skip it and return to the usual day. Leave at least three days between two doses if changing injection day. Follow the current leaflet for storage, travel and disposal instructions.</p>',
      sources:'<p><a href="https://www.medicines.org.uk/emc/product/15481/smpc" target="_blank" rel="noreferrer">Mounjaro UK Summary of Product Characteristics ↗</a></p><p><a href="https://www.medicines.org.uk/emc/product/15481/pil" target="_blank" rel="noreferrer">Mounjaro patient leaflet ↗</a></p><p class="note">Read the current product information and the leaflet supplied with your medicine.</p>'
    }
  },
  wegovy:{
    name:'Wegovy pen',route:'ONCE-WEEKLY INJECTION',intro:'Semaglutide in a weekly pen, normally increased gradually when clinically appropriate.',
    doses:[['0.25 mg','9900','oos'],['0.5 mg','11900','oos'],['1 mg','14900','oos'],['1.7 mg','17900','oos'],['2.4 mg','19900','oos']],
    doseStages:[['Weeks 1–4','0.25 mg','Starting dose'],['Weeks 5–8','0.5 mg','Dose step'],['Weeks 9–12','1 mg','Dose step'],['Week 17+','2.4 mg','Usual maintenance']],
    doseNote:'The standard licensed escalation takes 16 weeks, moving through 0.25, 0.5, 1 and 1.7 mg before the usual 2.4 mg maintenance dose. A prescriber may delay escalation if significant gastrointestinal symptoms occur.',
    evidence:{context:'STEP 1 · adults without type 2 diabetes · 68 weeks',bars:[['Wegovy 2.4 mg','14.9'],['Placebo','2.4']],stat:'86%',label:'lost at least 5%',copy:'Compared with about 32% of participants receiving placebo.',caveat:'Mean percentage weight change at week 68. Both groups received lifestyle intervention. Trial averages are not personal forecasts; response and tolerability vary.'},
    pen:{title:'One injection each week.',number:'1×',label:'weekly dose on your chosen day',copy:'Follow the instructions for the exact pen supplied. Ask your clinical team if you need help using it.',facts:[['Once weekly','Same day each week'],['3 sites','Abdomen, thigh or upper arm'],['Step slowly','Dose normally rises over 16 weeks'],['With or without food','Any time of day']]},
    negatives:[['Gut side effects','Nausea, diarrhoea, vomiting, constipation and abdominal pain can occur.'],['Weekly injection','It still requires injection technique and a reliable routine.'],['Response varies','Not everybody loses enough weight to justify continuing.'],['Long-term cost','Affordability and the stopping route matter from day one.']],
    details:{
      how:'<p>Semaglutide is a GLP-1 receptor agonist. It helps regulate appetite and can reduce energy intake. It is used with a reduced-calorie diet and increased physical activity.</p>',
      common:'<p>Digestive effects such as nausea, vomiting, diarrhoea, constipation and abdominal pain are common, especially during dose escalation. The prescriber may slow the route if symptoms are significant.</p>',
      cautions:'<p>Clinical review must cover other medicines, diabetes treatment, previous pancreatitis, eye disease, pregnancy plans, planned procedures and relevant health history. Severe or persistent symptoms need medical advice. Read the supplied leaflet.</p>',
      practical:'<p>Use once weekly on the same day where possible. Follow the current patient leaflet for missed doses, storage, travel, injection technique and disposal because instructions depend on the supplied pen.</p>',
      sources:'<p><a href="https://www.medicines.org.uk/emc/search?q=Wegovy" target="_blank" rel="noreferrer">Find current Wegovy product information on emc ↗</a></p><p class="note">Read the current product information and the leaflet supplied with your medicine.</p>'
    }
  }
};

Object.assign(catalogue,window.SHIFT_ADDITIONAL_OPTIONS);
catalogue.mounjaro.doses=[['2.5 mg',16900,'oos'],['5 mg',18900,'oos'],['7.5 mg',22900,'oos'],['10 mg',25900,'oos'],['12.5 mg',28900,'oos'],['15 mg',31900,'oos']];
catalogue.wegovy.doses=[['0.25 mg',9900,'oos'],['0.5 mg',11900,'oos'],['1 mg',14900,'oos'],['1.7 mg',17900,'oos'],['2.4 mg',19900,'oos']];
let current='mounjaro',approved=false;
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)],money=p=>'£'+(Number(p)/100).toFixed(2);
function go(id){qa('.view').forEach(x=>x.classList.toggle('active',x.id===id));qa('.demo-nav button').forEach(x=>x.classList.toggle('active',x.dataset.go===id));scrollTo({top:0,behavior:'smooth'})}
qa('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));

function renderProduct(){
  const p=catalogue[current];
  q('.product-visual img').src=p.oral?'/assets/treatment-walkthrough-v2/oral-formats.svg':'/assets/treatment-walkthrough-v2/generic-pen.png';q('.product-visual img').alt=p.oral?'Generic tablet and capsule illustration, not supplied medicine or packaging':'Generic educational injection pen illustration';
  q('.product-visual figcaption').textContent='Educational illustration, not medicine packaging.';
  q('#format-eyebrow').textContent=p.oral?'THE ORAL FORMAT':'THE INJECTION FORMAT';q('.pen-silhouette').hidden=!!p.oral;q('#oral-illustration').hidden=!p.oral;
  q('#dose-heading').textContent=p.orlistat?'One strength. Different pack sizes.':'Your dose is a clinical decision.';
  const eligibility=q('#eligibility .eligibility-graphic');eligibility.querySelectorAll('article span')[1].textContent=p.orlistat?'28–29.9':'27–29.9';eligibility.querySelectorAll('article b')[1].textContent=p.orlistat?'BMI plus associated risk factors':'BMI plus a weight-related condition';
  
  q('#name').textContent=p.name;q('#route').textContent=p.route;q('#intro').textContent=p.intro;
  q('#dose').innerHTML=p.doses.map(d=>`<option value="${d[0]}" data-price="${d[1]}" data-stock="${d[2]}">${d[0]} · ${money(d[1])}${d[2]==='oos'?' · OOS':''}</option>`).join('');
  q('#dose-route').innerHTML=p.doseStages.map((d,i)=>`<article${i===0?' class="current-dose"':''}><small>${d[0]}</small><b>${d[1]}</b><p>${d[2]}</p></article>`).join('');
  q('#dose-note').textContent=p.doseNote;
  q('#pen-title').textContent=p.pen.title;q('#pen-number').textContent=p.pen.number;q('#pen-label').textContent=p.pen.label;q('#pen-copy').textContent=p.pen.copy;
  q('#pen-facts').innerHTML=p.pen.facts.map(f=>`<article><b>${f[0]}</b><span>${f[1]}</span></article>`).join('');
  q('#negatives').innerHTML=p.negatives.map(n=>`<article><b>${n[0]}</b><span>${n[1]}</span></article>`).join('');
  q('#how-it-works').innerHTML=p.details.how;q('#common-effects').innerHTML=p.details.common;q('#cautions').innerHTML=p.details.cautions;q('#practical').innerHTML=p.details.practical;q('#sources').innerHTML=p.details.sources;
  syncDose();
}

function syncDose(){
  const o=q('#dose').selectedOptions[0];
  q('#price').textContent=money(o.dataset.price);q('#supply').textContent='OUT OF STOCK';q('.supply').classList.add('oos');q('#start').disabled=true;q('#start').textContent='Out of stock';
  const label=catalogue[current].name+' · '+o.value;
  q('#review-name').textContent=label;q('#review-price').textContent=money(o.dataset.price);q('#track-name').textContent=label;q('#track-price').textContent=money(o.dataset.price);q('#review-letter').textContent=catalogue[current].name[0];
  q('#preview-assessment').href='/assessment-walkthrough#medicine='+encodeURIComponent(current)+'&dose='+encodeURIComponent(o.value);
}

q('#dose').onchange=syncDose;
qa('[data-product]').forEach(b=>b.onclick=()=>{current=b.dataset.product;qa('[data-product]').forEach(x=>x.classList.toggle('active',x===b));renderProduct()});
qa('[data-entry]').forEach(b=>b.onclick=()=>{qa('[data-entry]').forEach(x=>x.classList.toggle('active',x===b));q('#entry-copy').textContent=b.dataset.entry==='new'?'We’ll start with eligibility and the clinically appropriate first dose.':'Bring your current medicine, dose and latest provider details. The prescriber still confirms the next safe route.'});
q('#start').onclick=event=>event.preventDefault();
q('#verify-form').onsubmit=e=>{e.preventDefault();show('Verified for preview · illustrative review complete');setTimeout(()=>go('tracker'),650)};
q('#advance').onclick=()=>{approved=!approved;q('#advance').textContent=approved?'Open light Journey setup':'Preview approved state';qa('.timeline article')[2].classList.toggle('current',approved);if(approved)q('#advance').onclick=()=>go('journey')};
q('#journey-next').onclick=e=>{e.preventDefault();show('Starting point saved in preview')};
function show(text){q('#toast').textContent=text;q('#toast').classList.add('show');setTimeout(()=>q('#toast').classList.remove('show'),1800)}
renderProduct();

if(new URLSearchParams(location.search).get('view')==='tracker')go('tracker');
