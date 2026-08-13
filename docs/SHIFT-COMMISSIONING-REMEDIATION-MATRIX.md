# Shift Some Timber — Commissioning Remediation Matrix

Authoritative original-audit inventory. No row may disappear through B/M abstraction. Status is evidence-led: `PASS`, `AMBER`, `BLOCKED`. PASS requires demonstrated acceptance evidence, not code existence.

**Current reconciled scoreboard: 57 total / 22 PASS / 32 AMBER / 3 BLOCKED / 0 unmapped.**

## Gate 1 — Nothing Broken
| ID | Original audit requirement | Status | Current evidence / exact remaining closure |
|---|---|---|---|
| G1-001 | Duplicate/incomplete password recovery paths | AMBER | Recovery module is authoritative and reset/change implementation is proven; B01 still needs secret-safe real-token reset -> login -> change-password -> logout/login. PR #112's rendered production sweep additionally found no password-reset affordance discoverable from the member-login surface. |
| G1-002 | Email binding not deployment-persistent | AMBER | Welcome/reset inbox receipt is proven; final launch email/recovery lifecycle remains coupled to B01/M09. |
| G1-003 | Registration email lifecycle incomplete | AMBER | Explicit verification lifecycle is regression-protected; real production inbox click -> verified login -> Welcome evidence remains M09. PR #112 found the login registration affordance resolves to `programme#register` without visible registration controls. |
| G1-004 | Email verification is effectively bypassed | AMBER | `AUTO_VERIFY_EMAIL=false`, unverified login is blocked, resend invalidates prior token and replay is rejected; real production inbox verification remains before PASS. |
| G1-005 | Member persistence confidence damaged | **PASS** | Production A/B authenticated state, Progress, Brain and leave/return persistence proven without contamination. |
| G1-006 | Broken/dead routes and links not centrally detected | **PASS** | Exhaustive production crawler checked 418 same-origin URLs / 370 HTML pages, found zero critical route/asset/blank-page failures and exhausted discovery without truncation. Earlier malformed-link defect was fixed and the unchanged sweep reran green. |
| G1-007 | Error handling exposes generic failures | AMBER | Deployed safe-error contracts prove correlated/no-store/non-leaking JSON across representative API failures; PR #112 also proves intelligible invalid-login guidance across Chromium/Firefox/WebKit desktop+390px, but broader rendered/member-facing failure-state acceptance remains M10/M01/B08. |
| G1-008 | Loading/empty/success states inconsistent | AMBER | Behavioural endpoints are green; rendered state-system acceptance remains M01/M10/B08. |
| G1-009 | Mobile/cross-browser regressions found manually | AMBER | PR #112 completed 18 rendered public/login cases across Chromium, Firefox and WebKit at desktop and 390px; genuine authenticated member mobile/cross-browser release evidence remains M01/M06/M10/B08. |
| G1-010 | Auth rate limits/security controls need formal commissioning | **PASS** | Deployed production security/privacy commissioning proved restricted OIDC commissioning identity, anonymous member/HQ/privacy boundaries, hostile-origin CORS denial, member-scoped export isolation, deletion-session revocation, hardened response envelopes and source-level auth/rate/session/recovery/analytics controls. |
| G1-011 | Production entry-point wiring can diverge from modules | **PASS** | Master/source gates fail if authoritative auth/product/Brain wiring disappears; current gates green. |
| G1-012 | Synthetic member commissioning is incomplete as release gate | AMBER | Authenticated production isolation/retention and longitudinal product behaviour are green; fresh unassisted B08 remains. |

## Gate 2 — Nothing Half-Finished
| ID | Original audit requirement | Status | Current evidence / exact remaining closure |
|---|---|---|---|
| G2-001 | Shift Today is an engine, not a premium daily command centre | AMBER | Behaviour/persistence green; premium rendered daily-command-centre acceptance remains. |
| G2-002 | Grub recipes are not real recipes | AMBER | Structured authored universe is **2,908** including 2,876 industrial objects across real-life meal/fakeaway/treat families. Merged PR #115 proves **1,503 / 2,876 industrial recipes** now carry governed ingredient-level CoFID nutrition and are LOW-risk in the full-catalogue calculation, but all remain draft pending genuine second-person content review; only 1 independently reviewed/published recipe is production-served. Review/publication/serving breadth remains M11. |
| G2-003 | Grub nutrition figures are not tied to exact ingredients | AMBER | PR #115 proves **1,503 industrial recipes** carry ingredient-level CoFID 2021 validation from the current full-catalogue path via **104 canonical decisions / 96 exercised decisions**, including **62 governed shared proxy approvals** with retained basis/limitations. Latest calculation is 1,503 LOW / 0 MEDIUM / 0 HIGH; the remaining **1,373** stay quarantined rather than receiving fabricated precision. |
| G2-004 | Grub variety/repetition is poor | AMBER | Authored-capacity simulation produces zero exact repeats across 30/60/90/365-day horizons, including 1,460 unique choices over 365 days; commissioned/published catalogue diversity under real member constraints remains M11. |
| G2-005 | Grub Yay/Nay is shallow and not durable learning | **PASS** | Authenticated Nay -> leave/return -> later recommendation change is production-proven; unrelated Fit remains unaffected. |
| G2-006 | Fit composes durations incorrectly | **PASS** | Unchanged post-merge production commissioning after PR #109 proved the authenticated 10/15/20/30/45/60-minute session-quality matrix end-to-end through the duration-aware V8 composition path. The production gate completed GREEN; duration padding/overrun regressions remain protected. |
| G2-007 | Exercise library/instructions are too thin | AMBER | Structured authored universe is **2,500**. Stable canonical visual metadata/specifications bind 2,244/2,468 industrial objects with automatic technical/protocol checks, but the referenced consolidated `assets/fit/shift-fit-industrial-v3.svg` rendered 44-family asset does not exist on current main. Only 3 movements have genuine member/domain-QA/review/publication/production-serving evidence. Real visual creation/domain QA and publication conversion remain M12. |
| G2-008 | Fit Yay/Nay is not durable learning | **PASS** | Authenticated exercise dislike/Nay persists and influences later Fit while Grub signals stay isolated. |
| G2-009 | Conundrum lacks kitchen intelligence | AMBER | Obvious chicken+cheese+wrap relationship is production-proven; broader catalogue-backed ingredient intelligence remains tied to M11. |
| G2-010 | Hydration is too water-centric | **PASS** | Production suite proves non-water drink contribution rules including coffee contributing and beer not contributing, with durable plan/log state. |
| G2-011 | Progress is a data log, not a whole-person story | AMBER | Progress behaviour/retention green; coherent whole-person story remains M13. |
| G2-012 | Progress units are inconsistent | AMBER | Controlled stone/lb/kg + metric member UX remains M13. |
| G2-013 | Progress Picture persistence/reliability incomplete | AMBER | Save/history/private ownership/delete/return behaviour green; full rendered/mobile member acceptance remains. |
| G2-014 | Progress Picture UI feels developer-grade | AMBER | Premium/mobile presentation remains M01/B08. |
| G2-015 | My Plans surface is not a proper plan manager | AMBER | Active-plan persistence is production-proven; complete premium plan-management surface remains. |

## Gate 3 — One Shift
| ID | Original audit requirement | Status | Current evidence / exact remaining closure |
|---|---|---|---|
| G3-001 | Homepage quality is not systemic | AMBER | Homepage remains design constitution; representative public/member parity evidence remains M01. |
| G3-002 | Header/navigation variants drift | AMBER | Canonical whole-estate responsive nav acceptance remains M01/M10. |
| G3-003 | Footer variants drift/are visually heavy | AMBER | Whole-estate footer parity acceptance remains M01/M10. |
| G3-004 | Forms/selectors expose browser-default/prototype UI | AMBER | Premium shared-control release sweep remains M01/M10/M13. |
| G3-005 | Cards/spacing/type hierarchy inconsistent | AMBER | Visual-system regression review remains M01. |
| G3-006 | Knowledge Hub editorial experience is inconsistent | AMBER | Knowledge lifecycle is green; premium editorial presentation/reviewer metadata remains. |
| G3-007 | Member navigation reflects architecture rather than intent | AMBER | Behavioural routes exist; Dave/premium IA acceptance remains B08/M01. |
| G3-008 | Accessibility is not a design-system gate | AMBER | Critical keyboard/focus/forms/contrast/reduced-motion audit remains M06. |

## Gate 4 — Shift Becomes Intelligent
| ID | Original audit requirement | Status | Current evidence / exact remaining closure |
|---|---|---|---|
| G4-001 | No single formal Shift Brain member model | **PASS** | One Shift Brain is canonical across Shift AI, Today, Grub/Fit and proactive consumers; integration gate green. |
| G4-002 | Memory provenance/confidence/edit/delete controls incomplete | **PASS** | Inspect/correct/delete learned memory, source/confidence visibility, correction provenance, privacy controls and cross-member isolation are commissioned. |
| G4-003 | AI recommendation outcomes are not consistently learned | **PASS** | Durable Yay/Nay and current intent measurably alter later recommendations across leave/return without cross-domain contamination. |
| G4-004 | Site/CMS content ingestion into Knowledge Graph not proven automatic | **PASS** | Scheduled CMS/approved-document sync now proves reviewed source -> canonical Knowledge graph node + provenance, draft exclusion, withdrawal reconciliation, and stable canonical reactivation after re-review without manual HQ ingest. |
| G4-005 | Grounding provenance is not consistently visible/inspectable | **PASS** | Shift AI production contract returns provenance-aware sources and reviewed state; hard production proof green. |
| G4-006 | Radar is built but end-to-end live status is unproven | **PASS** | Production commissioning invoked the genuine regulator scanner through restricted GitHub OIDC; live MHRA drug-safety, MHRA alerts and EMA sources all returned successfully and the scan completed. |
| G4-007 | GLP ticker freshness can silently degrade | **PASS** | Production Radar freshness returned GREEN inside declared SLOs immediately after the genuine scan; adversarial gates prove stale -> AMBER, publication failure -> RED and recovery -> GREEN rather than silent degradation. |
| G4-008 | Proactive insights are not yet a coherent daily orchestration system | AMBER | Canonical Brain/proactive plumbing exists; premium Today orchestration acceptance remains. |

## Gate 5 — Trust & Scale
| ID | Original audit requirement | Status | Current evidence / exact remaining closure |
|---|---|---|---|
| G5-001 | Clinical operating boundaries not fully commissioned | BLOCKED | Requires signed provider/pharmacy/prescriber operating model. Non-clinical V1 must not imply unavailable clinical service. |
| G5-002 | Medication Companion incomplete | BLOCKED | Requires clinically governed prescribing/escalation owner/pathway. |
| G5-003 | Identity/weight evidence verification not commissioned | BLOCKED | Requires provider-approved verification journey/requirements. |
| G5-004 | Health MOT/bloods integration needs partner-ready data model | **PASS** | Mocked partner payload -> idempotent MOT -> sourced Progress -> One Shift Brain -> authenticated Today is proven, with member isolation and clinical boundaries. |
| G5-005 | Public trust architecture is incomplete | AMBER | Production operator/AI/privacy/support/current-provider trust audit remains B05. |
| G5-006 | Outcome measurement not embedded from member one | **PASS** | Member-one Progress + engagement cohort analysis is proven with separated members and explicit internal-only/non-causal guardrails. |
| G5-007 | Watchtower observability is incomplete | **PASS** | Dedicated fire-drill gate proves GREEN baseline -> latency AMBER -> outage RED, operator next actions, retained probe history after endpoint restoration, and recovery back to GREEN without deliberately breaking production dependencies. |
| G5-008 | HQ is admin UI rather than operating nerve centre | **PASS** | PR #93's unchanged authorised HQ fire drill proves anonymous denial -> owner bootstrap/login -> retained HQ session -> GREEN -> actionable AMBER -> actionable RED -> retained incident history -> recovered GREEN through the real HQ attention/Watchtower routes, with audit actions retained and no production dependency deliberately broken. |
| G5-009 | Recipes/exercises are hard-coded scaling traps | **PASS** | Authenticated production commissioning proves V7 consumes reviewed/published structured Grub and Fit objects, preserves validated nutrition/approved visuals and durable Nay behaviour, and uses V4 only as controlled quality-preserving migration fallback. |
| G5-010 | Analytics lacks coherent product-event taxonomy | **PASS** | Canonical product-event taxonomy/instrumentation, privacy filtering and Watchtower analytics gates are regression-protected. |
| G5-011 | Security/privacy audit not yet complete | **PASS** | Unchanged deployed production security/privacy proof passed: restricted commissioning identity, anonymous/HQ/privacy boundaries, hostile-origin CORS, per-member export isolation, deletion-session revocation, safe response envelopes, and source gates covering secrets/analytics/recovery/auth controls. |
| G5-012 | Performance not a release criterion | AMBER | SLO budgets exist; production critical-path performance/accessibility evidence remains M06. |
| G5-013 | Dave end-to-end commissioning not yet run | AMBER | Reconciled evidence proves 15/20 non-duplicated journey legs (75%); real-inbox registration/verification/recovery, rendered/mobile authenticated release acceptance and partner-dependent treatment support remain. |
| G5-014 | Numan/customer trust competitive test not embedded | AMBER | Explicit sceptical-customer/Numan acceptance remains M17 after release candidate stabilises. |

## 32-AMBER burn-down classification
`QUICK KILL` = mostly implemented/evidence gap. `FINITE` = defined work with a clear endpoint. `LARGE` = substantial remaining product work. `HUMAN/DEVICE` = irreducible inbox/device/rendered proof. No additional row is currently reclassified as externally BLOCKED.

| ID | Class | Immediate closure lane |
|---|---|---|
| G1-001 | HUMAN/DEVICE | B01 real reset-token/inbox lifecycle + fix login reset discoverability |
| G1-002 | HUMAN/DEVICE | B01/M09 production transactional inbox proof |
| G1-003 | HUMAN/DEVICE | M09 real verification inbox click/login + fix registration discoverability |
| G1-004 | HUMAN/DEVICE | M09 real verification inbox click/login |
| G1-007 | FINITE | M10 rendered/member-facing failure-state acceptance |
| G1-008 | HUMAN/DEVICE | M01/M10 rendered loading/empty/success review |
| G1-009 | HUMAN/DEVICE | M01/M06 authenticated cross-browser/mobile matrix |
| G1-012 | HUMAN/DEVICE | B08 fresh unassisted Dave run |
| G2-001 | LARGE | M01/B08 premium Today experience |
| G2-002 | LARGE | M11 independent review/publication/serving conversion at scale from 1,503 LOW-risk drafts |
| G2-003 | LARGE | M11 remaining 1,373 ingredient/family nutrition quarantine |
| G2-004 | LARGE | M11 commissioned 30/60/90/365-day catalogue diversity under real constraints |
| G2-007 | LARGE | M12 create real 44-family visuals -> domain QA -> review/publication/serving at scale |
| G2-009 | FINITE | M11 catalogue-backed Conundrum intelligence |
| G2-011 | LARGE | M13 whole-person Progress story |
| G2-012 | FINITE | M13 unit system |
| G2-013 | HUMAN/DEVICE | M01/B08 rendered/mobile Progress Picture acceptance |
| G2-014 | LARGE | M01 Progress Picture premium UI |
| G2-015 | LARGE | M01/B08 proper plan manager |
| G3-001 | LARGE | M01 systemic premium parity |
| G3-002 | HUMAN/DEVICE | M01/M10 responsive navigation acceptance |
| G3-003 | HUMAN/DEVICE | M01/M10 footer parity acceptance |
| G3-004 | LARGE | M01 shared premium control system |
| G3-005 | LARGE | M01 visual-system regression closure |
| G3-006 | FINITE | M01 Knowledge editorial/reviewer presentation |
| G3-007 | HUMAN/DEVICE | B08/M01 member IA acceptance |
| G3-008 | FINITE | M06 accessibility gate |
| G4-008 | LARGE | premium proactive Today orchestration |
| G5-005 | FINITE | B05 public trust audit |
| G5-012 | FINITE | M06 critical-path performance evidence |
| G5-013 | HUMAN/DEVICE | B08 fresh unassisted rendered Dave journey |
| G5-014 | FINITE | M17 sceptical-customer/Numan acceptance |

## Reconciliation check
PASS rows: 22. AMBER rows: 32. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.

## Commissioning rule
A row moves to PASS only with demonstrated acceptance evidence. External clinical/provider rows remain BLOCKED rather than being hidden or falsely promoted. Discovered in-scope launch gaps become execution lanes automatically.