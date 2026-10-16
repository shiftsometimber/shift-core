# Pharmacy → My Timber integration contract V1

Medicines must remain out of stock until this contract has passed against the chosen pharmacy and live-mode Stripe configuration.

## Member journey

1. A verified My Timber member chooses an available treatment variant. Stock and partner configuration remain server-controlled.
2. Before payment, the member completes the clinical intake, GP details, consent and required identity/body-image uploads.
3. SHIFT forwards the intake to the configured pharmacy endpoint. A pharmacy verification result issues a short-lived token bound to the member and selected variant; an outstanding review does not open payment.
4. The member returns to the selected variant and may continue to Stripe only with a valid verification token and available stock.
5. The Stripe webhook moves a paid order to `assessment_pending`. Identity/intake verification is not a prescribing approval.
6. The pharmacy updates the order's clinical state through the authenticated integration endpoint.
7. My Timber shows the latest state without exposing clinical answers.
8. `approved` makes the two-minute My Journey essentials mandatory before weekly treatment support and reordering unlock.
9. The member continues with weekly Journey check-ins.
10. Reorder becomes available only after `fulfilled`, the Journey setup is complete and the pharmacy-provided eligibility date has arrived.

## Questionnaire coverage and integration evidence — 16 October 2026

This is an engineering source review, not a clinical approval or a claim that a particular partner's API is connected. The source reviewed was main `3ab4dc5f8f47e44108f3f6d5503ffbac90b6adef`. The bounded corrections in this change do not activate stock, payments or a clinical service.

| Area | Current implementation | Remaining acceptance |
| --- | --- | --- |
| Age, measurements and service eligibility | Date of birth, height, weight, weight-related-condition answer and the injection-service insulin question; server-side age, BMI and service checks. | The prescriber specifies and independently verifies the evidence needed. Uploaded photographs do not themselves prove BMI verification. |
| Medical history and medicines | Required general conditions and medicines text boxes. Text beyond the existing 1,000-character transport limit is rejected before any pharmacy call, rather than silently truncated. | There is no demonstrated partner-approved structured question set. Agree required allergy, relevant-history, current-symptom, tolerability and follow-up coverage with the prescriber. These are coverage categories, not an approved question set. Confirm that answer-size limits can hold the full history; never omit relevant facts to fit a field. |
| Previous treatment | Yes/no choice; medicine, dose and last-dose date when yes. This change enforces those existing requirements on the server, checks a real non-future date, and clears stale previous-treatment values when no. | Agree the partner's evidence requirements for new, switching and repeat patients, including evidence of prior supply where applicable. |
| GP and consent | GP name, practice, address, postcode, GP-contact consent, image-sharing consent, answer confirmation and consent version are forwarded. The payload also has optional GP-phone/NHS-number fields. | Agree identifiers, data-sharing roles, consent wording and the exact provider fields. No verified GP contact or records access is inferred merely from collecting details. |
| Identity and images | Required photo ID plus clothed front/side images are validated for declared file type and size and forwarded to the pharmacy. SHIFT records a manifest/reference rather than the uploaded image files. | Identity matching, genuine file validation and the pharmacy's independent verification process require partner acceptance. |
| Patient/contact mapping | The intake includes the internal member reference. The authenticated member lookup has name/email, but this intake payload does not explicitly forward name, email, phone or address. | Specify patient creation/lookup and identifiers in the actual partner API; prove that the clinician can reliably resolve the patient and make necessary contact. Do not assume an internal SHIFT ID is meaningful to the provider. |
| Dose and navigation continuity | The selected variant is carried into verification and restored on return; return navigation remains on the same origin. | Prove the complete browser journey on the deployed Pages/Worker asset versions. The API token remains bound to the member and variant. |
| More information and resuming | Pending verification is polled in-page. `more_information_required` and `declined` statuses exist. | A complete secure clarification/resubmission route and durable resume-after-refresh/reopen behaviour are not demonstrated by this implementation. A status label is not a working clinician-patient conversation. |
| API reliability | A configurable pharmacy URL and bearer credential are present; order status transitions have a defined state machine. | Map the actual partner authentication/schema. Prove bounded timeouts, safe duplicate handling, failure recovery, correlation/audit and attachment acceptance in the partner sandbox. Generic intake calls currently do not demonstrate those guarantees. |
| Repeat monitoring | My Journey, treatment status and reorder eligibility exist. | A partner-approved repeat assessment and clinical monitoring process remain separate from lifestyle/member check-ins. |

### Clinical communication and verification boundary

The objective is to reduce avoidable chasing and repeated entry while preserving appropriate clinical contact. Do not promise that no prescriber contact will be needed.

GPhC distance-services guidance requires a means of timely two-way communication. It also states that weight-management prescribing must not rely on questionnaire information alone and requires independent verification of weight, height and/or BMI.

Primary source: [GPhC guidance for registered pharmacies providing pharmacy services at a distance, February 2025](https://assets.pharmacyregulation.org/files/2025-02/gphc-guidance-registered-pharmacies-providing-pharmacy-services-distance-february-2025.pdf), sections 4.1/4.2, particularly pages 17 and 24–25.

### Evidence for the bounded correction

- The original medicine suite passed 13/13 before this change.
- A new 16-case behavioural regression suite reproduced 14 failures on the unchanged source, including absent previous-treatment validation, hidden stale details, variant loss and an off-origin backslash return.
- The unchanged original suite plus the new behavioural suite pass 29/29 after the correction. Tests use synthetic members, images and a fake pharmacy; no real clinical information or partner requests are used.
- The assessment files under `frontend/member/` are the Worker-served assets and must remain byte-identical to the `frontend/medicine-front-door/` source copies.
- These receipts establish bounded local code behaviour only. They do not establish full release qualification, deployment, a rendered live journey, a pharmacy sandbox journey or clinical approval.

## Pharmacy status endpoint

`POST /v1/integrations/pharmacy/treatment-status`

Authentication: `Authorization: Bearer <PHARMACY_INTEGRATION_SECRET>`

Payload:

```json
{
  "orderNumber": "SST-…",
  "status": "approved",
  "reasonCode": "approved_standard",
  "reorderEligibleAt": "2026-10-02T09:00:00.000Z"
}
```

`reasonCode` is optional, controlled and machine-readable. Do not send symptoms, assessment answers or free-text clinical notes to this endpoint.

Allowed states:

- `assessment_pending`
- `more_information_required`
- `approved`
- `declined`
- `refund_pending`
- `refunded`
- `dispensing`
- `dispatched`
- `fulfilled`

The server rejects skipped or backwards transitions. Repeated delivery of the current state is idempotent.

## Member endpoints

- `GET /v1/treatment/orders` — authenticated member treatment timeline.
- `POST /v1/treatment/journey-setup-complete` — confirms that the server-validated Journey essentials are complete.

## My Journey essentials

The mandatory gate requires:

- start date;
- starting weight;
- current weight;
- target weight or maintenance band.

Measurements are controlled dropdowns in the member UI. Optional football, boxing, F1, rugby, activity, food, drink and apparel preferences use controlled choices with `Not applicable / no preference` and `Prefer not to say` options.

Injury and ongoing-condition categories are optional My Timber context. They require an explicit “use this to personalise support” choice, are not pharmacy assessment answers and are discarded when that choice is off.

## Pre-sale acceptance gate

- Test successful payment → pending assessment → approval → Journey setup → weekly check-in → eligible reorder.
- Test more-information-required → resubmitted → approval.
- Test decline → refund pending → refunded.
- Test failed and expired Stripe sessions.
- Prove an unverified or signed-out user cannot order.
- Prove one member cannot see or reorder another member’s order.
- Prove invalid state jumps are rejected.
- Prove duplicate Stripe and pharmacy callbacks are harmless.
- Complete iPhone Safari and desktop Chrome/Safari acceptance.
- Restore every medicine’s stock and reserved quantities to zero after testing.
