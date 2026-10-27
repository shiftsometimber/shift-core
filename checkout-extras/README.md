# Optional checkout extras

Recommendation presentation, HQ SKU display and automatic SKU creation are live. The mixed-payment backend remains prepared but not deployed or sales-enabled. See the existing project checkpoint at `release/olivit-nutrition-20261027/README.md` for live state, constraints and release dependencies.

## Behaviour

The public basket asset retains the existing saved medicine and payment recovery UI. The extras client extends that same basket with account-scoped supplement lines and quantities; it does not store clinical answers, verification tokens or payment details. Treatment front-door calls its review step after verification and before creating checkout. The top and bottom skip controls work without waiting for the recommendations API.

HQ's proposed catalogue remains the merchandising source. Two recommendations at most use `checkout_recommendation`, `checkout_priority` and `shift_says`. The migration seeds whey/clear as Explore-only suggestions once, increments revisions and records history; reruns preserve HQ edits.

The separate `supplement_checkout_offers` table represents publishable, exact sale variants, not draft planning values. It is deliberately empty. Activation requires the environment flag plus individually active, verified offers, a non-expired quote, real stock, positive integer gross GBP price, confirmed all-GB delivery tariff and approved fulfilment. Unsupported/unconfirmed delivery coverage blocks purchasing rather than inventing a postage quote. Price/pack/delivery updates must increment the offer revision.

Mixed medicine checkout appends supplement and delivery lines to the existing Stripe Checkout Session. Its stock claim, medicine order, supplement snapshot and verification consumption share a D1 transaction. One order reference identifies both records. Medicine totals retain only the treatment amount; extras retain their own item/delivery breakdown for later partial refunds. Signed paid events verify the combined amount and settle stock plus a supplier queue record atomically. Duplicate events cannot double decrement stock or enqueue twice. A card-attempt failure leaves the open Checkout reservation intact; confirmed session expiry releases it. Unknown payment outcomes preserve the existing idempotency and recovery rules.

Supplement-only payments use the same checkout-attempt mechanism and webhook route. The success page polls an authenticated order-status read; it never fulfils from the browser. Address-less or non-GB paid orders are held for staff review. Supplier dispatch is deliberately not sent: the Olivit transport and tracking contract is still unknown. `supplement_fulfilment_queue` is a persisted boundary awaiting that integration, not evidence of dispatch.

## Verification

Run Node 24:

```sh
node checkout-extras/build-assets.mjs --check
node --test checkout-extras/feature.test.mjs checkout-extras/medicine-integration.test.mjs tests/checkout-recovery.test.mjs tests/medicine-commerce-v1.test.mjs tests/purchase-basket.test.mjs health-nutrition/feature.test.mjs
```

`build-assets.mjs` checks generated client modules against their exact source, and creates the ignored `basket-asset.js` browser fixture. `browser-qa.mjs` uses that exact asset with synthetic commerce responses. Set `SHIFT_PUPPETEER`, `SHIFT_CHROME` and `SHIFT_BROWSER_EVIDENCE` to existing local tools and an output directory. It does not install a browser or access a real account/provider/supplier.

## Release requirements

No production changes are made by this branch or its test workflow. Keep the existing shared production concurrency lane and release ownership. Install `migrateCheckoutExtras(DB)` once before publishing the changed clients/API/HQ. It creates tables and adds merchandising columns without enabling sales or overwriting existing drafts. Coordinate the front-door assets, Core API/basket and Health/HQ release; the old Health-only lane cannot deploy the Core changes.

Before activation: confirm exact supplier data/labels/VAT, real stock freshness and reservation policy, delivery coverage/tariff and returns, supplier submission/retry/tracking, order confirmation emails showing all lines, and partial-refund/cancellation rules when a prescribing decision differs from the supplement order. Complete real isolated Stripe sandbox and supplier acceptance, then the scoped release review. No live prices, supplier contract, fulfilment connection, payment acceptance or deployment is claimed by the fixture receipt.
