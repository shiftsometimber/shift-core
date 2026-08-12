# Active recovery checkpoint — 2026-08-12

## Current head
`main` = `f1a78a01d3878d2b9079218008ba7ca47d61a187`.

PR #62 is merged; its merge commit is `21b76f259169e74caf7edbff0b1f42ba7643d4f0`. The first unchanged post-merge production commissioning run and one unchanged rerun both kept M03 AMBER because production still had no recorded scheduled Radar scan (`scan:null`, no event/publication/ticker age, zero ticker items). Do not promote M03 until a real scheduled scan has executed and the unchanged production freshness proof returns GREEN/current with provenance.

A content-conversion slice then landed on main and must be treated as **verification pending**, not accepted closure, until the full Master Integration gate runs against it. `finish/content-conversion-verify` exists solely to force that full gate and checkpoint evidence; do not infer PASS from the direct commits.

## Locked
B03 behaviour **9/9 PASS**; #55 behind us. Original audit remains **57 / 12 PASS / 42 AMBER / 3 BLOCKED / 0 unmapped**.

## M03 Radar
- Genuine scheduled authoritative retrieval is present for MHRA Drug Safety Update, MHRA alerts/recalls and EMA official feed sources.
- Tier-1 source provenance, deduplicated ingestion, per-source scan history and scan audit are implemented.
- Fake heartbeat semantics are removed.
- Publication `complete`/`completed` compatibility and publication staleness are repaired.
- Fail-safe AMBER/RED remains.
- Deployment is visible through production health, but no scheduled scan had run by the latest unchanged proof; M03 therefore remains AMBER.

## Content conversion verification
Current code now contains three deliberately non-promotional steps:

1. **Grub nutrition evidence:** one recipe (`lighter-beef-cottage-pie`) has a CoFID 2021 ingredient-level weighted calculation manifest with explicit per-ingredient food codes, quantities, conversion assumptions and precision caveat. `grub-nutrition-gate.mjs` recomputes the declared per-serving values and fails if an ingredient/amount mapping becomes stale. This is pending full Master Integration verification; the remaining 31 recipes are still unvalidated.
2. **Publication barrier:** `structured-content-v1.js` now rejects `published` recipes without approved review + validated nutrition, and rejects `published` exercises without approved review + approved member visual. `structured-content-publication-gate.mjs` proves those barriers at source level. This does not itself make any content published or production-served.
3. **Fit visual reconciliation:** the two Shift-owned SVG sheets from superseded #55 have been restored so the prior “8 authored visual concepts” evidence is no longer pointing at files absent from main. The manifest records 8 authored concepts, only 3 exact bindings to current structured exercises, and **0 member-QA approved**. Authored is not commissioned.

## Content funnel
Grub: 32 authored / 32 schema-valid / **1 nutrition-validation candidate pending full CI** / 0 reviewed / 0 published / 0 structured production-served / 0 launch-ready. Existing 30/60-day candidate-capacity repetition remains 60% / 80%.

Fit: 32 authored / 32 schema-valid / 8 authored visual concepts restored / 3 exact structured-exercise bindings / **0 member-QA approved** / 0 reviewed / 0 published / 0 structured production-served / 0 launch-ready. Existing 12-week prospective capacity result remains 44 total legacy+candidate exercises / 13 movement groups / worst individual exercise 5 appearances across 180 slots.

The hard-coded V4 arrays remain the production authority. M07/M11/M12 stay AMBER.

## Dave
No percentage promotion. The progressive wrapper still requires explicit reconciliation with separately proven authenticated production legs.

## Defects / integrity notes
- M03 production no-scan state remains unresolved pending a real scheduled invocation.
- A real content-governance defect was fixed in code: `upsertStructuredContent` previously allowed callers to write `status:'published'` without enforcing the review/nutrition/visual barriers claimed by the commissioning model.
- A reconciliation defect was found: the prior report counted 8 authored Fit visual concepts, but those SVG files lived only on superseded #55 and were absent from main. They are restored, with honest 8 authored / 3 exact-bound / 0 approved accounting.
- The content-conversion commits reached main before the intended PR because the GitHub contents write used the default branch. Therefore the full Master Integration verification PR is mandatory before treating this slice as clean. Do not hide this procedural defect.

## Exact next recovery action
1. Open/run the verification PR from `finish/content-conversion-verify`; repair any exact failure without weakening nutrition, publication or visual accounting criteria.
2. After the next real Worker scheduled invocation, rerun unchanged M03 production commissioning. Promote M03 only if real scan provenance makes Radar GREEN/current.
3. Continue M11 nutrition validation across a coherent recipe batch; keep explicit unmapped/low-confidence ingredients blocked rather than guessing.
4. Continue M12 exact exercise-to-visual binding and member-facing visual QA; do not count authored SVGs as approved.
5. Build the M07 structured runtime cutover only after publication barriers are green; prove a reviewed/published structured item is actually selected, persisted and served through the authenticated member path before retiring the V4 arrays.
6. In parallel continue B06/B07 degradation→detection→HQ action→recovery and Dave coverage reconciliation.
