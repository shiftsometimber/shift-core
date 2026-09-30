// Factual industry evidence summaries. No entry represents clinical approval.
// The associated source reviews and retrieval limitations are in the dated receipt.
import evidence from './reviews/2026-09-29-industry-expansion.json' with {type:'json'};
import followup from './reviews/2026-09-30-reviewed-expansion.json' with {type:'json'};
import continuing from './reviews/2026-09-30-authorised-continuing-discovery.json' with {type:'json'};
export const INDUSTRY_REVIEWED_AT = evidence.reviewedAt;
export const industrySources = [...evidence.sources,...followup.sources,...continuing.sources].map(s => s.id===continuing.sourceReplacement.id?continuing.sourceReplacement:s).map(s => ({
 id:s.id,title:s.title,url:s.url,checkUrl:s.checkUrl,format:s.format,
 sourcePublishedAt:s.sourcePublishedAt,sourceDateLabel:s.id.endsWith('-smpc')?'Product information updated':'Source publication date',
 reviewedAt:s.reviewedAt,requiredTerms:s.requiredTerms,
 ...(s.reviewedFingerprint?{reviewedFingerprint:s.reviewedFingerprint}:{}),
 evidenceType:s.evidenceType,
 ...(s.contentSelector?{contentSelector:s.contentSelector}:{}),
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
 'Roche’s 23 April presentation reports ENITH-1/2 initiation; its June announcement describes an investigational GLP-1/GIP candidate.', ['enicepatide-roche'],{additionalEvidence:[{title:'Roche Q1 2026 presentation, page 33',url:'https://roche.com/irp260423-a.pdf',sourcePublishedAt:'2026-04-23',reviewedAt:INDUSTRY_REVIEWED_AT,checkScope:'PDF read for trial-stage evidence; not automatically content-monitored.'}]}),
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
}),...followup.entries,...continuing.entries];
