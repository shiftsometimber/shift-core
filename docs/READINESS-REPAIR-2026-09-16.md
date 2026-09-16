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
| Cold-request timeouts | Isolated phone/desktop run [35084451794](https://github.com/shiftsometimber/shift-core/actions/runs/35084451794) could not load Progress or Plans. The legacy readiness probe bound 111 parameters; Cloudflare D1 permits 100 and previous runtime logs record that failure. | Check the complete required object list in bounded groups of 100. Keep the same fallback when an object is missing or a read fails. Three regression cases cover the complete schema, a missing last-chunk object, and a failed read. Hosted verification remains required. |
| Automatic source rollback risk | Four historical Act2B workflows could rewrite source, restore an old Worker, or push straight to main. One was invalid YAML. | Retire the obsolete one-shot and retain read-only source/route checks in the others. No automatic source rewrite or historical restoration. Contact validation is not represented as message delivery. |

## Evidence already green at this baseline

- Whole-estate sweep [35066026912](https://github.com/shiftsometimber/shift-core/actions/runs/35066026912): **670 same-origin URLs, 519 HTML pages, zero critical route/asset/blank-page failures**, discovery exhausted. This does not prove authenticated tools or clinical operations.
- The main production promotion succeeded. A successful deployment does not override the separate member acceptance failures above.
- Initial local connected-member and AI suite: **72 passed**. Authentication/source checks also passed. Candidate additions require their own final CI and hosted evidence.
- `evidence/readiness-preservation-2026-09-16.json` records **318 of 319 files unchanged byte-for-byte** against the baseline: approved home design/styles, existing Grub/Fit/Life Back renderers, food and exercise artwork, commissioning authority, and payment configuration. The one declared exception is the approved Fit runtime: it now accepts an explicit Today duration suggestion without changing the saved plan on arrival. Its baseline and current hashes are both retained. This is a scoped preservation check, not a claim that every UI interaction is proven.

## Items that cannot truthfully be marked release-ready yet

| Area | Current evidence | Required next action |
| --- | --- | --- |
| Expanded Fit catalogue | `preview/fit-grub/v3/approval.json`: 300 approved images, zero holds, 2,688 mappings. Existing accepted production cohort is 26 movements / 1,326 protocols; expansion adds 274 movements / 1,362 protocols. Workbook programming/technique review flags remain pending. | Preserve all approved images and the accepted live cohort. Reconcile exact legacy protocol hashes, obtain scoped technique/programming approval for new records, then add an additive production converter. Preview image approval is not exercise-programming approval. |
| Unreleased Grub catalogue expansion | Current generated authoring universe: 2,876 recipes, 2,671 semantically clean and 205 quarantined. The accepted live 798-recipe cohort has its own immutable approval authority. | Keep the accepted live cohort intact. Repair and review quarantined families and obtain exact additional template decisions before expanding serving; clean generation alone is not publication approval. |
| Medicines Watch | Public health endpoint at 09:00 UTC on 16 September: 18/19 retrieved, 11 reviewed baselines current, eight fingerprints missing. NHS England retrieval returned HTTP 202. No changed/withdrawn/overdue flags in that response. | Read exact evidence and record missing baselines through the existing review process. HTTP success does not renew medical review. No medical claim or review-date change is part of this patch. |
| Newsroom | [PR #688](https://github.com/shiftsometimber/shift-core/pull/688) and paired [HQ #27](https://github.com/shiftsometimber/shift-hq/pull/27) are merged and deployed. Discovery and reviewed-snapshot preservation are repaired; changed evidence now requires explicit correction and fresh preparation/approval. Actual unpublished articles and their SEO have not been examined because named HQ sign-in remains required. | Review each actual draft and its SEO/evidence through named HQ access; do not manufacture approval. Source retrieval, technical safeguards and publication approval are distinct. |
| Human aftercare | Information, urgent-help routes and Ask Shift are present. A staffed, acknowledged prescriber handover and delivered follow-up schedule are not evidenced. | Commission the accountable provider, clinical content and operating process before promising those services. |
| Commerce/pharmacy | Configuration deliberately remains Stripe test; purchaseability, verification-first checkout, stock and partner gates exist. Code does not prove live credentials, stock, signed agreements or staffing. | Complete provider/live-payment/device acceptance with authorised test arrangements. Preserve the commercial gate. No payment or checkout change is included here. |
| Unreleased Programme V1 module | The separate module is disabled: production lacks its enable flag/database binding, content includes six test fixtures and no reviewer/date. This does not replace or invalidate the current connected member journey. | Leave disabled. Any future activation needs reviewed content, isolated hosted/browser checks and accountable provisioning, retention and deletion operations. This is an expansion gate, not a repair to the accepted live member experience. |
| Workplace programme | Existing isolated staging has fictional accounts and separate data. | Keep technical staging evidence distinct from an operational employer service. |

Orlistat identity/strength references read on 16 September 2026: [alli 60 mg SmPC](https://www.medicines.org.uk/emc/product/6533/smpc), updated 25 April 2023; [Xenical 120 mg SmPC](https://www.medicines.org.uk/emc/product/2592/smpc), updated 24 October 2023. These support recording the product identity/strength, not prescribing or clinical sign-off.

## Release boundary

This candidate must pass its new focused checks, existing connected-member/privacy checks and the isolated account-backed walkthrough before promotion. Any new hosted failure remains a failure. Do not merge an old unrelated branch, reset production to an earlier snapshot, replace the accepted Fit engine with a preview composer, or call an unexamined service green.

No private member record was read during this source/public audit. The account-backed checks use dedicated fictional accounts. Release evidence will be attached to the pull request rather than inferred from this document.

## Live verification follow-up

Member repair [#697](https://github.com/shiftsometimber/shift-core/pull/697) passed the isolated hosted run [35090181025](https://github.com/shiftsometimber/shift-core/actions/runs/35090181025), including 32 account/API/AI checks and desktop/390px retained-tool save/return/deletion checks. Its production promotion [35090686497](https://github.com/shiftsometimber/shift-core/actions/runs/35090686497) passed.

Production acceptance subsequently exposed two issues which remain open until this follow-up is deployed and verified:

- The tools loader could close a More menu opened during startup. The Journey script also normalises an empty hash to `#today`. Startup synchronisation must preserve the disclosure state; explicit navigation still closes it. The regression defers real script loads rather than adding an arbitrary browser wait.
- Today’s working-late adjustment suggested 10 minutes while Fit retained the saved 30-minute plan. Today now labels this as a suggestion and offers **Review shorter session**. Fit preselects the requested duration and explains that the saved session is unchanged; only the member’s existing **Build today’s session** action generates a replacement. The production walkthrough asserts the saved plan is identical after arrival, then explicitly builds and verifies a 10-minute session without changing the chosen meal.

The production proof also used a retired Fit DOM selector. It now targets the current approved runtime and records loaded exercise imagery. [#698](https://github.com/shiftsometimber/shift-core/pull/698) previously corrected a test-only origin mismatch; no production origin guard was relaxed.

The first rendered-production report [35090910327](https://github.com/shiftsometimber/shift-core/actions/runs/35090910327) passed Progress and Plans, but both photo suites reported navigation failures. Individual step summaries used `continue-on-error` and were misleading; only final job conclusions and artifact failure arrays establish acceptance. A later phone run [35091520873](https://github.com/shiftsometimber/shift-core/actions/runs/35091520873) preserved the selected meal and reached real Fit, exposing the mismatch above. Neither run is reported as fully green.

The follow-up is based on current released main `1844d02a14dc6ac4151b1b3c9166c1a206bcb77d`, preserving the intervening Newsroom release. Its final CI, staging and production evidence will be attached to its own pull request.
