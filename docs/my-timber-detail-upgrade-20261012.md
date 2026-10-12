# Latest extension: recorded jab/symptom/food/Fit patterns

The working 12 October pattern extension supersedes the earlier candidate status below. See [my-timber-patterns-20261012.md](my-timber-patterns-20261012.md) for behaviour, current evidence, limits and the combined finite 13-path release scope. Earlier source and receipts remain preserved. Production integration is still pending.

# My Timber — progress charts and quick logging — 12 October 2026

Status: built and locally verified; not merged or deployed; physical acceptance remains open.

Matt authorised the first upgrade at 07:54 BST, then explicitly added progress charts and smooth, quick, easy logging at 09:21 BST. This extends the same existing branch and #1065 source/release lane. The first-stage commit 67d8135c578cdbb5a898fa09e889efef0bf4b3ad and its original receipts remain in history.

## Everyday use

The member chooses one thing: Weight, Water, Food, How I feel or Symptoms.
- Weight and Water each show one input and one Save button.
- Food starts with a note; protein/water extras are expandable.
- Appetite and energy are independently optional; weight or water never requires either.
- Symptoms start with one note or the explicit No symptoms to record action. Effect/start time stay expandable.
- Dose time defaults to now, with optional time/note changes behind an expander; location remains optional.
- Add-treatment setup, instructions/supply/reminders and wider Journey tools stay expandable.
- Unsaved quick-log values remain only in memory. A fresh authenticated owned-record read is required before restoration. Missing ownership or 401 clears the draft. Restoration does not force focus/scroll and swallow the next tap.
- One operation ID and the first submission time survive a failed quick-save retry. No blank unrelated values or fabricated Usual ratings are saved.

The original optional-health consent, member isolation, licensed-medicine boundaries, supply logic, reminders and medical-disclosure controls remain.

## Progress charts

Charts appear at the top of the existing Progress surface. Weight, waist, systolic/diastolic BP, steps, sleep and mood use recorded values from the canonical Progress summary, with one measure selector and all/4-week/12-week periods. Dot selection, keyboard arrows and an expandable readings table support exploration.

Weight units follow kg, lb or stone/lb preferences. Empty and single-point states show no invented line or forecast. Missing values remain missing; genuine zero remains zero. Calendar spacing is real; the latest saved reading per day is plotted.

The summary reads existing account-owned treatment weights as well as progress entries. It selects only numeric weight and timestamps from treatment events, not symptom/food notes, and never copies or writes progress rows. This adds one bounded database SELECT under the existing My Treatment flag; chart controls add no network request. No new datastore, schema, model/provider or paid service is used.

Existing bounded history is retained: up to 1,000 progress records and 1,000 treatment check-ins. A cap notice appears when either boundary is reached. Life Back remains the existing score, not a new clinical or competing score.

## Source

Repository: shiftsometimber/shift-core.
Branch: codex/my-timber-journey-detail-20261012.
Base: 91d6a15fec847ef7b1f6dc5828dee84853b3eb27.
Worktree: /Users/shiftsometimberltd/SST/shift-my-timber-journey-detail-20261012.

Exactly nine paths relative to the base:
1. member-experience/treatment-detail.mjs
2. member-experience/treatment-page.mjs
3. member-experience/treatment-routes.mjs
4. member-experience/tests/treatment-detail.test.mjs
5. member-experience/staging/verify-treatment-detail.mjs
6. docs/my-timber-detail-upgrade-20261012.md
7. member-daily-v2.js
8. frontend/member/member-progress-v1.js
9. tests/progress-charts.test.mjs

Homepage, public copy, global navigation, prescribing, stock/checkout, runtime configuration, notification implementation, native packages/keys/testers and existing release guards are unchanged.

## Actual verification

- Focused treatment/model/progress suites: 42 pass, zero failures/skips.
- Broader member integration suite: 377 pass, zero failures, one existing real-model pilot test skipped. No real-model or paid-provider call.
- Local Chromium, 380 and 1440 px: previous dose/site/history/owned-PDF/refresh/period/text-safety checks retained; independent logs, optional expanders, owned draft return plus successful next tap, quick-save retry, charts/layout, metric/period controls without an extra request, keyboard/readings table, all weight units, shared treatment weights and other-account exclusion pass.
- Synthetic expired-session private-record clearing and duplicate-dose prevention pass.
- Existing frontend source gate passes; the configured Worker compiles through its standard dry-run.
- Browser screenshots inspected internally, not saved as deliverables. These are candidate results, not live, physical or independent-user acceptance.

The mobile return/save test caught forced focus during draft restoration; the fix suppresses that autofocus. The passing verifier explicitly requires the subsequent water POST to return 201. It was not changed to bypass the tap or weaken the save assertion.

Current receipts on authorised SST Mac:
- /Users/shiftsometimberltd/SST/my-timber-smooth-focused-20261012.log
- /Users/shiftsometimberltd/SST/my-timber-smooth-regressions-20261012.log
- /Users/shiftsometimberltd/SST/my-timber-smooth-browser-20261012.log
- /Users/shiftsometimberltd/SST/my-timber-smooth-source-gate-20261012.log
- /Users/shiftsometimberltd/SST/my-timber-smooth-build-20261012.log
- /Users/shiftsometimberltd/SST/my-timber-smooth-proof-20261012/receipt.json

Original first-stage receipts under my-timber-detail-* remain historical and unchanged. The browser verifier is the current candidate source.

## Guarded release handoff

Existing #1065 owner must:
1. Recover current main/serving and this same branch; rebase only when the serial lane permits.
2. Add finite composition registration for exactly these nine paths. Preserve immutable verifier bytes, previous source registrations, negative drift tests and prior release/failure receipts. No blanket allowlist, repinning of unrun evidence or guard weakening.
3. Pass every applicable exact-head gate and the current candidate browser suite; then run one same-source guarded promotion.
4. Verify both treatment runtime and the Git-authoritative Progress client actually serving, anonymous private-API denial, signed-in mobile/desktop single-item saves, owned chart records/units/periods, draft return/next tap, duplicate prevention and owned PDF. Member frontend assets currently cache for five minutes; verify the actual refreshed serving client rather than assuming an already open client updated.
5. Keep physical iPhone/Android, closed-app reminders, HealthKit/Health Connect and native PDF share/save/cancel with their original holders and sole receipt sheet. Recheck affected shared UI/PDF behaviour; no store upload, review withdrawal, key reset or access change.
6. Retain ordinary entry/recovery, actual support, elapsed-expiry browser/persistence and broader Shift AI operational acceptance requirements.

No PR, issue comment, external message, deployment, paid generation or commitment has occurred. Source publication alone is not live delivery.

## Remaining product increments

Grub logging independent of treatment and editable photo-assisted food estimates remain separate increments. Photo work needs an exact cost/privacy/retention design before any image upload or paid model activation. Existing real first-use and mature week-four return/helpfulness measures remain distinct from synthetic QA; recruitment and communications require complete draft/recipient approval.

## Proposed draft PR — not created or sent

Title: Add progress charts and simplify My Timber daily logging

Body:
Members can review their recorded weight, waist, blood pressure, steps, sleep and mood in the existing Progress screen, with period filters, their chosen weight units, selectable dots and a readable data table. Account-owned weights already saved in My Treatment join the summary on read without copying records or returning symptom notes.

Daily logging now starts with one task. Weight and Water need one value; Food, How I feel and Symptoms accept independent entries, with extra details expandable. Draft return preserves the member's values without stealing focus, and failed-save retries retain one operation identity. Existing dose/site history and owned doctor/PDF summaries are included in the same tranche.

This nine-path candidate remains in the #1065 lane for finite composition registration and exact-head gates. No production or native-store change has occurred. Validation: 42 focused tests and 377 broader tests pass; one existing real-model pilot test is skipped. Local Chromium at 380/1440 passes the logging, chart, return/retry, privacy and PDF cases; the frontend source gate and configured Worker dry-run pass. Live and physical acceptance remain with the existing owners.
