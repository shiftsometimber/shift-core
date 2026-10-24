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


## Completion checkpoint — 24 October 2026, 17:50 UTC

This section supersedes the earlier 16:10 prepared-only and unavailable-login descriptions. A09 remains VERIFIED/CLOSED: request246 and task1 cancelled/closed with audit; reviewer8573 retained. Later request247 is separate and must not be replayed.

### Actual deployed components and production acceptance

- Communications shift-hq-member-comms-20261023: source de04d9ec30b0f1ab4ca8e7d19b15651e6d49ee83, version3e84bfb7-0a89-40c0-addd-2e6e3f98c767. Authoritative event/member/case/consent/current assignment eligibility, primary-Matt approval and canonical clinical channel support; existing direct registration/order emails retained.
- Support shift-mytimber-support-20261023: same source de04d9ec, version240a70f5-f8b3-4d18-8f8d-11140c65d1b2. Minimal durable reminder delivery history, unique claim, cancellation/withdrawal/owned export and actual scheduled job receipt. Compatibility2026-10-23 preserved from actual production despite older repository configuration.
- Reporting shift-hq-reporting: source2e5efd95abbd3e2a457d9324a757f80f657b8958, version37942463-276e-4403-85c2-efd073cdf162, marker launch-operations-20261024-v3.1.77 measures/statuses, shared population, distinct shop/medicine totals, operational exceptions, available delivery histories and dated analytics imports. Actual medicine_stripe_events key uses stripe_event_id. Report v3.0 preceding versiona3b41145 is superseded. Routes/bindings/schedules/compatibility and rollback receipts retained.
- Owner-authenticated Safari: four report kinds200, delivery/notification/exception views200. CSV/PDF preparations returned auditRecorded true. Actual unchanged browser formatter blobs retained as actual-browser-report.csv (77 measures) and actual-browser-report.pdf (10 pages), valid parsed text and no out-of-page text. Safari OS download and native phone share remain unproved. This replaces the earlier unavailable-HQ-session blocker.
- Both already approved, verified member test accounts11251/11252 signed in through the normal CAPTCHA/form. Identity query with the other test ID returned the signed-in account. Logout returned /v1/me401. Correct website-relative /v1/my-timber-support and communications routes returned200 private/no-store. Initial API-host404 probes were wrong routes, not a regression. This is identity-query isolation, not full order/clinical resource acceptance. No password reset or credential change. The earlier rejected Test11245 login is not a current access blocker.
- Actual scheduled executions retained: communications17:30:09.600Z, support17:35:22.399Z, scheduled observer17:35:28.973Z. No all-member scheduler forced. Monitor medicine-Stripe coverage is now available. Ten Core per-job receipts remain unverified until the prepared Core code deploys.

### Shared release coordination and current source

40097051276 failed source verification before deployment:31 original source commands passed; step005 historical workflow blob comparison and step012 final AI changed-path admission failed. Original passing tests were retained, not relaxed. Failure artifact12566677737 and source logs are retained.

Existing release owner repaired admission with435de8bf/PR1416, exact tested tree merged as200ff3dd4c4e01505f418e31149389da0f81fe80. Current shared run40113641714, promote job120930387648, single verifier67863 remains active at original source gates; deployed/verified false. Core remains versionac4e60d9-6f40-4bd5-a96f-83d6108dd716. No duplicate watcher, unrelated main merge, Core upload or branch-protection change. Future source admission must preserve PR1414 immediate deletion, PR1415 login/password changes and native/clinical successors.

A finite14-file Core patch was cleanly applied to exact current main in an independent clone /SST/backend-current-source-20261024, branch feat/backend-completion-current-20261024, commit5d56b397.60 focused auth/commerce/medicine/MFA/job/refund tests pass and Wrangler production dry-run compiles. Current My Shift/native/member-experience/release/.github paths match200ff3 exactly; no stale whole-file overwrite. This is prepared source, not full source admission or production deployment. Native/clinical source still advancing requires finite rebase after current guarded release, not an assumed pass.

Operations branch now includes the exact original24-KPI catalogue/view v3.2 and unknown-order ownership/source-age/due-time regression. Current source was8d4f3f88 before this handover commit. New auth_delivery_event_links projection connects future medicine direct-mail event/template/recipient roles to actual auth row IDs. The staged/deployed marker must be checked against exact current bundle SHA, not just a source HEAD label. A sparse-checkout missing-config dry-run failed and a3c809200 stage receipt using the old bundle was invalidated; no production promotion occurred. Rebuild and replace it with actual current bytes. Older receipts are preserved as historical, not current proof.

Communications branch3c809200f2c9b626a39ad4f9683c94b197d95f99 additionally rechecks verified/open member eligibility before manual approved email dispatch.49 focused communications/support/pathway tests pass. It is not the currently deployed de04d9ec code. Do not mistake the unchanged marker for a new compiled bundle.

The active immediate-deletion owner source did not yet erase new support history/state/devices on Core-direct deletion. A narrowly scoped integration is prepared in independent clone /SST/backend-privacy-integration-20261024, branch feat/backend-privacy-integration-20261024, commitabfdb9e2: optional owned support steps/devices/history and dependent deliveries are deleted in the same D1 transaction.9 unchanged/new immediate-deletion tests pass, including other-account preservation. Original owner checkout is untouched; apply only this two-file patch to the admitted latest PR1414 successor. Base and patch are in completion-v3/privacy-support-integration-base.json and privacy-support-integration.patch. No real deletion was run.

Latest partner checkout remains owned separately. Its pending notification-management.mjs channelOutcome was narrowly corrected to distinguish failed/unknown, explicit provider acceptance and in-app publication; retained transport outcomes precede late supersession.8-case contract test passes. Do not commit/reset its unrelated dirty work or call its internal commissioning a genuine partner connection. Real clinical/dispensing/staff flags remain off and no stock position changed.

### Exact approvals already prepared; nothing sent

Two immutable HQ drafts for approved test member11251 / obriens@sky.com are status draft, with approved_by and approved_at null:

1. ad32fd11-f45b-4eee-b82b-d71600474748 / hash8bdeb1bbd8f8a83ab2028c30d1f806a66ab12abfcd0470da85f686cb283f92b6: SHIFT HQ — controlled launch email test.
2.6c5c0ba2-c56d-4c05-aeca-558dc7901b47 / hash54f86e27cb3c54a5113b8aa906ff00d03b64a4af2cc55ec46bca951cd81a2818: SHIFT HQ — controlled launch app test, including exact neutral push fields.

Full To/CC/BCC/subject/body/attachments/push payloads are retained in prepared-notification-tests.json and the SAME updated audit. Existing unsent Outlook RE: Pricing - Shift some Timber reply to Pete, CC Sam/DM, retains its exact body and original correspondence chain in approval-batch.json. Matt must explicitly approve and instruct sending each exact version/recipient; changed/expired drafts require recheck. No new email/app update/push/WhatsApp sent. No device registration exists for the test recipient, so in-app publication must not be called closed-app push receipt.

### Precise remaining external and acceptance requirements

- Genuine clinician/pharmacy sandbox configuration, callback identities/authentication, test clinician/dispensing assignments and approved facilities remain unavailable. Matt's partner design approval is accepted. Use the existing prepared reply for missing technical docs/configuration; no supplier commitment.
- Actual live Stripe read access is absent; current connector is test acct_1U6VxPHQNi0GiuyK. Live fees/settlements/cash reconciliation and accepted actual costs remain unavailable. Original Primed/Prescriptr quotations recovered; do not ask Matt to repeat them or book them as incurred expenses. Seller/VAT/accounting and service-specific repeat-window decisions remain to be recorded.
- Order12 exact test checkout is expired unpaid with no customer/payment intent. Orders1–11 are cancelled/failed, no account/email/checkout/payment ref. They require the original20 Aug commerce import/provider audit. Prepared monitor owns these unknowns with Matt, five-day deadline and source age; never delete/fabricate links or call them real revenue. Actual4 Sep checkout.session.expired event evt_1UBqebHQNi0GiuyKjTl8NF7N retains an old order_reference_registry D1 multiline-exec error. Current source fixes D1 statement separation but is not serving Core; preserve error until evidence-backed reconciliation. Event is outside normal30-day provider event listing; no unsafe replay.
- All current four HQ roles are owners, MFA0/4. Shared setup uses authenticated staff context for every role, not owner-only. Matt enrols/recovery-tests one account at a time after safe source release, keeps a working emergency owner, proves a fresh login, then applies the agreed enforcement. Do not reset passwords, expose secrets or enforce before recovery.
- Full24 KPI acceptance still depends on classification, live accounting/costs, substantive human-response/member-resolution events and genuine partner state times. Imported GA4/GSC source windows/timezones and36h expiry are retained; automatic OAuth refresh remains unavailable. K05 is not registrations, K15 is not selected-period repeat paid orders, K19 is not summed overlapping source rows, and K24 is not partial SQL drill age.
- Live details/GP, saved follow-through, orders/clinical evidence, resource-level account isolation, export/withdrawal/closure and role/session revocation still require the remaining bounded cases after the admitted new source. Preserve valid12h expiry and device proof; no duplicate overnight test. Physical closed-app notification/tap/opt-out/revocation and native PDF-share require a consenting phone; Health requires an isolated synthetic Health store.
- Existing Website Control backup proved encrypted archive integrity, four isolated SQL restores and859 Pages hashes. Full hosted service/private assets/config/business journeys and rollback remain blocked by original secret provisioning (especially HQ MFA encryption key), denied DNS/security export access and independent off-Mac recovery-key custody. Continue that project, no competing backup.
- Timber Shed remains deliberately approved test-only/synthetic, no general community production data connection. Use the intended approved real store/eligibility/moderator configuration before general commissioning; retain existing navigation/access decisions and verify moderation/report/reply/erasure there.

The SAME audit/workbook are updated with24 original definitions,18 trigger families,16 action IDs and exact approval payloads. Only A09 is fully closed. Record final current heads/build hashes/stage receipts in completion-v3 and backend-completion-coordination.json after this doc commit. No final launch sign-off while the above requirements remain.


## Independent production completion —24 October18:16 UTC

Matt explicitly authorised independent guarded component releases. Current-main200ff3 and serving Coreac4e60d9 were checked immediately before each action. Original Core gates were not changed. Communications3c809200 deployed as86ea1245-323c-4118-9fdb-941d77fd465d; actual scheduled completion18:10:11 UTC.

Reporting own3c65347b uploaded as5d8ba9ef at18:06:53 UTC. A concurrent HQ owner uploaded newer b999515b two seconds later, sourcea33a5108 merging the full operations branch. The marker mismatch caused own rollback to old v3.1; the newer approved version was immediately recovered. Rollback now asserts that the active runtime still equals its own upload before changing it. Preserve b999515b and the HQ snapshot owner; no further reporting upload by this task. Evidence concurrent-reporting-preservation.json.

After preservation, authenticated production returned v3.2 with83 measures and24 original KPI definitions, the private KPI page200 with24 cards, and both CSV/PDF export preparations200 with auditRecorded true. An arbitrary8-second probe initially aborted the KPI page; unrestricted normal fetch subsequently succeeded. OS/native download/share proof remains separate. Monitor completed18:10:24 UTC with historical orders source available; unknown-order owner/deadline/escalation handling is live. Original eleven-order provenance is still unavailable. Both exact test drafts remain unapproved and unsent.

Existing release owner has now identified actual source tasks012 (original165/108 test groups then b1-release-scope; previous5471seconds) and005 (growth-preflight; previous3739seconds). At18:07 they had been observed active for25minutes; child progress is not exposed by parent heartbeat. No failure/lock/deadlock evidence supports cancellation. Original candidate and single verifier remain preserved; Core remains undeployed. Do not duplicate recovery.

Latest native sourceb835649f is newer than the prepared support erasure integration base; its optional support history cleanup is still missing. Integrate only the finite abfdb9e2 two-file patch into the approved latest PR1414 successor, with current checks, rather than copying the earlier full file. No real deletion or reviewer erasure. A09 remains the only wholly closed action. All missing partner/finance/classification/device/MFA/recovery dependencies remain exactly as recorded in the SAME audit/register.
