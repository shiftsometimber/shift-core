import evidenceDesk from './reviews/2026-10-03-evidence-desk-zp6590.json' with {type:'json'};
import srsd384Publication from './reviews/2026-10-04-authorised-srsd384.json' with {type:'json'};
import fractylModalityGap from './reviews/2026-10-04-authorised-fractyl-modality-gap.json' with {type:'json'};
import arteloMuscleGap from './reviews/2026-10-04-authorised-art2713-muscle-gap.json' with {type:'json'};
import rgt075Publication from './reviews/2026-10-04-authorised-rgt075.json' with {type:'json'};
import vct220Publication from './reviews/2026-10-04-authorised-vct220.json' with {type:'json'};
import vk2735Maintenance from './reviews/2026-10-04-authorised-vk2735-maintenance.json' with {type:'json'};
import survodutidePaper from './reviews/2026-10-04-authorised-survodutide-paper.json' with {type:'json'};
import evening from './reviews/2026-10-01-authorised-evening-updates.json' with {type:'json'};
import broaderDiscovery from './reviews/2026-10-01-authorised-broader-discovery.json' with {type:'json'};
import synt101Correction from './reviews/2026-10-01-synt101-mad-correction.json' with {type:'json'};
import biPublication from './reviews/2026-09-30-authorised-bi3034701.json' with {type:'json'};
// Factual industry evidence summaries. No entry represents clinical approval.
// The associated source reviews and retrieval limitations are in the dated receipt.
import evidence from './reviews/2026-09-29-industry-expansion.json' with {type:'json'};
import followup from './reviews/2026-09-30-reviewed-expansion.json' with {type:'json'};
import continuing from './reviews/2026-09-30-authorised-continuing-discovery.json' with {type:'json'};
import repairs from './reviews/2026-09-30-source-warning-repairs.json' with {type:'json'};
import accessRepair from './reviews/2026-09-30-globenewswire-access-repair.json' with {type:'json'};
import berobenatide from './reviews/2026-09-30-berobenatide-vesper6.json' with {type:'json'};
import eloraTZP from './reviews/2026-10-01-eloratzp-phase2b.json' with {type:'json'};
import kainetic from './reviews/2026-10-01-kainetic-enrolment.json' with {type:'json'};
import macupatide from './reviews/2026-10-01-macupatide-discovery.json' with {type:'json'};
import internationalOmissions from './reviews/2026-10-02-authorised-international-omissions.json' with {type:'json'};
import expandedDiscovery from './reviews/2026-10-02-authorised-expanded-discovery.json' with {type:'json'};
import ubt251Publication from './reviews/2026-10-02-authorised-ubt251.json' with {type:'json'};
import sgb7342Publication from './reviews/2026-10-02-authorised-sgb7342.json' with {type:'json'};
import abbvAsc30TernBimagrumab from './reviews/2026-10-02-authorised-abbv-asc30-tern-bimagrumab.json' with {type:'json'};
import monitorRepairs from './reviews/2026-10-02-source-monitor-repairs.json' with {type:'json'};
import pfizerPdfRepair from './reviews/2026-10-02-pfizer-pdf-monitor-repair.json' with {type:'json'};
import registryOmissions from './reviews/2026-10-02-authorised-registry-omissions.json' with {type:'json'};
import enobosarmSemaglutide from './reviews/2026-10-02-authorised-enobosarm-semaglutide.json' with {type:'json'};
import expandedRegistryWave from './reviews/2026-10-02-authorised-expanded-registry-wave.json' with {type:'json'};
import semaglutideSpecialistTrials from './reviews/2026-10-02-authorised-semaglutide-specialist-trials.json' with {type:'json'};
import glimrCopd from './reviews/2026-10-02-authorised-glimr-copd.json' with {type:'json'};
import specialistRegistryFollowup from './reviews/2026-10-02-authorised-specialist-registry-followup.json' with {type:'json'};
import switchingStudies from './reviews/2026-10-02-authorised-switching-studies.json' with {type:'json'};
import na931Publication from './reviews/2026-10-02-authorised-na931.json' with {type:'json'};
import amylinMetabolicFollowup from './reviews/2026-10-03-authorised-amylin-metabolic-followup.json' with {type:'json'};
import azd1043Publication from './reviews/2026-10-03-authorised-azd1043.json' with {type:'json'};
import seleneCorrection from './reviews/2026-10-03-authorised-azd6234-selene.json' with {type:'json'};
import wve007Publication from './reviews/2026-10-03-authorised-wve007.json' with {type:'json'};
import specialistRegistryWave from './reviews/2026-10-03-authorised-specialist-registry-wave.json' with {type:'json'};
import leanMassEnergyFollowup from './reviews/2026-10-03-authorised-lean-mass-energy-followup.json' with {type:'json'};
import vikingAntagFollowup from './reviews/2026-10-03-authorised-vk3019-at673.json' with {type:'json'};
export const INDUSTRY_REVIEWED_AT = evidence.reviewedAt;
export const industrySources = [...evidence.sources,...followup.sources,...continuing.sources,...berobenatide.sources,kainetic.source,...evidenceDesk.sources,...vk2735Maintenance.sources].map(s => s.id===continuing.sourceReplacement.id?continuing.sourceReplacement:s).map(s => repairs.sources.find(r=>r.id===s.id)||s).map(s => accessRepair.sources.find(r=>r.id===s.id)||s).map(s => s.id===eloraTZP.source.id?eloraTZP.source:s).map(s => monitorRepairs.sources.find(r=>r.id===s.id)||s).map(s => pfizerPdfRepair.sources.find(r=>r.id===s.id)||s).map(s => ({
 id:s.id,title:s.title,url:s.url,checkUrl:s.checkUrl,format:s.format,
 sourcePublishedAt:s.sourcePublishedAt,sourceDateLabel:s.sourceDateLabel||(s.id.endsWith('-smpc')?'Product information updated':'Source publication date'),
 reviewedAt:s.reviewedAt,requiredTerms:s.requiredTerms,
 ...(s.reviewedFingerprint?{reviewedFingerprint:s.reviewedFingerprint}:{}),
 evidenceType:s.evidenceType,
 ...(s.contentSelector?{contentSelector:s.contentSelector}:{}),
 ...(s.articleId?{articleId:s.articleId,articleDoi:s.articleDoi}:{}),
}));
const researchAccess = {
 ukAuthorisation:'The cited research evidence does not establish UK marketing authorisation for this programme.',
 nhsEngland:'No NHS access is established by these research sources.',
 supply:'Trial development is not evidence of lawful UK retail supply or pharmacy stock.',
};
const entry=(id,name,group,stage,summary,sourceIds,extra={})=>({id,name,group,stage,summary,sourceIds,
 reviewedAt:INDUSTRY_REVIEWED_AT,clinicalApproval:null,
 ...(group==='established'?{}:researchAccess),
 limitations:'A dated source summary, not a prescribing guide, efficacy ranking or prediction of approval.',...extra});
const originalIndustry = [
 entry('liraglutide','Saxenda / liraglutide','established','UK product information and NICE guidance',
 'Daily injectable GLP-1 treatment. The UK product information includes adult weight management with dietary changes and physical activity.',
 ['saxenda-smpc','liraglutide-nice'],{
 ukAuthorisation:'UK product information includes adults with obesity, or overweight with a weight-related condition; the licence is broader than NICE access.',
 nhsEngland:'TA664 recommends only a defined group: raised BMI, non-diabetic hyperglycaemia, high cardiovascular risk, specialist tier 3 care and the commercial arrangement. See the full criteria.',
 supply:'Prescription assessment is required. Current private availability and individual stock have not been verified here.',
 limitations:'Digestive adverse effects and treatment-response stopping rules matter; see the complete product information.'}),
 entry('naltrexone-bupropion','Mysimba / naltrexone–bupropion','established','UK product information; NICE does not recommend routine use',
 'Oral combination authorised for adult weight management within specified BMI and comorbidity criteria.',
 ['mysimba-smpc','mysimba-nice'],{
 ukAuthorisation:'The UK product information includes adult weight management alongside diet and activity.',
 nhsEngland:'TA494 does not recommend it within its marketing authorisation for weight management. Existing NHS treatment has a continuation provision.',
 supply:'A marketing authorisation does not confirm private supply or stock; these have not been verified here.',
 limitations:'Contraindications, medicine interactions and regular reassessment are important; this is not a suitability assessment.'}),
 entry('setmelanotide','Imcivree / setmelanotide','established','Specialist treatment for specified rare forms of obesity',
 'A specialist medicine whose UK indications include specified genetic forms and acquired hypothalamic obesity. This is not a general obesity option.',
 ['imcivree-smpc','setmelanotide-hst21','setmelanotide-hst31'],{
 ukAuthorisation:'The August 2026 UK product information includes acquired hypothalamic obesity from age 4 and specified genetic indications from age 2; indication-specific criteria apply.',
 nhsEngland:'HST21 covers POMC/PCSK1 or LEPR deficiency from age 6 under its conditions. HST31 covers genetically confirmed BBS when treatment starts at ages 6–17, with adult continuation. Neither guidance establishes access across the full current licence.',
 supply:'Specialist prescribing and service access are required. Individual supply is not tracked.',
 limitations:'Licensing ages and NICE funding criteria differ. NHS access for acquired hypothalamic obesity and other extensions requires separate review.'}),
 entry('cagrisema','CagriSema','research','Phase 3 results; investigational',
 'Novo reported REIMAGINE 5 and REDEFINE 9 results on 21 September 2026 for cagrilintide plus semaglutide. A US application is not a UK approval.', ['cagrisema-novo']),
 entry('cagrilintide','Cagrilintide monotherapy','research','Phase 3 RENEW programme reported',
 'Novo’s annual-report narrative describes cagrilintide being developed on its own, separately from CagriSema.', ['novo-pipeline-2025'],{limitations:'The annual report is a dated sponsor account. Verify later programme changes; combination results cannot be assigned to monotherapy.'}),
 entry('zenagamtide','Zenagamtide / amycretin','research','Phase 3 weight-management development reported',
 'Novo describes a single molecule targeting GLP-1 and amylin receptors. Its annual report describes weight-management Phase 3 development in early 2026.', ['novo-pipeline-2025'],{limitations:'Oral and injectable development must be checked separately; this does not assign the same trial phase to every formulation or indication.'}),
 entry('maritide','MariTide / maridebart cafraglutide','research','Phase 3 MARITIME programme',
 'Amgen’s Q2 2026 update reports ongoing MARITIME weight-management studies, with separate studies for associated conditions.', ['amgen-q2-2026']),
 entry('survodutide','Survodutide','research','Phase 3 SYNCHRONIZE programme',
 'Zealand’s programme page describes Boehringer’s obesity studies and separate MASH development. Regulatory fast-track designations are not approvals.', ['survodutide-zealand']),
 entry('vk2735','VK2735','research','Injectable Phase 3; oral Phase 3 planned in the cited update',
 'Viking’s 29 July update says injectable VANQUISH-1/2 are fully enrolled. It targets oral Phase 3 initiation for Q4 2026; that plan is not treated as completed.', ['vk2735-viking']),
 entry('petrelintide','Petrelintide','research','Phase 3 ZUPREME initiated',
 'Zealand announced Phase 3 initiation on 22 September 2026 with Roche. This newer announcement supersedes the Phase 2 emphasis on its older pipeline page.', ['petrelintide-zealand']),
 entry('eloralintide','Eloralintide','research','Phase 3 trials ongoing in sponsor update',
 'Lilly’s 15 September announcement describes ongoing Phase 3 monotherapy trials. The eloralintide–tirzepatide combination is a separate programme.', ['eloralintide-lilly']),
 entry('aleniglipron','Aleniglipron / GSBR-1290','research','Phase 3 ACCOMPLISH ongoing',
 'Structure’s 8 September update confirms Phase 3 ACCOMPLISH studies of its oral GLP-1 candidate. Earlier Phase 2 reports no longer describe the full development stage.', ['structure-sep2026']),
 entry('accg2671','ACCG-2671','research','Phase 1b/2a clinical programme',
 'Structure describes an investigational oral small-molecule amylin/calcitonin receptor agonist. Early clinical development is distinct from late-stage treatment evidence.', ['structure-sep2026']),
 entry('pf3944','PF-3944 / PF-08653944 / MET-097i','research','Phase 3 VESPER-4 initiation reported',
 'Pfizer’s 3 February update reports VESPER-4 initiation and plans for other studies. Weekly and monthly regimens must not be treated as interchangeable.', ['pf3944-pfizer'],{limitations:'This entry records the dated Phase 3 initiation, not completion of every planned 2026 study. Later data and naming changes need continued discovery.'}),
 entry('enicepatide','Enicepatide / CT-388','research','Phase 3 ENITH-1/2 initiation reported',
 'Roche’s 23 April presentation reports ENITH-1/2 initiation; its June announcement describes an investigational GLP-1/GIP candidate.', ['enicepatide-roche'],{additionalEvidence:[{title:'Roche Q1 2026 presentation, page 33',url:'https://assets.roche.com/f/176343/x/75c58a5152/irp260423.pdf',sourcePublishedAt:'2026-04-23',reviewedAt:INDUSTRY_REVIEWED_AT,checkScope:'PDF read for trial-stage evidence; not automatically content-monitored.'}]}),
 entry('danuglipron','Danuglipron','discontinued','Development discontinued',
 'Pfizer announced discontinuation on 14 April 2025. It should not remain on a list of advancing treatment candidates.', ['danuglipron-pfizer']),
 entry('dapiglutide','Dapiglutide','paused','Development paused',
 'Zealand’s programme page says development was paused following Phase 1b work as part of portfolio management. Paused is not the same as permanently discontinued.', ['dapiglutide-zealand']),
 entry('amg513','AMG 513','discontinued','Future development discontinued',
 'Amgen’s Q2 2026 update says future development will stop while the existing Phase 1 study follows enrolled participants through completion.', ['amgen-q2-2026']),
];

// Preserve historical source dates; only the affected entry receives the newer review.
export const industry = [...originalIndustry.map(e => {
 const update=followup.updates.find(u=>u.id===e.id);
 return update ? {...e,...update.fields,reviewedAt:followup.reviewedAt,sourceIds:[...e.sourceIds,...update.sourceIdsToAdd]} : e;
}),...followup.entries,...continuing.entries,...biPublication.entries,...macupatide.entries,...evening.entries,...broaderDiscovery.entries,...internationalOmissions.entries,...expandedDiscovery.entries,...ubt251Publication.entries,...sgb7342Publication.entries,...abbvAsc30TernBimagrumab.entries,...registryOmissions.entries,...enobosarmSemaglutide.entries,...expandedRegistryWave.entries,...semaglutideSpecialistTrials.entries,...glimrCopd.entries,...specialistRegistryFollowup.entries,...na931Publication.entries]
 .concat(amylinMetabolicFollowup.entries,azd1043Publication.entries,wve007Publication.entries,specialistRegistryWave.entries,leanMassEnergyFollowup.entries,vikingAntagFollowup.entries,evidenceDesk.entries,srsd384Publication.entries,fractylModalityGap.entries,arteloMuscleGap.entries,rgt075Publication.entries,vct220Publication.entries)
 .map(e=>{const update=repairs.updates.find(u=>u.id===e.id);return update?{...e,...update,reviewedAt:repairs.reviewedAt}:e;})
 .map(e=>e.id===berobenatide.change.id?{...e,...berobenatide.change.fields,reviewedAt:berobenatide.reviewedAt,
  sourceIds:[...e.sourceIds,...berobenatide.change.sourceIdsToAdd],additionalEvidence:berobenatide.change.additionalEvidence}:e)
 .map(e=>e.id===eloraTZP.change.id?{...e,...eloraTZP.change.fields,reviewedAt:eloraTZP.reviewedAt,
  additionalEvidence:[...(e.additionalEvidence||[]),...eloraTZP.change.additionalEvidence]}:e)
 .map(e=>e.id===kainetic.change.id?{...e,...kainetic.change.fields,reviewedAt:kainetic.reviewedAt,
  sourceIds:[...e.sourceIds,...kainetic.change.sourceIdsToAdd]}:e)
 .map(e=>{
  const change=evening.changes.find(c=>c.id===e.id);
  if(!change)return e;
  const {summaryToAppend,...fields}=change.fields;
  return {...e,...fields,...(summaryToAppend?{summary:e.summary+' '+summaryToAppend}:{}),reviewedAt:evening.reviewedAt,
   additionalEvidence:[...(e.additionalEvidence||[]),...change.additionalEvidence]};
 })
 .map(e=>e.id===synt101Correction.change.id?{...e,...synt101Correction.change.fields,reviewedAt:synt101Correction.reviewedAt,
  additionalEvidence:[...(e.additionalEvidence||[]),...synt101Correction.change.additionalEvidence]}:e)
 .map(e=>{
  const change=expandedRegistryWave.changes.find(c=>c.id===e.id);
  if(!change)return e;
  const {summaryToAppend,limitationsToAppend,...fields}=change.fields;
  return {...e,...fields,
   ...(summaryToAppend?{summary:e.summary+' '+summaryToAppend}:{}),
   ...(limitationsToAppend?{limitations:e.limitations+' '+limitationsToAppend}:{}),
   reviewedAt:expandedRegistryWave.reviewedAt,
   additionalEvidence:[...(e.additionalEvidence||[]),...change.additionalEvidence]};
 })
 .map(e=>{
  const change=specialistRegistryFollowup.changes.find(c=>c.id===e.id);
  if(!change)return e;
  const {summaryToAppend,limitationsToAppend,...fields}=change.fields;
  return {...e,...fields,
   ...(summaryToAppend?{summary:e.summary+' '+summaryToAppend}:{}),
   ...(limitationsToAppend?{limitations:e.limitations+' '+limitationsToAppend}:{}),
   reviewedAt:specialistRegistryFollowup.reviewedAt,
   additionalEvidence:[...(e.additionalEvidence||[]),...change.additionalEvidence]};
 })
 .map(e=>{
  const change=switchingStudies.changes.find(c=>c.id===e.id);
  if(!change)return e;
  const {summaryToAppend,limitationsToAppend,...fields}=change.fields;
  return {...e,...fields,
   ...(summaryToAppend?{summary:e.summary+' '+summaryToAppend}:{}),
   ...(limitationsToAppend?{limitations:e.limitations+' '+limitationsToAppend}:{}),
   reviewedAt:switchingStudies.reviewedAt,
   additionalEvidence:[...(e.additionalEvidence||[]),...change.additionalEvidence]};
 })
 .map(e=>{
  const change=amylinMetabolicFollowup.changes.find(c=>c.id===e.id);
  return change?{...e,...change.fields,reviewedAt:amylinMetabolicFollowup.reviewedAt,
   additionalEvidence:[...(e.additionalEvidence||[]),...change.additionalEvidence]}:e;
 })
 .map(e=>e.id===seleneCorrection.change.id?{...e,...seleneCorrection.change.fields,
  reviewedAt:seleneCorrection.reviewedAt,
  additionalEvidence:[...(e.additionalEvidence||[]),...seleneCorrection.change.additionalEvidence]}:e)
 .map(e=>{
  const change=specialistRegistryWave.changes.find(c=>c.id===e.id);
  if(!change)return e;
  const {summaryToAppend,limitationsToAppend,...fields}=change.fields;
  return {...e,...fields,
   ...(summaryToAppend?{summary:e.summary+' '+summaryToAppend}:{}),
   ...(limitationsToAppend?{limitations:e.limitations+' '+limitationsToAppend}:{}),
   reviewedAt:specialistRegistryWave.reviewedAt,
   additionalEvidence:[...(e.additionalEvidence||[]),...change.additionalEvidence]};
 })
 .map(e=>{
  const change=leanMassEnergyFollowup.changes.find(c=>c.id===e.id);
  if(!change)return e;
  const {summaryToAppend,limitationsToAppend,...fields}=change.fields;
  return {...e,...fields,
   ...(summaryToAppend?{summary:e.summary+' '+summaryToAppend}:{}),
   ...(limitationsToAppend?{limitations:e.limitations+' '+limitationsToAppend}:{}),
   reviewedAt:leanMassEnergyFollowup.reviewedAt,
   additionalEvidence:[...(e.additionalEvidence||[]),...change.additionalEvidence]};
 })
 .map(e=>{
  const change=vk2735Maintenance.changes.find(c=>c.id===e.id);
  return change?{...e,...change.fields,reviewedAt:vk2735Maintenance.reviewedAt,
   sourceIds:[...e.sourceIds,...change.sourceIdsToAdd],
   additionalEvidence:[...(e.additionalEvidence||[]),...change.additionalEvidence]}:e;
 })
 .map(e=>{
  const change=survodutidePaper.changes.find(c=>c.id===e.id);
  if(!change)return e;
  const {summaryToAppend,limitationsTextToReplace,limitationsReplacement,limitationsToAppend,...fields}=change.fields;
  return {...e,...fields,
   ...(summaryToAppend?{summary:e.summary+' '+summaryToAppend}:{}),
   ...(limitationsTextToReplace&&limitationsReplacement?{limitations:e.limitations.replace(limitationsTextToReplace,limitationsReplacement)+(limitationsToAppend?' '+limitationsToAppend:'')}:(limitationsToAppend?{limitations:e.limitations+' '+limitationsToAppend}:{})),
   reviewedAt:survodutidePaper.reviewedAt,
   additionalEvidence:[...(e.additionalEvidence||[]),...change.additionalEvidence]};
 });
