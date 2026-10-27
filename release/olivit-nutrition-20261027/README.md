# Approved SHIFT Health / Supplements & Nutrition

Matt approved the fuller-dad family park hero, image-led Health hub, nutrition storefront and deployment of both pages on 27 October 2026. The current scope also saves eight real draft catalogue records in HQ, with separate supplier references, illustrative packs and editable “SHIFT says…” notes.

## Current checkpoint


- **Deployed and verified:** `a4b8f173e3900e2f0062b3d7483a1d910b9ef2bf`, [release 40592806016](https://github.com/shiftsometimber/shift-core/actions/runs/40592806016).
- All eight sort choices are selectable. Our range defaults to A–Z; A–Z, Z–A and creation-date ordering work. Price, popularity and Highest rated selections persist and show an explained A–Z fallback until confirmed public prices, real sales figures or published ratings exist. Highest rated orders by average review score, using review count to break ties and placing unrated products last. No invented prices or popularity metrics.
- Ten focused source tests pass. Compiled and live Chrome checks pass at 1440, 736, 390 and 320 px with zero page errors. Mobile checks apply both price choices, Most popular and Highest rated, verify the selected option persists, and confirm the honest fallback.
- Feature cards remain Weight management → Bloods → Testosterone → Supplements & Nutrition. Approved pictures, colours, individual typography and the fuller-dad family park hero remain intact.
- Eight HQ drafts, exact provider bytes and all 11 owned routes verified. Zone route count is 890; these follow-up releases add no routes. Core, the accepted publisher, My Timber and underlying HQ communications deployments are retained.
- Existing-Worker updates stage a version before browser checks, verify live deployment identity is unchanged during preparation, and promote the exact verified version afterwards. No-op route assignments are skipped.
- Runtime source is `health-nutrition/`. Public pages: https://shiftsometimber.co.uk/shift-health and https://shiftsometimber.co.uk/shift-health/supplements-nutrition. HQ: Orders & products → Supplements & Nutrition.
- Earlier successful releases: initial pages/HQ 40585248724; feature reorder 40588701303; expanded sorting 40591338188. Current behaviour supersedes the disabled price/popularity choices in the latter.

## Checkout recommendations — built, not deployed

Matt authorised building optional checkout recommendations and a mixed basket on 27 October 2026. This follow-up is isolated in `checkout-extras/` and the existing medicine, public basket and HQ integration files. The accepted live source above remains unchanged.

- Two HQ-controlled suggestions maximum, using existing SHIFT says notes; free My Timber support and an immediate Continue without extras. Nothing preselected. Default suggestions are protein convenience formats, not personalised clinical recommendations.
- Treatment plus several supplement products and quantities use one Stripe Checkout Session and one order reference. Supplement-only checkout is also implemented. The pharmacy and supplement records remain separate for stock, fulfilment and reconciliation. Existing apparel checkout is retained separately.
- Exact server-priced packs, one delivery charge per supplier parcel, combined treatment/extras total, account ownership, revision/stock checks, atomic reservations, paid webhook settlement and expired-session recovery are implemented. Clinical verification remains mandatory for treatment.
- HQ can choose recommendation switches and priority, edit the SHIFT says notes and read supplement order records. These controls cannot activate draft products.
- Purchasing stays off by default (`SUPPLEMENTS_CHECKOUT_ENABLED` unset/false), with no confirmed offer records seeded. Existing eight catalogue drafts stay locked. Olivit API/authentication, real stock/price feed, delivery coverage/tariff, verified labels/VAT and fulfilment transport remain unconfirmed. No supplier order, real payment or external email was created in testing.
- Tests and Chrome fixture receipts live in `checkout-extras/evidence/`; these are synthetic-data checks, not live payment or supplier acceptance. A separate draft PR preserves the release owner's merge responsibility.

The coordinated release must install the additive migration with the current catalogue, then publish Core's API/basket asset, the front-door client, and the Health/HQ component together. Do not push this source through the previous Health-only deployment lane. Before enabling sales, connect Olivit fulfilment and tracking, validate real SKU/pack/labels/prices/stock/delivery and delivered margin, complete sandbox payment/refund/email/address/end-to-end supplier checks, then obtain the scoped production release approval. Pending products can be shown as Explore only.

## Catalogue truth

Eight proposed products are idempotently seeded into dedicated `supplement_products` and `supplement_product_history` tables. All are drafts, all have purchasing disabled, and retail/trade prices, supplier SKUs, EANs, VAT and stock start as unknown. Supplier packs are stored separately from illustrated packaging: the supplier page and photo can describe different variants. No invented sample retail prices are deployed.

HQ provides a separate Supplements & Nutrition section plus the requested Bloods, TRT, Fertility, Sleep, Other and Food folders. The latter show matching records from the existing catalogues; they do not activate new services or create medicine stock. Draft commercial values are internal planning fields only.

Olivit account is active at discount level 5 on non-promotional products. API credentials/docs, exact variants and labels, stock/price feed, dropship terms and delivered margin remain pending. Ben Gulwell was emailed with Matt’s approval on 27 October; sent copy verified. Do not resend.

## Release and recovery

The scoped workflow uses the existing `cloudflare-production-promote` concurrency group. It verifies current source, captures exact predecessor routes and retained service versions, verifies prepared provider bytes, saves the product drafts, and promotes only the eight Health presentation aliases/prefixes, two HQ document aliases and one new HQ supplements API route. Only one route is added. Route capacity and existing owners are checked before upload. No existing route outside that set may change.

On failure, restore only routes still owned by this release to their captured predecessors. Never roll back someone else’s deployment or route. Keep saved draft records: do not delete data or overwrite HQ edits during reruns. Provider receipts and browser evidence are retained by the workflow.
