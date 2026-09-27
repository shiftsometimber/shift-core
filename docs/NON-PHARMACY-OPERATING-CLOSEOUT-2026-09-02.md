# Shift Some Timber — non-pharmacy operating closeout

Authority date: 2 September 2026  
Owner: Matt O'Brien  
Scope: controls that can be commissioned before a regulated pharmacy/prescribing partner is appointed.

## Commercial state

- Stripe integration and test-mode payment/webhook handling are technically commissioned and regression-tested.
- Live Stripe activation is a deliberate launch switch, not unfinished engineering.
- Prescription products remain `Currently out of stock`; payment collection remains disabled.
- Displayed medicine prices are indicative market positioning only. Partner-issued catalogue, wholesale cost, stock, fulfilment and margin evidence must replace them before launch.
- `NEWSHIFT25` is an HQ-managed 25% discount code. It may be tested against indicative prices but must not create a prescription sale while the commercial gate is closed.

## Release authority

| Component | Authority |
|---|---|
| Static site | V1.31 HQ Commerce Content SEO Closeout |
| Worker | `shift-core` main at or after `418359e6d0146b5172b258f44c925e4786ed4d39` |
| Sales gate | Closed |
| Stripe | Test commissioned; live activation deferred |
| Pharmacy/clinical | External partner required |

## Commissioned technical controls

- Central server-controlled catalogue and Stripe signature tests.
- My Shift account requirement for checkout.
- HQ discount and plain-text website editing controls.
- My Journey weight/waist/clothing/Life Back contract and respectful selector inputs.
- Tap Room room, founding-prompt, treatment-language and crisis-language gates.
- Analytics property allow-list and health/free-text rejection controls.
- Shift Me render/rerender/isolation/persistence/retrieval/deletion proof.
- Daily SEO and production monitoring.

## External launch gates

The following cannot be signed off internally: regulated provider contract, prescribing and dispensing responsibilities, clinical escalation, partner catalogue/cost/stock, assessment/refund rules, regulated-record retention, commercial claims approval and final launch rehearsal with the appointed provider.

## Acceptance rule

No item is described as complete because code exists. Closure requires a live result, retained test evidence, named owner and a recovery path. The pharmacy presentation may look finished, but it must remain unmistakably out of stock and unable to collect payment until every external gate passes.
