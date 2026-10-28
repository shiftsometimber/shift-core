# Approved SHIFT Health / Supplements & Nutrition

Matt approved the fuller-dad family park hero, image-led Health hub, nutrition storefront and deployment of both pages on 27 October 2026. The current scope also saves eight real draft catalogue records in HQ, with separate supplier references, illustrative packs and editable “SHIFT says…” notes.

## Product explanations — approved implementation, 28 October 2026

Matt approved applying the fuller explanations to the eight supplement items after reviewing `SHIFT-Olivit-Review-and-Product-Copy.html` and confirming that credible, useful detail must earn trust for the new brand. This is presentation/editorial scope only; it does not authorise supplier sales activation, pricing, orders or external communications.

- Implemented in isolated branch `work/olivit-product-detail-20261028`, based on the exact PR #1441 head `8c82a4a8857e472a8895b40a871e40dd264adfbf`.
- Adds the approved purpose, practical fit, limits, suitability, FAQs and dated source links for all eight existing identities, plus the approved storefront choice guide. Black, cream and ash styling remains scoped to the Health component.
- Updated summaries and SHIFT says notes replace only the original seed wording; subsequent HQ edits are retained. Static ingredient explanations bind to the reviewed ID/name/brand/illustrated pack/flavour so a repurposed catalogue item cannot inherit the wrong guide.
- No catalogue migration, live data write, sale offer, runtime route, payment, clinical or supplier integration is changed. The illustrative pack mismatches remain explicitly unconfirmed; no final SKU/pack is invented.
- Local validation: 17 focused editorial, catalogue, security and purchasing-hold tests pass. The existing browser verifier now covers all eight detail pages at 1440, 736, 390 and 320 px, including FAQs, sources, loaded images, contrast and overflow. Its run result is recorded below when available; adding checks is not evidence they passed.
- Current release-owner source/control record could not be resolved from the recorded Mac working copy; its Git pointer is stale. It was not restored. GitHub reported no running or queued workflows during the pre-edit check. Existing source/merge/release ownership remains in force.
- First CI source/commerce checks passed (61 tests). The visual check found that a captured Health shell retained the previous owned stylesheet, overriding new panel colours; the renderer now replaces that owned stylesheet, with an added regression check. The failing run is 40783089137; it is not a passing browser receipt.
- Next action: finish the branch's existing CI lane, retain the browser evidence and hand the exact tested source to the established release owner. Do not push this change through the older Health-only lane: PR #1441 includes the serving checkout recommendation presentation that must be preserved.

## Earlier Health presentation watermark (retained evidence)


- **Deployed and verified:** `a4b8f173e3900e2f0062b3d7483a1d910b9ef2bf`, [release 40592806016](https://github.com/shiftsometimber/shift-core/actions/runs/40592806016).
- All eight sort choices are selectable. Our range defaults to A–Z; A–Z, Z–A and creation-date ordering work. Price, popularity and Highest rated selections persist and show an explained A–Z fallback until confirmed public prices, real sales figures or published ratings exist. Highest rated orders by average review score, using review count to break ties and placing unrated products last. No invented prices or popularity metrics.
- Ten focused source tests pass. Compiled and live Chrome checks pass at 1440, 736, 390 and 320 px with zero page errors. Mobile checks apply both price choices, Most popular and Highest rated, verify the selected option persists, and confirm the honest fallback.
- Feature cards remain Weight management → Bloods → Testosterone → Supplements & Nutrition. Approved pictures, colours, individual typography and the fuller-dad family park hero remain intact.
- Eight HQ drafts, exact provider bytes and all 11 owned routes verified. Zone route count is 890; these follow-up releases add no routes. Core, the accepted publisher, My Timber and underlying HQ communications deployments are retained.
- Existing-Worker updates stage a version before browser checks, verify live deployment identity is unchanged during preparation, and promote the exact verified version afterwards. No-op route assignments are skipped.
- Runtime source is `health-nutrition/`. Public pages: https://shiftsometimber.co.uk/shift-health and https://shiftsometimber.co.uk/shift-health/supplements-nutrition. HQ: Orders & products → Supplements & Nutrition.
- Earlier successful releases: initial pages/HQ 40585248724; feature reorder 40588701303; expanded sorting 40591338188. Current behaviour supersedes the disabled price/popularity choices in the latter.

## Checkout recommendations — deployed and verified

Matt authorised the build and then explicitly approved getting it live, including permanent SHIFT tracking SKUs. The recommendation presentation and HQ SKU work are now deployed and verified. Full mixed-payment code remains prepared for later supplier-connected activation.

- Live presentation source: `7871557c41e2a82f77deee8143ec64df91c4938b`, version `2361f9d3-5b68-4921-8a6b-1263d5442d9b`, successful [run 40599920046](https://github.com/shiftsometimber/shift-core/actions/runs/40599920046).
- Automatic SKU creation hooks: source `9d7f7e20b47bd5a969ff612c525a5db2b1bfb530`, successful [run 40600513429](https://github.com/shiftsometimber/shift-core/actions/runs/40600513429), verified 27 October 2026 at 23:13 UK time. This data-only step preserved the deployed runtime, routes and every existing SKU.
- 72 current catalogue identities registered: 18 shop products, 7 medicine families, 39 medicine variants and 8 supplements. Native shop codes are retained; new identities use permanent `SST-I-########` codes, separate from supplier SKU/EAN. Database hooks allocate a unique code in the same transaction as every future insert into these four catalogue tables. SKU reassignment/reuse is blocked.
- The actual serving treatment support screen now includes two HQ-driven supplement cards and SHIFT says notes. Existing bloods, nutrition-session information, recent-results control, skip buttons, free My Timber support and ordering holds are preserved. The old payment/clinical/treatment-option Workers were not replaced.
- 55 focused tests pass. Compiled and live checks pass at 1440, 736, 390 and 320 px with zero page errors; independent Mac Chrome confirms the live mobile cards. Health pages, filters and the HQ wrapper also pass. Fourteen owned routes verified; three new exact routes, total 893. Supplement purchasing remains disabled.
- Receipts are in `release/checkout-recommendations-20261027/evidence/`. Production/browser artifact 12777877795 has SHA256 `2760cb60fb8805e0c9c469dd2c7c4376cbf87bf11e62aaafccfaec5e7c00ecf3`; automatic-hook artifact 12777718348 has SHA256 `cf57651e0f638fc4a25702f2b0e422ae17e9495c67f5e4a4900d0570f153e8bd`.
- Broader existing PR checks reported member-route and Today/Progress baseline failures outside this component. The approved presentation release retained those serving services and used exact component, permissions, stock/payment, provider and real-page checks; it did not claim an all-estate pass.


- Two HQ-controlled suggestions maximum, using existing SHIFT says notes; free My Timber support and an immediate Continue without extras. Nothing preselected. Default suggestions are protein convenience formats, not personalised clinical recommendations.
- Treatment plus several supplement products and quantities use one Stripe Checkout Session and one order reference. Supplement-only checkout is also implemented. The pharmacy and supplement records remain separate for stock, fulfilment and reconciliation. Existing apparel checkout is retained separately.
- Exact server-priced packs, one delivery charge per supplier parcel, combined treatment/extras total, account ownership, revision/stock checks, atomic reservations, paid webhook settlement and expired-session recovery are implemented. Clinical verification remains mandatory for treatment.
- HQ can choose recommendation switches and priority, edit the SHIFT says notes and read supplement order records. These controls cannot activate draft products.
- Purchasing stays off by default (`SUPPLEMENTS_CHECKOUT_ENABLED` unset/false), with no confirmed offer records seeded. Existing eight catalogue drafts stay locked. Olivit API/authentication, real stock/price feed, delivery coverage/tariff, verified labels/VAT and fulfilment transport remain unconfirmed. No supplier order, real payment or external email was created in testing.
- Earlier build-only fixtures remain in `checkout-extras/evidence/`; the later actual live presentation and database-hook receipts above supersede their not-deployed status for this subset. They are not live payment or supplier acceptance. Draft PR #1441 preserves the release owner's merge responsibility.

The initial full-payment release plan below is retained for the later sales activation. The current presentation release uses `release/checkout-recommendations-20261027/`, staged version uploads, the existing production concurrency group, provider byte/retained-service guards and browser checks against the actual serving treatment screen. The SKU register preserves existing native SKUs and adds permanent `SST-I-########` identities for medicine records/variants and supplement drafts; supplier codes remain separate.

The coordinated full-payment release must install the additive migration with the current catalogue, then publish Core's API/basket asset, the front-door client, and the Health/HQ component together. Do not push this source through the previous Health-only deployment lane. Before enabling sales, connect Olivit fulfilment and tracking, validate real SKU/pack/labels/prices/stock/delivery and delivered margin, complete sandbox payment/refund/email/address/end-to-end supplier checks, then obtain the scoped production release approval. Pending products can be shown as Explore only.

## Catalogue truth

Eight proposed products are idempotently seeded into dedicated `supplement_products` and `supplement_product_history` tables. All are drafts, all have purchasing disabled, and retail/trade prices, supplier SKUs, EANs, VAT and stock start as unknown. Supplier packs are stored separately from illustrated packaging: the supplier page and photo can describe different variants. No invented sample retail prices are deployed.

HQ provides a separate Supplements & Nutrition section plus the requested Bloods, TRT, Fertility, Sleep, Other and Food folders. The latter show matching records from the existing catalogues; they do not activate new services or create medicine stock. Draft commercial values are internal planning fields only.

Olivit account is active at discount level 5 on non-promotional products. API credentials/docs, exact variants and labels, stock/price feed, dropship terms and delivered margin remain pending. Ben Gulwell was emailed with Matt’s approval on 27 October; sent copy verified. Do not resend.

## Release and recovery

The scoped workflow uses the existing `cloudflare-production-promote` concurrency group. It verifies current source, captures exact predecessor routes and retained service versions, verifies prepared provider bytes, saves the product drafts, and promotes only the eight Health presentation aliases/prefixes, two HQ document aliases and one new HQ supplements API route. Only one route is added. Route capacity and existing owners are checked before upload. No existing route outside that set may change.

On failure, restore only routes still owned by this release to their captured predecessors. Never roll back someone else’s deployment or route. Keep saved draft records: do not delete data or overwrite HQ edits during reruns. Provider receipts and browser evidence are retained by the workflow.
