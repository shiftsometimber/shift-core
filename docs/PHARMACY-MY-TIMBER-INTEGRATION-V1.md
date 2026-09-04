# Pharmacy → My Timber integration contract V1

Medicines must remain out of stock until this contract has passed against the chosen pharmacy and live-mode Stripe configuration.

## Member journey

1. A verified My Shift member starts checkout.
2. Stripe payment succeeds and returns the member to `/member/dashboard#today`.
3. The Stripe webhook moves the order to `assessment_pending`.
4. The pharmacy updates the clinical state through the authenticated integration endpoint.
5. My Timber shows the latest state without exposing clinical answers.
6. `approved` makes the two-minute My Journey essentials mandatory before weekly treatment support and reordering unlock.
7. The member continues with weekly Journey check-ins.
8. Reorder becomes available only after `fulfilled`, the Journey setup is complete and the pharmacy-provided eligibility date has arrived.

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
