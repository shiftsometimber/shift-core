# Shift V1 Launch Finish Line

This is the authoritative scope boundary for finishing Shift. No fourth category exists. New work may be added only if it closes one of these requirements or fixes a defect discovered while proving one.

## DONE definition
Shift V1 is production-ready when every BLOCKER is closed, every MUST FINISH item is closed or demonstrably included in the release candidate, Dave completes the agreed end-to-end journey without assisted workarounds, critical production monitoring is active, and any externally dependent clinical capability is either formally commissioned or clearly unavailable/not sold to members.

## BLOCKER — cannot launch without it

| ID | Requirement | Current evidence | Closure test |
|---|---|---|---|
| B01 | Production authentication + transactional email recovery | Register/login and real Welcome/reset email receipt proven. Reset/change implementation exists. AMBER only on secure real-token completion. | real inbox link -> reset -> login with new password -> authenticated change-password -> logout -> login again |
| B02 | Authenticated member isolation + durable longitudinal state | **PASS** — PR #47 real-session A/B isolation, separate Brain/Progress/preferences/plans and leave/return state | CLOSED |
| B03 | Core member V1 journeys are complete and safe | PR #48/#49 close major production behavioural evidence; route-level sub-board below is authoritative | every V1 product completes primary member journey with persistence, graceful errors, acceptable semantic quality and premium/mobile presentation |
| B04 | One Shift Brain behaviour works longitudinally | **PASS** — #42 current-intent precedence; #48 authenticated dislike/Nay -> leave/return -> changed Grub recommendation with Fit unaffected | CLOSED |
| B05 | Public/member trust boundary is accurate | Legal/trust architecture exists; full production trust audit incomplete | visitor can identify operator, AI limits, data handling, support route and current clinical/provider status without invented claims |
| B06 | HQ can operate production | Watchtower/attention/journey APIs exist; operator workflow evidence incomplete | authorised HQ user can see actionable platform/member failures, distinguish RED/AMBER, and inspect recovery without raw telemetry interpretation |
| B07 | Critical monitoring detects real production degradation | probes/history/SLO architecture green | controlled safe degradation is detected, retained, surfaced to HQ with next action, then recorded recovered |
| B08 | Dave release-candidate journey | public/auth/isolation/longitudinal Grub-Fit and several member products now automated; full journey incomplete | fresh Dave completes discover -> trust -> register -> verify -> onboard -> Today -> Grub -> Fit -> hydration -> Progress -> Picture -> Ask Shift -> learning -> leave/return -> changed recommendation -> account recovery; clinical/treatment leg only if formally commissioned |

### B03 route-level closure board

| Product | Production behaviour | Exact remaining evidence before product PASS |
|---|---|---|
| Shift Grub | **PASS** — #48 authenticated generation, stored dislike, durable Nay across logout/login, changed later recommendation, semantic quality floor | premium/mobile rendered journey + graceful member-facing failure state |
| Shift Fit | **PASS** — #48 authenticated generation, running dislike respected, Grub signal isolation, semantic quality floor | premium/mobile rendered journey + graceful member-facing failure state |
| Shift Today | **PASS** — #49 authenticated Today consumes active hydration plan and remains correct after logout/login | premium/mobile rendered journey + graceful empty/error state |
| Hydration | **PASS** — #49 coffee/beer rules, plan, persistence and aggregate correctness across logout/login | premium/mobile logging journey + graceful validation/error state |
| Conundrum | **PASS** — #49 authenticated obvious chicken+cheese+wrap relationship proven | premium/mobile journey + broader member-facing error/empty state |
| My Plans | **PASS** — #49 active hydration plan appears and survives logout/login | premium/mobile rendered journey + plan interaction/error state |
| Progress | AMBER — #49 proves production summary is safe in empty/ready state | authenticated create/log -> persist -> refresh -> leave/return + rendered journey |
| Progress Picture | AMBER | authenticated upload/save/history/comparison/delete/privacy + rendered/mobile journey |
| Shift AI | AMBER | authenticated ask -> grounded/provenance-aware answer -> retained context/no cross-member leakage + rendered journey |

Behaviour PASS above means the production behaviour is closed and must not be reopened without a regression. A product becomes fully B03 PASS only when its single remaining rendered/member-facing evidence item is closed.

## MUST FINISH — agreed V1 requirement

| ID | Requirement | Closure |
|---|---|---|
| M01 | One Shift visual system across public + My Shift | representative desktop/mobile screens meet homepage-level component language; no prototype/browser-default member UI |
| M02 | Knowledge reviewed publication lifecycle | **PASS** — reviewed publish -> canonical retrieval -> Shift grounding/provenance; withdrawn content stops grounding |
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
B01 real-token recovery completion -> B03 remaining Progress/Picture/AI behaviour + rendered member evidence -> B06/B07 operations -> B08 fresh Dave -> M01/M05/M06 release sweep -> final evidence reconciliation.

Parallel lanes: B05 trust; B03 rendered/member journeys; B06/B07 Watchtower/HQ; M03 Radar; M04 analytics; M05 security/privacy; M06 accessibility/performance; M07 structured content; B08 Dave expansion.

## External blockers
Clinical provider/pharmacy/clinical governance and any provider-specific identity/evidence/Health-MOT integration cannot be truthfully commissioned without formal external arrangements. They are POST-LAUNCH for a non-clinical V1; they become BLOCKER the moment V1 is defined as selling/providing clinical treatment.

B01 currently has one execution dependency: the real reset token arrives only in the connected inbox and must be submitted to the production reset POST without exposing that single-use secret in repository source/logs. If the active execution environment cannot securely perform that token-bearing POST, the remaining B01 proof is a human/secure-runtime dependency, not an engineering gap.

## Burn-down — reconciled through PR #49, 2026-08-12
Launch blockers: **8 -> 6** (B02, B04 CLOSED)
Must-finish items: **8 -> 7** (M02 CLOSED)
B03 production behavioural subrows closed: **6/9** (Grub, Fit, Today, Hydration, Conundrum, My Plans)
B03 full product rows closed: **0/9** until rendered/mobile member evidence is attached to the six behavioural PASS rows
Dave journey genuinely GREEN: **~60% engineering/behavioural coverage**, final human/rendered and recovery legs incomplete
Regressions introduced by #48 commissioning: **1** (durable Grub Nay could reappear)
Regressions fixed: **1**
Regressions unresolved: **0 known**

## Exact next actions
1. Kill B01 using a secure real-token reset execution path; otherwise mark the exact secure-runtime/human dependency and do not burn engineering time re-proving email delivery.
2. Close B03 Progress, Progress Picture and Shift AI authenticated behavioural journeys in one production suite.
3. In parallel close the single rendered/mobile evidence item for Grub/Fit/Today/Hydration/Conundrum/My Plans rather than reopening their green production behaviour.
4. Close B06/B07 with controlled production-safe degradation -> AMBER/RED -> HQ action -> recovery proof.
5. Continue B05/M03/M04/M05/M06/M07 in parallel only against their explicit closure conditions.
6. Extend Dave from the now-green production behaviours; final fresh human/device Dave remains the release acceptance run.
