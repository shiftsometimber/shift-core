# SHIFT Knowledge health expansion — deployed and verified

29 October 2026. Content version: 2026-10-29-v2.

## Release

Matt explicitly authorised publication with “Please push and deploy this”.
The reviewed public copy is live across Knowledge, the wider website and Ask
Timber. Source checking is separate from clinical review: no clinician-reviewed
status is claimed. Visual/mobile browser acceptance remains unverified because
the browser service timed out; HTTP and API verification are complete.

Repository: shiftsometimber/shift-core.
Branch: work/knowledge-health-expansion-20261029.
Deployed source commit: 7a0fa31651df29469e0a91b75ba2905c1651f5a1.
Successful workflow: https://github.com/shiftsometimber/shift-core/actions/runs/40974742324.
Live verification completed: 2026-10-29T23:43:00.160Z.
Provider versions and the complete receipt are in release-receipt-20261029.json.

## Published

- Six areas: testosterone/TRT, bloods, testing, fertility, sleep and supplements.
- All 50 planned topics have a guide route and a matching FAQ / Ask answer:
  42 complete new guides and eight retained existing guides.
- Knowledge search and topic selection retain all 45 original public article
  cards. Existing guide bodies and URLs remain available.
- Fifty sourced short answers and relevant-passage retrieval are active in the
  shared Ask route. The existing origin, urgent, medicine-status, privacy and
  personal-context guards retain precedence.
- A new fertility starting page links all eight fertility guides.
- Related reading is added to Health, test, hormone, sleep and supplement pages.
  Sitemap additions and metadata match the published guides.

## Verification

- CI: 96 checks passed, zero failed; one opt-in real-model evaluation was skipped.
  The full production Worker dry-run compiled successfully.
- Every one of the 42 new guide URLs returned 200 and its complete approved copy.
- All 50 canonical questions passed through the live /v1/ai/chat endpoint with
  the approved answer, sources and source_checked_health mode.
- Knowledge, FAQ, Ask, fertility, sitemap and the new JavaScript asset passed.
  Hostile-origin and urgent-question guards passed.
- The homepage and existing service content were preserved. All ten current
  Health cards and all 102 captured public asset responses were preserved.
- Seven existing Workers received the bounded Knowledge layer. Their active
  modules, bindings and named exports were preserved, with only the reviewed
  Ask additions and the Health-to-Core shell service binding added.
- All 915 Cloudflare routes were preserved; zero route rules were added/changed.
- Separate post-deployment HTTP checks confirmed live Knowledge, fertility,
  a TRT/fertility guide, FAQ, Ask and Health pages, plus a sourced Ask response.

## Release history and boundaries

Earlier attempts either stopped before promotion or rolled back after detecting
a fertility layout handoff failure or a doubly transformed asset. Those issues
were corrected before the successful release above. The earlier push rejection
was superseded by Matt's explicit instruction to push and deploy this version.

The release uses the current live provider modules and latest asset source to
preserve concurrent site work. It is on the release branch; no merge to main is
claimed. Existing public header/footer/ticker responses are retained.

No customer-record writes, messages, purchases, scheduled jobs, new route rules
or changes to partner/service availability were made. Browser visual acceptance
and clinical review are not claimed. The complete-copy HTML release record was
updated with this receipt; build-review.mjs remains the pre-release preview
generator.
