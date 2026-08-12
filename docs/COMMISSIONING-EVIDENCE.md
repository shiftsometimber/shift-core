# Shift Commissioning Evidence Ledger

This ledger records demonstrated evidence. Source/merge alone is not PASS. AMBER means required evidence remains. BLOCKED means a genuine external dependency is required. `docs/LAUNCH-FINISH-LINE.md` is the authoritative closure board.

## Current closure evidence — recovery checkpoint 2026-08-12

### LOCKED PASS
**B02 authenticated member isolation + durable longitudinal state: PASS.** Production A/B sessions prove separate member state, Brain context, Today context, Progress and leave/return persistence without cross-member contamination.

**B03 core member behavioural journeys: PASS — 9/9.** Grub, Fit, Today, Hydration, Conundrum, My Plans, Progress, Progress Picture and Shift AI all cleared hard production behavioural commissioning. PR #54 fixed the prescription-boundary defect without weakening the hostile proof; post-merge production commissioning on `e46aa035` passed unchanged. Do not reopen B03 without genuine regression evidence.

**B04 One Shift Brain longitudinal behaviour: PASS.** Current intent precedence, durable Grub/Fit learning, cross-domain isolation and retained Progress/Shift AI context are production-proven.

**M02 reviewed Knowledge publication lifecycle: PASS.** Reviewed publish -> canonical retrieval -> provenance/grounding -> withdrawal -> no grounding is regression-protected.

### PR #55 recovery state
PR #55 content-factory/reconciliation branch is CLEAN at the latest evidenced integration rerun: all 29 Master Integration steps passed, including the unchanged final authenticated production isolation/retained-state proof. The earlier `register DaveA` generic 500 did not reproduce. It remains an observed transient failure only; if registration failure recurs, retain/request sufficient telemetry to identify the failing registration dependency rather than treating recurrence as unexplained noise. No #55 reopening is justified without new regression evidence.

PR #55 establishes the structured Grub/Fit factory, deterministic publication barriers, simulator lane, first authored content/visual batches, 57/57 original-audit crosswalk and CI anti-orphan protection. Content is measured by funnel stage, not raw inventory: authored -> validated -> reviewed -> published -> production-served -> launch-ready.

### Content factory checkpoint
Live legacy member source remains 16 Grub recipes and 12 Fit exercises until M07 migration makes canonical structured content authoritative. Structured authoring has moved beyond that legacy inventory, but authored objects are not launch-ready merely because they exist. Nutrition validation, review/publication, member-path serving, visual QA and experience simulation remain explicit commissioning gates.

The original live Grub simulator exposed first exact meal repeats on day 5 and a 30-day repeat rate of 104/120 slots (86.7%). The first structured batch materially improved short-horizon variety but did not make 30/60-day experience acceptable. Fit likewise exposed excessive 12-week repetition; catalogue floors remain hypotheses to be increased automatically if experience tests fail.

### B01 authentication recovery
Production Welcome and password-reset messages are proven received. The implementation includes single-use hashed reset tokens, expiry, password reset, session revocation and authenticated change-password. Remaining proof is the real inbox token -> reset -> login new password -> authenticated change-password -> logout -> login again. Secret-bearing execution must not leak the token to repository source/logs.

### Current authoritative scoreboard
Original audit: **57 total / 9 PASS / 45 AMBER / 3 BLOCKED / 0 unmapped**.
B03 behavioural: **9/9 PASS — locked unless regression**.
External blockers: signed clinical operating model/provider/pharmacy governance; clinically governed Medication Companion prescribing/escalation; provider-approved identity/weight/evidence verification.

### Active non-external closure swarm
B01 recovery; B05 trust; B06/B07 HQ/Watchtower controlled degradation and recovery; B08 Dave; M01 premium/mobile; M03 Radar freshness; M04 analytics; M05 security/privacy; M06 accessibility/performance; M07 structured production migration; M08 evidence/recovery; M09 email verification; M10 route/link/error sweep; M11 Grub funnel + simulator; M12 Fit/visual funnel + simulator; M13 Progress/units; M14 memory controls; M15 mocked partner-ready MOT; M16 outcomes; M17 sceptical-customer/Numan acceptance.

## Recovery rule
#55 is behind us as a cleanliness question. Do not spend execution cycles trying to make it clean again. Continue from the content conversion funnel and independent AMBER closure swarm. If a locked PASS genuinely regresses, fix the exact product defect and rerun the unchanged proof.
