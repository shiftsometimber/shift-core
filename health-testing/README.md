# SHIFT Health testing and wellbeing — 28 October 2026

The selected range contains thirteen tests, three supplements and four proposed combinations. The latest visual instruction is to remove the white photographic backgrounds and place the original product boxes and tests directly on SHIFT cream product panels, with ash green instruction panels and black page styling. Use “our testing partner” in customer and HQ copy. Source identity remains in private database provenance and the original product packaging photographs.

## Completed

- Built `/shift-health/testing` and twenty detailed product pages within the accepted Health/Nutrition wrapper. The range contains Testosterone and Diabetes lab tests; coming-soon PSA, Male Hormone and Heart Health lab tests; and Bowel Health, Prostate Health, Male Fertility, Cholesterol, Vitamin D, Iron Deficiency, Thyroid and Kidney Health self-tests.
- Added Multivitamin, Vitamin D and Iron supplements, plus proposed General Health, General Health Combo, Vitamin D Combo and Iron Deficiency Combo products. Pack quantities and SHIFT commercial terms remain to be confirmed.
- Added product galleries, purpose, suitability, contents, sample-specific illustrated steps, results, limitations and FAQs. The original source photographs are retained in private provenance. Twelve opaque product photos have background-extraction edits, recorded with the built-in image-editing prompt in `cutout-edits.json`. `prepare-cutouts.mjs` packages the transparent edits with alpha-edge cleanup. The other product images and instruction photos already have transparent backgrounds. Excess transparent canvas is trimmed from the native product photos, and one complete product view is shown per page; the General Health bundle uses the five individual test cutouts together. All twenty primary product images have alpha transparency and transparent corner pixels; the ash-green panel shows through with no white rectangle. `media-data.mjs` embeds the used assets once; `media.mjs` maps each product and instruction step to its asset. `media-sources.json` retains private source provenance.
- Kept the existing Health hub, Bloods panels, nutrition, homepage and member routes. One reversible testing block is inserted into the accepted Health hub. The public Worker retains the real shared publisher shell.
- Extended the authenticated HQ catalogue to all twenty draft products. Staff can edit supplier codes, trade/retail/delivery figures, VAT and internal notes with revision control and audit history. Supplier identity and source links are omitted from the HQ client projection.
- Applied the idempotent migration to the existing live D1 database and immediately verified thirteen records in `testing_products` and seven in `testing_range_extras`. Every record remains `status='draft'` and `sale_enabled=0`, enforced by database constraints. Supplier codes and SHIFT trade/retail prices are null. The migration updates source facts without overwriting staff commercial fields.
- The public pages offer product information only. No purchase, payment, stock reservation, result-import or order-dispatch endpoint was added. Lab reports remain in our testing partner’s secure results portal.

## Source and preservation

The approved wrapper base is `a4b8f173e3900e2f0062b3d7483a1d910b9ef2bf` on `release/olivit-health-approved-20261027`, not the older `main` Health implementation. This feature changes only `health-nutrition/public.mjs`, `health-nutrition/worker.mjs` and `health-testing/`. Preserve later work from other component owners when preparing publication. Do not deploy the old core Worker or change its entry point, bindings, cron, secrets or unrelated routes.

Individual GitHub files were used. Automatic approval review prohibited a full clone under SST resource restrictions. No dependency installation or replacement repository was used. Remote D1 work ran through the existing SST managed-check helper and reused the cached Wrangler installation.

## Validation

`node --test health-testing/*.test.mjs health-nutrition/feature.test.mjs`

All twenty-three focused checks passed. They cover the expanded range, draft-only constraints, idempotence, commercial-field preservation, privacy projection, HQ authentication/origin/revision checks, audit records, all twenty-one public routes, image coverage and preservation of existing Health/Nutrition routes.

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

Each private catalogue record retains the original product URL and date checked. Testosterone is separate from the coming-soon Male Hormone panel; the home Prostate Health self-test is separate from the coming-soon PSA lab test. Stool, urine and semen products have their own collection instructions. Instruction photographs retain their original transparent assets. Product-background edits are recorded separately from the original source URLs. NHS guidance accompanies the relevant limitations; marketing accuracy claims and endorsements were not copied.

## Background-removal revision

The 28 October follow-up removes the embedded white backgrounds, uses cream product panels and ash-green instruction panels, and removes the second stacked product view. Twelve background-extraction edits were packaged with transparent alpha; the other images already had alpha. Browser review checked all twenty range images, the corrected General Health collection, the Prostate Health detail and its photographed steps.

General Health source provenance is corrected to `https://www.newfoundland.io/products/wellness`. The audited migration was applied successfully to D1 on 28 October. All twenty stored result times match the audited seed and all twenty records remain draft and sale-disabled. The earlier authentication failure is resolved. No website or HQ publication was performed.

## Approved cream treatment and individual-page audit

Matt approved the cream product background example and instructed the treatment to continue across the range. All product galleries, cards and range photography panels now use cream; the photographed instruction panels remain ash green.

All twenty current partner product pages were fetched and checked on 28 October. `content-audit.json` records their exact URLs, source hashes, verified facts and remaining launch/label/quantity confirmations. `specifications.mjs` is the shared source for product-specific kit contents and collection, running and reading steps. NHS primary guidance supports the PSA, FIT and fertility limitations.

The main corrections distinguish the fertility one-hour preparation wait from the five-minute result; enforce the cholesterol two-minute wait and subsequent thirty-second reading window; keep urine/stool/blood methods distinct; specify the correct buffer amounts; and confirm all three supplements contain sixty capsules, are listed as vegan and have a one-capsule published daily serving. No exact combo quantities, retest intervals, full supplement labels or coming-soon turnaround promises are invented. General Health Combo includes the multivitamin within its listed contents.

Twenty-three checks pass, including four content regressions for the medically material differences above. Browser review confirmed all twenty card links, the corrected fertility detail, all four instruction photos and a mobile body width of 375px with no horizontal overflow. `verified-instructions-review.jpg` and `product-colours-review.jpg` record the final draft.
