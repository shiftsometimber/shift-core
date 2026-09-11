# Programme V1 — isolated candidate

11 September 2026. This branch is an implementation candidate, not a production release or a complete sign-off against V1.

The approved spec remains SHIFT-Programme-Implementation-Brief-V1.md. The supplied standalone HTML is reference only. It was not copied into a production page or shared script.

## Source and scope

Backend parent: `0a667f2953e943665d2d9313d80ff0d4801e14fd`, the recorded deployed Worker source including the Newsroom correction. Do not substitute main.

Pages presentation baseline: preview source `e5f892789a495ed2ce7b10952adb4924fdb17717`, aggregate `93028d83330e73dca515c6e50bb29fa630ffaf238d1d89b3df1adc1a9622e14c`. This is a preview checkpoint, not an assertion that its Start Here/menu changes are live. The recovery payload SHA256 is `d2c6faa6e980b6e18fcf0ce7a3231f35236d03728d590cf6de25b58d945f1c5e`.

Only the root Worker entry is modified: two module imports, the namespaced route registration and two static asset map entries. Everything else is added under `programme/` and `frontend/member/assets/programme-v1/`.

For a Pages build, overlay ONLY the two files from `frontend/member/assets/programme-v1/` into `assets/programme-v1/` of the exact selected Pages source. The private HTML is served by the authenticated Worker. No existing page, shared CSS/JS, sitemap, image, dashboard, clinical route or Newsroom code has been edited. The recorded preview has 871 protected files; both source and built-output checks are stored in evidence.

## Running the tests

Use Node 22.13 or newer with `node:sqlite` support:

```
node --test programme/tests/*.test.mjs
```

The eight independent histories were written without the evaluator, screenshots or Dave/Gaz fixtures. Expected behaviour was recorded before running them. The adapter expressly treats their missing recipe identities as a generic fictional recipe; it does not claim that the prose histories supply complete recipe data. This is evidence about rule behaviour, not clinical validation or willingness to pay.

## Browser proof

`programme/proof/` is a local-only Vite harness. Install its pinned dependencies with `npm ci` after generating/retaining its package lock. Set `SHIFT_PAGES_ROOT` to the verified local Pages source for the inherited shell CSS, logo and fonts. Use the managed preview workflow to run its `dev` command. It creates `programme/proof/data/fictional.sqlite` and four named fictional fixtures. It cannot serve unrelated pages or production APIs. The fixture selector and relaxed same-origin iframe policy belong only to this harness.

The deployable modules do not import Node SQLite, fixtures or the Vite harness. They use `env.PROGRAMME_DB`, the existing unchanged `authenticateMember` result and a single owner-scoped versioned aggregate. Every mutation uses one compare-and-swap statement so a write failure cannot leave a changed plan with an old shopping list. Retry operation identifiers are stored with their request signature.

## Deliberately dark

The current wrangler configuration is unchanged. The feature returns unavailable unless `PROGRAMME_V1_ENABLED` is exactly `true`; storage requires a separate `PROGRAMME_DB` binding. No real account provisioning, entitlement activation, billing, email or production database migration was performed.

`migration.sql` is a reviewed additive schema candidate for the separate Programme database. It is outside automatic migrations and has NOT been applied to production. Do not use the local proof DB for customer data.

All six recipes are unapproved test fixtures. `fixtureMode` is injected only by the test harness; it is never accepted from an HTTP parameter or user body. Production selection refuses these recipes. Existing publication alone is not an approval for allergy/constraint selection.

## Remaining V1 gates

- Complete and test the real My Timber entry/return handoff in a separate environment using the pinned authentication implementation. The candidate currently has direct private-route access; no dashboard entry has been added.
- Read/confirm compatible existing Journey, Grub, Fit and check-in data through minimal adapters. Current links preserve free tools; the candidate does not import or overwrite legacy plans. Movement currently supports a chosen walk and a referral when limitations are unknown/stated, not the reviewed Fit catalogue.
- Supply reviewed content with documented restrictions, quantities, review dates and away-from-home alternatives. Complete the four-week content sequence and continuity information track against approved sources.
- Complete Safari/WebKit, signed-out browser back/forward and the remaining accessibility checks. The browser-back check was blocked by browser URL policy; it is not recorded as a pass. Native Safari was unavailable.
- Validate the full Worker in the separate runtime, provision the Programme store there and resolve/assess the existing web-push `node:crypto` compatibility warning without editing unrelated production configuration speculatively.
- Define account provisioning/expiry, data export/deletion/retention ownership and operational limits before real member use. The test has no payment flow. Review day can be selected during setup; changing it afterwards is not implemented.
- Obtain Matt's instruction on the exact reviewed release. No production deployment is implied by a build, test result, Notion page or prototype.

There is no claim that users will pay for this or that a successful fictional case establishes a safe/complete paid service.

## Historical follow-up — rule version 1.0.1 (ranking superseded below)

The follow-up suite has 45 passing tests. It explicitly covers mixed-priority R10 competition, suppression before ranking, cross-account API reads, genuine session expiry and a post-swap rise from 1000g to 1500g mince with 1000g bought and only 500g outstanding.

Two new regression checks initially failed: an old member request could return after a decline freeze, and an approved recipe label did not require its provenance. Both are corrected. Approved recipes now require a real calendar date, a named reviewer identity and a reviewed version matching the recipe. The fixture recipes remain `test-fixture`; reviewer, date and reviewed version remain null. This is an approval-data gate, not an assertion that any nutrition/allergen review has happened.

The unchanged eight independently authored histories were rerun. They cover sparse/ambiguous reports and requests but do not independently exercise the R10 cap. The additional crowded cases are deliberately constructed regression tests, not falsely described as blind histories. See `evidence/followup-results.json`, `evidence/followup-before-fixes.txt` and `evidence/followup-all-tests.txt`.

The original uploaded standalone prototype is retained as an archive/reference. This module is the sole implementation candidate; no parallel prototype is maintained.


## Current correction — rule version 1.0.2

64 automated tests pass. The prior test treated a declared food exclusion as a ranked candidate; that was wrong. Current saved-plan conditions are separate, uncapped, recalculated on every read and unaffected by decline/skip. A conflicting plan cannot be repeated. No saved meal is silently deleted or substituted. The private module shows the flagged dates and reasons above its screens, labels affected occurrences and preserves explicit manual edits/free records. Account-name/status cleanup now accompanies body cleanup on expiry/pagehide.

The requested three-requests-plus-conflict case is proved. Four new checks failed before the correction; their actual old outputs and failures are retained. Further checks cover multiple conflicts, future leftovers from past cooks, unknown preferences, unavailable content, frozen decisions, explicit resolution and stale options. See `evidence/constraint-all-tests.txt` and `evidence/constraint-before-output.json`.

The second independent round uses eight full states authored from the supplied schema and six-recipe catalogue: 179 saved occurrences, 73 reports and 19 leftover occurrences. Input SHA256: `bb9f3fe5dcb20f1ea951fdee8cbc7b4fc8db8b9ff858d91740abbf96aa696f65`. Expectations were written before evaluation; the last two cases were withheld from the first engine run. All eight and their actual shopping totals pass. The author happened to supply no two-miss recurrence; this is expressly NOT blind R2 coverage. A separately labelled one-report counterfactual exercises recurrence, preview, acceptance, unchanged successful slots, dependent leftovers and recomputation. The original authored input is not changed to manufacture coverage. A preferred recipe alone is not treated as an accepted replacement.

Six further contract checks pass in actual workerd with local D1 emulation. This improves on a Node SQLite adapter but does not prove the remote Cloudflare runtime. The pinned root toolchain includes workerd 1.20260714.1, which cannot run the existing 2026-08-09 compatibility date. A separate test-only workerd 1.20260911.1 binary was used through the supported `MINIFLARE_WORKERD_PATH` override; root dependencies/configuration remain unchanged. The initial incompatible-runtime error is retained. An initial expiry-page test followed its redirect outside the fixture route and returned 500; the harness now uses `redirect: manual` and verifies the actual 303 without external navigation.

To reproduce the runtime contract, install the pinned test binary outside the repository, set `MINIFLARE_WORKERD_PATH` to its native executable, and run `node programme/tests/runtime-contract.mjs` from the repository root. The test creates disposable fictional D1 stores and disposes its runtime. It never deploys or changes the production bindings. Browser checks are distinct: the latest preview could not start with the restricted harness root, and native Safari/history restoration remain unobserved. Do not call module-level tests a browser pass.

`DELIVERY-3.md` gives the remote concurrency, logout/back and content gates owners, execution steps and required evidence. Content remains six unapproved fixtures. No live deployment or participant contact has occurred.

An additional assertion on the authored six-to-three headcount change exposed an internal serving allocation still set to six. Manual edits without reserved leftovers now reduce that allocation along with the cooked quantity. `evidence/portion-before-fix.txt` preserves the failing assertion; the final 64-test suite passes. This extra assertion was added after the initial held-out arithmetic check, not falsely claimed as its original result.
