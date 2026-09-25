# Retatrutide access context — proposal for qualified clinical/editorial review

Status: DRAFT / NOT PUBLISHED. Prepared 25 September 2026.
Canonical owner: https://shiftsometimber.co.uk/guides/retatrutide-uk-guide
Source base: shiftsometimber/shift-core at b7684acb867e85386cea87ecbfb055847d0fa55d.
base text SHA-256: 7963c7a5960e1f99a6d2c22d86a37d1d94f27ac7c1a78dce0c8d11790403e269.

## Why this proposal exists

The current guide correctly separates UK authorisation, trial evidence, supply and NHS access. Two already-existing primary records add useful context. They were newly identified by this audit, not newly announced on 25 September. No new UK authorisation, launch, NICE recommendation or efficacy result is claimed.

This PR adds review material only. The patch is not applied to the live guide and no runtime file is modified.

## Primary evidence checked in full

| Record | Verified facts | Limits |
| --- | --- | --- |
| [NICE GID-TA11845, ID6644](https://www.nice.org.uk/guidance/awaiting-development/gid-ta11845) | Topic is Awaiting development; expected publication TBC. Decision publication 15 September 2025; timeline status entry 18 September 2025. | Topic selection is not published guidance, a positive recommendation, UK authorisation or NHS access. |
| [ClinicalTrials.gov NCT07629401](https://clinicaltrials.gov/study/NCT07629401), [complete registry JSON](https://clinicaltrials.gov/api/v2/studies/NCT07629401) | Sponsor Eli Lilly; EXPANDED_ACCESS; individual=true; AVAILABLE. First posted 5 June 2026; last update posted 6 August 2026; status verified August 2026. Restricted eligibility includes inability to participate in an ongoing trial and refractory severe obesity with serious complications. | Registry does not establish UK availability. No locations/countries were listed in the inspected record. Do not infer country access from contact details, or provide an application/supply route. Status is a sponsor-maintained registry entry, not proof of actual treatment or regulatory authorisation. |

No contact, access application or supplier link is proposed. No dosing, price, launch-date prediction, affiliation, comparison superiority or sales funnel is added. The live guide does not currently contain an absolute global 'clinical trials only' claim; this is contextual enrichment, not a claim that the existing wording is a clinical error.

## Proposed bounded change

The accompanying proposed-guide.patch adds:
1. One paragraph in UK status distinguishing restricted expanded access from a trial and from UK availability.
2. One paragraph in NHS access distinguishing the existing NICE appraisal topic from guidance.
3. Two primary source citations.

All existing text, title/H1, route/canonical ownership, internal hub links, source dates, schema omissions, navigation, tracking/privacy, checkout and medical/commercial gates remain unchanged by this draft.

## Validation and release gate

Local structural check: one H1; citation targets resolve; no duplicate IDs; removing the two paragraphs and two references reproduces the original source byte-for-byte. No runtime tests are claimed because the patch has not been applied.

Before publication:
- Named qualified reviewer checks the full current primary records and approves final wording.
- Recheck MHRA status and all changed source context at actual publication; record a truthful source-check/revision date only then. Do not invent datePublished.
- Apply only the approved bounded changes to the then-current master. Rebase/review if the source changed.
- Rebuild the PR806 guarded reduced CSS/body match and repeat the matched mobile lab check. A changed guide body can trigger the safe full-CSS fallback; do not silently lose the speed repair.
- Run existing guide/source, privacy and route acceptance gates. Verify live rendered content and release identity after an approved deployment.
- Do not merge or deploy this proposal automatically.

The EASD 28 September–2 October 2026 announcement remains a forward evidence checkpoint; this proposal makes no claim about results not yet published.
