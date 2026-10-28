# SHIFT Health testing and wellbeing — 28 October 2026

The selected range contains thirteen tests, three supplements and four proposed combinations. The latest visual instruction is to remove the white photographic backgrounds and place the original product boxes and tests directly on SHIFT cream product panels, with ash green instruction panels and black page styling. Use “our testing partner” in customer and HQ copy. Source identity remains in private database provenance and the original product packaging photographs.

## Completed

- Built `/shift-health/testing` and twenty detailed product pages within the accepted Health/Nutrition wrapper. The range contains Testosterone and Diabetes lab tests; coming-soon PSA, Male Hormone and Heart Health lab tests; and Bowel Health, Prostate Health, Male Fertility, Cholesterol, Vitamin D, Iron Deficiency, Thyroid and Kidney Health self-tests.
- Added Multivitamin, Vitamin D and Iron supplements, plus proposed General Health, General Health Combo, Vitamin D Combo and Iron Deficiency Combo products. Pack quantities and SHIFT commercial terms remain to be confirmed.
- Added product galleries, purpose, suitability, contents, sample-specific illustrated steps, results, limitations and FAQs. The original source photographs are retained in private provenance. Twelve opaque product photos have background-extraction edits, recorded with the built-in image-editing prompt in `cutout-edits.json`. `prepare-cutouts.mjs` packages the transparent edits with alpha-edge cleanup. The other product images and instruction photos already have transparent backgrounds. Excess transparent canvas is trimmed from the native product photos, and one complete product view is shown per page; the General Health bundle uses the five individual test cutouts together. All twenty primary product images have alpha transparency and transparent corner pixels; the cream panel shows through with no white rectangle. `media-data.mjs` embeds the used assets once; `media.mjs` maps each product and instruction step to its asset. `media-sources.json` retains private source provenance.
- Kept the existing Health hub, Bloods panels, nutrition, homepage and member routes. One reversible testing block is inserted into the accepted Health hub. The public Worker retains the real shared publisher shell.
- Extended the authenticated HQ catalogue to all twenty draft products. Staff can edit supplier codes, trade/retail/delivery figures, VAT and internal notes with revision control and audit history. Supplier identity and source links are omitted from the HQ client projection.
- Applied the idempotent migration to the existing live D1 database and immediately verified thirteen records in `testing_products` and seven in `testing_range_extras`. Every record remains `status='draft'` and `sale_enabled=0`, enforced by database constraints. Supplier codes and SHIFT trade/retail prices are null. The migration updates source facts without overwriting staff commercial fields.
- The public pages include a closed purchase panel. Each item is explicitly zero stock with a TBC SHIFT price, a quantity control and a disabled Add to basket button. The closed purchase route rejects direct requests with HTTP 409 and creates no orders, payment sessions, stock reservations, result imports or dispatches. Lab reports remain in our testing partner’s secure results portal.

## Source and preservation

The approved wrapper base is `a4b8f173e3900e2f0062b3d7483a1d910b9ef2bf` on `release/olivit-health-approved-20261027`, not the older `main` Health implementation. This feature changes only `health-nutrition/public.mjs`, `health-nutrition/worker.mjs` and `health-testing/`. Preserve later work from other component owners when preparing publication. Do not deploy the old core Worker or change its entry point, bindings, cron, secrets or unrelated routes.

Individual GitHub files were used. Automatic approval review prohibited a full clone under SST resource restrictions. No dependency installation or replacement repository was used. Remote D1 work ran through the existing SST managed-check helper and reused the cached Wrangler installation.

## Validation

`node --test health-testing/*.test.mjs health-nutrition/feature.test.mjs`

All twenty-six focused checks passed. They cover the expanded range, draft-only constraints, idempotence, commercial-field preservation, privacy projection, HQ authentication/origin/revision checks, audit records, all twenty-one public routes, image coverage and preservation of existing Health/Nutrition routes.

Browser review confirmed that the original prostate box and device photographs load, that all four original instruction photos load, and that the portable review can open the detail page and scroll to its instructions. A 390px mobile frame rendered without horizontal overflow (375px body including the browser scrollbar). The portable review uses a simplified navigation shell; production rendering retains the existing publisher’s real shell.

`node health-testing/preview.mjs` regenerates static review routes, original photo assets and the self-contained `review.html`. Its twenty product links and in-page anchors work without a web server; it has no backend write functionality. The screenshot `product-colours-review.jpg` records the corrected real-product treatment. Older screenshots represent superseded layouts.

## Publication approved and completed — 28 October 2026

Matt explicitly instructed “publish” after reviewing the storefront. The range and twenty detail pages are now live at https://shiftsometimber.co.uk/shift-health/testing. The testing HQ extension and narrow API route are deployed. The draft catalogue remains sale-disabled in D1. Purchasing and dispatch remain disabled. The production receipt below supersedes earlier pre-publication notes.

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

## Full storefront — 28 October 2026

Matt signed off the cream visual treatment pending higher-quality partner originals, then asked for the main shop and a click-through purchase page for every item, with zero stock and price TBC. The existing audited content and imagery are retained.

The main page now has a range showcase, three starting routes, product search by name/description/marker, category filtering, twenty priced-and-stocked cards, and the five agreed sections. Server rendering supports search/category queries without JavaScript; the portable review filters in place. Each product page has the original gallery, TBC price, zero-stock notice, bounded quantity selector, disabled basket control, detailed content and related product links. The three future lab tests additionally retain their coming-soon state.

`storefront.mjs` holds the closed SHIFT storefront inventory: all twenty products have `stockQuantity: 0`, `pricePence: null` and `saleEnabled: false`. Partner availability and partner reference prices never enable a SHIFT sale. A POST to `/shift-health/testing/:id/purchase` returns 409 without contacting the database, upstream commerce, Stripe or fulfilment. Production checkout for these products is not enabled or commissioned by this presentation change.

All twenty-six checks pass, including every product's zero-stock/TBC purchase panel, escaped and empty searches and direct/tampered purchase requests across all twenty products. This version is prepared for review and saved on the existing feature branch. Public website/HQ publication remains separate from design sign-off. No live D1 change was needed: the audited twenty catalogue rows remain draft and sale-disabled as verified in the existing receipt.

Browser acceptance for the storefront: search `HbA1c` returned one Diabetes product; supplement filtering returned three products and opened Multivitamin with its verified sixty-capsule details; bundle filtering returned four and opened General Health Combo with its six product types. Both the main page and Prostate Health detail rendered within a 390px frame with 375px content/scroll widths. The quantity control changed to two while the basket button remained disabled. `storefront-range-review.jpg` and `storefront-product-review.jpg` show this version.

## Publication authorised — 28 October 2026

Matt explicitly instructed “publish” after reviewing commit `623288fdf9022d68d94caab43a3d9fe5c51d9c7d`. Live preflight found newer basket/recommendation work in the deployed Health/Nutrition module. The publication composition therefore retains that entire exact deployed module (SHA-256 and version recorded in `publication-manifest.json`) and delegates every unowned request to it unchanged. It handles only the new testing pages/assets/API, adds one testing discovery block to the retained Health hub and appends the testing HQ script alongside the retained extensions. The existing public wildcard routes cover the new pages and assets; only the narrow testing HQ API route needs adding. Three additional publication-preservation checks pass, for twenty-nine focused passes across the retained evidence.

The deployment uses immutable individual source files in memory, without a repository clone, dependency installation, new Mac workspace or old core Worker deployment. Publication does not activate stock, prices, payments or fulfilment.

## Verified production receipt

The 28 October publication succeeded: deployment `6590597d-805c-4aad-8266-91aaa0f2810e`, version `efdd68cd-a700-4894-b40c-4f5f494b2e87`, source commit `cc11024bd85f01a8eae29f9059649b1cbaae0a1c`. `production-receipt.json` records all twenty live HTTP 200 product pages, forty-two live product/instruction images, successful server search, a real closed-purchase HTTP 409, authenticated-boundary HTTP 401 for the testing HQ API, and all twenty D1 rows remaining draft/sale-disabled. The five baseline main-content hashes matched after removing the one authorised testing hub block. Existing routes and service bindings remained unchanged; one narrow testing HQ API route was added, taking the route count to 894. The exact prior deployed Health/Nutrition module, including newer basket and recommendation work, is retained inside the production composition.

The managed release completed with exit 0 in 46.13 seconds and process-group cleanup. No Mac repository clone, permanent working directory, dependency installation or browser session was created. No external communications were sent. A cloud-browser check opened the live main page, searched “prostate” (two matches), followed the Prostate Health link and confirmed the real image, TBC price, zero stock and disabled basket control. The live page was kept open for Matt. Privileged HQ browser load/save was not exercised in this website publication; the source-level authentication, revision and save checks passed.

## HQ CSV fulfilment — 28 October 2026

Matt instructed us to build the full process up to actually sending the email, with the Gmail account as the destination if a mail test is needed. `shiftsometimber@gmail.com` was verified from the connected Gmail profile. No email has been sent and no send transport or send endpoint is added.

The new Testing orders HQ workspace contains the paid-order queue, holds, partner CSV column setup, immutable export batches, CSV preview/download, full To/CC/subject/body/attachment review, downloadable unsent MIME drafts, export history, manual submission/acknowledgement records and per-order partner tracking. Synthetic batches are clearly separated and always address their draft to the verified Gmail account. No synthetic customer order or payment is created. Opening a draft or downloading a CSV does not record a submission.

The queue reads the existing canonical `orders`, `commerce_order_items`, `commerce_order_details` and refund tables. Only mapped testing SKUs enter the queue, and exports require verified live paid sessions, suitable source order states, complete delivery details, supplier codes and confirmed CSV setup. A paid order is selected as a whole, including every testing line. Refunds, cancellations, test payments, missing codes, future products and formula/control-like CSV text are held. Changes to orders, recipient details, quantities, product codes or CSV revision invalidate an unsent prepared export. Atomic batch guards and active-line uniqueness prevent concurrent duplicate inclusion. Cancelling an unsent batch preserves history and returns its orders to the queue.

`fulfilment-schema.sql` adds only dedicated testing fulfilment tables. It leaves core orders, payments and catalogue commercial values untouched. The new routes sit below the existing authenticated testing API. They require an owner/admin/operations HQ identity and same-origin writes; no role or sign-in gate is weakened. Downloads are private, uncached and audited. No clinical answers, results, member account fields or session values are exported. The final partner column layout, codes and destination remain unconfirmed. Public purchasing stays locked at zero stock and TBC prices.

Forty-three focused tests pass. The synthetic browser review prepared a test batch, downloaded and hash-checked the CSV, displayed the complete Gmail-addressed email draft, saved setup revisions and retained export history. A separate Python MIME parser verified the draft and exact CSV attachment bytes; no SMTP/email-delivery test is required for this build because delivery is deliberately outside scope. The mobile review had matching 375px viewport and content widths. The preview uses isolated in-memory synthetic records, not the production sign-in system. The live HQ browser was signed out, so a genuine signed-in load/save check remains a distinct acceptance step.

Use the HQ root URL with `#testing-orders` for a direct link. The existing exact root Worker route does not run for query-string deep links, so `?view=testing-orders` can bypass extension injection. No broad HQ route takeover is needed; the hash stays client-side.

## Fulfilment deployment verified

The private HQ addition is deployed: source `cc2855e88eaf29b64e9887a33b5d315f465d6223`, deployment `4697f5c6-7061-423e-9f96-a1259a4d04ca`, version `dcbf654a-81db-42ad-a550-b3e3e9dff8ca`. `fulfilment-production-receipt.json` records the live result. Nine idempotent schema statements created the dedicated fulfilment tables and the one unconfirmed configuration record; there are no production export batches. Three unauthenticated endpoints returned 401 and a cross-origin write returned 403. The exact released client asset is served, and the HQ root includes nutrition, testing catalogue and testing-order scripts once each. All seven customer-page main-content hashes stayed identical, existing routes and bindings stayed intact, and all twenty catalogue records remain draft/sale-disabled. The bounded Mac release exited 0 after 40.51 seconds, with child-process cleanup. No email was sent.

The operational workspace can be opened from Orders & products, Testing orders, or the HQ root plus `#testing-orders`. The final partner template, supplier codes and submission destination remain to be entered and confirmed. A genuine signed-in browser load/save is the remaining acceptance check; the current cloud HQ session is signed out. No account, session or sign-in protection has been bypassed.

### Live sign-in acceptance completed

The initial user-provided credentials were rejected. Matt then explicitly requested a retry and entered his details through secure browser authentication. HQ visibly signed in as the existing owner, with its live Shift Core connection confirmed. No credential values were read, logged or saved, and no sign-in protection or session gate was bypassed. Reloading the previously open tab loaded the published testing-order extension.

The genuine production browser acceptance is now complete: the paid-order queue loaded with zero orders; the existing unconfirmed CSV setup saved unchanged as revision 2; synthetic batch `TEST-20261028-05622d18` produced two test rows; its unsent `.eml` file downloaded successfully; and its export-history row persisted after a reload. An independent Python parser found zero MIME defects, `X-Unsent: 1`, the verified Gmail recipient, one CSV attachment and the expected exact CSV hash. The test created no canonical customer order, payment or submission record. The labelled synthetic draft remains available for review. No email was sent.

This acceptance supersedes the earlier signed-out/pending browser notes above. The partner CSV template, supplier codes and destination remain genuinely unconfirmed. Purchasing and email sending remain disabled. The released code and deployment are unchanged; only this receipt and documentation record the successful acceptance.


## Integrated delivery, refreshed range and search content — in release preparation

Matt extended the task to sending directly from HQ, immediately or at a chosen UK date/time. The reviewed email now includes the partner, From, Reply-to, To, exact message, CSV and order context. A durable dedicated outbox, revision/hash checks, atomic claim, provider acceptance receipt and per-minute scheduler support send now, schedule, cancel and reschedule. Ambiguous delivery is held for investigation instead of retried blindly. Test-mode mail is locked to the verified SHIFT Gmail account. Live partner submission still requires confirmed destination, template and codes. Zero stock, TBC prices and the purchasing lock remain.

The public revision adds the smaller Testing & Wellbeing grid card, proportionate product panels and seventeen edited single-product/leaflet photos without supplier wordmarks. Bundles use the checked individual photos: three generated bundle edits were rejected because their labels altered strengths or directions. Original source images are retained.

All twenty items now have original explanations across the six agreed questions, specific interpretation limits and linked primary health guidance. Unique page metadata, canonical URLs, internal product links, matching visible FAQs, factual Product/Breadcrumb/WebPage/Collection schema and a scoped twenty-one-URL sitemap support search and answer discovery. Unconfirmed prices, reviews, ratings, clinical endorsement and ranking guarantees are not invented. Existing root sitemap ownership is preserved.

Fifty-nine focused checks pass. Desktop review confirmed the lab and home-test proportions and six-section layout. Mobile range and Testosterone detail had matching 375px viewport/scroll widths. Production and actual Gmail delivery acceptance remain to be recorded after release; local mail previews use an isolated fake sender and are not proof of delivery.
