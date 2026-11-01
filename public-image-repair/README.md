# Approved hero image delivery repair — 1 November 2026

Matt requested repair of the eight image failures from job 124686270275 / run
41251655803, preserving approved pages and keeping article PR #1509 separate.

Reconciliation found seven images already restored in Core version
`1b0acb36-4fee-452c-b23b-10b03d2421ce`, selected 1 November at 08:50 GMT.
All seven exact public URLs returned 200 with the hashes in `manifest.json`.
Their restoration source is the selected provider package's
`quality-repair-20261101/restored-media.mjs` and its eight `restore-*` modules.
No replacement artwork or repeated redesign is required.

The remaining Tools image returned 404. Its URL is explicitly absolute in the
approved presentation, not an accidentally resolved relative reference. The
Tools page has dedicated presentation routes, while its image falls through
the existing catch-all Core route. The original CT3 image was recovered from
the successful 31 October release artifact, without re-encoding. It is a
1903 × 826 WebP of the approved garden couple, SHA256
`57d0f67319af5df93793705af75b6d4dcf4e24cda05f2bbbbdeaf5815834fefc`.

The fix serves only that exact image path, retains the approved document and
styles, and records the responder and native package construction in GitHub.
The bounded native release wraps the captured serving entry and preserves
every original module, binding, asset binding and setting. It does not build
or upload a different article renderer. All page HTML, including the homepage
and the eight affected pages, must remain byte-identical after removal of
variable Cloudflare beacon scripts.

The existing `cloudflare-production-promote` serial release group, current-main
guard, exact serving-version lease, provider byte proof, owned rollback and
live acceptance are retained. No route, schedule, member data, order, payment,
email or publication changes are part of this repair.

Local validation: five focused tests pass, including all query/host variants,
HEAD, exact recovered image bytes, unrelated document/method passthrough,
complete native package preservation, and rejection of provider mutations.
The complete release passed in [run 41294010182](https://github.com/shiftsometimber/shift-core/actions/runs/41294010182),
source `aad4bfabf17b4559fa5481d2ffa3f120325a7a07`.
Core version `75f089f8-fcaa-4f46-b464-a642f2288a7e`, deployment
`85d7e567-b823-42eb-8a9c-72cf3607c6cd`, serves 100% of its existing traffic.
All 34 previous modules and all bindings were preserved; three image delivery
modules were added. All eight image URLs returned 200 with exact expected
SHA256 values. All thirteen protected documents and their existing security
headers matched before/after. All sixteen actual live-browser cases passed
at 390 and 1440 pixels. The source suite now has 19 passing checks.

The release artifact is `13078876543`, SHA256
`39cba5bdae8efb79051dca3d270c2fbe05b439be57451849c6a2b6ec721c0769`.
The desktop pages were also independently opened and visually inspected in
the live browser. Final unobstructed screenshots are captured by the read-only
`visual` job, which selects necessary cookies only before inspecting images.
The one-time publisher is pinned to the completed source and cannot replay on
later documentation or QA changes. Future rollback code reuses the existing
source/run/deployment-ID ownership guard, including protection against a newer
deployment that selects the same version. No new deployment is needed for this
closeout. Article PR #1509 and its renderer remain unchanged.
