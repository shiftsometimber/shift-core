# Original audit -> launch finish-line crosswalk

Reconciled 2026-08-12 against the authoritative 57-row `SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md`, current `main`, production commissioning evidence and the launch finish-line. This file exists to prevent requirements disappearing through Gate/B/M abstraction.

Status is deliberately conservative. `PASS` means the original row's acceptance condition has evidence, not merely source. `AMBER` means closable work/proof remains. `BLOCKED` is reserved for a genuine external dependency.

## Gate 1

| Original ID | Current owner | Status | Evidence / exact remaining closure |
|---|---|---|---|
| G1-001 | B01 | AMBER | Real reset email proven; real token -> reset -> session revoke -> new login -> change password -> final login remains. |
| G1-002 | B01 | PASS | Production Welcome/reset delivery proves deployed email binding is functioning. |
| G1-003 | B01 / M09 | AMBER | Welcome/reset proven; explicit verification/security-notification lifecycle still requires launch-policy closure. |
| G1-004 | **M09 reinstated** | AMBER | AUTO_VERIFY policy/verification UX must be explicit, implemented and tested. |
| G1-005 | B02 | PASS | #47 A/B authenticated state/Progress/Brain isolation and logout/login retention. |
| G1-006 | **M10 reinstated** | AMBER | Whole-estate route/link/form release sweep still required. |
| G1-007 | **M10 reinstated** | AMBER | Member-safe error UX/request trace evidence still required across critical journeys. |
| G1-008 | M01 + B03 | AMBER | Shared states exist in parts; rendered empty/loading/success/error coverage remains. |
| G1-009 | M01 + M06 | AMBER | Automated viewport evidence can close most; genuine physical Safari/Chrome remains final hostile acceptance. |
| G1-010 | M05 | AMBER | Auth/session abuse is strong; formal rate-limit/CSRF/CORS/session release review remains. |
| G1-011 | M08 | PASS | Production entry/source gates actively fail on wiring drift. |
| G1-012 | B08 | AMBER | Dave journey expanded substantially but not complete. |

## Gate 2

| Original ID | Current owner | Status | Evidence / exact remaining closure |
|---|---|---|---|
| G2-001 | B03 Today | AMBER | Context/persistence behaviour proven; daily usefulness + premium rendered experience not yet commissioned. |
| G2-002 | **M11 reinstated** | AMBER | Only 16 live recipes; full recipe contract and structured production catalogue absent. |
| G2-003 | **M11 reinstated** | AMBER | Current nutrition is curated estimate; 0 recipes have evidenced ingredient-level validated nutrition. |
| G2-004 | **M11 reinstated** | AMBER | Four recipes per meal type means exact repetition begins day 5. 30/60-day variety floor fails. |
| G2-005 | B04 | PASS | #48 proves durable Grub Nay survives return and changes later recommendation. |
| G2-006 | **M12 reinstated** | AMBER | Dead-bug time-padding defect is fixed; 10/15/20/30/45/60 programme quality/variety still fails the content-depth bar. |
| G2-007 | **M12 reinstated** | AMBER | Only 12 live exercises and 0 visual guides; not launch-ready. |
| G2-008 | B04 / M12 | AMBER | Durable Fit feedback plumbing exists; full returning-member Fit Nay behavioural proof + catalogue alternatives remain. |
| G2-009 | B03 Conundrum | PASS | #49 proves obvious chicken + cheese + wrap relationship without invented core ingredients. |
| G2-010 | B03 Hydration | PASS | #49 proves coffee/beer contribution semantics and persistence. |
| G2-011 | **M13 reinstated** | AMBER | Weight/waist Since You Started works; whole-person Progress story remains incomplete. |
| G2-012 | **M13 reinstated** | AMBER | Canonical server persistence exists; premium stone/lb/kg rendered controls still need closure. |
| G2-013 | B03 Picture | AMBER | Save/history/Same/delete/consent behaviour proven; mobile/rendered product experience remains. |
| G2-014 | B03 Picture + M01 | AMBER | Premium visual experience remains. |
| G2-015 | B03 My Plans | AMBER | Active plan persistence proven; complete rendered plan-manager interaction/state experience remains. |

## Gate 3

| Original ID | Current owner | Status | Evidence / exact remaining closure |
|---|---|---|---|
| G3-001 | M01 | AMBER | Design-system source exists; estate-wide rendered homepage-parity evidence remains. |
| G3-002 | M01 | AMBER | Canonical header/nav rendered parity remains. |
| G3-003 | M01 | AMBER | Canonical footer parity on all public routes remains. |
| G3-004 | M01 | AMBER | Default/prototype controls must be eliminated in rendered routes. |
| G3-005 | M01 | AMBER | Cards/spacing/type visual regression acceptance remains. |
| G3-006 | M01 | AMBER | Knowledge editorial rendered acceptance remains. |
| G3-007 | M01 + B08 | AMBER | Dave navigation/findability acceptance remains. |
| G3-008 | M06 | AMBER | Interaction accessibility evidence remains. |

## Gate 4

| Original ID | Current owner | Status | Evidence / exact remaining closure |
|---|---|---|---|
| G4-001 | B04 | PASS | Canonical One Shift Brain plus cross-product/return behaviour proven. |
| G4-002 | **M14 reinstated** | AMBER | Provenance/privacy primitives exist; member inspect/edit/delete learned-memory UX/evidence remains. |
| G4-003 | B04 + M04 | AMBER | Grub outcome learning proven; consistent Fit/recommendation outcome loop remains. |
| G4-004 | M02 | PASS | Reviewed publish -> canonical retrieval -> grounding/provenance -> withdrawal proven. |
| G4-005 | M02 + B03 AI | PASS | Grounding source/provenance contract is exposed and commissioning-protected. |
| G4-006 | M03 | AMBER | Radar source scan/publication/ticker production freshness proof remains. |
| G4-007 | M03 + B07 | AMBER | Stale logic exists; live stale->alert/fail-safe proof remains. |
| G4-008 | B03 Today | AMBER | Brain consumption proven; coherent useful proactive daily orchestration acceptance remains. |

## Gate 5

| Original ID | Current owner | Status | Evidence / exact remaining closure |
|---|---|---|---|
| G5-001 | P07 clinical dependency | BLOCKED | Formal provider/pharmacy/prescriber/governance arrangement required before clinical sale/claim. |
| G5-002 | P07 clinical dependency | BLOCKED | Medication Companion clinical pathways require governance/clinical owner. |
| G5-003 | P07 clinical dependency | BLOCKED | Provider-approved identity/weight verification requirements are external. |
| G5-004 | **M15 reinstated** | AMBER | Partner-ready Health MOT model/adapter exists; mocked partner payload -> Progress/Today safety proof remains. |
| G5-005 | B05 | AMBER | Accurate operator/AI/privacy/support trust audit remains; partner claims must stay absent until formal. |
| G5-006 | **M16 reinstated** | AMBER | Outcomes architecture exists but launch proof of analyzable engagement/outcome linkage remains. |
| G5-007 | B07 | AMBER | Watchtower/SLO/history exists; controlled degrade -> AMBER -> RED -> recovery -> HQ action proof remains. |
| G5-008 | B06 | AMBER | Attention APIs exist; authorised operator under-fire usefulness proof remains. |
| G5-009 | M07 + M11 + M12 | AMBER | 10k repository benchmark passed, but live Grub/Fit still consume hard-coded Worker arrays. |
| G5-010 | M04 | AMBER | Event infrastructure exists; full launch-funnel taxonomy/QA remains. |
| G5-011 | M05 | AMBER | Strong adversarial coverage exists; final export/delete/uploads/audit/privilege release review remains. |
| G5-012 | M06 | AMBER | Production performance budgets and slow-path evidence remain. |
| G5-013 | B08 | AMBER | Automated Dave incomplete; physical hostile acceptance follows automation. |
| G5-014 | **M17 reinstated** | AMBER | Explicit sceptical-customer/Numan comparative acceptance was not a standalone finish-line closure. |

## Reconciliation totals

Original substantive requirements: **57**.

Current evidence classification at this reconciliation: **9 PASS / 45 AMBER / 3 BLOCKED / 0 unmapped after reconciliation**.

**9 requirements were found to be insufficiently explicit in the reduced B/M finish-line and have been reinstated as M09–M17:** email verification lifecycle; whole-estate route/error sweep; Grub content/nutrition/variety; Fit catalogue/session/visual guidance; whole-person Progress/units; member memory controls; Health MOT mocked partner-ready flow; outcomes launch architecture proof; explicit Numan/sceptical-customer acceptance.

This deliberately makes the board larger. It is a correction, not scope expansion: all nine requirements already existed in the original 57-row commissioning matrix.
