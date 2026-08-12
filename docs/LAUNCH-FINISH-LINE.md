# Shift V1 Launch Finish Line

This is the authoritative scope boundary for finishing Shift. No fourth category exists. New work may be added only if it closes one of these requirements or fixes a defect discovered while proving one.

## DONE definition
Shift V1 is production-ready when every BLOCKER is closed, every MUST FINISH item is closed or demonstrably included in the release candidate, Dave completes the agreed end-to-end journey without assisted workarounds, critical production monitoring is active, and any externally dependent clinical capability is either formally commissioned or clearly unavailable/not sold to members.

## BLOCKER — cannot launch without it

| ID | Requirement | Current evidence | Closure test |
|---|---|---|---|
| B01 | Production authentication + transactional email recovery | Auth/security paths and abuse probes green; real inbox reset lifecycle not yet evidenced | register/verify/login/forgot email received/reset/change password/login/logout all succeed on production |
| B02 | Authenticated member isolation + durable longitudinal state | Anonymous spoofing and synthetic isolation green; real-session A/B proof incomplete | two authenticated members cannot read/infer/change each other's Brain, Progress, plans, feedback or AI context; leave/return retains own state |
| B03 | Core member V1 journeys are complete and safe | Engines and quality gates exist; member behavioural/premium evidence remains mixed | Today, Grub, Fit, Hydration, Conundrum, Progress, Picture, My Plans and Shift AI complete their primary mobile journeys with persistence, graceful errors and no obviously poor output |
| B04 | One Shift Brain behaviour works longitudinally | Architecture + synthetic preference/Nay/current-intent proofs green | authenticated preference -> leave -> return -> changed recommendation; current intent overrides stale memory; unrelated products remain unaffected |
| B05 | Public/member trust boundary is accurate | Legal/trust architecture exists; full production trust audit incomplete | visitor can identify operator, AI limits, data handling, support route and current clinical/provider status without invented claims |
| B06 | HQ can operate production | Watchtower/attention/journey APIs exist; operator workflow evidence incomplete | authorised HQ user can see actionable platform/member failures, distinguish RED/AMBER, and inspect recovery without raw telemetry interpretation |
| B07 | Critical monitoring detects real production degradation | probes/history/SLO architecture green | controlled safe degradation is detected, retained, surfaced to HQ with next action, then recorded recovered |
| B08 | Dave release-candidate journey | public Dave + anonymous boundary green; authenticated journey incomplete | fresh Dave completes discover -> trust -> register -> verify -> onboard -> Today -> Grub -> Fit -> hydration -> Progress -> Picture -> Ask Shift -> learning -> leave/return -> changed recommendation -> account recovery; clinical/treatment leg only if formally commissioned |

## MUST FINISH — agreed V1 requirement

| ID | Requirement | Closure |
|---|---|---|
| M01 | One Shift visual system across public + My Shift | representative desktop/mobile screens meet homepage-level component language; no prototype/browser-default member UI |
| M02 | Knowledge reviewed publication lifecycle | reviewed publish -> canonical retrieval -> Shift grounding/provenance; withdrawn/unreviewed stops grounding |
| M03 | Radar production freshness | live scan/publication/ticker timestamps and stale state are visible/monitored; do not claim LIVE without evidence |
| M04 | Product analytics funnel | registration/onboarding/Today/core feature/Progress/return/error events observable with privacy filtering |
| M05 | Security/privacy release review | session/authz/rate limits/secrets/uploads/member export-delete/audit/analytics boundaries evidenced for launch paths |
| M06 | Accessibility + performance release check | critical journeys keyboard/focus/forms/errors/navigation/reduced-motion structure pass; production performance budgets measured and material slow paths fixed |
| M07 | Structured content production path | recipes/exercises/Knowledge use scalable structured path where required for V1; load benchmark demonstrates no obvious V1 scaling trap |
| M08 | Release evidence + recovery checkpoint | remediation/evidence ledger reconciled to current main with exact release status, known external blockers and rollback/recovery state |

## POST-LAUNCH — does not delay V1

| ID | Item |
|---|---|
| P01 | Advanced outcome/correlation reporting beyond launch analytics |
| P02 | Broader Watchtower probes/SLOs beyond critical V1 journeys |
| P03 | Large-scale content expansion beyond sufficient high-quality V1 catalogue |
| P04 | Non-critical HQ workflow/marketing/CRM sophistication |
| P05 | Advanced animation/polish that does not affect usability, trust or consistency |
| P06 | Health MOT live partner integration until a provider is formally selected/commissioned |
| P07 | Paid clinical prescribing/dispensing/identity-evidence workflow until provider, pharmacy and governance responsibilities are formally commissioned; Shift may launch only without selling/implying unavailable clinical service |

## Critical path
B01 production auth/email -> B02 authenticated isolation/state -> B04 longitudinal Brain -> B03 core member journeys -> B06/B07 operations -> B08 fresh Dave -> M01/M05/M06 release sweep -> final evidence reconciliation.

Parallel lanes: public trust (B05), Knowledge/Radar (M02/M03), structured content/load (M07), analytics (M04), visual/accessibility/performance (M01/M06), HQ/Watchtower (B06/B07).

## External blockers
Clinical provider/pharmacy/clinical governance and any provider-specific identity/evidence/Health-MOT integration cannot be truthfully commissioned without formal external arrangements. They are POST-LAUNCH for a non-clinical V1; they become BLOCKER the moment V1 is defined as selling/providing clinical treatment.

## Burn-down baseline — 2026-08-12
Launch blockers: 8
Must-finish items: 8
Dave journey genuinely GREEN: approximately 25% (public discovery/trust/Core health/anonymous boundary proven; authenticated longitudinal/product/recovery legs not yet fully evidenced)
Production surfaces complete: not yet honestly countable from current evidence; establish route-level count during B03 sweep rather than inventing a denominator
Regressions introduced: 0 known
Regressions unresolved: 0 known

## Exact next actions
1. Close B01 with production transactional inbox/recovery evidence.
2. In parallel, close B02/B04 using authenticated two-member and leave/return commissioning.
3. Drive B03 by primary member journey rather than engine/component status; defects are fixed in place.
4. Close B06/B07 with controlled production-safe degradation/recovery proof.
5. Extend Dave continuously as each blocker turns green; do not defer Dave to the end.
