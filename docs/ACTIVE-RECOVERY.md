# Active recovery checkpoint — 2026-08-14

## Authority and recovery rule

Read, in order:

1. `docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md` — authoritative 57-row status.
2. `docs/evidence/2026-08-14-final-human-publication-readiness-current.md` — newest current-state evidence checkpoint.
3. `docs/COMMISSIONING-EVIDENCE.md` — historical ledger; later appended chronology/detailed evidence may supersede older prose near the top.
4. `docs/LAUNCH-FINISH-LINE.md` — launch-board view.
5. `docs/MATT-FINAL-ACCEPTANCE-PACK.md` — human/device tail.

Current code main: `f7b5011bc5c80e401fd4307543787592fc798d4d` (PR #337 merged after #335/#334).

Authoritative original audit: **57 total / 50 PASS / 4 AMBER / 3 BLOCKED / 0 unmapped**. PASS requires demonstrated journey, retained state where relevant, expected member outcome and retained evidence.

## Gate 1 — CLOSED

All original Gate-1 rows remain PASS. Genuine connected-inbox registration, verification, Welcome ordering, password recovery, logout and retained login are already proven. Do not generate more verification/reset mail absent genuine regression evidence.

Fresh broad production commissioning on pre-#337 main (`31809506744`, ordinary job `94796447962`) remained GREEN across Core, security/privacy, Radar, A/B isolation, retained state, longitudinal Grub/Fit learning, Progress Picture/Shift AI behaviour, existing structured serving, Fit duration, unattended Dave and G5-012.

## Gate 2 — exact remaining original-audit tail

Only **G2-002 / G2-003 / G2-004 / G2-007** remain AMBER. They are **not waiting for human review**.

### Final human authority — COMPLETE

- Grub: run `31803717241`, artifact `9220287723`, **798 recipes / 8 decisions / 8 PASS**.
- Fit: run `31802631318`, artifact `9219877222`, **26 canonical movements / 26 PASS**.

PR #332 records the explicit decisions; PR #333 proves post-human publication authority. Do not ask Matt to repeat them.

### Runtime/publication conversion — COMPLETE BEFORE PRODUCTION

PR #335 fixed the accepted-Grub runtime publication defect (`meal_type`/serving metadata). The exact accepted split is 212 breakfast / 204 lunch / 195 dinner / 187 snack.

PR #334 binds the accepted authority to the existing `structured_content` layer and fail-closed production publication/serving proof.

`Final V1 Publication Readiness` run `31809506731`, artifact `9222529459`, digest `sha256:626b38ff5720aad5b3560957877bf9bb27bac9f061ad2e0d43f5b32871bc0911`, proves:

- **798** accepted Grub rows, zero held;
- **1,326** accepted Fit descendants, exactly **51 per each of 26 accepted movements**;
- **2,124 total** exact publication rows;
- existing structured-content layer;
- partial publication forbidden;
- production PASS deliberately false until D1 publication + authenticated serving proof.

PR #337 is now merged and hardens the last visual-serving edge: the exact 26 accepted premium SVGs are present in the Worker member-asset binding/public routes, source-gated and required to return real SVG START/MOVE/FINISH content in the downstream live proof. It also stops missing optional Shift Me assets contaminating unrelated Today/Gate-3 pages, while retaining Shift Me's own independent fail-closed proof.

### Remaining Gate-2 closure

Publish the exact 2,124 accepted rows to production D1 after current main is genuinely promoted, then prove a fresh authenticated member consumes the accepted Grub/Fit authority with validated nutrition, accepted premium visual guidance, durable Nays across logout/login and retained plan analytics.

Do not promote the four rows from readiness/source CI alone.

## Gate 3 and Gate 4 — PASS remains locked

All original Gate-3 and Gate-4 rows retain earned PASS. The homepage-grade forest/cream hierarchy remains the design constitution.

Pre-#337 rendered reds were tied to stale production returning 404 HTML for optional Shift Me premium CSS/JS. #337 has repaired cross-surface contamination in source, but this still requires genuine current-main Worker deployment before a new production browser proof is useful.

Fresh pre-#337 G2-013 run `31809506805` hit the same stale asset graph; its mobile path still retained the saved image across reload/logout/login, cross-member isolation and deletion. Do not reopen the previously earned G2-013 lifecycle PASS.

## Gate 5

All automatable non-external original Gate-5 rows remain PASS. Dave remains PASS for non-clinical V1 at 19/20; treatment support is the sole external leg.

**G5-001 / G5-002 / G5-003** remain the only external BLOCKED original rows.

## Singular Worker deployment blocker — issue #298

The existing `Cloudflare Production Promote` workflow is the only intended promotion path. Its latest explicit attempt before #337 (`31809506824`, job `94796448931`) failed exactly at `Fail closed when deploy credential is absent`; deploy/live-proof steps skipped.

Missing external input: **GitHub Actions secret `CLOUDFLARE_API_TOKEN`** with permission to deploy Worker `shift-core`. Do not commit/send the token, add another deployment architecture or create trigger-only rebuilds.

After the secret exists, run the existing promotion once on **current main including #337**. On GREEN promotion, the existing chained Final V1 production-publication workflow must atomically publish the exact 2,124 accepted rows and prove authenticated accepted-authority serving + premium Fit SVG HTTP delivery.

Current pre-#337 M04 evidence (`31809506744`, job `94796447939`, artifact `9222585279`) again lacks persisted `grub_plan_generated`. Do not rerun M04/Shift Me/Today/G3 until production deployment changes.

## Auto-reconciliation after production proof

PR #336 proved the desired fail-closed A=0 reconciliation model in CI, but its branch now conflicts with the newer #337 final production-publication workflow. Do not merge stale/conflicting workflow code. Recreate/retarget the reconciliation atop current main only if it preserves #337's live visual-serving requirements and still refuses stale production evidence.

## Timber Mill — separate manual publication boundary

Issue #300 remains outside the 57-row audit. Publish exactly `ShiftSomeTimber-APPROVED-STORYBOARD-TIMBER-MILL-CORRECTED.zip` through the existing Cloudflare static/manual path, then rerun the retained desktop + 390px visual acceptance once. Do not rebuild the page again.

## Exact next execution after external unlock

1. Promote current main through the existing Cloudflare workflow.
2. Let the existing chained workflow atomically publish the exact 2,124 accepted rows to production D1.
3. Prove authenticated accepted-authority Grub/Fit serving, accepted premium SVG HTTP delivery, provenance and retained Nay behaviour.
4. Rerun M04 + Shift Me/Today/G3 targeted proofs once against the changed deployment.
5. Reconcile G2-002/G2-003/G2-004/G2-007 only if production evidence is GREEN.
6. Freeze non-clinical RC; run release regression and final genuine-device hostile acceptance; fix release defects only.
