# Active recovery checkpoint — 2026-08-14

## Authority and recovery rule

Read, in order:

1. `docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md` — authoritative 57-row status.
2. this recovery pointer;
3. `docs/evidence/2026-08-14-final-human-publication-readiness-current.md` — retained pre-#340 publication-readiness detail;
4. `docs/COMMISSIONING-EVIDENCE.md` and `docs/LAUNCH-FINISH-LINE.md` — historical/source-of-truth structures which must not be rewritten to PASS before exact production proof;
5. `docs/MATT-FINAL-ACCEPTANCE-PACK.md` — human/device tail.

Latest engineering baseline before this docs-only checkpoint: `e7573a175ff01505003608efe0b38523b63d83db`, merge of PR #340 after #339/#337/#335/#334.

Authoritative original audit remains **57 total / 50 PASS / 4 AMBER / 3 BLOCKED / 0 unmapped**. The only AMBER rows are **G2-002 / G2-003 / G2-004 / G2-007**. The only BLOCKED rows are **G5-001 / G5-002 / G5-003**.

PASS still requires demonstrated production journey, retained state where relevant, expected member outcome and retained evidence. Readiness/source CI is not production PASS.

## Gate 1 — CLOSED

All original Gate-1 rows remain PASS. Genuine connected-inbox verification/recovery is complete. Do not generate redundant verification/reset mail absent genuine regression evidence.

Broad production regression before the current undeployed source tail remained GREEN in run `31809506744`, ordinary job `94796447962`, across Core, security/privacy, Radar, A/B isolation, retained state, longitudinal learning, existing structured serving, Fit duration, unattended Dave and G5-012.

## Gate 2 — exact remaining tail

Human review is **COMPLETE** and must not be requested again:

- Grub: run `31803717241`, artifact `9220287723`, **798 recipes / 8 decisions / 8 PASS**.
- Fit: run `31802631318`, artifact `9219877222`, **26 canonical movements / 26 PASS**.

PR #335 repaired final Grub runtime publication metadata. PR #334 binds accepted content to the existing `structured_content` layer. Readiness run `31809506731`, artifact `9222529459`, digest `sha256:626b38ff5720aad5b3560957877bf9bb27bac9f061ad2e0d43f5b32871bc0911`, proves the exact fail-closed payload is ready:

- **798** accepted Grub rows, zero held;
- **1,326** accepted Fit descendants, exactly **51 per each of 26 accepted movements**;
- **2,124 total rows**;
- partial publication forbidden;
- `productionPass:false` until live D1 publication + authenticated accepted-authority serving proof.

PR #337 is merged and closes the remaining Fit visual-serving source gap: all 26 accepted premium START/MOVE/FINISH SVGs are Worker-addressable at their published paths and the live proof requires genuine production HTTP SVG delivery. It also prevents missing optional Shift Me assets from contaminating unrelated premium surfaces while keeping Shift Me's own proof fail-closed.

PR #340 is merged and removes the final manual board-reconciliation hand-off. Its dedicated exact-reconciliation CI is GREEN and proves that **only after** exact live evidence — 2,124 published rows, 28/28 unique accepted Grub slots, exact CoFID evidence, accepted Fit authority, durable Grub/Fit Nays across logout/login, retained Grub/Fit plan analytics, retained return state and 26/26 live premium Fit SVGs — may the programme atomically change G2-002/G2-003/G2-004/G2-007 to PASS, M11/M12 to PASS, blocker counts to **54 PASS / 0 AMBER / 3 BLOCKED / A=0**, generate retained production evidence, and advance this recovery pointer/Matt pack. The same source gate separately proves the current pre-production scoreboard stays 50/4/3.

Do not manually edit the matrix to A=0 before that production workflow succeeds.

## Gate 3 and Gate 4 — locked PASS

All original Gate-3 and Gate-4 rows retain earned PASS. Homepage-grade forest/cream remains the design constitution.

Earlier Today/G3/Progress-Picture rendered reds are tied to the stale production Worker/static-asset graph. #337 repairs cross-surface optional-asset contamination in source; production re-proof is useful only after genuine Worker promotion.

## Gate 5

All automatable non-external original Gate-5 rows remain PASS. Dave remains PASS for non-clinical V1 at 19/20; the sole treatment-support leg is external.

**G5-001 / G5-002 / G5-003** remain genuine external BLOCKED rows and must not be represented as available clinical capability.

## Singular Worker deployment blocker — issue #298

The existing `Cloudflare Production Promote` workflow remains the **only** intended promotion path.

Fresh current-engineering-baseline attempt after PR #340: run `31811589927`, job `94803255389`, failed exactly at **`Fail closed when deploy credential is absent`**. Wrangler installation, deploy, route proof and Shift Me static-asset proof were all correctly skipped.

Missing external input: **GitHub Actions secret `CLOUDFLARE_API_TOKEN`** with permission to deploy Worker `shift-core`.

Do not commit/send the token, create another deploy path, add trigger-only rebuild commits, or rerun production proofs before the deployment state changes.

After the secret exists, run the existing `Cloudflare Production Promote` workflow once on then-current `main`. A GREEN promotion automatically unlocks the existing chained `Final V1 Production Publication` workflow, which now:

1. refuses stale promoted source before any D1 mutation;
2. atomically publishes the exact **2,124** accepted rows;
3. proves authenticated accepted Grub/Fit serving, CoFID provenance, retained Nays/return and plan analytics;
4. proves **26/26 accepted premium Fit SVGs** over production HTTP;
5. refuses reconciliation if `main` moved during proof;
6. only then reconciles the four Gate-2 rows to PASS and commits **54/0/3 + A=0** evidence/recovery authority.

## M04 / rendered targeted proof

Latest pre-promotion M04 evidence (`31809506744`, job `94796447939`, artifact `9222585279`) still lacks persisted `grub_plan_generated` on live traffic. Do not rerun M04/Shift Me/Today/G3 until Worker promotion genuinely changes production.

## Timber Mill — separate manual publication boundary

Issue #300 remains outside the original 57-row audit. Publish exactly `ShiftSomeTimber-APPROVED-STORYBOARD-TIMBER-MILL-CORRECTED.zip` through the existing Cloudflare static/manual path, then rerun the retained desktop + 390px visual acceptance once. Do not rebuild the page again.

## Exact next execution after external unlock

1. Configure `CLOUDFLARE_API_TOKEN` in GitHub Actions and promote then-current main through the existing workflow.
2. Let the chained exact 2,124-row publication/serving/26-SVG/A=0 reconciliation execute automatically.
3. Rerun M04 + Shift Me/Today/G3 once against the changed production graph.
4. If the chained Gate-2 proof is GREEN, accept the automatic 54/0/3 + A=0 reconciliation; do not manually override it.
5. Freeze new non-clinical product work; run RC regression and final genuine-device hostile acceptance; fix release defects only.
6. Keep G5-001/G5-002/G5-003 externally BLOCKED until genuine provider/clinical closure.
