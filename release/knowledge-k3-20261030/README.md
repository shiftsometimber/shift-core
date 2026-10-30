# Approved Knowledge K3

Matt selected K3, requested an iPad showing SHIFT, then approved the corrected over-the-shoulder orientation with “PERFEC!”. Approval reference: `generated_images/exec-4cb86fd5-cd99-434c-849f-d04beb53f834.png`, the K3 mock-up recorded in this conversation.

The production photograph is a separate clean derivative of that approved scene. The implementation preserves the current live Knowledge introduction, every guide card’s original HTML, every link and its order, search/filter controls and all existing scripts. It adds a compact hero, moves the existing topic navigation below search, and presents the collection in horizontal rows. All styling uses the established Arial/Helvetica font and black/cream/ash palette. No content, claims, products or reviews are invented.

The old `/explore-knowledge` entry currently serves an older page; it is redirected to `/knowledge`, retaining the query string. Existing route rules are unchanged. Homepage, Health, Ask, Programme, Start Here and signed-out member entry pages are protected against changes.

Deployment captures both current provider module graphs and retains every original module byte. It pins every inherited binding to the captured serving version using the version-addressed provider API and verifies uploaded module hashes, bindings, asset configuration and protected code assets. An explicit asset completion token is obtained through the established Knowledge release helper, including its cached-binary guard; every successfully captured existing text asset is verified at 0% ordinary traffic using documented version overrides before promotion. It adds no data writes, migrations, bindings or routes. Shared production concurrency is preserved. A failed live verification restores only the versions promoted by this release, if still serving.

Provider reference: https://developers.cloudflare.com/workers/static-assets/direct-upload/#createdeploy-new-version

`check.mjs` verifies reversible presentation boundaries, exact article preservation, links, controls, introduction and script bytes. Production evidence and receipts are retained by the dedicated workflow. Browser review additionally checks image orientation/loading, layout, search, topic filtering, empty state and navigation.
