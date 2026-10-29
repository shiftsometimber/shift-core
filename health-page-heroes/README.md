# Approved SHIFT Health heroes

Matt signed off deployment of all seven page heroes. The active release is `presentation-release.json`, published by `publish-presentation.py` from an immutable GitHub commit.

The dedicated `shift-health-heroes-20261029` publisher calls each page's existing service, then replaces only its old hero. It serves the approved photographs, live HTML copy and real page anchors. Four existing upstream services continue to own all page guides, metadata, product content and availability controls. Their modules, bindings, named exports and schedules are not changed.

Only 14 exact HTTPS page routes are used: seven canonical paths on the main and www hostnames. `route-baseline.json` records the previous owners. The publisher checks ownership before each route change and restores its own route changes on a failed release. No schedule or messaging capability is added.

The seven pages are testosterone and energy, blood tests, hair loss, blood pressure monitoring, men's mental health, sleep apnoea, and supplements and nutrition. The previously published testing collection hero remains with its current publisher.

`check.mjs` verifies photographs, boundaries, original guides and controls, one H1, real CTA anchors, image responses and product-detail exclusions against the captured public DOM baseline. `check-presentation.mjs` verifies the final module graph and all seven upstream dispatches. Desktop and 390px mobile previews were visually checked.

A preliminary attempt to wrap the blog publisher was restored to its previous version after Cloudflare returned HTTP 502 during verification. Its prior version remains `8d48084c-dea6-4b8a-983e-4eb6a0629def`, deployment `ef53ba2e-4bf3-4158-959d-9cca5432eb65`. The final release leaves that publisher intact and uses the dedicated presentation worker instead.
