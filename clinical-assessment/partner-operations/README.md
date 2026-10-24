# HQ people, clinical scope and dispensing — 24 October 2026

Owner request: build the proposed professional onboarding, permissions and dispensing workspace within existing HQ, matching the clinician look and feel. One joined-up order reference. This is an additive implementation, not clinical commissioning or a replacement pharmacy PMR.

## Surfaces

- `/clinical-portal/partners`: restricted HQ directory, partner organisations, applications, evidence metadata, verification, scope, activation/suspension/renewal and audit.
- `/clinical-portal/partners/application#<capability>`: limited, expiring application link. No HQ or patient access.
- `/clinical-portal/partners/activation#<capability>`: one-use password creation; no automatic patient access.
- `/clinical-portal/partners/sign-in`: allocated username, retained HQ password/session verifier and MFA challenge/setup.
- `/clinical-portal/my-profile`: own professional profile, scope and renewal information.
- `/clinical-portal/dispensing`: assigned partner orders, pharmacy decisions, preparation, courier tracking and audit.
- `/clinical-portal/partners/demo` and `/clinical-portal/dispensing/demo`: explicitly fictional, browser-memory-only walkthroughs, network blocked by CSP, refresh resets them. Demo roles intentionally combine privileges to demonstrate the separate approval steps; real HQ ownership does not confer professional governance permission.

No emails, invitations or WhatsApp messages are sent. Setup links are prepared for owner review, not dispatched. Fulfilment messages are durable **drafts**, not delivered notifications. The demo's stock toggle does not affect live stock.

## Security and data boundaries

Existing HQ identity is reused; no member session is accepted for staff endpoints. MFA required for professional/administrative reads and writes. Server permissions are separate from presentation. Each account has an immutable profile ID and allocated username; no shared pharmacy accounts. Credentials are hashed in the retained HQ-compatible PBKDF2 format; setup tokens are hashed, single-purpose, expiring and activation is one-use. No credentials or tokens enter audit snapshots.

Evidence is PNG/JPEG only, size/signature checked, stored using opaque private keys. Evidence viewing requires authority and a successful access audit, is inline/no-store, and fails when retention has elapsed. No automatic facial matching or AI identity approval is implemented. Evidence retention configuration and a tested purge/hold process are required before real uploads; expired access alone is not a deletion system.

Each credential change/renewal invalidates the old verification and scope version. Real register/identity/indemnity/competence checks are human verifications with references and expiry, not proof supplied by ticking a box. Professional scope approval requires a separately configured qualified reviewer and cannot be self-approved. Partner organisation approval is separate from individual approval. Mutations use optimistic versions and atomic audit writes; expiry/revocation is checked at use. Snapshot audits retain professional-state changes without storing the raw ID images in audit logs.

Clinical integration preserves existing assignment, evidence, sharing and revision boundaries, adds service/action scope checks, and binds permission/organisation versions into the case-event transaction. The current casework serves weight-management assessments only; listing a future area in the permission UI does not implement that clinical service.

Dispensing requires a trusted issued-prescription adapter, not a CRM decision. Same order/member/partner mapping is retained. Duplicate prescription handovers and conflicting order mappings are rejected. Partner staff see their assigned orders only; HQ oversight excludes patient/delivery details. Owners cannot perform pharmacy supply decisions using owner permissions. Preparation and dispatch require a current prescription and a fresh positive stock result. Courier links are constructed from an allowlist. Delivery confirmation/webhook ingestion is not yet implemented.

`memberFulfilment()` joins the order AND member identity into the existing case workflow. This is a tested integration seam; the separate My Shift deployment still needs its rendering/production acceptance against the commissioned service. No end-to-end live member delivery is claimed.

## Commissioning requirements — not silently switched on

The published worker permits MFA-protected owner/admin **internal setup** only: partner organisations, draft professional records and audit. It source-locks `PARTNER_INTERNAL_SETUP_ONLY:true`, blocks external application/activation links, files, professional approvals and scope grants, and hard-closes login/fulfilment plus the existing real clinical gates. Provider flag changes alone cannot activate a service.

Before a reviewed activation release:

1. Apply `schema.sql` to the intended DB using the existing additive migration process, with backup/rollback evidence. Requires retained HQ and clinical-casework tables.
2. Bind a reviewed private staff-evidence store as `PARTNER_PRIVATE_FILES`. Set the agreed retention policy (`PARTNER_EVIDENCE_RETENTION_UNTIL` for this implementation), privacy notice, lawful basis and tested purge/legal-hold process. Do not insert staff ID/selfie data into Git, public assets or fictional fixtures.
3. Commission named professional scope approvers (`PARTNER_CLINICAL_APPROVER_IDS`, `PARTNER_PHARMACY_APPROVER_IDS`) and verify their retained clinical staff record. Owner sign-off is access approval, not a substitute for competence assessment.
4. Complete actual-session username/password/MFA acceptance, rate-limit and recovery checks. Login remains separately off until this passes. Restrict legacy HQ user administration from altering managed professional identities outside this workflow.
5. Connect and verify issued-prescription, prescription-currentness, stock and pharmacy/courier adapters. The verifier is an internal integration dependency, never a browser-supplied declaration. Complete real partner isolation, exception and cancellation acceptance, including repeats and interrupted supply.
6. Review complete notification drafts, recipients/trigger policy, opt-in and WhatsApp template approval with Matt before enabling delivery. No sending consumer is enabled here.
7. Finish the shared HQ navigation insertion against the current HQ shell (another active workstream owns its root); these pages already use the HQ hostname/login and do not replace its root worker. Review the staff portal identity/access boundary together with the main API before enabling real casework.
8. Have the responsible clinical/pharmacy and privacy/security owners approve the operational service. UI tests are not compliance certification.

## Reproduce checks

From repository root:

```
node clinical-assessment/build-portal-release.mjs
node clinical-assessment/partner-operations/build.mjs
node --test tests/clinical-portal-release.test.mjs tests/clinical-casework.test.mjs tests/clinical-handover-readiness.test.mjs clinical-assessment/partner-operations/*.test.mjs
node clinical-assessment/partner-operations/browser-check.mjs
wrangler deploy --dry-run --config clinical-assessment/wrangler.portal-release.json
```

The browser harness uses an existing native Playwright toolchain and only synthetic records. It checks 390/1280px, inner panel padding/overflow, five independent checks, generated username, no-stock denial and fictional acceptance/preparation/dispatch, with zero external browser requests. The published internal directory requires actual HQ owner/admin MFA; professional onboarding, files, login and fulfilment return 503 even if provider flags are passed true.

## Persistent internal commissioning — implementation update

Matt explicitly authorised persistent private commissioning now, not only browser-memory demos. `/clinical-portal/commissioning` and `/v1/hq/clinical/commissioning` are a separate owner/admin+MFA workspace. They reuse the retained HQ identity service and recheck live user/session/MFA state inside mutation SQL. MFA enrolment remains a user action; nothing here fabricates or bypasses it.

Apply `commissioning-schema.sql` and `auth-limits.sql` additively. The commissioning tables have a separate namespace and fixed synthetic member/documents/medicine fixtures; APIs reject arbitrary patient inputs. They never insert into patient, prescription, actual fulfilment or actual message queues. The three workspace perspectives read the same versioned order and immutable event history. Clinical queries, synthetic responses and replacement revisions, individual medical-document outcomes, assessment rejection/sign-off, pharmacy queries/rejection, no-stock denial, test preparation/dispatch and withheld notification previews are implemented. The dispensing steps use the exact production `fulfilmentAction` reducer. Synthetic tracking never offers a real courier link. A test sign-off explicitly says it is not a legally issued prescription.

This is durable server-side acceptance tooling, not proof that the separate live member portal, clinical service, pharmacy or sender integration is commissioned. The local browser acceptance opens the real route against file-backed SQLite with a fixture HQ identity, then closes/reopens the database and reloads the page. Actual HQ session acceptance and live authorised writes are still unverified until owner MFA enrolment. The shared HQ root menu remains owned by its current workstream; a link is added within People & partners, not by replacing that root.

Professional sign-in additionally has database-backed per-IP, per-subject and daily attempt limits before credential/MFA delegation. Only hashes/counters are held; passwords, MFA codes and plaintext IPs/usernames are not stored in that table. Missing IP/storage and limiter errors fail closed. Expired counters are removed in bounded batches on authentication attempts; a complete retention/purge policy is still required before real onboarding. Real sign-in remains source-gated off pending actual-session/recovery acceptance.

Additional checks:

```
node clinical-assessment/partner-operations/commissioning-browser.mjs
```

Actual partner-directory preparation is now available behind HQ owner/admin MFA. Its UI hides upload, verification and activation controls while the server independently rejects those operations. This is separate from the synthetic order acceptance workspace. All real-service gates and the separate main release are preserved. No messages, invitations, charges, scheduled jobs or customer enrolments are created by these changes.

## Evidence retention implementation

The existing private R2 store is bound under `PARTNER_PRIVATE_FILES` as well as the retained clinical binding; staff objects use an isolated `staff/<profile>/<opaque-id>` namespace and existing admin-only audited access. This is logical separation within the same private bucket, not a claim of a dedicated storage account. Real uploads remain source-blocked in internal preparation; no retention date/policy is invented and no real images have been collected.

`evidence-retention.mjs` adds a non-destructive expiry/hold plan, independent audited owner hold/release actions, and a two-phase explicit deletion operation. The deletion intent is committed before private-store deletion; failed storage deletion remains pending for manual retry; successful deletion is separately committed, without the object key in returned profiles/audit snapshots. Hold review dates never silently release a hold. A queued deletion rejects retrospective hold changes. Storage/transaction failures cannot be reported as successful deletion. Deletion requires `PARTNER_EVIDENCE_PURGE_ENABLED:true` and a non-empty agreed `PARTNER_RETENTION_POLICY_REFERENCE`, neither configured. The published internal-only source additionally rejects the retention execution route. There is no new timer or background deletion process.

Local API/domain tests cover dry-run privacy, uncommissioned rejection, current evidence, legal holds, role/MFA, audit outage, private-store outage/retry and successful two-phase audit. Actual retention periods, legal basis, privacy notices, holds policy and operational purge acceptance still require the responsible owner's agreement before ID/selfie onboarding. No real evidence was deleted by this work.

## Connected member, dispensing and review pipeline — 24 October successor

The real member-record payload now projects the same owned `partner_fulfilment` record used in dispensing, rather than only the internal commissioning views. The branded My Shift order card renders status, last update, prescription reference, safe courier tracking, public query/rejection notes and activity. It hides unsafe tracking URLs, distinguishes a pharmacy-entered delivery record from independently verified courier evidence, and does not confuse the submitted assessment's historic status with current delivery status. Record-page branding is My Shift; the wider My Shift dashboard remains a separate shared release.

`/<record>/fulfilment/reply` stores a member's answer against the current order version and query ID. Both record/order ownership and a current verified member session are rechecked in the mutation transaction; stale/duplicate/cross-account answers and audit failures cannot commit. The pharmacy view/queue shows that reply without auto-accepting the prescription. Reply/read capabilities are separate from pharmacy supply capability: the retained private member service allows its existing designated Test account to use them, while general clinical launch and actual pharmacy supply remain off. No account/cohort is widened.

The production dispensing reducer supports separately scoped manual delivery, delivery exceptions, returns and pre-dispatch cancellation. Their provenance is explicitly `pharmacy_manual_record`, never a claimed courier callback. Actual prescription/currentness and stock checks apply only where required: a stock-provider outage cannot block a query/rejection or a historical delivery record, but cannot permit preparation/dispatch either. Couriers and external prescription/stock APIs still require the chosen partner's documented contract and credentials; no vendor endpoints have been invented.

Partner events now append review-only items to the EXISTING `clinical_case_outbox` and owner notification-review bridge, conditionally in the same audited transaction. Only the matching order/member clinical record can supply the secure link. Older pending partner prompts are superseded on newer state changes or a member answer; independent clinical prompts remain untouched. The older partner draft is marked `review_only` when an existing review item is created, preventing a second sender path. No sender, new schedule, automatic approval or external communication is added. The actual saved reporting bridge was exercised against synthetic SQLite and produced one awaiting-review intent with no send. Its separately owned production successor/transport-eligibility release must still be reconciled before real clinical/pharmacy activation.

Local verification covers actual member routes, transaction rollback/revocation, real dispensing actions and the shared review contract. Mobile/desktop member browser acceptance confirms reply persistence into pharmacy state, reload, delivery provenance, unsafe-link rejection and no overflow. Existing ten-step questionnaire/upload/reviewer browser acceptance remains passing. Production signed-in acceptance remains distinct and is not inferred from fixture identities. Main, root HQ, payments and public onboarding are unchanged.
