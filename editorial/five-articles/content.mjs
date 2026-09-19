import {DATA} from '../statistics/assets.js';
export const UPDATED='2026-09-19';
export const VERSION='five-articles-evidence-20260919-v1';
export const STATS='/research/uk-mens-weight-health-statistics';
const ref=(n,text)=>`<a class="fa-cite" href="#source-${n}" aria-label="Source ${n}: ${text}">[${n}]</a>`;
const section=(id,title,body)=>({id,title,body});
const table=(caption,heads,rows)=>`<div class="fa-table" tabindex="0" role="region" aria-label="${caption}; scroll horizontally if needed"><table><caption>${caption}</caption><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${r[0]}</th>${r.slice(1).map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const p=s=>`<p>${s}</p>`;
const ul=items=>'<ul>'+items.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
const source=(title,url)=>({title,url});
const safety=()=>p(`<strong>Do not dismiss severe, persistent abdominal pain as an ordinary side effect.</strong> Pain that may spread to your back, with or without vomiting, needs urgent medical assessment because pancreatitis is a possible serious reaction to these injections. ${ref(5,'MHRA pancreatitis warning')}`);
export const ARTICLES={
 '/comparisons/medications/mounjaro-vs-saxenda':{
  title:'Mounjaro vs Saxenda: weight-loss evidence, risks and switching',
  description:'Compare weekly tirzepatide with daily liraglutide: separate trial results, practical differences, side effects and questions to ask before switching.',
  category:'Treatment comparisons',
  lead:'Mounjaro is a weekly injection; Saxenda is a daily injection. Tirzepatide produced larger average weight losses in the separate trials summarised below, but those studies did not compare it directly with liraglutide. The useful question is which option is appropriate, tolerable and sustainable for you—not which one wins an invented score out of ten.',
  intro:p('This guide compares their adult weight-management use in the UK. It does not select a medicine or dose for you. Clinical suitability, NHS funding and whether a pharmacy can supply a prescription are three separate questions.'),
  sections:[
   section('at-a-glance','What actually differs?',table('Adult weight-management medicines: practical comparison',['Question','Mounjaro','Saxenda'],[
    ['Active ingredient','Tirzepatide','Liraglutide'],
    ['How it works','Acts on GIP and GLP-1 receptors','Acts on GLP-1 receptors'],
    ['Routine','Once-weekly injection','Once-daily injection'],
    ['Licensed adult weight-management starting criteria','BMI at least 30, or at least 27 with a weight-related condition','BMI at least 30, or at least 27 with a weight-related condition'],
    ['A useful review question','What benefit, side effects and review plan justify continuing?','Has the adult stopping rule been assessed after 12 weeks on the 3.0 mg daily dose?']
   ])+p(`These are product-licence details, not a promise of NHS eligibility. Both require prescribing assessment and are used alongside changes to eating and activity. ${ref(1,'Mounjaro UK product information')} ${ref(2,'Saxenda UK product information')}`)),
   section('trial-evidence','What do the weight-loss studies really show?',
    p('Compare the study design before comparing the headline. Both trials below enrolled adults without diabetes and included lifestyle support. Neither was a men-only trial. Their durations, participants and doses differed.')+
    table('Separate placebo-controlled trials—not a head-to-head comparison',['Study','Treatment and duration','Average body-weight reduction'],[
     ['SURMOUNT-1; 2,539 adults','Tirzepatide 5, 10 or 15 mg weekly; 72 weeks','15.0%, 19.5% and 20.9%, respectively; placebo 3.1%'],
     ['SCALE Obesity and Prediabetes; 3,731 adults','Liraglutide 3.0 mg daily; 56 weeks','8.0%; placebo 2.6%']
    ])+p(`Sources: original trial publications. SURMOUNT-1 was funded by Eli Lilly; SCALE by Novo Nordisk. These are average study outcomes, not guaranteed results or starting-dose effects. ${ref(3,'SURMOUNT-1 trial')} ${ref(4,'SCALE trial')}`)+
    p('<strong>What you can reasonably take away:</strong> the tirzepatide results support a discussion about substantial weight reduction. What you cannot do is subtract these two trials and claim that a particular man will lose that much more after switching. A Mounjaro-versus-Wegovy trial would not answer the Mounjaro-versus-Saxenda question either.')),
   section('daily-life','Which routine is more workable for your life?',
    p('Put the prescription into an ordinary week. Would a daily injection be easier to attach to a routine, or would a weekly appointment with yourself be easier to remember? Who will answer questions when you feel unwell? How will you handle travel, sharps disposal and obtaining the next supply?')+
    p('Ask for the total ongoing cost at the anticipated maintenance dose, including consultations, delivery and any separately charged support. A cheap first month does not tell you whether the next six months fit your budget. Ask what happens if treatment is interrupted; do not plan a restart from the dose on an old box.')+
    p('Agree what success means beyond a smaller number: improved day-to-day function, a plan you can maintain, and side effects you can manage. Record questions and symptoms for your prescriber rather than treating a comparison table as a treatment plan.')),
   section('safety','Side effects and the point at which you need help',
    p(`Nausea, vomiting and diarrhoea are recognised effects of these medicines; tolerability matters as well as effectiveness. Tell the prescriber about other medicines, particularly insulin or sulfonylureas, and any relevant digestive or pancreatic history. ${ref(1,'Mounjaro UK product information')} ${ref(2,'Saxenda UK product information')}`)+safety()+
    p('Contact your treating service promptly when symptoms interfere with eating, drinking or ordinary activity. Severe symptoms, collapse or an immediate threat to life require emergency help. Do not increase a dose to compensate for a disappointing week on the scales.')),
   section('switching','Switching is a clinical handover—not a dose conversion',
    p(`Speak to the prescribing team before changing medicine or brand. Give them the exact product, dose, date of your last injection, side effects and any treatment gaps. The MHRA specifically advises discussing a switch with a healthcare professional. ${ref(6,'MHRA advice on GLP-1 medicines')}`)+
    p('Ask for written instructions covering the last dose of the old medicine, the first dose of the new one, who owns the follow-up, and what to do if you cannot tolerate it. Do not combine these injections or invent a milligram-for-milligram conversion yourself.')+
    p(`For adults using Saxenda, its product information says to discontinue if at least 5% of initial body weight has not been lost after <strong>12 weeks at 3.0 mg a day</strong>. That is not simply 12 weeks after the first starter dose. Your clinician should assess the stopping rule and alternatives. ${ref(2,'Saxenda adult stopping rule')}`)),
   section('questions','Take these questions to the prescriber',ul([
    'What makes this medicine appropriate for my medical history and goals?',
    'What is the review point, and what would lead us to continue, change or stop?',
    'What is the complete ongoing cost, and who handles side effects or supply interruptions?',
    'Can I leave with a written handover plan rather than infer one from the internet?'
   ])),
   section('guide-programme-cta-v30c','Keep the support separate from the prescription',
    p('SHIFT’s Programme brings together food, movement and everyday support; My Timber can keep your own goals and treatment history in one place. Those records are not a prescription or a clinician’s approval. Use them to make the next conversation easier.')+p('<a href="/programme">Explore the Programme</a> · <a href="/member/dashboard?passport=1#journey">Open your Health Passport in My Timber</a> · <a href="/guides/nhs-weight-loss-medication-pathways">Check the separate NHS access routes</a>'))
  ],
  faqs:[
   ['Is Mounjaro better than Saxenda?','Separate trials reported greater average weight reduction with tirzepatide, but this page does not present a direct comparison trial or a personalised prediction. Suitability, adverse effects, support and affordability still matter.'],
   ['Can I switch straight from Saxenda to Mounjaro?','A prescriber needs to plan the change using your current treatment, last dose, treatment gaps and tolerability. Do not overlap medicines or calculate a replacement dose yourself.'],
   ['Does meeting the licence criteria mean I can get it on the NHS?','No. NHS commissioning, referral and prioritisation rules are distinct from a medicine’s licence. See the NHS pathways guide and check your local service.']
  ],
  sources:[source('Mounjaro: UK summary of product characteristics','https://www.medicines.org.uk/emc/product/15481/smpc'),source('Saxenda: UK summary of product characteristics','https://www.medicines.org.uk/emc/product/2313/smpc'),source('Jastreboff et al., SURMOUNT-1, New England Journal of Medicine (2022)','https://www.nejm.org/doi/abs/10.1056/NEJMoa2206038'),source('Pi-Sunyer et al., SCALE, New England Journal of Medicine (2015)','https://www.nejm.org/doi/abs/10.1056/NEJMoa1411892'),source('MHRA: strengthened warnings on acute pancreatitis, 29 January 2026','https://www.gov.uk/drug-safety-update/glp-1-receptor-agonists-and-dual-glp-1-slash-gip-receptor-agonists-strengthened-warnings-on-acute-pancreatitis-including-necrotising-and-fatal-cases'),source('MHRA: GLP-1 medicines—what you need to know','https://www.gov.uk/government/publications/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know')],
  change:'Replaced unsupported ratings and a different-drug comparison with separate-trial evidence, adult review criteria, safety advice and a practical switching checklist.'
 },
 '/comparisons/medications/mounjaro-vs-orlistat':{
  title:'Mounjaro vs Orlistat: effectiveness, side effects and daily use',
  description:'Weekly tirzepatide versus meal-time orlistat: understand the different mechanisms, honest evidence limits, gut effects, review points and practical trade-offs.',
  category:'Treatment comparisons',
  lead:'Mounjaro and orlistat are not an injection and tablet version of the same treatment. Mounjaro affects appetite-related hormone signalling; orlistat reduces absorption of some fat from food. The differences matter for daily life, side effects and what you can reasonably expect.',
  intro:p('This comparison is about adult weight management. The prescription-dose orlistat evidence below is not interchangeable with evidence for lower-dose pharmacy products. Your prescriber or pharmacist needs to assess the actual product and your other medicines.'),
  sections:[
   section('at-a-glance','The practical differences',table('What you would be choosing between',['Question','Mounjaro','Orlistat'],[
    ['Medicine','Tirzepatide; prescription injection','Orlistat; prescription 120 mg or lower-dose pharmacy products'],
    ['Main mechanism','GIP/GLP-1 receptor activity affecting appetite and food intake','Acts in the gut to reduce fat absorption; not an appetite-suppressing injection'],
    ['Routine','Once weekly, using a prescribed escalation and review plan','Tied to main meals that contain fat; product instructions matter'],
    ['Typical practical concern','Injection routine, nausea and tolerance during treatment','Oily stools, urgency and planning meals around work or travel'],
    ['Weight-management licence threshold','BMI at least 30, or at least 27 with a weight-related condition','Prescription Xenical: BMI at least 30, or at least 28 with associated risk factors']
   ])+p(`The licence is not the NHS funding rule, and a lower BMI number is not evidence that a medicine is right for you. ${ref(1,'Mounjaro UK product information')} ${ref(2,'Xenical UK product information')} ${ref(3,'NHS orlistat guide')}`)),
   section('evidence','Read the units before believing the headline',
    p('These evidence summaries answer different questions. They must not be displayed as a head-to-head contest or turned into arbitrary “effectiveness scores”.')+
    table('Different evidence, different outcome measures',['Evidence','Result','What the number means'],[
     ['SURMOUNT-1; adults without diabetes; 72 weeks','Tirzepatide 5/10/15 mg: 15.0% / 19.5% / 20.9%; placebo 3.1%','Average percentage reduction from starting weight in a placebo-controlled trial with lifestyle support.'],
     ['Xenical product information; pooled one-year trials','3.2 kg greater mean weight loss with orlistat than placebo','An additional kilogram difference versus placebo—not total percentage weight loss.']
    ])+p(`The tirzepatide trial was funded by Eli Lilly. The orlistat result is reported in the prescription product’s clinical evidence. Different populations, durations and outcome definitions mean the rows cannot give a reliable personal “extra weight I will lose” calculation. ${ref(4,'SURMOUNT-1 trial')} ${ref(2,'Xenical pooled clinical evidence')}`)+
    p('The injection evidence makes substantial average weight reduction a legitimate topic for assessment. It does not make a tablet automatically pointless, nor does avoiding injections make orlistat risk-free. Ask which outcome is realistic for your circumstances and how it will be reviewed.')),
   section('meals','Orlistat changes the meal-time calculation',
    p(`For prescription Xenical, the capsule is taken immediately before, during or up to one hour after a main meal. A dose is omitted when a meal is missed or contains no fat. Higher-fat meals can make gastrointestinal effects more troublesome. Follow your own product’s instructions rather than applying this automatically to another strength. ${ref(2,'Xenical administration instructions')}`)+
    p('Think about a working day: do you eat regular meals, can you access a toilet easily, and would you understand when a dose is not needed? Discuss how to maintain balanced nutrition rather than responding by skipping food or eliminating fat altogether.')+
    p(`Orlistat can affect fat-soluble vitamin absorption and interact with other medicines. Ask the pharmacist to check your full medication and supplement list, and whether vitamin advice is needed. NHS information distinguishes prescription Xenical from lower-dose products such as Alli and Orlos. ${ref(3,'NHS orlistat precautions and products')}`)),
   section('safety','Side effects: different does not mean trivial',
    p(`For Mounjaro, nausea, vomiting and diarrhoea are recognised adverse effects. Other diabetes treatments may also need review. ${ref(1,'Mounjaro precautions')}`)+safety()+
    p('For either treatment, contact your treating service when symptoms are persistent, severe or prevent normal eating and drinking. Do not assume that an unpleasant reaction proves the medicine is working. Read the patient leaflet supplied with the exact product.')),
   section('review','Agree the review and stopping plan before you start',
    p(`Prescription orlistat should be discontinued if at least 5% of initial body weight has not been lost after 12 weeks. That is a clinical review point, not a reason to take additional capsules. ${ref(2,'Xenical stopping rule')}`)+
    p('For the injection, ask when benefit and tolerability will be reviewed and what would justify continuing. Compare the full ongoing cost—including clinical support—not just the medicine’s introductory price. Keep a plan for interruptions and stopping, rather than assuming that a short course resolves everything permanently.')+
    p(`Do not add orlistat to an injection or switch products on the basis of this page. The MHRA advises discussing GLP-1 switches with a healthcare professional. Your existing prescription and other medicines belong in that conversation. ${ref(6,'MHRA switching advice')}`)),
   section('questions','A better decision than “jabs or tablets?”',ul([
    'What does my medical history rule in or out?',
    'Can I follow this routine during an ordinary working week?',
    'Which side effects would require a call, a review or urgent help?',
    'What would count as enough benefit, and when will we decide?',
    'What support continues if the medicine changes or stops?'
   ])),
   section('guide-programme-cta-v30c','Keep the everyday plan with you',p('The Programme and My Timber provide a place for food, movement, goals and your own treatment history. A saved entry is a personal record—not a verified prescription or an instruction to change medicine.')+p('<a href="/programme">See the Programme</a> · <a href="/member/dashboard?passport=1#journey">Keep your history in My Timber</a> · <a href="/guides/nhs-weight-loss-medication-pathways">Understand NHS access</a>'))
  ],
  faqs:[['Is orlistat a tablet version of Mounjaro?','No. The medicines have different mechanisms and routines. Orlistat acts on fat absorption in the gut; tirzepatide acts on GIP/GLP-1 receptors.'],['Does “3.2 kg” mean that is all someone loses on orlistat?','No. The cited pooled result is the mean additional loss compared with placebo after one year. It is not a total weight-loss forecast.'],['Can I take both together?','This comparison does not establish that a combination is appropriate or safe for you. Do not combine or switch them without the prescribing team assessing your treatment.']],
  sources:[source('Mounjaro: UK summary of product characteristics','https://www.medicines.org.uk/emc/product/15481/smpc'),source('Xenical 120 mg: UK summary of product characteristics','https://www.medicines.org.uk/emc/product/2592/smpc'),source('NHS: orlistat—uses, side effects and precautions','https://www.nhs.uk/medicines/orlistat/'),source('Jastreboff et al., SURMOUNT-1, New England Journal of Medicine (2022)','https://www.nejm.org/doi/abs/10.1056/NEJMoa2206038'),source('MHRA: strengthened warnings on acute pancreatitis, 29 January 2026','https://www.gov.uk/drug-safety-update/glp-1-receptor-agonists-and-dual-glp-1-slash-gip-receptor-agonists-strengthened-warnings-on-acute-pancreatitis-including-necrotising-and-fatal-cases'),source('MHRA: GLP-1 medicines—what you need to know','https://www.gov.uk/government/publications/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know')],
  change:'Removed unsupported scores and the irrelevant semaglutide comparison; distinguished total percentage loss from placebo-adjusted kilograms and clarified prescription-dose orlistat use.'
 },
 '/guides/nhs-weight-loss-medication-pathways':{
  title:'NHS weight-loss medication: access routes and eligibility in 2026',
  description:'Understand England’s June 2026 Mounjaro rollout, specialist routes, other UK nations and the questions to ask when an NHS weight-management referral is unclear.',
  category:'NHS pathways',
  lead:'There is no single UK queue for weight-loss medicines. Your route depends on the reason for treatment, where you live, clinical suitability and the service commissioned locally. In England, the current primary-care Mounjaro rollout is narrower than its medicine licence—and differs from specialist access.',
  intro:p('<strong>Access information checked 19 September 2026.</strong> This guide explains routes; it does not decide whether you qualify. A self-entered BMI and a generic count of health conditions cannot safely make that decision.'),
  sections:[
   section('start','Separate three questions before chasing a prescription',ul([
    '<strong>Is it clinically appropriate?</strong> The prescriber assesses the actual medicine, indication, history and risks.',
    '<strong>Is that use funded through this NHS pathway?</strong> A licensed use is not automatically funded for everyone who meets the licence.',
    '<strong>Which local service provides it?</strong> The answer may be a commissioned primary-care service or a specialist team, not necessarily your own practice.'
   ])+p(`NHS England distinguishes specialist eligibility from phased primary-care access and permits different local delivery models. ${ref(1,'NHS England commissioning guidance')}`)),
   section('mounjaro','Mounjaro in England: what changed in June 2026?',
    p(`From <strong>23 June 2026</strong>, the primary-care rollout includes the second priority cohort as well as the first. NHS Cheshire and Merseyside describes the threshold as BMI at least 35 with at least four of five specified conditions, with lower BMI thresholds for named ethnic backgrounds. This is not simply “BMI 35 plus any four diagnoses”. ${ref(2,'NHS Cheshire and Merseyside phased access')}`)+
    table('England: primary-care tirzepatide rollout, as at 19 September 2026',['Phase','BMI before ethnicity adjustment','Qualifying conditions'],[
     ['Cohort I—continues','40 or more','At least four of the five named conditions'],
     ['Cohort II—from 23 June 2026','35–39.9','At least four of the five named conditions'],
     ['Cohort III—scheduled from 1 April 2027, not yet the current phase','40 or more','Three of the five named conditions']
    ])+p(`The five are hypertension, dyslipidaemia, obstructive sleep apnoea, cardiovascular disease within the commissioning definition, and type 2 diabetes. The clinical definitions matter: for example, the sleep-apnoea criterion is not merely snoring. A clinician checks the diagnoses and applicable treatment criteria. ${ref(1,'NHS England qualifying conditions')}`)+
    p(`The stated BMI thresholds are usually reduced by 2.5 for South Asian, Chinese, other Asian, Middle Eastern, Black African and African-Caribbean backgrounds. Ask the service to confirm how the adjustment applies to you. ${ref(2,'NHS Cheshire and Merseyside BMI adjustments')}`)),
   section('primary','Specialist access is not the same as the primary-care phase',
    p(`The wider specialist tirzepatide population described by NHS England has BMI at least 35 plus at least one weight-related condition, with the specified ethnicity adjustment and prescribing assessment. Services can prioritise referrals according to clinical need and capacity. Missing the current primary-care cohort therefore does not, by itself, answer whether a specialist referral is appropriate. ${ref(1,'NHS England specialist implementation')}`)+
    p('Ask which pathway was considered, who accepts the referral and what happens while you wait. A funding rule is not a promise of an immediate appointment or a particular medicine.')),
   section('map','The medicine name alone does not identify the pathway',
    p(`<span id="wegovy"></span><strong>Semaglutide (Wegovy):</strong> obesity prescribing through specialist weight-management services has its own criteria. There is also a distinct cardiovascular-risk indication for some people with established cardiovascular disease and overweight or obesity. Do not use the Mounjaro obesity cohort table to decide eligibility for that separate indication; ask the GP or cardiac team about the currently commissioned route. ${ref(3,'NHS England weight-management injections')} ${ref(4,'NHS semaglutide information')} ${ref(5,'NHS regional cardiovascular pathway implementation')}`)+
    p(`<span id="saxenda"></span><strong>Liraglutide (Saxenda):</strong> NHS weight-loss access is through specialist services and is not a routine promise of a GP prescription. ${ref(6,'NHS liraglutide information')}`)+
    p(`<span id="orlistat"></span><strong>Orlistat:</strong> a different, meal-related medicine, available on prescription and in lower-dose pharmacy products. Discuss whether it fits your history and daily routine rather than treating it as an interchangeable injection substitute. ${ref(7,'NHS orlistat information')}`)+
    p(`<span id="diabetes"></span><strong>Type 2 diabetes:</strong> tirzepatide prescribed for blood-glucose management has a separate eligibility pathway from tirzepatide for obesity. Ask which indication is being assessed. ${ref(1,'NHS England distinction between diabetes and obesity pathways')}`)),
   section('uk-nations','Outside England: use your own nation’s route',
    p(`England’s phased table must not be presented as a UK-wide entitlement. Wales has a separate clinical pathway and health-board arrangements. Northern Ireland announced a first-phase obesity management service on 29 June 2026, with implementation expected in early autumn; an announcement is not evidence that every local referral route is already open. ${ref(8,'Welsh Government clinical pathway')} ${ref(9,'Northern Ireland service announcement')}`)+
    p('In Scotland, ask your GP or NHS board which current weight-management service and formulary apply. In Wales, contact your health board; in Northern Ireland, your GP or HSC trust. Get the local route in writing when national headlines and practice information do not seem to match.')),
   section('refused','“Not available” can mean three very different things',table('Ask what the actual barrier is',['Answer you receive','Useful follow-up'],[
    ['Not clinically suitable','What makes it unsuitable, and what alternatives address the same health need?'],
    ['Outside the current funded cohort','Which indication and care setting were assessed? Is a specialist referral appropriate?'],
    ['Local pathway or capacity restriction','Who commissions the service, how are referrals handled and how can I check for a change?']
   ])+p('A clear explanation is more useful than repeatedly asking for the same brand. Request the local integrated care board’s pathway in England, or your national/local equivalent elsewhere. Keep the response and any referral details.')),
   section('questions','A practical appointment checklist—not a self-diagnosis finder',
    p('<span id="finder"></span><span id="print"></span>Bring your current medicines, known diagnoses, previous weight-management support, any private treatment and the dates of relevant reviews. You do not need to invent a perfect history or start a medicine privately to justify asking for help.')+ul([
     'Which clinical indication and NHS pathway are relevant to me?',
     'Am I being assessed against primary-care prioritisation or specialist referral criteria?',
     'What eating, activity and behavioural support comes with treatment?',
     'What happens if I am unsuitable, outside the current cohort or waiting for capacity?',
     'Who is responsible for monitoring, side effects and the next review?'
    ])),
   section('support','Support, waiting and private-to-NHS handover',
    p('Ask for the support available now, not just the prescription you hope might follow. Keep mental health, sleep, eating difficulties and mobility in the conversation. A treatment decision should not reduce the appointment to a single BMI number.')+
    p('<span id="private"></span>Do not assume an NHS service will take over a privately started medicine, match its dose or refund its cost. Ask the receiving service before making financial or treatment plans. Share the exact product and treatment history; leave any switch to the prescribing team.')+
    p('<span id="shift"></span>My Timber can hold your own goals and treatment/provider history so you do not have to reconstruct them for each conversation. It cannot verify NHS eligibility, advance a waiting list or replace the NHS service’s records. <a href="/member/dashboard?passport=1#journey">Open My Timber</a> · <a href="/programme">Use the Programme’s everyday support</a>.'))
  ],
  aliases:{'nhs-mounjaro-eligibility-bmi':'mounjaro','nice':'start','rollout':'mounjaro','icb':'refused','referral':'questions','bloods':'questions'},
  faqs:[['Can my GP prescribe Mounjaro for weight loss now?','In England, prescribing depends on clinical assessment and the currently commissioned primary-care or specialist route. The June 2026 rollout is not access for everyone who meets the medicine licence.'],['Does one weight-related condition qualify me?','It is not enough for the current England primary-care priority cohorts described here. The specialist pathway has different criteria; ask which setting is appropriate rather than treating the primary-care table as the only route.'],['Can I use the same criteria in Scotland, Wales or Northern Ireland?','No. The detailed phased table on this page describes England. Confirm your own nation’s and local service’s arrangements.']],
  sources:[source('NHS England: interim tirzepatide commissioning guidance, April 2026','https://www.england.nhs.uk/long-read/interim-commissioning-guidance-nice-ta1026-tirzepatide/'),source('NHS Cheshire and Merseyside: Mounjaro phased access and dates','https://cheshireandmerseyside.nhs.uk/your-health/prescribing/statements/mounjaro-tirzepatide/'),source('NHS England: weight-management injections','https://www.england.nhs.uk/ourwork/prevention/obesity/medicines-for-obesity/weight-management-injections/'),source('NHS: semaglutide uses and prescribing information','https://www.nhs.uk/medicines/semaglutide/'),source('NHS North East and North Cumbria: May/July 2026 prescribing decisions','https://ntag.nhs.uk/nenc-clinical-effectiveness-and-governance-ceg-subcommittee-and-ntag-decisions-may-and-july-2026-updated/'),source('NHS: liraglutide','https://www.nhs.uk/medicines/liraglutide/'),source('NHS: orlistat','https://www.nhs.uk/medicines/orlistat/'),source('Welsh Government: obesity clinical pathway, updated July 2026','https://www.gov.wales/new-clinical-pathway-treating-and-managing-obesity-whc2025043-html'),source('Department of Health Northern Ireland: first-phase service announcement, 29 June 2026','https://www.health-ni.gov.uk/news/health-minister-announces-first-phase-nis-first-obesity-management-service')],
  change:'Updated the June 2026 England rollout, separated specialist, diabetes and cardiovascular indications and UK nations, and replaced the generic eligibility finder with an appointment checklist.'
 },
 '/mental-health/mental-health-and-weight':{
  title:'Mental health and weight: support for men without blame',
  description:'Low mood, eating difficulties and weight can overlap. Recognise when to ask for help, prepare for a GP conversation and find urgent or ongoing support.',
  category:'Men’s mental health',
  lead:'You do not need to reach a target weight before you deserve support with your mental health. Weight, eating, sleep and mood can overlap, but a number on the scales cannot tell the whole story—and losing weight is not a substitute for treating depression or an eating disorder.',
  intro:p('<strong>Need urgent help?</strong> If you or someone else is in immediate danger, call 999 or go to A&E. In England, for urgent mental-health help that is not an immediate emergency, call NHS 111 and select the mental-health option. Samaritans is available across the UK on <a href="tel:116123">116 123</a>. '+ref(1,'NHS urgent mental-health support')),
  sections:[
   section('notice','What is happening besides your weight?',
    p(`Depression can involve low mood or loss of interest, disturbed sleep, low energy and changes in appetite or weight. Some people eat less; others eat more. Persistent symptoms deserve assessment in their own right, not an assumption that a diet will fix them. ${ref(2,'NHS depression symptoms')}`)+
    p('Ask yourself about function: have you stopped seeing friends, stopped doing things you normally enjoy, or found work and everyday tasks harder? How long has that been happening? Those details give a GP more to work with than “I need to lose some timber”.')+
    p('You do not have to prove which came first. A useful conversation can address mood and physical health together, with separate plans where needed. Feeling ashamed is not evidence that you lack effort; it is something worth telling the person helping you.')),
   section('eating','When eating feels out of control',
    p(`Binge-eating disorder is not simply enjoying food or occasionally eating a large meal. A recurring sense of losing control, eating quickly or beyond comfortable fullness, secrecy and distress can be reasons to seek help. It can affect men and people at different body weights. ${ref(3,'NHS binge-eating disorder')}`)+
    p('Tell the GP about what happens and how it feels, rather than waiting until your body looks a particular way. Mention restriction, vomiting or other attempts to compensate as well. A weight-loss challenge or a more punishing food rule is not a substitute for assessment.')+
    p(`Treatment for binge-eating disorder commonly involves guided self-help or cognitive behavioural therapy. Ask for the appropriate eating-disorder route rather than assuming all difficulties belong in a standard weight-loss programme. ${ref(3,'NHS binge-eating treatment')}`)),
   section('medicines','Medication concerns belong in a review—not a sudden stop',
    p(`Some antidepressants can be associated with weight gain, but side effects vary. Do not abruptly stop or change a prescribed antidepressant because of the scales. Discuss benefits, concerns and alternatives with the prescriber; stopping usually needs a planned reduction. ${ref(4,'NHS antidepressants')}`)+
    p('Take the medicine name, when you started it, what changed and what improved. “My mood is better, but I am worried about my appetite and weight” is a perfectly reasonable reason for a review. So is “I am not getting enough benefit and the side effects are difficult.”')+
    p('Tell each treating professional about your other medicines, including weight-management treatment. Your medication list should not depend on different services guessing what the others prescribed.')),
   section('conversation','A starting script when you do not know what to say',
    '<blockquote>“For the last few weeks I have felt less like myself. My sleep, eating or energy has changed, and it is affecting my day. I would like help with the mood side as well as my physical health.”</blockquote>'+
    p('Add one concrete example: avoiding the football group, struggling through a shift, feeling out of control with food, or not enjoying time with your family. Write it down beforehand or bring someone you trust. You can ask about confidentiality and what happens next.')+
    p(`In England, adults can self-refer to NHS Talking Therapies for anxiety and depression; a diagnosis is not needed to make the enquiry. Local age arrangements vary, and a GP can help identify the right service. Specialist problems, including eating disorders, may need a different route. ${ref(5,'NHS Talking Therapies self-referral')}`)),
   section('this-week','Make this week less difficult—not more restrictive',
    p('Choose a small supportive step that does not depend on a weight target: tell one trusted person, book the appointment, keep a regular opportunity to eat, or make space for a manageable activity you normally value. These are ways to organise support, not treatments promised to resolve a condition.')+
    p('Tracking is optional. A brief note about sleep, mood and what was difficult may help a conversation. When weighing or logging food increases shame, distress or compulsive checking, discuss that with the professional supporting you rather than turning up the intensity.')+
    p('Ask for help sooner when symptoms persist or daily life is deteriorating. You do not have to wait for a crisis, and you do not have to solve the weight question first.')),
   section('get-help','Where to go next',
    ul([
     '<strong>Immediate danger or unable to stay safe:</strong> call 999 or go to A&E.',
     '<strong>Urgent mental-health support in England:</strong> NHS 111, mental-health option. Elsewhere in the UK, use your nation’s NHS urgent/crisis service or contact your GP for the local route.',
     '<strong>Someone to talk to across the UK:</strong> Samaritans, <a href="tel:116123">116 123</a>, free, day or night.',
     '<strong>Ongoing concerns:</strong> GP assessment, appropriate talking support or an eating-disorder service; ask how to get help while waiting.'
    ])+p(`${ref(1,'NHS urgent help and Samaritans')} <a href="/good-to-talk">SHIFT: Good to Talk</a> and <a href="/mental-health/getting-professional-help">getting professional help</a> explain the next conversation. My Timber’s optional personal notes are not monitored as a crisis service or a substitute for clinical care.`))
  ],
  faqs:[['Will losing weight cure low mood?','Do not treat weight loss as a cure or a requirement for receiving mental-health support. Persistent mood symptoms and eating difficulties deserve assessment regardless of weight.'],['Should I stop an antidepressant that affects my weight?','No sudden changes on your own. Ask the prescriber to review the benefits and adverse effects and agree any change or gradual reduction.'],['Do I need to be a particular size to ask about an eating disorder?','No. Describe the eating behaviours, loss of control or distress to your GP; a body size does not tell the whole story.']],
  sources:[source('NHS: where to get urgent help for mental health','https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/'),source('NHS: symptoms of depression in adults','https://www.nhs.uk/mental-health/conditions/depression-in-adults/symptoms/'),source('NHS: binge-eating disorder','https://www.nhs.uk/mental-health/conditions/binge-eating/overview/'),source('NHS: antidepressants','https://www.nhs.uk/medicines/antidepressants/'),source('NHS: find Talking Therapies for anxiety and depression','https://www.nhs.uk/nhs-services/mental-health-services/find-nhs-talking-therapies-for-anxiety-and-depression/')],
  change:'Expanded the short overview into practical support for mood, eating difficulties and medication concerns, with a GP conversation script and clearly separated urgent-help routes.'
 },
 [STATS]:{
  title:'Men’s weight and waist statistics in England: HSE 2024',
  description:'Nine measured weight, waist and obesity estimates from Health Survey for England 2024, with methods, a downloadable chart and CSV, and guidance on accurate reuse.',
  category:'SHIFT research library',
  lead:'Seven in ten men aged 16 and over in England were estimated to have overweight or obesity in Health Survey for England 2024. This is an England survey—not a combined UK estimate, not a measure of SHIFT members and not evidence of treatment results.',
  intro:p('This reference page compiles published NHS statistics so readers and journalists can check the numbers, definitions and limits. The survey year is 2024; NHS England published the report on 27 January 2026. SHIFT did not conduct the survey. '+ref(1,'NHS England HSE 2024 weight and obesity chapter')),
  sections:[
   section('what-the-data-says','The nine figures, with their units intact',
    '<figure><img src="'+STATS+'/chart.svg" width="1000" height="600" alt="England 2024: overweight including obesity, men 70%, women 62%; obesity, men 29%, women 31%; increased including high central adiposity, men 74%, women 66%. All values are also in the table."><figcaption>The bars are overlapping definitions. Obesity is included in overweight including obesity; waist-based central adiposity is another measure. Do not add them together.</figcaption></figure>'+
    table('HSE 2024: selected rounded estimates, adults aged 16 and over in England',['Indicator','Group','Estimate','HSE table'],DATA.rows.map(r=>[r.indicator,r.sex,String(r.value)+(r.unit==='percent'?'%':r.unit==='ratio'?'':' '+r.unit),r.tables]))+
    p(`Each number is retained in the original units. ${ref(1,'NHS England source chapter')} <a href="${STATS}/data.csv" download>Download the nine-row CSV</a> · <a href="${STATS}/chart.svg" download>Download the accessible SVG chart</a>. The downloadable extract was checked on 13 September 2026; this article and its interpretation were updated on 19 September 2026. The underlying values have not been changed.`)),
   section('interpretation','Three distinctions that change the story',
    p('<strong>“Overweight including obesity” is not the obesity rate.</strong> Men’s 70% includes the 29% living with obesity. Do not write that “70% of men are obese”. The reported obesity estimate is 29% for men and 31% for women, even though the combined overweight-or-obesity estimate is higher for men. '+ref(1,'BMI categories and sex-specific estimates'))+
    p('<strong>A percentage-point gap is not a relative percentage change.</strong> The difference between the rounded 70% and 62% estimates is eight percentage points. It is not evidence that prevalence rose by 8%, because these are two groups in the same survey, not two years. We have not tested the difference for statistical significance.')+
    p('<strong>An average waist is not an ideal waist.</strong> The men’s mean of 98.4 cm describes the measured sample estimate. It is not a personal health target, a trouser label or a threshold that makes someone safe below it. The same caution applies to the mean measured weight of 86.2 kg. '+ref(1,'Measured weight and waist estimates'))),
   section('why-waist-matters','BMI and waist answer different questions',
    p('The source defines overweight including obesity as BMI at least 25, obesity as BMI at least 30, and increased including high central adiposity as a waist-to-height ratio of at least 0.5. The waist-based estimate is not simply a second count of the same BMI category. '+ref(1,'HSE measure definitions'))+
    p('For personal health, the NHS explains using waist-to-height ratio alongside BMI when BMI is below 35. The calculation is waist divided by height in the same units. For example, 90 cm divided by 180 cm is 0.5. That arithmetic is an illustration—not a diagnosis or an individual treatment decision. '+ref(4,'NHS explanation of BMI and waist-to-height ratio'))+
    p('Use a personal measurement to start a health conversation, not to decide medication eligibility from a population average. A clinician can interpret your history and other risk factors.')),
   section('source','Methods: who was measured, and what is missing?',
    p('HSE covers people living in private households in England. The 2024 survey interviewed 9,220 adults; 4,966 adults had a health visit. Those are overall participation counts, not the denominator for every table cell. Fieldwork extended from January 2024 to March 2025. '+ref(2,'HSE introduction and participation'))+
    p('The figures are weighted estimates with sampling uncertainty. Use the original tables for sample bases and confidence intervals before making a statistical comparison. Weighting improves population representation but does not make a sample a census or remove every possible source of bias. The report’s quality statement explains coverage and response limitations. '+ref(2,'HSE methods')+' '+ref(3,'HSE data-quality statement'))+
    p('This page does not manufacture a UK total by combining England with Scotland, Wales and Northern Ireland. Their surveys can differ in year, population and measurement method. People outside private households are also outside this survey’s coverage. '+ref(3,'HSE geographic and population coverage'))+
    p('Take extra care with a trend chart: the 2021 BMI series used self-reported measurements and is not directly comparable with the usual measured series; no HSE survey ran in 2023. Do not fill that missing year with an invented value or treat the 2026 publication date as the year participants were measured. '+ref(2,'HSE comparability and survey timing'))),
   section('media','A claim a reader can actually verify',
    '<blockquote>Health Survey for England 2024 estimated that 70% of men aged 16 and over in England had overweight or obesity.</blockquote>'+
    p('That wording retains the survey, year, population, geography and combined definition. It avoids implying that SHIFT collected the data, that the percentage describes all UK men, or that a specific medicine changes the result.')+
    p('<strong>Suggested reference:</strong> NHS England, Health Survey for England 2024, Adults’ overweight and obesity, published 27 January 2026, tables 1–4 and 9. Selected figures compiled and charted by SHIFT Newsroom; interpretation updated 19 September 2026.')+
    p('Before publishing a headline, check the original table, keep the unit with the number, and distinguish a count, percentage, average and change over time. Our chart is a single-year comparison, not a forecast or an evaluation of a health programme.')+
    p('<a href="'+DATA.source+'">Open the source chapter</a> · <a href="'+DATA.source.replace('/adults-overweight-and-obesity','/health-survey-for-england-2024-data-tables')+'">Open the full data tables</a> · <a href="'+STATS+'/data.csv" download>Download CSV</a> · <a href="'+STATS+'/chart.svg" download>Download SVG</a>')),
   section('next-step','What this means for a reader—not just a headline',
    p('These figures make men’s weight and waist worth discussing without turning a whole population into a stereotype. They cannot tell why an individual gained weight, whether he is motivated, or which treatment would help him.')+
    p('For a personal starting point, <a href="/mens-weight-management">explore the weight-management guide</a> or <a href="/mental-health/mental-health-and-weight">read about mental health and weight</a>. For a factual correction, send the figure, page link and supporting source to <a href="mailto:hello@shiftsometimber.co.uk">hello@shiftsometimber.co.uk</a>; do not send personal medical records.'))
  ],
  faqs:[['Are these UK obesity statistics?','No. These figures describe adults aged 16 and over living in private households in England. The retained URL does not turn them into a UK-wide estimate.'],['Is 98.4 cm a healthy target waist for a man?','No. It is the survey’s mean measured waist circumference for men, not a personal target or a prescribing threshold.'],['Why does a 2024 survey have a 2026 publication date?','The survey year and publication date are different. The HSE 2024 report was published on 27 January 2026; fieldwork extended into March 2025.']],
  sources:[source('NHS England: HSE 2024, Adults’ overweight and obesity',DATA.source),source('NHS England: HSE 2024 introduction and methods',DATA.source.replace('/adults-overweight-and-obesity','/introduction')),source('NHS England: HSE 2024 data-quality statement',DATA.source.replace('/adults-overweight-and-obesity','/data-quality-statement')),source('NHS: overweight and obesity, BMI and waist-to-height ratio','https://www.nhs.uk/conditions/overweight-and-obesity/')],
  change:'Kept all nine source values and downloads; added claim-checking, percentage-point interpretation, survey limits and a clearer England-versus-UK distinction. No new survey or treatment-effect claim.'
 }
};
