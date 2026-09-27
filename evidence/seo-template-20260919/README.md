# SEO template repair — 19 September 2026

Baseline: main `7a31b90de8c2bef7d5701314b1b13ffa423ade10`. The fresh audit contains 528 sitemap URLs. This repair changes no sitemap membership, article prose, publication status, consent policy, member data, checkout or source permissions.

## Confirmed defects repaired

- Seven pages need complete Organization identity: the five revised evidence articles, SHIFT Newsroom and the newly published Wegovy cost guide. Add the existing official wordmark as `Organization.logo`, including the organisational byline records. Keep Matt O’Brien as the Wegovy article's Person author.
- Eight public pages lack only `twitter:image`; they already use the same default Open Graph image. The newsroom landing page additionally lacks Twitter title/description. Fill those fields in their existing rendering authorities.
- The Wegovy guide omits the backdrop required by the existing shared menu script. Browser verification reproduced both the null `addEventListener` error and the failed open operation. Restore the expected backdrop before the shared script loads.
- Replace three legacy anchor destinations with `/compare-weight-loss-treatments` and `/member/dashboard#journey`, preserving queries and appropriate fragments. Existing redirects remain available. Public anchors only; no private routes or API calls change.
- The statistics Article references its existing visible, downloadable chart as its image. The chart/data bytes are unchanged.

## Audit findings that are not live defects

All six historic FAQ URLs already return their intended permanent redirects. Verification now checks GET and HEAD, exact Location, and an HTTP 200 destination.

Two original publication dates cannot be inferred safely. The NHS source has two incompatible dates (`2026-03-01` and `2026-08-26`); the original statistics Dataset has a modification date but no publication date. Keep the verified visible/editorial `dateModified=2026-09-19` and omit `datePublished` until evidence resolves it. Four articles have no representative image in their visible content; retain that as an editorial opportunity rather than inserting the publisher logo as an article image.

Google's Article documentation states that these are recommended properties, not required fields: https://developers.google.com/search/docs/appearance/structured-data/article . The proof reports the six advisories explicitly; they are not silently counted as repaired.

## Release proof

Focused tests cover template identity, metadata uniqueness, one menu backdrop, genuine image/date handling, idempotence, link fragments and private/external/script exclusions. The Programme preservation exception accepts only the exact approved sharing tag and `Open Journey →` link replacement; raw hashes remain recorded and all other bytes remain locked.

The branch workflow compiles the production Worker, transforms freshly fetched live pages, compares main content against only the allowed anchor changes, checks all six redirects, retains raw before/after documents, and publishes an isolated read-only preview without production bindings. After review, the normal production workflow runs its existing gates plus the same page checks against real live responses. No database or publication workflow is changed.
