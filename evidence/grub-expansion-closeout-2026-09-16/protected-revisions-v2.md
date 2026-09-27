# Twelve protected recipe successors — full corrections, version 2

These are complete insertion-only successor candidates for the twelve accepted recipes with compound-oil errors. They supersede the oil-only proposals for publication preparation. The original 798 records and the earlier proposals remain unchanged.

Candidate digest: `ed9781c42f996c37143901d0bcaf0dbca117749d298e197b65aee9e617dfc073`.

## Scope

All twelve now explain how to peel, weigh, boil and crisp the potato patties; use exactly 10ml oil split 6ml + 2ml + 2ml; cook the actual listed protein; serve the full measured portion, including any side filling; and use the appropriate equipment and storage instructions. Two bacon recipes now use raw trimmed CoFID 19-646. Cooked turkey is heated once during preparation and cannot be cooled and reheated again. All timings include the complete preparation and assembly estimate.

This is a broader revision than the earlier oil-only proposals: method, equipment, storage, safety, serving metadata and SHIFT SAYS also change. Ingredient quantities remain those of the oil-corrected proposal. The raw peeled potato state and 100g edible egg weight without shell are explicit. Non-turkey components are refrigerated within two hours at 0–5°C, with the conservative 24-hour use limit retained. No original recipe is overwritten.

## Exact successor data

`protected-revisions-v2.json` contains each original ID and original accepted content hash, a distinct successor ID, a complete `structured_item_draft`, authorship and an exact candidate hash. `grub-protected-revisions-v2.mjs` reconstructs and verifies the accepted original content before generating a successor.

| Original ID | New kcal/serving | New fat (g) |
| --- | ---: | ---: |
| `industrial-v3-breakfast-buttie-hash-brown-bacon` | 515.9 | 18.6 |
| `industrial-v3-breakfast-buttie-hash-brown-sausage` | 534.5 | 18.2 |
| `industrial-v3-breakfast-buttie-hash-brown-egg` | 524.5 | 21.6 |
| `industrial-v3-breakfast-buttie-hash-brown-chicken-sausage` | 501.5 | 14.7 |
| `industrial-v3-breakfast-buttie-hash-brown-turkey` | 548.5 | 14.3 |
| `industrial-v3-breakfast-buttie-hash-brown-beans` | 523.1 | 13.4 |
| `industrial-v3-breakfast-wrap-hash-brown-bacon` | 512.3 | 19.8 |
| `industrial-v3-breakfast-wrap-hash-brown-sausage` | 530.9 | 19.4 |
| `industrial-v3-breakfast-wrap-hash-brown-egg` | 520.9 | 22.8 |
| `industrial-v3-breakfast-wrap-hash-brown-chicken-sausage` | 497.9 | 15.9 |
| `industrial-v3-breakfast-wrap-hash-brown-turkey` | 544.9 | 15.5 |
| `industrial-v3-breakfast-wrap-hash-brown-beans` | 519.5 | 14.6 |

The lower bacon totals reflect the additional correction from a grilled-bacon nutrient record to the specified raw trimmed portion. They are not an omitted oil contribution.

## Release contract

The complete candidate remains marked draft/pending. Publication requires an exact independent review record and the real owner publication instruction; no human editorial review is asserted. The author is `/root/grub_closeout`.

The release must guard all twelve source hashes against the immutable original 798 authority and the actual database snapshot, reject successor-ID collisions, and insert successors without updating original rows. The serving manifest then replaces the twelve original IDs in the visible selection: 786 unchanged originals + 12 successors + 1,873 additive recipes = 2,671 visible recipes. Original IDs should resolve to their successors for saved picks and links.

## Reproduction

```sh
node grub-protected-revisions-v2.mjs
node --test tests/grub-protected-revisions.test.mjs
```

Four focused tests pass: source preservation/exact hashes, tampering and duplicate rejection, complete potato/portion instructions, and protein-state/single-reheat regressions. Numeric calculations use the same checked-in CoFID subset and exact decimal accumulator as the additive candidate. Independent review is recorded separately.
