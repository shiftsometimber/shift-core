# Shift V1 Launch Finish Line

This is the authoritative launch closure board. `docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md` preserves all 57 original requirements; `docs/COMMISSIONING-EVIDENCE.md` records demonstrated evidence. PASS requires proof, not code existence.

## BLOCKER — cannot launch without it
| ID | Requirement | State / exact closure |
|---|---|---|
| B01 | Production authentication + transactional email recovery | AMBER — real inbox reset token -> reset -> login new password -> authenticated change-password -> logout -> login again |
| B02 | Authenticated isolation + durable longitudinal state | **PASS** — production A/B isolation and leave/return retained state |
| B03 | Core member V1 journeys | Behaviour **9/9 PASS and locked**; full row remains AMBER only for rendered/premium/mobile/error-state evidence |
| B04 | One Shift Brain longitudinal behaviour | **PASS** — current intent precedence, durable Grub/Fit learning, cross-domain isolation, retained Progress/AI context |
| B05 | Public/member trust boundary | AMBER — operator/AI/data/support/current clinical-provider status trust audit |
| B06 | HQ production operation | AMBER — authorised operator must see actionable AMBER/RED, next action and recovery |
| B07 | Critical monitoring degradation/recovery | AMBER — safe healthy -> degraded -> detected/history/HQ action -> recovered proof |
| B08 | Dave release-candidate journey | AMBER — fresh unassisted end-to-end Dave incl recovery, rendered/mobile and content-depth acceptance |

B03 production behavioural subrows closed: **9/9**. Grub, Fit, Today, Hydration, Conundrum, My Plans, Progress, Progress Picture and Shift AI are behaviour-green. Do not reopen without genuine regression evidence. Catalogue depth remains M11/M12; rendered quality remains B03/M01/M06/M10/B08.

## MUST FINISH — agreed V1 requirement
| ID | Requirement | State / exact closure |
|---|---|---|
| M01 | One Shift premium visual system across public + My Shift | AMBER — representative desktop/mobile member surfaces must meet homepage design constitution |
| M02 | Reviewed Knowledge publication lifecycle | **PASS** — publish -> canonical retrieval -> grounding/provenance -> withdrawal -> no grounding |
| M03 | Radar production freshness | AMBER — production scan/publication/ticker timestamps + stale-state proof |
| M04 | Product analytics funnel | AMBER — real-flow QA acquisition/register/onboard/Today/core products/Progress/return/errors |
| M05 | Security/privacy release review | AMBER — authz/rate/session/secrets/uploads/export-delete/audit/analytics boundaries |
| M06 | Accessibility + performance release check | AMBER — critical interaction audit + measured production budgets |
| M07 | Structured content production path | AMBER — Grub/Fit must read canonical structured content; hard-coded V4 catalogue retired from authority |
| M08 | Release evidence + recovery checkpoint | AMBER — continuously reconcile matrix/ledger/recovery through release candidate |
| M09 | Proper email verification lifecycle | AMBER — explicit verification policy/state/delivery/token lifecycle |
| M10 | Whole-estate routes/links/errors release sweep | AMBER — zero critical broken routes/forms/dead ends + useful empty/loading/error states |
| M11 | Grub catalogue depth, validated nutrition and variety | AMBER — 32 structured authored / 0 nutrition-validated / 0 reviewed / 0 published / 0 structured production-served / 0 launch-ready; simulator controls final floor |
| M12 | Fit catalogue/session breadth and visual guidance | AMBER — 32 structured authored / 0 approved member visuals / 0 reviewed / 0 published / 0 structured production-served / 0 launch-ready; 12-week simulator controls final floor |
| M13 | Whole-person Progress + proper units | AMBER — coherent story + controlled stone/lb/kg and metric experience |
| M14 | Member memory inspect/edit/delete controls | **PASS** — PR #61 Master Integration proves inspect/correct/delete, provenance/confidence, durable deletion, privacy controls and cross-member isolation |
| M15 | Health MOT mocked partner-ready integration | **PASS** — PR #59/#61 proves mocked payload -> idempotent MOT -> sourced Progress -> One Shift Brain -> authenticated Today, member-isolated and non-diagnostic; live provider remains external/post-launch |
| M16 | Outcomes launch architecture proof | **PASS** — PR #61 proves member-one Progress + engagement cohort analysis with separated members and explicit internal-only/non-causal/no-clinical-claim guardrails |
| M17 | Sceptical-customer / Numan competitive acceptance | AMBER — fresh release candidate must answer why choose Shift through evidence, trust, usefulness and premium execution |

M09–M17 are anti-abstraction mappings to original requirements, not new scope. They may not disappear from this board.

## Original-audit reconciliation
Exactly **57** original rows remain mandatory. Current evidenced classification: **12 PASS / 42 AMBER / 3 BLOCKED / 0 abstraction orphans** after G4-002/M14, G5-004/M15 and G5-006/M16 closure.

## Content conversion funnel
**Grub:** legacy production source 16. Structured authored 32; deterministic/schema quality gated, but **nutrition-validated 0 / reviewed 0 / published 0 / structured production-served 0 / launch-ready 0**. Initial launch-ready floor remains 64 and rises automatically if 30/60-day simulation fails. Do not add future volume to Worker arrays.

Current authored-capacity simulation: with legacy + structured drafts, pools are breakfast 12 / lunch 12 / dinner 14 / snack 10. Exact repeat pressure is pushed from day 5 live to day 13/13/15/11 respectively, but 30-day capacity still produces 72 exact repeats across 120 slots and 60-day capacity 192 repeats across 240. Drafts are not production content; this only proves more depth is still required.

**Fit:** legacy production source 12. Structured authored 32; deterministic/schema quality gated, but **approved member visuals 0 / reviewed 0 / published 0 / structured production-served 0 / launch-ready 0**. Initial launch-ready floor remains 48 and rises automatically if 12-week 3x/week simulation fails.

Current authored-capacity simulation: prospective pool 44, 13 movement groups, worst exercise appears 5 times across 180 exercise slots (down from 15 live). This is capacity evidence only; progression/limitation/session-similarity and member visual acceptance remain mandatory before M12 can PASS.

The conversion metric is authored -> domain validated -> reviewed -> published -> production-served -> launch-ready. Raw candidate count is not a closure.

## External blocked requirements
| ID | Requirement | State |
|---|---|---|
| X01 | Signed clinical operating model/provider/pharmacy governance | BLOCKED |
| X02 | Medication Companion clinically governed prescribing/escalation | BLOCKED |
| X03 | Provider-approved identity/weight/evidence verification | BLOCKED |

Non-clinical V1 must not imply/sell unavailable clinical capability.

## Current swarm
B01; B03 rendered only; B05; B06/B07; B08; M01; M03–M13; M17. M11/M12 conversion must not queue the other rows.

## Recovery/commissioning rule
PR #55 is behind us: its unchanged rerun was 29/29 GREEN and the earlier generic registration 500 did not reproduce. Do not reopen #55 or B03 behavioural 9/9 without genuine regression evidence.

**CONVERT -> BREAK -> FIX -> PROVE -> CLOSE -> CONTINUE.**
