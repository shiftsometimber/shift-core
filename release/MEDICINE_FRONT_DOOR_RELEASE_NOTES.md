# MEDICINE FRONT DOOR - SUPERSEDING BUILD LOCK

**Matt lock:** 5 September 2026  
**Batch status:** Built locally; production promotion blocked pending the release gates below.

## Commercial decision

Product confidence wins the order; aftercare earns retention. The medicine front door therefore takes priority over further Continuity, Lounge and CGQ expansion. Those services remain intact and become the post-approval advantage.

## Authorised batch

- Five hero routes: Mounjaro, Wegovy injection, Wegovy tablet, Orlistat and Foundayo.
- One Mounjaro product-detail template cloned across the other routes.
- Foundayo remains editorial and unavailable until MHRA status, partner formulary and supply are confirmed.
- HQ owns every medicine, dose variant, cost, target gross margin, calculated sale price and stock value.
- Sale price formula: `sale = cost / (1 - gross margin percentage)`; rounded upwards to the nearest penny.
- Orlistat has one sale-price source. No public page in this batch contains a hard-coded GBP 59 or GBP 79 price.
- Pre-payment clinical verification, followed by checkout only when a short-lived one-use verification token is present.
- Post-payment status tracker and light My Journey setup after approval remain the continuity hand-off.

## What has been built

### HQ medicine and margin engine

- Editable cost and target GM percentage per dose or pack.
- Calculated sale price and actual achieved margin displayed in HQ.
- Price history records cost, target margin, calculated sale price, operator and timestamp.
- Public catalogue explicitly selects sale price and excludes cost and margin fields.
- Existing server-side stock reservation remains authoritative; zero available stock never reaches Stripe.

Example: a cost of GBP 100.00 at 40% GM produces GBP 166.67 sale price.

### Product pages

- Above-fold medicine name, original Shift visual, live dose selector, HQ price, honest supply state and CTA.
- Plain-English mechanism, dose route, BMI/eligibility framing, prominent negatives, official product-information route and complete next-step sequence.
- Original Shift SVG explainers for a generic four-dose weekly pen, how treatment supports the route, and BMI as one part of clinical review.
- No competitor images, copy or page assets.

### Assessment and order sequence

1. Choose a live HQ dose variant.
2. Complete the staging clinical form.
3. Submit directly to the configured regulated partner verification endpoint.
4. Receive a 30-minute, single-use opaque verification token.
5. Recheck stock and reserve one unit server-side.
6. Open Stripe only after those checks pass.
7. Show payment, clinical assessment, approval, dispensing and dispatch in My Shift.
8. Require a light My Journey setup only after approval.

No clinical answers are written into Shift's verification-token table or audit metadata.

## Release gates and holds

The batch must not be promoted live until all are green:

- Latest public Pages baseline is recovered and the overlay is merged without regressing the homepage fold, Lounge naming, CGQ, NEWSHIFT25 or other public navigation.
- Regulated partner confirms the exact assessment questions, privacy wording, endpoint contract and formulary.
- `PHARMACY_PREPAY_VERIFICATION_URL` and its integration secret are configured on staging.
- `MEDICINE_PREPAY_VERIFICATION_REQUIRED=true` is exercised on staging before any production enablement.
- Foundayo authorisation, formulary and supply are proven; otherwise its editorial-only state remains.
- Approved manufacturer or pharmacy product photography is supplied through HQ. The current generic educational visuals must not be represented as pack photography.
- iPhone visual QA is completed against the assembled staging build. Local automated browser capture was unavailable in this workspace, so this gate is deliberately not marked green.
- Production Stripe remains closed unless live stock, pharmacy readiness and the separate commercial release decision are all confirmed.

## Test evidence

- 186 repository tests passed; 0 failed after dependencies were installed.
- New gates cover the GM formula, invalid margins, cost/margin privacy, five hero routes, no hard-coded Orlistat price, Foundayo editorial lock, partner-backed verification ordering, verification expiry and feature-gated checkout.
- JavaScript syntax checks passed for HQ, medicine commerce, product page and assessment code.
- No deployment, production promotion or live Stripe configuration change was made.

## Primary medicine references used for the template

- Mounjaro UK SmPC: https://www.medicines.org.uk/emc/product/15481/smpc
- Mounjaro UK patient leaflet: https://www.medicines.org.uk/emc/files/pil.15481.pdf
- Electronic Medicines Compendium search: https://www.medicines.org.uk/emc/advanced-search
- MHRA: https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency

Current approved partner copy and the current product leaflet take precedence at release.
