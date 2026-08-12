# Shift V1 Launch Finish Line

This is the authoritative launch closure board. `docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md` remains authoritative for the original 57 audit requirements and `docs/COMMISSIONING-EVIDENCE.md` remains authoritative for demonstrated evidence. No requirement may disappear through abstraction: every original row must remain mapped to this board or an explicit external/post-launch disposition.

## DONE definition
Shift V1 is production-ready when every launch BLOCKER is closed, every applicable MUST FINISH item is closed, Dave completes the agreed end-to-end journey without assisted workarounds, critical production monitoring is active, and any externally dependent clinical capability is either formally commissioned or clearly unavailable/not sold to members.

Code existing, a green PR, or a successful deployment is not PASS by itself. PASS requires demonstrated behaviour, retained state where relevant, expected member outcome, and appropriate evidence.

## BLOCKER — cannot launch without it

| ID | Requirement | Current evidence | Closure test |
|---|---|---|---|
| B01 | Production authentication + transactional email recovery | Register/login and real Welcome/reset email receipt proven. Reset/change implementation exists. AMBER only on secure real-token completion. | real inbox link -> reset -> login with new password -> authenticated change-password -> logout -> login again |
| B02 | Authenticated member isolation + durable longitudinal state | **PASS** — PR #47 real-session A/B isolation, separate Brain/Progress/preferences/plans and leave/return state | CLOSED |
| B03 | Core member V1 journeys are complete and safe | **Behavioural 9/9 PASS** after merged PR #54 and hard production commissioning run on `e46aa035`; full B03 remains AMBER only for rendered/premium/mobile/error-state evidence | every V1 product completes primary member journey with persistence, graceful errors, acceptable semantic quality and premium/mobile presentation |
| B04 | One Shift Brain behaviour works longitudinally | **PASS** — #42 current-intent precedence; #48 authenticated dislike/Nay -> leave/return -> changed Grub recommendation with Fit unaffected | CLOSED |
| B05 | Public/member trust boundary is accurate | Legal/trust architecture exists; full production trust audit incomplete | visitor can identify operator, AI limits, data handling, support route and current clinical/provider status without invented claims |
| B06 | HQ can operate production | Watchtower/attention/journey APIs exist; operator workflow evidence incomplete | authorised HQ user can see actionable platform/member failures, distinguish RED/AMBER, and inspect recovery without raw telemetry interpretation |
| B07 | Critical monitoring detects real production degradation | probes/history/SLO architecture green | controlled safe degradation is detected, retained, surfaced to HQ with next action, then recorded recovered |
| B08 | Dave release-candidate journey | public/auth/isolation/longitudinal Grub-Fit and all nine member-product behaviours now automated; full rendered/recovery/content-depth journey incomplete | fresh Dave completes discover -> trust -> register -> verify -> onboard -> Today -> Grub -> Fit -> hydration -> Progress -> Picture -> Ask Shift -> learning -> leave/return -> changed recommendation -> account recovery; clinical/treatment leg only if formally commissioned |

### B03 route-level closure board

| Product | Production behaviour | Exact remaining evidence before full product PASS |
|---|---|---|
| Shift Grub | **PASS** — #48 authenticated generation, stored dislike, durable Nay across logout/login, changed later recommendation, semantic quality floor | premium/mobile rendered journey + graceful member-facing failure state; catalogue-depth requirement tracked separately under M11 |
| Shift Fit | **PASS** — #48 authenticated generation, running dislike respected, Grub signal isolation, semantic quality floor | premium/mobile rendered journey + graceful member-facing failure state; catalogue/visual-depth requirement tracked separately under M12 |
| Shift Today | **PASS** — #49 authenticated Today consumes active hydration plan and remains correct after logout/login | premium/mobile rendered journey + graceful empty/error state |
| Hydration | **PASS** — #49 coffee/beer rules, plan, persistence and aggregate correctness across logout/login | premium/mobile logging journey + graceful validation/error state |
| Conundrum | **PASS** — #49 authenticated obvious chicken+cheese+wrap relationship proven | premium/mobile journey + broader member-facing error/empty state |
| My Plans | **PASS** — #49 active hydration plan appears and survives logout/login | premium/mobile rendered journey + plan interaction/error state |
| Progress | **PASS behaviour** — #52/#54 production suite proves authenticated create/history/return and Since You Started state | premium/mobile rendered journey + whole-person/unit experience tracked under M13 |
| Progress Picture | **PASS behaviour** — #52/#54 production suite proves consent rejection, save, Same/history, authenticated persistence, delete and deletion persistence; private member ownership enforced | premium/mobile rendered journey + consent/privacy presentation |
| Shift AI | **PASS behaviour** — #54 unchanged hostile production suite proves canonical Brain, retained exact Progress context after logout/login, provenance contract and deterministic prescription boundary | premium/mobile rendered journey + appropriate graceful error/refusal presentation |

Behaviour PASS above is closed and must not be reopened without regression evidence. Full B03 product PASS requires only the explicitly listed rendered/member-facing evidence; catalogue breadth and other original-audit depth requirements remain independently visible below.

## MUST FINISH — agreed V1 requirement

| ID | Requirement | Closure / current state |
|---|---|---|
| M01 | One Shift visual system across public + My Shift | representative desktop/mobile screens meet homepage-level component language; no prototype/browser-default member UI |
| M02 | Knowledge reviewed publication lifecycle | **PASS** — reviewed publish -> canonical retrieval -> Shift grounding/provenance; withdrawn content stops grounding |
| M03 | Radar production freshness | live scan/publication/ticker timestamps and stale state are visible/monitored; do not claim LIVE without evidence |
| M04 | Product analytics funnel | registration/onboarding/Today/core feature/Progress/return/error events observable with privacy filtering |
| M05 | Security/privacy release review | session/authz/rate limits/secrets/uploads/member export-delete/audit/analytics boundaries evidenced for launch paths |
| M06 | Accessibility + performance release check | critical journeys keyboard/focus/forms/errors/navigation/reduced-motion structure pass; production performance budgets measured and material slow paths fixed |
| M07 | Structured content production path | recipes/exercises/Knowledge use scalable structured path where required for V1; load benchmark demonstrates no obvious V1 scaling trap |
| M08 | Release evidence + recovery checkpoint | remediation/evidence ledger reconciled to current main with exact release status, known external blockers and rollback/recovery state |
| M09 | Proper email verification lifecycle | launch verification policy/state is explicit, tested and not misleading; maps original G1-003/G1-004 |
| M10 | Whole-estate routes/links/errors release sweep | zero critical broken routes/forms/dead ends; useful loading/empty/error states; maps G1-006/G1-007/G1-008/G1-009 |
| M11 | Grub catalogue depth, validated nutrition and variety | live baseline 16; **32 additional structured drafts authored** in batches 01–04; 0 fully commissioned. Initial floor 64; nutrition validation, review/publication, runtime migration and 7/14/30/60-day variety simulation remain; maps G2-002/G2-003/G2-004/G5-009 |
| M12 | Fit catalogue/session breadth and visual guidance | live baseline 12; **32 additional structured drafts authored** in batches 01–04; 0 fully commissioned. Initial floor 48 with visual guidance for every prescribed movement; review/publication, runtime migration and 12-week simulator remain; maps G2-006/G2-007/G5-009 |
| M13 | Whole-person Progress + proper unit experience | coherent whole-person progress story and shared controlled units; maps G2-011/G2-012 |
| M14 | Member memory inspect/edit/delete controls | appropriate learned preferences/memory have provenance/confidence and member controls; maps G4-002 |
| M15 | Health MOT mocked partner-ready integration | **PASS** — PR #59 hard staging journey proves mocked provider payload -> durable sourced Progress -> canonical One Shift Brain -> authenticated Today, plus provider-retry idempotence, cross-member isolation and no-diagnosis/no-treatment-change boundaries. Live provider integration remains P06/external. |
| M16 | Outcomes launch architecture proof | governed outcome/cohort model is usable from member one without unsupported causal claims; maps G5-006 |
| M17 | Explicit sceptical-customer / Numan competitive acceptance | fresh release candidate can answer why choose Shift through evidence, trust, usefulness and premium execution; maps G5-014 |

M09–M17 are explicit anti-abstraction tracking rows restored from the original 57-row audit. They do not add nine new original requirements; they prevent those original requirements being hidden inside broad B/M labels.

## POST-LAUNCH — does not delay non-clinical V1

| ID | Item |
|---|---|
| P01 | Advanced outcome/correlation reporting beyond launch analytics and the M16 launch architecture proof |
| P02 | Broader Watchtower probes/SLOs beyond critical V1 journeys |
| P03 | Content expansion beyond the quality/variety floor proven necessary by M11/M12 simulators |
| P04 | Non-critical HQ workflow/marketing/CRM sophistication |
| P05 | Advanced animation/polish that does not affect usability, trust or consistency |
| P06 | Health MOT live partner integration until a provider is formally selected/commissioned; mocked partner-ready path remains M15 |
| P07 | Paid clinical prescribing/dispensing/identity-evidence workflow until provider, pharmacy and governance responsibilities are formally commissioned; Shift may launch only without selling/implying unavailable clinical service |

## Original-audit reconciliation
The original remediation matrix contains exactly **57** substantive rows across Gates 1–5. Current reconciled classification is **10 PASS / 44 AMBER / 3 BLOCKED** after M15/G5-004 mocked Health MOT acceptance was demonstrated by PR #59. The nine previously obscured requirements remain explicit as M09–M17. The automated finish-line gate must fail if the remediation matrix ceases to contain 57 unique G1–G5 IDs or if M09–M17 disappear from this launch board.

## Content-depth launch baselines
**Grub:** 16 live hard-coded recipes + 32 structured drafts / 0 fully launch-ready / initial experience floor 64. The authored prospective pool is now 48, but that is **not** a commissioned count: nutrition validation, second-person review/publication and runtime migration remain blockers. The floor is provisional and must rise if 30/60-day simulation still feels repetitive.

**Fit:** 12 live hard-coded exercises + 32 structured drafts / 0 fully launch-ready / initial experience floor 48. The authored prospective pool is now 44, but visual approval, review/publication and runtime migration remain blockers. The floor is provisional and must rise if three sessions/week for 12 weeks still produces poor repetition, weak equipment/location coverage or inadequate progression/substitution.

## Critical path
B01 real-token recovery completion -> B03 rendered/premium/mobile evidence -> B06/B07 controlled operations proof -> B08 fresh Dave -> M01/M05/M06 release sweep -> final evidence reconciliation.

Parallel lanes are mandatory where independent: B05 trust; M03 Radar; M04 analytics; M05 security/privacy; M06 accessibility/performance; M07 structured content; M09/M10 release lifecycle; M11 Grub content factory; M12 Fit content + visual factory; M13/M14/M16/M17; B08 Dave expansion.

## External blockers
Clinical provider/pharmacy/clinical governance and provider-specific identity/evidence integration cannot be truthfully commissioned without formal external arrangements. They remain the three BLOCKED original-audit rows for a non-clinical V1 and become launch blockers only if V1 is defined as selling/providing clinical treatment.

B01 has one execution dependency: the real reset token arrives only in the connected inbox and must be submitted to the production reset POST without exposing that single-use secret in repository source/logs. If the active execution environment cannot securely perform that token-bearing POST, the remaining B01 proof is a minimal human/secure-runtime dependency, not an engineering gap.

## Burn-down — reconciled through merged PR #59 (`0f561768`) and its green post-merge production commissioning, 2026-08-12
Launch blockers: **8 -> 6** (B02, B04 CLOSED)
B03 production behavioural subrows closed: **9/9**
B03 full product rows closed: **0/9** until rendered/mobile member evidence is attached; content-depth requirements remain independent M11/M12
Original audit: **57 total / 10 PASS / 44 AMBER / 3 BLOCKED**
Abstraction orphans: **0 unmapped**
Grub: **16 live + 32 structured drafts / 0 fully commissioned / floor 64**
Fit: **12 live + 32 structured drafts / 0 fully commissioned / floor 48**
Dave journey genuinely GREEN: **~60% last quantified automatable coverage**, explicitly extended to rendered/content-depth acceptance
M15: **PASS** mocked partner-ready journey; live provider remains external/post-launch
Regressions unresolved: **0 known**

## Exact next actions
1. Keep B03 behavioural 9/9 locked; do not reopen without regression evidence.
2. Close B03 rendered/premium/mobile/error states using automation first; reduce final physical-device work to irreducible human judgement only.
3. Continue M11 Grub validation/review/publication/runtime migration and 7/14/30/60-day simulator; do not confuse authored drafts with commissioned content.
4. Continue M12 Fit validation/visual/review/publication/runtime migration and 12-week simulator.
5. Close B06/B07 with controlled production-safe degradation -> AMBER/RED -> HQ action -> recovery proof.
6. Close B01 via secure real-token execution when a secret-safe executor/human action is available; keep all other lanes moving.
7. Continue B05/M03–M10/M13/M14/M16/M17 and Dave in parallel only against explicit closure criteria.
8. Reconcile remediation matrix, evidence ledger and recovery checkpoint after every evidenced closure.
