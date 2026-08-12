# Shift V1 Finish Line

This is the authoritative remaining-work ledger. No fourth category exists. New work is admitted only when it closes one of these requirements, fixes a discovered defect, or protects a critical member/clinical/security boundary.

## Burn-down baseline — 2026-08-12
- Launch blockers: 8
- Must-finish items: 9
- Dave journey genuinely GREEN: 25% (discover/trust/public Core/member-boundary legs proven; authenticated longitudinal journey not yet proven)
- Production surfaces complete: 3/12 (public acquisition/home, public Core health boundary, anonymous member access boundary; member product surfaces remain commissioning)
- Regressions introduced: 0 known
- Regressions unresolved: 0 known

## BLOCKER — cannot launch V1 without it

B-01 Auth + transactional email production closure
Register -> verification email received -> verify -> login -> forgotten-password email received -> reset -> login -> change password -> login -> logout, with expired/reused token behaviour. Existing source/production boundary evidence is insufficient without real inbox evidence.

B-02 Authenticated member isolation
Two real authenticated synthetic members must prove A cannot retrieve/infer/influence B's Brain, Progress, preferences, plans, feedback, AI context or recommendations.

B-03 Authenticated longitudinal Shift Brain
Preference -> persist -> leave -> return -> changed Today/Grub behaviour; Nay -> later recommendation changes; current intent overrides stale memory; unrelated Fit context remains unaffected.

B-04 Core member products usable end-to-end
Today, Grub, Fit, Hydration, Conundrum, Progress, Progress Picture, My Plans and Shift AI must work through the production member journey with persistence, graceful errors and no obviously trust-destroying output. This is one closure programme, not nine independent feature projects.

B-05 Member-facing premium/mobile closure
The B-04 journey must be usable on real phone layouts with homepage-level design language, no prototype controls, dead ends or broken responsive states. Genuine device evidence remains required.

B-06 HQ operational control
HQ must authenticate and give the operator an actionable view of platform/member-product health, alerts and recovery state sufficient to run V1. Raw endpoints alone do not close this.

B-07 Security/privacy launch boundary
Production permissions, member isolation, reset/session abuse, sensitive analytics/context handling, upload/privacy controls used by V1, and auditability must be demonstrated. No known critical/high launch-boundary defect may remain.

B-08 Dave end-to-end closure
Fresh Dave must complete discover -> trust -> register -> verify -> onboard -> Today -> Grub -> Fit -> hydration -> Progress -> Picture -> Ask Shift -> preference learning -> leave -> return -> retained state -> changed recommendation -> account recovery without assisted repair. Clinical/treatment steps are excluded from non-clinical V1 unless a genuine provider is commissioned.

## MUST FINISH — agreed V1 requirement, but can be closed in parallel and does not independently justify holding a safe non-clinical beta if its surface is not exposed

M-01 Knowledge reviewed publication -> canonical retrieval -> Shift AI grounding/provenance production proof.
M-02 Radar live freshness/publication/ticker proof if Radar is exposed at V1; otherwise feature remains clearly commissioning/off.
M-03 Watchtower production detection/recovery proof for launch-critical dependencies and persisted history.
M-04 Product analytics real-flow QA for acquisition/register/onboard/Today/Grub/Fit/Progress/return/errors.
M-05 Structured-content migration for V1 Grub/Fit/Knowledge objects actually served in production; no hard-coded scaling trap on active V1 paths.
M-06 Performance budgets on critical Dave paths; fix material latency that makes the member product feel slow.
M-07 Accessibility interaction closure on critical Dave paths: keyboard/focus/forms/errors/navigation/structure/reduced-motion/contrast.
M-08 Public trust/legal/AI-boundary pages accurately describe the non-clinical V1 operating model and do not imply uncommissioned partners/status.
M-09 Evidence/remediation reconciliation: every V1 item ends PASS, BLOCKED-but-not-exposed, or moved to POST-LAUNCH before release decision.

## POST-LAUNCH — must not delay non-clinical V1

P-01 Clinical prescribing/dispensing integration until provider/pharmacy contracts and governance are real.
P-02 Identity/weight/evidence verification required specifically for clinical prescribing.
P-03 Live clinical escalation/provider workflows and treatment decisions.
P-04 Real Health MOT/blood partner payload integration; retain partner-neutral architecture only.
P-05 Medication Companion clinical workflow beyond safe educational/non-prescribing states.
P-06 Publication of outcomes/causal claims; continue collecting governed observational data.
P-07 Additional Radar sophistication beyond reliable V1 freshness if Radar is enabled.
P-08 Broad performance/load optimisation beyond measured V1 bottlenecks.
P-09 Additional content volume, recipes, exercises and feature expansion beyond the quality/variety floor needed for V1.
P-10 Non-critical HQ/marketing/commerce/automation sophistication not required to operate V1.

## Critical path
1. B-01 production auth/email closure.
2. In parallel: B-02/B-03 authenticated isolation + longitudinal state; B-04 product closure; B-06 HQ closure; B-07 security/privacy.
3. B-05 genuine phone/member presentation proof as soon as the B-04 surfaces stabilise.
4. Extend Dave continuously across every newly green leg.
5. Close M-01..M-08 only to the extent they support exposed V1 paths.
6. Run fresh unassisted B-08 Dave; defects return to their owning blocker, are fixed/regression-protected, then Dave reruns.
7. M-09 final evidence reconciliation and release decision.

## External dependencies that can prevent a broader clinical launch but must not stall non-clinical V1
- genuine clinical provider/pharmacy agreement and operating responsibilities
- provider-specific identity/evidence requirements
- real clinical escalation/governance ownership
- real Health MOT/lab partner contract/payload

## Finish forecast
Engineering critical path is dominated by authenticated production journeys and member-surface closure, not more architecture. Earliest credible production-ready point is after B-01 through B-08 and M-01..M-09 relevant to exposed V1 paths are demonstrated. Clinical launch cannot be forecast from repository work because provider/governance dependencies are external. The non-clinical V1 should not wait for those integrations if clinical/treatment functionality is clearly unavailable and trust copy accurately says so.

## Recovery rule
At interruption, update this file plus `docs/COMMISSIONING-EVIDENCE.md` with: last merge, current counts, current incomplete branch/PR, exact failing/next acceptance criterion. Resume there without owner reconstruction.
