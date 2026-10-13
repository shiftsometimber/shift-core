# Homepage share-preview candidate — 13 October 2026

Prepared for review only. No main ref, pull request, upload, deployment or external
message is authorised by this file. Matt's homepage/publication hold remains.

Current production: c9756798dd271260c8812e419fae5f0d7c61e194, full tree
04cc61c1e2283d2fba3411666bf5a57ef2979940. The local 7a74 checkout has that same tree.
The reported WhatsApp preview matches the actual server's `/assets/og-default.jpg`:
legacy S/T mark, old green artwork and clipped long line. The actual homepage
advertises that path in both og:image and twitter:image; this is not solely a
client cache diagnosis.

The candidate uses the unchanged approved `frontend/member/sst-logo-official.png`
(SHA256 d17bb3670d77d5f86c45fc9d9fa17f4488feaa6e331b29669ac8eec8eb683f71)
inside a repository-native SVG, exported by Inkscape and Sharp. No image-generation
cost or reconstructed logo. The approved black/cream/ash-green branding and
"GET YOUR LIFE BACK." tagline are used at 1200×630 with safe margins.

Prepared scope: one new versioned JPEG route plus exactly the two homepage
share-image URL substitutions. Original title, description, canonical, favicons,
schemas, body, layout, accessibility, styles, private routes and all original
handlers/cron are preserved. Legacy default artwork is retained for historical
references; this is a homepage-preview candidate, not an unreviewed global sweep.
Invalidated root body validators are removed; existing cache/security policy stays.

Verification: five focused tests pass, including exact inverse body/metadata and
Worker hook comparisons, GET/HEAD/METHOD handling, unrelated route/cron delegation,
original logo bytes and JPEG signature/hash. Configured Wrangler dry-run exited0;
compiled Worker SHA256 98a3f797b9094f198bc476ab2fc547f21d83063fc33f14839ca3164ac058852b.
No deployment or build upload took place.

Next gate: Matt's scoped instruction to publish this preview-only candidate, then
exact finite admission/source checks through #1065 and guarded terminal production.
Verify actual served root head and JPEG bytes after deployment. A new image URL
avoids reusing the old image-cache identity when platforms fetch again; existing
WhatsApp messages/cards are not promised to update. Do not send a message, submit
a contact form or use an email-generating cache test.
