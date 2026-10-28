# Newfoundland Home Testing — 28 October 2026

User instruction: build the testing section under SHIFT Health and add the seven tests to the backend using Newfoundland's website. The call's selected range is Diabetes (lab), Heart Health (lab, coming soon), Male Hormone (lab, coming soon), and Cholesterol, Thyroid, Iron and Vitamin D (home self-tests).

## Completed

- Built `/shift-health/testing` and seven server-rendered detail pages using the existing Health/Nutrition Worker and accepted shared shell.
- Added one Home Testing section to the approved Health hub. Existing Bloods panels, supplements, homepage, member tools and clinical routes delegate or render as before.
- Added a Home Testing catalogue view under HQ's existing Orders & products navigation. Authorised staff can save supplier codes, trade/retail/delivery figures, VAT and internal notes with revision control and an audit trail.
- Created and verified seven live D1 records in `testing_products` as drafts. `status='draft'` and `sale_enabled=0` are enforced by database constraints. All supplier codes and SHIFT prices remain null.
- Supplier public retail references are stored separately from commercial prices and never rendered as SHIFT prices.
- Lab results remain with Newfoundland Health Hub. No medical results are collected or transferred by this feature.
- No purchase, Stripe, stock-reservation or CSV dispatch endpoint was added or activated.

## Source and preservation

Candidate base: `a4b8f173e3900e2f0062b3d7483a1d910b9ef2bf`, `release/olivit-health-approved-20261027`. This is the approved Health/Nutrition wrapper source, not the older `main` Health implementation. Only `health-nutrition/public.mjs`, `health-nutrition/worker.mjs` and the new `health-testing/` directory belong to this change. Preserve subsequent component owners' changes when preparing publication. Do not deploy the old core Worker or alter its entry point, bindings, cron, secrets or routes.

The main repository was inspected through individual GitHub file reads. Automatic approval review prohibited a full clone under SST resource restrictions. No dependency installations or replacement repository were used.

## Validation

`node --test health-testing/feature.test.mjs health-nutrition/feature.test.mjs`

18 focused checks passed, covering the exact range, SQL idempotence, draft-only constraints, public privacy projection, HQ permission/origin checks, revision conflicts, audit records, source-rendered pages and preservation of existing routes. Browser review covered the desktop listing, a detail page, anchor/detail links and all seven mobile cards at a 390px frame width. No horizontal overflow was observed. The review file uses a simplified navigation shell; production rendering retains the real shell supplied by the existing publisher.

## Publication still requires Matt's explicit production approval

The website and HQ extension have not been published. The seven draft records already exist in the live database. Publishing this candidate must not enable purchasing or dispatch.

After approval, use the established manual Cloudflare deployment workflow for the existing `shift-health-nutrition-20261027` service, preserving its current source and bindings. Read the actual route map before making changes. The testing public and HQ routes must resolve to this wrapper:

- `shiftsometimber.co.uk/shift-health/testing*` (plus any existing www alias convention)
- `shiftsometimber.co.uk/shift-health/assets/hq-testing.js`
- `api.shiftsometimber.co.uk/v1/hq/testing*`
- Existing Health hub and HQ root routes retain their current ownership.

Prefer existing broader matching routes where already present; do not add duplicate routes or transfer unrelated traffic. The SQL migration is idempotent and must not overwrite staff edits. Check the returned `X-Shift-Health-Release: health-nutrition-newfoundland-20261028`, the seven public detail pages, desktop/mobile layout, actual authenticated HQ load/save, and unchanged Bloods/nutrition/homepage behavior after deployment. Do not claim production verification before those checks.

## Source facts

Each record includes its exact Newfoundland product URL and the date checked. Heart Health and Male Hormone remain coming soon even though the separate single-marker Testosterone product is available. That product is not a substitute for the recommended Male Hormone panel.

`review.html` is a self-contained review of the actual testing renderer. Its seven detail links work without a server. It does not take orders or change backend data.
