# Shift Some Timber — Commissioning Remediation Matrix

Authoritative original-audit inventory. No row may disappear through B/M abstraction. Status is evidence-led: `PASS`, `AMBER`, `BLOCKED`. PASS requires demonstrated acceptance evidence, not code existence.

**Current reconciled scoreboard: 57 total / 16 PASS / 38 AMBER / 3 BLOCKED / 0 unmapped.**

## Gate 1 — Nothing Broken
| ID | Original audit requirement | Status | Current evidence / exact remaining closure |
|---|---|---|---|
| G1-001 | Duplicate/incomplete password recovery paths | AMBER | Recovery module is authoritative and reset/change implementation is proven; B01 still needs secret-safe real-token reset -> login -> change-password -> logout/login. |
| G1-002 | Email binding not deployment-persistent | AMBER | Welcome/reset inbox receipt is proven; final launch email/recovery lifecycle remains coupled to B01/M09. |
| G1-003 | Registration email lifecycle incomplete | AMBER | Explicit verification lifecycle is regression-protected; real production inbox click -> verified login -> Welcome evidence remains M09. |
| G1-004 | Email verification is effectively bypassed | AMBER | `AUTO_VERIFY_EMAIL=false`, unverified login is blocked, resend invalidates prior token and replay is rejected; real production inbox verification remains before PASS. |
| G1-005 | Member persistence confidence damaged | **PASS** | Production A/B authenticated state, Progress, Brain and leave/return persistence proven without contamination. |
| G1-006 | Broken/dead routes and links not centrally detected | **PASS** | Exhaustive production crawler checked 418 same-origin URLs / 370 HTML pages, found zero critical route/asset/blank-page failures and exhausted discovery without truncation. Earlier malformed-link defect was fixed and the unchanged sweep reran green. |
| G1-007 | Error handling exposes generic failures | AMBER | Request IDs/contracts exist in Core; complete rendered/member-facing failure and diagnostic-state acceptance remains M10/M01/B08. |
| G1-008 | Loading/empty/success states inconsistent | AMBER | Behavioural endpoints are green; rendered state-system acceptance remains M01/M10/B08. |
| G1-009 | Mobile/cross-browser regressions found manually | AMBER | Genuine mobile/cross-browser release evidence remains M01/M06/M10/B08. |
| G1-010 | Auth rate limits/security controls need formal commissioning | AMBER | Runtime abuse, OIDC commissioning-identity and source security gates pass; full release threat/privacy review remains M05. |
| G1-011 | Production entry-point wiring can diverge from modules | **PASS** | Master/source gates fail if authoritative auth/product/Brain wiring disappears; current gates green. |
| G1-012 | Synthetic member commissioning is incomplete as release gate | AMBER | Authenticated production isolation/retention and longitudinal product behaviour are green; fresh unassisted B08 remains. |

## Gate 2 — Nothing Half-Finished
| ID | Original audit requirement | Status | Current evidence / exact remaining closure |
|---|---|---|---|
| G2-001 | Shift Today is an engine, not a premium daily command centre | AMBER | Behaviour/persistence green; premium rendered daily-command-centre acceptance remains. |
| G2-002 | Grub recipes are not real recipes | AMBER | Structured authored universe is 256 (32 original + 224 industrial); 1 reviewed/published CoFID-validated recipe is now production-served. Industrial conversion at scale remains M11. |
| G2-003 | Grub nutrition figures are not tied to exact ingredients | AMBER | One production-served commissioning-floor recipe has CoFID 2021 ingredient-level validation; industrial objects remain quarantined pending ingredient-level validation. |
| G2-004 | Grub variety/repetition is poor | AMBER | Existing live simulator exposes repetition; 224 additional authored objects materially widen prospective coverage but 30/60/90/365-day commissioned-catalogue simulations remain M11. |
| G2-005 | Grub Yay/Nay is shallow and not durable learning | **PASS** | Authenticated Nay -> leave/return -> later recommendation change is production-proven; unrelated Fit remains unaffected. |
| G2-006 | Fit composes durations incorrectly | AMBER | Historical padding defect fixed and behaviour green; complete 10/15/20/30/45/60 session-quality commissioning remains M12. |
| G2-007 | Exercise library/instructions are too thin | AMBER | Structured authored universe is 256 (32 original + 224 industrial across 28 canonical movements × 8 variants); 3 reviewed/member-QA illustrated movements are now production-served. Scale conversion remains M12. |
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
| G4-004 | Site/CMS content ingestion into Knowledge Graph not proven automatic | AMBER | Reviewed Knowledge publish -> canonical retrieval -> Brain grounding/provenance -> withdrawal is proven, but automatic CMS ingestion/flywheel proof remains outstanding. |
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
| G5-007 | Watchtower observability is incomplete | AMBER | Probes/history/SLO/attention architecture exists; controlled degradation -> retained history -> HQ action -> recovery proof remains B07. |
| G5-008 | HQ is admin UI rather than operating nerve centre | AMBER | Attention endpoint exists; authorised operator fire-drill evidence remains B06. |
| G5-009 | Recipes/exercises are hard-coded scaling traps | **PASS** | Authenticated production commissioning proves V7 consumes reviewed/published structured Grub and Fit objects, preserves validated nutrition/approved visuals and durable Nay behaviour, and uses V4 only as controlled quality-preserving migration fallback. |
| G5-010 | Analytics lacks coherent product-event taxonomy | **PASS** | Canonical product-event taxonomy/instrumentation, privacy filtering and Watchtower analytics gates are regression-protected. |
| G5-011 | Security/privacy audit not yet complete | AMBER | Multiple security/privacy gates pass; full release review of exposed V1 boundaries remains M05. |
| G5-012 | Performance not a release criterion | AMBER | SLO budgets exist; production critical-path performance/accessibility evidence remains M06. |
| G5-013 | Dave end-to-end commissioning not yet run | AMBER | Progressive automated Dave coverage plus authenticated production suites exist; fresh unassisted rendered/recovery/content-depth release candidate remains B08. |
| G5-014 | Numan/customer trust competitive test not embedded | AMBER | Explicit sceptical-customer/Numan acceptance remains M17 after release candidate stabilises. |

## 38-AMBER burn-down classification
`QUICK KILL` = mostly implemented/evidence gap. `FINITE` = defined work with a clear endpoint. `LARGE` = substantial remaining product work. `HUMAN/DEVICE` = irreducible inbox/device/rendered proof. No additional row is currently reclassified as externally BLOCKED.

| ID | Class | Immediate closure lane |
|---|---|---|
| G1-001 | HUMAN/DEVICE | B01 real reset-token/inbox lifecycle |
| G1-002 | HUMAN/DEVICE | B01/M09 production transactional inbox proof |
| G1-003 | HUMAN/DEVICE | M09 real verification inbox click/login |
| G1-004 | HUMAN/DEVICE | M09 real verification inbox click/login |
| G1-007 | FINITE | M10 exhaustive member-facing failure/diagnostic sweep |
| G1-008 | HUMAN/DEVICE | M01/M10 rendered loading/empty/success review |
| G1-009 | HUMAN/DEVICE | M01/M06 cross-browser/mobile matrix |
| G1-010 | FINITE | M05 release threat/privacy review |
| G1-012 | HUMAN/DEVICE | B08 fresh unassisted Dave run |
| G2-001 | LARGE | M01/B08 premium Today experience |
| G2-002 | LARGE | M11 nutrition/review/publication conversion at scale |
| G2-003 | LARGE | M11 industrial ingredient-level nutrition validation |
| G2-004 | LARGE | M11 30/60/90/365-day catalogue diversity |
| G2-006 | FINITE | M12 duration/session-quality matrix |
| G2-007 | LARGE | M12 visuals/review/publication conversion at scale |
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
| G4-004 | FINITE | automatic CMS -> Knowledge Graph flywheel proof |
| G4-008 | LARGE | premium proactive Today orchestration |
| G5-005 | FINITE | B05 public trust audit |
| G5-007 | QUICK KILL | B07 controlled degradation/recovery fire drill |
| G5-008 | QUICK KILL | B06 authorised HQ operator fire drill |
| G5-011 | FINITE | M05 final security/privacy review |
| G5-012 | FINITE | M06 critical-path performance evidence |
| G5-013 | HUMAN/DEVICE | B08 fresh unassisted rendered Dave journey |
| G5-014 | FINITE | M17 sceptical-customer/Numan acceptance |

## Reconciliation check
PASS rows: 16. AMBER rows: 38. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.

## Commissioning rule
A row moves to PASS only with demonstrated acceptance evidence. External clinical/provider rows remain BLOCKED rather than being hidden or falsely promoted. Discovered in-scope launch gaps become execution lanes automatically.
