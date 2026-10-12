# My Timber — useful progress and private journey, 12 October 2026

This extends the same `codex/my-timber-journey-detail-20261012` candidate at `6f1cbe8a34035d6345f39a230478b32c3f9b99ab`. It preserves the earlier quick logs, charts, dose context, descriptive pattern rules and factual Ask Timber explanation. It is source preparation, not a production or installed-device receipt. The current master retains #1065 release composition and all communication, clinical, consent/policy, cost and publication holds. No new branch, PR, external message, model call or paid service is created.

## Competitor benchmark and useful value

Primary public product material checked 12 October 2026: [Shotsy](https://shotsyapp.com/) documents dose/site/side-effect records, charts and clinician PDFs; [MeAgain](https://meagain.com/) documents quick nutrition capture and journey cards. Earlier official-store comparisons are retained, not replaced by hands-on acceptance claims. These are vendors' advertised functions, not independently tested outcomes or proof that SHIFT leads the market.

| Need | Working candidate behaviour | Boundary |
| --- | --- | --- |
| See where recorded weight is heading | Optional four-week chart extension and historical slope scenarios | No promised weight loss, probability interval, target date or treatment advice |
| Avoid discovering stock is insufficient too late | Member-confirmed quantity, prescribed interval, quoted provider lead time and optional do-not-use boundary | Missing logs trigger confirmation; recording an order never means dispatch/delivery; no automatic order |
| See a personal journey | Private dated original photos, optional weight/Life Back note, date lookup, compare two dates and permanent individual delete | No body scoring, generated transformation, public share or photo analysis |
| Record actual food quickly | Independent Grub eaten-food entry; optional protein/water amounts; reuse a recent food after editing; delete | Choosing or planning a meal is not intake; no medicine record required |
| Keep symptom detail useful | Optional fixed symptom choice, member severity 0–10, retained impact/onset and personal wording | An unmonitored diary, not diagnosis or clinical monitoring |
| Retain historic strength accurately | Optional member-recorded strength on each dose event, surfaced in last dose, timeline, PDF and chart context | Legacy strength stays unknown; current prescription text is never backfilled |
| Bring records with you | Exact-format kg/date CSV preview, explicit confirm, atomic import with same-date existing Progress readings kept; CSV download of available recorded weights | No guessed competitor format, imported prescriptions/doses or silent overwrite; wider account export remains separate |

The product direction is a useful personal Progress view connecting records, actual food, descriptive symptom context and optional Life Back moments. Market leadership is an ambition; usefulness still needs genuine member evidence. Today remains the existing spine, and extras stay expandable. No extra daily questionnaire or mandatory photo/forecast setup.

## Informational models

Weight projection uses at least eight distinct recorded days spanning 28 days, within the recent 57-day window, with the latest reading no more than eight days old. Median pairwise slopes use pairs seven days apart; the 25th/75th percentiles describe historical slope scenarios. The extension is limited to 28 days, declines sparse/stale/unstable/steady data, permits either recorded direction and does not assume a medicine causes the trend. These are conservative product heuristics, not clinically validated prediction thresholds. The classic browser asset has a parity test against the pure module. Recorded and projected values remain visually separate, with existing units retained.

Supply uses the projected remaining quantity from actual member events. Its check-by date is the first scheduled dose uncovered by quantity or the recorded do-not-use date, less the provider's quoted lead time. Actual logged doses can advance the informational estimate without writing a new prescription or schedule. A missed/past schedule is not evidence of a taken dose. Pause, stale assumptions, expired usable supply and recorded orders produce explicit states rather than fabricated stock/delivery.

## Private data and source changes

Existing original-photo storage is reused. New uploads are resized/re-encoded locally, capped at 512,000 bytes (650,000-byte bounded multipart intake), signature-checked and kept outside every AI/model call. The candidate adds `note` and a unique account/operation identity to the existing lazy photo schema, an account quota of 60 photos and explicit replay-conflict checking. Lists return metadata, images require authenticated ownership/current tracking consent and unpaused Journey and return private/no-store/nosniff headers. Private blob URLs are revoked on hiding/closing/re-render. Delete physically removes the owned original row; the old soft-delete retention boundary is not labelled solved without the owner's applicable policy/backup acceptance. Historical soft-deleted rows are not resurrected by replay. No public image URL is generated.

Independent food entries use one additive `member_food_entries` table. It is included in the active optional-health-erasure route and Journey deletion; privacy account export includes food entries and original private photo data. Imported weights use existing Progress storage with source `my_journey_import`; Journey delete covers them. Import and food writes retain origin, session, feature, optional-consent, pause, bounded-input, owner and replay boundaries; writes include current consent/pause SQL guards. Missing amount remains unknown and actual zero is retained.

The diary client mounts once in both the retained Grub workspace and the current Grub programme shell. The older workspace runtime does not attach to absent legacy IDs. Food entries join explicitly selected pattern context as food actually recorded as eaten, without being relabelled as a full-day protein snapshot. The wider selected-source pattern thresholds, causal limitations and deterministic Ask Timber delivery remain.

These functional changes are prepared for review; they do not establish an approved new retention policy, storage budget, backup purge or live consent/account-erasure acceptance. Clinical, privacy/source and release owners keep those gates before production. Existing native/store/HealthKit/Health Connect acceptance is not silently closed.

## Verification and exact release handoff

The final local receipts accompany this document's source commit. Unit/real-SQL, browser, source-gate and configured Worker dry-run results must be green on the final tree before it is marked locally verified. Synthetic fixture records and photos only; no real account/health records, contact forms, verification/reset emails or public posts.

The browser verifier retains every earlier quick-log, return/save, dose retry/count, PDF, pattern and account-expiry assertion. It adds optional projection, original-photo adapter and real save/compare/delete routes, CSV preview/confirm/download, and independent food save/reuse/delete at 380 and 1440 px. Synthetic HTTP Origin translation is confined to the local verifier, not application authentication rules. No force clicks or bypassed assertion. Browser proof is neither live acceptance nor physical-device proof.

Existing #1065 writer must register exactly the expanded finite payload, preserve all prior immutable verifier bodies, source registrations and negative drift tests, and obtain every applicable exact-head hosted receipt before a single same-source promotion. The latest master separately records the private 8811e13c preparation as unregistered; this candidate does not overwrite or claim to complete that independent proposal or any contact/native source. Refresh and reconcile those owner sources during finite composition, retaining accepted blobs and gates. No force push, main update, merge, public deploy or release-rule weakening.

Remaining native work: real widget implementation/shortcuts and installed-device acceptance remain with the native owner. Automatic photo nutrition estimates/voice/barcode recognition are not enabled: exact costs, reviewed data handling and correction/accuracy acceptance remain necessary. Import currently accepts weight CSV only, not every competitor's backup format. These gaps are explicit, not claimed as built.

## Final local receipt

396 tests passed, zero failures/skips. Nine browser acceptance groups passed at 380 and 1440 px, with no page errors or horizontal overflow. Actual current Grub page/client/CSS, photo adapter and owned handlers were exercised; wider Grub account/Daily responses were synthetic/unavailable, not live acceptance. Final frontend/original-photo gates and production-configured Worker dry-run passed. Final synthetic screenshots inspected internally. Receipt: `my-timber-progress-journey-20261012.receipt.json`, with SHA-256 identities of actual tested source files. Earlier browser failures were fixed in source, with all prior acceptance assertions retained.

Combined candidate contains 28 finite paths relative to the original base:

- `ask-timber-v1.js`
- `docs/my-timber-detail-upgrade-20261012.md`
- `docs/my-timber-patterns-20261012.md`
- `docs/my-timber-progress-journey-20261012.md`
- `docs/my-timber-progress-journey-20261012.receipt.json`
- `frontend/member/api-adapter-v33d.js`
- `frontend/member/member-progress-v1.js`
- `member-daily-v2.js`
- `member-experience/entry.mjs`
- `member-experience/food-diary-client.mjs`
- `member-experience/grub-runtime.mjs`
- `member-experience/health-routes.mjs`
- `member-experience/journey-portability.mjs`
- `member-experience/progress-journey.mjs`
- `member-experience/staging/verify-treatment-detail.mjs`
- `member-experience/tests/journey-portability.test.mjs`
- `member-experience/tests/progress-journey.test.mjs`
- `member-experience/tests/treatment-detail.test.mjs`
- `member-experience/tests/treatment-patterns.test.mjs`
- `member-experience/treatment-detail.mjs`
- `member-experience/treatment-page.mjs`
- `member-experience/treatment-patterns.mjs`
- `member-experience/treatment-routes.mjs`
- `my-journey-v1.js`
- `privacy-health-erasure-route-v1.js`
- `shift-visualise-v1.js`
- `tests/progress-charts.test.mjs`
- `tests/progress-photo-journey.test.mjs`

## Hosted repair, 12 October 2026

The original registered payload remains in Git history at ed7f9216931c829bd333830dc8c7596fa64f242a, maintenance 090bd16fc769d4219f32ff743a1b6856f2d8215c and sealed receipt a2883f0b6080b9b3a3eb5eda53986de742de76bf. This dated supersession fixes the owned Journey deletion source-marker compatibility, adds real SQLite cross-account deletion coverage, and restores full historical recipe proof objects in the continuity runner without changing its existing assertions. The prior main production release failed /help preservation because its already-registered exact 11 October support recovery had no pre/post normalisation. A finite three-block and urgent-anchor normaliser now compares that registered transition while retaining every other Help byte and rejecting partial, duplicate or drifted blocks. No support page content, contact sending, prescribing, checkout or stock is changed in this repair.
