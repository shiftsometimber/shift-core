# Fit and Grub catalogue imagery rollout — preview only

The user's current approval extends the new visual treatment across the catalogue. The explicit restriction on changes to the main website remains in force. This branch and its existing isolated Worker are the only deployment targets.

## Exact scope

- 798 accepted recipes: 212 breakfast, 204 lunch, 195 dinner, 187 snack.
- 26 accepted base movements, with all 1,326 original exercise variants available for inspection.
- The broader authored catalogue (2,876 recipes / 2,468 exercises) contains drafts and held content and is excluded.
- The three earlier recipe samples are drafts and do not count towards the accepted 798. Their images must not be reused by title or family.

At this checkpoint, four accepted recipes have individually generated, visually inspected preview photographs. Two existing base movement image sequences are available as draft examples. 794 recipe images and 24 base movement examples are not yet produced. No variant image match or professional technique approval is claimed. No production image approval is recorded.

## Source and repeatability

Recipe snapshots were locally regenerated from the retained accepted Grub decisions using the existing publication-pack generator and official CoFID 2021 data. No publication SQL was applied. The import below reads an existing local payload only:

```
node preview/fit-grub/export-catalogue.mjs /path/to/grub-v1-publishable.json
node --test preview/fit-grub/catalogue.test.mjs
node preview/fit-grub/build.mjs
```

`catalogue/provenance.json` records the payload and decision hashes. This is an accepted source snapshot, not a new live database audit. Movement instructions and every protocol/dosage are read from the existing V14 source and canonical guidance at build time.

## Image matching

`catalogue-images.json` binds each asset to one exact ID and SHA-256 of its source instructions. Builds reject stale sources, changed images, unknown IDs and duplicate assignments. Missing images remain explicitly pending; there is no stock-photo or title/family fallback. Canonical exercise examples never automatically attach to their 51 protocol variants.

`/catalogue` offers search, meal/image filters, pagination, full recipes and movement variant inspection. `/catalogue-summary.json` reports actual coverage. `/catalogue-jobs.json` contains a source-bound generation brief for every recipe and base movement, with all exercise variations retained. This queue is a prepared artifact; it is not a running background generation service.

New images use the built-in image generation tool; exact prompts are retained in `catalogue-prompts.json`. Original PNGs were converted to WebP without compositional editing. A visual inspection checks visible ingredients and preparation, not precise quantities, nutrition or professional exercise technique.

## Isolation and performance

New images are separate lazy-loaded static files rather than repeating every asset in the programme HTML. The static asset binding points only to this preview's generated `public` directory. The preview has no database, payment, member account or production service binding. GET/HEAD only, noindex and blocked external browser connections remain enforced. The unchanged sample member flows are linked separately.

Production requires explicit user authorisation plus a reviewed integration into the existing member components. Do not promote the preview mock API or its simulated account state.
