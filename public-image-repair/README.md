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
Hosted release and all sixteen rendered mobile/desktop inspections remain
pending until the release receipt and screenshot review confirm them.
