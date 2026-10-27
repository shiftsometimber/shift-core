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
