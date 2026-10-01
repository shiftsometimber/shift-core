# Shift AI v2 — isolated synthetic coaching build

Base: `7917e61fc21246ac3f1d474f52eb161b22fd0501`. This adds only the 43 previously approved new-file paths. Existing production files, routes, auth, consent, shared styles, treatment gates and bindings are untouched.

Matt’s 1 October direction to action the proposed no-partner route is recorded in the append-only evidence log as an interpretation of his instruction. No fabricated clinical, regulatory or independent-review sign-off. No live launch.

## What runs

Prepared Today; confirmed and editable memory; one-tap accept/decline/outcomes; smaller steps, different approaches and wanted-confirmation; other-prescriber and stopped-medication modes; personal Life Back components and weekly assessment; chosen-day weekly offer; quiet hours, rolling touch cap and pause-after-ignore; audited synthetic calendar preview/write/undo; signed isolated test sessions; source revocation and deletion; atomic synthetic inference reservations; global off; full test-member night-job enumeration and rerun idempotency.

This version chooses from a finite reviewed-in-test action library. It does not call an LLM, train a model or browse for personal medical advice. Its “learning” is the saved outcome changing the next rule-based choice. It is a test implementation, not a claim that the full live product or clinical effectiveness is complete.

## Boundaries

No staffed clinical inbox, symptom diagnosis, urgency ranking, dose recommendations or promised monitoring. Fixed official support links are always available. A member-owned summary is explicitly unsent. Regex boundary checks are finite and cannot demonstrate universal detection. The open-message route is not an autonomous clinical triage service.

Pattern probes are synthetic, explicit tests only. No plateau, dose-gap or activity alerts run in the night job: thresholds remain unsigned. No medical cause is asserted. “No dose logged” differs from a missed dose; missing wearable records differ from less activity. Live Hume/Renpho, push providers, calendar providers, mate mode, Newsroom personalisation, offline media and location are not connected.

## Storage and privacy design

`COACHING_TEST_DB` is independent of production `DB`. One versioned JSON snapshot in `coaching_test_memory` contains logical coaching memory, readings/doses, actions/plans, message queue and simulated calendar entries. This is an explicit test-store design change from the earlier list of separately proposed tables, not a claim those tables already exist. Compare-and-swap commits all affected logical stores together; a stale mutation returns 409. `coaching_test_audit_events` stores minimal act records, IDs, reason codes and channel. `coaching_test_call_costs` stores synthetic reservations/settlements; SQL triggers enforce shared and member rolling limits before reservations. `coaching_test_control` holds the global dispatch switch.

Deletion removes the source and dependent plans/actions/queue/outcomes/calendar simulation; audit references are scrubbed without retaining the deleted text. The historical test-evidence exports intentionally remain, because they contain synthetic proof, not member data. A real retention schedule, full account erasure/export and controller review remain launch work. No retention duration or lawful-basis approval is invented.

DPIA design inputs: member facts may reveal health data; identify the controller and applicable special-category basis before real collection. Explain profiling and boundaries. Use per-source opt-in, immediate cancellation, account-scoped queries, least privilege, minimal audit, data provenance, missing/conflict handling and unsent briefs. Review account recovery, access logs, backups, export/deletion, retention, provider processors and breach handling before real use. Regulatory intended purpose remains unresolved; a non-clinical label is not a classification decision.

## Run locally

Node 24:

```sh
node --test preview/coaching-loop/*.test.mjs
node preview/coaching-loop/prepare.mjs
```

Open `http://127.0.0.1:8789`. Local fixture login offers only invented accounts. Test sessions are signed with an ephemeral secret. Do not expose the Node test server publicly. Hosted fixture login is disabled. Existing authentication is not changed or bypassed.

Set `COACHING_TEST_EVIDENCE_DIR` to choose the synthetic SQLite/evidence directory. Start a new directory after a schema change; this is not a production migration.

Browser proof uses Playwright; `COACHING_TEST_START_LOCAL=true` starts the server in the same test process. Install Chromium through Playwright or set `COACHING_TEST_CHROMIUM_EXECUTABLE` to an installed test browser. Optional packaged-browser loader uses `COACHING_TEST_CHROMIUM_PACKAGE`. The proof declares browser, emulated device, CPU/network and all 60 raw load measurements. Local timings do not establish production performance.

Wrangler 4.146.0 supports this build’s date; the repository’s 4.112.0 dry-run worked but its older runtime could not execute the date. Use a separate temporary toolchain; do not alter the repository package lock. Dry-run only with `preview/coaching-loop/wrangler.jsonc`. The all-zero D1 ID is a local-only placeholder, not an existing Cloudflare resource. No cron, deployment route, AI binding or remote binding is configured.

`verify.cjs` runs the bundled Worker in Miniflare/workerd with a local D1 database and disabled external requests. It expects `COACHING_TEST_WORKER_BUNDLE` and optionally `COACHING_TEST_MINIFLARE_PACKAGE`. No Cloudflare account or provider is contacted.

## Costs and release evidence

Keep US$2 shared/rolling 24h, US$0.05/member/rolling 24h and 3 touches/member/rolling 7d. No monthly cap. Every test reservation is labelled synthetic; no provider billing telemetry is claimed. No paid model calls are made. The test reservation cap does not prove the existing live gateway covers all calls or hosting charges.

`coverage.json` distinguishes engineering proof from independent acceptance. Original clinical criteria are replaced only in this narrowed scope; prior BLOCKED records are not rewritten. All specialist approvals, real provider integrations, full criteria evidence, production performance, approved source-passage manifest and launch approval remain unverified where stated. Weekly build logs append changes, before/after comparisons and removed behaviour. The first build has no earlier executable baseline; do not invent one.
