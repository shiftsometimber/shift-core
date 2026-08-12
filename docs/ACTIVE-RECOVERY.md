# Active recovery checkpoint — 2026-08-12

Authoritative execution state if interrupted. GitHub `main` is authoritative for landed code; `docs/LAUNCH-FINISH-LINE.md` is the launch board; `docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md` preserves the original 57 requirements; `docs/COMMISSIONING-EVIDENCE.md` records demonstrated evidence.

## Current main
Latest observed `main`: `0f5617687dd3555f5bb11be4c513629e02da6eb3`, merge of PR #59. PR #60 content batches are also merged on main. PR #55 is closed as superseded by #56–#60; its unchanged rerun was 29/29 GREEN and the one earlier `register DaveA` 500 did not reproduce. Do not reopen #55 without genuine regression evidence.

## Locked PASS
- B02 authenticated isolation + durable state: PASS.
- B03 behavioural member products: **9/9 PASS**, locked unless a genuine regression appears.
- B04 longitudinal One Shift Brain: PASS.
- M02 reviewed Knowledge lifecycle: PASS.
- M15 mocked partner-ready Health MOT path: **PASS for the agreed mocked V1 requirement**. PR #59 proves mocked partner payload -> idempotent MOT persistence -> clearly sourced Progress -> One Shift Brain -> authenticated Today, with cross-member isolation and explicit non-diagnostic/no-treatment-change boundaries. Live provider mapping/sign-off remains external/post-launch until a provider is formalised.

## Content conversion checkpoint
The member runtime still serves the legacy hard-coded V4 catalogue, so M07/M11/M12 remain AMBER despite increased authoring.

- Grub legacy production source: 16 recipes.
- Grub structured authored: 32 across four 8-recipe batches.
- Grub structured nutrition-validated: 0.
- Grub second-person reviewed/approved: 0.
- Grub published/production-served structured: 0.
- Grub launch-ready: 0.
- Fit legacy production source: 12 exercises.
- Fit structured authored: 32 across four 8-exercise batches.
- Fit approved member visual guidance: 0 on current main factory batches.
- Fit reviewed/published/production-served structured: 0.
- Fit launch-ready: 0.

Do not confuse authored capacity with product conversion. Required funnel is: authored -> deterministic/schema validation -> domain validation (nutrition/visual) -> reviewed -> published -> production-served -> launch-ready -> longitudinal simulation.

## Active closure branch
`finish/conversion-and-amber-swarm`, PR #61.

PR #61 currently adds:
- M14 member memory inspect/correct/delete API controls with provenance/confidence and user-scoped durable deletion, plus staging proof.
- M16 governed outcomes member-one/cohort commissioning proof using real Progress + product-event contracts and explicit internal-only/non-causal guardrails.
- Master Integration regression steps for M14, existing M15 and M16.

Do not promote M14/M16 to PASS until PR #61 CI is green unchanged.

## Original audit
57 original rows remain mandatory. Last reconciled classification before the M14/M15/M16 promotion batch: **9 PASS / 45 AMBER / 3 BLOCKED**. If M14/G4-002, M15/G5-004 and M16/G5-006 all earn PASS evidence, next reconciled classification becomes **12 PASS / 42 AMBER / 3 BLOCKED**.

## External blocked
- G5-001 signed clinical operating model/provider/pharmacy governance.
- G5-002 clinically governed Medication Companion prescribing/escalation.
- G5-003 provider-approved identity/weight/evidence verification.

## Active independent AMBER swarm
B01 recovery; B03 rendered/premium/mobile only; B05 trust; B06/B07 HQ/Watchtower fire drill; B08 Dave; M01 premium/mobile; M03 Radar production freshness; M04 analytics; M05 security/privacy; M06 accessibility/performance; M07 structured runtime cutover; M08 release evidence; M09 verification; M10 routes/errors; M11 Grub conversion+simulation; M12 Fit/visual conversion+simulation; M13 Progress/units; M14 memory controls (PR #61); M16 outcomes (PR #61); M17 sceptical-customer/Numan acceptance.

## Exact next action
1. Let PR #61 run unchanged. If red, fix the exact product/test-environment defect without weakening proof. If green, promote M14/G4-002 and M16/G5-006; M15/G5-004 is already evidenced by merged #59 and must be reconciled at the same checkpoint.
2. Move Grub/Fit from draft inventory into domain validation/review, then published structured content and actual member serving; do not merely add more drafts.
3. In parallel attack B06/B07 controlled degradation->action->recovery and the remaining independently closable AMBER rows.

Operating rule: **CONVERT -> PROVE -> CLOSE -> CONTINUE.**
