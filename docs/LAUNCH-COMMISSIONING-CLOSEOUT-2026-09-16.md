# Launch commissioning closeout — 16 September 2026

Reviewed source: `0b0a8ae0cb652f6b2f74a3d25363c324143f13b0`, merged PR [#699](https://github.com/shiftsometimber/shift-core/pull/699). This is a source and evidence audit of the remaining clinical/commerce and separate Programme/workplace service gates. It does not reopen the accepted My Timber repair, change the design, approve content, or activate a service.

The remaining clinical gates need actual provider and operator inputs. A code change cannot supply a signed operating model, staff a service or establish stock ownership. The separate Programme and workplace modules also have identifiable unfinished engineering acceptance; they should not be described as merely waiting for a switch.

## Completed and evidenced

| Area | Evidence checked in this audit | What the evidence establishes |
| --- | --- | --- |
| Current release | GitHub Actions API returned 11 workflows for exact merge SHA `0b0a8ae`; all are completed/success. [Production promotion 35126496851](https://github.com/shiftsometimber/shift-core/actions/runs/35126496851) includes a successful `Prove medicine front door, commercial safety and full purchase lifecycle` step. | The deployed repair's checks passed. The promotion's commerce test uses synthetic providers; it does not commission a live clinical or merchant service. |
| Commerce code | Fresh local command below: **34 tests, 34 pass, 0 fail**, Node `v24.19.0`. | Server-owned price/stock, account boundary, verification before initial checkout, controlled clinical transitions, Journey prerequisites, signed webhooks, retry and duplicate-settlement behavior pass the existing source/runtime contracts. |
| Present aftercare boundary | `member-daily-v3.js`, `treatmentAction`: support intent is saved with `pharmacy_status='not_sent'`, `deliveryStatus='not_sent'`, and an explicit statement that no message was sent and no clinical response was scheduled. | A saved support need is not falsely represented as a delivered referral. It does not provide staffed aftercare. |
| Workplace prototype | `work/VERIFICATION.md` retains [isolated CI 34688961824](https://github.com/shiftsometimber/shift-core/actions/runs/34688961824) and [remote staging 34688961817](https://github.com/shiftsometimber/shift-core/actions/runs/34688961817), with fictional account/D1 and responsive Chrome evidence. | An employer service candidate has been built and exercised. Historical staging proof is not a completed real pilot, legal/privacy approval or present production activation. |

Fresh commerce verification, using only in-memory fictional fixtures and mocked outbound services:

```sh
node --test tests/commerce-stripe-v1.test.mjs tests/medicine-commerce-v1.test.mjs tests/medicine-front-door-v1.test.mjs tests/medicine-purchase-e2e.test.mjs tests/medicine-stripe-retry-v1.test.mjs
```

The `medicine-purchase-e2e` test mocks both the pharmacy response and Stripe checkout. Its simulated sequence includes assessment/evidence, prepayment verification, test payment, confirmation, approval, Journey and dispatch. Do not label this a real pharmacy acceptance or a live payment.

## Clinical and commerce: exact closure records

Original gate identifiers remain `G5-001`, `G5-002` and `G5-003` in `docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md`, also mapped to `X01`–`X03` in `docs/LAUNCH-FINISH-LINE.md`. No new approval gate is introduced here.

| Gate | Existing code and current boundary | Actual input still required | Evidence that closes it |
| --- | --- | --- | --- |
| `G5-001` / `X01`: clinical operating model | `medicine-commerce-v1.js` hands assessment/evidence to the configured partner and accepts restricted partner status updates. Partner configuration is not proof of a contract. | Signed/current provider, pharmacy and prescriber operating model; accountable service contact; ownership of prescribing, dispensing, complaints, cancellations/refunds and incident escalation. Record the actual agreement reference and scope. | Reviewed agreement/operating record plus an authorised end-to-end partner test with acknowledged receipt and controlled status changes. No real patient record is needed for this proof. |
| `G5-002` / `X02`: Medication Companion and aftercare | Current member support action saves an internal intent only. No delivery bridge or staffing schedule is evidenced. | Named accountable clinical/aftercare owner, staffed contact route/hours, response expectations, escalation and out-of-hours process, approved follow-up schedule and content. Specify the partner's acknowledgement/callback contract. | Implement and test the agreed handover in isolated staging; show accepted acknowledgement, assigned ownership, follow-up outcome, failed-delivery handling and an honest member status. Test fixtures must stay separate from clinical care. |
| `G5-003` / `X03`: provider-approved verification | `clinicalIntake` requires `PHARMACY_CLINICAL_INTAKE_URL` and `PHARMACY_INTEGRATION_SECRET`; `prepayVerification` requires `PHARMACY_PREPAY_VERIFICATION_URL` and that integration secret. Missing configuration fails closed. Member/variant-bound expiring verification is required for initial checkout. | Provider-approved identity, weight/photo and clinical-question requirements; consent and evidence-transfer specification; acceptance/rejection/error responses; documented reorder verification policy. Secrets belong in the existing secure configuration route, not this document or chat. | Partner sandbox proof of accepted, incomplete, declined and failed-transfer cases; correct member/variant binding, token expiry/replay rejection, and no checkout before the required verification. Existing fulfilled-order reorders follow a separate eligibility branch, so the provider must explicitly approve that policy. |
| Merchant commissioning | Committed `wrangler.jsonc` retains `STRIPE_MODE: "test"`; checkout rejects a key prefix inconsistent with test/live mode. Webhook signature and duplicate-settlement tests pass. Secret values were not read. | Merchant account readiness, authorised live credential/webhook configuration, responsible refund operator, and agreed provider/payment event ordering. | An authorised commissioning run records payment, confirmation, clinical status, refund/failure handling and settlement reconciliation. Passing mocked tests is not a reason to switch to live mode. |
| Stock and fulfilment | `hq-purchaseability-v1.js` requires product **and** variant sellable flags, available statuses, a partner, available state and positive unreserved stock. `medicine_inventory` reservation is server-side. No live stock rows were inspected. | Supplier-confirmed product/strength availability, fulfilment responsibility, approved sale prices and stock/reservation source, plus operational updates for dispatch/tracking and exceptions. | Exact governed catalogue values match the supplier's approved supply record; an authorised test demonstrates reservation, release on failure, dispensing/dispatch and tracker updates. Do not turn products sellable from a name or a draft partner record alone. |

These records may exist outside this repository; this audit did not search private mail, contracts or member records. Their absence from checked evidence is not a claim that no commercial conversation has occurred. Confirmation requires the actual record, not a guessed provider or invented responsible person.

## Separate Programme V1 module: keep its scope distinct

The accepted connected My Timber journey is already live. `programme/` is an additional, disabled module and does not replace or invalidate that journey.

| Existing gate | Exact remaining work | Source / exit evidence |
| --- | --- | --- |
| Activation/content | Production configuration has neither `PROGRAMME_V1_ENABLED` nor `PROGRAMME_DB`. `programme/content.mjs` contains six `test-fixture` recipes, all with null reviewer/date/version approval; production selection refuses them. | Preserve the disabled state. Supply exact reviewed versions with documented restrictions/quantities and useful compatible alternatives; complete reviewed movement and four-week/continuity coverage. `programme/CONTENT-REVIEW.md`, `programme/content.mjs`. |
| `D3-01`: remote runtime | Local full-Worker and D1 emulation checks are retained; remote concurrency/retry/isolation for this Programme store remains unproved. Workplace remote-D1 proof is a different module. | Separate Programme test DB, exact candidate Worker and fictional sessions. Execute the six request/result cases in `programme/DELIVERY-3.md`, preserving version/binding identities and aggregate revisions. |
| `D3-02`: browser privacy | Complete real sign-in/return, logout/expiry, browser history/bfcache, cross-account privacy and the remaining supported-device checks. Prior blocked browser attempts were not passes. | Observe the prescribed isolated-browser journey and retain screenshots/results. Native Safari/physical-device evidence cannot be inferred from Chromium or module tests. |
| `D3-03`: content and operation | Reviewer/service owner are not assigned in the retained gate. Provisioning functions exist but are operator-only routines, not a commissioned operator interface. Retention/deletion and capacity boundaries remain unspecified. | Reviewed content decisions; authenticated accountable operator execution; agreed provisioning/expiry, export/deletion/retention procedure; measured aggregate/storage limits. `programme/OPERATIONS.md`, `programme/account-operations.mjs`. |

## Workplace service: exact unfinished pieces

Committed production configuration lacks `WORK_DB`, `WORK_V1_ENABLED` and `WORK_PILOT_COMMISSIONED`. `work/routes.mjs` requires the feature flag before exposing routes and separately checks commissioning before joining/reviewing/activation. `/v1/work/testing` always refuses: no flag enables a blood-test order.

| Required record or engineering completion | Specific content / acceptance | Existing authority |
| --- | --- | --- |
| Actual cohort and delivery | Employer identity, actual eligible group, cohort dates, agreed deliverables, private fee or explicit waiver, support owner/hours and boundaries. Employer buying programme delivery and free My Timber access remain the agreed proposition; there is no need to reopen that decision. | `work/RELEASE-HANDOFF.md`; existing HQ draft/cohort controls. |
| Privacy and data lifecycle | Reviewed roles/data map, lawful basis/notices, contextual reporting review, retention/deletion periods and D1 backup handling. Complete existing account export/deletion integration with the separate WORK_DB; workplace withdrawal alone does not close whole-account lifecycle. | `work/README.md`, `work/routes.mjs`, `work/migration.sql`. Implement against the approved policy, then test fictional account export/deletion/isolation. |
| Supported-device acceptance | Recheck the exact release's signed-out return, mobile/keyboard, logout/history and account separation. Physical iPhone/Safari and Android acceptance are not supplied by the retained responsive Chrome checks. | `work/VERIFICATION.md`; use the existing isolated staging workflow and fictional accounts. |
| Reporting release | At cohort end, review the actual group and possible inference from other disclosures; release one fixed participation report or suppress it completely. No individual or team/site health reporting. | Existing `work/` report generation and manual release. Thresholds alone do not prove anonymity. |
| Optional home testing | Requires a separately agreed home-testing provider/service and reviewed integration; current service creates no kit order, reservation, payment or results. The agreed preference for home tests and private pricing remains unchanged. | Hard refusal at `/v1/work/testing`. Scope supplier terms and privacy before adding any order integration. |

## Execution order when the records are available

1. Attach the actual provider/aftercare/verification and merchant/supply records to their existing gates. Do not change enable flags or publish service promises to compensate for a missing operational input.
2. Build only the integration and lifecycle changes required by those records. Prove them with separate fictional staging accounts and the exact provider sandbox contract; preserve the accepted live member design and catalogue.
3. Reconcile one candidate's source, tests, browser evidence, operational sign-offs and rollback checkpoint, then perform the already-authorised guarded release when all applicable checks pass. No piecemeal production activation.

No production flag, binding, stock row, payment mode, agreement, member record or clinical service was changed by this audit. No message was sent. The immediate commerce regression checks are green; the remaining commissioning gates above remain open for the stated concrete reasons.
