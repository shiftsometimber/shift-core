# Shift Commissioning Evidence Ledger

This ledger records demonstrated evidence. Source/merge alone is not PASS. AMBER means substantial engineering exists but required behavioural/production/device evidence remains. BLOCKED means a genuine external dependency is required.

## Current closure evidence — 2026-08-12

PRs #40–#47 have materially advanced the programme beyond the older Gate 5 checkpoint. The authoritative launch burn-down is `docs/LAUNCH-FINISH-LINE.md`; this ledger records demonstrated evidence without promoting unproven rows.

### Authentication and member isolation
Production transactional Welcome and account-recovery messages were observed in the connected Shift inbox. Full account-recovery completion remains incomplete.

**B02 authenticated member isolation + durable longitudinal state: PASS.** PR #47 production commissioning created two fresh authenticated members and demonstrated separate sessions, separate member-state preferences, separate Progress, separate Brain context, Today consuming each member's Brain, logout/login retained state, and no A/B contamination.

### Gate 4 — Shift Becomes Intelligent
G4-001 AMBER: One Shift Brain is integrated across shared AI/Today/Grub/Fit context; #47 adds authenticated separate Brain contexts and Today consumption. Changed recommendation behaviour remains required.
G4-002 AMBER: memory provenance/privacy exists; member inspect/change/delete and governance proof remains.
G4-003 AMBER: durable Yay/Nay and preference signals feed later decisions; authenticated retained-state proof is now green, but a later recommendation must demonstrably change after leave/return before closure.
G4-004 PASS for reviewed Knowledge lifecycle evidence: adversarial commissioning proves reviewed publish -> canonical retrieval -> provenance/grounding -> withdrawal -> no longer grounding. This does not imply any external clinical source is commissioned.
G4-005 AMBER: grounding provenance is returned by Shift AI; production/HQ trace presentation proof remains.
G4-006 AMBER: Radar staged E2E/publication architecture pass; live source->review->publish->ticker evidence remains required.
G4-007 AMBER: freshness states and regression transitions exist; controlled production-safe stale/current operational proof remains.
G4-008 AMBER: proactive consumers share Brain; authenticated explainable next-action behaviour remains.

### Gate 5 — Trust & Scale
G5-001/G5-002/G5-003 BLOCKED on genuine clinical/provider/verification governance; no partner facts are invented.
G5-004 AMBER / ENGINEERING COMMISSIONED: provider-neutral Health MOT ingestion/storage exists; real provider payload/verification remains externally blocked.
G5-005 AMBER: public/legal architecture exists; full production trust audit remains.
G5-006 AMBER: privacy-filtered product events, Progress cohorts and aggregate journey conversion exist; governed definitions and real-flow QA remain.
G5-007 AMBER / ENGINEERING COMMISSIONED: Watchtower now has public/Core/Radar probes, timeout/latency evidence, dependency health, SLO evaluation, durable history, 24h availability/latency trends, retention/pruning and trend-driven AMBER/RED conditions. Controlled production-safe degradation -> detection -> HQ action -> recovery evidence remains required.
G5-008 AMBER: HQ attention/journey endpoints expose actionable summaries; operator workflow evidence remains.
G5-009 AMBER / ENGINEERING COMMISSIONED: versioned/statused/paginated structured-content path exists and a measured 10,000-object commissioning benchmark is regression protected. Production migration/path completeness remains to be reconciled before closure.
G5-010 AMBER: canonical privacy-filtered taxonomy and aggregate registration->onboarding->Today->feature->Progress->return funnel exist; remaining surfaces and real-flow QA remain.
G5-011 AMBER: adversarial analytics privacy stripping/rejection, anonymous route abuse and authenticated A/B isolation evidence are green. Full release review of export/delete/uploads/audit and remaining privilege boundaries remains.
G5-012 AMBER: latency budgets, probe latency and structured-content benchmark exist; production Web Vitals/API percentile and material slow-path evidence remains.
G5-013 Dave AMBER/IN PROGRESS: live public discover/trust/Core health/anonymous boundary plus authenticated A/B retained-state commissioning are evidenced. Full product, changed-recommendation and account-recovery journey remains incomplete.

## Gate 1–3 residuals
Gate 1 engineering/security regressions remain protected; production inbox receipt and authenticated A/B retained-state evidence are now demonstrated, while the remaining account-recovery lifecycle is incomplete. Gate 2 remains AMBER pending closure of the full premium member journeys and semantic/persistence evidence across all V1 products. Gate 3 remains AMBER until genuine Safari/Chrome/device evidence exists.

## Authoritative recovery point
Merged through PR #47. B02 is evidenced PASS. The next critical path is B04 authenticated changed-recommendation proof and B03 primary member journey closure, with B01 account-recovery completion pursued only through a secure execution path. In parallel continue B06/B07 controlled Watchtower/HQ degradation-recovery proof and the remaining public trust, security/privacy, performance/accessibility, analytics and structured-content closure work. Genuine physical-device and external clinical/provider evidence must remain AMBER/BLOCKED until demonstrated.
