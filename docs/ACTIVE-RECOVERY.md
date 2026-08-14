# Active recovery checkpoint — 2026-08-14

## Current authority

`main` authority at this checkpoint = `e0fba058e7cd6ef07ad7f377fd14263409140bc8`, squash merge of PR #216 after its Master Integration, whole-estate, Grub editorial and member-frontend source gates completed GREEN.

The authoritative original audit remains **57 total / 30 PASS / 24 AMBER / 3 BLOCKED / 0 unmapped**. A merge, source gate or green workflow is not enough to change an AMBER row: the required production journey, retained state where relevant, expected member outcome and retained evidence still have to pass.

## Gate 1

Only the irreducible real-inbox lifecycle rows remain AMBER:

- **G1-001** — reset email token -> reset -> login -> authenticated password change -> logout/login.
- **G1-003** — genuine verification link -> verified login -> post-verification Welcome -> logout/final login.
- **G1-004** — genuine verification-link ordering/replay proof.

All non-human Gate 1 rows are PASS. Do not reopen them without regression evidence.

## Gate 2 — exact current breakpoint

### G2-001 Today

PR #215 added trusted authenticated rendered desktop + 390px acceptance to the existing production commissioning workflow. It proved the real Today API returns the canonical command-centre headline/subhead and personalised actions, hydration state persists, Today -> Grub -> Today retains personalised actions, root overflow is zero and no raw JSON/debug implementation detail is exposed.

That acceptance correctly failed because production still rendered the old hard-coded `Shift Today / One useful view of today. / No guilt trip, no punishment workout.` copy rather than the canonical `/v1/shift/today` headline/subhead.

PR #216 then made the smallest existing-architecture repair: the recovered live `member-product-v33d.js` remains the single member product client and now renders `t.headline` and `t.subhead` from the existing `SST_API.getShiftToday()` response. The exact pre-change live client SHA-256 retained by the recovery runner was `3a3077c39ace56dcceb5627c1de3464e21b2114ebafa7833e1c65aa0f5e6d3db`.

**Do not mark G2-001 PASS yet.** Post-merge production run `31763359265`, job `94654138456`, reached the real authenticated member journey again and failed the same six headline/subhead/return-state assertions on desktop + 390px. The API outcome and personalised retained state are green; the live static client is stale. Artifact `9205424463`, digest `sha256:45dea7dcafa2e08c640f012e6174281c31dceb658aad721aea1512dd7b0b46aa`.

Exact remaining closure: publish Git-authoritative `frontend/member/member-product-v33d.js` unchanged to production root `/member-product-v33d.js`, verify the live source/SHA matches Git, then rerun the unchanged trusted authenticated Today acceptance and inspect the rendered desktop + 390px evidence. Static Pages publication is separate from Git/Worker deployment; a main merge cannot be treated as publication proof.

### G2-002 / G2-003 / G2-004 Grub

The V1 launch cohort is finite at **783 clean candidate recipes behind eight immutable editorial decisions**. Nutrition/systemic quality and long-horizon diversity are technically proven. The eight decisions require attributable independent human editorial acceptance before canonical approval/publication can propagate. `evidence/matt-v1-content-acceptance-2026-08-13.json` is explicitly a system-readiness acceptance and explicitly is **not** item-by-item/decision publication authority. Leave these rows AMBER; continue around them.

### G2-007 Fit

The latest main review-pack run `31751231158` completed GREEN and retained artifact `9200983545` (`sha256:4521022cfb68f5bfa2c802dfbeebe39daf64aa8bff8ad20ba96b8c6f08e4d507`). Its manifest is deliberately explicit: **26 produced / 26 technical QA PASS / 0 domain accepted**. This is now a finite human/domain boundary, not unfinished generation. Closure requires genuine visual/anatomical/member-comprehension decisions, followed by publication and production serving. Do not self-promote technical QA into domain acceptance.

### G2-011 / G2-013 / G2-014 / G2-015 Progress and Plans

Existing production behaviour is not being discarded: Progress Picture already has real authenticated save/list/read/delete, optional weight/waist metadata, retained units and separate generated illustrations; active-plan persistence is also proven. The remaining commissioned scope is productisation: whole-person Progress story, full rendered/mobile acceptance, homepage-standard premium Progress presentation and a proper plan-management surface. Inspect and extend the existing member product/static surface; do not create a parallel Progress or Plans architecture.

## Gate 3

G3-008's source repair has already been merged and retained. Production remains honestly AMBER because static publication is stale: the live member shell still references an older P0 stylesheet version while Git authority requires the repaired current source. Exact closure remains: publish `frontend/member/member-shell-v33g.js` unchanged to `/member-shell-v33g.js`, verify the current versioned P0 reference is live, then rerun the unchanged authenticated desktop + 390px accessibility acceptance. Evidence: `docs/evidence/2026-08-14-g3-008-post-merge-production-publication-blocker.md`.

The rest of Gate 3 remains systemic premium/UX acceptance against the homepage design constitution; do not solve it as isolated cosmetic page patches.

## Gate 4

G4-001 through G4-007 are PASS. **G4-008 remains AMBER** and is coupled to the same premium Today orchestration outcome as G2-001. Do not build a second orchestration engine; finish and prove the existing Today/Brain surface.

## Gate 5

External BLOCKED remains exactly **G5-001, G5-002 and G5-003**.

G5-013 is now **16/20** non-duplicated Dave legs; the remaining registration/verification/recovery legs are real-inbox human work and treatment support is external. Do not hold independent commissioning behind them.

G5-012 has a bounded production measurement path on current main. `g5-012-natural-auth-p95.mjs` measures member registration handler time separately from GitHub OIDC/fixture wrapper overhead, requires at least five successful natural registration and login samples, and enforces the declared 800 ms p95 member API budget. The current post-merge production commissioning run `31763359265` is the next authoritative evidence source; reconcile its final G5-012 artifact rather than quoting the older 20.6s/17.5s wrapper timings if the new member-path measurement completes.

## Deployment truth boundary

GitHub + production define what exists; matrix + evidence define what is proven. Cloudflare Worker production deployment is automated from main, but the static `shiftsometimber.co.uk` Pages publication path is distinct. Current demonstrated static-publication blockers include at least:

- G2-001: `/member-product-v33d.js` is not yet serving the merged canonical Today headline/subhead integration.
- G3-008: `/member-shell-v33g.js` is not yet serving the current Git-authoritative P0 stylesheet reference.

Do not retry source rewrites to compensate for an unperformed static publish. Publish the Git-authoritative files unchanged, fingerprint live source, then run acceptance.

## Exact next actions

1. Finish current production run `31763359265`; retain/reconcile G5-012 p95 and fresh Dave evidence.
2. Keep G2-001 AMBER until the static client is genuinely published; then rerun the unchanged authenticated desktop + 390px proof and visually inspect it before PASS.
3. Leave Grub's eight immutable decisions and Fit's 26 domain decisions at the human boundary; all technical preparation is finite and ready for review rather than more factory work.
4. Continue Gate 2 non-blocked productisation in order: G2-011 Progress story -> G2-013 rendered/mobile Progress -> G2-014 premium Progress -> G2-015 plan manager, reusing current Progress/Plans state and member client.
5. Continue Gate 3 systemic premium/accessibility closure, then Gate 4 G4-008 using existing Today/Brain, then Gate 5 G5-012/G5-014 and non-blocked Dave evidence.
6. Update matrix/evidence only when the demonstrated outcome changes. Never convert source-green, merge-green or technical-QA-green into a commissioning PASS by narration.

Operating rule: **REUSE -> EXTEND -> CONNECT -> PRODUCTISE -> BUILD ONLY ON A REAL GAP -> PROVE IN PRODUCTION -> RETAIN EVIDENCE -> CONTINUE.**
