# Shift Some Timber — Commissioning Remediation Matrix

Authoritative original-audit inventory. No row may disappear through B/M abstraction. Status is evidence-led: `PASS`, `AMBER`, `BLOCKED`. PASS requires demonstrated acceptance evidence, not code existence.

**Current reconciled scoreboard: 57 total / 12 PASS / 42 AMBER / 3 BLOCKED / 0 unmapped.**

## Gate 1 — Nothing Broken
| ID | Original audit requirement | Status | Current evidence / exact remaining closure |
|---|---|---|---|
| G1-001 | Duplicate/incomplete password recovery paths | AMBER | Recovery module is authoritative and reset/change implementation is proven; B01 still needs secret-safe real-token reset -> login -> change-password -> logout/login. |
| G1-002 | Email binding not deployment-persistent | AMBER | Welcome/reset inbox receipt is proven; final launch email/recovery lifecycle remains coupled to B01/M09. |
| G1-003 | Registration email lifecycle incomplete | AMBER | Welcome delivery proven; explicit verification lifecycle remains M09. |
| G1-004 | Email verification is effectively bypassed | AMBER | AUTO_VERIFY ambiguity remains; M09 requires explicit verified state/policy/token behaviour. |
| G1-005 | Member persistence confidence damaged | **PASS** | Production A/B authenticated state, Progress, Brain and leave/return persistence proven without contamination. |
| G1-006 | Broken/dead routes and links not centrally detected | AMBER | Route probes exist; whole-estate release sweep remains M10. |
| G1-007 | Error handling exposes generic failures | AMBER | Request IDs/contracts exist in Core; whole-estate member-facing error/diagnostic sweep remains M10. A prior generic registration 500 did not reproduce and must be diagnosable if it recurs. |
| G1-008 | Loading/empty/success states inconsistent | AMBER | Behavioural endpoints are green; rendered state-system acceptance remains M01/M10/B08. |
| G1-009 | Mobile/cross-browser regressions found manually | AMBER | Genuine mobile/cross-browser release evidence remains M01/M06/M10/B08. |
| G1-010 | Auth rate limits/security controls need formal commissioning | AMBER | Runtime abuse/source security gates pass; full release threat/privacy review remains M05. |
| G1-011 | Production entry-point wiring can diverge from modules | **PASS** | Master/source gates fail if authoritative auth/product/Brain wiring disappears; current gates green. |
| G1-012 | Synthetic member commissioning is incomplete as release gate | AMBER | Progressive Dave and hard production suites cover much of the journey; fresh unassisted B08 remains. |

## Gate 2 — Nothing Half-Finished
| ID | Original audit requirement | Status | Current evidence / exact remaining closure |
|---|---|---|---|
| G2-001 | Shift Today is an engine, not a premium daily command centre | AMBER | Behaviour/persistence green; premium rendered daily-command-centre acceptance remains. |
| G2-002 | Grub recipes are not real recipes | AMBER | 32 structured drafts satisfy deterministic authoring schema; nutrition/review/publication/runtime-serving remain M11. |
| G2-003 | Grub nutrition figures are not tied to exact ingredients | AMBER | Structured recipes explicitly block publication pending ingredient-level nutrition validation; validated count remains 0. |
| G2-004 | Grub variety/repetition is poor | AMBER | Simulator proves live repetition from day 5; drafted capacity improves but 30/60-day repetition remains unacceptable. |
| G2-005 | Grub Yay/Nay is shallow and not durable learning | **PASS** | Authenticated Nay -> leave/return -> later recommendation change is production-proven; unrelated Fit remains unaffected. |
| G2-006 | Fit composes durations incorrectly | AMBER | Historical padding defect fixed and behaviour green; complete 10/15/20/30/45/60 session-quality commissioning remains M12. |
| G2-007 | Exercise library/instructions are too thin | AMBER | 32 structured drafts added; member-ready visuals/review/publication/runtime serving remain M12. |
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
| G4-002 | Memory provenance/confidence/edit/delete controls incomplete | **PASS** | PR #61 proof: inspect/correct/delete learned memory, source/confidence visible, correction provenance explicit, privacy controls durable, cross-member isolation enforced. |
| G4-003 | AI recommendation outcomes are not consistently learned | **PASS** | Durable Yay/Nay and current intent measurably alter later recommendations across leave/return without cross-domain contamination. |
| G4-004 | Site/CMS content ingestion into Knowledge Graph not proven automatic | **PASS** | Reviewed Knowledge publish -> canonical retrieval -> Brain grounding/provenance -> withdrawal -> no grounding is regression-protected. |
| G4-005 | Grounding provenance is not consistently visible/inspectable | **PASS** | Shift AI production contract returns provenance-aware sources and reviewed state; hard production proof green. |
| G4-006 | Radar is built but end-to-end live status is unproven | AMBER | Staged Radar e2e passes; live production scan/publication/ticker freshness remains M03. |
| G4-007 | GLP ticker freshness can silently degrade | AMBER | Stale thresholds/Watchtower contract exist; production freshness/stale-state proof remains M03/B07. |
| G4-008 | Proactive insights are not yet a coherent daily orchestration system | AMBER | Canonical Brain/proactive plumbing exists; premium Today orchestration acceptance remains. |

## Gate 5 — Trust & Scale
| ID | Original audit requirement | Status | Current evidence / exact remaining closure |
|---|---|---|---|
| G5-001 | Clinical operating boundaries not fully commissioned | BLOCKED | Requires signed provider/pharmacy/prescriber operating model. Non-clinical V1 must not imply unavailable clinical service. |
| G5-002 | Medication Companion incomplete | BLOCKED | Requires clinically governed prescribing/escalation owner/pathway. |
| G5-003 | Identity/weight evidence verification not commissioned | BLOCKED | Requires provider-approved verification journey/requirements. |
| G5-004 | Health MOT/bloods integration needs partner-ready data model | **PASS** | PR #59/#61 proves mocked partner payload -> idempotent MOT -> sourced Progress -> One Shift Brain -> authenticated Today, with member isolation and non-diagnostic/no-treatment-change boundaries. |
| G5-005 | Public trust architecture is incomplete | AMBER | Production operator/AI/privacy/support/current-provider trust audit remains B05. |
| G5-006 | Outcome measurement not embedded from member one | **PASS** | PR #61 proves member-one Progress + engagement cohort analysis with separated members and explicit internal-only/non-causal guardrails. |
| G5-007 | Watchtower observability is incomplete | AMBER | Probes/history/SLO/attention architecture exists; controlled degradation -> retained history -> HQ action -> recovery proof remains B07. |
| G5-008 | HQ is admin UI rather than operating nerve centre | AMBER | Attention endpoint exists; authorised operator fire-drill evidence remains B06. |
| G5-009 | Recipes/exercises are hard-coded scaling traps | AMBER | 10k structured-content benchmark and 32+32 drafts prove scalable representation, but member runtime still serves V4 arrays; M07 cutover remains. |
| G5-010 | Analytics lacks coherent product-event taxonomy | **PASS** | Canonical product-event taxonomy/instrumentation, privacy filtering and Watchtower analytics gates are regression-protected. |
| G5-011 | Security/privacy audit not yet complete | AMBER | Multiple security/privacy gates pass; full release review of exposed V1 boundaries remains M05. |
| G5-012 | Performance not a release criterion | AMBER | SLO budgets exist; production critical-path performance/accessibility evidence remains M06. |
| G5-013 | Dave end-to-end commissioning not yet run | AMBER | Progressive automated Dave coverage exists; fresh unassisted rendered/recovery/content-depth release candidate remains B08. |
| G5-014 | Numan/customer trust competitive test not embedded | AMBER | Explicit sceptical-customer/Numan acceptance remains M17 after release candidate stabilises. |

## Reconciliation check
PASS rows: 12. AMBER rows: 42. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.

## Commissioning rule
A row moves to PASS only with demonstrated acceptance evidence. External clinical/provider rows remain BLOCKED rather than being hidden or falsely promoted. Discovered in-scope launch gaps become execution lanes automatically.
