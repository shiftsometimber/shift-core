# SHIFT Health testing and wellbeing — 28 October 2026

The selected range contains thirteen tests, three supplements and four proposed combinations. The latest visual instruction is to keep the real product box and test photographs unchanged and apply SHIFT black, cream and ash green to the surrounding pages, cards and instruction panels. Use “our testing partner” in customer and HQ copy. Source identity remains in private database provenance and the original product packaging photographs.

## Completed

- Built `/shift-health/testing` and twenty detailed product pages within the accepted Health/Nutrition wrapper. The range contains Testosterone and Diabetes lab tests; coming-soon PSA, Male Hormone and Heart Health lab tests; and Bowel Health, Prostate Health, Male Fertility, Cholesterol, Vitamin D, Iron Deficiency, Thyroid and Kidney Health self-tests.
- Added Multivitamin, Vitamin D and Iron supplements, plus proposed General Health, General Health Combo, Vitamin D Combo and Iron Deficiency Combo products. Pack quantities and SHIFT commercial terms remain to be confirmed.
- Added product galleries, purpose, suitability, contents, sample-specific illustrated steps, results, limitations and FAQs. Fifty-six original source photographs are optimised and embedded once in `media-data.mjs`; `media.mjs` maps each product and instruction step to its actual photograph. No generated replacement boxes, recolouring or relabelling is used. `media-sources.json` retains private photo provenance.
- Kept the existing Health hub, Bloods panels, nutrition, homepage and member routes. One reversible testing block is inserted into the accepted Health hub. The public Worker retains the real shared publisher shell.
- Extended the authenticated HQ catalogue to all twenty draft products. Staff can edit supplier codes, trade/retail/delivery figures, VAT and internal notes with revision control and audit history. Supplier identity and source links are omitted from the HQ client projection.
- Applied the idempotent migration to the existing live D1 database and immediately verified thirteen records in `testing_products` and seven in `testing_range_extras`. Every record remains `status='draft'` and `sale_enabled=0`, enforced by database constraints. Supplier codes and SHIFT trade/retail prices are null. The migration updates source facts without overwriting staff commercial fields.
- The public pages offer product information only. No purchase, payment, stock reservation, result-import or order-dispatch endpoint was added. Lab reports remain in our testing partner’s secure results portal.

## Source and preservation

The approved wrapper base is `a4b8f173e3900e2f0062b3d7483a1d910b9ef2bf` on `release/olivit-health-approved-20261027`, not the older `main` Health implementation. This feature changes only `health-nutrition/public.mjs`, `health-nutrition/worker.mjs` and `health-testing/`. Preserve later work from other component owners when preparing publication. Do not deploy the old core Worker or change its entry point, bindings, cron, secrets or unrelated routes.

Individual GitHub files were used. Automatic approval review prohibited a full clone under SST resource restrictions. No dependency installation or replacement repository was used. Remote D1 work ran through the existing SST managed-check helper and reused the cached Wrangler installation.

## Validation

`node --test health-testing/feature.test.mjs health-nutrition/feature.test.mjs`

All nineteen focused checks passed. They cover the expanded range, draft-only constraints, idempotence, commercial-field preservation, privacy projection, HQ authentication/origin/revision checks, audit records, all twenty-one public routes, image coverage and preservation of existing Health/Nutrition routes.

Browser review confirmed that the original prostate box and device photographs load, that all four original instruction photos load, and that the portable review can open the detail page and scroll to its instructions. A 390px mobile frame rendered without horizontal overflow (375px body including the browser scrollbar). The portable review uses a simplified navigation shell; production rendering retains the existing publisher’s real shell.

`node health-testing/preview.mjs` regenerates static review routes, original photo assets and the self-contained `review.html`. Its twenty product links and in-page anchors work without a web server; it has no backend write functionality. The screenshot `product-colours-review.jpg` records the corrected real-product treatment. Older screenshots represent superseded layouts.

## Publication requires Matt’s explicit production approval

The expanded draft catalogue is saved in D1. The public website and HQ extension have not been published. Publication must keep purchasing and dispatch disabled.

After approval, use the established manual Cloudflare workflow for the existing `shift-health-nutrition-20261027` service. Read the actual route map first, preserve the current bindings/source, and route only the testing public and HQ requests through this wrapper:

- `shiftsometimber.co.uk/shift-health/testing*`, following the existing www alias convention
- `shiftsometimber.co.uk/shift-health/assets/testing-*.webp`
- `shiftsometimber.co.uk/shift-health/assets/hq-testing.js`
- `api.shiftsometimber.co.uk/v1/hq/testing*`

Reuse broader matching routes if already present; do not transfer unrelated traffic. Existing Health hub and HQ root retain their current ownership. After publication, verify `X-Shift-Health-Release: health-testing-range-20261028`, all twenty product pages, original images, desktop/mobile layout, actual authenticated HQ load/save, and unchanged Bloods/nutrition/homepage behaviour. Do not claim production verification until those checks run.

## Product facts

Each private catalogue record retains the original product URL and date checked. Testosterone is separate from the coming-soon Male Hormone panel; the home Prostate Health self-test is separate from the coming-soon PSA lab test. Stool, urine and semen products have their own collection instructions. The supplier’s original device photos and printed instructions have not been recoloured or altered. NHS guidance accompanies the relevant limitations; marketing accuracy claims and endorsements were not copied.
