# Treatments: Medicines & Peptides Watch

Public route: `/treatment-centre/medicines-watch`. Entry point is Treatments only. No member or My Timber integration. This is a bounded weight-management reference, not an exhaustive medicine database, prescribing tool, stock service or recommendation ranking.

`data.mjs` is the reviewed editorial snapshot. Sources link to exact primary documents; provider information is explicitly labelled. Authorisation, trial stage, private supply and NHS England access are distinct. There are no inferred launch prices or cross-trial efficacy comparisons.

The existing Worker cron calls `checkSources`; atomic reservations limit each source to one attempt per hour. Checks have an eight-second deadline, 2 MiB response limit and concurrency of three. The checker fingerprints validated document text, not page furniture, and retains separate attempt, successful retrieval and failure times. It never edits the catalogue, approves a baseline, emails anyone or advances the editorial review date. Missing fingerprints, inaccessible sources, changed/withdrawn documents, incomplete scans and reviews older than seven days are visible states. Extra evidence links without a supported automated check are labelled accordingly.

`/v1/medicines-watch/health` is a SELECT-only public health endpoint containing no account data. Public page requests do not initialise storage, scan sources or call the older Radar publication handlers. Deployment initialises missing observations in the dedicated table; it cannot overwrite scheduler history for an unchanged URL.

When updating a reference:

1. Retrieve and read the original regulator, NHS, product-information or trial evidence. A changed hash or successful HTTP response alone is not a review. Verify the UK position, indication and access separately; do not infer availability from authorisation.
2. Update only supported wording, exact source links, and the affected source's `reviewedAt` / `reviewedFingerprint`. Use `fingerprintSource` on the actual complete retrieved response. Never pin an error page or accept the monitor's new hash without reading the changed evidence. Individual source dates can override the default; do not advance `REVIEWED_AT` for the whole catalogue after reviewing just one source. Update the affected medicine's `reviewedAt` explicitly when its wording changes.
3. Do not describe AI/source research as clinical approval. Follow the site's editorial and clinical governance process for claims needing qualified review. Leave uncertain changes visibly awaiting review.
4. Run `node --test medicines-watch/*.test.mjs`, the existing affected release gates and the guarded production workflow. `verify-live.mjs` proves actual serving, source-check execution, filters and read-only behavior. Use the live public browser to verify the Treatments entry and mobile layout.

Public preservation accepts only the exact marked Treatments entry. The other ten public/login responses stay byte-exact, and all pre-existing Treatments bytes must survive. Source availability can legitimately be delayed; the release proof must not conceal that or require fake all-green evidence.
