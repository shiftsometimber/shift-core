# Approved SHIFT Health / Supplements & Nutrition

Matt approved the fuller-dad family park hero, image-led Health hub, nutrition storefront and deployment of both pages on 27 October 2026. The current scope also saves eight real draft catalogue records in HQ, with separate supplier references, illustrative packs and editable “SHIFT says…” notes.

## Current checkpoint

- Latest instruction: all seven sort choices selectable now. Price/popularity selections remain selected and use a clearly explained A–Z fallback while data is pending. Prepared and source-tested (10 pass); deployment verification pending. This supersedes the previous disabled-option behaviour.

- Latest adjustment: alphabetical default range; A–Z, Z–A, ascending/descending price, newest and most-popular choices. Price and popularity options are unavailable until verified public prices and real sales data exist. Newest uses creation date, not edit date. **Deployed and verified** from `1608d3e1ef0f533a27abc88561680e3bc937d955` in [release 40591338188](https://github.com/shiftsometimber/shift-core/actions/runs/40591338188). Ten source tests and compiled/live Chrome checks at 1440, 736, 390 and 320 px pass with zero page errors. All seven menu choices, default A–Z and applied Z–A ordering are browser-verified; unavailable price/popularity choices are explicitly disabled.
- Existing-Worker updates now use version upload before browser checks and an explicit guarded promotion afterwards. Preparation verifies that the active deployment does not move; unchanged route owners are not rewritten.

- Latest requested adjustment (27 October): the four feature cards read Weight management → Bloods → Testosterone → Supplements & Nutrition. **Deployed and verified** from `905bae25f7d3afce3d676f7e6a1445e77552273b` in [release 40588701303](https://github.com/shiftsometimber/shift-core/actions/runs/40588701303). Nine focused tests and compiled/live Chrome checks at all four widths pass, including the exact four-card order. Card-specific typography, pictures and colours are retained. No new routes.

- Approved visual source: latest family-park mock-up, including fuller dad; not the earlier plain nutrition section.
- Read-only provider preflight: passed (run 40580631795). 889 routes before this release.
- Implementation: `health-nutrition/`; isolated presentation Worker delegates unchanged Health routes to the accepted blog publisher and preserves the accepted HQ communications document before adding its catalogue extension.
- Existing Core, clinical/device pages, My Timber presentation and HQ communications Worker bytes remain untouched.
- Nine focused tests pass: real SQLite saves and history, role and origin boundaries, stale-write rejection, public/private data separation, server filtering and delegation.
- **Deployed and verified** from `bc3933f60819b0efbea47a37617006d9aacbd57f` in [successful release 40585248724](https://github.com/shiftsometimber/shift-core/actions/runs/40585248724). Both live pages, filters, images, product details and HQ navigation pass Chrome checks at 1440, 736, 390 and 320 px with zero page errors. A separate Mac Chrome live check also passes.
- Exact provider bytes, all 11 owned routes, eight saved HQ drafts and all four retained service deployments verified. Final zone route count: 890 (one addition).
- Public pages: https://shiftsometimber.co.uk/shift-health and https://shiftsometimber.co.uk/shift-health/supplements-nutrition. HQ: Orders & products → Supplements & Nutrition.
- The one-time obsolete pretraffic-check recovery job has been removed from this closeout source; the production queue and bounded browser-step timeouts remain. Runtime code matches the verified deployment.

## Catalogue truth

Eight proposed products are idempotently seeded into dedicated `supplement_products` and `supplement_product_history` tables. All are drafts, all have purchasing disabled, and retail/trade prices, supplier SKUs, EANs, VAT and stock start as unknown. Supplier packs are stored separately from illustrated packaging: the supplier page and photo can describe different variants. No invented sample retail prices are deployed.

HQ provides a separate Supplements & Nutrition section plus the requested Bloods, TRT, Fertility, Sleep, Other and Food folders. The latter show matching records from the existing catalogues; they do not activate new services or create medicine stock. Draft commercial values are internal planning fields only.

Olivit account is active at discount level 5 on non-promotional products. API credentials/docs, exact variants and labels, stock/price feed, dropship terms and delivered margin remain pending. Ben Gulwell was emailed with Matt’s approval on 27 October; sent copy verified. Do not resend.

## Release and recovery

The scoped workflow uses the existing `cloudflare-production-promote` concurrency group. It verifies current source, captures exact predecessor routes and retained service versions, verifies prepared provider bytes, saves the product drafts, and promotes only the eight Health presentation aliases/prefixes, two HQ document aliases and one new HQ supplements API route. Only one route is added. Route capacity and existing owners are checked before upload. No existing route outside that set may change.

On failure, restore only routes still owned by this release to their captured predecessors. Never roll back someone else’s deployment or route. Keep saved draft records: do not delete data or overwrite HQ edits during reruns. Provider receipts and browser evidence are retained by the workflow.
