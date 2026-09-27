# Fit owner-directed publication

The owner's explicit instruction, “Publish them all !!!!!!”, authorises this exact prepared batch. It does not claim a completed trainer, human editorial or clinical review. Those source statuses remain visible in the evidence and new row provenance.

## Exact batch

- 1,362 new protocols and 180 corrected versions, covering the expansion from 26 to 300 movements.
- 1,326 original accepted rows remain unchanged. Each correction gets a distinct `--owner-v2-20260916` publication ID and version 2.
- Physical published rows after insertion: 2,868. Active served protocols after supersession: 2,688. The selector projects the 180 replacements back to their original member-facing IDs, retaining `publication_id`, so saved references remain usable.
- The 300 approved canonical PNGs remain unchanged.
- The nine dose clarifications passed independent AI review against the original workbook. Every original set, repetition, duration and rest number is retained; kickback totals explicitly span both arms. Leg-press equipment/regression wording is corrected.

Rebuild with `node scripts/build-fit-owner-publication.mjs`. The wire artifact is `evidence/fit-publication-2026-09-16/owner-release.json.gz`. Its 1,542-row canonical SHA-256 is `264507e9d209f679afa621fc207e8691da5b28a61b03acbc1c76afa882ca1168`. Exact content, review and source hashes are included. The preparation timestamp comes from the owner instruction; it is not a claimed production publication time.

## Serving and publication boundaries

The checked-in pending serving manifest continues to expose only the 1,326 accepted originals. Publication and manifest activation are separate deployment steps owned by the guarded catalogue workflow. This preparation module makes no production writes.

Before legacy plan or feedback writes, the Fit route pages through the entire exercise catalogue and validates its authority. Missing or changed originals, missing additions, changed content/reviews, duplicated IDs and invalid supersessions fail closed. Original content hashes use the fixed `fitOriginalContent(data,title)` projection under `fit_v1_content_v1`; the publication workflow separately snapshots all nine original database columns and protects their exact bytes transactionally.

New owner-published protocols retain exact prescription text and units. Timed work is not presented as repetition counts, and the effort controls do not scale these prescriptions. Their complete work/rest duration must fit the available session allowance; repetition durations are explicitly estimated at four seconds per repetition. No prescription is shortened to fit.

Published availability is distinct from automatic suitability. New protocols require all listed equipment, use beginner as the default level and retain conservative restriction checks. Ordinary goals such as “build strength” do not block selection. Floor restrictions exclude floor-transfer movements. Specialist equipment maps to the equipped-gym option using the existing preview requirement resolver. Ballistic and more advanced protocols are not automatically selected for an unprofiled beginner. Existing accepted selection behavior remains intact.

## Local verification

The scoped suite passed 30 tests: real original-publisher compatibility for all 1,326 hashes; exact export reproducibility; all 2,868 physical / 2,688 served rows and 300 movements; pagination beyond 2,500; byte and saved-ID preservation; missing/tampered authority; preflight before legacy writes; exact unit/volume preservation and time limits; renderer behavior; original closeout evidence; and unchanged Grub preflight behavior. The renderer tests execute the generated browser runtime. This report does not claim a production deployment or rendered browser QA.

Command:

```sh
node --test tests/fit-expansion-publication.test.mjs tests/fit-expansion-route-preflight.test.mjs tests/fit-v3-closeout.test.mjs tests/grub-expansion-route-preflight.test.mjs member-experience/tests/fit-fixed-dose-runtime.test.mjs
```
