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

## Verified production result

24 October 2026, 15:03 BST: reporting code source 6e312f395cafd434e6cbad8f975317548b5847af is deployed on shift-hq-reporting version 38a76b7b-f8ae-44ec-92ea-b5eb5781b858. Compiled SHA-256 ccf7621782c82ad08aec160faf409a7e65d5abe9f162d337ab002a83b3cd6cb2. All three protected report/queue/page routes returned anonymous 401 with the exact release marker. The temporary cloud stage was deleted.

The observer schedule is */5 * * * *. Initial manual reconciliation completed at 14:50:53 BST. Automatic execution completed successfully at 15:00:24 BST with zero pending new source events, zero generated messages and no recorded error. This verifies automatic execution, not per-trigger inbox receipt.

The private HQ Communications panel now includes Review notification events. Navigation-only source a5218f00 is preserved on branch feat/hq-notification-nav-20261024; its compiled bundle SHA-256 is 1a4b6c1e7850fac5dea715bfd5fb225ebecbaaf0b4434bdd8f2f735979e7541e. Route ownership and existing communication schedule stayed unchanged. Forty-three communication/support/pathway tests passed after this presentation-only change.

An initial reporting check was rolled back safely because it ran before the new version had propagated; the successful retry retained every source/version condition and observed convergence after a few seconds. A navigation-only check was rolled back because its cache-busting query bypassed the exact root Worker route. Exact root and index routes were compared with query variants, the verification URL was corrected, and the intended live page/link passed. No safety condition was removed.

The follow-up scope has 31 focused report/event/auth/medicine/refund tests plus 43 communications/pathway tests passing, management acceptance passing, and desktop/mobile fictional browser checks passing. A current production read verified one reportable registration, zero unassigned tasks after assignment, one still-pending privacy request and three active HQ staff without MFA. No emails, erasure, payments, clinical settings or stock changes occurred.

Remaining: member/owner live browser acceptance, any newly required exact email draft/recipient approval and per-trigger inbox/device receipt, accounting and cost/settlement inputs, verified analytics attribution, and Matt-led MFA enrolment. Partner backend design sign-off is accepted and is not reopened. The original audit/24-KPI workbook has been updated with the deployed scope and remaining work.

## Operations test-fixture resolution

Further review identified request 246 as the Apple app-review fixture, proved by the auth.apple_review_fixture audit marker and its designated test address. There were no shop, medicine, pharmacy or clinical order/case records. The stale test request was cancelled (completed_at remains null) and the task closed with audited reason; reviewer account, access and data were retained. No erasure or external reply occurred. Pending-request reports and notification intent eligibility now exclude cancelled requests. A new regression test covers cancellation. This supersedes the earlier open-task action without describing it as completed erasure.
