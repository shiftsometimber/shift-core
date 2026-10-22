# Treatment options review preview — 22 October 2026

This is the next preview in Matt's originally queried public-page sequence. It is **not approved for production**. The Newsroom layout follows it. Keep the Master, Core/TRT, Medicines Watch and broad reconciliation/performance work paused.

The preview is a standalone, read-only presentation at `/treatment-options`. It uses the current shared website header and full footer from the Core treatment-order document, the approved Start Here photography, native expandable information, format filters and a strength-selection view. All product names, variants and listed prices are captured from the existing public medicine catalogue. No strength is selected or recommended by default. Stock appears only after the explicit buying-options action. All six products were out of stock at capture.

No assessment, eligibility, pricing, inventory, checkout, member or contact system is changed. There are no account/contact writes or communications in acceptance checks. The new preview has zero production routes and cannot process POSTs or proxy private APIs. No production-deployment helper is included.

After Matt reviews the actual preview, reconcile the exact serving source and integrate only the approved presentation and navigation. Stock and price must come from the authoritative live catalogue in a production implementation; do not publish this captured snapshot as a live inventory service. Preserve insulin/BMI and clinical gates, current medicine information, actual service limitations, verification-before-payment and assessment/checkout boundaries. Check all six medicine slugs against the live order controller before linking it. Do not infer clinical launch authority.

Source of medicine safety framing: MHRA GLP-1 patient information, updated 5 February 2026, reread 22 October 2026. The preview adds no efficacy or personal suitability claims. Existing medicine-information and provider-switch pages remain the detailed guidance destinations.

Build: `node previews/treatment-options/build.cjs`.
Contracts: `node --test previews/treatment-options/test.mjs`.
The preview workflow records the exact source, production routes before/after, shared-layout preservation and actual Chromium/WebKit checks at 390 and 1440 pixels.
