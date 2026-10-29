# Shared prescription workflow — 29 October 2026

## Scope and evidence

This implements SHIFT's receipt-backed prescription lifecycle. It does not issue a legal prescription, create an electronic signature, connect Health Finder/LoopRx/Prescriptr, approve a clinical protocol, or activate treatment sales. The trusted clinical provider must issue the prescription in its prescribing system. Our record points to that signed document and records its agreed medicine details.

The same lifecycle can carry GLP and testosterone prescriptions. It does not reuse weight-management eligibility or questionnaires for TRT. TRT requires a separate clinician-approved assessment, investigations, monitoring, repeat-review process, and a validated provider integration before activation. No TRT product, intake or checkout is enabled by this change.

## Sequence

`assessment_pending → approved → prescription_signed → sent_to_pharmacy → pharmacy_received → dispensing → dispatched → fulfilled`

Approval alone is not prescription issuance. Each subsequent stage records an explicit provider confirmation. New checkout orders use workflow version 1 and cannot skip signing or pharmacy receipt. Existing records retain their legacy behaviour until they adopt the signed-prescription stage; this avoids inventing historical signatures or receipts. Decline/refund stop routes remain available; later prescription callbacks cannot reopen stopped orders.

## Provisional SHIFT callback contract

Use the existing `POST /v1/integrations/pharmacy/treatment-status` with `Authorization: Bearer <PHARMACY_INTEGRATION_SECRET>`. This is our provisional contract, not a claimed vendor API. The trusted adapter must map verified vendor events to it. Do not expose the integration credential to browsers.

All six prescription stages require:

```json
{
  "orderNumber": "SYNTHETIC-ORDER",
  "status": "prescription_signed",
  "eventReference": "unique-provider-event",
  "prescriptionReference": "provider-prescription-reference",
  "occurredAt": "2026-10-29T12:00:00Z",
  "signedRecordReference": "private-provider-signed-document-reference",
  "prescriberReference": "private-provider-prescriber-reference",
  "prescription": {
    "medicineName": "Synthetic medicine",
    "strengthLabel": "Synthetic strength",
    "formulation": "Synthetic formulation",
    "directions": "Synthetic test instructions only",
    "quantity": "One synthetic pack"
  }
}
```

The signed document reference, prescriber reference and complete medicine snapshot apply only to `prescription_signed`. Later stages must not resend or change them. `pharmacy_received` additionally requires `pharmacyReceiptReference`. `fulfilled` may include an ISO `reorderEligibleAt` value. Other fields, including free-text clinical notes and `reasonCode`, are rejected for these receipt events. Existing clinical-decision callbacks keep their existing contract.

Require a paid order, exact next stage, stable prescription reference, unique event reference and a valid ISO occurrence time (no regression or more than five minutes into the future). An exact repeated event is idempotent; changed or cross-order reuse returns conflict. Order progress, its event ledger and the order registry update in one atomic database batch. A failed batch leaves all three unchanged. Missing authentication fails before database access. The provider adapter must independently authenticate the original vendor event, verify the signed document and patient/order association, and only report actual handover or receipt.

This endpoint receives confirmations; it does not send prescriptions or automatically instruct a dispenser. A genuine partner integration must perform the transfer and obtain the pharmacy's acknowledgement before reporting those stages.

## Member experience

My Timber displays the clinician's recorded medicine and strength, prescription reference and confirmed progress. The member API retains requested medicine/strength separately and excludes internal signed-document and prescriber references. The tracker refreshes every 30 seconds while an order is active and the page is visible, and when returning to the page. All displayed provider strings are escaped.

Existing support and Journey controls remain in place. A repeat requires the existing completed-Journey, fulfilled-order and date checks. A changed medicine or strength does not open the original variant's repeat checkout. An unknown medicine never defaults to Mounjaro; a dedicated service route and repeat assessment must be commissioned separately.

## Verification and release

The bounded local test command is:

```sh
node --test tests/prescription-workflow-v1.test.mjs tests/medicine-commerce-v1.test.mjs tests/medicine-purchase-e2e.test.mjs tests/medicine-intake-sqlite.test.mjs tests/pharmacy-handover-v1.test.mjs tests/medicine-intake-continuity.test.mjs tests/medicine-stripe-retry-v1.test.mjs
```

Tests use synthetic data, in-memory SQLite and mocked external transport. They do not contact patients, send messages, charge a card or issue a prescription. The regression suite exercises intake ownership, verification, payment and stock protection alongside the new lifecycle and atomic failure checks.

Schema additions are additive and idempotent, applied on checkout or authenticated pharmacy updates. No historical stages are backfilled. The existing production pipeline and its exact composition/rollback controls remain unchanged. Passing local tests or creating a PR is not proof of deployment. Production inclusion must pass that release pipeline; partner readiness additionally requires agreed field mapping, credentials and a genuine sandbox end-to-end test, including failed/refunded and repeat cases, before enabling sales.
