// Editorial candidates only. No runtime overlay and no automatic production writes.
// Source: original Europe PMC core records read 23 September 2026; public metadata
// and original abstracts. These summaries do not imply independent clinical review.
export const ARTICLE_CORRECTIONS = [
 {id:275,slug:'medicine-news/glp-1-analogs-research-update',source:'https://doi.org/10.1016/j.bj.2026.101037',evidence_type:'Review',online_publication_date:'2026-09-11',
  headline:'How GLP-1 medicines are designed to last longer: a review',
  standfirst:'A Biomedical Journal review explains molecular design. It is not a new clinical trial.',
  article_markdown:'## What the review explains\n\nThe authors describe modifications that help GLP-1 medicines resist breakdown, retain receptor activity and remain in circulation. Attaching fatty-acid chains can promote albumin binding and prolong exposure; liraglutide and semaglutide are discussed as examples.\n\nThe review also considers receptor signalling and the design of medicines acting at more than one receptor. These are explanations of drug development, not evidence that a particular treatment is best for an individual.\n\n## What it cannot establish\n\nA structural review cannot, by itself, determine comparative clinical benefit, long-term safety or a change to UK treatment guidance.',
  shift_take:'The useful distinction is between how a molecule works and what patient trials establish. Molecular complexity is not a league table of which medicine someone should use.',
  fact:'Published in Biomedical Journal as a review, not a newly enrolled patient trial.',
  safety:'This is research context, not dosing or switching advice.',
  description:'A structural review explains how GLP-1 medicines resist breakdown and last longer, and why molecular design is not proof of clinical superiority.'},
 {id:188,slug:'medicine-news/glp-1-nutritional-paradox',source:'https://doi.org/10.32388/i85yu1',evidence_type:'Preprint — not peer reviewed',online_publication_date:'2026-09-03',
  headline:'GLP-1 nutrition and lean mass: what an unreviewed preprint proposes',
  standfirst:'This preliminary evidence synthesis is a preprint, not a peer-reviewed clinical guideline.',
  article_markdown:'## What is being proposed\n\nThe author brings together trial reports, observational information and guidance to discuss lean-mass change and nutritional adequacy during GLP-1 treatment. The paper proposes two measures: a Nutrient Density Requirement Index and a Metabolic Quality Index.\n\nThese are proposed research frameworks, not established tests for patients. The source combines different study designs rather than reporting a newly randomised comparison.\n\n## Important limits\n\nThe estimates and proposed measures have not passed peer review in this version. They should not be presented as settled risks or validated clinical targets. Loss of lean mass is also not the same measurement as loss of skeletal muscle alone.',
  shift_take:'This raises questions worth investigating, but preliminary estimates should not become alarming headlines or personalised nutrition targets. The evidence label matters as much as the headline.',
  fact:'Europe PMC records this source as a preprint.',
  safety:'It does not establish a reason to change prescribed treatment.',
  description:'An unreviewed preprint proposes ways to assess nutrition and lean-mass changes during GLP-1 treatment. Its estimates and frameworks remain preliminary.'},
 {id:223,slug:'medicine-news/high-potency-incretin-therapy-risks',source:'https://pubmed.ncbi.nlm.nih.gov/42707648',
  headline:'Nutrition during incretin treatment: what a 19-trial review found',
  standfirst:'A systematic review examines intake, body composition and reported malnutrition—not just weight loss.',
  article_markdown:'## What the authors report\n\nThe review brings together 19 randomised trials from the STEP, SURMOUNT, SCALE and OASIS programmes. It reports lower energy intake and changes in fat-free mass, alongside nutritional and laboratory outcomes.\n\nInvestigator-reported malnutrition was uncommon in the pooled reports, at 0.12%. The authors also discuss low lymphocyte counts and modelled energy deficits. Those are different measures; a laboratory marker is not, by itself, a diagnosis of malnutrition.\n\n## Limits of the findings\n\nThe medicines, populations and measurements vary. Fat-free mass is not synonymous with skeletal muscle, and pooled findings cannot predict an individual outcome. The authors propose a screening approach; publication does not make it an NHS guideline.',
  shift_take:'The practical message is to assess nutrition alongside weight, without turning a review title into a claim that everyone using these medicines is malnourished.',
  fact:'The source is a systematic review and meta-analysis, not a new standalone treatment trial.',
  safety:'This summary is not an individual treatment assessment.',
  description:'A 19-trial review examines nutrition and body composition during incretin treatment. Read the findings, different outcome measures and important limitations.'},
 {id:217,slug:'medicine-news/obesity-treatment-research',source:'https://pubmed.ncbi.nlm.nih.gov/42492687',
  headline:'Why researchers study both activating and blocking the GIP receptor',
  standfirst:'An Appetite review explores two approaches to obesity research without declaring a winner.',
  article_markdown:'## What the review explains\n\nGIP-receptor agonism activates the receptor; antagonism blocks its activity. The authors examine why both approaches are being investigated alongside GLP-1 signalling.\n\nThey discuss proposed effects on appetite-related brain pathways, energy use and tolerability. For antagonism, they consider interaction with GLP-1 effects and the fat-storage actions of the body’s own GIP.\n\n## What remains uncertain\n\nThis is a synthesis of mechanisms and existing evidence, not a new head-to-head trial establishing the better approach. Effects can depend on the molecule, dose, study population and outcomes measured. Mechanistic plausibility is not the same as demonstrated long-term clinical benefit.',
  shift_take:'Apparently opposite mechanisms can both warrant research. That is a reason to examine comparative patient evidence—not rank medicines by the number of receptors mentioned in a headline.',
  fact:'The source is a review in Appetite.',
  safety:'It does not support an individual treatment-switching recommendation.',
  description:'An Appetite review examines GIP-receptor activation and blockade alongside GLP-1 signalling, the proposed mechanisms and the limits of current comparisons.'}
];

// Every entry below was checked against the original bibliographic record.
// Retain the old source_date as historical metadata; display these explicit labels.
export const SOURCE_DATES = [
 ['42729919','2026-06-05','2026-12-01','Clinical practice statement (review)'],
 ['42173727','2026-05-15','2026-11-01','Comparative study'],
 ['42641845','2026-08-25','2026-11-01','Observational study'],
 ['42707648','2026-09-06','2026-10-01','Systematic review and meta-analysis'],
 ['42586458','2026-08-12','2026-11-01','Systematic review'],
 ['42492687','2026-07-23','2026-12-01','Review'],
 ['42508693','2026-07-27','2026-12-01','Review'],
 ['42701460','2026-08-29','2026-10-01','Journal research article'],
 ['42699764','2026-08-04','2026-10-01','Case report'],
 ['42692567','2026-07-23','2026-10-01','Review'],
 ['42664897','2026-08-26','2026-11-01','Review']
].map(([pmid,online_publication_date,issue_date,evidence_type])=>({pmid,online_publication_date,issue_date,evidence_type,metadata_source_url:'https://europepmc.org/article/MED/'+pmid,metadata_checked_at:'2026-09-23'}));
