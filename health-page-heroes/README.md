# Approved SHIFT Health heroes

Matt signed off deployment of all seven page heroes. The active release is `presentation-release.json`, published by `publish-presentation.py` from an immutable GitHub commit.

The dedicated `shift-health-heroes-20261029` publisher calls each page's existing service, then replaces only its old hero. It serves the approved photographs, live HTML copy and real page anchors. Four existing upstream services continue to own all page guides, metadata, product content and availability controls. Their modules, bindings, named exports and schedules are not changed.

The seven page families use 14 exact HTTPS canonical routes and 14 prefix routes across the main and www hostnames. Prefix routes allow query-string images and category filters; specific child routes retain precedence and other child paths pass through to the original service. `route-baseline.json` records the previous owners. The publisher checks ownership before each route change and restores its own route changes on a failed release. No schedule or messaging capability is added.

The seven pages are testosterone and energy, blood tests, hair loss, blood pressure monitoring, men's mental health, sleep apnoea, and supplements and nutrition. The previously published testing collection hero remains with its current publisher.

`check.mjs` verifies photographs, boundaries, original guides and controls, one H1, real CTA anchors, image responses and product-detail exclusions against the captured public DOM baseline. `check-presentation.mjs` verifies the final module graph and all seven upstream dispatches. Desktop and 390px mobile previews were visually checked.

A preliminary attempt to wrap the blog publisher was restored to its previous version after Cloudflare returned HTTP 502 during verification. Its prior version remains `8d48084c-dea6-4b8a-983e-4eb6a0629def`, deployment `ef53ba2e-4bf3-4158-959d-9cca5432eb65`. The final release leaves that publisher intact and uses the dedicated presentation worker instead.

## Verified production release

Source `516e15348ea8555ffae067e965f271988acb76f7`; deployment `8200cc90-a94e-4dc4-bf4b-4a0a010b77ec`; version `17dee107-6fa5-47c9-a071-83a6119633ff`. All seven public images loaded; every CTA was clicked and its destination verified below the fixed header. Supplements filtering and a product detail page were checked, with ordering still closed. The existing testing garden hero was also verified. API and browser receipts, plus a live screenshot, are saved alongside this release.

## Latest styling correction

Matt requested a black SHIFT Bloods background and smaller gaps above each item hero. Source `dcf5f1b50529b7855e49957c7ad6b2da2ad4d5a7` changes only `health-page-heroes/styles.mjs` and `health-testing/styles.mjs` in the exact current production graphs. The knowledge expansion, H6/header assets, product data and operations remain intact. No route, binding, named handler or schedule was changed.

Live verification covered the seven page heroes, the testing range and a testing product detail. Each has an 8px gap after its preceding breadcrumb or availability row. All nine main content fragments are byte-for-byte unchanged. Nine mobile layouts were checked without horizontal overflow. All three Bloods panels were switched and their cream backgrounds and black text verified; the black page sections have cream text. See the production receipt and evidence files for the exact versions and screenshots. Future releases must retain the latest complete Worker graphs; the older twelve-module presentation manifest is historical.
