# My Timber daily treatment detail — 12 October 2026

Status: built and locally verified; not merged, deployed or accepted on physical devices.

Matt authorised progressing the existing app at 07:54 BST on 12 October after reviewing GLP-1 Tracker: My GLP1 Journey. This is an additive first tranche within the existing #1065 source/release lane. It extends My Treatment and points to the existing Journey, Progress, Life Back and Grub destinations. It does not create another master queue or claim another chat has been commanded.

## User-visible changes

- Dose logging optionally records the actual injection location for Mounjaro, Wegovy and liraglutide. Current shows the most recent recorded dose/time/location. Older entries stay valid and missing sites stay unrecorded.
- Treatment check-ins can record how symptoms affected the member's day and their reported start time.
- Optional expandable food notes, protein estimates and water snapshots support a quick daily record. These are snapshots, not a complete intake diary, nutritional targets or totals inferred by adding repeated check-ins.
- The new Timeline puts doses and check-ins together with treatment and period filters. All entries remain member-reported. The diary is not monitored and does not establish symptom causation.
- The doctor summary/PDF includes the same new recorded fields. Medical disclosures stay excluded by default. Nothing is sent automatically.
- Clear links lead to the current Journey, measurements/photos, Life Back and food tools. Existing progress assets and Life Back calculation are retained.
- Appetite and energy require an explicit choice on a new check-in; a default no longer creates a reported Usual value.

## Source and protected baseline

Repository: shiftsometimber/shift-core.
Branch: codex/my-timber-journey-detail-20261012.
Base: 91d6a15fec847ef7b1f6dc5828dee84853b3eb27, the current #1334 terminal serving source at preparation time.
Worktree: /Users/shiftsometimberltd/SST/shift-my-timber-journey-detail-20261012.

Exactly six paths:
1. member-experience/treatment-detail.mjs
2. member-experience/treatment-page.mjs
3. member-experience/treatment-routes.mjs
4. member-experience/tests/treatment-detail.test.mjs
5. member-experience/staging/verify-treatment-detail.mjs
6. docs/my-timber-detail-upgrade-20261012.md

Existing event JSON stores and existing optional-health export/erasure are reused. No schema or runtime configuration changes. Homepage, public content, primary app navigation, prescribing, medicine availability, checkout, stock, notification implementation, native packages/keys/testers and release guards are unchanged.

## Actual validation

- Focused suite: 27 passed, zero failures/skips.
- Existing My Treatment integration suite plus all member-experience tests, discovery repairs, AI-connected member and schema/release tests: 362 passed, zero failures, one existing real-model pilot test skipped. No real-model call or paid provider use.
- Actual local Chromium with real candidate HTML/CSS/runtime and real treatment routes over an in-memory synthetic database: 380 and 1440 px. Save, failure/retained-fields/retry, symptom/food/protein/water records, keyboard timeline, 28-day/full-history filters, text-only rendering, local PDF download, reload persistence, links and no overflow passed. Local expired-session record clearing and no duplicate dose on retry passed.
- Candidate Worker compiled through the existing Wrangler dry-run. No deployment occurred.
- Module and emitted-browser JavaScript syntax and git diff --check passed.
- Browser screenshots were inspected internally; no screenshot deliverable or physical-device acceptance is claimed.

Receipts on authorised SST Mac:
- /Users/shiftsometimberltd/SST/my-timber-detail-tests-20261012.log
- /Users/shiftsometimberltd/SST/my-timber-detail-regressions-20261012.log
- /Users/shiftsometimberltd/SST/my-timber-detail-build-20261012.log
- /Users/shiftsometimberltd/SST/my-timber-detail-browser-20261012.log
- /Users/shiftsometimberltd/SST/my-timber-detail-proof-20261012/receipt.json

Local browser command:
TREATMENT_PLAYWRIGHT_PACKAGE=/Users/shiftsometimberltd/SST/shift-rollout-grub-safety-20261006/package.json TREATMENT_DETAIL_PROOF_DIR=/Users/shiftsometimberltd/SST/my-timber-detail-proof-20261012 node member-experience/staging/verify-treatment-detail.mjs

This is local candidate evidence. Existing production and physical acceptance receipts are preserved; they are not silently rebound to changed source.

## Exact release handoff

Existing #1065 owner must:
1. Recover the branch and current serving/main state; rebase only when the serial lane permits.
2. Add a finite composition registration for exactly the six reviewed paths. Preserve the immutable inner verifier, prior source registrations, negative drift tests and original failure receipts. No guard weakening or blanket allowlist.
3. Require every applicable exact-head gate and candidate browser suite to pass. Then use one same-source guarded promotion through #1065.
4. Close software delivery only on terminal releaseVerified and current live asset/source identity, anonymous API denial and signed-in mobile/desktop dose/check-in/timeline/PDF read-back.
5. Keep actual iPhone/Android, closed-app reminders, PDF share/save/cancel and HealthKit/Health Connect acceptance with their existing holders and sole receipt sheet. Recheck only affected native UI/PDF behaviour; do not withdraw a review, upload a build, reset a key or change access.
6. Retain open ordinary entry/recovery, real support, broader Shift AI safety/operating and elapsed-expiry browser/persistence requirements.

No merge, deployment, external communication, paid generation or store change is claimed.

## Next product increments

- Extend convenient food logging inside existing Grub so it works independently of treatment; distinguish planned food from food actually eaten and keep missing nutrition distinct from zero.
- Develop editable photo-assisted food estimates only after an exact cost/privacy/data-retention design. No paid model, image upload or supplier activation is authorised by this local implementation.
- Bring existing measurements, progress photos and Life Back into a clearer common journey overview using their current data/consent/source rules, rather than a competing progress score.
- Evaluate usefulness with real first-use and mature week-four return/helpfulness denominators, separate from synthetic QA. Recruitment and all communications still require the approved complete draft and recipients.

## Proposed draft PR — not created or sent

Title: Improve My Treatment dose history and daily records

Body:
Members can now record where they injected, review their last recorded dose, and see doses beside symptom and daily food/water check-ins in a filtered treatment timeline. The same optional details appear in their owned doctor summary/PDF, with disclosures still excluded by default.

This additive first tranche reuses existing member event stores and privacy controls. The six-path source is prepared for the existing #1065 owner to register through the finite composition guard before integration; no production or native-store change has occurred.

Validation: 27 focused tests pass; 362 broader regressions pass with one pre-existing real-model pilot test skipped. Local Chromium at 380/1440 verifies saves, failed-save recovery, keyboard/filter behaviour, owned PDF download, reload, expired-record clearing and text-only rendering. The configured Worker dry-run compiles. Live and physical-device acceptance remain with the existing release and device owners.
