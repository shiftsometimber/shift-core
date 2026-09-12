# Connected Grub release candidate

The food workspace now uses authenticated account storage throughout. It replaces both legacy Grub scripts as a single release: approved recipe search, filters, fridge matching, complete quantities/methods, saved recipe IDs, 3/5/7-day breakfast/lunch/dinner plans, individual meal swaps, explicit day/slot/serving selection, and a shopping list built from actual recipe ingredients. Shopping items can be added, removed, checked off and printed.

All account writes wait for the server's confirmation. Requests time out, same-operation retries are idempotent, and revision conflicts reject stale-tab overwrites. The reserved `preferences.grubV2` namespace is updated atomically inside the existing member-state record; unrelated legacy preference updates cannot erase it. Existing privacy export includes this record. This release does not add a new health-data store or employer access to food choices.

Plans use the existing published, validated catalogue. Hosted preparation regenerated all 798 accepted recipes against their eight retained PASS decisions. No fictional recipe, default protein figure or AI-generated method is substituted. Fast dinner slots can use reviewed lunch recipes; the page explains that explicitly. Ingredient exclusions are not an allergy guarantee. Unknown or unsupported requests produce a clear refusal without replacing the saved plan.

## Evidence

- Account-flow implementation: `dd7b653c57e7694a07cd731d286b02c9a706e1a5`; local/remote tree `afd242a42500cfef5604ac42aa0ec203230bfc05`.
- Isolated checks passed: https://github.com/shiftsometimber/shift-core/actions/runs/34699124956
- Hosted deployment and remote D1/account-flow probe passed: https://github.com/shiftsometimber/shift-core/actions/runs/34699124918
- Remote probe completed at `2026-09-12T14:24:38.146Z`.
- Follow-up implementation `86c4b1524a6751b5e929d21d955c9a5800e09d20` retains the exact live login hotfix, provides in-dialog error feedback and retains focus after saved-card updates. Its isolated checks passed: https://github.com/shiftsometimber/shift-core/actions/runs/34701919722

The remote test uses separate fictional accounts and databases. It proves password sign-in, recipe search, stable saved IDs, plan generation, swaps, serving counts, real shopping ingredients, checked-item persistence, duplicate-request handling, cross-account isolation, stale revision rejection, protection from legacy preference writes, logout/session invalidation, and persistence after fresh password sign-in. Workplace/HQ separation and disabled clinical ordering pass in the same run.

The existing unrelated `act2b-one-shot.yml` validation failure is not a passing repository-wide CI claim.

## Deployment preparation

The production Pages baseline is deployment `5a064385`, fingerprint `0111ddc13262846355df76dd5f2b3067b02dca9d92716105bf4bf24f9394e665`. The current Worker baseline is `19e037713b36ffa8b7424143e983a50d18e70f83`. Both contain the released sign-in repair. The candidate retains the Worker security client, its cache version and its release tests exactly. It does not republish an old Pages payload.

`node member-experience/prepare-release.mjs` creates `work/build/member-release/wrangler.jsonc` from the actual production configuration, enabling only the member presentation/food feature. It retains the existing Worker name, routes, assets and DB binding. The generated configuration and full Worker bundle are dry-run checked; nothing is deployed by this preparation. No database migration is needed for the food workspace. The existing published recipe table must be available.

Production promotion should use that reviewed enabled configuration through the existing release process. Capture the current Worker version for rollback immediately before promotion. Disabling `MEMBER_EXPERIENCE_V1_ENABLED` removes the new layer and endpoints while retaining stored records; a Worker rollback does not undo account writes. Do not copy staging configuration, fictional accounts or test data to production.

SHIFT for Work remains separately controlled by its workplace binding and commissioning flags. Its contract, privacy, delivery and partner decisions are not waived by this food release. Testing and regulated treatment ordering are not enabled here.

## Browser acceptance

Earlier browser checks established full recipe readability, working filters and no contrast failures/overflow at 320px and 1280px for the search renderer. They do not establish the newly connected account UI. The secure browser sign-in is pending so the final interactive save/plan/shopping and responsive-dialog checks can be completed. Fresh password sign-in on the actual production origin is also unverified. Do not describe this record as final browser sign-off or a production deployment.
