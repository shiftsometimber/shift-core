# HQ launch operations — 24 October 2026

Owner instruction: action notifications, audit and switch on required reporting, and action operations. Prospective partners have signed off the backend design; do not reopen that approval. Matt will handle MFA enrolment; readiness now covers all active HQ staff, not only owners. No forced MFA, member lockout, stock, checkout, payment mode or clinical-readiness changes are included.

## Implemented scope

Extend the existing permissioned HQ reporting Worker and Reports/CSV/PDF source. Preserve the production registration exclusions for audit-marked commissioning identities, internal Gmail aliases, app-review accounts and HQ addresses. Add medicine and combined shop/medicine order values, first-week usefulness, feedback coverage, operational ownership, privacy backlog, notification failure/unknown/approval counters, all-HQ-staff MFA counts and notification-job freshness. Keep unavailable costs/accounting/attribution labelled unavailable.

An event-to-review bridge captures NEW clinical case-outbox items, deletion requests, urgent/high support requests and signed callback failures every five minutes. It creates review intents only. An existing owner can prepare an exact draft from the private review page. Preparation atomically claims the event, creates the unchanged existing communications payload and audit entry; it does not approve or send. No historical events are backfilled. Existing direct authentication/order emails are not duplicated. Missing clinical source tables do not prevent independent queues.

Queue: https://api.shiftsometimber.co.uk/v1/hq/management/report/notifications/view
Reports: existing HQ Reports navigation.

Every new external message remains subject to Matt reviewing and approving its exact version, recipients and attachments. Native-device receipt, per-trigger controlled inbox acceptance, supplier execution and an actual owner/member live browser journey are not inferred from fixture tests.

## Operations action

Task 1 is a pending account-deletion request dated 1 October (request 246). It was assigned to Matt, with an audit record and explicit identity/retention/erasure/reply next steps. Original due date retained; task/request remain open. No erasure or member communication was performed. Private before/after receipts are in SST/backend-audit-20261024.

## Verification

10 new SQLite tests pass, including live/test/currency/period separation, missing-source failure, per-role denial, event replay prevention, event cut-off, owner-only draft preparation and audit rollback. Existing management acceptance passes. Desktop/mobile notification review and full draft preview pass on fictional intercepted data in headless Chrome. The compiled Cloudflare stage accepts production compatibility date 2026-09-11 and returns the expected anonymous 401 and unrelated 404. The local Miniflare check could not start: the installed workerd supports dates only through 2026-07-21. Production compatibility was not downgraded and the existing runtime test was not edited.

Read-only evaluation against production D1 returned 1 reportable registration for 1–24 October, 876 explicitly marked test accounts within 881 total records, zero unassigned tasks after assignment, one pending deletion request, and three active staff without MFA. This is a direct aggregate/source check, not an owner-authenticated browser receipt.

## Release guard

Deployment is limited to shift-hq-reporting and its two existing report/export route patterns. Preserve CORE and DB bindings and capture prior deployment/schedules. Require exact source/bundle identity, passing focused tests, the production-compatibility cloud-stage receipt, and unchanged route ownership/deployment at activation. Initialise only additive notification tables and an activation cut-off. Start the observer cron only after live source checks. Rollback restores the captured Worker version and prior schedules; retained queue/audit data is preserved.

Final release receipts and actual activation/verification results must be recorded before claiming deployed or verified.
