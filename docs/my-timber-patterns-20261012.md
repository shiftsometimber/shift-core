# My Timber recorded patterns — 12 October 2026

Matt approved the jab-context mockup at 12:25 BST and requested a working first version at 12:43 BST. This source extends the same codex/my-timber-journey-detail-20261012 candidate. It is locally verified, not merged, deployed, clinically approved or physical-device accepted.

## Working first version

Progress offers explicit per-request selection of treatment, food, Fit and Progress records. Treatment is required; other sources are optional. Changing a selection clears the previous results and chart context. The existing optional health-tracking consent, authenticated account and paused-Journey boundary apply. Reads recheck withdrawal and pause before returning derived records. No new storage, schema, settings, model activation, provider call or paid service is used.

Jab and symptom dates align beneath the selected measurement chart. Dense dates retain their original positions and group their tap targets; all individual events remain in an accessible selector. Historical dose strength remains unknown because legacy dose events do not capture it separately. Current prescription text is never assigned retrospectively to an old dose. Symptom onset is used when recorded; otherwise log time is labelled with unknown onset.

The server describes repeated 48-hour timing only after at least three completed non-overlapping jab windows and at least two windows containing symptom records for the same treatment. Missing symptom logs are unknown. Explicit no-symptoms entries are not proof of a whole symptom-free window. Timing does not establish causation.

Food/Fit/steps/sleep comparisons require at least eight paired recorded days, with at least three symptom-entry days and three explicit no-symptoms-entry days. Results show descriptive medians, sample counts and supporting dates. These are not proven correlations, statistical significance, forecasts or medical assessments. Food notes and latest protein snapshots are member reports, not full-day verified intake. Grub meal selections/plans are excluded. Fit counts are individual exercises marked done, not inferred sessions; missing movement is not zero. Records currently cover a bounded 84-day view, latest 1,000 treatment events and 1,000 selected Progress entries, with an omission warning.

Ask Timber's explicit pattern action reads current owned evidence and gives a deterministic factual explanation through the existing assistant route. Existing urgent handling remains ahead of this action. Unrelated ordinary AI answers remain unchanged. This first version does not use a generative model to infer causes. No autonomous monitoring, proactive alerts, dietary/medicine advice or paid inference is enabled.

## Evidence

- Focused pattern tests: 14 passed, no skips/failures.
- Broader member/Progress/AI regressions: 379 total, 378 passed, zero failures, one existing real-model pilot test skipped. These are synthetic local checks, not a paid/model acceptance claim.
- Actual local candidate assets/routes in Chromium at 380 and 1440 px: seven acceptance groups, including 16 new listed pattern checks. Retains all prior quick-log, draft-return/save, dose-retry, PDF, expiry, units and other-account checks. No page errors or horizontal overflow.
- A real phone-width failure exposed overlapping marker hit areas; grouped targets fixed the interaction. The verifier uses an ordinary click, not force or injected selection.
- Ask Timber browser proof uses the actual application handler, with only the synthetic server's Origin translated to an allowed application Origin; production checks are not weakened. Real SQL tests separately cover signed-out, expiry, other-account isolation, source invalidity, consent withdrawal, pause and opt-out.
- Frontend source gate and configured Wrangler dry-run are required on the final tree. No deployment.

Receipts on SST Mac: /Users/shiftsometimberltd/SST/my-timber-patterns-focused-20261012.log; my-timber-patterns-final-tests-20261012.log; my-timber-patterns-browser-20261012.log; my-timber-patterns-source-gate-20261012.log; my-timber-patterns-build-20261012.log. Browser receipt: /Users/shiftsometimberltd/SST/my-timber-pattern-proof-20261012/receipt.json. Screenshots are internal synthetic QA, not physical-device proof.

## Guarded integration

The existing #1065 writer/release lane remains authoritative. No PR, issue comment, external communication, main merge or promotion is made here. Existing immutable checks and registrations must remain intact.

This increment adds four finite paths beyond the previously documented nine: ask-timber-v1.js; member-experience/treatment-patterns.mjs; member-experience/tests/treatment-patterns.test.mjs; docs/my-timber-patterns-20261012.md. The original frontend Progress, treatment routes and existing verifier are also updated. Combined candidate: 13 paths relative to base 91d6a15fec847ef7b1f6dc5828dee84853b3eb27. The same branch preserves the earlier ec0d1dd9c3b3eae3bb9bbae2ad75a4800776de46 source and receipts.

Release remains open until finite composition registration, applicable exact-head gates and one guarded same-source promotion have a terminal receipt, with refreshed served Progress/Ask Timber assets and signed-in mobile/desktop source selection, log-to-marker, descriptive patterns, explanation, denial/recovery and privacy proof. Existing native/store, clinical, support and ordinary entry/recovery acceptance remain independently open. Homepage, clinical prescribing, stock, checkout, configurations and keys are unchanged.
