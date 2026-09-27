# Newsroom backlog reconciliation — 16 September 2026

The historical 26-item review preview consisted of the 15 REC-036 UK archive articles plus 11 pre-existing MHRA safety records. It is not evidence of 26 additional unfinished archive articles. The later REC-037 archive release did not close those 11 records.

This reconciliation uses repository source, release records and retained GitHub Actions logs. It makes no new production database request, approval, publication or message send.

## Exact historical identity

The REC-036 preparation manifest at 13 September 2026 07:35:21 UTC records 15 prepared IDs, 295–309, and 26 eligibleForReview records. Subtracting the prepared set identifies exactly the 11 excluded records below. The later REC-037 preparation manifest at 08:26:58 UTC still lists all 11 as ready_for_review. None is among REC-037's 28 prepared IDs.

| Event ID | Historical headline | Status in both preparation manifests |
| --- | --- | --- |
| 23 | Short-acting beta 2 agonists (SABA) (salbutamol and terbutaline): reminder of the risks from overuse in asthma and to be aware of changes in the SABA prescribing guidelines | ready_for_review |
| 35 | Bromocriptine: monitor blood pressure when prescribing bromocriptine for prevention or inhibition of post-partum physiological lactation | ready_for_review |
| 276 | Domperidone: new contraindication in patients with phaeochromocytoma due to the risk of severe hypertension | ready_for_review |
| 279 | IXCHIQ Chikungunya vaccine: temporary suspension in people aged 65 years or older | ready_for_review |
| 281 | IXCHIQ Chikungunya vaccine: updates to restrictions of use following safety review | ready_for_review |
| 284 | Isotretinoin – changes to prescribing guidance and additional risk minimisation measures | ready_for_review |
| 286 | Mesalazine and idiopathic intracranial hypertension | ready_for_review |
| 288 | Isotretinoin – updates to prescribing guidance and survey of services | ready_for_review |
| 290 | Abrysvo▼ (Pfizer RSV vaccine) and Arexvy▼ (GSK RSV vaccine): be alert to a small risk of Guillain-Barré syndrome following vaccination in older adults | ready_for_review |
| 292 | Short-acting beta 2 agonists (SABA) (salbutamol and terbutaline): reminder of the risks from overuse in asthma and to be aware of changes in the SABA prescribing guidelines | ready_for_review |
| 294 | Bromocriptine: monitor blood pressure when prescribing bromocriptine for prevention or inhibition of post-partum physiological lactation | ready_for_review |

Two pairs have identical headline text: 23/292 and 35/294. A matching headline alone does not establish identical source versions or authorize removal. The IXCHIQ 279/281 and isotretinoin 284/288 pairs describe successive guidance changes and must not be collapsed merely because they concern the same medicine.

## Completed releases

| Release | Exact released set | Retained proof |
| --- | --- | --- |
| REC-036 | 295–309 (15 articles); existing published event 236 deliberately retained | docs/rec036-uk-archive-release.md; final release run 34746087608 |
| REC-037 | 283 and 310–336 (28 articles) | docs/rec037-uk-newsroom-depth-release.md; final release run 34748864167 |
| REC-038 | Contextual reading links on Knowledge Hub and SHIFT Health; no new article publication | docs/rec038-uk-newsroom-discovery-preview.md; release run 34759343882 supersedes its historical blocked-preview notes |

REC-037 documents 51 UK / 156 total published articles after its release. Those are historical release counts; today's mixed Radar queue count cannot be compared directly with the public published-article total.

## Current state and remaining scope

The root agent's authenticated HQ observation on 16 September reports 164 mixed Radar rows, including 77 Published, and zero approved articles ready in the publication preview. New daily signals such as 394 had blank full-article fields. The root agent then checked the exact historical IDs through that normal UI:

| Exact historical IDs | Current authenticated UI observation |
| --- | --- |
| 276, 279, 281, 284, 286, 288, 290, 292, 294 | Hold / Source changed — fresh review required |
| 23, 35 | Absent from the 164 visible rows; current status remains unknown |

Event 276's actual review dialog states that saving, approving and publishing are blocked until Start source correction. Its existing full-article field contains only a short introduction rather than a complete article. The dialog shows a source change on 16 September at 12:45 UK time and a first source date of 21 July 2026. These details are verified for event 276 only, not inferred for the other held items.

The empty Knowledge Hub CMS list is the separate knowledge_articles store. It is not evidence that the Newsroom's radar_events content is missing. The correct bounded follow-up is to inspect these exact 11 IDs through the authenticated Radar UI, preserving status, source version, article body and review requirements. An unfinished specialist safety story needs the actual retained specialist/editorial decision; a newer daily detection is not automatically part of this historical task. No bulk approval is supported.

The nine visible historical records therefore remain held and require source correction and fresh review; they were not completed by REC-037. The two absent records remain unresolved by this evidence. The root agent is preparing fresh offline drafts against primary sources; no live hold is cleared and no human approval is claimed.

## Evidence provenance

- REC-036 preparation: [run 34745573473 / job 103692806573](https://github.com/shiftsometimber/shift-core/actions/runs/34745573473/job/103692806573), successful. Original artifact 10314290965, REC-036-UK-archive-evidence; ZIP digest 20be295163eeacfffcf15a4caafeacc8b14536d6ef420f45ef6517ad6658fb07.
- REC-037 preparation: [run 34747678464 / job 103698496524](https://github.com/shiftsometimber/shift-core/actions/runs/34747678464/job/103698496524), successful.
- Exact preparation JSON extracted from the retained job output: evidence/newsroom-backlog-closeout-2026-09-16/historical-manifests.json. It preserves article IDs, headlines, prepared sets, skipped records and eligible review sets. It omits unrelated runner logs.
- Source emitters: verification/rec036-prepare-uk-archive.mjs and verification/rec037-prepare-uk-depth.mjs. Their eligibleForReview query requires ready_for_review status, verified evidence, at least 100 article-markdown characters and nonempty known facts; it is eligibility for review, not approval.
- docs/rec036-uk-archive-release.md independently states that the 11 unrelated unfinished/unreviewed candidates were excluded. REC-037 states that unrelated drafts were not approved.
- Current status and event 276 dialog observations were supplied by the root agent from the signed-in owner HQ UI on 16 September. This source-audit subagent did not query production content separately.
- Personal Context was unavailable; the reconciliation instead uses the retrieved historical source evidence.
