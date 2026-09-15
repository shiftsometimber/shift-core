# FIT image hold corrections — 14 September 2026

All 45 image holds have replacement triptychs that passed Codex's visual checks, delegated by Matt's request: “Can you resolve the 45 holds yourself ??” There are now 300 available images and no remaining image holds, covering the same 2,688 variant mappings. This is AI visual QA, not professional technique certification. Source programming, technique and member-release statuses remain pending.

## Review method and evidence

Each image was generated with the built-in image_gen tool and inspected against its recorded hold: exercise identity, visible movement between frames, relevant equipment and contact points, readable anatomy, complete framing and consistency with the established cast and kit. Visible failures were retried. The selected images are the original generated PNG bytes at 1672 × 941; no image compositing or scripted image editing was used. The shoulder-circle image deliberately uses a closer view so the shoulder positions are readable.

- [review.json](review.json): 45 individual pass observations, original hold reasons, original rejected hashes, selected hashes and retained previous-attempt observations.
- [baseline.json](baseline.json): exact original approval records from c812b11ccd0b1e6603f4de6967b960a0aea1e1a0, plus the workbook-export hash.
- [MANIFEST.csv](MANIFEST.csv): corrected image mapping for all 212 affected source protocol rows. The parent archive manifest remains a historical source record.
- [prompts.json](prompts.json) and [retry-prompts.json](retry-prompts.json): retained generation prompts and style reference. The initial wall-push-up prompt was not retained verbatim; its original defect and accepted result are recorded in the review.
- [local-tests.tap](local-tests.tap): raw result, 40 tests passed, including 125 sample profile combinations. Tests verify original assets and source guidance remain unchanged, all 45 replacements match their reviews, stale bytes fail the build, and unknown images and server writes remain blocked.

The original 255 images keep Matt's approval. The 45 corrections carry “delegated AI visual correction review”; they are not presented as individually reviewed by Matt. Discarded candidates are excluded from the repository and serving path. Selected assets are in ../images and are copied into the build only through approval.json.

## Reproduction and deployment checks

```sh
node preview/fit-grub/build.mjs
node --test preview/fit-grub/session-builder.test.mjs preview/fit-grub/session-visuals.test.mjs preview/fit-grub/v3.test.mjs tests/member-refinements-preview.test.mjs preview/fit-grub/catalogue.test.mjs tests/grub-programme-v1.test.mjs tests/afternoon-ticket-c-fit.test.mjs tests/medicine-stripe-retry-v1.test.mjs
node preview/fit-grub/verify-corrections.mjs https://shift-fit-grub-refinement-preview.matobrien.workers.dev
```

The isolated preview workflow repeats the tests and checks all 45 deployed PNG hashes. Its artifact includes fit-correction-proof.json. The gallery's /fit-v3-phone route provides a 390px frame for checking enlarged panels at phone width. Production configuration, routes, member accounts and the workbook export are unchanged.

## Supporting movement references

Primary references used for difficult distinctions included [NHS seated exercises](https://www.nhs.uk/live-well/exercise/sitting-exercises/), [North Tees chair exercises](https://www.nth.nhs.uk/resources/chair-exercises/), [ACE wood chop](https://www.acefitness.org/resources/everyone/exercise-library/108/standing-wood-chop/), [ACE seated leg press](https://www.acefitness.org/resources/everyone/exercise-library/154/seated-leg-press/) and [ACE swing](https://www.acefitness.org/resources/everyone/exercise-library/391/swing/). These inform visual distinctions; they do not establish professional approval of generated imagery or the source protocols.

Deployment retry after restoring the verified seated 90-90 image bytes.
