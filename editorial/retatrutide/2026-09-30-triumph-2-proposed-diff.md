# Retatrutide evergreen guide — TRIUMPH-2 review proposal

**Prepared:** 30 September 2026  
**Status:** review only — clinical/editorial publication gate remains locked  
**Canonical owner to preserve:** `/guides/retatrutide-uk-guide`

## Why a review is now warranted

The guide currently says the 30 September EASD presentation is a future checkpoint and labels TRIUMPH-2 as a July 2026 topline announcement. That is now stale.

On **29 September 2026**, the full TRIUMPH-2 report was published in *The Lancet* and indexed in PubMed (PMID 42810372; DOI 10.1016/S0140-6736(26)01861-1). Lilly also published detailed results on 29 September. The EASD presentation occurred on 30 September. These are evidence/presentation events, not UK authorisation or availability decisions.

No UK-status change was identified: retain the existing MHRA not-authorised warning, no verified UK launch date or price, no supplier route, and no NHS-access claim. NICE ID6644 remains an appraisal topic awaiting development, not guidance or access.

## Proposed exact content changes

### 1. Review metadata

Replace:

> Sources checked 23 September 2026

With, only when the approved update is published:

> Sources checked 30 September 2026

Advance `dateModified` only with the substantive approved publication. Do not invent or backfill `datePublished`.

### 2. Evidence table introduction

Replace:

> The evidence below separates a peer-reviewed trial from manufacturer-reported Phase 3 findings. These are selected results, not a complete systematic review.

With:

> The evidence below separates peer-reviewed trial reports from manufacturer announcements. These are selected results, not a complete systematic review, and the same population, analysis and follow-up must be used before comparing percentages.

### 3. TRIUMPH-2 table row

Keep the selected efficacy-estimand figures (12 mg 20.8%; placebo 4.0%) but replace the limitation cell:

> July 2026 topline announcement; do not pool with a trial excluding diabetes.

With:

> Peer-reviewed phase 3 report published 29 September 2026. The trial enrolled adults with type 2 diabetes and obesity or overweight; do not pool it with trials excluding diabetes. The quoted result is the efficacy estimand, not an individual forecast.

### 4. EASD checkpoint paragraph

Replace:

> **Next announced evidence checkpoint:** Lilly’s 15 September announcement schedules a retatrutide symposium for 30 September at EASD 2026. On this guide’s source-check date, that presentation is still in the future. An announced presentation is not newly available full results.

With:

> Lilly announced the EASD symposium on 15 September 2026. Detailed TRIUMPH-2 results were then published on 29 September and presented at EASD on 30 September. The peer-reviewed report is the primary research source; the sponsor release helps distinguish its announcement date from the presentation date. Neither event is a UK marketing authorisation or launch decision.

### 5. Safety context

After the current TRIUMPH-1 safety paragraph, add:

> In TRIUMPH-2, the published report and sponsor summary describe gastrointestinal adverse events as common. Lilly reported discontinuation because of adverse events in 3.8%, 11.6% and 7.7% of the 4 mg, 9 mg and 12 mg groups, respectively, versus 4.9% with placebo. Those group-level findings do not establish suitability for an individual and do not replace the full paper’s safety tables.

The approved editor should verify the figures against the full Lancet paper and supplementary appendix before publication.

### 6. Source list

Add these primary sources:

1. Bellido V, le Roux CW, Ekinci EI, et al. “Retatrutide in adults with obesity and type 2 diabetes (TRIUMPH-2): a double-blind, parallel-group, randomised, placebo-controlled, phase 3 trial.” *The Lancet*. Published 29 September 2026. DOI: https://doi.org/10.1016/S0140-6736(26)01861-1 ; PubMed: https://pubmed.ncbi.nlm.nih.gov/42810372/
2. Lilly. Detailed TRIUMPH-2 results. Published 29 September 2026: https://investor.lilly.com/node/54981
3. ClinicalTrials.gov record NCT05929079: https://clinicaltrials.gov/study/NCT05929079

Relabel the 15 September Lilly item as a pre-event announcement rather than a current evidence checkpoint.

## Publication guardrails

- Preserve this page as the only sitemap/canonical owner for the topic.
- Do not create a separate EASD, “results”, “side effects”, availability, price or comparison keyword page.
- Do not add a sales funnel, waiting list, preorder, dosing instructions, supplier links, speculative launch date or affiliation language.
- Do not state that a sponsor's planned US filing is an FDA, MHRA or NICE decision.
- Retain the distinction between efficacy and treatment-regimen estimands.
- Rebuild and revalidate the guarded Retatrutide reduced CSS after any approved content change.
- Run canonical, H1, metadata, internal-link, consent, mobile-Lighthouse and full public crawl gates before release.
