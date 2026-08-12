# Active recovery checkpoint — 2026-08-12

## Current production authority
`main` = `d28d0fde59b1146506c98d8f16f4ff5c88e82138` (`M07: enforce quality after structured cutover`, merged PR #80).

Production commissioning run `31638147840` completed GREEN unchanged against this exact main commit. It re-proved health, genuine regulator scanning/freshness, authenticated member isolation/retained state, longitudinal Grub/Fit learning, Progress Picture, Shift AI provenance/clinical boundary, and finally authenticated structured Grub/Fit serving.

Evidence reconciliation is active in PR #81. The demonstrated original-audit state is **57 / 16 PASS / 38 AMBER / 3 BLOCKED / 0 unmapped** once that evidence-only reconciliation is merged. No catalogue-depth or rendered/mobile row is being promoted by inference.

## Newly earned hard production closures
### G1-006 / central route detection
Merged PR #73's production release sweep checked **418 same-origin URLs / 370 HTML pages**, found **0 critical route/asset/blank-page failures**, exhausted discovery with `truncated:false`, and fails rather than accepting partial discovery. Evidence file: `docs/evidence/2026-08-12-m10-exhaustive-production-sweep.md`.

### G5-009 / M07 structured runtime authority
Production commissioning run `31638147840` proved an authenticated member actually consumed reviewed/published structured V7 content:
- Grub: 1 published available / 1 served, `lighter-beef-cottage-pie`, validated nutrition, Nay respected.
- Fit: 3 published available / 3 served, example `dumbbell-goblet-squat`, approved Shift visual returned, Nay respected.
- Legacy remains controlled migration fallback only while commissioned inventory grows.

This proof came only after two genuine runtime defects were fixed without weakening semantic quality: PR #77 stopped cycling the three commissioned Fit movements through a plan; PR #80 moved final V7 semantic-quality enforcement after structured enrichment while preserving V6 fail-closed behaviour.

## Current content funnel
**Grub:** 256 authored / 256 schema-valid universe; 1 ingredient-level CoFID validated / 1 reviewed / 1 published / **1 production-served** commissioning-floor object. The 224 industrial additions remain quarantined pending nutrition validation/review. Launch-depth rows stay AMBER. Short-term commissioned target 2,500; long-term minimum 10,000+.

**Fit:** 256 authored / 256 schema-valid universe; 3 member-QA visual / 3 reviewed / 3 published / **3 production-served** commissioning-floor movements. The 224 industrial additions remain visual/review quarantined. Launch-depth rows stay AMBER. Short-term commissioned target 2,500; long-term minimum 10,000+.

## Gate 1 active lane
PR #82 (`G1-007: commission safe production error contracts`) adds a production member/HQ failure-contract sweep. The first run deliberately found a real defect: the intercepted password-reset path lacked `X-Shift-Request-Id` although fallback Worker responses carried correlation IDs. The test was not weakened. `worker-entry-v6.js` was repaired so intercepted member responses receive request correlation plus `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`. Latest branch commit: `f6bafa3b4e1bff9949bc902029615e2fa7784bc8`; rerun is the next truth boundary.

The same first #82 run already proved controlled contracts for unknown route, unauthenticated member, unauthenticated HQ, malformed registration JSON, invalid registration guidance and invalid login before exposing the password-reset header gap.

## Radar / M03
Locked PASS. The genuine production scanner invoked MHRA drug-safety, MHRA alerts and EMA sources successfully; production freshness immediately returned GREEN inside declared SLOs. Do not reopen without regression evidence.

## Locked
- B03 behavioural subrows: **9/9 PASS**. Do not reopen #55 without genuine regression evidence.
- G4-006/G4-007 Radar production scan/freshness: PASS.
- M07/G5-009 runtime authority: production proof earned; catalogue depth remains separate M11/M12 AMBER.
- External blockers remain exactly G5-001/G5-002/G5-003.

## CI health
`main` production commissioning on `d28d0fde...` is GREEN. PR #81 initially failed only because `finish-line-gate.mjs` had stale hard-coded 14/40 counts; the gate is being repaired to derive evidence-led counts while strengthening the exact three-BLOCKED-ID assertion. PR #82 exposed one genuine failure-contract defect and has a product fix pending rerun. No red branch is eligible to merge.

## Exact next recovery action
1. Complete PR #81 CI after the finish-line/launch-board reconciliation update; merge only if required gates are GREEN.
2. Rerun PR #82 unchanged after the request-correlation product fix; if it fails, repair the exact defect, not the acceptance criteria. Merge only GREEN.
3. Continue Gate 1 finite automated closure work (G1-010/M05) while human/device-only inbox/rendered rows remain explicitly AMBER.
4. Then continue Gate 2 conversion at throughput scale: batch Grub ingredient/nutrition validation + review/publication; batch Fit visual QA/review/publication; quarantine failures without queueing clean objects.
5. Continue independent B06/B07 Watchtower/HQ fire-drill, B08/Dave, premium/mobile, accessibility/performance and other non-blocked lanes while CI/content processing waits.

Operating rule: **SWARM -> INDUSTRIALISE -> VALIDATE -> SERVE -> BREAK -> FIX -> PROVE -> CLOSE -> CONTINUE.**
