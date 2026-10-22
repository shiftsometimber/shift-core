# Treatment options — approved and live, 22 October 2026

Matt reviewed the inline provider-switch guidance, said “Spot on”, then explicitly instructed “Go live”. The approved design is now live at https://shiftsometimber.co.uk/treatment-options, with the existing treatment-order browsing entry using the same presentation. Specification, selected-variant and clinical requests pass through to the existing Core journey.

Release source: `release/treatment-options-20261022` at `a3ae41de58996f40fd5bcbb6e324c2c99a0ae9a8`. Successful run `39737363925`, job `119686117695`. Evidence artifact `12406919403`, verified SHA256 `a56e78d2c69af3f2fb1933a7876c7af9907afa897321f03532caf960b4b472f7`.

Production uses the authoritative live medicine catalogue on each render. The captured `catalogue.mjs` remains a preview/test fixture only and is not uploaded as a production module. The production generator preserves the reviewed rendering exactly when supplied equivalent data; the approved page, CSS and browser client hashes are gated before deployment.

All 11 contract tests, four hosted staging browser checks and four actual live Chromium/WebKit checks at 390/1440 passed. Native controls without JavaScript, 8 canonical links, 24 host/protocol/path variants and all 6 specification/clinical passthrough routes passed. The mobile gap is 20px. Inline switching guidance opens and closes without navigation or losing the selected strength.

Worker `shift-treatment-options-presentation-20261022` owns only the four treatment-options/treatment-order route families recorded in `live-receipt.json`. All 188 prior routes were preserved. Shared header/full footer and privacy scripts are preserved. Existing insulin/BMI, verification, prescribing, stock and checkout gates remain with Core. No account/contact writes, emails, messages or costs were made by acceptance checks.

Rollback: use this successful run’s `activation-plan.json` and `routes-before.json` with `node previews/treatment-options/deploy-live.mjs rollback`; it deletes only this release’s four routes after checking their owner. Do not rerun publication on the already-active service.

The first release run reached a new workers.dev address before it had propagated; no production routes were activated. The readiness helper now waits within a bounded interval before asserting success. The second run completed and its rollback step was correctly skipped.

Newsroom presentation is next in the original page sequence. Keep the Master, Core/TRT, Medicines Watch and broad reconciliation/performance work paused.
