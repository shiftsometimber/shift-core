# Audit repair — 21 September 2026

Base: `50558b77c4d38835b1981b9030f701f7e9721c55`. Branch: `fix/audit-21sep`. [Draft PR #767](https://github.com/shiftsometimber/shift-core/pull/767) carries the current acceptance result and release decision. Production has not been changed by this repair.

| Item | Repair and acceptance contract |
|---|---|
| D2 Progress values | Preserve missing values, genuine zero and per-metric observation dates. A single reading has no trend. Browser/API proof uses one weight reading with optional fields missing. |
| D5 units | Progress uses canonical Journey units. Settings saves weight and height display preferences atomically, without changing measurements, consent, plans or other member records. Browser proof changes units, reloads, signs in again and checks Progress. |
| D6 palette | Progress-specific cards use black, cream and ash. Hosted proof checks computed colours. This is not a whole-site palette claim. |
| D3 Fit | Inconsistent retained instructions are blocked pending explicit rebuild. New selection excludes wrong phases and Hotel variants in home sessions. Timing distinguishes selected windows from estimates. Hosted proof rebuilds explicitly, checks the original plan in export and preserves saved activity through reload/new login. |
| D1 acceptance | Follow the actual Progress link and open More for today before exact saved-meal assertions. Identity, readiness and persistence checks remain required. Preview acceptance does not close historical production failures or certify a future release. |
| D4 measurement | Separate HQ Continuity report at `/v1/hq/continuity`, also included in Journey reporting. Prospective visible Today acknowledgement starts the cohort. Saved-action returns use mature Europe/London Day 2–7 / Day 22–28 windows. Help episodes are deduplicated, latest answers used, and skipping remains unanswered. |

## Evidence

First batch: [run 35575254986](https://github.com/shiftsometimber/shift-core/actions/runs/35575254986), source `afc5c274a751f9263f09a110903133d74cf854c4`, passed 209 regressions and eight Chromium/WebKit desktop/phone browser cases. Artifact SHA256: `8fcd10e4183c0a2f5e9ec9f9b76df8c656d5370a582fbc7c685a6ef5bf841dd5`.

Continuation adds Settings persistence, full explicit Fit rebuild proof, Today-exposure capture and Continuity denominator tests. The branch workflow reruns the complete hosted matrix against its source SHA and retains reports/screenshots plus a read-only Pages provenance attempt. Use the latest result in PR #767; the first-batch result does not certify subsequent changes. Browser phone viewports are not physical-device testing.

## Measurement boundaries

No registration/login backfill is used for first Today. Members who never finish a check-in remain in the denominator. Meaningful returns use retained check-ins, completed actions and submitted feedback; logins, page views and meal selection do not count. The existing cap on retained Fit activity and data erasure can reduce historical evidence.

A saved meal choice does not establish eating, so the four-stage Day-1 completion rate is unavailable. Medication-elsewhere membership, recruitment counts and a reviewed P0 register have no explicit source. No segment is inferred from medical/provider records. Missing sources are unavailable and immature cohorts are not yet eligible; neither becomes a zero-percent performance claim. Success thresholds remain unset. Helpfulness is a member-reported product signal, not clinical efficacy.

## Remaining release / external dependencies

Production promotion and post-release acceptance require a separate release decision. Pages provenance is established by the control-plane read and asset verification in run 35585251097: production deployment 0da69833-83f7-4c70-9c7a-bceab7de1660 maps to shift-core source commit c733bf03834d93154a51a0db6ef05dbebb3c7cb3 and aggregate fingerprint 1ec46ba5f5383cf02c5379cabc6ad20877a8dc6193abd8cc852b1ede43a9dcc0. See pages-source.json. The historical upload succeeded but its post-upload header check failed; that run is source evidence, not current acceptance. The preview now pins this exact current production Pages build; latest hosted acceptance is required for these updated templates. Mail delivery, physical-device checks, Radar source health and the full operational acceptance gaps remain as recorded in the audit. Payment/question sequencing and named clinical/pharmacy hand-offs are unresolved operating decisions.

Treatments and agreed navigation remain. No unavailable service, stock, ordering, payment or clinical claim has been activated. No messages, payments or customer-record writes were performed. Expansion remains closed.
