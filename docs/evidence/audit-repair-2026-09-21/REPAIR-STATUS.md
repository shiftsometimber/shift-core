# Audit repair status — 21 September 2026

Base: shift-core 50558b77c4d38835b1981b9030f701f7e9721c55.
Branch: fix/audit-21sep; draft PR #767. No production changes. The user explicitly authorized publication on 21 September and the branch is now published.

| Audit item | Local change | Remaining verification / work |
|---|---|---|
| D2 Progress missing values | Reject null, blanks, booleans and non-numeric shapes; preserve genuine zero. Calculate each metric from its own readings. One observation has no trend. | Hosted preview with retained/sparse fixture, screenshot and API responses. |
| D5 Progress units | Read the saved My Journey unit preference; format stone/lb, pounds or kg, including changes and milestones. | Settings' displayed dropdown has no persistence handler in the inspected source. Canonical saved Journey preference is used; Settings itself is not certified. |
| D6 Progress palette | Scope Progress card and text colours to black, cream and ash green. | Computed colours/contrast in hosted preview. No whole-site palette claim. |
| D3 saved Fit | Detect known incompatible phase/setting/stale explanation patterns, preserve original records and require explicit rebuild before displaying inconsistent instructions. Distinguish estimated movement time from selected window. Replacement explanation no longer invents a 30-minute selection. | This is containment, not an automatic repair of old exercise records. Prove rebuild, saved activity preservation, fresh login and Today consistency. Review actual affected session in preview. |
| D1 acceptance | Follow current Progress links and open More for today before checking exact saved food. Existing identity/readiness and saved-choice assertions remain required. | Full hosted acceptance and the earlier production failures remain open; local source gates do not close them. |
| D4 Continuity measurement | No unsupported registration/sign-in metric has been renamed as Continuity retention. | Implement and validate first eligible Today exposure, meaningful saved actions, London-date windows, help episode denominators and medication-elsewhere segmentation. No retention-success claim. |

## Local evidence

`local-tests.txt`: 159 tests passed, zero failed. Includes current member/staging tests, missing/sparse Progress data, actual Progress renderer unit output, saved Fit guard fixtures and navigation harness. No customer fixtures were edited.

Also executed successfully: `my-timber-final-source-gate.mjs`, `daily-shift-frontdoor-gate.mjs`, `gate4-one-shift-brain-gate.mjs`. These are local checks, not production verification.

A branch-specific preview workflow is prepared. It deploys only the existing isolated stabilisation preview with fictional-account databases, then runs the existing Chromium/WebKit five-point persistence proof. It has not run for this repair branch. Additional targeted rendered Progress and legacy Fit evidence is still required before release.

## Publication and first hosted run

The initial approval block was resolved by explicit user authorization. Command-line Git lacked credentials, so the connected GitHub account published the branch. Run 35574456798 deployed 40825ecd5895b1c08823bbdd2be1bddb3ee68d2d and passed the four Chromium/WebKit desktop/phone persistence cases. The new audit probe failed because it selected only the production Progress URL, while the isolated preview rewrites navigation under /staging/member-connected/. The test now selects the actual Progress link in the member navigation. API evidence already showed one 103 kg reading, stone/lb preference, null trend and no invented optional measurements. Full corrected browser proof is pending; the failed run is retained, not marked green.

## Preserved decisions and unresolved scope

Treatments stays; no drawer reset; no ticker placement changes; no stock, ordering or clinical-service activation. Latest Today implementation is preserved pending final requirement reconciliation. Payment/question order, Pages provenance, real-device checks, source/feed freshness, email delivery and operational/clinical sign-off remain open as recorded in the audit. No production payments, messages or customer-data writes were performed.

## Continuation: Settings, Fit rebuild and Continuity measurement

The second repair adds atomic Settings unit writes to the canonical Journey weight preference, protects height display preferences from stale whole-state saves, excludes Hotel variants from new home sessions, and extends hosted browser proof to explicit Fit rebuilding with historical-plan and activity preservation.

A separate HQ Continuity report is available at `/v1/hq/continuity` and within the existing Journey report. First Today exposure is recorded prospectively after the authenticated Today panel is visible. Returns use saved check-ins, completed actions and linked feedback, with Europe/London calendar windows and mature denominators. Help episodes are deduplicated across linked check-in and Life Back records using the latest answer, retaining neutral/negative answers and unanswered counts.

Local validation: 216 regression tests pass, including London/DST boundaries, immature cohorts, source/account exclusions, episode deduplication and atomic unit persistence. Three existing source gates pass. Hosted verification is pending for this continuation; earlier preview evidence does not certify these new changes.

Data/decision dependencies remain explicit: historical first Today exposure cannot be reconstructed; the product does not evidence actual eating; medication-elsewhere segmentation and recruitment counts have no explicit register; thresholds, the member P0 register and human clinical/business decisions cannot be invented. These return unavailable/not assessed, never fabricated zeroes or a success status. This is aggregate product-use reporting, not evidence of clinical efficacy.
