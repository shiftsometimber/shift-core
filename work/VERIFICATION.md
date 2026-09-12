# Verification — 12 September 2026

Source: isolated `feature/shift-for-work-20260912`, starting from the exact Programme candidate tree `cd01566169fdb1c72b721735d819f8bee880945e`. The corresponding remote Programme commit is `5bc565f482856b63e61667302555a750d7de1afa`.

Only `worker-entry-v6.js` and the small exported HQ-session adapter in `worker.js` alter existing Worker files. New code is under `work/`. Production Wrangler configuration, shared sign-in, existing member health stores, public navigation, homepage ticker and the approved proposition/PDF remain unchanged.

Results: **26 workplace runtime/client tests passed**, **2 complete-Worker tests passed**, and **84 existing Programme tests passed**. The complete Worker bundle dry-run passed.

The test harness uses fictional accounts and separate local D1 databases. It exercises real Cloudflare workerd/SQLite storage and the existing member authentication; the complete Worker test separately verifies the real HQ/member cookie boundary. No live D1 pass is claimed.

Commands:

```sh
node --test work/tests/client.test.mjs
node --test work/tests/runtime.test.mjs
node node_modules/wrangler/bin/wrangler.js deploy --dry-run --outdir work/build
node --test work/tests/full-worker.test.mjs
node --test programme/tests/*.test.mjs
```

Runtime tests in this environment use the installed workerd 2026-09-11 binary via `MINIFLARE_WORKERD_PATH` because the original Miniflare dependency's binary predates the existing compatibility date. The application compatibility date remains 2026-08-09. This override is a local verification detail, not a production configuration change.

Coverage includes concurrent seat contention, pre-start enrolment, expiry, hashed/revoked codes, rate limiting, account isolation, unknown health payload rejection, HQ-only membership, reporter grant/revocation, individual entitlement revocation, withdrawal/export, CSRF, immutable report release, category/complement suppression, and permanently disabled test ordering. Deferred-response tests check stale identity, page exit, hidden tabs and session expiry. Dashboard tests preserve original HTML after removing the single new card.

The fictional Pages preview uses the actual workplace screen/client with an explicit read-only fixture transport. It contains no accounts, raw invitation codes or real employer data. All mutations return a preview refusal and no request reaches the real API. It is visual review evidence only; local runtime tests provide separate backend evidence.

Open acceptance gates: an authenticated hosted end-to-end flow with isolated remote D1; all supported mobile/browser/keyboard checks including Safari; approved privacy and retention procedures; reviewed delivery content/support; partner and clinical commissioning; production release approval. Do not infer that these passed from unit/runtime tests or fictional screenshots.
