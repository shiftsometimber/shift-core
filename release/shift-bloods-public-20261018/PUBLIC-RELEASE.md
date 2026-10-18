# SHIFT Bloods public release — 18 October 2026 UTC

Approved by Matt’s “Publish all”: completed Health/Bloods marketing pages only. Live: https://shiftsometimber.co.uk/shift-health/blood-tests linked from /shift-health. Ordering remains closed. Private native Site retained for historical review.

## Deployment
Marketing/source revision: 7bf1b71f607a6713a6bd362a4fb7ff03244a950b.
Pages assets deployment: 8a023426-da2b-4a25-a5db-3bb80a7ae6bc (success).
Four public information URLs subsequently added to the origin sitemap, after route verification; see discovery receipts.
Worker router: shift-bloods-public, production deployment 3e774aa5bcb94822b6218f30b365b24e.
Eight exact/prefix Health/Bloods routes created on apex and www; 137 pre-existing routes unchanged. Route IDs and zone identity retained in receipts.

Existing Core backend is not redeployed. Final source diff restores worker-entry-v6.js and shift-health-public.mjs to c9b54b822ec78e631c057430d10c6fd0755b5d4b. The existing Core production workflow failure is outside this release. No changes to its guard.

## Evidence
Fifteen new Pages files: nine documents and six versioned assets. All 880 existing asset hashes retained, including homepage and policy content. Header bytes retained. Sitemap update changes only one known asset and preserves all previous entries.
All nine public pages and Health entry return HTTP200 on apex and www; www resolves to apex.
Mobile width380 / desktop width1440 visual QA: no horizontal overflow, mouse and keyboard panel selection, persisted panel, collection selection, expandable overview, native20sec video playback, caption track and no autoplay. Public Health CTA computed ash green rgb112,119,98. Actual main site Health CTA followed to hub; live Advanced tab clicked successfully.
Existing14 relevant tests and new8 tests passed; actual shipped JS harness28 interaction assertions passed. Private preview previously407 checks passed.
No patient intake forms, accounts/results API, payments, medicine orders or notifications enabled. My Timber is a labelled public example. Device/price/reporting arrangements remain proposed.

## Blogs
Three complete unapproved drafts in editorial/shift-bloods-20261018, two new topics plus replacement of existing weight-loss-blood-tests article. No blog database writes or publication performed. Exact-version approval, render and standard HQ release remain required. Existing live article needs the correction described in editorial README before linking it further. No duplicate organic-growth schedule created.

## Maintenance
Future changes to these public pages must update this scoped router and Pages assets from this source rather than redeploying the currently failed Core release incidentally. A future intentional Core integration must retire only the eight owned routes after equivalent public checks. Rollback: delete only route IDs recorded in marketing-routes-created.json after verifying each still points to shift-bloods-public; leave all prior routes intact. This returns Health to Core; Bloods routes then become unavailable. Pages artifacts alone do not activate orders.
