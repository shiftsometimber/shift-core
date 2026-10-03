"""Prepare owner-requested newsroom corrections from captured public primary sources.
No production write; no AI knowledge/index changes; preserves original publication.
Paper coverage is authors' abstracts and metadata, not unaccessed full text.
"""
import json, pathlib, re, hashlib
ROOT=pathlib.Path('/private/tmp/shift-full-editorial-20261003')
STAMP='2026-10-03'
PAPER_EDITS={
'acquired-hypothalamic-obesity-treatment-lifestyle-interventions':(
'Hypothalamic obesity: review finds limited treatment evidence',
'A systematic review in Obesity examined seven randomised trials in acquired hypothalamic obesity. The authors judged most evidence about weight, body composition and metabolic outcomes to be of low certainty. Lifestyle interventions were poorly standardised, and lean body mass was inadequately assessed. This supports further research; it does not establish an effective lifestyle package or a treatment recommendation for an individual.'),
'digital-behavioral-infrastructure-glucagon-like-peptide-1-pharmacotherapy':(
'Digital support alongside GLP-1 treatment: a viewpoint, not proof',
'A viewpoint in the Journal of Medical Internet Research proposes that digital behavioural support could help during and after GLP-1 treatment. Its proposed opportunity for habit formation is a hypothesis requiring prospective and randomised testing. The paper draws partly on adjacent research and observational engagement data, which can be affected by selection bias. It does not demonstrate that SHIFT, or any particular digital companion, improves treatment persistence or prevents weight regain.'),
'dual-transporter-targeted-oral-semaglutide-nanomicelles':(
'Oral semaglutide delivery system studied in laboratory and mouse experiments',
'Researchers in the Journal of Controlled Release investigated an experimental nanomicelle delivery system using laboratory models and mice with diet-induced obesity. They reported improved absorption and metabolic outcomes under those experimental conditions. These are preclinical findings, not patient-trial results, and cannot establish an effective human dose, human safety or equivalence to an authorised semaglutide product.'),
'geographical-disparities-pediatric-obesity':(
'US insurance data show rural–urban differences in childhood obesity counselling',
'A Childhood Obesity study analysed US commercial insurance claims from 2017–2019 for children aged 2–17 with obesity. Recorded counselling use was lower among rural participants in several insurance-plan categories. This observational analysis concerns service use in that insurance system; it does not measure NHS access or establish that a particular service change would improve outcomes in the UK.'),
'glp-1-based-therapies-safety-risks':(
'GLP-1 safety-report study identifies signals, not rates of harm',
'A study in Diabetes, Obesity and Metabolism combined spontaneous adverse-event reports with regulatory and medicine-use information. It identified areas for safety surveillance, including gastrointestinal problems and medication-use errors. The authors explicitly state that these data do not estimate incidence, prove causation or compare population-level risk between medicines. Counts of reports must not be read as the chance of a side effect for a patient.'),
'glp-1-receptor-agonists-and-intraductal-papillary-mucinous-neoplasms':(
'Pancreatic cysts and GLP-1 use: a protocol for a safety study',
'A PLOS ONE protocol describes a retrospective study across three Swiss institutions examining GLP-1 exposure and progression of intraductal papillary mucinous neoplasms, a type of pancreatic cystic tumour. It concerns possible safety associations, not using GLP-1 medicines to treat these lesions. The protocol anticipates a small sample and cannot establish benefit, harm or causation before results are available.'),
'glp-1-receptor-agonists-gastroesophageal-reflux-disease':(
'Reflux reports and GLP-1 medicines: pharmacovigilance findings',
'A study in Gut and Liver examined reflux reporting signals in adverse-event databases from the US, Japan and Canada. Disproportionate reporting can identify a question for further investigation, but it does not measure how often reflux occurs among all users or prove that a medicine caused it. This study is not a source for UK licensing or NHS commissioning decisions.'),
'glp-1-receptor-agonists-in-dermatology':(
'GLP-1 medicines in dermatology: an ethical review',
'A review in Clinics in Dermatology discusses access, affordability, informed consent, product quality and prescribing responsibilities as GLP-1 medicines are explored in skin care. It is an ethical and evidence discussion, not a new trial demonstrating effectiveness for a skin condition. International prescribing and marketing examples should not be assumed to describe UK rules.'),
'glp-1-receptor-agonists-rotator-cuff-repair':(
'Rotator cuff repair: adjusted study finds no significant outcome difference',
'A retrospective study in Shoulder & Elbow examined adults with type 2 diabetes undergoing rotator cuff repair. After adjustment for measured differences between groups, preoperative GLP-1 use was not independently associated with increased or decreased postoperative complications. The observational design cannot settle causation or provide personal instructions about continuing or pausing medicine before surgery. Those instructions need to come from the treating team.'),
'glp-1-therapy-pregnancy-research-update':(
'GLP-1 use around pregnancy: a published letter',
'The cited item is a letter in Diabetes, Obesity and Metabolism about patterns of GLP-1-based therapy use before and after pregnancy. The bibliographic record reviewed for this audit provides no abstract. It therefore cannot support claims here about pregnancy safety, benefit or a change in prescribing. Reporting use around pregnancy is different from demonstrating that treatment during pregnancy is safe.'),
'glucagon-like-peptide-1-agonists-preoperative-weight-loss-total-joint-arthroplasty':(
'Joint replacement study reports weight change, without fewer postoperative complications',
'An observational study in Arthroplasty Today examined preoperative GLP-1 use among people having hip or knee replacement. Weight changes varied considerably. In adjusted analyses, GLP-1 use was not associated with fewer revisions, reoperations or complications. The study does not justify the earlier suggestion that it demonstrated improved postoperative outcomes. It also does not determine an individual patient’s perioperative medicine plan.'),
'glucagon-like-peptide-1-receptor-agonist-injections-side-effects':(
'Review examines skin and injection-site reactions to GLP-1 medicines',
'A review in Clinics in Dermatology discusses clinical studies, case reports and spontaneous reports of skin and injection-site reactions. Adverse-event database proportions describe the reports received, not the proportion of all treated patients who experience a reaction. They cannot by themselves establish that one medicine is safer than another.'),
'glucagon-like-peptide-1-receptor-agonists-lean-mass-reduction':(
'Lean mass during weight loss: a review proposes an interpretation',
'This review proposes that some measured lean-mass reduction may reflect adaptation to a lighter body. That is a conceptual explanation requiring testing, not a new trial proving muscle preservation. Lean mass, skeletal muscle, strength and physical function are different measures. The paper argues for assessing meaningful functional outcomes rather than interpreting a change in lean mass alone.'),
'glucagon-like-peptide-1-receptor-agonists-vagal-activity':(
'Danish cohort study finds no elevated risk of selected vagal-related events',
'A Danish register study compared people starting GLP-1 medicines with those starting SGLT2 inhibitors for type 2 diabetes, with additional analyses in obesity. It found no elevated risk of the selected outcomes, including fainting, fractures, slow heart rhythms and cardiac-device implantation. These are observational findings about specified outcomes, not proof that all possible risks have been excluded.'),
'orforglipron-weight-loss-maintenance':(
'Orforglipron after GLP-1 discontinuation: an editorial question',
'The cited item in Expert Review of Clinical Pharmacology is an editorial, not a new clinical trial. Its title asks whether oral orforglipron can maintain weight loss after GLP-1 treatment stops. The bibliographic record reviewed here has no abstract, so it does not support reporting a trial result or a switching recommendation.'),
'semaglutide-dosage-and-neuropsychiatric-events':(
'Semaglutide dose and mental-health outcomes: observational associations',
'An observational study in npj Metabolic Health and Disease found associations between higher attained semaglutide doses and fewer subsequent diagnoses in several neuropsychiatric categories. Participants were not randomly assigned to higher or lower doses for this comparison. Differences in health, treatment tolerance and other factors can affect the results. The findings do not prove that increasing a dose improves mental health and should not be used to alter a prescription.'),
'semaglutide-papillary-thyroid-carcinoma':(
'Semaglutide and papillary thyroid cancer: an unreviewed preprint',
'The cited source is a narrative-review preprint, not a peer-reviewed clinical guideline or a new patient trial. It discusses mixed evidence about papillary thyroid carcinoma and reports that current evidence does not establish semaglutide as a driver of its incidence or progression. Papillary and medullary thyroid cancers are different conditions. This preliminary synthesis cannot determine individual risk or replace current UK product information.'),
'semaglutide-prurigo-nodularis':(
'Prurigo nodularis improvement reported in one patient taking semaglutide',
'A case report describes improvement in prurigo nodularis after a man began semaglutide for obesity, without a change to his background skin treatment. An observation in one patient cannot establish that semaglutide caused the improvement, how often it might occur, or whether it is an effective treatment for this skin condition. It is a reason for research, not an established alternative therapy.'),
'semaglutide-research-females-may-be-resistant-to-muscle-loss':(
'Female mice retained muscle mass in a short semaglutide experiment',
'A study in Diabetes used leptin-deficient ob/ob mice to examine sex differences during three weeks of semaglutide treatment. Female mice retained muscle mass in this experiment, while male mice had relatively small losses; muscle force was maintained in both groups. These findings concern this mouse model. They do not show that women are protected from muscle loss during treatment.'),
'semaglutide-suicidality':(
'Semaglutide and suicidality: preprint reports inconclusive, low-certainty estimates',
'This Bayesian meta-analysis is a preprint and has not been peer reviewed in the version cited. Events were rare, estimates were imprecise, and the authors rated certainty as very low for every outcome. The analysis did not provide conclusive evidence of either increased or decreased suicidality. Its numerical estimates should not be presented as proof that semaglutide causes or prevents suicide.'),
'sleeve-gastrectomy-vs-tirzepatide-ckd-survival':(
'Surgery and tirzepatide in advanced kidney disease: a simulation study',
'An American Journal of Surgery paper used a Markov model to project survival under different weight-management strategies for people with stage 5 chronic kidney disease. Its outcomes are simulated, not observed survival results from a head-to-head patient trial. The projections depend on assumptions, including starting BMI and sustained weight loss. They cannot identify the best treatment for an individual.'),
'tirzepatide-atrial-fibrillation':(
'Tirzepatide and heart rhythm: rare-event analysis needs cautious interpretation',
'A meta-analysis in the Journal of the American Heart Association did not find a clear association with atrial fibrillation or atrial arrhythmia; the uncertainty intervals included no difference. A broader outcome covering any arrhythmia showed higher odds, but events were uncommon and estimates require caution. These distinct outcomes should not be merged into a claim that tirzepatide causes atrial fibrillation or that all rhythm risks have been excluded.'),
'tirzepatide-semaglutide-class-2-obesity':(
'Response after switching medicines reported in one patient',
'A JCEM Case Reports article describes one man who lost more weight after switching from tirzepatide to semaglutide. This is a single-patient observation, not a comparative trial or evidence for a general switching rule. The proposed biological explanations remain hypotheses. Treatment response and any change of medicine require an individual prescriber review.'),
'tirzepatide-unilateral-graves-disease':(
'Graves’ disease during tirzepatide treatment: a case report',
'A case report describes unilateral Graves’ disease developing in a woman receiving tirzepatide. The authors explicitly state that a causal relationship cannot be established. The sequence of events does not make this a confirmed side effect or establish its frequency. The report highlights the need to assess symptoms rather than automatically attribute them to an existing medicine.'),
'tirzepatide-weight-loss-mechanism':(
'Tirzepatide and brown fat: a mouse-study preprint',
'An unreviewed preprint proposes a brain–brown-fat pathway contributing to tirzepatide-related weight loss in mice. The experiments suggest an additional mechanism alongside appetite suppression; they do not establish that appetite suppression is irrelevant. These animal findings do not prove the same mechanism or contribution in humans and do not change prescribing advice.'),
'tirzepatide-research-update':(
'Tirzepatide and blood-cell biology: an animal-study preprint',
'This preprint compares blood-cell and bone-marrow changes in mice losing weight through tirzepatide or matched calorie restriction. It has not been peer reviewed in the cited version. The findings concern experimental cell biology in mice, not demonstrated protection from disease in people or a clinical treatment recommendation.'),
'ubt251-injection-phase-1a-1b-trials':(
'UBT251: early human study results published',
'The cited paper reports results from randomised, placebo-controlled phase 1a and 1b studies of UBT251, rather than announcing that those studies are only beginning. It examines safety, tolerability, drug exposure and early metabolic outcomes; repeated treatment lasted twelve weeks in the phase 1b study. Early results cannot establish long-term safety, comparative effectiveness or UK access.'),
'virtual-glp-1-programme-weight-loss':(
'Virtual GLP-1 support: a short, non-randomised evaluation',
'A twelve-week quasi-experimental study compared a virtual programme with physical-activity coaching against usual care. The authors reported greater weight loss and changes in body-composition percentages in the programme group. Allocation was not randomised and body composition was measured using home impedance scales. A higher muscle percentage is not proof that absolute muscle mass increased. The study does not evaluate SHIFT or establish long-term effectiveness.'),
'weight-loss-and-bone-health-in-people-with-obesity-and-type-1-diabetes':(
'Body composition and bone measures in a small type 1 diabetes cohort',
'An observational study followed seventy people with obesity and type 1 diabetes receiving liraglutide, semaglutide or tirzepatide over twelve months. Weight, fat mass and lean mass declined; total bone mineral density did not significantly change. This small observational cohort cannot establish comparative medicine effects or long-term fracture safety. It is not a reason to replace insulin or change diabetes treatment without the specialist team.')
}
TRIAL_PURPOSE={
'NCT03811561':'semaglutide and diabetic eye disease',
'NCT04822181':'semaglutide in steatohepatitis',
'NCT05202353':'BI 456906 versus semaglutide receptor activity',
'NCT05567796':'CagriSema weight management and follow-up',
'NCT05819853':'semaglutide and ovulation in PCOS',
'NCT06143956':'the LY900038 adult weight-management master protocol',
'NCT06299098':'trevogrumab and garetosmab with semaglutide',
'NCT06534411':'CagriSema versus tirzepatide in type 2 diabetes',
'NCT06672549':'the LY900040 paediatric weight-management master protocol',
'NCT06672939':'orforglipron in adolescents',
'NCT06716307':'blood levels after two CagriSema formulations',
'NCT06719011':'NNC0174-1213 in overweight or obesity',
'NCT06803888':'bariatric surgery versus medicine treatment',
'NCT06836284':'additional support in the Evira study',
'NCT06847399':'tirzepatide for binge-eating disorder',
'NCT06934655':'semaglutide after sleeve gastrectomy in young people',
'NCT06965413':'RO7204239 combined with tirzepatide',
'NCT06981936':'nutritional supplements during GLP-1 treatment',
'NCT07010432':'cagrilintide and bone metabolism',
'NCT07065552':'tirzepatide in obesity-related endometrial cancer',
'NCT07154719':'GLP-1 receptor actions on muscle and bone',
'NCT07223983':'semaglutide for alcohol-use disorder after bariatric surgery',
'NCT07284979':'ribupatide compared with semaglutide and placebo',
'NCT07349641':'tirzepatide with a progestin IUD in endometrial disease',
'NCT07446998':'enobosarm alongside GLP-1 treatment',
'NCT07554638':'incretin therapies in obesity-related HFpEF',
'NCT07564414':'CagriSema doses compared with semaglutide',
'NCT07605052':'blood levels after two cagrilintide formulations',
'NCT07724340':'AT673 combined with semaglutide',
'NCT07745504':'two cagrilintide formulations compared with placebo',
'NCT07760948':'HMB and vitamin D during semaglutide treatment',
'NCT07770841':'oral semaglutide for weight management',
'NCT07782359':'GLP-1 treatment during lorlatinib therapy',
'NCT07793019':'IBI3042 in healthy participants and people with excess weight',
'NCT07794579':'orforglipron and prevention of obesity-related complications',
'NCT07811895':'a dual GIP/GLP-1 medicine before frozen embryo transfer',
'NCT07812597':'switching from semaglutide to zovaglutide',
'NCT07812636':'tirzepatide with a levonorgestrel IUD in endometrial disease'
}
EXTRA={
'NCT05202353':'This phase 1 study measures receptor activity using imaging. It should not be presented as a weight-loss efficacy comparison.',
'NCT05567796':'The record separates the main study from an off-treatment extension. The recorded primary-completion date is 30 October 2024; an active extension does not mean that main-study results are still unavailable.',
'NCT06299098':'The protocol has separate parts involving healthy participants and participants with obesity. A single overall status does not describe every part of the study.',
'NCT06716307':'This phase 1 crossover study compares drug concentrations in blood. Pharmacokinetic comparisons are not proof of clinical weight-loss effectiveness.',
'NCT07605052':'This phase 1 study compares drug concentrations in blood after different formulations. It is not a trial establishing a weight-loss advantage.',
'NCT06803888':'The protocol compares a combined bariatric-surgery group with medicine treatment. It is not designed to establish which of gastric bypass and sleeve gastrectomy is better, or to compare the two medicines directly.',
'NCT06143956':'This is a screening and study framework with separate intervention-specific appendices, not a result for a single medicine.',
'NCT06672549':'This is a master-protocol framework with separate intervention-specific studies. It must not be treated as one completed treatment comparison.',
'NCT06847399':'The research question concerns binge-eating disorder. A trial in this indication does not erase the medicine’s existing product information or establish a new authorised use.',
'NCT07554638':'This registration cannot support a blanket claim that all evidence about incretin therapies in HFpEF is unknown. Its own findings need to be distinguished from results of other trials.',
'NCT07770841':'This is a specific trial record. It does not by itself determine the licensing or availability of other oral semaglutide products.'
}
def main():
 papers=json.loads((ROOT/'paper-source-audit.json').read_text())
 trials=json.loads((ROOT/'trial-source-audit.json').read_text())
 drafts=[]; metadata=[]
 for p in papers:
  assert len(p['records'])==1
  r=p['records'][0]; slug=p['url'].rsplit('/',1)[-1]
  metadata.append({'url':p['url'],'source_url':p['source'],'journal':(r.get('journalInfo') or {}).get('journal',{}).get('title'),'publication_types':r.get('pubTypeList',{}).get('pubType',[]),'first_publication_date':r.get('firstPublicationDate'),'checked_at':STAMP,'review_scope':'Bibliographic metadata and author abstract; full text not claimed'})
  if slug in PAPER_EDITS:
   headline,body=PAPER_EDITS[slug]
   drafts.append({'slug':slug,'headline':headline,'article_markdown':body,'standfirst':body.split('. ')[0]+'.','shift_take':'Read the study design and limits alongside the finding. This article does not determine individual treatment suitability.','source_url':p['source'],'checked_at':STAMP,'reason':'Correct evidence type, interpretation or unsupported implication','status':'prepared_not_published'})
 assert len([d for d in drafts if d['slug'] in PAPER_EDITS])==len(PAPER_EDITS)
 for t in trials:
  id=t['id'];s=t['status'];status=s['overallStatus'].lower().replace('_',' ')
  latest=s['lastUpdatePostDateStruct']['date'];first=s['studyFirstPostDateStruct']['date']
  sentence=f'ClinicalTrials.gov lists {id}, concerning {TRIAL_PURPOSE[id]}, as {status}. The record was first posted on {first} and last updated on {latest}; SHIFT checked it on 3 October 2026.'
  if s['overallStatus']=='COMPLETED':sentence+=f" The recorded study-completion date is {s['completionDateStruct']['date']}."
  if s['overallStatus']=='NOT_YET_RECRUITING':sentence+=' It should not be described as already enrolling or treating participants.'
  if s['overallStatus']=='ACTIVE_NOT_RECRUITING':sentence+=' This means the study remains active but is not currently enrolling new participants.'
  body=sentence+'\n\n'+EXTRA.get(id,'The registration describes a research question and protocol, not proof that the intervention is effective or suitable for an individual.')
  body+='\n\nNo results tables were posted in this registry record when checked. That does not establish that no results have been published elsewhere. A registry entry is not a UK marketing authorisation or confirmation of NHS access.'
  for url in t['urls']:
   drafts.append({'slug':url.rsplit('/',1)[-1],'headline':f'Trial record: {TRIAL_PURPOSE[id]}','standfirst':f'Registry status checked on 3 October 2026: {status}.','article_markdown':body,'shift_take':'Keep the trial status, published results and UK treatment access separate. Do not change treatment on the basis of a registration.','source_url':'https://clinicaltrials.gov/study/'+id,'checked_at':STAMP,'reason':'Replace stale trial tense and separate registration from clinical findings','status':'prepared_not_published'})
 output={'checked_at':STAMP,'publication_status':'BLOCKED: Cloudflare authentication error 10000; zero writes attempted after read authentication failed','clinical_certification':False,'ai_index_changes':False,'original_publication_dates_must_be_preserved':True,'require_fresh_D1_snapshot_and_exact_old_value_guard':True,'drafts':drafts,'paper_metadata':metadata}
 assert len({x['slug'] for x in drafts})==len(drafts)
 (ROOT/'newsroom-source-corrections-candidate.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'prepared_corrections':len(drafts),'paper_metadata_records':len(metadata),'production_writes':0}))
if __name__=='__main__':main()
