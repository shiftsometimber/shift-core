# Health MOT / home bloods — service launch specification

19 September 2026. This work is active, not parked. The shelf cannot honestly become an orderable clinical service until supplier terms are known. The two parked items in the wider brief remain parked; this document does not invent a pharmacy relationship or clinician endorsement.

## Existing routes

- `/shift-health/health-mot`: existing Health MOT proposition.
- `/shift-health/testosterone-energy`: existing testosterone information and proposed home-test route.
- My Timber already has a provider-neutral result adapter and Passport architecture. That is not evidence of a live supplier webhook or reviewed clinical result.

## Customer-facing availability copy for the completed shelf

**Home testing through SHIFT**

Understand what is being tested, what it costs, and who explains your results before you order.

**Health MOT — service details being finalised**
A planned home blood-testing option. The panel, sample method, price and result-review arrangements are not yet confirmed. Ordering is unavailable. We will publish these details before taking payment.

**Testosterone & energy — explore the existing guide**
Read how assessment and testing fit together, and what a test can and cannot establish. The home-testing offer is not yet available to order. Price and service details are to be confirmed.

**Available now: practical tools in My Timber**
Use the existing goals, food, movement and progress tools without buying a test. These do not diagnose a condition or replace clinical care.

This is prepared shelf copy, not a claim that the public page has been replaced or the service is live. Do not add an order button, test price, turnaround promise or Product availability claim until the real offer is confirmed.

## Required supplier response — internal commissioning sheet

| Field | Current evidence | Acceptance before ordering |
|---|---|---|
| Contracted supplier and laboratory | Not supplied | Contracting entity, laboratory and relevant accreditation scope documented |
| Approved panel | Not supplied | Exact biomarkers and units; eligibility and clinical rationale reviewed by the responsible service |
| Home sampling | Not supplied | Method, kit instructions, exclusions, failed-sample/repeat process |
| Price and costs | Not supplied | Wholesale test, kit, postage, review, repeat/refund costs; agreed public total |
| Fulfilment | Not supplied | Order API/portal, dispatch coverage, delivery process and support ownership |
| Turnaround | Not supplied | Clock start, working-day definition, exceptions and escalation |
| Result review | Not supplied | Who interprets results, explains them and manages urgent/abnormal findings |
| Results integration | Adapter exists; supplier not commissioned | Schema, units, ranges, timestamps, revision IDs, signatures and replay behaviour tested with synthetic records |
| Privacy and consent | Existing account controls; supplier contract absent | Actual data-sharing terms, roles, access, export, correction and erasure handling |
| Service failure | Not supplied | Lost kit, unsuitable sample, failed payment, failed result delivery, refunds and continuity process |

No consumer-site price is substituted for a signed B2B quote. No provider brand is added to the public site merely because it is a prospective supplier.

## Supplier request — prepared, not sent

Please provide your proposed UK home-testing service terms for Shift Some Timber: exact approved panels and eligibility; sample method and repeat policy; laboratory and accreditation scope; kit/return fulfilment; end-to-end costs; result-review and urgent-result ownership; turnaround definitions; order/results API or webhook documentation; support responsibilities; and data-sharing terms. We need to retain a useful member experience without presenting unreviewed results as clinical advice. Please distinguish services available now from roadmap items, and identify any minimum volumes or setup fees.

## Commissioning sequence once the response exists

1. Enter the real service into the existing catalogue/HQ authority; keep stock unavailable until readiness is confirmed.
2. Complete the result mapping with synthetic fixtures and exercise duplicates, corrections, failed delivery and wrong-account rejection.
3. Demonstrate consent, order, home-kit status, reviewed result delivery, explanation and follow-up ownership in one preview.
4. Reconcile public details, price, availability and terms with the signed service; run existing release gates and promote once.
5. Complete the first controlled supplier test order before opening customer orders. Record evidence without exposing health data.
