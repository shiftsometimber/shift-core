# Audit repair status — 21 September 2026

Base: shift-core 50558b77c4d38835b1981b9030f701f7e9721c55.
Local branch: fix/audit-21sep. No production changes; no remote branch exists at the last read-only check.

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

## Publication block

Automatic approval review rejected the GitHub branch push because external source publication was not explicitly authorized. No alternate publication route was attempted. Explicit approval to push `fix/audit-21sep` to `shiftsometimber/shift-core` is required before hosted preview work can continue.

## Preserved decisions and unresolved scope

Treatments stays; no drawer reset; no ticker placement changes; no stock, ordering or clinical-service activation. Latest Today implementation is preserved pending final requirement reconciliation. Payment/question order, Pages provenance, real-device checks, source/feed freshness, email delivery and operational/clinical sign-off remain open as recorded in the audit. No production payments, messages or customer-data writes were performed.
