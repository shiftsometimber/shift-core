# My Timber v5: scoped core implementation

> Historical v5 scope and evidence are preserved below. The Version 6 approved service additions section is current and overrides earlier scope/availability statements. Current release checks and limits are in my-timber-v6-core-evidence.json; no release is claimed.

Authorised order: Matt's My-Timber-Work-Order-FINAL-v5-26oct.docx, 26 October 2026.

The member support relationship leads. Existing black, cream and ash-green six-page presentation is retained. This first phase adds a useful try route and connects prepared practical help, member feedback, readable memory, continuity and finishing to the existing consented Life Back record. It does not launch the Shed or a human service.

## Files and routes, listed before integration

New member-only modules: `member-experience/support-plan.mjs`, `support-plan-client.mjs`, `support-plan-pages.mjs`, and focused tests in `member-experience/tests/support-plan.test.mjs`.

Scoped integration: `member-experience/entry.mjs` serves the new route/assets and includes the scoped member script; `life-back-routes.mjs` dispatches the new operations through existing authentication, consent, revision and account checks; `life-back/next-shift.mjs` uses the same four-outcome feedback records. These are explicit member-runtime integration changes required by v5's canonical-adoption instruction, not permission to modify unrelated Core code.

Routes: `/my-timber/try`, `/member/support-plan`, `/assets/member-experience/support-try.mjs`, `/assets/member-experience/support-plan.mjs`, `/assets/member-experience/support-plan.css`. Reuse `/v1/life-back`; no new database, identity system, consent flow or scheduler.

## Exact limits

The try-it examples are labelled fictional and use no member API or persistent browser storage. Joining uses the existing sign-in/registration route. No answer is saved until a signed-in member deliberately saves it with existing optional tracking consent. This is not natural-language clinical interpretation. Initial selection is by the difficulty the member explicitly selects; arbitrary words do not justify inferred constraints.

Review frequency is an in-app preference. No push/email reminders, human follow-up appointment or availability promise is created. Finishing is explicitly member-confirmed completion of a personal goal/stage and never changes treatment or deletes history.

Private-memory deletion does not silently delete a published Shed post. The new Shed post-management link/removal action remains a phase-2 dependency; no end-to-end pass is claimed without it. Likewise, the five distinct real-member marks rule, moderation, reporting and community matching have not been implemented by these core changes.

The signed-out route has general usable examples, not a personalised meal guaranteed to satisfy a member's saved allergies or restrictions. A production integration must honour the canonical Grub/Fit preferences before representing an option as individually matched.

No homepage/public-navigation, payments, orders, clinical flow, catalogue, native-app or Google-download changes. No deployment, member contact, new account or spending. New support writes carry an expected-account precondition: changing sessions cannot silently apply an old screen’s answer to the new account. Preserve PR1439 and existing receipts. Broader source qualification was last observed cancelled, not passed.

## Required release interpretation

C1–C10 plus S1–S9 is 19 checks. Existing finite live synthetic-data/API and desktop-Safari evidence is preserved for its exact source. New source/model/API tests do not establish phone rendering, the complete first-visit-to-returning-member interface, staffed support, a community launch or independent usefulness.

Every feedback answer changes appropriate follow-through; helped may repeat a useful routine, and not-tried may keep a step. Five community marks must represent five distinct consenting real members. A small pilot cannot establish exclusive market claims. Remaining literal contradictions in the work order are recorded here rather than silently treated as completed implementation.

## Named human support: Matt’s subsequent decision

Matt has confirmed that he owns non-clinical member enquiries, is online every day, and will reply within one working day. Member presentation: “Message Matt at any time. Matt replies within one working day.” This is asynchronous support; it does not imply a live or emergency response, a clinical service, or confirmed 24/7 Shed moderation.

This supersedes the earlier unresolved human-owner/response-target decision. The existing HQ queue and claim/reply source are available for integration; no production ticket was created or assigned and no response-time delivery was newly verified. New implementation remains under the current deployment hold.

## Version 6 approved service additions

The latest approved support-service message overrides v5. Human support is app/account only, with a reference, Matt as owner and replies within one working day. Never show 24/7 or instant coverage. Away wording remains a draft for approval and no backup person is assigned.

New modules: support-records.mjs, support-review.mjs, support-service-client.mjs, support-prepared-options.mjs and member-support-contact.mjs within member-experience. Add focused support-service tests. Scoped edits extend the existing support-plan modules, Life Back route, and shift-coach/support.mjs and support-team.mjs. The existing six-page-recovery.mjs Contact SHIFT row is renamed Message Matt and points to the private app/account thread; urgent and prescriber rows keep their precedence. Existing member, consent, revision and HQ-role checks remain. The only added API route is /v1/member-support, backed by the existing support_tickets table; it sends no emails and requires no optional health-tracking consent. APP references identify app/account threads; legacy COACH records remain distinct.

Five saved items are editable/removable through the same member record. Helpful counts derive from source answers. Personal reviews use fixed rules with dated sources and require deliberate plan acceptance. Default fortnightly; weekly, calendar monthly, only on request and never are available. Selected intervals affect review due dates; no external notification delivery is claimed. Prepared member food uses the governed catalogue with existing Grub preferences; movement uses only that member's saved active Fit plan. No matching option means an honest review-choices state, not an invented personalised session or meal.

The latest work order is My-Timber-Work-Order-FINAL-v6-26oct.docx. C1-C10, F1-F5, R1-R5, H1-H3 and S1-S9 require separate evidence, including actual browser acceptance at 320, 360, 390 and 430 pixels. These source changes are not deployed or represented as a working member service.


## Browser-discovered v6 integration repairs

The first actual browser run found a missing account API loader on the standalone support page, duplicated first-visit forms and the legacy Today renderer replacing the new support slot. The scoped repair covers support-plan-pages.mjs, support-plan-client.mjs and support-service-client.mjs. It restores the slim feelings row using the existing check-in store, not a new record system. The only additional shared-file edit is member-experience/health-routes.mjs: an optional expectedAccount guard rejects a changed session before a check-in write. Existing consent and clinical boundaries remain. The private QA harness runs actual source routes against isolated fictional SQLite data, with read-only published recipe content; it sends no external messages and is not a deployment.

The same repair also joins the new dated support memory to six-page-recovery.mjs using an account-labelled internal event. The existing tap-to-reveal/off privacy controls remain the authority. Only the legacy Today presentation is hidden while the prepared support slot is present; retained tools keep their own tabs and handlers. Two regression checks cover the standalone consent loader and a changed-account feeling save.

## Matt deployment instruction and scoped service composition

Matt explicitly instructed: Cut the bottleneck, get this deployed and fixed please and LIVE. Release the core support service through the existing programme and member-document owners, preserving their original modules, bindings, schedules, clinical and commerce behaviour. support-release.mjs and support-markup.mjs are the narrow composition seams. Existing public website origins remain permitted for legacy Life Back calls; unrelated origins are rejected. The Shed loop and further ideas are excluded from this core release. Less effort must be objectively simpler; otherwise acknowledge no matching simpler recipe and leave out the new task. Rejecting an idea excludes its food format, not merely its filling.
