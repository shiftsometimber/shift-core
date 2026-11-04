# Approved next-release implementation

Source: current fix/my-timber-precompiled-documents-20261102 branch. Existing production front 42f085ae-553c-4b11-82f6-116203fb3c5e. No earlier release is restored.

| Brief rule | Existing owner and change |
| --- | --- |
| Welcome first, four top tabs | shop-navigation.mjs shared chrome; one new Welcome link, approved palette and underline |
| First visit/returning | v7-shell-browser.mjs; account-scoped visit marker, Welcome first before setup, returning Today |
| Supplied artwork only | welcome-artwork originals, lossless byte-for-byte hashes; cached versioned WebP endpoints |
| Real Make it mine hotspot | welcome-pages.mjs; exact percentage rectangle, 44px target, focus ring, existing setup route |
| After setup | existing setupComplete state selects supplied no-button crop |
| Explore intro and return | welcome-pages.mjs inside persistent shell; existing clinical entry is reused |
| Questions, options, checkout | existing clinical/provider route and till retain all gates; no invented clinical form or medicine option |
| Review/status/declined | existing medicine_orders account-only summary; genuine status determines wording; no medicine names/prices in boot |
| Automatic refund/card hold | BLOCKED: current till has automatic capture and decline handler has no automatic refund; no configured pharmacy service |
| Support/More | existing v7-retained-utility.mjs preserves every live item and the existing restyle |
| Shop | shop-routes, products, basket, discounts and checkout untouched; approved fourth tab added to shared frame |
| Speed | v7-native.mjs parallelises independent account reads; does not weaken authentication or add page-load API calls |
| Rollback | capture exact current front before any production push, retain current Core and all routes |

Sensible call: first visit is tracked per account on this device; a direct Welcome link always opens Welcome. Existing completed setup lands on Today. The artwork is loaded only on Welcome and cached when requested, so Today/Fit do not download it.

Clinical live blocker found: clinical context reports assessmentAvailable=false, public assessment explicitly closed, no pharmacy integration binding is configured. Existing till card-hold support is not wired: manual capture, approval capture/cancellation and expiry reconciliation are absent. Stripe itself supports manual authorisation; that does not make this till safe to use it. No automatic-refund promise will be enabled and no closed gate bypassed.
