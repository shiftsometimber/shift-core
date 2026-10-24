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

## Final v2 verification

The cancellation-aware release was verified live at 2026-10-24T14:10:15.878Z. Code source 1cdc4ba7fd0c311b8b8b6f51a6b3a9627c611a61, bundle 4e24711116c2434e5e067f1f1f8ed79b5830b9f4a8be7f2c90b13947ba10be05, deployed Worker version 9605c6d1-5185-40d2-9fac-7ff0a4bdd5a3. Protected live routes return the v2 marker and anonymous 401. Read-only production evaluation confirms overdue tasks=0, unassigned tasks=0 and pending deletion requests=0. The five-minute schedule was preserved. Eleven focused event/report tests plus the unchanged management acceptance pass; together with the earlier unchanged auth/medicine/refund and navigation/communications suites, 75 focused checks passed across the release.

## Coordinated completion — prepared successor, not yet deployed

Shared run 40097051276 remains active under the existing verifier 37419 and exact source 2ac8456e. No main merges or production releases have been made by this completion pass. The two existing feature branches remain the working checkpoints.

Prepared reporting v3: common staff/test/reviewer exclusions across registration, commerce, activation and continuity; exact live-checkout prefixes; cross-channel first-paid/repeat-member cohort with explicit denominator; unavailable separate service billing, accounting and cost sources; operational resolution/ownership and support resolution measures; read-only delivery history with source coverage, truncation, retained references and no inferred receipt; persistent owned exceptions, acknowledgement separate from resolution, recurrence and audit; explicit scheduled/manual observer origin and overdue health.

Prepared communications successor checks an event-linked immutable draft against its authoritative source and recipient immediately before transport. Existing manual/direct transactional paths retain their own behaviour. It must be released before the reporting bridge begins producing event-linked payloads. Forty-five existing/new communications, support and pathway recording-transport tests pass; no real message was sent. Reporting/cohort suites: 48 pass; unchanged management acceptance passes. The new notification page passes fictional Chromium checks at 390 and 1280 pixels. These are not production signed-in or device receipts.

Live member login: direct API correctly required CAPTCHA; normal Safari Test-account login then returned invalid credentials once. Password input cleared; no repeated guesses, reset or verification message requested. Resume with Matt signing into existing Test account in the dedicated Safari window rather than altering account credentials.

Historical orders: private read confirms 12 null-account/no-customer-email records, all cancelled/failed. Stripe independently confirms order12 checkout expired unpaid, test mode, no customer/payment intent. Eleven have no checkout/payment reference; they remain unclassified and are not linked or deleted. Connected Stripe access currently exposes test mode only; live fees/settlements cannot be claimed reconciled.

Commercial evidence recovered: Primed 6 October medicine prices, cold-chain delivery GBP9.99 and non-cold GBP5.99; 13 October correspondence confirms SHIFT merchant/customer relationship and two-way API docs still being upgraded. Prescriptr/LoopRX 20 October PDF is indicative/subject to contract: GBP300 monthly from go-live plus all-orders monthly-band prescribing/platform charges (GBP6.70 at 0–250, falling to GBP4.90 at 2,000+), exVAT; setup free; a reviewed consultation is chargeable even if not prescribed; video GBP120/hour in minimum two-hour clinics; one monthly invoice14-day terms. These are quote evidence, not an accepted provider selection, incurred order costs or an authorised commitment.

Clinical successor: hq-partner-operations-20261024 is actively developing persistent internal commissioning on the already deployed portal. Its14:23 release checkpoint7288bc8b has real staff onboarding, clinical and dispensing off. Do not duplicate or overwrite that work. Design sign-off remains accepted. Website Control's verified backup includes successful isolated imports of all four databases; full hosted service recovery, unavailable secret values/DNS permissions and independent key custody remain distinct. Timber Shed's serving worker is confirmed deliberately allowlisted to Test member11245, mapping into fictional isolatedDB; public landing is presentation only. No real community store or general member activation is implied.

Prepared HQ security source prevents setup from disabling existing MFA, makes setup/enable conditional against concurrent changes, checks the HQ origin and consumes login challenges once. It changes no account settings and enforces no new enrolment policy. Core deployment and actual recovery/fresh-login acceptance remain outstanding; Matt retains personal MFA enrolment.


## Completion checkpoint — 24 October, 16:10 UTC (prepared, not deployed)

The shared exact-source production workflow 40097051276 remains active at its original source-verification step. Existing verifier 37419 remains the authority. No unrelated main merge, production upload, scheduler change, email, account deletion, patient treatment or charge has been performed by this checkpoint.

Prepared reporting source now includes shared population exclusions, cross-channel paid-member repeat cohorts, ordered activation and mature return cohorts, explicit dated GA4/GSC imports (36-hour expiry; no automatic OAuth feed), unified retained delivery evidence, source-aware cancellation and owner-controlled exception resolution. Provider acceptance, attempted/unknown delivery, inbox observation and member read are separate. Clinical eligibility requires sharing consent, current state and assignment/credentials. The real partner outbox is joined to immutable audit events; internal commissioning content is excluded. Only an unattempted linked draft can be suppressed after source cancellation. Core, communications and support jobs have prepared individual execution receipts, without changing existing cadence or dispatch gates. Core MFA enrolment/challenge safety changes remain prepared only.

Current scoped checks: 34 reporting/notification/population/MFA/import/job tests; 70 original activation/auth tests; 46 communications/pathway/support tests; existing management acceptance passes; rendered review fixtures at 390 and 1280 pixels have no page errors. These are source/isolated proofs, not fresh production acceptance.

Recovered acceptance is retained: natural 12-hour expiry on 12 October rejected all four protected APIs and allowed a distinct fresh session while preserving the synthetic baseline; the scope did not contain populated feature histories. Exact original owner-approved commissioning email Message-ID matches an INBOX Gmail message; this is one original transport proof, not new event/composer or phone proof. No duplicate test message is required for those completed scopes.

Current genuine remaining access: fresh authorised member and HQ sign-in (normal member login rejected the existing test credential; HQ has no signed-in session), Matt personal MFA/recovery, genuine partner sandbox/configuration and physical-device acceptance. One unsent reply draft preserves Pete's 20 October pricing thread, To/CC and full chain; full draft is retained in backend-audit-20261024/completion-v3/approval-batch.json. Nothing sent. Indicative commercial terms are retained as quotes, not actual incurred costs or accepted commitments. Stripe connector exposes only the test account; no live settlement/fee source is available. Of 12 unlinked shop rows, one exact checkout is confirmed test/expired/unpaid; 11 have no account/email/payment provenance and remain unclassified. Preserve all history.

Latest authoritative source and exact bundle receipts must be recorded after commit. Cloud staging receipts from earlier revisions are preserved but do not attest to later edits. No action is closed solely on these prepared changes. A09 remains verified and closed; Apple reviewer account/access retained.
