# Shift Commissioning Evidence Ledger

This ledger records demonstrated evidence. `docs/LAUNCH-FINISH-LINE.md` is the launch board; `docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md` preserves all 57 original requirements. Code existence and candidate volume are not PASS.

## Locked behavioural foundations
- **B02 PASS:** authenticated A/B member isolation + durable leave/return state.
- **B03 behavioural PASS — 9/9:** Grub, Fit, Today, Hydration, Conundrum, My Plans, Progress, Progress Picture and Shift AI. Do not reopen without genuine behavioural regression evidence.
- **B04 PASS:** One Shift Brain current-intent precedence, durable Grub/Fit learning, cross-domain isolation and retained Progress/AI context.
- **M02 PASS:** reviewed Knowledge publish -> canonical retrieval -> provenance/grounding -> withdrawal -> no grounding.
- **M14 / G4-002 PASS:** memory inspect/correct/delete, provenance/confidence, privacy controls and isolation.
- **M15 / G5-004 PASS:** mocked partner MOT -> sourced Progress -> One Shift Brain -> Today with member isolation and non-diagnostic boundary.
- **M16 / G5-006 PASS:** member-one Progress + engagement outcome architecture with separated cohorts and internal-only/non-causal guardrails.

## M03 production Radar — PASS
Production commissioning on 2026-08-12 invoked the genuine scheduled regulator scanner through restricted GitHub Actions OIDC. The deployed scanner successfully retrieved:
- MHRA drug safety: 40 items.
- MHRA alerts: 40 items.
- EMA news: 5 items.

The scan completed successfully and production freshness immediately returned `GREEN`, `current:true`, scan age inside the 24h SLO, event age inside the 48h SLO and no stale reasons. Existing adversarial commissioning proves stale -> AMBER, publication failure -> RED and recovery -> GREEN. Original G4-006 and G4-007 are therefore PASS.

## M10 exhaustive production route detection — original G1-006 PASS
The exhaustive whole-estate release sweep checked **418 same-origin URLs / 370 HTML pages** with **0 critical route, asset or blank-page failures** and `truncated:false` against a 1,000-URL ceiling. Discovery was exhausted. An earlier malformed `${m.url}` defect was found by this mechanism, fixed, and the unchanged exhaustive sweep reran green. This closes original G1-006. M10 itself remains AMBER for rendered loading/empty/error states and mobile/cross-browser acceptance.

## M07 structured member runtime — original G5-009 PASS
PR #68 introduced V7 structured-preferred Grub/Fit composition with controlled V4 migration fallback. Production commissioning then exposed two real Fit cutover defects rather than allowing a shallow structured floor to degrade the member experience:
1. Three published structured movements were initially cycled repeatedly through a multi-day plan. The semantic quality floor correctly rejected the repetition. PR #77 changed structured cutover to use each eligible published movement at most once across the plan and preserve quality-aware legacy fallback for unfilled slots.
2. V6 could still enforce the semantic quality floor against the interim legacy composition before V7 had the chance to enrich it. PR #80 moved authoritative quality enforcement to the final V7 composition for V7-owned routes while leaving ordinary V6 callers fail-closed.

PR #80 Master Integration and whole-estate gates were GREEN. It merged as `d28d0fde59b1146506c98d8f16f4ff5c88e82138`. The unchanged post-merge production commissioning run `31638147840` is fully GREEN, including Radar, authenticated isolation, longitudinal Grub/Fit, locked B03 and M07.

M07 production evidence:
- Grub V7: `publishedAvailable:1`, `served:1`, example `lighter-beef-cottage-pie`, validated nutrition retained, durable Nay respected.
- Fit V7: `publishedAvailable:3`, `served:3`, example `dumbbell-goblet-squat`, member visual `assets/fit/shift-fit-batch2.svg#goblet-squat`, durable Nay respected.
- Production proof states that the authenticated member consumed reviewed/published structured Grub/Fit content with validated nutrition, approved visual guidance and durable Nay behaviour; legacy remains controlled migration fallback only.

This closes original G5-009. M11/M12 remain AMBER because production scale and breadth are separate requirements.

## Industrial content factory
The old 64 Grub / 48 Fit numbers are retired as product targets. Current objectives are **2,500 commissioned Grub + 2,500 commissioned Fit** in the current build and **10,000+ quality objects in each universe** long-term.

### Grub funnel
- Structured authored/schema-valid universe: **256** = 32 original + 224 industrial.
- Industrial batch distribution: 56 breakfast / 56 lunch / 56 dinner / 56 snack.
- Nutrition-valid: **1**.
- Reviewed: **1**.
- Published: **1**.
- Production-served: **1**.
- Object-level commissioning floor ready: **1**; catalogue-scale M11 remains AMBER.
- New 224 industrial objects remain quarantined drafts pending ingredient-level nutrition validation/review.

The first industrial generator produced exact duplicate snack fingerprints. CI rejected the batch. The content was changed to materially distinct variants; the duplicate gate was not weakened. Industrial gate requires unique IDs/titles/fingerprints and complete structural/safety metadata.

Historical variety evidence remains: live 16-recipe pool produced ~86.7% exact repeats over 30 days and ~93.3% over 60 days; the earlier 32-candidate capacity pool was still ~60% / 80%. Industrial 90/180/365-day commissioned-catalogue simulation remains required and candidate capacity must not masquerade as production variety.

### Fit funnel
- Structured authored/schema-valid universe: **256** = 32 original + 224 industrial.
- Industrial objects cover **28 canonical movements × 8 meaningful variation identities**.
- Existing visual assets authored: 8; member-QA approved: **3**.
- Reviewed: **3**.
- Published: **3**.
- Production-served: **3**.
- Object-level commissioning floor ready: **3**; catalogue-scale M12 remains AMBER.
- New 224 industrial objects remain visual/review quarantined.

Historical simulation: live 12-movement pool could repeat one movement 15 times over 180 slots; the earlier candidate pool reduced worst repetition to 5. Industrial 4/8/12/26/52-week multi-context simulation remains required.

## B01 / M09 human-only boundary
Deterministic email verification, welcome/reset delivery implementation and reset/change-password logic are proven. Remaining release evidence requires a real inbox token/click chain. Secret-bearing reset/verification tokens must never be committed or logged.

## Current authoritative scoreboard
**57 total / 16 PASS / 38 AMBER / 3 BLOCKED / 0 abstraction orphans.**

Rows newly closed in this industrial execution wave: **G4-006, G4-007, G1-006, G5-009**.

External BLOCKED originals remain exactly G5-001, G5-002 and G5-003.

## Active closure swarm
B01; B03 rendered/premium/mobile only; B05; B06/B07; B08/Dave; M01; M04–M06; M08–M13; M17. Industrial Grub/Fit conversion must run continuously but must not queue unrelated closures.

Operating rule: **SWARM -> INDUSTRIALISE -> VALIDATE -> SERVE -> BREAK -> FIX -> PROVE -> CLOSE.**
