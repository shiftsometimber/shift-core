# Readiness repair — 16 September 2026

Baseline: `e18bf18bb29dca51a536c32178c615bdfcc9c48b` on `main`. This review follows the current deployed code, not superseded September handovers or deployment ZIPs. The approved My Timber home, its typography, aftercare position and connected Grub/Fit/Life Back journey remain the design authority.

## Confirmed gaps and bounded repairs

| Area | Evidence | Repair / remaining requirement |
| --- | --- | --- |
| Retained member tools | Rendered acceptance run [35066300631](https://github.com/shiftsometimber/shift-core/actions/runs/35066300631) timed out on the old readiness class. Current dashboard also lacked the Progress/photos and Plans panels; `/member/plans` redirected to the absent panel. | Add the existing retained-record tools to the current shell through More. Preserve Today and Journey. Verify private save, fresh sign-in, another account, deletion and plan history in isolated staging. |
| Acceptance sign-in | My Timber run [35066026995](https://github.com/shiftsometimber/shift-core/actions/runs/35066026995) failed with `turnstile_required`. Registration supplied the approved short-lived commissioning identity; login did not. | Use the same narrowly authorised synthetic sign-in contract for login; verify the returned account on both serving origins. Do not weaken production authentication or inject browser state. |
| Test honesty | Old workflows rewrote acceptance scripts at runtime and suppressed all HTTP 400 console failures. | Execute committed source, use the current authenticated DOM, retain actual missing-capability failures, and acquire short-lived identity after browser installation. Chromium evidence is labelled Chromium, not Safari. |
| Treatment identity and duration | Generic tablet choice exposed only 60/120 mg. Approximate duration bands became exact weeks 1/3/8/16. | Explicit Orlistat capsule identity and an unspecified option; unknown dose is allowed. Do not infer old tablet identities. Stop inventing exact weeks; preserve old rows and display their approximate meaning. |
| Support-intent delivery | Legacy action said “Message the clinical team”, but the persisted case had `pharmacy_status=not_sent`. | Preserve the fixed support intent and local record while explicitly stating no message was sent and no clinical response was scheduled. Do not add free-text note storage. |
| Usage analytics | Existing five `my_timber_*` event names were rejected, leaving gaps in operational counts. | Accept only those names with a per-event property whitelist: valid date and, for Today views, two strict saved-state booleans. Exclude symptoms, treatment choices, notes and arbitrary content. |
| Automatic source rollback risk | Four historical Act2B workflows could rewrite source, restore an old Worker, or push straight to main. One was invalid YAML. | Retire the obsolete one-shot and retain read-only source/route checks in the others. No automatic source rewrite or historical restoration. Contact validation is not represented as message delivery. |

## Evidence already green at this baseline

- Whole-estate sweep [35066026912](https://github.com/shiftsometimber/shift-core/actions/runs/35066026912): **670 same-origin URLs, 519 HTML pages, zero critical route/asset/blank-page failures**, discovery exhausted. This does not prove authenticated tools or clinical operations.
- The main production promotion succeeded. A successful deployment does not override the separate member acceptance failures above.
- Initial local connected-member and AI suite: **72 passed**. Authentication/source checks also passed. Candidate additions require their own final CI and hosted evidence.
- `evidence/readiness-preservation-2026-09-16.json` records **319 files unchanged byte-for-byte** against the baseline: approved home design/styles, existing Grub/Fit/Life Back renderers, food and exercise artwork, commissioning authority, and payment configuration. This is a scoped preservation check, not a claim that every UI interaction is proven.

## Items that cannot truthfully be marked release-ready yet

| Area | Current evidence | Required next action |
| --- | --- | --- |
| Expanded Fit catalogue | `preview/fit-grub/v3/approval.json`: 300 approved images, zero holds, 2,688 mappings. Existing accepted production cohort is 26 movements / 1,326 protocols; expansion adds 274 movements / 1,362 protocols. Workbook programming/technique review flags remain pending. | Preserve all approved images and the accepted live cohort. Reconcile exact legacy protocol hashes, obtain scoped technique/programming approval for new records, then add an additive production converter. Preview image approval is not exercise-programming approval. |
| Medicines Watch | Public health endpoint at 09:00 UTC on 16 September: 18/19 retrieved, 11 reviewed baselines current, eight fingerprints missing. NHS England retrieval returned HTTP 202. No changed/withdrawn/overdue flags in that response. | Read exact evidence and record missing baselines through the existing review process. HTTP success does not renew medical review. No medical claim or review-date change is part of this patch. |
| Newsroom | [PR #688](https://github.com/shiftsometimber/shift-core/pull/688) remains separate; its existing preview had 24 sources, 21 retrievals, three failures and zero publications. The public newsroom responds, but unseen HQ drafts and their SEO/approval status have not been verified. | Reconcile the source/discovery repair against current main. Review each actual draft and its evidence through named HQ access; do not bulk manufacture editorial or clinical approval. |
| Human aftercare | Information, urgent-help routes and Ask Shift are present. A staffed, acknowledged prescriber handover and delivered follow-up schedule are not evidenced. | Commission the accountable provider, clinical content and operating process before promising those services. |
| Commerce/pharmacy | Configuration deliberately remains Stripe test; purchaseability, verification-first checkout, stock and partner gates exist. Code does not prove live credentials, stock, signed agreements or staffing. | Complete provider/live-payment/device acceptance with authorised test arrangements. Preserve the commercial gate. No payment or checkout change is included here. |
| Workplace programme | Existing isolated staging has fictional accounts and separate data. | Keep technical staging evidence distinct from an operational employer service. |

Orlistat identity/strength references read on 16 September 2026: [alli 60 mg SmPC](https://www.medicines.org.uk/emc/product/6533/smpc), updated 25 April 2023; [Xenical 120 mg SmPC](https://www.medicines.org.uk/emc/product/2592/smpc), updated 24 October 2023. These support recording the product identity/strength, not prescribing or clinical sign-off.

## Release boundary

This candidate must pass its new focused checks, existing connected-member/privacy checks and the isolated account-backed walkthrough before promotion. Any new hosted failure remains a failure. Do not merge an old unrelated branch, reset production to an earlier snapshot, replace the accepted Fit engine with a preview composer, or call an unexamined service green.

No private member record was read during this source/public audit. The account-backed checks use dedicated fictional accounts. Release evidence will be attached to the pull request rather than inferred from this document.
