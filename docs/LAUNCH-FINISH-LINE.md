# Shift V1 Launch Finish Line

This is the authoritative launch closure board. `docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md` preserves all 57 original requirements; `docs/COMMISSIONING-EVIDENCE.md` records demonstrated evidence. PASS requires proof, not code existence.

## BLOCKER — cannot launch without it
| ID | Requirement | State / exact closure |
|---|---|---|
| B01 | Production authentication + transactional email recovery | AMBER — real inbox reset token -> reset -> login new password -> authenticated change-password -> logout -> login again; rendered login currently exposes no discoverable reset affordance |
| B02 | Authenticated isolation + durable longitudinal state | **PASS** — production A/B isolation and leave/return retained state |
| B03 | Core member V1 journeys | Behaviour **9/9 PASS and locked**; full row remains AMBER only for rendered/premium/mobile/error-state evidence |
| B04 | One Shift Brain longitudinal behaviour | **PASS** — current intent precedence, durable Grub/Fit learning, cross-domain isolation, retained Progress/AI context |
| B05 | Public/member trust boundary | AMBER — operator/AI/data/support/current clinical-provider status trust audit |
| B06 | HQ production operation | **PASS** — authorised HQ owner fire drill proves anonymous denial, retained owner session, GREEN -> actionable AMBER -> actionable RED -> retained incident evidence -> recovery -> GREEN through actual HQ attention/Watchtower routes |
| B07 | Critical monitoring degradation/recovery | **PASS** — dedicated fire drill proves GREEN -> latency AMBER -> outage RED -> operator next actions + retained history -> recovery -> GREEN without deliberately breaking production dependencies |
| B08 | Dave release-candidate journey | AMBER — reconciled evidence proves 15/20 non-duplicated journey legs (75%); rendered browser evidence additionally found registration resolves to `programme#register` without visible account controls and no reset affordance is discoverable from member login; real inbox registration/verification/recovery, rendered/mobile authenticated acceptance and partner-dependent treatment support remain |

B03 production behavioural subrows closed: **9/9**. Grub, Fit, Today, Hydration, Conundrum, My Plans, Progress, Progress Picture and Shift AI are behaviour-green. Do not reopen without genuine regression evidence. Catalogue depth remains M11/M12; rendered quality remains B03/M01/M06/M10/B08.

## MUST FINISH — agreed V1 requirement
| ID | Requirement | State / exact closure |
|---|---|---|
| M01 | One Shift premium visual system across public + My Shift | AMBER — representative desktop/mobile member surfaces must meet homepage design constitution; current multi-engine rendered evidence is useful but does not replace authenticated premium/device acceptance |
| M02 | Reviewed Knowledge publication lifecycle | **PASS** — publish -> canonical retrieval -> grounding/provenance -> withdrawal -> no grounding |
| M03 | Radar production freshness | **PASS** — genuine production MHRA/EMA scan completed through restricted OIDC and production freshness returned GREEN inside declared SLOs; adversarial stale/failure/recovery transitions are locked |
| M04 | Product analytics funnel | AMBER — real-flow QA acquisition/register/onboard/Today/core products/Progress/return/errors |
| M05 | Security/privacy release review | **PASS** — deployed production proof covers restricted commissioning identity, anonymous/HQ/privacy boundaries, hostile-origin CORS denial, per-member export isolation, deletion-session revocation and hardened response envelopes; source gate covers auth/rate/session/recovery/secrets/analytics controls |
| M06 | Accessibility + performance release check | AMBER — critical interaction audit + measured production budgets |
| M07 | Structured content production path | **PASS** — authenticated production member consumed reviewed/published structured Grub and Fit through V7, with validated nutrition, approved visual guidance, provenance and durable Nay behaviour; V4 is controlled quality-preserving migration fallback, not future authority |
| M08 | Release evidence + recovery checkpoint | AMBER — continuously reconcile matrix/ledger/recovery through release candidate |
| M09 | Proper email verification lifecycle | AMBER — deterministic lifecycle green; real production inbox verification/login evidence remains; rendered login registration affordance currently reaches a surface without visible account controls |
| M10 | Whole-estate routes/links/errors release sweep | AMBER — route/link/asset detection is closed and deployed safe-error contracts are green; rendered browser sweep is green across Chromium/Firefox/WebKit desktop+390px but surfaced missing auth affordances and authenticated loading/empty/error/mobile acceptance remains |
| M11 | Grub catalogue depth, validated nutrition and variety | AMBER — **2,908 authored structured objects**. PR #123 proves the full 2,876 industrial pool is schema-valid and **2,876 / 2,876 ingredient-level CoFID nutrition-valid with zero nutrition quarantine**. Nutrition provenance is therefore closed separately as G2-003, while M11 remains AMBER because editorial quality/review/publication/production-serving breadth is not: only 1 recipe is independently reviewed/published/served and open PR #125 is quarantining semantic cross-product defects before bulk review. Short-term authored target 2,500 exceeded; long-term minimum 10,000+ |
| M12 | Fit catalogue/session breadth and visual guidance | AMBER — **2,500 authored structured objects**. Stable canonical visual metadata bindings cover **2,244/2,468 industrial objects**, but the referenced consolidated `assets/fit/shift-fit-industrial-v3.svg` 44-family rendered asset does not exist on current main; only 3 movements have genuine member/domain-QA/review/publication/production-serving evidence. Real visual creation/domain QA/review/publication conversion remains the bottleneck. Long-term minimum 10,000+ |
| M13 | Whole-person Progress + proper units | AMBER — coherent story + controlled stone/lb/kg and metric experience |
| M14 | Member memory inspect/edit/delete controls | **PASS** — inspect/correct/delete, provenance/confidence, durable deletion, privacy controls and cross-member isolation proven |
| M15 | Health MOT mocked partner-ready integration | **PASS** — mocked payload -> idempotent MOT -> sourced Progress -> One Shift Brain -> authenticated Today, member-isolated and non-diagnostic; live provider remains external/post-launch |
| M16 | Outcomes launch architecture proof | **PASS** — member-one Progress + engagement cohort analysis with separated members and explicit internal-only/non-causal/no-clinical-claim guardrails |
| M17 | Sceptical-customer / Numan competitive acceptance | AMBER — fresh release candidate must answer why choose Shift through evidence, trust, usefulness and premium execution |

M09–M17 are anti-abstraction mappings to original requirements, not new scope. They may not disappear from this board.

## Original-audit reconciliation
Exactly **57** original rows remain mandatory. Current evidenced classification remains **23 PASS / 31 AMBER / 3 BLOCKED / 0 abstraction orphans**. PR #115 materially advances M11 but does not itself close an original row because review/publication/production-serving breadth is still missing.

## Content conversion funnel
**Grub:** structured authored universe **2,908** = 2,876 industrial + 32 existing structured. Industrial schema-valid **2,876**. Current full-catalogue governed propagation has **104 canonical decisions / 96 exercised**, including **62 governed shared canonical proxy approvals**. Ingredient-level CoFID validation now reaches **2,876/2,876 industrial recipes**, all LOW-risk for nutrition with **zero nutrition quarantine**. These recipes remain drafts pending independent/second-person editorial review; nutrition validation must not be confused with recipe-quality approval. Existing reviewed/published/production-served remains **1/1/1**. Authored-capacity simulation shows zero exact repeats at 30/60/90/365 days, but this is explicitly not commissioned/published diversity.

**Fit:** structured authored universe **2,500** = 2,468 industrial + 32 existing structured. Industrial schema-valid **2,468**. Canonical visual metadata/specifications bind **2,244/2,468 industrial objects**; automatic technical checks cover the industrial set. The referenced consolidated 44-family rendered visual asset is currently absent, so metadata binding is not visual completion. Member/domain QA remains **3**, and reviewed/published/production-served remains **3/3/3**. Authored-capacity simulations show zero exact repeats over 12/26/52 weeks, while actual visual/review/publication breadth remains M12 work.

The conversion metric remains authored -> domain/nutrition/visual validated -> reviewed -> published -> production-served -> launch-ready. Raw candidate count, canonical mapping, metadata visual binding or automatic integrity never closes M11/M12 by itself.

## External blocked requirements
| ID | Requirement | State |
|---|---|---|
| X01 | Signed clinical operating model/provider/pharmacy governance | BLOCKED |
| X02 | Medication Companion clinically governed prescribing/escalation | BLOCKED |
| X03 | Provider-approved identity/weight/evidence verification | BLOCKED |

Non-clinical V1 must not imply/sell unavailable clinical capability.

## Current swarm
Gate 1 auth-affordance/rendered repair; B01; B03 rendered only; B05; B08; M01; M04; M06; M08–M13; M17. M11/M12 downstream conversion must not queue the other rows. The 31 remaining AMBERs are classified in the remediation matrix as FINITE / LARGE / HUMAN-DEVICE.

## Recovery/commissioning rule
Do not reopen behaviour-green foundations without genuine regression evidence. Failed industrial objects are quarantined; failed production gates are diagnosed and fixed without weakening the acceptance test. Homepage-level premium quality remains the estate-wide design constitution.

**INDUSTRIALISE -> VALIDATE -> SERVE -> SIMULATE -> BREAK -> FIX -> PROVE -> CLOSE -> CONTINUE.**
