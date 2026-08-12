# Active recovery checkpoint — 2026-08-12

Authoritative execution state if interrupted. GitHub `main` is authoritative for landed code; `docs/LAUNCH-FINISH-LINE.md` is the launch board; `docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md` preserves all 57 original requirements; `docs/COMMISSIONING-EVIDENCE.md` records demonstrated evidence.

## Current head
`main` = `8b3921661ff93361b829f6c4e40304c22858f70e` / PR #61 merged. Active PR #62 `finish/radar-watchtower-fire-drill` is OPEN/RED. M03 production Radar failure is reproduced by the unchanged hard production freshness proof: production returned `AMBER`, `current:false`, no scan/event/publication/ticker timestamps and zero ticker items. Do not weaken the proof.

PR #55 is closed and behind us. B03 behavioural products remain **9/9 PASS** and locked unless genuine regression evidence appears.

## Locked PASS
B02 authenticated isolation + durable state; B03 behaviour 9/9; B04 longitudinal One Shift Brain; M02 reviewed Knowledge lifecycle; M14/G4-002 member memory controls; M15/G5-004 mocked partner-ready Health MOT; M16/G5-006 governed outcomes architecture.

## Original audit
**57 total / 12 PASS / 42 AMBER / 3 BLOCKED / 0 unmapped.**

## Radar defect state
Production M03 proof exposed real product gaps, not a test problem:
1. The six-hour Worker cron calls `runRadarFreshness`, but that function only marks existing claims due; it does not perform an authoritative external source scan or record a scan audit/provenance event.
2. `readRadarFreshness` requires a recent `scan`/`ingested` audit record, so production correctly fails safe AMBER when no scan lifecycle exists.
3. Radar publication writes job status `complete` while the freshness reader queries `completed`; publication freshness can therefore remain invisible after a successful publish.
4. Production currently has no Radar event/publication/ticker data. Do not seed fake data merely to make the proof green.

## Content conversion checkpoint
Grub: 32 structured authored / 32 schema-valid / 0 nutrition-validated / 0 reviewed / 0 published / 0 structured production-served / 0 launch-ready. Draft+legacy 30-day exact repeats 72/120 = 60%; 60-day 192/240 = 80%. Earliest repeats: snack day 11, breakfast/lunch day 13, dinner day 15. Catalogue-count alone is disproven.

Fit: 32 structured authored / 32 schema-valid / 0 approved member visuals / 0 reviewed / 0 published / 0 structured production-served / 0 launch-ready. Draft+legacy prospective pool 44 exercises / 13 movement groups / worst exercise 5 appearances across 180 slots vs 15 live. Visual/member-QA, progression, limitation compliance and structured runtime serving remain.

## External blocked
G5-001 signed clinical operating model/provider/pharmacy governance; G5-002 clinically governed Medication Companion prescribing/escalation; G5-003 provider-approved identity/weight/evidence verification.

## Active swarm
#62 M03 Radar real scan lifecycle + publication-state repair; M07/M11/M12 content conversion/runtime cutover; B05; B06/B07; B08/Dave; M01; M04-M13; M17; B01 non-secret work.

## Exact next action
Implement a genuine authoritative MHRA/EMA source scanner with scan audit/provenance and deduplicated ingestion, repair `complete`/`completed`, make scan -> intelligence -> review/publication -> ticker -> freshness -> Watchtower coherent, preserve stale fail-safe behaviour, then rerun the unchanged production proof. While CI/deployment waits, move Grub/Fit from draft inventory into validated/reviewed/published structured runtime serving and attack independent AMBER acceptance criteria.

Operating rule: **CONVERT -> BREAK -> FIX -> PROVE -> CLOSE -> CONTINUE.**
