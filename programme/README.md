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

## Follow-up verification — rule version 1.0.1

The follow-up suite has 45 passing tests. It explicitly covers mixed-priority R10 competition, suppression before ranking, cross-account API reads, genuine session expiry and a post-swap rise from 1000g to 1500g mince with 1000g bought and only 500g outstanding.

Two new regression checks initially failed: an old member request could return after a decline freeze, and an approved recipe label did not require its provenance. Both are corrected. Approved recipes now require a real calendar date, a named reviewer identity and a reviewed version matching the recipe. The fixture recipes remain `test-fixture`; reviewer, date and reviewed version remain null. This is an approval-data gate, not an assertion that any nutrition/allergen review has happened.

The unchanged eight independently authored histories were rerun. They cover sparse/ambiguous reports and requests but do not independently exercise the R10 cap. The additional crowded cases are deliberately constructed regression tests, not falsely described as blind histories. See `evidence/followup-results.json`, `evidence/followup-before-fixes.txt` and `evidence/followup-all-tests.txt`.

The original uploaded standalone prototype is retained as an archive/reference. This module is the sole implementation candidate; no parallel prototype is maintained.
