# My Timber and Grub — production release

Deployed 12 September 2026. This supersedes the staging-only status in the earlier Grub release record.

## Release identity

- Merged PR: https://github.com/shiftsometimber/shift-core/pull/677
- Production source: `ecf0be136f666cb535cd39e2a5c1e17643cbd08b`.
- Current Worker version: `4cbd1416-4aa5-4a56-846b-7060b7e26f66`.
- Production workflow passed: https://github.com/shiftsometimber/shift-core/actions/runs/34705833399
- The existing workflow also ran for the merged PR event, deploying the same source successfully: https://github.com/shiftsometimber/shift-core/actions/runs/34705832483
- The original pre-release deployment record is retained as artifact `10301474549`, `worker-deployment-before-34705832483`, in the latter run. Use this original record for rollback, rather than the second run's record of the identical newly released build.

The production configuration now explicitly enables `MEMBER_EXPERIENCE_V1_ENABLED`. Future ordinary promotions retain the feature. The preparation helper accepts this reviewed setting and still rejects contradictory values. The release ran the existing security, Journey, medicine and public-asset gates and retained their production checks. No Pages republish was performed. No food schema migration or account test writes were needed.

## Verification

The last isolated checks passed all 168 tests: https://github.com/shiftsometimber/shift-core/actions/runs/34705698693. Hosted deployment and remote authentication/persistence checks passed: https://github.com/shiftsometimber/shift-core/actions/runs/34705698714. Earlier authenticated browser acceptance covers save, plan, swap, shopping, persistence and logout; see `grub-connected-release-20260912.md`.

Before deployment, a read-only production D1 query found 799 published, usable recipes (the staging snapshot contained 798). The actual production catalogue passed the reported ingredient search and complete three-day protein, budget, fast and vegetarian plans with real shopping ingredients. These plans were calculated in memory; no production account was changed by that check.

After deployment:

- Dashboard, Grub, Fit, Check-in, Saved and Settings all returned 200 with the new member layer.
- The live food runtime, shared stylesheet and member client match the tested source by SHA-256.
- Both old Grub scripts are absent from the live food page; the connected replacement is present.
- The homepage, Treatment Centre, Mounjaro page and login security script are byte-for-byte unchanged from the captured pre-release responses. The old joined-up-order sentence was absent from the checked Treatment Centre response.
- Unauthenticated food workspace access returns 401.
- The live browser loaded the existing signed-in account successfully. The reported search `Chicken, beef, noodles, bread` returned 224 matches, showing 12 real recipes. Opening the first recipe displayed actual quantities and cooking instructions. No production recipe, meal, shopping or health record was written during this browser check.

Raw public checks: [member-production-verification-20260912.json](member-production-verification-20260912.json). Live browser evidence: [grub-live-recipes-20260912.jpg](grub-live-recipes-20260912.jpg). These are the live domain, not the isolated layout checker.

## Scope

This is the member presentation and connected food release. Workplace feature/commissioning flags and clinical ordering remain disabled; no real employer pilot, testing service or treatment service has been commissioned. The public employer proposition remains a separate Pages release. A fresh password entry and physical Safari/iPhone were not independently repeated during production verification; the existing authenticated live session loaded successfully and the released login repair is unchanged.

Rollback must use the captured pre-release Worker version through the normal Cloudflare release controls. Disabling the member flag also removes the new layer and endpoints. Neither action deletes stored member records. Do not delete D1 data as rollback.
