# Active recovery checkpoint — 2026-08-12

## Current head
`main` = `8b3921661ff93361b829f6c4e40304c22858f70e` / PR #61 merged. Active PR #62 `finish/radar-watchtower-fire-drill`, head `7da063fe421e72be73e07a1888916df1925eabb7`, is open with fresh CI running. Original M03 production failure remains reproduced: AMBER/current:false, no scan/event/publication/ticker timestamps, zero ticker items.

## Locked
B03 behaviour **9/9 PASS**; #55 behind us. Original audit **57 / 12 PASS / 42 AMBER / 3 BLOCKED / 0 unmapped**.

## #62 repair now implemented
- Genuine scheduled authoritative retrieval added for MHRA Drug Safety Update, MHRA alerts/recalls and EMA official news feed.
- Feed items are deduplicated into `radar_events` with tier-1 regulator provenance and per-item ingestion audit.
- Per-source `radar_scan_runs` persist authority/source URL/status/item count/new-event count/duration/error.
- A scan-level `radar_audit` event records the authoritative source results.
- Scheduler now performs authoritative retrieval/ingestion before freshness maintenance; old fake no-change heartbeat behaviour is removed.
- Publication freshness accepts the existing `complete` state as well as `completed`, and publication staleness is now evaluated.
- Stale/no-scan remains fail-safe AMBER; publication failures remain RED.
- Staging proof was rewritten to require real feed retrieval -> three authoritative source ingestions -> scan provenance -> AMBER-to-GREEN freshness transition. CI is running on that unchanged criterion.
- Hard production proof remains post-deployment; M03 is NOT promoted until deployed production genuinely earns GREEN/current.

Authoritative source selection is grounded in the regulators' own publication mechanisms: GOV.UK Drug Safety Update exposes a subscription feed; EMA documents RSS feeds for news/new medicines and explicitly directs automated systems toward machine-readable data.

## Content funnel unchanged this checkpoint
Grub 32 authored / 32 schema-valid / 0 nutrition-validated / 0 reviewed / 0 published / 0 structured production-served / 0 launch-ready. 30-day exact repeats 60%; 60-day 80% with draft+legacy capacity.

Fit 32 authored / 32 schema-valid / 0 approved member visuals / 0 reviewed / 0 published / 0 structured production-served / 0 launch-ready. Prospective 44 / 13 movement groups / worst exercise 5 appearances across 180 slots.

## Dave
No percentage promotion this checkpoint: existing progressive wrapper still undercounts separately proven authenticated production legs and requires explicit reconciliation before changing the figure.

## Defects
This execution sequence has active Radar defects: missing genuine scan lifecycle (fixed in #62 code), fake heartbeat semantics (removed), publication `complete`/`completed` mismatch (fixed compatibly), missing publication-stale evaluation (fixed). Production deployment/proof remains unresolved until #62 CI/merge/deploy and a real scheduled scan complete.

## Exact next recovery action
1. Let #62 CI complete. Fix any exact regression without weakening authoritative retrieval/provenance proof.
2. Merge #62 only green, deploy, allow/trigger the real scheduled scan through the normal Worker cron path, then rerun unchanged `radar-production-freshness.mjs`. Close M03 only on genuine production evidence.
3. Next independent code lane: M07/M11/M12 structured content publication/runtime cutover, with first Grub nutrition-validation methodology and Fit member-visual QA batch; do not finish another window at 0 published/served if technically closable.
4. Then B06/B07 controlled degradation/recovery + Dave coverage reconciliation.
