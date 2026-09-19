# Health Passport v1 — isolated implementation preview

Parent production release: `2d257d61ae1276c404de5e265a028040cb422aad`.

This implementation is deliberately gated behind both `HEALTH_PASSPORT_V1_ENABLED=true` and `MEMBER_EXPERIENCE_V1_ENABLED=true`. The new flag is not enabled in production. `schema.sql` is an explicit additive migration, not part of an automatically applied production migration set.

## Implemented scope

- Start Here's four preference groups can be retained, only on explicit request, in the current tab for 30 minutes. The two legacy medicine-match cache writes retain recommendation keys but no raw answers. Medicine matching, next-page destinations and clinical/payment rules are unchanged.
- The member reviews the exact account and answers, confirms the handoff, and passes the existing optional-health-tracking consent flow before a durable save. The API also checks consent within the atomic SQL write and requires the expected account ID. Old or switched-account drafts cannot silently attach to another member. The draft is cleared after save, discard, expiry on an active Passport/Start Here page, or successful wrapped logout. A closed/background tab may retain an unusable expired sessionStorage entry until the next access; it is never accepted after expiry.
- Passport reads the existing Journey baseline and priorities, dated measurements, MOT questionnaires, provider results, medicine order snapshots and current treatment context. It does not duplicate or infer a baseline. Dates, provenance, unknown provider and unreviewed result status are visible.
- Personal treatment/provider entries support add, revision-checked edit and removal. They do not alter prescriptions, orders, clinical status, doses, reminders or provider source records.
- Export adds all owned Passport entries, provider results and medicine order snapshots; existing export fields are preserved. Optional-health erasure includes personal Passport entries, not clinical/order source records. Account deletion cascades personal Passport entries.
- The active Journey V2 health-priority strip now reads consented `myJourney.healthInterests`; its previous automatic legacy preference write is removed. The old SHA-256 preservation contract is retained after normalising only the exact reviewed replacement block.

## Proof boundaries

`records.test.mjs` uses the actual authenticated route handlers and SQLite, including consent races, concurrent saves, stale revisions, another member, missing schema, limits, privacy export and real erasure.

`preview-server.mjs` and `browser-proof.py` are **test-only**. They combine captured approved Start Here/member HTML and styles with the actual new client and actual authenticated Passport/Journey route handlers backed by isolated SQLite. Their login is a clearly labelled fictional fixture; unrelated dashboard runtimes are omitted. This is focused signed-in browser integration evidence, not a production login/payment walkthrough, not a claim that every My Timber feature passed, and not real patient data.

`capture-baseline.mjs` only reads public unauthenticated responses. No preview code imports or uses production credentials. Browser traffic is restricted to the local test server.

## Release gate

Before production: review the actual preview screenshots; run the full release matrix against the final commit; apply this one additive schema and enable the flag in an isolated deployment; validate real sign-in and the full dashboard/runtime composition; then promote once with preservation evidence and rollback. No clinical reviewer, clinical monitoring, treatment availability or partner integration is invented by this implementation.
