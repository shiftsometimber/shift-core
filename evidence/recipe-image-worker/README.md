# Recipe imagery production checkpoint

This branch contains one isolated recipe image change for the existing main
release chain. It does not deploy. No homepage or recipe catalogue edits belong
in this change.

The canonical 2,671 recipes and 2,623 ingredient/method groups are recorded in
`../grub-image-coverage-2026-10-04/recipe-image-queue.json.gz`. Seven original live
mappings remain exact and unchanged. Twelve recovered images were checked
against both their saved SHA256 values and the closeout's embedded WebP bytes.

`staged/*.json` records each new accepted image's prompt, exact recipe IDs,
ingredients, method, explicit visual review, descriptive alt text, source hash
and production WebP hashes. Shared groups require explicit review of every
title. `attempts.json` indexes the SHA-verified `attempts.json.gz` archive of
generated and rejected attempts; queued jobs
are not counted as usable assets. Its pending sources may still require
regeneration if their temporary source file is unavailable after resumption.

`summary.json` counts accepted distinct groups and actual bindings separately.
`live_new` remains zero until the existing release chain deploys and validates
the change. `complete` is false until every usable recipe has an exact binding.

To resume, read the canonical inventory, production mappings and staged reviews,
skip the bound groups, and regenerate only groups still missing usable imagery.
The binding helper verifies all recorded variants and refuses different bytes
or different content for an existing mapping. Production assets are the durable
checkpoint; worker conversion caches are excluded from git.

Checks: `node --test member-experience/tests/recipe-image-production.test.mjs`.
The original seven URLs were observed serving and decoding at 1448 × 1086 in
the browser on 2026-10-04; fresh byte hashes could not be downloaded. Local
phone/desktop browser previews were blocked by the browser's URL policy, so
actual browser presentation remains a required release-chain check. Responsive
renderer assertions and asset integrity checks are separate local evidence.
