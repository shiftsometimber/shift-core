# Approved SHIFT Health / Supplements & Nutrition

Matt approved the fuller-dad family park hero, image-led Health hub, nutrition storefront and deployment of both pages on 27 October 2026. The current scope also saves eight real draft catalogue records in HQ, with separate supplier references, illustrative packs and editable “SHIFT says…” notes.

## Current checkpoint

- Latest request: add Highest rated as an eighth selectable sort choice. Uses verified five-star averages, with review count to break ties and unrated items last; pending ratings use an explained A–Z fallback. Prepared and source-tested; live verification pending.

- **Deployed and verified:** `1d36d19664995f757a8bea6afd7796885a719bbf`, [release 40592039823](https://github.com/shiftsometimber/shift-core/actions/runs/40592039823).
- All seven sort choices are selectable. Our range defaults to A–Z; A–Z, Z–A and creation-date ordering work. Price and popularity selections persist and show an explained A–Z fallback until confirmed public prices or real sales figures exist. No invented prices or popularity metrics.
- Ten focused source tests pass. Compiled and live Chrome checks pass at 1440, 736, 390 and 320 px with zero page errors. Mobile checks apply both price choices and Most popular, verify the selected option persists, and confirm the honest fallback.
- Feature cards remain Weight management → Bloods → Testosterone → Supplements & Nutrition. Approved pictures, colours, individual typography and the fuller-dad family park hero remain intact.
- Eight HQ drafts, exact provider bytes and all 11 owned routes verified. Zone route count is 890; these follow-up releases add no routes. Core, the accepted publisher, My Timber and underlying HQ communications deployments are retained.
- Existing-Worker updates stage a version before browser checks, verify live deployment identity is unchanged during preparation, and promote the exact verified version afterwards. No-op route assignments are skipped.
- Runtime source is `health-nutrition/`. Public pages: https://shiftsometimber.co.uk/shift-health and https://shiftsometimber.co.uk/shift-health/supplements-nutrition. HQ: Orders & products → Supplements & Nutrition.
- Earlier successful releases: initial pages/HQ 40585248724; feature reorder 40588701303; expanded sorting 40591338188. Current behaviour supersedes the disabled price/popularity choices in the latter.

## Catalogue truth

Eight proposed products are idempotently seeded into dedicated `supplement_products` and `supplement_product_history` tables. All are drafts, all have purchasing disabled, and retail/trade prices, supplier SKUs, EANs, VAT and stock start as unknown. Supplier packs are stored separately from illustrated packaging: the supplier page and photo can describe different variants. No invented sample retail prices are deployed.

HQ provides a separate Supplements & Nutrition section plus the requested Bloods, TRT, Fertility, Sleep, Other and Food folders. The latter show matching records from the existing catalogues; they do not activate new services or create medicine stock. Draft commercial values are internal planning fields only.

Olivit account is active at discount level 5 on non-promotional products. API credentials/docs, exact variants and labels, stock/price feed, dropship terms and delivered margin remain pending. Ben Gulwell was emailed with Matt’s approval on 27 October; sent copy verified. Do not resend.

## Release and recovery

The scoped workflow uses the existing `cloudflare-production-promote` concurrency group. It verifies current source, captures exact predecessor routes and retained service versions, verifies prepared provider bytes, saves the product drafts, and promotes only the eight Health presentation aliases/prefixes, two HQ document aliases and one new HQ supplements API route. Only one route is added. Route capacity and existing owners are checked before upload. No existing route outside that set may change.

On failure, restore only routes still owned by this release to their captured predecessors. Never roll back someone else’s deployment or route. Keep saved draft records: do not delete data or overwrite HQ edits during reruns. Provider receipts and browser evidence are retained by the workflow.
