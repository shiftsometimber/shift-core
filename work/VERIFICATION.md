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

## Hosted visual verification

Final fictional preview: https://95e283ac.projectshift.pages.dev/shift-work-preview
Pages commit: `2002cc69fc4f399171a60ca039b59a56fd5f6bbd`. Fingerprint: `6d31ed83d4915f958c25bbd002393661ba03b31f7968a60c91a70b331f04aa52`. Deployment workflow: https://github.com/shiftsometimber/shift-core/actions/runs/34680117338 (success).

At the available 1363 × 936 browser viewport, the employee, employer and HQ screens rendered. No horizontal overflow was observed. The code field and voluntary joining checkbox are present; the fictional transport rejects mutations rather than recording a false success. The employer report demonstrates rounded group figures and an entirely suppressed small cohort. HQ shows private, unconfirmed pricing and the staff-only membership control.

The browser review caught shared-CSS interference with navigation/table layout and inactive footer controls. Scoped workplace styles now resolve the layout conflict. Larger text changes the main text to 20px with pressed state; reduced motion also updates its pressed state. Menu opening reveals its backdrop and focuses Close; Escape closes it and returns focus to Menu. The HQ header/main/footer order is intact. This is not full keyboard, mobile or Safari acceptance.

SEO integrity passed for 461 pages and the exact release fingerprint passed. The source comparison preserves all 871 original production files plus the four approved employer proposition files; only generated integrity records and five new fictional preview files differ. The approved PDF remains byte-identical. The actual production deployment remains `02d4d911`, checked by the release workflow.

The repository also triggers a pre-existing `.github/workflows/act2b-one-shot.yml` validation failure on these branch pushes; it is separate from the successful Pages deployment. This record does not call the entire repository CI green.

## Account journey gate — 12 September 2026

`work/tests/journey.test.mjs` adds one passing integration journey through the actual bundled Worker: employee and employer password login, separate HQ password login, code issuance/claim, saved weekly review, employer isolation, blocked test ordering, a fixed closing report, reporter-access revocation, employee withdrawal, logout and rejection of the old session. The free account remains. Passwords are randomly generated for each run and never saved in the repository.

The closed reporting period is an explicit local fixture transition in WORK_DB, not a real twelve-week pilot and not a request-controlled clock override. The HQ test account has MFA disabled; no production MFA setting changes or MFA acceptance claim are involved. This verifies the HTTP account journey in local workerd/D1, not a hosted browser or remote D1 flow. The existing legacy schema readiness probe emits its known SQLite parameter-limit fallback during HQ login; the unchanged fallback completes and the journey passes.

The feature branch now has `.github/workflows/shift-work-checks.yml`: read-only repository permissions, isolated runtime tests, a bundle dry-run and existing Programme tests. It has no deployment credentials, remote database mutation or publishing step. Its runtime binary is pinned to the exact verified `1.20260911.1` version in a separate tools directory. Local test totals are now 29 workplace checks plus 84 existing Programme checks. Hosted CI status is recorded separately after the run.
