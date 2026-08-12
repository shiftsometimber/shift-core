# Shift Commissioning Evidence Ledger

This ledger records demonstrated evidence. Source/merge alone is not PASS. AMBER means substantial engineering exists but required behavioural/production/device evidence remains. BLOCKED means a genuine external dependency is required.

## Current closure evidence — 2026-08-12

The authoritative launch burn-down is `docs/LAUNCH-FINISH-LINE.md`; this ledger records demonstrated evidence without promoting unproven rows.

### Authentication and member isolation
Production transactional Welcome and account-recovery messages were observed in the connected Shift Gmail inbox. Full account-recovery completion remains incomplete because the secure reset-token use -> new password -> login -> change-password -> login chain has not yet been executed end to end.

**B02 authenticated member isolation + durable longitudinal state: PASS.** PR #47 production commissioning created two fresh authenticated members and demonstrated separate sessions, separate member-state preferences, separate Progress, separate Brain context, Today consuming each member's Brain, logout/login retained state, and no A/B contamination.

### Longitudinal member intelligence and products
**B04 One Shift Brain longitudinal behaviour: PASS.** PR #48 first failed production commissioning because a Nayed Grub meal could reappear after logout/return. The underlying product path was fixed so historical product Nays are re-applied immediately before member output and corrected plans persist. Pre-merge Master Integration then passed, the change was merged, and the dedicated post-deploy production commissioning workflow passed the hard journey: stored dislike -> Grub -> Nay -> logout -> login -> regenerated plan excludes the Nayed meal -> Fit remains uncontaminated and respects the exercise dislike.

**B03 remains AMBER but materially reduced.** PR #48 production-proves Grub/Fit longitudinal learning and semantic-quality protection. PR #49 production-proves an authenticated Conundrum obvious-combination journey (chicken + cheese + wrap), hydration rules for coffee and alcohol, hydration persistence across logout/login, My Plans persistence, Today consuming the active hydration plan, and a safe Progress summary response. The clearest remaining behavioural gaps are Progress Picture and Shift AI, followed by final member-facing/mobile/premium acceptance rather than more backend architecture.

### Gate 4 — Shift Becomes Intelligent
G4-001 PASS for canonical Brain consumption across Shift AI/Today/Grub/Fit architecture plus authenticated production longitudinal product behaviour.
G4-002 AMBER: memory provenance/privacy exists; member inspect/change/delete and governance proof remains.
G4-003 PASS for durable product learning evidence: authenticated Grub Nay survives leave/return and changes regenerated output while Fit remains unaffected.
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
G5-007 AMBER / ENGINEERING COMMISSIONED: Watchtower has public/Core/Radar probes, timeout/latency evidence, dependency health, SLO evaluation, durable history, 24h availability/latency trends, retention/pruning and trend-driven AMBER/RED conditions. Controlled production-safe degradation -> detection -> HQ action -> recovery evidence remains required.
G5-008 AMBER: HQ attention/journey endpoints expose actionable summaries; operator workflow evidence remains.
G5-009 AMBER / ENGINEERING COMMISSIONED: versioned/statused/paginated structured-content path exists and a measured 10,000-object commissioning benchmark is regression protected. Production migration/path completeness remains to be reconciled before closure.
G5-010 AMBER: canonical privacy-filtered taxonomy and aggregate registration->onboarding->Today->feature->Progress->return funnel exist; remaining surfaces and real-flow QA remain.
G5-011 AMBER: adversarial analytics privacy stripping/rejection, anonymous route abuse and authenticated A/B isolation evidence are green. Full release review of export/delete/uploads/audit and remaining privilege boundaries remains.
G5-012 AMBER: latency budgets, probe latency and structured-content benchmark exist; production Web Vitals/API percentile and material slow-path evidence remains.
G5-013 Dave AMBER/IN PROGRESS: live public discover/trust/Core health/anonymous boundary, authenticated A/B retained-state, Grub/Fit longitudinal learning, Today, Hydration, Conundrum and My Plans are now demonstrated across production commissioning harnesses. Progress Picture, Shift AI and account recovery remain incomplete; treatment support remains externally partner-dependent.

## Gate 1–3 residuals
Gate 1 engineering/security regressions remain protected; production inbox receipt and authenticated A/B retained-state evidence are demonstrated, while the remaining account-recovery lifecycle is incomplete. Gate 2 remains AMBER only for the still-open member journeys/presentation evidence rather than the already-proven Grub/Fit/Hydration/Conundrum paths. Gate 3 remains AMBER until genuine Safari/Chrome/device evidence exists.

## Authoritative recovery point
Merged through **PR #49**. B02 and B04 are evidenced PASS. PR #48 also introduced a dedicated post-deploy production commissioning workflow so production-only proof is no longer incorrectly run as if an unmerged branch were already deployed. The first post-deploy run passed after #48 merged. PR #49 then added and passed authenticated production closure for Today/Hydration/Conundrum/My Plans/Progress-summary behaviour.

Exact next critical path: B01 secure account-recovery completion -> B03 Progress Picture + Shift AI + residual member/mobile proof -> B06/B07 controlled Watchtower/HQ degradation-recovery proof -> B08 Dave completion. In parallel continue B05 trust, security/privacy, performance/accessibility, analytics, Radar and structured-content closure. Genuine physical-device and external clinical/provider evidence must remain AMBER/BLOCKED until demonstrated.
