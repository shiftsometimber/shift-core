# Fit expansion reconciliation — 16 September 2026

The existing **26-movement / 1,326-protocol accepted cohort is preserved**. All 300 approved PNGs pass their recorded SHA-256 checks. Neither the workbook nor its image manifest has been edited. The closeout creates a separate corrected candidate, exact review matrix and additive offline draft payload. It does not publish anything or claim that a source audit is a fresh live database audit.

The former “274 more movements / 1,362 more protocols” statement hid a material detail:

| Workbook records | Count | Disposition |
| --- | ---: | --- |
| Existing protocol identity, title, dose, instructions and difficulty match current accepted generator | 1,146 | Existing acceptance remains valid. Blanket workbook pending flags do not revoke it. No replacement needed. |
| Existing protocol IDs with changed title/instructions | 180 | Excluded from the additive payload. 162 also change dose. Review separately; never upsert them over accepted records. |
| Genuinely new protocol IDs across 274 new movements | 1,362 | Converted into separately fingerprinted, non-serving drafts. |
| Total workbook protocols | 2,688 | No count inflation or implied publication. |

The 180 changed legacy IDs also retain old titles in the image mapping. Image identity still matches by canonical ID; the old title cannot certify the changed protocol. The generator records this discrepancy instead of silently treating a matching ID as an unchanged exercise.

## Concrete candidate repairs

An editorial and structural pass covers all **1,542 changed/new records**, including all 81 new-protocol dose text patterns. All 1,542 doses now have explicit machine-readable unit parsing. This checks syntax, work/rest arithmetic and obvious contradictory metadata; it is not a professional technique or individual suitability assessment.

Corrections affect **seven guide objects and nine protocol records across 11 movements**:

- The 45-degree leg press was misclassified as turf-sled conditioning. Its candidate now identifies timed strength sets, uses machine clearance/setup text, removes the irrelevant shoulder-specific instruction and explains that the timed interval contains controlled press-and-return repetitions. The original numeric draft remains visible for the trainer to accept or replace.
- Three alternating-rope protocols incorrectly multiplied the same two-arm alternating bout “per side”. Candidate wording now defines one bout with both arms alternating together. Work and rest numbers are unchanged.
- Six triceps isolation guides contained a stray reference to chest/deltoids assisting dips. That unrelated phrase is removed; the actual dip guide is unchanged.
- Three single-repetition kettlebell drafts now use singular “rep”; no dosage number changes.

The corrections exist in `candidate-review.json` and `draft-additions.json`, with original text, corrected text, reasons and exact candidate hashes. Source workbook bytes remain intact so there is no disguised rewrite of the approval record.

## Specific unresolved decisions

| Decision | Exact scope | Why it cannot be inferred |
| --- | --- | --- |
| Single-arm kickback dose scope | `SST-FIT-0171-V01` through `V06` | Setup uses one working arm, but doses do not specify per arm versus total. The correction must not blindly double the prescription. |
| Leg-press programming | `SST-FIT-0224-V01` through `V03` | A qualified programme reviewer must choose whether to keep the existing timed strength prescription or supply a repetition prescription for the intended audience. The machine metadata error is already repaired. |
| Redundant proposed legacy replacements | 180 changed rows reduce to 16 distinct name/dose/instruction combinations within their movements; 164 rows duplicate another proposed combination | Replacing the accepted rows would erase variety while still claiming the old count. Existing source remains active; the review pack explicitly links redundant rows to their equivalent. |
| Professional technique/suitability review | New 274 movements and changed legacy protocols, grouped by exact movement and dose | The retained workbook explicitly says “Draft — trainer review pending”; the supplied v3 handoff states that visual correction is not technique or member-release certification. No named trainer decision is present. The code records the completed Codex checks separately and does not attribute a human review. |

The changed legacy groups are **lat-pulldown 6; loaded-carry 51; low-impact-march 12; plank 51; rowing-erg 18; shadow-boxing 12; stationary-bike 18; walk 12**. Corrections to these records are meaningful: hold/carry units, cardio-appropriate wording and specialist-equipment requirements. They are not merely stale status labels.

The earlier documentation calls for professional coaching-visual review before production use. This is an existing recorded content requirement, not a new legal claim that every general exercise needs a clinician. A trainer's assessment of this candidate cannot be manufactured by changing `Pending` to `PASS`. The existing accepted cohort needs no repeat sign-off.

## Sources checked and limits

The [NHS strength guide](https://www.nhs.uk/live-well/exercise/strength-exercises/) supports stable chair setup, controlled movement, gradual progression and several basic home movements. The [NHS adult activity guide](https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/) supports varied activity and progressive activity targets. Neither source validates this entire authored prescription catalogue.

[ACE's single-arm kickback guide](https://www.acefitness.org/resources/everyone/exercise-library/55/triceps-kickback/) confirms the elbow-extension movement with a stable upper arm; it does not settle whether this workbook intended its listed repetition number per arm or in total. The [Mayo Clinic kickback explanation](https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/triceps-kickback/vid-20084667) supports the triceps target. Rope side-count repair is an explicit consistency correction to the supplied two-arm alternating setup; no external dosing endorsement is claimed. The leg-press lane error is established directly by the supplied machine/equipment/setup fields; the timed-set choice remains openly pending.

## Reproduce and validate

```sh
node --test tests/fit-v3-closeout.test.mjs
node scripts/fit-v3-closeout.mjs
```

**12 focused checks pass**: exact 1,146/180/1,362 partition, unchanged existing object bytes/order, rejected overwrite, duplicate/missing/reparented identity rejection, stale-label rejection, all dose parsing, rope/leg-press corrections, specific unresolved decisions, singular-repetition boundaries and candidate content hash binding. The runner verifies all 300 image hashes before reconciliation.

Output is in `evidence/fit-v3-closeout-2026-09-16/`: a concise summary, 300-movement matrix, original per-protocol comparison, corrected review candidate, additive draft payload and checksums. Full generated JSON is reproducible; `summary.json`, the matrix and code are sufficient source-control checkpoints if CI retains the full pack as an artifact.

No runtime route imports this converter. It deliberately emits no SQL and no published/approved review records. A final reviewed structured-content bridge must use verified reviewer decisions and actual serving constraint mappings, then pass isolated member serving tests before promotion. Merely merging this preparation code does not expand live Fit.
