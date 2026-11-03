# Nightly article correction handover — 27 October 2026

## Completed and verified

Article ID 44, `what-to-eat-on-mounjaro`, retained its original publication time and BabyLoveGrowth provenance. A guarded D1 update changed only the service-availability paragraph, replacing wording that could imply active prescribing partners with:

> SHIFT does not currently provide or book prescribing.

The update accepted only the exact reviewed before-body SHA-256 and changed exactly one published row. Production verification passed in GitHub Actions run 40605366408. See `live-proof.json`.

## Exact qualified-review packet

No clinical wording was changed automatically.

Proposed replacement for the existing combined side-effect sentence:

> Seek urgent medical help if you develop severe, persistent abdominal pain, especially if it spreads to your back or occurs with nausea or vomiting, as this may be pancreatitis. If you cannot keep fluids down, contact your prescriber, GP or NHS 111 promptly because dehydration can become serious.

Required owner: a qualified clinical reviewer. Pass: approve or amend this exact wording against the current MHRA GLP-1 pancreatitis warning and the current Mounjaro patient leaflet, then use the guarded article repair route with the live body hash.

## Testosterone ownership

Article ID 45, `testosterone-blood-test-timing`, overlaps `/shift-health/testosterone-blood-tests` on timing, fasting, preparation, results and follow-up. No automatic rewrite, redirect or clinical claim was made.

Recommended resolution: keep `/shift-health/testosterone-blood-tests` as the canonical preparation/timing owner. Consolidate useful material there and redirect the new article, or refocus the article exclusively on the post-result appointment workflow. Any added 9–11am or fasting statement requires qualified review against the applicable current UK guidance.

## Discovery

The Mounjaro article was in the sitemap but absent from the sampled Explore Knowledge listing and lacked a contextual link from `/mounjaro`. This remains a publishing/runtime follow-up after the clinical safety wording is approved; do not promote the article more widely before that correction.

## 3 November 2026 — Wegovy correction and contributor-route follow-through

Status: prepared and fixture-tested; not merged, deployed or production-verified. Matt instructed “Action” and then “Nd approved” in this chat. The release manager retains merge and publication control. No unseen article, clinical edit, new workflow, email or runtime release is authorised by this packet.

### Current public evidence

A fresh neutral public HTTP read on 3 November still returned the misleading partner-service sentence, the “We hear ... lots of men” assertion, the “Most men start here” assertion, and a Matt-signed blockquote under the SHIFT Team byline on https://shiftsometimber.co.uk/articles/wegovy-injection-sites. The production source header remains babylovegrowth. Delivered HTML SHA256: 3a418b2def78c8981a62e265fbf142a7058c084c77cc7996fbf4aec3f436975e. This is an HTML observation hash, NOT the database body hash and must not be used as the mutation guard.

The older plateau-in-men article also still contains a present-tense partner-prescribing statement. No broader repair or consolidation is claimed in this packet.

### Exact bounded copy

On /articles/wegovy-injection-sites only:

1. Replace “Most men start here because it is easy to see and reach.” with “The stomach can be easy to see and reach.”
2. Replace “We hear the same worry from lots of men: am I doing this right?” with “A practical question is: am I doing this right?”
3. Replace the sentence beginning “Clinical assessment, prescribing and dispensing are handled by appropriately regulated partners” with:
   > SHIFT does not currently provide or book prescribing. We offer general information and practical support before, during and after treatment, including if you started somewhere else. Treatment questions go to your own prescriber.
4. Remove the standalone Matt O’Brien signature in that blockquote. Retain the organisation byline; do not invent a personal author, first-hand experience or clinical reviewer.

Keep all other article text, citations, title, canonical owner, metadata, source receipt and original 2026-11-02T05:02:38.522Z publication timestamp. Update the modified timestamp only when this substantive change actually happens.

### Preparation and tests

Files: article-correction-20261103.mjs, article-correction-20261103.test.mjs, readonly-capture-20261103.sql in this directory. The module prepares an optimistic-concurrency update but performs no database or network writes. It requires the actual captured body hash and refuses unexpected article, byline, signature, changed/missing/duplicated wording and stale source. The update additionally matches original body, author, publication and modified timestamps and requires exactly one changed row.

Seven Node 24 built-in fixture tests passed on 3 November. They cover scope/date preservation, stale body refusal, wrong owner/byline, missing/duplicated wording, repeat-apply refusal, unexpected signature and impossible modified date. These tests do not constitute an authenticated live-row dry run or production verification.

### Existing route and missing evidence

Current main source 68219826b3126c027e2186c5fa0c326a36e597b8 was confirmed after reading its tree snapshot 68219826b3126c027e2186c5fa0c326a36e597b8. daily-content/publication.mjs explicitly distinguishes website-owned shift-editorial releases from contributor receipt source_id shift-contributor. Do not relabel an editorial release to claim contributor delivery.

The public 2 November check established one BabyLoveGrowth publication and no verified contributor publication by its cutoff. No original 2 November contributor job/receipt is accessible through the read-only GitHub repository. Absence of such a receipt is not a proved job error. The prepared SELECTs capture only article records and publication metadata, then discover existing journal names without creating tables or triggering a job. Retrieve the actual job outcome before retrying, and never backdate a catch-up article.

### Release-manager handover and access boundary

Repository: shiftsometimber/shift-core. Existing isolated branch: fix/nightly-article-review-20261027; existing PR #1443. Preparation extends this retained record and does not merge its old branch wholesale into current main. Only the three new preparation files and this appended record concern this follow-through; no shared runtime source was edited. The prior verified October correction remains preserved.

The retained Mac directory /Users/shiftsometimberltd/SST/builds/apple-completion-20261024/journey-shop-release-20261031 is no longer a Git checkout; the retained source-repository directory contains no checkout. No repository clone, dependency install, private-member inspection or credential retrieval was attempted. No production mutation or deployment was started here; there is no deployment job ID to report.

Next action for the existing release manager: execute readonly-capture-20261103.sql through the retained authenticated D1 route, inspect the actual raw row and before-body hash, run prepareCorrection against that row, retain its exact before/after plus rollback, then publish only this approved bounded correction through the existing article route. Verify final content, preserved datePublished/provenance, substantive dateModified, canonical, HTML/header indexing, links and security headers. Capture the contributor job/receipt independently and carry forward only approved copy. Do not restart a genuinely progressing release or repeat successful unrelated checks.
