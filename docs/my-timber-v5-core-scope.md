# My Timber v5: scoped core implementation

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
