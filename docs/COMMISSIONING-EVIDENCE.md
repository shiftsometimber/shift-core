# Shift Commissioning Evidence Ledger

This ledger records demonstrated evidence. `docs/LAUNCH-FINISH-LINE.md` is the launch board; `docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md` preserves the original 57 requirements. Code existence is not PASS.

## Locked behavioural PASS
- **B02 PASS:** authenticated A/B member isolation + durable leave/return state.
- **B03 behavioural PASS — 9/9:** Grub, Fit, Today, Hydration, Conundrum, My Plans, Progress, Progress Picture and Shift AI. PR #54 fixed the prescription-boundary defect without weakening hostile proof; merged production commissioning on `e46aa035` passed unchanged. Do not reopen without regression evidence.
- **B04 PASS:** One Shift Brain current-intent precedence, durable Grub/Fit learning, cross-domain isolation and retained Progress/AI context.
- **M02 PASS:** reviewed Knowledge publish -> canonical retrieval -> provenance/grounding -> withdrawal -> no grounding.

## Closures added in the current swarm
### M14 / original G4-002 — PASS
PR #61 Master Integration run `31624564126` passed the M14 commissioning step unchanged. Evidence proves a member can inspect learned memory with provenance/confidence, correct it (correction is explicitly sourced `member_correction`), durably delete it, change memory/proactive privacy controls, and cannot alter another member's memory. The product routes now expose authenticated GET `/v1/shift-ai/memory`, PATCH `/v1/shift-ai/memory/:key` and the existing user-scoped DELETE route.

### M15 / original G5-004 — PASS
Merged PR #59 plus PR #61 regression proof demonstrates mocked partner Health MOT payload -> normalized/idempotent MOT persistence -> clearly sourced Progress -> One Shift Brain -> authenticated Today. Recognised measurements import safely; unrelated lab values do not leak into Progress fields; another member cannot inherit the result; Shift may summarise but may not diagnose/change treatment. This closes the agreed mocked partner-ready V1 requirement. A real provider mapping/sign-off remains external/post-launch until a provider is formalised.

### M16 / original G5-006 — PASS
PR #61 Master Integration run `31624564126` passed the M16 commissioning step after one staging-fixture defect was fixed. The first attempt failed because the test fixture used an obsolete `product_events` shape lacking production `occurred_at`; the production module was not weakened. The fixture was corrected to the real analytics schema and rerun unchanged. Evidence now proves member-one Progress and product engagement can be joined into separated member cohorts, including opposite weight directions and different engagement bands, while output remains `internalOnly` with explicit warning that correlation is not causation and is not a publishable clinical outcome claim.

## PR #61 CI state
- Shift AI Academy Gate: GREEN.
- Shift Master Integration Gate run `31624564126`: GREEN after the exact M16 fixture repair. M14 PASS, M15 PASS, M16 PASS; all prior source/security/Brain/content/Watchtower/adversarial/10k/runtime-auth/Dave/Radar/production-isolation gates also passed.
- No B03/#55 proof was weakened or reopened.

## Content conversion evidence
Current structured factory on main/PR #61:
- **Grub:** 32 structured authored across four batches. Meal distribution: 8 breakfast / 8 lunch / 10 dinner / 6 snack. Deterministic/schema gate passes all authored items. Nutrition-validated 0; second-person reviewed/approved 0; published 0; structured production-served 0; launch-ready 0. Legacy V4 still serves 16.
- **Fit:** 32 structured authored across four batches, 12 movement groups in the structured set. Deterministic/schema gate passes. Approved member visual guidance 0; reviewed/approved 0; published 0; structured production-served 0; launch-ready 0. Legacy V4 still serves 12.

Capacity simulator (drafts are used for capacity testing only, never counted launch-ready):
- Grub prospective pools with legacy + drafts: breakfast 12 / lunch 12 / dinner 14 / snack 10. First exact repeats move from day 5 live to day 13 / 13 / 15 / 11. Over 30 days, 72 exact repeats remain across 120 slots (60.0%); over 60 days, 192 repeats across 240 slots (80.0%). Therefore the 64 floor remains a hypothesis and more breadth/constraint-aware simulation is required.
- Fit prospective pool: 44 exercises / 13 movement groups; worst exercise appearance falls from 15 live to 5 across 180 slots (36 sessions × 5). Progression, limitation compliance, session similarity and visual acceptance remain unproven, so M12 stays AMBER.

## Auth transient evidence
PR #55 is closed as superseded. Its unchanged rerun was 29/29 GREEN. The earlier generic `register DaveA` 500 did not reproduce. Treat it as a non-reproduced transient; if registration 500 recurs, preserve/request sufficient request-level telemetry to identify the failing registration stage. Do not reopen #55 without genuine regression evidence.

## B01
Welcome/reset email receipt and reset/change implementation are proven. Remaining B01 proof is the secret-bearing real inbox token -> reset -> login new password -> authenticated change-password -> logout -> login. The token must never be committed or logged.

## Current original-audit scoreboard
**57 total / 12 PASS / 42 AMBER / 3 BLOCKED / 0 abstraction orphans.**
Newly evidenced original-row closures this swarm: **G4-002, G5-004, G5-006**.

External BLOCKED originals remain exactly:
- G5-001 signed clinical operating model/provider/pharmacy governance.
- G5-002 clinically governed Medication Companion prescribing/escalation.
- G5-003 provider-approved identity/weight/evidence verification.

## Remaining independent swarm
B01; B03 rendered/premium/mobile only; B05; B06/B07; B08/Dave; M01; M03–M13; M17. Content conversion is important but does not queue the others.

## Recovery point
PR #61 is the current active closure PR. Once the documentation reconciliation rerun is GREEN, merge #61. Then next prey is conversion of structured Grub/Fit into domain-validated/reviewed/published/production-served content while B06/B07 and other independent AMBER rows continue in parallel.

Operating rule: **CONVERT -> BREAK -> FIX -> PROVE -> CLOSE -> CONTINUE.**
