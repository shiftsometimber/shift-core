# M07 / G5-009 structured production-serving proof — 2026-08-12

Evidence source: Shift Production Commissioning run `31638147840`, job `94253583485`, against merged `main` commit `d28d0fde59b1146506c98d8f16f4ff5c88e82138` after PR #80.

## Production journey demonstrated

The unchanged authenticated production commissioning flow completed GREEN after using the restricted GitHub Actions OIDC commissioning identity. Before the M07 assertion, the same run also re-proved production health, genuine Radar scanning/freshness, two-session isolation/retained state, longitudinal Grub/Fit learning, Progress Picture, Shift AI provenance and clinical-boundary behaviour.

The final M07 production stage proved:

### Grub

- runtime kind: `shift_grub_plan_v7`
- reviewed/published structured recipes available: 1
- reviewed/published structured recipes actually served: 1
- production example: `lighter-beef-cottage-pie`
- durable Nay behaviour respected: true

### Fit

- runtime kind: `shift_fit_plan_v7`
- reviewed/published structured movements available: 3
- reviewed/published structured movements actually served: 3
- production example: `dumbbell-goblet-squat`
- approved visual bound and returned: `assets/fit/shift-fit-batch2.svg#goblet-squat`
- durable Nay behaviour respected: true

The gate emitted: `PASS M07 authenticated production member consumes reviewed/published structured Grub/Fit content with validated nutrition, approved visual guidance and durable Nay behaviour; legacy remains controlled migration fallback only.`

## Defects found before PASS

Production commissioning was not narrowed to make the test pass. It exposed two real cutover defects and the product was repaired before the unchanged proof went GREEN:

1. Cycling only the three commissioned Fit movements across a multi-day plan violated the semantic repetition floor. PR #77 changed V7 to use each eligible structured movement at most once per plan and retain Brain/Nay-aware V6 selection as controlled migration fallback for remaining slots.
2. V6 could enforce semantic quality on the interim legacy plan before V7 structured enrichment. PR #80 moved final semantic-quality enforcement after structured enrichment for V7 while preserving fail-closed V6 behaviour for ordinary V6 callers.

PR #80's Master Integration and Whole-Estate gates were GREEN before merge. The production run then passed unchanged.

## Commissioning decision

Original audit row **G5-009 — recipes/exercises are hard-coded scaling traps** now earns PASS for runtime authority: reviewed/published structured catalogue objects are genuinely supplying authenticated production members, preserving Brain/Nay behaviour and approved content metadata, with legacy retained only as controlled migration fallback while commissioned inventory grows.

This PASS does **not** claim catalogue depth. G2-002/G2-003/G2-004 and G2-007 remain AMBER until the 2,500-object short-term Grub/Fit commissioning objective is converted through validation/review/publication/serving at meaningful scale.
