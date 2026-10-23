# Website review closeout — 23 October 2026, UK evening

Scope: tonight's eight-item public website review. Owner authorised scoped guarded releases, excluding homepage edits, purchasing activation, payments, commercial commitments and external communications. These exclusions remain active. No emails or real purchases occurred.

## Deployed and verified

- Treatment Centre image delivery: source 1a6163f8289744fabbf9d2fad234c2fa268175e0 on fix/treatment-image-delivery-20261023; existing scoped Worker updated, no routes changed. Deployment 8b8fbba3-915d-4475-b952-b0715c969c4d. All 13 original/new scoped tests passed. Original approved main restores byte for byte after replacing the five content-hashed JPEG URLs. Live HTML 58,879 bytes versus approximately 1.24 MB before; original JPEG bytes and dimensions retained, image responses immutable-cacheable. Live Chrome: all five images loaded, no horizontal overflow. Total first-visit transfer includes 885,117 image bytes; 59 KB is HTML only. Main Core and homepage not redeployed.
- My Timber signed-out footer: source 71dcf2763 on fix/website-review-20261023, existing guarded Pages asset workflow. Deployment d3310fd8-2f8d-43b5-a481-d7469a3492ac changes only /assets/my-timber-welcome-20261021.css; all 856 other assets, including homepage files, unchanged. Added rules require signed-out session and #mtWelcome. Original footer revealed; compact duplicate copyright/links hidden, one cookie proxy retained. Actual live Chrome: one footer, one copyright, social links, cookie preferences opens, no private fixture visible or horizontal overflow. Prior signed-in test rendered one header and footer; no fresh post-deployment sign-in claimed.

## Verified; no fix necessary

- Shop: six featured of sixteen is intentional. Browse full range exposes sixteen; Accessories returns two items; Cream updates only the selected tee's image, label and destination. Default Ash Green is per-product default, not proof of a stuck filter. Desktop verified; fresh mobile verification remains open.
- Timber Shed: existing 34bc20b7 release already handles public home. Actual test-account browser showed authorised fictional conversations. After logout/reload, public home remains visible while conversations/composer are withheld. No posting, broad admission or menu activation was performed.
- Three approved blog refreshes: reran existing read-only hosted verifier successfully. Original dates preserved (male obesity 10 October, MOT 4 May, testosterone 26 August); actual revised date remains 22 October. Assets, canonicals, links, queries, sitemap dates and discovery assertions passed. No duplicate publication or unnecessary new modified date.
- Price comparison: 29/29 browser-selected variant prices matched current public catalogue; new-treatment starter locked, continuing dose controls selectable. All six unavailable actions disabled. Missing exact supply quantities/periods for some products remain a purchase gate, not invented values. No budget selector exists in the current flow.
- Read-only closed-purchase regression passes for Start Here wording and 404 cart/checkout. This checks the named public entry points only. GO-LIVE-GATE.md records the coordinated future copy/routes/catalogue/clinical/payment/approval/rollback gate; no atomic activation mechanism is claimed to have been added.
- Focused crawl: 127 linked public URLs returned successful final responses with no redirect chains/loops; all 24 sitemap-listed guides had unique exact titles, H1s and main-text hashes. This does not disprove orphaned legacy URLs or topical content overlap.
- Served favicon PNG, Apple touch PNG and web manifest returned 200. Actual Safari cache and home-screen appearance unverified.

## Remaining dependencies / decisions

1. Original audit identities: personal-context retrieval and current focused crawl did not identify the specific five orphaned legacy URLs or the two overlapping guide pairs. Need the original audit list before choosing redirects or deleting/consolidating content. Do not guess or redirect to homepage.
2. SHIFT for Work: live canonical /shift-for-work returns 200 but HTML explicitly says noindex,follow; existing release/shift-for-work-20261021/RELEASE.md deliberately retains that policy. Not added to sitemap while noindex; no Search Console resubmission made for an unchanged sitemap. Decide whether to make the public marketing page indexable, then update robots policy, sitemap and resubmit as one reviewed change.
3. Ticker: live DOM and radar-published-ticker-v1.js show a pinned five-story September edition, not the requested October oral-medicine story. Updating the shared edition affects homepage output, excluded by current instruction. Prepare/approve separately before publication; this review does not authorise it.
4. Actual Safari, mobile viewport/device and post-deployment signed-in footer checks remain unverified. Historical WebKit/mobile receipts are retained but not represented as fresh actual-Safari evidence.
5. iPhone App Store still says Coming soon. No iOS public release has been verified, so availability wording was not falsely changed.

## Source and evidence

Evidence in ./evidence is public/sanitised, including exact deployment receipts, manifest preservation, scoped crawl, blog acceptance, served-icon checks and closed-purchase results. Main branch not merged or broadly deployed. Existing held clinical/analytics/WhatsApp/Medicines Watch work was not incorporated. Two owned temporary Worker previews were disabled after acceptance; no production routes belonged to them. Original prior release records remain intact; future work should continue from this checkpoint.
