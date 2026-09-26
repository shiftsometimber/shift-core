# Backend context pilot: real inference now proven

Tested source: f63f8c2e060f6111c0a8c9626b320a2578b38467
Real-model run: https://github.com/shiftsometimber/shift-core/actions/runs/36274592539

The earlier REST credential blocker is resolved for evaluation through the existing preview-Worker AI binding pattern. A temporary authenticated, expiring inference Worker had no D1, assets, customer data or production routes. It was deleted successfully after the test. No broader credential was substituted.

Seven scenarios generated real model answers (no fallback passes): own saved context, limited-time meal, changed goal, chocolate/Mounjaro topic relevance, dose boundary, other-member privacy and no false promise of saved memory.

Sample timings:
- First run: median 7,309 ms; range 5,850–12,001 ms.
- Final run: median 2,344 ms; range 1,363–2,988 ms.
- Seven scenarios, one observation each per run. Not a production SLA, load test, p95 estimate or physical-device measurement. Includes hosted inference round trip with synthetic SQL locally; excludes live D1/member-browser latency.

Quality review: relevant saved meal and Life Back goal are correctly distinguished; current gardening correction is respected; no unrelated meal appears in chocolate answer; dose decision and other-member disclosure are refused; no false new-memory save is claimed. Practical meal advice is usable but still generic because the briefing contains meal metadata rather than the full recipe. This is a remaining product limitation, not a completed personalised-coaching claim.

111 local tests pass; one real-inference test is intentionally skipped locally and is run separately in CI. Raw local output, first real run and final real run are retained alongside this report. Frontend/public/site paths have zero changes from baseline b7684acb867e85386cea87ecbfb055847d0fa55d. Production configuration and main are untouched. Feature flag remains off by default.

## Still required

- Reconcile the separate conversation/memory engine with Ask Timber and prove saving, correction, withdrawal and erasure before promising learning across conversations.
- Retrieve enough relevant owned content (for example actual selected recipe details) to make suggestions more specific.
- Authenticated hosted preview and real browser/device acceptance. Existing adapter/rendering regressions pass locally, but do not substitute for this. A local browser installation attempt failed; no screenshot evidence is claimed.
- User review before production activation.

This is a successful backend context/inference milestone, not release approval or completion of the full AI learning system.
