# Content factory status — 2026-08-12

## Grub
Live legacy production catalogue remains 16 recipes. Structured batch 001 adds 8 authored recipes in review/draft state. They are not counted as commissioned or nutrition-validated until the deterministic/review/nutrition gates permit publication.

Current authored estate: 24 recipe objects (16 live legacy + 8 structured authored). Fully commissioned: 0. Independently validated nutrition: 0. Provisional floor: 64 fully commissioned. Current fully commissioned deficit: 48. Authored-count gap to floor: 40.

Batch 001 distribution: 2 breakfast / 2 lunch / 3 dinner / 1 snack. The next batches must deliberately weight dinner/snack plus missing cuisines/dietary patterns to converge on the initial 12/16/24/12 minimum distribution.

`content-factory-simulator.mjs` runs 7/14/30/60-day deterministic catalogue repetition checks against the current live catalogue and the authored estate. Its job is to fail assumptions early, not wait for 64.

## Fit
Live legacy production catalogue remains 12 exercises. Structured batch 001 adds 8 authored exercises covering squat, push, pull, core-control, hinge, single-leg, cardio and mobility.

Current authored estate: 20 exercise objects (12 live legacy + 8 structured authored). Fully commissioned: 0. Approved visual guidance authored in batch: 4. Provisional floor: 48 fully commissioned/illustrated. Current fully commissioned deficit: 36. Authored-count gap to floor: 28. Visual deficit to floor: 44 after the first four approved batch assets, subject to visual QA.

The first Shift Fit SVG guidance sheet covers box squat, wall push-up, resistance-band row and dead bug. Remaining batch exercises stay explicitly `planned` rather than being counted as illustrated.

`content-factory-simulator.mjs` runs a 12-week / 3-session-per-week repetition stress test and reports unique exercise count, movement-pattern breadth and maximum repeat frequency.

## Publication rule
No structured recipe can publish while nutrition status is `estimated_pending_validation`. No exercise can publish without approved visual guidance. Deterministic validation, human review and simulator acceptance remain separate gates.
